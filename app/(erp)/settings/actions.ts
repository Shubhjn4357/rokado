"use server";

import { db, companies, eq } from "@/lib/database";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import * as fs from "fs";
import * as path from "path";

const SETTINGS_FILE_PATH = path.join(process.cwd(), "lib", "database", "settings.json");

// Helper to read JSON settings for a specific company
function readJsonSettings(companyId: string) {
  try {
    if (fs.existsSync(SETTINGS_FILE_PATH)) {
      const data = fs.readFileSync(SETTINGS_FILE_PATH, "utf-8");
      const allSettings = JSON.parse(data);
      return allSettings[companyId] || {};
    }
  } catch (err) {
    console.error("Failed to read settings.json:", err);
  }
  return {};
}

// Helper to write JSON settings for a specific company
function writeJsonSettings(companyId: string, settings: any) {
  try {
    const dir = path.dirname(SETTINGS_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    let allSettings: any = {};
    if (fs.existsSync(SETTINGS_FILE_PATH)) {
      try {
        const data = fs.readFileSync(SETTINGS_FILE_PATH, "utf-8");
        allSettings = JSON.parse(data);
      } catch (e) {
        allSettings = {};
      }
    }
    const current = allSettings[companyId] || {};
    allSettings[companyId] = { ...current, ...settings };
    fs.writeFileSync(SETTINGS_FILE_PATH, JSON.stringify(allSettings, null, 2), "utf-8");
    return true;
  } catch (err) {
    console.error("Failed to write settings.json:", err);
    return false;
  }
}

export async function getSettings() {
  try {
    const session = await getSession();
    if (!session || !session.companyId) {
      return null;
    }
    const companyId = session.companyId;

    // 1. Get Company from SQLite database
    const company = await db.query.companies.findFirst({
      where: eq(companies.id as any, companyId),
    });

    // 2. Get JSON settings (financial, tax, notifications)
    const jsonSettings = readJsonSettings(companyId);

    return {
      companyInfo: {
        name: company?.name ?? "My Organization",
        gstin: company?.gstin ?? "",
        pan: company?.pan ?? "",
        address: company?.address ?? "",
        city: company?.city ?? "",
        state: company?.state ?? "",
        pincode: company?.pincode ?? "",
        phone: company?.phone ?? "",
        email: company?.email ?? "",
        website: jsonSettings.companyInfo?.website ?? "",
      },
      financialSettings: {
        fiscalYearStart: jsonSettings.financialSettings?.fiscalYearStart ?? "04-01",
        currencySymbol: jsonSettings.financialSettings?.currencySymbol ?? "₹",
        currencyCode: jsonSettings.financialSettings?.currencyCode ?? "INR",
        numberFormat: jsonSettings.financialSettings?.numberFormat ?? "Indian",
      },
      taxSettings: {
        gstApplicable: jsonSettings.taxSettings?.gstApplicable ?? true,
        defaultGstRate: jsonSettings.taxSettings?.defaultGstRate ?? 18,
        TDSApplicable: jsonSettings.taxSettings?.TDSApplicable ?? false,
        defaultTDSRate: jsonSettings.taxSettings?.defaultTDSRate ?? 10,
      },
      notificationSettings: {
        emailNotifications: jsonSettings.notificationSettings?.emailNotifications ?? true,
        smsNotifications: jsonSettings.notificationSettings?.smsNotifications ?? false,
        lowStockAlerts: jsonSettings.notificationSettings?.lowStockAlerts ?? true,
        paymentReminders: jsonSettings.notificationSettings?.paymentReminders ?? true,
        backupReminders: jsonSettings.notificationSettings?.backupReminders ?? true,
      },
    };
  } catch (err) {
    console.error("Failed to fetch settings:", err);
    return null;
  }
}

export async function saveCompanySettings(data: {
  name: string;
  gstin: string;
  pan: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  email: string;
  website: string;
}) {
  try {
    const session = await getSession();
    if (!session || !session.companyId) {
      return { success: false, error: "Not authenticated" };
    }
    const companyId = session.companyId;

    // 1. Update companies table in SQLite
    await db
      .update(companies)
      .set({
        name: data.name,
        gstin: data.gstin,
        pan: data.pan,
        address: data.address,
        city: data.city,
        state: data.state,
        pincode: data.pincode,
        phone: data.phone,
        email: data.email,
        updatedAt: Date.now(),
      })
      .where(eq(companies.id as any, companyId));

    // 2. Persist website in jsonSettings
    writeJsonSettings(companyId, {
      companyInfo: {
        website: data.website,
      },
    });

    revalidatePath("/settings");
    return { success: true };
  } catch (err) {
    console.error("Failed to save company settings:", err);
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export async function saveFinancialSettings(data: {
  fiscalYearStart: string;
  currencySymbol: string;
  currencyCode: string;
  numberFormat: string;
}) {
  try {
    const session = await getSession();
    if (!session || !session.companyId) {
      return { success: false, error: "Not authenticated" };
    }
    writeJsonSettings(session.companyId, {
      financialSettings: data,
    });
    revalidatePath("/settings");
    return { success: true };
  } catch (err) {
    console.error("Failed to save financial settings:", err);
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export async function saveTaxSettings(data: {
  gstApplicable: boolean;
  defaultGstRate: number;
  TDSApplicable: boolean;
  defaultTDSRate: number;
}) {
  try {
    const session = await getSession();
    if (!session || !session.companyId) {
      return { success: false, error: "Not authenticated" };
    }
    writeJsonSettings(session.companyId, {
      taxSettings: data,
    });
    revalidatePath("/settings");
    return { success: true };
  } catch (err) {
    console.error("Failed to save tax settings:", err);
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export async function saveNotificationSettings(data: {
  emailNotifications: boolean;
  smsNotifications: boolean;
  lowStockAlerts: boolean;
  paymentReminders: boolean;
  backupReminders: boolean;
}) {
  try {
    const session = await getSession();
    if (!session || !session.companyId) {
      return { success: false, error: "Not authenticated" };
    }
    writeJsonSettings(session.companyId, {
      notificationSettings: data,
    });
    revalidatePath("/settings");
    return { success: true };
  } catch (err) {
    console.error("Failed to save notification settings:", err);
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}
