import type { Config } from "drizzle-kit";

const url = process.env.DATABASE_URL || "file:lib/database/local.db";
const isRemote = url.startsWith("libsql://") || url.startsWith("https://");

const config = isRemote
  ? ({
      schema: "./lib/database/schema.ts",
      out: "./drizzle",
      dialect: "turso",
      dbCredentials: {
        url,
        authToken: process.env.DATABASE_AUTH_TOKEN,
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
