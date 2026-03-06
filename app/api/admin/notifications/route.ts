import { NextResponse } from "next/server";
import { getNotifications, getUnreadCount, markAllAsRead } from "@/services/notification-service";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const [notifications, unreadCount] = await Promise.all([
            getNotifications(),
            getUnreadCount(),
        ]);
        return NextResponse.json({ notifications, unreadCount });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT() {
    try {
        await markAllAsRead();
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
