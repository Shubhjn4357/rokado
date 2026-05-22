"use server";

import { db, users, eq } from "@/lib/database";
import { verifyPassword, setSession, destroySession } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { getClientIp, checkRateLimit } from "@/lib/rate-limit";

export async function loginAction(data: { username: string; password: string }) {
  try {
    const { username, password } = data;

    if (!username || !password) {
      return { success: false, error: "Username and password are required" };
    }

    // Apply Rate Limiting (10 attempts per IP per hour)
    const ip = await getClientIp();
    const rateLimitKey = `login:ip:${ip}`;
    const rateLimit = await checkRateLimit(rateLimitKey, 10, 3600000);
    
    if (rateLimit.limited) {
      const minutesLeft = Math.ceil((rateLimit.resetAt.getTime() - Date.now()) / 60000);
      return {
        success: false,
        error: `Too many login attempts. Please try again in ${minutesLeft} minutes.`,
      };
    }

    // Find the user by username
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.username, username.toLowerCase().trim()))
      .limit(1);

    if (!user) {
      return { success: false, error: "Invalid username or password" };
    }

    // Verify the password
    const isPasswordValid = verifyPassword(password, user.passwordHash);
    if (!isPasswordValid) {
      return { success: false, error: "Invalid username or password" };
    }

    // Set the session cookie
    await setSession({
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role as "owner" | "accountant" | "auditor",
      companyId: user.companyId,
    });

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Login failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error during login",
    };
  }
}

export async function logoutAction() {
  await destroySession();
  revalidatePath("/");
  return { success: true };
}
