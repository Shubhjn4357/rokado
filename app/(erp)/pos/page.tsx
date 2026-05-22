import { Suspense } from "react";
import { POSBillingClient } from "@/components/pos/billing-client";
import { db, inventoryItems } from "@/lib/database";
import { FormSkeleton } from "@/components/ui/skeletons";

export const metadata = {
  title: "POS Billing - Shree Saree House ERP",
};

export const dynamic = "force-dynamic";

async function getPOSData() {
  return await db.select().from(inventoryItems).limit(100);
}

async function POSContent() {
  const inventory = await getPOSData();
  return (
    <div className="h-[calc(100vh-7rem)]">
      <POSBillingClient initialInventory={inventory} />
    </div>
  );
}

export default function POSPage() {
  return (
    <Suspense
      fallback={
        <div className="h-[calc(100vh-7rem)] max-w-5xl mx-auto py-4">
          <FormSkeleton />
        </div>
      }
    >
      <POSContent />
    </Suspense>
  );
}
