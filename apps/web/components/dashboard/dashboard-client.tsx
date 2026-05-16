"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  TrendingDown,
  Users,
  Banknote,
  Package,
  AlertTriangle,
  ReceiptText,
  Activity,
  ArrowUpRight,
} from "lucide-react";
import { formatCurrency } from "@/lib/types";
import type { InferSelectModel } from "@repo/database";
import type { inventoryItems as inventoryItemsTable, ledgers as ledgersTable } from "@repo/database";

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

const METRIC_CARDS = (data: DashboardData) => [
  {
    title: "Customer Dues",
    value: formatCurrency(data.debtorsTotal),
    icon: Users,
    trend: "up",
    sub: `${data.recentDebtors.length} active debtors`,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
  },
  {
    title: "Supplier Dues",
    value: formatCurrency(data.creditorsTotal),
    icon: TrendingDown,
    trend: "down",
    sub: "Payable to suppliers",
    color: "text-amber-500",
    bg: "bg-amber-500/10",
  },
  {
    title: "Cash in Hand",
    value: formatCurrency(data.cashBalance),
    icon: Banknote,
    trend: "neutral",
    sub: "Opening balance",
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
  },
  {
    title: "Bank Balance",
    value: formatCurrency(data.bankBalance),
    icon: Activity,
    trend: "neutral",
    sub: "All accounts combined",
    color: "text-violet-500",
    bg: "bg-violet-500/10",
  },
  {
    title: "Today's Sales",
    value: `${data.todaySalesCount} bills`,
    icon: ReceiptText,
    trend: "up",
    sub: "Vouchers posted today",
    color: "text-pink-500",
    bg: "bg-pink-500/10",
  },
  {
    title: "Total Vouchers",
    value: data.totalVouchers.toString(),
    icon: TrendingUp,
    trend: "up",
    sub: "All time entries",
    color: "text-cyan-500",
    bg: "bg-cyan-500/10",
  },
];

export function DashboardClient({ data }: { data: DashboardData }) {
  const metrics = METRIC_CARDS(data);

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Shree Saree House · FY 2025–26
        </p>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {metrics.map((m) => (
          <Card
            key={m.title}
            className="relative overflow-hidden border-border/60 bg-card/80 backdrop-blur hover:shadow-md transition-shadow"
          >
            <div className={`absolute top-0 right-0 w-24 h-24 rounded-full ${m.bg} blur-2xl opacity-60 -mr-8 -mt-8 pointer-events-none`} />
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardDescription className="text-xs font-medium">{m.title}</CardDescription>
                <div className={`p-1.5 rounded-lg ${m.bg}`}>
                  <m.icon className={`w-4 h-4 ${m.color}`} />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tracking-tight">{m.value}</div>
              <div className="flex items-center gap-1 mt-1">
                {m.trend === "up" && <ArrowUpRight className="w-3 h-3 text-emerald-500" />}
                <span className="text-xs text-muted-foreground">{m.sub}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Bottom section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top debtors */}
        <Card className="border-border/60 bg-card/80 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              <span>Top Outstanding Customers</span>
              <Badge variant="secondary" className="font-mono text-xs">
                Receivables
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.recentDebtors.length === 0 ? (
              <p className="text-muted-foreground text-sm">No debtors found.</p>
            ) : (
              data.recentDebtors.map((d) => (
                <div
                  key={d.id}
                  className="flex items-center justify-between py-2 border-b border-border/40 last:border-0"
                >
                  <div>
                    <div className="font-medium text-sm">{d.name}</div>
                    <div className="text-xs text-muted-foreground">{d.phone ?? "—"}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-sm text-blue-500">
                      {formatCurrency(d.openingBalance)}
                    </div>
                    <div className="text-xs text-muted-foreground">Dr</div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Low stock alerts */}
        <Card className="border-border/60 bg-card/80 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              <span>Low Stock Alerts</span>
              <Badge variant="destructive" className="font-mono text-xs">
                {data.lowStockItems.length} items
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.lowStockItems.length === 0 ? (
              <p className="text-muted-foreground text-sm">All stock levels healthy.</p>
            ) : (
              data.lowStockItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 py-2 border-b border-border/40 last:border-0"
                >
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                    <Package className="w-4 h-4 text-amber-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{item.name}</div>
                    <div className="text-xs text-muted-foreground">{item.category} · {item.rackLocation}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div
                      className={`font-bold text-sm ${
                        item.stockQuantity === 0
                          ? "text-destructive"
                          : "text-amber-500"
                      }`}
                    >
                      {item.stockQuantity} {item.unit}
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center gap-0.5 justify-end">
                      <AlertTriangle className="w-2.5 h-2.5" />
                      {item.reorderLevel ?? 10} min
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
