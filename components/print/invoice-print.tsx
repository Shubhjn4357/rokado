"use client";

import { formatCurrency, formatDate } from "@/lib/types";
import { useEffect, useState } from "react";
import { QRCodeRenderer } from "@/components/print/qr-code-renderer";

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
  const [settings, setSettings] = useState<{ showQrCode?: boolean; upiId?: string }>({});

  useEffect(() => {
    try {
      const raw = localStorage.getItem("erp:print-settings");
      if (raw) {
        setSettings(JSON.parse(raw));
      }
    } catch (err) {
      console.error("Failed to load print settings:", err);
    }
  }, []);

  // Trigger print when component mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      window.print();
    }, 800); // Allow QR code to fully generate before triggering print window
    return () => clearTimeout(timer);
  }, []);

  const gstRate = cgstAmount + sgstAmount + igstAmount;
  const cgstRate = cgstAmount;
  const sgstRate = sgstAmount;
  const igstRate = igstAmount;

  return (
    <div className="p-4 max-w-[200mm] mx-auto text-black bg-white" style={{ fontSize: "12px" }}>
      <div className="mb-4 text-center">
        <h1 className="text-xl font-bold">{companyName}</h1>
        <p className="text-xs">{companyAddress}</p>
        <p className="text-xs">GSTIN: {companyGstin} | PAN: {companyPan}</p>
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
              <th className="text-left py-1">S.No</th>
              <th className="text-left py-1">Description</th>
              <th className="text-center py-1">Qty</th>
              <th className="text-right py-1">Rate</th>
              <th className="text-right py-1">Disc%</th>
              <th className="text-right py-1">Amount</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={index} className="border-t">
                <td className="py-1 text-left">{index + 1}</td>
                <td className="py-1 text-left">{item.name}</td>
                <td className="py-1 text-center">{item.quantity}</td>
                <td className="py-1 text-right">{formatCurrency(item.rate)}</td>
                <td className="py-1 text-right">{item.discountPercent}%</td>
                <td className="py-1 text-right">{formatCurrency(item.amount)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t">
              <td colSpan={5} className="text-right py-1 font-medium">Subtotal:</td>
              <td className="py-1 text-right">{formatCurrency(subtotal)}</td>
            </tr>
            {discountAmount > 0 && (
              <tr>
                <td colSpan={5} className="text-right py-1 font-medium">Discount:</td>
                <td className="py-1 text-right">{formatCurrency(discountAmount)}</td>
              </tr>
            )}
            <tr>
              <td colSpan={5} className="text-right py-1 font-medium">Taxable Value:</td>
              <td className="py-1 text-right">{formatCurrency(taxableValue)}</td>
            </tr>
            {cgstAmount > 0 && (
              <tr>
                <td colSpan={5} className="text-right py-1 font-medium">CGST:</td>
                <td className="py-1 text-right">{formatCurrency(cgstAmount)}</td>
              </tr>
            )}
            {sgstAmount > 0 && (
              <tr>
                <td colSpan={5} className="text-right py-1 font-medium">SGST:</td>
                <td className="py-1 text-right">{formatCurrency(sgstAmount)}</td>
              </tr>
            )}
            {igstAmount > 0 && (
              <tr>
                <td colSpan={5} className="text-right py-1 font-medium">IGST:</td>
                <td className="py-1 text-right">{formatCurrency(igstAmount)}</td>
              </tr>
            )}
            <tr className="border-t font-bold">
              <td colSpan={5} className="text-right py-1">Total Amount:</td>
              <td className="py-1 text-right">{formatCurrency(totalAmount)}</td>
            </tr>
            {amountInWords && (
              <tr>
                <td colSpan={6} className="py-2 text-left text-[10px] text-gray-500 italic">
                  Amount in Words: {amountInWords}
                </td>
              </tr>
            )}
          </tfoot>
        </table>
      </div>

      <div className="mt-6 flex justify-between items-start gap-4 border-t border-dashed pt-4">
        <div>
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
          <p className="font-semibold text-xs">Thank you for your business!</p>
          <div className="text-center w-36 border-t border-gray-300 mt-8 pt-1.5 font-bold ml-auto">
            <div className="text-[8px] uppercase tracking-wider text-gray-400">Authorized Signatory</div>
            <div className="text-gray-800 text-[9px] mt-0.5">{companyName}</div>
          </div>
        </div>
      </div>
    </div>
  );
}