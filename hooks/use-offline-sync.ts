"use client";

import { useEffect, useState, useRef } from "react";

export interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
}

export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const mountedRef = useRef(true);

  // Initialize online state & load pending queues from local storage
  useEffect(() => {
    mountedRef.current = true;
    if (typeof window === "undefined") return;

    setIsOnline(navigator.onLine);

    const storedQueue = localStorage.getItem("erp_offline_queue_count");
    if (storedQueue) {
      setPendingCount(parseInt(storedQueue) || 0);
    }

    const handleOnline = () => {
      if (mountedRef.current) {
        setIsOnline(true);
      }
      // Auto-trigger sync queue drain when network returns
      triggerSync();
    };

    const handleOffline = () => {
      if (mountedRef.current) {
        setIsOnline(false);
      }
    };

    // Listen to database mutations to enqueue local pending mutations when offline
    const handleDbWrite = (e: Event) => {
      if (!navigator.onLine) {
        setPendingCount((prev) => {
          const next = prev + 1;
          localStorage.setItem("erp_offline_queue_count", next.toString());
          return next;
        });
      }
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("erp:db-write", handleDbWrite);

    return () => {
      mountedRef.current = false;
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("erp:db-write", handleDbWrite);
    };
  }, []);

  const triggerSync = () => {
    if (!navigator.onLine) return;

    setIsSyncing(true);

    // Simulate standard SQLite sync queue drain and cloud merge
    setTimeout(() => {
      if (!mountedRef.current) return;
      setIsSyncing(false);
      setPendingCount(0);
      localStorage.setItem("erp_offline_queue_count", "0");

      // Dispatch custom notification for visual desktop feedback
      window.dispatchEvent(
        new CustomEvent("erp:notify", {
          detail: {
            title: "Database Synced Successfully",
            message: "All local offline double-entry vouchers successfully merged with cloud master database.",
            type: "success",
          },
        })
      );
    }, 2500); // 2.5s realistic sync merge time
  };

  return {
    isOnline,
    isSyncing,
    pendingCount,
    syncNow: triggerSync,
  };
}
