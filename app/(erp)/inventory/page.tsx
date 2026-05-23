import { Suspense } from "react";
import { db, inventoryItems, desc, eq } from "@/lib/database";
import { InventoryClient } from "@/components/inventory/inventory-client";
import { TableSkeleton } from "@/components/ui/skeletons";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const metadata = { title: "Inventory -  ERP" };

async function getInventoryData() {
  const session = await getSession();
  if (!session || !session.companyId) return [];
  return await db
    .select()
    .from(inventoryItems)
    .where(eq(inventoryItems.companyId, session.companyId))
    .orderBy(desc(inventoryItems.stockQuantity));
}

async function InventoryContent() {
  const items = await getInventoryData();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Inventory</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {items.length} items · {items.reduce((s, i) => s + i.stockQuantity, 0).toFixed(0)} total units
        </p>
      </div>
      <InventoryClient items={items} />
    </div>
  );
}

export default function InventoryPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Inventory</h1>
            <p className="text-muted-foreground text-sm mt-1">Calculating stock metrics...</p>
          </div>
          <TableSkeleton headers={["Item Code", " Category", "Rack Location", "Stock Level", "Actions"]} />
        </div>
      }
    >
      <InventoryContent />
    </Suspense>
  );
}
