"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Search,
  Plus,
  ArrowUpRight,
  Building2,
  Users,
  Landmark,
  Banknote,
} from "lucide-react";
import { formatCurrency, LEDGER_GROUP_LABELS, type LedgerGroup } from "@/lib/types";
import type { InferSelectModel } from "@/lib/database";
import type { ledgers as ledgersTable } from "@/lib/database";

type Ledger = InferSelectModel<typeof ledgersTable>;

const GROUP_ICONS: Partial<Record<LedgerGroup, React.ElementType>> = {
  sundry_debtors: Users,
  sundry_creditors: Building2,
  bank: Landmark,
  cash: Banknote,
};

const GROUP_COLORS: Partial<Record<LedgerGroup, string>> = {
  sundry_debtors: "text-blue-500 bg-blue-500/10",
  sundry_creditors: "text-amber-500 bg-amber-500/10",
  bank: "text-violet-500 bg-violet-500/10",
  cash: "text-emerald-500 bg-emerald-500/10",
  sales: "text-green-500 bg-green-500/10",
  purchase: "text-red-500 bg-red-500/10",
  duties_taxes: "text-orange-500 bg-orange-500/10",
  expenses: "text-pink-500 bg-pink-500/10",
};

const ALL_GROUPS = "all";

export function LedgerListClient({ ledgers }: { ledgers: Ledger[] }) {
  const router = useRouter();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState("");
  const [groupFilter, setGroupFilter] = useState<string>(ALL_GROUPS);

  const filtered = useMemo(() => {
    return ledgers.filter((l) => {
      const matchSearch =
        l.name.toLowerCase().includes(search.toLowerCase()) ||
        (l.gstNumber && l.gstNumber.toLowerCase().includes(search.toLowerCase()));
      const matchGroup = groupFilter === ALL_GROUPS || l.group === groupFilter;
      return matchSearch && matchGroup;
    });
  }, [ledgers, search, groupFilter]);

  const uniqueGroups = useMemo(() => {
    return Array.from(new Set(ledgers.map((l) => l.group)));
  }, [ledgers]);

  // Keyboard Navigation listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInputFocused =
        activeEl?.tagName === "INPUT" ||
        activeEl?.tagName === "TEXTAREA" ||
        activeEl?.tagName === "SELECT" ||
        activeEl?.getAttribute("contenteditable") === "true";

      // "/" focuses the search bar if not typing in any input
      if (e.key === "/" && !isInputFocused) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }

      // "Escape" or "Q" navigates to Dashboard
      if ((e.key === "q" || e.key === "Q" || e.key === "Escape") && !isInputFocused) {
        e.preventDefault();
        router.push("/dashboard");
      }

      // "C" or "Alt+C" navigates to Create Ledger
      if ((e.key === "c" || e.key === "C") && !isInputFocused) {
        e.preventDefault();
        router.push("/ledgers/new");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [router]);

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            ref={searchInputRef}
            placeholder="Search ledger name or GSTIN (Press '/' to focus)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 bg-muted/40 rounded-xl"
          />
        </div>
        <Select value={groupFilter} onValueChange={setGroupFilter}>
          <SelectTrigger className="w-48 h-9 rounded-xl bg-muted/40">
            <SelectValue placeholder="All Groups" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_GROUPS}>All Groups</SelectItem>
            {uniqueGroups.map((g) => (
              <SelectItem key={g} value={g}>
                {LEDGER_GROUP_LABELS[g as LedgerGroup] ?? g}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button asChild size="sm" className="h-9 rounded-xl gap-2 ml-auto cursor-pointer">
          <Link href="/ledgers/new">
            <Plus className="w-4 h-4" /> New Ledger
          </Link>
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border/60 bg-card/80 backdrop-blur overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow className="hover:bg-transparent">
              <TableHead className="font-semibold">Ledger Name</TableHead>
              <TableHead className="font-semibold">Group</TableHead>
              <TableHead className="font-semibold">GSTIN / Phone</TableHead>
              <TableHead className="font-semibold text-right">Opening Balance</TableHead>
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-16">
                  No ledgers found matching your search.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((ledger) => {
                const Icon = GROUP_ICONS[ledger.group as LedgerGroup] ?? Building2;
                const colorClass = GROUP_COLORS[ledger.group as LedgerGroup] ?? "text-muted-foreground bg-muted";
                return (
                  <TableRow
                    key={ledger.id}
                    className="hover:bg-muted/30 cursor-pointer transition-colors"
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${colorClass}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-medium">{ledger.name}</div>
                          {ledger.creditLimit != null && ledger.creditLimit > 0 && (
                            <div className="text-xs text-muted-foreground">
                              Limit: {formatCurrency(ledger.creditLimit)}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs font-normal capitalize">
                        {LEDGER_GROUP_LABELS[ledger.group as LedgerGroup] ?? ledger.group}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {ledger.gstNumber ?? ledger.phone ?? "—"}
                    </TableCell>
                    <TableCell className="text-right font-mono font-semibold">
                      <span className={ledger.balanceType === "dr" ? "text-blue-500" : "text-red-500"}>
                        {formatCurrency(ledger.openingBalance)}
                      </span>
                      <span className="text-xs text-muted-foreground ml-1">
                        {ledger.balanceType.toUpperCase()}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Button asChild variant="ghost" size="icon" className="w-7 h-7 rounded-lg">
                        <Link href={`/ledgers/${ledger.id}`}>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
      <div className="text-xs text-muted-foreground text-right">
        Showing {filtered.length} of {ledgers.length} ledgers
      </div>
    </div>
  );
}
