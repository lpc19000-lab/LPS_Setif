import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { signJwtToken } from "@/lib/auth";
import { customerLoginSchema, formatZodErrors } from "@/lib/validation";
import { Errors } from "@/lib/errors";
import { logEvent } from "@/lib/logger";

export async function POST(request: Request) {
    try {
        const body = await request.json();

        // ── Zod Validation ──────────────────────────────────────────────────
        const parsed = customerLoginSchema.safeParse(body);
        if (!parsed.success) {
            const err = Errors.invalidInput(formatZodErrors(parsed.error));
            return NextResponse.json(
                { success: false, error_code: err.code, message: err.message },
                { status: err.statusCode }
            );
        }

        const { phone } = parsed.data;

        const customer = await prisma.customer.findUnique({
            where: { phone },
        });

        if (!customer) {
            return NextResponse.json(
                { success: false, error_code: "NOT_FOUND", message: "Trader account not found with this phone number" },
                { status: 401 }
            );
        }

        const token = await signJwtToken({
            sub: customer.id,
            phone: customer.phone,
            role: "TRADER",
        });

        // Log event
        await logEvent("ADMIN_LOGIN", customer.id, `Trader ${customer.shopName} logged in`);

        const response = NextResponse.json(
            {
                success: true,
                message: "Login successful",
                data: {
                    id: customer.id,
                    name: customer.name,
                    shopName: customer.shopName
                }
            },
            { status: 200 }
        );

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

    } catch (error) {
        console.error("Customer login error:", error);
        return NextResponse.json(
            { success: false, error_code: "INTERNAL_ERROR", message: "Internal server error" },
            { status: 500 }
        );
    }
}
