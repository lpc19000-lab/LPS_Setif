import { NextResponse } from "next/server";
import { getCustomers } from "@/services/customer-service";

export async function GET() {
    try {
        const customers = await getCustomers();
        return NextResponse.json({ success: true, data: customers });
    } catch (error) {
        return NextResponse.json(
            { success: false, error: "Failed to fetch customers" },
            { status: 500 }
        );
    }
}
