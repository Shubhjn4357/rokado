// Sync Engine for multi-device synchronization
// Handles sync queue processing, conflict resolution, and remote sync

import { db, syncQueue, eq, desc, and, gte, lte, SQL } from "@repo/database";
import { companies, ledgers, vouchers, inventoryItems } from "@repo/database";
import { vouchers as voucherEntriesTable, voucherEntries } from "@repo/database";
import { auditLog } from "@repo/database";
import { formatDate } from "@/lib/types";

// Sync configuration
const SYNC_CONFIG = {
  MAX_RETRIES: 5,
  RETRY_BASE_DELAY_MS: 1000, // 1 second base delay for exponential backoff
  BATCH_SIZE: 100,
  REMOTE_SYNC_ENABLED: process.env.REMOTE_SYNC_ENABLED === "true",
  REMOTE_SYNC_URL: process.env.REMOTE_SYNC_URL || "",
  REMOTE_SYNC_TOKEN: process.env.REMOTE_SYNC_TOKEN || "",
};

/**
 * Process the sync queue - main entry point for sync processing
 * This should be called periodically (e.g., via cron or background worker)
 */
export async function processSyncQueue(): Promise<{
  processed: number;
  failed: number;
  pending: number;
}> {
  try {
    // Get pending sync items
    const pendingItems = await db
      .select()
      .from(syncQueue)
      .where(
        and(
          eq(syncQueue.status, "pending"),
          lte(syncQueue.retries, SYNC_CONFIG.MAX_RETRIES)
        )
      )
      .orderBy(syncQueue.createdAt)
      .limit(SYNC_CONFIG.BATCH_SIZE);

    if (pendingItems.length === 0) {
      // Check for retry items
      const retryItems = await db
        .select()
        .from(syncQueue)
        .where(
          and(
            eq(syncQueue.status, "retry"),
            lte(syncQueue.retries, SYNC_CONFIG.MAX_RETRIES)
          )
        )
        .orderBy(syncQueue.createdAt)
        .limit(SYNC_CONFIG.BATCH_SIZE);

      if (retryItems.length === 0) {
        return { processed: 0, failed: 0, pending: 0 };
      }

      // Process retry items
      return await processSyncItems(retryItems);
    }

    // Process pending items
    return await processSyncItems(pendingItems);
  } catch (error) {
    console.error("Error processing sync queue:", error);
    throw error;
  }
}

/**
 * Process a batch of sync items
 */
async function processSyncItems(items: typeof syncQueue.$inferSelect[]): Promise<{
  processed: number;
  failed: number;
  pending: number;
}> {
  let processed = 0;
  let failed = 0;

  for (const item of items) {
    try {
      await processSyncItem(item);

      // Mark as completed
      await db
        .update(syncQueue)
        .set({
          status: "completed",
          processedAt: Date.now(),
        })
        .where(eq(syncQueue.id, item.id));

      processed++;
    } catch (error) {
      console.error(`Failed to process sync item ${item.id}:`, error);

      // Increment retry count
      const newRetries = item.retries + 1;

      if (newRetries >= SYNC_CONFIG.MAX_RETRIES) {
        // Mark as dead
        await db
          .update(syncQueue)
          .set({
            status: "dead",
            processedAt: Date.now(),
          })
          .where(eq(syncQueue.id, item.id));
      } else {
        // Schedule for retry with exponential backoff
        await db
          .update(syncQueue)
          .set({
            status: "retry",
            retries: newRetries,
          })
          .where(eq(syncQueue.id, item.id));
      }

      failed++;
    }
  }

  // Get remaining pending count
  const pendingCount = await db
    .select({ count: sql`COUNT(*)` })
    .from(syncQueue)
    .where(
      and(
        eq(syncQueue.status, "pending"),
        lte(syncQueue.retries, SYNC_CONFIG.MAX_RETRIES)
      )
    )
    .then(res => Number(res[0]?.count ?? 0));

  return { processed, failed, pending: pendingCount };
}

/**
 * Process a single sync item
 */
async function processSyncItem(item: typeof syncQueue.$inferSelect): Promise<void> {
  const payload = JSON.parse(item.payload);

  switch (item.entity) {
    case "ledger":
      await syncLedger(item.action, payload);
      break;
    case "voucher":
      await syncVoucher(item.action, payload);
      break;
    case "inventory_item":
      await syncInventoryItem(item.action, payload);
      break;
    case "company":
      await syncCompany(item.action, payload);
      break;
    default:
      throw new Error(`Unknown entity type for sync: ${item.entity}`);
  }
}

/**
 * Sync ledger operations
 */
async function syncLedger(action: string, payload: any): Promise<void> {
  switch (action) {
    case "CREATE":
      await db.insert(ledgers).values(payload);
      break;
    case "UPDATE":
      await db
        .update(ledgers)
        .set(payload)
        .where(eq(ledgers.id, payload.id));
      break;
    case "DELETE":
      await db
        .update(ledgers)
        .set({ isActive: false })
        .where(eq(ledgers.id, payload.id));
      break;
    default:
      throw new Error(`Unknown ledger action: ${action}`);
  }
}

/**
 * Sync voucher operations with conflict resolution
 */
async function syncVoucher(action: string, payload: any): Promise<void> {
  // For vouchers, we need to handle double-entry and inventory movements
  switch (action) {
    case "CREATE":
      await db.transaction(async (tx) => {
        // Insert voucher
        const [voucher] = await tx
          .insert(vouchers)
          .values({
            id: payload.id,
            companyId: payload.companyId,
            type: payload.type,
            number: payload.number,
            date: payload.date,
            partyLedgerId: payload.partyLedgerId,
            reference: payload.reference,
            narration: payload.narration,
            totalAmount: payload.totalAmount,
            gstTotal: payload.gstTotal,
            grandTotal: payload.grandTotal,
            status: payload.status,
            transportName: payload.transportName,
            lrNumber: payload.lrNumber,
            dispatchDate: payload.dispatchDate,
            freightAmount: payload.freightAmount,
            createdAt: payload.createdAt,
            updatedAt: payload.updatedAt,
          })
          .returning();

        // Insert voucher entries
        if (payload.entries && Array.isArray(payload.entries)) {
          for (const entry of payload.entries) {
            await tx
              .insert(voucherEntries)
              .values({
                id: entry.id,
                voucherId: voucher.id,
                ledgerId: entry.ledgerId,
                type: entry.type,
                amount: entry.amount,
                inventoryItemId: entry.inventoryItemId,
                quantity: entry.quantity,
                rate: entry.rate,
                narration: entry.narration,
              });
          }
        }

        // Handle inventory movements if applicable
        if (payload.stockMovements && Array.isArray(payload.stockMovements)) {
          for (const movement of payload.stockMovements) {
            await tx
              .insert(stockMovements)
              .values({
                id: movement.id,
                itemId: movement.itemId,
                voucherId: voucher.id,
                type: movement.type,
                quantity: movement.quantity,
                rate: movement.rate,
                date: movement.date,
                narration: movement.narration,
                createdAt: movement.createdAt,
              });
          }
        }
      });
      break;
    case "UPDATE":
      // For updates, we need to check for conflicts
      // Last-write-wins: if remote version is newer, apply it
      const existing = await db
        .select()
        .from(vouchers)
        .where(eq(vouchers.id, payload.id))
        .limit(1);

      if (existing[0]) {
        const existingTimestamp = existing[0].updatedAt || 0;
        const incomingTimestamp = payload.updatedAt || 0;

        // Only update if incoming is newer or equal (last-write-wins)
        if (incomingTimestamp >= existingTimestamp) {
          await db
            .update(vouchers)
            .set(payload)
            .where(eq(vouchers.id, payload.id));
        }
      }
      break;
    case "DELETE":
      // Soft delete for vouchers (set status to cancelled)
      await db
        .update(vouchers)
        .set({ status: "cancelled" })
        .where(eq(vouchers.id, payload.id));
      break;
    default:
      throw new Error(`Unknown voucher action: ${action}`);
  }
}

/**
 * Sync inventory item operations
 */
async function syncInventoryItem(action: string, payload: any): Promise<void> {
  switch (action) {
    case "CREATE":
      await db.insert(inventoryItems).values(payload);
      break;
    case "UPDATE":
      await db
        .update(inventoryItems)
        .set(payload)
        .where(eq(inventoryItems.id, payload.id));
      break;
    case "DELETE":
      await db
        .update(inventoryItems)
        .set({ isActive: false })
        .where(eq(inventoryItems.id, payload.id));
      break;
    default:
      throw new Error(`Unknown inventory item action: ${action}`);
  }
}

/**
 * Sync company operations
 */
async function syncCompany(action: string, payload: any): Promise<void> {
  switch (action) {
    case "CREATE":
      await db.insert(companies).values(payload);
      break;
    case "UPDATE":
      await db
        .update(companies)
        .set(payload)
        .where(eq(companies.id, payload.id));
      break;
    case "DELETE":
      // Companies typically shouldn't be deleted, but if needed:
      await db
        .delete(companies)
        .where(eq(companies.id, payload.id));
      break;
    default:
      throw new Error(`Unknown company action: ${action}`);
  }
}

/**
 * Add an item to the sync queue
 */
export async function queueSync(
  entity: string,
  action: string,
  payload: any,
  deviceId: string = "unknown"
): Promise<void> {
  await db.insert(syncQueue).values({
    id: `${entity}-${action}-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)}`,
    entity,
    action,
    payload: JSON.stringify(payload),
    status: "pending",
    retries: 0,
    createdAt: Date.now(),
  });
}

/**
 * Get sync status for UI
 */
export async function getSyncStatus(): Promise<{
  pending: number;
  retry: number;
  completed: number;
  dead: number;
  lastSynced: number | null;
}> {
  const [
    pendingResult,
    retryResult,
    completedResult,
    deadResult,
    lastSyncedResult
  ] = await Promise.all([
    db
      .select({ count: sql`COUNT(*)` })
      .from(syncQueue)
      .where(eq(syncQueue.status, "pending"))
      .then(res => Number(res[0]?.count ?? 0)),
    db
      .select({ count: sql`COUNT(*)` })
      .from(syncQueue)
      .where(eq(syncQueue.status, "retry"))
      .then(res => Number(res[0]?.count ?? 0)),
    db
      .select({ count: sql`COUNT(*)` })
      .from(syncQueue)
      .where(eq(syncQueue.status, "completed"))
      .then(res => Number(res[0]?.count ?? 0)),
    db
      .select({ count: sql`COUNT(*)` })
      .from(syncQueue)
      .where(eq(syncQueue.status, "dead"))
      .then(res => Number(res[0]?.count ?? 0)),
    db
      .select({ maxTime: sql`MAX(processedAt)` })
      .from(syncQueue)
      .where(in(syncQueue.status, ["completed", "dead"]))
      .then(res => {
        const time = res[0]?.maxTime;
        return time ? Number(time) : null;
      })
  ]);

  return {
    pending: pendingResult,
    retry: retryResult,
    completed: completedResult,
    dead: deadResult,
    lastSynced: lastSyncedResult,
  };
}

/**
 * Helper for SQL IN clause
 */
function in<T>(column: T, values: readonly unknown[]): SQL<A> {
  // Simplified implementation - in real code you'd use drizzle's sql helper
  return sql`${column} IN (${values.map(() => "?").join(", ")})` as unknown as SQL<A>;
}

// Initialize sync engine
export const syncEngine = {
  processSyncQueue,
  queueSync,
  getSyncStatus,
};
