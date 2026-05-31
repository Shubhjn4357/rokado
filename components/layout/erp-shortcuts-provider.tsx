"use client";

import { useERPShortcuts } from "@/hooks/use-erp-shortcuts";
import { useSpatialNavigation } from "@/hooks/use-spatial-navigation";

export function ERPShortcutsProvider() {
  useERPShortcuts();
  useSpatialNavigation();
  return null;
}
