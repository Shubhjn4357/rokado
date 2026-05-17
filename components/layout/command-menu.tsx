"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from "@/components/ui/command";
import {
  FileText,
  DollarSign,
  Layers,
  ArrowRightLeft,
  Settings,
  Sun,
  Moon,
  Plus,
  BookOpen,
  PieChart,
  TrendingUp,
  Percent,
  CheckSquare,
  Package,
} from "lucide-react";

export function CommandMenu() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.altKey && e.key.toLowerCase() === "g") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const runCommand = (command: () => void) => {
    setOpen(false);
    command();
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a report, voucher, or action to jump... (Alt+G)" className="text-xs" />
      <CommandList className="bg-popover/80 backdrop-blur-xl border-t border-border/40 select-none text-xs">
        <CommandEmpty className="text-xs py-6 text-muted-foreground text-center">No results found.</CommandEmpty>
        
        <CommandGroup heading="Transactions & Entries">
          <CommandItem onSelect={() => runCommand(() => router.push("/pos"))} className="rounded-lg">
            <ArrowRightLeft className="mr-2 h-3.5 w-3.5 text-accent" />
            <span>POS Billing Desk</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/vouchers"))} className="rounded-lg">
            <BookOpen className="mr-2 h-3.5 w-3.5 text-accent" />
            <span>Vouchers Journal (All Entries)</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/vouchers/journal"))} className="rounded-lg">
            <Layers className="mr-2 h-3.5 w-3.5 text-accent/80" />
            <span>New Journal Voucher</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/vouchers/payment"))} className="rounded-lg">
            <Layers className="mr-2 h-3.5 w-3.5 text-rose-500/80" />
            <span>New Payment Voucher</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/vouchers/receipt"))} className="rounded-lg">
            <Layers className="mr-2 h-3.5 w-3.5 text-emerald-500/80" />
            <span>New Receipt Voucher</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/vouchers/contra"))} className="rounded-lg">
            <Layers className="mr-2 h-3.5 w-3.5 text-blue-500/80" />
            <span>New Contra Voucher</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Financial Reports">
          <CommandItem onSelect={() => runCommand(() => router.push("/reports/trial-balance"))} className="rounded-lg">
            <PieChart className="mr-2 h-3.5 w-3.5 text-amber-500" />
            <span>Trial Balance</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/reports/pl"))} className="rounded-lg">
            <TrendingUp className="mr-2 h-3.5 w-3.5 text-emerald-500" />
            <span>Profit & Loss Account</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/reports/balance-sheet"))} className="rounded-lg">
            <FileText className="mr-2 h-3.5 w-3.5 text-sky-500" />
            <span>Balance Sheet</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/reports/outstanding"))} className="rounded-lg">
            <Percent className="mr-2 h-3.5 w-3.5 text-indigo-500" />
            <span>Outstanding Receivables</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/reports/bank-reconciliation"))} className="rounded-lg">
            <CheckSquare className="mr-2 h-3.5 w-3.5 text-purple-500" />
            <span>Bank Reconciliation</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/reports/dual-book"))} className="rounded-lg">
            <DollarSign className="mr-2 h-3.5 w-3.5 text-rose-500" />
            <span>Shadow Dual Book</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Master Registries">
          <CommandItem onSelect={() => runCommand(() => router.push("/ledgers"))} className="rounded-lg">
            <DollarSign className="mr-2 h-3.5 w-3.5 text-violet-500" />
            <span>Accounts & Ledgers Registry</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/inventory"))} className="rounded-lg">
            <Package className="mr-2 h-3.5 w-3.5 text-orange-500" />
            <span>Stock Registry (Inventory)</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Quick Utilities">
          <CommandItem onSelect={() => runCommand(() => router.push("/settings"))} className="rounded-lg">
            <Settings className="mr-2 h-3.5 w-3.5" />
            <span>Company Settings</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => setTheme(theme === "dark" ? "light" : "dark"))} className="rounded-lg">
            {theme === "dark" ? (
              <Sun className="mr-2 h-3.5 w-3.5 text-yellow-500" />
            ) : (
              <Moon className="mr-2 h-3.5 w-3.5 text-slate-500" />
            )}
            <span>Toggle Light/Dark Theme</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
