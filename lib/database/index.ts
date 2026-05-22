import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "./schema";

const isRemoteSync = process.env.REMOTE_SYNC_ENABLED === "true";
const url = isRemoteSync
  ? (process.env.REMOTE_SYNC_URL || process.env.DATABASE_URL || "file:lib/database/local.db")
  : (process.env.DATABASE_URL || "file:lib/database/local.db");

const authToken = isRemoteSync
  ? (process.env.REMOTE_SYNC_TOKEN || process.env.DATABASE_AUTH_TOKEN)
  : process.env.DATABASE_AUTH_TOKEN;

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
  rateLimits,
} from "./schema";
export * from "drizzle-orm";
