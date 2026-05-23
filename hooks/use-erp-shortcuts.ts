"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function useERPShortcuts() {
  const router = useRouter();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const active = document.activeElement;
      const tag = active?.tagName?.toLowerCase() ?? "";
      const isInputFocused =
        tag === "input" ||
        tag === "textarea" ||
        tag === "select" ||
        (active instanceof HTMLElement && active.isContentEditable);

      // ── Global shortcuts (always fire, even in inputs) ──────────────────────

      // Ctrl+K or Alt+G — Command Palette
      if (
        (e.ctrlKey && e.key.toLowerCase() === "k") ||
        (e.altKey && e.key.toLowerCase() === "g")
      ) {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent("erp:command-palette"));
        return;
      }

      // Ctrl+S — Save current form (broadcast, individual forms listen)
      if (e.ctrlKey && e.key.toLowerCase() === "s") {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent("erp:save"));
        return;
      }

      // Escape — close any open modal/panel (broadcast)
      if (e.key === "Escape") {
        window.dispatchEvent(new CustomEvent("erp:escape"));
        return;
      }

      // ── Navigation shortcuts (blocked when input is focused) ─────────────────
      if (isInputFocused) return;

      switch (e.key) {
        case "F4":
          e.preventDefault();
          router.push("/vouchers/contra");
          break;
        case "F5":
          e.preventDefault();
          router.push("/vouchers/payment");
          break;
        case "F6":
          e.preventDefault();
          router.push("/vouchers/receipt");
          break;
        case "F7":
          e.preventDefault();
          router.push("/vouchers/journal");
          break;
        case "F8":
          e.preventDefault();
          router.push("/vouchers/sales");
          break;
        case "F9":
          e.preventDefault();
          router.push("/vouchers/purchase");
          break;
        case "F10":
          e.preventDefault();
          router.push("/vouchers/challan");
          break;
        case "F11":
          e.preventDefault();
          router.push("/pos");
          break;
        case "F12":
          e.preventDefault();
          router.push("/dashboard");
          break;
      }

      // Alt+C — Create Ledger (case-insensitive)
      if (e.altKey && e.key.toLowerCase() === "c") {
        e.preventDefault();
        router.push("/ledgers/new");
        return;
      }

      // Alt+I — Create Inventory Item
      if (e.altKey && e.key.toLowerCase() === "i") {
        e.preventDefault();
        router.push("/inventory/new");
        return;
      }

      // Alt+A — Add row (broadcast to active form)
      if (e.altKey && e.key.toLowerCase() === "a") {
        // Handled by individual forms
        return;
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [router]);
}
