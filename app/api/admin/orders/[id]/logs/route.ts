import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const logs = await prisma.orderLog.findMany({
            where: { orderId: id },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json(logs);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
