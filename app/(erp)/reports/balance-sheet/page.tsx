"use client";

import { getBalanceSheetReportData } from "@/app/(erp)/reports/actions";
import { formatCurrency } from "@/lib/types";
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { ReportExportButtons } from "@/components/reports/report-export-buttons";

export const dynamic = "force-dynamic";
// export const metadata = { title: "Balance Sheet -  ERP" };

export default function BalanceSheetPage() {
  const [date, setDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [balanceSheetData, setBalanceSheetData] = useState<any>(null);

  // Default to today
  const today = new Date();

  useEffect(() => {
    const todayStr = today.toISOString().split("T")[0];
    setDate(todayStr);
    fetchBalanceSheet(todayStr);
  }, []);

  const fetchBalanceSheet = async (selectedDate = date) => {
    setLoading(true);
    try {
      const data = await getBalanceSheetReportData(selectedDate);
      setBalanceSheetData(data);
    } catch (err) {
      console.error("Failed to fetch balance sheet:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between">
        <CardHeader>
          <CardTitle>Balance Sheet</CardTitle>
          <CardDescription>
            Financial position as of selected date (Liabilities and Assets)
          </CardDescription>
        </CardHeader>
        <div className="flex flex-wrap gap-4 sm:mt-0">
          <div className="flex items-center space-x-3">
            <CalendarIcon className="w-4 h-4" />
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">As of Date</label>
              <Calendar
                mode="single"
                selected={date ? new Date(date) : undefined}
                onSelect={(value: any) => {
                  setDate(value?.toISOString().split("T")[0] ?? null);
                  fetchBalanceSheet();
                }}
                className="w-48"
              />
            </div>
          </div>
          <Button onClick={() => fetchBalanceSheet()} className="h-10 cursor-pointer">
            Refresh
          </Button>
          <ReportExportButtons
            tableId=""
            elementId="balance-sheet-report"
            filename={`balance-sheet_${date}`}
            className="sm:mt-0"
          />
        </div>
      </div>

      <Card id="balance-sheet-report" className="w-full">
        <CardHeader>
          <CardTitle>Balance Sheet</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              Loading...
            </div>
          ) : !balanceSheetData ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              No data available.
            </div>
          ) : (
            <>
              <div className="grid gap-4">
                {/* Liabilities */}
                <div className="col-span-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg font-semibold">LIABILITIES</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <thead>
                          <tr>
                            <th className="text-left px-6 py-3">Liabilities</th>
                            <th className="text-right px-6 py-3">Amount (₹)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {/* Capital */}
                          {balanceSheetData.groups.capital.map((ledger: any, index: number) => (
                            <tr key={index}>
                              <td className="px-6 py-4 text-left">{ledger.name}</td>
                              <td className="px-6 py-4 text-right text-sm">{formatCurrency(ledger.closingBalance)}</td>
                            </tr>
                          ))}
                          {!balanceSheetData.groups.capital.length && (
                            <tr>
                              <td colSpan={2} className="px-6 py-4 text-center text-muted-foreground">
                                No capital ledgers
                              </td>
                            </tr>
                          )}

                          {/* Sundry Creditors */}
                          <tr className="border-t border-b font-semibold">
                            <td colSpan={2} className="px-6 py-4">Sundry Creditors</td>
                          </tr>
                          {balanceSheetData.groups.sundryCreditors.map((ledger: any, index: number) => (
                            <tr key={index}>
                              <td className="px-6 py-4 text-left">{ledger.name}</td>
                              <td className="px-6 py-4 text-right text-sm">{formatCurrency(ledger.closingBalance)}</td>
                            </tr>
                          ))}
                          {!balanceSheetData.groups.sundryCreditors.length && (
                            <tr>
                              <td colSpan={2} className="px-6 py-4 text-center text-muted-foreground">
                                No sundry creditors
                              </td>
                            </tr>
                          )}

                          {/* Duties & Taxes */}
                          <tr className="border-t border-b font-semibold">
                            <td colSpan={2} className="px-6 py-4">Duties & Taxes</td>
                          </tr>
                          {balanceSheetData.groups.dutiesTaxes.map((ledger: any, index: number) => (
                            <tr key={index}>
                              <td className="px-6 py-4 text-left">{ledger.name}</td>
                              <td className="px-6 py-4 text-right text-sm">{formatCurrency(ledger.closingBalance)}</td>
                            </tr>
                          ))}
                          {!balanceSheetData.groups.dutiesTaxes.length && (
                            <tr>
                              <td colSpan={2} className="px-6 py-4 text-center text-muted-foreground">
                                No duties & taxes
                              </td>
                            </tr>
                          )}

                          {/* Loans (if any) - could be in other group or create specific group */}
                          <tr className="border-t border-b font-semibold">
                            <td colSpan={2} className="px-6 py-4">Loans</td>
                          </tr>
                          {balanceSheetData.groups.other.filter((l: any) => l.name.toLowerCase().includes('loan') || l.name.toLowerCase().includes('borrow')).map((ledger: any, index: number) => (
                            <tr key={index}>
                              <td className="px-6 py-4 text-left">{ledger.name}</td>
                              <td className="px-6 py-4 text-right text-sm">{formatCurrency(ledger.closingBalance)}</td>
                            </tr>
                          ))}
                          {!balanceSheetData.groups.other.filter((l: any) => l.name.toLowerCase().includes('loan') || l.name.toLowerCase().includes('borrow')).length && (
                            <tr>
                              <td colSpan={2} className="px-6 py-4 text-center text-muted-foreground">
                                No loans
                              </td>
                            </tr>
                          )}

                          {/* Total Liabilities */}
                          <tr className="border-t font-bold">
                            <td className="px-6 py-4 text-left font-bold">TOTAL LIABILITIES</td>
                            <td className="px-6 py-4 text-right text-sm font-bold">
                              {formatCurrency(
                                balanceSheetData.totals.capital +
                                balanceSheetData.totals.sundryCreditors +
                                balanceSheetData.totals.dutiesTaxes
                              )}
                            </td>
                          </tr>
                        </tbody>
                      </Table>
                    </CardContent>
                  </Card>
                </div>

                {/* Assets */}
                <div className="col-span-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg font-semibold">ASSETS</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <thead>
                          <tr>
                            <th className="text-left px-6 py-3">Assets</th>
                            <th className="text-right px-6 py-3">Amount (₹)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {/* Fixed Assets */}
                          <tr className="border-t border-b font-semibold">
                            <td colSpan={2} className="px-6 py-4">Fixed Assets</td>
                          </tr>
                          {balanceSheetData.groups.fixedAssets.map((ledger: any, index: number) => (
                            <tr key={index}>
                              <td className="px-6 py-4 text-left">{ledger.name}</td>
                              <td className="px-6 py-4 text-right text-sm">{formatCurrency(ledger.closingBalance)}</td>
                            </tr>
                          ))}
                          {!balanceSheetData.groups.fixedAssets.length && (
                            <tr>
                              <td colSpan={2} className="px-6 py-4 text-center text-muted-foreground">
                                No fixed assets
                              </td>
                            </tr>
                          )}

                          {/* Sundry Debtors */}
                          <tr className="border-t border-b font-semibold">
                            <td colSpan={2} className="px-6 py-4">Sundry Debtors</td>
                          </tr>
                          {balanceSheetData.groups.sundryDebtors.map((ledger: any, index: number) => (
                            <tr key={index}>
                              <td className="px-6 py-4 text-left">{ledger.name}</td>
                              <td className="px-6 py-4 text-right text-sm">{formatCurrency(ledger.closingBalance)}</td>
                            </tr>
                          ))}
                          {!balanceSheetData.groups.sundryDebtors.length && (
                            <tr>
                              <td colSpan={2} className="px-6 py-4 text-center text-muted-foreground">
                                No sundry debtors
                              </td>
                            </tr>
                          )}

                          {/* Stock / Inventory */}
                          <tr className="border-t border-b font-semibold">
                            <td colSpan={2} className="px-6 py-4">Stock-in-Trade</td>
                          </tr>
                          {balanceSheetData.groups.stock.map((ledger: any, index: number) => (
                            <tr key={index}>
                              <td className="px-6 py-4 text-left">{ledger.name}</td>
                              <td className="px-6 py-4 text-right text-sm">{formatCurrency(ledger.closingBalance)}</td>
                            </tr>
                          ))}
                          {!balanceSheetData.groups.stock.length && (
                            <tr>
                              <td colSpan={2} className="px-6 py-4 text-center text-muted-foreground">
                                No stock
                              </td>
                            </tr>
                          )}

                          {/* Bank */}
                          <tr className="border-t border-b font-semibold">
                            <td colSpan={2} className="px-6 py-4">Bank Accounts</td>
                          </tr>
                          {balanceSheetData.groups.bank.map((ledger: any, index: number) => (
                            <tr key={index}>
                              <td className="px-6 py-4 text-left">{ledger.name}</td>
                              <td className="px-6 py-4 text-right text-sm">{formatCurrency(ledger.closingBalance)}</td>
                            </tr>
                          ))}
                          {!balanceSheetData.groups.bank.length && (
                            <tr>
                              <td colSpan={2} className="px-6 py-4 text-center text-muted-foreground">
                                No bank accounts
                              </td>
                            </tr>
                          )}

                          {/* Cash */}
                          <tr className="border-t border-b font-semibold">
                            <td colSpan={2} className="px-6 py-4">Cash-in-Hand</td>
                          </tr>
                          {balanceSheetData.groups.cash.map((ledger: any, index: number) => (
                            <tr key={index}>
                              <td className="px-6 py-4 text-left">{ledger.name}</td>
                              <td className="px-6 py-4 text-right text-sm">{formatCurrency(ledger.closingBalance)}</td>
                            </tr>
                          ))}
                          {!balanceSheetData.groups.cash.length && (
                            <tr>
                              <td colSpan={2} className="px-6 py-4 text-center text-muted-foreground">
                                No cash
                              </td>
                            </tr>
                          )}

                          {/* Other Current Assets */}
                          <tr className="border-t border-b font-semibold">
                            <td colSpan={2} className="px-6 py-4">Other Current Assets</td>
                          </tr>
                          {balanceSheetData.groups.other
                            .filter((l: any) => !l.name.toLowerCase().includes('loan') && !l.name.toLowerCase().includes('borrow'))
                            .map((ledger: any, index: number) => (
                              <tr key={index}>
                                <td className="px-6 py-4 text-left">{ledger.name}</td>
                                <td className="px-6 py-4 text-right text-sm">{formatCurrency(ledger.closingBalance)}</td>
                              </tr>
                          ))}
                          {!balanceSheetData.groups.other
                            .filter((l: any) => !l.name.toLowerCase().includes('loan') && !l.name.toLowerCase().includes('borrow')).length && (
                            <tr>
                              <td colSpan={2} className="px-6 py-4 text-center text-muted-foreground">
                                No other current assets
                              </td>
                            </tr>
                          )}

                          {/* Total Assets */}
                          <tr className="border-t font-bold">
                            <td className="px-6 py-4 text-left font-bold">TOTAL ASSETS</td>
                            <td className="px-6 py-4 text-right text-sm font-bold">
                              {formatCurrency(
                                balanceSheetData.totals.fixedAssets +
                                balanceSheetData.totals.sundryDebtors +
                                balanceSheetData.totals.stock +
                                balanceSheetData.totals.bank +
                                balanceSheetData.totals.cash
                              )}
                            </td>
                          </tr>
                        </tbody>
                      </Table>
                    </CardContent>
                  </Card>
                </div>

                {/* Verification */}
                <div className="col-span-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg font-semibold">VERIFICATION</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <tbody className="divide-y">
                          <tr>
                            <td className="px-6 py-4 text-left">Total Liabilities</td>
                            <td className="px-6 py-4 text-right text-sm font-bold">
                              {formatCurrency(
                                balanceSheetData.totals.capital +
                                balanceSheetData.totals.sundryCreditors +
                                balanceSheetData.totals.dutiesTaxes
                              )}
                            </td>
                          </tr>
                          <tr>
                            <td className="px-6 py-4 text-left">Total Assets</td>
                            <td className="px-6 py-4 text-right text-sm font-bold">
                              {formatCurrency(
                                balanceSheetData.totals.fixedAssets +
                                balanceSheetData.totals.sundryDebtors +
                                balanceSheetData.totals.stock +
                                balanceSheetData.totals.bank +
                                balanceSheetData.totals.cash
                              )}
                            </td>
                          </tr>
                          <tr className="border-t font-bold">
                            <td className="px-6 py-4 text-left">Difference (Should be 0)</td>
                            <td className="px-6 py-4 text-right text-sm font-bold">
                              {formatCurrency(
                                (balanceSheetData.totals.capital +
                                 balanceSheetData.totals.sundryCreditors +
                                 balanceSheetData.totals.dutiesTaxes) -
                                (balanceSheetData.totals.fixedAssets +
                                 balanceSheetData.totals.sundryDebtors +
                                 balanceSheetData.totals.stock +
                                 balanceSheetData.totals.bank +
                                 balanceSheetData.totals.cash)
                              )}
                            </td>
                          </tr>
                        </tbody>
                      </Table>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
