"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function useERPShortcuts() {
  const router = useRouter();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const active = document.activeElement;
      const isInputFocused =
        active instanceof HTMLInputElement ||
        active instanceof HTMLTextAreaElement ||
        active instanceof HTMLSelectElement ||
        (active instanceof HTMLElement && active.isContentEditable);

      // Ctrl+K or Alt+G — Command Palette (Tally Go To)
      if ((e.ctrlKey && e.key.toLowerCase() === "k") || (e.altKey && e.key.toLowerCase() === "g")) {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent("erp:command-palette"));
        return;
      }

      // Ctrl+S — Save current form
      if (e.ctrlKey && e.key === "s") {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent("erp:save"));
        return;
      }

      // Only fire F-key shortcuts when not in a text input
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
      }

      // Alt+C — Create Ledger
      if (e.altKey && e.key === "c") {
        e.preventDefault();
        router.push("/ledgers/new");
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [router]);
}
