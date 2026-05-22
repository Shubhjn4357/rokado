"use client";

import { useState, useEffect, useRef } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import {
  Building2,
  DollarSign,
  Banknote,
  Users,
  Settings,
  Layout,
  MessageCircle,
  Mail,
  Phone,
  MapPin,
  RefreshCw,
  CheckCircle2,
  ArrowLeft,
  Sparkles,
  Layers,
  Download,
  AlertTriangle,
  Loader2
} from "lucide-react";
import Link from "next/link";
import { getSettings, saveCompanySettings, saveFinancialSettings, saveTaxSettings, saveNotificationSettings } from "./actions";
import { toast } from "@/components/ui/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { generateRandomBillAction } from "./seeder-actions";
import { exportTallyXmlAction, exportGstr1JsonAction } from "./export-actions";

function SeederConsole() {
  const [targetAmount, setTargetAmount] = useState<number>(25000);
  const [voucherType, setVoucherType] = useState<"sales" | "purchase">("sales");
  const [gstPercent, setGstPercent] = useState<number>(18);
  const [isPending, setIsPending] = useState(false);
  const [seedResult, setSeedResult] = useState<any>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const triggerSeed = async () => {
    setIsPending(true);
    setSeedResult(null);
    try {
      const res = await generateRandomBillAction({
        targetAmount,
        voucherType,
        gstPercent,
      });

      if (mountedRef.current) {
        if (res.success) {
          setSeedResult(res);
          toast({
            title: "Random Bill Seeded!",
            description: `Generated ₹${targetAmount.toLocaleString("en-IN")} bill successfully!`,
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
          description: "Something went wrong during execution.",
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
    <div className="space-y-6 font-sans">
      <div className="grid gap-6 grid-cols-1 md:grid-cols-3 bg-muted/20 p-5 rounded-2xl border border-border/60">
        <div>
          <Label htmlFor="seed-amount" className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-2">
            Target Invoice Amount (₹)
          </Label>
          <Input
            id="seed-amount"
            type="number"
            min="100"
            max="500000"
            value={targetAmount}
            onChange={(e) => setTargetAmount(Math.max(1, parseFloat(e.target.value) || 0))}
            className="h-10 text-xs font-bold bg-background/55 border-border rounded-lg"
          />
          <span className="text-[10px] text-muted-foreground mt-1.5 block">
            Exact double-entry lines will resolve to this sum.
          </span>
        </div>

        <div>
          <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-2">
            Transaction Voucher Type
          </Label>
          <Select
            onValueChange={(val: any) => setVoucherType(val)}
            value={voucherType}
          >
            <SelectTrigger className="w-full h-10 bg-background border-border rounded-lg text-xs font-bold">
              <SelectValue placeholder="Select Type" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="sales" className="text-xs font-semibold">Sales Invoice (F8)</SelectItem>
              <SelectItem value="purchase" className="text-xs font-semibold">Purchase Voucher (F9)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-2">
            GST Duties Rate (%)
          </Label>
          <Select
            onValueChange={(val: any) => setGstPercent(parseInt(val))}
            value={String(gstPercent)}
          >
            <SelectTrigger className="w-full h-10 bg-background border-border rounded-lg text-xs font-bold">
              <SelectValue placeholder="GST Bracket" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="0" className="text-xs font-semibold">0% (Exempt)</SelectItem>
              <SelectItem value="5" className="text-xs font-semibold">5% (Handloom Sarees)</SelectItem>
              <SelectItem value="12" className="text-xs font-semibold">12% (Standard Sarees)</SelectItem>
              <SelectItem value="18" className="text-xs font-semibold">18% (Premium Fabrics)</SelectItem>
              <SelectItem value="28" className="text-xs font-semibold">28% (Luxury Collection)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex justify-end border-t border-border/30 pt-4">
        <Button
          type="button"
          onClick={triggerSeed}
          disabled={isPending || targetAmount <= 0}
          className="rounded-xl h-10 px-6 font-bold text-xs bg-amber-500 hover:bg-amber-600 shadow-md flex items-center gap-2 cursor-pointer text-white border-none"
        >
          {isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Compiling Balanced Ledger Entries...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-white animate-pulse" />
              One-Click Generate Random Bill
            </>
          )}
        </Button>
      </div>

      {seedResult && (
        <Card className="border border-emerald-500/25 bg-emerald-500/5 rounded-2xl overflow-hidden p-5 space-y-4">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-extrabold text-sm">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>Success! Transaction Seeded Dynamically into SQLite</span>
          </div>

          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 text-xs font-bold font-mono">
            <div className="space-y-1.5 p-3 rounded-lg bg-background/50 border border-border/40">
              <div className="text-muted-foreground text-[10px] uppercase">Party Name (Generated Customer)</div>
              <div className="text-primary text-sm font-extrabold">{seedResult.partyName}</div>
            </div>

            <div className="space-y-1.5 p-3 rounded-lg bg-background/50 border border-border/40">
              <div className="text-muted-foreground text-[10px] uppercase">Seeded Item Allocation</div>
              <div className="text-primary text-sm font-extrabold">{seedResult.itemName} (Qty: {seedResult.quantity})</div>
            </div>

            <div className="space-y-1.5 p-3 rounded-lg bg-background/50 border border-border/40">
              <div className="text-muted-foreground text-[10px] uppercase">Taxable Subtotal</div>
              <div className="text-primary text-sm">₹{seedResult.subtotal.toFixed(2)}</div>
            </div>

            <div className="space-y-1.5 p-3 rounded-lg bg-background/50 border border-border/40">
              <div className="text-muted-foreground text-[10px] uppercase">Duties &amp; Taxes Added ({gstPercent}%)</div>
              <div className="text-accent text-sm">₹{seedResult.taxAmount.toFixed(2)}</div>
            </div>
          </div>

          <div className="text-center font-bold text-xs text-muted-foreground uppercase pt-2 select-none border-t border-border/30">
            Balanced Double-Entry Audit Posted: <span className="text-emerald-600 dark:text-emerald-400 font-black">₹{targetAmount.toFixed(2)}</span>
          </div>
        </Card>
      )}
    </div>
  );
}


export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("company");
  const [companyInfo, setCompanyInfo] = useState({
    name: "",
    gstin: "",
    pan: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    phone: "",
    email: "",
    website: "",
  });
  const [financialSettings, setFinancialSettings] = useState({
    fiscalYearStart: "04-01",
    currencySymbol: "₹",
    currencyCode: "INR",
    numberFormat: "Indian",
  });
  const [taxSettings, setTaxSettings] = useState({
    gstApplicable: true,
    defaultGstRate: 18,
    TDSApplicable: false,
    defaultTDSRate: 10,
  });
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    smsNotifications: false,
    lowStockAlerts: true,
    paymentReminders: true,
    backupReminders: true,
  });

  const mountedRef = useRef(true);

  // Load settings on mount
  useEffect(() => {
    mountedRef.current = true;
    async function loadSettings() {
      const settings = await getSettings();
      if (mountedRef.current && settings) {
        setCompanyInfo(settings.companyInfo);
        setFinancialSettings(settings.financialSettings);
        setTaxSettings(settings.taxSettings);
        setNotificationSettings(settings.notificationSettings);
      }
    }
    loadSettings();
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const handleSave = async (tab: string) => {
    let res;
    switch (tab) {
      case "company":
        res = await saveCompanySettings(companyInfo);
        break;
      case "financial":
        res = await saveFinancialSettings(financialSettings);
        break;
      case "tax":
        res = await saveTaxSettings(taxSettings);
        break;
      case "notifications":
        res = await saveNotificationSettings(notificationSettings);
        break;
    }

    if (!mountedRef.current) return;

    if (res?.success) {
      toast({
        title: "Settings Saved",
        description: `${tab.charAt(0).toUpperCase() + tab.slice(1)} settings saved successfully!`,
      });
    } else {
      toast({
        title: "Error Saving Settings",
        description: res?.error || "An unknown error occurred while saving.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen p-4">
      <div className="mb-6 flex items-center justify-between">
        <Link href="/dashboard">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Settings</h1>
      </div>

      <Tabs defaultValue="company" onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-6 gap-2 bg-muted/60 p-1.5 rounded-xl border border-border/40 h-auto">
          <TabsTrigger value="company" className="cursor-pointer text-xs font-bold py-2 rounded-lg">
            <Building2 className="mr-2 h-4 w-4 text-blue-500" />
            Company
          </TabsTrigger>
          <TabsTrigger value="financial" className="cursor-pointer text-xs font-bold py-2 rounded-lg">
            <DollarSign className="mr-2 h-4 w-4 text-emerald-500" />
            Financials
          </TabsTrigger>
          <TabsTrigger value="tax" className="cursor-pointer text-xs font-bold py-2 rounded-lg">
            <Banknote className="mr-2 h-4 w-4 text-purple-500" />
            Taxation
          </TabsTrigger>
          <TabsTrigger value="notifications" className="cursor-pointer text-xs font-bold py-2 rounded-lg">
            <MessageCircle className="mr-2 h-4 w-4 text-pink-500" />
            Alerts
          </TabsTrigger>
          <TabsTrigger value="ca-portal" className="cursor-pointer text-xs font-bold py-2 rounded-lg">
            <Layers className="mr-2 h-4 w-4 text-indigo-500" />
            CA Export
          </TabsTrigger>
          <TabsTrigger value="random-seeder" className="cursor-pointer text-xs font-bold py-2 rounded-lg">
            <Sparkles className="mr-2 h-4 w-4 text-amber-500 animate-pulse" />
            Random Seeder
          </TabsTrigger>
        </TabsList>

        <TabsContent value="company">
          <Card className="w-full">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Company Information</CardTitle>
              <CardDescription className="mt-1">
                Update your business details and contact information.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={(e) => {
                e.preventDefault();
                handleSave("company");
              }}>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="companyName">Company Name</Label>
                      <Input
                        id="companyName"
                        placeholder="Enter company name"
                        value={companyInfo.name}
                        onChange={(e) => setCompanyInfo(prev => ({ ...prev, name: e.target.value }))}
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="gstin">GSTIN</Label>
                      <Input
                        id="gstin"
                        placeholder="Enter GSTIN (optional)"
                        value={companyInfo.gstin}
                        onChange={(e) => setCompanyInfo(prev => ({ ...prev, gstin: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="pan">PAN</Label>
                      <Input
                        id="pan"
                        placeholder="Enter PAN (optional)"
                        value={companyInfo.pan}
                        onChange={(e) => setCompanyInfo(prev => ({ ...prev, pan: e.target.value }))}
                      />
                    </div>

                    <div>
                      <Label htmlFor="website">Website</Label>
                      <Input
                        id="website"
                        placeholder="Enter website URL"
                        value={companyInfo.website}
                        onChange={(e) => setCompanyInfo(prev => ({ ...prev, website: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      placeholder="Street address, building name"
                      value={companyInfo.address}
                      onChange={(e) => setCompanyInfo(prev => ({ ...prev, address: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        placeholder="Enter city"
                        value={companyInfo.city}
                        onChange={(e) => setCompanyInfo(prev => ({ ...prev, city: e.target.value }))}
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="state">State</Label>
                      <Input
                        id="state"
                        placeholder="Enter state"
                        value={companyInfo.state}
                        onChange={(e) => setCompanyInfo(prev => ({ ...prev, state: e.target.value }))}
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="pincode">PIN Code</Label>
                      <Input
                        id="pincode"
                        placeholder="Enter PIN code"
                        value={companyInfo.pincode}
                        onChange={(e) => setCompanyInfo(prev => ({ ...prev, pincode: e.target.value }))}
                        required
                        maxLength={6}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        placeholder="Enter phone number"
                        value={companyInfo.phone}
                        onChange={(e) => setCompanyInfo(prev => ({ ...prev, phone: e.target.value }))}
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        placeholder="Enter email"
                        type="email"
                        value={companyInfo.email}
                        onChange={(e) => setCompanyInfo(prev => ({ ...prev, email: e.target.value }))}
                        required
                      />
                    </div>
                  </div>
                </div>

                <CardFooter className="flex justify-end pt-4">
                  <Button
                    variant="default"
                    onClick={() => handleSave("company")}
                    className="px-6"
                  >
                    Save Company Information
                  </Button>
                </CardFooter>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="financial">
          <Card className="w-full">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Financial Settings</CardTitle>
              <CardDescription className="mt-1">
                Configure your financial year, currency, and number formatting preferences.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={(e) => {
                e.preventDefault();
                handleSave("financial");
              }}>
                <div className="space-y-6">
                  <div>
                    <Label htmlFor="fiscalYearStart">Financial Year Start Date</Label>
                    <div className="flex items-center gap-3">
                      <Layout className="w-5 h-5 text-muted-foreground" />
                      <Input
                        id="fiscalYearStart"
                        placeholder="MM-DD"
                        value={financialSettings.fiscalYearStart}
                        onChange={(e) => setFinancialSettings(prev => ({ ...prev, fiscalYearStart: e.target.value }))}
                        maxLength={5}
                        pattern="(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])"
                      />
                      <span className="text-xs text-muted-foreground">
                        Format: MM-DD (e.g., 04-01 for April 1st)
                      </span>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <Button variant="outline" onClick={() => setFinancialSettings({ ...financialSettings, fiscalYearStart: "04-01" })}>
                      Use Indian Financial Year (April 1 - March 31)
                    </Button>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="currencySymbol">Currency Symbol</Label>
                      <Input
                        id="currencySymbol"
                        placeholder="e.g., ₹, $, €"
                        value={financialSettings.currencySymbol}
                        onChange={(e) => setFinancialSettings(prev => ({ ...prev, currencySymbol: e.target.value }))}
                      />
                    </div>

                    <div>
                      <Label htmlFor="currencyCode">Currency Code</Label>
                      <Input
                        id="currencyCode"
                        placeholder="e.g., INR, USD, EUR"
                        value={financialSettings.currencyCode}
                        onChange={(e) => setFinancialSettings(prev => ({ ...prev, currencyCode: e.target.value.toUpperCase() }))}
                        maxLength={3}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="numberFormat">Number Format</Label>
                    <Input
                      id="numberFormat"
                      placeholder="e.g., Indian, International"
                      value={financialSettings.numberFormat}
                      onChange={(e) => setFinancialSettings(prev => ({ ...prev, numberFormat: e.target.value }))}
                    />
                    <p className="mt-1 text-xs text-muted-foreground">
                      Indian format uses lakhs and crores (1,00,000), International uses thousands and millions (100,000)
                    </p>
                  </div>
                </div>

                <CardFooter className="flex justify-end pt-4">
                  <Button
                    variant="default"
                    onClick={() => handleSave("financial")}
                    className="px-6"
                  >
                    Save Financial Settings
                  </Button>
                </CardFooter>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tax">
          <Card className="w-full">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Tax Configuration</CardTitle>
              <CardDescription className="mt-1">
                Set up your GST and tax preferences.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={(e) => {
                e.preventDefault();
                handleSave("tax");
              }}>
                <div className="space-y-6">
                  <div>
                    <Label htmlFor="gstApplicable">Is GST Applicable?</Label>
                    <div className="flex items-center gap-3">
                      <Settings className="w-5 h-5 text-muted-foreground" />
                      <Checkbox
                        id="gstApplicable"
                        checked={taxSettings.gstApplicable}
                        onCheckedChange={(checked: any) => setTaxSettings(prev => ({ ...prev, gstApplicable: !!checked }))}
                      />
                      <span className="ml-2">Yes, my business is registered for GST</span>
                    </div>
                    {taxSettings.gstApplicable && (
                      <p className="text-sm text-muted-foreground mt-2">
                        GST will be applied to sales and purchase transactions.
                      </p>
                    )}
                  </div>

                  {taxSettings.gstApplicable && (
                    <>
                      <div className="border-t pt-4">
                        <Label htmlFor="defaultGstRate">Default GST Rate (%)</Label>
                        <div className="flex items-center gap-3 mt-2">
                          <Banknote className="w-5 h-5 text-muted-foreground" />
                          <Input
                            id="defaultGstRate"
                            type="number"
                            min="0"
                            max="28"
                            step="0.1"
                            placeholder="Enter percentage"
                            value={String(taxSettings.defaultGstRate)}
                            onChange={(e) => setTaxSettings(prev => ({ ...prev, defaultGstRate: parseFloat(e.target.value) || 0 }))}
                          />
                          <span className="text-xs text-muted-foreground">
                            Common rates: 0%, 5%, 12%, 18%, 28%
                          </span>
                        </div>
                      </div>

                      <div className="border-t pt-4">
                        <Button variant="outline" onClick={() => setTaxSettings({ ...taxSettings, defaultGstRate: 18 })}>
                          Set Default to 18%
                        </Button>
                        <Button variant="outline" onClick={() => setTaxSettings({ ...taxSettings, defaultGstRate: 12 })}>
                          Set Default to 12%
                        </Button>
                        <Button variant="outline" onClick={() => setTaxSettings({ ...taxSettings, defaultGstRate: 5 })}>
                          Set Default to 5%
                        </Button>
                      </div>
                    </>
                  )}

                  <div className="border-t pt-4">
                    <Label htmlFor="TDSApplicable">Is TDS Applicable?</Label>
                    <div className="flex items-center gap-3">
                      <Users className="w-5 h-5 text-muted-foreground" />
                      <Checkbox
                        id="TDSApplicable"
                        checked={taxSettings.TDSApplicable}
                        onCheckedChange={(checked: any) => setTaxSettings(prev => ({ ...prev, TDSApplicable: !!checked }))}
                      />
                      <span className="ml-2">Yes, I need to deduct TDS on payments</span>
                    </div>
                    {taxSettings.TDSApplicable && (
                      <>
                        <p className="text-sm text-muted-foreground mt-2">
                          TDS will be deducted on applicable payments as per Income Tax rules.
                        </p>

                        <div className="mt-2">
                          <Label htmlFor="defaultTDSRate">Default TDS Rate (%)</Label>
                          <div className="flex items-center gap-3">
                            <Users className="w-5 h-5 text-muted-foreground" />
                            <Input
                              id="defaultTDSRate"
                              type="number"
                              min="0"
                              max="30"
                              step="0.1"
                              placeholder="Enter percentage"
                              value={String(taxSettings.defaultTDSRate)}
                              onChange={(e) => setTaxSettings(prev => ({ ...prev, defaultTDSRate: parseFloat(e.target.value) || 0 }))}
                            />
                            <span className="text-xs text-muted-foreground">
                              Common rates: 1%, 2%, 5%, 10%
                            </span>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <CardFooter className="flex justify-end pt-4">
                  <Button
                    variant="default"
                    onClick={() => handleSave("tax")}
                    className="px-6"
                  >
                    Save Tax Settings
                  </Button>
                </CardFooter>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card className="w-full">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Notification Preferences</CardTitle>
              <CardDescription className="mt-1">
                Configure how and when you receive notifications from the system.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={(e) => {
                e.preventDefault();
                handleSave("notifications");
              }}>
                <div className="space-y-6">
                  <div>
                    <Label htmlFor="emailNotifications">Email Notifications</Label>
                    <div className="flex items-center gap-3">
                      <Mail className="w-5 h-5 text-muted-foreground" />
                      <Switch
                        id="emailNotifications"
                        checked={notificationSettings.emailNotifications}
                        onCheckedChange={(checked: boolean) => setNotificationSettings(prev => ({ ...prev, emailNotifications: checked }))}
                      />
                      <span className="ml-2">Receive important updates via email</span>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="smsNotifications">SMS Notifications</Label>
                    <div className="flex items-center gap-3">
                      <Phone className="w-5 h-5 text-muted-foreground" />
                      <Switch
                        id="smsNotifications"
                        checked={notificationSettings.smsNotifications}
                        onCheckedChange={(checked: boolean) => setNotificationSettings(prev => ({ ...prev, smsNotifications: checked }))}
                      />
                      <span className="ml-2">Receive alerts via SMS (may incur charges)</span>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <Label htmlFor="lowStockAlerts">Inventory Alerts</Label>
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <MapPin className="w-5 h-5 text-muted-foreground" />
                        <Switch
                          id="lowStockAlerts"
                          checked={notificationSettings.lowStockAlerts}
                          onCheckedChange={(checked: boolean) => setNotificationSettings(prev => ({ ...prev, lowStockAlerts: checked }))}
                        />
                        <span className="ml-2">Get alerts when stock falls below reorder level</span>
                      </div>

                      <div className="flex items-center gap-3 mt-2">
                        <RefreshCw className="w-5 h-5 text-muted-foreground" />
                        <Switch
                          id="backupReminders"
                          checked={notificationSettings.backupReminders}
                          onCheckedChange={(checked: boolean) => setNotificationSettings(prev => ({ ...prev, backupReminders: checked }))}
                        />
                        <span className="ml-2">Receive reminders to backup your data</span>
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <Label htmlFor="paymentReminders">Payment Reminders</Label>
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <DollarSign className="w-5 h-5 text-muted-foreground" />
                        <Switch
                          id="paymentReminders"
                          checked={notificationSettings.paymentReminders}
                          onCheckedChange={(checked: boolean) => setNotificationSettings(prev => ({ ...prev, paymentReminders: checked }))}
                        />
                        <span className="ml-2">Get reminders for upcoming payments and receivables</span>
                      </div>
                    </div>
                  </div>
                </div>

                <CardFooter className="flex justify-end pt-4">
                  <Button
                    variant="default"
                    onClick={() => handleSave("notifications")}
                    className="px-6"
                  >
                    Save Notification Preferences
                  </Button>
                </CardFooter>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ca-portal">
          <Card className="w-full border-border/80 bg-card/65 dark:bg-card/45 backdrop-blur-2xl shadow-xl rounded-2xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-indigo-500/5 via-transparent to-indigo-500/5 border-b border-border/60 py-5 px-6">
              <CardTitle className="text-lg font-extrabold flex items-center gap-2 text-primary">
                <Layers className="w-5 h-5 text-indigo-500" />
                Chartered Accountant Collaboration Desk
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                Generate and download balanced audit registers, tax records, and direct Tally ERP formats.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* TALLY EXPORTER */}
                <div className="p-5 rounded-2xl border border-border/60 bg-muted/10 space-y-4 hover:border-indigo-500/35 transition-all duration-300">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-extrabold text-sm text-primary">Tally XML Ledger Exporter</h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        Export your entire Chart of Accounts structured to match Tally's schema for direct importing.
                      </p>
                    </div>
                    <span className="text-[9px] uppercase tracking-wider font-extrabold bg-indigo-500/10 text-indigo-600 px-2 py-0.5 rounded shrink-0">
                      XML FORMAT
                    </span>
                  </div>
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="w-full flex items-center justify-center gap-1.5 h-9 rounded-lg text-xs font-bold border-border/80 hover:bg-indigo-500/10 hover:text-indigo-500 hover:border-indigo-500 transition-colors cursor-pointer"
                    onClick={async () => {
                      const res = await exportTallyXmlAction();
                      if (res.success && res.content) {
                        const blob = new Blob([res.content], { type: "text/xml" });
                        const link = document.createElement("a");
                        link.href = URL.createObjectURL(blob);
                        link.download = res.filename;
                        link.click();
                        toast({ title: "Tally XML Exported", description: "Ledger XML file downloaded successfully!" });
                      } else {
                        toast({ title: "Export Error", description: res.error || "Unknown error", variant: "destructive" });
                      }
                    }}
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download Tally XML ledgers
                  </Button>
                </div>

                {/* GST EXPORTER */}
                <div className="p-5 rounded-2xl border border-border/60 bg-muted/10 space-y-4 hover:border-indigo-500/35 transition-all duration-300">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-extrabold text-sm text-primary">GSTR-1 Sales Compliance Exporter</h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        Consolidate GST transactions grouped by customers' GSTIN for quarterly tax filing preparation.
                      </p>
                    </div>
                    <span className="text-[9px] uppercase tracking-wider font-extrabold bg-indigo-500/10 text-indigo-600 px-2 py-0.5 rounded shrink-0">
                      JSON FILE
                    </span>
                  </div>
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="w-full flex items-center justify-center gap-1.5 h-9 rounded-lg text-xs font-bold border-border/80 hover:bg-indigo-500/10 hover:text-indigo-500 hover:border-indigo-500 transition-colors cursor-pointer"
                    onClick={async () => {
                      const res = await exportGstr1JsonAction();
                      if (res.success && res.content) {
                        const blob = new Blob([res.content], { type: "application/json" });
                        const link = document.createElement("a");
                        link.href = URL.createObjectURL(blob);
                        link.download = res.filename;
                        link.click();
                        toast({ title: "GSTR-1 JSON Generated", description: "B2B sales JSON package downloaded!" });
                      } else {
                        toast({ title: "Export Error", description: res.error || "Unknown error", variant: "destructive" });
                      }
                    }}
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download Validated GSTR-1
                  </Button>
                </div>

              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="random-seeder">
          <Card className="w-full border-border/80 bg-card/65 dark:bg-card/45 backdrop-blur-2xl shadow-xl rounded-2xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-amber-500/5 via-transparent to-amber-500/5 border-b border-border/60 py-5 px-6">
              <CardTitle className="text-lg font-extrabold flex items-center gap-2 text-primary">
                <Sparkles className="w-5 h-5 text-amber-500 animate-pulse" />
                Dynamic Demo Random Seeder Panel
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                Generate highly realistic, balanced transactions on the fly to test accounting sheets, inventory triggers, and dashboard graphs.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <SeederConsole />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
