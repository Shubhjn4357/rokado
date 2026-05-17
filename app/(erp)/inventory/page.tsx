import { db, inventoryItems, desc } from "@/lib/database";
import { InventoryClient } from "@/components/inventory/inventory-client";

export const dynamic = "force-dynamic";
export const metadata = { title: "Inventory - Shree Saree House ERP" };

export default async function InventoryPage() {
  const items = await db
    .select()
    .from(inventoryItems)
    .orderBy(desc(inventoryItems.stockQuantity));

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
