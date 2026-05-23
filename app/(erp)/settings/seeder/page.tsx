"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  Sparkles,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  Receipt,
  ShoppingCart,
  ArrowLeftRight,
  TrendingUp,
  FileText,
  Calendar
} from "lucide-react";
import Link from "next/link";
import { useToast } from "@/components/ui/use-toast";
import { generateRandomBillAction } from "../seeder-actions";

export const dynamic = "force-dynamic";

export default function SeederPage() {
  const { toast } = useToast();
  const [targetAmount, setTargetAmount] = useState<number>(25000);
  const [voucherType, setVoucherType] = useState<"sales" | "purchase" | "mixed">("mixed");
  const [gstPercent, setGstPercent] = useState<number>(18);
  const [count, setCount] = useState<number>(10);
  const [isPending, setIsPending] = useState(false);
  const [seedResult, setSeedResult] = useState<any>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const triggerSeed = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPending(true);
    setSeedResult(null);

    try {
      const res = await generateRandomBillAction({
        targetAmount,
        voucherType,
        gstPercent,
        count,
      });

      if (mountedRef.current) {
        if (res.success) {
          setSeedResult(res);
          toast({
            title: "Demo Data Injected!",
            description: `Successfully seeded ${res.count} balanced vouchers!`,
          });
        } else {
          toast({
            title: "Seeding Failed",
            description: res.error || "Unknown error",
            variant: "destructive",
          });
        }
      }
    } catch (err) {
      if (mountedRef.current) {
        toast({
          title: "Error Seeding",
          description: "Something went wrong during demo data seeding.",
          variant: "destructive",
        });
      }
    } finally {
      if (mountedRef.current) {
        setIsPending(false);
      }
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-2 font-sans">
      {/* Title Header area */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/40 pb-4">
        <div>
          <h1 className="text-2xl font-black bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-amber-500 animate-pulse animate-duration-1000" />
            Dynamic Demo Data Seeder
          </h1>
          <p className="text-xs font-semibold text-muted-foreground mt-1">
            Generate realistic, balanced double-entry accounting records to simulate transactions, reports, and dashboards.
          </p>
        </div>
        <div>
          <Button asChild variant="outline" className="rounded-xl border-border/80 text-xs font-bold gap-2">
            <Link href="/settings">
              <ArrowLeft className="w-4 h-4" /> Back to Settings
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        {/* Input Parameters Form Panel */}
        <div className="lg:col-span-1">
          <form onSubmit={triggerSeed}>
            <Card className="rounded-2xl border border-accent/15 bg-card/45 backdrop-blur-md shadow-lg">
              <CardHeader className="border-b border-border/50 pb-4">
                <CardTitle className="text-xs font-bold text-amber-500 uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="w-4 h-4" /> Seeder Parameters
                </CardTitle>
                <CardDescription className="text-[10px] text-muted-foreground mt-0.5">
                  Configure limits, brackets, and sizes for data seeding.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-4 text-xs font-semibold text-primary">
                {/* Quantity of Invoices */}
                <div className="space-y-2">
                  <Label htmlFor="count" className="text-[10px] uppercase font-bold text-muted-foreground">
                    Number of Vouchers
                  </Label>
                  <Input
                    id="count"
                    type="number"
                    min="1"
                    max="100"
                    value={count}
                    onChange={(e) => setCount(Math.min(100, Math.max(1, parseInt(e.target.value) || 1)))}
                    required
                    className="h-10 bg-background/50 rounded-xl border-border/80 font-bold"
                  />
                  <div className="flex gap-1.5 mt-2 flex-wrap">
                    {[1, 5, 10, 20, 50].map((num) => (
                      <Button
                        key={num}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setCount(num)}
                        className={`h-7 px-2.5 text-[10px] rounded-lg border-border/60 ${
                          count === num ? "bg-amber-500/10 text-amber-500 border-amber-500/30" : ""
                        }`}
                      >
                        {num} Invoices
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Target Amount */}
                <div className="space-y-2">
                  <Label htmlFor="seed-amount" className="text-[10px] uppercase font-bold text-muted-foreground">
                    Target Invoice Amount (₹)
                  </Label>
                  <Input
                    id="seed-amount"
                    type="number"
                    min="100"
                    max="1000000"
                    value={targetAmount}
                    onChange={(e) => setTargetAmount(Math.max(1, parseFloat(e.target.value) || 0))}
                    required
                    className="h-10 bg-background/50 rounded-xl border-border/80 font-bold font-mono"
                  />
                  <span className="text-[10px] text-muted-foreground/80 mt-1 block">
                    Individual amounts will vary by ±15% to look natural.
                  </span>
                </div>

                {/* Voucher Type */}
                <div className="space-y-2">
                  <Label htmlFor="voucherType" className="text-[10px] uppercase font-bold text-muted-foreground">
                    Voucher Type
                  </Label>
                  <Select
                    onValueChange={(val: any) => setVoucherType(val)}
                    value={voucherType}
                  >
                    <SelectTrigger id="voucherType" className="w-full h-10 bg-background/50 border-border/80 rounded-xl text-xs font-bold">
                      <SelectValue placeholder="Select Type" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border border-border/80">
                      <SelectItem value="mixed" className="text-xs font-semibold">Mixed Invoices (Random)</SelectItem>
                      <SelectItem value="sales" className="text-xs font-semibold">Sales Invoice Only (F8)</SelectItem>
                      <SelectItem value="purchase" className="text-xs font-semibold">Purchase Bill Only (F9)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* GST Duties Rate */}
                <div className="space-y-2">
                  <Label htmlFor="gstRate" className="text-[10px] uppercase font-bold text-muted-foreground">
                    GST Duties Bracket
                  </Label>
                  <Select
                    onValueChange={(val: any) => setGstPercent(parseInt(val))}
                    value={String(gstPercent)}
                  >
                    <SelectTrigger id="gstRate" className="w-full h-10 bg-background/50 border-border/80 rounded-xl text-xs font-bold">
                      <SelectValue placeholder="GST Bracket" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border border-border/80">
                      <SelectItem value="0" className="text-xs font-semibold">0% GST (Exempted)</SelectItem>
                      <SelectItem value="3" className="text-xs font-semibold">3% GST (Gems & Jewelry)</SelectItem>
                      <SelectItem value="5" className="text-xs font-semibold">5% GST (Apparel & Fabric)</SelectItem>
                      <SelectItem value="12" className="text-xs font-semibold">12% GST (Electronics & Standard)</SelectItem>
                      <SelectItem value="18" className="text-xs font-semibold">18% GST (Premium Fabrics/Tech)</SelectItem>
                      <SelectItem value="24" className="text-xs font-semibold">24% GST (Special Commodities)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
              <CardFooter className="border-t border-border/50 p-4 flex justify-end">
                <Button
                  type="submit"
                  disabled={isPending || targetAmount <= 0 || count <= 0}
                  className="w-full rounded-xl h-11 font-bold text-xs bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white cursor-pointer shadow-md shadow-amber-500/10 flex items-center justify-center gap-2 border-none active:scale-[0.98] transition-all"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Injecting {count} Invoices...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-white animate-pulse" />
                      Inject {count} Demo Invoices
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </form>
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-2">
          {seedResult ? (
            <div className="space-y-6">
              {/* Summary Overview Card */}
              <Card className="border border-emerald-500/20 bg-emerald-500/5 rounded-2xl p-5 space-y-4">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-extrabold text-sm">
                  <CheckCircle2 className="w-5 h-5 shrink-0" />
                  <span>Seeder Execution Report: Successfully Seeded {seedResult.count} Vouchers</span>
                </div>

                <div className="grid gap-4 grid-cols-1 md:grid-cols-3 text-xs font-bold font-mono">
                  <div className="space-y-1 p-3 rounded-xl bg-background/50 border border-border/40">
                    <div className="text-muted-foreground text-[9px] uppercase font-sans font-bold">Total Gross Seeded</div>
                    <div className="text-primary text-base font-black">₹{seedResult.totalTargetAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</div>
                  </div>

                  <div className="space-y-1 p-3 rounded-xl bg-background/50 border border-border/40">
                    <div className="text-muted-foreground text-[9px] uppercase font-sans font-bold">Taxable Subtotal (Sales/Purchases)</div>
                    <div className="text-primary text-base font-black">₹{seedResult.totalTaxableSubtotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</div>
                  </div>

                  <div className="space-y-1 p-3 rounded-xl bg-background/50 border border-border/40">
                    <div className="text-muted-foreground text-[9px] uppercase font-sans font-bold">Total Duties &amp; Taxes ({gstPercent}%)</div>
                    <div className="text-accent text-base font-black">₹{seedResult.totalTaxAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</div>
                  </div>
                </div>
              </Card>

              {/* itemized generated items scrollable grid */}
              <Card className="border border-border/80 bg-card/45 backdrop-blur-md rounded-2xl">
                <CardHeader className="border-b border-border/50 py-4 px-6 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-xs font-black uppercase text-primary flex items-center gap-2">
                      <FileText className="w-4 h-4 text-muted-foreground" />
                      Detailed Journal Postings
                    </CardTitle>
                    <CardDescription className="text-[10px] text-muted-foreground mt-0.5">
                      Double-entry entries registered directly in SQLite.
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="max-h-[380px] overflow-y-auto divide-y divide-border/40">
                    {seedResult.vouchers.map((v: any, idx: number) => (
                      <div key={v.id || idx} className="p-4 flex items-center justify-between hover:bg-muted/10 transition-all font-semibold text-xs text-primary">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                            v.type === "sales" ? "bg-emerald-500/10 text-emerald-500" : "bg-blue-500/10 text-blue-500"
                          }`}>
                            {v.type === "sales" ? <Receipt className="w-4 h-4" /> : <ShoppingCart className="w-4 h-4" />}
                          </div>
                          <div>
                            <div className="font-extrabold text-xs">{v.partyName}</div>
                            <div className="text-[10px] text-muted-foreground font-medium flex items-center gap-1.5 mt-1 font-mono">
                              <span>{v.type.toUpperCase()}</span>
                              <span>•</span>
                              <span>{v.itemName} (x{v.quantity})</span>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {new Date(v.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-extrabold font-mono text-xs">₹{v.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</div>
                          <div className="text-[9px] text-muted-foreground mt-1">Tax: ₹{v.taxAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card className="rounded-2xl border border-dashed border-border/80 bg-card/15 backdrop-blur-md h-[400px] flex flex-col items-center justify-center p-6 text-center shadow-lg">
              <div className="w-12 h-12 bg-amber-500/5 rounded-2xl border border-amber-500/15 flex items-center justify-center text-amber-500 mb-4">
                <Sparkles className="w-6 h-6 animate-pulse" />
              </div>
              <h3 className="text-sm font-black text-primary uppercase tracking-wide">Ready for Demo Seeding</h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                No active seeder logs in this session. Configure parameters on the left and click "Inject" to generate synthetic transactions.
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
