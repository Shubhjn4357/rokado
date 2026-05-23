"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Search,
  Printer,
  CreditCard,
  Banknote,
  Trash2,
  Plus,
  Minus,
  User,
  DollarSign,
  AlertTriangle,
  Check,
  ArrowRight,
  ChevronDown,
  LayoutGrid,
  ShoppingBag,
  ArrowLeft,
  Loader2,
  X,
} from "lucide-react";
import { type inventoryItems, type InferSelectModel } from "@/lib/database";
import { savePosBill, getLedgerDetails, getDebtorsOptions } from "@/app/(erp)/pos/actions";
import { toast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { InvoiceCustomTemplates, type InvoicePrintData } from "@/components/print/invoice-custom-templates";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";

type InventoryItem = InferSelectModel<typeof inventoryItems>;

interface CartItem extends InventoryItem {
  cartQuantity: number;
  discountPercent: number; // per-item discount %
}

// --- POS CUSTOMER AUTOCOMPLETE ---
interface POSCustomerAutocompleteProps {
  value: string | null;
  onChange: (value: string | null) => void;
  options: Array<{ id: string; name: string; openingBalance: number }>;
  placeholder?: string;
}

function POSCustomerAutocomplete({
  value,
  onChange,
  options,
  placeholder = "Search customer...",
}: POSCustomerAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const selected = options.find((o) => o.id === value);
    if (selected) {
      setQuery(selected.name);
    } else if (value === null) {
      setQuery("");
    }
  }, [value, options]);

  const filtered = options.filter((o) =>
    o.name.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        const selected = options.find((o) => o.id === value);
        setQuery(selected ? selected.name : "");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [value, options]);

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
          onChange(filtered[highlightedIndex].id);
          setIsOpen(false);
        }
        break;
      case "Escape":
        e.preventDefault();
        setIsOpen(false);
        const selected = options.find((o) => o.id === value);
        setQuery(selected ? selected.name : "");
        break;
    }
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <Input
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setIsOpen(true);
          setHighlightedIndex(0);
          if (!e.target.value) {
            onChange(null);
          }
        }}
        onFocus={() => setIsOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="w-full bg-background pr-8 font-medium h-10 border-border/60 rounded-xl"
      />
      <div className="absolute right-3 top-3.5 flex items-center pointer-events-none text-muted-foreground/60">
        <Search className="w-3.5 h-3.5" />
      </div>

      {isOpen && filtered.length > 0 && (
        <div className="absolute left-0 right-0 z-50 mt-1 max-h-60 overflow-y-auto rounded-xl border border-border bg-popover text-popover-foreground shadow-2xl py-1 animate-in fade-in-50 duration-700">
          {filtered.map((item, idx) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                onChange(item.id);
                setIsOpen(false);
              }}
              className={cn(
                "w-full flex items-center justify-between px-4 py-2 text-left text-sm transition-colors",
                idx === highlightedIndex ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted/50"
              )}
            >
              <span>{item.name}</span>
              <span className="text-[10px] font-mono opacity-60">
                Bal: ₹{item.openingBalance.toFixed(2)}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// --- MAIN POS BILLING CLIENT CLIENT COMPONENT ---
export function POSBillingClient({ initialInventory }: { initialInventory: InventoryItem[] }) {
  const { user, name: authName } = useAuth();
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerLedgerId, setCustomerLedgerId] = useState<string | null>(null);
  const [walkInCustomerName, setWalkInCustomerName] = useState("");
  const [billDiscountPercent, setBillDiscountPercent] = useState(0);
  const [paymentMode, setPaymentMode] = useState<"cash" | "upi" | "card" | "credit" | "split">("cash");
  const [isLoading, setIsLoading] = useState(false);
  const [debtors, setDebtors] = useState<Array<{id: string; name: string; openingBalance: number}>>([]);
  const [selectedLedgerDetails, setSelectedLedgerDetails] = useState<{id: string; name: string; creditLimit: number; outstanding: number} | null>(null);
  const [companyInfo, setCompanyInfo] = useState<{name: string; address: string; gstin: string; pan: string} | null>(null);

  // New Custom States
  const [isPrintOpen, setIsPrintOpen] = useState(false);
  const [printData, setPrintData] = useState<InvoicePrintData | null>(null);
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);

  // Consistent Random Glassmorphic Gradient Generator for Mobile Cards
  const getRandomGradient = (id: string) => {
    const gradients = [
      "from-rose-500/10 to-orange-500/10 border-rose-500/20 text-rose-700 dark:text-rose-300",
      "from-amber-500/10 to-yellow-500/10 border-amber-500/20 text-amber-700 dark:text-amber-300",
      "from-emerald-500/10 to-teal-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-300",
      "from-blue-500/10 to-indigo-500/10 border-blue-500/20 text-blue-700 dark:text-blue-300",
      "from-violet-500/10 to-purple-500/10 border-violet-500/20 text-violet-700 dark:text-violet-300",
      "from-pink-500/10 to-rose-500/10 border-pink-500/20 text-pink-700 dark:text-pink-300",
    ];
    let sum = 0;
    for (let i = 0; i < id.length; i++) sum += id.charCodeAt(i);
    return gradients[sum % gradients.length];
  };

  // Maps item color dynamically to visual color gradient backgrounds
  const getColorGradient = (color: string | null, itemId: string) => {
    if (!color) return `from-slate-500/5 to-slate-600/5 border-slate-500/20 text-slate-700 dark:text-slate-300`;
    
    const clr = color.toLowerCase();
    if (clr.includes("red") || clr.includes("rose") || clr.includes("ruby")) {
      return "from-red-500/10 to-rose-500/10 border-red-500/30 text-red-700 dark:text-red-300";
    }
    if (clr.includes("green") || clr.includes("emerald") || clr.includes("teal")) {
      return "from-emerald-500/10 to-teal-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300";
    }
    if (clr.includes("yellow") || clr.includes("mustard") || clr.includes("gold") || clr.includes("sand")) {
      return "from-amber-500/10 to-yellow-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300";
    }
    if (clr.includes("orange") || clr.includes("saffron") || clr.includes("walnut")) {
      return "from-orange-500/10 to-red-500/10 border-orange-500/30 text-orange-700 dark:text-orange-300";
    }
    if (clr.includes("blue") || clr.includes("peacock") || clr.includes("metallic")) {
      return "from-blue-500/10 to-indigo-500/10 border-blue-500/30 text-blue-700 dark:text-blue-300";
    }
    if (clr.includes("purple") || clr.includes("violet") || clr.includes("magenta") || clr.includes("pink")) {
      return "from-violet-500/10 to-purple-500/10 border-violet-500/30 text-violet-700 dark:text-violet-300";
    }
    if (clr.includes("black") || clr.includes("charcoal") || clr.includes("midnight") || clr.includes("piano")) {
      return "from-zinc-800/10 to-slate-900/15 border-zinc-700/25 text-zinc-800 dark:text-zinc-200";
    }
    if (clr.includes("grey") || clr.includes("gray") || clr.includes("titanium") || clr.includes("granite") || clr.includes("stone")) {
      return "from-slate-400/10 to-zinc-500/10 border-slate-400/25 text-slate-700 dark:text-slate-300";
    }
    if (clr.includes("white") || clr.includes("ivory") || clr.includes("silver") || clr.includes("pastel")) {
      return "from-slate-100/20 to-zinc-200/20 border-slate-300/30 text-slate-700 dark:text-slate-300";
    }
    
    // Fallback: use hash-based gradient
    return getRandomGradient(itemId);
  };

  // Indian Currency Words Converter
  function numberToWords(num: number): string {
    const a = [
      "", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten",
      "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"
    ];
    const b = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "early", "ninety"];

    if (num === 0) return "zero";

    const parse = (n: number): string => {
      if (n < 20) return a[n];
      if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + a[n % 10] : "");
      return a[Math.floor(n / 100)] + " hundred" + (n % 100 !== 0 ? " and " + parse(n % 100) : "");
    };

    let words = "";
    let integerPart = Math.floor(num);

    if (integerPart >= 10000000) {
      words += parse(Math.floor(integerPart / 10000000)) + " crore ";
      integerPart %= 10000000;
    }
    if (integerPart >= 100000) {
      words += parse(Math.floor(integerPart / 100000)) + " lakh ";
      integerPart %= 100000;
    }
    if (integerPart >= 1000) {
      words += parse(Math.floor(integerPart / 1000)) + " thousand ";
      integerPart %= 1000;
    }
    if (integerPart > 0) {
      words += parse(integerPart);
    }

    return words.trim() + " rupees";
  }

  // Fetch debtors ledgers
  useEffect(() => {
    async function fetchDebtors() {
      const data = await getDebtorsOptions();
      setDebtors(data as any);
    }
    fetchDebtors();
  }, []);

  // Fetch company settings for print data
  useEffect(() => {
    async function fetchCompanyInfo() {
      try {
        const { getSettings } = await import("@/app/(erp)/settings/actions");
        const settings = await getSettings();
        if (settings?.companyInfo) {
          setCompanyInfo({
            name: settings.companyInfo.name || "My Business",
            address: [settings.companyInfo.address, settings.companyInfo.city, settings.companyInfo.state].filter(Boolean).join(", "),
            gstin: settings.companyInfo.gstin || "",
            pan: settings.companyInfo.pan || "",
          });
        }
      } catch {
        // ignore — fallback values used
      }
    }
    fetchCompanyInfo();
  }, []);

  // Fetch ledger outstanding and credit limits
  useEffect(() => {
    const fetchDetails = async () => {
      if (customerLedgerId) {
        const details = await getLedgerDetails(customerLedgerId);
        if (details) {
          setSelectedLedgerDetails(details);
        }
      } else {
        setSelectedLedgerDetails(null);
      }
    };
    fetchDetails();
  }, [customerLedgerId]);

  const filteredInventory = initialInventory.filter(
    (item) => item.name.toLowerCase().includes(search.toLowerCase()) ||
      (item.designNo && item.designNo.toLowerCase().includes(search.toLowerCase()))
  );

  const addToCart = (item: InventoryItem) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) =>
          i.id === item.id
            ? { ...i, cartQuantity: i.cartQuantity + 1, discountPercent: i.discountPercent }
            : i
        );
      }
      return [...prev, { ...item, cartQuantity: 1, discountPercent: 0 }];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart((prev) =>
      prev.map((i) => {
        if (i.id === id) {
          const newQ = i.cartQuantity + delta;
          return { ...i, cartQuantity: newQ > 0 ? newQ : 1 };
        }
        return i;
      })
    );
  };

  const updateItemDiscount = (id: string, percent: number) => {
    setCart((prev) =>
      prev.map((i) => (i.id === id ? { ...i, discountPercent: percent } : i))
    );
  };

  const removeItem = (id: string) => {
    setCart((prev) => prev.filter((i) => i.id !== id));
  };

  const subTotal = cart.reduce((acc, item) => acc + item.saleRate * item.cartQuantity, 0);
  const totalItemDiscount = cart.reduce(
    (acc, item) => acc + (item.saleRate * item.cartQuantity * item.discountPercent) / 100,
    0
  );
  const amountAfterItemDiscount = subTotal - totalItemDiscount;
  const billDiscountAmount = (amountAfterItemDiscount * billDiscountPercent) / 100;
  const totalAmount = amountAfterItemDiscount - billDiscountAmount;

  const handleSave = async (shouldPrint: boolean) => {
    if (cart.length === 0) {
      toast({
        title: "Cart Empty",
        description: "Please add items to the cart before saving.",
        variant: "destructive",
      });
      return;
    }
    if (!customerLedgerId && !walkInCustomerName) {
      toast({
        title: "Customer Required",
        description: "Specify customer autocomplete lookup or enter walk-in guest name.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const items = cart.map((item) => ({
        inventoryItemId: item.id,
        quantity: item.cartQuantity,
        discountPercent: item.discountPercent,
        rate: item.saleRate,
      }));

      const input: any = {
        customerLedgerId: customerLedgerId || null,
        walkInCustomerName: walkInCustomerName || undefined,
        items,
        billDiscountPercent,
        paymentMode,
        narration: `POS Sale`,
      };

      const result = await savePosBill(input);

      if (result.success) {
        toast({
          title: "POS Bill Posted",
          description: shouldPrint ? "Voucher saved. Preparing print preview..." : "Voucher recorded and sales entry updated.",
        });

        if (shouldPrint) {
          // Prepare print preview details
          const printItems = cart.map((item) => ({
            name: item.name,
            quantity: item.cartQuantity,
            rate: item.saleRate,
            discountPercent: item.discountPercent,
            gstPercent: item.gstPercent,
            amount: item.saleRate * item.cartQuantity * (1 - item.discountPercent / 100),
          }));

          const subtotal = subTotal;
          const discountAmt = totalItemDiscount + billDiscountAmount;
          const taxableVal = amountAfterItemDiscount - billDiscountAmount;

          const totalGst = printItems.reduce((acc, item) => {
            const lineTaxable = item.rate * item.quantity * (1 - item.discountPercent / 100);
            return acc + (lineTaxable * item.gstPercent) / 100;
          }, 0);

          const cgstAmount = totalGst / 2;
          const sgstAmount = totalGst / 2;
          const igstAmount = 0;
          const grandTotalAmount = totalAmount;

          const activeCustomerName = customerLedgerId
            ? debtors.find(d => d.id === customerLedgerId)?.name ?? "Valued Customer"
            : walkInCustomerName || "Walk-in Guest";

          setPrintData({
            invoiceNumber: result.voucherId.slice(0, 8).toUpperCase(),
            date: Date.now(),
            customerName: activeCustomerName,
            items: printItems,
            subtotal,
            discountAmount: discountAmt,
            taxableValue: taxableVal,
            cgstAmount,
            sgstAmount,
            igstAmount,
            totalAmount: grandTotalAmount,
            amountInWords: numberToWords(grandTotalAmount),
            companyName: companyInfo?.name || "My Business",
            companyAddress: companyInfo?.address || "",
            companyGstin: companyInfo?.gstin || "",
            companyPan: companyInfo?.pan || "",
          });
          setIsPrintOpen(true);
        }

        setCart([]);
        setCustomerLedgerId(null);
        setWalkInCustomerName("");
        setBillDiscountPercent(0);
        setPaymentMode("cash");
        setIsCartDrawerOpen(false);
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      toast({
        title: "Error Saving POS",
        description: err instanceof Error ? err.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-6.5rem)] lg:h-[calc(100vh-5.5rem)] gap-4 select-none min-h-0 overflow-hidden relative">
      {/* Product List Section */}
      <Card className="flex-1 flex flex-col border-border/50 bg-card/75 shadow-xl backdrop-blur-xl rounded-3xl overflow-hidden min-h-0">
        <CardHeader className="pb-4 border-b border-border/40 shrink-0">
          <div className="relative">
            <Search className="absolute left-4 top-3.5 w-5 h-5 text-muted-foreground/60 animate-pulse" />
            <Input
              placeholder="Search  or scan barcode..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-12 h-12 text-base rounded-2xl bg-background/50 border-border/40 focus:bg-background transition-colors"
              autoFocus
            />
          </div>
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden p-0 bg-muted/5 min-h-0">
          <ScrollArea className="h-full px-4 py-4 lg:px-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 lg:gap-4 pb-24 lg:pb-6">
              {filteredInventory.length === 0 ? (
                <div className="col-span-full py-16 text-center text-muted-foreground text-sm font-medium">
                  No stock items match your search.
                </div>
              ) : (
                  filteredInventory.map((item) => {
                    const gradientClass = getColorGradient(item.color, item.id);
                    return (
                      <button
                        key={item.id}
                        onClick={() => addToCart(item)}
                        className={cn(
                          "p-4 rounded-2xl border text-left hover:border-primary transition-all group flex flex-col h-full shadow-sm hover:shadow-md cursor-pointer",
                          `bg-gradient-to-br ${gradientClass}`
                        )}
                      >
                        <div className="flex-1">
                          <div className="font-extrabold text-sm group-hover:text-primary transition-colors line-clamp-2 leading-snug">{item.name}</div>
                          <div className="text-[10px] text-muted-foreground font-bold mt-1.5 font-mono uppercase tracking-wider">{item.category} {item.designNo ? `• SKU: ${item.designNo}` : ""}</div>
                          {item.color && (
                            <span className="inline-block text-[9px] px-2 py-0.5 rounded-full border border-border bg-muted text-muted-foreground font-semibold mt-1">
                              {item.color}
                            </span>
                          )}
                        </div>
                        <div className="mt-4 flex justify-between items-end w-full">
                          <div className="text-[10px] text-muted-foreground font-bold">
                            Stock: <span className={cn("font-extrabold text-xs", item.stockQuantity <= 10 ? "text-destructive" : "text-foreground")}>{item.stockQuantity}</span>
                          </div>
                          <div className="font-extrabold text-sm text-primary font-mono">₹{item.saleRate.toFixed(2)}</div>
                        </div>
                      </button>
                    );
                  })
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Cart & Checkout Section (Desktop Only) */}
      <Card className="hidden lg:flex w-1/3 flex-col border-border/50 bg-card/95 shadow-2xl backdrop-blur-xl rounded-3xl overflow-hidden z-10 min-w-[420px] min-h-0">
        <CardHeader className="bg-muted/30 border-b border-border/40 py-4 flex flex-row items-center justify-between shrink-0">
          <CardTitle className="text-sm font-black uppercase text-foreground/80 tracking-wider flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-primary" /> Cart Checkout Desk
          </CardTitle>
          <span className="text-[10px] font-black bg-primary/10 text-primary px-3 py-1 rounded-full uppercase tracking-wider shrink-0">
            {cart.reduce((s, c) => s + c.cartQuantity, 0)} Items
          </span>
        </CardHeader>
        
        <CardContent className="flex-1 overflow-hidden p-0 flex flex-col min-h-0">
          <ScrollArea className="flex-1 px-4 py-4 space-y-4 min-h-0">
            
            {/* Customer Selection */}
            <div className="p-4 border border-border/50 rounded-2xl bg-muted/15 space-y-3">
              <div className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">Party/Customer Selection</div>
              <div className="space-y-3">
                <POSCustomerAutocomplete
                  value={customerLedgerId}
                  onChange={(val) => {
                    setCustomerLedgerId(val);
                    setWalkInCustomerName("");
                  }}
                  options={debtors}
                  placeholder="Type customer name to search..."
                />
                
                <div className="relative">
                  <Input
                    placeholder="Or enter Walk-in Customer Name..."
                    value={walkInCustomerName}
                    onChange={(e) => {
                      setWalkInCustomerName(e.target.value);
                      setCustomerLedgerId(null);
                    }}
                    className="h-10 pr-8 bg-background border-border/60 rounded-xl"
                  />
                  <div className="absolute right-3 top-3.5 text-muted-foreground/60 pointer-events-none">
                    <User className="w-3.5 h-3.5" />
                  </div>
                </div>

                {walkInCustomerName && (
                  <div className="text-[9px] font-bold text-muted-foreground/80 mt-1 flex items-center gap-1">
                    <Check className="w-3 h-3 text-emerald-500" /> Auto-creates temporary walk-in ledger account
                  </div>
                )}

                {/* Account Status outstanding/credit checks */}
                {selectedLedgerDetails && (
                  <div className="p-3 border border-border/40 rounded-xl bg-background shadow-inner space-y-1.5 animate-in fade-in-50 duration-200">
                    <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-wide">Account Verification</div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span>Ledger Outstanding:</span>
                        <span className={cn(selectedLedgerDetails.outstanding > 0 ? "text-rose-500 font-bold" : "text-emerald-500")}>
                          ₹{selectedLedgerDetails.outstanding.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs font-semibold">
                        <span>Active Credit Limit:</span>
                        <span>₹{selectedLedgerDetails.creditLimit.toFixed(2)}</span>
                      </div>
                      {selectedLedgerDetails.outstanding > selectedLedgerDetails.creditLimit && selectedLedgerDetails.creditLimit > 0 && (
                        <div className="flex items-center space-x-2 text-[9px] font-bold text-destructive mt-1 bg-destructive/5 p-1 rounded">
                          <AlertTriangle className="w-3 h-3 shrink-0" />
                          <span>WARNING: Credit limit exceeded!</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Cart Items list */}
            <div className="border border-border/50 rounded-2xl bg-background/50 overflow-hidden">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2 select-none">
                  <DollarSign className="w-8 h-8 opacity-40 animate-bounce" />
                  <span className="text-xs font-semibold text-muted-foreground/70">Checkout cart is empty</span>
                </div>
              ) : (
                <Table>
                  <TableHeader className="bg-muted/30 text-xs uppercase select-none">
                    <TableRow>
                        <TableHead className="py-2 text-[9px] font-black">Item</TableHead>
                        <TableHead className="py-2 text-[9px] font-black text-center">Qty</TableHead>
                        <TableHead className="py-2 text-[9px] font-black text-center">Disc%</TableHead>
                        <TableHead className="py-2 text-[9px] font-black text-right">Price</TableHead>
                      <TableHead className="py-2 w-8"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="text-xs font-semibold">
                    {cart.map((item) => (
                      <TableRow key={item.id} className="hover:bg-muted/10">
                        <TableCell className="py-2 font-medium max-w-[130px] truncate">{item.name}</TableCell>
                        <TableCell className="py-2">
                          <div className="flex items-center justify-center gap-1 select-none">
                            <Button variant="ghost" size="icon" className="w-5 h-5 rounded hover:bg-muted" onClick={() => updateQuantity(item.id, -1)}>
                              <Minus className="w-2.5 h-2.5" />
                            </Button>
                            <span className="w-5 text-center font-mono font-medium">{item.cartQuantity}</span>
                            <Button variant="ghost" size="icon" className="w-5 h-5 rounded hover:bg-muted" onClick={() => updateQuantity(item.id, 1)}>
                              <Plus className="w-2.5 h-2.5" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell className="py-2 text-center">
                          <Input
                            type="number"
                            value={item.discountPercent}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              updateItemDiscount(item.id, Math.max(0, Math.min(100, val)));
                            }}
                            className="w-12 h-6 text-center border-border/50 text-[10px] font-mono px-1 rounded-md bg-background"
                            step="1"
                            min="0"
                            max="100"
                          />
                        </TableCell>
                        <TableCell className="py-2 text-right font-mono text-emerald-600 dark:text-emerald-400 font-extrabold">
                          ₹{(item.saleRate * item.cartQuantity * (1 - item.discountPercent / 100)).toFixed(2)}
                        </TableCell>
                        <TableCell className="py-2 text-center p-0">
                          <Button variant="ghost" size="icon" className="w-7 h-7 text-muted-foreground/60 hover:text-rose-500" onClick={() => removeItem(item.id)}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>

            {/* Bill Discounts & Promo */}
            <div className="p-4 border border-border/50 rounded-2xl bg-muted/15 space-y-3">
              <div className="flex justify-between items-center text-[10px] font-black text-muted-foreground uppercase tracking-wider">
                <span>Bill Discount (%)</span>
                <span className="text-[9px] text-muted-foreground/60 font-semibold normal-case">Applies after item discounts</span>
              </div>
              <div className="flex items-center">
                <Input
                  type="number"
                  value={billDiscountPercent}
                  onChange={(e) => setBillDiscountPercent(parseFloat(e.target.value) || 0)}
                  className="w-20 h-9 text-center bg-background border-border/60 rounded-xl font-mono text-sm"
                  step="0.1"
                  min="0"
                  max="100"
                />
                <span className="ml-2 text-xs font-bold text-muted-foreground">%</span>
              </div>
            </div>

            {/* Payment Mode Selector */}
            <div className="p-4 border border-border/50 rounded-2xl bg-muted/15 space-y-3">
              <div className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">Payment Mode</div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { mode: "cash", label: "Cash", icon: Banknote },
                  { mode: "upi", label: "UPI/Card", icon: CreditCard },
                  { mode: "credit", label: "On Credit", icon: ArrowRight },
                ].map((item) => (
                  <button
                    key={item.mode}
                    type="button"
                    onClick={() => setPaymentMode(item.mode as any)}
                    className={cn(
                      "p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all text-xs font-bold shadow-sm cursor-pointer",
                      paymentMode === item.mode
                        ? "bg-primary border-primary text-primary-foreground scale-95"
                        : "bg-background border-border/60 hover:border-border/80 text-muted-foreground"
                    )}
                  >
                    <item.icon className="w-4 h-4 shrink-0" />
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

          </ScrollArea>
        </CardContent>

        {/* Totals Summary */}
        <CardFooter className="flex-col bg-muted/30 border-t border-border/40 p-4 gap-4 shrink-0 select-none">
          <div className="w-full space-y-1 text-xs font-semibold text-muted-foreground">
            <div className="flex justify-between">
              <span>Gross Subtotal:</span>
              <span className="font-mono">₹{subTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Line Item Discounts:</span>
              <span className="font-mono text-rose-500">-₹{totalItemDiscount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Global Promo ({billDiscountPercent}%):</span>
              <span className="font-mono text-rose-500">-₹{billDiscountAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-base font-extrabold text-foreground pt-2 border-t border-border/40 mt-1">
              <span>Amount Due</span>
              <span className="text-primary font-mono text-lg font-black">₹{totalAmount.toFixed(2)}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 w-full mt-1">
            <Button variant="outline" className="h-11 rounded-xl text-xs font-bold gap-1 cursor-pointer border-border hover:bg-muted" onClick={() => handleSave(false)} disabled={isLoading}>
              {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />} Save Only
            </Button>
            <Button className="h-11 rounded-xl text-xs font-bold gap-1.5 shadow-lg cursor-pointer animate-pulse" onClick={() => handleSave(true)} disabled={isLoading}>
              {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Printer className="w-3.5 h-3.5" />} Save &amp; Print
            </Button>
          </div>
        </CardFooter>
      </Card>

      {/* Sticky Mobile Floating Cart Banner */}
      {cart.length > 0 && (
        <div className="lg:hidden fixed bottom-4 left-4 right-4 z-40 bg-slate-900/90 dark:bg-card/95 text-white shadow-2xl border border-white/10 backdrop-blur rounded-2xl p-4 flex items-center justify-between animate-in slide-in-from-bottom duration-300">
          <div className="flex flex-col">
            <span className="text-[9px] uppercase font-black tracking-wider opacity-60"> Cart checkout</span>
            <span className="text-sm font-extrabold font-mono text-cyan-405">
              {cart.reduce((s, c) => s + c.cartQuantity, 0)} Items · ₹{totalAmount.toFixed(2)}
            </span>
          </div>
          <Button
            onClick={() => setIsCartDrawerOpen(true)}
            className="rounded-xl font-bold bg-primary text-primary-foreground hover:bg-primary/90 gap-1 h-9 px-4 text-xs"
          >
            Review Cart <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      )}

      {/* --- MOBILE SLIDE-UP CHECKOUT DRAWER --- */}
      <Dialog open={isCartDrawerOpen} onOpenChange={setIsCartDrawerOpen}>
        <DialogContent className="lg:hidden max-w-full w-[94vw] max-h-[92vh] overflow-y-auto bg-card rounded-2xl p-0 border border-border shadow-2xl flex flex-col justify-between">
          <DialogHeader className="p-4 px-6 border-b border-border/40 flex flex-row items-center justify-between shrink-0">
            <div>
              <DialogTitle className="text-sm font-black uppercase tracking-wider text-foreground">
                Cart checkout ({cart.reduce((s, c) => s + c.cartQuantity, 0)} items)
              </DialogTitle>
              <DialogDescription className="text-[10px] text-muted-foreground mt-0.5">Finalize customer details, discounts, and payment method.</DialogDescription>
            </div>
            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full border" onClick={() => setIsCartDrawerOpen(false)}>
              <X className="w-3.5 h-3.5" />
            </Button>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs select-none">
            {/* Customer details */}
            <div className="p-4 border border-border rounded-xl bg-muted/15 space-y-3">
              <div className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Party / Customer</div>
              <POSCustomerAutocomplete
                value={customerLedgerId}
                onChange={(val) => {
                  setCustomerLedgerId(val);
                  setWalkInCustomerName("");
                }}
                options={debtors}
                placeholder="Search debtor..."
              />
              <Input
                placeholder="Or type Walk-in Customer name..."
                value={walkInCustomerName}
                onChange={(e) => {
                  setWalkInCustomerName(e.target.value);
                  setCustomerLedgerId(null);
                }}
                className="h-10 bg-background border-border/60 rounded-xl"
              />
            </div>

            {/* Cart Items list */}
            <div className="border border-border/60 rounded-xl overflow-hidden bg-background">
              <Table>
                <TableHeader className="bg-muted/30 text-[9px] uppercase">
                  <TableRow>
                    <TableHead className="py-2 pl-2"> Details</TableHead>
                    <TableHead className="py-2 text-center w-16">Qty</TableHead>
                    <TableHead className="py-2 text-right pr-2">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="text-[11px] font-bold">
                  {cart.map((item) => (
                    <TableRow key={item.id} className="hover:bg-transparent">
                      <TableCell className="py-2 pl-2">
                        <div className="font-semibold text-gray-800">{item.name}</div>
                        <div className="text-[9px] text-muted-foreground uppercase tracking-wide font-mono mt-0.5">#{item.designNo || "D-0"} · {item.color || "No color"}</div>
                      </TableCell>
                      <TableCell className="py-2">
                        <div className="flex items-center justify-center gap-1 select-none">
                          <Button variant="ghost" size="icon" className="w-5 h-5 rounded hover:bg-muted" onClick={() => updateQuantity(item.id, -1)}>
                            <Minus className="w-2.5 h-2.5" />
                          </Button>
                          <span className="w-4 text-center font-mono font-medium">{item.cartQuantity}</span>
                          <Button variant="ghost" size="icon" className="w-5 h-5 rounded hover:bg-muted" onClick={() => updateQuantity(item.id, 1)}>
                            <Plus className="w-2.5 h-2.5" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell className="py-2 text-right font-mono pr-2 text-emerald-600">
                        ₹{(item.saleRate * item.cartQuantity * (1 - item.discountPercent / 100)).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Bill Discounts */}
            <div className="p-4 border border-border rounded-xl bg-muted/15 space-y-2">
              <div className="flex justify-between items-center text-[9px] font-black text-muted-foreground uppercase tracking-widest">
                <span>Bill Discount (%)</span>
              </div>
              <div className="flex items-center">
                <Input
                  type="number"
                  value={billDiscountPercent}
                  onChange={(e) => setBillDiscountPercent(parseFloat(e.target.value) || 0)}
                  className="w-20 h-9 text-center bg-background border-border rounded-xl font-mono"
                  step="0.5"
                  min="0"
                  max="100"
                />
                <span className="ml-2 text-xs font-bold text-muted-foreground">%</span>
              </div>
            </div>

            {/* Payment Mode Selector */}
            <div className="p-4 border border-border rounded-xl bg-muted/15 space-y-3">
              <div className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Payment Mode</div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { mode: "cash", label: "Cash", icon: Banknote },
                  { mode: "upi", label: "UPI/UPI", icon: CreditCard },
                  { mode: "credit", label: "On Credit", icon: ArrowRight },
                ].map((item) => (
                  <button
                    key={item.mode}
                    type="button"
                    onClick={() => setPaymentMode(item.mode as any)}
                    className={cn(
                      "p-2 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all text-[11px] font-bold cursor-pointer shadow-sm",
                      paymentMode === item.mode
                        ? "bg-primary border-primary text-primary-foreground"
                        : "bg-background border-border hover:border-border text-muted-foreground"
                    )}
                  >
                    <item.icon className="w-3.5 h-3.5" />
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

          </div>

          <div className="p-4 border-t border-border/40 bg-muted/30 flex flex-col gap-4 select-none shrink-0">
            <div className="w-full space-y-1 text-xs font-semibold text-muted-foreground">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span className="font-mono">₹{subTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Discounts:</span>
                <span className="font-mono text-rose-500">-₹{(totalItemDiscount + billDiscountAmount).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm font-extrabold text-foreground pt-1.5 border-t border-border/40">
                <span>Amount Due</span>
                <span className="text-primary font-mono text-base font-black">₹{totalAmount.toFixed(2)}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 w-full">
              <Button variant="outline" className="h-10 rounded-xl text-xs font-bold gap-1 cursor-pointer border-border hover:bg-muted" onClick={() => handleSave(false)} disabled={isLoading}>
                {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />} Save Only
              </Button>
              <Button className="h-10 rounded-xl text-xs font-bold gap-1.5 shadow-lg cursor-pointer" onClick={() => handleSave(true)} disabled={isLoading}>
                {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Printer className="w-3.5 h-3.5" />} Save &amp; Print
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* --- CUSTOM PRINT PREVIEW DIALOG --- */}
      {printData && (
        <InvoiceCustomTemplates
          data={printData}
          open={isPrintOpen}
          onOpenChange={setIsPrintOpen}
        />
      )}
    </div>
  );
}
