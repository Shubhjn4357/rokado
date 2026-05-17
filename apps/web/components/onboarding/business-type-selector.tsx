"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Undo2, ArrowRight, Shirt, ShoppingBag, Store, Factory, PackageOpen, Settings } from "lucide-react";

interface Props {
  onBack: () => void;
  onNext: () => void;
  selectedType: string;
  onSelect: (type: string) => void;
}

const BUSINESS_TYPES = [
  { id: "wholesale_saree", title: "Saree Wholesale", icon: Shirt, description: "Bulk sales, transport tracking, design catalogs" },
  { id: "textile_retail", title: "Textile Retail", icon: Store, description: "Fast POS, barcode scanning, shift management" },
  { id: "garment_store", title: "Garment Store", icon: ShoppingBag, description: "Sizes, colors, multi-warehouse" },
  { id: "distributor", title: "Distributor", icon: Factory, description: "Credit limits, route planning, bulk discounts" },
  { id: "mixed_inventory", title: "Mixed Inventory", icon: PackageOpen, description: "Generic retail and wholesale" },
  { id: "custom", title: "Custom", icon: Settings, description: "Configure from scratch" },
];

export function BusinessTypeSelector({ onBack, onNext, selectedType, onSelect }: Props) {

  return (
    <Card className="w-full max-w-2xl shadow-2xl bg-card/80 backdrop-blur-xl border-white/10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <CardHeader>
        <Button variant="ghost" size="icon" onClick={onBack} className="absolute left-6 top-6 rounded-full">
          <Undo2 className="w-4 h-4" />
        </Button>
        <div className="text-center">
          <CardTitle className="text-2xl font-bold">What business do you run?</CardTitle>
          <CardDescription className="mt-2">This will auto-configure your GST defaults, inventory templates, and ledgers.</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <RadioGroup value={selectedType} onValueChange={onSelect} className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {BUSINESS_TYPES.map((type) => {
            const Icon = type.icon;
            const isSelected = selectedType === type.id;
            return (
              <Label
                key={type.id}
                htmlFor={type.id}
                className={`flex flex-col items-start p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  isSelected 
                    ? "border-primary bg-primary/5 shadow-md shadow-primary/10" 
                    : "border-border/50 hover:border-border hover:bg-accent/30"
                }`}
              >
                <RadioGroupItem value={type.id} id={type.id} className="sr-only" />
                <div className="flex items-center gap-3 w-full">
                  <div className={`p-2 rounded-lg ${isSelected ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold">{type.title}</div>
                    <div className="text-xs text-muted-foreground leading-snug mt-1">{type.description}</div>
                  </div>
                </div>
              </Label>
            );
          })}
        </RadioGroup>
      </CardContent>
      <CardFooter className="flex justify-end border-t border-border/50 p-6">
        <Button size="lg" className="px-8 rounded-xl" onClick={onNext}>
          Continue Setup <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </CardFooter>
    </Card>
  );
}
