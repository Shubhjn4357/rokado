import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "./schema";

// Ensure this environment variable is set in the consumer apps
const url = process.env.DATABASE_URL || "file:lib/database/local.db";
const authToken = process.env.DATABASE_AUTH_TOKEN;

const client = createClient({
  url,
  authToken,
});

export const db = drizzle(client, { schema });

export * from "./schema";
export {
  companies,
  ledgers,
  ledgerBalances,
  vouchers,
  voucherEntries,
  inventoryItems,
  stockMovements,
  auditLog,
  syncQueue,
  users,
} from "./schema";
export * from "drizzle-orm";
