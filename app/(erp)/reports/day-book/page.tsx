"use client";

import { db, ledgers, voucherEntries, vouchers, eq, sum, and, lte, gte, sql, lt } from "@/lib/database";
import { formatCurrency, formatDate } from "@/lib/types";
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Toggle } from "@/components/ui/toggle";

// export const dynamic = "force-dynamic";
// export const metadata = { title: "Day Book Report - Shree Saree House ERP" };

export default function DayBookPage() {
  const [date, setDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [entries, setEntries] = useState<Array<any>>([]);
  const [cashBankOnly, setCashBankOnly] = useState(false);
  const [openingBalance, setOpeningBalance] = useState(0);

  // Default to today
  useEffect(() => {
    setDate(new Date().toISOString().split("T")[0] ?? null);
    fetchDayBook();
  }, []);

  const fetchDayBook = async () => {
    setLoading(true);
    try {
      const dateParam = date ? new Date(date).getTime() : undefined;
      if (!dateParam) {
        setEntries([]);
        setOpeningBalance(0);
        return;
      }

      // Get cash and bank ledger IDs
      const cashBankLedgers = await db
        .select({ id: ledgers.id })
        .from(ledgers)
        .where(
          and(
            eq(ledgers.companyId as any, "company_1"),
            eq(ledgers.isActive as any, true),
            sql`${ledgers.group} IN ('cash', 'bank')`
          )
        );

      const cashBankLedgerIds = cashBankLedgers.map(l => l.id);

      // Calculate opening balance for cash and bank as of day before selected date
      let openingBal = 0;
      if (cashBankLedgerIds.length > 0) {
        // compute opening balance by summing transactions before date
        const openingBalanceResult = await db
          .select({
            total: sql<number>`
              COALESCE(SUM(
                CASE
                  WHEN ${voucherEntries.type} = 'dr' THEN ${voucherEntries.amount}
                  WHEN ${voucherEntries.type} = 'cr' THEN -${voucherEntries.amount}
                  ELSE 0
                END
              ), 0)
            `
          })
          .from(voucherEntries)
          .innerJoin(vouchers, eq(voucherEntries.voucherId as any, vouchers.id as any))
          .innerJoin(ledgers, eq(voucherEntries.ledgerId as any, ledgers.id as any))
          .where(
            and(
              eq(vouchers.companyId as any, "company_1"),
              lt(vouchers.date as any, dateParam),
              eq(ledgers.isActive as any, true),
              sql`${ledgers.group} IN ('cash', 'bank')`
            )
          );

        // Add ledger opening balances
        const ledgerOpeningBalances = await db
          .select({
            openingBalance: ledgers.openingBalance,
          })
          .from(ledgers)
          .where(
            and(
              eq(ledgers.companyId as any, "company_1"),
              eq(ledgers.isActive as any, true),
              sql`${ledgers.group} IN ('cash', 'bank')`
            )
          );

        const ledgerOpeningSum = ledgerOpeningBalances.reduce((sum, ledger) => sum + Number(ledger.openingBalance), 0);
        const transactionSum = Number(openingBalanceResult[0]?.total ?? 0);
        openingBal = ledgerOpeningSum + transactionSum;
      }

      // Fetch voucher entries for selected date
      const results = await db
        .select({
          voucherId: vouchers.id,
          voucherNumber: vouchers.number,
          voucherType: vouchers.type,
          voucherDate: vouchers.date,
          ledgerId: ledgers.id,
          ledgerName: ledgers.name,
          ledgerGroup: ledgers.group,
          entryType: voucherEntries.type,
          amount: voucherEntries.amount,
          narration: sql<string>`COALESCE(${voucherEntries.narration}, ${vouchers.narration})`,
        })
        .from(voucherEntries)
        .innerJoin(vouchers, eq(voucherEntries.voucherId as any, vouchers.id as any))
        .innerJoin(ledgers, eq(voucherEntries.ledgerId as any, ledgers.id as any))
        .where(
          and(
            eq(vouchers.companyId as any, "company_1"),
            eq(vouchers.date as any, dateParam),
            eq(ledgers.isActive as any, true)
          )
        )
        .orderBy(vouchers.date, vouchers.id, voucherEntries.id as any);

      // Process entries: filter if cashBankOnly, calculate running balance
      let runningBalance = openingBal;
      const processedEntries = results.map(entry => {
        const amount = Number(entry.amount);
        const isDr = entry.entryType === "dr";
        const isCr = entry.entryType === "cr";

        // Update running balance only for cash and bank ledgers
        if (cashBankLedgerIds.includes(entry.ledgerId)) {
          runningBalance += isDr ? amount : -amount;
        }

        return {
          ...entry,
          amount,
          isDr,
          isCr,
          runningBalance: Number(runningBalance.toFixed(2)),
        };
      });

      // Filter entries if cashBankOnly is true
      const filteredEntries = cashBankOnly
        ? processedEntries.filter(entry => cashBankLedgerIds.includes(entry.ledgerId))
        : processedEntries;

      setEntries(filteredEntries);
      setOpeningBalance(openingBal);
    } catch (err) {
      console.error("Failed to fetch day book:", err);
      setEntries([]);
      setOpeningBalance(0);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between">
        <CardHeader>
          <CardTitle>Day Book Report</CardTitle>
          <CardDescription>
            {cashBankOnly ? "Cash and Bank Transactions" : "All Transactions"} for {
            formatDate(new Date(date ?? Date.now()))
          }
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
                  fetchDayBook();
                }}
                className="w-48"
              />
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Toggle
              pressed={cashBankOnly}
              onPressedChange={setCashBankOnly}
              aria-label="Cash/Bank only view"
            />
            <span className="text-sm text-muted-foreground">
              Cash/Bank only view
            </span>
          </div>
          <Button onClick={fetchDayBook} className="h-10">
            Refresh
          </Button>
        </div>
      </div>

      <Card>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              Loading...
            </div>
          ) : entries.length === 0 ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              No transactions found for {formatDate(new Date(date ?? Date.now()))}.
            </div>
          ) : (
            <Table className="w-full">
              <thead>
                <tr>
                  <th className="text-left px-6 py-3">Date</th>
                  <th className="text-left px-6 py-3">Voucher</th>
                  <th className="text-left px-6 py-3">Ledger</th>
                  <th className="text-left px-6 py-3">Narration</th>
                  <th className="text-right px-6 py-3">Debit (Dr)</th>
                  <th className="text-right px-6 py-3">Credit (Cr)</th>
                  <th className="text-right px-6 py-3">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {entries.map((entry, index) => (
                  <tr key={`${entry.voucherId}-${index}`} className="hover:bg-muted">
                    <td className="px-6 py-4 text-left text-sm">
                      {formatDate(new Date(entry.voucherDate))}
                    </td>
                    <td className="px-6 py-4 text-left text-sm">
                      {entry.voucherNumber || "-"}{" "}
                      {entry.voucherType === "sales" && "(S)"}
                      {entry.voucherType === "purchase" && "(P)"}
                      {entry.voucherType === "payment" && "(Py)"}
                      {entry.voucherType === "receipt" && "(R)"}
                      {entry.voucherType === "contra" && "(C)"}
                      {entry.voucherType === "journal" && "(J)"}
                    </td>
                    <td className="px-6 py-4 text-left text-sm">{entry.ledgerName}</td>
                    <td className="px-6 py-4 text-left text-sm text-wrap max-w-[200px]">
                      {entry.narration || "-"}
                    </td>
                    <td className="px-6 py-4 text-right text-sm">
                      {entry.isDr ? formatCurrency(entry.amount) : "-"}
                    </td>
                    <td className="px-6 py-4 text-right text-sm">
                      {entry.isCr ? formatCurrency(entry.amount) : "-"}
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-mono">
                      {formatCurrency(entry.runningBalance)}
                    </td>
                  </tr>
                ))}
                {/* Opening balance row */}
                {!cashBankOnly && (
                  <tr className="border-t">
                    <td colSpan={4} className="px-6 py-4 text-right font-bold">
                      Opening Balance
                    </td>
                    <td colSpan={3} className="px-6 py-4 text-right text-sm">
                      {formatCurrency(openingBalance)}
                    </td>
                  </tr>
                )}
                {/* Closing balance row */}
                <tr className="border-t">
                  <td colSpan={4} className="px-6 py-4 text-right font-bold">
                    Closing Balance
                  </td>
                  <td colSpan={3} className="px-6 py-4 text-right text-sm font-semibold">
                    {formatCurrency(
                      entries.length > 0
                        ? entries[entries.length - 1].runningBalance
                        : openingBalance
                    )}
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
