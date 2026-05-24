"use client";

import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  Banknote,
  FileCheck,
  Inbox,
  Package,
  ReceiptText,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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

type StatPanelProps = {
  title: string;
  value: ReactNode;
  description: string;
  meta: string;
  icon: LucideIcon;
  tone: "yellow" | "orange" | "black";
};

const panelToneClass: Record<StatPanelProps["tone"], string> = {
  yellow: "panel-yellow",
  orange: "panel-orange",
  black: "panel-black",
};

const barToneClass = {
  credit: "bg-credit",
  debit: "bg-debit",
  accent: "bg-accent",
};

function getShare(value: number, max: number) {
  if (value <= 0) return 2;
  return Math.max(8, Math.round((value / max) * 100));
}

function StatPanel({ title, value, description, meta, icon: Icon, tone }: StatPanelProps) {
  return (
    <section
      className={`${panelToneClass[tone]} rounded-[var(--radius-card)] p-4 shadow-[var(--shadow-card)] transition-transform duration-150 hover:-translate-y-0.5`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-wider opacity-70">{title}</p>
          <div className="mt-4 text-3xl font-black tracking-tight">{value}</div>
          <p className="mt-1 text-xs font-semibold opacity-75">{description}</p>
        </div>
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-background/20">
          <Icon className="h-4 w-4 opacity-75" />
        </div>
      </div>
      <div className="mt-5 flex items-center justify-between border-t border-current/15 pt-3 text-[10px] font-bold uppercase tracking-wide opacity-75">
        <span>Status</span>
        <span>{meta}</span>
      </div>
    </section>
  );
}

function BalanceLine({
  label,
  value,
  share,
  tone,
}: {
  label: string;
  value: number;
  share: number;
  tone: keyof typeof barToneClass;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-3 text-[11px] font-semibold">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-mono text-foreground">{formatCurrency(value)}</span>
      </div>
      <div className="h-2 rounded-[var(--radius-pill)] bg-muted">
        <div className={`h-full rounded-[var(--radius-pill)] ${barToneClass[tone]}`} style={{ width: `${share}%` }} />
      </div>
    </div>
  );
}

export function DashboardClient({ data }: { data: DashboardData }) {
  const totalLiquidCash = data.cashBalance + data.bankBalance;
  const maxBalance = Math.max(totalLiquidCash, data.debtorsTotal, data.creditorsTotal, 1);
  const receivablesLabel = data.debtorsTotal > data.creditorsTotal ? "Collection focus" : "Within range";
  const stockStatus = data.lowStockItems.length > 0 ? "Action needed" : "Healthy";

  return (
    <div className="space-y-5 text-foreground">
      <header className="flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-accent" />
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Executive view</p>
          </div>
          <h1 className="mt-2 text-2xl font-black tracking-tight text-foreground">Dashboard</h1>
          <p className="mt-1 text-xs font-medium text-muted-foreground">
            FY 2026-27 account health, stock exceptions, and recent receivables.
          </p>
        </div>
        <Badge variant="outline" className="w-fit gap-1.5 border-credit/25 bg-credit/10 text-credit">
          <span className="h-1.5 w-1.5 rounded-full bg-credit" />
          Local database healthy
        </Badge>
      </header>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <StatPanel
          title="Sales today"
          value={data.todaySalesCount}
          description="Sales vouchers posted"
          meta={`${data.totalVouchers} lifetime`}
          icon={ReceiptText}
          tone="yellow"
        />
        <StatPanel
          title="Stock exceptions"
          value={data.lowStockItems.length}
          description="Items below reorder level"
          meta={stockStatus}
          icon={Package}
          tone="orange"
        />
        <StatPanel
          title="Liquid funds"
          value={formatCurrency(totalLiquidCash)}
          description="Cash and bank combined"
          meta="Available"
          icon={Banknote}
          tone="black"
        />
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="overflow-hidden">
          <CardHeader className="border-b border-border bg-muted/35">
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle>Balance Exposure</CardTitle>
                <CardDescription>Cash position compared with receivables and payables.</CardDescription>
              </div>
              <Badge variant="outline" className="border-accent/25 bg-accent/10 text-accent">
                {receivablesLabel}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 p-4">
            <BalanceLine
              label="Cash and bank"
              value={totalLiquidCash}
              share={getShare(totalLiquidCash, maxBalance)}
              tone="credit"
            />
            <BalanceLine
              label="Receivables"
              value={data.debtorsTotal}
              share={getShare(data.debtorsTotal, maxBalance)}
              tone="debit"
            />
            <BalanceLine
              label="Payables"
              value={data.creditorsTotal}
              share={getShare(data.creditorsTotal, maxBalance)}
              tone="accent"
            />
            <div className="grid grid-cols-1 gap-3 border-t border-border pt-4 sm:grid-cols-2">
              <div className="surface-inset rounded-[var(--radius-card)] p-3">
                <div className="flex items-center gap-2 text-debit">
                  <TrendingDown className="h-4 w-4" />
                  <span className="text-[10px] font-black uppercase tracking-wider">Receivables</span>
                </div>
                <div className="mt-2 text-lg font-black tracking-tight text-debit">{formatCurrency(data.debtorsTotal)}</div>
                <p className="text-[11px] font-medium text-muted-foreground">{data.recentDebtors.length} active debtor ledgers</p>
              </div>
              <div className="surface-inset rounded-[var(--radius-card)] p-3">
                <div className="flex items-center gap-2 text-credit">
                  <TrendingUp className="h-4 w-4" />
                  <span className="text-[10px] font-black uppercase tracking-wider">Payables</span>
                </div>
                <div className="mt-2 text-lg font-black tracking-tight text-credit">{formatCurrency(data.creditorsTotal)}</div>
                <p className="text-[11px] font-medium text-muted-foreground">Supplier and liability exposure</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="border-b border-border bg-muted/35">
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle>Operating Snapshot</CardTitle>
                <CardDescription>Quick checks for the current day book.</CardDescription>
              </div>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 lg:grid-cols-1">
            <div className="surface-inset rounded-[var(--radius-card)] p-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Cash in hand</span>
                <Banknote className="h-4 w-4 text-credit" />
              </div>
              <div className="mt-2 font-mono text-base font-black">{formatCurrency(data.cashBalance)}</div>
            </div>
            <div className="surface-inset rounded-[var(--radius-card)] p-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Bank registry</span>
                <Banknote className="h-4 w-4 text-accent" />
              </div>
              <div className="mt-2 font-mono text-base font-black">{formatCurrency(data.bankBalance)}</div>
            </div>
            <div className="surface-inset rounded-[var(--radius-card)] p-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Voucher volume</span>
                <ReceiptText className="h-4 w-4 text-accent" />
              </div>
              <div className="mt-2 font-mono text-base font-black">{data.totalVouchers}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <Card className="overflow-hidden">
          <CardHeader className="border-b border-border bg-muted/35">
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle>Receivables Watchlist</CardTitle>
                <CardDescription>Highest debtor balances needing follow-up.</CardDescription>
              </div>
              <Badge variant="outline" className="border-debit/25 bg-debit/10 text-debit">
                Sundry debtors
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {data.recentDebtors.length === 0 ? (
              <div className="py-14 text-center text-xs font-semibold text-muted-foreground">
                <Inbox className="mx-auto mb-2.5 h-8 w-8 text-muted-foreground" />
                No outstanding debtors found.
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-muted/25">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="pl-4">Ledger</TableHead>
                    <TableHead className="w-[120px]">Phone</TableHead>
                    <TableHead className="w-[140px] pr-4 text-right">Debit balance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.recentDebtors.map((debtor) => (
                    <TableRow key={debtor.id} className="table-row-hover">
                      <TableCell className="pl-4 font-semibold text-foreground">{debtor.name}</TableCell>
                      <TableCell className="font-mono text-[11px] text-muted-foreground">{debtor.phone ?? "Not set"}</TableCell>
                      <TableCell className="pr-4 text-right">
                        <span className="font-mono font-black text-debit">{formatCurrency(debtor.openingBalance)}</span>
                        <Badge variant="outline" className="ml-2 border-debit/20 bg-debit/10 text-[9px] text-debit">
                          Dr
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="border-b border-border bg-muted/35">
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle>Stock Exceptions</CardTitle>
                <CardDescription>Inventory running below reorder levels.</CardDescription>
              </div>
              <Badge className="panel-orange border-none">{data.lowStockItems.length} open</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {data.lowStockItems.length === 0 ? (
              <div className="py-14 text-center text-xs font-semibold text-credit">
                <FileCheck className="mx-auto mb-2.5 h-8 w-8 text-credit" />
                Stock levels are healthy.
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-muted/25">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="pl-4">Item</TableHead>
                    <TableHead className="w-[100px] text-center">Location</TableHead>
                    <TableHead className="w-[130px] pr-4 text-right">Available</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.lowStockItems.slice(0, 5).map((item) => (
                    <TableRow key={item.id} className="table-row-hover">
                      <TableCell className="pl-4">
                        <div className="font-semibold text-foreground">{item.name}</div>
                        <div className="mt-0.5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                          {item.category} / #{item.designNo}
                        </div>
                      </TableCell>
                      <TableCell className="text-center font-mono text-[11px] font-semibold text-muted-foreground">
                        {item.rackLocation ?? "Not set"}
                      </TableCell>
                      <TableCell className="pr-4 text-right">
                        <div className="font-mono font-black text-debit">
                          {item.stockQuantity} {item.unit}
                        </div>
                        <div className="mt-0.5 flex items-center justify-end gap-1 text-[10px] font-semibold text-muted-foreground">
                          <AlertTriangle className="h-3 w-3 text-panel-orange" />
                          <span>Reorder {item.reorderLevel ?? 10}</span>
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
