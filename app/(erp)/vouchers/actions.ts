"use server";

import { db, vouchers, voucherEntries, auditLog, inventoryItems, stockMovements, ledgers, and, eq, sql } from "@/lib/database";
import { updateLedgerBalancesForVoucher } from "@/lib/accounting/balance-engine";
import { revalidatePath } from "next/cache";
import { randomUUID } from "crypto";
import type { VoucherType } from "@/lib/types";

export interface VoucherEntryLine {
  ledgerId: string;
  type: "dr" | "cr";
  amount: number;
  narration?: string;
  inventoryItemId?: string;
  quantity?: number;
  rate?: number;
}

export interface CreateVoucherInput {
  type: VoucherType;
  date: number; // Unix ms timestamp
  narration?: string;
  reference?: string;
  entries: VoucherEntryLine[];
  // Challan specific fields
  transportName?: string;
  lrNumber?: string;
  dispatchDate?: number; // Unix ms timestamp
  freightAmount?: number;
}

function ensureBalanced(entries: VoucherEntryLine[]): void {
  const totalDr = entries.filter((e) => e.type === "dr").reduce((s, e) => s + e.amount, 0);
  const totalCr = entries.filter((e) => e.type === "cr").reduce((s, e) => s + e.amount, 0);
  // Allow tiny floating point error
  if (Math.abs(totalDr - totalCr) > 0.01) {
    throw new Error(
      `Voucher is not balanced. Debit: ${totalDr.toFixed(2)}, Credit: ${totalCr.toFixed(2)}`
    );
  }
}

function validateEntries(entries: VoucherEntryLine[]): void {
  if (entries.length < 2) {
    throw new Error("A voucher requires at least 2 ledger entries (debit + credit).");
  }
  for (const entry of entries) {
    if (entry.amount <= 0) {
      throw new Error("All amounts must be positive.");
    }
    if (!entry.ledgerId) {
      throw new Error("All entries must have a valid ledger.");
    }
  }
}

function generateVoucherNumber(type: VoucherType, id: string): string {
  const prefixes: Record<VoucherType, string> = {
    sales: "SAL",
    purchase: "PUR",
    payment: "PAY",
    receipt: "REC",
    contra: "CON",
    journal: "JNL",
    challan: "CHL",
  };
  const short = id.slice(0, 6).toUpperCase();
  return `${prefixes[type]}-${short}`;
}

export async function createVoucher(input: CreateVoucherInput): Promise<{ success: true; voucherId: string } | { success: false; error: string }> {
  try {
    // ── Validation ───────────────────────────────────────────────────────────
    validateEntries(input.entries);
    ensureBalanced(input.entries);

    const voucherId = randomUUID();
    let totalAmount = input.entries
      .filter((e) => e.type === "dr")
      .reduce((s, e) => s + e.amount, 0);

    // For challan, add freight amount to total if present
    if (input.type === "challan" && input.freightAmount) {
      totalAmount += input.freightAmount;
    }

    const idempotencyKey = randomUUID();

    // ── Atomic Transaction ───────────────────────────────────────────────────
    await db.transaction(async (tx) => {
      // 1. Insert voucher
      await tx.insert(vouchers).values({
        id: voucherId,
        companyId: "company_1",
        type: input.type,
        number: generateVoucherNumber(input.type, voucherId),
        date: input.date,
        partyLedgerId: input.entries.find(e => e.type === "cr")?.ledgerId ?? null,
        reference: input.reference ?? null,
        narration: input.narration ?? null,
        totalAmount,
        gstTotal: 0,
        grandTotal: totalAmount,
        status: "posted",
        transportName: input.transportName ?? null,
        lrNumber: input.lrNumber ?? null,
        dispatchDate: input.dispatchDate ?? null,
        freightAmount: input.freightAmount ?? 0,
        idempotencyKey,
      });

      // 2. Insert double-entry lines
      for (const entry of input.entries) {
        await tx.insert(voucherEntries).values({
          id: randomUUID(),
          voucherId,
          ledgerId: entry.ledgerId,
          type: entry.type,
          amount: entry.amount,
          inventoryItemId: entry.inventoryItemId ?? null,
          quantity: entry.quantity ?? null,
          rate: entry.rate ?? null,
          narration: entry.narration ?? null,
        });
      }

      // 3. Handle freight accounting for challan
      if (input.type === "challan" && input.freightAmount && input.freightAmount > 0) {
        const expenseLedger = await tx.query.ledgers.findFirst({
          where: and(eq(ledgers.companyId as any, "company_1"), eq(ledgers.group as any, "expenses"))
        });

        if (expenseLedger) {
          const partyEntries = input.entries.filter(e => e.type === "cr");
          const firstPartyEntry = partyEntries[0];
          
          if (firstPartyEntry) {
            // Add freight expense entry
            await tx.insert(voucherEntries).values({
              id: randomUUID(),
              voucherId,
              ledgerId: expenseLedger.id,
              type: "dr",
              amount: input.freightAmount,
              narration: `Freight charges for challan ${voucherId}`,
            });

            // Update party credit entry to include freight
            await tx.update(voucherEntries)
              .set({
                amount: sql`${voucherEntries.amount} + ${input.freightAmount}`,
              })
              .where(and(
                eq(voucherEntries.voucherId as any, voucherId),
                eq(voucherEntries.ledgerId as any, firstPartyEntry.ledgerId),
                eq(voucherEntries.type as any, "cr")
              ));
          }
        }
      }

      // 4. Handle stock movements
      if (input.type === "purchase" || input.type === "sales") {
        for (const entry of input.entries) {
          if (entry.inventoryItemId && entry.quantity && entry.rate) {
            const movementType: "in" | "out" = input.type === "purchase" ? "in" : "out";

            await tx.insert(stockMovements).values({
              id: randomUUID(),
              itemId: entry.inventoryItemId,
              voucherId,
              type: movementType,
              quantity: entry.quantity,
              rate: entry.rate,
              date: input.date,
              narration: entry.narration ?? `${input.type === "purchase" ? "Purchase" : "Sale"} of inventory item`,
            });

            await tx.update(inventoryItems)
              .set({
                stockQuantity: movementType === "in" 
                  ? sql`${inventoryItems.stockQuantity} + ${entry.quantity}`
                  : sql`${inventoryItems.stockQuantity} - ${entry.quantity}`,
                updatedAt: Date.now()
              })
              .where(and(eq(inventoryItems.id as any, entry.inventoryItemId), eq(inventoryItems.companyId as any, "company_1")));
          }
        }
      }

      // 5. Update materialized balances
      const ledgerEffects = input.entries.map(entry => ({
        ledgerId: entry.ledgerId,
        debit: entry.type === "dr" ? entry.amount : 0,
        credit: entry.type === "cr" ? entry.amount : 0,
      }));

      if (input.type === "challan" && input.freightAmount && input.freightAmount > 0) {
        const expenseLedger = await tx.query.ledgers.findFirst({
          where: and(eq(ledgers.companyId as any, "company_1"), eq(ledgers.group as any, "expenses"))
        });

        if (expenseLedger) {
          ledgerEffects.push({
            ledgerId: expenseLedger.id,
            debit: input.freightAmount,
            credit: 0,
          });

          const partyEntries = input.entries.filter(e => e.type === "cr");
          if (partyEntries[0]) {
            ledgerEffects.push({
              ledgerId: partyEntries[0].ledgerId,
              debit: 0,
              credit: input.freightAmount,
            });
          }
        }
      }

      await updateLedgerBalancesForVoucher(tx, input.date, ledgerEffects);

      // 6. Audit Log
      await tx.insert(auditLog).values({
        id: randomUUID(),
        entity: "voucher",
        entityId: voucherId,
        action: "create",
        after: JSON.stringify({
          type: input.type,
          totalAmount,
          entries: input.entries.length,
          freightAmount: input.freightAmount
        }),
        deviceId: "web",
      });
    });

    revalidatePath("/vouchers");
    revalidatePath("/dashboard");
    revalidatePath("/inventory");

    return { success: true, voucherId };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error creating voucher.";
    return { success: false, error: message };
  }
}
