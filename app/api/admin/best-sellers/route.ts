import { NextResponse } from "next/server";
import { getBestSellers } from "@/services/order-service";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const bestSellers = await getBestSellers(10);
        return NextResponse.json(bestSellers);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
