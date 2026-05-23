"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { QRCodeRenderer } from "@/components/print/qr-code-renderer";
import {
  Printer,
  FileText,
  Eye,
  Building2,
  AlignLeft,
  Settings2,
  Save,
  LayoutTemplate,
  ArrowLeft,
  Palette,
  Type,
  Columns,
} from "lucide-react";
import Link from "next/link";

interface PrintSettings {
  // Layout
  paperSize: "a4" | "a5" | "letter" | "thermal58" | "thermal80";
  orientation: "portrait" | "landscape";
  template: "minimalist" | "classic" | "detailed" | "thermal";

  // Header
  showLogo: boolean;
  showCompanyName: boolean;
  showCompanyAddress: boolean;
  showCompanyGstin: boolean;
  showCompanyPan: boolean;
  showCompanyPhone: boolean;

  // Columns visibility
  showHsnCode: boolean;
  showUnit: boolean;
  showDiscount: boolean;
  showGstBreakdown: boolean; // CGST / SGST / IGST columns
  showSerialNumber: boolean;

  // Footer
  footerText: string; // Terms & conditions
  bankDetailsText: string;
  showSignatureLine: boolean;
  showAmountInWords: boolean;

  // UPI configuration
  upiId?: string;
  showQrCode?: boolean;

  // Typography
  fontSize: "small" | "medium" | "large";
  colorMode: "color" | "greyscale";

  // Invoice title
  invoiceTitle: string; // "Tax Invoice" | "Bill of Supply" | "Delivery Note" | custom
}

const DEFAULT_SETTINGS: PrintSettings = {
  paperSize: "a4",
  orientation: "portrait",
  template: "minimalist",
  showLogo: true,
  showCompanyName: true,
  showCompanyAddress: true,
  showCompanyGstin: true,
  showCompanyPan: false,
  showCompanyPhone: true,
  showHsnCode: true,
  showUnit: true,
  showDiscount: true,
  showGstBreakdown: true,
  showSerialNumber: true,
  footerText: "Thank you for your business. Goods once sold will not be returned. Subject to local jurisdiction.",
  bankDetailsText: "",
  showSignatureLine: true,
  showAmountInWords: true,
  upiId: "",
  showQrCode: false,
  fontSize: "medium",
  colorMode: "color",
  invoiceTitle: "Tax Invoice",
};

const STORAGE_KEY = "erp:print-settings";

function loadSettings(): PrintSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    // ignore
  }
  return DEFAULT_SETTINGS;
}

function saveSettings(settings: PrintSettings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // ignore
  }
}

function SectionHeader({ icon: Icon, title, description }: { icon: React.ElementType; title: string; description?: string }) {
  return (
    <div className="flex items-start gap-3 mb-4">
      <div className="w-8 h-8 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0 mt-0.5">
        <Icon className="w-4 h-4 text-accent" />
      </div>
      <div>
        <div className="text-sm font-black text-foreground">{title}</div>
        {description && <div className="text-[11px] text-muted-foreground mt-0.5">{description}</div>}
      </div>
    </div>
  );
}

function ToggleSetting({ label, description, checked, onCheckedChange }: { label: string; description?: string; checked: boolean; onCheckedChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-border/30 last:border-0">
      <div>
        <div className="text-xs font-semibold text-foreground">{label}</div>
        {description && <div className="text-[10px] text-muted-foreground mt-0.5">{description}</div>}
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} className="shrink-0" />
    </div>
  );
}

export default function PrintSettingsPage() {
  const [settings, setSettings] = useState<PrintSettings>(DEFAULT_SETTINGS);
  const [isSaving, setIsSaving] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    setSettings(loadSettings());
    return () => { mountedRef.current = false; };
  }, []);

  const update = <K extends keyof PrintSettings>(key: K, value: PrintSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    saveSettings(settings);
    await new Promise(r => setTimeout(r, 300));
    if (mountedRef.current) {
      setIsSaving(false);
      toast({
        title: "Print Settings Saved",
        description: "Your print preferences have been saved. They will apply on next invoice print.",
      });
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-8">
      {/* Page header */}
      <div className="flex items-center justify-between border-b border-border/40 pb-4">
        <div className="flex items-center gap-4">
          <Link href="/settings">
            <Button variant="ghost" size="icon" className="rounded-xl border border-border/60 hover:bg-muted transition-all cursor-pointer">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-black tracking-tight text-primary flex items-center gap-2">
              <Printer className="w-5 h-5 text-accent" />
              Print System Settings
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Configure invoice / bill templates, visible columns, paper size, and footer content.
            </p>
          </div>
        </div>
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="gap-2 rounded-xl h-9 px-4 text-xs font-bold cursor-pointer"
        >
          <Save className="w-3.5 h-3.5" />
          {isSaving ? "Saving..." : "Save Settings"}
        </Button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        {/* LEFT — Controls */}
        <div className="xl:col-span-3 space-y-5">

          {/* Template & Layout */}
          <Card className="border-border/50 bg-card/70 backdrop-blur-xl rounded-2xl shadow-sm overflow-hidden">
            <CardHeader className="pb-3 px-6 pt-5 border-b border-border/40 bg-muted/20">
              <SectionHeader icon={LayoutTemplate} title="Template & Layout" description="Choose the invoice style, paper size and orientation." />
            </CardHeader>
            <CardContent className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-2">Invoice Template</Label>
                  <Select value={settings.template} onValueChange={(v: any) => update("template", v)}>
                    <SelectTrigger className="h-9 text-xs font-semibold bg-background/55 border-border/70 rounded-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="minimalist" className="text-xs font-semibold">Minimalist (Clean)</SelectItem>
                      <SelectItem value="classic" className="text-xs font-semibold">Classic (Traditional)</SelectItem>
                      <SelectItem value="detailed" className="text-xs font-semibold">Detailed (Full Data)</SelectItem>
                      <SelectItem value="thermal" className="text-xs font-semibold">Thermal (POS Receipt)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-2">Paper Size</Label>
                  <Select value={settings.paperSize} onValueChange={(v: any) => update("paperSize", v)}>
                    <SelectTrigger className="h-9 text-xs font-semibold bg-background/55 border-border/70 rounded-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="a4" className="text-xs font-semibold">A4 (210 × 297 mm)</SelectItem>
                      <SelectItem value="a5" className="text-xs font-semibold">A5 (148 × 210 mm)</SelectItem>
                      <SelectItem value="letter" className="text-xs font-semibold">Letter (8.5 × 11 in)</SelectItem>
                      <SelectItem value="thermal58" className="text-xs font-semibold">Thermal 58mm</SelectItem>
                      <SelectItem value="thermal80" className="text-xs font-semibold">Thermal 80mm</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-2">Orientation</Label>
                  <Select value={settings.orientation} onValueChange={(v: any) => update("orientation", v)}>
                    <SelectTrigger className="h-9 text-xs font-semibold bg-background/55 border-border/70 rounded-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="portrait" className="text-xs font-semibold">Portrait</SelectItem>
                      <SelectItem value="landscape" className="text-xs font-semibold">Landscape</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-2">Invoice Title</Label>
                  <Select value={settings.invoiceTitle} onValueChange={(v) => update("invoiceTitle", v)}>
                    <SelectTrigger className="h-9 text-xs font-semibold bg-background/55 border-border/70 rounded-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="Tax Invoice" className="text-xs font-semibold">Tax Invoice</SelectItem>
                      <SelectItem value="Bill of Supply" className="text-xs font-semibold">Bill of Supply</SelectItem>
                      <SelectItem value="Retail Invoice" className="text-xs font-semibold">Retail Invoice</SelectItem>
                      <SelectItem value="Delivery Note" className="text-xs font-semibold">Delivery Note</SelectItem>
                      <SelectItem value="Proforma Invoice" className="text-xs font-semibold">Proforma Invoice</SelectItem>
                      <SelectItem value="Receipt" className="text-xs font-semibold">Receipt</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-2">Font Size</Label>
                  <Select value={settings.fontSize} onValueChange={(v: any) => update("fontSize", v)}>
                    <SelectTrigger className="h-9 text-xs font-semibold bg-background/55 border-border/70 rounded-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="small" className="text-xs font-semibold">Small (Compact)</SelectItem>
                      <SelectItem value="medium" className="text-xs font-semibold">Medium (Default)</SelectItem>
                      <SelectItem value="large" className="text-xs font-semibold">Large (Readable)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-2">Color Mode</Label>
                <div className="flex gap-3">
                  {(["color", "greyscale"] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => update("colorMode", mode)}
                      className={`flex-1 p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer capitalize ${
                        settings.colorMode === mode
                          ? "bg-accent/10 border-accent/50 text-accent"
                          : "border-border/50 text-muted-foreground hover:border-border"
                      }`}
                    >
                      <Palette className="w-3.5 h-3.5 mx-auto mb-1" />
                      {mode === "color" ? "Full Color" : "Greyscale"}
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Header visibility */}
          <Card className="border-border/50 bg-card/70 backdrop-blur-xl rounded-2xl shadow-sm overflow-hidden">
            <CardHeader className="pb-3 px-6 pt-5 border-b border-border/40 bg-muted/20">
              <SectionHeader icon={Building2} title="Header Information" description="Control which company details appear in the invoice header." />
            </CardHeader>
            <CardContent className="p-6">
              <ToggleSetting label="Company Name" description="Show business name prominently" checked={settings.showCompanyName} onCheckedChange={v => update("showCompanyName", v)} />
              <ToggleSetting label="Company Address" description="Full registered address" checked={settings.showCompanyAddress} onCheckedChange={v => update("showCompanyAddress", v)} />
              <ToggleSetting label="GSTIN Number" checked={settings.showCompanyGstin} onCheckedChange={v => update("showCompanyGstin", v)} />
              <ToggleSetting label="PAN Number" checked={settings.showCompanyPan} onCheckedChange={v => update("showCompanyPan", v)} />
              <ToggleSetting label="Phone Number" checked={settings.showCompanyPhone} onCheckedChange={v => update("showCompanyPhone", v)} />
            </CardContent>
          </Card>


          {/* Column visibility */}
          <Card className="border-border/50 bg-card/70 backdrop-blur-xl rounded-2xl shadow-sm overflow-hidden">
            <CardHeader className="pb-3 px-6 pt-5 border-b border-border/40 bg-muted/20">
              <SectionHeader icon={Columns} title="Table Column Visibility" description="Choose which columns appear in the line items table." />
            </CardHeader>
            <CardContent className="p-6">
              <ToggleSetting label="Serial Number (S.No)" checked={settings.showSerialNumber} onCheckedChange={v => update("showSerialNumber", v)} />
              <ToggleSetting label="HSN / SAC Code" description="Harmonized System Nomenclature code" checked={settings.showHsnCode} onCheckedChange={v => update("showHsnCode", v)} />
              <ToggleSetting label="Unit of Measurement" description="PCS, MTR, KGS, etc." checked={settings.showUnit} onCheckedChange={v => update("showUnit", v)} />
              <ToggleSetting label="Discount Column" description="Per-item and bill-level discounts" checked={settings.showDiscount} onCheckedChange={v => update("showDiscount", v)} />
              <ToggleSetting label="GST Breakdown (CGST / SGST / IGST)" description="Show individual tax components" checked={settings.showGstBreakdown} onCheckedChange={v => update("showGstBreakdown", v)} />
            </CardContent>
          </Card>

          {/* UPI & QR Code Payments */}
          <Card className="border-border/50 bg-card/70 backdrop-blur-xl rounded-2xl shadow-sm overflow-hidden">
            <CardHeader className="pb-3 px-6 pt-5 border-b border-border/40 bg-muted/20">
              <SectionHeader icon={Building2} title="UPI & QR Code Payments" description="Collect instant payments by showing a dynamic QR code on printed bills." />
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <ToggleSetting label="Enable Payment QR Code" description="Render payment QR code on invoice layout" checked={!!settings.showQrCode} onCheckedChange={v => update("showQrCode", v)} />
              {settings.showQrCode && (
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Your UPI ID (VPA)</Label>
                  <Input
                    value={settings.upiId || ""}
                    onChange={e => update("upiId", e.target.value)}
                    placeholder="e.g. business@okhdfcbank"
                    className="h-9 text-xs bg-background/55 border-border/70 rounded-lg"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Footer content */}
          <Card className="border-border/50 bg-card/70 backdrop-blur-xl rounded-2xl shadow-sm overflow-hidden">
            <CardHeader className="pb-3 px-6 pt-5 border-b border-border/40 bg-muted/20">
              <SectionHeader icon={AlignLeft} title="Footer Content" description="Terms, bank details and signature line." />
            </CardHeader>
            <CardContent className="p-6 space-y-5">
              <ToggleSetting label="Amount in Words" description="e.g. Rupees Five Thousand Only" checked={settings.showAmountInWords} onCheckedChange={v => update("showAmountInWords", v)} />
              <ToggleSetting label="Signature Line" description="Authorised signature box at bottom right" checked={settings.showSignatureLine} onCheckedChange={v => update("showSignatureLine", v)} />

              <div>
                <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-2">Bank Account Details</Label>
                <Textarea
                  value={settings.bankDetailsText}
                  onChange={e => update("bankDetailsText", e.target.value)}
                  placeholder={"Bank: State Bank of India\nA/C No: 12345678901\nIFSC: SBIN0001234\nBranch: Main Branch, City"}
                  className="h-24 text-xs font-mono bg-background/55 border-border/70 rounded-lg resize-none"
                />
              </div>

              <div>
                <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-2">Terms & Conditions</Label>
                <Textarea
                  value={settings.footerText}
                  onChange={e => update("footerText", e.target.value)}
                  placeholder="Enter terms and conditions..."
                  className="h-20 text-xs bg-background/55 border-border/70 rounded-lg resize-none"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT — Live Preview */}
        <div className="xl:col-span-2">
          <div className="sticky top-4">
            <Card className="border-border/50 bg-card/70 backdrop-blur-xl rounded-2xl shadow-sm overflow-hidden">
              <CardHeader className="pb-3 px-5 pt-5 border-b border-border/40 bg-muted/20">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-accent" />
                  <div className="text-sm font-black text-foreground">Live Preview</div>
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">Sample invoice based on your settings</p>
              </CardHeader>
              <CardContent className="p-4">
                {/* Mock invoice preview */}
                <div
                  className="bg-white text-gray-900 rounded-xl border border-gray-200 overflow-hidden shadow-sm"
                  style={{
                    fontSize: settings.fontSize === "small" ? "9px" : settings.fontSize === "large" ? "12px" : "10px",
                    filter: settings.colorMode === "greyscale" ? "grayscale(1)" : "none",
                  }}
                >
                  {/* Invoice header */}
                  <div className="p-4 border-b border-gray-200">
                    {settings.showCompanyName && (
                      <div className="font-black text-base text-gray-900 mb-0.5">Your Business Name</div>
                    )}
                    {settings.showCompanyAddress && (
                      <div className="text-[9px] text-gray-500">123 Business Street, City, State 400001</div>
                    )}
                    {settings.showCompanyGstin && (
                      <div className="text-[9px] text-gray-500 font-mono">GSTIN: 27AAAAA1111A1Z1</div>
                    )}
                    {settings.showCompanyPhone && (
                      <div className="text-[9px] text-gray-500">Phone: +91 98765 43210</div>
                    )}
                  </div>

                  {/* Invoice title */}
                  <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
                    <div className="font-black text-center text-gray-800 text-sm">{settings.invoiceTitle}</div>
                  </div>

                  {/* Items table */}
                  <div className="p-3">
                    <table className="w-full text-[8px]">
                      <thead>
                        <tr className="border-b border-gray-300">
                          {settings.showSerialNumber && <th className="py-1 text-left font-bold text-gray-600">#</th>}
                          <th className="py-1 text-left font-bold text-gray-600">Item</th>
                          {settings.showHsnCode && <th className="py-1 text-center font-bold text-gray-600">HSN</th>}
                          {settings.showUnit && <th className="py-1 text-center font-bold text-gray-600">Unit</th>}
                          <th className="py-1 text-right font-bold text-gray-600">Qty</th>
                          <th className="py-1 text-right font-bold text-gray-600">Rate</th>
                          {settings.showDiscount && <th className="py-1 text-right font-bold text-gray-600">Disc%</th>}
                          <th className="py-1 text-right font-bold text-gray-600">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[1, 2].map(i => (
                          <tr key={i} className="border-b border-gray-100">
                            {settings.showSerialNumber && <td className="py-1 text-gray-600">{i}</td>}
                            <td className="py-1 text-gray-800 font-medium">Sample Item {i}</td>
                            {settings.showHsnCode && <td className="py-1 text-center text-gray-500">9999</td>}
                            {settings.showUnit && <td className="py-1 text-center text-gray-500">PCS</td>}
                            <td className="py-1 text-right text-gray-600">10</td>
                            <td className="py-1 text-right text-gray-600">₹100</td>
                            {settings.showDiscount && <td className="py-1 text-right text-gray-500">5%</td>}
                            <td className="py-1 text-right font-bold">₹950</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {/* Totals */}
                    <div className="mt-2 border-t border-gray-200 pt-2 space-y-0.5">
                      <div className="flex justify-between text-[8px] text-gray-600">
                        <span>Subtotal</span><span>₹1,900</span>
                      </div>
                      {settings.showGstBreakdown && (
                        <>
                          <div className="flex justify-between text-[8px] text-gray-600">
                            <span>CGST @9%</span><span>₹171</span>
                          </div>
                          <div className="flex justify-between text-[8px] text-gray-600">
                            <span>SGST @9%</span><span>₹171</span>
                          </div>
                        </>
                      )}
                      <div className="flex justify-between text-[9px] font-black text-gray-900 border-t border-gray-300 pt-1 mt-1">
                        <span>Grand Total</span><span>₹2,242</span>
                      </div>
                      {settings.showAmountInWords && (
                        <div className="text-[7px] text-gray-500 italic mt-1">Rupees Two Thousand Two Hundred Forty Two Only</div>
                      )}
                    </div>

                    {/* Footer */}
                    {(settings.bankDetailsText || settings.footerText || settings.showSignatureLine || (settings.showQrCode && settings.upiId)) && (
                      <div className="mt-3 pt-2 border-t border-gray-200">
                        <div className="flex justify-between items-start gap-4">
                          <div className="flex-1 space-y-2">
                            {settings.bankDetailsText && (
                              <div className="text-[7px] text-gray-500 font-mono whitespace-pre-line">{settings.bankDetailsText}</div>
                            )}
                            {settings.footerText && (
                              <div className="text-[7px] text-gray-400 italic">{settings.footerText.substring(0, 80)}...</div>
                            )}
                          </div>
                          {settings.showQrCode && settings.upiId && (
                            <div className="flex flex-col items-center shrink-0">
                              <QRCodeRenderer
                                text={`upi://pay?pa=${settings.upiId}&pn=Your%20Business&am=2242&cu=INR`}
                                size={50}
                                className="border border-gray-200"
                              />
                              <div className="text-[6px] text-gray-400 font-bold mt-1 uppercase tracking-wider">Scan to Pay</div>
                            </div>
                          )}
                        </div>
                        {settings.showSignatureLine && (
                          <div className="mt-3 flex justify-end">
                            <div className="text-[7px] text-gray-600 text-center">
                              <div className="border-t border-gray-400 w-24 mt-4"></div>
                              <div>Authorised Signatory</div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
