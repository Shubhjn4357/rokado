"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  Receipt,
  ShoppingCart,
  CreditCard,
  ArrowLeftRight,
  FileText,
  Package,
  Calculator,
  BarChart3,
  Settings,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";

type CommandItem = {
  id: string;
  label: string;
  description?: string;
  icon: React.ElementType;
  shortcut?: string;
  action: () => void;
  keywords?: string[];
};

function useCommandItems(router: ReturnType<typeof useRouter>): CommandItem[] {
  return [
    // Navigation
    { id: "dashboard", label: "Go to Dashboard", icon: LayoutDashboard, action: () => router.push("/dashboard"), keywords: ["home", "overview"] },
    { id: "ledgers", label: "All Ledgers", icon: BookOpen, action: () => router.push("/ledgers"), keywords: ["accounts", "party"] },
    { id: "vouchers", label: "All Vouchers", icon: FileText, action: () => router.push("/vouchers"), keywords: ["entries", "transactions"] },
    { id: "inventory", label: "Inventory", icon: Package, action: () => router.push("/inventory"), keywords: ["stock", "items", "saree"] },
    { id: "pos", label: "POS Billing", icon: Calculator, action: () => router.push("/pos"), keywords: ["billing", "sell", "invoice"] },
    { id: "settings", label: "Settings", icon: Settings, action: () => router.push("/settings"), keywords: ["config", "preferences"] },
    // Quick create
    { id: "new-sales", label: "New Sales Voucher", description: "F8", icon: Receipt, shortcut: "F8", action: () => router.push("/vouchers/sales"), keywords: ["sell", "invoice", "sales"] },
    { id: "new-purchase", label: "New Purchase Voucher", description: "F9", icon: ShoppingCart, shortcut: "F9", action: () => router.push("/vouchers/purchase"), keywords: ["buy", "purchase"] },
    { id: "new-receipt", label: "New Receipt Voucher", description: "F6", icon: CreditCard, shortcut: "F6", action: () => router.push("/vouchers/receipt"), keywords: ["receive", "payment in"] },
    { id: "new-payment", label: "New Payment Voucher", description: "F5", icon: ArrowLeftRight, shortcut: "F5", action: () => router.push("/vouchers/payment"), keywords: ["pay", "payment out"] },
    { id: "new-journal", label: "New Journal Entry", description: "F7", icon: FileText, shortcut: "F7", action: () => router.push("/vouchers/journal"), keywords: ["journal", "adjustment"] },
    { id: "new-contra", label: "New Contra Voucher", description: "F4", icon: ArrowLeftRight, shortcut: "F4", action: () => router.push("/vouchers/contra"), keywords: ["contra", "cash transfer"] },
    { id: "new-ledger", label: "Create New Ledger", description: "Alt+C", icon: Plus, shortcut: "Alt+C", action: () => router.push("/ledgers/new"), keywords: ["ledger", "account", "party"] },
    // Reports
    { id: "trial-balance", label: "Trial Balance", icon: BarChart3, action: () => router.push("/reports/trial-balance"), keywords: ["report", "balance"] },
    { id: "outstanding", label: "Outstanding Report", icon: BarChart3, action: () => router.push("/reports/outstanding"), keywords: ["due", "debtors", "creditors"] },
    { id: "gst-report", label: "GST Report", icon: FileText, action: () => router.push("/reports/gst"), keywords: ["tax", "gstr1", "gstr3b"] },
    { id: "bank-reconciliation", label: "Bank Reconciliation", icon: BarChart3, action: () => router.push("/reports/bank-reconciliation"), keywords: ["report", "reconcile", "bank"] },
    { id: "dual-book", label: "Dual Book Mode", icon: BookOpen, action: () => router.push("/reports/dual-book"), keywords: ["report", "dual", "shadow", "paper", "mismatch"] },
  ];
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const items = useCommandItems(router);

  const filteredItems = query.trim()
    ? items.filter((item) => {
        const q = query.toLowerCase();
        return (
          item.label.toLowerCase().includes(q) ||
          item.description?.toLowerCase().includes(q) ||
          item.keywords?.some((k) => k.includes(q))
        );
      })
    : items;

  const runItem = useCallback(
    (item: CommandItem) => {
      item.action();
      setOpen(false);
      setQuery("");
    },
    []
  );

  // Listen for open event
  useEffect(() => {
    const onOpen = () => {
      setOpen(true);
      setQuery("");
      setSelectedIndex(0);
    };
    window.addEventListener("erp:command-palette", onOpen);
    return () => window.removeEventListener("erp:command-palette", onOpen);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setOpen(false); return; }
      if (e.key === "ArrowDown") { e.preventDefault(); setSelectedIndex((i) => Math.min(i + 1, filteredItems.length - 1)); }
      if (e.key === "ArrowUp") { e.preventDefault(); setSelectedIndex((i) => Math.max(i - 1, 0)); }
      if (e.key === "Enter") { e.preventDefault(); if (filteredItems[selectedIndex]) runItem(filteredItems[selectedIndex]); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, filteredItems, selectedIndex, runItem]);

  // Reset selection on query change
  useEffect(() => { setSelectedIndex(0); }, [query]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]"
      onClick={() => setOpen(false)}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Palette */}
      <div
        className="relative w-full max-w-xl mx-4 rounded-2xl border border-border/60 bg-card/95 backdrop-blur-xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 border-b border-border/60">
          <svg className="w-4 h-4 text-muted-foreground shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search or jump to... (ledger, voucher, report)"
            className="flex-1 py-4 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <kbd className="text-[10px] font-mono bg-muted/60 text-muted-foreground px-1.5 py-0.5 rounded-md">ESC</kbd>
        </div>

        {/* Results */}
        <div className="max-h-[360px] overflow-y-auto py-2">
          {filteredItems.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              No results for &ldquo;{query}&rdquo;
            </div>
          ) : (
            filteredItems.map((item, idx) => (
              <button
                key={item.id}
                onClick={() => runItem(item)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors",
                  idx === selectedIndex
                    ? "bg-primary/10 text-primary"
                    : "hover:bg-muted/50 text-foreground"
                )}
              >
                <div className={cn(
                  "w-7 h-7 rounded-lg flex items-center justify-center shrink-0",
                  idx === selectedIndex ? "bg-primary/20" : "bg-muted/60"
                )}>
                  <item.icon className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{item.label}</div>
                  {item.description && (
                    <div className="text-xs text-muted-foreground">{item.description}</div>
                  )}
                </div>
                {item.shortcut && (
                  <kbd className="text-[10px] font-mono bg-muted/60 text-muted-foreground px-1.5 py-0.5 rounded-md shrink-0">
                    {item.shortcut}
                  </kbd>
                )}
              </button>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-border/60 bg-muted/20 flex items-center gap-3 text-[11px] text-muted-foreground">
          <span>↑↓ navigate</span>
          <span>↵ select</span>
          <span>esc close</span>
          <span className="ml-auto">Ctrl+K to reopen</span>
        </div>
      </div>
    </div>
  );
}
