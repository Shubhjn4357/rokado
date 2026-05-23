"use server";

import { db, ledgers, inventoryItems, and, eq } from "@/lib/database";
import { createVoucher } from "@/app/(erp)/vouchers/actions";
import { createLedger } from "@/app/(erp)/ledgers/actions";
import { VoucherType, LedgerGroup } from "@/lib/types";
import { revalidatePath } from "next/cache";

import { getSession } from "@/lib/auth";

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

const SAMPLE_PRODUCTS = [
  { name: "Executive Ergonomic Office Chair", category: "Office Furniture", purchaseRate: 4500, saleRate: 7500 },
  { name: "Ultra-Wide 34-Inch Curved Monitor", category: "Electronics", purchaseRate: 8000, saleRate: 14000 },
  { name: "Mechanical Gaming Keyboard RGB", category: "Accessories", purchaseRate: 1200, saleRate: 2200 },
  { name: "Wireless Noise-Canceling Headphones", category: "Electronics", purchaseRate: 3000, saleRate: 5200 },
  { name: "Portable SSD 2TB USB-C", category: "Storage", purchaseRate: 1800, saleRate: 3100 },
];

export async function generateRandomBillAction(data: {
  targetAmount: number;
  voucherType: "sales" | "purchase" | "mixed";
  gstPercent: number;
  count: number;
}) {
  try {
    const { targetAmount, voucherType, gstPercent, count = 1 } = data;

    if (targetAmount <= 0) {
      return { success: false, error: "Target amount must be greater than zero." };
    }
    if (count <= 0) {
      return { success: false, error: "Voucher count must be at least 1." };
    }

    const session = await getSession();
    if (!session || !session.companyId) {
      return { success: false, error: "Not authenticated or no active organization." };
    }
    const companyId = session.companyId;

    const seededVouchers = [];
    let totalTargetAmount = 0;
    let totalTaxableSubtotal = 0;
    let totalTaxAmount = 0;

    // Loop through the count to generate that many vouchers
    for (let i = 0; i < count; i++) {
      // 1. Determine voucher type (mixed chooses randomly between sales and purchase)
      const currentVType = voucherType === "mixed" 
        ? (Math.random() > 0.5 ? "sales" : "purchase") 
        : voucherType;

      // 2. Generate random Indian Name
      const firstName = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
      const lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
      const randomPartyName = `${firstName} ${lastName}`;

      const partyGroup: LedgerGroup = currentVType === "sales" ? "sundry_debtors" : "sundry_creditors";

      // Check if ledger exists, if not create it
      let partyLedger = await db.query.ledgers.findFirst({
        where: and(
          eq(ledgers.name as any, randomPartyName), 
          eq(ledgers.group as any, partyGroup),
          eq(ledgers.companyId as any, companyId)
        )
      });

      let partyLedgerId = partyLedger?.id;

      if (!partyLedgerId) {
        const gstin = `27${Array.from({ length: 10 }, () => "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"[Math.floor(Math.random() * 36)]).join("")}1Z5`;
        const res = await createLedger({
          name: randomPartyName,
          group: partyGroup,
          openingBalance: 0,
          balanceType: currentVType === "sales" ? "dr" : "cr",
          creditLimit: 100000,
          phone: `+91 ${Math.floor(1000000000 + Math.random() * 9000000000)}`,
          gstNumber: gstin,
          address: `${Math.floor(10 + Math.random() * 900)},  Bazaar, Mumbai, Maharashtra`,
        });
        if (!res.success) {
          throw new Error(`Failed to create party ledger: ${res.error}`);
        }
        partyLedgerId = res.ledgerId;
      }

      // 3. Look up or create Sales/Purchase ledger
      const bookGroup: LedgerGroup = currentVType === "sales" ? "sales" : "purchase";
      let bookLedger = await db.query.ledgers.findFirst({
        where: and(eq(ledgers.companyId as any, companyId), eq(ledgers.group as any, bookGroup))
      });

      let bookLedgerId = bookLedger?.id;

      if (!bookLedgerId) {
        const res = await createLedger({
          name: currentVType === "sales" ? "Sales A/c" : "Purchase A/c",
          group: bookGroup,
          openingBalance: 0,
          balanceType: currentVType === "sales" ? "cr" : "dr",
          creditLimit: 0,
        });
        if (!res.success) {
          throw new Error(`Failed to create dynamic bookkeeping ledger: ${res.error}`);
        }
        bookLedgerId = res.ledgerId;
      }

      // 4. Look up or create Duties & Taxes ledger for GST
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
          throw new Error(`Failed to create GST ledger: ${res.error}`);
        }
        taxLedgerId = res.ledgerId;
      }

      // 5. Ensure some Inventory exists, if 0, auto-seed standard stock items
      let allItems = await db.query.inventoryItems.findMany({
        where: eq(inventoryItems.companyId as any, companyId)
      });

      if (allItems.length === 0) {
        for (const item of SAMPLE_PRODUCTS) {
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

      // 6. Calculate GST splits
      // Vary targetAmount slightly by +/- 15% to make transactions look very natural
      const variation = 0.85 + Math.random() * 0.3;
      const currentTargetAmount = parseFloat((targetAmount * variation).toFixed(2));
      const subtotal = currentTargetAmount / (1 + gstPercent / 100);
      const taxAmount = currentTargetAmount - subtotal;

      // Pick random Qty between 1 and 5
      const quantity = Math.floor(1 + Math.random() * 5);
      const rate = subtotal / quantity;

      // 7. Build double-entry lines
      const compiledEntries = [];

      // Line 1: Party posting
      compiledEntries.push({
        ledgerId: partyLedgerId,
        type: currentVType === "sales" ? ("dr" as const) : ("cr" as const),
        amount: currentTargetAmount,
        narration: `Randomized auto-seeder ${currentVType} invoice`
      });

      // Line 2: Bookkeeping Sales/Purchase with inventory linking
      compiledEntries.push({
        ledgerId: bookLedgerId,
        type: currentVType === "sales" ? ("cr" as const) : ("dr" as const),
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
          type: currentVType === "sales" ? ("cr" as const) : ("dr" as const),
          amount: taxAmount,
          narration: `${gstPercent}% GST balanced line`
        });
      }

      // Generate staggered dates (spacing them out backwards in time so we have nice historical graphs)
      const voucherDate = Date.now() - i * 6 * 60 * 60 * 1000 - Math.random() * 3 * 60 * 60 * 1000; // Spaced out by ~6 hours

      // 8. Post transaction via core voucher action
      const result = await createVoucher({
        type: currentVType,
        date: voucherDate,
        narration: `Auto-seeded voucher of Target: ₹${currentTargetAmount.toFixed(2)} (${gstPercent}% GST included) matching ${randomPartyName}.`,
        reference: `SEED-${Math.floor(100000 + Math.random() * 900000)}`,
        entries: compiledEntries,
      });

      if (!result.success) {
        throw new Error(result.error || "Failed to create voucher");
      }

      totalTargetAmount += currentTargetAmount;
      totalTaxableSubtotal += subtotal;
      totalTaxAmount += taxAmount;

      seededVouchers.push({
        id: result.voucherId,
        partyName: randomPartyName,
        type: currentVType,
        amount: currentTargetAmount,
        subtotal,
        taxAmount,
        itemName: selectedItem.name,
        quantity,
        date: voucherDate,
      });
    }

    revalidatePath("/settings");
    revalidatePath("/vouchers");
    revalidatePath("/inventory");
    revalidatePath("/dashboard");

    return {
      success: true,
      count: seededVouchers.length,
      totalTargetAmount,
      totalTaxableSubtotal,
      totalTaxAmount,
      vouchers: seededVouchers,
    };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown error seeding random bills." };
  }
}
