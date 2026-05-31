"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ERP_ACTION_SHORTCUTS,
  ERP_NAVIGATION_SHORTCUTS,
  eventToShortcutKey,
  isEditableShortcutTarget,
} from "@/lib/erp-shortcuts";

function submitActiveForm() {
  const active = document.activeElement;
  const focusedForm = active instanceof HTMLElement ? active.closest("form") : null;

  if (focusedForm) {
    focusedForm.requestSubmit();
    return true;
  }

  const visibleForms = Array.from(document.querySelectorAll("form")).filter((form) => {
    const rect = form.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  });

  if (visibleForms.length === 1) {
    visibleForms[0].requestSubmit();
    return true;
  }

  return false;
}

export function useERPShortcuts() {
  const router = useRouter();

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const shortcutKey = eventToShortcutKey(event);

      // --- CRITICAL VOUCHER & DIALOG ACTION SHORTCUTS (Bypass editable check) ---
      if (shortcutKey === "Ctrl+K" || shortcutKey === "Alt+G") {
        event.preventDefault();
        window.dispatchEvent(new CustomEvent("erp:command-palette"));
        return;
      }

      if (shortcutKey === "Ctrl+S" || shortcutKey === "Ctrl+A") {
        event.preventDefault();
        window.dispatchEvent(new CustomEvent("erp:save"));
        submitActiveForm();
        return;
      }

      if (shortcutKey === "Ctrl+Q") {
        event.preventDefault();
        window.dispatchEvent(new CustomEvent("erp:quit"));
        return;
      }

      if (shortcutKey === "Alt+C") {
        event.preventDefault();
        window.dispatchEvent(new CustomEvent("erp:create-on-the-fly"));
        return;
      }

      if (shortcutKey === "Ctrl+Enter") {
        event.preventDefault();
        window.dispatchEvent(new CustomEvent("erp:alter-on-the-fly"));
        return;
      }

      if (shortcutKey === "Ctrl+H") {
        event.preventDefault();
        window.dispatchEvent(new CustomEvent("erp:switch-voucher-mode"));
        return;
      }

      if (shortcutKey === "Ctrl+D") {
        event.preventDefault();
        window.dispatchEvent(new CustomEvent("erp:delete-row"));
        return;
      }

      if (shortcutKey === "Alt+A") {
        event.preventDefault();
        window.dispatchEvent(new CustomEvent("erp:add-row"));
        return;
      }

      if (shortcutKey === "Alt+F1") {
        event.preventDefault();
        window.dispatchEvent(new CustomEvent("erp:detailed-view"));
        return;
      }

      if (shortcutKey === "PageUp" || shortcutKey === "PgUp") {
        event.preventDefault();
        window.dispatchEvent(new CustomEvent("erp:prev-voucher"));
        return;
      }

      if (shortcutKey === "PageDown" || shortcutKey === "PgDn") {
        event.preventDefault();
        window.dispatchEvent(new CustomEvent("erp:next-voucher"));
        return;
      }

      if (event.key === "Escape") {
        window.dispatchEvent(new CustomEvent("erp:escape"));
        return;
      }

      // Block normal navigation shortcuts when typing in inputs/textareas
      if (isEditableShortcutTarget(document.activeElement)) return;

      const navShortcut = ERP_NAVIGATION_SHORTCUTS.find((shortcut) => shortcut.key === shortcutKey);
      if (navShortcut?.route) {
        event.preventDefault();
        
        // Dynamic in-state voucher switching (Tally style)
        const type = navShortcut.route.split("/").pop(); // e.g. "sales", "purchase"
        const customEvent = new CustomEvent("erp:switch-voucher-type", {
          detail: type,
          cancelable: true,
        });
        
        const wasHandledByForm = !window.dispatchEvent(customEvent);
        if (!wasHandledByForm) {
          router.push(navShortcut.route);
        }
        return;
      }

      const actionShortcut = ERP_ACTION_SHORTCUTS.find((shortcut) => shortcut.key === shortcutKey);
      if (actionShortcut?.route) {
        event.preventDefault();
        router.push(actionShortcut.route);
      } else if (actionShortcut?.eventName) {
        event.preventDefault();
        window.dispatchEvent(new CustomEvent(actionShortcut.eventName));
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [router]);
}
