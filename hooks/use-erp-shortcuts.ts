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

      if (shortcutKey === "Ctrl+K" || shortcutKey === "Alt+G") {
        event.preventDefault();
        window.dispatchEvent(new CustomEvent("erp:command-palette"));
        return;
      }

      if (shortcutKey === "Ctrl+S") {
        event.preventDefault();
        window.dispatchEvent(new CustomEvent("erp:save"));
        submitActiveForm();
        return;
      }

      if (shortcutKey === "Alt+A") {
        event.preventDefault();
        window.dispatchEvent(new CustomEvent("erp:add-row"));
        return;
      }

      if (event.key === "Escape") {
        window.dispatchEvent(new CustomEvent("erp:escape"));
        return;
      }

      if (isEditableShortcutTarget(document.activeElement)) return;

      const navShortcut = ERP_NAVIGATION_SHORTCUTS.find((shortcut) => shortcut.key === shortcutKey);
      if (navShortcut?.route) {
        event.preventDefault();
        router.push(navShortcut.route);
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
