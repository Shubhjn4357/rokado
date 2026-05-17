import { db, ledgers, vouchers, inventoryItems, eq, sum, count, and, gte } from "@/lib/database";
import { DashboardClient } from "@/components/dashboard/dashboard-client";
import { formatCurrency } from "@/lib/types";

export const dynamic = "force-dynamic";
export const metadata = { title: "Dashboard - Shree Saree House ERP" };

async function getDashboardData() {
  const now = Date.now();
  // Start of today
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  // Start of fiscal year (April 1)
  const fy = new Date();
  if (fy.getMonth() < 3) fy.setFullYear(fy.getFullYear() - 1);
  fy.setMonth(3, 1);
  fy.setHours(0, 0, 0, 0);

  const [
    totalDebtors,
    totalCreditors,
    cashBalance,
    bankBalance,
    todaySales,
    totalVouchers,
    lowStockItems,
  ] = await Promise.all([
    // Debtors total
    db
      .select({ total: sum(ledgers.openingBalance) })
      .from(ledgers)
      .where(eq(ledgers.group, "sundry_debtors")),

    // Creditors total
    db
      .select({ total: sum(ledgers.openingBalance) })
      .from(ledgers)
      .where(eq(ledgers.group, "sundry_creditors")),

    // Cash balance
    db
      .select({ total: sum(ledgers.openingBalance) })
      .from(ledgers)
      .where(eq(ledgers.group, "cash")),

    // Bank balance
    db
      .select({ total: sum(ledgers.openingBalance) })
      .from(ledgers)
      .where(eq(ledgers.group, "bank")),

    // Today's sales vouchers count
    db
      .select({ count: count() })
      .from(vouchers)
      .where(
        and(
          eq(vouchers.type, "sales"),
          gte(vouchers.date, todayStart.getTime())
        )
      ),

    // Total vouchers
    db.select({ count: count() }).from(vouchers),

    // Low stock items (below reorder level)
    db
      .select()
      .from(inventoryItems)
      .limit(5),
  ]);

  // All ledger balances for receivables/payables
  const allDebtorLedgers = await db
    .select({
      id: ledgers.id,
      name: ledgers.name,
      openingBalance: ledgers.openingBalance,
      phone: ledgers.phone,
    })
    .from(ledgers)
    .where(eq(ledgers.group, "sundry_debtors"))
    .limit(5);

  const allInventory = await db
    .select()
    .from(inventoryItems)
    .limit(20);

  const lowStock = allInventory.filter(
    (item) => item.stockQuantity <= (item.reorderLevel ?? 10)
  );

  return {
    debtorsTotal: Number(totalDebtors[0]?.total ?? 0),
    creditorsTotal: Number(totalCreditors[0]?.total ?? 0),
    cashBalance: Number(cashBalance[0]?.total ?? 0),
    bankBalance: Number(bankBalance[0]?.total ?? 0),
    todaySalesCount: todaySales[0]?.count ?? 0,
    totalVouchers: totalVouchers[0]?.count ?? 0,
    lowStockItems: lowStock,
    recentDebtors: allDebtorLedgers,
  };
}

export default async function DashboardPage() {
  const data = await getDashboardData();
  return <DashboardClient data={data} />;
}
