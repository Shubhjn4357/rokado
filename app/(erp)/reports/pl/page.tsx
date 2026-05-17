"use client";

import { db, ledgers, voucherEntries, vouchers, eq, sum, and, gte, lte, or } from "@/lib/database";
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
    setDateFrom(fyStart().toISOString().split("T")[0] ?? null);
    setDateTo(today.toISOString().split("T")[0] ?? null);
    // Calculate previous period for comparison
    const prevTo = fyStart();
    const prevFrom = new Date(prevTo.getFullYear() - 1, 3, 1); // Previous year April 1
    setPrevDateFrom(prevFrom.toISOString().split("T")[0] ?? null);
    setPrevDateTo(prevTo.toISOString().split("T")[0] ?? null);
    fetchPL();
  }, []);

  const fetchPL = async () => {
    setLoading(true);
    try {
      const fromDate = dateFrom ? new Date(dateFrom).getTime() : undefined;
      const toDate = dateTo ? new Date(dateTo).getTime() : undefined;
      const prevFromDate = prevDateFrom ? new Date(prevDateFrom).getTime() : undefined;
      const prevToDate = prevDateTo ? new Date(prevDateTo).getTime() : undefined;

      // Get sales ledger (income)
      const [salesLedger] = await db
        .select()
        .from(ledgers)
        .where(
          and(
            eq(ledgers.group as any, "sales"),
            eq(ledgers.companyId as any, "company_1")
          )
        )
        .limit(1);

      // Get purchase ledger (expense - cost of goods sold)
      const [purchaseLedger] = await db
        .select()
        .from(ledgers)
        .where(
          and(
            eq(ledgers.group as any, "purchase"),
            eq(ledgers.companyId as any, "company_1")
          )
        )
        .limit(1);

      // Get expense ledgers (indirect expenses)
      const expenseLedgers = await db
        .select({ id: ledgers.id, name: ledgers.name })
        .from(ledgers)
        .where(
          and(
            eq(ledgers.group as any, "expenses"),
            eq(ledgers.companyId as any, "company_1")
          )
        )
        .orderBy(ledgers.name);

      // Get other income ledgers (if any)
      const otherIncomeLedgers = await db
        .select({ id: ledgers.id, name: ledgers.name })
        .from(ledgers)
        .where(
          and(
            or(
              eq(ledgers.group as any, "other_income"),
              eq(ledgers.group as any, "interest_income")
            ),
            eq(ledgers.companyId as any, "company_1")
          )
        )
        .orderBy(ledgers.name);

      // Calculate current period values
      const [
        salesResult,
        purchaseResult,
        expenseResults,
        otherIncomeResults
      ] = (await Promise.all([
        // Sales (credit balance in sales ledger)
        db
          .select({ total: sum(voucherEntries.amount) })
          .from(voucherEntries)
          .innerJoin(vouchers, eq(voucherEntries.voucherId as any, vouchers.id as any))
          .where(
            and(
              eq(voucherEntries.ledgerId as any, salesLedger?.id ?? ""),
              eq(vouchers.companyId as any, "company_1"),
              eq(voucherEntries.type as any, "cr"), // Credit for sales income
              fromDate ? gte(vouchers.date as any, fromDate) : undefined,
              toDate ? lte(vouchers.date as any, toDate) : undefined
            )
          ),

        // Purchase (debit balance in purchase ledger)
        db
          .select({ total: sum(voucherEntries.amount) })
          .from(voucherEntries)
          .innerJoin(vouchers, eq(voucherEntries.voucherId as any, vouchers.id as any))
          .where(
            and(
              eq(voucherEntries.ledgerId as any, purchaseLedger?.id ?? ""),
              eq(vouchers.companyId as any, "company_1"),
              eq(voucherEntries.type as any, "dr"), // Debit for purchase expense
              fromDate ? gte(vouchers.date as any, fromDate) : undefined,
              toDate ? lte(vouchers.date as any, toDate) : undefined
            )
          ),

        // Expenses (debit balance)
        ...expenseLedgers.map(ledger =>
          db
            .select({ total: sum(voucherEntries.amount) })
            .from(voucherEntries)
            .innerJoin(vouchers, eq(voucherEntries.voucherId as any, vouchers.id as any))
            .where(
              and(
                eq(voucherEntries.ledgerId as any, ledger.id),
                eq(vouchers.companyId as any, "company_1"),
                eq(voucherEntries.type as any, "dr"), // Debit for expenses
                fromDate ? gte(vouchers.date as any, fromDate) : undefined,
                toDate ? lte(vouchers.date as any, toDate) : undefined
              )
            )
        ),

        // Other income (credit balance)
        ...otherIncomeLedgers.map(ledger =>
          db
            .select({ total: sum(voucherEntries.amount) })
            .from(voucherEntries)
            .innerJoin(vouchers, eq(voucherEntries.voucherId as any, vouchers.id as any))
            .where(
              and(
                eq(voucherEntries.ledgerId as any, ledger.id),
                eq(vouchers.companyId as any, "company_1"),
                eq(voucherEntries.type as any, "cr"), // Credit for other income
                fromDate ? gte(vouchers.date as any, fromDate) : undefined,
                toDate ? lte(vouchers.date as any, toDate) : undefined
              )
            )
        )
      ])) as any[];

      const salesTotal = Number(salesResult[0]?.total ?? 0);
      const purchaseTotal = Number(purchaseResult[0]?.total ?? 0);
      const expenseTotals = expenseResults.map((result: any, index: number) => ({
        ledger: expenseLedgers[index],
        amount: Number(result[0]?.total ?? 0)
      }));
      const otherIncomeTotal = otherIncomeResults.reduce((sum: number, result: any) => {
        return sum + Number(result[0]?.total ?? 0);
      }, 0);

      const totalExpenses = expenseTotals.reduce((sum: number, item: any) => sum + item.amount, 0);
      const grossProfit = salesTotal - purchaseTotal;
      const netProfit = grossProfit - totalExpenses + otherIncomeTotal;

      // Calculate previous period values
      const [
        prevSalesResult,
        prevPurchaseResult,
        prevExpenseResults,
        prevOtherIncomeResults
      ] = (await Promise.all([
        // Previous period sales
        db
          .select({ total: sum(voucherEntries.amount) })
          .from(voucherEntries)
          .innerJoin(vouchers, eq(voucherEntries.voucherId as any, vouchers.id as any))
          .where(
            and(
              eq(voucherEntries.ledgerId as any, salesLedger?.id ?? ""),
              eq(vouchers.companyId as any, "company_1"),
              eq(voucherEntries.type as any, "cr"),
              prevFromDate ? gte(vouchers.date as any, prevFromDate) : undefined,
              prevToDate ? lte(vouchers.date as any, prevToDate) : undefined
            )
          ),

        // Previous period purchase
        db
          .select({ total: sum(voucherEntries.amount) })
          .from(voucherEntries)
          .innerJoin(vouchers, eq(voucherEntries.voucherId as any, vouchers.id as any))
          .where(
            and(
              eq(voucherEntries.ledgerId as any, purchaseLedger?.id ?? ""),
              eq(vouchers.companyId as any, "company_1"),
              eq(voucherEntries.type as any, "dr"),
              prevFromDate ? gte(vouchers.date as any, prevFromDate) : undefined,
              prevToDate ? lte(vouchers.date as any, prevToDate) : undefined
            )
          ),

        // Previous period expenses
        ...expenseLedgers.map(ledger =>
          db
            .select({ total: sum(voucherEntries.amount) })
            .from(voucherEntries)
            .innerJoin(vouchers, eq(voucherEntries.voucherId as any, vouchers.id as any))
            .where(
              and(
                eq(voucherEntries.ledgerId as any, ledger.id),
                eq(vouchers.companyId as any, "company_1"),
                eq(voucherEntries.type as any, "dr"),
                prevFromDate ? gte(vouchers.date as any, prevFromDate) : undefined,
                prevToDate ? lte(vouchers.date as any, prevToDate) : undefined
              )
            )
        ),

        // Previous period other income
        ...otherIncomeLedgers.map(ledger =>
          db
            .select({ total: sum(voucherEntries.amount) })
            .from(voucherEntries)
            .innerJoin(vouchers, eq(voucherEntries.voucherId as any, vouchers.id as any))
            .where(
              and(
                eq(voucherEntries.ledgerId as any, ledger.id),
                eq(vouchers.companyId as any, "company_1"),
                eq(voucherEntries.type as any, "cr"),
                prevFromDate ? gte(vouchers.date as any, prevFromDate) : undefined,
                prevToDate ? lte(vouchers.date as any, prevToDate) : undefined
              )
            )
        )
      ])) as any[];

      const prevSalesTotal = Number(prevSalesResult[0]?.total ?? 0);
      const prevPurchaseTotal = Number(prevPurchaseResult[0]?.total ?? 0);
      const prevExpenseTotals = prevExpenseResults.map((result: any, index: number) => ({
        ledger: expenseLedgers[index],
        amount: Number(result[0]?.total ?? 0)
      }));
      const prevOtherIncomeTotal = prevOtherIncomeResults.reduce((sum: number, result: any) => {
        return sum + Number(result[0]?.total ?? 0);
      }, 0);

      const prevTotalExpenses = prevExpenseTotals.reduce((sum: number, item: any) => sum + item.amount, 0);
      const prevGrossProfit = prevSalesTotal - prevPurchaseTotal;
      const prevNetProfit = prevGrossProfit - prevTotalExpenses + prevOtherIncomeTotal;

      setPLData({
        current: {
          sales: salesTotal,
          purchase: purchaseTotal,
          grossProfit: grossProfit,
          expenses: expenseTotals,
          otherIncome: otherIncomeTotal,
          netProfit: netProfit
        },
        previous: {
          sales: prevSalesTotal,
          purchase: prevPurchaseTotal,
          grossProfit: prevGrossProfit,
          expenses: prevExpenseTotals,
          otherIncome: prevOtherIncomeTotal,
          netProfit: prevNetProfit
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
          <Button onClick={fetchPL} className="h-10">
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
