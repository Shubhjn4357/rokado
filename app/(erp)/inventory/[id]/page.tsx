import { db, inventoryItems } from "@/lib/database";
import { and, eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import InventoryItemDetailClient from "./client";

export const dynamic = "force-dynamic";

export const generateMetadata = async ({ params }: { params: { id: string } }) => {
  const session = await getSession();
  const companyId = session?.companyId ?? "company_1";

  const item = await db
    .select()
    .from(inventoryItems)
    .where(and(eq(inventoryItems.id, params.id), eq(inventoryItems.companyId, companyId)))
    .limit(1);

  if (!item.length) {
    return { title: "Item Not Found - Shree SERP ERP" };
  }

  const i = item[0] as typeof item[0];
  if (!i) return { title: "Item Not Found - ERP" };

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
  const session = await getSession();
  if (!session || !session.companyId) {
    redirect("/login");
  }
  const companyId = session.companyId;

  const [item] = await db
    .select()
    .from(inventoryItems)
    .where(and(eq(inventoryItems.id, params.id), eq(inventoryItems.companyId, companyId)))
    .limit(1);

  if (!item) {
    notFound();
  }

  return <InventoryItemDetailClient item={item} />;
}
