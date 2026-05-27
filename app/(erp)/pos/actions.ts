"use server";

import { db, ledgers, voucherEntries, inventoryItems, stockMovements, vouchers } from "@/lib/database";
import { revalidatePath } from "next/cache";
import { randomUUID } from "crypto";
import { and, eq, sql } from "@/lib/database";
import type { VoucherType } from "@/lib/types";
import { getSession } from "@/lib/auth";

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
    for (const item of input.items) {
      if (item.quantity <= 0) {
        return { success: false, error: "All items must have a quantity of at least 1." };
      }
    }

    const session = await getSession();
    if (!session || !session.companyId) {
      return { success: false, error: "Not authenticated or no active organization" };
    }
    const companyId = session.companyId;

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
      .where(and(
        eq(ledgers.group as any, "sales"),
        eq(ledgers.companyId as any, companyId)
      ))
      .limit(1);

    if (!salesLedger) {
      return { success: false, error: "Sales ledger not found. Please create a ledger with group 'Sales Accounts'." };
    }

    // Create voucher
    const voucherId = randomUUID();
    await db.transaction(async (tx) => {
      // Determine customer ledger inside transaction to enable atomic rollback on failure
      let activeCustomerLedgerId = input.customerLedgerId;
      if (!activeCustomerLedgerId && input.walkInCustomerName) {
        // Create a new ledger for walk-in customer
        const [ledger] = await tx.insert(ledgers).values({
          id: randomUUID(),
          companyId: companyId,
          name: input.walkInCustomerName,
          group: "sundry_debtors",
          openingBalance: 0,
          balanceType: "dr",
        }).returning({ id: ledgers.id });
        
        if (!ledger) {
          throw new Error("Failed to create customer ledger");
        }
        activeCustomerLedgerId = ledger.id;
      }

      if (!activeCustomerLedgerId) {
        throw new Error("Customer is required");
      }

      await tx.insert(vouchers).values({
        id: voucherId,
        companyId: companyId,
        type: "sales",
        number: `POS-${Date.now()}`,
        date: Date.now(),
        partyLedgerId: activeCustomerLedgerId,
        totalAmount: amountDue,
        gstTotal: 0,
        grandTotal: amountDue,
        status: "posted",
      });

      // Dr Customer
      await tx.insert(voucherEntries).values({
        id: randomUUID(),
        voucherId,
        ledgerId: activeCustomerLedgerId,
        type: "dr",
        amount: amountDue,
        narration: `POS Sale`,
      });

      // Cr Sales
      await tx.insert(voucherEntries).values({
        id: randomUUID(),
        voucherId,
        ledgerId: salesLedger.id,
        type: "cr",
        amount: amountDue,
        narration: `POS Sale`,
      });

      // Update inventory and stock movements
      for (const line of lines) {
        // Decrease stock
        await tx.update(inventoryItems)
          .set({ stockQuantity: sql`${inventoryItems.stockQuantity} - ${line.quantity}` })
          .where(and(
            eq(inventoryItems.id as any, line.inventoryItemId),
            eq(inventoryItems.companyId as any, companyId)
          ));

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
    const session = await getSession();
    if (!session || !session.companyId) return null;
    const companyId = session.companyId;

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
      .where(and(
        eq(ledgers.id as any, ledgerId),
        eq(ledgers.companyId as any, companyId)
      ))
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
      .innerJoin(vouchers, eq(voucherEntries.voucherId as any, vouchers.id as any))
      .where(
        and(
          eq(voucherEntries.ledgerId as any, ledgerId),
          eq(vouchers.companyId as any, companyId)
        )
      );

    let totalDebit = 0;
    let totalCredit = 0;
    for (const e of entries) {
      if (e.type === "dr") totalDebit += e.amount;
      else totalCredit += e.amount;
    }

    if (!l) return null;

    const outstanding = (l.openingBalance ?? 0) + totalDebit - totalCredit;

    return {
      id: l.id,
      name: l.name,
      group: l.group,
      creditLimit: l.creditLimit ?? 0,
      outstanding: outstanding,
    };
  } catch (err) {
    console.error("Failed to get ledger details:", err);
    return null;
  }
}

export async function getDebtorsOptions(): Promise<Array<{ id: string; name: string; openingBalance: number }>> {
  try {
    const session = await getSession();
    if (!session || !session.companyId) return [];
    const companyId = session.companyId;

    return await db
      .select({ id: ledgers.id, name: ledgers.name, openingBalance: ledgers.openingBalance })
      .from(ledgers)
      .where(
        and(
          eq(ledgers.group as any, "sundry_debtors"),
          eq(ledgers.isActive as any, true),
          eq(ledgers.companyId as any, companyId)
        )
      )
      .orderBy(ledgers.name);
  } catch (err) {
    console.error("Failed to fetch debtors options:", err);
    return [];
  }
}
