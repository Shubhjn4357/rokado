"use server";

import { db, ledgers, vouchers, inventoryItems } from "@/lib/database";

export async function getCommandPaletteOptions() {
  // Fetch ledgers
  const ledgerData = await db.select({
    id: ledgers.id,
    name: ledgers.name,
    group: ledgers.group,
  }).from(ledgers);

  // Fetch vouchers
  const voucherData = await db.select({
    id: vouchers.id,
    type: vouchers.type,
    date: vouchers.date,
    amount: vouchers.totalAmount,
  }).from(vouchers);

  // Fetch inventory
  const inventoryData = await db.select({
    id: inventoryItems.id,
    name: inventoryItems.name,
    category: inventoryItems.category,
    stock: inventoryItems.stockQuantity,
  }).from(inventoryItems);

  return {
    ledgers: ledgerData,
    vouchers: voucherData,
    inventory: inventoryData,
  };
}
