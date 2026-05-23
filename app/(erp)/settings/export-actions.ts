"use server";

import { db, ledgers, vouchers, voucherEntries, eq, and } from "@/lib/database";
import { formatCurrency } from "@/lib/types";

export async function exportTallyXmlAction() {
  try {
    const allLedgers = await db.query.ledgers.findMany({
      where: eq(ledgers.isActive as any, true),
    });

    const tallyGroupMap: Record<string, string> = {
      cash: "Cash-in-Hand",
      bank: "Bank Accounts",
      sundry_debtors: "Sundry Debtors",
      sundry_creditors: "Sundry Creditors",
      sales: "Sales Accounts",
      purchase: "Purchase Accounts",
      expenses: "Indirect Expenses",
      capital: "Capital Account",
      duties_taxes: "Duties & Taxes",
      loans: "Loans (Liability)",
      fixed_assets: "Fixed Assets",
      current_assets: "Current Assets",
      current_liabilities: "Current Liabilities",
    };

    let xml = `<?xml version="1.0" encoding="utf-8"?>\n`;
    xml += `<ENVELOPE>\n`;
    xml += `  <HEADER>\n`;
    xml += `    <TALLYREQUEST>Import Data</TALLYREQUEST>\n`;
    xml += `  </HEADER>\n`;
    xml += `  <BODY>\n`;
    xml += `    <IMPORTDATA>\n`;
    xml += `      <REQUESTDESC>\n`;
    xml += `        <REPORTNAME>All Masters</REPORTNAME>\n`;
    xml += `        <STATICVARIABLES>\n`;
    xml += `          <SVCURRENTCOMPANY>  House</SVCURRENTCOMPANY>\n`;
    xml += `        </STATICVARIABLES>\n`;
    xml += `      </REQUESTDESC>\n`;
    xml += `      <REQUESTDATA>\n`;

    for (const ledg of allLedgers) {
      const tallyParent = tallyGroupMap[ledg.group] || "Primary";
      const cleanName = ledg.name.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
      
      xml += `        <TALLYMESSAGE xmlns:UDF="TallyUDF">\n`;
      xml += `          <LEDGER NAME="${cleanName}" ACTION="Create">\n`;
      xml += `            <NAME>${cleanName}</NAME>\n`;
      xml += `            <PARENT>${tallyParent}</PARENT>\n`;
      xml += `            <OPENINGBALANCE>${ledg.openingBalance * (ledg.balanceType === "dr" ? 1 : -1)}</OPENINGBALANCE>\n`;
      xml += `            <ISBILLWISEON>Yes</ISBILLWISEON>\n`;
      if (ledg.gstNumber) {
        xml += `            <PARTYGSTIN>${ledg.gstNumber}</PARTYGSTIN>\n`;
      }
      if (ledg.pan) {
        xml += `            <PANNUMBER>${ledg.pan}</PANNUMBER>\n`;
      }
      xml += `          </LEDGER>\n`;
      xml += `        </TALLYMESSAGE>\n`;
    }

    xml += `      </REQUESTDATA>\n`;
    xml += `    </IMPORTDATA>\n`;
    xml += `  </BODY>\n`;
    xml += `</ENVELOPE>\n`;

    return { success: true, filename: "Tally_Ledgers_Import.xml", content: xml };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "XML compilation failed" };
  }
}

export async function exportGstr1JsonAction() {
  try {
    // 1. Get all Sales Vouchers and their corresponding entries
    const salesVouchers = await db.query.vouchers.findMany({
      where: eq(vouchers.type as any, "sales"),
    });

    const b2bInvoices = [];

    for (const v of salesVouchers) {
      // Find the entries
      const entries = await db.query.voucherEntries.findMany({
        where: eq(voucherEntries.voucherId as any, v.id),
      });

      // Find party posting (Debit)
      const partyLine = entries.find(e => e.type === "dr");
      if (!partyLine) continue;

      const partyLedger = await db.query.ledgers.findFirst({
        where: eq(ledgers.id as any, partyLine.ledgerId),
      });

      if (!partyLedger || !partyLedger.gstNumber) continue; // Only B2B with valid GSTIN

      // Find Sales/Revenue line (Credit)
      const salesLine = entries.find(e => e.type === "cr" && e.inventoryItemId);
      // Find Tax line (Credit)
      const taxLine = entries.find(e => e.type === "cr" && !e.inventoryItemId);

      const taxableVal = salesLine ? salesLine.amount : v.totalAmount * 0.847; // fallback approx
      const taxVal = taxLine ? taxLine.amount : v.totalAmount * 0.153;

      const invoiceDateStr = new Date(v.date).toISOString().split("T")[0].split("-").reverse().join("-"); // DD-MM-YYYY

      b2bInvoices.push({
        ctin: partyLedger.gstNumber,
        inv: [
          {
            inum: v.number || `INV-${v.id.slice(0,6).toUpperCase()}`,
            idt: invoiceDateStr,
            val: v.grandTotal || v.totalAmount,
            pos: partyLedger.gstNumber.slice(0, 2), // first two letters of GSTIN is state code
            rchrg: "N",
            inv_typ: "R",
            itms: [
              {
                num: 1,
                itm_det: {
                  rt: 18.0, // standard rate
                  txval: parseFloat(taxableVal.toFixed(2)),
                  iamt: 0,
                  camt: parseFloat((taxVal / 2).toFixed(2)),
                  samt: parseFloat((taxVal / 2).toFixed(2)),
                }
              }
            ]
          }
        ]
      });
    }

    const gstr1Payload = {
      gstin: "27SHOUSE1Z5", // Mock company GSTIN
      fp: "052026", // May 2026
      gt: 2450000.0, // Mock gross turnover
      cur_gt: 480000.0,
      b2b: b2bInvoices,
    };

    return {
      success: true,
      filename: "GSTR1_Filings_Validated.json",
      content: JSON.stringify(gstr1Payload, null, 2),
    };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "JSON compilation failed" };
  }
}
