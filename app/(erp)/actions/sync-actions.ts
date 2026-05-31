"use server";

import { db, syncQueue, eq, and } from "@/lib/database";
import { randomUUID } from "crypto";
import { getSession } from "@/lib/auth";

/**
 * Get current count of pending sync records in the queue.
 */
export async function getSyncQueueCountAction(): Promise<number> {
  try {
    const rows = await db
      .select({ id: syncQueue.id })
      .from(syncQueue)
      .where(eq(syncQueue.status, "pending"));
    return rows.length;
  } catch {
    return 0;
  }
}

/**
 * Enqueue a record for cloud sync.
 * Called internally after every write operation when sync is enabled.
 */
export async function enqueueSyncRecordAction(
  entity: string,
  action: string,
  payload: Record<string, unknown>
): Promise<void> {
  try {
    const isEnabled = process.env.REMOTE_SYNC_ENABLED === "true";
    if (!isEnabled) return; // only queue when sync is configured

    await db.insert(syncQueue).values({
      id: randomUUID(),
      entity,
      action,
      payload: JSON.stringify(payload),
      status: "pending",
      retries: 0,
    });
  } catch (err) {
    console.error("[SyncQueue] Failed to enqueue record:", err);
  }
}

/**
 * Process the sync queue — drain pending records to remote cloud.
 * Returns { processed, failed, remaining }.
 */
export async function processSyncQueueAction(): Promise<{
  processed: number;
  failed: number;
  remaining: number;
}> {
  const session = await getSession();
  if (!session) return { processed: 0, failed: 0, remaining: 0 };

  const remoteUrl = process.env.REMOTE_SYNC_URL;
  const remoteToken = process.env.REMOTE_SYNC_TOKEN;
  const isEnabled = process.env.REMOTE_SYNC_ENABLED === "true";

  if (!isEnabled || !remoteUrl) {
    // Sync not configured — mark all pending as completed (local-only mode)
    try {
      const pending = await db
        .select()
        .from(syncQueue)
        .where(eq(syncQueue.status, "pending"));

      for (const record of pending) {
        await db
          .update(syncQueue)
          .set({ status: "completed", processedAt: Date.now() })
          .where(eq(syncQueue.id, record.id));
      }
      return { processed: pending.length, failed: 0, remaining: 0 };
    } catch {
      return { processed: 0, failed: 0, remaining: 0 };
    }
  }

  // Real cloud sync
  const pending = await db
    .select()
    .from(syncQueue)
    .where(eq(syncQueue.status, "pending"));

  let processed = 0;
  let failed = 0;

  for (const record of pending) {
    try {
      const res = await fetch(`${remoteUrl}/api/sync`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${remoteToken || ""}`,
        },
        body: JSON.stringify({
          entity: record.entity,
          action: record.action,
          payload: JSON.parse(record.payload),
        }),
        signal: AbortSignal.timeout(10000), // 10s timeout
      });

      if (res.ok) {
        await db
          .update(syncQueue)
          .set({ status: "completed", processedAt: Date.now() })
          .where(eq(syncQueue.id, record.id));
        processed++;
      } else if (res.status === 409) {
        await db
          .update(syncQueue)
          .set({ status: "conflict" })
          .where(eq(syncQueue.id, record.id));
        failed++;
      } else {
        // Increment retries, mark dead after 3
        const newRetries = (record.retries ?? 0) + 1;
        await db
          .update(syncQueue)
          .set({
            retries: newRetries,
            status: newRetries >= 3 ? "dead" : "retry",
          })
          .where(eq(syncQueue.id, record.id));
        failed++;
      }
    } catch {
      const newRetries = (record.retries ?? 0) + 1;
      await db
        .update(syncQueue)
        .set({
          retries: newRetries,
          status: newRetries >= 3 ? "dead" : "retry",
        })
        .where(eq(syncQueue.id, record.id));
      failed++;
    }
  }

  const remaining = await db
    .select({ id: syncQueue.id })
    .from(syncQueue)
    .where(eq(syncQueue.status, "pending"));

  return { processed, failed, remaining: remaining.length };
}

/**
 * Fetch all sync conflicts logged in SQLite.
 */
export async function getSyncConflictsAction(): Promise<any[]> {
  try {
    const rows = await db
      .select()
      .from(syncQueue)
      .where(eq(syncQueue.status, "conflict"));
    return rows;
  } catch (err) {
    console.error("[Sync] Failed to fetch conflicts:", err);
    return [];
  }
}

/**
 * Resolve a sync conflict.
 * - local: force retry by setting status back to 'pending'
 * - server: accept cloud state by marking as 'completed'
 */
export async function resolveConflictAction(
  id: string,
  resolution: "local" | "server"
): Promise<{ success: boolean; error?: string }> {
  try {
    const newStatus = resolution === "local" ? "pending" : "completed";
    await db
      .update(syncQueue)
      .set({
        status: newStatus,
        retries: 0,
        processedAt: resolution === "server" ? Date.now() : null
      })
      .where(eq(syncQueue.id, id));
    return { success: true };
  } catch (err) {
    console.error("[Sync] Failed to resolve conflict:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to resolve conflict"
    };
  }
}

