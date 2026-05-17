"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Shirt, CreditCard, Building2, Truck, Settings, CircleCheck, FileText, Undo2 } from "lucide-react";
import { z } from "zod";
import { formatCurrency } from "@/lib/types";
import { createCompanyAndLedgersAction } from "./actions";

interface Props {
  businessType: string;
  onComplete: () => void;
  onBack: () => void;
}

// Steps: 1-Business Details, 2-GST Setup, 3-Opening Balances, 4-Go Live
export function BusinessSetupWizard({ businessType, onComplete, onBack }: Props) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    // Step 1: Business Details
    businessName: "",
    businessAddress: "",
    businessCity: "",
    businessState: "",
    businessPincode: "",
    businessPhone: "",
    businessEmail: "",
    // Step 2: GST Setup
    gstin: "",
    // Step 3: Opening Balances
    cashInHand: 0,
    bankBalance: 0,
  });

  const businessTypeConfig: Record<string, { title: string; defaultGst: number }> = {
    wholesale_saree: { title: "Saree Wholesale", defaultGst: 5 },
    textile_retail: { title: "Textile Retail", defaultGst: 5 },
    garment_store: { title: "Garment Store", defaultGst: 5 },
    distributor: { title: "Distributor", defaultGst: 12 },
    mixed_inventory: { title: "Mixed Inventory", defaultGst: 5 },
    custom: { title: "Custom Business", defaultGst: 0 },
  };
  
  const currentConfig = businessTypeConfig[businessType] || {
    title: "Custom Business",
    defaultGst: 0,
  };

  const handleStepChange = (direction: "next" | "prev") => {
    setStep((prev) => {
      const newStep = direction === "next" ? prev + 1 : prev - 1;
      // Validate current step before moving forward
      if (direction === "next" && !validateStep(prev)) {
        return prev; // Don't advance if validation fails
      }
      return Math.max(1, Math.min(4, newStep));
    });
  };

  const validateStep = (stepNum: number): boolean => {
    switch (stepNum) {
      case 1:
        return !!formData.businessName.trim();
      case 2:
        return !!formData.gstin.trim(); // In real app, would validate GSTIN format
      case 3:
        return true; // Opening balances can be zero
      default:
        return true;
    }
  };

  const handleComplete = async () => {
    try {
      const result = await createCompanyAndLedgersAction({
        businessName: formData.businessName,
        gstin: formData.gstin,
        businessAddress: formData.businessAddress,
        businessCity: formData.businessCity,
        businessState: formData.businessState,
        businessPincode: formData.businessPincode,
        businessPhone: formData.businessPhone,
        businessEmail: formData.businessEmail,
        businessType,
        cashInHand: formData.cashInHand,
        bankBalance: formData.bankBalance,
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      onComplete();
    } catch (error) {
      console.error("Failed to complete setup:", error);
      alert(error instanceof Error ? error.message : "Setup failed. Please try again.");
    }
  };

  return (
    <Card className="w-full max-w-2xl shadow-2xl bg-card/80 backdrop-blur-xl border-white/10">
      <CardHeader>
        <Button variant="ghost" size="icon" onClick={onBack} className="absolute left-6 top-6 rounded-full">
          <Undo2 className="w-4 h-4" />
        </Button>
        <div className="text-center mb-6">
          <CardTitle className="text-2xl font-bold">Business Setup</CardTitle>
          <CardDescription className="mt-2 text-muted-foreground">
            Step {step} of 4 - Configure your {currentConfig.title} business
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {step === 1 && (
          <>
            <Label className="block mb-2 font-medium">Business Name</Label>
            <Input
              placeholder="Enter your business name"
              value={formData.businessName}
              onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
              className="mb-4"
              required
            />

            <Label className="block mb-2 font-medium">Business Address</Label>
            <Input
              placeholder="Street address, building, etc."
              value={formData.businessAddress}
              onChange={(e) => setFormData({ ...formData, businessAddress: e.target.value })}
              className="mb-2"
            />

            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <Label className="block mb-2 font-medium">City</Label>
                <Input
                  placeholder="City"
                  value={formData.businessCity}
                  onChange={(e) => setFormData({ ...formData, businessCity: e.target.value })}
                  className="mb-2"
                />
              </div>
              <div>
                <Label className="block mb-2 font-medium">State</Label>
                <Input
                  placeholder="State"
                  value={formData.businessState}
                  onChange={(e) => setFormData({ ...formData, businessState: e.target.value })}
                  className="mb-2"
                />
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <Label className="block mb-2 font-medium">PIN Code</Label>
                <Input
                  type="number"
                  placeholder="PIN Code"
                  value={formData.businessPincode}
                  onChange={(e) => setFormData({ ...formData, businessPincode: e.target.value })}
                  className="mb-2"
                />
              </div>
              <div>
                <Label className="block mb-2 font-medium">Phone</Label>
                <Input
                  type="tel"
                  placeholder="Phone number"
                  value={formData.businessPhone}
                  onChange={(e) => setFormData({ ...formData, businessPhone: e.target.value })}
                  className="mb-2"
                />
              </div>
            </div>

            <Label className="block mb-2 font-medium">Email (Optional)</Label>
            <Input
              type="email"
              placeholder="Email address"
              value={formData.businessEmail}
              onChange={(e) => setFormData({ ...formData, businessEmail: e.target.value })}
              className="mb-4"
            />
          </>
        )}

        {step === 2 && (
          <>
            <Label className="block mb-2 font-medium">GSTIN</Label>
            <Input
              placeholder="Enter your GSTIN (optional if not registered)"
              value={formData.gstin}
              onChange={(e) => setFormData({ ...formData, gstin: e.target.value })}
              className="mb-4"
            />

            <div className="bg-muted/50 p-4 rounded-lg">
              <Label className="mb-2 block font-medium">GST Configuration</Label>
              <p className="text-sm text-muted-foreground">
                Based on your business type ({currentConfig.title}), the default GST rate is
                <span className="font-medium">{currentConfig.defaultGst}%</span>.
                This will be applied to sales and purchase transactions.
              </p>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <Label className="block mb-2 font-medium">Opening Balances</Label>
            <p className="text-sm text-muted-foreground mb-4">
              Enter your opening cash and bank balances as of today.
            </p>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label className="block mb-2 font-medium">Cash in Hand</Label>
                <Input
                  type="number"
                  placeholder="₹ 0"
                  value={String(formData.cashInHand)}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    setFormData({ ...formData, cashInHand: val });
                  }}
                  className="mb-2"
                />
                <p className="text-xs text-muted-foreground">
                  Physical cash available at business premises
                </p>
              </div>
              <div>
                <Label className="block mb-2 font-mobile">Bank Balance</Label>
                <Input
                  type="number"
                  placeholder="₹ 0"
                  value={String(formData.bankBalance)}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    setFormData({ ...formData, bankBalance: val });
                  }}
                  className="mb-2"
                />
                <p className="text-xs text-muted-foreground">
                  Balance in your business bank account
                </p>
              </div>
            </div>
          </>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <div className="text-lg font-semibold">Setup Complete!</div>
            <p className="text-muted-foreground">
              Your {currentConfig.title} business is now ready to use.
            </p>

            <div className="grid gap-2 md:grid-cols-2">
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center mb-2">
                  <Building2 className="w-5 h-5 text-primary mr-3" />
                  <div>
                    <div className="font-medium">{formData.businessName}</div>
                    <div className="text-sm text-muted-foreground">
                      {formData.businessAddress}, {formData.businessCity}
                    </div>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t">
                  <div className="text-sm text-muted-foreground">GSTIN: {formData.gstin || "Not provided"}</div>
                  <div className="text-sm text-muted-foreground mt-1">Business Type: {currentConfig.title}</div>
                </div>
              </div>

              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center mb-2">
                  <CircleCheck className="w-5 h-5 text-success mr-3" />
                  <div>
                    <div className="font-medium">Default Ledgers Created</div>
                    <div className="text-sm text-muted-foreground">
                      Sales, Purchase, GST, Debtors, Creditors, Cash, Bank
                    </div>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    Opening Cash: {formatCurrency(formData.cashInHand)}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    Opening Bank: {formatCurrency(formData.bankBalance)}
                  </div>
                </div>
              </div>
            </div>

            <p className="text-muted-foreground mt-6">
              You can now start using the ERP system. Access the dashboard to begin.
            </p>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex justify-between border-t border-border/50 p-6">
        {step > 1 && (
          <Button variant="outline" onClick={() => handleStepChange("prev")}>
            Back
          </Button>
        )}
        {step < 4 ? (
          <Button onClick={() => handleStepChange("next")}>
            {step === 3 ? "Next Step" : "Next"}
          </Button>
        ) : (
          <Button onClick={handleComplete} className="bg-primary text-primary-foreground">
            Finish Setup
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

export default function OnboardingSetupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-muted/50 to-background">
      <BusinessSetupWizard 
        businessType="wholesale_saree" 
        onComplete={() => window.location.href = "/"}
        onBack={() => window.location.href = "/onboarding"}
      />
    </div>
  );
}
