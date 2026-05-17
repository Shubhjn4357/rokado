"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Phone,
  Building2,
  FileText,
  TrendingUp,
  Edit,
} from "lucide-react";
import Link from "next/link";
import { formatCurrency, formatDate, LEDGER_GROUP_LABELS, type LedgerGroup } from "@/lib/types";
import type { InferSelectModel } from "@/lib/database";
import type { ledgers as ledgersTable } from "@/lib/database";

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
  const totalDr = entries.filter((e) => e.entryType === "dr").reduce((s, e) => s + e.amount, 0);
  const totalCr = entries.filter((e) => e.entryType === "cr").reduce((s, e) => s + e.amount, 0);
  const netBalance = ledger.openingBalance + (ledger.balanceType === "dr" ? 1 : -1) * (totalDr - totalCr);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="icon" className="rounded-xl">
          <Link href="/ledgers">
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">{ledger.name}</h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="secondary" className="text-xs">
              {LEDGER_GROUP_LABELS[ledger.group as LedgerGroup] ?? ledger.group}
            </Badge>
            {ledger.gstNumber && (
              <Badge variant="outline" className="text-xs font-mono">
                {ledger.gstNumber}
              </Badge>
            )}
          </div>
        </div>
        <Button variant="outline" size="sm" className="gap-2 rounded-xl">
          <Edit className="w-4 h-4" /> Edit
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-border/60 bg-card/80">
          <CardContent className="pt-4">
            <div className="text-xs text-muted-foreground">Opening Balance</div>
            <div className="text-xl font-bold mt-1">{formatCurrency(ledger.openingBalance)}</div>
            <div className="text-xs text-muted-foreground">{ledger.balanceType.toUpperCase()}</div>
          </CardContent>
        </Card>
        <Card className="border-border/60 bg-card/80">
          <CardContent className="pt-4">
            <div className="text-xs text-muted-foreground">Total Debit</div>
            <div className="text-xl font-bold mt-1 text-blue-500">{formatCurrency(totalDr)}</div>
            <div className="text-xs text-muted-foreground">{entries.filter(e => e.entryType === "dr").length} entries</div>
          </CardContent>
        </Card>
        <Card className="border-border/60 bg-card/80">
          <CardContent className="pt-4">
            <div className="text-xs text-muted-foreground">Total Credit</div>
            <div className="text-xl font-bold mt-1 text-red-500">{formatCurrency(totalCr)}</div>
            <div className="text-xs text-muted-foreground">{entries.filter(e => e.entryType === "cr").length} entries</div>
          </CardContent>
        </Card>
        <Card className="border-border/60 bg-primary/5 border-primary/20">
          <CardContent className="pt-4">
            <div className="text-xs text-muted-foreground">Net Balance</div>
            <div className="text-xl font-bold mt-1 text-primary">{formatCurrency(Math.abs(netBalance))}</div>
            <div className="text-xs text-muted-foreground">{netBalance >= 0 ? "Dr" : "Cr"}</div>
          </CardContent>
        </Card>
      </div>

      {/* Details + Transactions Tabs */}
      <Tabs defaultValue="transactions">
        <TabsList className="rounded-xl">
          <TabsTrigger value="transactions" className="rounded-lg">
            <FileText className="w-3.5 h-3.5 mr-2" />
            Transactions
          </TabsTrigger>
          <TabsTrigger value="info" className="rounded-lg">
            <Building2 className="w-3.5 h-3.5 mr-2" />
            Info
          </TabsTrigger>
        </TabsList>

        <TabsContent value="transactions" className="mt-4">
          <div className="rounded-xl border border-border/60 bg-card/80 overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow className="hover:bg-transparent">
                  <TableHead>Date</TableHead>
                  <TableHead>Voucher</TableHead>
                  <TableHead>Narration</TableHead>
                  <TableHead className="text-right">Debit</TableHead>
                  <TableHead className="text-right">Credit</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-12">
                      No transactions found for this ledger.
                    </TableCell>
                  </TableRow>
                ) : (
                  entries.map((entry) => (
                    <TableRow key={entry.entryId} className="hover:bg-muted/20">
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(entry.voucherDate)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs capitalize">
                            {entry.voucherType}
                          </Badge>
                          {entry.voucherNumber && (
                            <span className="text-xs font-mono text-muted-foreground">
                              #{entry.voucherNumber}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-[240px] truncate">
                        {entry.narration ?? entry.voucherNarration ?? "—"}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {entry.entryType === "dr" ? (
                          <span className="text-blue-500">{formatCurrency(entry.amount)}</span>
                        ) : (
                          <span className="text-muted-foreground/40">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {entry.entryType === "cr" ? (
                          <span className="text-red-500">{formatCurrency(entry.amount)}</span>
                        ) : (
                          <span className="text-muted-foreground/40">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="info" className="mt-4">
          <Card className="border-border/60 bg-card/80">
            <CardContent className="pt-6 grid grid-cols-2 gap-4">
              {[
                { label: "Ledger ID", value: ledger.id },
                { label: "Group", value: LEDGER_GROUP_LABELS[ledger.group as LedgerGroup] ?? ledger.group },
                { label: "GSTIN", value: ledger.gstNumber ?? "—" },
                { label: "PAN", value: ledger.pan ?? "—" },
                { label: "Phone", value: ledger.phone ?? "—" },
                { label: "Address", value: ledger.address ?? "—" },
                { label: "Credit Limit", value: ledger.creditLimit ? formatCurrency(ledger.creditLimit) : "No Limit" },
                { label: "Status", value: ledger.isActive ? "Active" : "Inactive" },
              ].map(({ label, value }) => (
                <div key={label}>
                  <div className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1">{label}</div>
                  <div className="text-sm font-medium">{value}</div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
