"use client";

import { getDayBookReportData } from "@/app/(erp)/reports/actions";
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
    const todayStr = new Date().toISOString().split("T")[0];
    setDate(todayStr);
    fetchDayBook(todayStr, cashBankOnly);
  }, []);

  const fetchDayBook = async (selectedDate = date, isCashBank = cashBankOnly) => {
    setLoading(true);
    try {
      if (!selectedDate) {
        setEntries([]);
        setOpeningBalance(0);
        return;
      }

      const { entries: data, openingBalance: op } = await getDayBookReportData(selectedDate, isCashBank);
      setEntries(data);
      setOpeningBalance(op);
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
          <Button onClick={() => fetchDayBook()} className="h-10">
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
