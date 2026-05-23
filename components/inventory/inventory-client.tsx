"use client";

import { useState, useMemo, useTransition } from "react";
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
  Edit2,
  Trash2,
  Sliders,
  Loader2,
  MoreVertical,
  RefreshCw,
} from "lucide-react";
import { formatCurrency, INVENTORY_CATEGORIES, type InventoryCategory } from "@/lib/types";
import type { InferSelectModel } from "@/lib/database";
import type { inventoryItems as inventoryTable } from "@/lib/database";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter } from "next/navigation";
import { toast } from "@/components/ui/use-toast";
import {
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  adjustStock,
} from "@/app/(erp)/inventory/actions";

type InventoryItem = InferSelectModel<typeof inventoryTable>;

interface InventoryItemFormProps {
  item?: InventoryItem; // if edit
  onSuccess: () => void;
  onClose: () => void;
}

function InventoryItemForm({ item, onSuccess, onClose }: InventoryItemFormProps) {
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState(item?.name ?? "");
  const [category, setCategory] = useState<InventoryCategory>(item?.category ?? INVENTORY_CATEGORIES[0]);
  const [designNo, setDesignNo] = useState(item?.designNo ?? "");
  const [color, setColor] = useState(item?.color ?? "");
  const [purchaseRate, setPurchaseRate] = useState(item?.purchaseRate ?? 0);
  const [saleRate, setSaleRate] = useState(item?.saleRate ?? 0);
  const [gstPercent, setGstPercent] = useState(item?.gstPercent ?? 12);
  const [rackLocation, setRackLocation] = useState(item?.rackLocation ?? "");
  const [unit, setUnit] = useState(item?.unit ?? "pcs");
  const [hsnCode, setHsnCode] = useState(item?.hsnCode ?? "");
  const [barcode, setBarcode] = useState(item?.barcode ?? "");
  const [reorderLevel, setReorderLevel] = useState(item?.reorderLevel ?? 10);
  const [initialStock, setInitialStock] = useState(0); // only when adding
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name || !category) {
      setError("Name and Category are required.");
      return;
    }

    startTransition(async () => {
      try {
        if (item) {
          const res = await updateInventoryItem({
            id: item.id,
            name,
            category,
            designNo: designNo || undefined,
            color: color || undefined,
            purchaseRate,
            saleRate,
            gstPercent,
            rackLocation: rackLocation || undefined,
            unit,
            hsnCode: hsnCode || undefined,
            reorderLevel,
          });
          if (res.success) {
            toast({
              title: "Stock Item Updated",
              description: `Successfully updated item "${name}".`,
            });
            onSuccess();
          } else {
            setError(res.error);
          }
        } else {
          const res = await createInventoryItem({
            name,
            category,
            designNo: designNo || undefined,
            color: color || undefined,
            purchaseRate,
            saleRate,
            gstPercent,
            rackLocation: rackLocation || undefined,
            unit,
            hsnCode: hsnCode || undefined,
            barcode: barcode || undefined,
            reorderLevel,
            initialStock,
          });
          if (res.success) {
            toast({
              title: "Stock Item Created",
              description: `Successfully added new item "${name}" with initial stock of ${initialStock}.`,
            });
            onSuccess();
          } else {
            setError(res.error);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An unexpected error occurred.");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 py-2 text-xs font-sans">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2 space-y-1.5">
          <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Item Name / Particulars</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Premium Banarasi Silk " required className="h-9 rounded-xl text-xs bg-background/50 border-border/50" />
        </div>
        <div className="space-y-1.5 col-span-2 sm:col-span-1">
          <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Category</Label>
          <Select
            value={INVENTORY_CATEGORIES.includes(category as any) ? category : "Custom..."}
            onValueChange={(val) => {
              if (val === "Custom...") {
                setCategory("");
              } else {
                setCategory(val);
              }
            }}
          >
            <SelectTrigger className="h-9 rounded-xl text-xs bg-background/50 border-border/50">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {INVENTORY_CATEGORIES.map((c) => (
                <SelectItem key={c} value={c} className="text-xs">{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {(!INVENTORY_CATEGORIES.includes(category as any) || category === "") && (
            <div className="pt-1.5 animate-in fade-in-50 duration-200">
              <Label className="text-[9px] text-muted-foreground">Type Custom Category Name</Label>
              <Input
                placeholder="e.g. Silk Threads, Cotton, Garments"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
                className="h-8 rounded-lg text-xs mt-0.5 bg-background/50 border-border/50"
              />
            </div>
          )}
        </div>
        <div className="space-y-1.5">
          <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Design Number</Label>
          <Input value={designNo} onChange={(e) => setDesignNo(e.target.value)} placeholder="e.g. D-4509" className="h-9 rounded-xl text-xs bg-background/50 border-border/50" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Color / Shade</Label>
          <Input value={color} onChange={(e) => setColor(e.target.value)} placeholder="e.g. Royal Red" className="h-9 rounded-xl text-xs bg-background/50 border-border/50" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Unit of Measure</Label>
          <Input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="pcs, meters" className="h-9 rounded-xl text-xs bg-background/50 border-border/50" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Purchase Rate (₹)</Label>
          <Input type="number" min={0} step={0.01} value={purchaseRate || ""} onChange={(e) => setPurchaseRate(parseFloat(e.target.value) || 0)} className="h-9 rounded-xl font-mono text-xs bg-background/50 border-border/50" placeholder="0.00" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Sales Rate (₹)</Label>
          <Input type="number" min={0} step={0.01} value={saleRate || ""} onChange={(e) => setSaleRate(parseFloat(e.target.value) || 0)} className="h-9 rounded-xl font-mono text-xs bg-background/50 border-border/50" placeholder="0.00" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">GST duties (%)</Label>
          <Input type="number" min={0} step={0.1} value={gstPercent || ""} onChange={(e) => setGstPercent(parseFloat(e.target.value) || 0)} className="h-9 rounded-xl font-mono text-xs bg-background/50 border-border/50" placeholder="12" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">HSN Code</Label>
          <Input value={hsnCode} onChange={(e) => setHsnCode(e.target.value)} placeholder="e.g. 5007" className="h-9 rounded-xl font-mono text-xs bg-background/50 border-border/50" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Rack Location</Label>
          <Input value={rackLocation} onChange={(e) => setRackLocation(e.target.value)} placeholder="e.g. Shelf A-3" className="h-9 rounded-xl text-xs bg-background/50 border-border/50" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Reorder Warning Level</Label>
          <Input type="number" min={0} value={reorderLevel || ""} onChange={(e) => setReorderLevel(parseInt(e.target.value) || 0)} className="h-9 rounded-xl font-mono text-xs bg-background/50 border-border/50" />
        </div>
        {!item && (
          <div className="space-y-1.5">
            <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Initial Opening Stock</Label>
            <Input type="number" min={0} value={initialStock || ""} onChange={(e) => setInitialStock(parseInt(e.target.value) || 0)} className="h-9 rounded-xl font-mono text-xs bg-background/50 border-border/50" placeholder="0" />
          </div>
        )}
        {!item && (
          <div className="space-y-1.5 col-span-2">
            <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Barcode (Optional)</Label>
            <Input value={barcode} onChange={(e) => setBarcode(e.target.value)} placeholder="Scan or type barcode" className="h-9 rounded-xl font-mono text-xs bg-background/50 border-border/50" />
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 text-destructive text-xs bg-destructive/10 px-4 py-2.5 rounded-xl border border-destructive/20 animate-in fade-in duration-200">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <DialogFooter className="gap-2 border-t border-border/30 pt-4 mt-2">
        <Button type="button" variant="outline" onClick={onClose} className="rounded-xl h-9 text-xs">
          Cancel
        </Button>
        <Button type="submit" disabled={isPending} className="rounded-xl h-9 text-xs gap-1.5">
          {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          {item ? "Update Item" : "Create Item"}
        </Button>
      </DialogFooter>
    </form>
  );
}

interface AdjustStockFormProps {
  item: InventoryItem;
  onSuccess: () => void;
  onClose: () => void;
}

function AdjustStockForm({ item, onSuccess, onClose }: AdjustStockFormProps) {
  const [isPending, startTransition] = useTransition();
  const [quantity, setQuantity] = useState(0); // amount to adjust
  const [type, setType] = useState<"in" | "out">("in"); // positive or negative
  const [rate, setRate] = useState(item.purchaseRate);
  const [narration, setNarration] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (quantity <= 0) {
      setError("Please specify a positive adjustment quantity.");
      return;
    }

    startTransition(async () => {
      try {
        const netQuantity = type === "in" ? quantity : -quantity;
        const res = await adjustStock({
          itemId: item.id,
          quantity: netQuantity,
          rate,
          narration: narration || undefined,
        });
        if (res.success) {
          toast({
            title: "Stock Adjusted",
            description: `Successfully adjusted stock for "${item.name}" by ${netQuantity} ${item.unit}.`,
          });
          onSuccess();
        } else {
          setError(res.error);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An unexpected error occurred.");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 py-2 text-xs font-sans">
      <div className="bg-muted/40 p-4 rounded-xl border border-border/50 space-y-1 select-none">
        <div className="font-bold text-foreground text-sm">{item.name}</div>
        <div className="text-[10px] text-muted-foreground">Current Stock Quantity: <strong className="text-foreground">{item.stockQuantity} {item.unit}</strong></div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Adjustment Action</Label>
          <Select value={type} onValueChange={(val) => setType(val as "in" | "out")}>
            <SelectTrigger className="h-9 rounded-xl text-xs bg-background/50 border-border/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="in" className="text-xs text-emerald-600 font-bold">Increase Stock (+)</SelectItem>
              <SelectItem value="out" className="text-xs text-rose-600 font-bold">Decrease Stock (-)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Adjustment Quantity</Label>
          <Input type="number" min={1} value={quantity || ""} onChange={(e) => setQuantity(parseInt(e.target.value) || 0)} className="h-9 rounded-xl text-xs font-mono bg-background/55 border-border" placeholder="Qty" required />
        </div>

        <div className="space-y-1.5 col-span-2">
          <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Valuation Rate (₹ per {item.unit})</Label>
          <Input type="number" min={0} step={0.01} value={rate || ""} onChange={(e) => setRate(parseFloat(e.target.value) || 0)} className="h-9 rounded-xl font-mono text-xs bg-background/55 border-border" />
        </div>

        <div className="space-y-1.5 col-span-2">
          <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Narration / Correction Reason</Label>
          <Input value={narration} onChange={(e) => setNarration(e.target.value)} placeholder="e.g. Audit correction, damage rollback" className="h-9 rounded-xl text-xs bg-background/55 border-border" />
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-destructive text-xs bg-destructive/10 px-4 py-2.5 rounded-xl border border-destructive/20 animate-in fade-in duration-200">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <DialogFooter className="gap-2 border-t border-border/30 pt-4 mt-2">
        <Button type="button" variant="outline" onClick={onClose} className="rounded-xl h-9 text-xs">
          Cancel
        </Button>
        <Button type="submit" disabled={isPending} className="rounded-xl h-9 text-xs gap-1.5">
          {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          Apply Correction
        </Button>
      </DialogFooter>
    </form>
  );
}

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
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>(ALL);
  const [statusFilter, setStatusFilter] = useState<string>(ALL);
  const [view, setView] = useState<"table" | "grid">("table");

  // State Dialog triggers
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [adjustDialogOpen, setAdjustDialogOpen] = useState(false);
  const [adjustingItem, setAdjustingItem] = useState<InventoryItem | null>(null);

  // Delete confirm state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingItem, setDeletingItem] = useState<InventoryItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleDeleteConfirm = async () => {
    if (!deletingItem) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      const res = await deleteInventoryItem(deletingItem.id);
      if (res.success) {
        toast({
          title: "Item Deleted",
          description: `Successfully deleted item "${deletingItem.name}".`,
        });
        setDeleteDialogOpen(false);
        setDeletingItem(null);
        router.refresh();
      } else {
        setDeleteError(res.error);
      }
    } catch (err) {
      setDeleteError("Failed to delete inventory item.");
    } finally {
      setIsDeleting(false);
    }
  };

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

        <Button size="sm" onClick={() => setCreateDialogOpen(true)} className="h-9 rounded-xl gap-2 cursor-pointer shadow-md">
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
                <div className="absolute top-2 right-2 flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                  {status === "low" || status === "out" ? (
                    <AlertTriangle className={`w-3.5 h-3.5 ${status === "out" ? "text-destructive" : "text-amber-500"}`} />
                  ) : null}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="w-7 h-7 rounded-lg hover:bg-muted/50 text-muted-foreground bg-background/50 border border-border/40">
                        <MoreVertical className="w-3.5 h-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="rounded-xl border-border/60 bg-card/90 backdrop-blur">
                      <DropdownMenuItem onClick={() => {
                        setEditingItem(item);
                        setEditDialogOpen(true);
                      }} className="text-xs rounded-lg gap-2 cursor-pointer">
                        <Edit2 className="w-3.5 h-3.5" /> Edit Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => {
                        setAdjustingItem(item);
                        setAdjustDialogOpen(true);
                      }} className="text-xs rounded-lg gap-2 cursor-pointer">
                        <Sliders className="w-3.5 h-3.5" /> Adjust Stock
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => {
                        setDeletingItem(item);
                        setDeleteError(null);
                        setDeleteDialogOpen(true);
                      }} className="text-xs rounded-lg gap-2 text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer">
                        <Trash2 className="w-3.5 h-3.5" /> Delete Item
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <CardContent className="pt-4 pb-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                    <Package className="w-5 h-5 text-primary" />
                  </div>
                  <div className="font-semibold text-sm leading-snug line-clamp-2 pr-6">{item.name}</div>
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
                <TableHead className="text-right w-[80px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} className="text-center text-muted-foreground py-16">
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
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="w-8 h-8 rounded-lg hover:bg-muted">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="rounded-xl border-border/60 bg-card/90 backdrop-blur">
                            <DropdownMenuItem onClick={() => {
                              setEditingItem(item);
                              setEditDialogOpen(true);
                            }} className="text-xs rounded-lg gap-2 cursor-pointer">
                              <Edit2 className="w-3.5 h-3.5 text-muted-foreground" /> Edit Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {
                              setAdjustingItem(item);
                              setAdjustDialogOpen(true);
                            }} className="text-xs rounded-lg gap-2 cursor-pointer">
                              <Sliders className="w-3.5 h-3.5 text-muted-foreground" /> Adjust Stock
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {
                              setDeletingItem(item);
                              setDeleteError(null);
                              setDeleteDialogOpen(true);
                            }} className="text-xs rounded-lg gap-2 text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer">
                              <Trash2 className="w-3.5 h-3.5" /> Delete Item
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
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

      {/* --- DIALOG MODALS --- */}

      {/* Add Stock Item Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto bg-card/95 border-border/80 rounded-2xl shadow-2xl backdrop-blur-lg">
          <DialogHeader>
            <DialogTitle>Add Inventory Item</DialogTitle>
            <DialogDescription>Input stock item details. Opening stock will write an initial transaction movement log.</DialogDescription>
          </DialogHeader>
          <InventoryItemForm
            onClose={() => setCreateDialogOpen(false)}
            onSuccess={() => {
              setCreateDialogOpen(false);
              router.refresh();
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Stock Item Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto bg-card/95 border-border/80 rounded-2xl shadow-2xl backdrop-blur-lg">
          <DialogHeader>
            <DialogTitle>Edit Inventory Item</DialogTitle>
            <DialogDescription>Modify fields below. Changes will immediately update existing stock calculations.</DialogDescription>
          </DialogHeader>
          {editingItem && (
            <InventoryItemForm
              item={editingItem}
              onClose={() => setEditDialogOpen(false)}
              onSuccess={() => {
                setEditDialogOpen(false);
                setEditingItem(null);
                router.refresh();
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Adjust Stock Dialog */}
      <Dialog open={adjustDialogOpen} onOpenChange={setAdjustDialogOpen}>
        <DialogContent className="max-w-md bg-card/95 border-border/80 rounded-2xl shadow-2xl backdrop-blur-lg">
          <DialogHeader>
            <DialogTitle>Manual Stock Adjustment</DialogTitle>
            <DialogDescription>Apply manual stock corrections, opening balances or adjustments.</DialogDescription>
          </DialogHeader>
          {adjustingItem && (
            <AdjustStockForm
              item={adjustingItem}
              onClose={() => setAdjustDialogOpen(false)}
              onSuccess={() => {
                setAdjustDialogOpen(false);
                setAdjustingItem(null);
                router.refresh();
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Item Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-md bg-card border-border rounded-2xl shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-destructive flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 animate-pulse" /> Delete Stock Item
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-1">
              Are you sure you want to permanently delete this item? This operation will fail if the item has associated sales, purchases or adjustments.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-2 select-none">
            {deletingItem && (
              <p className="text-sm font-semibold text-foreground">
                Item: <span className="bg-muted px-1.5 py-0.5 rounded text-destructive">{deletingItem.name}</span>
              </p>
            )}
            {deleteError && (
              <div className="flex items-center gap-2 text-destructive text-xs bg-destructive/10 px-3 py-2.5 rounded-xl border border-destructive/20 mt-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{deleteError}</span>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={isDeleting} className="rounded-xl h-9 text-xs">
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm} disabled={isDeleting} className="rounded-xl h-9 text-xs gap-1.5">
              {isDeleting && <Loader2 className="w-3 w-3 animate-spin" />}
              Delete Item
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
