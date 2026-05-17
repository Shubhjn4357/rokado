"use server";

import {
  db,
  ledgers,
  voucherEntries,
  vouchers,
  inventoryItems,
  stockMovements,
  eq,
  sum,
  and,
  gte,
  lte,
  sql,
  lt,
  or
} from "@/lib/database";

// ─── TRIAL BALANCE ─────────────────────────────────────────────────────────────
export async function getTrialBalanceReportData(dateFrom?: string | null, dateTo?: string | null) {
  try {
    const companyId = "company_1";
    const dateFromParam = dateFrom ? new Date(dateFrom).getTime() : undefined;
    const dateToParam = dateTo ? new Date(dateTo).getTime() : undefined;

    const ledgersList = await db
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
          eq(ledgers.companyId as any, companyId),
          eq(ledgers.isActive as any, true)
        )
      )
      .orderBy(ledgers.name);

    const trialBalance = await Promise.all(
      ledgersList.map(async (ledger) => {
        const [debitResult, creditResult] = await Promise.all([
          db
            .select({ total: sum(voucherEntries.amount) })
            .from(voucherEntries)
            .innerJoin(vouchers, eq(voucherEntries.voucherId as any, vouchers.id as any))
            .where(
              and(
                eq(voucherEntries.ledgerId as any, ledger.id),
                eq(vouchers.companyId as any, companyId),
                eq(vouchers.status as any, "posted"),
                dateFromParam ? gte(vouchers.date as any, dateFromParam) : undefined,
                dateToParam ? lte(vouchers.date as any, dateToParam) : undefined,
                eq(voucherEntries.type as any, "dr")
              )
            ),
          db
            .select({ total: sum(voucherEntries.amount) })
            .from(voucherEntries)
            .innerJoin(vouchers, eq(voucherEntries.voucherId as any, vouchers.id as any))
            .where(
              and(
                eq(voucherEntries.ledgerId as any, ledger.id),
                eq(vouchers.companyId as any, companyId),
                eq(vouchers.status as any, "posted"),
                dateFromParam ? gte(vouchers.date as any, dateFromParam) : undefined,
                dateToParam ? lte(vouchers.date as any, dateToParam) : undefined,
                eq(voucherEntries.type as any, "cr")
              )
            )
        ]);

        const debitTotal = Number(debitResult[0]?.total ?? 0);
        const creditTotal = Number(creditResult[0]?.total ?? 0);

        let closingBalance = 0;
        let closingType: "dr" | "cr" = "dr";

        const opBal = Number(ledger.openingBalance);
        const opType = ledger.balanceType;

        if (opType === "dr") {
          const net = opBal + debitTotal - creditTotal;
          if (net >= 0) {
            closingBalance = net;
            closingType = "dr";
          } else {
            closingBalance = Math.abs(net);
            closingType = "cr";
          }
        } else {
          const net = opBal + creditTotal - debitTotal;
          if (net >= 0) {
            closingBalance = net;
            closingType = "cr";
          } else {
            closingBalance = Math.abs(net);
            closingType = "dr";
          }
        }

        return {
          ledgerId: ledger.id,
          name: ledger.name,
          group: ledger.group,
          openingBalance: opBal,
          openingType: opType,
          debit: debitTotal,
          credit: creditTotal,
          closingBalance,
          closingType,
        };
      })
    );

    return trialBalance;
  } catch (err) {
    console.error("Failed to fetch trial balance data:", err);
    return [];
  }
}

// ─── DAY BOOK ─────────────────────────────────────────────────────────────────
export async function getDayBookReportData(date?: string | null, cashBankOnly?: boolean) {
  try {
    const dateParam = date ? new Date(date).getTime() : undefined;
    if (!dateParam) {
      return { entries: [], openingBalance: 0 };
    }

    const cashBankLedgers = await db
      .select({ id: ledgers.id })
      .from(ledgers)
      .where(
        and(
          eq(ledgers.companyId as any, "company_1"),
          eq(ledgers.isActive as any, true),
          sql`${ledgers.group} IN ('cash', 'bank')`
        )
      );

    const cashBankLedgerIds = cashBankLedgers.map(l => l.id);

    let openingBal = 0;
    if (cashBankLedgerIds.length > 0) {
      const openingBalanceResult = await db
        .select({
          total: sql<number>`
            COALESCE(SUM(
              CASE
                WHEN ${voucherEntries.type} = 'dr' THEN ${voucherEntries.amount}
                WHEN ${voucherEntries.type} = 'cr' THEN -${voucherEntries.amount}
                ELSE 0
              END
            ), 0)
          `
        })
        .from(voucherEntries)
        .innerJoin(vouchers, eq(voucherEntries.voucherId as any, vouchers.id as any))
        .innerJoin(ledgers, eq(voucherEntries.ledgerId as any, ledgers.id as any))
        .where(
          and(
            eq(vouchers.companyId as any, "company_1"),
            lt(vouchers.date as any, dateParam),
            eq(ledgers.isActive as any, true),
            sql`${ledgers.group} IN ('cash', 'bank')`
          )
        );

      const ledgerOpeningBalances = await db
        .select({
          openingBalance: ledgers.openingBalance,
        })
        .from(ledgers)
        .where(
          and(
            eq(ledgers.companyId as any, "company_1"),
            eq(ledgers.isActive as any, true),
            sql`${ledgers.group} IN ('cash', 'bank')`
          )
        );

      const ledgerOpeningSum = ledgerOpeningBalances.reduce((sum, ledger) => sum + Number(ledger.openingBalance), 0);
      const transactionSum = Number(openingBalanceResult[0]?.total ?? 0);
      openingBal = ledgerOpeningSum + transactionSum;
    }

    const results = await db
      .select({
        voucherId: vouchers.id,
        voucherNumber: vouchers.number,
        voucherType: vouchers.type,
        voucherDate: vouchers.date,
        ledgerId: ledgers.id,
        ledgerName: ledgers.name,
        ledgerGroup: ledgers.group,
        entryType: voucherEntries.type,
        amount: voucherEntries.amount,
        narration: sql<string>`COALESCE(${voucherEntries.narration}, ${vouchers.narration})`,
      })
      .from(voucherEntries)
      .innerJoin(vouchers, eq(voucherEntries.voucherId as any, vouchers.id as any))
      .innerJoin(ledgers, eq(voucherEntries.ledgerId as any, ledgers.id as any))
      .where(
        and(
          eq(vouchers.companyId as any, "company_1"),
          eq(vouchers.date as any, dateParam),
          eq(ledgers.isActive as any, true)
        )
      )
      .orderBy(vouchers.date, vouchers.id, voucherEntries.id as any);

    let runningBalance = openingBal;
    const processedEntries = results.map(entry => {
      const amount = Number(entry.amount);
      const isDr = entry.entryType === "dr";
      const isCr = entry.entryType === "cr";

      if (cashBankLedgerIds.includes(entry.ledgerId)) {
        runningBalance += isDr ? amount : -amount;
      }

      return {
        ...entry,
        amount,
        isDr,
        isCr,
        runningBalance: Number(runningBalance.toFixed(2)),
      };
    });

    const filteredEntries = cashBankOnly
      ? processedEntries.filter(entry => cashBankLedgerIds.includes(entry.ledgerId))
      : processedEntries;

    return { entries: filteredEntries, openingBalance: openingBal };
  } catch (err) {
    console.error("Failed to fetch day book data:", err);
    return { entries: [], openingBalance: 0 };
  }
}

// ─── GST REPORT ────────────────────────────────────────────────────────────────
export async function getGSTReportData(dateFrom?: string | null, dateTo?: string | null) {
  try {
    const fromDate = dateFrom ? new Date(dateFrom).getTime() : undefined;
    const toDate = dateTo ? new Date(dateTo).getTime() : undefined;

    const [outputGSTResult, inputGSTResult, journalGSTResult] = await Promise.all([
      db
        .select({ total: sum(vouchers.gstTotal) })
        .from(vouchers)
        .where(
          and(
            eq(vouchers.companyId as any, "company_1"),
            eq(vouchers.type, "sales"),
            fromDate ? gte(vouchers.date, fromDate) : undefined,
            toDate ? lte(vouchers.date, toDate) : undefined
          )
        ),
      db
        .select({ total: sum(vouchers.gstTotal) })
        .from(vouchers)
        .where(
          and(
            eq(vouchers.companyId as any, "company_1"),
            eq(vouchers.type, "purchase"),
            fromDate ? gte(vouchers.date, fromDate) : undefined,
            toDate ? lte(vouchers.date, toDate) : undefined
          )
        ),
      db
        .select({ total: sum(vouchers.gstTotal) })
        .from(vouchers)
        .where(
          and(
            eq(vouchers.companyId as any, "company_1"),
            eq(vouchers.type as any, "journal"),
            fromDate ? gte(vouchers.date, fromDate) : undefined,
            toDate ? lte(vouchers.date, toDate) : undefined
          )
        )
    ]);

    const outputGST = Number(outputGSTResult[0]?.total ?? 0);
    const inputGST = Number(inputGSTResult[0]?.total ?? 0);
    const journalGST = Number(journalGSTResult[0]?.total ?? 0);
    const netGST = outputGST - inputGST + journalGST;

    return {
      outputGST,
      inputGST,
      journalGST,
      netGST,
    };
  } catch (err) {
    console.error("Failed to fetch GST report data:", err);
    return { outputGST: 0, inputGST: 0, journalGST: 0, netGST: 0 };
  }
}

// ─── PROFIT & LOSS ─────────────────────────────────────────────────────────────
export async function getPLReportData(
  dateFrom?: string | null,
  dateTo?: string | null,
  prevDateFrom?: string | null,
  prevDateTo?: string | null
) {
  try {
    const fromDate = dateFrom ? new Date(dateFrom).getTime() : undefined;
    const toDate = dateTo ? new Date(dateTo).getTime() : undefined;
    const prevFromDate = prevDateFrom ? new Date(prevDateFrom).getTime() : undefined;
    const prevToDate = prevDateTo ? new Date(prevDateTo).getTime() : undefined;

    const [salesLedger] = await db
      .select()
      .from(ledgers)
      .where(and(eq(ledgers.group as any, "sales"), eq(ledgers.companyId as any, "company_1")))
      .limit(1);

    const [purchaseLedger] = await db
      .select()
      .from(ledgers)
      .where(and(eq(ledgers.group as any, "purchase"), eq(ledgers.companyId as any, "company_1")))
      .limit(1);

    const expenseLedgers = await db
      .select({ id: ledgers.id, name: ledgers.name })
      .from(ledgers)
      .where(and(eq(ledgers.group as any, "expenses"), eq(ledgers.companyId as any, "company_1")))
      .orderBy(ledgers.name);

    const otherIncomeLedgers = await db
      .select({ id: ledgers.id, name: ledgers.name })
      .from(ledgers)
      .where(
        and(
          or(eq(ledgers.group as any, "other_income"), eq(ledgers.group as any, "interest_income")),
          eq(ledgers.companyId as any, "company_1")
        )
      )
      .orderBy(ledgers.name);

    const [salesResult, purchaseResult, expenseResults, otherIncomeResults] = await Promise.all([
      db
        .select({ total: sum(voucherEntries.amount) })
        .from(voucherEntries)
        .innerJoin(vouchers, eq(voucherEntries.voucherId as any, vouchers.id as any))
        .where(
          and(
            eq(voucherEntries.ledgerId as any, salesLedger?.id ?? ""),
            eq(vouchers.companyId as any, "company_1"),
            eq(voucherEntries.type as any, "cr"),
            fromDate ? gte(vouchers.date as any, fromDate) : undefined,
            toDate ? lte(vouchers.date as any, toDate) : undefined
          )
        ),
      db
        .select({ total: sum(voucherEntries.amount) })
        .from(voucherEntries)
        .innerJoin(vouchers, eq(voucherEntries.voucherId as any, vouchers.id as any))
        .where(
          and(
            eq(voucherEntries.ledgerId as any, purchaseLedger?.id ?? ""),
            eq(vouchers.companyId as any, "company_1"),
            eq(voucherEntries.type as any, "dr"),
            fromDate ? gte(vouchers.date as any, fromDate) : undefined,
            toDate ? lte(vouchers.date as any, toDate) : undefined
          )
        ),
      ...expenseLedgers.map(ledger =>
        db
          .select({ total: sum(voucherEntries.amount) })
          .from(voucherEntries)
          .innerJoin(vouchers, eq(voucherEntries.voucherId as any, vouchers.id as any))
          .where(
            and(
              eq(voucherEntries.ledgerId as any, ledger.id),
              eq(vouchers.companyId as any, "company_1"),
              eq(voucherEntries.type as any, "dr"),
              fromDate ? gte(vouchers.date as any, fromDate) : undefined,
              toDate ? lte(vouchers.date as any, toDate) : undefined
            )
          )
      ),
      ...otherIncomeLedgers.map(ledger =>
        db
          .select({ total: sum(voucherEntries.amount) })
          .from(voucherEntries)
          .innerJoin(vouchers, eq(voucherEntries.voucherId as any, vouchers.id as any))
          .where(
            and(
              eq(voucherEntries.ledgerId as any, ledger.id),
              eq(vouchers.companyId as any, "company_1"),
              eq(voucherEntries.type as any, "cr"),
              fromDate ? gte(vouchers.date as any, fromDate) : undefined,
              toDate ? lte(vouchers.date as any, toDate) : undefined
            )
          )
      )
    ]);

    const salesTotal = Number(salesResult[0]?.total ?? 0);
    const purchaseTotal = Number(purchaseResult[0]?.total ?? 0);
    const expenseTotals = expenseResults.map((result: any, index: number) => ({
      ledger: expenseLedgers[index],
      amount: Number(result[0]?.total ?? 0)
    }));
    const otherIncomeTotal = otherIncomeResults.reduce((sum: number, result: any) => {
      return sum + Number(result[0]?.total ?? 0);
    }, 0);

    const totalExpenses = expenseTotals.reduce((sum: number, item: any) => sum + item.amount, 0);
    const grossProfit = salesTotal - purchaseTotal;
    const netProfit = grossProfit - totalExpenses + otherIncomeTotal;

    // Previous year period
    const [prevSalesResult, prevPurchaseResult, prevExpenseResults, prevOtherIncomeResults] = await Promise.all([
      db
        .select({ total: sum(voucherEntries.amount) })
        .from(voucherEntries)
        .innerJoin(vouchers, eq(voucherEntries.voucherId as any, vouchers.id as any))
        .where(
          and(
            eq(voucherEntries.ledgerId as any, salesLedger?.id ?? ""),
            eq(vouchers.companyId as any, "company_1"),
            eq(voucherEntries.type as any, "cr"),
            prevFromDate ? gte(vouchers.date as any, prevFromDate) : undefined,
            prevToDate ? lte(vouchers.date as any, prevToDate) : undefined
          )
        ),
      db
        .select({ total: sum(voucherEntries.amount) })
        .from(voucherEntries)
        .innerJoin(vouchers, eq(voucherEntries.voucherId as any, vouchers.id as any))
        .where(
          and(
            eq(voucherEntries.ledgerId as any, purchaseLedger?.id ?? ""),
            eq(vouchers.companyId as any, "company_1"),
            eq(voucherEntries.type as any, "dr"),
            prevFromDate ? gte(vouchers.date as any, prevFromDate) : undefined,
            prevToDate ? lte(vouchers.date as any, prevToDate) : undefined
          )
        ),
      ...expenseLedgers.map(ledger =>
        db
          .select({ total: sum(voucherEntries.amount) })
          .from(voucherEntries)
          .innerJoin(vouchers, eq(voucherEntries.voucherId as any, vouchers.id as any))
          .where(
            and(
              eq(voucherEntries.ledgerId as any, ledger.id),
              eq(vouchers.companyId as any, "company_1"),
              eq(voucherEntries.type as any, "dr"),
              prevFromDate ? gte(vouchers.date as any, prevFromDate) : undefined,
              prevToDate ? lte(vouchers.date as any, prevToDate) : undefined
            )
          )
      ),
      ...otherIncomeLedgers.map(ledger =>
        db
          .select({ total: sum(voucherEntries.amount) })
          .from(voucherEntries)
          .innerJoin(vouchers, eq(voucherEntries.voucherId as any, vouchers.id as any))
          .where(
            and(
              eq(voucherEntries.ledgerId as any, ledger.id),
              eq(vouchers.companyId as any, "company_1"),
              eq(voucherEntries.type as any, "cr"),
              prevFromDate ? gte(vouchers.date as any, prevFromDate) : undefined,
              prevToDate ? lte(vouchers.date as any, prevToDate) : undefined
            )
          )
      )
    ]);

    const prevSalesTotal = Number(prevSalesResult[0]?.total ?? 0);
    const prevPurchaseTotal = Number(prevPurchaseResult[0]?.total ?? 0);
    const prevExpenseTotals = prevExpenseResults.map((result: any, index: number) => ({
      ledger: expenseLedgers[index],
      amount: Number(result[0]?.total ?? 0)
    }));
    const prevOtherIncomeTotal = prevOtherIncomeResults.reduce((sum: number, result: any) => {
      return sum + Number(result[0]?.total ?? 0);
    }, 0);

    const prevTotalExpenses = prevExpenseTotals.reduce((sum: number, item: any) => sum + item.amount, 0);
    const prevGrossProfit = prevSalesTotal - prevPurchaseTotal;
    const prevNetProfit = prevGrossProfit - prevTotalExpenses + prevOtherIncomeTotal;

    return {
      salesTotal,
      purchaseTotal,
      expenseTotals,
      otherIncomeTotal,
      totalExpenses,
      grossProfit,
      netProfit,
      prevSalesTotal,
      prevPurchaseTotal,
      prevExpenseTotals,
      prevOtherIncomeTotal,
      prevTotalExpenses,
      prevGrossProfit,
      prevNetProfit,
    };
  } catch (err) {
    console.error("Failed to fetch P&L report data:", err);
    return {};
  }
}

// ─── BALANCE SHEET ─────────────────────────────────────────────────────────────
export async function getBalanceSheetReportData(date?: string | null) {
  try {
    const dateParam = date ? new Date(date).getTime() : undefined;

    const allLedgers = await db
      .select({
        id: ledgers.id,
        name: ledgers.name,
        group: ledgers.group,
        openingBalance: ledgers.openingBalance,
        balanceType: ledgers.balanceType,
      })
      .from(ledgers)
      .where(eq(ledgers.companyId as any, "company_1"))
      .orderBy(ledgers.name);

    const ledgerBalancesList = await Promise.all(
      allLedgers.map(async (ledger) => {
        const [debitResult, creditResult] = await Promise.all([
          db
            .select({ total: sum(voucherEntries.amount) })
            .from(voucherEntries)
            .innerJoin(vouchers, eq(voucherEntries.voucherId as any, vouchers.id as any))
            .where(
              and(
                eq(voucherEntries.ledgerId as any, ledger.id),
                eq(vouchers.companyId as any, "company_1"),
                dateParam ? lte(vouchers.date as any, dateParam) : undefined,
                eq(voucherEntries.type as any, "dr")
              )
            ),
          db
            .select({ total: sum(voucherEntries.amount) })
            .from(voucherEntries)
            .innerJoin(vouchers, eq(voucherEntries.voucherId as any, vouchers.id as any))
            .where(
              and(
                eq(voucherEntries.ledgerId as any, ledger.id),
                eq(vouchers.companyId as any, "company_1"),
                dateParam ? lte(vouchers.date as any, dateParam) : undefined,
                eq(voucherEntries.type as any, "cr")
              )
            )
        ]);

        const debitTotal = Number(debitResult[0]?.total ?? 0);
        const creditTotal = Number(creditResult[0]?.total ?? 0);
        let closingBalance;
        if (ledger.balanceType === "dr") {
          closingBalance = Number(ledger.openingBalance) + debitTotal - creditTotal;
        } else {
          closingBalance = Number(ledger.openingBalance) + creditTotal - debitTotal;
        }
        return {
          ledgerId: ledger.id,
          name: ledger.name,
          group: ledger.group,
          openingBalance: Number(ledger.openingBalance),
          debitTotal,
          creditTotal,
          closingBalance,
        };
      })
    );

    const groups: any = {
      capital: [],
      sundryCreditors: [],
      sundryDebtors: [],
      bank: [],
      cash: [],
      stock: [],
      fixedAssets: [],
      dutiesTaxes: [],
      expenses: [],
      sales: [],
      purchase: [],
      other: []
    };

    ledgerBalancesList.forEach(ledger => {
      switch (ledger.group) {
        case "capital":
          groups.capital.push(ledger);
          break;
        case "sundry_creditors":
          groups.sundryCreditors.push(ledger);
          break;
        case "sundry_debtors":
          groups.sundryDebtors.push(ledger);
          break;
        case "bank":
          groups.bank.push(ledger);
          break;
        case "cash":
          groups.cash.push(ledger);
          break;
        case "stock":
          groups.stock.push(ledger);
          break;
        case "fixed_assets":
          groups.fixedAssets.push(ledger);
          break;
        case "duties_taxes":
          groups.dutiesTaxes.push(ledger);
          break;
        case "expenses":
          groups.expenses.push(ledger);
          break;
        case "sales":
          groups.sales.push(ledger);
          break;
        case "purchase":
          groups.purchase.push(ledger);
          break;
        default:
          groups.other.push(ledger);
      }
    });

    const calculateGroupTotal = (groupArray: any[]) =>
      groupArray.reduce((sum, ledger) => sum + ledger.closingBalance, 0);

    return {
      groups,
      totals: {
        capital: calculateGroupTotal(groups.capital),
        sundryCreditors: calculateGroupTotal(groups.sundryCreditors),
        sundryDebtors: calculateGroupTotal(groups.sundryDebtors),
        bank: calculateGroupTotal(groups.bank),
        cash: calculateGroupTotal(groups.cash),
        stock: calculateGroupTotal(groups.stock),
        fixedAssets: calculateGroupTotal(groups.fixedAssets),
        dutiesTaxes: calculateGroupTotal(groups.dutiesTaxes),
        expenses: calculateGroupTotal(groups.expenses),
        sales: calculateGroupTotal(groups.sales),
        purchase: calculateGroupTotal(groups.purchase),
        other: calculateGroupTotal(groups.other)
      }
    };
  } catch (err) {
    console.error("Failed to calculate balance sheet data:", err);
    return null;
  }
}

// ─── STOCK SUMMARY ─────────────────────────────────────────────────────────────
export async function getStockReportData(date?: string | null) {
  try {
    const dateParam = date ? new Date(date).getTime() : undefined;

    const items = await db
      .select({
        id: inventoryItems.id,
        name: inventoryItems.name,
        category: inventoryItems.category,
        unit: inventoryItems.unit,
        openingStock: inventoryItems.stockQuantity,
      })
      .from(inventoryItems)
      .where(eq(inventoryItems.companyId as any, "company_1"))
      .orderBy(inventoryItems.name);

    const stockSummary = await Promise.all(
      items.map(async (item) => {
        let openingStock = 0;
        if (dateParam) {
          const openingResult = await db
            .select({
              total: sql<number>`
                COALESCE(SUM(
                  CASE
                    WHEN ${stockMovements.type} = 'in' THEN ${stockMovements.quantity}
                    WHEN ${stockMovements.type} = 'out' THEN -${stockMovements.quantity}
                    ELSE 0
                  END
                ), 0)
              `
            })
            .from(stockMovements)
            .innerJoin(vouchers, eq(stockMovements.voucherId as any, vouchers.id as any))
            .where(
              and(
                eq(stockMovements.itemId, item.id),
                eq(vouchers.companyId, "company_1"),
                lt(vouchers.date, dateParam)
              )
            );

          openingStock = Number(openingResult[0]?.total ?? 0);
        }

        const inwardResult = await db
          .select({ total: sum(stockMovements.quantity) })
          .from(stockMovements)
          .innerJoin(vouchers, eq(stockMovements.voucherId, vouchers.id))
          .where(
            and(
              eq(stockMovements.itemId, item.id),
              eq(vouchers.companyId, "company_1"),
              dateParam ? lte(vouchers.date, dateParam) : undefined,
              eq(stockMovements.type, "in")
            )
          );

        const outwardResult = await db
          .select({ total: sum(stockMovements.quantity) })
          .from(stockMovements)
          .innerJoin(vouchers, eq(stockMovements.voucherId, vouchers.id))
          .where(
            and(
              eq(stockMovements.itemId, item.id),
              eq(vouchers.companyId, "company_1"),
              dateParam ? lte(vouchers.date, dateParam) : undefined,
              eq(stockMovements.type, "out")
            )
          );

        const inwardTotal = Number(inwardResult[0]?.total ?? 0);
        const outwardTotal = Number(outwardResult[0]?.total ?? 0);
        const closingStock = openingStock + inwardTotal - outwardTotal;

        return {
          itemId: item.id,
          name: item.name,
          category: item.category,
          unit: item.unit,
          openingStock,
          inwardTotal,
          outwardTotal,
          closingStock,
        };
      })
    );

    return stockSummary;
  } catch (err) {
    console.error("Failed to fetch stock summary data:", err);
    return [];
  }
}

// ─── BANK RECONCILIATION ────────────────────────────────────────────────────────
export async function getBankLedgersOptions() {
  try {
    return await db
      .select({ id: ledgers.id, name: ledgers.name })
      .from(ledgers)
      .where(
        and(
          eq(ledgers.companyId as any, "company_1"),
          eq(ledgers.isActive as any, true),
          eq(ledgers.group as any, "bank")
        )
      )
      .orderBy(ledgers.name);
  } catch (err) {
    console.error("Failed to fetch bank ledgers:", err);
    return [];
  }
}

export async function getBankBalances(bankLedgerId: string) {
  try {
    const ledger = await db.query.ledgers.findFirst({
      where: eq(ledgers.id as any, bankLedgerId),
      columns: { openingBalance: true, balanceType: true }
    });

    const openingBalanceVal = ledger?.openingBalance ?? 0;
    const balanceType = ledger?.balanceType ?? 'dr';

    const entriesList = await db
      .select({
        amount: voucherEntries.amount,
        type: voucherEntries.type,
      })
      .from(voucherEntries)
      .innerJoin(vouchers, eq(voucherEntries.voucherId as any, vouchers.id as any))
      .where(and(
        eq(voucherEntries.ledgerId as any, bankLedgerId),
        eq(vouchers.companyId as any, "company_1")
      ));

    let totalDr = 0;
    let totalCr = 0;
    entriesList.forEach(e => {
      if (e.type === 'dr') totalDr += e.amount;
      else totalCr += e.amount;
    });

    let closingBalance;
    if (balanceType === 'dr') {
      closingBalance = openingBalanceVal + totalDr - totalCr;
    } else {
      closingBalance = openingBalanceVal + totalCr - totalDr;
    }

    return {
      openingBalance: openingBalanceVal,
      closingBalanceBooks: closingBalance
    };
  } catch (err) {
    console.error("Failed to calculate balances:", err);
    return { openingBalance: 0, closingBalanceBooks: 0 };
  }
}

export async function getBankReconciliationData(
  bankLedgerId: string,
  dateFrom?: string | null,
  dateTo?: string | null
) {
  try {
    const fromDate = dateFrom ? new Date(dateFrom).getTime() : undefined;
    const toDate = dateTo ? new Date(dateTo).getTime() : undefined;

    const entriesList = await db
      .select({
        id: voucherEntries.id,
        voucherId: voucherEntries.voucherId,
        date: vouchers.date,
        voucherNumber: vouchers.number,
        type: voucherEntries.type,
        amount: voucherEntries.amount,
        narration: voucherEntries.narration,
        voucherType: vouchers.type,
      })
      .from(voucherEntries)
      .innerJoin(vouchers, eq(voucherEntries.voucherId as any, vouchers.id as any))
      .where(and(
        eq(voucherEntries.ledgerId as any, bankLedgerId),
        eq(vouchers.companyId as any, "company_1"),
        fromDate ? gte(vouchers.date as any, fromDate) : undefined,
        toDate ? lte(vouchers.date as any, toDate) : undefined
      ))
      .orderBy(vouchers.date as any);

    return entriesList.map(entry => ({
      id: entry.id,
      date: entry.date,
      voucherNumber: entry.voucherNumber,
      type: entry.voucherType === 'payment' || entry.voucherType === 'receipt'
        ? (entry.type === 'dr' ? 'Payment' : 'Receipt')
        : entry.voucherType,
      amount: entry.amount,
      narration: entry.narration ?? '',
      matched: false,
      source: 'books' as const
    }));
  } catch (err) {
    console.error("Failed to fetch bank reconciliation data:", err);
    return [];
  }
}

// ─── OUTSTANDING REPORT ─────────────────────────────────────────────────────────
export async function getOutstandingReportData(date?: string | null) {
  try {
    const dateParam = date ? new Date(date).getTime() : undefined;

    const debtorLedgers = await db
      .select({
        id: ledgers.id,
        name: ledgers.name,
        group: ledgers.group,
        openingBalance: ledgers.openingBalance,
        balanceType: ledgers.balanceType,
        phone: ledgers.phone,
        creditLimit: ledgers.creditLimit,
      })
      .from(ledgers)
      .where(
        and(
          eq(ledgers.companyId as any, "company_1"),
          eq(ledgers.isActive as any, true),
          eq(ledgers.group as any, "sundry_debtors")
        )
      )
      .orderBy(ledgers.name);

    const creditorLedgers = await db
      .select({
        id: ledgers.id,
        name: ledgers.name,
        group: ledgers.group,
        openingBalance: ledgers.openingBalance,
        balanceType: ledgers.balanceType,
        phone: ledgers.phone,
        creditLimit: ledgers.creditLimit,
      })
      .from(ledgers)
      .where(
        and(
          eq(ledgers.companyId as any, "company_1"),
          eq(ledgers.isActive as any, true),
          eq(ledgers.group as any, "sundry_creditors")
        )
      )
      .orderBy(ledgers.name);

    const processLedgersList = async (ledgersList: any[]) => {
      return await Promise.all(
        ledgersList.map(async (ledger) => {
          const [debitResult, creditResult] = await Promise.all([
            db
              .select({ total: sum(voucherEntries.amount) })
              .from(voucherEntries)
              .innerJoin(vouchers, eq(voucherEntries.voucherId as any, vouchers.id as any))
              .where(
                and(
                  eq(voucherEntries.ledgerId, ledger.id),
                  eq(vouchers.companyId, "company_1"),
                  dateParam ? lte(vouchers.date, dateParam) : undefined,
                  eq(voucherEntries.type, "dr")
                )
              ),
            db
              .select({ total: sum(voucherEntries.amount) })
              .from(voucherEntries)
              .innerJoin(vouchers, eq(voucherEntries.voucherId as any, vouchers.id as any))
              .where(
                and(
                  eq(voucherEntries.ledgerId, ledger.id),
                  eq(vouchers.companyId, "company_1"),
                  dateParam ? lte(vouchers.date, dateParam) : undefined,
                  eq(voucherEntries.type, "cr")
                )
              )
          ]);

          const debitTotal = Number(debitResult[0]?.total ?? 0);
          const creditTotal = Number(creditResult[0]?.total ?? 0);
          let balance;
          if (ledger.balanceType === "dr") {
            balance = Number(ledger.openingBalance) + debitTotal - creditTotal;
          } else {
            balance = Number(ledger.openingBalance) + creditTotal - debitTotal;
          }
          return {
            ledgerId: ledger.id,
            name: ledger.name,
            group: ledger.group,
            openingBalance: Number(ledger.openingBalance),
            debitTotal,
            creditTotal,
            balance,
            overdueDays: 0,
            phone: ledger.phone,
            creditLimit: Number(ledger.creditLimit),
          };
        })
      );
    };

    const [debtorDetails, creditorDetails] = await Promise.all([
      processLedgersList(debtorLedgers),
      processLedgersList(creditorLedgers),
    ]);

    return { debtors: debtorDetails, creditors: creditorDetails };
  } catch (err) {
    console.error("Failed to fetch outstanding data:", err);
    return { debtors: [], creditors: [] };
  }
}

import * as fs from "fs";
import * as path from "path";

const SETTINGS_FILE_PATH = path.join(process.cwd(), "lib", "database", "settings.json");

function readJsonSettings() {
  try {
    if (fs.existsSync(SETTINGS_FILE_PATH)) {
      const data = fs.readFileSync(SETTINGS_FILE_PATH, "utf-8");
      return JSON.parse(data);
    }
  } catch (err) {
    console.error("Failed to read settings.json:", err);
  }
  return {};
}

function writeJsonSettings(settings: any) {
  try {
    const dir = path.dirname(SETTINGS_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const current = readJsonSettings();
    const updated = { ...current, ...settings };
    fs.writeFileSync(SETTINGS_FILE_PATH, JSON.stringify(updated, null, 2), "utf-8");
    return true;
  } catch (err) {
    console.error("Failed to write settings.json:", err);
    return false;
  }
}

export async function getDailyComparisonData(dateStr: string) {
  try {
    const selectedDate = new Date(dateStr);
    const startOfDay = new Date(selectedDate.setHours(0, 0, 0, 0)).getTime();
    const endOfDay = new Date(selectedDate.setHours(23, 59, 59, 999)).getTime();

    // Query vouchers for this date range
    const dayVouchers = await db
      .select({
        id: vouchers.id,
        type: vouchers.type,
        partyLedgerId: vouchers.partyLedgerId,
        grandTotal: vouchers.grandTotal,
      })
      .from(vouchers)
      .where(and(
        eq(vouchers.companyId as any, "company_1"),
        gte(vouchers.date as any, startOfDay),
        lte(vouchers.date as any, endOfDay)
      ));

    let cashSales = 0;
    let creditSales = 0;
    let moneyReceived = 0;
    let moneyPaid = 0;

    dayVouchers.forEach(v => {
      if (v.type === 'sales') {
        if (v.partyLedgerId === 'led_cash' || !v.partyLedgerId) {
          cashSales += v.grandTotal;
        } else {
          creditSales += v.grandTotal;
        }
      } else if (v.type === 'receipt') {
        moneyReceived += v.grandTotal;
      } else if (v.type === 'payment') {
        moneyPaid += v.grandTotal;
      }
    });

    // Load manual totals from settings
    const settings = readJsonSettings();
    const manualEntries = settings.dualBookEntries || {};
    const manual = manualEntries[dateStr] || {
      cashSales: 0,
      creditSales: 0,
      moneyReceived: 0,
      moneyPaid: 0,
      notes: "",
    };

    return {
      software: {
        cashSales,
        creditSales,
        moneyReceived,
        moneyPaid,
      },
      manual,
    };
  } catch (err) {
    console.error("Failed to get daily comparison data:", err);
    return {
      software: { cashSales: 0, creditSales: 0, moneyReceived: 0, moneyPaid: 0 },
      manual: { cashSales: 0, creditSales: 0, moneyReceived: 0, moneyPaid: 0, notes: "" },
    };
  }
}

export async function saveManualBookEntry(dateStr: string, manualData: {
  cashSales: number;
  creditSales: number;
  moneyReceived: number;
  moneyPaid: number;
  notes: string;
}) {
  try {
    const settings = readJsonSettings();
    const dualBookEntries = settings.dualBookEntries || {};
    dualBookEntries[dateStr] = manualData;
    writeJsonSettings({ dualBookEntries });
    return { success: true };
  } catch (err) {
    console.error("Failed to save manual book entry:", err);
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}
