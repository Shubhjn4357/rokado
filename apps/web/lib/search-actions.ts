"use server";

import { db } from "@/packages/database/src/db";
import { ledgers } from "@/packages/database/src/schema";
import { vouchers } from "@/packages/database/src/schema";
import { inventoryItems } from "@/packages/database/src/schema";

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
    amount: vouchers.amount,
  }).from(vouchers);

  // Fetch inventory
  const inventoryData = await db.select({
    id: inventoryItems.id,
    name: inventoryItems.name,
    category: inventoryItems.category,
    stock: inventoryItems.stock,
  }).from(inventoryItems);

  return {
    ledgers: ledgerData,
    vouchers: voucherData,
    inventory: inventoryData,
  };
}