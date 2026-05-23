"use server";

import { db, companies, ledgers, users, companyMembers, and, eq } from "@/lib/database";
import { revalidatePath } from "next/cache";
import { hashPassword, setSession, getSession } from "@/lib/auth";

export async function createCompanyAndLedgersAction(data: {
  businessName: string;
  gstin: string;
  pan?: string;
  startingCapital?: number;
  businessAddress: string;
  businessCity: string;
  businessState: string;
  businessPincode: string;
  businessPhone: string;
  businessEmail: string;
  businessType: string;
  cashInHand: number;
  bankBalance: number;
  ownerName: string;
  username: string;
  password?: string; // Optional if migrating, but required for new setup
}) {
  try {
    const {
      businessName,
      gstin,
      pan,
      startingCapital,
      businessAddress,
      businessCity,
      businessState,
      businessPincode,
      businessPhone,
      businessEmail,
      businessType,
      cashInHand,
      bankBalance,
      ownerName,
      username,
      password,
    } = data;

    const companyId = crypto.randomUUID();

    // Create company record
    const [company] = await db
      .insert(companies)
      .values({
        id: companyId,
        name: businessName,
        gstin: gstin,
        pan: pan || null,
        address: `${businessAddress}, ${businessCity}, ${businessState} - ${businessPincode}`,
        phone: businessPhone,
        email: businessEmail,
        fiscalYearStart: Date.now(),
        businessType,
      })
      .returning();

    if (!company) throw new Error("Failed to create company");

    // Create default ledgers based on business type
    const initialCapital = startingCapital != null ? startingCapital : (cashInHand + bankBalance);
    const defaultLedgers = getDefaultLedgers(company.id, businessType, initialCapital);
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

    // Create or update administrative user
    const session = await getSession();
    let finalUserId = session?.id;

    if (session) {
      // User is already logged in, update their active companyId and role
      await db
        .update(users)
        .set({
          companyId: company.id,
          role: "owner",
          updatedAt: Date.now(),
        })
        .where(eq(users.id, session.id));

      // Insert membership record
      await db.insert(companyMembers).values({
        id: crypto.randomUUID(),
        companyId: company.id,
        userId: session.id,
        role: "owner",
        createdAt: Date.now(),
      });

      // Update session cookie in place
      await setSession({
        id: session.id,
        username: session.username,
        name: ownerName || session.name,
        role: "owner",
        companyId: company.id,
      });
    } else {
      // Create new administrative user
      finalUserId = crypto.randomUUID();
      const finalPassword = password || "owner123";
      
      await db.insert(users).values({
        id: finalUserId,
        username: username.toLowerCase().trim(),
        passwordHash: hashPassword(finalPassword),
        name: ownerName,
        role: "owner",
        companyId: company.id,
      });

      // Insert membership record
      await db.insert(companyMembers).values({
        id: crypto.randomUUID(),
        companyId: company.id,
        userId: finalUserId,
        role: "owner",
        createdAt: Date.now(),
      });

      // Set session cookie
      await setSession({
        id: finalUserId,
        username: username.toLowerCase().trim(),
        name: ownerName,
        role: "owner",
        companyId: company.id,
      });
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

function getDefaultLedgers(companyId: string, businessType: string, initialCapital: number) {
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
    { id: crypto.randomUUID(), companyId, name: "General Expenses", group: "expenses", openingBalance: 0, balanceType: "dr" as const },

    // Capital
    { id: crypto.randomUUID(), companyId, name: "Capital Account", group: "capital", openingBalance: initialCapital, balanceType: "cr" as const },
  ];

  if (businessType === "retail_store") {
    ledgersData.push(
      { id: crypto.randomUUID(), companyId, name: "Shop Rent", group: "expenses", openingBalance: 0, balanceType: "dr" as const },
      { id: crypto.randomUUID(), companyId, name: "Electricity & Utilities", group: "expenses", openingBalance: 0, balanceType: "dr" as const },
      { id: crypto.randomUUID(), companyId, name: "Inventory Shrinkage", group: "expenses", openingBalance: 0, balanceType: "dr" as const }
    );
  } else if (businessType === "wholesale_dist") {
    ledgersData.push(
      { id: crypto.randomUUID(), companyId, name: "Transport & Freight", group: "expenses", openingBalance: 0, balanceType: "dr" as const },
      { id: crypto.randomUUID(), companyId, name: "Warehouse Rent", group: "expenses", openingBalance: 0, balanceType: "dr" as const },
      { id: crypto.randomUUID(), companyId, name: "Sales Commission", group: "expenses", openingBalance: 0, balanceType: "dr" as const }
    );
  } else if (businessType === "general_services") {
    ledgersData.push(
      { id: crypto.randomUUID(), companyId, name: "Software & SaaS Subscriptions", group: "expenses", openingBalance: 0, balanceType: "dr" as const },
      { id: crypto.randomUUID(), companyId, name: "Professional & Legal Fees", group: "expenses", openingBalance: 0, balanceType: "dr" as const },
      { id: crypto.randomUUID(), companyId, name: "Office Expenses", group: "expenses", openingBalance: 0, balanceType: "dr" as const }
    );
  } else if (businessType === "apparel_garment") {
    ledgersData.push(
      { id: crypto.randomUUID(), companyId, name: "Fabric Dyeing & Printing", group: "expenses", openingBalance: 0, balanceType: "dr" as const },
      { id: crypto.randomUUID(), companyId, name: "Transport & Freight", group: "expenses", openingBalance: 0, balanceType: "dr" as const },
      { id: crypto.randomUUID(), companyId, name: "Showroom Rent", group: "expenses", openingBalance: 0, balanceType: "dr" as const }
    );
  } else if (businessType === "manufacturing") {
    ledgersData.push(
      { id: crypto.randomUUID(), companyId, name: "Factory Power & Fuel", group: "expenses", openingBalance: 0, balanceType: "dr" as const },
      { id: crypto.randomUUID(), companyId, name: "Direct Labour Charges", group: "expenses", openingBalance: 0, balanceType: "dr" as const },
      { id: crypto.randomUUID(), companyId, name: "Machinery Maintenance", group: "expenses", openingBalance: 0, balanceType: "dr" as const }
    );
  } else {
  // Custom / Default /  Wholesale style
    ledgersData.push(
      { id: crypto.randomUUID(), companyId, name: "Transport & Freight", group: "expenses", openingBalance: 0, balanceType: "dr" as const },
      { id: crypto.randomUUID(), companyId, name: "Shop Rent", group: "expenses", openingBalance: 0, balanceType: "dr" as const }
    );
  }

  return ledgersData;
}

export async function getCurrentUserAction() {
  try {
    const session = await getSession();
    return session;
  } catch (error) {
    return null;
  }
}
