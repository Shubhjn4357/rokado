"use server";

import {
  db,
  companies,
  ledgers,
  ledgerBalances,
  vouchers,
  voucherEntries,
  inventoryItems,
  stockMovements,
  auditLog,
  syncQueue,
  users,
  companyMembers,
  desc,
  eq
} from "@/lib/database";
import { getSession } from "@/lib/auth";

export interface DatabaseBackupPayload {
  companies: any[];
  ledgers: any[];
  ledgerBalances: any[];
  vouchers: any[];
  voucherEntries: any[];
  inventoryItems: any[];
  stockMovements: any[];
  auditLog: any[];
  syncQueue: any[];
  users: any[];
  companyMembers: any[];
  exportedAt: number;
  exportedBy: string;
}

/**
 * Compile all SQLite tables into a structured database-agnostic JSON string.
 */
export async function backupDatabaseAction(): Promise<{ success: boolean; data?: string; error?: string }> {
  try {
    const session = await getSession();
    if (!session) {
      return { success: false, error: "Unauthorized session. Please login." };
    }

    const [
      allCompanies,
      allLedgers,
      allBalances,
      allVouchers,
      allEntries,
      allItems,
      allMovements,
      allAuditLogs,
      allQueue,
      allUsers,
      allMembers
    ] = await Promise.all([
      db.select().from(companies),
      db.select().from(ledgers),
      db.select().from(ledgerBalances),
      db.select().from(vouchers),
      db.select().from(voucherEntries),
      db.select().from(inventoryItems),
      db.select().from(stockMovements),
      db.select().from(auditLog),
      db.select().from(syncQueue),
      db.select().from(users),
      db.select().from(companyMembers)
    ]);

    const backup: DatabaseBackupPayload = {
      companies: allCompanies,
      ledgers: allLedgers,
      ledgerBalances: allBalances,
      vouchers: allVouchers,
      voucherEntries: allEntries,
      inventoryItems: allItems,
      stockMovements: allMovements,
      auditLog: allAuditLogs,
      syncQueue: allQueue,
      users: allUsers,
      companyMembers: allMembers,
      exportedAt: Date.now(),
      exportedBy: session.username || "System"
    };

    return {
      success: true,
      data: JSON.stringify(backup, null, 2)
    };
  } catch (err) {
    console.error("[Backup] Failed to export database:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to compile database backup."
    };
  }
}

/**
 * Transactionally restore all database tables from a structured JSON string.
 */
export async function restoreDatabaseAction(backupJsonString: string): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await getSession();
    if (!session) {
      return { success: false, error: "Unauthorized session. Please login." };
    }

    const data: DatabaseBackupPayload = JSON.parse(backupJsonString);

    // Basic structure verification
    if (!data.companies || !data.ledgers || !data.vouchers || !data.voucherEntries) {
      return { success: false, error: "Invalid backup file structure." };
    }

    // Inside transaction, wipe and re-insert
    await db.transaction(async (tx) => {
      // 1. Delete in reverse referential order to satisfy foreign key constraints
      await tx.delete(voucherEntries);
      await tx.delete(vouchers);
      await tx.delete(stockMovements);
      await tx.delete(inventoryItems);
      await tx.delete(ledgerBalances);
      await tx.delete(ledgers);
      await tx.delete(companyMembers);
      await tx.delete(companies);
      await tx.delete(users);
      await tx.delete(auditLog);
      await tx.delete(syncQueue);

      // 2. Insert records sequentially in order of dependencies
      if (data.companies && data.companies.length > 0) {
        await tx.insert(companies).values(data.companies);
      }
      if (data.users && data.users.length > 0) {
        await tx.insert(users).values(data.users);
      }
      if (data.companyMembers && data.companyMembers.length > 0) {
        await tx.insert(companyMembers).values(data.companyMembers);
      }
      if (data.ledgers && data.ledgers.length > 0) {
        await tx.insert(ledgers).values(data.ledgers);
      }
      if (data.ledgerBalances && data.ledgerBalances.length > 0) {
        await tx.insert(ledgerBalances).values(data.ledgerBalances);
      }
      if (data.inventoryItems && data.inventoryItems.length > 0) {
        await tx.insert(inventoryItems).values(data.inventoryItems);
      }
      if (data.vouchers && data.vouchers.length > 0) {
        await tx.insert(vouchers).values(data.vouchers);
      }
      if (data.voucherEntries && data.voucherEntries.length > 0) {
        await tx.insert(voucherEntries).values(data.voucherEntries);
      }
      if (data.stockMovements && data.stockMovements.length > 0) {
        await tx.insert(stockMovements).values(data.stockMovements);
      }
      if (data.auditLog && data.auditLog.length > 0) {
        await tx.insert(auditLog).values(data.auditLog);
      }
      if (data.syncQueue && data.syncQueue.length > 0) {
        await tx.insert(syncQueue).values(data.syncQueue);
      }
    });

    return { success: true };
  } catch (err) {
    console.error("[Backup] Failed to restore database:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to parse or write backup transaction."
    };
  }
}
