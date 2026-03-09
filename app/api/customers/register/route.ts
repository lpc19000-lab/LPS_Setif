import { NextResponse } from "next/server";
import { registerCustomer } from "@/services/customer-service";
import { signJwtToken } from "@/lib/auth";
import { customerRegistrationSchema, formatZodErrors } from "@/lib/validation";
import { errorResponse, Errors } from "@/lib/errors";
import { logEvent } from "@/lib/logger";

export async function POST(request: Request) {
    try {
        const body = await request.json();

        // ── Zod Validation ──────────────────────────────────────────────────
        const parsed = customerRegistrationSchema.safeParse(body);
        if (!parsed.success) {
            const err = Errors.invalidInput(formatZodErrors(parsed.error));
            return NextResponse.json(
                { success: false, error_code: err.code, message: err.message },
                { status: err.statusCode }
            );
        }

        const { name, phone, wilayaNumber, wilayaName, address, shopName } = parsed.data;

        const customer = await registerCustomer({ name, phone, wilayaNumber, wilayaName, address, shopName });

        const token = await signJwtToken({
            sub: customer.id,
            phone: customer.phone,
            role: "TRADER",
        });

        // Log event
        await logEvent("CUSTOMER_REGISTERED", customer.id, `New trader registered: ${customer.shopName} (${customer.phone})`);

        const response = NextResponse.json({ success: true, data: customer }, { status: 201 });

        response.cookies.set({
            name: "customer_token",
            value: token,
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: 60 * 60 * 24 * 7,
        });

        return response;
    } catch (error: unknown) {
        const { body, status } = errorResponse(error);
        return NextResponse.json(body, { status });
    }
}
