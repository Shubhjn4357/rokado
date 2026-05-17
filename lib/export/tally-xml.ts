import { db, companies, ledgers, voucherEntries, vouchers, eq, and, gte, lte, sql } from "@/lib/database";
import { formatDate } from "@/lib/types";

/**
 * Export ledgers and vouchers in Tally-compatible XML format
 * @param companyId Company ID (defaults to "company_1" for single-tenant mode)
 * @param fromDate Start date for voucher export (Unix timestamp)
 * @param toDate End date for voucher export (Unix timestamp)
 * @returns Promise resolving to XML string
 */
export async function exportTallyXML(
  companyId: string = "company_1",
  fromDate?: number,
  toDate?: number
): Promise<string> {
  try {
    // Fetch company details
    const companyResult = await db
      .select()
      .from(companies)
      .where(eq(companies.id, companyId))
      .limit(1);

    const company = companyResult[0];
    if (!company) {
      throw new Error(`Company ${companyId} not found`);
    }

    // Fetch all ledgers
    const ledgerResult = await db
      .select({
        id: ledgers.id,
        name: ledgers.name,
        group: ledgers.group,
        openingBalance: ledgers.openingBalance,
      })
      .from(ledgers)
      .where(eq(ledgers.companyId, companyId))
      .orderBy(ledgers.name);

    // Fetch vouchers with entries
    const voucherResult = await db
      .select({
        voucherId: vouchers.id,
        voucherNumber: vouchers.number,
        voucherDate: vouchers.date,
        voucherType: vouchers.type,
        voucherNarration: vouchers.narration,
        entryId: voucherEntries.id,
        ledgerId: voucherEntries.ledgerId,
        entryType: voucherEntries.type,
        amount: voucherEntries.amount,
        entryNarration: voucherEntries.narration,
      })
      .from(voucherEntries)
      .innerJoin(vouchers, eq(voucherEntries.voucherId, vouchers.id))
      .where(
        and(
          eq(vouchers.companyId, companyId),
          fromDate ? gte(vouchers.date, fromDate) : undefined,
          toDate ? lte(vouchers.date, toDate) : undefined
        )
      )
      .orderBy(vouchers.date, vouchers.id, voucherEntries.id);

    // Group entries by voucher
    const vouchersMap = new Map<string, {
      voucher: typeof voucherResult[0] & { voucherDate: number };
      entries: Array<typeof voucherResult[0] & { entryId: string }>;
    }>();

    voucherResult.forEach(row => {
      if (!vouchersMap.has(row.voucherId)) {
        vouchersMap.set(row.voucherId, {
          voucher: {
            ...row,
            voucherDate: Number(row.voucherDate)
          },
          entries: []
        });
      }
      vouchersMap.get(row.voucherId)!.entries.push({
        ...row,
        entryId: row.entryId,
        ledgerId: row.ledgerId,
        entryType: row.entryType,
        amount: Number(row.amount),
        entryNarration: row.entryNarration || null
      });
    });

    // Generate XML
    const xmlLines = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<ENVELOPE>',
      '  <HEADER>',
      '    <TALLYREQUEST>Import Data</TALLYREQUEST>',
      '  </HEADER>',
      '  <BODY>',
      '    <IMPORTDATA>',
      '      <REQUESTDESC>',
      '        <REPORTNAME>All Masters</REPORTNAME>',
      '      </REQUESTDESC>',
      '      <REQUESTDATA>',
      '        <TALLYMESSAGE>',
    ];

    // Company definition
    xmlLines.push(
      '          <MASTER>',
      '            <MASTERTYPE>COMPANY</MASTERTYPE>',
      '            <MASTERNAME>',
      company.name.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'),
      '</MASTERNAME>',
      '          </MASTER>'
    );

    // Ledger definitions
    ledgerResult.forEach(ledger => {
      let tallyGroup = mapLedgerGroupToTally(ledger.group);
      let openingBalance = Number(ledger.openingBalance || 0);

      // Determine if opening balance is Dr or Cr based on ledger's normal balance
      // For simplicity, we'll assume the openingBalance field already represents the correct signed value
      const openingBalanceDr = openingBalance >= 0 ? openingBalance : 0;
      const openingBalanceCr = openingBalance < 0 ? Math.abs(openingBalance) : 0;

      xmlLines.push(
        '          <MASTER>',
        '            <MASTERTYPE>LEDGER</MASTERTYPE>',
        '            <MASTERNAME>',
        ledger.name.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'),
        '</MASTERNAME>',
        `            <PARENT>${tallyGroup}</PARENT>`,
        `            <OPENINGBALANCE>${openingBalanceDr - openingBalanceCr}</OPENINGBALANCE>`,
        `            <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>`,
        `            <LEDGERFROMITEM>No</LEDGERFROMITEM>`,
        `            <LEDGERISSTOCKITEM>No</LEDGERISSTOCKITEM>`,
        `            <GSTIN>${company.gstin || ""}</GSTIN>`,
        `            <ITAVAILABLE>No</ITAVAILABLE>`,
        `            <ROUNDINGAMOUNT>1.00</ROUNDINGAMOUNT>`,
        '            <BANKACCOUNTDETAILS.LIST>',
        '              <BANKACCOUNTNAME></BANKACCOUNTNAME>',
        '              <BANKACCOUNTNUMBER></BANKACCOUNTNUMBER>',
        '              <BANKACCOUNTCITY></BANKACCOUNTCITY>',
        '              <BANKACCOUNTIFSCODE></BANKACCOUNTIFSCODE>',
        '            </BANKACCOUNTDETAILS.LIST>',
        '          </MASTER>'
      );
    });

    // Close masters section
    xmlLines.push(
    '        </TALLYMESSAGE>',
    '      </REQUESTDATA>',
    '    </IMPORTDATA>',
    '    <IMPORTDATA>',
    '      <REQUESTDESC>',
    '        <REPORTNAME>Vouchers</REPORTNAME>',
    '      </REQUESTDESC>',
    '      <REQUESTDATA>',
    '        <TALLYMESSAGE>'
    );

    // Voucher entries
    vouchersMap.forEach((voucherData, voucherId) => {
      const { voucher, entries } = voucherData;

      // Map voucher type to Tally voucher type
      const tallyVoucherType = mapVoucherTypeToTally(voucher.voucherType);
      const voucherDate = new Date(voucher.voucherDate);
      const formattedDate = `${voucherDate.getDate().toString().padStart(2, '0')}-${(voucherDate.getMonth() + 1).toString().padStart(2, '0')}-${voucherDate.getFullYear()}`;

      xmlLines.push(
        '          <VOUCHER>',
        `            <VOUCHERTYPENAME>${tallyVoucherType}</VOUCHERTYPENAME>`,
        `            <DATE>${formattedDate}</DATE>`,
        `            <VOUCHERNUMBER>${voucher.voucherNumber || ""}</VOUCHERNUMBER>`,
        `            <NARRATION>${(voucher.voucherNarration || "").replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')}</NARRATION>`,
        '            <VOUCHERTYPENAME>Sales</VOUCHERTYPENAME>', // Tally expects this twice for some reason
        '            <ISINVOICE>No</ISINVOICE>',
        '            <ISPOSTED>Yes</ISPOSTED>',
        '            <VOUCHERNUMBER>',
        voucher.voucherNumber || "",
        '</VOUCHERNUMBER>'
      );

      // Allocate ledger entries
      entries.forEach(entry => {
        const amount = Math.abs(entry.amount);
        const isDebit = entry.entryType === "dr";
        const isCredit = entry.entryType === "cr";

        xmlLines.push(
        '            <ALLLEDGERENTRIES.LIST>',
        `              <LEDGERNAME>${getLedgerNameById(ledgerResult, entry.ledgerId)}</LEDGERNAME>`,
        `              <ISDEEMEDPOSITIVE>${isDebit ? "Yes" : "No"}</ISDEEMEDPOSITIVE>`,
        `              <AMOUNT>${amount.toFixed(2)}</AMOUNT>`,
        `              <FCAMOUNT>${amount.toFixed(2)}</FCAMOUNT>`,
        `              <FPCRATE>1.00</FPCRATE>`,
                  `              <BANKALLOCATIONS.LIST>`,
                  `              </BANKALLOCATIONS.LIST>`,
                  '            </ALLLEDGERENTRIES.LIST>'
        );
      });

      xmlLines.push('          </VOUCHER>');
    });

    // Close voucher section and envelope
    xmlLines.push(
    '        </TALLYMESSAGE>',
    '      </REQUESTDATA>',
    '    </IMPORTDATA>',
    '  </BODY>',
    '</ENVELOPE>'
    );

    return xmlLines.join('\n');
  } catch (error) {
    console.error("Error exporting Tally XML:", error);
    throw error;
  }
}

/**
 * Map internal ledger group to Tally group
 */
function mapLedgerGroupToTally(group: string): string {
  const mapping: Record<string, string> = {
    "capital": "Capital Account",
    "sundry_creditors": "Sundry Creditors",
    "sundry_debtors": "Sundry Debtors",
    "bank": "Bank Accounts",
    "cash": "Cash-in-hand",
    "stock": "Stock-in-hand",
    "fixed_assets": "Fixed Assets",
    "duties_taxes": "Duties & Taxes",
    "expenses": "Expenses",
    "sales": "Sales Account",
    "purchase": "Purchase Account",
    "other": "Other Income"
  };
  return mapping[group] || "Other Income";
}

/**
 * Map internal voucher type to Tally voucher type
 */
function mapVoucherTypeToTally(type: string): string {
  const mapping: Record<string, string> = {
    "sales": "Sales",
    "purchase": "Purchase",
    "payment": "Payment",
    "receipt": "Receipt",
    "journal": "Journal",
    "contra": "Contra"
  };
  return mapping[type] || "Journal";
}

/**
 * Get ledger name by ID from ledger results
 */
function getLedgerNameById(ledgerResult: Array<{
  id: string;
  name: string;
  group: string;
  openingBalance: number;
}> | null, ledgerId: string): string {
  if (!ledgerResult) return "Unknown";
  const ledger = ledgerResult.find(l => l.id === ledgerId);
  return ledger ? ledger.name : "Unknown";
}
