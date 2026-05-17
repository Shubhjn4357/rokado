import { db, ledgers, voucherEntries, vouchers, eq, and, gte, lte, sum, sql } from "@repo/database";
import { formatCurrency, formatDate } from "@/lib/types";
import * as XLSX from 'xlsx';

/**
 * Export Trial Balance to Excel format
 * @param companyId Company ID (defaults to "company_1")
 * @param fromDate Start date (Unix timestamp)
 * @param toDate End date (Unix timestamp)
 * @returns Promise resolving to Excel file blob
 */
export async function exportTrialBalanceToExcel(
  companyId: string = "company_1",
  fromDate?: number,
  toDate?: number
): Promise<Blob> {
  try {
    // Fetch trial balance data (similar to trial-balance/page.tsx logic)
    const allLedgers = await db
      .select({
        id: ledgers.id,
        name: ledgers.name,
        group: ledgers.group,
        openingBalance: ledgers.openingBalance,
        balanceType: ledgers.balanceType,
      })
      .from(ledgers)
      .where(eq(ledgers.companyId, companyId))
      .orderBy(ledgers.name);

    // Calculate balances for each ledger
    const trialBalanceData = await Promise.all(
      allLedgers.map(async (ledger) => {
        const dateParam = toDate;

        // Debit sum
        const debitResult = await db
          .select({ total: sum(voucherEntries.amount) })
          .from(voucherEntries)
          .innerJoin(vouchers, eq(voucherEntries.voucherId, vouchers.id))
          .where(
            and(
              eq(voucherEntries.ledgerId, ledger.id),
              eq(vouchers.companyId, companyId),
              dateParam ? lte(vouchers.date, dateParam) : undefined,
              eq(voucherEntries.type, "dr")
            )
          );

        // Credit sum
        const creditResult = await db
          .select({ total: sum(voucherEntries.amount) })
          .from(voucherEntries)
          .innerJoin(vouchers, eq(voucherEntries.voucherId, vouchers.id))
          .where(
            and(
              eq(voucherEntries.ledgerId, ledger.id),
              eq(vouchers.companyId, companyId),
              dateParam ? lte(vouchers.date, dateParam) : undefined,
              eq(voucherEntries.type, "cr")
            )
          );

        const debitTotal = Number(debitResult[0]?.total ?? 0);
        const creditTotal = Number(creditResult[0]?.total ?? 0);
        let closingBalance;

        if (ledger.balanceType === "dr") {
          // Normal balance is debit: Opening + Debit - Credit
          closingBalance = Number(ledger.openingBalance) + debitTotal - creditTotal;
        } else {
          // Normal balance is credit: Opening + Credit - Debit
          closingBalance = Number(ledger.openingBalance) + creditTotal - debitTotal;
        }

        return {
          LedgerID: ledger.id,
          LedgerName: ledger.name,
          Group: ledger.group,
          OpeningBalance: Number(ledger.openingBalance),
          DebitTotal: debitTotal,
          CreditTotal: creditTotal,
          ClosingBalance: closingBalance,
        };
      })
    );

    // Prepare Excel data
    const ws_data: any[][] = [
      [
        "Ledger ID",
        "Ledger Name",
        "Group",
        "Opening Balance",
        "Debit Total",
        "Credit Total",
        "Closing Balance"
      ]
    ];

    trialBalanceData.forEach(row => {
      ws_data.push([
        row.LedgerID,
        row.LedgerName,
        row.Group,
        formatCurrency(row.OpeningBalance),
        formatCurrency(row.DebitTotal),
        formatCurrency(row.CreditTotal),
        formatCurrency(row.ClosingBalance)
      ]);
    });

    // Add totals row
    const totals = trialBalanceData.reduce((acc, row) => ({
      OpeningBalance: acc.OpeningBalance + row.OpeningBalance,
      DebitTotal: acc.DebitTotal + row.DebitTotal,
      CreditTotal: acc.CreditTotal + row.CreditTotal,
      ClosingBalance: acc.ClosingBalance + row.ClosingBalance
    }), {
      OpeningBalance: 0,
      DebitTotal: 0,
      CreditTotal: 0,
      ClosingBalance: 0
    });

    ws_data.push([
      "TOTAL",
      "",
      "",
      formatCurrency(totals.OpeningBalance),
      formatCurrency(totals.DebitTotal),
      formatCurrency(totals.CreditTotal),
      formatCurrency(totals.ClosingBalance)
    ]);

    // Create worksheet and workbook
    const ws: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(ws_data);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Trial Balance");

    // Generate Excel file
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const excelBlob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

    return excelBlob;
  } catch (error) {
    console.error("Error exporting Trial Balance to Excel:", error);
    throw error;
  }
}

/**
 * Export Ledger Statement to Excel format
 */
export async function exportLedgerStatementToExcel(
  ledgerId: string,
  companyId: string = "company_1",
  fromDate?: number,
  toDate?: number
): Promise<Blob> {
  try {
    // Fetch ledger details
    const ledgerResult = await db
      .select({
        id: ledgers.id,
        name: ledgers.name,
        group: ledgers.group,
        openingBalance: ledgers.openingBalance,
        balanceType: ledgers.balanceType,
      })
      .from(ledgers)
      .where(
        and(
          eq(ledgers.id, ledgerId),
          eq(ledgers.companyId, companyId)
        )
      )
      .limit(1);

    if (!ledgerResult[0]) {
      throw new Error(`Ledger ${ledgerId} not found`);
    }

    const ledger = ledgerResult[0];

    // Fetch voucher entries for this ledger
    const entries = await db
      .select({
        voucherDate: vouchers.date,
        voucherNumber: vouchers.number,
        voucherType: vouchers.type,
        entryType: voucherEntries.type,
        amount: voucherEntries.amount,
        narration: sql<string>`COALESCE(${voucherEntries.narration}, ${vouchers.narration})`,
      })
      .from(voucherEntries)
      .innerJoin(vouchers, eq(voucherEntries.voucherId, vouchers.id))
      .where(
        and(
          eq(voucherEntries.ledgerId, ledgerId),
          eq(vouchers.companyId, companyId),
          fromDate ? gte(vouchers.date, fromDate) : undefined,
          toDate ? lte(vouchers.date, toDate) : undefined
        )
      )
      .orderBy(vouchers.date, vouchers.id, voucherEntries.id);

    // Calculate running balance
    let runningBalance = Number(ledger.openingBalance);
    const entriesWithBalance = entries.map(entry => {
      const amount = Number(entry.amount);
      const isDr = entry.entryType === "dr";
      const isCr = entry.entryType === "cr";

      if (ledger.balanceType === "dr") {
        runningBalance += isDr ? amount : -amount;
      } else {
        runningBalance += isCr ? amount : -amount;
      }

      return {
        ...entry,
        amount,
        isDr,
        isCr,
        runningBalance
      };
    });

    // Prepare Excel data
    const ws_data: any[][] = [
      [
        "Date",
        "Voucher No",
        "Voucher Type",
        "Entry Type",
        "Amount",
        "Narration",
        "Balance"
      ]
    ];

    entriesWithBalance.forEach(row => {
      ws_data.push([
        formatDate(Number(row.voucherDate)),
        row.voucherNumber || "-",
        row.voucherType,
        row.entryType.toUpperCase(),
        formatCurrency(row.amount),
        row.narration || "-",
        formatCurrency(row.runningBalance)
      ]);
    });

    // Add opening and closing balance rows
    ws_data.unshift([
      "Opening Balance",
      "",
      "",
      "",
      "",
      "",
      formatCurrency(Number(ledger.openingBalance))
    ]);

    ws_data.push([
      "Closing Balance",
      "",
      "",
      "",
      "",
      "",
      formatCurrency(entriesWithBalance.length > 0
        ? entriesWithBalance[entriesWithBalance.length - 1]?.runningBalance ?? 0
        : Number(ledger.openingBalance))
    ]);

    // Create worksheet and workbook
    const ws: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(ws_data);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Ledger Statement");

    // Generate Excel file
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const excelBlob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

    return excelBlob;
  } catch (error) {
    console.error("Error exporting Ledger Statement to Excel:", error);
    throw error;
  }
}

/**
 * Export Vouchers to Excel format
 */
export async function exportVouchersToExcel(
  companyId: string = "company_1",
  fromDate?: number,
  toDate?: number
): Promise<Blob> {
  try {
    // Fetch vouchers with entries
    const voucherResult = await db
      .select({
        voucherDate: vouchers.date,
        voucherNumber: vouchers.number,
        voucherType: vouchers.type,
        voucherNarration: vouchers.narration,
        entryType: voucherEntries.type,
        ledgerName: ledgers.name,
        amount: voucherEntries.amount,
        entryNarration: voucherEntries.narration,
      })
      .from(voucherEntries)
      .innerJoin(vouchers, eq(voucherEntries.voucherId, vouchers.id))
      .innerJoin(ledgers, eq(voucherEntries.ledgerId, ledgers.id))
      .where(
        and(
          eq(vouchers.companyId, companyId),
          fromDate ? gte(vouchers.date, fromDate) : undefined,
          toDate ? lte(vouchers.date, toDate) : undefined
        )
      )
      .orderBy(vouchers.date, vouchers.id, voucherEntries.id);

    // Prepare Excel data
    const ws_data: any[][] = [
      [
        "Date",
        "Voucher No",
        "Voucher Type",
        "Ledger",
        "Entry Type",
        "Amount",
        "Narration"
      ]
    ];

    voucherResult.forEach(row => {
      ws_data.push([
        formatDate(Number(row.voucherDate)),
        row.voucherNumber || "-",
        row.voucherType,
        row.ledgerName,
        row.entryType.toUpperCase(),
        formatCurrency(Number(row.amount)),
        (row.entryNarration || row.voucherNarration || "-")
      ]);
    });

    // Create worksheet and workbook
    const ws: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(ws_data);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Vouchers");

    // Generate Excel file
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const excelBlob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

    return excelBlob;
  } catch (error) {
    console.error("Error exporting Vouchers to Excel:", error);
    throw error;
  }
}