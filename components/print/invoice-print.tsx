"use client";

import { formatCurrency, formatDate } from "@/lib/types";
import { useEffect, useState } from "react";
import { QRCodeRenderer } from "@/components/print/qr-code-renderer";
import { DEFAULT_PRINT_SETTINGS, loadPrintSettings, type PrintSettings } from "@/lib/print-settings";

interface InvoicePrintProps {
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
  amountInWords: string;
  companyName: string;
  companyAddress: string;
  companyGstin: string;
  companyPan: string;
}

export function InvoicePrint({
  invoiceNumber,
  date,
  customerName,
  customerPhone,
  customerGstin,
  items,
  subtotal,
  discountAmount,
  taxableValue,
  cgstAmount,
  sgstAmount,
  igstAmount,
  totalAmount,
  amountInWords,
  companyName,
  companyAddress,
  companyGstin,
  companyPan,
}: InvoicePrintProps) {
  const [settings, setSettings] = useState<PrintSettings>(DEFAULT_PRINT_SETTINGS);

  useEffect(() => {
    setSettings(loadPrintSettings());
  }, []);

  // Trigger print when component mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      window.print();
    }, 800); // Allow QR code to fully generate before triggering print window
    return () => clearTimeout(timer);
  }, []);

  const visibleColumnCount = [
    settings.showSerialNumber,
    true,
    settings.showHsnCode,
    settings.showUnit,
    true,
    true,
    settings.showDiscount,
    true,
  ].filter(Boolean).length;
  const totalsColSpan = visibleColumnCount - 1;

  return (
    <div
      className={`p-4 max-w-[200mm] mx-auto text-black bg-white ${settings.fontFamily}`}
      style={{
        fontSize: settings.fontSize === "small" ? "10px" : settings.fontSize === "large" ? "13px" : "12px",
        filter: settings.colorMode === "greyscale" ? "grayscale(1)" : "none",
      }}
    >
      <div className="mb-4 text-center">
        {settings.showCompanyName && <h1 className="text-xl font-bold">{companyName}</h1>}
        {settings.showCompanyAddress && <p className="text-xs">{companyAddress}</p>}
        <p className="text-xs">
          {settings.showCompanyGstin && <>GSTIN: {companyGstin}</>}
          {settings.showCompanyGstin && settings.showCompanyPan && " | "}
          {settings.showCompanyPan && <>PAN: {companyPan}</>}
        </p>
        {settings.showCompanyPhone && <p className="text-xs">Phone: +91 98765 43210</p>}
      </div>

      <div className="mb-3 border-y border-dashed py-2 text-center">
        <div className="text-sm font-black uppercase tracking-wider">{settings.invoiceTitle}</div>
      </div>

      <div className="border-b border-dashed pb-2">
        <div className="flex justify-between mb-2">
          <span className="font-medium">Invoice No:</span>
          <span>{invoiceNumber}</span>
        </div>
        <div className="flex justify-between mb-2">
          <span className="font-medium">Date:</span>
          <span>{formatDate(date)}</span>
        </div>
      </div>

      <div className="mb-4 mt-2">
        <span className="font-medium mb-1 block">Bill To:</span>
        <p className="text-xs mb-1 font-bold">{customerName}</p>
        {customerPhone && <p className="text-xs mb-1">Phone: {customerPhone}</p>}
        {customerGstin && <p className="text-xs">GSTIN: {customerGstin}</p>}
      </div>

      <div className="overflow-hidden">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="border-b">
              {settings.showSerialNumber && <th className="text-left py-1">S.No</th>}
              <th className="text-left py-1">Description</th>
              {settings.showHsnCode && <th className="text-center py-1">HSN</th>}
              {settings.showUnit && <th className="text-center py-1">Unit</th>}
              <th className="text-center py-1">Qty</th>
              <th className="text-right py-1">Rate</th>
              {settings.showDiscount && <th className="text-right py-1">Disc%</th>}
              <th className="text-right py-1">Amount</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={index} className="border-t">
                {settings.showSerialNumber && <td className="py-1 text-left">{index + 1}</td>}
                <td className="py-1 text-left">{item.name}</td>
                {settings.showHsnCode && <td className="py-1 text-center">-</td>}
                {settings.showUnit && <td className="py-1 text-center">PCS</td>}
                <td className="py-1 text-center">{item.quantity}</td>
                <td className="py-1 text-right">{formatCurrency(item.rate)}</td>
                {settings.showDiscount && <td className="py-1 text-right">{item.discountPercent}%</td>}
                <td className="py-1 text-right">{formatCurrency(item.amount)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t">
              <td colSpan={totalsColSpan} className="text-right py-1 font-medium">Subtotal:</td>
              <td className="py-1 text-right">{formatCurrency(subtotal)}</td>
            </tr>
            {settings.showDiscount && discountAmount > 0 && (
              <tr>
                <td colSpan={totalsColSpan} className="text-right py-1 font-medium">Discount:</td>
                <td className="py-1 text-right">{formatCurrency(discountAmount)}</td>
              </tr>
            )}
            <tr>
              <td colSpan={totalsColSpan} className="text-right py-1 font-medium">Taxable Value:</td>
              <td className="py-1 text-right">{formatCurrency(taxableValue)}</td>
            </tr>
            {settings.showGstBreakdown && cgstAmount > 0 && (
              <tr>
                <td colSpan={totalsColSpan} className="text-right py-1 font-medium">CGST:</td>
                <td className="py-1 text-right">{formatCurrency(cgstAmount)}</td>
              </tr>
            )}
            {settings.showGstBreakdown && sgstAmount > 0 && (
              <tr>
                <td colSpan={totalsColSpan} className="text-right py-1 font-medium">SGST:</td>
                <td className="py-1 text-right">{formatCurrency(sgstAmount)}</td>
              </tr>
            )}
            {settings.showGstBreakdown && igstAmount > 0 && (
              <tr>
                <td colSpan={totalsColSpan} className="text-right py-1 font-medium">IGST:</td>
                <td className="py-1 text-right">{formatCurrency(igstAmount)}</td>
              </tr>
            )}
            <tr className="border-t font-bold">
              <td colSpan={totalsColSpan} className="text-right py-1">Total Amount:</td>
              <td className="py-1 text-right">{formatCurrency(totalAmount)}</td>
            </tr>
            {settings.showAmountInWords && amountInWords && (
              <tr>
                <td colSpan={visibleColumnCount} className="py-2 text-left text-[10px] text-gray-500 italic">
                  Amount in Words: {amountInWords}
                </td>
              </tr>
            )}
          </tfoot>
        </table>
      </div>

      <div className="mt-6 flex justify-between items-start gap-4 border-t border-dashed pt-4">
        <div>
          {settings.bankDetailsText && (
            <div className="mb-3 text-[10px] whitespace-pre-line font-mono text-gray-600">
              {settings.bankDetailsText}
            </div>
          )}
          {settings.showQrCode && settings.upiId && (
            <div className="flex items-center gap-2.5 bg-gray-50 p-2 rounded-lg border border-gray-200">
              <QRCodeRenderer
                text={`upi://pay?pa=${settings.upiId}&pn=${encodeURIComponent(companyName)}&am=${totalAmount}&cu=INR`}
                size={60}
              />
              <div>
                <div className="font-bold text-gray-700 text-[8px] uppercase tracking-wider">Instant UPI Payment</div>
                <div className="text-[7px] text-gray-500 mt-0.5 font-mono">{settings.upiId}</div>
              </div>
            </div>
          )}
        </div>
        <div className="text-right">
          {settings.footerText && <p className="font-semibold text-xs max-w-[260px]">{settings.footerText}</p>}
          {settings.showSignatureLine && (
            <div className="text-center w-36 border-t border-gray-300 mt-8 pt-1.5 font-bold ml-auto">
              <div className="text-[8px] uppercase tracking-wider text-gray-400">Authorized Signatory</div>
              <div className="text-gray-800 text-[9px] mt-0.5">{companyName}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
