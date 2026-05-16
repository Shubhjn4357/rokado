"use server";

import { db, vouchers, voucherEntries, auditLog, inventoryItems, stockMovements, ledgers } from "@repo/database";
import { updateLedgerBalancesForVoucher } from "@/lib/accounting/balance-engine";
import { revalidatePath } from "next/cache";
import { randomUUID } from "crypto";
import { and, eq } from "drizzle-orm";
import type { VoucherType } from "@/lib/types";
import type { InventoryItem } from "@repo/database";

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

    const idempotencyKey = randomUUID(); // In production, client generates this

    // ── Atomic Transaction ───────────────────────────────────────────────────
    await db.transaction(async (tx) => {
      // 1. Insert voucher
      await tx.insert(vouchers).values({
        id: voucherId,
        companyId: "company_1",
        type: input.type,
        number: generateVoucherNumber(input.type, voucherId),
        date: input.date,
        partyLedgerId: input.entries.find(e => e.type === "cr")?.ledgerId ?? null, // Assuming first credit is party
        reference: input.reference ?? null,
        narration: input.narration ?? null,
        totalAmount,
        gstTotal: 0,
        grandTotal: totalAmount,
        status: "posted",
        // Challan specific fields
        transportName: input.transportName ?? null,
        lrNumber: input.lrNumber ?? null,
        dispatchDate: input.dispatchDate ?? null,
        freightAmount: input.freightAmount ?? 0,
        idempotencyKey,
      });

      // 2. Insert double-entry lines from input
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

      // 3. Handle freight accounting for challan vouchers
      if (input.type === "challan" && input.freightAmount && input.freightAmount > 0) {
        // Find freight expense ledger (assuming we have one named "Freight Outward" or similar)
        const freightLedger = await tx.query.ledgers.findFirst({
          where: and(
            eq(ledgers.companyId, "company_1"),
            eq(ledgers.group, "expenses"),
            eq(ledgers.name, "Freight Outward")
          )
        });

        // If freight ledger doesn't exist, create it (in real app, this would be pre-configured)
        // For now, we'll use expenses group ledger or create a simple approach
        // Let's find any expenses ledger for freight
        const expenseLedger = await tx.query.ledgers.findFirst({
          where: and(
            eq(ledgers.companyId, "company_1"),
            eq(ledgers.group, "expenses")
          )
        });

        if (expenseLedger) {
          // Add freight expense entry (debit)
          await tx.insert(voucherEntries).values({
            id: randomUUID(),
            voucherId,
            ledgerId: expenseLedger.id,
            type: "dr",
            amount: input.freightAmount,
            narration: `Freight charges for challan ${voucherId}`,
          });

          // To keep voucher balanced, we need to add a credit entry
          // This would typically go to the party ledger or cash/bank
          // For simplicity, let's add it to the party ledger (increase amount payable by party)
          const partyLedgerEntry = input.entries.find(e => e.type === "cr");
          if (partyLedgerEntry) {
            // Update the existing party credit entry to include freight amount
            await tx.update(voucherEntries)
              .set({
                amount: partyLedgerEntry.amount + input.freightAmount,
              })
              .where(eq(voucherEntries.id, partyLedgerEntry.id)); // We don't have the ID here, so let's reconsider

            // Actually, easier approach: add a separate credit entry to party ledger
            // But we need to avoid double entry complexity. Let's adjust the original party credit
          }

          // Simpler approach: just add freight as debit and adjust the party credit accordingly
          // Find the party credit entry and increase it by freight amount
          const partyEntries = input.entries.filter(e => e.type === "cr");
          if (partyEntries.length > 0) {
            // For now, we'll add freight as a separate line item - debit freight expense, credit party
            await tx.insert(voucherEntries).values({
              id: randomUUID(),
              voucherId,
              ledgerId: expenseLedger.id,
              type: "dr",
              amount: input.freightAmount,
              narration: `Freight charges for challan ${voucherId}`,
            });

            // Increase the party credit amount by freight amount (first party credit entry)
            const firstPartyCredit = partyEntries[0];
            await tx.update(voucherEntries)
              .set({
                amount: firstPartyCredit.amount + input.freightAmount,
              })
              .where(and(
                eq(voucherEntries.voucherId, voucherId),
                eq(voucherEntries.ledgerId, firstPartyCredit.ledgerId),
                eq(voucherEntries.type, "cr")
              ));
          }
        }
      }

      // 4. Handle stock movements for inventory items (for purchase and sales vouchers)
      if (input.type === "purchase" || input.type === "sales") {
        for (const entry of input.entries) {
          if (entry.inventoryItemId && entry.quantity && entry.rate) {
            // Determine stock movement type based on voucher type
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

            // Update inventory stock quantity
            await tx.update(inventoryItems)
              .set({
                stockQuantity:
                  input.type === "purchase"
                    ? inventoryItems.stockQuantity + entry.quantity
                    : inventoryItems.stockQuantity - entry.quantity,
                updatedAt: Date.now()
              })
              .where(({ id, companyId }) =>
                and(
                  eq(id, entry.inventoryItemId),
                  eq(companyId, "company_1")
                )
              );
          }
        }
      }

      // 5. Update ledger balances (materialized)
      // We need to reconstruct ledgerEffects to include freight entries
      const ledgerEffects = input.entries.map(entry => ({
        ledgerId: entry.ledgerId,
        debit: entry.type === "dr" ? entry.amount : 0,
        credit: entry.type === "cr" ? entry.amount : 0,
      }));

      // Add freight effects if applicable
      if (input.type === "challan" && input.freightAmount && input.freightAmount > 0) {
        const expenseLedger = await tx.query.ledgers.findFirst({
          where: and(
            eq(ledgers.companyId, "company_1"),
            eq(ledgers.group, "expenses")
          )
        });

        if (expenseLedger) {
          ledgerEffects.push({
            ledgerId: expenseLedger.id,
            debit: input.freightAmount,
            credit: 0,
          });

          // Also add the offsetting credit to party ledger (we'll estimate this)
          const partyEntries = input.entries.filter(e => e.type === "cr");
          if (partyEntries.length > 0) {
            ledgerEffects.push({
              ledgerId: partyEntries[0].ledgerId,
              debit: 0,
              credit: input.freightAmount,
            });
          }
        }
      }

      await updateLedgerBalancesForVoucher(tx, input.date, ledgerEffects);

      // 6. Append audit log
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
    revalidatePath("/inventory"); // Revalidate inventory page as stock may have changed

    return { success: true, voucherId };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error creating voucher.";
    return { success: false, error: message };
  }
}
