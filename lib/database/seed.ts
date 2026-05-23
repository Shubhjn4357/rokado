import { db } from "./index";
import {
  companies,
  ledgers,
  inventoryItems,
  users,
  voucherEntries,
  stockMovements,
  vouchers,
  ledgerBalances,
  syncQueue,
  auditLog,
  companyMembers,
  rateLimits,
} from "./schema";
import { hashPassword } from "../auth";

async function main() {
  console.log("🌱 Purging old records from local database...");
  try {
    // Delete in reverse dependency order
    await db.delete(rateLimits);
    await db.delete(companyMembers);
    await db.delete(syncQueue);
    await db.delete(auditLog);
    await db.delete(stockMovements);
    await db.delete(voucherEntries);
    await db.delete(vouchers);
    await db.delete(ledgerBalances);
    await db.delete(users);
    await db.delete(ledgers);
    await db.delete(inventoryItems);
    await db.delete(companies);
  } catch (err) {
    console.warn("Could not delete old tables:", err);
  }

  console.log("🌱 Seeding ERP database with real data...");

  // ── Company ──────────────────────────────────────────────────────────────
  await db.insert(companies).values({
    id: "company_1",
    name: "  House",
    gstin: "27AAACS1429B1ZB",
    pan: "AAACS1429B",
    address: "145,  Market, Chandni Chowk",
    city: "Delhi",
    state: "Delhi",
    pincode: "110006",
    phone: "9876543210",
    email: "info@.in",
    businessType: "wholesale_",
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
    { id: "led_raj_tex", companyId: "company_1", name: "Raj Enterprises", group: "sundry_debtors", gstNumber: "07AACCR1234B1ZD", phone: "9811001122", openingBalance: 245000, balanceType: "dr" as const, creditLimit: 500000 },
    { id: "led_maa_sari", companyId: "company_1", name: "Maa Distributors", group: "sundry_debtors", gstNumber: "09AACCM5678C1ZA", phone: "9822003344", openingBalance: 85000, balanceType: "dr" as const, creditLimit: 300000 },
    { id: "led_bombay_silk", companyId: "company_1", name: "Bombay Tech Solutions", group: "sundry_debtors", gstNumber: "27AACCB2345D1ZP", phone: "9833005566", openingBalance: 320000, balanceType: "dr" as const, creditLimit: 600000 },
    { id: "led_annapurna", companyId: "company_1", name: "Annapurna General Store", group: "sundry_debtors", phone: "9844007788", openingBalance: 45000, balanceType: "dr" as const },

    // Creditors (Suppliers)
    { id: "led_kanjivaram_mills", companyId: "company_1", name: "Standard Furniture Systems", group: "sundry_creditors", gstNumber: "33AACCK9012E1ZQ", phone: "9855009900", openingBalance: 180000, balanceType: "cr" as const },
    { id: "led_banarasi_weavers", companyId: "company_1", name: "Apex Hardware Hub", group: "sundry_creditors", gstNumber: "09AACCB6789F1ZR", phone: "9866001122", openingBalance: 95000, balanceType: "cr" as const },

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
      id: "_1",
      companyId: "company_1",
      name: "Executive Ergonomic Office Chair",
      category: "Office Furniture",
      designNo: "OC-402",
      color: "Charcoal Black",
      purchaseRate: 4500,
      saleRate: 7500,
      gstPercent: 18,
      rackLocation: "Furn-A1",
      stockQuantity: 45,
      hsnCode: "9403",
      reorderLevel: 10,
    },
    {
      id: "_2",
      companyId: "company_1",
      name: "Ultra-Wide 34-Inch Curved Monitor",
      category: "Electronics",
      designNo: "MON-34W",
      color: "Titanium Grey",
      purchaseRate: 8500,
      saleRate: 12500,
      gstPercent: 18,
      rackLocation: "Elec-A2",
      stockQuantity: 30,
      hsnCode: "8528",
      reorderLevel: 8,
    },
    {
      id: "_3",
      companyId: "company_1",
      name: "Mechanical Gaming Keyboard RGB",
      category: "Computer Accessories",
      designNo: "KB-RGB80",
      color: "Matte Black",
      purchaseRate: 1200,
      saleRate: 1800,
      gstPercent: 18,
      rackLocation: "Acc-B1",
      stockQuantity: 120,
      hsnCode: "8471",
      reorderLevel: 25,
    },
    {
      id: "_4",
      companyId: "company_1",
      name: "Dual-Motor Smart Standing Desk",
      category: "Office Furniture",
      designNo: "SD-DM2",
      color: "Walnut & White",
      purchaseRate: 15000,
      saleRate: 22000,
      gstPercent: 18,
      rackLocation: "Furn-B2",
      stockQuantity: 8,
      hsnCode: "9403",
      reorderLevel: 3,
    },
    {
      id: "_5",
      companyId: "company_1",
      name: "Wireless Noise-Canceling Headphones",
      category: "Electronics",
      designNo: "HP-ANC90",
      color: "Silver Sand",
      purchaseRate: 3000,
      saleRate: 5200,
      gstPercent: 18,
      rackLocation: "Elec-C4",
      stockQuantity: 50,
      hsnCode: "8518",
      reorderLevel: 12,
    },
    {
      id: "_6",
      companyId: "company_1",
      name: "Portable SSD 2TB USB-C",
      category: "Storage Devices",
      designNo: "SSD-2TB",
      color: "Metallic Blue",
      purchaseRate: 6000,
      saleRate: 9500,
      gstPercent: 18,
      rackLocation: "Stor-D2",
      stockQuantity: 25,
      hsnCode: "8471",
      reorderLevel: 6,
    },
    {
      id: "_7",
      companyId: "company_1",
      name: "Smart Video Doorbell 2K",
      category: "Smart Home",
      designNo: "DB-2K",
      color: "Glossy Black",
      purchaseRate: 4000,
      saleRate: 6500,
      gstPercent: 12,
      rackLocation: "Sec-A3",
      stockQuantity: 18,
      hsnCode: "8517",
      reorderLevel: 5,
    },
    {
      id: "_8",
      companyId: "company_1",
      name: "Ergonomic Memory Foam Wrist Rest",
      category: "Computer Accessories",
      designNo: "WR-MF1",
      color: "Space Grey",
      purchaseRate: 400,
      saleRate: 750,
      gstPercent: 18,
      rackLocation: "Acc-B3",
      stockQuantity: 7,
      hsnCode: "3926",
      reorderLevel: 10,
    },
    {
      id: "_9",
      companyId: "company_1",
      name: "HD Web Camera with Microphone",
      category: "Electronics",
      designNo: "CAM-1080",
      color: "Piano Black",
      purchaseRate: 2800,
      saleRate: 4200,
      gstPercent: 18,
      rackLocation: "Elec-B2",
      stockQuantity: 35,
      hsnCode: "8525",
      reorderLevel: 15,
    },
    {
      id: "_10",
      companyId: "company_1",
      name: "Heavy Duty Steel Safe Vault",
      category: "Office Security",
      designNo: "SV-HD5",
      color: "Granite Grey",
      purchaseRate: 9500,
      saleRate: 14500,
      gstPercent: 18,
      rackLocation: "Sec-C1",
      stockQuantity: 22,
      hsnCode: "8303",
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
