import { NextResponse } from "next/server";
import { getInvoices, getInvoiceByOrderId } from "@/services/invoice-service";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get("orderId");

    try {
        if (orderId) {
            const invoice = await getInvoiceByOrderId(orderId);
            if (!invoice) {
                return NextResponse.json(
                    { success: false, error: "Invoice not found" },
                    { status: 404 }
                );
            }
            return NextResponse.json({ success: true, data: invoice });
        }

        const invoices = await getInvoices();
        return NextResponse.json({ success: true, data: invoices });
    } catch (error) {
        return NextResponse.json(
            { success: false, error: "Failed to fetch invoices" },
            { status: 500 }
        );
    }
}
