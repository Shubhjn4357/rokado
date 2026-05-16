import { db, ledgers } from "@repo/database";
import { LedgerListClient } from "@/components/ledgers/ledger-list-client";

export const dynamic = "force-dynamic";
export const metadata = { title: "Ledgers - Shree Saree House ERP" };

export default async function LedgersPage() {
  const allLedgers = await db
    .select()
    .from(ledgers)
    .orderBy(ledgers.group, ledgers.name);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Ledgers</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {allLedgers.length} ledgers · FY 2025–26
          </p>
        </div>
      </div>
      <LedgerListClient ledgers={allLedgers} />
    </div>
  );
}
