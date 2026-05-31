"use client";

import { getGSTReportData } from "@/app/(erp)/reports/actions";
import { formatCurrency } from "@/lib/types";
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CalendarIcon, FileSpreadsheet, ShieldCheck, Scale, FileText, ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { ReportExportButtons } from "@/components/reports/report-export-buttons";
import { cn } from "@/lib/utils";

export default function GSTPage() {
  const [dateFrom, setDateFrom] = useState<string | null>(null);
  const [dateTo, setDateTo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [gstData, setGSTData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<string>("gstr1");

  // Default to current month
  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

  useEffect(() => {
    const fromStr = firstDayOfMonth.toISOString().split("T")[0];
    const toStr = lastDayOfMonth.toISOString().split("T")[0];
    setDateFrom(fromStr);
    setDateTo(toStr);
    fetchGSTData(fromStr, toStr);
  }, []);

  const fetchGSTData = async (from = dateFrom, to = dateTo) => {
    setLoading(true);
    try {
      const data = await getGSTReportData(from, to);
      setGSTData({
        ...data,
        period: {
          from,
          to
        }
      });
    } catch (err) {
      console.error("Failed to fetch GST report:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-black tracking-tight text-primary flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-accent animate-pulse" />
            Statutory Indian GST Return filing Desk
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Dynamic GSTR-1 outward sales splits and GSTR-3B input credit offset reconciliations.
          </p>
        </div>
        
        {/* Calendar Picker Panel */}
        <div className="flex flex-wrap gap-3 select-none">
          <div className="flex items-center space-x-2 bg-muted/40 p-1 px-2.5 rounded-xl border border-border/55">
            <CalendarIcon className="w-3.5 h-3.5 text-muted-foreground" />
            <div className="flex flex-col">
              <span className="text-[9px] uppercase font-bold text-muted-foreground">From Date</span>
              <Calendar
                mode="single"
                selected={dateFrom ? new Date(dateFrom) : undefined}
                onSelect={(value: any) => {
                  const str = value?.toISOString().split("T")[0] ?? null;
                  setDateFrom(str);
                  if (str) fetchGSTData(str, dateTo);
                }}
                className="w-40 h-7 text-xs"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2 bg-muted/40 p-1 px-2.5 rounded-xl border border-border/55">
            <CalendarIcon className="w-3.5 h-3.5 text-muted-foreground" />
            <div className="flex flex-col">
              <span className="text-[9px] uppercase font-bold text-muted-foreground">To Date</span>
              <Calendar
                mode="single"
                selected={dateTo ? new Date(dateTo) : undefined}
                onSelect={(value: any) => {
                  const str = value?.toISOString().split("T")[0] ?? null;
                  setDateTo(str);
                  if (str) fetchGSTData(dateFrom, str);
                }}
                className="w-40 h-7 text-xs"
              />
            </div>
          </div>

          <Button onClick={() => fetchGSTData()} className="h-10 text-xs font-bold rounded-xl bg-primary shadow-md shrink-0">
            Refresh
          </Button>

          <ReportExportButtons
            tableId={activeTab === "gstr1" ? "gstr1-export-table" : "gstr3b-export-table"}
            elementId="gst-report-card"
            filename={`gst_return_${activeTab}_${dateFrom}_to_${dateTo}`}
            className="sm:mt-0"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 bg-card/45 dark:bg-card/25 rounded-2xl border border-border/60">
          <span className="w-8 h-8 rounded-full border-4 border-accent/30 border-t-accent animate-spin inline-block"></span>
          <span className="text-xs font-bold text-muted-foreground">Compiling outward invoice lists & ITC ledgers...</span>
        </div>
      ) : !gstData ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground bg-card rounded-2xl border">
          No transactions registered for the selected tax period.
        </div>
      ) : (
        <Card id="gst-report-card" className="w-full border border-border/80 bg-card/65 dark:bg-card/45 backdrop-blur-xl shadow-2xl rounded-2xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-accent/5 via-transparent to-accent/5 border-b border-border/60 p-5 px-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle className="text-base font-extrabold flex items-center gap-1.5 text-primary">
                  <Scale className="w-5 h-5 text-accent" />
                  Statutory GST Return Statement
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground mt-0.5">
                  Period: <span className="font-bold text-foreground">{gstData.period.from}</span> to <span className="font-bold text-foreground">{gstData.period.to}</span>
                </CardDescription>
              </div>

              {/* Tabs Switcher Pill */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-auto select-none">
                <TabsList className="rounded-xl h-9 bg-muted/60 p-1 border border-border/50">
                  <TabsTrigger value="gstr1" className="rounded-lg text-xs px-4 font-bold flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5" /> GSTR-1 (Sales)
                  </TabsTrigger>
                  <TabsTrigger value="gstr3b" className="rounded-lg text-xs px-4 font-bold flex items-center gap-1.5">
                    <FileSpreadsheet className="w-3.5 h-3.5" /> GSTR-3B (ITC Summary)
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>

          <CardContent className="p-6">
            {/* ========================================================================= */}
            {/* GSTR-1 (OUTWARD SUPPLIES / SALES) TAB                                     */}
            {/* ========================================================================= */}
            {activeTab === "gstr1" && (
              <div className="space-y-6">
                
                {/* GSTR-1 Summary KPI Cards */}
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="bg-muted/15 p-4 rounded-xl border border-border/50 flex flex-col justify-between">
                    <span className="text-[10px] font-black uppercase text-muted-foreground tracking-wider">Total Outward Supplies</span>
                    <span className="text-lg font-black text-primary mt-1.5">{formatCurrency(gstData.b2bSales.taxable + gstData.b2cSales.taxable)}</span>
                    <span className="text-[9px] text-muted-foreground font-semibold mt-1">Total taxable turnover</span>
                  </div>

                  <div className="bg-emerald-500/5 p-4 rounded-xl border border-emerald-500/20 flex flex-col justify-between">
                    <span className="text-[10px] font-black uppercase text-emerald-600 tracking-wider">B2B Registered Sales</span>
                    <span className="text-lg font-black text-emerald-600 mt-1.5">{formatCurrency(gstData.b2bSales.taxable)}</span>
                    <span className="text-[9px] text-muted-foreground font-semibold mt-1">
                      {gstData.b2bSales.count} invoices with statutory GSTINs
                    </span>
                  </div>

                  <div className="bg-blue-500/5 p-4 rounded-xl border border-blue-500/20 flex flex-col justify-between">
                    <span className="text-[10px] font-black uppercase text-blue-600 tracking-wider">B2C Unregistered Sales</span>
                    <span className="text-lg font-black text-blue-600 mt-1.5">{formatCurrency(gstData.b2cSales.taxable)}</span>
                    <span className="text-[9px] text-muted-foreground font-semibold mt-1">
                      {gstData.b2cSales.count} retail / local cash invoices
                    </span>
                  </div>
                </div>

                {/* GSTR-1 Outward Supplies Table */}
                <div className="space-y-2">
                  <h3 className="text-xs font-black uppercase tracking-wider text-accent">1. Outward Supplies Section Breakdown</h3>
                  <div className="rounded-xl border border-border/70 overflow-hidden shadow-inner">
                    <Table id="gstr1-export-table">
                      <TableHeader className="bg-muted/40">
                        <TableRow>
                          <TableHead className="w-12 text-center py-2.5">Sec</TableHead>
                          <TableHead className="py-2.5">Outward Supplies Description</TableHead>
                          <TableHead className="text-center w-24">Vouchers</TableHead>
                          <TableHead className="text-right w-40">Taxable Value (₹)</TableHead>
                          <TableHead className="text-right w-40">GST Tax Liability (₹)</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody className="divide-y font-semibold text-xs">
                        <TableRow className="hover:bg-muted/5">
                          <TableCell className="text-center font-bold text-[10px] text-muted-foreground uppercase bg-muted/10">4A</TableCell>
                          <TableCell className="py-3">
                            <span className="block font-bold">B2B Sales (Registered Taxable Supplies)</span>
                            <span className="text-[9px] text-muted-foreground font-normal">Supplies made to buyers with valid GSTINs.</span>
                          </TableCell>
                          <TableCell className="text-center font-mono">{gstData.b2bSales.count}</TableCell>
                          <TableCell className="text-right font-mono">{formatCurrency(gstData.b2bSales.taxable)}</TableCell>
                          <TableCell className="text-right font-mono text-emerald-600">+{formatCurrency(gstData.b2bSales.tax)}</TableCell>
                        </TableRow>

                        <TableRow className="hover:bg-muted/5">
                          <TableCell className="text-center font-bold text-[10px] text-muted-foreground uppercase bg-muted/10">7</TableCell>
                          <TableCell className="py-3">
                            <span className="block font-bold">B2C Sales (Unregistered Taxable Supplies)</span>
                            <span className="text-[9px] text-muted-foreground font-normal">Retail cash counters and consumer sales.</span>
                          </TableCell>
                          <TableCell className="text-center font-mono">{gstData.b2cSales.count}</TableCell>
                          <TableCell className="text-right font-mono">{formatCurrency(gstData.b2cSales.taxable)}</TableCell>
                          <TableCell className="text-right font-mono text-emerald-600">+{formatCurrency(gstData.b2cSales.tax)}</TableCell>
                        </TableRow>

                        <TableRow className="bg-muted/20 hover:bg-muted/20 font-black">
                          <TableCell className="text-center bg-muted/30">—</TableCell>
                          <TableCell className="py-3 text-primary">GSTR-1 Outward Supplies Total</TableCell>
                          <TableCell className="text-center font-mono">{gstData.salesInvoicesCount}</TableCell>
                          <TableCell className="text-right font-mono">{formatCurrency(gstData.b2bSales.taxable + gstData.b2cSales.taxable)}</TableCell>
                          <TableCell className="text-right font-mono text-emerald-600">+{formatCurrency(gstData.outputGST)}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </div>

                {/* HSN Slab-wise Splits Table */}
                <div className="space-y-2">
                  <h3 className="text-xs font-black uppercase tracking-wider text-accent">2. Tax Slab Summary Breakdown</h3>
                  <div className="rounded-xl border border-border/70 overflow-hidden shadow-inner">
                    <Table>
                      <TableHeader className="bg-muted/40">
                        <TableRow>
                          <TableHead className="py-2.5">GST Rate Slab</TableHead>
                          <TableHead className="text-center w-28">Item Matches</TableHead>
                          <TableHead className="text-right w-44">Taxable Value (₹)</TableHead>
                          <TableHead className="text-right w-40">CGST Amount (₹)</TableHead>
                          <TableHead className="text-right w-40">SGST Amount (₹)</TableHead>
                          <TableHead className="text-right w-40">Total Outward Tax (₹)</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody className="divide-y font-semibold text-xs">
                        {Object.entries(gstData.slabs).map(([rateStr, data]: [string, any]) => {
                          const rate = parseFloat(rateStr);
                          if (data.taxable <= 0) return null;
                          return (
                            <TableRow key={rate} className="hover:bg-muted/5">
                              <td className="py-3">
                                <span className="bg-accent/15 text-accent font-bold px-2.5 py-0.5 rounded text-[10px]">{rate}% Slab</span>
                              </td>
                              <td className="text-center font-mono">{data.count}</td>
                              <td className="text-right font-mono">{formatCurrency(data.taxable)}</td>
                              <td className="text-right font-mono text-muted-foreground">{formatCurrency(data.tax / 2)}</td>
                              <td className="text-right font-mono text-muted-foreground">{formatCurrency(data.tax / 2)}</td>
                              <td className="text-right font-mono text-primary font-bold">{formatCurrency(data.tax)}</td>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </div>

              </div>
            )}

            {/* ========================================================================= */}
            {/* GSTR-3B (CONSOLIDATED SUMMARY RETURN & ITC OFFSET) TAB                      */}
            {/* ========================================================================= */}
            {activeTab === "gstr3b" && (
              <div className="space-y-6">
                
                {/* Outward vs Inward ITC Comparison Meter */}
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="bg-rose-500/5 p-4.5 rounded-xl border border-rose-500/20 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-black uppercase text-rose-600 tracking-wider">Output Liability</span>
                      <span className="text-lg font-black text-rose-600 block mt-1">{formatCurrency(gstData.outputGST)}</span>
                    </div>
                    <ArrowDownRight className="w-8 h-8 text-rose-500 bg-rose-500/10 p-1.5 rounded-full" />
                  </div>

                  <div className="bg-emerald-500/5 p-4.5 rounded-xl border border-emerald-500/20 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-black uppercase text-emerald-600 tracking-wider">Eligible ITC Available</span>
                      <span className="text-lg font-black text-emerald-600 block mt-1">{formatCurrency(gstData.inputGST)}</span>
                    </div>
                    <ArrowUpRight className="w-8 h-8 text-emerald-500 bg-emerald-500/10 p-1.5 rounded-full" />
                  </div>

                  <div className={cn(
                    "p-4.5 rounded-xl border flex items-center justify-between select-none shadow-sm",
                    gstData.netGST > 0 
                      ? "bg-amber-500/5 border-amber-500/20" 
                      : "bg-emerald-500/10 border-emerald-500/30"
                  )}>
                    <div>
                      <span className={cn(
                        "text-[10px] font-black uppercase tracking-wider block",
                        gstData.netGST > 0 ? "text-amber-700" : "text-emerald-700"
                      )}>
                        {gstData.netGST > 0 ? "Net Cash GST Payable" : "Carry-forward Excess Credit"}
                      </span>
                      <span className={cn(
                        "text-lg font-black block mt-1",
                        gstData.netGST > 0 ? "text-amber-700 font-extrabold" : "text-emerald-700"
                      )}>
                        {formatCurrency(Math.abs(gstData.netGST))}
                      </span>
                    </div>
                    <Scale className={cn(
                      "w-8 h-8 p-1.5 rounded-full",
                      gstData.netGST > 0 ? "text-amber-500 bg-amber-500/10" : "text-emerald-500 bg-emerald-500/10"
                    )} />
                  </div>
                </div>

                {/* GSTR-3B Detailed Table */}
                <div className="space-y-2">
                  <h3 className="text-xs font-black uppercase tracking-wider text-accent">1. Consolidated GSTR-3B Return Statement</h3>
                  <div className="rounded-xl border border-border/70 overflow-hidden shadow-inner">
                    <Table id="gstr3b-export-table">
                      <TableHeader className="bg-muted/40">
                        <TableRow>
                          <TableHead className="w-12 text-center py-2.5">Sec</TableHead>
                          <TableHead className="py-2.5">GSTR-3B Particulars Description</TableHead>
                          <TableHead className="text-right w-44">Taxable Turnover (₹)</TableHead>
                          <TableHead className="text-right w-40">CGST Credit/Liability</TableHead>
                          <TableHead className="text-right w-40">SGST Credit/Liability</TableHead>
                          <TableHead className="text-right w-40">Integrated IGST Credit</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody className="divide-y font-semibold text-xs">
                        {/* Output Liability */}
                        <TableRow className="hover:bg-muted/5">
                          <TableCell className="text-center font-bold text-[10px] text-muted-foreground uppercase bg-muted/10">3.1</TableCell>
                          <TableCell className="py-3">
                            <span className="block font-bold">Outward Taxable Supplies (Output Tax Liability)</span>
                            <span className="text-[9px] text-muted-foreground font-normal">GST payable from sales invoices recorded during period.</span>
                          </TableCell>
                          <TableCell className="text-right font-mono">{formatCurrency(gstData.b2bSales.taxable + gstData.b2cSales.taxable)}</TableCell>
                          <TableCell className="text-right font-mono text-rose-500">+{formatCurrency(gstData.outputGST / 2)}</TableCell>
                          <TableCell className="text-right font-mono text-rose-500">+{formatCurrency(gstData.outputGST / 2)}</TableCell>
                          <TableCell className="text-right font-mono text-rose-500">—</TableCell>
                        </TableRow>

                        {/* ITC Available */}
                        <TableRow className="hover:bg-muted/5">
                          <TableCell className="text-center font-bold text-[10px] text-muted-foreground uppercase bg-muted/10">4</TableCell>
                          <TableCell className="py-3">
                            <span className="block font-bold">Eligible Input Tax Credit (ITC Available)</span>
                            <span className="text-[9px] text-muted-foreground font-normal">GST paid on registered purchases, claimable to offset liabilities.</span>
                          </TableCell>
                          <TableCell className="text-right font-mono">{formatCurrency(gstData.itc.b2b.taxable + gstData.itc.other.taxable)}</TableCell>
                          <TableCell className="text-right font-mono text-emerald-600">-{formatCurrency(gstData.inputGST / 2)}</TableCell>
                          <TableCell className="text-right font-mono text-emerald-600">-{formatCurrency(gstData.inputGST / 2)}</TableCell>
                          <TableCell className="text-right font-mono text-emerald-600">—</TableCell>
                        </TableRow>

                        {/* Adjustments */}
                        {gstData.journalGST !== 0 && (
                          <TableRow className="hover:bg-muted/5">
                            <TableCell className="text-center font-bold text-[10px] text-muted-foreground uppercase bg-muted/10">JNL</TableCell>
                            <TableCell className="py-3">
                              <span className="block font-bold">GST Adjustments (Journal Postings)</span>
                              <span className="text-[9px] text-muted-foreground font-normal">Statutory adjustments and corrections filed via Journal vouchers.</span>
                            </TableCell>
                            <TableCell className="text-right font-mono">—</TableCell>
                            <TableCell className="text-right font-mono">{formatCurrency(gstData.journalGST / 2)}</TableCell>
                            <TableCell className="text-right font-mono">{formatCurrency(gstData.journalGST / 2)}</TableCell>
                            <TableCell className="text-right font-mono">—</TableCell>
                          </TableRow>
                        )}

                        {/* Net Statutory Payable */}
                        <TableRow className="bg-muted/20 hover:bg-muted/20 font-black text-sm">
                          <TableCell className="text-center bg-muted/30">—</TableCell>
                          <TableCell className="py-3 text-primary uppercase font-black">Net Tax Liability Summary</TableCell>
                          <TableCell className="text-right font-mono">—</TableCell>
                          <TableCell className={cn("text-right font-mono", gstData.netGST > 0 ? "text-amber-600" : "text-emerald-600")}>
                            {gstData.netGST > 0 ? "+" : "-"}{formatCurrency(Math.abs(gstData.netGST / 2))}
                          </TableCell>
                          <TableCell className={cn("text-right font-mono", gstData.netGST > 0 ? "text-amber-600" : "text-emerald-600")}>
                            {gstData.netGST > 0 ? "+" : "-"}{formatCurrency(Math.abs(gstData.netGST / 2))}
                          </TableCell>
                          <TableCell className="text-right font-mono text-primary font-black">—</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </div>

                {/* GST Statutory Offset HUD Diagram */}
                <div className="bg-accent/5 p-5 rounded-2xl border border-accent/20 space-y-3 shadow-inner">
                  <h4 className="text-xs font-black uppercase tracking-wider text-accent flex items-center gap-1.5 select-none">
                    🏛️ Statutory Credit Offset Ledger Desk
                  </h4>
                  <div className="grid gap-4 md:grid-cols-3 font-semibold text-xs leading-normal">
                    <div className="bg-card p-3 rounded-xl border space-y-1">
                      <span className="text-[9px] font-black text-muted-foreground uppercase">1. CGST Offset Desk</span>
                      <div className="flex justify-between items-center text-xs">
                        <span>CGST Liability:</span>
                        <span className="font-mono text-rose-500">₹{(gstData.outputGST / 2).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs border-b pb-1">
                        <span>Less: CGST Credit:</span>
                        <span className="font-mono text-emerald-600">-₹{(gstData.inputGST / 2).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs font-bold pt-1 text-primary">
                        <span>CGST Payable:</span>
                        <span className="font-mono">
                          ₹{Math.max(0, gstData.netGST / 2).toFixed(2)}
                        </span>
                      </div>
                    </div>

                    <div className="bg-card p-3 rounded-xl border space-y-1">
                      <span className="text-[9px] font-black text-muted-foreground uppercase">2. SGST Offset Desk</span>
                      <div className="flex justify-between items-center text-xs">
                        <span>SGST Liability:</span>
                        <span className="font-mono text-rose-500">₹{(gstData.outputGST / 2).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs border-b pb-1">
                        <span>Less: SGST Credit:</span>
                        <span className="font-mono text-emerald-600">-₹{(gstData.inputGST / 2).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs font-bold pt-1 text-primary">
                        <span>SGST Payable:</span>
                        <span className="font-mono">
                          ₹{Math.max(0, gstData.netGST / 2).toFixed(2)}
                        </span>
                      </div>
                    </div>

                    <div className="bg-card p-3 rounded-xl border space-y-1 flex flex-col justify-between">
                      <div>
                        <span className="text-[9px] font-black text-muted-foreground uppercase block mb-1">Offset Reconciliation Notice</span>
                        <p className="text-[10px] text-muted-foreground leading-relaxed font-normal">
                          CGST output liability can only be offset against CGST input credits. Similarly, SGST offsets against SGST input credits. Remaining balances must be cleared in cash.
                        </p>
                      </div>
                      <div className="text-[9px] font-black uppercase text-emerald-600 flex items-center gap-1 mt-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                        Offset Rules Compliant
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Info Warning Bar */}
      <div className="bg-muted/30 border border-border/80 rounded-2xl p-4.5 flex gap-3 text-xs leading-normal select-none shadow-sm">
        <ShieldCheck className="w-5 h-5 text-accent shrink-0 mt-0.5" />
        <div className="space-y-0.5 font-semibold">
          <h4 className="text-primary font-bold leading-none">Statutory Compliance Advisory Notice</h4>
          <p className="text-muted-foreground text-[11px] leading-relaxed">
            This dashboard aggregates active journal lines, sales item blocks, and purchase invoices registered dynamically in the Rokado ERP engine. Always cross-reference GSTR summaries with official government JSON utility schemas before filing on the GSTN portal.
          </p>
        </div>
      </div>

    </div>
  );
}
