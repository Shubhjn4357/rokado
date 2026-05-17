"use client";

import { db, inventoryItems } from "@/lib/database";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { useState } from "react";
import type { InferSelectModel } from "@/lib/database";
import { inventoryItems as inventoryItemsTable } from "@/lib/database";
import { INVENTORY_CATEGORIES, type InventoryCategory } from "@/lib/types";
import { formatCurrency } from "@/lib/types";
import { createInventoryItem } from "@/app/(erp)/inventory/actions";

export const dynamic = "force-dynamic";

export default function NewInventoryItemPage() {
  const [name, setName] = useState("");
  const [category, setCategory] = useState<InventoryCategory>(INVENTORY_CATEGORIES[0]);
  const [designNo, setDesignNo] = useState("");
  const [color, setColor] = useState("");
  const [purchaseRate, setPurchaseRate] = useState(0);
  const [saleRate, setSaleRate] = useState(0);
  const [gstPercent, setGstPercent] = useState(0);
  const [rackLocation, setRackLocation] = useState("");
  const [unit, setUnit] = useState("pcs");
  const [hsnCode, setHSNCode] = useState("");
  const [barcode, setBarcode] = useState("");
  const [reorderLevel, setReorderLevel] = useState(10);
  const [initialStock, setInitialStock] = useState(0);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await createInventoryItem({
        name,
        category,
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
          title: "Item created successfully",
          description: "The inventory item has been added.",
        });
        // Reset form
        setName("");
        setCategory(INVENTORY_CATEGORIES[0]);
        setDesignNo("");
        setColor("");
        setPurchaseRate(0);
        setSaleRate(0);
        setGstPercent(0);
        setRackLocation("");
        setUnit("pcs");
        setHSNCode("");
        setReorderLevel(10);
        setInitialStock(0);
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error,
        });
      }
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row-sm items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold tracking-tight flex-1">Add Inventory Item</h1>
        <div className="flex items-center gap-2 sm:justify-end">
          <Button asChild>
            <a href="/erp/inventory" className="rounded-xl px-4 py-3 bg-muted/60 hover:bg-muted/80 transition-colors">
              Back to Inventory
            </a>
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>
              Enter the essential details for the inventory item.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Item Name</Label>
                <Input
                  id="name"
                  placeholder="Enter item name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="designNo">Design No. (Optional)</Label>
                <Input
                  id="designNo"
                  placeholder="Enter design number"
                  value={designNo}
                  onChange={(e) => setDesignNo(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="color">Color (Optional)</Label>
                <Input
                  id="color"
                  placeholder="Enter color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={category}
                  onValueChange={(v) => setCategory(v as InventoryCategory)}
                >
                  <SelectTrigger className="w-full h-9 rounded-xl bg-muted/40">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {INVENTORY_CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pricing & Tax</CardTitle>
            <CardDescription>
              Set the purchase and sale rates along with GST percentage.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="purchaseRate">Purchase Rate (₹)</Label>
                <Input
                  id="purchaseRate"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Enter purchase rate"
                  value={purchaseRate}
                  onChange={(e) => setPurchaseRate(parseFloat(e.target.value) || 0)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="saleRate">Sale Rate (₹)</Label>
                <Input
                  id="saleRate"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Enter sale rate"
                  value={saleRate}
                  onChange={(e) => setSaleRate(parseFloat(e.target.value) || 0)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="gstPercent">GST (%)</Label>
                <Input
                  id="gstPercent"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  placeholder="Enter GST percent"
                  value={gstPercent}
                  onChange={(e) => setGstPercent(parseFloat(e.target.value) || 0)}
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Inventory Details</CardTitle>
            <CardDescription>
              Manage stock levels, unit of measurement, and storage location.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="unit">Unit</Label>
                <Select
                  value={unit}
                  onValueChange={setUnit}
                >
                  <SelectTrigger className="w-full h-9 rounded-xl bg-muted/40">
                    <SelectValue placeholder="Select unit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pcs">Pieces</SelectItem>
                    <SelectItem value="meter">Meter</SelectItem>
                    <SelectItem value="kg">Kilogram</SelectItem>
                    <SelectItem value="ltr">Liter</SelectItem>
                    <SelectItem value="box">Box</SelectItem>
                    <SelectItem value="dozen">Dozen</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="hsnCode">HSN Code (Optional)</Label>
                <Input
                  id="hsnCode"
                  placeholder="Enter HSN code"
                  value={hsnCode}
                  onChange={(e) => setHSNCode(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="rackLocation">Rack Location (Optional)</Label>
                <Input
                  id="rackLocation"
                  placeholder="Enter rack location"
                  value={rackLocation}
                  onChange={(e) => setRackLocation(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="reorderLevel">Reorder Level</Label>
                <Input
                  id="reorderLevel"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="Enter reorder level"
                  value={reorderLevel}
                  onChange={(e) => setReorderLevel(parseInt(e.target.value) || 0)}
                />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="initialStock">Initial Stock Quantity</Label>
                <Input
                  id="initialStock"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Enter initial stock quantity"
                  value={initialStock}
                  onChange={(e) => setInitialStock(parseFloat(e.target.value) || 0)}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  This will create an initial stock adjustment entry.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardFooter className="flex items-center justify-end gap-3">
            <Button
              type="submit"
              disabled={loading}
              className="px-6 py-3"
            >
              {loading ? "Creating..." : "Add Item"}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
