"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Printer, CreditCard, Banknote, Trash2, Plus, Minus, User, DollarSign, AlertTriangle, Check, ArrowRight } from "lucide-react";
import { type inventoryItems, type InferSelectModel } from "@/lib/database";
import { savePosBill, getLedgerDetails, getDebtorsOptions } from "@/app/(erp)/pos/actions";
import { toast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

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
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerLedgerId, setCustomerLedgerId] = useState<string | null>(null);
  const [walkInCustomerName, setWalkInCustomerName] = useState("");
  const [billDiscountPercent, setBillDiscountPercent] = useState(0);
  const [paymentMode, setPaymentMode] = useState<"cash" | "upi" | "card" | "credit" | "split">("cash");
  const [isLoading, setIsLoading] = useState(false);
  const [debtors, setDebtors] = useState<Array<{id: string; name: string; openingBalance: number}>>([]);
  const [selectedLedgerDetails, setSelectedLedgerDetails] = useState<{id: string; name: string; creditLimit: number; outstanding: number} | null>(null);

  // Fetch debtors ledgers
  useEffect(() => {
    async function fetchDebtors() {
      const data = await getDebtorsOptions();
      setDebtors(data as any);
    }
    fetchDebtors();
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

  const handleSave = async () => {
    if (cart.length === 0) {
      toast({
        title: "Cart Empty",
        description: "Please add sarees or items into cart.",
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
          description: "Voucher recorded and sales entry updated.",
        });
        setCart([]);
        setCustomerLedgerId(null);
        setWalkInCustomerName("");
        setBillDiscountPercent(0);
        setPaymentMode("cash");
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
    <div className="flex h-[calc(100vh-2rem)] gap-4 select-none">
      {/* Product List Section */}
      <Card className="flex-1 flex flex-col border-border/50 bg-card/75 shadow-xl backdrop-blur-xl rounded-3xl overflow-hidden">
        <CardHeader className="pb-4 border-b border-border/40">
          <div className="relative">
            <Search className="absolute left-4 top-3.5 w-5 h-5 text-muted-foreground/60 animate-pulse" />
            <Input
              placeholder="Search Saree or scan barcode..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-12 h-12 text-base rounded-2xl bg-background/50 border-border/40 focus:bg-background transition-colors"
              autoFocus
            />
          </div>
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden p-0 bg-muted/5">
          <ScrollArea className="h-full px-6 py-4">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-6">
              {filteredInventory.length === 0 ? (
                <div className="col-span-full py-16 text-center text-muted-foreground text-sm font-medium">
                  No stock items match your search.
                </div>
              ) : (
                filteredInventory.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => addToCart(item)}
                    className="p-4 rounded-2xl border border-border/40 text-left hover:border-primary hover:bg-primary/5 transition-all group flex flex-col h-full bg-background shadow-sm hover:shadow-md"
                  >
                    <div className="flex-1">
                      <div className="font-semibold text-sm group-hover:text-primary transition-colors line-clamp-2">{item.name}</div>
                      <div className="text-[11px] text-muted-foreground mt-1 font-mono uppercase tracking-wider">{item.category} • #{item.designNo}</div>
                    </div>
                    <div className="mt-4 flex justify-between items-end">
                      <div className="text-[10px] text-muted-foreground font-semibold">Stock: <span className={cn("font-bold text-xs", item.stockQuantity <= 10 ? "text-destructive" : "text-foreground")}>{item.stockQuantity}</span></div>
                      <div className="font-bold text-sm text-primary">₹{item.saleRate.toFixed(2)}</div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Cart & Checkout Section */}
      <Card className="w-1/3 flex flex-col border-border/50 bg-card/95 shadow-2xl backdrop-blur-xl rounded-3xl overflow-hidden z-10 min-w-[420px]">
        <CardHeader className="bg-muted/30 border-b border-border/40 py-4 flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-primary" /> POS Checkout
          </CardTitle>
          <span className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0">
            {cart.reduce((s, c) => s + c.cartQuantity, 0)} Items
          </span>
        </CardHeader>
        
        <CardContent className="flex-1 overflow-hidden p-0 flex flex-col">
          <ScrollArea className="flex-1 px-4 py-4 space-y-4">
            
            {/* Customer Selection Autocomplete */}
            <div className="p-4 border border-border/50 rounded-2xl bg-muted/15 space-y-3">
              <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Party/Customer Selection</div>
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
                  <div className="text-[10px] font-semibold text-muted-foreground/80 mt-1 flex items-center gap-1">
                    <Check className="w-3 h-3 text-emerald-500" /> Auto-creates entry under Sundry Debtors ledger.
                  </div>
                )}

                {/* Account Status outstanding/credit checks */}
                {selectedLedgerDetails && (
                  <div className="p-3 border border-border/40 rounded-xl bg-background shadow-inner space-y-1.5 animate-in fade-in-50 duration-200">
                    <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Account Verification</div>
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
                        <div className="flex items-center space-x-2 text-[10px] font-bold text-destructive mt-1 bg-destructive/5 p-1 rounded">
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
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
                  <DollarSign className="w-8 h-8 opacity-40 animate-bounce" />
                  <span className="text-xs font-medium">No items in checkout cart</span>
                </div>
              ) : (
                <Table>
                  <TableHeader className="bg-muted/30 text-xs uppercase select-none">
                    <TableRow>
                      <TableHead className="py-2 text-[10px] font-bold">Item Description</TableHead>
                      <TableHead className="py-2 text-[10px] font-bold text-center">Qty</TableHead>
                      <TableHead className="py-2 text-[10px] font-bold text-center">Disc %</TableHead>
                      <TableHead className="py-2 text-[10px] font-bold text-right">Total Price</TableHead>
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
                            className="w-12 h-6 text-center border-border/50 text-[11px] font-mono px-1 rounded-md"
                            step="1"
                            min="0"
                            max="100"
                          />
                        </TableCell>
                        <TableCell className="py-2 text-right font-mono text-emerald-600 dark:text-emerald-400">
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
              <div className="flex justify-between items-center text-xs font-bold text-muted-foreground uppercase tracking-wider">
                <span>Bill Discount (%)</span>
                <span className="text-[10px] text-muted-foreground/60 font-semibold normal-case">Applies after item discounts</span>
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

            {/* Premium Payment Selector Grid */}
            <div className="p-4 border border-border/50 rounded-2xl bg-muted/15 space-y-3">
              <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Payment Mode</div>
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
                      "p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all text-xs font-bold shadow-sm",
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

        {/* Totals Summary checkout panel */}
        <CardFooter className="flex-col bg-muted/30 border-t border-border/40 p-4 gap-4 shrink-0">
          <div className="w-full space-y-1 text-xs font-semibold text-muted-foreground">
            <div className="flex justify-between">
              <span>Gross Total:</span>
              <span className="font-mono">₹{subTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Line Item Discounts:</span>
              <span className="font-mono text-rose-500">-₹{totalItemDiscount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Global Promo Discount ({billDiscountPercent}%):</span>
              <span className="font-mono text-rose-500">-₹{billDiscountAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg font-extrabold text-foreground pt-2 border-t border-border/40 mt-1 select-none">
              <span>Amount Due</span>
              <span className="text-primary font-mono text-xl">₹{totalAmount.toFixed(2)}</span>
            </div>
          </div>

          <Button className="w-full h-11 flex items-center justify-center gap-2 rounded-xl text-sm font-bold shadow-lg mt-1" onClick={handleSave} disabled={isLoading}>
            <Printer className="w-4 h-4 shrink-0" /> {isLoading ? "Saving Transaction..." : "Save & Print Invoice"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
