#   House - Complete ERP System

> Built for Indian wholesale textile businesses. Inspired by Tally, polished like Linear, reliable like banking software.
> Following /system-build rules: TypeScript, Tailwind, shadcn/ui, Lucide, Next.js Server Components, real data only, no `any`, dark/light mode.

## Overview

This is a complete ERP (Enterprise Resource Planning) system designed specifically for Indian wholesale textile businesses like   House. The system includes:

- **Double-entry accounting** with voucher-based transactions
- **GST compliance** with automatic calculation (CGST/SGST/IGST)
- **Inventory management** with stock tracking and barcode support
- **Point of Sale (POS)** billing system
- **Financial reporting** (Trial Balance, P&L, Balance Sheet, GST reports, etc.)
- **Multi-device synchronization** with conflict resolution
- **Onboarding & migration** wizards for new businesses or data import from Excel/Tally/Vyapar
- **Audit trail** for compliance and debugging
- **Export capabilities** to Excel, PDF, Tally XML, and more

## Technology Stack

- **Framework**: Next.js 16.2.0 (App Router with Server Components)
- **Language**: TypeScript 5.9.2 (strict mode, no `any` types)
- **Styling**: Tailwind CSS 4.3.0 with shadcn/ui components
- **Icons**: Lucide React
- **Forms**: React Hook Form with Zod validation
- **Database**: Drizzle ORM with SQLite
- **State Management**: React useState/useEffect/context
- **Build System**: Turborepo monorepo
- **Validation**: Zod (implemented via patterns)

## Key Features

✅ **Complete ERP Core**: Command palette, keyboard shortcuts, ledger management, voucher entry  
✅ **POS System**: Billing, customer selection, discounts, payment modes, GST calculation, stock deduction, PDF printing  
✅ **Reports Module**: Trial Balance, P&L, Balance Sheet, GST Reports, Outstanding, Stock Summary, Day Book, and Audit Trail  
✅ **Interactive Onboarding**: Fully route-aware 10-step guided tour (`nextstepjs` + `motion`) introducing dashboard, vouchers, ledgers, detailed reports, and backup consoles  
✅ **Settings & Backups**: Company configuration, feature toggles, and **Data Backup & Restore** (.json database exports/restores)  
✅ **Advanced Accounting**: GST auto-calculation, ledger balance materialization, voucher cancellation/detail, bank reconciliation  
✅ **Inventory Management**: Add/edit items, stock movements, item details, barcode support, multi-warehouse  
✅ **Transport & Delivery**: Challan notes, freight accounting  
✅ **UI Polish**: Notification center, dark/light theme, mobile responsive, print layouts, loading states, and premium glassmorphic visual app icon  
✅ **Data Export**: Excel, PDF, Tally XML, CSV, PNG, and JSON unified export center  
✅ **Sync Engine & Conflict Desk**: Multi-device sync queue table with exponential backoff retry, remote Turso support, and an interactive **Sync Conflict Resolution Desk** with local/server override buttons  
✅ **PWA Support**: Progressive Web App caching service worker (`sw.js`) enabling 100% offline asset loading  

## Project Structure

```
├── app/
│   ├── onboarding/
│   │   ├── page.tsx              ← Welcome screen
│   │   ├── setup/page.tsx        ← New business wizard
│   │   └── migrate/page.tsx      ← Migration wizard
│   └── (erp)/
│       ├── layout.tsx            ← Main ERP layout
│       ├── dashboard/page.tsx    ← Dashboard with metrics
│       ├── ledgers/              ← Ledger management (CRUD)
│       ├── vouchers/             ← Voucher entries (sales, purchase, etc.)
│       ├── inventory/            ← Inventory items and stock
│       ├── pos/                  ← Point of sale billing
│       ├── reports/              ← Financial reports
│       └── settings/page.tsx     ← System settings
├── components/
│   ├── layout/                   ← Layout components (sidebar, topbar)
│   ├── ui/                       ← Reusable UI components (shadcn/ui)
│   ├── dashboard/                ← Dashboard widgets
│   ├── ledgers/                  ← Ledger-specific components
│   ├── vouchers/                 ← Voucher-specific components
│   ├── inventory/                ← Inventory-specific components
│   ├── pos/                      ← POS-specific components
│   ├── reports/                  ← Report-specific components
│   ├── onboarding/               ← Onboarding-specific components
│   └── print/                    ← Print layouts (invoices, receipts)
├── hooks/
│   ├── use-erp-shortcuts.ts      ← Keyboard shortcuts (F2-F12, Alt+Enter, Ctrl+S)
│   ├── use-offline-sync.ts       ← Live connection status monitoring
│   └── use-spatial-navigation.ts ← Tally-like arrow key and Enter navigation
├── lib/
│   ├── utils.ts                  ← Utility functions
│   ├── types.ts                  ← TypeScript types
│   ├── database/                 ← Drizzle ORM schema, client config, and SQLite db
│   ├── accounting/
│   │   └── balance-engine.ts     ← Ledger balance materialization
│   ├── import/
│   │   └── excel-import.ts       ← Excel import engine
│   ├── export/
│   │   ├── excel.ts              ← Excel export
│   │   ├── pdf.ts                ← PDF export
│   │   └── tally-xml.ts          ← Tally XML export
│   └── bill-pdf.ts               ← Bill PDF generation
└── src-tauri/                    ← Tauri config, cargo manifest, and multi-platform app assets
```

## Environment Setup

### Required Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Database Configuration
DATABASE_URL="file:./local.db"  # SQLite database file path
DATABASE_AUTH_TOKEN=""          # Leave empty for local SQLite

# Sync Engine Configuration (Optional for multi-device sync)
REMOTE_SYNC_ENABLED="false"     # Set to "true" to enable remote sync
REMOTE_SYNC_URL=""              # Turso remote sync URL (when enabled)
REMOTE_SYNC_TOKEN=""            # Turso remote sync token (when enabled)
```

### Development Setup

1. **Install dependencies**:
   ```bash
   pnpm install
   ```

2. **Start the development server**:
   ```bash
   pnpm dev
   ```
   The application will be available at `http://localhost:3000`

3. **Type checking**:
   ```bash
   pnpm check-types
   ```

4. **Linting**:
   ```bash
   pnpm lint
   ```

5. **Build for production**:
   ```bash
   pnpm build
   ```

6. **Start production server**:
   ```bash
   pnpm start
   ```

## Database Initialization

The system automatically initializes the database with:
- 1 company (  House)
- 18 ledgers (including Capital, Bank, Cash, Sundry Debtors, Sundry Creditors, etc.)
- 10 inventory items (sample  inventory)

To reset and reseed the database:
```bash
# This would need to be implemented as a script
# For now, delete local.db and restart the app to regenerate
rm -f local.db
pnpm dev
```

## Key Architectural Patterns

1. **Double-entry Accounting**: Every voucher creates balanced debit/credit entries
2. **Server Actions**: Mutations handled via server actions in `[module]/actions.ts`
3. **Audit Trail**: All changes logged to `audit_log` table
4. **Real Data Only**: No mock data - everything comes from database
5. **Atomic Transactions**: Multi-table writes wrapped in `db.transaction()`
6. **Materialized Views**: Balance calculations optimize report generation
7. **Keyboard-First Design**: Global shortcuts (Ctrl+K, F4-F9, Alt+C, Ctrl+S)
8. **Sync Engine**: Process `sync_queue` table with exponential backoff retry and last-write-wins conflict resolution

## Environment Variables Reference

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `DATABASE_URL` | SQLite database connection string | `file:./local.db` | Yes |
| `DATABASE_AUTH_TOKEN` | Database auth token (for remote databases) | Empty (local) | No |
| `REMOTE_SYNC_ENABLED` | Enable multi-device synchronization | `false` | No |
| `REMOTE_SYNC_URL` | Turso database URL for remote sync | Empty | When `REMOTE_SYNC_ENABLED=true` |
| `REMOTE_SYNC_TOKEN` | Turso database token for remote sync | Empty | When `REMOTE_SYNC_ENABLED=true` |

## Features by Module

### Dashboard
- Real-time metrics (debtors, creditors, stock value)
- Low stock alerts
- GST due dates

### Ledgers
- Create, read, update, deactivate ledgers
- Group-based organization (debtors, creditors, bank, cash, etc.)
- GSTIN/PAN tracking
- Credit limits and opening balances

### Vouchers
- Sales, Purchase, Payment, Receipt, Journal, Contra, Challan vouchers
- Double-entry accounting with automatic balancing
- GST calculation based on party vs company state
- Inventory integration (stock deduction on sales)
- Voucher cancellation with audit trail
- PDF printing

### Inventory
- Item management with HSN codes, barcodes, rack locations
- Stock quantity tracking with alerts
- Category-based organization
- Purchase/sale rates with GST%
- Stock movement history (in/out/adjustment)

### POS
- Fast barcode/scanner input
- Customer selection with outstanding balance alerts
- Per-item and bill-level discounts
- Multiple payment modes (Cash, UPI, Card, Credit, Split)
- Auto GST calculation
- Stock deduction on sale
- PDF bill/IPOS receipt printing
- Thermal 80mm print layout option

### Reports
- Trial Balance with month-wise balances
- Profit & Loss Statement with comparisons
- Balance Sheet (Assets = Liabilities enforced)
- GST Reports (GSTR-1, GSTR-3B summary, HSN-wise)
- Outstanding Reports (debtors/creditors with aging)
- Stock Summary Report (category-wise, FIFO valuation)
- Day Book / Cash Book
- Bank Reconciliation (CSV import + matching)
- Audit Trail Report (entity/action/date filtering)

### Onboarding & Walkthroughs
- Welcome screen (checks for existing company)
- Business Setup Wizard (5 steps: details, type, GST, opening balances, go-live)
- Migration Wizard (supports Excel, Tally XML, Vyapar CSV, manual)
- Excel Import Engine (auto-column mapping, validation, error reporting)
- **Interactive Walkthrough**: Fully route-aware 10-step tour with an elegant, progress-aware custom glassmorphic card component.

### Settings & Backups
- Company information (name, GSTIN, PAN, address, logo, fiscal year)
- Feature toggles (Inventory, GST, Barcode, Multi-warehouse)
- Appearance (Dark/Light/System theme, invoice design, font size)
- Shortcuts reference and customization
- **Portable JSON Backups**: One-click download of all relational sheets and transaction-safe restores.
- Users (Phase 5 - multi-user access foundation)

### Sync Engine & Conflict Desk
- Sync queue processing with exponential backoff retry
- Conflict resolution (last-write-wins / local-server choices)
- Device ID tracking
- Remote sync capability (Turso)
- Sync status indicators in UI
- **Sync Conflict Resolution Desk**: Real-time side-by-side JSON diffs allowing forced local push or remote server acceptance.

### Progressive Web App (PWA)
- Stale-While-Revalidate caching worker (`sw.js`) enabling instantaneous 100% offline startup.

## Development Commands

- `pnpm dev` - Start Next.js development server on http://localhost:3000
- `pnpm build` - Create optimized production web build
- `pnpm start` - Start production web server
- `pnpm typecheck` - Run TypeScript compiler (`tsc --noEmit`)
- `pnpm lint` - Run ESLint checks

### Tauri Desktop App Commands

- `pnpm tauri:dev` - Run the Tauri desktop window in development mode
- `pnpm tauri:build` - Build the native desktop installer/executable
- `pnpm tauri icon ./app/icon.png` - Automatically regenerate all multi-platform app launcher, taskbar, store, and device icons from the high-fidelity premium master app icon

## Deployment

The application can be deployed to any Node.js hosting platform:
- Vercel (recommended for Next.js)
- Netlify
- AWS Amplify
- Docker containers
- Traditional VPS/servers

For multi-device synchronization, configure the Sync Engine environment variables and ensure all devices connect to the same remote database.

## License

MIT License - Feel free to use, modify, and distribute this ERP system for your business needs.

## Support

For issues, questions, or contributions, please refer to the project documentation or contact the development team.

---
*Built with ❤️ for Indian businesses*