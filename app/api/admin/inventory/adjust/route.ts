import { NextResponse } from "next/server";
import { adjustStock } from "@/services/inventory-service";
import { logAdminAction, logSystemError } from "@/services/audit-service";
import { cookies } from "next/headers";
import { verifyJwtToken } from "@/lib/auth";
import { errorResponse, Errors } from "@/lib/errors";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { productId, quantity, reason } = body;

        if (!productId || typeof quantity !== "number" || !reason) {
            return errorResponse(Errors.invalidInput("Missing required fields: productId, quantity, reason"));
        }

        const product = await adjustStock(productId, quantity, reason);

        const cookieStore = await cookies();
        const token = cookieStore.get("admin_token")?.value;
        const payload = token ? await verifyJwtToken(token) : null;
        const adminId = payload?.sub as string | undefined;

        if (adminId) {
            await logAdminAction({
                adminId,
                action: "ADJUST_STOCK",
                targetType: "INVENTORY",
                targetId: productId,
                metadata: { quantity, reason },
            });
        }

        return NextResponse.json({ success: true, data: product });
    } catch (error: any) {
        await logSystemError({
            message: error.message,
            path: "/api/admin/inventory/adjust",
            method: "POST",
            stackTrace: error.stack,
        });
        const { body, status } = errorResponse(error);
        return NextResponse.json(body, { status });
    }
}
