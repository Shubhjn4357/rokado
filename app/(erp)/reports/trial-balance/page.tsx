"use client";

import { db, ledgers, voucherEntries, vouchers, eq, sum, and, gte, lte } from "@/lib/database";
import { formatCurrency } from "@/lib/types";
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";

// export const dynamic = "force-dynamic";
// export const metadata = { title: "Trial Balance - Shree Saree House ERP" };

export default function TrialBalancePage() {
  const [dateFrom, setDateFrom] = useState<string | null>(null);
  const [dateTo, setDateTo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [trialBalanceData, setTrialBalanceData] = useState<Array<any>>([]);

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
    fetchTrialBalance();
  }, []);

  const fetchTrialBalance = async () => {
    setLoading(true);
    try {
      const fromDate = dateFrom ? new Date(dateFrom).getTime() : undefined;
      const toDate = dateTo ? new Date(dateTo).getTime() : undefined;

      // Get all ledgers with their opening balance and balance type
      const allLedgers = await db
        .select({
          id: ledgers.id,
          name: ledgers.name,
          group: ledgers.group,
          openingBalance: ledgers.openingBalance,
          balanceType: ledgers.balanceType,
        })
        .from(ledgers)
        .where(
          eq(ledgers.companyId as any, "company_1")
        )
        .orderBy(ledgers.name);

      // For each ledger, compute total debit and credit in the period
      const trialBalance = await Promise.all(
        allLedgers.map(async (ledger) => {
          // Debit sum
          const debitResult = await db
            .select({ total: sum(voucherEntries.amount) })
            .from(voucherEntries)
            .innerJoin(vouchers, eq(voucherEntries.voucherId as any, vouchers.id as any))
            .where(
              and(
                eq(voucherEntries.ledgerId, ledger.id),
                eq(vouchers.companyId, "company_1"),
                fromDate ? gte(vouchers.date, fromDate) : undefined,
                toDate ? lte(vouchers.date, toDate) : undefined,
                eq(voucherEntries.type, "dr")
              )
            );

          // Credit sum
          const creditResult = await db
            .select({ total: sum(voucherEntries.amount) })
            .from(voucherEntries)
            .innerJoin(vouchers, eq(voucherEntries.voucherId, vouchers.id))
            .where(
              and(
                eq(voucherEntries.ledgerId, ledger.id),
                eq(vouchers.companyId, "company_1"),
                fromDate ? gte(vouchers.date, fromDate) : undefined,
                toDate ? lte(vouchers.date, toDate) : undefined,
                eq(voucherEntries.type, "cr")
              )
            );

          const debitTotal = Number(debitResult[0]?.total ?? 0);
          const creditTotal = Number(creditResult[0]?.total ?? 0);
          let closingBalance;
          if (ledger.balanceType === "dr") {
            // Normal balance is debit: Opening + Debit - Credit
            closingBalance = Number(ledger.openingBalance) + debitTotal - creditTotal;
          } else {
            // Normal balance is credit: Opening + Credit - Debit
            closingBalance = Number(ledger.openingBalance) + creditTotal - debitTotal;
          }
          return {
            ledgerId: ledger.id,
            name: ledger.name,
            group: ledger.group,
            openingBalance: Number(ledger.openingBalance),
            debitTotal,
            creditTotal,
            closingBalance,
          };
        })
      );

      setTrialBalanceData(trialBalance);
    } catch (err) {
      console.error("Failed to fetch trial balance:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between">
        <CardHeader>
          <CardTitle>Trial Balance</CardTitle>
          <CardDescription>
            List of all ledgers with their opening, debit, credit, and closing balances
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
                onSelect={(value: Date | undefined) => {
                  setDateFrom(value?.toISOString().split("T")[0] ?? null);
                  fetchTrialBalance();
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
                onSelect={(value: Date | undefined) => {
                  setDateTo(value?.toISOString().split("T")[0] ?? null);
                  fetchTrialBalance();
                }}
                className="w-48"
              />
            </div>
          </div>
          <Button onClick={fetchTrialBalance} className="h-10">
            Refresh
          </Button>
        </div>
      </div>

      <Card className="w-full">
        <CardHeader>
          <CardTitle>Trial Balance</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              Loading...
            </div>
          ) : trialBalanceData.length === 0 ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              No data found for the selected period.
            </div>
          ) : (
            <Table>
              <thead>
                <tr>
                  <th className="text-left px-6 py-3">Ledger</th>
                  <th className="text-left px-6 py-3">Group</th>
                  <th className="text-right px-6 py-3">Opening Balance</th>
                  <th className="text-right px-6 py-3">Debit</th>
                  <th className="text-right px-6 py-3">Credit</th>
                  <th className="text-right px-6 py-3">Closing Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {trialBalanceData.map((row) => (
                  <tr key={row.ledgerId} className="hover:bg-muted">
                    <td className="px-6 py-4 text-left font-medium">{row.name}</td>
                    <td className="px-6 py-4 text-left text-sm">{row.group}</td>
                    <td className="px-6 py-4 text-right text-sm">{formatCurrency(row.openingBalance)}</td>
                    <td className="px-6 py-4 text-right text-sm">{formatCurrency(row.debitTotal)}</td>
                    <td className="px-6 py-4 text-right text-sm">{formatCurrency(row.creditTotal)}</td>
                    <td className="px-6 py-4 text-right font-semibold">
                      {row.closingBalance < 0 ? (
                        <span className="text-destructive">{formatCurrency(Math.abs(row.closingBalance))} (Cr)</span>
                      ) : (
                        <span className="text-foreground">{formatCurrency(row.closingBalance)} (Dr)</span>
                      )}
                    </td>
                  </tr>
                ))}
                {/* Totals row */}
                <tr className="border-t">
                  <td colSpan={2} className="px-6 py-4 text-right font-bold">
                    Totals
                  </td>
                  <td className="px-6 py-4 text-right text-sm">{formatCurrency(trialBalanceData.reduce((sum, r) => sum + r.openingBalance, 0))}</td>
                  <td className="px-6 py-4 text-right text-sm">{formatCurrency(trialBalanceData.reduce((sum, r) => sum + r.debitTotal, 0))}</td>
                  <td className="px-6 py-4 text-right text-sm">{formatCurrency(trialBalanceData.reduce((sum, r) => sum + r.creditTotal, 0))}</td>
                  <td className="px-6 py-4 text-right text-sm font-bold">{formatCurrency(trialBalanceData.reduce((sum, r) => sum + r.closingBalance, 0))}</td>
                </tr>
              </tbody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
