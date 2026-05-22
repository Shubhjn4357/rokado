"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";
import {
  Printer,
  Share2,
  Calendar,
  Settings,
  HelpCircle,
  FileSpreadsheet,
  FileText,
  ChevronRight,
  TrendingUp,
  SlidersHorizontal,
  FolderLock
} from "lucide-react";
import Link from "next/link";
import { formatCurrency, formatDate, LEDGER_GROUP_LABELS, type LedgerGroup } from "@/lib/types";
import type { InferSelectModel } from "@/lib/database";
import type { ledgers as ledgersTable } from "@/lib/database";
import { cn } from "@/lib/utils";

type Ledger = InferSelectModel<typeof ledgersTable>;
type EntryRow = {
  entryId: string;
  entryType: string;
  amount: number;
  narration: string | null;
  voucherId: string;
  voucherType: string;
  voucherDate: number;
  voucherNumber: string | null;
  voucherNarration: string | null;
};

interface Props {
  ledger: Ledger;
  entries: EntryRow[];
}

export function LedgerDetailClient({ ledger, entries }: Props) {
  const router = useRouter();
  const [isDetailed, setIsDetailed] = useState(true);
  const [showConfig, setShowConfig] = useState(false);
  
  // Date filtering state
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Sort entries chronologically for accounting running balances
  const sortedEntries = [...entries].sort((a, b) => a.voucherDate - b.voucherDate);

  // Apply optional date filters
  const filteredEntries = sortedEntries.filter((entry) => {
    if (dateFrom && entry.voucherDate < new Date(dateFrom).getTime()) return false;
    if (dateTo && entry.voucherDate > new Date(dateTo).getTime()) return false;
    return true;
  });

  // Calculate opening balance at the start of filtered date range
  // (In Tally, if filtered by date, transactions before dateFrom are summed into opening balance)
  let initialOpeningBalance = ledger.openingBalance;
  let initialOpeningType = ledger.balanceType; // "dr" or "cr"

  if (dateFrom) {
    let netBeforeDebit = initialOpeningType === "dr" ? initialOpeningBalance : -initialOpeningBalance;
    const beforeEntries = sortedEntries.filter(e => e.voucherDate < new Date(dateFrom).getTime());
    beforeEntries.forEach(e => {
      netBeforeDebit += e.entryType === "dr" ? e.amount : -e.amount;
    });
    initialOpeningBalance = Math.abs(netBeforeDebit);
    initialOpeningType = netBeforeDebit >= 0 ? "dr" : "cr";
  }

  // Calculate running balance step-by-step
  let runningBal = initialOpeningBalance;
  let runningType = initialOpeningType;

  const rowsWithBalance = filteredEntries.map((entry) => {
    const startNetDebit = runningType === "dr" ? runningBal : -runningBal;
    const change = entry.entryType === "dr" ? entry.amount : -entry.amount;
    const endNetDebit = startNetDebit + change;

    runningBal = Math.abs(endNetDebit);
    runningType = endNetDebit >= 0 ? "dr" : "cr";

    return {
      ...entry,
      runningBalance: runningBal,
      runningBalanceType: runningType,
    };
  });

  // Compute final aggregates for table footer
  const totalDr = filteredEntries.filter((e) => e.entryType === "dr").reduce((s, e) => s + e.amount, 0);
  const totalCr = filteredEntries.filter((e) => e.entryType === "cr").reduce((s, e) => s + e.amount, 0);
  
  // Calculate Closing Balance
  const netOpeningDebit = initialOpeningType === "dr" ? initialOpeningBalance : -initialOpeningBalance;
  const netClosingDebit = netOpeningDebit + totalDr - totalCr;
  const closingBalance = Math.abs(netClosingDebit);
  const closingType = netClosingDebit >= 0 ? "dr" : "cr";

  return (
    <div className="flex h-[calc(100vh-2rem)] select-none glass-card-premium rounded-[32px] overflow-hidden font-mono text-foreground">
      
      {/* LEFT REPORTING PANEL */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Tally App Style Top Utility bar */}
        <div className="h-10 bg-primary/95 text-primary-foreground/90 flex items-center justify-between px-4 text-xs font-bold border-b border-border">
          <div className="flex items-center gap-4">
            <span className="text-accent-yellow">P: Print</span>
            <span>E: Export</span>
            <span>M: E-Mail</span>
            <span>O: Upload</span>
            <span>G: Language</span>
            <span>K: Keyboard</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-accent-yellow">Shree Saree House</span>
            <span className="text-[10px] bg-accent-indigo text-white px-2 py-0.5 rounded">Tally Prime v4.0</span>
          </div>
        </div>

        {/* Tally Vouchers Light Green Accent Banner */}
        <div className="bg-card/60 backdrop-blur-md border-b border-border/80 px-6 py-3.5 flex items-center justify-between gap-4 shrink-0 text-sm font-bold">
          <div>
            <div className="text-[10px] text-muted-foreground tracking-wider uppercase">Ledger Account Display</div>
            <h1 className="text-lg font-extrabold uppercase mt-0.5 tracking-tight flex items-center gap-2">
              Ledger: <span className="underline decoration-2 underline-offset-4">{ledger.name}</span>
            </h1>
          </div>

          <div className="flex items-center gap-6 text-xs">
            <div className="text-right">
              <span className="text-[9px] text-muted-foreground uppercase block">Ledger Group</span>
              <span>{LEDGER_GROUP_LABELS[ledger.group as LedgerGroup] ?? ledger.group}</span>
            </div>
            {ledger.gstNumber && (
              <div className="text-right border-l pl-6 border-border/60">
                <span className="text-[9px] text-muted-foreground uppercase block">GSTIN</span>
                <span className="font-mono text-[11px]">{ledger.gstNumber}</span>
              </div>
            )}
            <div className="text-right border-l pl-6 border-border/60 font-mono">
              <span className="text-[9px] text-muted-foreground uppercase block">Report Period</span>
              <span className="bg-muted px-2 py-0.5 rounded border border-border text-foreground/80">
                {dateFrom ? formatDate(new Date(dateFrom).getTime()) : "Beginning"} to {dateTo ? formatDate(new Date(dateTo).getTime()) : "Present"}
              </span>
            </div>
          </div>
        </div>

        {/* Dynamic Period Date filter inputs */}
        <div className="bg-background/10 backdrop-blur-md border-b border-border/40 px-6 py-2 flex items-center gap-4 shrink-0 text-xs font-semibold">
          <div className="flex items-center gap-2">
            <span>Period From:</span>
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="h-7 w-32 border-input bg-background/50 text-foreground rounded px-1.5 focus:bg-background text-xs font-mono"
            />
          </div>
          <div className="flex items-center gap-2">
            <span>To:</span>
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="h-7 w-32 border-input bg-background/50 text-foreground rounded px-1.5 focus:bg-background text-xs font-mono"
            />
          </div>
          {(dateFrom || dateTo) && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setDateFrom("");
                setDateTo("");
              }}
              className="h-6 rounded text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2 text-[10px] font-bold"
            >
              Clear Filter
            </Button>
          )}
        </div>

        {/* LEDGER DETAILS CONFIGURATION DRAWER (TALLY YES/NO STYLE) */}
        {showConfig && (
          <div className="bg-card border-b-2 border-border p-6 shrink-0 shadow-inner grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-top duration-300">
            <div>
              <h3 className="text-xs font-bold text-foreground border-b border-border/20 pb-1 mb-3 uppercase tracking-wider">Party Configuration Details</h3>
              <div className="space-y-1.5 text-xs font-mono">
                <div className="flex justify-between border-b border-border/10 py-0.5">
                  <span className="text-muted-foreground">Provide aliases for Name:</span>
                  <span className="font-bold">No</span>
                </div>
                <div className="flex justify-between border-b border-border/10 py-0.5">
                  <span className="text-muted-foreground">GST Registration Type:</span>
                  <span className="font-bold uppercase">{ledger.gstNumber ? "Regular" : "Unregistered"}</span>
                </div>
                <div className="flex justify-between border-b border-border/10 py-0.5">
                  <span className="text-muted-foreground">Permanent Account Number (PAN):</span>
                  <span className="font-bold">{ledger.pan ?? "—"}</span>
                </div>
                <div className="flex justify-between border-b border-border/10 py-0.5">
                  <span className="text-muted-foreground">Registered Office Address:</span>
                  <span className="font-bold max-w-[200px] truncate">{ledger.address ?? "—"}</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xs font-bold text-foreground border-b border-border/20 pb-1 mb-3 uppercase tracking-wider">Mailing & Credit Limits</h3>
              <div className="space-y-1.5 text-xs font-mono">
                <div className="flex justify-between border-b border-border/10 py-0.5">
                  <span className="text-muted-foreground">Contact Phone / Mobile:</span>
                  <span className="font-bold">{ledger.phone ?? "—"}</span>
                </div>
                <div className="flex justify-between border-b border-border/10 py-0.5">
                  <span className="text-muted-foreground">Credit Limit Enforcement:</span>
                  <span className="font-bold text-accent-orange">{ledger.creditLimit ? `Enforced (₹${ledger.creditLimit})` : "Not Applicable"}</span>
                </div>
                <div className="flex justify-between border-b border-border/10 py-0.5">
                  <span className="text-muted-foreground">Account Status:</span>
                  <span className={cn("font-bold px-1.5 py-0.5 rounded text-[10px] uppercase", ledger.isActive ? "bg-emerald-50 text-emerald-700 border border-emerald-300 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800" : "bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400")}>
                    {ledger.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* LEDGER VOUCHERS HIGH DENSITY SHEET */}
        <div className="flex-1 overflow-auto bg-transparent">
          <Table className="w-full border-collapse font-mono text-foreground text-xs">
            <TableHeader className="sticky top-0 bg-secondary/80 backdrop-blur-md border-b border-border shadow-sm select-none z-10">
              <TableRow className="hover:bg-transparent border-b border-border/40">
                <TableHead className="text-foreground font-bold py-2.5 w-[110px]">Date</TableHead>
                <TableHead className="text-foreground font-bold py-2.5">Particulars</TableHead>
                <TableHead className="text-foreground font-bold py-2.5 w-[120px]">Vch Type</TableHead>
                <TableHead className="text-foreground font-bold py-2.5 w-[100px] text-center">Vch No.</TableHead>
                <TableHead className="text-foreground font-bold py-2.5 w-[130px] text-right">Debit (Dr) (₹)</TableHead>
                <TableHead className="text-foreground font-bold py-2.5 w-[130px] text-right">Credit (Cr) (₹)</TableHead>
                <TableHead className="text-foreground font-bold py-2.5 w-[150px] text-right">Balance (₹)</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody className="divide-y divide-border/20">
              
              {/* OPENING BALANCE ROW */}
              <TableRow className="bg-card/25 hover:bg-card/45 font-bold border-b border-border/20 select-none">
                <TableCell className="py-2.5 text-muted-foreground/80">
                  {dateFrom ? formatDate(new Date(dateFrom).getTime()) : "01-Apr-2026"}
                </TableCell>
                <TableCell className="py-2.5 uppercase tracking-wide">
                  Opening Balance
                </TableCell>
                <TableCell className="py-2.5 text-muted-foreground/60">—</TableCell>
                <TableCell className="py-2.5 text-center text-muted-foreground/60">—</TableCell>
                <TableCell className="py-2.5 text-right font-semibold text-emerald-600 dark:text-emerald-400">
                  {initialOpeningType === "dr" ? formatCurrency(initialOpeningBalance) : ""}
                </TableCell>
                <TableCell className="py-2.5 text-right font-semibold text-rose-600 dark:text-rose-400">
                  {initialOpeningType === "cr" ? formatCurrency(initialOpeningBalance) : ""}
                </TableCell>
                <TableCell className="py-2.5 text-right font-extrabold uppercase text-foreground">
                  {formatCurrency(initialOpeningBalance)} {initialOpeningType.toUpperCase()}
                </TableCell>
              </TableRow>

              {/* TRANSACTIONS ROWS */}
              {rowsWithBalance.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-16 font-medium italic select-none">
                    No transactions registered in this ledger period.
                  </TableCell>
                </TableRow>
              ) : (
                rowsWithBalance.map((entry) => (
                  <tr key={entry.entryId} className="glass-table-row transition-colors group">
                    <TableCell className="py-2 text-muted-foreground font-mono">
                      {formatDate(entry.voucherDate)}
                    </TableCell>
                    
                    <TableCell className="py-2 pr-6">
                      <div className="font-semibold capitalize text-foreground/90">
                        {entry.voucherType === "sales" ? "Sales Account" : entry.voucherType === "purchase" ? "Purchase Account" : "Sundry Ledger"}
                      </div>
                      
                      {/* Detailed Mode shows voucher specific narration */}
                      {isDetailed && (entry.narration || entry.voucherNarration) && (
                        <div className="text-[10px] text-muted-foreground italic mt-0.5 font-sans break-words max-w-[400px]">
                          Narration: {entry.narration ?? entry.voucherNarration}
                        </div>
                      )}
                    </TableCell>

                    <TableCell className="py-2">
                      <Badge variant="outline" className="text-[10px] font-bold px-2 py-0 border-border/40 bg-muted/40 uppercase tracking-wide rounded-md text-foreground">
                        {entry.voucherType}
                      </Badge>
                    </TableCell>

                    <TableCell className="py-2 text-center font-mono font-bold text-foreground/75">
                      {entry.voucherNumber ?? "—"}
                    </TableCell>

                    {/* DEBIT AMOUNT */}
                    <TableCell className="py-2 text-right font-mono text-emerald-600 dark:text-emerald-400 font-semibold text-sm">
                      {entry.entryType === "dr" ? (
                        <span>{formatCurrency(entry.amount)}</span>
                      ) : (
                        <span className="opacity-15 font-light">—</span>
                      )}
                    </TableCell>

                    {/* CREDIT AMOUNT */}
                    <TableCell className="py-2 text-right font-mono text-rose-600 dark:text-rose-400 font-semibold text-sm">
                      {entry.entryType === "cr" ? (
                        <span>{formatCurrency(entry.amount)}</span>
                      ) : (
                        <span className="opacity-15 font-light">—</span>
                      )}
                    </TableCell>

                    {/* RUNNING BALANCE COLUMN (CRITICAL TALLY CORE REQUIREMENT) */}
                    <TableCell className="py-2 text-right font-extrabold uppercase font-mono text-sm">
                      <span>{formatCurrency(entry.runningBalance)} {entry.runningBalanceType.toUpperCase()}</span>
                    </TableCell>
                  </tr>
                ))
              )}

              {/* DUAL TOTAL RUNNING CHECKS */}
              <TableRow className="bg-card/35 hover:bg-card/55 font-bold border-t-2 border-border select-none">
                <TableCell className="py-2.5 text-muted-foreground/80">Total</TableCell>
                <TableCell className="py-2.5 uppercase tracking-wide">Current Total</TableCell>
                <TableCell className="py-2.5 text-muted-foreground/60">—</TableCell>
                <TableCell className="py-2.5 text-center text-muted-foreground/60">—</TableCell>
                <TableCell className="py-2.5 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(totalDr)}
                </TableCell>
                <TableCell className="py-2.5 text-right font-mono font-bold text-rose-600 dark:text-rose-400">
                  {formatCurrency(totalCr)}
                </TableCell>
                <TableCell className="py-2.5 text-right font-mono text-muted-foreground/60">—</TableCell>
              </TableRow>

              {/* CLOSING BALANCE REPORT */}
              <TableRow className="bg-secondary/40 hover:bg-secondary/60 font-black border-t border-b-2 border-border select-none">
                <TableCell className="py-2.5 text-muted-foreground/80">Closing</TableCell>
                <TableCell className="py-2.5 uppercase tracking-wider text-foreground font-extrabold">
                  Closing Balance
                </TableCell>
                <TableCell className="py-2.5 text-muted-foreground/60">—</TableCell>
                <TableCell className="py-2.5 text-center text-muted-foreground/60">—</TableCell>
                <TableCell className="py-2.5 text-right font-mono text-emerald-600 dark:text-emerald-400">
                  {closingType === "cr" ? formatCurrency(closingBalance) : ""}
                </TableCell>
                <TableCell className="py-2.5 text-right font-mono text-rose-600 dark:text-rose-400">
                  {closingType === "dr" ? formatCurrency(closingBalance) : ""}
                </TableCell>
                <TableCell className="py-2.5 text-right uppercase text-foreground font-black text-sm">
                  {formatCurrency(closingBalance)} {closingType.toUpperCase()}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>

      {/* RIGHT MENU BAR (TALLY ERP SIDEBAR ACTION MENU) */}
      <div className="w-[180px] bg-primary/95 text-primary-foreground flex flex-col border-l border-border shrink-0 font-sans p-1.5 select-none space-y-1">
        <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-black text-center py-2 border-b border-border/40 select-none">
          Tally Side Bar
        </div>

        <button
          onClick={() => setIsDetailed(prev => !prev)}
          className="w-full text-left bg-secondary/50 hover:bg-secondary/70 border border-border/40 rounded-lg px-2.5 py-2.5 transition-all text-xs font-bold shadow-sm text-foreground cursor-pointer"
        >
          <span className="text-accent-yellow block font-mono text-[9px] uppercase tracking-wider mb-0.5">F1: Format</span>
          <span>{isDetailed ? "Condensed" : "Detailed Mode"}</span>
        </button>

        <button
          onClick={() => {
            const today = new Date().toISOString().split("T")[0];
            setDateFrom("2026-04-01");
            setDateTo(today);
          }}
          className="w-full text-left bg-secondary/50 hover:bg-secondary/70 border border-border/40 rounded-lg px-2.5 py-2.5 transition-all text-xs font-bold shadow-sm text-foreground cursor-pointer"
        >
          <span className="text-accent-yellow block font-mono text-[9px] uppercase tracking-wider mb-0.5">F2: Period</span>
          <span>Financial Year</span>
        </button>

        <button
          onClick={() => setShowConfig(prev => !prev)}
          className="w-full text-left bg-secondary/50 hover:bg-secondary/70 border border-border/40 rounded-lg px-2.5 py-2.5 transition-all text-xs font-bold shadow-sm text-foreground cursor-pointer"
        >
          <span className="text-accent-yellow block font-mono text-[9px] uppercase tracking-wider mb-0.5">F12: Configure</span>
          <span>{showConfig ? "Hide Config" : "Show Config"}</span>
        </button>

        <button
          onClick={() => {
            toast({
              title: "Export Completed",
              description: "Ledger Vouchers printed to Excel sheet.",
            });
          }}
          className="w-full text-left bg-secondary/50 hover:bg-secondary/70 border border-border/40 rounded-lg px-2.5 py-2.5 transition-all text-xs font-bold shadow-sm text-foreground cursor-pointer"
        >
          <span className="text-accent-yellow block font-mono text-[9px] uppercase tracking-wider mb-0.5">Alt+E: Excel</span>
          <span>Export Ledger</span>
        </button>

        <div className="flex-1"></div>

        <button
          onClick={() => router.push("/ledgers")}
          className="w-full text-left bg-destructive hover:bg-destructive/80 border border-destructive/20 rounded-lg px-2.5 py-2.5 transition-all text-xs font-bold shadow-sm mt-auto text-destructive-foreground cursor-pointer"
        >
          <span className="text-accent-yellow block font-mono text-[9px] uppercase tracking-wider mb-0.5">Q: Quit</span>
          <span>Gateway exit</span>
        </button>
      </div>
    </div>
  );
}
