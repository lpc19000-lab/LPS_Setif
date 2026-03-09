"use client";

import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function updateOrderPayment(orderId: string, amountPaid: number) {
    const order = await prisma.order.findUnique({
        where: { id: orderId }
    });

    if (!order) throw new Error("Order not found");

    const totalAmount = Number(order.totalPrice);
    let status: "PAID" | "PARTIALLY_PAID" | "UNPAID" = "UNPAID";

    if (amountPaid >= totalAmount) {
        status = "PAID";
    } else if (amountPaid > 0) {
        status = "PARTIALLY_PAID";
    }

    await prisma.order.update({
        where: { id: orderId },
        data: {
            amountPaid,
            paymentStatus: status
        }
    });

    revalidatePath("/admin/dashboard");
    revalidatePath("/admin/orders");
}
