"use client";

import { getTrialBalanceReportData } from "@/app/(erp)/reports/actions";
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
    const fromStr = fyStart().toISOString().split("T")[0];
    const toStr = today.toISOString().split("T")[0];
    setDateFrom(fromStr);
    setDateTo(toStr);
    fetchTrialBalance(fromStr, toStr);
  }, []);

  const fetchTrialBalance = async (from = dateFrom, to = dateTo) => {
    setLoading(true);
    try {
      const data = await getTrialBalanceReportData(from, to);
      // Map to the shape expected by the UI if there is a discrepancy in field names (closingType is computed inside action, but we need it)
      const mapped = data.map((item: any) => ({
        ledgerId: item.ledgerId,
        name: item.name,
        group: item.group,
        openingBalance: item.openingBalance,
        debitTotal: item.debit,
        creditTotal: item.credit,
        closingBalance: item.closingBalance * (item.closingType === 'cr' ? -1 : 1),
      }));
      setTrialBalanceData(mapped as any);
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
          <Button onClick={() => fetchTrialBalance()} className="h-10">
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
