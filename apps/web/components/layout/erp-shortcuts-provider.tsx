"use client";

import { useERPShortcuts } from "@/hooks/use-erp-shortcuts";

export function ERPShortcutsProvider() {
  useERPShortcuts();
  return null;
}
