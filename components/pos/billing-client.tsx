"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Printer, CreditCard, Banknote, Trash2, Plus, Minus, User, DollarSign, AlertTriangle } from "lucide-react";
import { type inventoryItems, type InferSelectModel } from "@/lib/database";
import { eq, and } from "@/lib/database";
import { ledgers } from "@/lib/database";
import { db } from "@/lib/database";
import { savePosBill, getLedgerDetails } from "@/app/(erp)/pos/actions";
import { toast } from "@/components/ui/use-toast";

type InventoryItem = InferSelectModel<typeof inventoryItems>;

interface CartItem extends InventoryItem {
  cartQuantity: number;
  discountPercent: number; // per-item discount %
}

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

  // Fetch debtors (sundry_debtors) ledgers
  useEffect(() => {
    async function fetchDebtors() {
      const data = await db
        .select({ id: ledgers.id, name: ledgers.name, openingBalance: ledgers.openingBalance })
        .from(ledgers)
        .where(
          and(
            eq(ledgers.group as any, "sundry_debtors"),
            eq(ledgers.isActive as any, true)
          )
        )
        .orderBy(ledgers.name);
      setDebtors(data);
    }
    fetchDebtors();
  }, []);

  // Fetch ledger details when customer ledger changes
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
  // We'll calculate GST later, for now totalAmount is the amount due (excluding GST)

  const handleSave = async () => {
    if (cart.length === 0) {
      toast({
        title: "Error",
        description: "Cart is empty",
        variant: "destructive",
      });
      return;
    }
    if (!customerLedgerId && !walkInCustomerName) {
      toast({
        title: "Error",
        description: "Please select a customer or enter walk-in customer name",
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
          title: "Bill saved",
          description: "POS bill has been saved and voucher posted.",
        });
        // Reset cart and form
        setCart([]);
        setCustomerLedgerId(null);
        setWalkInCustomerName("");
        setBillDiscountPercent(0);
        setPaymentMode("cash");
        // Optionally, we could print here
        // window.print();
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-2rem)] gap-4">
      {/* Product List Section */}
      <Card className="flex-1 flex flex-col shadow-lg border-white/10 bg-card/90 backdrop-blur">
        <CardHeader className="pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search Saree or Scan Barcode..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-12 text-lg rounded-xl"
              autoFocus
            />
          </div>
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden p-0">
          <ScrollArea className="h-full px-6">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-6">
              {filteredInventory.length === 0 ? (
                <div className="col-span-full py-12 text-center text-muted-foreground">
                  No items found. Ensure database is populated.
                </div>
              ) : (
                filteredInventory.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => addToCart(item)}
                    className="p-4 rounded-xl border border-border/50 text-left hover:border-primary hover:bg-primary/5 transition-all group flex flex-col h-full"
                  >
                    <div className="flex-1">
                      <div className="font-semibold text-base group-hover:text-primary transition-colors line-clamp-2">{item.name}</div>
                      <div className="text-sm text-muted-foreground mt-1">{item.category} • #{item.designNo}</div>
                    </div>
                    <div className="mt-4 flex justify-between items-end">
                      <div className="text-sm">Stock: <span className={item.stockQuantity <= 10 ? "text-destructive" : ""}>{item.stockQuantity}</span></div>
                      <div className="font-bold text-sm">₹{item.saleRate.toFixed(2)}</div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Cart & Checkout Section */}
      <Card className="w-1/3 flex flex-col shadow-2xl border-white/10 bg-card/95 backdrop-blur z-10 min-w-[400px]">
        <CardHeader className="bg-muted/30 border-b pb-4">
          <CardTitle className="text-xl">Current Bill</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden p-0">
          <ScrollArea className="h-full">
            {/* Customer Selection */}
            <div className="mb-4 p-4 border rounded-lg">
              <div className="font-semibold mb-2">Customer</div>
              <div className="space-y-2">
                <div className="flex items-center">
                  <User className="w-4 h-4 mr-2" />
                  <select
                    value={customerLedgerId ?? ""}
                    onChange={(e) => {
                      setCustomerLedgerId(e.target.value);
                      setWalkInCustomerName("");
                    }}
                    className="border rounded px-3 py-1 w-full"
                  >
                    <option value="">Select Customer</option>
                    {debtors.map((debtor) => (
                      <option key={debtor.id} value={debtor.id}>
                        {debtor.name} (₹{debtor.openingBalance.toFixed(2)})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center">
                  <User className="w-4 h-4 mr-2" />
                  <Input
                    placeholder="Walk-in Customer Name"
                    value={walkInCustomerName}
                    onChange={(e) => {
                      setWalkInCustomerName(e.target.value);
                      setCustomerLedgerId(null);
                    }}
                    className="border rounded px-3 py-1 w-full"
                  />
                </div>
                {walkInCustomerName && (
                  <div className="text-xs text-muted-foreground mt-1">
                    New customer will be created under Sundry Debtors.
                  </div>
                )}
                {/* Display outstanding balance and credit limit if a ledger is selected */}
                {selectedLedgerDetails && (
                  <div className="mt-2 p-3 border rounded-lg">
                    <div className="font-semibold mb-1">Account Status</div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>Outstanding:</span>
                        <span className={selectedLedgerDetails.outstanding > 0 ? "font-medium" : ""}>
                          ₹{selectedLedgerDetails.outstanding.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Credit Limit:</span>
                        <span>₹{selectedLedgerDetails.creditLimit.toFixed(2)}</span>
                      </div>
                      {selectedLedgerDetails.outstanding > selectedLedgerDetails.creditLimit && selectedLedgerDetails.creditLimit > 0 && (
                        <div className="flex items-center space-x-2 text-xs text-destructive mt-1">
                          <AlertTriangle className="w-3 h-3" />
                          <span>Credit limit exceeded!</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Cart Table */}
            {cart.length === 0 ? (
              <div className="flex items-center justify-center h-40 text-muted-foreground">
                Cart is empty
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-muted/50 sticky top-0 backdrop-blur">
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead className="w-10 text-center">Qty</TableHead>
                    <TableHead className="w-10 text-center">Discount (%)</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cart.map((item) => (
                    <TableRow key={item.id} style={{ paddingLeft: "1rem", paddingRight: "1rem" }}>
                      <TableCell className="font-medium max-w-[150px] truncate">{item.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-1">
                          <Button variant="ghost" size="icon" className="w-6 h-6 rounded" onClick={() => updateQuantity(item.id, -1)}>
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span className="w-6 text-center tabular-nums">{item.cartQuantity}</span>
                          <Button variant="ghost" size="icon" className="w-6 h-6 rounded" onClick={() => updateQuantity(item.id, 1)}>
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Input
                          type="number"
                          value={item.discountPercent}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            updateItemDiscount(item.id, Math.max(0, Math.min(100, val)));
                          }}
                          className="w-16 text-center border rounded px-1"
                          step="0.01"
                          min="0"
                          max="100"
                        />
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        ₹{
                          (
                            item.saleRate *
                            item.cartQuantity *
                            (1 - item.discountPercent / 100)
                          ).toFixed(2)
                        }
                      </TableCell>
                      <TableCell className="p-0">
                        <Button variant="ghost" size="icon" className="w-8 h-8 text-destructive hover:bg-destructive/10" onClick={() => removeItem(item.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            {/* Bill Discount */}
            <div className="mb-4 p-4 border rounded-lg">
              <div className="flex justify-between mb-2">
                <span>Bill Discount (%)</span>
                <span className="text-sm text-muted-foreground">Applies after item discounts</span>
              </div>
              <div className="flex items-center">
                <DollarSign className="w-4 h-4 mr-2" />
                <Input
                  type="number"
                  value={billDiscountPercent}
                  onChange={(e) => setBillDiscountPercent(parseFloat(e.target.value) || 0)}
                  className="w-20 text-center border rounded px-2"
                  step="0.01"
                  min="0"
                  max="100"
                />
                <span className="ml-2 text-xs text-muted-foreground">%</span>
              </div>
            </div>

            {/* Payment Mode */}
            <div className="mb-4 p-4 border rounded-lg">
              <div className="font-semibold mb-2">Payment Mode</div>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="cash"
                    checked={paymentMode === "cash"}
                    onChange={(e) => setPaymentMode(e.target.value as "cash")}
                    className="mr-2"
                  />
                  <span>Cash</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="upi"
                    checked={paymentMode === "upi"}
                    onChange={(e) => setPaymentMode(e.target.value as "upi")}
                    className="mr-2"
                  />
                  <span>UPI / Card</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="credit"
                    checked={paymentMode === "credit"}
                    onChange={(e) => setPaymentMode(e.target.value as "credit")}
                    className="mr-2"
                  />
                  <span>Credit</span>
                </label>
                {/* Split payment not implemented for simplicity */}
              </div>
            </div>

            {/* Amount Summary */}
            <div className="mt-4 p-4 border rounded-lg">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>₹{subTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Item Discount</span>
                  <span>₹{totalItemDiscount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>After Item Discount</span>
                  <span>₹{amountAfterItemDiscount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Bill Discount ({billDiscountPercent}%)</span>
                  <span>₹{billDiscountAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-2xl font-bold pt-2 border-t mt-2">
                  <span>Amount Due</span>
                  <span className="text-primary">₹{totalAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </ScrollArea>
        </CardContent>
        <CardFooter className="flex-col bg-muted/20 border-t p-6 gap-4">
          <div className="w-full space-y-2">
            <div className="flex justify-between text-muted-foreground">
              <span>Status</span>
              <span>{isLoading ? "Saving..." : "Ready"}</span>
            </div>
          </div>
          <Button variant="secondary" className="w-full h-12 flex gap-2 mt-2" onClick={handleSave} disabled={isLoading}>
            {isLoading ? (
              <>
                <Printer className="w-4 h-4 mr-2" />
                Saving...
              </>
            ) : (
              <>
                <Printer className="w-4 h-4 mr-2" />
                Save & Print Bill
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
