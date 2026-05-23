"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { getSyncQueueCountAction, processSyncQueueAction } from "@/app/(erp)/actions/sync-actions";

export interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  lastSyncedAt: Date | null;
}

const SYNC_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const mountedRef = useRef(true);
  const syncIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /** Fetch real pending count from DB sync queue */
  const refreshPendingCount = useCallback(async () => {
    try {
      const count = await getSyncQueueCountAction();
      if (mountedRef.current) setPendingCount(count);
    } catch {
      // ignore
    }
  }, []);

  /** Process the sync queue in background */
  const triggerSync = useCallback(async () => {
    if (!navigator.onLine || isSyncing) return;
    if (!mountedRef.current) return;

    setIsSyncing(true);
    try {
      const result = await processSyncQueueAction();

      if (!mountedRef.current) return;

      setPendingCount(result.remaining);
      setLastSyncedAt(new Date());

      if (result.processed > 0 || result.remaining === 0) {
        window.dispatchEvent(
          new CustomEvent("erp:notify", {
            detail: {
              title: result.remaining === 0 ? "Sync Complete" : "Partial Sync",
              message:
                result.remaining === 0
                  ? `All ${result.processed} record${result.processed !== 1 ? "s" : ""} synced successfully.`
                  : `Synced ${result.processed}, ${result.remaining} still pending.`,
              type: result.remaining === 0 ? "success" : "warning",
            },
          })
        );
      }
    } catch (err) {
      console.error("[useOfflineSync] Sync failed:", err);
      window.dispatchEvent(
        new CustomEvent("erp:notify", {
          detail: {
            title: "Sync Failed",
            message: "Could not sync with cloud. Will retry automatically.",
            type: "error",
          },
        })
      );
    } finally {
      if (mountedRef.current) setIsSyncing(false);
    }
  }, [isSyncing]);

  useEffect(() => {
    mountedRef.current = true;

    if (typeof window === "undefined") return;

    setIsOnline(navigator.onLine);
    refreshPendingCount();

    const handleOnline = () => {
      if (mountedRef.current) setIsOnline(true);
      // Auto-trigger sync when network returns
      triggerSync();
    };

    const handleOffline = () => {
      if (mountedRef.current) setIsOnline(false);
    };

    // Listen for external sync trigger
    const handleSyncRequest = () => {
      triggerSync();
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("erp:sync-request", handleSyncRequest);

    // Set up interval sync (every 5 min when online)
    syncIntervalRef.current = setInterval(() => {
      if (navigator.onLine) {
        refreshPendingCount();
        triggerSync();
      }
    }, SYNC_INTERVAL_MS);

    return () => {
      mountedRef.current = false;
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("erp:sync-request", handleSyncRequest);
      if (syncIntervalRef.current) clearInterval(syncIntervalRef.current);
    };
  }, [refreshPendingCount, triggerSync]);

  return {
    isOnline,
    isSyncing,
    pendingCount,
    lastSyncedAt,
    syncNow: triggerSync,
    refreshPendingCount,
  };
}
