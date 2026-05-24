"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  AlignLeft,
  ArrowLeft,
  Building2,
  Columns,
  Eye,
  LayoutTemplate,
  Palette,
  Printer,
  Save,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { QRCodeRenderer } from "@/components/print/qr-code-renderer";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/types";
import {
  COLOR_MODE_OPTIONS,
  COLUMN_VISIBILITY_OPTIONS,
  DEFAULT_PRINT_SETTINGS,
  FONT_SIZE_OPTIONS,
  FOOTER_VISIBILITY_OPTIONS,
  HEADER_VISIBILITY_OPTIONS,
  INVOICE_FONTS,
  INVOICE_TEMPLATES,
  INVOICE_TITLE_OPTIONS,
  ORIENTATION_OPTIONS,
  PAPER_SIZE_OPTIONS,
  getInvoiceTemplate,
  loadPrintSettings,
  savePrintSettings,
  type PrintSettings,
  type TemplateId,
} from "@/lib/print-settings";

const SAMPLE_INVOICE = {
  companyName: "Your Business Name",
  companyAddress: "123 Business Street, City, State 400001",
  companyPhone: "+91 98765 43210",
  companyGstin: "27AAAAA1111A1Z1",
  companyPan: "AAAAA1111A",
  invoiceNumber: "INV-1024",
  customerName: "Sample Customer",
  customerGstin: "27BBBBB2222B1Z2",
  items: [
    { name: "Sample Item 1", hsn: "9999", unit: "PCS", quantity: 10, rate: 100, discountPercent: 5, amount: 950 },
    { name: "Sample Item 2", hsn: "5407", unit: "MTR", quantity: 6, rate: 150, discountPercent: 0, amount: 900 },
  ],
  cgst: 166.5,
  sgst: 166.5,
  amountInWords: "Rupees Two Thousand One Hundred Eighty Three Only",
};

function SectionHeader({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType;
  title: string;
  description?: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-[var(--radius-sm)] bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0 mt-0.5">
        <Icon className="w-4 h-4 text-accent" />
      </div>
      <div>
        <div className="text-sm font-black text-foreground">{title}</div>
        {description && <div className="text-[11px] text-muted-foreground mt-0.5">{description}</div>}
      </div>
    </div>
  );
}

function ToggleSetting({
  label,
  description,
  checked,
  onCheckedChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onCheckedChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5 border-b border-border/30 last:border-0">
      <div>
        <div className="text-xs font-semibold text-foreground">{label}</div>
        {description && <div className="text-[10px] text-muted-foreground mt-0.5">{description}</div>}
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} className="shrink-0" />
    </div>
  );
}

function PreviewInvoice({ settings }: { settings: PrintSettings }) {
  const template = getInvoiceTemplate(settings.template);
  const subtotal = SAMPLE_INVOICE.items.reduce((sum, item) => sum + item.amount, 0);
  const tax = settings.showGstBreakdown ? SAMPLE_INVOICE.cgst + SAMPLE_INVOICE.sgst : 0;
  const grandTotal = subtotal + tax;
  const accent = settings.colorMode === "greyscale" ? "#374151" : settings.accentColor;
  const isThermal = settings.template === "thermal" || settings.paperSize.startsWith("thermal");

  return (
    <div
      className={cn(
        "bg-white text-gray-900 border border-gray-200 overflow-hidden shadow-sm mx-auto",
        settings.fontFamily,
        isThermal ? "max-w-[260px] rounded-[var(--radius-sm)]" : "max-w-[430px] rounded-[var(--radius-card)]",
        settings.orientation === "landscape" && !isThermal && "max-w-[520px]"
      )}
      style={{
        fontSize: settings.fontSize === "small" ? "9px" : settings.fontSize === "large" ? "12px" : "10px",
        filter: settings.colorMode === "greyscale" ? "grayscale(1)" : "none",
      }}
    >
      <div className={cn("p-4 border-b border-gray-200", settings.template === "corporate" && "text-white")} style={settings.template === "corporate" ? { backgroundColor: accent } : undefined}>
        <div className="flex items-start justify-between gap-3">
          <div>
            {settings.showCompanyName && (
              <div className="font-black text-base mb-0.5" style={settings.template !== "corporate" ? { color: accent } : undefined}>
                {SAMPLE_INVOICE.companyName}
              </div>
            )}
            {settings.showCompanyAddress && <div className="text-[9px] opacity-75">{SAMPLE_INVOICE.companyAddress}</div>}
            {settings.showCompanyPhone && <div className="text-[9px] opacity-75">Phone: {SAMPLE_INVOICE.companyPhone}</div>}
            {settings.showCompanyGstin && <div className="text-[9px] font-mono opacity-75">GSTIN: {SAMPLE_INVOICE.companyGstin}</div>}
            {settings.showCompanyPan && <div className="text-[9px] font-mono opacity-75">PAN: {SAMPLE_INVOICE.companyPan}</div>}
          </div>
          <div className="text-right">
            <div className="text-[9px] font-black uppercase tracking-wider">{template.name}</div>
            <div className="font-mono text-[9px] mt-1">No: {SAMPLE_INVOICE.invoiceNumber}</div>
          </div>
        </div>
      </div>

      <div className="px-4 py-2 border-b border-gray-200" style={{ backgroundColor: `${accent}12` }}>
        <div className="font-black text-center text-sm" style={{ color: accent }}>{settings.invoiceTitle}</div>
        <div className="mt-1 text-[8px] text-center text-gray-500">Bill To: {SAMPLE_INVOICE.customerName}</div>
      </div>

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
            {SAMPLE_INVOICE.items.map((item, index) => (
              <tr key={item.name} className="border-b border-gray-100">
                {settings.showSerialNumber && <td className="py-1 text-gray-600">{index + 1}</td>}
                <td className="py-1 text-gray-800 font-medium">{item.name}</td>
                {settings.showHsnCode && <td className="py-1 text-center text-gray-500">{item.hsn}</td>}
                {settings.showUnit && <td className="py-1 text-center text-gray-500">{item.unit}</td>}
                <td className="py-1 text-right text-gray-600">{item.quantity}</td>
                <td className="py-1 text-right text-gray-600">{formatCurrency(item.rate)}</td>
                {settings.showDiscount && <td className="py-1 text-right text-gray-500">{item.discountPercent}%</td>}
                <td className="py-1 text-right font-bold">{formatCurrency(item.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-2 border-t border-gray-200 pt-2 space-y-0.5">
          <div className="flex justify-between text-[8px] text-gray-600">
            <span>Subtotal</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          {settings.showGstBreakdown && (
            <>
              <div className="flex justify-between text-[8px] text-gray-600">
                <span>CGST @9%</span>
                <span>{formatCurrency(SAMPLE_INVOICE.cgst)}</span>
              </div>
              <div className="flex justify-between text-[8px] text-gray-600">
                <span>SGST @9%</span>
                <span>{formatCurrency(SAMPLE_INVOICE.sgst)}</span>
              </div>
            </>
          )}
          <div className="flex justify-between text-[9px] font-black text-gray-900 border-t border-gray-300 pt-1 mt-1">
            <span>Grand Total</span>
            <span style={{ color: accent }}>{formatCurrency(grandTotal)}</span>
          </div>
          {settings.showAmountInWords && (
            <div className="text-[7px] text-gray-500 italic mt-1">{SAMPLE_INVOICE.amountInWords}</div>
          )}
        </div>

        {(settings.bankDetailsText || settings.footerText || settings.showSignatureLine || (settings.showQrCode && settings.upiId)) && (
          <div className="mt-3 pt-2 border-t border-gray-200">
            <div className="flex justify-between items-start gap-4">
              <div className="flex-1 space-y-2">
                {settings.bankDetailsText && <div className="text-[7px] text-gray-500 font-mono whitespace-pre-line">{settings.bankDetailsText}</div>}
                {settings.footerText && <div className="text-[7px] text-gray-400 italic">{settings.footerText.slice(0, 110)}</div>}
              </div>
              {settings.showQrCode && settings.upiId && (
                <div className="flex flex-col items-center shrink-0">
                  <QRCodeRenderer
                    text={`upi://pay?pa=${settings.upiId}&pn=Your%20Business&am=${grandTotal}&cu=INR`}
                    size={isThermal ? 42 : 50}
                    className="border border-gray-200"
                  />
                  <div className="text-[6px] text-gray-400 font-bold mt-1 uppercase tracking-wider">Scan to Pay</div>
                </div>
              )}
            </div>
            {settings.showSignatureLine && (
              <div className="mt-3 flex justify-end">
                <div className="text-[7px] text-gray-600 text-center">
                  <div className="border-t border-gray-400 w-24 mt-4" />
                  <div>Authorised Signatory</div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function PrintSettingsPage() {
  const [settings, setSettings] = useState<PrintSettings>(DEFAULT_PRINT_SETTINGS);
  const [isSaving, setIsSaving] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    setSettings(loadPrintSettings());
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const selectedTemplate = useMemo(() => getInvoiceTemplate(settings.template), [settings.template]);

  const update = <K extends keyof PrintSettings>(key: K, value: PrintSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const updateTemplate = (templateId: TemplateId) => {
    const template = getInvoiceTemplate(templateId);
    setSettings((prev) => ({
      ...prev,
      template: templateId,
      accentColor: template.accentColor,
      fontFamily: template.defaultFont,
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    savePrintSettings(settings);
    await new Promise((resolve) => setTimeout(resolve, 300));
    if (mountedRef.current) {
      setIsSaving(false);
      toast({
        title: "Print settings saved",
        description: "These preferences now drive invoice previews and print templates.",
      });
    }
  };

  const titleSelectValue = INVOICE_TITLE_OPTIONS.includes(settings.invoiceTitle as typeof INVOICE_TITLE_OPTIONS[number])
    ? settings.invoiceTitle
    : "custom";

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-8">
      <div className="flex items-center justify-between border-b border-border/40 pb-4">
        <div className="flex items-center gap-4">
          <Link href="/settings">
            <Button variant="ghost" size="icon" className="border border-border cursor-pointer">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-black tracking-tight text-primary flex items-center gap-2">
              <Printer className="w-5 h-5 text-accent" />
              Print System Settings
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Configure every invoice template from one shared print configuration.
            </p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={isSaving} className="gap-2 h-9 px-4 text-xs font-bold cursor-pointer">
          <Save className="w-3.5 h-3.5" />
          {isSaving ? "Saving..." : "Save Settings"}
        </Button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        <div className="xl:col-span-3 space-y-5">
          <Card className="overflow-hidden">
            <CardHeader className="border-b border-border/40 bg-muted/20">
              <SectionHeader icon={LayoutTemplate} title="Template & Layout" description="All templates come from the same invoice template registry used by POS printing." />
            </CardHeader>
            <CardContent className="p-5 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-2">Invoice Template</Label>
                  <Select value={settings.template} onValueChange={(value) => updateTemplate(value as TemplateId)}>
                    <SelectTrigger className="h-9 text-xs font-semibold bg-background/55 border-border/70">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-72">
                      {INVOICE_TEMPLATES.map((template, index) => (
                        <SelectItem key={template.id} value={template.id} className="text-xs font-semibold">
                          {index + 1}. {template.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="mt-1.5 text-[10px] text-muted-foreground">{selectedTemplate.description}</p>
                </div>

                <div>
                  <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-2">Paper Size</Label>
                  <Select value={settings.paperSize} onValueChange={(value) => update("paperSize", value as PrintSettings["paperSize"])}>
                    <SelectTrigger className="h-9 text-xs font-semibold bg-background/55 border-border/70">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PAPER_SIZE_OPTIONS.map((option) => (
                        <SelectItem key={option.id} value={option.id} className="text-xs font-semibold">
                          {option.name} ({option.description})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-2">Orientation</Label>
                  <Select value={settings.orientation} onValueChange={(value) => update("orientation", value as PrintSettings["orientation"])}>
                    <SelectTrigger className="h-9 text-xs font-semibold bg-background/55 border-border/70">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ORIENTATION_OPTIONS.map((option) => (
                        <SelectItem key={option.id} value={option.id} className="text-xs font-semibold">
                          {option.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-2">Title Preset</Label>
                  <Select value={titleSelectValue} onValueChange={(value) => value !== "custom" && update("invoiceTitle", value)}>
                    <SelectTrigger className="h-9 text-xs font-semibold bg-background/55 border-border/70">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {INVOICE_TITLE_OPTIONS.map((title) => (
                        <SelectItem key={title} value={title} className="text-xs font-semibold">
                          {title}
                        </SelectItem>
                      ))}
                      <SelectItem value="custom" className="text-xs font-semibold">Custom title</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-2">Printed Title</Label>
                  <Input value={settings.invoiceTitle} onChange={(event) => update("invoiceTitle", event.target.value)} className="h-9 text-xs bg-background/55 border-border/70" />
                </div>

                <div>
                  <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-2">Font Size</Label>
                  <Select value={settings.fontSize} onValueChange={(value) => update("fontSize", value as PrintSettings["fontSize"])}>
                    <SelectTrigger className="h-9 text-xs font-semibold bg-background/55 border-border/70">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FONT_SIZE_OPTIONS.map((option) => (
                        <SelectItem key={option.id} value={option.id} className="text-xs font-semibold">
                          {option.name} ({option.description})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-2">Font Family</Label>
                  <Select value={settings.fontFamily} onValueChange={(value) => update("fontFamily", value as PrintSettings["fontFamily"])}>
                    <SelectTrigger className="h-9 text-xs font-semibold bg-background/55 border-border/70">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {INVOICE_FONTS.map((font) => (
                        <SelectItem key={font.id} value={font.id} className="text-xs font-semibold">
                          {font.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-2">Accent Color</Label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={settings.accentColor}
                      onChange={(event) => update("accentColor", event.target.value)}
                      className="h-9 w-10 rounded-[var(--radius-sm)] border border-border bg-transparent p-1 cursor-pointer"
                    />
                    <Input value={settings.accentColor} onChange={(event) => update("accentColor", event.target.value)} className="h-9 text-xs font-mono bg-background/55 border-border/70 uppercase" />
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-2">Color Mode</Label>
                <div className="flex gap-3">
                  {COLOR_MODE_OPTIONS.map((mode) => (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => update("colorMode", mode.id)}
                      className={cn(
                        "flex-1 p-3 rounded-[var(--radius-card)] border text-xs font-bold transition-all cursor-pointer",
                        settings.colorMode === mode.id
                          ? "bg-accent/10 border-accent/50 text-accent"
                          : "border-border/50 text-muted-foreground hover:border-border"
                      )}
                    >
                      <Palette className="w-3.5 h-3.5 mx-auto mb-1" />
                      {mode.name}
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden">
            <CardHeader className="border-b border-border/40 bg-muted/20">
              <SectionHeader icon={Building2} title="Header Information" description="Control which company details appear in the invoice header." />
            </CardHeader>
            <CardContent className="p-5">
              {HEADER_VISIBILITY_OPTIONS.map((option) => (
                <ToggleSetting
                  key={option.key}
                  label={option.label}
                  description={"description" in option ? option.description : undefined}
                  checked={Boolean(settings[option.key])}
                  onCheckedChange={(value) => update(option.key, value as never)}
                />
              ))}
            </CardContent>
          </Card>

          <Card className="overflow-hidden">
            <CardHeader className="border-b border-border/40 bg-muted/20">
              <SectionHeader icon={Columns} title="Table Column Visibility" description="Choose which columns appear in the line items table." />
            </CardHeader>
            <CardContent className="p-5">
              {COLUMN_VISIBILITY_OPTIONS.map((option) => (
                <ToggleSetting
                  key={option.key}
                  label={option.label}
                  description={"description" in option ? option.description : undefined}
                  checked={Boolean(settings[option.key])}
                  onCheckedChange={(value) => update(option.key, value as never)}
                />
              ))}
            </CardContent>
          </Card>

          <Card className="overflow-hidden">
            <CardHeader className="border-b border-border/40 bg-muted/20">
              <SectionHeader icon={Building2} title="UPI & QR Code Payments" description="Collect instant payments by showing a dynamic QR code on printed bills." />
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <ToggleSetting label="Enable Payment QR Code" description="Render payment QR code on invoice layout" checked={settings.showQrCode} onCheckedChange={(value) => update("showQrCode", value)} />
              {settings.showQrCode && (
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Your UPI ID (VPA)</Label>
                  <Input
                    value={settings.upiId}
                    onChange={(event) => update("upiId", event.target.value)}
                    placeholder="e.g. business@okhdfcbank"
                    className="h-9 text-xs bg-background/55 border-border/70"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="overflow-hidden">
            <CardHeader className="border-b border-border/40 bg-muted/20">
              <SectionHeader icon={AlignLeft} title="Footer Content" description="Terms, bank details and signature line." />
            </CardHeader>
            <CardContent className="p-5 space-y-5">
              {FOOTER_VISIBILITY_OPTIONS.map((option) => (
                <ToggleSetting
                  key={option.key}
                  label={option.label}
                  description={option.description}
                  checked={Boolean(settings[option.key])}
                  onCheckedChange={(value) => update(option.key, value as never)}
                />
              ))}

              <div>
                <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-2">Bank Account Details</Label>
                <Textarea
                  value={settings.bankDetailsText}
                  onChange={(event) => update("bankDetailsText", event.target.value)}
                  placeholder={"Bank: State Bank of India\nA/C No: 12345678901\nIFSC: SBIN0001234\nBranch: Main Branch, City"}
                  className="h-24 text-xs font-mono bg-background/55 border-border/70 resize-none"
                />
              </div>

              <div>
                <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-2">Terms & Conditions</Label>
                <Textarea
                  value={settings.footerText}
                  onChange={(event) => update("footerText", event.target.value)}
                  placeholder="Enter terms and conditions..."
                  className="h-20 text-xs bg-background/55 border-border/70 resize-none"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="xl:col-span-2">
          <div className="sticky top-4">
            <Card className="overflow-hidden">
              <CardHeader className="border-b border-border/40 bg-muted/20">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-accent" />
                  <div className="text-sm font-black text-foreground">Live Preview</div>
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">
                  {selectedTemplate.name} preview based on current settings.
                </p>
              </CardHeader>
              <CardContent className="p-4 bg-muted/20">
                <PreviewInvoice settings={settings} />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
