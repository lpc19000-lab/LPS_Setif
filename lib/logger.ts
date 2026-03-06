import prisma from "@/lib/db";

// ── Event Types ────────────────────────────────────────────────────────────

export type LogEventType =
  | "ORDER_CREATED"
  | "ORDER_CANCELLED"
  | "ORDER_STATUS_CHANGED"
  | "INVENTORY_ADJUSTED"
  | "CUSTOMER_REGISTERED"
  | "ADMIN_LOGIN"
  | "PRODUCT_CREATED"
  | "PRODUCT_UPDATED"
  | "PRODUCT_DELETED"
  | "CATEGORY_CREATED"
  | "ERROR";

// ── Logger ─────────────────────────────────────────────────────────────────

export async function logEvent(
  eventType: LogEventType,
  entityId: string | null,
  description: string
) {
  try {
    await prisma.systemLog.create({
      data: {
        eventType,
        entityId: entityId || undefined,
        description,
      },
    });
  } catch (err) {
    // Non-blocking: never let logging break the main flow
    console.error("[Logger] Failed to write system log:", err);
  }
}
