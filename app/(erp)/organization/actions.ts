"use server";

import { db, companies, companyMembers, users, ledgers, vouchers, voucherEntries, inventoryItems, stockMovements, ledgerBalances, and, eq, inArray } from "@/lib/database";
import { getSession, setSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function getUserCompaniesAction() {
  try {
    const session = await getSession();
    if (!session) return [];

    // Query companies joined through companyMembers
    const memberships = await db
      .select({
        id: companies.id,
        name: companies.name,
        role: companyMembers.role,
      })
      .from(companyMembers)
      .innerJoin(companies, eq(companies.id, companyMembers.companyId))
      .where(eq(companyMembers.userId, session.id));

    return memberships;
  } catch (error) {
    console.error("Failed to fetch user companies:", error);
    return [];
  }
}

export async function switchActiveCompanyAction(companyId: string) {
  try {
    const session = await getSession();
    if (!session) return { success: false, error: "Not authenticated" };

    // 1. Verify that the user has a valid membership in the target company
    const [membership] = await db
      .select()
      .from(companyMembers)
      .where(
        and(
          eq(companyMembers.companyId, companyId),
          eq(companyMembers.userId, session.id)
        )
      )
      .limit(1);

    if (!membership) {
      return { success: false, error: "You are not a member of this organization" };
    }

    // 2. Update user's active company and role in the database
    await db
      .update(users)
      .set({
        companyId,
        role: membership.role as "owner" | "accountant" | "auditor",
        updatedAt: Date.now(),
      })
      .where(eq(users.id, session.id));

    // 3. Update the user session cookie
    await setSession({
      id: session.id,
      username: session.username,
      name: session.name,
      role: membership.role as "owner" | "accountant" | "auditor",
      companyId: companyId,
    });

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Failed to switch company:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to switch organization",
    };
  }
}

export async function getOrganizationMembersAction() {
  try {
    const session = await getSession();
    if (!session || !session.companyId) {
      return [];
    }

    // Get all members of the currently active company
    const members = await db
      .select({
        id: users.id,
        name: users.name,
        username: users.username,
        role: companyMembers.role,
        joinedAt: companyMembers.createdAt,
      })
      .from(companyMembers)
      .innerJoin(users, eq(users.id, companyMembers.userId))
      .where(eq(companyMembers.companyId, session.companyId));

    return members;
  } catch (error) {
    console.error("Failed to fetch organization members:", error);
    return [];
  }
}

export async function inviteMemberAction(username: string, role: "owner" | "accountant" | "auditor") {
  try {
    const session = await getSession();
    if (!session || !session.companyId) {
      return { success: false, error: "Not authenticated" };
    }

    // Only owners can invite members
    if (session.role !== "owner") {
      return { success: false, error: "Only organization Owners can invite members" };
    }

    // Find the target user by username
    const [targetUser] = await db
      .select()
      .from(users)
      .where(eq(users.username, username.toLowerCase().trim()))
      .limit(1);

    if (!targetUser) {
      return { success: false, error: "User not found. Please verify the username." };
    }

    // Check if the user is already a member
    const [existingMembership] = await db
      .select()
      .from(companyMembers)
      .where(
        and(
          eq(companyMembers.companyId, session.companyId),
          eq(companyMembers.userId, targetUser.id)
        )
      )
      .limit(1);

    if (existingMembership) {
      return { success: false, error: "User is already a member of this organization" };
    }

    // Add member
    await db.insert(companyMembers).values({
      id: crypto.randomUUID(),
      companyId: session.companyId,
      userId: targetUser.id,
      role: role,
      createdAt: Date.now(),
    });

    // If the invited user has no active company, assign this one
    if (!targetUser.companyId) {
      await db
        .update(users)
        .set({
          companyId: session.companyId,
          role: role,
          updatedAt: Date.now(),
        })
        .where(eq(users.id, targetUser.id));
    }

    revalidatePath("/settings");
    return { success: true };
  } catch (error) {
    console.error("Failed to invite member:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to invite member",
    };
  }
}

export async function updateMemberRoleAction(userId: string, role: "owner" | "accountant" | "auditor") {
  try {
    const session = await getSession();
    if (!session || !session.companyId) {
      return { success: false, error: "Not authenticated" };
    }

    // Only owners can edit roles
    if (session.role !== "owner") {
      return { success: false, error: "Only organization Owners can manage roles" };
    }

    // Don't allow changing one's own role (safety rule to prevent locking oneself out)
    if (userId === session.id) {
      return { success: false, error: "You cannot modify your own role" };
    }

    // Update role in membership table
    await db
      .update(companyMembers)
      .set({ role })
      .where(
        and(
          eq(companyMembers.companyId, session.companyId),
          eq(companyMembers.userId, userId)
        )
      );

    // Update active role if the user currently has this company active
    const [targetUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (targetUser && targetUser.companyId === session.companyId) {
      await db
        .update(users)
        .set({ role, updatedAt: Date.now() })
        .where(eq(users.id, userId));
    }

    revalidatePath("/settings");
    return { success: true };
  } catch (error) {
    console.error("Failed to update role:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update role",
    };
  }
}

export async function removeMemberAction(userId: string) {
  try {
    const session = await getSession();
    if (!session || !session.companyId) {
      return { success: false, error: "Not authenticated" };
    }

    // Only owners can remove members
    if (session.role !== "owner") {
      return { success: false, error: "Only organization Owners can remove members" };
    }

    // Don't allow removing oneself
    if (userId === session.id) {
      return { success: false, error: "You cannot remove yourself from your own organization" };
    }

    // Delete membership
    await db
      .delete(companyMembers)
      .where(
        and(
          eq(companyMembers.companyId, session.companyId),
          eq(companyMembers.userId, userId)
        )
      );

    // If this was the user's active company, reset it
    const [targetUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (targetUser && targetUser.companyId === session.companyId) {
      // Find another company they belong to
      const [anotherMembership] = await db
        .select()
        .from(companyMembers)
        .where(eq(companyMembers.userId, userId))
        .limit(1);

      await db
        .update(users)
        .set({
          companyId: anotherMembership?.companyId ?? null,
          role: (anotherMembership?.role as any) ?? "accountant",
          updatedAt: Date.now(),
        })
        .where(eq(users.id, userId));
    }

    revalidatePath("/settings");
    return { success: true };
  } catch (error) {
    console.error("Failed to remove member:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to remove member",
    };
  }
}

export async function deleteCompanyAction(targetCompanyId: string) {
  try {
    const session = await getSession();
    if (!session) return { success: false, error: "Not authenticated" };

    // 1. Verify that the user is an OWNER of this company
    const [membership] = await db
      .select()
      .from(companyMembers)
      .where(
        and(
          eq(companyMembers.companyId, targetCompanyId),
          eq(companyMembers.userId, session.id),
          eq(companyMembers.role, "owner")
        )
      )
      .limit(1);

    if (!membership) {
      return { success: false, error: "Only the Organization Owner can delete this workspace" };
    }

    // 2. Perform transactional cascading deletion
    await db.transaction(async (tx) => {
      // Find vouchers
      const companyVouchers = await tx
        .select({ id: vouchers.id })
        .from(vouchers)
        .where(eq(vouchers.companyId, targetCompanyId));
      const voucherIds = companyVouchers.map(v => v.id);

      // Find items
      const companyItems = await tx
        .select({ id: inventoryItems.id })
        .from(inventoryItems)
        .where(eq(inventoryItems.companyId, targetCompanyId));
      const itemIds = companyItems.map(i => i.id);

      // Delete voucher entries
      if (voucherIds.length > 0) {
        await tx.delete(voucherEntries).where(inArray(voucherEntries.voucherId, voucherIds));
      }

      // Delete stock movements
      if (itemIds.length > 0) {
        await tx.delete(stockMovements).where(inArray(stockMovements.itemId, itemIds));
      }
      if (voucherIds.length > 0) {
        await tx.delete(stockMovements).where(inArray(stockMovements.voucherId, voucherIds));
      }

      // Delete vouchers
      await tx.delete(vouchers).where(eq(vouchers.companyId, targetCompanyId));

      // Delete inventory items
      await tx.delete(inventoryItems).where(eq(inventoryItems.companyId, targetCompanyId));

      // Find ledgers
      const companyLedgers = await tx
        .select({ id: ledgers.id })
        .from(ledgers)
        .where(eq(ledgers.companyId, targetCompanyId));
      const ledgerIds = companyLedgers.map(l => l.id);

      // Delete ledger balances
      if (ledgerIds.length > 0) {
        await tx.delete(ledgerBalances).where(inArray(ledgerBalances.ledgerId, ledgerIds));
      }

      // Delete ledgers
      await tx.delete(ledgers).where(eq(ledgers.companyId, targetCompanyId));

      // Delete company members
      await tx.delete(companyMembers).where(eq(companyMembers.companyId, targetCompanyId));

      // Delete company record
      await tx.delete(companies).where(eq(companies.id, targetCompanyId));

      // 3. Re-route user's session active company if they deleted their active one
      if (session.companyId === targetCompanyId) {
        // Find another company they belong to
        const [anotherMembership] = await tx
          .select()
          .from(companyMembers)
          .where(eq(companyMembers.userId, session.id))
          .limit(1);

        const nextCompanyId = anotherMembership?.companyId ?? null;
        const nextRole = (anotherMembership?.role as any) ?? "accountant";

        await tx
          .update(users)
          .set({
            companyId: nextCompanyId,
            role: nextCompanyId ? nextRole : "accountant",
            updatedAt: Date.now(),
          })
          .where(eq(users.id, session.id));

        // Update session cookie
        await setSession({
          id: session.id,
          username: session.username,
          name: session.name,
          role: nextCompanyId ? nextRole : "accountant",
          companyId: nextCompanyId,
        });
      }
    });

    revalidatePath("/");
    revalidatePath("/settings");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete company:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete company",
    };
  }
}
