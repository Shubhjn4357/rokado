"use server";

import { db, ledgers, voucherEntries, ledgerBalances, and, eq } from "@/lib/database";
import { LedgerGroup, BalanceType } from "@/lib/types";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";

export interface CreateLedgerInput {
  name: string;
  group: LedgerGroup;
  gstNumber?: string | null;
  pan?: string | null;
  phone?: string | null;
  address?: string | null;
  creditLimit: number;
  openingBalance: number;
  balanceType: BalanceType;
}

export async function createLedger(input: CreateLedgerInput): Promise<{ success: true; ledgerId: string } | { success: false; error: string }> {
  try {
    // Validate input
    if (!input.name || input.name.trim() === "") {
      return { success: false, error: "Ledger name is required" };
    }

    // Retrieve active companyId dynamically
    const session = await getSession();
    if (!session || !session.companyId) {
      return { success: false, error: "Not authenticated or no active organization" };
    }
    const companyId = session.companyId;

    // Insert ledger
    const [ledger] = await db.insert(ledgers).values({
      id: crypto.randomUUID(),
      companyId,
      name: input.name.trim(),
      group: input.group,
      gstNumber: input.gstNumber ?? null,
      pan: input.pan ?? null,
      phone: input.phone ?? null,
      address: input.address ?? null,
      creditLimit: input.creditLimit,
      openingBalance: input.openingBalance,
      balanceType: input.balanceType,
    }).returning({ id: ledgers.id });

    // Revalidate ledgers page
    revalidatePath("/ledgers");

    if (!ledger) {
      return { success: false, error: "Failed to create ledger" };
    }

    return { success: true, ledgerId: ledger.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error creating ledger.";
    return { success: false, error: message };
  }
}

export async function getLedgersOptions() {
  try {
    return await db.select({
      id: ledgers.id,
      name: ledgers.name,
      group: ledgers.group as any,
      address: ledgers.address,
      gstNumber: ledgers.gstNumber,
    })
    .from(ledgers)
    .where(eq(ledgers.isActive as any, true))
    .orderBy(ledgers.name);
  } catch (err) {
    console.error("Failed to fetch ledgers options:", err);
    return [];
  }
}

export async function updateLedgerAction(
  id: string,
  input: Partial<CreateLedgerInput>
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const session = await getSession();
    if (!session || !session.companyId) {
      return { success: false, error: "Not authenticated or no active organization" };
    }

    // Check if ledger belongs to user's company
    const [ledger] = await db
      .select()
      .from(ledgers)
      .where(and(eq(ledgers.id as any, id), eq(ledgers.companyId as any, session.companyId)))
      .limit(1);

    if (!ledger) {
      return { success: false, error: "Ledger not found or unauthorized" };
    }

    // Perform update
    const updateData: any = {};
    if (input.name !== undefined) updateData.name = input.name.trim();
    if (input.group !== undefined) updateData.group = input.group;
    if (input.gstNumber !== undefined) updateData.gstNumber = input.gstNumber || null;
    if (input.pan !== undefined) updateData.pan = input.pan || null;
    if (input.phone !== undefined) updateData.phone = input.phone || null;
    if (input.address !== undefined) updateData.address = input.address || null;
    if (input.creditLimit !== undefined) updateData.creditLimit = input.creditLimit;
    
    // Only allow updating opening balance if no vouchers exist
    if (input.openingBalance !== undefined || input.balanceType !== undefined) {
      const [hasEntries] = await db
        .select()
        .from(voucherEntries)
        .where(eq(voucherEntries.ledgerId, id))
        .limit(1);

      if (hasEntries) {
        return { success: false, error: "Cannot update opening balance of a ledger with transactions" };
      }

      if (input.openingBalance !== undefined) updateData.openingBalance = input.openingBalance;
      if (input.balanceType !== undefined) updateData.balanceType = input.balanceType;
    }

    await db
      .update(ledgers)
      .set({
        ...updateData,
        updatedAt: Date.now(),
      })
      .where(eq(ledgers.id as any, id));

    revalidatePath("/ledgers");
    revalidatePath(`/ledgers/${id}`);
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown error updating ledger" };
  }
}

export async function deleteLedgerAction(id: string): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const session = await getSession();
    if (!session || !session.companyId) {
      return { success: false, error: "Not authenticated or no active organization" };
    }

    // Verify ledger exists and belongs to company
    const [ledger] = await db
      .select()
      .from(ledgers)
      .where(and(eq(ledgers.id as any, id), eq(ledgers.companyId as any, session.companyId)))
      .limit(1);

    if (!ledger) {
      return { success: false, error: "Ledger not found or unauthorized" };
    }

    // 1. Safe Constraint: Block deletion if transactions exist
    const [existingEntry] = await db
      .select()
      .from(voucherEntries)
      .where(eq(voucherEntries.ledgerId, id))
      .limit(1);

    if (existingEntry) {
      return {
        success: false,
        error: "Cannot delete this ledger because it contains active transactions. Please delete associated vouchers first.",
      };
    }

    // 2. Perform deletion
    await db.transaction(async (tx) => {
      // Wipes materialized balances
      await tx.delete(ledgerBalances).where(eq(ledgerBalances.ledgerId, id));
      // Delete ledger
      await tx.delete(ledgers).where(eq(ledgers.id as any, id));
    });

    revalidatePath("/ledgers");
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown error deleting ledger" };
  }
}
