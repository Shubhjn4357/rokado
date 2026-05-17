"use server";

import { db, auditLog, eq, and, gte, lte, desc } from "@repo/database";

export async function fetchAuditLogsAction(filters: { dateFrom?: number; dateTo?: number; entityType?: string; actionType?: string }) {
  try {
    const { dateFrom, dateTo, entityType, actionType } = filters;
    const results = await db
      .select({
        id: auditLog.id,
        entity: auditLog.entity,
        entityId: auditLog.entityId,
        action: auditLog.action,
        before: auditLog.before,
        after: auditLog.after,
        userId: auditLog.userId,
        createdAt: auditLog.createdAt,
      })
      .from(auditLog)
      .where(
        and(
          dateFrom ? gte(auditLog.createdAt as any, dateFrom) : undefined,
          dateTo ? lte(auditLog.createdAt as any, dateTo) : undefined,
          entityType ? eq(auditLog.entity as any, entityType) : undefined,
          actionType ? eq(auditLog.action as any, actionType) : undefined
        )
      )
      .orderBy(desc(auditLog.createdAt as any));

    return { success: true, data: results };
  } catch (err) {
    console.error("Failed to fetch audit log:", err);
    return { success: false, error: "Failed to fetch audit log" };
  }
}
