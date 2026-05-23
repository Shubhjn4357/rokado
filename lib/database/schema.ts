import { sqliteTable, text, integer, real, index, uniqueIndex } from "drizzle-orm/sqlite-core";

// ─── Companies ───────────────────────────────────────────────────────────────
export const companies = sqliteTable("companies", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  gstin: text("gstin"),
  pan: text("pan"),
  address: text("address"),
  city: text("city"),
  state: text("state"),
  pincode: text("pincode"),
  phone: text("phone"),
  email: text("email"),
  fiscalYearStart: integer("fiscal_year_start").notNull().$defaultFn(() => {
    const now = new Date();
    const year = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
    return new Date(year, 3, 1).getTime(); // April 1
  }),
  businessType: text("business_type").notNull().default("wholesale_"),
  createdAt: integer("created_at").notNull().$defaultFn(() => Date.now()),
  updatedAt: integer("updated_at").notNull().$defaultFn(() => Date.now()),
});

// ─── Ledgers ─────────────────────────────────────────────────────────────────
export const ledgers = sqliteTable(
  "ledgers",
  {
    id: text("id").primaryKey(),
    companyId: text("company_id").references(() => companies.id),
    name: text("name").notNull(),
    group: text("group").notNull(), // "sundry_debtors", "sundry_creditors", "bank", "cash", "sales", "purchase", "expenses", "capital", "duties_taxes"
    gstNumber: text("gst_number"),
    pan: text("pan"),
    address: text("address"),
    phone: text("phone"),
    creditLimit: real("credit_limit").default(0),
    openingBalance: real("opening_balance").notNull().default(0),
    balanceType: text("balance_type").notNull().default("dr"), // "dr" | "cr"
    isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
    createdAt: integer("created_at").notNull().$defaultFn(() => Date.now()),
    updatedAt: integer("updated_at").notNull().$defaultFn(() => Date.now()),
  },
  (table) => ({
    nameIdx: index("ledger_name_idx").on(table.name),
    groupIdx: index("ledger_group_idx").on(table.group),
    companyIdx: index("ledger_company_idx").on(table.companyId),
  })
);

// ─── Ledger Balances (materialized) ──────────────────────────────────────────
export const ledgerBalances = sqliteTable(
  "ledger_balances",
  {
    id: text("id").primaryKey(),
    ledgerId: text("ledger_id").notNull().references(() => ledgers.id),
    fiscalYear: text("fiscal_year").notNull(), // "2025-26"
    month: integer("month").notNull(), // 1-12
    debit: real("debit").notNull().default(0),
    credit: real("credit").notNull().default(0),
    closing: real("closing").notNull().default(0),
  },
  (table) => ({
    ledgerYearMonthIdx: uniqueIndex("ledger_year_month_idx").on(table.ledgerId, table.fiscalYear, table.month),
  })
);

// ─── Vouchers ────────────────────────────────────────────────────────────────
export const vouchers = sqliteTable(
  "vouchers",
  {
    id: text("id").primaryKey(),
    companyId: text("company_id").references(() => companies.id),
    type: text("type").notNull(), // "sales" | "purchase" | "payment" | "receipt" | "contra" | "journal" | "challan"
    number: text("number"), // INV-001, PUR-001 etc. CHL-001 for challan
    date: integer("date").notNull(),
    partyLedgerId: text("party_ledger_id").references(() => ledgers.id),
    reference: text("reference"),
    narration: text("narration"),
    totalAmount: real("total_amount").notNull(),
    gstTotal: real("gst_total").notNull().default(0),
    grandTotal: real("grand_total").notNull().default(0),
    status: text("status").notNull().default("posted"), // "draft" | "posted" | "cancelled"
    // Challan specific fields
    transportName: text("transport_name"),
    lrNumber: text("lr_number"),
    dispatchDate: integer("dispatch_date"),
    freightAmount: real("freight_amount").default(0),
    idempotencyKey: text("idempotency_key"),
    createdAt: integer("created_at").notNull().$defaultFn(() => Date.now()),
    updatedAt: integer("updated_at").notNull().$defaultFn(() => Date.now()),
  },
  (table) => ({
    dateIdx: index("voucher_date_idx").on(table.date),
    typeIdx: index("voucher_type_idx").on(table.type),
    companyIdx: index("voucher_company_idx").on(table.companyId),
    idempotencyIdx: uniqueIndex("voucher_idempotency_idx").on(table.idempotencyKey),
  })
);

// ─── Voucher Entries (double-entry lines) ────────────────────────────────────
export const voucherEntries = sqliteTable(
  "voucher_entries",
  {
    id: text("id").primaryKey(),
    voucherId: text("voucher_id").notNull().references(() => vouchers.id),
    ledgerId: text("ledger_id").notNull().references(() => ledgers.id),
    type: text("type").notNull(), // "dr" | "cr"
    amount: real("amount").notNull(),
    inventoryItemId: text("inventory_item_id").references(() => inventoryItems.id),
    quantity: real("quantity"),
    rate: real("rate"),
    narration: text("narration"),
  },
  (table) => ({
    voucherIdx: index("entry_voucher_idx").on(table.voucherId),
    ledgerIdx: index("entry_ledger_idx").on(table.ledgerId),
    inventoryItemIdx: index("entry_inventory_item_idx").on(table.inventoryItemId),
  })
);

// ─── Inventory Items ─────────────────────────────────────────────────────────
export const inventoryItems = sqliteTable(
  "inventory_items",
  {
    id: text("id").primaryKey(),
    companyId: text("company_id").references(() => companies.id),
    name: text("name").notNull(),
    category: text("category").notNull(),
    designNo: text("design_no"),
    color: text("color"),
    purchaseRate: real("purchase_rate").notNull(),
    saleRate: real("sale_rate").notNull(),
    gstPercent: real("gst_percent").notNull(),
    rackLocation: text("rack_location"),
    stockQuantity: real("stock_quantity").notNull().default(0),
    unit: text("unit").notNull().default("pcs"),
    hsnCode: text("hsn_code"),
    barcode: text("barcode"),
    reorderLevel: real("reorder_level").default(10),
    createdAt: integer("created_at").notNull().$defaultFn(() => Date.now()),
    updatedAt: integer("updated_at").notNull().$defaultFn(() => Date.now()),
  },
  (table) => ({
    categoryIdx: index("item_category_idx").on(table.category),
    nameIdx: index("item_name_idx").on(table.name),
    companyIdx: index("item_company_idx").on(table.companyId),
  })
);

// ─── Stock Movements ──────────────────────────────────────────────────────────
export const stockMovements = sqliteTable(
  "stock_movements",
  {
    id: text("id").primaryKey(),
    itemId: text("item_id").notNull().references(() => inventoryItems.id),
    voucherId: text("voucher_id").references(() => vouchers.id),
    type: text("type").notNull(), // "in" | "out" | "adjustment"
    quantity: real("quantity").notNull(),
    rate: real("rate").notNull(),
    date: integer("date").notNull(),
    narration: text("narration"),
    createdAt: integer("created_at").notNull().$defaultFn(() => Date.now()),
  },
  (table) => ({
    itemIdx: index("stock_item_idx").on(table.itemId),
    dateIdx: index("stock_date_idx").on(table.date),
  })
);

// ─── Audit Log ────────────────────────────────────────────────────────────────
export const auditLog = sqliteTable(
  "audit_log",
  {
    id: text("id").primaryKey(),
    entity: text("entity").notNull(), // "voucher" | "ledger" | "inventory"
    entityId: text("entity_id").notNull(),
    action: text("action").notNull(), // "create" | "update" | "delete" | "cancel"
    before: text("before"), // JSON string
    after: text("after"),   // JSON string
    userId: text("user_id"),
    deviceId: text("device_id"),
    createdAt: integer("created_at").notNull().$defaultFn(() => Date.now()),
  },
  (table) => ({
    entityIdx: index("audit_entity_idx").on(table.entity, table.entityId),
    createdIdx: index("audit_created_idx").on(table.createdAt),
  })
);

// ─── Sync Queue ───────────────────────────────────────────────────────────────
export const syncQueue = sqliteTable(
  "sync_queue",
  {
    id: text("id").primaryKey(),
    entity: text("entity").notNull(),
    action: text("action").notNull(),
    payload: text("payload").notNull(), // JSON string
    status: text("status").notNull().default("pending"), // "pending" | "retry" | "completed" | "dead"
    retries: integer("retries").notNull().default(0),
    createdAt: integer("created_at").notNull().$defaultFn(() => Date.now()),
    processedAt: integer("processed_at"),
  },
  (table) => ({
    statusIdx: index("sync_status_idx").on(table.status),
  })
);

// ─── Users & Auth ────────────────────────────────────────────────────────────
export const users = sqliteTable(
  "users",
  {
    id: text("id").primaryKey(),
    username: text("username").notNull(),
    passwordHash: text("password_hash").notNull(),
    name: text("name").notNull(),
    role: text("role").notNull().default("accountant"), // "owner" | "accountant" | "auditor"
    companyId: text("company_id").references(() => companies.id),
    createdAt: integer("created_at").notNull().$defaultFn(() => Date.now()),
    updatedAt: integer("updated_at").notNull().$defaultFn(() => Date.now()),
  },
  (table) => ({
    usernameIdx: uniqueIndex("user_username_idx").on(table.username),
  })
);

export const companyMembers = sqliteTable(
  "company_members",
  {
    id: text("id").primaryKey(),
    companyId: text("company_id").notNull().references(() => companies.id),
    userId: text("user_id").notNull().references(() => users.id),
    role: text("role").notNull().default("accountant"), // "owner" | "accountant" | "auditor"
    createdAt: integer("created_at").notNull().$defaultFn(() => Date.now()),
  },
  (table) => ({
    compUserIdx: uniqueIndex("comp_user_idx").on(table.companyId, table.userId),
  })
);


// ─── Rate Limiter ────────────────────────────────────────────────────────────
export const rateLimits = sqliteTable(
  "rate_limits",
  {
    id: text("id").primaryKey(),
    key: text("key").notNull(),
    count: integer("count").notNull().default(0),
    resetAt: integer("reset_at").notNull(),
  },
  (table) => ({
    keyIdx: uniqueIndex("rate_limit_key_idx").on(table.key),
  })
);

