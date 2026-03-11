"use server";

import { cancelOrderAction as _cancelOrderAction, adminUpdateOrderStatus as _adminUpdateOrderStatus } from "@/app/[locale]/admin/actions/order";

export async function cancelOrderAction(...args: Parameters<typeof _cancelOrderAction>) {
    return _cancelOrderAction(...args);
}

export async function adminUpdateOrderStatus(...args: Parameters<typeof _adminUpdateOrderStatus>) {
    return _adminUpdateOrderStatus(...args);
}
