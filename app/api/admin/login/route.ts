import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import bcrypt from "bcryptjs";
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

        const admin = await prisma.admin.findUnique({
            where: { email },
        });

        if (!admin) {
            return NextResponse.json(
                { success: false, error: "Invalid credentials" },
                { status: 401 }
            );
        }

        const isPasswordValid = await bcrypt.compare(password, admin.passwordHash);

        if (!isPasswordValid) {
            return NextResponse.json(
                { success: false, error: "Invalid credentials" },
                { status: 401 }
            );
        }

        // Add role check if needed
        if (admin.role !== "SUPER_ADMIN" && admin.role !== "ADMIN") {
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
            { success: true, message: "Login successful" },
            { status: 200 }
        );

        response.cookies.set({
            name: "admin_token",
            value: token,
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax", // Better for simple SPA
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
