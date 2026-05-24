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
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ERP_ACTION_SHORTCUTS, ERP_NAVIGATION_SHORTCUTS } from "@/lib/erp-shortcuts";

type CommandItem = {
  id: string;
  label: string;
  description?: string;
  icon: React.ElementType;
  shortcut?: string;
  action: () => void;
  keywords?: string[];
};

const SHORTCUT_ICONS: Record<string, React.ElementType> = {
  F4: ArrowLeftRight,
  F5: ArrowLeftRight,
  F6: CreditCard,
  F7: FileText,
  F8: Receipt,
  F9: ShoppingCart,
  F10: FileText,
  F11: Calculator,
  F12: LayoutDashboard,
  "Alt+C": Plus,
  "Alt+I": Package,
};

function useCommandItems(router: ReturnType<typeof useRouter>): CommandItem[] {
  return [
    // Navigation
    { id: "dashboard", label: "Go to Dashboard", icon: LayoutDashboard, action: () => router.push("/dashboard"), keywords: ["home", "overview"] },
    { id: "ledgers", label: "All Ledgers", icon: BookOpen, action: () => router.push("/ledgers"), keywords: ["accounts", "party"] },
    { id: "vouchers", label: "All Vouchers", icon: FileText, action: () => router.push("/vouchers"), keywords: ["entries", "transactions"] },
    { id: "inventory", label: "Inventory", icon: Package, action: () => router.push("/inventory"), keywords: ["stock", "items", ""] },
    { id: "pos", label: "POS Billing", icon: Calculator, action: () => router.push("/pos"), keywords: ["billing", "sell", "invoice"] },
    { id: "settings", label: "Settings", icon: Settings, action: () => router.push("/settings"), keywords: ["config", "preferences"] },
    // Shortcuts
    ...ERP_NAVIGATION_SHORTCUTS.map((shortcut) => ({
      id: `shortcut-${shortcut.key}`,
      label: shortcut.label,
      description: shortcut.description,
      icon: SHORTCUT_ICONS[shortcut.key] ?? FileText,
      shortcut: shortcut.key,
      action: () => router.push(shortcut.route!),
      keywords: [shortcut.label.toLowerCase(), shortcut.description.toLowerCase()],
    })),
    ...ERP_ACTION_SHORTCUTS.filter((shortcut) => shortcut.route).map((shortcut) => ({
      id: `shortcut-${shortcut.key}`,
      label: shortcut.label,
      description: shortcut.description,
      icon: SHORTCUT_ICONS[shortcut.key] ?? Plus,
      shortcut: shortcut.key,
      action: () => router.push(shortcut.route!),
      keywords: [shortcut.label.toLowerCase(), shortcut.description.toLowerCase()],
    })),
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
      <div className="absolute inset-0 bg-foreground/45 backdrop-blur-sm" />

      {/* Palette */}
      <div
        className="surface-elevated relative w-full max-w-xl mx-4 rounded-[var(--radius-card)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 border-b border-border/60">
          <Search className="w-4 h-4 text-muted-foreground shrink-0" />
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
                    ? "bg-accent/10 text-accent"
                    : "hover:bg-muted/50 text-foreground"
                )}
              >
                <div className={cn(
                  "w-7 h-7 rounded-lg flex items-center justify-center shrink-0",
                  idx === selectedIndex ? "bg-accent/15" : "bg-muted/60"
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
        <div className="px-4 py-2 border-t border-border/60 bg-muted/25 flex items-center gap-3 text-[11px] text-muted-foreground">
          <span>Up/Down navigate</span>
          <span>Enter select</span>
          <span>esc close</span>
          <span className="ml-auto">Ctrl+K to reopen</span>
        </div>
      </div>
    </div>
  );
}
