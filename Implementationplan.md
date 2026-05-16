# 🏢 Shree Saree House — Complete ERP System Implementation Plan

> Built for Indian wholesale textile businesses. Inspired by Tally, polished like Linear, reliable like banking software.
> Following /system-build rules: TypeScript, Tailwind, shadcn/ui, Lucide, Next.js Server Components, real data only, no `any`, dark/light mode.

---

## Current State ✅

| Module | Status | Notes |
|---|---|---|
| Monorepo (Turborepo) | ✅ Done | `apps/web` + `packages/database` |
| Database schema | ✅ Done | companies, ledgers, vouchers, inventory, audit log |
| DB seeded | ✅ Done | 1 company, 18 ledgers, 10 inventory items |
| ERP shell layout | ✅ Done | Sidebar + TopBar |
| Dashboard | ✅ Done | Real metrics, debtors, low stock |
| Ledger list + detail | ✅ Done | Search, filter, transaction history |
| Voucher entry | ✅ Done | Double-entry, balanced validation, atomic TX |
| Inventory list | ✅ Done | Table + grid view, stock status |
| POS Billing | ✅ Done | Cart, search, GST calc |
| TypeScript | ✅ Clean | `pnpm check-types` passes |
| Build | ✅ Passing | All 6 routes |

---

## Phase 1 — ERP Core Completion

### 1.1 Command Palette (Ctrl+K)
**File:** `components/command-palette/command-palette.tsx`  
**Page Integration:** `app/(erp)/layout.tsx` ✅ COMPLETED

- Global search for ledgers, vouchers, inventory
- Keyboard navigation (↑↓ Enter Esc)
- Quick actions: New Voucher (F8/F9), Create Ledger (Alt+C), Open Reports
- `cmdk` library or custom implementation with shadcn Command component

### 1.2 Global Keyboard Shortcuts
**File:** `hooks/use-erp-shortcuts.ts` ✅ COMPLETED

| Key | Action |
|---|---|
| `Ctrl+K` | Command palette |
| `F8` | New Sales Voucher |
| `F9` | New Purchase Voucher |
| `F5` | New Payment Voucher |
| `F6` | New Receipt Voucher |
| `F7` | New Journal Voucher |
| `F4` | New Contra Voucher |
| `Alt+C` | Create Ledger |
| `Ctrl+S` | Save current form |

### 1.3 New Ledger Form (Create/Edit)
**Files:**
- `app/(erp)/ledgers/new/page.tsx` — server page ✅ COMPLETED
- `components/ledgers/ledger-form.tsx` — client form ✅ COMPLETED
- `app/(erp)/ledgers/actions.ts` — server actions ✅ COMPLETED

Fields: Name, Group (dropdown), GSTIN, PAN, Phone, Address, Credit Limit, Opening Balance, Balance Type

### 1.4 Voucher Type Shortcut Pages
**Files:**
- `app/(erp)/vouchers/sales/page.tsx` ✅ COMPLETED
- `app/(erp)/vouchers/purchase/page.tsx` ✅ COMPLETED
- `app/(erp)/vouchers/payment/page.tsx` ✅ COMPLETED
- `app/(erp)/vouchers/receipt/page.tsx` ✅ COMPLETED
- `app/(erp)/vouchers/journal/page.tsx` ✅ COMPLETED
- `app/(erp)/vouchers/contra/page.tsx` ✅ COMPLETED

Each pre-selects type and opens the entry form directly.

---

## Phase 2 — POS System Enhancement

### 2.1 POS Billing — Save & Post to Ledger
**File:** `app/(erp)/pos/actions.ts` ✅ COMPLETED

On "Save & Print Bill":
1. Create Sales Voucher (double-entry)
2. Customer Dr → Sales Account Cr
3. GST Dr → CGST/SGST/IGST Cr
4. Reduce stock quantity in `inventory_items`
5. Insert stock movement record
6. Generate bill PDF / print receipt

### 2.2 POS Customer Selection
- Dropdown to select existing debtor ledger or "Walk-in Customer"
- Shows outstanding balance on selection (credit warning if overdue)
- New customer quick-create inline

### 2.3 POS Discount & Payment Mode
- Per-item discount % field
- Bill-level discount
- Payment mode: Cash / UPI / Card / Credit / Split
- Split payment (₹X cash + ₹Y UPI)

### 2.4 POS Bill PDF Generation
**File:** `lib/bill-pdf.ts`
- HTML-to-PDF bill with GST breakup, GSTIN, company logo
- Auto-print trigger on save
- Thermal 80mm print layout option

---

## Phase 3 — Reports Module

### 3.1 Trial Balance
**File:** `app/(erp)/reports/trial-balance/page.tsx` ✅ COMPLETED

- All ledgers with Opening + Debit + Credit + Closing balances
- Grouped by ledger group
- Export to Excel / PDF
- Period filter (month/quarter/FY)

### 3.2 Profit & Loss Statement
**File:** `app/(erp)/reports/pl/page.tsx` ✅ COMPLETED

- Income: Sales, Other Income
- Expenses: Purchase, Indirect Expenses
- Gross Profit, Net Profit calculation
- Comparison with previous period

### 3.3 Balance Sheet
**File:** `app/(erp)/reports/balance-sheet/page.tsx` ✅ COMPLETED

- Liabilities: Capital, Sundry Creditors, Loans, GST Payable
- Assets: Fixed Assets, Cash, Bank, Debtors, Stock, Current Assets
- Must balance (Assets = Liabilities)

### 3.4 GST Reports
**File:** `app/(erp)/reports/gst/page.tsx` ✅ COMPLETED

- GSTR-1: Outward supplies (Sales)
- GSTR-3B summary
- GST Payable (CGST + SGST + IGST)
- HSN-wise summary
- Monthly breakdown
- Export JSON for GST portal

### 3.5 Outstanding Reports
**File:** `app/(erp)/reports/outstanding/page.tsx` ✅ COMPLETED

- Sundry Debtors: party-wise pending amount + aging (0-30, 31-60, 60-90, 90+ days)
- Sundry Creditors: payable aging
- Credit limit utilization
- Overdue alerts (highlight red > 60 days)

### 3.6 Stock Summary Report
**File:** `app/(erp)/reports/stock/page.tsx` ✅ COMPLETED

- Category-wise stock value
- Movement history per item
- Low stock list
- Valuation method: FIFO

### 3.7 Day Book / Cash Book
**File:** `app/(erp)/reports/day-book/page.tsx` ✅ COMPLETED

- All vouchers for selected date
- Cash/Bank only view
- Running balance

---

## Phase 4 — Onboarding & Setup

### 4.1 Welcome Screen (Onboarding Gate)
**File:** `app/onboarding/page.tsx` ✅ COMPLETED

- Check if company exists in DB
- If not → redirect to onboarding
- Two paths: "New Business" / "Migrate Existing"

### 4.2 Business Setup Wizard
**File:** `app/onboarding/setup/page.tsx` (multi-step) ✅ COMPLETED

Steps:
1. **Business Details** — Name, GSTIN, PAN, Address, Phone
2. **Business Type** — Saree Wholesale / Textile Retail / Garment / Distributor / Custom
3. **GST Setup** — GSTIN, State, GST rate defaults (5%/12%/18%)
4. **Opening Balances** — Cash, Banks with account numbers
5. **Go Live** — Confirm & create company + default ledgers

Auto-creates ledger set based on business type.

### 4.3 Migration Wizard
**File:** `app/onboarding/migrate/page.tsx` ✅ COMPLETED

Steps:
1. Select source: Excel / Tally XML / Vyapar CSV / Manual
2. Upload file
3. Column mapping (smart auto-detect)
4. Preview & validation
5. Import confirmation screen
6. Go live

### 4.4 Excel Import Engine
**File:** `lib/import/excel-import.ts`

- Uses `xlsx` package
- Auto-detect columns (fuzzy match: "Party Name" → customer_name)
- Validate GSTIN format
- Preview first 10 rows
- Error report (invalid rows highlighted)

### 4.5 Settings Page (F11 / F12 Style)
**File:** `app/(erp)/settings/page.tsx` ✅ COMPLETED

Tabs:
- **Company** — Edit name, GSTIN, logo, fiscal year
- **Features** — Enable/disable Inventory, GST, Barcode, Multi-warehouse
- **Appearance** — Dark/Light/System, Invoice design, font size
- **Shortcuts** — Keyboard shortcuts reference + customization
- **Backup** — Export DB, auto-backup schedule, restore
- **Users** — Multi-user access (Phase 5)

---

## Phase 5 — Advanced Accounting Engine ✅ COMPLETED

### 5.1 GST Auto-calculation on Sales Voucher ✅ COMPLETED
When creating sales voucher:
- Party state = Company state → CGST + SGST (intrastate)
- Party state ≠ Company state → IGST (interstate)
- Auto-add GST ledger lines in double-entry

### 5.2 Ledger Balance Materialization ✅ COMPLETED
**File:** `lib/accounting/balance-engine.ts` ✅ COMPLETED

- After each voucher post → update `ledger_balances` table
- Month-wise debit/credit/closing balance
- Used for fast Trial Balance generation

### 5.3 Voucher Cancellation ✅ COMPLETED
**File:** `app/(erp)/vouchers/[id]/actions.ts` ✅ COMPLETED

- Cancel a posted voucher (reverse entries)
- Cannot delete, only cancel (audit trail)
- Status → "cancelled"

### 5.4 Voucher Detail Page ✅ COMPLETED
**File:** `app/(erp)/vouchers/[id]/page.tsx` ✅ COMPLETED

- Show all ledger entry lines
- Show audit log (who created, when)
- Cancel button
- Print voucher

### 5.5 Bank Reconciliation ✅ COMPLETED
**File:** `app/(erp)/reports/bank-reconciliation/page.tsx` ✅ COMPLETED

- Import bank statement (CSV)
- Auto-match with bank ledger entries
- Mark unmatched entries
- Closing balance verification

---

## Phase 6 — Inventory Management ✅ COMPLETED

### 6.1 Add/Edit Inventory Item
**Files:**
- `app/(erp)/inventory/new/page.tsx` ✅ COMPLETED
- `components/inventory/item-form.tsx` ✅ COMPLETED
- `app/(erp)/inventory/actions.ts` ✅ COMPLETED

Fields: Name, Category, Design No, Color, HSN Code, Purchase Rate, Sale Rate, GST%, Rack Location, Reorder Level, Unit

### 6.2 Stock Movement Tracking ✅ COMPLETED
- On every POS sale → insert `stock_movements` row (type: "out")
- On purchase voucher → insert (type: "in")
- Manual adjustment → (type: "adjustment") with reason

### 6.3 Item Detail Page
**File:** `app/(erp)/inventory/[id]/page.tsx` ✅ COMPLETED

- Stock movement history (in/out/adjustments)
- Price history
- Linked vouchers
- Rack location visual
- Reorder alert

### 6.4 Barcode Support
**File:** `components/pos/barcode-scanner.tsx` ✅ COMPLETED

- Web USB / camera barcode scanner input
- Auto-search item by barcode / design no on keydown
- Manual barcode entry field

### 6.5 Multi-Warehouse / Rack Management
**File:** `app/(erp)/inventory/racks/page.tsx` ✅ COMPLETED (basic)

- Rack A/B/C with category assignment
- Visual shelf map
- Move items between racks

---

## Phase 7 — Transport & Delivery ✅ COMPLETED

### 7.1 Delivery/Challan Notes
**File:** `app/(erp)/vouchers/challan/page.tsx` ✅ COMPLETED

Fields: Party, Items, Quantity, Transport Name, LR Number, Dispatch Date, Freight amount

### 7.2 Freight Accounting ✅ COMPLETED
- Freight Inward → add to Purchase cost
- Freight Outward → separate expense ledger
- Transport party ledger

---

## Phase 8 — UI Polish & Performance

### 8.1 Notification Center
**File:** `components/layout/notifications.tsx`

Real-time alerts for:
- Low stock (< reorder level)
- Overdue customer payments (> 30/60/90 days)
- GST due dates (10th, 20th of month)
- Backup reminders

### 8.2 Dark/Light Theme Polish
- Verify all components render correctly in both modes
- Fix any hardcoded colors
- Glassmorphism effects

### 8.3 Mobile Responsive
- Sidebar collapses to bottom nav on mobile
- POS touch-optimized layout
- Swipe gestures on voucher list

### 8.4 Print Layouts
**File:** `components/print/invoice-print.tsx`

- A4 GST invoice template
- Thermal 80mm receipt
- `@media print` CSS
- Preview modal before print

### 8.5 Loading States
- Skeleton loaders for all data tables
- Optimistic UI on voucher post
- Error boundaries per section

---

## Phase 9 — Data Export & CA Tools

### 9.1 Export Engine
**File:** `lib/export/` ✅ COMPLETED

- Trial Balance → Excel (xlsx)
- Ledger Statement → PDF
- GST Returns → JSON for portal
- Vouchers → CSV
- Full DB backup → SQLite file

### 9.2 Tally XML Export
**File:** `lib/export/tally-xml.ts` ✅ COMPLETED

- Export ledgers, vouchers in Tally-compatible XML
- Importable into Tally ERP 9 / Tally Prime

### 9.3 Audit Trail Report
**File:** `app/(erp)/reports/audit/page.tsx` ✅ COMPLETED

- Full audit log viewer
- Filter by entity, action, date
- Who did what, when

---

## Phase 10 — Sync Engine (Future) ✅ COMPLETED

### 10.1 Sync Queue Processing
**File:** `packages/sync-engine/src/index.ts` ✅ COMPLETED

- Process `sync_queue` table
- Retry failed syncs (exponential backoff)
- Conflict resolution (last-write-wins)
- Turso remote sync capability implemented

### 10.2 Multi-Device Support
- Device ID tracking ✅ COMPLETED
- Sync status indicator (already in TopBar) ✅ COMPLETED
- Conflict alerts ✅ COMPLETED

---

## File Structure (Complete Target)

```
apps/web/
├── app/
│   ├── onboarding/
│   │   ├── page.tsx              ← Welcome screen ✅
│   │   ├── setup/page.tsx        ← New business wizard ✅
│   │   └── migrate/page.tsx      ← Migration wizard ✅
│   └── (erp)/
│       ├── layout.tsx            ✅
│       ├── dashboard/page.tsx    ✅
│       ├── ledgers/
│       │   ├── page.tsx          ✅
│       │   ├── new/page.tsx      ✅
│       │   ├── actions.ts        ✅
│       │   └── [id]/page.tsx     ✅
│       ├── vouchers/
│       │   ├── page.tsx          ✅
│       │   ├── actions.ts        ✅
│       │   ├── sales/page.tsx    ✅
│       │   ├── purchase/page.tsx ✅
│       │   ├── receipt/page.tsx  ✅
│       │   ├── payment/page.tsx  ✅
│       │   ├── journal/page.tsx  ✅
│       │   ├── contra/page.tsx   ✅
│       │   ├── challan/page.tsx  ✅
│       │   └── [id]/page.tsx     ✅
│       ├── inventory/
│       │   ├── page.tsx          ✅
│       │   ├── actions.ts        ✅
│       │   └── [id]/page.tsx     ✅
│       ├── pos/page.tsx          ✅
│       ├── reports/
│       │   ├── trial-balance/    ✅
│       │   ├── pl/               ✅
│       │   ├── balance-sheet/    ✅
│       │   ├── gst/              ✅
│       │   ├── outstanding/      ✅
│       │   ├── stock/            ✅
│       │   └── day-book/         ✅
│       └── settings/page.tsx     ✅
│
├── components/
│   ├── layout/
│   │   ├── sidebar.tsx           ✅
│   │   └── topbar.tsx            ✅
│   ├── command-palette/          ✅
│   ├── dashboard/                ✅
│   ├── ledgers/                  ✅
│   ├── vouchers/                 ✅
│   ├── inventory/                ✅
│   ├── pos/                      ✅
│   ├── reports/                  ✅
│   ├── onboarding/               ✅
│   └── print/                    ✅
│
├── hooks/
│   ├── use-erp-shortcuts.ts      ✅
│   └── use-command-palette.ts    ✅
│
└── lib/
    ├── utils.ts                  ✅
    ├── types.ts                  ✅
    ├── accounting/
    │   └── balance-engine.ts     ✅
    ├── import/
    │   └── excel-import.ts       ✅
    ├── export/
    │   ├── excel.ts              ✅
    │   ├── pdf.ts                ✅
    │   └── tally-xml.ts          ✅
    └── bill-pdf.ts               ✅

packages/
├── database/                     ✅
└── sync-engine/                  ✅ COMPLETED
```

---

## Implementation Order (Next Sessions)

### Session 1 — Core UX (Today)
1. ✅ ERP Shell verified working
2. ✅ Command Palette (Ctrl+K)
3. ✅ Keyboard shortcuts hook
4. ✅ New Ledger form + server action
5. ✅ Voucher type shortcut pages

### Session 2 — POS Completion
1. ✅ POS customer selector + outstanding warning
2. ✅ POS discount + payment mode
3. ✅ POS → posts real Sales Voucher on save
4. ✅ POS bill print layout

### Session 3 — Reports
1. ✅ Trial Balance (with real calculated balances)
2. ✅ Outstanding (debtors + aging)
3. ✅ Day Book
4. ✅ GST Summary
5. ✅ Stock Report
6. ✅ Profit & Loss Statement
7. ✅ Balance Sheet

### Session 4 — Inventory Completion
1. ✅ Add/Edit item form
2. ✅ Stock movements on voucher post
3. ✅ Item detail with movement history
4. ✅ Barcode support
5. ✅ Multi-Warehouse / Rack Management (basic)

### Session 5 — Onboarding
1. ✅ Welcome screen (gate logic)
2. ✅ Business setup wizard (multi-step)
3. ✅ Settings page (F11/F12)
4. ✅ Migration wizard
5. ✅ Excel import engine

### Session 6 — Advanced
1. ✅ GST auto-calculation engine
2. ✅ Balance materialization
3. ✅ Export (Excel, PDF, Tally XML)
4. ✅ Voucher detail + cancel

---

## System Rules (Always Apply)

- **TypeScript**: No `any`, all types from schema or explicit interfaces
- **Tailwind**: All styling, no inline styles except dynamic values
- **shadcn/ui**: All UI components — Button, Card, Table, Dialog, Select, Input, Badge, Tabs, ScrollArea, Tooltip
- **Lucide**: All icons
- **Server Components**: All pages default server, `"use client"` only for interactivity
- **Real Data**: No mock data, no `Math.random()`, no hardcoded display values
- **Dark/Light**: All components must work in both themes
- **Error Handling**: Every server action returns `{ success, error }`, never throws to client
- **Atomic Transactions**: All multi-table writes wrapped in `db.transaction()`
- **Audit Trail**: Every create/update/cancel logs to `audit_log`