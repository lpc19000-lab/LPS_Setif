import { NextResponse } from "next/server";
import { createOrder, getOrders } from "@/services/order-service";
import { getCustomerSession } from "@/lib/customer-auth";
import { createOrderSchema, formatZodErrors } from "@/lib/validation";
import { AppError, errorResponse, Errors } from "@/lib/errors";
import { acquireOrderLock, releaseOrderLock } from "@/lib/order-lock";
import { logEvent } from "@/lib/logger";

export async function POST(request: Request) {
    try {
        // ── Auth ────────────────────────────────────────────────────────────
        const customer = await getCustomerSession();
        if (!customer) {
            const err = Errors.unauthorized();
            return NextResponse.json(
                { success: false, error_code: err.code, message: err.message },
                { status: err.statusCode }
            );
        }

        // ── Validate Input (Zod) ────────────────────────────────────────────
        const body = await request.json();
        const parsed = createOrderSchema.safeParse(body);
        if (!parsed.success) {
            const err = Errors.invalidInput(formatZodErrors(parsed.error));
            return NextResponse.json(
                { success: false, error_code: err.code, message: err.message },
                { status: err.statusCode }
            );
        }

        const { items, shippingData } = parsed.data;

        // ── Duplicate Order Lock ────────────────────────────────────────────
        const lockAcquired = acquireOrderLock(customer.id);
        if (!lockAcquired) {
            const err = Errors.duplicateOrder();
            return NextResponse.json(
                { success: false, error_code: err.code, message: err.message },
                { status: err.statusCode }
            );
        }

        try {
            let initialLogMessage = "Order placed successfully.";
            if (shippingData) {
                initialLogMessage = `Order placed. Ship to: ${shippingData.name || ''}, ${shippingData.phone || ''}, ${shippingData.address || ''}, ${shippingData.wilayaName || ''}. Notes: ${shippingData.notes || 'None'}`;
            }

            const order = await createOrder({
                customerId: customer.id,
                items,
                createdBy: "CUSTOMER",
                notes: initialLogMessage,
                wilayaNumber: shippingData?.wilayaNumber,
                wilayaName: shippingData?.wilayaName,
            });

            // Log success
            await logEvent("ORDER_CREATED", order.id, `Order created by customer ${customer.id}. Total: ${order.totalPrice}`);

            return NextResponse.json({ success: true, data: order }, { status: 201 });
        } finally {
            releaseOrderLock(customer.id);
        }
    } catch (error: unknown) {
        console.error("[CRITICAL] Order Placement Failed:", error);
        if (error instanceof Error) {
            console.error("Stack trace:", error.stack);
        }
        return errorResponse(error);
    }
}

export async function GET() {
    try {
        const orders = await getOrders();
        return NextResponse.json({ success: true, data: orders });
    } catch (error) {
        return errorResponse(error);
    }
}
