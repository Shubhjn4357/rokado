"use client";

import { getStockReportData } from "@/app/(erp)/reports/actions";
import { formatCurrency } from "@/lib/types";
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { ReportExportButtons } from "@/components/reports/report-export-buttons";

// export const dynamic = "force-dynamic";
// export const metadata = { title: "Stock Summary Report -  ERP" };

export default function StockPage() {
  const [date, setDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [stockData, setStockData] = useState<Array<any>>([]);

  // Default to today
  const today = new Date();

  useEffect(() => {
    const todayStr = today.toISOString().split("T")[0];
    setDate(todayStr);
    fetchStockSummary(todayStr);
  }, []);

  const fetchStockSummary = async (selectedDate = date) => {
    setLoading(true);
    try {
      const data = await getStockReportData(selectedDate);
      setStockData(data);
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
                mode="single"
                selected={date ? new Date(date) : undefined}
                onSelect={(value: any) => {
                  setDate(value?.toISOString().split("T")[0] ?? null);
                  fetchStockSummary();
                }}
                className="w-48"
              />
            </div>
          </div>
          <Button onClick={() => fetchStockSummary()} className="h-10">
            Refresh
          </Button>
          <ReportExportButtons
            tableId="stock-table"
            elementId="stock-report"
            filename={`stock-summary_${date || "as-of-date"}`}
            className="sm:mt-0"
          />
        </div>
      </div>

      <Card id="stock-report" className="w-full">
        <CardHeader>
          <CardTitle>Stock Position</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              Loading...
            </div>
          ) : stockData.length === 0 ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              No inventory items found.
            </div>
          ) : (
            <Table id="stock-table">
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
                  <td colSpan={3} className="px-6 py-4 text-right font-bold">
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
