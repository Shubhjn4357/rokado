"use server";

import { db, inventoryItems, stockMovements, vouchers, voucherEntries, auditLog } from "@/lib/database";
import { revalidatePath } from "next/cache";
import { randomUUID } from "crypto";
import { eq, and, sql, desc } from "drizzle-orm";
import type { InventoryItem, InventoryCategory } from "@/lib/types";

export interface CreateInventoryItemInput {
  name: string;
  category: InventoryCategory;
  designNo?: string;
  color?: string;
  purchaseRate: number;
  saleRate: number;
  gstPercent: number;
  rackLocation?: string;
  unit?: string;
  hsnCode?: string;
  barcode?: string;
  reorderLevel?: number;
  initialStock?: number;
}

export interface UpdateInventoryItemInput {
  id: string;
  name?: string;
  category?: InventoryCategory;
  designNo?: string;
  color?: string;
  purchaseRate?: number;
  saleRate?: number;
  gstPercent?: number;
  rackLocation?: string;
  unit?: string;
  hsnCode?: string;
  reorderLevel?: number;
}

export async function createInventoryItem(input: CreateInventoryItemInput): Promise<{ success: true; itemId: string } | { success: false; error: string }> {
  try {
    // Validate input
    if (!input.name || !input.category) {
      return { success: false, error: "Name and category are required" };
    }

    const itemId = randomUUID();

    await db.transaction(async (tx) => {
      // Insert inventory item
      await tx.insert(inventoryItems).values({
        id: itemId,
        companyId: "company_1",
        name: input.name,
        category: input.category,
        designNo: input.designNo ?? null,
        color: input.color ?? null,
        purchaseRate: input.purchaseRate,
        saleRate: input.saleRate,
        gstPercent: input.gstPercent,
        rackLocation: input.rackLocation ?? null,
        unit: input.unit ?? "pcs",
        hsnCode: input.hsnCode ?? null,
        barcode: input.barcode ?? null,
        reorderLevel: input.reorderLevel ?? 10,
        stockQuantity: input.initialStock ?? 0,
      } as any);

      // If initial stock provided, create stock movement
      if (input.initialStock && input.initialStock > 0) {
        await tx.insert(stockMovements).values({
          id: randomUUID(),
          itemId,
          voucherId: null, // Initial stock adjustment
          type: "adjustment",
          quantity: input.initialStock,
          rate: input.purchaseRate, // Use purchase rate for initial stock valuation
          date: Date.now(),
          narration: "Initial stock",
        } as any);
      }

      // Append audit log
      await tx.insert(auditLog).values({
        id: randomUUID(),
        entity: "inventory",
        entityId: itemId,
        action: "create",
        after: JSON.stringify({ name: input.name, category: input.category, stock: input.initialStock ?? 0 }),
        deviceId: "web",
      });
    });

    revalidatePath("/inventory");

    return { success: true, itemId };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error creating inventory item.";
    return { success: false, error: message };
  }
}

export async function updateInventoryItem(input: UpdateInventoryItemInput): Promise<{ success: true } | { success: false; error: string }> {
  try {
    if (!input.id) {
      return { success: false, error: "Item ID is required" };
    }

    await db.transaction(async (tx) => {
      // Update inventory item
      await tx.update(inventoryItems)
        .set({
          name: input.name,
          category: input.category,
          designNo: input.designNo ?? null,
          color: input.color ?? null,
          purchaseRate: input.purchaseRate,
          saleRate: input.saleRate,
          gstPercent: input.gstPercent,
          rackLocation: input.rackLocation ?? null,
          unit: input.unit,
          hsnCode: input.hsnCode ?? null,
          reorderLevel: input.reorderLevel,
          updatedAt: Date.now(),
        })
        .where(and(
          eq(inventoryItems.id as any, input.id),
          eq(inventoryItems.companyId as any, "company_1")
        ));

      // Append audit log
      await tx.insert(auditLog).values({
        id: randomUUID(),
        entity: "inventory",
        entityId: input.id,
        action: "update",
        after: JSON.stringify({
          name: input.name,
          category: input.category,
          purchaseRate: input.purchaseRate,
          saleRate: input.saleRate
        }),
        deviceId: "web",
      });
    });

    revalidatePath("/inventory");

    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error updating inventory item.";
    return { success: false, error: message };
  }
}

export async function deleteInventoryItem(itemId: string): Promise<{ success: true } | { success: false; error: string }> {
  try {
    await db.transaction(async (tx) => {
      // Check if item has stock movements
      const movements = await tx
        .select()
        .from(stockMovements)
        .where(eq(stockMovements.itemId as any, itemId))
        .limit(1);

      if (movements.length > 0) {
        throw new Error("Cannot delete item with stock movements. Consider setting stock to zero instead.");
      }

      // Delete inventory item
      await tx.delete(inventoryItems)
        .where(and(
          eq(inventoryItems.id as any, itemId),
          eq(inventoryItems.companyId as any, "company_1")
        ));

      // Append audit log
      await tx.insert(auditLog).values({
        id: randomUUID(),
        entity: "inventory",
        entityId: itemId,
        action: "delete",
        before: JSON.stringify({ deletedItemId: itemId }),
        deviceId: "web",
      });
    });

    revalidatePath("/inventory");

    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error deleting inventory item.";
    return { success: false, error: message };
  }
}

// Function to adjust stock manually (for opening balances, corrections, etc.)
export interface AdjustStockInput {
  itemId: string;
  quantity: number; // Positive for increase, negative for decrease
  rate?: number; // Rate for valuation (defaults to item's purchase rate)
  narration?: string;
}

export async function adjustStock(input: AdjustStockInput): Promise<{ success: true } | { success: false; error: string }> {
  try {
    await db.transaction(async (tx) => {
      // Get current item to verify existence and get purchase rate if rate not provided
      const [item] = await tx
        .select()
        .from(inventoryItems)
        .where(and(
          eq(inventoryItems.id as any, input.itemId),
          eq(inventoryItems.companyId as any, "company_1")
        ));

      if (!item) {
        throw new Error("Inventory item not found");
      }

      const rate = input.rate ?? item.purchaseRate;

      // Update stock quantity
      await tx.update(inventoryItems)
        .set({
          stockQuantity: (inventoryItems.stockQuantity as any) + input.quantity,
          updatedAt: Date.now()
        })
        .where(and(
          eq(inventoryItems.id as any, input.itemId),
          eq(inventoryItems.companyId as any, "company_1")
        ));

      // Record stock movement
      await tx.insert(stockMovements).values({
        id: randomUUID(),
        itemId: input.itemId,
        voucherId: null, // Manual adjustment
        type: input.quantity >= 0 ? "in" : "out",
        quantity: Math.abs(input.quantity),
        rate,
        date: Date.now(),
        narration: input.narration ?? (input.quantity >= 0 ? "Stock increase" : "Stock decrease"),
      } as any);

      // Append audit log
      await tx.insert(auditLog).values({
        id: randomUUID(),
        entity: "inventory",
        entityId: input.itemId,
        action: "update",
        after: JSON.stringify({
          stockAdjustment: input.quantity,
          newStock: item.stockQuantity + input.quantity
        }),
        deviceId: "web",
      });
    });

    revalidatePath("/inventory");

    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error adjusting stock.";
    return { success: false, error: message };
  }
}

export async function getItemDetailsAction(itemId: string) {
  try {
    const movements = await db
      .select({
        id: stockMovements.id,
        type: stockMovements.type,
        quantity: stockMovements.quantity,
        rate: stockMovements.rate,
        date: stockMovements.date,
        narration: stockMovements.narration,
      })
      .from(stockMovements)
      .where(eq(stockMovements.itemId, itemId))
      .orderBy(desc(stockMovements.date));

    const voucherEntriesData = await db
      .select({
        voucherId: voucherEntries.voucherId,
        type: voucherEntries.type,
        amount: voucherEntries.amount,
        narration: voucherEntries.narration,
        inventoryItemId: voucherEntries.inventoryItemId,
        quantity: voucherEntries.quantity,
        rate: voucherEntries.rate,
        voucherType: vouchers.type,
        voucherDate: vouchers.date,
        voucherNumber: vouchers.number,
        partyLedgerId: vouchers.partyLedgerId,
      })
      .from(voucherEntries)
      .innerJoin(vouchers, eq(voucherEntries.voucherId, vouchers.id))
      .where(eq(voucherEntries.inventoryItemId, itemId))
      .orderBy(desc(vouchers.date));

    return { success: true, stockMovementsData: movements, linkedVouchers: voucherEntriesData };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error loading item details.";
    return { success: false, error: message };
  }
}

export async function getInventoryItemsOptions() {
  try {
    const items = await db
      .select({
        id: inventoryItems.id,
        name: inventoryItems.name,
        category: inventoryItems.category,
        purchaseRate: inventoryItems.purchaseRate,
        saleRate: inventoryItems.saleRate,
        gstPercent: inventoryItems.gstPercent,
        unit: inventoryItems.unit,
      })
      .from(inventoryItems)
      .where(eq(inventoryItems.companyId as any, "company_1"))
      .orderBy(inventoryItems.name);
    return items;
  } catch (err) {
    console.error("Failed to fetch inventory items:", err);
    return [];
  }
}
