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
  MoreVertical,
  Eye,
  Edit,
  Loader2,
} from "lucide-react";
import {
  formatCurrency,
  formatDate,
  VOUCHER_TYPE_LABELS,
  type VoucherType,
} from "@/lib/types";
import {
  createVoucher,
  updateVoucherAction,
  deleteVoucherAction,
  getVoucherDetailAction,
  type VoucherEntryLine,
} from "@/app/(erp)/vouchers/actions";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter } from "next/navigation";

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
  const router = useRouter();
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  // View detail states
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [voucherDetail, setVoucherDetail] = useState<any>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Delete states
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [voucherToDelete, setVoucherToDelete] = useState<VoucherRow | null>(null);
  const [deletingPending, startDeleteTransition] = useTransition();

  const filtered = vouchers.filter((v) => {
    const matchType = typeFilter === "all" || v.type === typeFilter;
    const matchSearch =
      !search ||
      (v.number && v.number.toLowerCase().includes(search.toLowerCase())) ||
      (v.narration && v.narration.toLowerCase().includes(search.toLowerCase()));
    return matchType && matchSearch;
  });

  const handleViewDetails = async (id: string) => {
    setLoadingDetail(true);
    setDetailModalOpen(true);
    try {
      const data = await getVoucherDetailAction(id);
      setVoucherDetail(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleConfirmDelete = () => {
    if (!voucherToDelete) return;
    startDeleteTransition(async () => {
      try {
        const res = await deleteVoucherAction(voucherToDelete.id);
        if (res.success) {
          setDeleteConfirmOpen(false);
          setVoucherToDelete(null);
          router.refresh();
        } else {
          console.error(res.error);
        }
      } catch (err) {
        console.error(err);
      }
    });
  };

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
              onSuccess={() => {
                setDialogOpen(false);
                router.refresh();
              }}
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
              <TableHead className="text-right font-semibold">Status</TableHead>
              <TableHead className="w-12 text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-16">
                  No vouchers found. Click &ldquo;New Voucher&rdquo; to create your first entry.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((v) => (
                <TableRow key={v.id} className="hover:bg-muted/20 transition-colors group">
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
                  <TableCell className="text-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="w-8 h-8 rounded-lg">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="rounded-xl border border-border/80 bg-background/95">
                        <DropdownMenuItem
                          onClick={() => handleViewDetails(v.id)}
                          className="text-xs font-semibold gap-2 rounded-lg cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" /> View Journal Entries
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setVoucherToDelete(v);
                            setDeleteConfirmOpen(true);
                          }}
                          className="text-xs font-semibold text-destructive gap-2 rounded-lg cursor-pointer focus:text-destructive focus:bg-destructive/10"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Safe Delete Entry
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="text-xs text-muted-foreground text-right select-none">
        Showing {filtered.length} of {vouchers.length} vouchers
      </div>

      {/* VIEW DETAILS DIALOG */}
      <Dialog open={detailModalOpen} onOpenChange={setDetailModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-border/80">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-accent animate-pulse" /> Voucher Details - {voucherDetail?.voucher?.number || "—"}
            </DialogTitle>
            <DialogDescription>
              Double-entry logs and stock movements registered in the core journal database
            </DialogDescription>
          </DialogHeader>

          {loadingDetail ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-accent" />
              <span className="text-xs font-bold text-muted-foreground">Reading ledger sheets...</span>
            </div>
          ) : voucherDetail ? (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-muted/20 p-4 rounded-xl border border-border/60">
                <div>
                  <span className="block text-[10px] text-muted-foreground uppercase font-bold tracking-wide">Voucher No.</span>
                  <span className="text-xs font-mono font-bold text-primary">{voucherDetail.voucher.number || "—"}</span>
                </div>
                <div>
                  <span className="block text-[10px] text-muted-foreground uppercase font-bold tracking-wide">Type</span>
                  <span className="text-xs font-semibold capitalize text-primary">{voucherDetail.voucher.type}</span>
                </div>
                <div>
                  <span className="block text-[10px] text-muted-foreground uppercase font-bold tracking-wide">Date</span>
                  <span className="text-xs font-semibold text-primary">{formatDate(voucherDetail.voucher.date)}</span>
                </div>
                <div>
                  <span className="block text-[10px] text-muted-foreground uppercase font-bold tracking-wide">Total Amount</span>
                  <span className="text-xs font-mono font-black text-emerald-600">{formatCurrency(voucherDetail.voucher.grandTotal)}</span>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-[11px] uppercase tracking-wider font-bold text-accent block">Journal Postings Ledger</span>
                <div className="rounded-xl border border-border/60 overflow-hidden">
                  <Table>
                    <TableHeader className="bg-muted/40">
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="py-2">Ledger Account</TableHead>
                        <TableHead className="py-2 text-center w-24">Posting</TableHead>
                        <TableHead className="py-2 text-right w-32">Debit (₹)</TableHead>
                        <TableHead className="py-2 text-right w-32">Credit (₹)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {voucherDetail.entries.map((entry: any, index: number) => (
                        <TableRow key={index} className="hover:bg-muted/5 font-semibold">
                          <TableCell className="py-3">
                            <div className="text-xs">{entry.ledgerName}</div>
                            {entry.inventoryItemId && (
                              <div className="text-[10px] text-accent mt-0.5 font-normal">
                                ↳ Allocation: {entry.quantity} units @ {formatCurrency(entry.rate)}
                              </div>
                            )}
                            {entry.narration && (
                              <div className="text-[10px] text-muted-foreground/80 mt-0.5 font-normal italic">
                                &ldquo;{entry.narration}&rdquo;
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-center py-3">
                            <Badge variant="outline" className={`text-[10px] uppercase font-mono ${entry.type === 'dr' ? 'text-blue-500 bg-blue-500/5' : 'text-rose-500 bg-rose-500/5'}`}>
                              {entry.type}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right py-3 font-mono text-xs">
                            {entry.type === 'dr' ? formatCurrency(entry.amount) : "—"}
                          </TableCell>
                          <TableCell className="text-right py-3 font-mono text-xs">
                            {entry.type === 'cr' ? formatCurrency(entry.amount) : "—"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {voucherDetail.voucher.narration && (
                <div className="bg-accent/5 p-4 rounded-xl border border-accent/15 space-y-1">
                  <span className="block text-[10px] text-accent uppercase font-black tracking-wide">Global Narration</span>
                  <p className="text-xs text-muted-foreground italic font-semibold">&ldquo;{voucherDetail.voucher.narration}&rdquo;</p>
                </div>
              )}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* DELETE CONFIRM DIALOG */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="max-w-md rounded-2xl border border-border/80 bg-background/95">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="w-5 h-5" /> Reverse & Delete Voucher Entry?
            </DialogTitle>
            <DialogDescription>
              This action will permanently reverse all double-entry ledger balances and item stock movements associated with this voucher cleanly.
            </DialogDescription>
          </DialogHeader>

          {voucherToDelete && (
            <div className="bg-destructive/5 p-4 rounded-xl border border-destructive/15 space-y-2 font-semibold">
              <div className="text-xs text-muted-foreground">Voucher details to be deleted:</div>
              <div className="text-xs text-primary flex items-center justify-between">
                <span>Number: <span className="font-mono">{voucherToDelete.number || "—"}</span></span>
                <span>Amount: <span className="font-mono text-destructive">{formatCurrency(voucherToDelete.grandTotal)}</span></span>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0 mt-4">
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)} className="rounded-xl text-xs font-bold h-9">
              Keep Voucher
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={deletingPending}
              className="rounded-xl text-xs font-bold h-9 gap-1.5"
            >
              {deletingPending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-3.5 h-3.5" /> Revert & Delete
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


