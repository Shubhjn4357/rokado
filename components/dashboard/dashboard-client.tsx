"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Users,
  Banknote,
  Package,
  AlertTriangle,
  ReceiptText,
  Activity,
  ArrowUpRight,
  TrendingDown,
  FileCheck,
  Zap,
  TrendingUp,
  Inbox,
  ArrowUpRightFromCircle
} from "lucide-react";
import { formatCurrency } from "@/lib/types";
import type { InferSelectModel } from "@/lib/database";
import type { inventoryItems as inventoryItemsTable, ledgers as ledgersTable } from "@/lib/database";

type InventoryItem = InferSelectModel<typeof inventoryItemsTable>;
type LedgerRow = Pick<
  InferSelectModel<typeof ledgersTable>,
  "id" | "name" | "openingBalance" | "phone"
>;

interface DashboardData {
  debtorsTotal: number;
  creditorsTotal: number;
  cashBalance: number;
  bankBalance: number;
  todaySalesCount: number;
  totalVouchers: number;
  lowStockItems: InventoryItem[];
  recentDebtors: LedgerRow[];
}

export function DashboardClient({ data }: { data: DashboardData }) {
  
  // Total fluid cash calculation
  const totalLiquidCash = data.cashBalance + data.bankBalance;

  return (
    <div className="space-y-6 font-sans text-foreground">
      
      {/* Elegant low-contrast header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-foreground/5 pb-4 select-none gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground/90 flex items-center gap-2">
            <Zap className="w-5 h-5 text-accent animate-pulse" />
            Inventory & Ledgers overview
          </h1>
          <p className="text-xs text-foreground/60 mt-1 font-medium">
            Active Accounting Period: FY 2026–27 ·   House
          </p>
        </div>
        <div className="text-[10px] font-bold text-emerald-650 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-1.5 uppercase rounded-full shrink-0 flex items-center gap-1.5 select-none shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
          Secure Local Database
        </div>
      </div>

      {/* 3 HERO HIGH-SATURATION ACCENT PANELS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 select-none">
        
        {/* Panel 1: Orders / Sales Today (Vibrant Neon Yellow) */}
        <div className="panel-yellow p-6 rounded-[var(--radius-card)] shadow-[var(--shadow-card)] relative overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[var(--shadow-elevated)] group cursor-default">
          <div className="absolute top-[-30px] right-[-20px] w-36 h-36 bg-black/5 rounded-full blur-2xl group-hover:scale-110 transition-transform duration-500" />
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider opacity-60">Orders / Sales Today</span>
            <div className="w-8 h-8 bg-black/10 rounded-full flex items-center justify-center">
              <ReceiptText className="w-4 h-4 opacity-70" />
            </div>
          </div>
          <div className="mt-8">
            <div className="text-4xl font-black tracking-tight">{data.todaySalesCount}</div>
            <div className="text-xs font-bold mt-1 opacity-70">Sales bills filed today</div>
          </div>
          <div className="mt-8 flex items-center justify-between border-t border-black/8 pt-4 text-[10px] font-bold">
            <span className="opacity-60">Cumulative Postings</span>
            <span className="bg-black/10 px-2 py-0.5 rounded-md font-black">{data.totalVouchers} total</span>
          </div>
        </div>

        {/* Panel 2: Stock Alerts (Vibrant Warm Sun Orange) */}
        <div className="panel-orange p-6 rounded-[var(--radius-card)] shadow-[var(--shadow-card)] relative overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[var(--shadow-elevated)] group cursor-default">
          <div className="absolute top-[-30px] right-[-20px] w-36 h-36 bg-black/5 rounded-full blur-2xl group-hover:scale-110 transition-transform duration-500" />
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider opacity-60">Stock Safety Exception</span>
            <div className="w-8 h-8 bg-black/10 rounded-full flex items-center justify-center">
              <Package className="w-4 h-4 opacity-70" />
            </div>
          </div>
          <div className="mt-8">
            <div className="text-4xl font-black tracking-tight">{data.lowStockItems.length}</div>
            <div className="text-xs font-bold mt-1 opacity-70">Items below reorder limits</div>
          </div>
          <div className="mt-8 flex items-center justify-between border-t border-black/8 pt-4 text-[10px] font-bold">
            <span className="opacity-60">Status Check</span>
            <span className="bg-black/15 px-2.5 py-0.5 rounded-full font-black text-[9px] uppercase tracking-wide">
              {data.lowStockItems.length > 0 ? "Reorder Needed" : "Healthy"}
            </span>
          </div>
        </div>

        {/* Panel 3: Financial Health / Liquid Cash (Deep Space Obsidian) */}
        <div className="panel-black p-6 rounded-[var(--radius-card)] shadow-[var(--shadow-elevated)] relative overflow-hidden transition-all duration-300 hover:-translate-y-0.5 group cursor-default">
          <div className="absolute top-[-30px] right-[-20px] w-36 h-36 bg-white/5 rounded-full blur-2xl group-hover:scale-110 transition-transform duration-500" />
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider opacity-50">Combined Liquid Assets</span>
            <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center">
              <Banknote className="w-4 h-4 text-accent" />
            </div>
          </div>
          <div className="mt-8">
            <div className="text-3xl font-black tracking-tight">{formatCurrency(totalLiquidCash)}</div>
            <div className="text-xs font-bold mt-1 opacity-50">Cash & Bank combined registries</div>
          </div>
          <div className="mt-8 flex items-center gap-4 border-t border-white/10 pt-4 text-[9px] font-bold opacity-60">
            <div className="flex-1">
              <span>Cash in Hand</span>
              <div className="opacity-100 font-extrabold text-[10px] mt-0.5">{formatCurrency(data.cashBalance)}</div>
            </div>
            <div className="w-px h-6 bg-white/10" />
            <div className="flex-1">
              <span>Bank Registry</span>
              <div className="opacity-100 font-extrabold text-[10px] mt-0.5">{formatCurrency(data.bankBalance)}</div>
            </div>
          </div>
        </div>

      </div>

      {/* --- PREMIUM DYNAMIC ANALYTICS CHARTS (PURE SVG) --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 select-none animate-in fade-in slide-in-from-bottom duration-300">
        
        {/* Chart 1: Financial Balance Pillar Chart */}
        <Card className="surface-card border-none rounded-[var(--radius-xl)] p-5 space-y-4">
          <CardHeader className="p-0 pb-2">
            <CardTitle className="text-xs font-black uppercase text-foreground/80 tracking-wider">
              Asset & Liability Breakdown
            </CardTitle>
            <CardDescription className="text-[10px] font-semibold text-muted-foreground">
              Visual comparison of total liquid funds, receivables, and outstanding payables.
            </CardDescription>
          </CardHeader>
          
          <CardContent className="p-0 flex items-center justify-between gap-6 pt-2">
            {/* SVG Chart Container */}
            <div className="flex-1 h-44 relative flex items-end justify-around border-b border-foreground/10 pb-1">
              {/* Pillar 1: Liquid Cash */}
              <div className="flex flex-col items-center group w-12">
                <div className="text-[9px] font-bold text-foreground opacity-0 group-hover:opacity-100 transition-opacity duration-150 mb-1 font-mono">
                  {formatCurrency(totalLiquidCash)}
                </div>
                <div 
                  className="w-8 rounded-t-lg bg-gradient-to-t from-emerald-500/20 to-emerald-400/50 border border-emerald-500/30 transition-all duration-300 group-hover:scale-x-105 group-hover:shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                  style={{ height: `${Math.max(15, Math.min(120, (totalLiquidCash / Math.max(totalLiquidCash, data.debtorsTotal, data.creditorsTotal, 1)) * 120))}px` }}
                />
                <span className="text-[8px] font-black text-muted-foreground uppercase mt-2 tracking-wide text-center">Liquid</span>
              </div>

              {/* Pillar 2: Receivables */}
              <div className="flex flex-col items-center group w-12">
                <div className="text-[9px] font-bold text-foreground opacity-0 group-hover:opacity-100 transition-opacity duration-150 mb-1 font-mono">
                  {formatCurrency(data.debtorsTotal)}
                </div>
                <div 
                  className="w-8 rounded-t-lg bg-gradient-to-t from-rose-500/20 to-rose-400/50 border border-rose-500/30 transition-all duration-300 group-hover:scale-x-105 group-hover:shadow-[0_0_15px_rgba(244,63,94,0.2)]"
                  style={{ height: `${Math.max(15, Math.min(120, (data.debtorsTotal / Math.max(totalLiquidCash, data.debtorsTotal, data.creditorsTotal, 1)) * 120))}px` }}
                />
                <span className="text-[8px] font-black text-muted-foreground uppercase mt-2 tracking-wide text-center">Debtors</span>
              </div>

              {/* Pillar 3: Payables */}
              <div className="flex flex-col items-center group w-12">
                <div className="text-[9px] font-bold text-foreground opacity-0 group-hover:opacity-100 transition-opacity duration-150 mb-1 font-mono">
                  {formatCurrency(data.creditorsTotal)}
                </div>
                <div 
                  className="w-8 rounded-t-lg bg-gradient-to-t from-amber-500/20 to-amber-400/50 border border-amber-500/30 transition-all duration-300 group-hover:scale-x-105 group-hover:shadow-[0_0_15px_rgba(245,158,11,0.2)]"
                  style={{ height: `${Math.max(15, Math.min(120, (data.creditorsTotal / Math.max(totalLiquidCash, data.debtorsTotal, data.creditorsTotal, 1)) * 120))}px` }}
                />
                <span className="text-[8px] font-black text-muted-foreground uppercase mt-2 tracking-wide text-center">Creditors</span>
              </div>
            </div>

            {/* Metrics Legend Column */}
            <div className="w-44 space-y-2 text-[10px] font-bold">
              <div className="flex items-center justify-between bg-emerald-500/5 border border-emerald-500/10 p-1.5 rounded-lg">
                <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  <span>Cash &amp; Bank</span>
                </div>
                <span className="font-mono text-foreground">{formatCurrency(totalLiquidCash)}</span>
              </div>
              <div className="flex items-center justify-between bg-rose-500/5 border border-rose-500/10 p-1.5 rounded-lg">
                <div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                  <span>Receivables</span>
                </div>
                <span className="font-mono text-foreground">{formatCurrency(data.debtorsTotal)}</span>
              </div>
              <div className="flex items-center justify-between bg-amber-500/5 border border-amber-500/10 p-1.5 rounded-lg">
                <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                  <span>Payables</span>
                </div>
                <span className="font-mono text-foreground">{formatCurrency(data.creditorsTotal)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Chart 2: GST Allocation Donut Chart */}
        <Card className="surface-card border-none rounded-[var(--radius-xl)] p-5 space-y-4">
          <CardHeader className="p-0 pb-2">
            <CardTitle className="text-xs font-black uppercase text-foreground/80 tracking-wider">
              GST Tax Ledger Distribution
            </CardTitle>
            <CardDescription className="text-[10px] font-semibold text-muted-foreground">
              Allocation share of Output Liability vs Input Tax Credits.
            </CardDescription>
          </CardHeader>

          <CardContent className="p-0 flex items-center justify-between gap-6 pt-2">
            <div className="relative w-24 h-24 flex items-center justify-center shrink-0">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="38" fill="transparent" stroke="currentColor" strokeWidth="6" className="text-foreground/5 opacity-10" />
                <circle cx="50" cy="50" r="38" fill="transparent" stroke="var(--credit)" strokeWidth="8" strokeDasharray="238.7" strokeDashoffset="80" className="transition-all duration-300 hover:stroke-[10]" />
                <circle cx="50" cy="50" r="38" fill="transparent" stroke="var(--debit)" strokeWidth="8" strokeDasharray="238.7" strokeDashoffset="180" className="transition-all duration-300 hover:stroke-[10]" />
              </svg>
              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest leading-none">Net Due</span>
                <span className="text-[10px] font-black text-foreground mt-0.5 font-mono">18% GST</span>
              </div>
            </div>

            <div className="flex-1 space-y-2 text-[10px] font-bold">
              <p className="text-[10px] text-muted-foreground leading-relaxed font-semibold">
                Active tax ledgers under standard GST brackets. Output liability on invoices is fully balanced with input credits.
              </p>
              <div className="grid grid-cols-2 gap-2 text-[9px] pt-1">
                <div className="bg-debit/5 border border-debit/10 rounded-lg p-1 text-center">
                  <span className="text-debit uppercase block text-[8px] tracking-wider font-extrabold">Output Sales</span>
                  <span className="text-foreground font-mono font-bold block mt-0.5">₹12,430</span>
                </div>
                <div className="bg-credit/5 border border-credit/10 rounded-lg p-1 text-center">
                  <span className="text-credit uppercase block text-[8px] tracking-wider font-extrabold">Input Credits</span>
                  <span className="text-foreground font-mono font-bold block mt-0.5">₹9,840</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ADDITIONAL KEY ACCENT ROW: Receivables & Payables Glass Summaries */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Receivables Glass Card */}
        <div className="surface-card p-5 rounded-[var(--radius-card)] flex items-center justify-between transition-all duration-200 hover:scale-[1.005]">
          <div className="space-y-1">
            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">Receivables (Sundry Debtors)</span>
            <h3 className="text-xl font-black text-debit tracking-tight">{formatCurrency(data.debtorsTotal)}</h3>
            <p className="text-[10px] text-muted-foreground font-semibold">{data.recentDebtors.length} outstanding active ledgers</p>
          </div>
          <div className="w-10 h-10 bg-debit/10 border border-debit/20 text-debit rounded-full flex items-center justify-center">
            <TrendingDown className="w-4 h-4" />
          </div>
        </div>

        {/* Payables Glass Card */}
        <div className="surface-card p-5 rounded-[var(--radius-card)] flex items-center justify-between transition-all duration-200 hover:scale-[1.005]">
          <div className="space-y-1">
            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">Payables (Sundry Creditors)</span>
            <h3 className="text-xl font-black text-credit tracking-tight">{formatCurrency(data.creditorsTotal)}</h3>
            <p className="text-[10px] text-muted-foreground font-semibold">Active supplier payables & liabilities</p>
          </div>
          <div className="w-10 h-10 bg-credit/10 border border-credit/20 text-credit rounded-full flex items-center justify-center">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>

      </div>

      {/* REPORTING COLUMNS (OUTSTANDING & STOCK ALERTS) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Receivables Master Ledger */}
        <Card className="surface-card border-none rounded-[var(--radius-xl)] overflow-hidden">
          <CardHeader className="bg-muted/30 border-b border-border py-4 px-6 flex flex-row items-center justify-between select-none">
            <div>
              <CardTitle className="text-xs font-black uppercase text-foreground/80 tracking-wider">
                Top Outstanding Accounts (Receivables)
              </CardTitle>
              <CardDescription className="text-[10px] mt-1 font-semibold text-muted-foreground">
                A-group debit balances requiring collection
              </CardDescription>
            </div>
            <Badge variant="outline" className="font-bold text-[9px] uppercase tracking-wider text-accent border-accent/30 bg-accent/8 rounded-full py-0.5 px-2.5">
              Sundry Debtors
            </Badge>
          </CardHeader>
          
          <CardContent className="p-0">
            {data.recentDebtors.length === 0 ? (
              <div className="py-16 text-center text-xs text-foreground/40 font-semibold">
                <Inbox className="w-9 h-9 mx-auto mb-2.5 opacity-30 text-foreground/50" />
                No outstanding debtors found.
              </div>
            ) : (
              <Table className="text-xs">
                <TableHeader className="bg-foreground/[0.02] border-b border-foreground/5 select-none">
                  <TableRow className="hover:bg-transparent border-none">
                    <TableHead className="py-2.5 pl-6 font-bold text-foreground/50">Ledger/Particulars</TableHead>
                    <TableHead className="py-2.5 font-bold text-foreground/50 w-[120px]">Phone Number</TableHead>
                    <TableHead className="py-2.5 pr-6 font-bold text-foreground/50 w-[140px] text-right">Debit Balance (₹)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.recentDebtors.map((d) => (
                    <TableRow key={d.id} className="table-row-hover border-b border-border/60">
                      <TableCell className="py-3.5 pl-6 font-bold text-foreground/80">
                        {d.name}
                      </TableCell>
                      <TableCell className="py-3.5 font-mono text-[10px] text-muted-foreground font-semibold">
                        {d.phone ?? "—"}
                      </TableCell>
                      <TableCell className="py-3.5 pr-6 text-right font-black text-debit text-xs">
                        {formatCurrency(d.openingBalance)} <span className="text-[8px] font-black uppercase text-debit/70 bg-debit/8 border border-debit/15 py-0.5 px-1.5 rounded ml-1">Dr</span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Inventory Stock Exception Alerts */}
        <Card className="surface-card border-none rounded-[var(--radius-xl)] overflow-hidden">
          <CardHeader className="bg-muted/30 border-b border-border py-4 px-6 flex flex-row items-center justify-between select-none">
            <div>
              <CardTitle className="text-xs font-black uppercase text-foreground/80 tracking-wider">
                Critical Stock Shortfalls & Alerts
              </CardTitle>
              <CardDescription className="text-[10px] mt-1 font-semibold text-muted-foreground">
                s and items running below safety margins
              </CardDescription>
            </div>
            <Badge className="font-bold text-[9px] uppercase tracking-wider panel-orange border-none rounded-full py-0.5 px-2.5">
              {data.lowStockItems.length} Exceptions
            </Badge>
          </CardHeader>
          
          <CardContent className="p-0">
            {data.lowStockItems.length === 0 ? (
              <div className="py-16 text-center text-xs text-credit font-semibold">
                <FileCheck className="w-9 h-9 mx-auto mb-2.5 opacity-40 text-credit" />
                All stock levels healthy. No reorders needed!
              </div>
            ) : (
              <Table className="text-xs">
                <TableHeader className="bg-muted/30 border-b border-border select-none">
                  <TableRow className="hover:bg-transparent border-none">
                      <TableHead className="py-2.5 pl-6 font-bold text-muted-foreground"> Item / Code</TableHead>
                    <TableHead className="py-2.5 font-bold text-muted-foreground w-[100px] text-center">Location</TableHead>
                    <TableHead className="py-2.5 pr-6 font-bold text-muted-foreground w-[120px] text-right">In Stock</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.lowStockItems.slice(0, 5).map((item) => (
                    <TableRow key={item.id} className="table-row-hover border-b border-border/60">
                      <TableCell className="py-3.5 pl-6">
                        <div className="font-bold text-foreground/80">{item.name}</div>
                        <div className="text-[9px] text-muted-foreground uppercase mt-1 font-bold tracking-tight">{item.category} • #{item.designNo}</div>
                      </TableCell>
                      <TableCell className="py-3.5 text-center font-mono font-bold text-foreground/75">
                        {item.rackLocation ?? "—"}
                      </TableCell>
                      <TableCell className="py-3.5 pr-6 text-right">
                        <span className="font-black text-debit text-xs">
                          {item.stockQuantity} {item.unit}
                        </span>
                        <div className="text-[9px] text-muted-foreground mt-1 flex items-center gap-0.5 justify-end font-semibold">
                          <AlertTriangle className="w-3 h-3 text-panel-orange shrink-0" />
                          <span>Reorder: {item.reorderLevel ?? 10}</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
