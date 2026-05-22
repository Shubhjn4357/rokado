"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { 
  Building2, 
  ArrowRight, 
  UploadCloud, 
  Database, 
  Undo2, 
  Shirt, 
  Store, 
  ShoppingBag, 
  Factory, 
  PackageOpen, 
  Settings, 
  Eye, 
  EyeOff, 
  CircleCheck, 
  KeyRound, 
  BookOpen,
  Loader2,
  Users
} from "lucide-react";
import { formatCurrency } from "@/lib/types";
import { createCompanyAndLedgersAction } from "./setup/actions";

type FlowState = "welcome" | "business_selector" | "setup_wizard" | "migrate";

export default function OnboardingPage() {
  const [flow, setFlow] = useState<FlowState>("welcome");
  const [selectedType, setSelectedType] = useState<string>("wholesale_saree");
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Wizard Data
  const [formData, setFormData] = useState({
    businessName: "",
    businessAddress: "",
    businessCity: "",
    businessState: "",
    businessPincode: "",
    businessPhone: "",
    businessEmail: "",
    gstin: "",
    cashInHand: 0,
    bankBalance: 0,
    ownerName: "",
    username: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);

  const businessTypes = [
    { id: "wholesale_saree", title: "Saree Wholesale", icon: Shirt, description: "Bulk sales, transport tracking, design catalogs" },
    { id: "textile_retail", title: "Textile Retail", icon: Store, description: "Fast POS, barcode scanning, shift management" },
    { id: "garment_store", title: "Garment Store", icon: ShoppingBag, description: "Sizes, colors, multi-warehouse" },
    { id: "distributor", title: "Distributor", icon: Factory, description: "Credit limits, route planning, bulk discounts" },
    { id: "mixed_inventory", title: "Mixed Inventory", icon: PackageOpen, description: "Generic retail and wholesale" },
    { id: "custom", title: "Custom", icon: Settings, description: "Configure from scratch" },
  ];

  const currentConfig = businessTypes.find(t => t.id === selectedType) || {
    title: "Custom Business",
    description: "Configure from scratch",
  };

  const handleStepChange = (direction: "next" | "prev") => {
    setError(null);
    if (direction === "next") {
      if (step === 1 && !formData.businessName.trim()) {
        setError("Business Name is required.");
        return;
      }
      if (step === 4) {
        if (!formData.ownerName.trim()) {
          setError("Administrator Name is required.");
          return;
        }
        if (!formData.username.trim()) {
          setError("Username is required.");
          return;
        }
        if (!formData.password.trim() || formData.password.length < 6) {
          setError("Password must be at least 6 characters.");
          return;
        }
      }
      setStep(prev => Math.min(5, prev + 1));
    } else {
      setStep(prev => Math.max(1, prev - 1));
    }
  };

  const handleCompleteSetup = async () => {
    setIsLoading(true);
    setError(null);

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
        businessType: selectedType,
        cashInHand: formData.cashInHand,
        bankBalance: formData.bankBalance,
        ownerName: formData.ownerName,
        username: formData.username,
        password: formData.password,
      });

      if (!result.success) {
        setError(result.error || "Setup failed. Please try again.");
      } else {
        // Redirect to dashboard now that they are logged in and company is built
        window.location.href = "/dashboard";
      }
    } catch (err) {
      setError("An unexpected error occurred during company creation.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 bg-[#030712] overflow-hidden">
      {/* Background ambient animations */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[60%] rounded-full bg-blue-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[60%] rounded-full bg-violet-600/10 blur-[120px] pointer-events-none" />

      {/* ─── 1. Welcome Screen ─── */}
      {flow === "welcome" && (
        <Card className="w-full max-w-lg shadow-2xl bg-slate-900/60 border-white/10 backdrop-blur-2xl relative overflow-hidden transition-all duration-500 hover:shadow-blue-500/5">
          <CardHeader className="text-center pb-8 pt-10">
            <div className="mx-auto bg-gradient-to-br from-blue-500/20 to-violet-500/20 w-20 h-20 rounded-2xl flex items-center justify-center mb-6 border border-white/10 shadow-lg shadow-black/40">
              <Building2 className="w-10 h-10 text-blue-400" />
            </div>
            <CardTitle className="text-3xl font-extrabold tracking-tight text-white">Welcome to ERP</CardTitle>
            <CardDescription className="text-gray-400 text-sm mt-2">
              Next-generation high-speed double-entry ledger database.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 px-8">
            <Button
              variant="default"
              size="lg"
              className="w-full h-14 text-white font-semibold rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all flex items-center justify-between group"
              onClick={() => setFlow("business_selector")}
            >
              <span className="flex items-center gap-3">
                <Building2 className="w-5 h-5 text-blue-200" />
                Start New Business
              </span>
              <ArrowRight className="w-5 h-5 opacity-70 group-hover:translate-x-1 transition-all" />
            </Button>

            <Button
              variant="outline"
              size="lg"
              className="w-full h-14 text-gray-300 font-semibold rounded-xl border-white/10 bg-white/5 hover:bg-white/10 active:scale-[0.98] transition-all flex items-center justify-between group"
              onClick={() => setFlow("migrate")}
            >
              <span className="flex items-center gap-3">
                <UploadCloud className="w-5 h-5 text-violet-400" />
                Migrate Existing Shop
              </span>
              <ArrowRight className="w-5 h-5 opacity-70 group-hover:translate-x-1 transition-all" />
            </Button>
          </CardContent>
          <CardFooter className="px-8 pb-8 pt-4 justify-center">
            <Button variant="ghost" className="text-gray-500 hover:text-white text-xs gap-2">
              <Database className="w-4 h-4" />
              Restore SQLite file from backup
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* ─── 2. Business Type Selector ─── */}
      {flow === "business_selector" && (
        <Card className="w-full max-w-2xl shadow-2xl bg-slate-900/60 border-white/10 backdrop-blur-2xl">
          <CardHeader className="relative">
            <Button variant="ghost" size="icon" onClick={() => setFlow("welcome")} className="absolute left-6 top-6 rounded-full hover:bg-white/5 text-gray-400 hover:text-white">
              <Undo2 className="w-4 h-4" />
            </Button>
            <div className="text-center pt-4">
              <CardTitle className="text-2xl font-bold text-white">What business do you run?</CardTitle>
              <CardDescription className="mt-2 text-gray-400">
                This will automatically pre-configure your chart of accounts, default GST rates, and tax grids.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <RadioGroup value={selectedType} onValueChange={setSelectedType} className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
              {businessTypes.map((type) => {
                const Icon = type.icon;
                const isSelected = selectedType === type.id;
                return (
                  <Label
                    key={type.id}
                    htmlFor={type.id}
                    className={`flex flex-col items-start p-4 rounded-xl border cursor-pointer transition-all ${
                      isSelected 
                        ? "border-blue-500 bg-blue-500/10" 
                        : "border-white/5 bg-white/5 hover:border-white/10 hover:bg-white/10"
                    }`}
                  >
                    <RadioGroupItem value={type.id} id={type.id} className="sr-only" />
                    <div className="flex items-center gap-3 w-full">
                      <div className={`p-2.5 rounded-lg ${isSelected ? "bg-blue-500/20 text-blue-400" : "bg-white/5 text-gray-400"}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-white text-xs">{type.title}</div>
                        <div className="text-[10px] text-gray-400 leading-snug mt-1">{type.description}</div>
                      </div>
                    </div>
                  </Label>
                );
              })}
            </RadioGroup>
          </CardContent>
          <CardFooter className="flex justify-end border-t border-white/5 p-6 mt-4">
            <Button size="lg" className="px-8 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs" onClick={() => setFlow("setup_wizard")}>
              Configure Setup <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* ─── 3. Business Setup Wizard ─── */}
      {flow === "setup_wizard" && (
        <Card className="w-full max-w-2xl shadow-2xl bg-slate-900/60 border-white/10 backdrop-blur-2xl">
          <CardHeader className="relative">
            <Button variant="ghost" size="icon" onClick={() => {
              if (step === 1) {
                setFlow("business_selector");
              } else {
                handleStepChange("prev");
              }
            }} className="absolute left-6 top-6 rounded-full hover:bg-white/5 text-gray-400 hover:text-white">
              <Undo2 className="w-4 h-4" />
            </Button>
            <div className="text-center pt-4">
              <CardTitle className="text-2xl font-bold text-white">Business Setup</CardTitle>
              <CardDescription className="mt-2 text-gray-400">
                Step {step} of 5 - Configure your {currentConfig.title} database
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-4 max-h-[60vh] overflow-y-auto px-6 py-2">
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs font-medium flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                {error}
              </div>
            )}

            {/* STEP 1: Company Profile Details */}
            {step === 1 && (
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="bizName" className="text-gray-300 font-semibold text-xs">Business Name *</Label>
                  <Input
                    id="bizName"
                    required
                    placeholder="Enter official registered name"
                    value={formData.businessName}
                    onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                    className="border-white/10 bg-white/5 text-white placeholder-gray-500 rounded-xl focus:border-blue-500 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="bizAddress" className="text-gray-300 font-semibold text-xs">Street Address</Label>
                  <Input
                    id="bizAddress"
                    placeholder="Building, street, marketplace details"
                    value={formData.businessAddress}
                    onChange={(e) => setFormData({ ...formData, businessAddress: e.target.value })}
                    className="border-white/10 bg-white/5 text-white placeholder-gray-500 rounded-xl text-xs"
                  />
                </div>

                <div className="grid gap-3 grid-cols-2">
                  <div className="space-y-1">
                    <Label htmlFor="bizCity" className="text-gray-300 font-semibold text-xs">City</Label>
                    <Input
                      id="bizCity"
                      placeholder="e.g. Delhi"
                      value={formData.businessCity}
                      onChange={(e) => setFormData({ ...formData, businessCity: e.target.value })}
                      className="border-white/10 bg-white/5 text-white rounded-xl text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="bizState" className="text-gray-300 font-semibold text-xs">State</Label>
                    <Input
                      id="bizState"
                      placeholder="e.g. Delhi"
                      value={formData.businessState}
                      onChange={(e) => setFormData({ ...formData, businessState: e.target.value })}
                      className="border-white/10 bg-white/5 text-white rounded-xl text-xs"
                    />
                  </div>
                </div>

                <div className="grid gap-3 grid-cols-2">
                  <div className="space-y-1">
                    <Label htmlFor="bizPincode" className="text-gray-300 font-semibold text-xs">PIN Code</Label>
                    <Input
                      id="bizPincode"
                      type="number"
                      placeholder="e.g. 110006"
                      value={formData.businessPincode}
                      onChange={(e) => setFormData({ ...formData, businessPincode: e.target.value })}
                      className="border-white/10 bg-white/5 text-white rounded-xl text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="bizPhone" className="text-gray-300 font-semibold text-xs">Contact Phone</Label>
                    <Input
                      id="bizPhone"
                      type="tel"
                      placeholder="10-digit number"
                      value={formData.businessPhone}
                      onChange={(e) => setFormData({ ...formData, businessPhone: e.target.value })}
                      className="border-white/10 bg-white/5 text-white rounded-xl text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="bizEmail" className="text-gray-300 font-semibold text-xs">Business Email</Label>
                  <Input
                    id="bizEmail"
                    type="email"
                    placeholder="contact@business.com"
                    value={formData.businessEmail}
                    onChange={(e) => setFormData({ ...formData, businessEmail: e.target.value })}
                    className="border-white/10 bg-white/5 text-white rounded-xl text-xs"
                  />
                </div>
              </div>
            )}

            {/* STEP 2: GST Config */}
            {step === 2 && (
              <div className="space-y-4 pt-2">
                <div className="space-y-1">
                  <Label htmlFor="gstin" className="text-gray-300 font-semibold text-xs">GSTIN (Goods and Services Tax Number)</Label>
                  <Input
                    id="gstin"
                    placeholder="e.g. 27AAACS1429B1ZB (optional)"
                    value={formData.gstin}
                    onChange={(e) => setFormData({ ...formData, gstin: e.target.value.toUpperCase() })}
                    className="border-white/10 bg-white/5 text-white placeholder-gray-500 rounded-xl focus:border-blue-500 text-xs"
                  />
                </div>

                <div className="p-4 bg-slate-950/45 border border-white/5 rounded-xl space-y-2">
                  <h3 className="font-bold text-xs text-blue-400 flex items-center gap-2">
                    <CircleCheck className="w-4 h-4 text-blue-400" />
                    Automatic Tax Grid Applied
                  </h3>
                  <p className="text-[10px] text-gray-400 leading-relaxed">
                    Based on your business selection <strong>{currentConfig.title}</strong>, a default GST ledger set is auto-mapped:
                  </p>
                  <ul className="text-[9px] text-gray-400 list-disc list-inside space-y-1 pl-1">
                    <li>CGST Payable Ledger (Local Central Goods Tax)</li>
                    <li>SGST Payable Ledger (Local State Goods Tax)</li>
                    <li>IGST Payable Ledger (Interstate Goods Tax)</li>
                    <li>Default 5% catalog rules matching wholesale fabrics/textiles.</li>
                  </ul>
                </div>
              </div>
            )}

            {/* STEP 3: Initial Opening Balances */}
            {step === 3 && (
              <div className="space-y-4 pt-2">
                <div className="bg-slate-950/45 border border-white/5 p-4 rounded-xl">
                  <p className="text-[10px] text-gray-400 leading-relaxed">
                    Enter the physical cash in hand and verified bank balance as of your fiscal start. This maintains the double-entry accounting integrity starting from Day 1.
                  </p>
                </div>

                <div className="grid gap-4 grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="cashInHand" className="text-gray-300 font-semibold text-xs">Cash In Hand</Label>
                    <Input
                      id="cashInHand"
                      type="number"
                      placeholder="₹ 0"
                      value={formData.cashInHand || ""}
                      onChange={(e) => setFormData({ ...formData, cashInHand: parseFloat(e.target.value) || 0 })}
                      className="border-white/10 bg-white/5 text-white placeholder-gray-500 rounded-xl text-xs"
                    />
                    <span className="text-[9px] text-gray-500 block leading-tight">Physical cash in box.</span>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="bankBalance" className="text-gray-300 font-semibold text-xs">Bank Balance</Label>
                    <Input
                      id="bankBalance"
                      type="number"
                      placeholder="₹ 0"
                      value={formData.bankBalance || ""}
                      onChange={(e) => setFormData({ ...formData, bankBalance: parseFloat(e.target.value) || 0 })}
                      className="border-white/10 bg-white/5 text-white placeholder-gray-500 rounded-xl text-xs"
                    />
                    <span className="text-[9px] text-gray-500 block leading-tight">Business bank account opening balance.</span>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 4: Administrator Credentials (Security Controls) */}
            {step === 4 && (
              <div className="space-y-3 pt-2">
                <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-[10px] text-blue-300 leading-normal flex items-start gap-3">
                  <KeyRound className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-bold">Tally-Vault Security Controls</strong>
                    Next-gen cloud-local hybrid ERP uses encrypted access passwords. Setup the primary administrative Owner account below.
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="ownerName" className="text-gray-300 font-semibold text-xs">Full Name *</Label>
                  <Input
                    id="ownerName"
                    required
                    placeholder="Enter owner's real name"
                    value={formData.ownerName}
                    onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                    className="border-white/10 bg-white/5 text-white rounded-xl text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="username" className="text-gray-300 font-semibold text-xs">Owner Username *</Label>
                  <Input
                    id="username"
                    required
                    placeholder="Username (e.g. owner)"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase() })}
                    className="border-white/10 bg-white/5 text-white rounded-xl text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-gray-300 font-semibold text-xs">Password *</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      required
                      placeholder="•••••••• (Min 6 chars)"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="border-white/10 bg-white/5 text-white rounded-xl text-xs pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 5: Go Live & Chart of Accounts Preview */}
            {step === 5 && (
              <div className="space-y-4 pt-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-xs">Ready to Establish Ledgers</h3>
                    <p className="text-[10px] text-gray-400 leading-tight">Review the target Chart of Accounts before generating database.</p>
                  </div>
                </div>

                <div className="border border-white/5 bg-slate-950/45 rounded-xl divide-y divide-white/5 overflow-hidden">
                  <div className="grid grid-cols-3 p-2.5 text-[9px] uppercase font-bold tracking-wider text-gray-400 bg-white/5">
                    <div>Ledger Account</div>
                    <div>Account Group</div>
                    <div className="text-right">Opening</div>
                  </div>
                  <div className="max-h-40 overflow-y-auto divide-y divide-white/5">
                    <div className="grid grid-cols-3 p-2 text-[10px] text-gray-300">
                      <div>Cash Ledger</div>
                      <div>Cash in Hand</div>
                      <div className="text-right text-blue-400 font-semibold">{formatCurrency(formData.cashInHand)} Dr</div>
                    </div>
                    <div className="grid grid-cols-3 p-2 text-[10px] text-gray-300">
                      <div>Bank Ledger</div>
                      <div>Bank Accounts</div>
                      <div className="text-right text-blue-400 font-semibold">{formatCurrency(formData.bankBalance)} Dr</div>
                    </div>
                    <div className="grid grid-cols-3 p-2 text-[10px] text-gray-300">
                      <div>Sales Account</div>
                      <div>Sales Accounts</div>
                      <div className="text-right text-gray-500">₹ 0.00 Cr</div>
                    </div>
                    <div className="grid grid-cols-3 p-2 text-[10px] text-gray-300">
                      <div>Purchase Account</div>
                      <div>Purchase Accounts</div>
                      <div className="text-right text-gray-500">₹ 0.00 Dr</div>
                    </div>
                    <div className="grid grid-cols-3 p-2 text-[10px] text-gray-300">
                      <div>CGST / SGST / IGST</div>
                      <div>Duties & Taxes</div>
                      <div className="text-right text-gray-500">₹ 0.00 Cr</div>
                    </div>
                    {(selectedType === "wholesale_saree" || selectedType === "textile_retail") && (
                      <>
                        <div className="grid grid-cols-3 p-2 text-[10px] text-gray-300">
                          <div>Transport & Freight</div>
                          <div>Direct Expenses</div>
                          <div className="text-right text-gray-500">₹ 0.00 Dr</div>
                        </div>
                        <div className="grid grid-cols-3 p-2 text-[10px] text-gray-300">
                          <div>Shop Rent</div>
                          <div>Indirect Expenses</div>
                          <div className="text-right text-gray-500">₹ 0.00 Dr</div>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="p-3 border border-emerald-500/20 bg-emerald-500/10 rounded-xl flex items-start gap-2.5 text-[10px] text-emerald-400">
                  <Users className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong>Administrative Access Ready:</strong> Log in as Owner using username <strong>{formData.username}</strong>.
                  </div>
                </div>
              </div>
            )}
          </CardContent>

          <CardFooter className="flex justify-between border-t border-white/5 p-6 mt-4">
            <Button variant="outline" className="border-white/10 hover:bg-white/5 text-gray-400 hover:text-white" onClick={() => {
              if (step === 1) {
                setFlow("business_selector");
              } else {
                handleStepChange("prev");
              }
            }}>
              Back
            </Button>
            
            {step < 5 ? (
              <Button className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs px-8" onClick={() => handleStepChange("next")}>
                Continue
              </Button>
            ) : (
              <Button 
                className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-semibold text-xs px-8 flex items-center gap-2"
                onClick={handleCompleteSetup}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating core...
                  </>
                ) : (
                  <>
                    <CircleCheck className="w-4 h-4" />
                    Deploy ERP Shell
                  </>
                )}
              </Button>
            )}
          </CardFooter>
        </Card>
      )}

      {/* ─── 4. Migration Screen ─── */}
      {flow === "migrate" && (
        <Card className="w-full max-w-lg shadow-2xl bg-slate-900/60 border-white/10 backdrop-blur-2xl">
          <CardHeader className="relative">
            <Button variant="ghost" size="icon" onClick={() => setFlow("welcome")} className="absolute left-6 top-6 rounded-full hover:bg-white/5 text-gray-400 hover:text-white">
              <Undo2 className="w-4 h-4" />
            </Button>
            <div className="text-center pt-4">
              <CardTitle className="text-2xl font-bold text-white">Migrate Shop</CardTitle>
              <CardDescription className="mt-2 text-gray-400">
                Seamless migration engine for competitor formats.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-slate-950/45 border border-white/5 rounded-xl space-y-3">
              <h3 className="font-semibold text-xs text-blue-400 flex items-center gap-2">
                <Database className="w-4 h-4" />
                Tally.ERP 9 / Prime XML Import
              </h3>
              <p className="text-[10px] text-gray-400 leading-normal">
                Drop your `.xml` backups from Tally. This automatically syncs all Ledgers, Groups, and Vouchers while preserving balances.
              </p>
              <Button className="w-full bg-blue-600 hover:bg-blue-500 text-white text-xs rounded-xl h-10 gap-2">
                <UploadCloud className="w-4 h-4" />
                Select Tally XML File
              </Button>
            </div>

            <div className="p-4 bg-slate-950/45 border border-white/5 rounded-xl space-y-3">
              <h3 className="font-semibold text-xs text-indigo-400 flex items-center gap-2">
                <Database className="w-4 h-4" />
                Busy ERP / Excel Import
              </h3>
              <p className="text-[10px] text-gray-400 leading-normal">
                Import using our clean Excel template. Sync custom customer databases in seconds.
              </p>
              <Button variant="outline" className="w-full border-white/10 hover:bg-white/5 text-gray-300 text-xs rounded-xl h-10 gap-2">
                <UploadCloud className="w-4 h-4 text-indigo-400" />
                Select Excel Ledger List
              </Button>
            </div>
          </CardContent>
          <CardFooter className="justify-center border-t border-white/5 p-4 mt-2">
            <p className="text-[9px] text-gray-500">Supported formats: Tally XML (v7.2 - Prime 4.0), Excel CSV, Busy Ledger export.</p>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
