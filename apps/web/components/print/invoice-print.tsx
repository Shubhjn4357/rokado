"use client";

import { formatCurrency, formatDate } from "@/lib/types";
import { useEffect, useState } from "react";

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
  // Trigger print when component mounts
  useEffect(() => {
    window.print();
    // After print, we could close the window if it's a popup
    // But for now, we just print and leave it open.
  }, []);

  const gstRate = cgstAmount + sgstAmount + igstAmount;
  const cgstRate = cgstAmount;
  const sgstRate = sgstAmount;
  const igstRate = igstAmount;

  return (
    <div className="p-4 max-w-[200mm] mx-auto" style={{ fontSize: "12px" }}>
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

      <div className="mb-4">
        <span className="font-medium mb-2 block">Bill To:</span>
        <p className="text-xs mb-1">{customerName}</p>
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
              <td colSpan="5" className="text-right py-1 font-medium">Subtotal:</td>
              <td className="py-1 text-right">{formatCurrency(subtotal)}</td>
            </tr>
            <tr>
              <td colSpan="5" className="text-right py-1 font-medium">Discount:</td>
              <td className="py-1 text-right">{formatCurrency(discountAmount)}</td>
            </tr>
            <tr>
              <td colSpan="5" className="text-right py-1 font-medium">Taxable Value:</td>
              <td className="py-1 text-right">{formatCurrency(taxableValue)}</td>
            </tr>
            {cgstAmount > 0 && (
              <tr>
                <td colSpan="5" className="text-right py-1 font-medium">CGST @{formatCurrency((cgstAmount / taxableValue) * 100)}%:</td>
                <td className="py-1 text-right">{formatCurrency(cgstAmount)}</td>
              </tr>
            )}
            {sgstAmount > 0 && (
              <tr>
                <td colSpan="5" className="text-right py-1 font-medium">SGST @{formatCurrency((sgstAmount / taxableValue) * 100)}%:</td>
                <td className="py-1 text-right">{formatCurrency(sgstAmount)}</td>
              </tr>
            )}
            {igstAmount > 0 && (
              <tr>
                <td colSpan="5" className="text-right py-1 font-medium">IGST @{formatCurrency((igstAmount / taxableValue) * 100)}%:</td>
                <td className="py-1 text-right">{formatCurrency(igstAmount)}</td>
              </tr>
            )}
            <tr className="border-t font-bold">
              <td colSpan="5" className="text-right py-1">Total Amount:</td>
              <td className="py-1 text-right">{formatCurrency(totalAmount)}</td>
            </tr>
            <tr>
              <td colSpan="6" className="py-2 text-left">
                Amount in Words: {amountInWords}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="mt-4 text-center text-xs">
        <p>Thank you for your business!</p>
        <p>Authorized Signatory</p>
      </div>
    </div>
  );
}