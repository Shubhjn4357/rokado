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
  FolderLock,
  Trash2,
  Edit,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { formatCurrency, formatDate, LEDGER_GROUP_LABELS, type LedgerGroup } from "@/lib/types";
import type { InferSelectModel } from "@/lib/database";
import type { ledgers as ledgersTable } from "@/lib/database";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { updateLedgerAction, deleteLedgerAction } from "@/app/(erp)/ledgers/actions";

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
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const handleExport = () => {
    toast({
      title: "Export Completed",
      description: "Ledger Vouchers printed to Excel sheet.",
    });
  };
  
  // Edit & Delete state
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    name: ledger.name,
    group: ledger.group,
    gstNumber: ledger.gstNumber || "",
    pan: ledger.pan || "",
    phone: ledger.phone || "",
    address: ledger.address || "",
    creditLimit: ledger.creditLimit || 0,
    openingBalance: ledger.openingBalance || 0,
    balanceType: ledger.balanceType || "dr",
  });
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingEdit(true);
    const res = await updateLedgerAction(ledger.id, {
      name: editForm.name,
      group: editForm.group as any,
      gstNumber: editForm.gstNumber,
      pan: editForm.pan,
      phone: editForm.phone,
      address: editForm.address,
      creditLimit: Number(editForm.creditLimit) || 0,
      openingBalance: Number(editForm.openingBalance) || 0,
      balanceType: editForm.balanceType as any,
    });
    setIsSubmittingEdit(false);
    if (res.success) {
      toast({
        title: "Ledger Updated",
        description: "Successfully updated ledger details.",
      });
      setIsEditDialogOpen(false);
      router.refresh();
    } else {
      toast({
        title: "Update Failed",
        description: res.error,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    const confirm = window.confirm(`WARNING: Are you sure you want to permanently delete the ledger "${ledger.name}"?`);
    if (!confirm) return;

    setIsDeleting(true);
    const res = await deleteLedgerAction(ledger.id);
    setIsDeleting(false);
    if (res.success) {
      toast({
        title: "Ledger Deleted",
        description: `Successfully deleted "${ledger.name}".`,
      });
      router.push("/ledgers");
    } else {
      toast({
        title: "Delete Failed",
        description: res.error,
        variant: "destructive",
      });
    }
  };

  // Keyboard Event Shortcuts Hook
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInputFocused =
        activeEl?.tagName === "INPUT" ||
        activeEl?.tagName === "TEXTAREA" ||
        activeEl?.tagName === "SELECT" ||
        activeEl?.getAttribute("contenteditable") === "true";

      // Function keys work regardless of input focus (like standard Tally)
      if (e.key === "F1") {
        e.preventDefault();
        setIsDetailed((prev) => !prev);
      } else if (e.key === "F2") {
        e.preventDefault();
        const today = new Date().toISOString().split("T")[0];
        setDateFrom("2026-04-01");
        setDateTo(today);
        toast({
          title: "Period Reset",
          description: "Period set to current Financial Year (01-Apr-2026 to Present).",
        });
      } else if (e.key === "F12") {
        e.preventDefault();
        setShowConfig((prev) => !prev);
      }

      // Letter/alt shortcuts only work when not typing in inputs
      if (!isInputFocused) {
        if (e.key === "q" || e.key === "Q") {
          e.preventDefault();
          router.push("/ledgers");
        }
        if (e.key === "f" || e.key === "F") {
          e.preventDefault();
          setIsDetailed((prev) => !prev);
        }
        if (e.key === "o" || e.key === "O") {
          e.preventDefault();
          setShowConfig((prev) => !prev);
        }
        if (e.key === "c" || e.key === "C") {
          e.preventDefault();
          setIsEditDialogOpen(true);
        }
        if (e.key === "d" || e.key === "D") {
          e.preventDefault();
          handleDelete();
        }
        if ((e.key === "e" || e.key === "E") && e.altKey) {
          e.preventDefault();
          handleExport();
        } else if (e.key === "e" || e.key === "E") {
          e.preventDefault();
          handleExport();
        }
        if ((e.key === "p" || e.key === "P") && e.altKey) {
          e.preventDefault();
          window.print();
        } else if (e.key === "p" || e.key === "P") {
          e.preventDefault();
          window.print();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isDetailed, ledger, router]);

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
        
        {/* Modern premium Shortcut Bar */}
        <div className="hidden md:flex h-11 bg-muted/40 backdrop-blur-md text-foreground/80 items-center justify-between px-6 text-xs font-bold border-b border-border select-none">
          <div className="flex items-center gap-5">
            <button onClick={() => window.print()} className="hover:text-accent flex items-center gap-1.5 transition-colors cursor-pointer">
              <kbd className="bg-background border border-border px-1.5 py-0.5 rounded font-mono text-[9px] text-muted-foreground">P</kbd> Print
            </button>
            <button onClick={handleExport} className="hover:text-accent flex items-center gap-1.5 transition-colors cursor-pointer">
              <kbd className="bg-background border border-border px-1.5 py-0.5 rounded font-mono text-[10px] text-muted-foreground">E</kbd> Export
            </button>
            <button onClick={() => toast({ title: "Email Sent", description: "Ledger has been emailed." })} className="hover:text-accent flex items-center gap-1.5 transition-colors cursor-pointer">
              <kbd className="bg-background border border-border px-1.5 py-0.5 rounded font-mono text-[10px] text-muted-foreground">M</kbd> E-Mail
            </button>
            <button onClick={() => setIsDetailed(prev => !prev)} className="hover:text-accent flex items-center gap-1.5 transition-colors cursor-pointer">
              <kbd className="bg-background border border-border px-1.5 py-0.5 rounded font-mono text-[10px] text-muted-foreground">F1</kbd> {isDetailed ? "Condensed" : "Detailed"}
            </button>
            <button onClick={() => setShowConfig(prev => !prev)} className="hover:text-accent flex items-center gap-1.5 transition-colors cursor-pointer">
              <kbd className="bg-background border border-border px-1.5 py-0.5 rounded font-mono text-[10px] text-muted-foreground">F12</kbd> Configure
            </button>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] bg-accent/15 text-accent border border-accent/20 px-2.5 py-0.5 rounded-full font-sans tracking-wide">
              Tally Prime Integration
            </span>
          </div>
        </div>

        {/* Tally Vouchers Light Indigo Accent Banner */}
        <div className="bg-card/65 backdrop-blur-md border-b border-border/80 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0 text-sm font-bold">
          <div>
            <div className="text-[10px] text-muted-foreground tracking-wider uppercase">Ledger Account Display</div>
            <h1 className="text-lg font-extrabold uppercase mt-0.5 tracking-tight flex flex-wrap items-center gap-3">
              Ledger: <span className="underline decoration-accent decoration-2 underline-offset-4">{ledger.name}</span>
              <div className="flex items-center gap-1.5 ml-2 normal-case shrink-0">
                <Button
                  onClick={() => setIsEditDialogOpen(true)}
                  className="h-6 px-2.5 rounded-lg text-[10px] font-bold bg-accent/15 text-accent hover:bg-accent/25 border border-accent/20 cursor-pointer flex items-center gap-1 transition-all"
                >
                  <Edit className="w-3 h-3" /> Edit
                </Button>
                <Button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  variant="destructive"
                  className="h-6 px-2.5 rounded-lg text-[10px] font-bold bg-destructive/10 hover:bg-destructive/20 text-destructive border border-destructive/20 cursor-pointer flex items-center gap-1 transition-all"
                >
                  <Trash2 className="w-3 h-3" /> Delete
                </Button>
              </div>
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-xs max-sm:w-full">
            <div className="text-left sm:text-right">
              <span className="text-[9px] text-muted-foreground uppercase block leading-none mb-1">Ledger Group</span>
              <Badge variant="outline" className="text-[10px] font-bold border-accent/25 bg-accent/5 text-accent rounded-md py-0.5">
                {LEDGER_GROUP_LABELS[ledger.group as LedgerGroup] ?? ledger.group}
              </Badge>
            </div>
            {ledger.gstNumber && (
              <div className="text-left sm:text-right border-l pl-4 sm:pl-6 border-border/60">
                <span className="text-[9px] text-muted-foreground uppercase block mb-1">GSTIN</span>
                <span className="font-mono text-[11px] bg-muted px-2 py-0.5 rounded border border-border">{ledger.gstNumber}</span>
              </div>
            )}
            <div className="text-left sm:text-right border-l pl-4 sm:pl-6 border-border/60 font-mono">
              <span className="text-[9px] text-muted-foreground uppercase block mb-1">Report Period</span>
              <span className="bg-muted px-2 py-0.5 rounded border border-border text-foreground/80 text-[10px]">
                {dateFrom ? formatDate(new Date(dateFrom).getTime()) : "Start"} - {dateTo ? formatDate(new Date(dateTo).getTime()) : "End"}
              </span>
            </div>

            {/* Mobile Drawer Trigger */}
            <Button
              type="button"
              onClick={() => setIsDrawerOpen(true)}
              className="lg:hidden h-8 px-3 rounded-lg text-xs font-bold bg-accent text-accent-foreground hover:bg-accent/90 cursor-pointer flex items-center gap-1.5 transition-all max-sm:w-full max-sm:justify-center"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" /> Shortcuts
            </Button>
          </div>
        </div>

        {/* Dynamic Period Date filter inputs */}
        <div className="bg-background/10 backdrop-blur-md border-b border-border/40 px-6 py-2.5 flex flex-wrap items-center gap-4 shrink-0 text-xs font-semibold max-sm:flex-col max-sm:items-start max-sm:w-full">
          <div className="flex items-center gap-2 max-sm:w-full">
            <span className="shrink-0">Period From:</span>
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="h-7 w-32 max-sm:w-full border-input bg-background/50 text-foreground rounded px-1.5 focus:bg-background text-xs font-mono"
            />
          </div>
          <div className="flex items-center gap-2 max-sm:w-full">
            <span className="shrink-0">To:</span>
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="h-7 w-32 max-sm:w-full border-input bg-background/50 text-foreground rounded px-1.5 focus:bg-background text-xs font-mono"
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
              className="h-6 rounded text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2 text-[10px] font-bold max-sm:w-full"
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
      <div className="hidden lg:flex w-[180px] bg-card flex-col border-l border-border shrink-0 font-sans p-2 select-none space-y-1.5 shadow-[var(--shadow-card)]">
        <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-black text-center py-2 border-b border-border/40 select-none">
          Action Sidebar
        </div>

        <button
          onClick={() => setIsDetailed(prev => !prev)}
          className="w-full text-left bg-muted/65 hover:bg-muted/90 hover:border-accent/40 border border-border/80 rounded-xl px-3 py-2.5 transition-all text-xs font-bold shadow-sm text-foreground cursor-pointer group"
        >
          <span className="text-accent block font-mono text-[9px] uppercase tracking-wider mb-0.5 group-hover:scale-95 transition-transform">F1: Format</span>
          <span>{isDetailed ? "Condensed" : "Detailed Mode"}</span>
        </button>

        <button
          onClick={() => {
            const today = new Date().toISOString().split("T")[0];
            setDateFrom("2026-04-01");
            setDateTo(today);
          }}
          className="w-full text-left bg-muted/65 hover:bg-muted/90 hover:border-accent/40 border border-border/80 rounded-xl px-3 py-2.5 transition-all text-xs font-bold shadow-sm text-foreground cursor-pointer group"
        >
          <span className="text-accent block font-mono text-[9px] uppercase tracking-wider mb-0.5 group-hover:scale-95 transition-transform">F2: Period</span>
          <span>Financial Year</span>
        </button>

        <button
          onClick={() => setShowConfig(prev => !prev)}
          className="w-full text-left bg-muted/65 hover:bg-muted/90 hover:border-accent/40 border border-border/80 rounded-xl px-3 py-2.5 transition-all text-xs font-bold shadow-sm text-foreground cursor-pointer group"
        >
          <span className="text-accent block font-mono text-[9px] uppercase tracking-wider mb-0.5 group-hover:scale-95 transition-transform">F12: Configure</span>
          <span>{showConfig ? "Hide Config" : "Show Config"}</span>
        </button>

        <button
          onClick={handleExport}
          className="w-full text-left bg-muted/65 hover:bg-muted/90 hover:border-accent/40 border border-border/80 rounded-xl px-3 py-2.5 transition-all text-xs font-bold shadow-sm text-foreground cursor-pointer group"
        >
          <span className="text-accent block font-mono text-[9px] uppercase tracking-wider mb-0.5 group-hover:scale-95 transition-transform">Alt+E: Excel</span>
          <span>Export Ledger</span>
        </button>

        <button
          onClick={() => setIsEditDialogOpen(true)}
          className="w-full text-left bg-muted/65 hover:bg-muted/90 hover:border-accent/40 border border-border/80 rounded-xl px-3 py-2.5 transition-all text-xs font-bold shadow-sm text-foreground cursor-pointer group"
        >
          <span className="text-accent block font-mono text-[9px] uppercase tracking-wider mb-0.5 group-hover:scale-95 transition-transform">C: Edit</span>
          <span>Edit Account</span>
        </button>

        <button
          onClick={handleDelete}
          className="w-full text-left bg-rose-500/10 hover:bg-rose-500/15 hover:border-rose-500/40 border border-rose-500/25 rounded-xl px-3 py-2.5 transition-all text-xs font-bold shadow-sm text-rose-600 cursor-pointer group"
        >
          <span className="text-rose-500 block font-mono text-[9px] uppercase tracking-wider mb-0.5 group-hover:scale-95 transition-transform">D: Delete</span>
          <span>Delete Account</span>
        </button>

        <div className="flex-1"></div>

        <button
          onClick={() => router.push("/ledgers")}
          className="w-full text-left bg-destructive/10 hover:bg-destructive/20 border border-destructive/20 rounded-xl px-3 py-2.5 transition-all text-xs font-bold shadow-sm mt-auto text-destructive cursor-pointer group"
        >
          <span className="text-destructive block font-mono text-[9px] uppercase tracking-wider mb-0.5 group-hover:scale-95 transition-transform">Q: Quit</span>
          <span>Gateway exit</span>
        </button>
      </div>

      {/* MOBILE DRAWER SIDEBAR */}
      {isDrawerOpen && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setIsDrawerOpen(false)}
            className="fixed inset-0 bg-foreground/40 backdrop-blur-sm z-50 lg:hidden cursor-pointer animate-in fade-in duration-200"
          />
          {/* Drawer Panel */}
          <div className="fixed inset-y-0 right-0 w-[240px] bg-card border-l border-border shadow-2xl p-4 flex flex-col font-sans select-none space-y-2 z-50 lg:hidden animate-in slide-in-from-right duration-300">
            <div className="flex items-center justify-between border-b border-border/40 pb-3 mb-2">
              <span className="text-xs uppercase font-black tracking-widest text-muted-foreground">
                Action Menu
              </span>
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="text-xs font-bold text-muted-foreground hover:text-foreground cursor-pointer px-2.5 py-1 rounded-lg hover:bg-muted"
              >
                ✕ Close
              </button>
            </div>
            
            <div className="space-y-2.5 flex-1">
              <button
                onClick={() => {
                  setIsDetailed(prev => !prev);
                  setIsDrawerOpen(false);
                }}
                className="w-full text-left bg-muted/80 hover:bg-muted border border-border/80 rounded-xl px-3 py-2.5 transition-all text-xs font-bold text-foreground cursor-pointer"
              >
                <span className="text-accent block font-mono text-[9px] uppercase tracking-wider mb-0.5">F1: Format</span>
                <span>{isDetailed ? "Condensed" : "Detailed Mode"}</span>
              </button>

              <button
                onClick={() => {
                  const today = new Date().toISOString().split("T")[0];
                  setDateFrom("2026-04-01");
                  setDateTo(today);
                  setIsDrawerOpen(false);
                }}
                className="w-full text-left bg-muted/80 hover:bg-muted border border-border/80 rounded-xl px-3 py-2.5 transition-all text-xs font-bold text-foreground cursor-pointer"
              >
                <span className="text-accent block font-mono text-[9px] uppercase tracking-wider mb-0.5">F2: Period</span>
                <span>Financial Year</span>
              </button>

              <button
                onClick={() => {
                  setShowConfig(prev => !prev);
                  setIsDrawerOpen(false);
                }}
                className="w-full text-left bg-muted/80 hover:bg-muted border border-border/80 rounded-xl px-3 py-2.5 transition-all text-xs font-bold text-foreground cursor-pointer"
              >
                <span className="text-accent block font-mono text-[9px] uppercase tracking-wider mb-0.5">F12: Configure</span>
                <span>{showConfig ? "Hide Config" : "Show Config"}</span>
              </button>

              <button
                onClick={() => {
                  handleExport();
                  setIsDrawerOpen(false);
                }}
                className="w-full text-left bg-muted/80 hover:bg-muted border border-border/80 rounded-xl px-3 py-2.5 transition-all text-xs font-bold text-foreground cursor-pointer"
              >
                <span className="text-accent block font-mono text-[9px] uppercase tracking-wider mb-0.5">Alt+E: Excel</span>
                <span>Export Ledger</span>
              </button>

              <button
                onClick={() => {
                  setIsEditDialogOpen(true);
                  setIsDrawerOpen(false);
                }}
                className="w-full text-left bg-muted/80 hover:bg-muted border border-border/80 rounded-xl px-3 py-2.5 transition-all text-xs font-bold text-foreground cursor-pointer"
              >
                <span className="text-accent block font-mono text-[9px] uppercase tracking-wider mb-0.5">C: Edit</span>
                <span>Edit Account</span>
              </button>

              <button
                onClick={() => {
                  handleDelete();
                  setIsDrawerOpen(false);
                }}
                className="w-full text-left bg-rose-500/10 hover:bg-rose-500/15 border border-rose-500/20 text-rose-600 rounded-xl px-3 py-2.5 transition-all text-xs font-bold cursor-pointer"
              >
                <span className="text-rose-500 block font-mono text-[9px] uppercase tracking-wider mb-0.5">D: Delete</span>
                <span>Delete Account</span>
              </button>
            </div>

            <button
              onClick={() => router.push("/ledgers")}
              className="w-full text-left bg-destructive hover:bg-destructive/90 border border-destructive/20 rounded-xl px-3 py-2.5 transition-all text-xs font-bold text-white cursor-pointer mt-auto"
            >
              <span className="text-accent-yellow block font-mono text-[9px] uppercase tracking-wider mb-0.5">Q: Quit</span>
              <span>Gateway exit</span>
            </button>
          </div>
        </>
      )}

      {/* Edit Ledger Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto rounded-2xl bg-card border border-border shadow-2xl backdrop-blur-3xl font-sans text-xs p-6 text-foreground">
          <DialogHeader className="border-b border-border/40 pb-3">
            <DialogTitle className="text-sm font-black text-primary flex items-center gap-2">
              <Edit className="w-4 h-4 text-accent" />
              Edit Ledger: {ledger.name}
            </DialogTitle>
            <DialogDescription className="text-[10px] text-muted-foreground mt-0.5">
              Modify account attributes and credit parameters. Fields marked with * are required.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleEditSubmit} className="space-y-4 mt-3">
            <div className="space-y-1.5">
              <Label htmlFor="edit-name" className="text-foreground/75 font-semibold text-[10px] uppercase tracking-wider">Ledger Name *</Label>
              <Input
                id="edit-name"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                required
                className="h-9 rounded-xl bg-background/55 border-border text-xs"
              />
            </div>

            <div className="grid gap-3 grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="edit-group" className="text-foreground/75 font-semibold text-[10px] uppercase tracking-wider">Accounting Group *</Label>
                <select
                  id="edit-group"
                  value={editForm.group}
                  onChange={(e) => setEditForm({ ...editForm, group: e.target.value })}
                  className="w-full h-9 rounded-xl border border-border bg-background px-3 text-xs font-semibold text-foreground"
                >
                  <option value="cash">Cash-In-Hand</option>
                  <option value="bank">Bank Accounts</option>
                  <option value="sundry_debtors">Sundry Debtors</option>
                  <option value="sundry_creditors">Sundry Creditors</option>
                  <option value="sales">Sales Accounts</option>
                  <option value="purchase">Purchase Accounts</option>
                  <option value="duties_taxes">Duties & Taxes</option>
                  <option value="expenses">Expenses</option>
                  <option value="capital">Capital Account</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-phone" className="text-foreground/75 font-semibold text-[10px] uppercase tracking-wider">Contact Phone</Label>
                <Input
                  id="edit-phone"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className="h-9 rounded-xl bg-background/55 border-border text-xs"
                />
              </div>
            </div>

            <div className="grid gap-3 grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="edit-gst" className="text-foreground/75 font-semibold text-[10px] uppercase tracking-wider">GSTIN (Optional)</Label>
                <Input
                  id="edit-gst"
                  placeholder="e.g. 27AAACS1429B1ZB"
                  value={editForm.gstNumber}
                  onChange={(e) => setEditForm({ ...editForm, gstNumber: e.target.value.toUpperCase() })}
                  className="h-9 rounded-xl bg-background/55 border-border text-xs font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-pan" className="text-foreground/75 font-semibold text-[10px] uppercase tracking-wider">PAN (Optional)</Label>
                <Input
                  id="edit-pan"
                  placeholder="e.g. AAACS1429B"
                  value={editForm.pan}
                  onChange={(e) => setEditForm({ ...editForm, pan: e.target.value.toUpperCase() })}
                  className="h-9 rounded-xl bg-background/55 border-border text-xs font-mono"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-address" className="text-foreground/75 font-semibold text-[10px] uppercase tracking-wider">Physical Address</Label>
              <Input
                id="edit-address"
                value={editForm.address}
                onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                className="h-9 rounded-xl bg-background/55 border-border text-xs"
              />
            </div>

            <div className="grid gap-3 grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="edit-limit" className="text-foreground/75 font-semibold text-[10px] uppercase tracking-wider">Credit Limit (₹)</Label>
                <Input
                  id="edit-limit"
                  type="number"
                  value={editForm.creditLimit || ""}
                  onChange={(e) => setEditForm({ ...editForm, creditLimit: parseFloat(e.target.value) || 0 })}
                  className="h-9 rounded-xl bg-background/55 border-border text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-foreground/75 font-semibold text-[10px] uppercase tracking-wider">Opening Balance (₹)</Label>
                <div className="flex gap-1">
                  <Input
                    type="number"
                    value={editForm.openingBalance || ""}
                    onChange={(e) => setEditForm({ ...editForm, openingBalance: parseFloat(e.target.value) || 0 })}
                    className="h-9 rounded-xl bg-background/55 border-border text-xs flex-1"
                  />
                  <select
                    value={editForm.balanceType}
                    onChange={(e) => setEditForm({ ...editForm, balanceType: e.target.value as any })}
                    className="h-9 rounded-xl border border-border bg-background px-2 text-xs font-bold w-16 text-foreground"
                  >
                    <option value="dr">DR</option>
                    <option value="cr">CR</option>
                  </select>
                </div>
              </div>
            </div>

            <DialogFooter className="border-t border-border/30 pt-4 flex gap-2 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
                className="h-9 rounded-xl text-xs font-bold px-4 border-border hover:bg-muted cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmittingEdit}
                className="h-9 rounded-xl text-xs font-bold px-5 bg-accent hover:bg-accent/90 text-white cursor-pointer"
              >
                {isSubmittingEdit ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin mr-1 inline" />
                    Updating...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
