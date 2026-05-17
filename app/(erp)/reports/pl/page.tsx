"use client";

import { getPLReportData } from "@/app/(erp)/reports/actions";
import { formatCurrency } from "@/lib/types";
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";

// export const dynamic = "force-dynamic";
// export const metadata = { title: "Profit & Loss Statement - Shree Saree House ERP" };

export default function PLPage() {
  const [dateFrom, setDateFrom] = useState<string | null>(null);
  const [dateTo, setDateTo] = useState<string | null>(null);
  const [prevDateFrom, setPrevDateFrom] = useState<string | null>(null);
  const [prevDateTo, setPrevDateTo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [plData, setPLData] = useState<any>({});

  // Default to current fiscal year to date
  const fyStart = () => {
    const now = new Date();
    const year = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
    return new Date(year, 3, 1); // April 1
  };
  const today = new Date();

  useEffect(() => {
    const fromStr = fyStart().toISOString().split("T")[0];
    const toStr = today.toISOString().split("T")[0];
    const prevTo = fyStart();
    const prevFrom = new Date(prevTo.getFullYear() - 1, 3, 1); // Previous year April 1
    const pFromStr = prevFrom.toISOString().split("T")[0];
    const pToStr = prevTo.toISOString().split("T")[0];

    setDateFrom(fromStr);
    setDateTo(toStr);
    setPrevDateFrom(pFromStr);
    setPrevDateTo(pToStr);

    fetchPL(fromStr, toStr, pFromStr, pToStr);
  }, []);

  const fetchPL = async (
    from = dateFrom,
    to = dateTo,
    pFrom = prevDateFrom,
    pTo = prevDateTo
  ) => {
    setLoading(true);
    try {
      const data = await getPLReportData(from, to, pFrom, pTo);
      setPLData({
        current: {
          sales: data.salesTotal,
          purchase: data.purchaseTotal,
          grossProfit: data.grossProfit,
          expenses: data.expenseTotals,
          otherIncome: data.otherIncomeTotal,
          netProfit: data.netProfit
        },
        previous: {
          sales: data.prevSalesTotal,
          purchase: data.prevPurchaseTotal,
          grossProfit: data.prevGrossProfit,
          expenses: data.prevExpenseTotals,
          otherIncome: data.prevOtherIncomeTotal,
          netProfit: data.prevNetProfit
        }
      });
    } catch (err) {
      console.error("Failed to fetch P&L statement:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between">
        <CardHeader>
          <CardTitle>Profit & Loss Statement</CardTitle>
          <CardDescription>
            Income, expenses, gross profit, and net profit for the selected period
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
                  fetchPL();
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
                  fetchPL();
                }}
                className="w-48"
              />
            </div>
          </div>
          <Button onClick={() => fetchPL()} className="h-10">
            Refresh
          </Button>
        </div>
      </div>

      <Card className="w-full">
        <CardHeader>
          <CardTitle>Profit & Loss Statement</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              Loading...
            </div>
          ) : Object.keys(plData).length === 0 ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              No data found for the selected period.
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <thead>
                    <tr>
                      <th className="text-left px-6 py-3">Particulars</th>
                      <th className="text-right px-6 py-3">Current Period</th>
                      <th className="text-right px-6 py-3">Previous Period</th>
                      <th className="text-right px-6 py-3">Change (%)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    <tr className="border-b font-semibold">
                      <td colSpan={4} className="px-6 py-4">INCOME</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 text-left">Sales</td>
                      <td className="px-6 py-4 text-right text-sm">{formatCurrency(plData.current.sales)}</td>
                      <td className="px-6 py-4 text-right text-sm">{formatCurrency(plData.previous.sales)}</td>
                      <td className="px-6 py-4 text-right text-sm">
                        {plData.previous.sales !== 0
                          ? ((plData.current.sales - plData.previous.sales) / plData.previous.sales * 100).toFixed(1) + "%"
                          : plData.current.sales !== 0
                            ? "∞%"
                            : "0%"}
                      </td>
                    </tr>
                    {plData.current.otherIncome > 0 && (
                      <>
                        <tr>
                          <td className="px-6 py-4 text-left">Other Income</td>
                          <td className="px-6 py-4 text-right text-sm">{formatCurrency(plData.current.otherIncome)}</td>
                          <td className="px-6 py-4 text-right text-sm">{formatCurrency(plData.previous.otherIncome)}</td>
                          <td className="px-6 py-4 text-right text-sm">
                            {plData.previous.otherIncome !== 0
                              ? ((plData.current.otherIncome - plData.previous.otherIncome) / plData.previous.otherIncome * 100).toFixed(1) + "%"
                              : plData.current.otherIncome !== 0
                                ? "∞%"
                                : "0%"}
                          </td>
                        </tr>
                      </>
                    )}
                    <tr className="border-t border-b font-semibold">
                      <td colSpan={4} className="px-6 py-4">TOTAL INCOME</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 text-left font-semibold">Total Income</td>
                      <td className="px-6 py-4 text-right text-sm font-semibold">{formatCurrency(plData.current.sales + plData.current.otherIncome)}</td>
                      <td className="px-6 py-4 text-right text-sm font-semibold">{formatCurrency(plData.previous.sales + plData.previous.otherIncome)}</td>
                      <td className="px-6 py-4 text-right text-sm">
                        {(plData.previous.sales + plData.previous.otherIncome) !== 0
                          ? (((plData.current.sales + plData.current.otherIncome) - (plData.previous.sales + plData.previous.otherIncome)) / (plData.previous.sales + plData.previous.otherIncome) * 100).toFixed(1) + "%"
                          : (plData.current.sales + plData.current.otherIncome) !== 0
                            ? "∞%"
                            : "0%"}
                      </td>
                    </tr>

                    <tr className="border-b font-semibold">
                      <td colSpan={4} className="px-6 py-4">EXPENSES</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 text-left">Purchase (Cost of Goods Sold)</td>
                      <td className="px-6 py-4 text-right text-sm">{formatCurrency(plData.current.purchase)}</td>
                      <td className="px-6 py-4 text-right text-sm">{formatCurrency(plData.previous.purchase)}</td>
                      <td className="px-6 py-4 text-right text-sm">
                        {plData.previous.purchase !== 0
                          ? ((plData.current.purchase - plData.previous.purchase) / plData.previous.purchase * 100).toFixed(1) + "%"
                          : plData.current.purchase !== 0
                            ? "∞%"
                            : "0%"}
                      </td>
                    </tr>
                    {plData.current.expenses.map((expense: any, index: number) => (
                      <tr key={index}>
                        <td className="px-6 py-4 text-left pl-8">{expense.ledger.name}</td>
                        <td className="px-6 py-4 text-right text-sm">{formatCurrency(expense.amount)}</td>
                        <td className="px-6 py-4 text-right text-sm">{formatCurrency(plData.previous.expenses[index]?.amount ?? 0)}</td>
                        <td className="px-6 py-4 text-right text-sm">
                          {(plData.previous.expenses[index]?.amount ?? 0) !== 0
                            ? ((expense.amount - (plData.previous.expenses[index]?.amount ?? 0)) / (plData.previous.expenses[index]?.amount ?? 1) * 100).toFixed(1) + "%"
                            : expense.amount !== 0
                              ? "∞%"
                              : "0%"}
                        </td>
                      </tr>
                    ))}
                    <tr className="border-t border-b font-semibold">
                      <td colSpan={4} className="px-6 py-4">TOTAL EXPENSES</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 text-left font-semibold">Total Expenses</td>
                      <td className="px-6 py-4 text-right text-sm font-semibold">{formatCurrency(plData.current.purchase + plData.current.expenses.reduce((sum: number, e: any) => sum + e.amount, 0))}</td>
                      <td className="px-6 py-4 text-right text-sm font-semibold">{formatCurrency(plData.previous.purchase + plData.previous.expenses.reduce((sum: number, e: any) => sum + e.amount, 0))}</td>
                      <td className="px-6 py-4 text-right text-sm">
                        {(plData.previous.purchase + plData.previous.expenses.reduce((sum: number, e: any) => sum + e.amount, 0)) !== 0
                          ? (((plData.current.purchase + plData.current.expenses.reduce((sum: number, e: any) => sum + e.amount, 0)) - (plData.previous.purchase + plData.previous.expenses.reduce((sum: number, e: any) => sum + e.amount, 0))) / (plData.previous.purchase + plData.previous.expenses.reduce((sum: number, e: any) => sum + e.amount, 0)) * 100).toFixed(1) + "%"
                          : (plData.current.purchase + plData.current.expenses.reduce((sum: number, e: any) => sum + e.amount, 0)) !== 0
                            ? "∞%"
                            : "0%"}
                      </td>
                    </tr>

                    <tr className="border-b font-semibold">
                      <td colSpan={4} className="px-6 py-4">PROFIT</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 text-left">Gross Profit</td>
                      <td className="px-6 py-4 text-right text-sm">{formatCurrency(plData.current.grossProfit)}</td>
                      <td className="px-6 py-4 text-right text-sm">{formatCurrency(plData.previous.grossProfit)}</td>
                      <td className="px-6 py-4 text-right text-sm">
                        {plData.previous.grossProfit !== 0
                          ? ((plData.current.grossProfit - plData.previous.grossProfit) / plData.previous.grossProfit * 100).toFixed(1) + "%"
                          : plData.current.grossProfit !== 0
                            ? "∞%"
                            : "0%"}
                      </td>
                    </tr>
                    <tr className="border-t font-bold">
                      <td className="px-6 py-4 text-left font-bold">NET PROFIT</td>
                      <td className="px-6 py-4 text-right text-sm font-bold">{formatCurrency(plData.current.netProfit)}</td>
                      <td className="px-6 py-4 text-right text-sm font-bold">{formatCurrency(plData.previous.netProfit)}</td>
                      <td className="px-6 py-4 text-right text-sm">
                        {plData.previous.netProfit !== 0
                          ? ((plData.current.netProfit - plData.previous.netProfit) / plData.previous.netProfit * 100).toFixed(1) + "%"
                          : plData.current.netProfit !== 0
                            ? "∞%"
                            : "0%"}
                      </td>
                    </tr>
                  </tbody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
