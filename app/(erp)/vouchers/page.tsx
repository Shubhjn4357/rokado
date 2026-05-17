import { db, vouchers, ledgers, desc, eq } from "@/lib/database";
import { VouchersClient } from "@/components/vouchers/vouchers-client";

export const dynamic = "force-dynamic";
export const metadata = { title: "Vouchers - Shree Saree House ERP" };

export default async function VouchersPage() {
  const [allVouchers, allLedgers] = await Promise.all([
    db
      .select({
        id: vouchers.id,
        type: vouchers.type,
        number: vouchers.number,
        date: vouchers.date,
        narration: vouchers.narration,
        totalAmount: vouchers.totalAmount,
        grandTotal: vouchers.grandTotal,
        gstTotal: vouchers.gstTotal,
        status: vouchers.status,
        createdAt: vouchers.createdAt,
      })
      .from(vouchers)
      .orderBy(desc(vouchers.date))
      .limit(100),

    db
      .select({ id: ledgers.id, name: ledgers.name, group: ledgers.group })
      .from(ledgers)
      .where(eq(ledgers.isActive, true))
      .orderBy(ledgers.name),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Vouchers</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {allVouchers.length} entries · Double-entry accounting
        </p>
      </div>
      <VouchersClient vouchers={allVouchers} ledgers={allLedgers} />
    </div>
  );
}
