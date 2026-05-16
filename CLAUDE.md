# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- **Start dev server**: `pnpm dev` - Runs Next.js development server on port 3000
- **Build for production**: `pnpm build` - Creates optimized production build
- **Start production server**: `pnpm start` - Starts built application
- **Type checking**: `pnpm check-types` - Runs TypeScript compiler with next typegen
- **Linting**: `pnpm lint` - Runs ESLint with max warnings 0
- **Database operations**:
  - Reset and seed: `pnpm db:reset` (would need script)
  - Generate types: `pnpm typegen` (part of check-types)

## Code Architecture & Structure

### Monorepo Setup
- Built with Turborepo for monorepo management
- Applications: `apps/web` (Next.js frontend)
- Packages: 
  - `packages/database` - Drizzle ORM schema and db client
  - `packages/ui` - Shared shadcn/ui components
  - `packages/eslint-config` - Shared ESLint configuration
  - `packages/typescript-config` - Shared TypeScript configuration

### Next.js App Router
- Uses Next.js 16.2.0 with App Router
- Server Components by default, `"use client"` only for interactivity
- Route groups: `(erp)` for ERP module routes
- Dynamic routes: `[id]` for individual records
- Route segmentation: `app/(erp)/[module]/[action]/page.tsx`

### Technology Stack
- **Language**: TypeScript 5.9.2 (strict, no `any` types)
- **Styling**: Tailwind CSS 4.3.0 with shadcn/ui components
- **UI Library**: shadcn/ui built on Radix primitives
- **Icons**: Lucide React
- **Forms**: React Hook Form with Zod validation (implied from patterns)
- **Database**: Drizzle ORM with SQLite
- **State Management**: React useState/useEffect/context for client state
- **Navigation**: Next.js useRouter/usePathname

### ERP Module Structure
```
app/(erp)/
├── layout.tsx           # Main ERP layout with sidebar/topbar
├── dashboard/           # Dashboard with metrics
├── ledgers/             # Ledger management (CRUD)
├── vouchers/            # Voucher entries (sales, purchase, etc.)
├── inventory/           # Inventory items and stock
├── pos/                 # Point of sale billing
├── reports/             # Financial reports (trial-balance, outstanding, etc.)
├── settings/            # System settings
```

### Component Organization
- `components/layout/` - Layout components (sidebar, topbar)
- `components/[module]/` - Module-specific UI components
- `components/ui/` - shadcn/ui wrapper components
- `components/print/` - Print layouts (invoices, receipts)
- `components/command-palette/` - Global search and actions
- `components/dashboard/` - Dashboard widgets

### Hooks and Utilities
- `hooks/` - Custom React hooks (keyboard shortcuts, command palette)
- `lib/` - Utility functions (types, accounting, import/export, PDF generation)
- `packages/database/src/` - 
  - `schema.ts` - Database tables and relationships
  - `seed.ts` - Initial data population
  - `db.ts` - Drizzle client configuration

### Key Architectural Patterns
1. **Double-entry Accounting**: Every voucher creates balanced debit/credit entries
2. **Server Actions**: Mutations handled via server actions in `[module]/actions.ts`
3. **Audit Trail**: All changes logged to audit_log table
4. **Real Data Only**: No mock data - everything comes from database
5. **Atomic Transactions**: Multi-table writes wrapped in `db.transaction()`
6. **Materialized Views**: Balance calculations optimize report generation
7. **Keyboard-First Design**: Global shortcuts (Ctrl+K, F4-F9, Alt+C, Ctrl+S)

### Data Flow
1. UI Components → Client Hooks → Server Actions → Database
2. Database → Server Components → UI (with automatic TypeScript types)
3. Forms use Zod validation → Server Actions → Database transactions
4. Reports compute aggregates directly from ledger entries

### Styling Approach
- Tailwind CSS utility classes in JSX
- shadcn/ui component primitives extended with Tailwind
- Dark/Light mode support via next-themes and CSS variables
- Responsive design with mobile-first breakpoints

### Error Handling
- Server actions return `{ success: boolean, error?: string }`
- Client handles errors with React state/useState
- Loading states managed with useState booleans
- Boundary components for error isolation (implied from patterns)

### File Naming Conventions
- Pages: `page.tsx` in route directories
- Components: Descriptive names, `.tsx` extension
- Hooks: `use-*.ts`
- Actions: `actions.ts` (server functions)
- Utilities: Descriptive names in `lib/` directory
- Types: Inline interfaces or `lib/types.ts`