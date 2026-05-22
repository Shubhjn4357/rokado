import { Suspense } from "react";
import { db, ledgers } from "@/lib/database";
import { LedgerListClient } from "@/components/ledgers/ledger-list-client";
import { TableSkeleton } from "@/components/ui/skeletons";

export const dynamic = "force-dynamic";
export const metadata = { title: "Ledgers - Shree Saree House ERP" };

async function getLedgersData() {
  return await db
    .select()
    .from(ledgers)
    .orderBy(ledgers.group, ledgers.name);
}

async function LedgersContent() {
  const allLedgers = await getLedgersData();
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Ledgers</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {allLedgers.length} ledgers · FY 2026–27
          </p>
        </div>
      </div>
      <LedgerListClient ledgers={allLedgers} />
    </div>
  );
}

export default function LedgersPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Ledgers</h1>
              <p className="text-muted-foreground text-sm mt-1">Scanning master records...</p>
            </div>
          </div>
          <TableSkeleton headers={["Ledger Name", "Accounting Group", "Contact Number", "Opening Balance (₹)", "Status"]} />
        </div>
      }
    >
      <LedgersContent />
    </Suspense>
  );
}
