"use server";

import { db, vouchers, voucherEntries, auditLog, inventoryItems, stockMovements, ledgers, and, eq, sql } from "@/lib/database";
import { updateLedgerBalancesForVoucher, reverseLedgerBalancesForVoucher } from "@/lib/accounting/balance-engine";
import { revalidatePath } from "next/cache";
import { randomUUID } from "crypto";
import type { VoucherType } from "@/lib/types";
import { getSession } from "@/lib/auth";

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

    const session = await getSession();
    if (!session || !session.companyId) {
      return { success: false, error: "Not authenticated or no active organization" };
    }
    const companyId = session.companyId;

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
        companyId: companyId,
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
          where: and(eq(ledgers.companyId as any, companyId), eq(ledgers.group as any, "expenses"))
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
              .where(and(eq(inventoryItems.id as any, entry.inventoryItemId), eq(inventoryItems.companyId as any, companyId)));
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
          where: and(eq(ledgers.companyId as any, companyId), eq(ledgers.group as any, "expenses"))
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

export async function deleteVoucherAction(id: string): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const session = await getSession();
    if (!session || !session.companyId) {
      return { success: false, error: "Not authenticated or no active organization" };
    }
    const companyId = session.companyId;

    // 1. Verify voucher exists and belongs to company
    const [voucher] = await db
      .select()
      .from(vouchers)
      .where(and(eq(vouchers.id, id), eq(vouchers.companyId, companyId)))
      .limit(1);

    if (!voucher) {
      return { success: false, error: "Voucher not found or unauthorized" };
    }

    // 2. Fetch associated entries to compute balance effects for reversal
    const entries = await db
      .select()
      .from(voucherEntries)
      .where(eq(voucherEntries.voucherId, id));

    // ── Atomic Deletion Transaction ──────────────────────────────────────────
    await db.transaction(async (tx) => {
      // a. Reverse ledger balances effects
      const ledgerEffects = entries.map(entry => ({
        ledgerId: entry.ledgerId,
        debit: entry.type === "dr" ? entry.amount : 0,
        credit: entry.type === "cr" ? entry.amount : 0,
      }));

      // If freight was added (Challan specific), reverse freight effects too
      if (voucher.type === "challan" && voucher.freightAmount && voucher.freightAmount > 0) {
        const expenseLedger = await tx.query.ledgers.findFirst({
          where: and(eq(ledgers.companyId as any, companyId), eq(ledgers.group as any, "expenses"))
        });
        if (expenseLedger) {
          ledgerEffects.push({
            ledgerId: expenseLedger.id,
            debit: voucher.freightAmount,
            credit: 0,
          });
          const partyEntries = entries.filter(e => e.type === "cr");
          if (partyEntries[0]) {
            ledgerEffects.push({
              ledgerId: partyEntries[0].ledgerId,
              debit: 0,
              credit: voucher.freightAmount,
            });
          }
        }
      }

      await reverseLedgerBalancesForVoucher(tx, voucher.date, ledgerEffects);

      // b. Adjust inventory levels back if purchase/sales
      if (voucher.type === "purchase" || voucher.type === "sales") {
        for (const entry of entries) {
          if (entry.inventoryItemId && entry.quantity) {
            const movementType: "in" | "out" = voucher.type === "purchase" ? "in" : "out";
            
            // Reversing: purchase adds inventory so we subtract, sales subtracts so we add
            await tx.update(inventoryItems)
              .set({
                stockQuantity: movementType === "in" 
                  ? sql`${inventoryItems.stockQuantity} - ${entry.quantity}`
                  : sql`${inventoryItems.stockQuantity} + ${entry.quantity}`,
                updatedAt: Date.now()
              })
              .where(and(eq(inventoryItems.id as any, entry.inventoryItemId), eq(inventoryItems.companyId as any, companyId)));
          }
        }
      }

      // c. Delete stock movements
      await tx.delete(stockMovements).where(eq(stockMovements.voucherId, id));

      // d. Delete voucher entries
      await tx.delete(voucherEntries).where(eq(voucherEntries.voucherId, id));

      // e. Delete voucher itself
      await tx.delete(vouchers).where(eq(vouchers.id, id));

      // f. Audit Log
      await tx.insert(auditLog).values({
        id: randomUUID(),
        entity: "voucher",
        entityId: id,
        action: "delete",
        before: JSON.stringify({
          type: voucher.type,
          number: voucher.number,
          totalAmount: voucher.totalAmount,
        }),
        deviceId: "web",
      });
    });

    revalidatePath("/vouchers");
    revalidatePath("/dashboard");
    revalidatePath("/inventory");
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown error deleting voucher" };
  }
}

export async function updateVoucherAction(
  id: string,
  input: CreateVoucherInput
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    validateEntries(input.entries);
    ensureBalanced(input.entries);

    const session = await getSession();
    if (!session || !session.companyId) {
      return { success: false, error: "Not authenticated or no active organization" };
    }
    const companyId = session.companyId;

    // 1. Fetch old voucher & entries
    const [oldVoucher] = await db
      .select()
      .from(vouchers)
      .where(and(eq(vouchers.id, id), eq(vouchers.companyId, companyId)))
      .limit(1);

    if (!oldVoucher) {
      return { success: false, error: "Voucher not found or unauthorized" };
    }

    const oldEntries = await db
      .select()
      .from(voucherEntries)
      .where(eq(voucherEntries.voucherId, id));

    let totalAmount = input.entries
      .filter((e) => e.type === "dr")
      .reduce((s, e) => s + e.amount, 0);

    if (input.type === "challan" && input.freightAmount) {
      totalAmount += input.freightAmount;
    }

    // ── Atomic Update Transaction ────────────────────────────────────────────
    await db.transaction(async (tx) => {
      // A. REVERSE OLD EFFECTS
      // a. Reverse monthly balances
      const oldEffects = oldEntries.map(entry => ({
        ledgerId: entry.ledgerId,
        debit: entry.type === "dr" ? entry.amount : 0,
        credit: entry.type === "cr" ? entry.amount : 0,
      }));

      if (oldVoucher.type === "challan" && oldVoucher.freightAmount && oldVoucher.freightAmount > 0) {
        const expenseLedger = await tx.query.ledgers.findFirst({
          where: and(eq(ledgers.companyId as any, companyId), eq(ledgers.group as any, "expenses"))
        });
        if (expenseLedger) {
          oldEffects.push({
            ledgerId: expenseLedger.id,
            debit: oldVoucher.freightAmount,
            credit: 0,
          });
          const partyEntries = oldEntries.filter(e => e.type === "cr");
          if (partyEntries[0]) {
            oldEffects.push({
              ledgerId: partyEntries[0].ledgerId,
              debit: 0,
              credit: oldVoucher.freightAmount,
            });
          }
        }
      }

      await reverseLedgerBalancesForVoucher(tx, oldVoucher.date, oldEffects);

      // b. Reverse inventory changes
      if (oldVoucher.type === "purchase" || oldVoucher.type === "sales") {
        for (const entry of oldEntries) {
          if (entry.inventoryItemId && entry.quantity) {
            const movementType: "in" | "out" = oldVoucher.type === "purchase" ? "in" : "out";
            await tx.update(inventoryItems)
              .set({
                stockQuantity: movementType === "in" 
                  ? sql`${inventoryItems.stockQuantity} - ${entry.quantity}`
                  : sql`${inventoryItems.stockQuantity} + ${entry.quantity}`,
                updatedAt: Date.now()
              })
              .where(and(eq(inventoryItems.id as any, entry.inventoryItemId), eq(inventoryItems.companyId as any, companyId)));
          }
        }
      }

      // c. Clear old child rows
      await tx.delete(stockMovements).where(eq(stockMovements.voucherId, id));
      await tx.delete(voucherEntries).where(eq(voucherEntries.voucherId, id));

      // B. APPLY NEW VALUES
      // a. Update voucher record
      await tx.update(vouchers)
        .set({
          type: input.type,
          date: input.date,
          partyLedgerId: input.entries.find(e => e.type === "cr")?.ledgerId ?? null,
          reference: input.reference ?? null,
          narration: input.narration ?? null,
          totalAmount,
          grandTotal: totalAmount,
          freightAmount: input.freightAmount ?? 0,
          transportName: input.transportName ?? null,
          lrNumber: input.lrNumber ?? null,
          dispatchDate: input.dispatchDate ?? null,
          updatedAt: Date.now(),
        })
        .where(eq(vouchers.id, id));

      // b. Insert new entries
      for (const entry of input.entries) {
        await tx.insert(voucherEntries).values({
          id: randomUUID(),
          voucherId: id,
          ledgerId: entry.ledgerId,
          type: entry.type,
          amount: entry.amount,
          inventoryItemId: entry.inventoryItemId ?? null,
          quantity: entry.quantity ?? null,
          rate: entry.rate ?? null,
          narration: entry.narration ?? null,
        });
      }

      // c. Handle new freight details for Challan
      if (input.type === "challan" && input.freightAmount && input.freightAmount > 0) {
        const expenseLedger = await tx.query.ledgers.findFirst({
          where: and(eq(ledgers.companyId as any, companyId), eq(ledgers.group as any, "expenses"))
        });

        if (expenseLedger) {
          const partyEntries = input.entries.filter(e => e.type === "cr");
          const firstPartyEntry = partyEntries[0];
          if (firstPartyEntry) {
            await tx.insert(voucherEntries).values({
              id: randomUUID(),
              voucherId: id,
              ledgerId: expenseLedger.id,
              type: "dr",
              amount: input.freightAmount,
              narration: `Freight charges for challan ${id}`,
            });

            await tx.update(voucherEntries)
              .set({
                amount: sql`${voucherEntries.amount} + ${input.freightAmount}`,
              })
              .where(and(
                eq(voucherEntries.voucherId as any, id),
                eq(voucherEntries.ledgerId as any, firstPartyEntry.ledgerId),
                eq(voucherEntries.type as any, "cr")
              ));
          }
        }
      }

      // d. Handle new stock movements
      if (input.type === "purchase" || input.type === "sales") {
        for (const entry of input.entries) {
          if (entry.inventoryItemId && entry.quantity && entry.rate) {
            const movementType: "in" | "out" = input.type === "purchase" ? "in" : "out";

            await tx.insert(stockMovements).values({
              id: randomUUID(),
              itemId: entry.inventoryItemId,
              voucherId: id,
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
              .where(and(eq(inventoryItems.id as any, entry.inventoryItemId), eq(inventoryItems.companyId as any, companyId)));
          }
        }
      }

      // e. Update new materialized balances
      const ledgerEffects = input.entries.map(entry => ({
        ledgerId: entry.ledgerId,
        debit: entry.type === "dr" ? entry.amount : 0,
        credit: entry.type === "cr" ? entry.amount : 0,
      }));

      if (input.type === "challan" && input.freightAmount && input.freightAmount > 0) {
        const expenseLedger = await tx.query.ledgers.findFirst({
          where: and(eq(ledgers.companyId as any, companyId), eq(ledgers.group as any, "expenses"))
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

      // f. Audit Log
      await tx.insert(auditLog).values({
        id: randomUUID(),
        entity: "voucher",
        entityId: id,
        action: "update",
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
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown error updating voucher" };
  }
}

export async function getVoucherDetailAction(id: string) {
  try {
    const voucher = await db.query.vouchers.findFirst({
      where: eq(vouchers.id, id),
    });
    if (!voucher) return null;
    
    const entries = await db
      .select({
        id: voucherEntries.id,
        ledgerId: voucherEntries.ledgerId,
        ledgerName: ledgers.name,
        type: voucherEntries.type,
        amount: voucherEntries.amount,
        inventoryItemId: voucherEntries.inventoryItemId,
        quantity: voucherEntries.quantity,
        rate: voucherEntries.rate,
        narration: voucherEntries.narration,
      })
      .from(voucherEntries)
      .innerJoin(ledgers, eq(voucherEntries.ledgerId, ledgers.id))
      .where(eq(voucherEntries.voucherId, id));

    return { voucher, entries };
  } catch (err) {
    console.error("Failed to load voucher detail:", err);
    return null;
  }
}
