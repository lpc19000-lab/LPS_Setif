import { NextResponse } from "next/server";
import { getCustomerSession } from "@/lib/customer-auth";

export async function GET() {
    try {
        const customer = await getCustomerSession();
        if (!customer) {
            return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
        }
        return NextResponse.json({ success: true, data: customer });
    } catch (error) {
        return NextResponse.json({ success: false, error: "Failed to fetch profile" }, { status: 500 });
    }
}
