"use server";

import { db, ledgers, eq } from "@/lib/database";
import { LedgerGroup, BalanceType } from "@/lib/types";
import { revalidatePath } from "next/cache";

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

    // Default companyId to the first company (since we only have one company in the seed)
    const companyId = "company_1";

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
    })
    .from(ledgers)
    .where(eq(ledgers.isActive as any, true))
    .orderBy(ledgers.name);
  } catch (err) {
    console.error("Failed to fetch ledgers options:", err);
    return [];
  }
}
