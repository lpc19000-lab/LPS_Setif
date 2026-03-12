import { adminDb } from "@/lib/firebase-admin";

// ── Event Types ────────────────────────────────────────────────────────────

export type LogEventType =
  | "ORDER_CREATED"
  | "ORDER_CANCELLED"
  | "ORDER_STATUS_CHANGED"
  | "INVENTORY_ADJUSTED"
  | "CUSTOMER_REGISTERED"
  | "CUSTOMER_LOGIN"
  | "ADMIN_LOGIN"
  | "PRODUCT_CREATED"
  | "PRODUCT_UPDATED"
  | "PRODUCT_DELETED"
  | "CATEGORY_CREATED"
  | "CATEGORY_DELETED"
  | "ERROR";

// ── Logger ─────────────────────────────────────────────────────────────────

export async function logEvent(
  eventType: LogEventType,
  entityId: string | null,
  description: string
) {
  try {
    await adminDb.collection("system_logs").add({
      eventType,
      entityId: entityId || null,
      description,
      createdAt: new Date(),
    });
  } catch (err) {
    // Non-blocking: never let logging break the main flow
    console.error("[Logger] Failed to write system log:", err);
  }
}
