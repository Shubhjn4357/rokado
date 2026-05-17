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
  
  // High-Density Tally-Inspired Financial Indicators Data Structure
  const stats = [
    {
      title: "RECEIVABLES (SUNDRY DEBTORS)",
      value: formatCurrency(data.debtorsTotal),
      sub: `${data.recentDebtors.length} outstanding accounts`,
      color: "text-[#1E7D32]", // Green credit indicator
      bg: "bg-[#E8F5E9]/50 border-[#1E7D32]/20",
      desc: "Total due from clients"
    },
    {
      title: "PAYABLES (SUNDRY CREDITORS)",
      value: formatCurrency(data.creditorsTotal),
      sub: "Active liabilities in ledger",
      color: "text-[#C62828]", // Red debit indicator
      bg: "bg-[#FDECEC]/50 border-[#C62828]/20",
      desc: "Outstanding supplier payments"
    },
    {
      title: "CASH IN HAND BALANCE",
      value: formatCurrency(data.cashBalance),
      sub: "Liquid cash registry sum",
      color: "text-[#1F3A5F]",
      bg: "bg-[#EAF1F8]/50 border-[#1F3A5F]/20",
      desc: "Petty cash account balance"
    },
    {
      title: "BANK REGISTRY ACCOUNTS",
      value: formatCurrency(data.bankBalance),
      sub: "Combined institutional balance",
      color: "text-[#1F3A5F]",
      bg: "bg-[#EAF1F8]/50 border-[#1F3A5F]/20",
      desc: "All active bank ledgers"
    },
    {
      title: "DAILY VOUCHERS FILED",
      value: `${data.todaySalesCount} sales bills`,
      sub: "Transaction postings filed today",
      color: "text-[#2F6FED]",
      bg: "bg-[#DCE8FF]/40 border-[#2F6FED]/20",
      desc: "Today's sales transactions"
    },
    {
      title: "CUMULATIVE LEDGER ENTRIES",
      value: data.totalVouchers.toString(),
      sub: "All-time journal postings",
      color: "text-[#1B1F23]",
      bg: "bg-muted/40 border-border/80",
      desc: "Total database transactions count"
    }
  ];

  return (
    <div className="space-y-6 font-mono text-[#1B1F23]">
      
      {/* Tally Workspace Title Header */}
      <div className="flex items-center justify-between border-b-2 border-[#1F3A5F]/10 pb-3 select-none">
        <div>
          <h1 className="text-base font-extrabold uppercase tracking-wide flex items-center gap-2">
            <Zap className="w-4 h-4 text-[#2F6FED] animate-pulse" />
            Gateway of Tally : Dashboard Summary
          </h1>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            Active Accounting Period: FY 2026–27 · Shree Saree House
          </p>
        </div>
        <div className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 border border-emerald-200 uppercase rounded-sm">
          ● Secure Localhost Database
        </div>
      </div>

      {/* STATS MATRIX SECTION (High-Density Tally Cards) */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3.5 select-none">
        {stats.map((s) => (
          <div
            key={s.title}
            className={`border px-4 py-3 rounded-sm bg-surface transition-shadow shadow-sm hover:shadow-md ${s.bg}`}
          >
            <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">{s.title}</div>
            <div className={`text-lg font-black tracking-tight mt-1 font-mono ${s.color}`}>
              {s.value}
            </div>
            <div className="text-[10px] text-[#5B6573] mt-1.5 flex items-center justify-between font-sans">
              <span>{s.sub}</span>
              <span className="text-[9px] opacity-60 italic font-mono uppercase tracking-tight">{s.desc}</span>
            </div>
          </div>
        ))}
      </div>

      {/* REPORTING COLUMNS (OUTSTANDING & STOCK ALERTS) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* Receivables Master Ledger */}
        <Card className="border border-border/80 bg-surface rounded-sm overflow-hidden shadow-sm">
          <CardHeader className="bg-tableHeader/70 border-b border-border/60 py-2.5 px-4 flex flex-row items-center justify-between select-none">
            <div>
              <CardTitle className="text-xs font-black uppercase text-[#1F3A5F] tracking-wider">
                Top Outstanding Accounts (Receivables)
              </CardTitle>
              <CardDescription className="text-[9px] mt-0.5 font-sans">
                A-group debit balances requiring immediate collection
              </CardDescription>
            </div>
            <Badge variant="outline" className="font-mono text-[9px] font-bold uppercase tracking-wider text-[#1F3A5F] border-[#1F3A5F]/20 bg-[#EAF1F8]">
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
                <TableHeader className="bg-muted/30 border-b border-border/40 select-none">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="py-1.5 font-bold">Ledger/Particulars</TableHead>
                    <TableHead className="py-1.5 font-bold w-[120px]">Phone Number</TableHead>
                    <TableHead className="py-1.5 font-bold w-[120px] text-right">Debit Balance (₹)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.recentDebtors.map((d) => (
                    <TableRow key={d.id} className="hover:bg-muted/10">
                      <TableCell className="py-2.5 font-semibold text-slate-800">
                        {d.name}
                      </TableCell>
                      <TableCell className="py-2.5 font-mono text-[11px] text-[#5B6573]">
                        {d.phone ?? "—"}
                      </TableCell>
                      <TableCell className="py-2.5 text-right font-extrabold text-[#C62828] text-sm">
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
        <Card className="border border-border/80 bg-surface rounded-sm overflow-hidden shadow-sm">
          <CardHeader className="bg-tableHeader/70 border-b border-border/60 py-2.5 px-4 flex flex-row items-center justify-between select-none">
            <div>
              <CardTitle className="text-xs font-black uppercase text-[#1F3A5F] tracking-wider">
                Critical Inventory Shortfall & Reorder Alerts
              </CardTitle>
              <CardDescription className="text-[9px] mt-0.5 font-sans">
                Sarees and items running below safety stock margins
              </CardDescription>
            </div>
            <Badge variant="destructive" className="font-mono text-[9px] font-bold uppercase tracking-wider bg-[#C62828] text-white">
              {data.lowStockItems.length} Exceptions
            </Badge>
          </CardHeader>
          
          <CardContent className="p-0">
            {data.lowStockItems.length === 0 ? (
              <div className="py-12 text-center text-xs text-[#1E7D32] bg-[#E8F5E9]/10 font-sans">
                <FileCheck className="w-8 h-8 mx-auto mb-2 opacity-40 text-[#1E7D32]" />
                All stock levels healthy. No reorders needed!
              </div>
            ) : (
              <Table className="text-xs">
                <TableHeader className="bg-muted/30 border-b border-border/40 select-none">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="py-1.5 font-bold">Saree Item / Code</TableHead>
                    <TableHead className="py-1.5 font-bold w-[100px] text-center">Location</TableHead>
                    <TableHead className="py-1.5 font-bold w-[120px] text-right">In Stock</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.lowStockItems.map((item) => (
                    <TableRow key={item.id} className="hover:bg-[#FDECEC]/30">
                      <TableCell className="py-2.5">
                        <div className="font-semibold text-slate-800">{item.name}</div>
                        <div className="text-[10px] text-[#8A94A6] uppercase mt-0.5 font-sans">{item.category} • #{item.designNo}</div>
                      </TableCell>
                      <TableCell className="py-2.5 text-center font-mono font-bold text-slate-600">
                        {item.rackLocation ?? "—"}
                      </TableCell>
                      <TableCell className="py-2.5 text-right shrink-0">
                        <span className="font-extrabold text-[#C62828] text-sm">
                          {item.stockQuantity} {item.unit}
                        </span>
                        <div className="text-[10px] text-[#8A94A6] mt-0.5 flex items-center gap-0.5 justify-end font-sans">
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
