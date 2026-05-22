import { db, rateLimits, eq } from "./database";
import { headers } from "next/headers";

/**
 * Retrieve the client's IP address from request headers
 */
export async function getClientIp(): Promise<string> {
  try {
    const headersList = await headers();
    const forwardedFor = headersList.get("x-forwarded-for");
    if (forwardedFor) {
      // Get the first IP in the comma-separated list
      const ip = forwardedFor.split(",")[0].trim();
      if (ip) return ip;
    }
    const realIp = headersList.get("x-real-ip");
    if (realIp) return realIp.trim();
  } catch (error) {
    // Fallback if headers are not available (e.g. static rendering)
  }
  return "127.0.0.1";
}

export interface RateLimitResult {
  limited: boolean;
  remaining: number;
  resetAt: Date;
}

/**
 * Sliding-window rate limit check using the database to sustain serverless context
 * @param key Unique key to identify the request source (e.g., `ip:${ip}:action`)
 * @param limit Maximum number of requests allowed within the window
 * @param windowMs The window duration in milliseconds
 */
export async function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  const now = Date.now();

  try {
    // Query rate limit record
    const [record] = await db
      .select()
      .from(rateLimits)
      .where(eq(rateLimits.key, key))
      .limit(1);

    if (!record) {
      // Create new window
      const resetAtTime = now + windowMs;
      await db.insert(rateLimits).values({
        id: crypto.randomUUID(),
        key,
        count: 1,
        resetAt: resetAtTime,
      });

      return {
        limited: false,
        remaining: limit - 1,
        resetAt: new Date(resetAtTime),
      };
    }

    if (now > record.resetAt) {
      // Window expired, reset
      const resetAtTime = now + windowMs;
      await db
        .update(rateLimits)
        .set({
          count: 1,
          resetAt: resetAtTime,
        })
        .where(eq(rateLimits.key, key));

      return {
        limited: false,
        remaining: limit - 1,
        resetAt: new Date(resetAtTime),
      };
    }

    if (record.count >= limit) {
      // Limit exceeded
      return {
        limited: true,
        remaining: 0,
        resetAt: new Date(record.resetAt),
      };
    }

    // Increment request count
    const nextCount = record.count + 1;
    await db
      .update(rateLimits)
      .set({
        count: nextCount,
      })
      .where(eq(rateLimits.key, key));

    return {
      limited: false,
      remaining: limit - nextCount,
      resetAt: new Date(record.resetAt),
    };
  } catch (error) {
    // Fail-open in case of database errors to avoid blocking authentic users
    console.error("Rate limiter database error:", error);
    return {
      limited: false,
      remaining: 1,
      resetAt: new Date(now + windowMs),
    };
  }
}
