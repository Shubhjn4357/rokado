"use server";

import { db, ledgers, inventoryItems, and, eq } from "@/lib/database";
import { createVoucher } from "@/app/(erp)/vouchers/actions";
import { createLedger } from "@/app/(erp)/ledgers/actions";
import { VoucherType, LedgerGroup } from "@/lib/types";
import { revalidatePath } from "next/cache";

const FIRST_NAMES = [
  "Amit", "Rajesh", "Sunita", "Deepak", "Sneha", "Ramesh", "Sanjay", "Vikram", "Anita", "Rahul",
  "Priya", "Ajay", "Pooja", "Suresh", "Mahesh", "Neha", "Rohit", "Anjali", "Geeta", "Manish",
  "Karan", "Aarti", "Vivek", "Sandeep", "Manoj", "Divya", "Sunil", "Nitin", "Harish", "Preeti",
  "Shweta", "Anil", "Ritu", "Vijay", "Rakesh", "Jyoti", "Kiran", "Vikas", "Abhay", "Pankaj",
  "Alok", "Shashi", "Rekha", "Usha", "Dev", "Madhav", "Gopal", "Arjun", "Kishore", "Arvind",
  "Lakshman", "Rama", "Krishna", "Govind", "Mohan", "Hari", "Madhu", "Keshav", "Raghav", "Srinivas"
];

const LAST_NAMES = [
  "Kumar", "Patel", "Sharma", "Gupta", "Verma", "Singh", "Joshi", "Mehta", "Shah", "Trivedi",
  "Mishra", "Nair", "Pillai", "Iyer", "Iyengar", "Rao", "Reddy", "Naidu", "Chawla", "Kapoor",
  "Khan", "Bhat", "Kulkarni", "Deshpande", "Patil", "Shinde", "Yadav", "Choudhary", "Jha", "Pandey",
  "Prasad", "Sen", "Roy", "Banerjee", "Mukherjee", "Das", "Bose", "Ghosh", "Dutta", "Saxena",
  "Srivastava", "Singhal", "Goel", "Bansal", "Agrawal", "Mittal", "Garg", "Jindal", "Jain", "Vora"
];

const SAMPLE_SAREES = [
  { name: "Premium Banarasi Silk Saree", category: "Silk Sarees", purchaseRate: 4500, saleRate: 7500 },
  { name: "Kanjeevaram Wedding Collection Saree", category: "Wedding Collection", purchaseRate: 8000, saleRate: 14000 },
  { name: "Handloom Chanderi Cotton Saree", category: "Cotton Sarees", purchaseRate: 1200, saleRate: 2200 },
  { name: "Designer Georgette Embroidery Saree", category: "Designer Sarees", purchaseRate: 3000, saleRate: 5200 },
  { name: "Traditional Bandhani Jaipuri Saree", category: "Festival Collection", purchaseRate: 1800, saleRate: 3100 },
];

export async function generateRandomBillAction(data: {
  targetAmount: number;
  voucherType: "sales" | "purchase";
  gstPercent: number;
}) {
  try {
    const { targetAmount, voucherType, gstPercent } = data;

    if (targetAmount <= 0) {
      return { success: false, error: "Target amount must be greater than zero." };
    }

    const companyId = "company_1";

    // 1. Generate random Indian Name
    const firstName = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
    const lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
    const randomPartyName = `${firstName} ${lastName}`;

    const partyGroup: LedgerGroup = voucherType === "sales" ? "sundry_debtors" : "sundry_creditors";

    // Check if ledger exists, if not create it
    let partyLedger = await db.query.ledgers.findFirst({
      where: and(eq(ledgers.name as any, randomPartyName), eq(ledgers.group as any, partyGroup))
    });

    let partyLedgerId = partyLedger?.id;

    if (!partyLedgerId) {
      const gstin = `27${Array.from({ length: 10 }, () => "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"[Math.floor(Math.random() * 36)]).join("")}1Z5`;
      const res = await createLedger({
        name: randomPartyName,
        group: partyGroup,
        openingBalance: 0,
        balanceType: voucherType === "sales" ? "dr" : "cr",
        creditLimit: 100000,
        phone: `+91 ${Math.floor(1000000000 + Math.random() * 9000000000)}`,
        gstNumber: gstin,
        address: `${Math.floor(10 + Math.random() * 900)}, Saree Bazaar, Mumbai, Maharashtra`,
      });
      if (!res.success) {
        return { success: false, error: `Failed to create party ledger: ${res.error}` };
      }
      partyLedgerId = res.ledgerId;
    }

    // 2. Look up or create Sales/Purchase ledger
    const bookGroup: LedgerGroup = voucherType === "sales" ? "sales" : "purchase";
    let bookLedger = await db.query.ledgers.findFirst({
      where: and(eq(ledgers.companyId as any, companyId), eq(ledgers.group as any, bookGroup))
    });

    let bookLedgerId = bookLedger?.id;

    if (!bookLedgerId) {
      const res = await createLedger({
        name: voucherType === "sales" ? "Sales A/c" : "Purchase A/c",
        group: bookGroup,
        openingBalance: 0,
        balanceType: voucherType === "sales" ? "cr" : "dr",
        creditLimit: 0,
      });
      if (!res.success) {
        return { success: false, error: `Failed to create dynamic bookkeeping ledger: ${res.error}` };
      }
      bookLedgerId = res.ledgerId;
    }

    // 3. Look up or create Duties & Taxes ledger for GST
    let taxLedger = await db.query.ledgers.findFirst({
      where: and(eq(ledgers.companyId as any, companyId), eq(ledgers.group as any, "duties_taxes"))
    });

    let taxLedgerId = taxLedger?.id;

    if (!taxLedgerId) {
      const res = await createLedger({
        name: "GST Duties & Taxes A/c",
        group: "duties_taxes",
        openingBalance: 0,
        balanceType: "cr",
        creditLimit: 0,
      });
      if (!res.success) {
        return { success: false, error: `Failed to create GST ledger: ${res.error}` };
      }
      taxLedgerId = res.ledgerId;
    }

    // 4. Ensure some Saree Inventory exists, if 0, auto-seed standard stock items
    let allItems = await db.query.inventoryItems.findMany({
      where: eq(inventoryItems.companyId as any, companyId)
    });

    if (allItems.length === 0) {
      for (const item of SAMPLE_SAREES) {
        await db.insert(inventoryItems).values({
          id: crypto.randomUUID(),
          companyId,
          name: item.name,
          category: item.category,
          purchaseRate: item.purchaseRate,
          saleRate: item.saleRate,
          gstPercent: 18,
          stockQuantity: 100,
          unit: "pcs",
        });
      }
      allItems = await db.query.inventoryItems.findMany({
        where: eq(inventoryItems.companyId as any, companyId)
      });
    }

    const selectedItem = allItems[Math.floor(Math.random() * allItems.length)];

    // 5. Calculate perfect GST split math
    const subtotal = targetAmount / (1 + gstPercent / 100);
    const taxAmount = targetAmount - subtotal;

    // Pick random Qty between 1 and 5
    const quantity = Math.floor(1 + Math.random() * 5);
    const rate = subtotal / quantity;

    // 6. Build double-entry lines
    const compiledEntries = [];

    // Line 1: Party posting
    compiledEntries.push({
      ledgerId: partyLedgerId,
      type: voucherType === "sales" ? ("dr" as const) : ("cr" as const),
      amount: targetAmount,
      narration: `Randomized auto-seeder ${voucherType} invoice`
    });

    // Line 2: Bookkeeping Sales/Purchase with inventory linking
    compiledEntries.push({
      ledgerId: bookLedgerId,
      type: voucherType === "sales" ? ("cr" as const) : ("dr" as const),
      amount: subtotal,
      inventoryItemId: selectedItem.id,
      quantity,
      rate,
      narration: `Sold ${quantity} ${selectedItem.name}`
    });

    // Line 3: Tax additions
    if (taxAmount > 0) {
      compiledEntries.push({
        ledgerId: taxLedgerId!,
        type: voucherType === "sales" ? ("cr" as const) : ("dr" as const),
        amount: taxAmount,
        narration: `${gstPercent}% GST balanced line`
      });
    }

    // 7. Post transaction via core voucher action
    const result = await createVoucher({
      type: voucherType,
      date: Date.now(),
      narration: `Successfully auto-seeded transaction with Target: ₹${targetAmount.toFixed(2)} (${gstPercent}% GST included) matching ${randomPartyName}.`,
      reference: `SEED-${Math.floor(100000 + Math.random() * 900000)}`,
      entries: compiledEntries,
    });

    if (!result.success) {
      return { success: false, error: result.error };
    }

    revalidatePath("/settings");
    revalidatePath("/vouchers");
    revalidatePath("/inventory");
    revalidatePath("/dashboard");

    return {
      success: true,
      voucherId: result.voucherId,
      partyName: randomPartyName,
      subtotal,
      taxAmount,
      itemName: selectedItem.name,
      quantity,
      rate,
    };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown error seeding random bill." };
  }
}
