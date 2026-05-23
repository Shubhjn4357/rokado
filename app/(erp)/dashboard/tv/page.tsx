import { Suspense } from "react";
import { db, ledgers, vouchers, voucherEntries, inventoryItems, eq, and, sum, count, gte, desc } from "@/lib/database";
import { TVClient } from "@/components/dashboard/tv-client";
import { TVSkeleton } from "@/components/ui/skeletons";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
export const metadata = { title: "Live TV Monitor - Rokado ERP" };

async function getTvDashboardData() {
  const session = await getSession();
  if (!session || !session.companyId) {
    redirect("/login");
  }
  const companyId = session.companyId;

  // Start of today timestamp
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayStartTime = todayStart.getTime();

  const [
    todaySalesQuery,
    todaySalesTotalQuery,
    activeChallansQuery,
    allItemsQuery,
    salesLinesQuery,
    dispatchesQuery,
  ] = await Promise.all([
    // Today's Sales Count
    db
      .select({ count: count() })
      .from(vouchers)
      .where(
        and(
          eq(vouchers.companyId, companyId),
          eq(vouchers.type, "sales"),
          eq(vouchers.status, "posted"),
          gte(vouchers.date, todayStartTime)
        )
      ),

    // Today's Sales Total
    db
      .select({ total: sum(vouchers.grandTotal) })
      .from(vouchers)
      .where(
        and(
          eq(vouchers.companyId, companyId),
          eq(vouchers.type, "sales"),
          eq(vouchers.status, "posted"),
          gte(vouchers.date, todayStartTime)
        )
      ),

    // Active Challans Count
    db
      .select({ count: count() })
      .from(vouchers)
      .where(
        and(
          eq(vouchers.companyId, companyId),
          eq(vouchers.type, "challan"),
          eq(vouchers.status, "posted")
        )
      ),

    // All Inventory Items
    db
      .select()
      .from(inventoryItems)
      .where(eq(inventoryItems.companyId, companyId)),

    // Sales Entries for category sales reporting
    db
      .select({
        amount: voucherEntries.amount,
        quantity: voucherEntries.quantity,
        category: inventoryItems.category,
      })
      .from(voucherEntries)
      .innerJoin(inventoryItems, eq(voucherEntries.inventoryItemId, inventoryItems.id))
      .innerJoin(vouchers, eq(voucherEntries.voucherId, vouchers.id))
      .where(
        and(
          eq(vouchers.companyId, companyId),
          eq(vouchers.type, "sales"),
          eq(vouchers.status, "posted"),
          eq(voucherEntries.type, "cr") // stock ledger posting lines are credit entries
        )
      ),

    // Active Dispatches (Challans) joined with party ledgers
    db
      .select({
        id: vouchers.id,
        number: vouchers.number,
        date: vouchers.date,
        grandTotal: vouchers.grandTotal,
        transportName: vouchers.transportName,
        lrNumber: vouchers.lrNumber,
        dispatchDate: vouchers.dispatchDate,
        partyName: ledgers.name,
      })
      .from(vouchers)
      .leftJoin(ledgers, eq(vouchers.partyLedgerId, ledgers.id))
      .where(
        and(
          eq(vouchers.companyId, companyId),
          eq(vouchers.type, "challan"),
          eq(vouchers.status, "posted")
        )
      )
      .orderBy(desc(vouchers.date))
      .limit(10),
  ]);

  // Process Category Sales aggregations
  const categorySalesMap: Record<string, { amount: number; quantity: number }> = {};
  for (const line of salesLinesQuery) {
    const category = line.category || "General";
    if (!categorySalesMap[category]) {
      categorySalesMap[category] = { amount: 0, quantity: 0 };
    }
    categorySalesMap[category].amount += line.amount;
    categorySalesMap[category].quantity += line.quantity || 0;
  }

  const categorySales = Object.entries(categorySalesMap).map(([category, stats]) => ({
    category,
    amount: stats.amount,
    quantity: stats.quantity,
  })).sort((a, b) => b.amount - a.amount);

  // Process critical low-stock items
  const criticalStock = allItemsQuery
    .filter((item) => item.stockQuantity <= (item.reorderLevel ?? 10))
    .map((item) => ({
      id: item.id,
      name: item.name,
      category: item.category,
      stockQuantity: item.stockQuantity,
      reorderLevel: item.reorderLevel,
      unit: item.unit,
      rackLocation: item.rackLocation,
    }));

  return {
    categorySales,
    criticalStock,
    dispatches: dispatchesQuery,
    todaySalesTotal: Number(todaySalesTotalQuery[0]?.total ?? 0),
    todaySalesCount: todaySalesQuery[0]?.count ?? 0,
    activeChallansCount: activeChallansQuery[0]?.count ?? 0,
  };
}

async function TVContent() {
  const data = await getTvDashboardData();
  return <TVClient data={data} />;
}

export default function ShowroomTVPage() {
  return (
    <Suspense fallback={<TVSkeleton />}>
      <TVContent />
    </Suspense>
  );
}
