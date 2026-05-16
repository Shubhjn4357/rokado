"use client";

import { useState, useTransition, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  ArrowUpDown,
  Search,
} from "lucide-react";
import {
  formatCurrency,
  formatDate,
  VOUCHER_TYPE_LABELS,
  type VoucherType,
} from "@/lib/types";
import { createVoucher, type VoucherEntryLine } from "@/app/(erp)/vouchers/actions";

type VoucherRow = {
  id: string;
  type: string;
  number: string | null;
  date: number;
  narration: string | null;
  totalAmount: number;
  grandTotal: number;
  gstTotal: number;
  status: string;
  createdAt: number;
};

type LedgerOption = { id: string; name: string; group: string };

const VOUCHER_TYPES: VoucherType[] = [
  "sales",
  "purchase",
  "receipt",
  "payment",
  "contra",
  "journal",
];

const STATUS_COLORS: Record<string, string> = {
  posted: "text-emerald-500 bg-emerald-500/10",
  draft: "text-amber-500 bg-amber-500/10",
  cancelled: "text-destructive bg-destructive/10",
};

interface EntryLine {
  _id: string;
  ledgerId: string;
  type: "dr" | "cr";
  amount: number;
  narration?: string;
}

function VoucherEntryForm({
  ledgers,
  onSuccess,
}: {
  ledgers: LedgerOption[];
  onSuccess: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [voucherType, setVoucherType] = useState<VoucherType>("sales");
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [narration, setNarration] = useState("");
  const [entries, setEntries] = useState<EntryLine[]>([
    { _id: crypto.randomUUID(), ledgerId: "", type: "dr", amount: 0 },
    { _id: crypto.randomUUID(), ledgerId: "", type: "cr", amount: 0 },
  ]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const totalDr = entries.filter((e) => e.type === "dr").reduce((s, e) => s + e.amount, 0);
  const totalCr = entries.filter((e) => e.type === "cr").reduce((s, e) => s + e.amount, 0);
  const isBalanced = Math.abs(totalDr - totalCr) < 0.01;

  const addEntry = () => {
    setEntries((prev) => [
      ...prev,
      { _id: crypto.randomUUID(), ledgerId: "", type: "cr", amount: 0 },
    ]);
  };

  const removeEntry = (id: string) => {
    setEntries((prev) => prev.filter((e) => e._id !== id));
  };

  const updateEntry = (id: string, patch: Partial<EntryLine>) => {
    setEntries((prev) =>
      prev.map((e) => (e._id === id ? { ...e, ...patch } : e))
    );
  };

  const handleSubmit = () => {
    setError(null);
    startTransition(async () => {
      const result = await createVoucher({
        type: voucherType,
        date: date ? new Date(date).getTime() : Date.now(),
        narration,
        entries: entries.map(({ _id, ...rest }) => rest),
      });
      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          onSuccess();
        }, 1500);
      } else {
        setError(result.error);
      }
    });
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <CheckCircle2 className="w-12 h-12 text-emerald-500" />
        <div className="text-lg font-semibold">Voucher Posted!</div>
        <div className="text-sm text-muted-foreground">Double-entry recorded successfully.</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 py-2">
      {/* Header inputs */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground uppercase tracking-wide">
            Voucher Type
          </Label>
          <Select value={voucherType} onValueChange={(v) => setVoucherType(v as VoucherType)}>
            <SelectTrigger className="rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {VOUCHER_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {VOUCHER_TYPE_LABELS[t]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground uppercase tracking-wide">Date</Label>
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-xl"
          />
        </div>
        <div className="col-span-2 space-y-2">
          <Label className="text-xs text-muted-foreground uppercase tracking-wide">Narration</Label>
          <Input
            placeholder="Description of this transaction..."
            value={narration}
            onChange={(e) => setNarration(e.target.value)}
            className="rounded-xl"
          />
        </div>
      </div>

      {/* Entry lines table */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs text-muted-foreground uppercase tracking-wide">
            Ledger Entries
          </Label>
          <div className={`text-xs font-mono px-2 py-1 rounded-lg ${isBalanced ? "bg-emerald-500/10 text-emerald-500" : "bg-destructive/10 text-destructive"}`}>
            {isBalanced ? "✓ Balanced" : `Diff: ${formatCurrency(Math.abs(totalDr - totalCr))}`}
          </div>
        </div>

        <div className="rounded-xl border border-border/60 overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="hover:bg-transparent">
                <TableHead>Ledger</TableHead>
                <TableHead className="w-24">Dr / Cr</TableHead>
                <TableHead className="w-36">Amount (₹)</TableHead>
                <TableHead className="w-8"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((entry) => (
                <TableRow key={entry._id} className="hover:bg-muted/10">
                  <TableCell>
                    <Select
                      value={entry.ledgerId}
                      onValueChange={(v) => updateEntry(entry._id, { ledgerId: v })}
                    >
                      <SelectTrigger className="h-8 rounded-lg text-xs border-0 bg-muted/50 focus:bg-muted">
                        <SelectValue placeholder="Select ledger..." />
                      </SelectTrigger>
                      <SelectContent>
                        {ledgers.map((l) => (
                          <SelectItem key={l.id} value={l.id} className="text-xs">
                            {l.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={entry.type}
                      onValueChange={(v) => updateEntry(entry._id, { type: v as "dr" | "cr" })}
                    >
                      <SelectTrigger className="h-8 rounded-lg text-xs border-0 bg-muted/50 w-20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="dr">Dr</SelectItem>
                        <SelectItem value="cr">Cr</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min={0}
                      step={0.01}
                      value={entry.amount || ""}
                      onChange={(e) => updateEntry(entry._id, { amount: parseFloat(e.target.value) || 0 })}
                      className="h-8 rounded-lg text-xs border-0 bg-muted/50 font-mono"
                      placeholder="0.00"
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-7 h-7 rounded-lg text-muted-foreground hover:text-destructive"
                      onClick={() => removeEntry(entry._id)}
                      disabled={entries.length <= 2}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {/* Totals row */}
              <TableRow className="bg-muted/20 hover:bg-muted/20 font-semibold">
                <TableCell className="text-xs text-muted-foreground">Totals</TableCell>
                <TableCell></TableCell>
                <TableCell className="font-mono text-xs">
                  <div className="text-blue-500">Dr: {formatCurrency(totalDr)}</div>
                  <div className="text-red-500">Cr: {formatCurrency(totalCr)}</div>
                </TableCell>
                <TableCell></TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>

        <Button variant="outline" size="sm" className="gap-2 rounded-xl text-xs" onClick={addEntry}>
          <Plus className="w-3.5 h-3.5" /> Add Entry Line
        </Button>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 px-4 py-3 rounded-xl">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      <DialogFooter>
        <Button
          onClick={handleSubmit}
          disabled={!isBalanced || isPending || entries.some((e) => !e.ledgerId || e.amount <= 0)}
          className="rounded-xl gap-2"
        >
          {isPending ? "Posting..." : "Post Voucher"}
          <ArrowUpDown className="w-3.5 h-3.5" />
        </Button>
      </DialogFooter>
    </div>
  );
}

export function VouchersClient({
  vouchers,
  ledgers,
}: {
  vouchers: VoucherRow[];
  ledgers: LedgerOption[];
}) {
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const filtered = vouchers.filter((v) => {
    const matchType = typeFilter === "all" || v.type === typeFilter;
    const matchSearch =
      !search ||
      (v.number && v.number.toLowerCase().includes(search.toLowerCase())) ||
      (v.narration && v.narration.toLowerCase().includes(search.toLowerCase()));
    return matchType && matchSearch;
  });

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search voucher no. or narration..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 bg-muted/40 rounded-xl"
          />
        </div>

        <Tabs value={typeFilter} onValueChange={setTypeFilter} className="flex-1">
          <TabsList className="rounded-xl h-9 bg-muted/40">
            <TabsTrigger value="all" className="rounded-lg text-xs px-3">All</TabsTrigger>
            {VOUCHER_TYPES.map((t) => (
              <TabsTrigger key={t} value={t} className="rounded-lg text-xs px-3 capitalize">
                {t}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="h-9 rounded-xl gap-2 shrink-0">
              <Plus className="w-4 h-4" /> New Voucher
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Voucher</DialogTitle>
              <DialogDescription>
                Enter double-entry ledger lines. Debit must equal Credit.
              </DialogDescription>
            </DialogHeader>
            <VoucherEntryForm
              ledgers={ledgers}
              onSuccess={() => setDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border/60 bg-card/80 backdrop-blur overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow className="hover:bg-transparent">
              <TableHead>Date</TableHead>
              <TableHead>Voucher No.</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Narration</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-right">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-16">
                  No vouchers found. Click &ldquo;New Voucher&rdquo; to create your first entry.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((v) => (
                <TableRow key={v.id} className="hover:bg-muted/20 cursor-pointer transition-colors">
                  <TableCell className="text-sm text-muted-foreground">{formatDate(v.date)}</TableCell>
                  <TableCell className="font-mono text-sm font-semibold">{v.number ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs capitalize">
                      {v.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-[240px] truncate">
                    {v.narration ?? "—"}
                  </TableCell>
                  <TableCell className="text-right font-mono font-semibold">
                    {formatCurrency(v.grandTotal)}
                  </TableCell>
                  <TableCell className="text-right">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[v.status] ?? ""}`}>
                      {v.status}
                    </span>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <div className="text-xs text-muted-foreground text-right">
        Showing {filtered.length} of {vouchers.length} vouchers
      </div>
    </div>
  );
}
