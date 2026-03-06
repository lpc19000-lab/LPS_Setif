import { NextResponse } from "next/server";
import { getInventoryHistory } from "@/services/inventory-service";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const productId = searchParams.get("productId") || undefined;
        const changeType = searchParams.get("changeType") as any;

        const filters: any = {};
        if (productId) filters.productId = productId;
        if (changeType) filters.changeType = changeType;

        const history = await getInventoryHistory(filters);

        return NextResponse.json({ success: true, data: history });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
