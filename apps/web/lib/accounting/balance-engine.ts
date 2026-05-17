"use server";

import { db, and, eq, sql } from "@repo/database";
import { ledgers, ledgerBalances, vouchers, voucherEntries } from "@repo/database";

/**
 * Get fiscal year (April-March) and month from Unix timestamp
 */
function getFiscalYearAndMonth(dateUnixMs: number): { fiscalYear: string; month: number } {
  const date = new Date(dateUnixMs);
  const year = date.getFullYear();
  const month = date.getMonth() + 1; // 1-12

  // Fiscal year starts April 1
  let fiscalYearStartYear = year;
  if (month < 4) {
    fiscalYearStartYear = year - 1;
  }
  const fiscalYear = `${fiscalYearStartYear}-${(fiscalYearStartYear + 1).toString().slice(-2)}`;
  return { fiscalYear, month };
}

/**
 * Update ledger balances after a voucher is posted
 * Called within the same transaction as voucher creation
 */
export async function updateLedgerBalancesForVoucher(
  tx: any,
  voucherDate: number, // Unix ms timestamp
  ledgerEffects: Array<{ ledgerId: string; debit: number; credit: number }>
) {
  try {
    // Aggregate effects by ledger
    const effectsByLedger = new Map<string, { debit: number; credit: number }>();
    for (const effect of ledgerEffects) {
      const current = effectsByLedger.get(effect.ledgerId) || { debit: 0, credit: 0 };
      effectsByLedger.set(effect.ledgerId, {
        debit: current.debit + effect.debit,
        credit: current.credit + effect.credit
      });
    }

    // Get fiscal year and month from voucher date
    const { fiscalYear, month } = getFiscalYearAndMonth(voucherDate);

    // Process each ledger
    for (const [ledgerId, { debit: voucherDebit, credit: voucherCredit }] of effectsByLedger) {
      // Get ledger opening balance
      const ledger = await tx.query.ledgers.findFirst({
        where: eq(ledgers.id, ledgerId),
        columns: { openingBalance: true }
      });

      if (!ledger) {
        console.warn(`Ledger not found: ${ledgerId}`);
        continue;
      }

      const openingBalance = ledger.openingBalance ?? 0;

      // Check if balance record exists for this ledger/fiscalYear/month
      const existingBalance = await tx.query.ledgerBalances.findFirst({
        where: and(
          eq(ledgerBalances.ledgerId, ledgerId),
          eq(ledgerBalances.fiscalYear, fiscalYear),
          eq(ledgerBalances.month, month)
        )
      });

      if (existingBalance) {
        // Update existing record
        await tx.update(ledgerBalances)
          .set({
            debit: sql`${ledgerBalances.debit} + ${voucherDebit}`,
            credit: sql`${ledgerBalances.credit} + ${voucherCredit}`,
            closing: sql`${ledgerBalances.closing} + ${voucherDebit} - ${voucherCredit}`
          })
          .where(and(
            eq(ledgerBalances.ledgerId, ledgerId),
            eq(ledgerBalances.fiscalYear, fiscalYear),
            eq(ledgerBalances.month, month)
          ));
      } else {
        // Create new record
        const closingBalance = openingBalance + voucherDebit - voucherCredit;
        await tx.insert(ledgerBalances).values({
          id: sql`randomuuid()`,
          ledgerId,
          fiscalYear,
          month,
          debit: voucherDebit,
          credit: voucherCredit,
          closing: closingBalance
        });
      }
    }
  } catch (error) {
    console.error("Error updating ledger balances:", error);
    throw error;
  }
}