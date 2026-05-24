export const PRINT_SETTINGS_STORAGE_KEY = "erp:print-settings";

export const INVOICE_FONTS = [
  { id: "font-sans", name: "Modern Sans", description: "Clean app-style invoice typography", className: "font-sans" },
  { id: "font-serif", name: "Elegant Serif", description: "Formal serif styling for premium bills", className: "font-serif" },
  { id: "font-mono", name: "Mono Ledger", description: "Typewriter-style compact ledger feel", className: "font-mono" },
] as const;

export type InvoiceFontId = (typeof INVOICE_FONTS)[number]["id"];

export const INVOICE_TEMPLATES = [
  {
    id: "minimalist",
    name: "Minimalist Stark",
    description: "Ultra clean, spacious, sans-serif design.",
    themeClass: "border-black bg-white text-black",
    accentColor: "#111827",
    defaultFont: "font-sans",
  },
  {
    id: "emerald",
    name: "Emerald Classic",
    description: "Classic green borders and headers for traditional invoices.",
    themeClass: "border-emerald-600/40 text-emerald-950",
    accentColor: "#059669",
    defaultFont: "font-sans",
  },
  {
    id: "thermal",
    name: "Thermal POS Receipt",
    description: "Compact 80mm centered receipt style layout.",
    themeClass: "w-[80mm] border-dashed border-gray-400 text-black",
    accentColor: "#111827",
    defaultFont: "font-mono",
  },
  {
    id: "corporate",
    name: "Corporate Prestige",
    description: "Strong navy header banner with bold separation.",
    themeClass: "border-slate-800 text-slate-900",
    accentColor: "#1e3a8a",
    defaultFont: "font-sans",
  },
  {
    id: "neon",
    name: "Neon Cyber Tech",
    description: "High-contrast grid layout for modern tech counters.",
    themeClass: "border-cyan-500 text-cyan-950",
    accentColor: "#06b6d4",
    defaultFont: "font-sans",
  },
  {
    id: "retro",
    name: "Retro Carbon Copy",
    description: "Typewriter styling with dotted dividers.",
    themeClass: "border-gray-500 text-gray-800",
    accentColor: "#374151",
    defaultFont: "font-mono",
  },
  {
    id: "crimson",
    name: "Crimson Modern",
    description: "Sleek crimson accent bands with geometric sections.",
    themeClass: "border-rose-600 text-rose-950",
    accentColor: "#e11d48",
    defaultFont: "font-sans",
  },
  {
    id: "artisan",
    name: "Warm Artisan",
    description: "Elegant sepia styling for boutique invoices.",
    themeClass: "border-amber-600/40 text-amber-900",
    accentColor: "#b45309",
    defaultFont: "font-serif",
  },
  {
    id: "indigo",
    name: "Sleek Indigo Card",
    description: "Modern card layout using rich indigo headers.",
    themeClass: "border-indigo-600 text-indigo-950",
    accentColor: "#4f46e5",
    defaultFont: "font-sans",
  },
  {
    id: "grocer",
    name: "Compact Grocer",
    description: "Dense wholesale layout for fast item scanning.",
    themeClass: "border-gray-800 text-black",
    accentColor: "#111827",
    defaultFont: "font-sans",
  },
] as const;

export type TemplateId = (typeof INVOICE_TEMPLATES)[number]["id"];

export const PAPER_SIZE_OPTIONS = [
  { id: "a4", name: "A4", description: "210 x 297 mm" },
  { id: "a5", name: "A5", description: "148 x 210 mm" },
  { id: "letter", name: "Letter", description: "8.5 x 11 in" },
  { id: "thermal58", name: "Thermal 58mm", description: "Compact receipt roll" },
  { id: "thermal80", name: "Thermal 80mm", description: "Standard POS receipt" },
] as const;

export type PaperSizeId = (typeof PAPER_SIZE_OPTIONS)[number]["id"];

export const ORIENTATION_OPTIONS = [
  { id: "portrait", name: "Portrait" },
  { id: "landscape", name: "Landscape" },
] as const;

export type PrintOrientation = (typeof ORIENTATION_OPTIONS)[number]["id"];

export const FONT_SIZE_OPTIONS = [
  { id: "small", name: "Small", description: "Compact" },
  { id: "medium", name: "Medium", description: "Default" },
  { id: "large", name: "Large", description: "Readable" },
] as const;

export type PrintFontSize = (typeof FONT_SIZE_OPTIONS)[number]["id"];

export const COLOR_MODE_OPTIONS = [
  { id: "color", name: "Full Color" },
  { id: "greyscale", name: "Greyscale" },
] as const;

export type PrintColorMode = (typeof COLOR_MODE_OPTIONS)[number]["id"];

export const INVOICE_TITLE_OPTIONS = [
  "Tax Invoice",
  "Bill of Supply",
  "Retail Invoice",
  "Delivery Note",
  "Proforma Invoice",
  "Receipt",
] as const;

export interface PrintSettings {
  paperSize: PaperSizeId;
  orientation: PrintOrientation;
  template: TemplateId;
  showLogo: boolean;
  showCompanyName: boolean;
  showCompanyAddress: boolean;
  showCompanyGstin: boolean;
  showCompanyPan: boolean;
  showCompanyPhone: boolean;
  showHsnCode: boolean;
  showUnit: boolean;
  showDiscount: boolean;
  showGstBreakdown: boolean;
  showSerialNumber: boolean;
  footerText: string;
  bankDetailsText: string;
  showSignatureLine: boolean;
  showAmountInWords: boolean;
  upiId: string;
  showQrCode: boolean;
  fontSize: PrintFontSize;
  fontFamily: InvoiceFontId;
  colorMode: PrintColorMode;
  accentColor: string;
  invoiceTitle: string;
}

export const DEFAULT_PRINT_SETTINGS: PrintSettings = {
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
  fontFamily: "font-sans",
  colorMode: "color",
  accentColor: "#111827",
  invoiceTitle: "Tax Invoice",
};

export const HEADER_VISIBILITY_OPTIONS = [
  { key: "showCompanyName", label: "Company Name", description: "Show business name prominently" },
  { key: "showCompanyAddress", label: "Company Address", description: "Full registered address" },
  { key: "showCompanyGstin", label: "GSTIN Number" },
  { key: "showCompanyPan", label: "PAN Number" },
  { key: "showCompanyPhone", label: "Phone Number" },
] as const satisfies readonly { key: keyof PrintSettings; label: string; description?: string }[];

export const COLUMN_VISIBILITY_OPTIONS = [
  { key: "showSerialNumber", label: "Serial Number (S.No)" },
  { key: "showHsnCode", label: "HSN / SAC Code", description: "Harmonized System Nomenclature code" },
  { key: "showUnit", label: "Unit of Measurement", description: "PCS, MTR, KGS, etc." },
  { key: "showDiscount", label: "Discount Column", description: "Per-item and bill-level discounts" },
  { key: "showGstBreakdown", label: "GST Breakdown", description: "CGST / SGST / IGST components" },
] as const satisfies readonly { key: keyof PrintSettings; label: string; description?: string }[];

export const FOOTER_VISIBILITY_OPTIONS = [
  { key: "showAmountInWords", label: "Amount in Words", description: "e.g. Rupees Five Thousand Only" },
  { key: "showSignatureLine", label: "Signature Line", description: "Authorised signature box at bottom right" },
] as const satisfies readonly { key: keyof PrintSettings; label: string; description?: string }[];

const LEGACY_TEMPLATE_MAP: Record<string, TemplateId> = {
  classic: "emerald",
  detailed: "corporate",
};

function isOptionId<T extends readonly { id: string }[]>(options: T, value: unknown): value is T[number]["id"] {
  return typeof value === "string" && options.some((option) => option.id === value);
}

function normalizeTemplate(value: unknown): TemplateId {
  if (isOptionId(INVOICE_TEMPLATES, value)) return value;
  if (typeof value === "string" && LEGACY_TEMPLATE_MAP[value]) return LEGACY_TEMPLATE_MAP[value];
  return DEFAULT_PRINT_SETTINGS.template;
}

function normalizeHex(value: unknown, fallback: string) {
  if (typeof value === "string" && /^#[0-9a-fA-F]{6}$/.test(value)) return value;
  return fallback;
}

export function getInvoiceTemplate(id: TemplateId) {
  return INVOICE_TEMPLATES.find((template) => template.id === id) ?? INVOICE_TEMPLATES[0];
}

export function normalizePrintSettings(value: unknown): PrintSettings {
  const raw = typeof value === "object" && value !== null ? value as Partial<PrintSettings> & Record<string, unknown> : {};
  const template = normalizeTemplate(raw.template);
  const templateConfig = getInvoiceTemplate(template);

  return {
    ...DEFAULT_PRINT_SETTINGS,
    ...raw,
    template,
    paperSize: isOptionId(PAPER_SIZE_OPTIONS, raw.paperSize) ? raw.paperSize : DEFAULT_PRINT_SETTINGS.paperSize,
    orientation: isOptionId(ORIENTATION_OPTIONS, raw.orientation) ? raw.orientation : DEFAULT_PRINT_SETTINGS.orientation,
    fontSize: isOptionId(FONT_SIZE_OPTIONS, raw.fontSize) ? raw.fontSize : DEFAULT_PRINT_SETTINGS.fontSize,
    fontFamily: isOptionId(INVOICE_FONTS, raw.fontFamily) ? raw.fontFamily : templateConfig.defaultFont,
    colorMode: isOptionId(COLOR_MODE_OPTIONS, raw.colorMode) ? raw.colorMode : DEFAULT_PRINT_SETTINGS.colorMode,
    accentColor: normalizeHex(raw.accentColor, templateConfig.accentColor),
    upiId: typeof raw.upiId === "string" ? raw.upiId : "",
    showQrCode: Boolean(raw.showQrCode),
    invoiceTitle: typeof raw.invoiceTitle === "string" && raw.invoiceTitle.trim()
      ? raw.invoiceTitle.trim()
      : DEFAULT_PRINT_SETTINGS.invoiceTitle,
  };
}

export function loadPrintSettings(): PrintSettings {
  if (typeof window === "undefined") return DEFAULT_PRINT_SETTINGS;
  try {
    const raw = window.localStorage.getItem(PRINT_SETTINGS_STORAGE_KEY);
    return normalizePrintSettings(raw ? JSON.parse(raw) : null);
  } catch {
    return DEFAULT_PRINT_SETTINGS;
  }
}

export function savePrintSettings(settings: PrintSettings) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PRINT_SETTINGS_STORAGE_KEY, JSON.stringify(normalizePrintSettings(settings)));
}
