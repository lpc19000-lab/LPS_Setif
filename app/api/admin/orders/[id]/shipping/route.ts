import { NextResponse } from "next/server";
import { updateOrderShipping, updateOrderStatus } from "@/services/order-service";
import { logAdminAction, logSystemError } from "@/services/audit-service";
import { OrderStatus } from "@/lib/constants";
import { cookies } from "next/headers";
import { verifyJwtToken } from "@/lib/auth";

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { shippingCompany, trackingNumber, shippingDate, status } = body;

        // Get admin ID
        const cookieStore = await cookies();
        const token = cookieStore.get("admin_token")?.value;
        const payload = token ? await verifyJwtToken(token) : null;
        const adminId = payload?.sub as string | undefined;

        // Update shipping info if provided
        if (shippingCompany || trackingNumber || shippingDate) {
            await updateOrderShipping(id, {
                shippingCompany,
                trackingNumber,
                shippingDate: shippingDate ? new Date(shippingDate) : undefined,
            });

            if (adminId) {
                await logAdminAction({
                    adminId,
                    action: "UPDATE_SHIPPING",
                    targetType: "ORDER",
                    targetId: id,
                    metadata: { shippingCompany, trackingNumber, shippingDate },
                });
            }
        }

        // Also allow status update in the same call (e.g. marking as SHIPPED)
        if (status) {
            await updateOrderStatus(id, status as OrderStatus, "ADMIN", `Shipping details updated and status moved to ${status}.`);

            if (adminId) {
                await logAdminAction({
                    adminId,
                    action: "UPDATE_STATUS",
                    targetType: "ORDER",
                    targetId: id,
                    metadata: { newStatus: status },
                });
            }
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        await logSystemError({
            message: error.message,
            path: `/api/admin/orders/${params ? (await params).id : 'unknown'}/shipping`,
            method: "PATCH",
            stackTrace: error.stack,
        });
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
