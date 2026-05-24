export type ERPShortcut = {
  key: string;
  label: string;
  description: string;
  route?: string;
  eventName?: string;
};

export const ERP_NAVIGATION_SHORTCUTS: readonly ERPShortcut[] = [
  { key: "F4", label: "Contra", description: "Bank and cash transfers", route: "/vouchers/contra" },
  { key: "F5", label: "Payment", description: "Record outgoing cash", route: "/vouchers/payment" },
  { key: "F6", label: "Receipt", description: "Record incoming cash", route: "/vouchers/receipt" },
  { key: "F7", label: "Journal", description: "Adjustment bookings", route: "/vouchers/journal" },
  { key: "F8", label: "Sales", description: "Record sales invoice", route: "/vouchers/sales" },
  { key: "F9", label: "Purchase", description: "Record supplier bill", route: "/vouchers/purchase" },
  { key: "F10", label: "Challan", description: "Prepare delivery challan", route: "/vouchers/challan" },
  { key: "F11", label: "POS", description: "Open quick billing desk", route: "/pos" },
  { key: "F12", label: "Dashboard", description: "Return to dashboard", route: "/dashboard" },
] as const;

export const ERP_ACTION_SHORTCUTS: readonly ERPShortcut[] = [
  { key: "Alt+C", label: "Create Ledger", description: "Quick ledger setup", route: "/ledgers/new" },
  { key: "Alt+I", label: "Create Item", description: "Add stock item", route: "/inventory/new" },
  { key: "Alt+G", label: "Go To / Search", description: "Open command center", eventName: "erp:command-palette" },
  { key: "Alt+A", label: "Add Row", description: "Append row in active voucher form", eventName: "erp:add-row" },
  { key: "Ctrl+S", label: "Save Form", description: "Submit active form", eventName: "erp:save" },
] as const;

export const ERP_SHORTCUTS: readonly ERPShortcut[] = [...ERP_NAVIGATION_SHORTCUTS, ...ERP_ACTION_SHORTCUTS];

export function eventToShortcutKey(event: KeyboardEvent): string {
  const key = event.key.length === 1 ? event.key.toUpperCase() : event.key;
  const parts: string[] = [];
  if (event.ctrlKey || event.metaKey) parts.push("Ctrl");
  if (event.altKey) parts.push("Alt");
  if (event.shiftKey && !key.startsWith("F")) parts.push("Shift");
  parts.push(key);
  return parts.join("+");
}

export function isEditableShortcutTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName.toLowerCase();
  return tag === "input" || tag === "textarea" || tag === "select" || target.isContentEditable;
}
