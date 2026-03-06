import { NextResponse } from "next/server";
import { getAdminStats } from "@/services/admin-service";

export async function GET() {
    try {
        const stats = await getAdminStats();
        return NextResponse.json(stats);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch admin statistics" }, { status: 500 });
    }
}
