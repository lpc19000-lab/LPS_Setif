"use server";

import { adminDb } from "@/lib/firebase-admin";
import { revalidatePath } from "next/cache";

export async function updateOrderPayment(orderId: string, amountPaid: number) {
    const orderDoc = await adminDb.collection("orders").doc(orderId).get();

    if (!orderDoc.exists) throw new Error("Order not found");

    const order = orderDoc.data()!;
    const totalAmount = Number(order.totalPrice);
    let paymentStatus: "PAID" | "PARTIALLY_PAID" | "UNPAID" = "UNPAID";

    if (amountPaid >= totalAmount) {
        paymentStatus = "PAID";
    } else if (amountPaid > 0) {
        paymentStatus = "PARTIALLY_PAID";
    }

    await adminDb.collection("orders").doc(orderId).update({
        amountPaid,
        paymentStatus,
        updatedAt: new Date(),
    });

    revalidatePath("/admin/dashboard");
    revalidatePath("/admin/orders");
}
