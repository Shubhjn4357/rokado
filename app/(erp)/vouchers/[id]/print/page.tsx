"use client";

import { db, vouchers, voucherEntries, ledgers, eq } from "@/lib/database";
import { notFound } from "next/navigation";
import { InvoicePrint } from "@/components/print/invoice-print";
import { formatCurrency, formatDate } from "@/lib/types";
import { useEffect, useState, use } from "react";

// export const dynamic = "force-dynamic";

/*
export const generateMetadata = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const [ledger] = await db.select().from(ledgers).where(eq(ledgers.id as any, id)).limit(1);
  return { title: `Invoice ${voucher[0]?.number ?? id} - ERP` };
};
*/

export default function VoucherPrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const voucher = await db
          .select({
            id: vouchers.id,
            number: vouchers.number,
            date: vouchers.date,
            status: vouchers.status,
            totalAmount: vouchers.totalAmount,
            gstTotal: vouchers.gstTotal,
            grandTotal: vouchers.grandTotal,
            partyLedgerId: vouchers.partyLedgerId,
          })
          .from(vouchers)
          .where(eq(vouchers.id as any, id))
          .limit(1);

        if (!voucher[0]) {
          setData({ error: "NotFound" });
          return;
        }

        const partyLedger = voucher[0].partyLedgerId 
          ? await db
              .select({
                id: ledgers.id,
                name: ledgers.name,
                phone: ledgers.phone,
                gstNumber: ledgers.gstNumber,
              })
              .from(ledgers)
              .where(eq(ledgers.id as any, voucher[0].partyLedgerId))
              .limit(1)
          : [];

        const entries = await db
          .select({
            id: voucherEntries.id,
            amount: voucherEntries.amount,
            narration: voucherEntries.narration,
            ledgerId: voucherEntries.ledgerId,
          })
          .from(voucherEntries)
          .where(eq(voucherEntries.voucherId, id));

        // Get ledger names for entries
        const ledgerNames = await db
          .select({ id: ledgers.id, name: ledgers.name })
          .from(ledgers);

        const ledgerMap: Record<string, string> = {};
        ledgerNames.forEach((l) => {
          ledgerMap[l.id] = l.name;
        });

        setData({
          voucher: voucher[0],
          party: partyLedger[0],
          entries,
          ledgerMap,
        });
      } catch (err) {
        console.error("Failed to fetch voucher for print:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  if (loading) return <div>Loading...</div>;
  if (data?.error === "NotFound") return notFound();
  if (!data) return <div>No data</div>;

  const { voucher, party, entries, ledgerMap } = data;

  // Compute amounts (simplified)
  const subtotal = voucher.totalAmount; // Assuming totalAmount is before tax
  const taxAmount = voucher.gstTotal;
  const totalAmount = voucher.grandTotal;

  // We don't have item details, so we'll show a placeholder.
  const items = [
    {
      name: "Items sold via POS",
      quantity: 1,
      rate: subtotal,
      discountPercent: 0,
      gstPercent: (taxAmount / subtotal) * 100,
      amount: subtotal,
    },
  ];

  const amountInWords = "Rupees " + totalAmount.toFixed(2) + " Only"; // Simplified

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Print Invoice</h1>
      <InvoicePrint
        invoiceNumber={voucher.number}
        date={voucher.date}
        customerName={party.name}
        customerPhone={party.phone}
        customerGstin={party.gstNumber}
        items={items}
        subtotal={subtotal}
        discountAmount={0}
        taxableValue={subtotal}
        cgstAmount={taxAmount / 2} // Assuming CGST and SGST split equally for simplicity
        sgstAmount={taxAmount / 2}
        igstAmount={0}
        totalAmount={totalAmount}
        amountInWords={amountInWords}
        companyName="Shree Saree House"
        companyAddress="145, Saree Market, Chandni Chowk, Delhi 110006"
        companyGstin="27AAACS1429B1ZB"
        companyPan="AAACS1429B"
      />
    </div>
  );
}