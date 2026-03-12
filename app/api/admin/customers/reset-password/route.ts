import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyJwtToken } from "@/lib/auth";
import { adminDb } from "@/lib/firebase-admin";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
    try {
        // ── Admin Auth Check ────────────────────────────────────────────
        const cookieStore = await cookies();
        const token = cookieStore.get("admin_token")?.value;

        if (!token) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const payload = await verifyJwtToken(token);
        if (!payload || !payload.sub) {
            return NextResponse.json({ success: false, error: "Invalid token" }, { status: 401 });
        }

        const adminRole = payload.role as string;
        if (adminRole !== "SUPER_ADMIN" && adminRole !== "ADMIN") {
            return NextResponse.json({ success: false, error: "Access denied" }, { status: 403 });
        }

        // ── Parse Body ──────────────────────────────────────────────────
        const body = await request.json();
        const { customerId, newPassword } = body;

        if (!customerId || !newPassword) {
            return NextResponse.json(
                { success: false, error: "Customer ID and new password are required" },
                { status: 400 }
            );
        }

        if (newPassword.length < 6) {
            return NextResponse.json(
                { success: false, error: "Password must be at least 6 characters" },
                { status: 400 }
            );
        }

        // ── Verify Customer Exists ──────────────────────────────────────
        const customerDoc = await adminDb.collection("customers").doc(customerId).get();

        if (!customerDoc.exists) {
            return NextResponse.json({ success: false, error: "Customer not found" }, { status: 404 });
        }

        // ── Hash & Update ───────────────────────────────────────────────
        const passwordHash = await bcrypt.hash(newPassword, 10);
        await adminDb.collection("customers").doc(customerId).update({ passwordHash });

        return NextResponse.json(
            { success: true, message: "Password reset successfully" },
            { status: 200 }
        );
    } catch (error) {
        console.error("Admin reset trader password error:", error);
        return NextResponse.json(
            { success: false, error: "Internal server error" },
            { status: 500 }
        );
    }
}
