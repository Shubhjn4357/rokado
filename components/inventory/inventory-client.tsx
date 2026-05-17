"use client";

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Search,
  Plus,
  Package,
  AlertTriangle,
  LayoutGrid,
  LayoutList,
} from "lucide-react";
import { formatCurrency, INVENTORY_CATEGORIES, type InventoryCategory } from "@/lib/types";
import type { InferSelectModel } from "@/lib/database";
import type { inventoryItems as inventoryTable } from "@/lib/database";

type InventoryItem = InferSelectModel<typeof inventoryTable>;

const STOCK_STATUS = (item: InventoryItem): "ok" | "low" | "out" => {
  if (item.stockQuantity === 0) return "out";
  if (item.stockQuantity <= (item.reorderLevel ?? 10)) return "low";
  return "ok";
};

const STATUS_STYLES = {
  ok: "text-emerald-500 bg-emerald-500/10",
  low: "text-amber-500 bg-amber-500/10",
  out: "text-destructive bg-destructive/10",
};

const STATUS_LABELS = { ok: "In Stock", low: "Low Stock", out: "Out of Stock" };

const ALL = "all";

export function InventoryClient({ items }: { items: InventoryItem[] }) {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>(ALL);
  const [statusFilter, setStatusFilter] = useState<string>(ALL);
  const [view, setView] = useState<"table" | "grid">("table");

  const categories = useMemo(() => Array.from(new Set(items.map((i) => i.category))), [items]);

  const filtered = useMemo(() => {
    return items.filter((item) => {
      const matchSearch =
        !search ||
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        (item.designNo && item.designNo.toLowerCase().includes(search.toLowerCase())) ||
        (item.color && item.color.toLowerCase().includes(search.toLowerCase()));
      const matchCategory = categoryFilter === ALL || item.category === categoryFilter;
      const matchStatus = statusFilter === ALL || STOCK_STATUS(item) === statusFilter;
      return matchSearch && matchCategory && matchStatus;
    });
  }, [items, search, categoryFilter, statusFilter]);

  // Summary stats
  const totalValue = items.reduce((s, i) => s + i.saleRate * i.stockQuantity, 0);
  const lowCount = items.filter((i) => STOCK_STATUS(i) === "low").length;
  const outCount = items.filter((i) => STOCK_STATUS(i) === "out").length;

  return (
    <div className="space-y-4">
      {/* Summary mini cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Items", value: items.length.toString(), color: "text-primary" },
          { label: "Total Value", value: formatCurrency(totalValue), color: "text-emerald-500" },
          { label: "Low Stock", value: lowCount.toString(), color: "text-amber-500" },
          { label: "Out of Stock", value: outCount.toString(), color: "text-destructive" },
        ].map((s) => (
          <Card key={s.label} className="border-border/60 bg-card/80">
            <CardContent className="pt-4 pb-3">
              <div className="text-xs text-muted-foreground">{s.label}</div>
              <div className={`text-xl font-bold mt-0.5 ${s.color}`}>{s.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search item, design no., color..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 bg-muted/40 rounded-xl"
          />
        </div>

        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-44 h-9 rounded-xl bg-muted/40">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All Categories</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36 h-9 rounded-xl bg-muted/40">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All Status</SelectItem>
            <SelectItem value="ok">In Stock</SelectItem>
            <SelectItem value="low">Low Stock</SelectItem>
            <SelectItem value="out">Out of Stock</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex gap-1 ml-auto">
          <Button
            variant={view === "table" ? "secondary" : "ghost"}
            size="icon"
            className="w-9 h-9 rounded-xl"
            onClick={() => setView("table")}
          >
            <LayoutList className="w-4 h-4" />
          </Button>
          <Button
            variant={view === "grid" ? "secondary" : "ghost"}
            size="icon"
            className="w-9 h-9 rounded-xl"
            onClick={() => setView("grid")}
          >
            <LayoutGrid className="w-4 h-4" />
          </Button>
        </div>

        <Button size="sm" className="h-9 rounded-xl gap-2">
          <Plus className="w-4 h-4" /> Add Item
        </Button>
      </div>

      {/* Grid view */}
      {view === "grid" && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filtered.map((item) => {
            const status = STOCK_STATUS(item);
            return (
              <Card
                key={item.id}
                className="border-border/60 bg-card/80 hover:shadow-md transition-shadow cursor-pointer relative overflow-hidden"
              >
                {status === "low" || status === "out" ? (
                  <div className="absolute top-2 right-2">
                    <AlertTriangle className={`w-3.5 h-3.5 ${status === "out" ? "text-destructive" : "text-amber-500"}`} />
                  </div>
                ) : null}
                <CardContent className="pt-4 pb-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                    <Package className="w-5 h-5 text-primary" />
                  </div>
                  <div className="font-semibold text-sm leading-snug line-clamp-2">{item.name}</div>
                  <div className="text-xs text-muted-foreground mt-1">{item.category}</div>
                  <div className="flex items-center justify-between mt-3">
                    <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${STATUS_STYLES[status]}`}>
                      {item.stockQuantity} {item.unit}
                    </span>
                    <span className="text-sm font-bold">₹{item.saleRate.toLocaleString("en-IN")}</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Table view */}
      {view === "table" && (
        <div className="rounded-xl border border-border/60 bg-card/80 backdrop-blur overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="hover:bg-transparent">
                <TableHead>Item Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Design / Color</TableHead>
                <TableHead>HSN</TableHead>
                <TableHead className="text-right">Buy Rate</TableHead>
                <TableHead className="text-right">Sale Rate</TableHead>
                <TableHead className="text-right">GST%</TableHead>
                <TableHead className="text-right">Stock</TableHead>
                <TableHead>Barcode</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center text-muted-foreground py-16">
                    No items found.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((item) => {
                  const status = STOCK_STATUS(item);
                  return (
                    <TableRow key={item.id} className="hover:bg-muted/20 cursor-pointer">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                            <Package className="w-3.5 h-3.5 text-primary" />
                          </div>
                          <div className="font-medium text-sm max-w-[200px] truncate">{item.name}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs font-normal">{item.category}</Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {item.designNo ?? "—"} {item.color ? `· ${item.color}` : ""}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">{item.hsnCode ?? "—"}</TableCell>
                      <TableCell className="text-right font-mono text-sm">{formatCurrency(item.purchaseRate)}</TableCell>
                      <TableCell className="text-right font-mono text-sm font-semibold">{formatCurrency(item.saleRate)}</TableCell>
                      <TableCell className="text-right text-sm">{item.gstPercent}%</TableCell>
                      <TableCell className="text-right font-mono font-semibold">
                        {item.stockQuantity} {item.unit}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">{item.barcode ?? "—"}</TableCell>
                      <TableCell>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_STYLES[status]}`}>
                          {STATUS_LABELS[status]}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <div className="text-xs text-muted-foreground text-right">
        Showing {filtered.length} of {items.length} items
      </div>
    </div>
  );
}
