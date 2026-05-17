"use client";

import { db, ledgers, voucherEntries, vouchers, eq, and, gte, lte, sql } from "@repo/database";
import { formatCurrency } from "@/lib/types";
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem, SelectLabel } from "@/components/ui/select";
import { X } from "lucide-react";
import * as XLSX from 'xlsx';
import { toast } from "@/components/ui/use-toast";

// export const dynamic = "force-dynamic";
// export const metadata = { title: "Bank Reconciliation - Shree Saree House ERP" };

export default function BankReconciliationPage() {
  const [dateFrom, setDateFrom] = useState<string | null>(null);
  const [dateTo, setDateTo] = useState<string | null>(null);
  const [bankLedgerId, setBankLedgerId] = useState<string | null>(null);
  const [bankLedgers, setBankLedgers] = useState<Array<{id: string; name: string}>>([]);
  const [loading, setLoading] = useState(false);
  const [reconciliationData, setReconciliationData] = useState<Array<any>>([]);
  const [bankStatementData, setBankStatementData] = useState<Array<any>>([]);
  const [selectedBankStatementRow, setSelectedBankStatementRow] = useState<number | null>(null);
  const [isMatchingDialogOpen, setIsMatchingDialogOpen] = useState(false);
  const [matchedEntries, setMatchedEntries] = useState<Set<string>>(new Set()); // Set of voucherEntryIds that are matched
  const [openingBalance, setOpeningBalance] = useState<number | null>(null);
  const [closingBalanceBooks, setClosingBalanceBooks] = useState<number | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(false);

  // Default to current fiscal year to date
  useEffect(() => {
    const fyStart = () => {
      const now = new Date();
      const year = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
      return new Date(year, 3, 1); // April 1
    };
    const today = new Date();
    setDateFrom(fyStart().toISOString().split("T")[0] ?? null);
    setDateTo(today.toISOString().split("T")[0] ?? null);
    fetchBankLedgers();
  }, []);

  // Fetch reconciliation data when bank ledger or date range changes
  useEffect(() => {
    if (bankLedgerId) {
      fetchReconciliationData();
      fetchBalances();
    }
  }, [bankLedgerId, dateFrom, dateTo]);

  // Fetch opening and closing balances
  const fetchBalances = async () => {
    if (!bankLedgerId) return;
    setBalanceLoading(true);
    try {
      // Get opening balance from ledger
      const ledger = await db.query.ledgers.findFirst({
        where: eq(ledgers.id as any, bankLedgerId),
        columns: { openingBalance: true, balanceType: true }
      });

      const openingBalance = ledger?.openingBalance ?? 0;
      const balanceType = ledger?.balanceType ?? 'dr';

      // Get all voucher entries for the bank ledger (no date limit for closing balance)
      const entries = await db
        .select({
          amount: voucherEntries.amount,
          type: voucherEntries.type,
        })
        .from(voucherEntries)
        .innerJoin(vouchers, eq(voucherEntries.voucherId as any, vouchers.id as any))
        .where(and(
          eq(voucherEntries.ledgerId as any, bankLedgerId),
          eq(vouchers.companyId as any, "company_1")
        ));

      let totalDr = 0;
      let totalCr = 0;
      entries.forEach(e => {
        if (e.type === 'dr') totalDr += e.amount;
        else totalCr += e.amount;
      });

      let closingBalance;
      if (balanceType === 'dr') {
        closingBalance = openingBalance + totalDr - totalCr;
      } else {
        closingBalance = openingBalance + totalCr - totalDr;
      }

      setOpeningBalance(openingBalance);
      setClosingBalanceBooks(closingBalance);
    } catch (err) {
      console.error("Failed to calculate balances:", err);
      setOpeningBalance(0);
      setClosingBalanceBooks(0);
    } finally {
      setBalanceLoading(false);
    }
  };

  const fetchBankLedgers = async () => {
    try {
      const ledgersList = await db
        .select({ id: ledgers.id, name: ledgers.name })
        .from(ledgers)
        .where(and(
          eq(ledgers.companyId as any, "company_1"),
          eq(ledgers.isActive as any, true),
          eq(ledgers.group as any, "bank")
        ))
        .orderBy(ledgers.name);

      setBankLedgers(ledgersList);
      if (ledgersList.length > 0 && !bankLedgerId) {
        setBankLedgerId(ledgersList[0]?.id ?? null);
      }
    } catch (err) {
      console.error("Failed to fetch bank ledgers:", err);
    }
  };

  const fetchReconciliationData = async () => {
    if (!bankLedgerId) return;

    setLoading(true);
    try {
      const fromDate = dateFrom ? new Date(dateFrom).getTime() : undefined;
      const toDate = dateTo ? new Date(dateTo).getTime() : undefined;

      // Get all voucher entries for the bank ledger in the date range
      const entries = await db
        .select({
          id: voucherEntries.id,
          voucherId: voucherEntries.voucherId,
          date: vouchers.date,
          voucherNumber: vouchers.number,
          type: voucherEntries.type,
          amount: voucherEntries.amount,
          narration: voucherEntries.narration,
          voucherType: vouchers.type,
        })
        .from(voucherEntries)
        .innerJoin(vouchers, eq(voucherEntries.voucherId as any, vouchers.id as any))
        .where(and(
          eq(voucherEntries.ledgerId as any, bankLedgerId),
          eq(vouchers.companyId as any, "company_1"),
          fromDate ? gte(vouchers.date as any, fromDate) : undefined,
          toDate ? lte(vouchers.date as any, toDate) : undefined
        ))
        .orderBy(vouchers.date as any);

      // Transform to reconciliation format
      const data = entries.map(entry => ({
        id: entry.id,
        date: entry.date,
        voucherNumber: entry.voucherNumber,
        type: entry.voucherType === 'payment' || entry.voucherType === 'receipt'
          ? (entry.type === 'dr' ? 'Payment' : 'Receipt')
          : entry.voucherType,
        amount: entry.amount,
        narration: entry.narration ?? '',
        matched: matchedEntries.has(entry.id),
        source: 'books' as const
      }));

      setReconciliationData(data);
    } catch (err) {
      console.error("Failed to fetch reconciliation data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleBankStatementUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      if (!firstSheetName) return;
      const worksheet = workbook.Sheets[firstSheetName];
      if (!worksheet) return;
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
      const headerRow = jsonData[0] as any[] | undefined;

      if (!headerRow || jsonData.length < 2) {
        toast({
          title: "Error",
          description: "CSV file must have at least one data row.",
          variant: "destructive"
        });
        return;
      }

      // Assume CSV has columns: Date, Description, Amount (withdrawals negative, deposits positive) or separate Deposit/Withdrawal
      const headers = headerRow.map((h: any) => String(h).toLowerCase().trim());
      const rows = jsonData.slice(1);

      const bankStatement = rows.map((row: any[]) => {
        const rowObj: any = {};
        headers.forEach((header, index) => {
          rowObj[header] = row[index];
        });

        // Try to parse amount
        let amount = 0;
        let date = 0;
        let description = '';

        // Look for date column
        const dateKeys = ['date', 'transaction date', 'value date', 'posted date'];
        for (const key of dateKeys) {
          if (rowObj[key] !== undefined && rowObj[key] !== null) {
            const dateVal = rowObj[key];
            if (typeof dateVal === 'string') {
              const parsedDate = new Date(dateVal);
              if (!isNaN(parsedDate.getTime())) {
                date = parsedDate.getTime();
                break;
              }
            } else if (typeof dateVal === 'number') {
              // Excel date serial
              date = Math.round((dateVal - 25569) * 86400 * 1000); // Convert to Unix ms
              break;
            }
          }
        }

        // Look for description/description column
        const descKeys = ['description', 'narration', 'details', 'payee', 'reference'];
        for (const key of descKeys) {
          if (rowObj[key] !== undefined && rowObj[key] !== null && String(rowObj[key]).trim() !== '') {
            description = String(rowObj[key]).trim();
            break;
          }
        }

        // Look for amount column
        const depositKeys = ['deposit', 'credit', 'amount deposited'];
        const withdrawalKeys = ['withdrawal', 'debit', 'amount withdrawn', 'payment'];
        const amountKeys = ['amount', 'transaction amount'];

        let deposit = 0;
        let withdrawal = 0;

        for (const key of depositKeys) {
          if (rowObj[key] !== undefined && rowObj[key] !== null) {
            const val = parseFloat(rowObj[key]);
            if (!isNaN(val)) deposit = val;
          }
        }

        for (const key of withdrawalKeys) {
          if (rowObj[key] !== undefined && rowObj[key] !== null) {
            const val = parseFloat(rowObj[key]);
            if (!isNaN(val)) withdrawal = val;
          }
        }

        if (deposit !== 0 || withdrawal !== 0) {
          amount = deposit - withdrawal; // deposits positive, withdrawals negative
        } else {
          for (const key of amountKeys) {
            if (rowObj[key] !== undefined && rowObj[key] !== null) {
              const val = parseFloat(rowObj[key]);
              if (!isNaN(val)) {
                amount = val;
                break;
              }
            }
          }
        }

        return {
          id: `bank-${Math.random()}`,
          date,
          description,
          amount,
          matched: false,
          source: 'bank' as const
        };
      }).filter(item => !isNaN(item.date) && item.date !== 0);

      setBankStatementData(bankStatement);
      autoMatchTransactions();
    } catch (error) {
      console.error('Error parsing bank statement:', error);
      toast({
        title: "Error",
        description: "Failed to parse bank statement. Please check the format.",
        variant: "destructive"
      });
    } finally {
      e.target.value = ''; // Reset file input
    }
  };

  const autoMatchTransactions = () => {
    const newMatched = new Set<string>(matchedEntries);
    bankStatementData.forEach(bankEntry => {
      if (bankEntry.matched) return;

      // Find best match in books: same amount, closest date within 2 days
      let bestMatchId: string | null = null;
      let bestMatchDiff = Infinity;

      reconciliationData.forEach(booksEntry => {
        if (booksEntry.matched) return;
        if (Math.abs(booksEntry.amount - bankEntry.amount) > 0.01) return;

        const dateDiff = Math.abs(booksEntry.date - bankEntry.date);
        const twoDays = 2 * 24 * 60 * 60 * 1000;
        if (dateDiff > twoDays) return;

        if (dateDiff < bestMatchDiff) {
          bestMatchDiff = dateDiff;
          bestMatchId = booksEntry.id;
        }
      });

      if (bestMatchId) {
        newMatched.add(bestMatchId);
      }
    });

    setMatchedEntries(newMatched);
    setReconciliationData(prev =>
      prev.map(entry => ({
        ...entry,
        matched: newMatched.has(entry.id)
      }))
    );
  };

  const handleMatchSelected = () => {
    if (selectedBankStatementRow === null || selectedBankStatementRow >= bankStatementData.length) return;
    
    const bankEntry = bankStatementData[selectedBankStatementRow];
    let bestMatch: { entry: any; index: number } | null = null;
    let bestDiff = Infinity;

    reconciliationData.forEach((entry, index) => {
      if (entry.matched) return;
      if (Math.abs(entry.amount - bankEntry.amount) > 0.01) return;

      const dateDiff = Math.abs(entry.date - bankEntry.date);
      const twoDays = 2 * 24 * 60 * 60 * 1000;
      if (dateDiff > twoDays) return;

      if (dateDiff < bestDiff) {
        bestDiff = dateDiff;
        bestMatch = { entry, index };
      }
    });

    if (bestMatch) {
      const match = bestMatch as { entry: any; index: number };
      const newMatched = new Set<string>(matchedEntries);
      newMatched.add(match.entry.id);
      setMatchedEntries(newMatched);

      setReconciliationData(prev =>
        prev.map((e, i) => ({
          ...e,
          matched: i === match.index
        }))
      );

      const newBankStatement = [...bankStatementData];
      newBankStatement[selectedBankStatementRow] = {
        ...newBankStatement[selectedBankStatementRow],
        matched: true
      };
      setBankStatementData(newBankStatement);

      setSelectedBankStatementRow(null);
      setIsMatchingDialogOpen(false);
      toast({
        title: "Matched",
        description: "Transaction successfully matched."
      });
    } else {
      toast({
        title: "No Match Found",
        description: "Could not find a matching transaction in the books.",
        variant: "destructive"
      });
    }
  };

  const handleRowSelect = (index: number) => {
    setSelectedBankStatementRow(index === selectedBankStatementRow ? null : index);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between">
        <CardHeader>
          <CardTitle>Bank Reconciliation</CardTitle>
          <CardDescription>
            Match your bank statement transactions with accounting records to ensure accuracy.
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
                  fetchReconciliationData();
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
                  fetchReconciliationData();
                }}
                className="w-48"
              />
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Bank Account</label>
              <Select
                value={bankLedgerId ?? undefined}
                onValueChange={setBankLedgerId}
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Select bank" />
                </SelectTrigger>
                <SelectContent>
                  {bankLedgers.map(ledger => (
                    <SelectItem key={ledger.id} value={ledger.id}>
                      {ledger.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={fetchReconciliationData} className="h-10">
            Refresh
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Bank Statement</CardTitle>
          <CardDescription>
            Upload your bank statement (CSV or Excel) to begin reconciliation.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2">
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleBankStatementUpload}
                  className="hidden"
                />
                <Button variant="default">Upload Statement</Button>
              </label>
              <Button variant="outline" onClick={() => setBankStatementData([])} size="icon" aria-label="Clear bank statement">
                <X className="w-4 h-4" />
              </Button>
            </div>
            {bankStatementData.length > 0 && (
              <>
                <p className="text-sm text-muted-foreground">
                  {bankStatementData.length} transactions loaded from bank statement.
                </p>
                <Button onClick={autoMatchTransactions} variant="outline" size="sm">
                  Auto-Match Transactions
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {bankLedgerId && (
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Reconciliation</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                Loading...
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <h3 className="font-semibold mb-2">Bank Statement Transactions</h3>
                    {bankStatementData.length === 0 ? (
                      <p className="text-muted-foreground">No bank statement uploaded.</p>
                    ) : (
                      <Table className="w-full">
                        <thead>
                          <tr>
                            <th className="text-left px-4 py-2">Date</th>
                            <th className="text-left px-4 py-2">Description</th>
                            <th className="text-right px-4 py-2">Amount</th>
                            <th className="text-center px-4 py-2">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-muted">
                          {bankStatementData.map((entry, index) => (
                            <tr
                              key={entry.id}
                              className={`
                                cursor-pointer
                                hover:bg-muted
                                ${entry.matched ? 'border-l-4 border-success' : ''}
                                ${selectedBankStatementRow === index ? 'bg-primary/10' : ''}
                              `}
                              onClick={() => handleRowSelect(index)}
                            >
                              <td className="px-4 py-3 text-sm">
                                {new Date(entry.date).toLocaleDateString()}
                              </td>
                              <td className="px-4 py-3 text-sm">{entry.description}</td>
                              <td className="px-4 py-3 text-sm text-right">
                                {formatCurrency(entry.amount)}
                              </td>
                              <td className="px-4 py-3 text-sm text-center">
                                {entry.matched ? (
                                  <Badge variant="secondary">Matched</Badge>
                                ) : (
                                  <Badge variant="destructive">Unmatched</Badge>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Accounting Records</h3>
                    {reconciliationData.length === 0 ? (
                      <p className="text-muted-foreground">No transactions found.</p>
                    ) : (
                      <Table className="w-full">
                        <thead>
                          <tr>
                            <th className="text-left px-4 py-2">Date</th>
                            <th className="text-left px-4 py-2">Type</th>
                            <th className="text-left px-4 py-2">Reference</th>
                            <th className="text-right px-4 py-2">Amount</th>
                            <th className="text-center px-4 py-2">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-muted">
                          {reconciliationData.map((entry) => (
                            <tr key={entry.id} className="hover:bg-muted">
                              <td className="px-4 py-3 text-sm">
                                {new Date(entry.date).toLocaleDateString()}
                              </td>
                              <td className="px-4 py-3 text-sm capitalize">{entry.type}</td>
                              <td className="px-4 py-3 text-sm text-muted-foreground">
                                {entry.voucherNumber ?? entry.narration}
                              </td>
                              <td className="px-4 py-3 text-sm text-right">
                                {formatCurrency(entry.amount)}
                              </td>
                              <td className="px-4 py-3 text-sm text-center">
                                {entry.matched ? (
                                  <Badge variant="secondary">Matched</Badge>
                                ) : (
                                  <Badge variant="destructive">Unmatched</Badge>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    )}
                  </div>
                </div>

                {selectedBankStatementRow !== null && (
                  <div className="pt-4 border-t">
                    <Button
                      onClick={handleMatchSelected}
                      className="w-full"
                      disabled={reconciliationData.every(e => e.matched)}
                    >
                      Match Selected Bank Transaction
                    </Button>
                  </div>
                )}

                <div className="my-6 border-t border-muted"></div>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold">Opening Balance (Books)</h4>
                      <p className="text-2xl font-bold">
                        {balanceLoading ? "Loading..." : formatCurrency(openingBalance ?? 0)}
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold">Closing Balance (Books)</h4>
                      <p className="text-2xl font-bold">
                        {balanceLoading ? "Loading..." : formatCurrency(closingBalanceBooks ?? 0)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={() => {
              setMatchedEntries(new Set());
              setReconciliationData([]);
              setBankStatementData([]);
              fetchReconciliationData();
            }}>
              Start New Reconciliation
            </Button>
            <Button onClick={() => {
              toast({
                title: "Reconciliation Complete",
                description: "Your bank reconciliation has been completed successfully."
              });
            }}>
              Complete Reconciliation
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}