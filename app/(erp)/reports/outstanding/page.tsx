"use client";

import { db, ledgers, voucherEntries, vouchers, eq, sum, and, lte, sql } from "@/lib/database";
import { formatCurrency, formatDate } from "@/lib/types";
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";

// export const dynamic = "force-dynamic";
// export const metadata = { title: "Outstanding Report - Shree Saree House ERP" };

export default function OutstandingPage() {
  const [date, setDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [debtors, setDebtors] = useState<Array<any>>([]);
  const [creditors, setCreditors] = useState<Array<any>>([]);

  // Default to today
  const today = new Date();

  useEffect(() => {
    setDate(today.toISOString().split("T")[0] ?? null);
    fetchOutstanding();
  }, []);

  const fetchOutstanding = async () => {
    setLoading(true);
    try {
      const dateParam = date ? new Date(date).getTime() : undefined;

      // Get all debtors and creditors ledgers
      const debtorLedgers = await db
        .select({
          id: ledgers.id,
          name: ledgers.name,
          group: ledgers.group,
          openingBalance: ledgers.openingBalance,
          balanceType: ledgers.balanceType,
          phone: ledgers.phone,
          creditLimit: ledgers.creditLimit,
        })
        .from(ledgers)
        .where(
          and(
            eq(ledgers.companyId as any, "company_1"),
            eq(ledgers.isActive as any, true),
            eq(ledgers.group as any, "sundry_debtors")
          )
        )
        .orderBy(ledgers.name);

      const creditorLedgers = await db
        .select({
          id: ledgers.id,
          name: ledgers.name,
          group: ledgers.group,
          openingBalance: ledgers.openingBalance,
          balanceType: ledgers.balanceType,
          phone: ledgers.phone,
          creditLimit: ledgers.creditLimit,
        })
        .from(ledgers)
        .where(
          and(
            eq(ledgers.companyId as any, "company_1"),
            eq(ledgers.isActive as any, true),
            eq(ledgers.group as any, "sundry_creditors")
          )
        )
        .orderBy(ledgers.name);

      // For each ledger, compute total debit and credit up to date
      const processLedgers = async (ledgers: any[]) => {
        const results = await Promise.all(
          ledgers.map(async (ledger) => {
            const [debitResult, creditResult] = await Promise.all([
              db
                .select({ total: sum(voucherEntries.amount) })
                .from(voucherEntries)
                .innerJoin(vouchers, eq(voucherEntries.voucherId as any, vouchers.id as any))
                .where(
                  and(
                    eq(voucherEntries.ledgerId, ledger.id),
                    eq(vouchers.companyId, "company_1"),
                    dateParam ? lte(vouchers.date, dateParam) : undefined,
                    eq(voucherEntries.type, "dr")
                  )
                ),
              db
                .select({ total: sum(voucherEntries.amount) })
                .from(voucherEntries)
                .innerJoin(vouchers, eq(voucherEntries.voucherId as any, vouchers.id as any))
                .where(
                  and(
                    eq(voucherEntries.ledgerId, ledger.id),
                    eq(vouchers.companyId, "company_1"),
                    dateParam ? lte(vouchers.date, dateParam) : undefined,
                    eq(voucherEntries.type, "cr")
                  )
                )
            ]);

            const debitTotal = Number(debitResult[0]?.total ?? 0);
            const creditTotal = Number(creditResult[0]?.total ?? 0);
            let balance;
            if (ledger.balanceType === "dr") {
              // Normal balance is debit: Opening + Debit - Credit
              balance = Number(ledger.openingBalance) + debitTotal - creditTotal;
            } else {
              // Normal balance is credit: Opening + Credit - Debit
              balance = Number(ledger.openingBalance) + creditTotal - debitTotal;
            }
            const overdueDays = 0; // We'll compute based on due date later, for now 0
            return {
              ledgerId: ledger.id,
              name: ledger.name,
              group: ledger.group,
              openingBalance: Number(ledger.openingBalance),
              debitTotal,
              creditTotal,
              balance,
              overdueDays,
              phone: ledger.phone,
              creditLimit: Number(ledger.creditLimit),
            };
          })
        );
        return results;
      };

      const [debtorDetails, creditorDetails] = await Promise.all([
        processLedgers(debtorLedgers),
        processLedgers(creditorLedgers),
      ]);

      setDebtors(debtorDetails);
      setCreditors(creditorDetails);
    } catch (err) {
      console.error("Failed to fetch outstanding report:", err);
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
          <Button onClick={fetchOutstanding} className="h-10">
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Debtors */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Sundry Debtors (Amount Receivable)</CardTitle>
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
              <Table>
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
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Sundry Creditors (Amount Payable)</CardTitle>
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
              <Table>
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
