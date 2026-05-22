"use server";

import { db, users, eq } from "@/lib/database";
import { getSession, setSession, verifyPassword, hashPassword } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function updateProfileAction(name: string) {
  try {
    const session = await getSession();
    if (!session) return { success: false, error: "Not authenticated" };

    const trimmedName = name.trim();
    if (trimmedName.length < 2 || trimmedName.length > 50) {
      return { success: false, error: "Name must be between 2 and 50 characters" };
    }

    // 1. Update users table
    await db
      .update(users)
      .set({
        name: trimmedName,
        updatedAt: Date.now(),
      })
      .where(eq(users.id, session.id));

    // 2. Update session cookie
    await setSession({
      id: session.id,
      username: session.username,
      name: trimmedName,
      role: session.role,
      companyId: session.companyId,
    });

    revalidatePath("/settings");
    return { success: true };
  } catch (error) {
    console.error("Failed to update profile:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update profile",
    };
  }
}

export async function changePasswordAction(data: {
  currentPass: string;
  newPass: string;
}) {
  try {
    const session = await getSession();
    if (!session) return { success: false, error: "Not authenticated" };

    const { currentPass, newPass } = data;
    if (!currentPass || !newPass) {
      return { success: false, error: "Both current and new passwords are required" };
    }

    if (newPass.length < 8) {
      return { success: false, error: "New password must be at least 8 characters long" };
    }

    // 1. Fetch user to verify current password
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, session.id))
      .limit(1);

    if (!user) {
      return { success: false, error: "User not found" };
    }

    const isPasswordValid = verifyPassword(currentPass, user.passwordHash);
    if (!isPasswordValid) {
      return { success: false, error: "Current password is incorrect" };
    }

    // 2. Hash and save new password
    const newPasswordHash = hashPassword(newPass);
    await db
      .update(users)
      .set({
        passwordHash: newPasswordHash,
        updatedAt: Date.now(),
      })
      .where(eq(users.id, session.id));

    return { success: true };
  } catch (error) {
    console.error("Failed to change password:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to change password",
    };
  }
}
