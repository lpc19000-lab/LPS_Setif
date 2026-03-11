import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const orderDoc = await adminDb.collection("orders").doc(id).get();

        if (!orderDoc.exists) {
            return NextResponse.json({ error: "Order not found" }, { status: 404 });
        }

        const orderData = orderDoc.data();
        const logs = (orderData?.logs || []).sort((a: any, b: any) => {
            const aTime = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
            const bTime = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
            return bTime - aTime;
        });

        return NextResponse.json(logs);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
