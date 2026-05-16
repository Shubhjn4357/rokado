import { db, inventoryItems, stockMovements, vouchers, voucherEntries, ledgers } from "@repo/database";
import { notFound } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, AlertTriangle, Clock, TrendingUp, TrendingDown, LayoutList, MapPin, RefreshCw } from "lucide-react";
import { formatCurrency, INVENTORY_CATEGORIES } from "@/lib/types";
import { useState, useEffect } from "react";
import { adjustStock } from "@/app/(erp)/inventory/actions";

export const dynamic = "force-dynamic";
export const generateMetadata = async ({ params }: { params: { id: string } }) => {
  const item = await db
    .select()
    .from(inventoryItems)
    .where(({ id: itemId, companyId }) =>
      and(eq(itemId, params.id), eq(companyId, "company_1"))
    )
    .limit(1);

  if (!item.length) {
    return { title: "Item Not Found - Shree Saree House ERP" };
  }

  const i = item[0];
  return {
    title: `${i.name} - Inventory Detail`,
    description: `${i.category} • Stock: ${i.stockQuantity} ${i.unit}`,
  };
};

export default async function InventoryItemDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const [item] = await db
    .select()
    .from(inventoryItems)
    .where(({ id: itemId, companyId }) =>
      and(eq(itemId, params.id), eq(companyId, "company_1"))
    )
    .limit(1);

  if (!item) {
    notFound();
  }

  const [stockMovementsData, setStockMovementsData] = useState<Array<any>>([]);
  const [linkedVouchers, setLinkedVouchers] = useState<Array<any>>([]);
  const [priceHistory, setPriceHistory] = useState<Array<any>>([]);
  const [loading, setLoading] = useState(true);
  const [adjustQuantity, setAdjustQuantity] = useState(0);
  const [adjustRate, setAdjustRate] = useState(item.purchaseRate);
  const [adjustNarration, setAdjustNarration] = useState("");

  useEffect(() => {
    loadItemData();
  }, [params.id]);

  const loadItemData = async () => {
    try {
      // Fetch stock movements
      const movements = await db
        .select({
          id: stockMovements.id,
          type: stockMovements.type,
          quantity: stockMovements.quantity,
          rate: stockMovements.rate,
          date: stockMovements.date,
          narration: stockMovements.narration,
        })
        .from(stockMovements)
        .where(({ itemId: movItemId }) => eq(movItemId, item.id))
        .orderBy(desc(stockMovements.date));

      setStockMovementsData(movements);

      // Fetch linked vouchers through voucher entries
      const voucherEntriesData = await db
        .select({
          voucherId: voucherEntries.voucherId,
          type: voucherEntries.type,
          amount: voucherEntries.amount,
          narration: voucherEntries.narration,
          inventoryItemId: voucherEntries.inventoryItemId,
          quantity: voucherEntries.quantity,
          rate: voucherEntries.rate,
          voucherType: vouchers.type,
          voucherDate: vouchers.date,
          voucherNumber: vouchers.number,
          partyLedgerId: vouchers.partyLedgerId,
        })
        .from(voucherEntries)
        .innerJoin(vouchers, eq(voucherEntries.voucherId, vouchers.id))
        .where(eq(voucherEntries.inventoryItemId, item.id))
        .orderBy(desc(vouchers.date));

      setLinkedVouchers(voucherEntriesData);

      // For price history, we could track changes to purchaseRate/saleRate over time
      // For now, we'll use current rates as a placeholder
      setPriceHistory([
        {
          date: item.updatedAt,
          purchaseRate: item.purchaseRate,
          saleRate: item.saleRate,
          gstPercent: item.gstPercent,
        },
      ]);

      // Set adjust rate to current purchase rate
      setAdjustRate(item.purchaseRate);
    } catch (err) {
      console.error("Failed to load item data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdjustStock = async (e: React.FormEvent) => {
    e.preventDefault();

    if (adjustQuantity === 0) {
      return;
    }

    try {
      const result = await adjustStock({
        itemId: item.id,
        quantity: adjustQuantity,
        rate: adjustRate,
        narration: adjustNarration || undefined,
      });

      if (result.success) {
        // Reset form
        setAdjustQuantity(0);
        setAdjustNarration("");
        // Reload data
        await loadItemData();
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (err) {
      alert("An unexpected error occurred");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold tracking-tight flex-1">
          {item.name}
        </h1>
        <div className="flex items-center gap-2 sm:justify-end">
          <Button asChild>
            <a href="/erp/inventory" className="rounded-xl px-4 py-3 bg-muted/60 hover:bg-muted/80 transition-colors">
              Back to Inventory
            </a>
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <Loader2 className="h-8 w-8 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Loading item details...</p>
        </div>
      ) : (
        <>
          {/* Item Overview Card */}
          <Card>
            <CardHeader>
              <CardTitle>Item Overview</CardTitle>
              <CardDescription>
                Key details and current stock status
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <div className="text-xs text-muted-foreground">Category</div>
                  <div className="text-lg font-medium">{item.category}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Unit</div>
                  <div className="text-lg font-medium">{item.unit}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">HSN Code</div>
                  <div className="text-lg font-medium">{item.hsnCode ?? "—"}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Barcode</div>
                  <div className="text-lg font-mono">{item.barcode ?? "—"}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Design No.</div>
                  <div className="text-lg font-medium">{item.designNo ?? "—"}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Color</div>
                  <div className="text-lg font-medium">{item.color ?? "—"}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Rack Location</div>
                  <div className="text-lg font-medium">{item.rackLocation ?? "—"}</div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                  item.stockQuantity === 0
                    ? "text-destructive bg-destructive/10"
                    : item.stockQuantity <= (item.reorderLevel ?? 10)
                    ? "text-amber-500 bg-amber-500/10"
                    : "text-emerald-500 bg-emerald-500/10"
                }`}>
                  {item.stockQuantity === 0
                    ? "Out of Stock"
                    : item.stockQuantity <= (item.reorderLevel ?? 10)
                    ? "Low Stock"
                    : "In Stock"}
                </div>
                <span className="text-xs text-muted-foreground">
                  {item.stockQuantity} {item.unit} in stock
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-9 rounded-xl gap-2"
                onClick={() => {
                  // Navigate to edit page (we'd need to create this)
                  alert("Edit functionality would go here");
                }}
              >
                Edit Item
              </Button>
            </CardFooter>
          </Card>

          {/* Pricing Card */}
          <Card>
            <CardHeader>
              <CardTitle>Pricing & Tax</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div>
                  <div className="text-xs text-muted-foreground">Purchase Rate</div>
                  <div className="text-lg font-semibold text-right">
                    ₹{formatCurrency(item.purchaseRate)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Sale Rate</div>
                  <div className="text-lg font-semibold text-right">
                    ₹{formatCurrency(item.saleRate)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">GST Percentage</div>
                  <div className="text-lg font-semibold text-right">
                    {item.gstPercent}%
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Reorder Level</div>
                  <div className="text-lg font-semibold text-right">
                    {item.reorderLevel ?? 10} {item.unit}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabs for Stock Movements, Linked Vouchers, Price History */}
          <Tabs defaultValue="movements" className="w-full">
            <TabsList className="grid w-full grid-cols-3 border-b">
              <TabsTrigger value="movements" className="h-10 px-4 text-sm font-medium">
                Stock Movements
              </TabsTrigger>
              <TabsTrigger value="vouchers" className="h-10 px-4 text-sm font-medium">
                Linked Vouchers
              </TabsTrigger>
              <TabsTrigger value="history" className="h-10 px-4 text-sm font-medium">
                Price History
              </TabsTrigger>
            </TabsList>

            <TabsContent value="movements" className="space-y-4">
              {stockMovementsData.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">
                  No stock movements recorded for this item.
                </p>
              ) : (
                <>
                  <Table className="w-full">
                    <TableHeader>
                      <TableRow className="bg-muted/30">
                        <TableHead>Date</TableHead>
                        <TableHead className="text-center">Type</TableHead>
                        <TableHead className="text-right">Quantity</TableHead>
                        <TableHead className="text-right">Rate (₹)</TableHead>
                        <TableHead className="text-right">Value (₹)</TableHead>
                        <TableHead>Narration</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {stockMovementsData.map((movement) => (
                        <TableRow
                          key={movement.id}
                          className="hover:bg-muted/20"
                        >
                          <TableCell className="text-xs text-muted-foreground">
                            {new Date(movement.date).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-xs text-center">
                            <Badge
                              variant={
                                movement.type === "in"
                                  ? "secondary"
                                  : movement.type === "out"
                                  ? "destructive"
                                  : "outline"
                              }
                            >
                              {movement.type === "in"
                                ? "In"
                                : movement.type === "out"
                                ? "Out"
                                : "Adjustment"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right text-xs font-mono">
                            {movement.quantity} {item.unit}
                          </TableCell>
                          <TableCell className="text-right text-xs font-mono">
                            {formatCurrency(movement.rate)}
                          </TableCell>
                          <TableCell className="text-right text-xs font-mono font-semibold">
                            {formatCurrency(movement.quantity * movement.rate)}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {movement.narration ?? "—"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </>
              )}
            </TabsContent>

            <TabsContent value="vouchers" className="space-y-4">
              {linkedVouchers.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">
                  No voucher entries linked to this item.
                </p>
              ) : (
                <>
                  <Table className="w-full">
                    <TableHeader>
                      <TableRow className="bg-muted/30">
                        <TableHead>Date</TableHead>
                        <TableHead>Voucher</TableHead>
                        <TableHead className="text-center">Type</TableHead>
                        <TableHead className="text-right">Quantity</TableHead>
                        <TableHead className="text-right">Rate (₹)</TableHead>
                        <TableHead className="text-right">Amount (₹)</TableHead>
                        <TableHead>Party</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {linkedVouchers.map((entry) => (
                        <TableRow
                          key={`${entry.voucherId}-${entry.type}`}
                          className="hover:bg-muted/20"
                        >
                          <TableCell className="text-xs text-muted-foreground">
                            {new Date(entry.voucherDate).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {entry.voucherNumber ?? "—"}
                          </TableCell>
                          <TableCell className="text-xs text-center">
                            <Badge
                              variant={
                                entry.voucherType === "sales"
                                  ? "destructive"
                                  : entry.voucherType === "purchase"
                                  ? "secondary"
                                  : "outline"
                              }
                            >
                              {entry.voucherType.toUpperCase()}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right text-xs font-mono">
                            {entry.quantity ?? 0} {item.unit}
                          </TableCell>
                          <TableCell className="text-right text-xs font-mono">
                            {formatCurrency(entry.rate ?? 0)}
                          </TableCell>
                          <TableCell className="text-right text-xs font-mono font-semibold">
                            {formatCurrency(entry.amount)}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {/* In a real app, we'd fetch the ledger name */}
                            Ledger ID: {entry.partyLedgerId ?? "—"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </>
              )}
            </TabsContent>

            <TabsContent value="history" className="space-y-4">
              {priceHistory.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">
                  No price history recorded for this item.
                </p>
              ) : (
                <>
                  <Table className="w-full">
                    <TableHeader>
                      <TableRow className="bg-muted/30">
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Purchase Rate (₹)</TableHead>
                        <TableHead className="text-right">Sale Rate (₹)</TableHead>
                        <TableHead className="text-right">GST (%)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {priceHistory.map((price) => (
                        <TableRow key={price.date} className="hover:bg-muted/20">
                          <TableCell className="text-xs text-muted-foreground">
                            {new Date(price.date).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right text-xs font-mono">
                            {formatCurrency(price.purchaseRate)}
                          </TableCell>
                          <TableCell className="text-right text-xs font-mono">
                            {formatCurrency(price.saleRate)}
                          </TableCell>
                          <TableCell className="text-right text-xs font-mono">
                            {price.gstPercent}%
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </>
              )}
            </TabsContent>
          </Tabs>

          {/* Stock Adjustment Form */}
          <Card>
            <CardHeader>
              <CardTitle>Adjust Stock</CardTitle>
              <CardDescription>
                Manually adjust stock levels (for openings, corrections, etc.)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={handleAdjustStock} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <InputLabel htmlFor="adjustQuantity">Quantity</InputLabel>
                    <Input
                      id="adjustQuantity"
                      type="number"
                      step="0.01"
                      placeholder="Enter quantity (use - for reduction)"
                      value={adjustQuantity}
                      onChange={(e) => setAdjustQuantity(parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <InputLabel htmlFor="adjustRate">Rate (₹)</InputLabel>
                    <Input
                      id="adjustRate"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="Enter rate for valuation"
                      value={adjustRate}
                      onChange={(e) => setAdjustRate(parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <InputLabel htmlFor="adjustNarration">Narration (Optional)</InputLabel>
                    <Input
                      id="adjustNarration"
                      placeholder="Enter adjustment reason"
                      value={adjustNarration}
                      onChange={(e) => setAdjustNarration(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button
                    type="submit"
                    className="px-6 py-3"
                  >
                    Adjust Stock
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}