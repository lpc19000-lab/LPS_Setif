import { NextResponse } from "next/server";
import { validateAdminCredentials } from "@/services/admin-service";
import { signJwtToken } from "@/lib/auth";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { email, password } = body;

        if (!email || !password) {
            return NextResponse.json(
                { success: false, error: "Email and password are required" },
                { status: 400 }
            );
        }

        const admin = await validateAdminCredentials(email, password);

        console.log(`[AdminLoginAPI] Admin found: ${!!admin}, Email: ${email}`);

        if (!admin) {
            return NextResponse.json(
                { success: false, error: "Invalid credentials" },
                { status: 401 }
            );
        }

        // Add role check if needed
        console.log(`[AdminLoginAPI] Verifying role: ${admin.role}`);
        if (admin.role !== "SUPER_ADMIN" && admin.role !== "ADMIN" && admin.role !== "VENDOR") {
            console.warn(`[AdminLoginAPI] Access denied for role: ${admin.role}`);
            return NextResponse.json(
                { success: false, error: "Access denied" },
                { status: 403 }
            );
        }

        const token = await signJwtToken({
            sub: admin.id,
            email: admin.email,
            role: admin.role,
        });

        const response = NextResponse.json(
            { success: true, message: "Login successful", role: admin.role },
            { status: 200 }
        );

        response.cookies.set({
            name: "admin_token",
            value: token,
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax", 
            path: "/",
            maxAge: 60 * 60 * 24, // 24 hours
        });

        return response;

    } catch (error) {
        console.error("Admin login error:", error);
        return NextResponse.json(
            { success: false, error: "Internal server error" },
            { status: 500 }
        );
    }
}
