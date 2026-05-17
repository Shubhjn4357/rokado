import { db, inventoryItems } from "@/lib/database";
import { and, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import InventoryItemDetailClient from "./client";

export const dynamic = "force-dynamic";

export const generateMetadata = async ({ params }: { params: { id: string } }) => {
  const item = await db
    .select()
    .from(inventoryItems)
    .where(and(eq(inventoryItems.id, params.id), eq(inventoryItems.companyId, "company_1")))
    .limit(1);

  if (!item.length) {
    return { title: "Item Not Found - Shree Saree House ERP" };
  }

  const i = item[0] as typeof item[0];
  if (!i) return { title: "Item Not Found - Shree Saree House ERP" };

  return {
    title: `${i.name} - Inventory Detail`,
    description: `${i.category} • Stock: ${i.stockQuantity} ${i.unit}`,
  };
};

export default async function InventoryItemDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const [item] = await db
    .select()
    .from(inventoryItems)
    .where(and(eq(inventoryItems.id, params.id), eq(inventoryItems.companyId, "company_1")))
    .limit(1);

  if (!item) {
    notFound();
  }

  return <InventoryItemDetailClient item={item} />;
}
