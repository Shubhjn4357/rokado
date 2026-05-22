"use server";

import { db, users, eq } from "@/lib/database";
import { verifyPassword, setSession, destroySession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function loginAction(data: { username: string; password: string }) {
  try {
    const { username, password } = data;

    if (!username || !password) {
      return { success: false, error: "Username and password are required" };
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
