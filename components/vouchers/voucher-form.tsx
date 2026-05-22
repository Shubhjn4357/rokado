"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { getLedgersOptions } from "@/app/(erp)/ledgers/actions";
import { getInventoryItemsOptions } from "@/app/(erp)/inventory/actions";
import { createVoucher } from "@/app/(erp)/vouchers/actions";
import type { VoucherType, LedgerGroup } from "@/lib/types";
import {
  Trash2,
  Plus,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  FileSpreadsheet,
  Layers,
  ArrowRightLeft,
  DollarSign
} from "lucide-react";
import { cn } from "@/lib/utils";

// --- PARTY AUTOCOMPLETE COMPONENT ---
interface PartyAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  ledgers: Array<{ id: string; name: string; group: LedgerGroup }>;
  placeholder?: string;
  className?: string;
}

export function PartyAutocomplete({
  value,
  onChange,
  ledgers,
  placeholder = "Search ledger...",
  className,
}: PartyAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const selected = ledgers.find((l) => l.id === value);
    if (selected) {
      setQuery(selected.name);
    } else {
      setQuery("");
    }
  }, [value, ledgers]);

  const filtered = ledgers.filter((l) =>
    l.name.toLowerCase().includes(query.toLowerCase()) ||
    l.group.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        const selected = ledgers.find((l) => l.id === value);
        setQuery(selected ? selected.name : "");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [value, ledgers]);

  const selectItem = (item: typeof ledgers[0]) => {
    onChange(item.id);
    setQuery(item.name);
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) {
      if (e.key === "ArrowDown" || e.key === "Enter") {
        setIsOpen(true);
        e.preventDefault();
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < filtered.length - 1 ? prev + 1 : 0
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev > 0 ? prev - 1 : filtered.length - 1
        );
        break;
      case "Enter":
        e.preventDefault();
        if (filtered[highlightedIndex]) {
          selectItem(filtered[highlightedIndex]);
        }
        break;
      case "Escape":
        e.preventDefault();
        setIsOpen(false);
        const selected = ledgers.find((l) => l.id === value);
        setQuery(selected ? selected.name : "");
        break;
      case "Tab":
        if (filtered[highlightedIndex]) {
          selectItem(filtered[highlightedIndex]);
        }
        break;
    }
  };

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      <Input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setIsOpen(true);
          setHighlightedIndex(0);
        }}
        onFocus={() => setIsOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="w-full bg-background/50 border-border/85 pr-8 font-medium text-xs rounded-lg h-9 focus:bg-background shadow-inner transition-all duration-200"
      />
      <div className="absolute right-2.5 top-2.5 flex items-center pointer-events-none text-muted-foreground/60">
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>

      {isOpen && filtered.length > 0 && (
        <div className="absolute left-0 right-0 z-50 mt-1 max-h-60 overflow-y-auto rounded-xl border border-border bg-popover/95 text-popover-foreground shadow-2xl backdrop-blur-xl py-1">
          {filtered.map((item, idx) => (
            <button
              key={item.id}
              type="button"
              onClick={() => selectItem(item)}
              className={cn(
                "w-full flex items-center justify-between px-3 py-1.5 text-left text-xs transition-colors rounded-none",
                idx === highlightedIndex ? "bg-accent/15 text-accent font-semibold" : "hover:bg-muted/70"
              )}
            >
              <span className="truncate pr-2 font-medium">{item.name}</span>
              <span className="text-[9px] uppercase tracking-wider font-extrabold opacity-70 bg-muted px-2 py-0.5 rounded">
                {item.group.replace("_", " ")}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// --- ITEM AUTOCOMPLETE COMPONENT ---
interface ItemAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  items: Array<{ id: string; name: string; category: string; saleRate: number; purchaseRate: number; gstPercent: number; unit: string }>;
  placeholder?: string;
  className?: string;
  onSelectCallback?: (selectedItem: any) => void;
}

export function ItemAutocomplete({
  value,
  onChange,
  items,
  placeholder = "Search inventory stock...",
  className,
  onSelectCallback
}: ItemAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const selected = items.find((i) => i.id === value);
    if (selected) {
      setQuery(selected.name);
    } else {
      setQuery("");
    }
  }, [value, items]);

  const filtered = items.filter((i) =>
    i.name.toLowerCase().includes(query.toLowerCase()) ||
    i.category.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        const selected = items.find((i) => i.id === value);
        setQuery(selected ? selected.name : "");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [value, items]);

  const selectItem = (item: typeof items[0]) => {
    onChange(item.id);
    setQuery(item.name);
    setIsOpen(false);
    if (onSelectCallback) {
      onSelectCallback(item);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) {
      if (e.key === "ArrowDown" || e.key === "Enter") {
        setIsOpen(true);
        e.preventDefault();
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < filtered.length - 1 ? prev + 1 : 0
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev > 0 ? prev - 1 : filtered.length - 1
        );
        break;
      case "Enter":
        e.preventDefault();
        if (filtered[highlightedIndex]) {
          selectItem(filtered[highlightedIndex]);
        }
        break;
      case "Escape":
        e.preventDefault();
        setIsOpen(false);
        const selected = items.find((i) => i.id === value);
        setQuery(selected ? selected.name : "");
        break;
      case "Tab":
        if (filtered[highlightedIndex]) {
          selectItem(filtered[highlightedIndex]);
        }
        break;
    }
  };

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      <Input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setIsOpen(true);
          setHighlightedIndex(0);
        }}
        onFocus={() => setIsOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="w-full bg-background/50 border-border/85 pr-8 font-medium text-xs rounded-lg h-9 focus:bg-background shadow-inner transition-all duration-200"
      />
      <div className="absolute right-2.5 top-2.5 flex items-center pointer-events-none text-muted-foreground/60">
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      </div>

      {isOpen && filtered.length > 0 && (
        <div className="absolute left-0 right-0 z-50 mt-1 max-h-60 overflow-y-auto rounded-xl border border-border bg-popover/95 text-popover-foreground shadow-2xl backdrop-blur-xl py-1">
          {filtered.map((item, idx) => (
            <button
              key={item.id}
              type="button"
              onClick={() => selectItem(item)}
              className={cn(
                "w-full flex items-center justify-between px-3 py-1.5 text-left text-xs transition-colors rounded-none",
                idx === highlightedIndex ? "bg-accent/15 text-accent font-semibold" : "hover:bg-muted/70"
              )}
            >
              <div className="truncate pr-2">
                <span className="font-semibold block">{item.name}</span>
                <span className="text-[10px] text-muted-foreground">Cat: {item.category} • Rate: ₹{item.saleRate}</span>
              </div>
              <span className="text-[9px] uppercase tracking-wider font-extrabold opacity-80 bg-accent/10 text-accent px-1.5 py-0.5 rounded shrink-0">
                {item.gstPercent}% GST
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// --- VOUCHER FORM VALIDATION SCHEMA ---
export function VoucherForm({
  initialType,
  onSuccess
}: {
  initialType?: VoucherType;
  onSuccess: (voucherId: string) => void;
}) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  
  // Toggles between "voucher" (Dr/Cr journal) and "invoice" (itemized inventory bill)
  const [entryMode, setEntryMode] = useState<"voucher" | "invoice">("voucher");

  const [ledgersOptions, setLedgersOptions] = useState<Array<{id: string; name: string; group: LedgerGroup}>>([]);
  const [inventoryOptions, setInventoryOptions] = useState<Array<any>>([]);

  // --- STATE FOR AS VOUCHER MODE ---
  const [voucherType, setVoucherType] = useState<VoucherType>(initialType ?? "sales");
  const [voucherDate, setVoucherDate] = useState(new Date().toISOString().split('T')[0]);
  const [reference, setReference] = useState("");
  const [globalNarration, setGlobalNarration] = useState("");
  const [entries, setEntries] = useState<Array<{ ledgerId: string; type: "dr" | "cr"; amount: string; narration: string }>>([
    { ledgerId: "", type: "dr", amount: "0", narration: "" },
    { ledgerId: "", type: "cr", amount: "0", narration: "" },
  ]);

  // --- STATE FOR AS INVOICE MODE ---
  const [invoicePartyId, setInvoicePartyId] = useState("");
  const [invoiceSalesPurchaseId, setInvoiceSalesPurchaseId] = useState("");
  const [invoiceItems, setInvoiceItems] = useState<Array<{ inventoryItemId: string; quantity: string; rate: string; amount: string; narration: string }>>([
    { inventoryItemId: "", quantity: "1", rate: "0", amount: "0", narration: "" }
  ]);
  const [invoiceTaxLedgerId, setInvoiceTaxLedgerId] = useState("");

  // Transport details (For challan / invoice)
  const [transportName, setTransportName] = useState("");
  const [lrNumber, setLrNumber] = useState("");
  const [dispatchDate, setDispatchDate] = useState("");
  const [freightAmount, setFreightAmount] = useState("");

  // Fetch ledgers and items for autocomplete dropdowns
  useEffect(() => {
    async function fetchData() {
      try {
        const [ledgersData, itemsData] = await Promise.all([
          getLedgersOptions(),
          getInventoryItemsOptions()
        ]);
        setLedgersOptions(ledgersData as any);
        setInventoryOptions(itemsData as any);

        // Pre-fill default Sales/Purchase ledger if available
        const defaultSalesLedger = ledgersData.find(l => l.group === "sales");
        const defaultPurchaseLedger = ledgersData.find(l => l.group === "purchase");
        if (voucherType === "sales" && defaultSalesLedger) {
          setInvoiceSalesPurchaseId(defaultSalesLedger.id);
        } else if (voucherType === "purchase" && defaultPurchaseLedger) {
          setInvoiceSalesPurchaseId(defaultPurchaseLedger.id);
        }

        // Pre-fill active tax ledger if available
        const defaultTax = ledgersData.find(l => l.group === "duties_taxes");
        if (defaultTax) {
          setInvoiceTaxLedgerId(defaultTax.id);
        }
      } catch (err) {
        console.error("Failed to load options database:", err);
      }
    }
    fetchData();
  }, [voucherType]);

  // Sync default entry types based on Voucher Category
  useEffect(() => {
    if (entryMode === "voucher") {
      const type = voucherType;
      if (type === "receipt") {
        setEntries([
          { ledgerId: "", type: "dr", amount: "0", narration: "" }, // Cash/Bank received
          { ledgerId: "", type: "cr", amount: "0", narration: "" }, // Debtor credit
        ]);
      } else if (type === "payment") {
        setEntries([
          { ledgerId: "", type: "dr", amount: "0", narration: "" }, // Creditor debit
          { ledgerId: "", type: "cr", amount: "0", narration: "" }, // Cash/Bank paid
        ]);
      } else {
        setEntries([
          { ledgerId: "", type: "dr", amount: "0", narration: "" },
          { ledgerId: "", type: "cr", amount: "0", narration: "" },
        ]);
      }
    }
  }, [voucherType, entryMode]);

  // Alt+A keyboard listener to dynamically append items or ledger rows
  useEffect(() => {
    const handleShortcuts = (e: KeyboardEvent) => {
      if (e.altKey && e.key.toLowerCase() === "a") {
        e.preventDefault();
        if (entryMode === "voucher") {
          setEntries(prev => [...prev, { ledgerId: "", type: "cr", amount: "0", narration: "" }]);
        } else {
          setInvoiceItems(prev => [...prev, { inventoryItemId: "", quantity: "1", rate: "0", amount: "0", narration: "" }]);
        }
      }
    };
    window.addEventListener("keydown", handleShortcuts);
    return () => window.removeEventListener("keydown", handleShortcuts);
  }, [entryMode]);

  // --- AS VOUCHER MODE MATHS ---
  const totalDebits = entries.reduce((sum, item) => item.type === "dr" ? sum + (parseFloat(item.amount) || 0) : sum, 0);
  const totalCredits = entries.reduce((sum, item) => item.type === "cr" ? sum + (parseFloat(item.amount) || 0) : sum, 0);
  const voucherDifference = Math.abs(totalDebits - totalCredits);
  const isVoucherBalanced = voucherDifference === 0 && totalDebits > 0;

  // --- AS INVOICE MODE MATHS ---
  const invoiceSubtotal = invoiceItems.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
  
  // Calculate dynamic tax additions (default is 18% if tax ledger is active)
  const taxPercent = 18;
  const invoiceTax = invoiceTaxLedgerId ? (invoiceSubtotal * taxPercent) / 100 : 0;
  const invoiceGrandTotal = invoiceSubtotal + invoiceTax;

  const updateVoucherEntryRow = (index: number, field: string, val: any) => {
    setEntries(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: val };
      return copy;
    });
  };

  const addVoucherRow = () => {
    setEntries(prev => {
      const d = prev.reduce((sum, item) => item.type === "dr" ? sum + (parseFloat(item.amount) || 0) : sum, 0);
      const c = prev.reduce((sum, item) => item.type === "cr" ? sum + (parseFloat(item.amount) || 0) : sum, 0);
      const diff = Math.abs(d - c);
      const defaultType = d > c ? "cr" : "dr";
      const defaultAmount = diff > 0 ? diff.toString() : "0";
      return [...prev, { ledgerId: "", type: defaultType, amount: defaultAmount, narration: "" }];
    });
  };

  const removeVoucherRow = (index: number) => {
    setEntries(prev => prev.filter((_, idx) => idx !== index));
  };

  // --- INVOICE GRID BUILDERS ---
  const updateInvoiceRow = (index: number, field: string, val: any) => {
    setInvoiceItems(prev => {
      const copy = [...prev];
      const item = { ...copy[index], [field]: val };
      
      // Auto-compute total amount on rate/qty change
      if (field === "quantity" || field === "rate") {
        const qty = parseFloat(field === "quantity" ? val : item.quantity) || 0;
        const rate = parseFloat(field === "rate" ? val : item.rate) || 0;
        item.amount = (qty * rate).toString();
      }
      
      copy[index] = item;
      return copy;
    });
  };

  const handleInvoiceItemSelect = (index: number, selectedItem: any) => {
    setInvoiceItems(prev => {
      const copy = [...prev];
      const rateVal = voucherType === "sales" ? selectedItem.saleRate : selectedItem.purchaseRate;
      copy[index] = {
        ...copy[index],
        inventoryItemId: selectedItem.id,
        rate: rateVal.toString(),
        amount: (parseFloat(copy[index].quantity) * rateVal).toString()
      };
      return copy;
    });
  };

  const addInvoiceRow = () => {
    setInvoiceItems(prev => [...prev, { inventoryItemId: "", quantity: "1", rate: "0", amount: "0", narration: "" }]);
  };

  const removeInvoiceRow = (index: number) => {
    setInvoiceItems(prev => prev.filter((_, idx) => idx !== index));
  };

  // --- SUBMIT COMPILER ---
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let compiledEntries = [];

    if (entryMode === "voucher") {
      if (!isVoucherBalanced) {
        toast({
          title: "Voucher Unbalanced",
          description: "Total Debits must equal Total Credits before saving.",
          variant: "destructive",
        });
        return;
      }
      compiledEntries = entries.map(item => ({
        ledgerId: item.ledgerId,
        type: item.type,
        amount: parseFloat(item.amount),
        narration: item.narration || undefined
      }));
    } else {
      // Compile Invoice Mode into double entry lines
      if (!invoicePartyId) {
        toast({
          title: "Missing Party A/c",
          description: "Please select the buyer/supplier Party A/c Name.",
          variant: "destructive",
        });
        return;
      }
      if (!invoiceSalesPurchaseId) {
        toast({
          title: "Missing Ledger A/c",
          description: "Please select the Sales/Purchase Ledger Account.",
          variant: "destructive",
        });
        return;
      }

      const isSales = voucherType === "sales" || voucherType === "challan";

      // 1. Party Account Entry
      compiledEntries.push({
        ledgerId: invoicePartyId,
        type: isSales ? "dr" as const : "cr" as const,
        amount: invoiceGrandTotal,
        narration: "Invoice party posting"
      });

      // 2. Sales/Purchase Ledger line for EACH item to enable stock movement calculation
      invoiceItems.forEach(item => {
        if (!item.inventoryItemId) return;
        compiledEntries.push({
          ledgerId: invoiceSalesPurchaseId,
          type: isSales ? "cr" as const : "dr" as const,
          amount: parseFloat(item.amount),
          inventoryItemId: item.inventoryItemId,
          quantity: parseFloat(item.quantity),
          rate: parseFloat(item.rate),
          narration: item.narration || undefined
        });
      });

      // 3. GST Duties Entry (if applicable)
      if (invoiceTaxLedgerId && invoiceTax > 0) {
        compiledEntries.push({
          ledgerId: invoiceTaxLedgerId,
          type: isSales ? "cr" as const : "dr" as const,
          amount: invoiceTax,
          narration: `${taxPercent}% CGST/SGST collected`
        });
      }
    }

    setIsLoading(true);
    try {
      const input = {
        type: voucherType,
        date: new Date(voucherDate).getTime(),
        narration: globalNarration,
        reference: reference || undefined,
        entries: compiledEntries,
        transportName: transportName || undefined,
        lrNumber: lrNumber || undefined,
        dispatchDate: dispatchDate ? new Date(dispatchDate).getTime() : undefined,
        freightAmount: freightAmount ? parseFloat(freightAmount) : undefined,
      };

      const result = await createVoucher(input as any);

      if (result.success) {
        toast({
          title: "Voucher Posted Successfully",
          description: `Voucher filed into system.`,
        });
        onSuccess(result.voucherId);
        
        // Reset states
        setReference("");
        setGlobalNarration("");
        setEntries([
          { ledgerId: "", type: "dr", amount: "0", narration: "" },
          { ledgerId: "", type: "cr", amount: "0", narration: "" },
        ]);
        setInvoiceItems([
          { inventoryItemId: "", quantity: "1", rate: "0", amount: "0", narration: "" }
        ]);
        setInvoicePartyId("");
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      toast({
        title: "Error Filing Transaction",
        description: err instanceof Error ? err.message : "Something went wrong during database transaction",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-5xl mx-auto border border-border/80 bg-card/65 dark:bg-card/45 backdrop-blur-2xl shadow-2xl rounded-2xl overflow-hidden font-sans">
      <CardHeader className="bg-gradient-to-r from-accent/5 via-transparent to-accent/5 border-b border-border/60 py-5 px-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="text-lg font-extrabold flex items-center gap-2 text-primary">
              <Sparkles className="w-5 h-5 text-accent animate-pulse" />
              Professional Business Class Voucher Entry
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground mt-0.5">
              Dual-mode checkout controller. Type for smart autocompletions or use <kbd className="text-[10px] bg-muted px-1.5 py-0.5 rounded font-mono font-semibold">Alt+A</kbd> to append.
            </CardDescription>
          </div>

          {/* Mode Switcher Pill */}
          <div className="flex items-center gap-1.5 bg-muted/60 p-1 rounded-xl border border-border/40 shrink-0 select-none">
            <button
              type="button"
              onClick={() => setEntryMode("voucher")}
              className={cn(
                "px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer",
                entryMode === "voucher"
                  ? "bg-accent text-accent-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              As Voucher (Double-Entry)
            </button>
            <button
              type="button"
              disabled={voucherType !== "sales" && voucherType !== "purchase"}
              onClick={() => setEntryMode("invoice")}
              className={cn(
                "px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1 disabled:opacity-40 disabled:pointer-events-none cursor-pointer",
                entryMode === "invoice"
                  ? "bg-accent text-accent-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              As Invoice (Billing / Items)
            </button>
          </div>
        </div>
      </CardHeader>

      <form onSubmit={handleFormSubmit} className="space-y-5 p-6">
        
        {/* GLOBAL HEADER METADATA */}
        <div className="grid gap-4 grid-cols-1 md:grid-cols-4 bg-muted/20 p-4 rounded-xl border border-border/50">
          <div>
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Voucher Type</label>
            <Select
              onValueChange={(val: any) => {
                setVoucherType(val);
                // Return to voucher mode if other types are selected (invoice only supports sales/purchase)
                if (val !== "sales" && val !== "purchase") {
                  setEntryMode("voucher");
                }
              }}
              value={voucherType}
              disabled={!!initialType}
            >
              <SelectTrigger className="w-full h-9 bg-background/55 border-border/70 rounded-lg text-xs font-bold">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="sales" className="text-xs font-semibold">Sales Voucher (F8)</SelectItem>
                <SelectItem value="purchase" className="text-xs font-semibold">Purchase Voucher (F9)</SelectItem>
                <SelectItem value="payment" className="text-xs font-semibold">Payment Voucher (F5)</SelectItem>
                <SelectItem value="receipt" className="text-xs font-semibold">Receipt Voucher (F6)</SelectItem>
                <SelectItem value="contra" className="text-xs font-semibold">Contra Voucher (F4)</SelectItem>
                <SelectItem value="journal" className="text-xs font-semibold">Journal Voucher (F7)</SelectItem>
                <SelectItem value="challan" className="text-xs font-semibold">Delivery Challan (F10)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Date</label>
            <Input
              type="date"
              value={voucherDate}
              onChange={(e) => setVoucherDate(e.target.value)}
              className="h-9 bg-background/55 border-border/70 rounded-lg text-xs font-semibold"
            />
          </div>

          <div className="md:col-span-2">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Ref / Invoice Number</label>
            <Input
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="e.g. SRH/2026-27/SAL-091"
              className="h-9 bg-background/55 border-border/70 rounded-lg text-xs font-semibold"
            />
          </div>
        </div>

        {/* AS VOUCHER MODE - DOUBLE-ENTRY TABLE */}
        {entryMode === "voucher" && (
          <div className="border border-border/70 rounded-xl bg-background/30 overflow-hidden shadow-inner">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-border/70 bg-muted/40 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    <th className="px-3 py-2.5 w-[85px]">Dr / Cr</th>
                    <th className="px-3 py-2.5">Ledger Account Name (Autocomplete)</th>
                    <th className="px-3 py-2.5 w-[140px] text-right">Debit (₹)</th>
                    <th className="px-3 py-2.5 w-[140px] text-right">Credit (₹)</th>
                    <th className="px-3 py-2.5 w-[200px]">Narration</th>
                    <th className="px-3 py-2.5 w-[45px]"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/45">
                  {entries.map((item, index) => (
                    <tr key={index} className="hover:bg-muted/15 transition-colors group">
                      <td className="p-2">
                        <Select
                          onValueChange={(val: "dr" | "cr") => {
                            updateVoucherEntryRow(index, "type", val);
                            updateVoucherEntryRow(index, "amount", "0");
                          }}
                          value={item.type}
                        >
                          <SelectTrigger className="h-9 font-bold bg-background/55 border-border/70 rounded-lg text-xs">
                            <SelectValue placeholder="Dr/Cr" />
                          </SelectTrigger>
                          <SelectContent className="rounded-lg">
                            <SelectItem value="dr" className="font-bold text-emerald-600">Dr</SelectItem>
                            <SelectItem value="cr" className="font-bold text-rose-600">Cr</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>

                      <td className="p-2">
                        <PartyAutocomplete
                          value={item.ledgerId}
                          onChange={(val) => updateVoucherEntryRow(index, "ledgerId", val)}
                          ledgers={ledgersOptions}
                          placeholder="Type party ledger accounts..."
                        />
                      </td>

                      <td className="p-2">
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          disabled={item.type !== "dr"}
                          value={item.amount}
                          onChange={(e) => updateVoucherEntryRow(index, "amount", e.target.value)}
                          className="h-9 text-right font-mono font-bold text-xs bg-background/50 border-border/70 rounded-lg text-emerald-600 disabled:opacity-30 disabled:bg-transparent"
                        />
                      </td>

                      <td className="p-2">
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          disabled={item.type !== "cr"}
                          value={item.amount}
                          onChange={(e) => updateVoucherEntryRow(index, "amount", e.target.value)}
                          className="h-9 text-right font-mono font-bold text-xs bg-background/50 border-border/70 rounded-lg text-rose-600 disabled:opacity-30 disabled:bg-transparent"
                        />
                      </td>

                      <td className="p-2">
                        <Input
                          value={item.narration}
                          onChange={(e) => updateVoucherEntryRow(index, "narration", e.target.value)}
                          placeholder="Entry specific remarks..."
                          className="h-9 bg-background/55 border-border/70 rounded-lg text-xs"
                        />
                      </td>

                      <td className="p-2 text-center">
                        {entries.length > 2 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeVoucherRow(index)}
                            className="h-8 w-8 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between p-4 border-t border-border/60 bg-muted/10 gap-4">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addVoucherRow}
                className="flex items-center gap-1 border-border/70 rounded-lg text-xs font-bold bg-background h-8"
              >
                <Plus className="w-3.5 h-3.5 text-accent" />
                Add Ledger Line (Alt+A)
              </Button>

              <div className="flex items-center gap-6 font-mono text-xs font-bold text-muted-foreground select-none">
                <div className="text-right">
                  <span className="block text-[9px] opacity-70">TOTAL DEBITS</span>
                  <span className="text-sm font-extrabold text-emerald-600">₹{totalDebits.toFixed(2)}</span>
                </div>
                <div className="text-right border-l pl-6 border-border/70">
                  <span className="block text-[9px] opacity-70">TOTAL CREDITS</span>
                  <span className="text-sm font-extrabold text-rose-600">₹{totalCredits.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* AS INVOICE MODE - ITEM BILLING INTERFACE */}
        {entryMode === "invoice" && (
          <div className="space-y-4">
            
            {/* PARTY SELECT & INVOICE LEDGERS SECTION */}
            <div className="grid gap-4 grid-cols-1 md:grid-cols-3 bg-accent/5 p-4 rounded-xl border border-accent/25">
              <div>
                <label className="text-[10px] font-bold text-accent uppercase tracking-wider block mb-1">
                  Party Account Name
                </label>
                <PartyAutocomplete
                  value={invoicePartyId}
                  onChange={setInvoicePartyId}
                  ledgers={ledgersOptions.filter(l => l.group === "sundry_debtors" || l.group === "sundry_creditors" || l.group === "bank" || l.group === "cash")}
                  placeholder="Select buyer or supplier party..."
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-accent uppercase tracking-wider block mb-1">
                  {voucherType === "sales" ? "Sales Account Ledger" : "Purchase Account Ledger"}
                </label>
                <Select
                  onValueChange={setInvoiceSalesPurchaseId}
                  value={invoiceSalesPurchaseId}
                >
                  <SelectTrigger className="w-full h-9 bg-background border-border/80 rounded-lg text-xs font-bold">
                    <SelectValue placeholder="Select bookkeeping ledger" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {ledgersOptions
                      .filter(l => voucherType === "sales" ? l.group === "sales" : l.group === "purchase")
                      .map(l => (
                        <SelectItem key={l.id} value={l.id} className="text-xs font-semibold">
                          {l.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-accent uppercase tracking-wider block mb-1">
                  Duties & Taxes Ledger
                </label>
                <Select
                  onValueChange={setInvoiceTaxLedgerId}
                  value={invoiceTaxLedgerId}
                >
                  <SelectTrigger className="w-full h-9 bg-background border-border/80 rounded-lg text-xs font-bold">
                    <SelectValue placeholder="No Duties/Taxes" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="none" className="text-xs font-semibold">No tax posting</SelectItem>
                    {ledgersOptions
                      .filter(l => l.group === "duties_taxes")
                      .map(l => (
                        <SelectItem key={l.id} value={l.id} className="text-xs font-semibold">
                          {l.name} (CGST/SGST 18%)
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* ITEMIZATION TABLE */}
            <div className="border border-border/70 rounded-xl bg-background/30 overflow-hidden shadow-inner">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="border-b border-border/70 bg-muted/40 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      <th className="px-3 py-2.5">Saree Stock Item (Autocomplete)</th>
                      <th className="px-3 py-2.5 w-[100px] text-center">Qty</th>
                      <th className="px-3 py-2.5 w-[130px] text-right">Rate (₹)</th>
                      <th className="px-3 py-2.5 w-[140px] text-right">Amount (₹)</th>
                      <th className="px-3 py-2.5 w-[200px]">Description/Narration</th>
                      <th className="px-3 py-2.5 w-[45px]"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/45">
                    {invoiceItems.map((item, index) => (
                      <tr key={index} className="hover:bg-muted/15 transition-colors group">
                        <td className="p-2">
                          <ItemAutocomplete
                            value={item.inventoryItemId}
                            onChange={(val) => updateInvoiceRow(index, "inventoryItemId", val)}
                            items={inventoryOptions}
                            onSelectCallback={(selected) => handleInvoiceItemSelect(index, selected)}
                            placeholder="Type saree stock item name..."
                          />
                        </td>

                        <td className="p-2">
                          <Input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateInvoiceRow(index, "quantity", e.target.value)}
                            className="h-9 text-center font-bold bg-background/55 border-border/70 rounded-lg text-xs"
                          />
                        </td>

                        <td className="p-2">
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={item.rate}
                            onChange={(e) => updateInvoiceRow(index, "rate", e.target.value)}
                            className="h-9 text-right font-mono font-bold bg-background/55 border-border/70 rounded-lg text-xs text-primary"
                          />
                        </td>

                        <td className="p-2">
                          <Input
                            type="number"
                            readOnly
                            value={parseFloat(item.amount).toFixed(2)}
                            className="h-9 text-right font-mono font-bold bg-muted/30 border-border/50 rounded-lg text-xs text-muted-foreground select-none"
                          />
                        </td>

                        <td className="p-2">
                          <Input
                            value={item.narration}
                            onChange={(e) => updateInvoiceRow(index, "narration", e.target.value)}
                            placeholder="Narration per item line..."
                            className="h-9 bg-background/55 border-border/70 rounded-lg text-xs"
                          />
                        </td>

                        <td className="p-2 text-center">
                          {invoiceItems.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeInvoiceRow(index)}
                              className="h-8 w-8 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between p-4 border-t border-border/60 bg-muted/10 gap-4">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addInvoiceRow}
                  className="flex items-center gap-1 border-border/70 rounded-lg text-xs font-bold bg-background h-8"
                >
                  <Plus className="w-3.5 h-3.5 text-accent" />
                  Add Stock Item Row (Alt+A)
                </Button>

                {/* DYNAMIC BILL INVOICE TOTALS */}
                <div className="flex items-center gap-6 font-mono text-xs font-bold text-muted-foreground select-none">
                  <div className="text-right">
                    <span className="block text-[9px] opacity-70">SUBTOTAL</span>
                    <span className="text-sm font-extrabold text-primary">₹{invoiceSubtotal.toFixed(2)}</span>
                  </div>
                  {invoiceTaxLedgerId && invoiceTax > 0 && (
                    <div className="text-right border-l pl-6 border-border/70">
                      <span className="block text-[9px] opacity-70">18% GST ADDITIONS</span>
                      <span className="text-sm font-extrabold text-accent">₹{invoiceTax.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="text-right border-l pl-6 border-border/70">
                    <span className="block text-[9px] opacity-70">GRAND TOTAL</span>
                    <span className="text-base font-black text-emerald-600">₹{invoiceGrandTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CHALLAN / TRANSPORT OVERLAY DETAILS */}
        {voucherType === "challan" && (
          <div className="bg-accent/5 p-4 rounded-xl border border-accent/20 space-y-3">
            <h3 className="text-xs font-bold text-accent flex items-center gap-1.5">
              <Layers className="w-4 h-4" /> Transport & Challan Dispatch Details
            </h3>
            <div className="grid gap-4 md:grid-cols-4">
              <div>
                <label className="text-[9px] uppercase font-bold text-muted-foreground block mb-1">Carrier/Transport</label>
                <Input
                  value={transportName}
                  onChange={(e) => setTransportName(e.target.value)}
                  placeholder="Transport service"
                  className="h-9 bg-background rounded-lg border-border/80 text-xs font-semibold"
                />
              </div>
              <div>
                <label className="text-[9px] uppercase font-bold text-muted-foreground block mb-1">LR / Bilty Number</label>
                <Input
                  value={lrNumber}
                  onChange={(e) => setLrNumber(e.target.value)}
                  placeholder="Bilty no."
                  className="h-9 bg-background rounded-lg border-border/80 text-xs font-semibold"
                />
              </div>
              <div>
                <label className="text-[9px] uppercase font-bold text-muted-foreground block mb-1">Dispatch Date</label>
                <Input
                  type="date"
                  value={dispatchDate}
                  onChange={(e) => setDispatchDate(e.target.value)}
                  className="h-9 bg-background rounded-lg border-border/80 text-xs font-semibold"
                />
              </div>
              <div>
                <label className="text-[9px] uppercase font-bold text-muted-foreground block mb-1">Freight Charges (₹)</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={freightAmount}
                  onChange={(e) => setFreightAmount(e.target.value)}
                  placeholder="0.00"
                  className="h-9 bg-background rounded-lg border-border/80 text-xs font-semibold"
                />
              </div>
            </div>
          </div>
        )}

        {/* DOUBLE ENTRY BALANCE TRACKER STATUS BAR */}
        {entryMode === "voucher" && (
          <div className="relative mt-2">
            <div
              className={cn(
                "group relative overflow-hidden rounded-2xl border p-4.5 transition-all duration-500 select-none shadow-xl",
                isVoucherBalanced
                  ? "border-emerald-500/30 bg-emerald-950/20 dark:bg-emerald-950/10 backdrop-blur-2xl text-emerald-800 dark:text-emerald-300 shadow-[0_0_25px_-5px_rgba(16,185,129,0.15)] dark:shadow-[0_0_25px_-5px_rgba(16,185,129,0.08)]"
                  : "border-red-500/30 bg-red-950/20 dark:bg-red-950/10 backdrop-blur-2xl text-red-800 dark:text-red-300 shadow-[0_0_25px_-5px_rgba(239,68,68,0.15)] dark:shadow-[0_0_25px_-5px_rgba(239,68,68,0.08)]"
              )}
            >
              {/* Backglow Orb Effect */}
              <div
                className={cn(
                  "absolute -right-12 -top-12 w-32 h-32 rounded-full filter blur-[40px] opacity-25 dark:opacity-15 transition-colors duration-500 pointer-events-none",
                  isVoucherBalanced ? "bg-emerald-500" : "bg-red-500"
                )}
              />

              <div className="flex flex-col md:flex-row items-center justify-between gap-4 relative z-10">
                
                {/* Left Side: Pulse Orb and Label */}
                <div className="flex items-center gap-3.5 w-full md:w-auto">
                  {/* Floating 3D Glowing Orb */}
                  <div className="relative shrink-0 flex items-center justify-center">
                    <div
                      className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-white font-extrabold shadow-md transform group-hover:scale-110 transition-transform duration-300",
                        isVoucherBalanced
                          ? "bg-linear-to-tr from-emerald-500 to-teal-400 shadow-emerald-500/35"
                          : "bg-linear-to-tr from-red-500 to-rose-400 shadow-red-500/35 animate-pulse"
                      )}
                    >
                      {isVoucherBalanced ? (
                        <CheckCircle2 className="w-4 h-4 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.2)]" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.2)]" />
                      )}
                    </div>
                    {/* Ring Pulse animation around Orb */}
                    <span
                      className={cn(
                        "absolute -inset-1 rounded-full animate-ping opacity-25 pointer-events-none",
                        isVoucherBalanced ? "bg-emerald-500" : "bg-red-500"
                      )}
                    />
                  </div>

                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] font-black uppercase tracking-wider opacity-60">
                      Ledger Verification Desk
                    </span>
                    <span className="text-xs md:text-sm font-black tracking-tight leading-tight">
                      {isVoucherBalanced
                        ? "Perfect Double-Entry Balance Achieved!"
                        : `Voucher Out of Balance (Diff: ₹${voucherDifference.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })})`}
                    </span>
                  </div>
                </div>

                {/* Right Side: Quick Math Visual Ledger Meter */}
                <div className="flex items-center gap-4.5 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 border-border/50 pt-3 md:pt-0">
                  <div className="flex items-center gap-4 text-right font-mono">
                    <div>
                      <span className="block text-[8px] font-black uppercase tracking-widest opacity-60">TOTAL DR</span>
                      <span className="text-xs font-extrabold text-foreground">
                        ₹{totalDebits.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="h-6 w-[1px] bg-border/80 self-center" />
                    <div>
                      <span className="block text-[8px] font-black uppercase tracking-widest opacity-60">TOTAL CR</span>
                      <span className="text-xs font-extrabold text-foreground">
                        ₹{totalCredits.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>

                  {/* Micro balance slide indicator */}
                  <div className="hidden lg:block w-36 h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden relative border border-border/50 shadow-inner">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-500",
                        isVoucherBalanced 
                          ? "w-full bg-emerald-500" 
                          : "bg-red-500"
                      )}
                      style={{
                        width: isVoucherBalanced 
                          ? "100%" 
                          : `${Math.max(10, Math.min(90, (totalDebits / (totalDebits + totalCredits || 1)) * 100))}%`
                      }}
                    />
                  </div>
                </div>

              </div>

              {/* Collapsed breakdown panel (auto-expands on group hover) */}
              <div className="h-0 opacity-0 overflow-hidden group-hover:h-auto group-hover:opacity-100 group-hover:mt-3.5 transition-all duration-300 border-t border-dashed border-border/60 pt-3 flex flex-col sm:flex-row justify-between gap-4 text-[10px] text-muted-foreground font-semibold">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                  <span>Lines: <strong className="text-foreground">{entries.filter(e => e.ledgerId).length} posted</strong></span>
                  <span className="opacity-40">•</span>
                  <span>Empty Lines: <strong className="text-foreground">{entries.filter(e => !e.ledgerId).length}</strong></span>
                  <span className="opacity-40">•</span>
                  <span>Rule: <span className="underline decoration-accent underline-offset-2">Debit Sum === Credit Sum</span></span>
                </div>
                <div>
                  Status:{" "}
                  <span className={cn("font-bold uppercase tracking-wider", isVoucherBalanced ? "text-emerald-500" : "text-red-500 animate-pulse")}>
                    {isVoucherBalanced ? "Postable" : "Unbalanced"}
                  </span>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* GLOBAL VOUCHER NARRATION & REMARKS */}
        <div>
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
            Global Bookkeeping Narration
          </label>
          <Textarea
            value={globalNarration}
            onChange={(e) => setGlobalNarration(e.target.value)}
            placeholder="Write general bookkeeping narration notes or ledger details here..."
            rows={2}
            className="bg-background/55 border-border/75 hover:border-border rounded-xl text-xs resize-none"
          />
        </div>

        {/* FORM FOOTER CONTROLS */}
        <div className="flex items-center gap-4 border-t border-border/40 pt-5">
          <Button
            type="submit"
            disabled={isLoading || (entryMode === "voucher" && !isVoucherBalanced)}
            className="rounded-xl flex items-center gap-1.5 h-10 px-5 font-bold shadow-lg text-xs"
          >
            {isLoading ? "Posting to database..." : "Post Transaction (Enter)"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/vouchers")}
            className="rounded-xl border-border/60 h-10 px-5 font-semibold bg-background/50 text-xs"
          >
            Discard
          </Button>
        </div>
      </form>
    </Card>
  );
}
