"use client";

import { getOutstandingReportData } from "@/app/(erp)/reports/actions";
import { formatCurrency, formatDate } from "@/lib/types";
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { ReportExportButtons } from "@/components/reports/report-export-buttons";

// export const dynamic = "force-dynamic";
// export const metadata = { title: "Outstanding Report -  ERP" };

export default function OutstandingPage() {
  const [date, setDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [debtors, setDebtors] = useState<Array<any>>([]);
  const [creditors, setCreditors] = useState<Array<any>>([]);

  // Default to today
  const today = new Date();

  useEffect(() => {
    const todayStr = today.toISOString().split("T")[0];
    setDate(todayStr);
    fetchOutstanding(todayStr);
  }, []);

  const fetchOutstanding = async (selectedDate = date) => {
    setLoading(true);
    try {
      const { debtors: debtorDetails, creditors: creditorDetails } = await getOutstandingReportData(selectedDate);
      setDebtors(debtorDetails);
      setCreditors(creditorDetails);
    } catch (err) {
      console.error("Failed to fetch outstanding summary:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between">
        <CardHeader>
          <CardTitle>Outstanding Report</CardTitle>
          <CardDescription>
            View amounts due from customers (debtors) and to suppliers (creditors)
          </CardDescription>
        </CardHeader>
        <div className="flex flex-wrap gap-4 sm:mt-0">
          <div className="flex items-center space-x-3">
            <CalendarIcon className="w-4 h-4" />
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Date</label>
              <Calendar
                mode="single"
                selected={date ? new Date(date) : undefined}
                onSelect={(value: any) => {
                  setDate(value?.toISOString().split("T")[0] ?? null);
                  fetchOutstanding();
                }}
                className="w-48"
              />
            </div>
          </div>
          <Button onClick={() => fetchOutstanding()} className="h-10">
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Debtors */}
        <Card className="col-span-1" id="debtors-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Sundry Debtors (Amount Receivable)</CardTitle>
            <ReportExportButtons
              tableId="debtors-table"
              elementId="debtors-card"
              filename={`sundry-debtors_${date || "as-of-date"}`}
            />
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                Loading...
              </div>
            ) : debtors.length === 0 ? (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                No debtor ledgers found.
              </div>
            ) : (
              <Table id="debtors-table">
                <thead>
                  <tr>
                    <th className="text-left px-6 py-3">Customer</th>
                    <th className="text-left px-6 py-3">Phone</th>
                    <th className="text-right px-6 py-3">Opening Balance</th>
                    <th className="text-right px-6 py-3">Debit</th>
                    <th className="text-right px-6 py-3">Credit</th>
                    <th className="text-right px-6 py-3">Outstanding</th>
                    <th className="text-right px-6 py-3">Credit Limit</th>
                    <th className="text-right px-6 py-3">Utilization</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {debtors.map((row) => (
                    <tr key={row.ledgerId} className="hover:bg-muted">
                      <td className="px-6 py-4 text-left font-medium">{row.name}</td>
                      <td className="px-6 py-4 text-left text-sm">{row.phone || "-"}</td>
                      <td className="px-6 py-4 text-right text-sm">{formatCurrency(row.openingBalance)}</td>
                      <td className="px-6 py-4 text-right text-sm">{formatCurrency(row.debitTotal)}</td>
                      <td className="px-6 py-4 text-right text-sm">{formatCurrency(row.creditTotal)}</td>
                      <td className="px-6 py-4 text-right font-semibold">
                        {row.balance < 0 ? (
                          <>
                            <span className="text-destructive">{formatCurrency(Math.abs(row.balance))} (Cr)</span>
                          </>
                        ) : (
                          <>
                            <span className="text-foreground">{formatCurrency(row.balance)} (Dr)</span>
                          </>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right text-sm">{formatCurrency(row.creditLimit)}</td>
                      <td className="px-6 py-4 text-right text-sm">
                        {row.creditLimit > 0
                          ? `${Math.min(100, Math.max(0, (row.balance / row.creditLimit) * 100)).toFixed(0)}%`
                          : "-"}
                      </td>
                    </tr>
                  ))}
                  {/* Totals row */}
                  <tr className="border-t">
                    <td colSpan={2} className="px-6 py-4 text-right font-bold">
                      Totals
                    </td>
                    <td className="px-6 py-4 text-right text-sm">{formatCurrency(debtors.reduce((sum: number, r: any) => sum + r.openingBalance, 0))}</td>
                    <td className="px-6 py-4 text-right text-sm">{formatCurrency(debtors.reduce((sum: number, r: any) => sum + r.debitTotal, 0))}</td>
                    <td className="px-6 py-4 text-right text-sm">{formatCurrency(debtors.reduce((sum: number, r: any) => sum + r.creditTotal, 0))}</td>
                    <td className="px-6 py-4 text-right text-sm font-bold">{formatCurrency(debtors.reduce((sum: number, r: any) => sum + r.balance, 0))}</td>
                    <td className="px-6 py-4 text-right text-sm">{formatCurrency(debtors.reduce((sum: number, r: any) => sum + r.creditLimit, 0))}</td>
                    <td className="px-6 py-4 text-right text-sm">
                      {debtors.reduce((sum: number, r: any) => sum + r.creditLimit, 0) > 0
                        ? `${Math.min(100, Math.max(0, (debtors.reduce((sum: number, r: any) => sum + r.balance, 0) / debtors.reduce((sum: number, r: any) => sum + r.creditLimit, 0)) * 100)).toFixed(0)}%`
                        : "-"}
                    </td>
                  </tr>
                </tbody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Creditors */}
        <Card className="col-span-1" id="creditors-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Sundry Creditors (Amount Payable)</CardTitle>
            <ReportExportButtons
              tableId="creditors-table"
              elementId="creditors-card"
              filename={`sundry-creditors_${date || "as-of-date"}`}
            />
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                Loading...
              </div>
            ) : creditors.length === 0 ? (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                No creditor ledgers found.
              </div>
            ) : (
              <Table id="creditors-table">
                <thead>
                  <tr>
                    <th className="text-left px-6 py-3">Supplier</th>
                    <th className="text-left px-6 py-3">Phone</th>
                    <th className="text-right px-6 py-3">Opening Balance</th>
                    <th className="text-right px-6 py-3">Debit</th>
                    <th className="text-right px-6 py-3">Credit</th>
                    <th className="text-right px-6 py-3">Outstanding</th>
                    <th className="text-right px-6 py-3">Credit Limit</th>
                    <th className="text-right px-6 py-3">Utilization</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {creditors.map((row) => (
                    <tr key={row.ledgerId} className="hover:bg-muted">
                      <td className="px-6 py-4 text-left font-medium">{row.name}</td>
                      <td className="px-6 py-4 text-left text-sm">{row.phone || "-"}</td>
                      <td className="px-6 py-4 text-right text-sm">{formatCurrency(row.openingBalance)}</td>
                      <td className="px-6 py-4 text-right text-sm">{formatCurrency(row.debitTotal)}</td>
                      <td className="px-6 py-4 text-right text-sm">{formatCurrency(row.creditTotal)}</td>
                      <td className="px-6 py-4 text-right font-semibold">
                        {row.balance < 0 ? (
                          <>
                            <span className="text-destructive">{formatCurrency(Math.abs(row.balance))} (Cr)</span>
                          </>
                        ) : (
                          <>
                            <span className="text-foreground">{formatCurrency(row.balance)} (Dr)</span>
                          </>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right text-sm">{formatCurrency(row.creditLimit)}</td>
                      <td className="px-6 py-4 text-right text-sm">
                        {row.creditLimit > 0
                          ? `${Math.min(100, Math.max(0, (row.balance / row.creditLimit) * 100)).toFixed(0)}%`
                          : "-"}
                      </td>
                    </tr>
                  ))}
                  {/* Totals row */}
                  <tr className="border-t">
                    <td colSpan={2} className="px-6 py-4 text-right font-bold">
                      Totals
                    </td>
                    <td className="px-6 py-4 text-right text-sm">{formatCurrency(creditors.reduce((sum: number, r: any) => sum + r.openingBalance, 0))}</td>
                    <td className="px-6 py-4 text-right text-sm">{formatCurrency(creditors.reduce((sum: number, r: any) => sum + r.debitTotal, 0))}</td>
                    <td className="px-6 py-4 text-right text-sm">{formatCurrency(creditors.reduce((sum: number, r: any) => sum + r.creditTotal, 0))}</td>
                    <td className="px-6 py-4 text-right text-sm font-bold">{formatCurrency(creditors.reduce((sum: number, r: any) => sum + r.balance, 0))}</td>
                    <td className="px-6 py-4 text-right text-sm">{formatCurrency(creditors.reduce((sum: number, r: any) => sum + r.creditLimit, 0))}</td>
                    <td className="px-6 py-4 text-right text-sm">
                      {creditors.reduce((sum: number, r: any) => sum + r.creditLimit, 0) > 0
                        ? `${Math.min(100, Math.max(0, (creditors.reduce((sum: number, r: any) => sum + r.balance, 0) / creditors.reduce((sum: number, r: any) => sum + r.creditLimit, 0)) * 100)).toFixed(0)}%`
                        : "-"}
                    </td>
                  </tr>
                </tbody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
