import { db } from "./index";
import {
  companies,
  ledgers,
  inventoryItems,
  users,
} from "./schema";
import { hashPassword } from "../auth";

async function main() {
  console.log("🌱 Seeding ERP database with real data...");

  // ── Company ──────────────────────────────────────────────────────────────
  await db.insert(companies).values({
    id: "company_1",
    name: "Shree Saree House",
    gstin: "27AAACS1429B1ZB",
    pan: "AAACS1429B",
    address: "145, Saree Market, Chandni Chowk",
    city: "Delhi",
    state: "Delhi",
    pincode: "110006",
    phone: "9876543210",
    email: "info@shreesaree.in",
    businessType: "wholesale_saree",
  }).onConflictDoNothing();

  // ── Ledgers ───────────────────────────────────────────────────────────────
  const ledgerData = [
    // Cash & Bank
    { id: "led_cash", companyId: "company_1", name: "Cash", group: "cash", openingBalance: 50000, balanceType: "dr" as const },
    { id: "led_sbi", companyId: "company_1", name: "SBI Current Account", group: "bank", openingBalance: 240000, balanceType: "dr" as const },
    { id: "led_hdfc", companyId: "company_1", name: "HDFC Current Account", group: "bank", openingBalance: 110000, balanceType: "dr" as const },

    // Sales & Purchase
    { id: "led_sales", companyId: "company_1", name: "Sales Account", group: "sales", openingBalance: 0, balanceType: "cr" as const },
    { id: "led_purchase", companyId: "company_1", name: "Purchase Account", group: "purchase", openingBalance: 0, balanceType: "dr" as const },

    // GST Ledgers
    { id: "led_cgst", companyId: "company_1", name: "CGST Payable", group: "duties_taxes", openingBalance: 0, balanceType: "cr" as const },
    { id: "led_sgst", companyId: "company_1", name: "SGST Payable", group: "duties_taxes", openingBalance: 0, balanceType: "cr" as const },
    { id: "led_igst", companyId: "company_1", name: "IGST Payable", group: "duties_taxes", openingBalance: 0, balanceType: "cr" as const },

    // Debtors (Customers)
    { id: "led_raj_tex", companyId: "company_1", name: "Raj Textiles", group: "sundry_debtors", gstNumber: "07AACCR1234B1ZD", phone: "9811001122", openingBalance: 245000, balanceType: "dr" as const, creditLimit: 500000 },
    { id: "led_maa_sari", companyId: "company_1", name: "Maa Saree Emporium", group: "sundry_debtors", gstNumber: "09AACCM5678C1ZA", phone: "9822003344", openingBalance: 85000, balanceType: "dr" as const, creditLimit: 300000 },
    { id: "led_bombay_silk", companyId: "company_1", name: "Bombay Silk Store", group: "sundry_debtors", gstNumber: "27AACCB2345D1ZP", phone: "9833005566", openingBalance: 320000, balanceType: "dr" as const, creditLimit: 600000 },
    { id: "led_annapurna", companyId: "company_1", name: "Annapurna Fashions", group: "sundry_debtors", phone: "9844007788", openingBalance: 45000, balanceType: "dr" as const },

    // Creditors (Suppliers)
    { id: "led_kanjivaram_mills", companyId: "company_1", name: "Kanjivaram Silk Mills", group: "sundry_creditors", gstNumber: "33AACCK9012E1ZQ", phone: "9855009900", openingBalance: 180000, balanceType: "cr" as const },
    { id: "led_banarasi_weavers", companyId: "company_1", name: "Banarasi Weavers Coop", group: "sundry_creditors", gstNumber: "09AACCB6789F1ZR", phone: "9866001122", openingBalance: 95000, balanceType: "cr" as const },

    // Expenses
    { id: "led_rent", companyId: "company_1", name: "Shop Rent", group: "expenses", openingBalance: 0, balanceType: "dr" as const },
    { id: "led_transport", companyId: "company_1", name: "Transport & Freight", group: "expenses", openingBalance: 0, balanceType: "dr" as const },
    { id: "led_salary", companyId: "company_1", name: "Staff Salary", group: "expenses", openingBalance: 0, balanceType: "dr" as const },
    { id: "led_electricity", companyId: "company_1", name: "Electricity Bill", group: "expenses", openingBalance: 0, balanceType: "dr" as const },
  ];

  for (const ledger of ledgerData) {
    await db.insert(ledgers).values(ledger).onConflictDoNothing();
  }

  // ── Inventory ─────────────────────────────────────────────────────────────
  const inventoryData = [
    {
      id: "saree_1",
      companyId: "company_1",
      name: "Kanjivaram Silk Saree with Gold Zari",
      category: "Silk Sarees",
      designNo: "KV-001",
      color: "Ruby Red",
      purchaseRate: 15000,
      saleRate: 22000,
      gstPercent: 5,
      rackLocation: "A-1",
      stockQuantity: 45,
      hsnCode: "5007",
      reorderLevel: 10,
    },
    {
      id: "saree_2",
      companyId: "company_1",
      name: "Banarasi Georgette Saree",
      category: "Silk Sarees",
      designNo: "BN-045",
      color: "Emerald Green",
      purchaseRate: 8500,
      saleRate: 12500,
      gstPercent: 5,
      rackLocation: "A-2",
      stockQuantity: 30,
      hsnCode: "5007",
      reorderLevel: 8,
    },
    {
      id: "saree_3",
      companyId: "company_1",
      name: "Chettinad Cotton Daily Wear",
      category: "Cotton Sarees",
      designNo: "CT-892",
      color: "Mustard Yellow",
      purchaseRate: 1200,
      saleRate: 1800,
      gstPercent: 5,
      rackLocation: "B-1",
      stockQuantity: 120,
      hsnCode: "5208",
      reorderLevel: 25,
    },
    {
      id: "saree_4",
      companyId: "company_1",
      name: "Bridal Lehenga Saree Heavy Work",
      category: "Wedding Collection",
      designNo: "WD-005",
      color: "Maroon & Gold",
      purchaseRate: 25000,
      saleRate: 45000,
      gstPercent: 12,
      rackLocation: "Premium-1",
      stockQuantity: 8,
      hsnCode: "6217",
      reorderLevel: 3,
    },
    {
      id: "saree_5",
      companyId: "company_1",
      name: "Chanderi Handloom Silk",
      category: "Silk Sarees",
      designNo: "CH-332",
      color: "Pastel Blue",
      purchaseRate: 4500,
      saleRate: 7200,
      gstPercent: 5,
      rackLocation: "C-4",
      stockQuantity: 50,
      hsnCode: "5007",
      reorderLevel: 12,
    },
    {
      id: "saree_6",
      companyId: "company_1",
      name: "Designer Georgette with Sequin Work",
      category: "Designer Sarees",
      designNo: "DG-991",
      color: "Midnight Black",
      purchaseRate: 6000,
      saleRate: 9500,
      gstPercent: 5,
      rackLocation: "D-2",
      stockQuantity: 25,
      hsnCode: "6217",
      reorderLevel: 6,
    },
    {
      id: "saree_7",
      companyId: "company_1",
      name: "Patola Double Ikat Silk",
      category: "Silk Sarees",
      designNo: "PT-112",
      color: "Peacock Blue",
      purchaseRate: 18000,
      saleRate: 28000,
      gstPercent: 5,
      rackLocation: "A-3",
      stockQuantity: 18,
      hsnCode: "5007",
      reorderLevel: 5,
    },
    {
      id: "saree_8",
      companyId: "company_1",
      name: "Tussar Silk Printed",
      category: "Silk Sarees",
      designNo: "TS-223",
      color: "Natural Ivory",
      purchaseRate: 3200,
      saleRate: 5000,
      gstPercent: 5,
      rackLocation: "B-3",
      stockQuantity: 7,
      hsnCode: "5007",
      reorderLevel: 10,
    },
    {
      id: "saree_9",
      companyId: "company_1",
      name: "Kerala Kasavu Cotton",
      category: "Cotton Sarees",
      designNo: "KL-445",
      color: "Off White & Gold",
      purchaseRate: 2800,
      saleRate: 4200,
      gstPercent: 5,
      rackLocation: "B-2",
      stockQuantity: 35,
      hsnCode: "5208",
      reorderLevel: 15,
    },
    {
      id: "saree_10",
      companyId: "company_1",
      name: "Bomkai Silk Festival",
      category: "Festival Collection",
      designNo: "BK-778",
      color: "Deep Saffron",
      purchaseRate: 9500,
      saleRate: 14500,
      gstPercent: 5,
      rackLocation: "C-1",
      stockQuantity: 22,
      hsnCode: "5007",
      reorderLevel: 8,
    },
  ];

  for (const item of inventoryData) {
    await db.insert(inventoryItems).values(item).onConflictDoNothing();
  }

  // ── Users ──────────────────────────────────────────────────────────────────
  const usersData = [
    {
      id: "usr_owner",
      username: "owner",
      passwordHash: hashPassword("owner123"),
      name: "Shubh Owner",
      role: "owner" as const,
      companyId: "company_1",
    },
    {
      id: "usr_accountant",
      username: "accountant",
      passwordHash: hashPassword("accountant123"),
      name: "Ramesh Kumar",
      role: "accountant" as const,
      companyId: "company_1",
    },
    {
      id: "usr_auditor",
      username: "auditor",
      passwordHash: hashPassword("auditor123"),
      name: "CA Verma",
      role: "auditor" as const,
      companyId: "company_1",
    },
  ];

  for (const user of usersData) {
    await db.insert(users).values(user).onConflictDoNothing();
  }

  console.log("✅ Seeding complete!");
  console.log(`   ✓ 1 company`);
  console.log(`   ✓ ${ledgerData.length} ledgers`);
  console.log(`   ✓ ${inventoryData.length} inventory items`);
  console.log(`   ✓ ${usersData.length} users`);
}

main().catch((e) => {
  console.error("❌ Seeding failed", e);
  process.exit(1);
});
