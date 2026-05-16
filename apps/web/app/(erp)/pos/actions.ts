"use server";

import { db, ledgers, voucherEntries, inventoryItems, stockMovements, vouchers } from "@repo/database";
import { revalidatePath } from "next/cache";
import { randomUUID } from "crypto";
import { and, eq } from "drizzle-orm";
import type { VoucherType } from "@/lib/types";

export interface PosSaveInput {
  customerLedgerId: string; // sundry_debtors ledger id, or null for walk-in
  walkInCustomerName?: string; // if customerLedgerId is null and we want to create a walk-in ledger on the fly
  items: Array<{
    inventoryItemId: string;
    quantity: number;
    discountPercent: number; // per-item discount %
    rate: number; // sale rate before discount
  }>;
  billDiscountPercent: number; // bill-level discount %
  paymentMode: "cash" | "upi" | "card" | "credit" | "split";
  narration?: string;
}

export async function savePosBill(input: PosSaveInput): Promise<{ success: true; voucherId: string } | { success: false; error: string }> {
  try {
    // Validate input
    if (!input.items || input.items.length === 0) {
      return { success: false, error: "Cart is empty" };
    }

    // Determine customer ledger: if customerLedgerId provided, use it; else if walkInCustomerName, create a new ledger under sundry_debtors; else error.
    let customerLedgerId = input.customerLedgerId;
    if (!customerLedgerId && input.walkInCustomerName) {
      // Create a new ledger for walk-in customer
      const [ledger] = await db.insert(ledgers).values({
        id: randomUUID(),
        companyId: "company_1",
        name: input.walkInCustomerName,
        group: "sundry_debtors",
        openingBalance: 0,
        balanceType: "dr",
      }).returning({ id: ledgers.id });
      customerLedgerId = ledger.id;
    }

    if (!customerLedgerId) {
      return { success: false, error: "Customer is required" };
    }

    // Calculate amount due
    let subTotal = 0;
    let totalItemDiscount = 0;
    const lines = input.items.map(item => {
      const lineTotal = item.rate * item.quantity;
      const discountAmount = (lineTotal * item.discountPercent) / 100;
      const lineAmountAfterDiscount = lineTotal - discountAmount;
      totalItemDiscount += discountAmount;
      subTotal += lineTotal;
      return {
        ...item,
        lineTotal,
        discountAmount,
        lineAmountAfterDiscount,
      };
    });

    const amountAfterItemDiscount = subTotal - totalItemDiscount;
    const billDiscountAmount = (amountAfterItemDiscount * input.billDiscountPercent) / 100;
    const amountDue = amountAfterItemDiscount - billDiscountAmount;

    // Get a sales ledger (group: sales)
    const [salesLedger] = await db
      .select()
      .from(ledgers)
      .where(({ group, companyId }) =>
        group === "sales" && companyId === "company_1"
      )
      .limit(1);

    if (!salesLedger) {
      return { success: false, error: "Sales ledger not found. Please create a ledger with group 'Sales Accounts'." };
    }

    // Create voucher entries: Dr Customer, Cr Sales
    const entries = [
      {
        ledgerId: customerLedgerId,
        type: "dr" as const,
        amount: amountDue,
        narration: `POS Sale`,
      },
      {
        ledgerId: salesLedger.id,
        type: "cr" as const,
        amount: amountDue,
        narration: `POS Sale`,
      },
    ];

    // Create voucher
    const voucherId = randomUUID();
    await db.transaction(async (tx) => {
      await tx.insert(vouchers).values({
        id: voucherId,
        companyId: "company_1",
        type: "sales",
        number: `POS-${Date.now()}`,
        date: Date.now(),
        partyLedgerId: customerLedgerId,
        totalAmount: amountDue,
        gstTotal: 0,
        grandTotal: amountDue,
        status: "posted",
      });

      for (const entry of entries) {
        await tx.insert(voucherEntries).values({
          id: randomUUID(),
          voucherId,
          ledgerId: entry.ledgerId,
          type: entry.type,
          amount: entry.amount,
          narration: entry.narration,
        });
      }

      // Update inventory and stock movements
      for (const line of lines) {
        // Decrease stock
        await tx.update(inventoryItems)
          .set({ stockQuantity: inventoryItems.stockQuantity - line.quantity })
          .where(({ id, companyId }) =>
            id === line.inventoryItemId && companyId === "company_1"
          );

        // Stock movement
        await tx.insert(stockMovements).values({
          id: randomUUID(),
          itemId: line.inventoryItemId,
          voucherId,
          type: "out",
          quantity: line.quantity,
          rate: line.rate,
          date: Date.now(),
          narration: `POS Sale`,
        });
      }
    });

    // Revalidate paths
    revalidatePath("/pos");
    revalidatePath("/vouchers");
    revalidatePath("/dashboard");
    revalidatePath("/inventory");

    return { success: true, voucherId };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error saving POS bill.";
    return { success: false, error: message };
  }
}

// New function to get ledger details including outstanding balance and credit limit
export interface LedgerDetails {
  id: string;
  name: string;
  group: string;
  creditLimit: number;
  outstanding: number; // current debit balance for sundry_debtors (positive means debit, i.e., amount due)
}

export async function getLedgerDetails(ledgerId: string): Promise<LedgerDetails | null> {
  try {
    // Get the ledger basic info
    const ledger = await db
      .select({
        id: ledgers.id,
        name: ledgers.name,
        group: ledgers.group,
        creditLimit: ledgers.creditLimit,
        openingBalance: ledgers.openingBalance,
      })
      .from(ledgers)
      .where(({ id, companyId }) => eq(id, ledgerId) && eq(companyId, "company_1"))
      .limit(1);

    if (!ledger.length) return null;

    const l = ledger[0];

    // Calculate outstanding: openingBalance + total debits - total credits
    const entries = await db
      .select({
        type: voucherEntries.type,
        amount: voucherEntries.amount,
      })
      .from(voucherEntries)
      .innerJoin(vouchers, eq(voucherEntries.voucherId, vouchers.id))
      .where(
        and(
          eq(voucherEntries.ledgerId, ledgerId),
          eq(vouchers.companyId, "company_1")
        )
      );

    let totalDebit = 0;
    let totalCredit = 0;
    for (const e of entries) {
      if (e.type === "dr") totalDebit += e.amount;
      else totalCredit += e.amount;
    }

    const outstanding = l.openingBalance + totalDebit - totalCredit;

    return {
      id: l.id,
      name: l.name,
      group: l.group,
      creditLimit: l.creditLimit,
      outstanding: outstanding,
    };
  } catch (err) {
    console.error("Failed to get ledger details:", err);
    return null;
  }
}