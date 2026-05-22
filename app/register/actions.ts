"use server";

import { db, users, eq } from "@/lib/database";
import { hashPassword } from "@/lib/auth";
import { getClientIp, checkRateLimit } from "@/lib/rate-limit";

// Regular expressions for secure validation
const USERNAME_REGEX = /^[a-zA-Z0-9_-]{3,20}$/;
const PASSWORD_LETTER_REGEX = /[a-zA-Z]/;
const PASSWORD_NUMBER_REGEX = /[0-9]/;

export interface RegisterResult {
  success: boolean;
  error?: string;
}

export async function registerAction(data: {
  username: string;
  name: string;
  password: string;
}): Promise<RegisterResult> {
  try {
    const { username, name, password } = data;

    // 1. Basic validation
    if (!username || !name || !password) {
      return { success: false, error: "All fields are required" };
    }

    const cleanUsername = username.toLowerCase().trim();
    const cleanName = name.trim();

    // 2. Validate name length
    if (cleanName.length < 2 || cleanName.length > 50) {
      return { success: false, error: "Name must be between 2 and 50 characters" };
    }

    // 3. Validate username pattern
    if (!USERNAME_REGEX.test(cleanUsername)) {
      return {
        success: false,
        error: "Username must be 3-20 characters long and contain only letters, numbers, underscores, or hyphens",
      };
    }

    // 4. Validate password strength
    if (password.length < 8) {
      return { success: false, error: "Password must be at least 8 characters long" };
    }
    if (!PASSWORD_LETTER_REGEX.test(password) || !PASSWORD_NUMBER_REGEX.test(password)) {
      return {
        success: false,
        error: "Password must contain at least one letter and one number for secure access",
      };
    }

    // 5. Apply Rate Limiting (5 registrations per IP per hour)
    const ip = await getClientIp();
    const rateLimitKey = `register:ip:${ip}`;
    const rateLimit = await checkRateLimit(rateLimitKey, 5, 3600000);

    if (rateLimit.limited) {
      const minutesLeft = Math.ceil((rateLimit.resetAt.getTime() - Date.now()) / 60000);
      return {
        success: false,
        error: `Too many registration attempts. Please try again in ${minutesLeft} minutes.`,
      };
    }

    // 6. Check if username is already taken
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.username, cleanUsername))
      .limit(1);

    if (existingUser) {
      return { success: false, error: "Username is already taken" };
    }

    // 7. Hash password securely using PBKDF2
    const passwordHash = hashPassword(password);

    // 8. Insert new user into database
    await db.insert(users).values({
      id: crypto.randomUUID(),
      username: cleanUsername,
      name: cleanName,
      passwordHash,
      role: "accountant", // Default role
      companyId: null, // Assigned later during company setup or invitation
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return { success: true };
  } catch (error) {
    console.error("Registration failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error during registration",
    };
  }
}
