"use server";

import { db, companies, ledgers, and, eq } from "@/lib/database";
import { revalidatePath } from "next/cache";

export async function createCompanyAndLedgersAction(data: {
  businessName: string;
  gstin: string;
  businessAddress: string;
  businessCity: string;
  businessState: string;
  businessPincode: string;
  businessPhone: string;
  businessEmail: string;
  businessType: string;
  cashInHand: number;
  bankBalance: number;
}) {
  try {
    const {
      businessName,
      gstin,
      businessAddress,
      businessCity,
      businessState,
      businessPincode,
      businessPhone,
      businessEmail,
      businessType,
      cashInHand,
      bankBalance,
    } = data;

    const companyId = crypto.randomUUID();

    // Create company record
    const [company] = await db
      .insert(companies)
      .values({
        id: companyId,
        name: businessName,
        gstin: gstin,
        address: `${businessAddress}, ${businessCity}, ${businessState} - ${businessPincode}`,
        phone: businessPhone,
        email: businessEmail,
        fiscalYearStart: Date.now(),
        businessType,
      })
      .returning();

    if (!company) throw new Error("Failed to create company");

    // Create default ledgers based on business type
    const defaultLedgers = getDefaultLedgers(company.id, businessType);
    await db.insert(ledgers).values(defaultLedgers as any);

    // Set opening balances if provided
    if (cashInHand > 0 || bankBalance > 0) {
      const cashLedger = defaultLedgers.find((l) => l.group === "cash");
      const bankLedger = defaultLedgers.find((l) => l.group === "bank");

      if (cashLedger && cashInHand > 0) {
        await db
          .update(ledgers)
          .set({ openingBalance: cashInHand })
          .where(
            and(
              eq(ledgers.id as any, cashLedger.id as string),
              eq(ledgers.companyId as any, company.id)
            )
          );
      }

      if (bankLedger && bankBalance > 0) {
        await db
          .update(ledgers)
          .set({ openingBalance: bankBalance })
          .where(
            and(
              eq(ledgers.id as any, bankLedger.id as string),
              eq(ledgers.companyId as any, company.id)
            )
          );
      }
    }

    revalidatePath("/");
    return { success: true, companyId };
  } catch (error) {
    console.error("Failed to complete setup:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error during setup",
    };
  }
}

function getDefaultLedgers(companyId: string, businessType: string) {
  const ledgersData: Array<Partial<typeof ledgers.$inferSelect>> = [
    // Cash & Bank
    { id: crypto.randomUUID(), companyId, name: "Cash", group: "cash", openingBalance: 0, balanceType: "dr" as const },
    { id: crypto.randomUUID(), companyId, name: "Bank", group: "bank", openingBalance: 0, balanceType: "dr" as const },

    // Sales & Purchase
    { id: crypto.randomUUID(), companyId, name: "Sales Account", group: "sales", openingBalance: 0, balanceType: "cr" as const },
    { id: crypto.randomUUID(), companyId, name: "Purchase Account", group: "purchase", openingBalance: 0, balanceType: "dr" as const },

    // GST Ledgers
    { id: crypto.randomUUID(), companyId, name: "CGST Payable", group: "duties_taxes", openingBalance: 0, balanceType: "cr" as const },
    { id: crypto.randomUUID(), companyId, name: "SGST Payable", group: "duties_taxes", openingBalance: 0, balanceType: "cr" as const },
    { id: crypto.randomUUID(), companyId, name: "IGST Payable", group: "duties_taxes", openingBalance: 0, balanceType: "cr" as const },

    // Default Debtors & Creditors
    { id: crypto.randomUUID(), companyId, name: "Sundry Debtors", group: "sundry_debtors", openingBalance: 0, balanceType: "dr" as const },
    { id: crypto.randomUUID(), companyId, name: "Sundry Creditors", group: "sundry_creditors", openingBalance: 0, balanceType: "cr" as const },

    // Expenses
    { id: crypto.randomUUID(), companyId, name: "Expenses", group: "expenses", openingBalance: 0, balanceType: "dr" as const },

    // Capital
    { id: crypto.randomUUID(), companyId, name: "Capital Account", group: "capital", openingBalance: 0, balanceType: "cr" as const },
  ];

  if (businessType === "wholesale_saree" || businessType === "textile_retail") {
    ledgersData.push(
      { id: crypto.randomUUID(), companyId, name: "Transport & Freight", group: "expenses", openingBalance: 0, balanceType: "dr" as const },
      { id: crypto.randomUUID(), companyId, name: "Shop Rent", group: "expenses", openingBalance: 0, balanceType: "dr" as const }
    );
  }

  return ledgersData;
}
