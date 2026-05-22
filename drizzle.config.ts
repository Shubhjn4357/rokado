import type { Config } from "drizzle-kit";

const isRemoteSync = process.env.REMOTE_SYNC_ENABLED === "true";
const url = isRemoteSync
  ? (process.env.REMOTE_SYNC_URL || process.env.DATABASE_URL || "file:lib/database/local.db")
  : (process.env.DATABASE_URL || "file:lib/database/local.db");

const authToken = isRemoteSync
  ? (process.env.REMOTE_SYNC_TOKEN || process.env.DATABASE_AUTH_TOKEN)
  : process.env.DATABASE_AUTH_TOKEN;

const isRemote = url.startsWith("libsql://") || url.startsWith("https://");

const config = isRemote
  ? ({
      schema: "./lib/database/schema.ts",
      out: "./drizzle",
      dialect: "turso",
      dbCredentials: {
        url,
        authToken,
      },
    } satisfies Config)
  : ({
      schema: "./lib/database/schema.ts",
      out: "./drizzle",
      dialect: "sqlite",
      dbCredentials: {
        url,
      },
    } satisfies Config);

export default config;
