"use server";

import { db, ledgers, inventoryItems, voucherEntries, vouchers, eq, and, sum } from "@/lib/database";
import * as fs from "fs";
import * as path from "path";

const SETTINGS_FILE_PATH = path.join(process.cwd(), "lib", "database", "settings.json");

function readJsonSettings() {
  try {
    if (fs.existsSync(SETTINGS_FILE_PATH)) {
      const data = fs.readFileSync(SETTINGS_FILE_PATH, "utf-8");
      return JSON.parse(data);
    }
  } catch (err) {
    console.error("Failed to read settings.json:", err);
  }
  return {};
}

export type ERPNotification = {
  id: string;
  type: "low_stock" | "overdue_payment" | "gst_due" | "backup_reminder";
  title: string;
  message: string;
  severity: "info" | "warning" | "danger";
  actionLabel: string;
  actionUrl: string;
};

export async function getNotifications(): Promise<ERPNotification[]> {
  const alerts: ERPNotification[] = [];
  const companyId = "company_1";

  try {
    // 1. Fetch Low Stock Items
    const items = await db
      .select({
        id: inventoryItems.id,
        name: inventoryItems.name,
        stockQuantity: inventoryItems.stockQuantity,
        reorderLevel: inventoryItems.reorderLevel,
        unit: inventoryItems.unit,
      })
      .from(inventoryItems)
      .where(eq(inventoryItems.companyId as any, companyId));

    items.forEach((item) => {
      const reorderLevel = Number(item.reorderLevel ?? 10);
      const stock = Number(item.stockQuantity ?? 0);
      if (stock <= reorderLevel) {
        alerts.push({
          id: `low-stock-${item.id}`,
          type: "low_stock",
          title: `Low Stock: ${item.name}`,
          message: `Only ${stock} ${item.unit} left. Reorder level is ${reorderLevel}.`,
          severity: "warning",
          actionLabel: "View Stock",
          actionUrl: "/inventory",
        });
      }
    });

    // 2. Fetch Overdue Customer Payments (Sundry Debtors)
    const debtorLedgers = await db
      .select({
        id: ledgers.id,
        name: ledgers.name,
        openingBalance: ledgers.openingBalance,
        balanceType: ledgers.balanceType,
      })
      .from(ledgers)
      .where(
        and(
          eq(ledgers.companyId as any, companyId),
          eq(ledgers.isActive as any, true),
          eq(ledgers.group as any, "sundry_debtors")
        )
      );

    for (const ledger of debtorLedgers) {
      // Get sum of debits and credits
      const [debitResult, creditResult] = await Promise.all([
        db
          .select({ total: sum(voucherEntries.amount) })
          .from(voucherEntries)
          .innerJoin(vouchers, eq(voucherEntries.voucherId as any, vouchers.id as any))
          .where(
            and(
              eq(voucherEntries.ledgerId as any, ledger.id),
              eq(vouchers.companyId as any, companyId),
              eq(vouchers.status as any, "posted"),
              eq(voucherEntries.type as any, "dr")
            )
          ),
        db
          .select({ total: sum(voucherEntries.amount) })
          .from(voucherEntries)
          .innerJoin(vouchers, eq(voucherEntries.voucherId as any, vouchers.id as any))
          .where(
            and(
              eq(voucherEntries.ledgerId as any, ledger.id),
              eq(vouchers.companyId as any, companyId),
              eq(vouchers.status as any, "posted"),
              eq(voucherEntries.type as any, "cr")
            )
          ),
      ]);

      const debitTotal = Number(debitResult[0]?.total ?? 0);
      const creditTotal = Number(creditResult[0]?.total ?? 0);
      const opening = Number(ledger.openingBalance ?? 0);

      let balance = 0;
      if (ledger.balanceType === "dr") {
        balance = opening + debitTotal - creditTotal;
      } else {
        balance = opening + creditTotal - debitTotal;
      }

      // If outstanding debit balance exists, alert
      if (balance > 0) {
        alerts.push({
          id: `overdue-payment-${ledger.id}`,
          type: "overdue_payment",
          title: "Overdue Outstanding",
          message: `${ledger.name} has an unpaid balance of ₹${balance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}.`,
          severity: "danger",
          actionLabel: "View Ledger",
          actionUrl: `/ledgers/${ledger.id}`,
        });
      }
    }

    // 3. GST Due Reminders
    const today = new Date();
    const dayOfMonth = today.getDate();

    // GSTR-1 is due on the 11th of every month. Warn from 6th to 11th.
    if (dayOfMonth >= 6 && dayOfMonth <= 11) {
      alerts.push({
        id: "gst-due-gstr1",
        type: "gst_due",
        title: "GSTR-1 Return Due Soon",
        message: "GSTR-1 filing deadline is the 11th. Please audit sales data and export reports.",
        severity: "info",
        actionLabel: "View GST Report",
        actionUrl: "/reports/gst",
      });
    }

    // GSTR-3B is due on the 20th of every month. Warn from 15th to 20th.
    if (dayOfMonth >= 15 && dayOfMonth <= 20) {
      alerts.push({
        id: "gst-due-gstr3b",
        type: "gst_due",
        title: "GSTR-3B Return Due Soon",
        message: "GSTR-3B return is due on the 20th. Review your tax liabilities.",
        severity: "danger",
        actionLabel: "View GST Report",
        actionUrl: "/reports/gst",
      });
    }

    // 4. Backup Reminders
    const settings = readJsonSettings();
    const wantsBackupAlerts = settings.notificationSettings?.backupReminders ?? true;

    if (wantsBackupAlerts) {
      const lastBackup = settings.lastBackupDate; // Unix timestamp
      let needsBackup = true;

      if (lastBackup) {
        const days = (Date.now() - Number(lastBackup)) / (1000 * 60 * 60 * 24);
        if (days < 7) {
          needsBackup = false;
        }
      }

      if (needsBackup) {
        alerts.push({
          id: "backup-needed-reminder",
          type: "backup_reminder",
          title: "Database Backup Required",
          message: "You haven't backed up the ERP database recently. Secure your accounts now.",
          severity: "warning",
          actionLabel: "Backup Settings",
          actionUrl: "/settings",
        });
      }
    }
  } catch (error) {
    console.error("Error generating ERP notifications:", error);
  }

  return alerts;
}
