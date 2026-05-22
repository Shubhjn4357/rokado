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
  Inbox
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
  
  // Clean modern financial indicators
  const stats = [
    {
      title: "Receivables (Sundry Debtors)",
      value: formatCurrency(data.debtorsTotal),
      sub: `${data.recentDebtors.length} outstanding accounts`,
      color: "text-emerald-650 dark:text-emerald-400",
      bg: "bg-emerald-500/5 dark:bg-emerald-500/5 border-emerald-500/10 dark:border-emerald-500/20",
      desc: "Total due from clients"
    },
    {
      title: "Payables (Sundry Creditors)",
      value: formatCurrency(data.creditorsTotal),
      sub: "Active liabilities in ledger",
      color: "text-rose-600 dark:text-rose-400",
      bg: "bg-rose-500/5 dark:bg-rose-500/5 border-rose-500/10 dark:border-rose-500/20",
      desc: "Outstanding supplier payments"
    },
    {
      title: "Cash in Hand Balance",
      value: formatCurrency(data.cashBalance),
      sub: "Liquid cash registry sum",
      color: "text-indigo-600 dark:text-indigo-400",
      bg: "bg-indigo-500/5 dark:bg-indigo-500/5 border-indigo-500/10 dark:border-indigo-500/20",
      desc: "Petty cash account balance"
    },
    {
      title: "Bank Registry Accounts",
      value: formatCurrency(data.bankBalance),
      sub: "Combined institutional balance",
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-500/5 dark:bg-blue-500/5 border-blue-500/10 dark:border-blue-500/20",
      desc: "All active bank ledgers"
    },
    {
      title: "Daily Vouchers Filed",
      value: `${data.todaySalesCount} sales bills`,
      sub: "Transaction postings filed today",
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-500/5 dark:bg-amber-500/5 border-amber-500/10 dark:border-amber-500/20",
      desc: "Today's sales transactions"
    },
    {
      title: "Cumulative Ledger Entries",
      value: data.totalVouchers.toString(),
      sub: "All-time journal postings",
      color: "text-foreground",
      bg: "bg-muted/30 border-border/60",
      desc: "Total database transactions count"
    }
  ];

  return (
    <div className="space-y-6 font-sans text-foreground">
      
      {/* Elegant Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-border/40 pb-4 select-none gap-4">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            <Zap className="w-4 h-4 text-blue-500 animate-pulse" />
            Financial Overview
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Active Accounting Period: FY 2026–27 · Shree Saree House
          </p>
        </div>
        <div className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 uppercase rounded-full shrink-0">
          ● Secure Local Database
        </div>
      </div>

      {/* STATS MATRIX SECTION */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 select-none">
        {stats.map((s) => (
          <div
            key={s.title}
            className={`border p-4 rounded-xl transition-all shadow-sm hover:shadow-md ${s.bg}`}
          >
            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{s.title}</div>
            <div className={`text-xl font-extrabold tracking-tight mt-1.5 font-sans ${s.color}`}>
              {s.value}
            </div>
            <div className="text-xs text-muted-foreground mt-2 flex items-center justify-between font-sans">
              <span>{s.sub}</span>
              <span className="text-[9px] opacity-75 italic font-sans uppercase tracking-tight">{s.desc}</span>
            </div>
          </div>
        ))}
      </div>

      {/* REPORTING COLUMNS (OUTSTANDING & STOCK ALERTS) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Receivables Master Ledger */}
        <Card className="border border-border/60 bg-card rounded-2xl overflow-hidden shadow-sm">
          <CardHeader className="bg-muted/10 border-b border-border/40 py-3.5 px-5 flex flex-row items-center justify-between select-none">
            <div>
              <CardTitle className="text-xs font-black uppercase text-foreground tracking-wider">
                Top Outstanding Accounts (Receivables)
              </CardTitle>
              <CardDescription className="text-[10px] mt-1 font-sans">
                A-group debit balances requiring immediate collection
              </CardDescription>
            </div>
            <Badge variant="outline" className="font-sans text-[9px] font-bold uppercase tracking-wider text-muted-foreground border-border bg-muted/40">
              Sundry Debtors
            </Badge>
          </CardHeader>
          
          <CardContent className="p-0">
            {data.recentDebtors.length === 0 ? (
              <div className="py-12 text-center text-xs text-muted-foreground font-sans">
                <Inbox className="w-8 h-8 mx-auto mb-2 opacity-30" />
                No outstanding debtors found.
              </div>
            ) : (
              <Table className="text-xs">
                <TableHeader className="bg-muted/20 border-b border-border/40 select-none">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="py-2 font-bold">Ledger/Particulars</TableHead>
                    <TableHead className="py-2 font-bold w-[120px]">Phone Number</TableHead>
                    <TableHead className="py-2 font-bold w-[120px] text-right">Debit Balance (₹)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.recentDebtors.map((d) => (
                    <TableRow key={d.id} className="hover:bg-muted/5 border-b border-border/20 last:border-0">
                      <TableCell className="py-3 font-semibold text-foreground">
                        {d.name}
                      </TableCell>
                      <TableCell className="py-3 font-mono text-[11px] text-muted-foreground">
                        {d.phone ?? "—"}
                      </TableCell>
                      <TableCell className="py-3 text-right font-extrabold text-rose-600 dark:text-rose-400 text-sm">
                        {formatCurrency(d.openingBalance)} <span className="text-[10px] font-bold">Dr</span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Inventory Stock Exception Alerts */}
        <Card className="border border-border/60 bg-card rounded-2xl overflow-hidden shadow-sm">
          <CardHeader className="bg-muted/10 border-b border-border/40 py-3.5 px-5 flex flex-row items-center justify-between select-none">
            <div>
              <CardTitle className="text-xs font-black uppercase text-foreground tracking-wider">
                Critical Inventory Shortfall & Reorder Alerts
              </CardTitle>
              <CardDescription className="text-[10px] mt-1 font-sans">
                Sarees and items running below safety stock margins
              </CardDescription>
            </div>
            <Badge variant="destructive" className="font-sans text-[9px] font-bold uppercase tracking-wider bg-rose-600 text-white border-none">
              {data.lowStockItems.length} Exceptions
            </Badge>
          </CardHeader>
          
          <CardContent className="p-0">
            {data.lowStockItems.length === 0 ? (
              <div className="py-12 text-center text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-500/5 font-sans">
                <FileCheck className="w-8 h-8 mx-auto mb-2 opacity-40 text-emerald-500" />
                All stock levels healthy. No reorders needed!
              </div>
            ) : (
              <Table className="text-xs">
                <TableHeader className="bg-muted/20 border-b border-border/40 select-none">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="py-2 font-bold">Saree Item / Code</TableHead>
                    <TableHead className="py-2 font-bold w-[100px] text-center">Location</TableHead>
                    <TableHead className="py-2 font-bold w-[120px] text-right">In Stock</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.lowStockItems.map((item) => (
                    <TableRow key={item.id} className="hover:bg-muted/5 border-b border-border/20 last:border-0">
                      <TableCell className="py-3">
                        <div className="font-semibold text-foreground">{item.name}</div>
                        <div className="text-[10px] text-muted-foreground uppercase mt-1 font-sans">{item.category} • #{item.designNo}</div>
                      </TableCell>
                      <TableCell className="py-3 text-center font-mono font-bold text-foreground/80">
                        {item.rackLocation ?? "—"}
                      </TableCell>
                      <TableCell className="py-3 text-right">
                        <span className="font-extrabold text-rose-600 dark:text-rose-400 text-sm">
                          {item.stockQuantity} {item.unit}
                        </span>
                        <div className="text-[10px] text-muted-foreground mt-1 flex items-center gap-0.5 justify-end font-sans">
                          <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
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
