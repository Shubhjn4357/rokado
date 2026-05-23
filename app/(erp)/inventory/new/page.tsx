"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { useState } from "react";
import { createInventoryItem } from "@/app/(erp)/inventory/actions";
import { INVENTORY_CATEGORIES, type InventoryCategory } from "@/lib/types";
import { UnitEnum, GST_RATES } from "@/constant/app.constant";
import { ArrowLeft, Plus, Check, Loader2, Sparkles, Layers, Percent, Box } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default function NewInventoryItemPage() {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [category, setCategory] = useState<string>(INVENTORY_CATEGORIES[0]);
  const [customCategory, setCustomCategory] = useState("");
  const [designNo, setDesignNo] = useState("");
  const [color, setColor] = useState("");
  const [purchaseRate, setPurchaseRate] = useState(0);
  const [saleRate, setSaleRate] = useState(0);
  const [gstPercent, setGstPercent] = useState<number>(18);
  const [rackLocation, setRackLocation] = useState("");
  const [unit, setUnit] = useState<string>("pcs");
  const [hsnCode, setHSNCode] = useState("");
  const [reorderLevel, setReorderLevel] = useState(10);
  const [initialStock, setInitialStock] = useState(0);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const finalCategory = category === "Custom..." ? customCategory : category;

    try {
      const result = await createInventoryItem({
        name,
        category: finalCategory || "General",
        designNo: designNo || undefined,
        color: color || undefined,
        purchaseRate,
        saleRate,
        gstPercent,
        rackLocation: rackLocation || undefined,
        unit,
        hsnCode: hsnCode || undefined,
        reorderLevel,
        initialStock,
      });

      if (result.success) {
        toast({
          title: "Item Added Successfully",
          description: `"${name}" is now logged in the database.`,
        });
        // Reset form
        setName("");
        setCategory(INVENTORY_CATEGORIES[0]);
        setCustomCategory("");
        setDesignNo("");
        setColor("");
        setPurchaseRate(0);
        setSaleRate(0);
        setGstPercent(18);
        setRackLocation("");
        setUnit("pcs");
        setHSNCode("");
        setReorderLevel(10);
        setInitialStock(0);
      } else {
        toast({
          variant: "destructive",
          title: "Failed to Add Item",
          description: result.error,
        });
      }
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Unexpected Error",
        description: "Could not create the inventory item.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto py-2">
      {/* Title Header area */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent flex items-center gap-2">
            <Sparkles className="w-7 h-7 text-amber-500 animate-pulse" /> Add Stock Item
          </h1>
          <p className="text-xs font-semibold text-muted-foreground mt-1">
            Publish a new inventory record into the obsidian ledger core
          </p>
        </div>
        <div>
          <Button asChild variant="outline" className="rounded-xl border-border/80 text-xs font-bold gap-2">
            <Link href="/erp/inventory">
              <ArrowLeft className="w-4 h-4" /> Back to Inventory
            </Link>
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information section */}
        <Card className="rounded-2xl border border-accent/15 bg-card/45 backdrop-blur-md shadow-lg transition-all hover:border-accent/30 duration-300">
          <CardHeader className="border-b border-border/50 pb-4">
            <CardTitle className="text-sm font-bold text-accent uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4" /> Basic Information
            </CardTitle>
            <CardDescription className="text-xs font-semibold text-muted-foreground">
              Define the taxonomy, identification codes, and naming structure of this asset.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-4 font-semibold text-xs text-primary">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-[10px] uppercase font-bold text-muted-foreground">Item Name / Title</Label>
                <Input
                  id="name"
                  placeholder="e.g. Wireless Mouse"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="h-10 bg-background/50 rounded-xl border-border/80 font-bold focus:border-accent/40"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="designNo" className="text-[10px] uppercase font-bold text-muted-foreground">Design / Art Number (Optional)</Label>
                <Input
                  id="designNo"
                  placeholder="e.g. DS-904"
                  value={designNo}
                  onChange={(e) => setDesignNo(e.target.value)}
                  className="h-10 bg-background/50 rounded-xl border-border/80 font-bold"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="color" className="text-[10px] uppercase font-bold text-muted-foreground">Color / Pattern (Optional)</Label>
                <Input
                  id="color"
                  placeholder="e.g. Royal Blue"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="h-10 bg-background/50 rounded-xl border-border/80 font-bold"
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="category" className="text-[10px] uppercase font-bold text-muted-foreground">Business Category</Label>
                <Select
                  value={category}
                  onValueChange={setCategory}
                >
                  <SelectTrigger className="w-full h-10 rounded-xl bg-background/50 border-border/80 font-bold">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border border-border/80">
                    {INVENTORY_CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat} className="text-xs font-semibold">
                        {cat}
                      </SelectItem>
                    ))}
                    <SelectItem value="Custom..." className="text-xs font-semibold text-accent">Custom category...</SelectItem>
                  </SelectContent>
                </Select>
                
                {category === "Custom..." && (
                  <div className="pt-2 animate-in slide-in-from-top-2 duration-300">
                    <Label htmlFor="custom-category" className="text-[10px] uppercase font-bold text-accent">Custom Category Name</Label>
                    <Input
                      id="custom-category"
                      placeholder="e.g. Garments, Silk Threads, etc."
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                      required
                      className="h-10 bg-background/50 rounded-xl border-border/80 font-bold mt-1.5"
                    />
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pricing & Taxes section */}
        <Card className="rounded-2xl border border-accent/15 bg-card/45 backdrop-blur-md shadow-lg transition-all hover:border-accent/30 duration-300">
          <CardHeader className="border-b border-border/50 pb-4">
            <CardTitle className="text-sm font-bold text-accent uppercase tracking-wider flex items-center gap-2">
              <Percent className="w-4 h-4" /> Pricing & Tax Structure
            </CardTitle>
            <CardDescription className="text-xs font-semibold text-muted-foreground">
              Define catalog base values, margins, and the appropriate Indian GST compliance bracket.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-4 font-semibold text-xs text-primary">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="purchaseRate" className="text-[10px] uppercase font-bold text-muted-foreground">Base Purchase Cost (₹)</Label>
                <Input
                  id="purchaseRate"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={purchaseRate || ""}
                  onChange={(e) => setPurchaseRate(parseFloat(e.target.value) || 0)}
                  required
                  className="h-10 bg-background/50 rounded-xl border-border/80 font-mono font-bold"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="saleRate" className="text-[10px] uppercase font-bold text-muted-foreground">Standard Sale Rate (₹)</Label>
                <Input
                  id="saleRate"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={saleRate || ""}
                  onChange={(e) => setSaleRate(parseFloat(e.target.value) || 0)}
                  required
                  className="h-10 bg-background/50 rounded-xl border-border/80 font-mono font-bold"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gstPercent" className="text-[10px] uppercase font-bold text-muted-foreground">Indian GST Compliance</Label>
                <Select
                  value={gstPercent.toString()}
                  onValueChange={(v) => setGstPercent(Number(v))}
                >
                  <SelectTrigger className="w-full h-10 rounded-xl bg-background/50 border-border/80 font-bold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border border-border/80">
                    {GST_RATES.map((rate) => (
                      <SelectItem key={rate} value={rate.toString()} className="text-xs font-semibold">
                        {rate}% GST (Standard)
                      </SelectItem>
                    ))}
                    <SelectItem value="0" className="text-xs font-semibold">0% GST (Exempted)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stock & Measurement details */}
        <Card className="rounded-2xl border border-accent/15 bg-card/45 backdrop-blur-md shadow-lg transition-all hover:border-accent/30 duration-300">
          <CardHeader className="border-b border-border/50 pb-4">
            <CardTitle className="text-sm font-bold text-accent uppercase tracking-wider flex items-center gap-2">
              <Box className="w-4 h-4" /> Stock Control & Measurement
            </CardTitle>
            <CardDescription className="text-xs font-semibold text-muted-foreground">
              Define the starting balance sheet stock inventory and reordering thresholds.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-4 font-semibold text-xs text-primary">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="unit" className="text-[10px] uppercase font-bold text-muted-foreground">Unit of Measure (UoM)</Label>
                <Select
                  value={unit}
                  onValueChange={setUnit}
                >
                  <SelectTrigger className="w-full h-10 rounded-xl bg-background/50 border-border/80 font-bold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border border-border/80">
                    {Object.entries(UnitEnum).map(([key, label]) => (
                      <SelectItem key={key} value={key.toLowerCase()} className="text-xs font-semibold">
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="hsnCode" className="text-[10px] uppercase font-bold text-muted-foreground">HSN/SAC Code (Optional)</Label>
                <Input
                  id="hsnCode"
                  placeholder="e.g. 5208"
                  value={hsnCode}
                  onChange={(e) => setHSNCode(e.target.value)}
                  className="h-10 bg-background/50 rounded-xl border-border/80 font-bold"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rackLocation" className="text-[10px] uppercase font-bold text-muted-foreground">Rack / Bin Location (Optional)</Label>
                <Input
                  id="rackLocation"
                  placeholder="e.g. Shelf A-3"
                  value={rackLocation}
                  onChange={(e) => setRackLocation(e.target.value)}
                  className="h-10 bg-background/50 rounded-xl border-border/80 font-bold"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reorderLevel" className="text-[10px] uppercase font-bold text-muted-foreground">Reorder Quantity Threshold</Label>
                <Input
                  id="reorderLevel"
                  type="number"
                  min="0"
                  step="1"
                  value={reorderLevel || ""}
                  onChange={(e) => setReorderLevel(parseInt(e.target.value) || 0)}
                  className="h-10 bg-background/50 rounded-xl border-border/80 font-mono font-bold"
                />
              </div>
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="initialStock" className="text-[10px] uppercase font-bold text-muted-foreground">Initial Opening Stock Balance</Label>
                <Input
                  id="initialStock"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={initialStock || ""}
                  onChange={(e) => setInitialStock(parseFloat(e.target.value) || 0)}
                  className="h-10 bg-background/50 rounded-xl border-border/80 font-mono font-bold"
                />
                <span className="block text-[10px] text-muted-foreground/80 mt-1 font-medium">
                  Note: Providing this will automatically file an opening stock adjustment in the ledger.
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Button footer */}
        <Card className="rounded-2xl border border-accent/15 bg-card/45 backdrop-blur-md shadow-lg">
          <CardContent className="py-4 flex items-center justify-end">
            <Button
              type="submit"
              disabled={loading}
              className="px-8 h-11 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-xs font-bold gap-2 text-white shadow-md shadow-amber-500/10 transition-all active:scale-[0.98]"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Recording Item...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" /> Save Stock Item
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
