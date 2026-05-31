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
  { key: "Alt+C", label: "Create On-The-Fly", description: "Create Ledger/Item from select box", eventName: "erp:create-on-the-fly" },
  { key: "Ctrl+Enter", label: "Alter On-The-Fly", description: "Alter Ledger/Item from select box", eventName: "erp:alter-on-the-fly" },
  { key: "Ctrl+H", label: "Change Mode", description: "Toggle Voucher / Invoice mode", eventName: "erp:switch-voucher-mode" },
  { key: "Ctrl+D", label: "Delete Row", description: "Remove active line item", eventName: "erp:delete-row" },
  { key: "Ctrl+A", label: "Accept / Save", description: "Save voucher / active form", eventName: "erp:save" },
  { key: "Ctrl+Q", label: "Quit Screen", description: "Discard changes & exit", eventName: "erp:quit" },
  { key: "Alt+F1", label: "Detailed View", description: "Toggle nested ledger list", eventName: "erp:detailed-view" },
  { key: "PgUp", label: "Prev Voucher", description: "Review previous entry", eventName: "erp:prev-voucher" },
  { key: "PgDn", label: "Next Voucher", description: "Review next entry", eventName: "erp:next-voucher" },
  { key: "Alt+A", label: "Add Row", description: "Append row in active voucher", eventName: "erp:add-row" },
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
