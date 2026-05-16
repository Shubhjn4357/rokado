import { POSBillingClient } from "@/components/pos/billing-client";
import { db, inventoryItems } from "@repo/database";

export const metadata = {
  title: "POS Billing - Shree Saree House ERP",
};

export const dynamic = "force-dynamic";

export default async function POSPage() {
  const inventory = await db.select().from(inventoryItems).limit(100);

  return (
    <div className="h-[calc(100vh-7rem)]">
      <POSBillingClient initialInventory={inventory} />
    </div>
  );
}
