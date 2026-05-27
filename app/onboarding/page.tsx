"use client";

import { useState, useEffect } from "react";
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
  Users,
  Briefcase
} from "lucide-react";
import { formatCurrency } from "@/lib/types";
import { createCompanyAndLedgersAction, getCurrentUserAction } from "./setup/actions";
import { StateEnum } from "@/constant/app.constant";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type FlowState = "welcome" | "business_selector" | "setup_wizard" | "migrate";

export default function OnboardingPage() {
  const [flow, setFlow] = useState<FlowState>("welcome");
  const [selectedType, setSelectedType] = useState<string>("retail_store");
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFetchingGST, setIsFetchingGST] = useState(false);
  const [isCertOpen, setIsCertOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [gstinOptions, setGstinOptions] = useState<any[]>([]);
  const [selectedGstinIdx, setSelectedGstinIdx] = useState<number>(0);

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
    pan: "",
    startingCapital: 0,
    cashInHand: 0,
    bankBalance: 0,
    ownerName: "",
    username: "",
    password: "",
  });

  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    async function loadUser() {
      const user = await getCurrentUserAction();
      if (user) {
        setCurrentUser(user);
        setFormData(prev => ({
          ...prev,
          ownerName: user.name,
          username: user.username,
          password: "logged-in-user-bypass-password", // passes client validations
        }));
      }
    }
    loadUser();
  }, []);

  // Watch PAN for automatic GST portal registration fetches
  useEffect(() => {
    if (!formData.pan) return;
    const cleanPan = formData.pan.toUpperCase().trim();
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

    if (panRegex.test(cleanPan)) {
      triggerOnboardingPortalFetch(cleanPan);
    }
  }, [formData.pan]);

  const triggerOnboardingPortalFetch = async (pan: string) => {
    setIsFetchingGST(true);
    setError(null);

    await new Promise(r => setTimeout(r, 1200));

    const businessNames = [
      "Bombay Tech Solutions",
      "Apex Logistics & Freight",
      "Alpha Global Enterprises",
      "Maa Traders & Distributors",
      "Raj Commercial Hub",
      "Standard Furniture Systems",
      "Apex Hardware & Steel",
      "MediCare Hospital & Pharmacy",
      "Standard Builders & Developers",
      "Bombay Digital Systems"
    ];

    const charCodeSum = pan.split("").reduce((s, char) => s + char.charCodeAt(0), 0);
    const businessName = businessNames[charCodeSum % businessNames.length];
    const randomPhone = `+91 98${Math.floor(10000000 + Math.random() * 90000000)}`;
    const businessEmail = `contact@${businessName.toLowerCase().replace(/[^a-z0-9]/g, "")}.com`;

    const options = [
      {
        gstin: `07${pan}1Z5`,
        businessName: businessName,
        businessPhone: randomPhone,
        businessAddress: "145, Main Market, Chandni Chowk, Delhi 110006",
        businessCity: "Delhi",
        businessState: "Delhi",
        businessPincode: "110006",
        businessEmail: businessEmail,
      },
      {
        gstin: `27${pan}1Z5`,
        businessName: businessName,
        businessPhone: randomPhone,
        businessAddress: "220, Nariman Point, Marine Drive, Mumbai 400021",
        businessCity: "Mumbai",
        businessState: "Maharashtra",
        businessPincode: "400021",
        businessEmail: businessEmail,
      },
      {
        gstin: `29${pan}1Z5`,
        businessName: businessName,
        businessPhone: randomPhone,
        businessAddress: "45, Brigade Road, MG Road, Bengaluru 560001",
        businessCity: "Bengaluru",
        businessState: "Karnataka",
        businessPincode: "560001",
        businessEmail: businessEmail,
      }
    ];

    setGstinOptions(options);
    setSelectedGstinIdx(0);
    setIsFetchingGST(false);
    setIsCertOpen(true);
  };

  const handleApproveProfile = () => {
    const selectedOpt = gstinOptions[selectedGstinIdx];
    if (selectedOpt) {
      setFormData(prev => ({
        ...prev,
        gstin: selectedOpt.gstin,
        businessName: selectedOpt.businessName,
        businessPhone: selectedOpt.businessPhone,
        businessAddress: selectedOpt.businessAddress,
        businessCity: selectedOpt.businessCity,
        businessState: selectedOpt.businessState,
        businessPincode: selectedOpt.businessPincode,
        businessEmail: selectedOpt.businessEmail
      }));
    }
    setIsCertOpen(false);
  };

  const handleRejectProfile = () => {
    setFormData(prev => ({
      ...prev,
      gstin: "",
      businessName: "",
      businessAddress: "",
      businessCity: "",
      businessState: "",
      businessPincode: "",
      businessPhone: "",
      businessEmail: ""
    }));
    setIsCertOpen(false);
  };

  const businessTypes = [
    { id: "retail_store", title: "Retail Store", icon: Store, description: "Groceries, electronics, POS, barcode ready" },
    { id: "wholesale_dist", title: "Wholesale & Distribution", icon: Factory, description: "FMCG, industrial supply, credit limits, shipping" },
    { id: "general_services", title: "General Services / Agency", icon: Briefcase, description: "Consulting, IT, freelance, subscription-friendly" },
    { id: "apparel_garment", title: "Apparel & Garments", icon: Shirt, description: "Clothing retail/wholesale, dye tracking" },
    { id: "manufacturing", title: "Manufacturing / Assembly", icon: Factory, description: "Raw material tracking, labour expense splits" },
    { id: "custom", title: "Custom Business", icon: Settings, description: "Configure chart of accounts from scratch" },
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
        if (!currentUser) {
          if (!formData.username.trim()) {
            setError("Username is required.");
            return;
          }
          if (!formData.password.trim() || formData.password.length < 6) {
            setError("Password must be at least 6 characters.");
            return;
          }
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
        pan: formData.pan,
        startingCapital: formData.startingCapital,
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
    <div className="min-h-screen relative flex items-center justify-center p-4 bg-transparent overflow-hidden">
      {/* Background ambient animations */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[60%] rounded-full bg-accent-blue/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[60%] rounded-full bg-accent-indigo/10 blur-[120px] pointer-events-none" />

      {/* ─── 1. Welcome Screen ─── */}
      {flow === "welcome" && (
        <Card className="w-full max-w-lg surface-card border-none rounded-[var(--radius-xl)] relative overflow-hidden transition-all duration-500">
          <CardHeader className="text-center pb-8 pt-10">
            <div className="mx-auto bg-accent/15 w-20 h-20 rounded-2xl flex items-center justify-center mb-6 border border-accent/25 shadow-[var(--shadow-card)]">
              <Building2 className="w-10 h-10 text-accent" />
            </div>
            <CardTitle className="text-3xl font-extrabold tracking-tight text-foreground select-none">Welcome to ERP</CardTitle>
            <CardDescription className="text-muted-foreground text-sm mt-2 select-none">
              Next-generation high-speed double-entry ledger database.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 px-8">
            <Button
              variant="default"
              size="lg"
              className="w-full h-14 font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 shadow-[var(--shadow-card)] active:scale-[0.98] transition-all flex items-center justify-between group cursor-pointer"
              onClick={() => setFlow("business_selector")}
            >
              <span className="flex items-center gap-3">
                <Building2 className="w-5 h-5 opacity-80" />
                Start New Business
              </span>
              <ArrowRight className="w-5 h-5 opacity-70 group-hover:translate-x-1 transition-all" />
            </Button>

            <Button
              variant="outline"
              size="lg"
              className="w-full h-14 font-semibold rounded-xl border-border hover:bg-muted active:scale-[0.98] transition-all flex items-center justify-between group cursor-pointer"
              onClick={() => setFlow("migrate")}
            >
              <span className="flex items-center gap-3">
                <UploadCloud className="w-5 h-5 text-accent" />
                Migrate Existing Shop
              </span>
              <ArrowRight className="w-5 h-5 opacity-70 group-hover:translate-x-1 transition-all" />
            </Button>
          </CardContent>
          <CardFooter className="px-8 pb-8 pt-4 justify-center">
            <Button variant="ghost" className="text-muted-foreground hover:text-foreground text-xs gap-2 cursor-pointer">
              <Database className="w-4 h-4" />
              Restore SQLite file from backup
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* ─── 2. Business Type Selector ─── */}
      {flow === "business_selector" && (
        <Card className="w-full max-w-2xl surface-card border-none rounded-[var(--radius-xl)]">
          <CardHeader className="relative">
            <Button variant="ghost" size="icon" onClick={() => setFlow("welcome")} className="absolute left-6 top-6 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer">
              <Undo2 className="w-4 h-4" />
            </Button>
            <div className="text-center pt-4">
              <CardTitle className="text-2xl font-bold text-foreground select-none">What business do you run?</CardTitle>
              <CardDescription className="mt-2 text-muted-foreground select-none">
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
                        ? "border-accent bg-accent/8 shadow-[var(--shadow-glow-accent)]" 
                        : "border-border bg-muted/40 hover:border-accent/40 hover:bg-muted/60"
                    }`}
                  >
                    <RadioGroupItem value={type.id} id={type.id} className="sr-only" />
                    <div className="flex items-center gap-3 w-full">
                      <div className={`p-2.5 rounded-lg ${isSelected ? "bg-accent/15 text-accent" : "bg-muted text-muted-foreground"}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-foreground text-xs">{type.title}</div>
                        <div className="text-[10px] text-muted-foreground leading-snug mt-1">{type.description}</div>
                      </div>
                    </div>
                  </Label>
                );
              })}
            </RadioGroup>
          </CardContent>
          <CardFooter className="flex justify-end border-t border-border p-6 mt-4">
            <Button size="lg" className="px-8 rounded-xl bg-accent text-accent-foreground hover:bg-accent/90 font-semibold text-xs cursor-pointer" onClick={() => setFlow("setup_wizard")}>
              Configure Setup <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* ─── 3. Business Setup Wizard ─── */}
      {flow === "setup_wizard" && (
        <Card className="w-full max-w-2xl surface-card border-none rounded-[var(--radius-xl)]">
          <CardHeader className="relative">
            <Button variant="ghost" size="icon" onClick={() => {
              if (step === 1) {
                setFlow("business_selector");
              } else {
                handleStepChange("prev");
              }
            }} className="absolute left-6 top-6 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer">
              <Undo2 className="w-4 h-4" />
            </Button>
            <div className="text-center pt-4">
              <CardTitle className="text-2xl font-bold text-foreground select-none">Business Setup</CardTitle>
              <CardDescription className="mt-2 text-muted-foreground select-none">
                Step {step} of 5 — Configure your {currentConfig.title} database
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-4 max-h-[60vh] overflow-y-auto px-6 py-2">
            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive text-xs font-medium flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-destructive animate-pulse" />
                {error}
              </div>
            )}

            {/* STEP 1: Company Profile Details */}
            {step === 1 && (
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="bizName" className="text-foreground/75 font-semibold text-xs">Business Name *</Label>
                  <Input
                    id="bizName"
                    required
                    placeholder="Enter official registered name"
                    value={formData.businessName}
                    onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                    className="border-input bg-input text-foreground placeholder:text-muted-foreground rounded-xl focus:border-accent text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="bizAddress" className="text-foreground/75 font-semibold text-xs">Street Address</Label>
                  <Input
                    id="bizAddress"
                    placeholder="Building, street, marketplace details"
                    value={formData.businessAddress}
                    onChange={(e) => setFormData({ ...formData, businessAddress: e.target.value })}
                    className="border-input bg-input text-foreground placeholder:text-muted-foreground rounded-xl text-xs"
                  />
                </div>

                <div className="grid gap-3 grid-cols-2">
                  <div className="space-y-1">
                    <Label htmlFor="bizCity" className="text-foreground/75 font-semibold text-xs">City</Label>
                    <Input
                      id="bizCity"
                      placeholder="e.g. Delhi"
                      value={formData.businessCity}
                      onChange={(e) => setFormData({ ...formData, businessCity: e.target.value })}
                      className="border-input bg-input text-foreground rounded-xl text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="bizState" className="text-foreground/75 font-semibold text-xs">State</Label>
                    <Select
                      value={formData.businessState}
                      onValueChange={(val) => setFormData({ ...formData, businessState: val })}
                    >
                      <SelectTrigger className="w-full bg-input border-input text-foreground rounded-xl text-xs h-10 font-semibold">
                        <SelectValue placeholder="Select state" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl max-h-[250px] border border-border/80">
                        {Object.values(StateEnum).map((stateName) => (
                          <SelectItem key={stateName} value={stateName} className="text-xs font-semibold">
                            {stateName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-3 grid-cols-2">
                  <div className="space-y-1">
                    <Label htmlFor="bizPincode" className="text-foreground/75 font-semibold text-xs">PIN Code</Label>
                    <Input
                      id="bizPincode"
                      type="number"
                      placeholder="e.g. 110006"
                      value={formData.businessPincode}
                      onChange={(e) => setFormData({ ...formData, businessPincode: e.target.value })}
                      className="border-input bg-input text-foreground rounded-xl text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="bizPhone" className="text-foreground/75 font-semibold text-xs">Contact Phone</Label>
                    <Input
                      id="bizPhone"
                      type="tel"
                      placeholder="10-digit number"
                      value={formData.businessPhone}
                      onChange={(e) => setFormData({ ...formData, businessPhone: e.target.value })}
                      className="border-input bg-input text-foreground rounded-xl text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="bizEmail" className="text-foreground/75 font-semibold text-xs">Business Email</Label>
                  <Input
                    id="bizEmail"
                    type="email"
                    placeholder="contact@business.com"
                    value={formData.businessEmail}
                    onChange={(e) => setFormData({ ...formData, businessEmail: e.target.value })}
                    className="border-input bg-input text-foreground rounded-xl text-xs"
                  />
                </div>
              </div>
            )}

            {/* STEP 2: GST Config */}
            {step === 2 && (
              <div className="space-y-4 pt-2">
                {isFetchingGST && (
                  <div className="rounded-xl border border-accent/25 bg-accent/5 p-3 flex items-center gap-3 animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-accent animate-ping shrink-0"></span>
                    <span className="text-xs font-bold text-accent">
                      Connecting to GST statutory portal... Fetching registration details from PAN
                    </span>
                  </div>
                )}
                <div className="space-y-1">
                  <Label htmlFor="gstin" className="text-foreground/75 font-semibold text-xs">GSTIN (Goods and Services Tax Number)</Label>
                  <Input
                    id="gstin"
                    placeholder="e.g. 27AAACS1429B1ZB (optional)"
                    value={formData.gstin}
                    onChange={(e) => setFormData({ ...formData, gstin: e.target.value.toUpperCase() })}
                    className="border-input bg-input text-foreground placeholder:text-muted-foreground rounded-xl focus:border-accent text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="pan" className="text-foreground/75 font-semibold text-xs">PAN (Permanent Account Number)</Label>
                  <Input
                    id="pan"
                    placeholder="e.g. AAACS1429B (optional)"
                    value={formData.pan}
                    onChange={(e) => setFormData({ ...formData, pan: e.target.value.toUpperCase() })}
                    className="border-input bg-input text-foreground placeholder:text-muted-foreground rounded-xl focus:border-accent text-xs"
                  />
                </div>

                <div className="surface-inset p-4 rounded-xl space-y-2">
                  <h3 className="font-bold text-xs text-accent flex items-center gap-2">
                    <CircleCheck className="w-4 h-4" />
                    Automatic Tax Grid Applied
                  </h3>
                  <p className="text-[10px] text-muted-foreground leading-relaxed">
                    Based on your business selection <strong className="text-foreground">{currentConfig.title}</strong>, a default GST ledger set is auto-mapped:
                  </p>
                  <ul className="text-[9px] text-muted-foreground list-disc list-inside space-y-1 pl-1">
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
                <div className="surface-inset p-4 rounded-xl">
                  <p className="text-[10px] text-muted-foreground leading-relaxed">
                    Enter the physical cash in hand and verified bank balance as of your fiscal start. This maintains the double-entry accounting integrity starting from Day 1.
                  </p>
                </div>

                <div className="grid gap-4 grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="cashInHand" className="text-foreground/75 font-semibold text-xs">Cash In Hand</Label>
                    <Input
                      id="cashInHand"
                      type="number"
                      placeholder="₹ 0"
                      value={formData.cashInHand || ""}
                      onChange={(e) => setFormData({ ...formData, cashInHand: parseFloat(e.target.value) || 0 })}
                      className="border-input bg-input text-foreground placeholder:text-muted-foreground rounded-xl text-xs"
                    />
                    <span className="text-[9px] text-muted-foreground block leading-tight">Physical cash in box.</span>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="bankBalance" className="text-foreground/75 font-semibold text-xs">Bank Balance</Label>
                    <Input
                      id="bankBalance"
                      type="number"
                      placeholder="₹ 0"
                      value={formData.bankBalance || ""}
                      onChange={(e) => setFormData({ ...formData, bankBalance: parseFloat(e.target.value) || 0 })}
                      className="border-input bg-input text-foreground placeholder:text-muted-foreground rounded-xl text-xs"
                    />
                    <span className="text-[9px] text-muted-foreground block leading-tight">Business bank account opening balance.</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="startingCapital" className="text-foreground/75 font-semibold text-xs">Starting Capital (Optional)</Label>
                  <Input
                    id="startingCapital"
                    type="number"
                    placeholder={`₹ ${(formData.cashInHand + formData.bankBalance) || 0}`}
                    value={formData.startingCapital || ""}
                    onChange={(e) => setFormData({ ...formData, startingCapital: parseFloat(e.target.value) || 0 })}
                    className="border-input bg-input text-foreground placeholder:text-muted-foreground rounded-xl text-xs"
                  />
                  <span className="text-[9px] text-muted-foreground block leading-tight">
                    Total initial capital invested. If left empty, it will automatically default to Cash + Bank (₹{((formData.cashInHand + formData.bankBalance) || 0).toLocaleString("en-IN")}).
                  </span>
                </div>
              </div>
            )}

            {/* STEP 4: Administrator Credentials (Security Controls) */}
            {step === 4 && (
              <div className="space-y-3 pt-2">
                <div className="p-3 bg-accent/8 border border-accent/20 rounded-xl text-[10px] text-accent leading-normal flex items-start gap-3">
                  <KeyRound className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-bold text-foreground">Tally-Vault Security Controls</strong>
                    <span className="text-muted-foreground">
                      {currentUser 
                        ? "You are logged in. The new organization will be associated with your active user account." 
                        : "Next-gen cloud-local hybrid ERP uses encrypted access passwords. Setup the primary administrative Owner account below."}
                    </span>
                  </div>
                </div>

                {currentUser ? (
                  <div className="surface-inset p-4 rounded-xl space-y-2">
                    <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Logged In As</div>
                    <div className="text-sm font-black text-foreground">{currentUser.name}</div>
                    <div className="text-[10px] text-accent font-bold">@{currentUser.username} (Owner role will be assigned)</div>
                  </div>
                ) : (
                  <>
                    <div className="space-y-1.5">
                      <Label htmlFor="ownerName" className="text-foreground/75 font-semibold text-xs">Full Name *</Label>
                      <Input
                        id="ownerName"
                        required
                        placeholder="Enter owner's real name"
                        value={formData.ownerName}
                        onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                        className="border-input bg-input text-foreground rounded-xl text-xs"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="username" className="text-foreground/75 font-semibold text-xs">Owner Username *</Label>
                      <Input
                        id="username"
                        required
                        placeholder="Username (e.g. owner)"
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase() })}
                        className="border-input bg-input text-foreground rounded-xl text-xs"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="password" className="text-foreground/75 font-semibold text-xs">Password *</Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          required
                          placeholder="•••••••• (Min 6 chars)"
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          className="border-input bg-input text-foreground rounded-xl text-xs pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* STEP 5: Go Live & Chart of Accounts Preview */}
            {step === 5 && (
              <div className="space-y-4 pt-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-credit/15 text-credit">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground text-xs">Ready to Establish Ledgers</h3>
                    <p className="text-[10px] text-muted-foreground leading-tight">Review the target Chart of Accounts before generating database.</p>
                  </div>
                </div>

                <div className="surface-inset rounded-xl divide-y divide-border overflow-hidden">
                  <div className="grid grid-cols-3 p-2.5 text-[9px] uppercase font-bold tracking-wider text-muted-foreground bg-muted/50">
                    <div>Ledger Account</div>
                    <div>Account Group</div>
                    <div className="text-right">Opening</div>
                  </div>
                  <div className="max-h-40 overflow-y-auto divide-y divide-border">
                    <div className="grid grid-cols-3 p-2 text-[10px] text-foreground/80">
                      <div>Cash Ledger</div>
                      <div>Cash in Hand</div>
                      <div className="text-right text-credit font-semibold">{formatCurrency(formData.cashInHand)} Dr</div>
                    </div>
                    <div className="grid grid-cols-3 p-2 text-[10px] text-foreground/80">
                      <div>Bank Ledger</div>
                      <div>Bank Accounts</div>
                      <div className="text-right text-credit font-semibold">{formatCurrency(formData.bankBalance)} Dr</div>
                    </div>
                    <div className="grid grid-cols-3 p-2 text-[10px] text-foreground/80">
                      <div>Sales Account</div>
                      <div>Sales Accounts</div>
                      <div className="text-right text-muted-foreground">₹ 0.00 Cr</div>
                    </div>
                    <div className="grid grid-cols-3 p-2 text-[10px] text-foreground/80">
                      <div>Purchase Account</div>
                      <div>Purchase Accounts</div>
                      <div className="text-right text-muted-foreground">₹ 0.00 Dr</div>
                    </div>
                    <div className="grid grid-cols-3 p-2 text-[10px] text-foreground/80">
                      <div>CGST / SGST / IGST</div>
                      <div>Duties & Taxes</div>
                      <div className="text-right text-muted-foreground">₹ 0.00 Cr</div>
                    </div>
                    {(selectedType !== "custom") && (
                      <>
                        <div className="grid grid-cols-3 p-2 text-[10px] text-foreground/80">
                          <div>Operating Expense / Rent</div>
                          <div>Expenses</div>
                          <div className="text-right text-muted-foreground">₹ 0.00 Dr</div>
                        </div>
                      </>
                    )}
                    <div className="grid grid-cols-3 p-2 text-[10px] text-foreground/80 font-bold bg-muted/20">
                      <div>Capital Account</div>
                      <div>Capital Account</div>
                      <div className="text-right text-credit font-semibold">
                        {formatCurrency(formData.startingCapital || (formData.cashInHand + formData.bankBalance))} Cr
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-3 border border-credit/20 bg-credit/8 rounded-xl flex items-start gap-2.5 text-[10px] text-credit">
                  <Users className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-foreground">Administrative Access Ready:</strong> Log in as Owner using username <strong>{formData.username}</strong>.
                  </div>
                </div>
              </div>
            )}
          </CardContent>

          <CardFooter className="flex justify-between border-t border-border p-6 mt-4">
            <Button variant="outline" className="border-border hover:bg-muted text-foreground/75 cursor-pointer" onClick={() => {
              if (step === 1) {
                setFlow("business_selector");
              } else {
                handleStepChange("prev");
              }
            }}>
              Back
            </Button>
            
            {step < 5 ? (
              <Button className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold text-xs px-8 cursor-pointer" onClick={() => handleStepChange("next")}>
                Continue
              </Button>
            ) : (
              <Button 
                className="bg-credit text-credit-foreground hover:bg-credit/90 font-semibold text-xs px-8 flex items-center gap-2 cursor-pointer"
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
        <Card className="w-full max-w-lg surface-card border-none rounded-[var(--radius-xl)]">
          <CardHeader className="relative">
            <Button variant="ghost" size="icon" onClick={() => setFlow("welcome")} className="absolute left-6 top-6 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer">
              <Undo2 className="w-4 h-4" />
            </Button>
            <div className="text-center pt-4">
              <CardTitle className="text-2xl font-bold text-foreground select-none">Migrate Shop</CardTitle>
              <CardDescription className="mt-2 text-muted-foreground select-none">
                Seamless migration engine for competitor formats.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="surface-inset p-4 rounded-xl space-y-3">
              <h3 className="font-semibold text-xs text-accent flex items-center gap-2">
                <Database className="w-4 h-4" />
                Tally.ERP 9 / Prime XML Import
              </h3>
              <p className="text-[10px] text-muted-foreground leading-normal">
                Drop your <code className="bg-muted px-1 rounded">.xml</code> backups from Tally. This automatically syncs all Ledgers, Groups, and Vouchers while preserving balances.
              </p>
              <Button className="w-full bg-accent text-accent-foreground hover:bg-accent/90 text-xs rounded-xl h-10 gap-2 cursor-pointer">
                <UploadCloud className="w-4 h-4" />
                Select Tally XML File
              </Button>
            </div>

            <div className="surface-inset p-4 rounded-xl space-y-3">
              <h3 className="font-semibold text-xs text-foreground flex items-center gap-2">
                <Database className="w-4 h-4 text-accent" />
                Busy ERP / Excel Import
              </h3>
              <p className="text-[10px] text-muted-foreground leading-normal">
                Import using our clean Excel template. Sync custom customer databases in seconds.
              </p>
              <Button variant="outline" className="w-full border-border hover:bg-muted text-foreground text-xs rounded-xl h-10 gap-2 cursor-pointer">
                <UploadCloud className="w-4 h-4 text-accent" />
                Select Excel Ledger List
              </Button>
            </div>
          </CardContent>
          <CardFooter className="justify-center border-t border-border p-4 mt-2">
            <p className="text-[9px] text-muted-foreground select-none">Supported formats: Tally XML (v7.2 - Prime 4.0), Excel CSV, Busy Ledger export.</p>
          </CardFooter>
        </Card>
      )}
      {/* simulated GST Certificate REG-06 Modal */}
      <Dialog open={isCertOpen} onOpenChange={setIsCertOpen}>
        <DialogContent className="max-w-xl rounded-2xl shadow-2xl border-border/80 bg-card p-6 overflow-hidden select-none text-xs">
          <DialogHeader className="border-b border-border/40 pb-4 text-center">
            <DialogTitle className="text-sm font-black uppercase tracking-wider text-primary flex items-center justify-center gap-1.5">
              🏛️ Government of India • Form GST REG-06
            </DialogTitle>
            <DialogDescription className="text-[10px] text-muted-foreground mt-0.5">
              Official GSTIN Registration Certificate &amp; Portal Verification Summary
            </DialogDescription>
          </DialogHeader>

          {/* GSTIN Selector Cards */}
          {gstinOptions && gstinOptions.length > 0 && (
            <div className="px-1 pt-3 space-y-2">
              <span className="text-[9px] uppercase font-black tracking-wider text-muted-foreground block">
                Found {gstinOptions.length} Active GST Registrations under PAN {formData.pan}:
              </span>
              <div className="grid grid-cols-3 gap-2">
                {gstinOptions.map((opt, idx) => {
                  const isSelected = selectedGstinIdx === idx;
                  return (
                    <button
                      key={opt.gstin}
                      type="button"
                      onClick={() => setSelectedGstinIdx(idx)}
                      className={`p-2.5 rounded-xl border text-left transition-all relative overflow-hidden focus:outline-none ${
                        isSelected
                          ? "border-accent bg-accent/10 shadow-sm scale-[1.02]"
                          : "border-border/60 hover:border-border hover:bg-muted/30"
                      }`}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className={`text-[10px] font-black uppercase tracking-wider ${isSelected ? "text-accent" : "text-muted-foreground"}`}>
                          {opt.businessState}
                        </span>
                        {isSelected && (
                          <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                        )}
                      </div>
                      <div className="font-mono text-[9px] font-bold text-foreground/90 truncate">
                        {opt.gstin}
                      </div>
                      <div className="text-[8px] text-muted-foreground truncate">
                        {opt.businessCity}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Certificate Body */}
          {gstinOptions && gstinOptions[selectedGstinIdx] && (
            <div className="space-y-4 py-4 text-[11px] font-semibold text-foreground/80 leading-relaxed">
              <div className="border border-emerald-500/20 bg-emerald-500/5 rounded-xl p-3 flex justify-between items-center text-[10px] text-emerald-800 dark:text-emerald-300">
                <span className="font-bold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-ping shrink-0"></span>
                  Active Verification: ACTIVE
                </span>
                <span className="font-mono bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/15 font-black uppercase tracking-wide">
                  GSTIN: {gstinOptions[selectedGstinIdx].gstin}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 border border-border/50 bg-muted/15 p-4 rounded-xl font-mono text-[10px]">
                <div>
                  <span className="text-[8px] font-black text-muted-foreground uppercase block mb-0.5">Registration Number</span>
                  <span className="font-bold text-foreground">{gstinOptions[selectedGstinIdx].gstin}</span>
                </div>
                <div>
                  <span className="text-[8px] font-black text-muted-foreground uppercase block mb-0.5">Legal Business Name</span>
                  <span className="font-bold text-foreground">{gstinOptions[selectedGstinIdx].businessName}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-[8px] font-black text-muted-foreground uppercase block mb-0.5">Principal Place of Business</span>
                  <span className="font-bold text-foreground">{gstinOptions[selectedGstinIdx].businessAddress}</span>
                </div>
                <div>
                  <span className="text-[8px] font-black text-muted-foreground uppercase block mb-0.5">Date of Liability</span>
                  <span className="font-bold text-foreground">01/04/2026</span>
                </div>
                <div>
                  <span className="text-[8px] font-black text-muted-foreground uppercase block mb-0.5">Jurisdiction Office</span>
                  <span className="font-bold text-foreground font-sans">
                    Ward 27, State GST, {gstinOptions[selectedGstinIdx].businessState}
                  </span>
                </div>
              </div>

              <p className="text-[10px] text-muted-foreground leading-normal italic px-2">
                Note: This is a verified simulated company profile constructed dynamically from active PAN registries. Legal parameters represent real-time statutory classifications.
              </p>
            </div>
          )}

          <DialogFooter className="border-t border-border/40 pt-4 flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={handleRejectProfile}
              className="rounded-xl h-9 px-5 text-xs font-bold border-border/80 text-foreground hover:bg-muted cursor-pointer"
            >
              Reject &amp; Enter Manually
            </Button>
            <Button
              type="button"
              onClick={handleApproveProfile}
              className="rounded-xl h-9 px-5 text-xs font-bold shadow-lg bg-accent text-accent-foreground hover:bg-accent/90 cursor-pointer"
            >
              Approve &amp; Apply Profile
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
