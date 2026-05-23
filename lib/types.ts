// Shared TypeScript types for the ERP system

export type VoucherType =
  | "sales"
  | "purchase"
  | "payment"
  | "receipt"
  | "contra"
  | "journal"
  | "challan";

export type BalanceType = "dr" | "cr";

export type LedgerGroup =
  | "cash"
  | "bank"
  | "sundry_debtors"
  | "sundry_creditors"
  | "sales"
  | "purchase"
  | "expenses"
  | "capital"
  | "duties_taxes"
  | "loans"
  | "fixed_assets"
  | "current_assets"
  | "current_liabilities";

export type VoucherStatus = "draft" | "posted" | "cancelled";

export type BusinessType =
  | "wholesale_"
  | "textile_retail"
  | "garment_store"
  | "distributor"
  | "mixed_inventory"
  | "custom";

export const LEDGER_GROUP_LABELS: Record<LedgerGroup, string> = {
  cash: "Cash",
  bank: "Bank Accounts",
  sundry_debtors: "Sundry Debtors",
  sundry_creditors: "Sundry Creditors",
  sales: "Sales Accounts",
  purchase: "Purchase Accounts",
  expenses: "Indirect Expenses",
  capital: "Capital Account",
  duties_taxes: "Duties & Taxes",
  loans: "Loans & Liabilities",
  fixed_assets: "Fixed Assets",
  current_assets: "Current Assets",
  current_liabilities: "Current Liabilities",
};

export const VOUCHER_TYPE_LABELS: Record<VoucherType, string> = {
  sales: "Sales Voucher (F8)",
  purchase: "Purchase Voucher (F9)",
  payment: "Payment Voucher (F5)",
  receipt: "Receipt Voucher (F6)",
  contra: "Contra Voucher (F4)",
  journal: "Journal Voucher (F7)",
  challan: "Delivery Challan (F10)",
};

export const INVENTORY_CATEGORIES = [
  "Office Furniture",
  "Electronics & Tech",
  "Computer Accessories",
  "Storage Devices",
  "Smart Home",
  "Office Security",
  "Office Supplies",
  "Apparel & Clothing",
  "General Stock Items",
  "Custom...",
] as const;

export type InventoryItemCategory = string;
export type InventoryCategory = string;

export interface InventoryItem {
  id: string;
  companyId: string | null;
  name: string;
  category: string;
  designNo: string | null;
  color: string | null;
  purchaseRate: number;
  saleRate: number;
  gstPercent: number;
  rackLocation: string | null;
  stockQuantity: number;
  unit: string;
  hsnCode: string | null;
  barcode: string | null;
  reorderLevel: number | null;
  createdAt: number;
  updatedAt: number;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(date: number | Date): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

export function getCurrentFiscalYear(): string {
  const now = new Date();
  const year = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
  return `${year}-${String(year + 1).slice(2)}`;
}
