"use client";

import { useState, useEffect } from "react";
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
  ArrowLeft
} from "lucide-react";
import Link from "next/link";
import { getSettings, saveCompanySettings, saveFinancialSettings, saveTaxSettings, saveNotificationSettings } from "./actions";
import { toast } from "@/components/ui/use-toast";

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

  // Load settings on mount
  useEffect(() => {
    async function loadSettings() {
      const settings = await getSettings();
      if (settings) {
        setCompanyInfo(settings.companyInfo);
        setFinancialSettings(settings.financialSettings);
        setTaxSettings(settings.taxSettings);
        setNotificationSettings(settings.notificationSettings);
      }
    }
    loadSettings();
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
        <Link href="/(erp)/dashboard">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Settings</h1>
      </div>

      <Tabs defaultValue="company" onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-1">
          <TabsTrigger value="company">
            <Building2 className="mr-3 h-4 w-4" />
            Company Information
          </TabsTrigger>
          <TabsTrigger value="financial">
            <DollarSign className="mr-3 h-4 w-4" />
            Financial Settings
          </TabsTrigger>
          <TabsTrigger value="tax">
            <Banknote className="mr-3 h-4 w-4" />
            Tax Configuration
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <MessageCircle className="mr-3 h-4 w-4" />
            Notifications
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
      </Tabs>
    </div>
  );
}
