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
  const [detailedView, setDetailedView] = useState(false);

  // Default to today
  const today = new Date();

  useEffect(() => {
    const todayStr = today.toISOString().split("T")[0];
    setDate(todayStr);
    fetchBalanceSheet(todayStr);
  }, []);

  // Listen for global Alt+F1 detailed view broadcast
  useEffect(() => {
    const handleDetailedToggle = () => {
      setDetailedView(prev => !prev);
    };
    window.addEventListener("erp:detailed-view", handleDetailedToggle);
    return () => window.removeEventListener("erp:detailed-view", handleDetailedToggle);
  }, []);

  // Pre-calculate custom sub-group totals
  const loansGroup = balanceSheetData?.groups?.other?.filter((l: any) => l.name.toLowerCase().includes('loan') || l.name.toLowerCase().includes('borrow')) || [];
  const loansTotal = loansGroup.reduce((sum: number, l: any) => sum + (l.closingBalance || 0), 0);

  const otherAssetsGroup = balanceSheetData?.groups?.other?.filter((l: any) => !l.name.toLowerCase().includes('loan') && !l.name.toLowerCase().includes('borrow')) || [];
  const otherAssetsTotal = otherAssetsGroup.reduce((sum: number, l: any) => sum + (l.closingBalance || 0), 0);

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
          <Button id="tour-detailed-btn" onClick={() => setDetailedView(p => !p)} variant="outline" className="h-10 border-border/80 gap-1.5 font-bold cursor-pointer hover:bg-muted select-none">
            <span className="bg-muted px-1.5 py-0.5 rounded text-[10px] font-mono font-black border border-border">Alt+F1</span>
            {detailedView ? "Summary" : "Detailed"}
          </Button>
          <Button onClick={() => fetchBalanceSheet()} className="h-10 cursor-pointer">
            Refresh
          </Button>
          <ReportExportButtons
            tableId="balance-sheet-report-table"
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
                          {detailedView ? (
                            <>
                              {/* --- CAPITAL ACCOUNT --- */}
                              <tr className="bg-muted/15 font-bold">
                                <td className="px-6 py-2.5 text-left text-xs uppercase tracking-wide">Capital Account</td>
                                <td className="px-6 py-2.5 text-right font-bold text-xs">{formatCurrency(balanceSheetData.totals.capital)}</td>
                              </tr>
                              {balanceSheetData.groups.capital.map((ledger: any, idx: number) => (
                                <tr key={`cap-${idx}`} className="hover:bg-muted/5 font-medium text-xs text-muted-foreground">
                                  <td className="px-10 py-2 text-left">{ledger.name}</td>
                                  <td className="px-6 py-2 text-right">{formatCurrency(ledger.closingBalance)}</td>
                                </tr>
                              ))}
                              {!balanceSheetData.groups.capital.length && (
                                <tr className="text-xs text-muted-foreground"><td colSpan={2} className="px-10 py-2 text-left">No capital accounts</td></tr>
                              )}

                              {/* --- LOANS --- */}
                              <tr className="bg-muted/15 font-bold">
                                <td className="px-6 py-2.5 text-left text-xs uppercase tracking-wide">Loans (Liabilities)</td>
                                <td className="px-6 py-2.5 text-right font-bold text-xs">{formatCurrency(loansTotal)}</td>
                              </tr>
                              {loansGroup.map((ledger: any, idx: number) => (
                                <tr key={`loan-${idx}`} className="hover:bg-muted/5 font-medium text-xs text-muted-foreground">
                                  <td className="px-10 py-2 text-left">{ledger.name}</td>
                                  <td className="px-6 py-2 text-right">{formatCurrency(ledger.closingBalance)}</td>
                                </tr>
                              ))}
                              {!loansGroup.length && (
                                <tr className="text-xs text-muted-foreground"><td colSpan={2} className="px-10 py-2 text-left">No active borrowings</td></tr>
                              )}

                              {/* --- SUNDRY CREDITORS --- */}
                              <tr className="bg-muted/15 font-bold">
                                <td className="px-6 py-2.5 text-left text-xs uppercase tracking-wide">Sundry Creditors</td>
                                <td className="px-6 py-2.5 text-right font-bold text-xs">{formatCurrency(balanceSheetData.totals.sundryCreditors)}</td>
                              </tr>
                              {balanceSheetData.groups.sundryCreditors.map((ledger: any, idx: number) => (
                                <tr key={`cred-${idx}`} className="hover:bg-muted/5 font-medium text-xs text-muted-foreground">
                                  <td className="px-10 py-2 text-left">{ledger.name}</td>
                                  <td className="px-6 py-2 text-right">{formatCurrency(ledger.closingBalance)}</td>
                                </tr>
                              ))}
                              {!balanceSheetData.groups.sundryCreditors.length && (
                                <tr className="text-xs text-muted-foreground"><td colSpan={2} className="px-10 py-2 text-left">No sundry creditors</td></tr>
                              )}

                              {/* --- DUTIES & TAXES --- */}
                              <tr className="bg-muted/15 font-bold">
                                <td className="px-6 py-2.5 text-left text-xs uppercase tracking-wide">Duties & Taxes</td>
                                <td className="px-6 py-2.5 text-right font-bold text-xs">{formatCurrency(balanceSheetData.totals.dutiesTaxes)}</td>
                              </tr>
                              {balanceSheetData.groups.dutiesTaxes.map((ledger: any, idx: number) => (
                                <tr key={`tax-${idx}`} className="hover:bg-muted/5 font-medium text-xs text-muted-foreground">
                                  <td className="px-10 py-2 text-left">{ledger.name}</td>
                                  <td className="px-6 py-2 text-right">{formatCurrency(ledger.closingBalance)}</td>
                                </tr>
                              ))}
                              {!balanceSheetData.groups.dutiesTaxes.length && (
                                <tr className="text-xs text-muted-foreground"><td colSpan={2} className="px-10 py-2 text-left">No duties & taxes</td></tr>
                              )}
                            </>
                          ) : (
                            <>
                              <tr className="hover:bg-muted/5 font-bold text-xs">
                                <td className="px-6 py-3.5 text-left">Capital Account</td>
                                <td className="px-6 py-3.5 text-right">{formatCurrency(balanceSheetData.totals.capital)}</td>
                              </tr>
                              <tr className="hover:bg-muted/5 font-bold text-xs">
                                <td className="px-6 py-3.5 text-left">Loans (Liabilities)</td>
                                <td className="px-6 py-3.5 text-right">{formatCurrency(loansTotal)}</td>
                              </tr>
                              <tr className="hover:bg-muted/5 font-bold text-xs">
                                <td className="px-6 py-3.5 text-left">Sundry Creditors</td>
                                <td className="px-6 py-3.5 text-right">{formatCurrency(balanceSheetData.totals.sundryCreditors)}</td>
                              </tr>
                              <tr className="hover:bg-muted/5 font-bold text-xs">
                                <td className="px-6 py-3.5 text-left">Duties & Taxes</td>
                                <td className="px-6 py-3.5 text-right">{formatCurrency(balanceSheetData.totals.dutiesTaxes)}</td>
                              </tr>
                            </>
                          )}

                          {/* Total Liabilities */}
                          <tr className="border-t-2 border-double border-border bg-muted/30 font-extrabold text-sm text-foreground">
                            <td className="px-6 py-4 text-left uppercase tracking-wider font-black">TOTAL LIABILITIES</td>
                            <td className="px-6 py-4 text-right font-black">
                              {formatCurrency(
                                balanceSheetData.totals.capital +
                                balanceSheetData.totals.sundryCreditors +
                                balanceSheetData.totals.dutiesTaxes +
                                loansTotal
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
                          {detailedView ? (
                            <>
                              {/* --- FIXED ASSETS --- */}
                              <tr className="bg-muted/15 font-bold">
                                <td className="px-6 py-2.5 text-left text-xs uppercase tracking-wide">Fixed Assets</td>
                                <td className="px-6 py-2.5 text-right font-bold text-xs">{formatCurrency(balanceSheetData.totals.fixedAssets)}</td>
                              </tr>
                              {balanceSheetData.groups.fixedAssets.map((ledger: any, idx: number) => (
                                <tr key={`fa-${idx}`} className="hover:bg-muted/5 font-medium text-xs text-muted-foreground">
                                  <td className="px-10 py-2 text-left">{ledger.name}</td>
                                  <td className="px-6 py-2 text-right">{formatCurrency(ledger.closingBalance)}</td>
                                </tr>
                              ))}
                              {!balanceSheetData.groups.fixedAssets.length && (
                                <tr className="text-xs text-muted-foreground"><td colSpan={2} className="px-10 py-2 text-left">No fixed assets</td></tr>
                              )}

                              {/* --- SUNDRY DEBTORS --- */}
                              <tr className="bg-muted/15 font-bold">
                                <td className="px-6 py-2.5 text-left text-xs uppercase tracking-wide">Sundry Debtors</td>
                                <td className="px-6 py-2.5 text-right font-bold text-xs">{formatCurrency(balanceSheetData.totals.sundryDebtors)}</td>
                              </tr>
                              {balanceSheetData.groups.sundryDebtors.map((ledger: any, idx: number) => (
                                <tr key={`deb-${idx}`} className="hover:bg-muted/5 font-medium text-xs text-muted-foreground">
                                  <td className="px-10 py-2 text-left">{ledger.name}</td>
                                  <td className="px-6 py-2 text-right">{formatCurrency(ledger.closingBalance)}</td>
                                </tr>
                              ))}
                              {!balanceSheetData.groups.sundryDebtors.length && (
                                <tr className="text-xs text-muted-foreground"><td colSpan={2} className="px-10 py-2 text-left">No sundry debtors</td></tr>
                              )}

                              {/* --- STOCK IN TRADE --- */}
                              <tr className="bg-muted/15 font-bold">
                                <td className="px-6 py-2.5 text-left text-xs uppercase tracking-wide">Stock-in-Trade</td>
                                <td className="px-6 py-2.5 text-right font-bold text-xs">{formatCurrency(balanceSheetData.totals.stock)}</td>
                              </tr>
                              {balanceSheetData.groups.stock.map((ledger: any, idx: number) => (
                                <tr key={`stock-${idx}`} className="hover:bg-muted/5 font-medium text-xs text-muted-foreground">
                                  <td className="px-10 py-2 text-left">{ledger.name}</td>
                                  <td className="px-6 py-2 text-right">{formatCurrency(ledger.closingBalance)}</td>
                                </tr>
                              ))}
                              {!balanceSheetData.groups.stock.length && (
                                <tr className="text-xs text-muted-foreground"><td colSpan={2} className="px-10 py-2 text-left">No registered stock</td></tr>
                              )}

                              {/* --- BANK ACCOUNTS --- */}
                              <tr className="bg-muted/15 font-bold">
                                <td className="px-6 py-2.5 text-left text-xs uppercase tracking-wide">Bank Accounts</td>
                                <td className="px-6 py-2.5 text-right font-bold text-xs">{formatCurrency(balanceSheetData.totals.bank)}</td>
                              </tr>
                              {balanceSheetData.groups.bank.map((ledger: any, idx: number) => (
                                <tr key={`bank-${idx}`} className="hover:bg-muted/5 font-medium text-xs text-muted-foreground">
                                  <td className="px-10 py-2 text-left">{ledger.name}</td>
                                  <td className="px-6 py-2 text-right">{formatCurrency(ledger.closingBalance)}</td>
                                </tr>
                              ))}
                              {!balanceSheetData.groups.bank.length && (
                                <tr className="text-xs text-muted-foreground"><td colSpan={2} className="px-10 py-2 text-left">No active bank accounts</td></tr>
                              )}

                              {/* --- CASH IN HAND --- */}
                              <tr className="bg-muted/15 font-bold">
                                <td className="px-6 py-2.5 text-left text-xs uppercase tracking-wide">Cash-in-Hand</td>
                                <td className="px-6 py-2.5 text-right font-bold text-xs">{formatCurrency(balanceSheetData.totals.cash)}</td>
                              </tr>
                              {balanceSheetData.groups.cash.map((ledger: any, idx: number) => (
                                <tr key={`cash-${idx}`} className="hover:bg-muted/5 font-medium text-xs text-muted-foreground">
                                  <td className="px-10 py-2 text-left">{ledger.name}</td>
                                  <td className="px-6 py-2 text-right">{formatCurrency(ledger.closingBalance)}</td>
                                </tr>
                              ))}
                              {!balanceSheetData.groups.cash.length && (
                                <tr className="text-xs text-muted-foreground"><td colSpan={2} className="px-10 py-2 text-left">No cash ledger</td></tr>
                              )}

                              {/* --- OTHER CURRENT ASSETS --- */}
                              <tr className="bg-muted/15 font-bold">
                                <td className="px-6 py-2.5 text-left text-xs uppercase tracking-wide">Other Current Assets</td>
                                <td className="px-6 py-2.5 text-right font-bold text-xs">{formatCurrency(otherAssetsTotal)}</td>
                              </tr>
                              {otherAssetsGroup.map((ledger: any, idx: number) => (
                                <tr key={`other-${idx}`} className="hover:bg-muted/5 font-medium text-xs text-muted-foreground">
                                  <td className="px-10 py-2 text-left">{ledger.name}</td>
                                  <td className="px-6 py-2 text-right">{formatCurrency(ledger.closingBalance)}</td>
                                </tr>
                              ))}
                              {!otherAssetsGroup.length && (
                                <tr className="text-xs text-muted-foreground"><td colSpan={2} className="px-10 py-2 text-left">No other current assets</td></tr>
                              )}
                            </>
                          ) : (
                            <>
                              <tr className="hover:bg-muted/5 font-bold text-xs">
                                <td className="px-6 py-3.5 text-left">Fixed Assets</td>
                                <td className="px-6 py-3.5 text-right">{formatCurrency(balanceSheetData.totals.fixedAssets)}</td>
                              </tr>
                              <tr className="hover:bg-muted/5 font-bold text-xs">
                                <td className="px-6 py-3.5 text-left">Sundry Debtors</td>
                                <td className="px-6 py-3.5 text-right">{formatCurrency(balanceSheetData.totals.sundryDebtors)}</td>
                              </tr>
                              <tr className="hover:bg-muted/5 font-bold text-xs">
                                <td className="px-6 py-3.5 text-left">Stock-in-Trade</td>
                                <td className="px-6 py-3.5 text-right">{formatCurrency(balanceSheetData.totals.stock)}</td>
                              </tr>
                              <tr className="hover:bg-muted/5 font-bold text-xs">
                                <td className="px-6 py-3.5 text-left">Bank Accounts</td>
                                <td className="px-6 py-3.5 text-right">{formatCurrency(balanceSheetData.totals.bank)}</td>
                              </tr>
                              <tr className="hover:bg-muted/5 font-bold text-xs">
                                <td className="px-6 py-3.5 text-left">Cash-in-Hand</td>
                                <td className="px-6 py-3.5 text-right">{formatCurrency(balanceSheetData.totals.cash)}</td>
                              </tr>
                              <tr className="hover:bg-muted/5 font-bold text-xs">
                                <td className="px-6 py-3.5 text-left">Other Current Assets</td>
                                <td className="px-6 py-3.5 text-right">{formatCurrency(otherAssetsTotal)}</td>
                              </tr>
                            </>
                          )}

                          {/* Total Assets */}
                          <tr className="border-t-2 border-double border-border bg-muted/30 font-extrabold text-sm text-foreground">
                            <td className="px-6 py-4 text-left uppercase tracking-wider font-black">TOTAL ASSETS</td>
                            <td className="px-6 py-4 text-right font-black">
                              {formatCurrency(
                                balanceSheetData.totals.fixedAssets +
                                balanceSheetData.totals.sundryDebtors +
                                balanceSheetData.totals.stock +
                                balanceSheetData.totals.bank +
                                balanceSheetData.totals.cash +
                                otherAssetsTotal
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
                        <tbody className="divide-y font-bold text-xs text-foreground">
                          <tr>
                            <td className="px-6 py-4 text-left">Total Liabilities</td>
                            <td className="px-6 py-4 text-right font-extrabold text-sm">
                              {formatCurrency(
                                balanceSheetData.totals.capital +
                                balanceSheetData.totals.sundryCreditors +
                                balanceSheetData.totals.dutiesTaxes +
                                loansTotal
                              )}
                            </td>
                          </tr>
                          <tr>
                            <td className="px-6 py-4 text-left">Total Assets</td>
                            <td className="px-6 py-4 text-right font-extrabold text-sm">
                              {formatCurrency(
                                balanceSheetData.totals.fixedAssets +
                                balanceSheetData.totals.sundryDebtors +
                                balanceSheetData.totals.stock +
                                balanceSheetData.totals.bank +
                                balanceSheetData.totals.cash +
                                otherAssetsTotal
                              )}
                            </td>
                          </tr>
                          <tr className="border-t-2 border-double border-border bg-muted/20 font-black">
                            <td className="px-6 py-4 text-left uppercase">Difference (Should be 0)</td>
                            <td className="px-6 py-4 text-right text-sm font-black">
                              {formatCurrency(
                                (balanceSheetData.totals.capital +
                                 balanceSheetData.totals.sundryCreditors +
                                 balanceSheetData.totals.dutiesTaxes +
                                 loansTotal) -
                                (balanceSheetData.totals.fixedAssets +
                                 balanceSheetData.totals.sundryDebtors +
                                 balanceSheetData.totals.stock +
                                 balanceSheetData.totals.bank +
                                 balanceSheetData.totals.cash +
                                 otherAssetsTotal)
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
