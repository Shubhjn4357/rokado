"use client";

import { useState, useEffect } from "react";
import { formatCurrency, formatDate } from "@/lib/types";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Printer, X, LayoutTemplate, Palette, Type, Settings, Eye, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { QRCodeRenderer } from "@/components/print/qr-code-renderer";

// List of available fonts
const INVOICE_FONTS = [
  { id: "font-sans", name: "Modern Sans (Inter)", class: "font-sans" },
  { id: "font-serif", name: "Elegant Serif (Playfair)", class: "font-serif" },
  { id: "font-mono", name: "Typewriter / Mono (Courier)", class: "font-mono" },
];

// List of pre-made templates
export type TemplateId =
  | "minimalist"
  | "emerald"
  | "thermal"
  | "corporate"
  | "neon"
  | "retro"
  | "crimson"
  | "artisan"
  | "indigo"
  | "grocer";

interface TemplateConfig {
  id: TemplateId;
  name: string;
  description: string;
  themeClass: string;
}

const TEMPLATES: TemplateConfig[] = [
  {
    id: "minimalist",
    name: "1. Minimalist Stark",
    description: "Ultra clean, spacious, sans-serif design.",
    themeClass: "border-black bg-white text-black",
  },
  {
    id: "emerald",
    name: "2. Emerald Classic",
    description: "Classic green borders and headers for traditional elegance.",
    themeClass: "border-emerald-600/40 text-emerald-950",
  },
  {
    id: "thermal",
    name: "3. Thermal POS Receipt",
    description: "Compact 80mm centered receipt style layout.",
    themeClass: "w-[80mm] border-dashed border-gray-400 text-black",
  },
  {
    id: "corporate",
    name: "4. Corporate Prestige",
    description: "Strong navy header banner, bold visual separation.",
    themeClass: "border-slate-800 text-slate-900",
  },
  {
    id: "neon",
    name: "5. Neon Cyber Tech",
    description: "Cyberpunk high-contrast grid layouts.",
    themeClass: "border-cyan-500 text-cyan-950",
  },
  {
    id: "retro",
    name: "6. Retro Carbon Copy",
    description: "Typewriter styling with dotted dividers.",
    themeClass: "border-gray-500 text-gray-800",
  },
  {
    id: "crimson",
    name: "7. Crimson Modern",
    description: "Sleek crimson accent bands with geometric layouts.",
    themeClass: "border-rose-600 text-rose-950",
  },
  {
    id: "artisan",
    name: "8. Warm Artisan",
    description: "Elegant sepia styling, italic details.",
    themeClass: "border-amber-600/40 text-amber-900",
  },
  {
    id: "indigo",
    name: "9. Sleek Indigo Card",
    description: "Modern cards layout using rich indigo headers.",
    themeClass: "border-indigo-600 text-indigo-950",
  },
  {
    id: "grocer",
    name: "10. Compact Grocer",
    description: "Densely packed grid for wholesale invoices.",
    themeClass: "border-gray-800 text-black",
  },
];

export interface InvoicePrintData {
  invoiceNumber: string;
  date: number;
  customerName: string;
  customerPhone?: string;
  customerGstin?: string;
  items: Array<{
    name: string;
    quantity: number;
    rate: number;
    discountPercent: number;
    gstPercent: number;
    amount: number;
  }>;
  subtotal: number;
  discountAmount: number;
  taxableValue: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalAmount: number;
  amountInWords?: string;
  companyName: string;
  companyAddress: string;
  companyGstin: string;
  companyPan: string;
}

interface InvoiceCustomTemplatesProps {
  data: InvoicePrintData;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InvoiceCustomTemplates({
  data,
  open,
  onOpenChange,
}: InvoiceCustomTemplatesProps) {
  // Customization configuration states
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateId>("minimalist");
  const [upiId, setUpiId] = useState("");
  const [showQrCode, setShowQrCode] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("erp:print-settings");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.upiId) setUpiId(parsed.upiId);
        if (parsed.showQrCode) setShowQrCode(parsed.showQrCode);
      }
    } catch (err) {
      console.error("Failed to load print settings:", err);
    }
  }, [open]);
  const [selectedFont, setSelectedFont] = useState<string>("font-sans");
  const [companyTitle, setCompanyTitle] = useState(data.companyName);
  const [companyAddr, setCompanyAddr] = useState(data.companyAddress);
  const [companyContact, setCompanyContact] = useState("Phone: +91 98765 43210");
  const [invoiceFooter, setInvoiceFooter] = useState("Thank you for shopping with us! Goods once sold cannot be returned.");

  // Toggle states
  const [showDiscount, setShowDiscount] = useState(true);
  const [showTax, setShowTax] = useState(true);
  const [showSignature, setShowSignature] = useState(true);
  const [customAccent, setCustomAccent] = useState("#000000");

  // Sync state if template changes some defaults
  useEffect(() => {
    if (selectedTemplate === "emerald") {
      setCustomAccent("#059669"); // emerald-600
    } else if (selectedTemplate === "corporate") {
      setCustomAccent("#1e3a8a"); // navy-900
    } else if (selectedTemplate === "neon") {
      setCustomAccent("#06b6d4"); // cyan-500
    } else if (selectedTemplate === "crimson") {
      setCustomAccent("#e11d48"); // rose-600
    } else if (selectedTemplate === "artisan") {
      setCustomAccent("#b45309"); // amber-700
    } else if (selectedTemplate === "indigo") {
      setCustomAccent("#4f46e5"); // indigo-600
    } else {
      setCustomAccent("#000000");
    }

    if (selectedTemplate === "retro") {
      setSelectedFont("font-mono");
    } else if (selectedTemplate === "artisan") {
      setSelectedFont("font-serif");
    } else {
      setSelectedFont("font-sans");
    }
  }, [selectedTemplate]);

  const handlePrint = () => {
    const printContent = document.getElementById("invoice-printable-area");
    if (!printContent) return;

    // Open a new printable window
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Invoice - ${data.invoiceNumber}</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Courier+Prime:ital,wght@0,400;0,700;1,400&display=swap');
            body {
              font-family: 'Inter', sans-serif;
              padding: 20px;
            }
            .font-sans { font-family: 'Inter', sans-serif; }
            .font-serif { font-family: 'Playfair Display', serif; }
            .font-mono { font-family: 'Courier Prime', monospace; }
            @media print {
              body { padding: 0; margin: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body class="${selectedFont}">
          <div class="max-w-[200mm] mx-auto">
            ${printContent.innerHTML}
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);

    printWindow.document.close();
  };

  const getAccentBg = () => {
    return { backgroundColor: `${customAccent}10` };
  };

  const getAccentText = () => {
    return { color: customAccent };
  };

  const getAccentBorder = () => {
    return { borderColor: customAccent };
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[92vh] overflow-hidden flex flex-col p-0 rounded-2xl border-border/80 shadow-2xl bg-card">
        <DialogHeader className="p-4 px-6 border-b border-border/40 shrink-0 flex flex-row items-center justify-between">
          <div>
            <DialogTitle className="text-lg font-black tracking-tight text-primary flex items-center gap-2">
              <Printer className="w-5 h-5 text-primary" /> Bill Print &amp; Customize Desk
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-0.5">
              Live customize parameters and switch between 10 high-fidelity pre-made templates instantly.
            </DialogDescription>
          </div>
        </DialogHeader>

        {/* Workspace */}
        <div className="flex-1 flex overflow-hidden min-h-0">

          {/* Left Panel: Configuration Options */}
          <div className="w-80 border-r border-border/40 bg-muted/15 p-5 overflow-y-auto space-y-6 select-none shrink-0 text-xs">

            {/* Template select grid */}
            <div className="space-y-2">
              <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                <LayoutTemplate className="w-3.5 h-3.5" /> 1. Select Template Layout
              </Label>
              <div className="space-y-1">
                <Select value={selectedTemplate} onValueChange={(val) => setSelectedTemplate(val as TemplateId)}>
                  <SelectTrigger className="h-9 rounded-xl text-xs bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-60 rounded-xl">
                    {TEMPLATES.map((t) => (
                      <SelectItem key={t.id} value={t.id} className="text-xs">
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="text-[10px] text-muted-foreground px-1 italic">
                  {TEMPLATES.find((t) => t.id === selectedTemplate)?.description}
                </div>
              </div>
            </div>

            {/* Accent Color picker */}
            <div className="space-y-2">
              <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5" /> 2. Accent Accent Color
              </Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={customAccent}
                  onChange={(e) => setCustomAccent(e.target.value)}
                  className="w-8 h-8 rounded-lg cursor-pointer border border-border bg-transparent p-0.5"
                />
                <Input
                  value={customAccent}
                  onChange={(e) => setCustomAccent(e.target.value)}
                  className="h-8 rounded-lg text-xs font-mono w-28 uppercase"
                />
              </div>
            </div>

            {/* Typography selection */}
            <div className="space-y-2">
              <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                <Type className="w-3.5 h-3.5" /> 3. Font Family
              </Label>
              <Select value={selectedFont} onValueChange={setSelectedFont}>
                <SelectTrigger className="h-9 rounded-xl text-xs bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {INVOICE_FONTS.map((f) => (
                    <SelectItem key={f.id} value={f.id} className="text-xs">
                      {f.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Custom fields text inputs */}
            <div className="space-y-3 pt-2 border-t border-border/30">
              <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                <Settings className="w-3.5 h-3.5" /> 4. Custom Bill Headers
              </Label>

              <div className="space-y-2">
                <div className="space-y-1">
                  <Label className="text-[9px] text-muted-foreground">Shop / Business Title</Label>
                  <Input value={companyTitle} onChange={(e) => setCompanyTitle(e.target.value)} className="h-8 rounded-lg text-xs bg-background" />
                </div>
                <div className="space-y-1">
                  <Label className="text-[9px] text-muted-foreground">Address Details</Label>
                  <Input value={companyAddr} onChange={(e) => setCompanyAddr(e.target.value)} className="h-8 rounded-lg text-xs bg-background" />
                </div>
                <div className="space-y-1">
                  <Label className="text-[9px] text-muted-foreground">Contact details</Label>
                  <Input value={companyContact} onChange={(e) => setCompanyContact(e.target.value)} className="h-8 rounded-lg text-xs bg-background" />
                </div>
                <div className="space-y-1">
                  <Label className="text-[9px] text-muted-foreground">Footer Notes / Terms</Label>
                  <Input value={invoiceFooter} onChange={(e) => setInvoiceFooter(e.target.value)} className="h-8 rounded-lg text-xs bg-background" />
                </div>
              </div>
            </div>

            {/* Toggle checkboxes */}
            <div className="space-y-3 pt-4 border-t border-border/30">
              <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5" /> 5. Column &amp; Area visibility
              </Label>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="show-disc" className="text-xs text-foreground/80 font-medium">Show Item Discounts</Label>
                  <Switch id="show-disc" checked={showDiscount} onCheckedChange={setShowDiscount} />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="show-tax" className="text-xs text-foreground/80 font-medium">Show GST breakdowns</Label>
                  <Switch id="show-tax" checked={showTax} onCheckedChange={setShowTax} />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="show-sig" className="text-xs text-foreground/80 font-medium">Show Signature box</Label>
                  <Switch id="show-sig" checked={showSignature} onCheckedChange={setShowSignature} />
                </div>
              </div>
            </div>

          </div>

          {/* Right Panel: Live Invoice Print Preview */}
          <div className="flex-1 bg-muted/5 flex items-start justify-center p-6 overflow-y-auto min-h-0">

            <div
              id="invoice-printable-area"
              className={cn(
                "w-[170mm] min-h-[220mm] bg-white text-black shadow-lg rounded-xl border border-gray-200/50 p-6 flex flex-col justify-between font-sans leading-relaxed select-none transition-all",
                selectedFont
              )}
            >
              {/* RENDER SELECTED TEMPLATE */}
              <div className="space-y-6">

                {/* 1. Emerald / Crimson / Indigo layout headers */}
                {(selectedTemplate === "emerald" ||
                  selectedTemplate === "crimson" ||
                  selectedTemplate === "indigo" ||
                  selectedTemplate === "corporate") && (
                    <div
                      className={cn(
                        "p-4 flex justify-between items-center border rounded-xl bg-gray-50/50",
                        selectedTemplate === "corporate" && "bg-slate-900 text-white rounded-none border-0"
                      )}
                      style={
                        selectedTemplate !== "corporate"
                          ? { ...getAccentBorder(), ...getAccentBg() }
                          : {}
                      }
                    >
                      <div>
                        <h1 className="text-base font-black uppercase tracking-wider" style={selectedTemplate !== "corporate" ? getAccentText() : {}}>
                          {companyTitle}
                        </h1>
                        <p className="text-[10px] font-medium opacity-80 mt-1 max-w-sm">{companyAddr}</p>
                        <p className="text-[10px] font-mono opacity-80 mt-0.5">{companyContact}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-black uppercase tracking-widest">Retail Invoice</div>
                        <div className="font-mono text-[10px] mt-1 font-bold">GSTIN: {data.companyGstin || "—"}</div>
                        <div className="font-mono text-[10px] font-bold">PAN: {data.companyPan || "—"}</div>
                      </div>
                    </div>
                  )}

                {/* 2. Minimalist / Tech / Retro Stark headers */}
                {(selectedTemplate === "minimalist" ||
                  selectedTemplate === "neon" ||
                  selectedTemplate === "retro" ||
                  selectedTemplate === "grocer" ||
                  selectedTemplate === "artisan") && (
                    <div className="flex justify-between items-start border-b pb-4 border-gray-200">
                      <div className="space-y-1">
                        <h1 className="text-lg font-black uppercase tracking-wide" style={getAccentText()}>
                          {companyTitle}
                        </h1>
                        <p className="text-[10px] text-gray-500 max-w-sm leading-relaxed">{companyAddr}</p>
                        <p className="text-[10px] font-mono text-gray-500 mt-1">{companyContact}</p>
                      </div>
                      <div className="text-right space-y-1 select-none">
                        <h2 className="text-xs font-black uppercase tracking-wider text-gray-400">TAX INVOICE</h2>
                        <div className="font-mono text-[10px] font-bold">No: {data.invoiceNumber}</div>
                        <div className="font-mono text-[10px] font-bold">Date: {formatDate(data.date)}</div>
                      </div>
                    </div>
                  )}

                {/* 3. POS Receipt (Thermal style) centered headers */}
                {selectedTemplate === "thermal" && (
                  <div className="text-center space-y-1.5 border-b border-dashed pb-3 border-gray-400">
                    <h1 className="text-sm font-extrabold uppercase tracking-widest">{companyTitle}</h1>
                    <p className="text-[9px] max-w-xs mx-auto leading-tight">{companyAddr}</p>
                    <p className="text-[9px] font-mono">{companyContact}</p>
                    <div className="text-[9px] font-bold border-t border-dashed pt-1.5 border-gray-400 flex justify-between font-mono">
                      <span>Receipt: {data.invoiceNumber}</span>
                      <span>{formatDate(data.date)}</span>
                    </div>
                  </div>
                )}

                {/* Metadata card for Non-POS templates */}
                {selectedTemplate !== "thermal" && (
                  <div className="grid grid-cols-2 gap-4 text-[10px]">
                    <div className="space-y-1 border border-gray-200/60 p-3 rounded-lg bg-gray-50/20">
                      <span className="text-[9px] font-black text-gray-400 uppercase tracking-wide block">Bill To Customer</span>
                      <div className="font-bold text-gray-800">{data.customerName}</div>
                      {data.customerPhone && <div className="text-gray-500 mt-0.5">Phone: {data.customerPhone}</div>}
                      {data.customerGstin && <div className="font-mono text-[9px] text-gray-500">GSTIN: {data.customerGstin}</div>}
                    </div>

                    <div className="space-y-1 border border-gray-200/60 p-3 rounded-lg bg-gray-50/20 flex flex-col justify-between">
                      <div>
                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-wide block">Transaction info</span>
                        <div className="font-bold mt-0.5">Date: {formatDate(data.date)}</div>
                        <div className="font-mono text-[9px] mt-0.5">Voucher ID: {data.invoiceNumber}</div>
                      </div>
                      <div className="font-mono text-[9px] font-bold flex gap-4 text-gray-500">
                        <span>GSTIN: {data.companyGstin || "—"}</span>
                        <span>PAN: {data.companyPan || "—"}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Metadata for POS thermal receipt */}
                {selectedTemplate === "thermal" && (
                  <div className="text-[9px] space-y-0.5 py-1">
                    <div><strong>Client:</strong> {data.customerName}</div>
                    {data.customerPhone && <div><strong>Phone:</strong> {data.customerPhone}</div>}
                  </div>
                )}

                {/* Products Table grid */}
                <div className="overflow-hidden">
                  <table className="w-full text-left text-[10px] border-collapse">
                    <thead>
                      <tr
                        className={cn(
                          "border-b border-gray-200 select-none text-gray-400 font-bold",
                          selectedTemplate === "thermal" && "border-dashed border-gray-400 text-black",
                          selectedTemplate === "corporate" && "bg-slate-100 text-slate-800 font-black",
                          selectedTemplate === "indigo" && "bg-indigo-50 text-indigo-900 font-black"
                        )}
                      >
                        <th className="py-2 pl-2">Item Description</th>
                        <th className="py-2 text-center w-12">Qty</th>
                        <th className="py-2 text-right w-20">Rate</th>
                        {showDiscount && <th className="py-2 text-right w-16">Disc%</th>}
                        {showTax && <th className="py-2 text-right w-16">GST%</th>}
                        <th className="py-2 text-right pr-2 w-24">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100/50">
                      {data.items.map((item, idx) => (
                        <tr
                          key={idx}
                          className={cn(
                            "hover:bg-gray-50/20 font-medium",
                            selectedTemplate === "thermal" && "divide-none border-none hover:bg-transparent"
                          )}
                        >
                          <td className="py-2 pl-2 align-middle">
                            <span className="font-semibold text-gray-800">{item.name}</span>
                          </td>
                          <td className="py-2 text-center font-mono align-middle">{item.quantity}</td>
                          <td className="py-2 text-right font-mono align-middle">{formatCurrency(item.rate)}</td>
                          {showDiscount && (
                            <td className="py-2 text-right font-mono text-rose-500 align-middle">
                              {item.discountPercent > 0 ? `-${item.discountPercent}%` : "0%"}
                            </td>
                          )}
                          {showTax && <td className="py-2 text-right font-mono text-gray-500 align-middle">{item.gstPercent}%</td>}
                          <td className="py-2 text-right font-mono font-bold pr-2 align-middle">{formatCurrency(item.amount)}</td>
                        </tr>
                      ))}
                    </tbody>

                    {/* Totals panel */}
                    <tfoot className="border-t border-gray-200 mt-2 font-semibold">
                      <tr className="border-none text-gray-500">
                        <td colSpan={showDiscount ? (showTax ? 4 : 3) : (showTax ? 3 : 2)} className="text-right py-1 pl-4">Subtotal:</td>
                        <td className="py-1 text-right pr-2 font-mono">{formatCurrency(data.subtotal)}</td>
                      </tr>
                      {showDiscount && data.discountAmount > 0 && (
                        <tr className="border-none text-rose-500">
                          <td colSpan={showDiscount ? (showTax ? 4 : 3) : (showTax ? 3 : 2)} className="text-right py-1 pl-4">Discounts:</td>
                          <td className="py-1 text-right pr-2 font-mono">-{formatCurrency(data.discountAmount)}</td>
                        </tr>
                      )}
                      {showTax && (data.cgstAmount + data.sgstAmount + data.igstAmount) > 0 && (
                        <>
                          {data.cgstAmount > 0 && (
                            <tr className="border-none text-gray-500 font-normal">
                              <td colSpan={showDiscount ? (showTax ? 4 : 3) : (showTax ? 3 : 2)} className="text-right py-0.5 pl-4">CGST:</td>
                              <td className="py-0.5 text-right pr-2 font-mono">{formatCurrency(data.cgstAmount)}</td>
                            </tr>
                          )}
                          {data.sgstAmount > 0 && (
                            <tr className="border-none text-gray-500 font-normal">
                              <td colSpan={showDiscount ? (showTax ? 4 : 3) : (showTax ? 3 : 2)} className="text-right py-0.5 pl-4">SGST:</td>
                              <td className="py-0.5 text-right pr-2 font-mono">{formatCurrency(data.sgstAmount)}</td>
                            </tr>
                          )}
                          {data.igstAmount > 0 && (
                            <tr className="border-none text-gray-500 font-normal">
                              <td colSpan={showDiscount ? (showTax ? 4 : 3) : (showTax ? 3 : 2)} className="text-right py-0.5 pl-4">IGST:</td>
                              <td className="py-0.5 text-right pr-2 font-mono">{formatCurrency(data.igstAmount)}</td>
                            </tr>
                          )}
                        </>
                      )}

                      <tr
                        className={cn(
                          "border-t border-gray-800 text-sm font-extrabold text-gray-900",
                          selectedTemplate === "thermal" && "border-dashed border-gray-400"
                        )}
                      >
                        <td colSpan={showDiscount ? (showTax ? 4 : 3) : (showTax ? 3 : 2)} className="text-right py-2 pl-4">Amount Due:</td>
                        <td className="py-2 text-right pr-2 font-mono text-base" style={getAccentText()}>
                          {formatCurrency(data.totalAmount)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* Amount in words for larger invoices */}
                {selectedTemplate !== "thermal" && data.amountInWords && (
                  <div className="text-[9px] font-bold text-gray-400 border-t border-gray-100/50 pt-2 flex flex-col gap-0.5">
                    <span>AMOUNT IN WORDS</span>
                    <span className="text-gray-600 capitalize text-[10px]">{data.amountInWords} Only</span>
                  </div>
                )}

              </div>

              {/* Footer notes & sign block */}
              <div className={cn("space-y-6 pt-4", selectedTemplate === "thermal" && "pt-2 space-y-4")}>

                {selectedTemplate !== "thermal" && (
                  <div className="flex justify-between items-end text-[10px] pt-8">
                    <div className="text-gray-400 italic space-y-1">
                      {showQrCode && upiId && (
                        <div className="flex items-center gap-3 bg-gray-50/50 p-2 rounded-lg border border-gray-200/50 select-none mb-2">
                          <QRCodeRenderer
                            text={`upi://pay?pa=${upiId}&pn=${encodeURIComponent(companyTitle)}&am=${data.totalAmount}&cu=INR`}
                            size={65}
                          />
                          <div>
                            <div className="font-bold text-gray-700 text-[8px] uppercase tracking-wider">Instant UPI Payment</div>
                            <div className="text-[7px] text-gray-500 mt-0.5 font-mono">{upiId}</div>
                          </div>
                        </div>
                      )}
                      <div>Subject to Delhi Jurisdiction.</div>
                      <div>E. &amp; O.E.</div>
                    </div>
                    {showSignature && (
                      <div className="text-center w-40 border-t border-gray-200 pt-1.5 font-bold">
                        <div className="text-[9px] uppercase tracking-wide text-gray-400">Authorized Signatory</div>
                        <div className="text-gray-800 mt-0.5">{companyTitle}</div>
                      </div>
                    )}
                  </div>
                )}

                {/* Simple Terms */}
                <div
                  className={cn(
                    "text-center text-[9px] text-gray-400 border-t border-gray-100 pt-3 italic leading-relaxed select-none",
                    selectedTemplate === "thermal" && "border-dashed border-gray-400 pt-2 mt-4"
                  )}
                >
                  {selectedTemplate === "thermal" && showQrCode && upiId && (
                    <div className="flex flex-col items-center justify-center gap-1.5 mb-4 select-none">
                      <QRCodeRenderer
                        text={`upi://pay?pa=${upiId}&pn=${encodeURIComponent(companyTitle)}&am=${data.totalAmount}&cu=INR`}
                        size={80}
                        className="mx-auto"
                      />
                      <div className="text-[8px] font-black text-gray-800 uppercase tracking-wider">Scan & Pay ₹{data.totalAmount.toFixed(2)}</div>
                    </div>
                  )}
                  <p>{invoiceFooter}</p>
                  <p className="text-[8px] font-semibold tracking-wider text-gray-300 uppercase mt-1">POWERED BY  ERP</p>
                </div>

              </div>

            </div>

          </div>

        </div>

        {/* Footer controls */}
        <div className="p-4 px-6 border-t border-border/40 shrink-0 bg-muted/20 flex justify-between items-center select-none text-xs font-semibold">
          <div className="flex items-center gap-2 text-muted-foreground">
            <LayoutTemplate className="w-4 h-4" />
            <span>Active: {TEMPLATES.find((t) => t.id === selectedTemplate)?.name}</span>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl h-10 px-5 text-xs">
              Close Desk
            </Button>
            <Button onClick={handlePrint} className="rounded-xl h-10 px-6 text-xs gap-1.5 shadow-lg">
              <Printer className="w-4 h-4" /> Print Customized Invoice
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
