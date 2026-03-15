import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { cookies } from "next/headers";
import { verifyJwtToken } from "@/lib/auth";

export async function PUT(request: Request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("admin_token")?.value;
        if (!token) {
            return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
        }
        const payload = await verifyJwtToken(token);
        if (!payload) {
            return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { orderId, amountPaid } = body;

        if (!orderId || typeof amountPaid !== "number" || amountPaid < 0) {
            return NextResponse.json({ success: false, message: "Invalid input: orderId and amountPaid (>= 0) required" }, { status: 400 });
        }

        // Fetch the order to calculate balance
        const { data: order, error: fetchError } = await supabaseAdmin
            .from("orders")
            .select("total_price, amount_paid, payment_status, logs")
            .eq("id", orderId)
            .single();

        if (fetchError || !order) {
            return NextResponse.json({ success: false, message: "Order not found" }, { status: 404 });
        }

        const totalPrice = Number(order.total_price || 0);
        const newPaymentStatus = amountPaid >= totalPrice ? "PAID" : amountPaid > 0 ? "PARTIAL" : "UNPAID";
        const balanceDue = Math.max(0, totalPrice - amountPaid);

        // Add payment log entry
        const existingLogs = order.logs || [];
        const newLog = {
            id: crypto.randomUUID(),
            message: `Payment updated: ${amountPaid.toLocaleString()} DZD received. Balance: ${balanceDue.toLocaleString()} DZD. Status: ${newPaymentStatus}`,
            status: order.payment_status || "UNPAID",
            changedBy: "ADMIN",
            createdAt: new Date().toISOString(),
        };

        const { error: updateError } = await supabaseAdmin
            .from("orders")
            .update({
                amount_paid: amountPaid,
                payment_status: newPaymentStatus,
                updated_at: new Date().toISOString(),
                logs: [...existingLogs, newLog],
            })
            .eq("id", orderId);

        if (updateError) {
            console.error("Payment update error:", updateError);
            return NextResponse.json({ success: false, message: updateError.message }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            data: {
                amountPaid,
                paymentStatus: newPaymentStatus,
                balanceDue,
            }
        });
    } catch (error: any) {
        console.error("Payment API error:", error);
        return NextResponse.json({ success: false, message: error.message || "Internal error" }, { status: 500 });
    }
}
