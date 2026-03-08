import { NextResponse } from "next/server";
import { getUnreadCount } from "@/services/notification-service";

export async function GET() {
    try {
        const count = await getUnreadCount();
        return NextResponse.json({ success: true, count });
    } catch (error) {
        return NextResponse.json({ success: false, error: "Failed to fetch notification count" }, { status: 500 });
    }
}
