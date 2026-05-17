"use client";

import { getGSTReportData } from "@/app/(erp)/reports/actions";
import { formatCurrency } from "@/lib/types";
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";

// export const dynamic = "force-dynamic";
// export const metadata = { title: "GST Report - Shree Saree House ERP" };

export default function GSTPage() {
  const [dateFrom, setDateFrom] = useState<string | null>(null);
  const [dateTo, setDateTo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [gstData, setGSTData] = useState<any>(null);

  // Default to current month
  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

  useEffect(() => {
    const fromStr = firstDayOfMonth.toISOString().split("T")[0];
    const toStr = lastDayOfMonth.toISOString().split("T")[0];
    setDateFrom(fromStr);
    setDateTo(toStr);
    fetchGSTData(fromStr, toStr);
  }, []);

  const fetchGSTData = async (from = dateFrom, to = dateTo) => {
    setLoading(true);
    try {
      const data = await getGSTReportData(from, to);
      setGSTData({
        ...data,
        period: {
          from,
          to
        }
      });
    } catch (err) {
      console.error("Failed to fetch GST report:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between">
        <CardHeader>
          <CardTitle>GST Report</CardTitle>
          <CardDescription>
            Goods and Services Tax liability for the selected period
          </CardDescription>
        </CardHeader>
        <div className="flex flex-wrap gap-4 sm:mt-0">
          <div className="flex items-center space-x-3">
            <CalendarIcon className="w-4 h-4" />
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">From</label>
              <Calendar
                mode="single"
                selected={dateFrom ? new Date(dateFrom) : undefined}
                onSelect={(value: any) => {
                  setDateFrom(value?.toISOString().split("T")[0] ?? null);
                  fetchGSTData();
                }}
                className="w-48"
              />
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <CalendarIcon className="w-4 h-4" />
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">To</label>
              <Calendar
                mode="single"
                selected={dateTo ? new Date(dateTo) : undefined}
                onSelect={(value: any) => {
                  setDateTo(value?.toISOString().split("T")[0] ?? null);
                  fetchGSTData();
                }}
                className="w-48"
              />
            </div>
          </div>
          <Button onClick={() => fetchGSTData()} className="h-10">
            Refresh
          </Button>
        </div>
      </div>

      <Card className="w-full">
        <CardHeader>
          <CardTitle>GST Liability Summary</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              Loading...
            </div>
          ) : !gstData ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              No data available.
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <thead>
                    <tr>
                      <th className="text-left px-6 py-3">Particulars</th>
                      <th className="text-right px-6 py-3">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    <tr>
                      <td className="px-6 py-4 text-left">Output GST (On Sales)</td>
                      <td className="px-6 py-4 text-right text-sm">{formatCurrency(gstData.outputGST)}</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 text-left">Input GST (On Purchases)</td>
                      <td className="px-6 py-4 text-right text-sm">{formatCurrency(gstData.inputGST)}</td>
                    </tr>
                    {gstData.journalGST !== 0 && (
                      <>
                        <tr>
                          <td className="px-6 py-4 text-left">GST Adjustments (Journal)</td>
                          <td className="px-6 py-4 text-right text-sm">{formatCurrency(gstData.journalGST)}</td>
                        </tr>
                        <tr className="border-t border-b font-semibold">
                          <td colSpan={2} className="px-6 py-4">Net GST Liability</td>
                        </tr>
                      </>
                    )}
                    {gstData.journalGST === 0 && (
                      <tr className="border-t border-b font-semibold">
                        <td colSpan={2} className="px-6 py-4">Net GST Liability</td>
                      </tr>
                    )}
                    <tr>
                      <td className="px-6 py-4 text-left font-bold">Net GST Payable</td>
                      <td className="px-6 py-4 text-right text-sm font-bold">{formatCurrency(gstData.netGST)}</td>
                    </tr>
                  </tbody>
                </Table>
              </div>
              <div className="mt-4 text-sm text-muted-foreground">
                <p>Period: {gstData.period.from} to {gstData.period.to}</p>
                <p>Note: This report shows GST liability based on voucher counts. For detailed GSTR-1/GSTR-3B, consult your accountant.</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
