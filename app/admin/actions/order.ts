"use server";

import { cancelOrderAction as _cancelOrderAction, adminUpdateOrderStatus as _adminUpdateOrderStatus, updateOrderPayment as _updateOrderPayment, generateInvoiceAction as _generateInvoiceAction } from "@/app/[locale]/admin/actions/order";

export async function cancelOrderAction(...args: Parameters<typeof _cancelOrderAction>) {
    return _cancelOrderAction(...args);
}

export async function adminUpdateOrderStatus(...args: Parameters<typeof _adminUpdateOrderStatus>) {
    return _adminUpdateOrderStatus(...args);
}

export async function updateOrderPayment(...args: Parameters<typeof _updateOrderPayment>) {
    return _updateOrderPayment(...args);
}

export async function generateInvoiceAction(...args: Parameters<typeof _generateInvoiceAction>) {
    return _generateInvoiceAction(...args);
}

export async function deleteOrderAction(...args: Parameters<typeof import("@/app/[locale]/admin/actions/order").deleteOrderAction>) {
    const { deleteOrderAction: _deleteOrderAction } = await import("@/app/[locale]/admin/actions/order");
    return _deleteOrderAction(...args);
}
