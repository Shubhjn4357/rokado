import { db, inventoryItems, stockMovements, vouchers, eq, sum, and, gte, lte, sql } from "@repo/database";
import { formatCurrency } from "@/lib/types";
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";

export const dynamic = "force-dynamic";
export const metadata = { title: "Stock Summary Report - Shree Saree House ERP" };

export default async function StockPage() {
  const [date, setDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [stockData, setStockData] = useState<Array<any>>([]);

  // Default to today
  const today = new Date();

  useEffect(() => {
    setDate(today.toISOString().split("T")[0]);
    fetchStockSummary();
  }, []);

  const fetchStockSummary = async () => {
    setLoading(true);
    try {
      const dateParam = date ? new Date(date).getTime() : undefined;

      // Get all inventory items
      const items = await db
        .select({
          id: inventoryItems.id,
          name: inventoryItems.name,
          category: inventoryItems.category,
          unit: inventoryItems.unit,
          openingStock: inventoryItems.stockQuantity, // This should be opening stock, but we don't have it separately
          // We'll calculate opening stock from movements before date
        })
        .from(inventoryItems)
        .where(({ companyId, isActive }) =>
          eq(inventoryItems.companyId, "company_1")
        )
        .orderBy(inventoryItems.name);

      // For each item, calculate stock movements
      const stockSummary = await Promise.all(
        items.map(async (item) => {
          // Calculate opening stock (as of day before selected date)
          let openingStock = 0;
          if (dateParam) {
            const openingResult = await db
              .select({
                total: sql<number>`
                  COALESCE(SUM(
                    CASE
                      WHEN ${stockMovements.type} = 'in' THEN ${stockMovements.quantity}
                      WHEN ${stockMovements.type} = 'out' THEN -${stockMovements.quantity}
                      ELSE 0
                    END
                  ), 0)
                `
              })
              .from(stockMovements)
              .innerJoin(vouchers, eq(stockMovements.voucherId, vouchers.id))
              .where(
                and(
                  eq(stockMovements.itemId, item.id),
                  eq(vouchers.companyId, "company_1"),
                  lt(stockMovements.date, dateParam) // Before selected date
                )
              );

            openingStock = Number(openingResult[0]?.total ?? 0);
          }

          // Calculate inward quantity (as of selected date)
          const inwardResult = await db
            .select({ total: sum(stockMovements.quantity) })
            .from(stockMovements)
            .innerJoin(vouchers, eq(stockMovements.voucherId, vouchers.id))
            .where(
              and(
                eq(stockMovements.itemId, item.id),
                eq(vouchers.companyId, "company_1"),
                dateParam ? lte(stockMovements.date, dateParam) : undefined,
                eq(stockMovements.type, "in")
              )
            );

          // Calculate outward quantity (as of selected date)
          const outwardResult = await db
            .select({ total: sum(stockMovements.quantity) })
            .from(stockMovements)
            .innerJoin(vouchers, eq(stockMovements.voucherId, vouchers.id))
            .where(
              and(
                eq(stockMovements.itemId, item.id),
                eq(vouchers.companyId, "company_1"),
                dateParam ? lte(stockMovements.date, dateParam) : undefined,
                eq(stockMovements.type, "out")
              )
            );

          const inwardTotal = Number(inwardResult[0]?.total ?? 0);
          const outwardTotal = Number(outwardResult[0]?.total ?? 0);
          const closingStock = openingStock + inwardTotal - outwardTotal;

          return {
            itemId: item.id,
            name: item.name,
            category: item.category,
            unit: item.unit,
            openingStock,
            inwardTotal,
            outwardTotal,
            closingStock,
          });
        })
      );

      setStockData(stockSummary);
    } catch (err) {
      console.error("Failed to fetch stock summary:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between">
        <CardHeader>
          <CardTitle>Stock Summary Report</CardTitle>
          <CardDescription>
            Opening stock, inward, outward, and closing stock for each inventory item
          </CardDescription>
        </CardHeader>
        <div className="flex flex-wrap gap-4 sm:mt-0">
          <div className="flex items-center space-x-3">
            <CalendarIcon className="w-4 h-4" />
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">As of Date</label>
              <Calendar
                value={date ? new Date(date) : undefined}
                onChange={(value) => {
                  setDate(value ? value.toISOString().split("T")[0] : null);
                  fetchStockSummary();
                }}
                className="w-48"
              />
            </div>
          </div>
          <Button onClick={fetchStockSummary} className="h-10">
            Refresh
          </Button>
        </div>
      </div>

      <Card className="w-full">
        <CardHeader>
          <CardTitle>Stock Position</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              Loading...
            )
          ) : stockData.length === 0 ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              No inventory items found.
            )
          ) : (
            <Table>
              <thead>
                <tr>
                  <th className="text-left px-6 py-3">Item Name</th>
                  <th className="text-left px-6 py-3">Category</th>
                  <th className="text-center px-6 py-3">Unit</th>
                  <th className="text-right px-6 py-3">Opening Stock</th>
                  <th className="text-right px-6 py-3">Inward</th>
                  <th className="text-right px-6 py-3">Outward</th>
                  <th className="text-right px-6 py-3 font-semibold">Closing Stock</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {stockData.map((item) => (
                  <tr key={item.itemId} className="hover:bg-muted">
                    <td className="px-6 py-4 text-left">{item.name}</td>
                    <td className="px-6 py-4 text-left text-sm">{item.category}</td>
                    <td className="px-6 py-4 text-center text-sm">{item.unit}</td>
                    <td className="px-6 py-4 text-right text-sm">{item.openingStock}</td>
                    <td className="px-6 py-4 text-right text-sm">{item.inwardTotal}</td>
                    <td className="px-6 py-4 text-right text-sm">{item.outwardTotal}</td>
                    <td className="px-6 py-4 text-right font-semibold">
                      {item.closingStock < 0 ? (
                        <span className="text-destructive">{Math.abs(item.closingStock)}</span>
                      ) : (
                        <span className="text-foreground">{item.closingStock}</span>
                      )}
                    </td>
                  </tr>
                ))}
                {/* Totals row */}
                <tr className="border-t">
                  <td colSpan="3" className="px-6 py-4 text-right font-bold">
                    TOTAL
                  </td>
                  <td className="px-6 py-4 text-right text-sm">
                    {stockData.reduce((sum, item) => sum + item.openingStock, 0)}
                  </td>
                  <td className="px-6 py-4 text-right text-sm">
                    {stockData.reduce((sum, item) => sum + item.inwardTotal, 0)}
                  </td>
                  <td className="px-6 py-4 text-right text-sm">
                    {stockData.reduce((sum, item) => sum + item.outwardTotal, 0)}
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-bold">
                    {stockData.reduce((sum, item) => sum + item.closingStock, 0)}
                  </td>
                </tr>
              </tbody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}