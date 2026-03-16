import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyJwtToken } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { logAdminAction } from "@/services/audit-service";

export async function POST() {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("admin_token")?.value;

        if (!token) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const payload = await verifyJwtToken(token);
        if (!payload || !payload.sub) {
            return NextResponse.json({ success: false, error: "Invalid token" }, { status: 401 });
        }

        const adminId = payload.sub as string;

        // Reset sales_units_sold and sales_revenue on all products
        const { error } = await supabaseAdmin
            .from("products")
            .update({ sales_units_sold: 0, sales_revenue: 0 })
            .neq("id", "00000000-0000-0000-0000-000000000000"); // match all rows

        if (error) throw error;

        await logAdminAction({
            adminId,
            action: "RESET_PROFIT_DATA",
            targetType: "SYSTEM",
            targetId: "all_products",
            metadata: { resetAt: new Date().toISOString() }
        });

        return NextResponse.json({ success: true, message: "Profit data reset successfully" });
    } catch (error) {
        console.error("Reset profit error:", error);
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}
