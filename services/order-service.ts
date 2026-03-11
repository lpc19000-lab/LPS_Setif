import { adminDb } from "@/lib/firebase-admin";
import { notifyNewOrder, notifyLowStock } from "./notification-service";
import { Errors } from "@/lib/errors";
import { unstable_cache, revalidateTag } from "next/cache";

// ── TYPES ─────────────────────────────────────────────────────────────────
interface OrderItemInput {
    productId: string;
    quantity: number;
    volumeId: string;
}

interface CreateOrderInput {
    customerId: string;
    items: OrderItemInput[];
    createdBy?: "CUSTOMER" | "ADMIN" | "SYSTEM";
    notes?: string;
    wilayaNumber?: string;
    wilayaName?: string;
}

// ── ATOMIC ORDER CREATION (with Tiered Pricing + Notifications + Logs) ─────
export const createOrder = async (input: CreateOrderInput) => {
    // Step 0: Validate items
    if (!input.items || input.items.length === 0) {
        throw Errors.invalidInput("Cannot create an order without items.");
    }

    // Step 1: Validate products and volumes
    const productIds = [...new Set(input.items.map(i => i.productId))];
    const productDocs = await Promise.all(
        productIds.map(id => adminDb.collection("products").doc(id).get())
    );

    const productsMap = new Map<string, any>();
    productDocs.forEach(doc => {
        if (!doc.exists) throw Errors.invalidInput(`Product not found: ${doc.id}`);
        productsMap.set(doc.id, { id: doc.id, ...doc.data() });
    });

    // Step 2: Validate stock and calculate prices
    let totalPrice = 0;
    const orderItemsData: any[] = [];

    for (const item of input.items) {
        const product = productsMap.get(item.productId)!;
        const volume = (product.volumes || []).find((v: any) => v.id === item.volumeId);

        if (!volume && item.volumeId) {
            throw Errors.invalidInput(`Volume not found for product: ${product.name}`);
        }

        const itemWeight = volume?.weight || 0;
        const requiredWeight = item.quantity * itemWeight;

        if ((product.stockWeight || 0) < requiredWeight) {
            throw Errors.outOfStock(product.name, product.stockWeight || 0, requiredWeight);
        }

        const unitPrice = volume?.price
            ? Number(volume.price)
            : (Number(product.basePrice) / 100) * itemWeight;

        const lineTotal = unitPrice * item.quantity;
        totalPrice += lineTotal;

        orderItemsData.push({
            productId: item.productId,
            quantity: item.quantity,
            volumeId: item.volumeId,
            price: unitPrice,
            volume: volume || null,
        });
    }

    // Step 3: Create order in a transaction
    const order = await adminDb.runTransaction(async (t) => {
        // Decrement stock for each item
        for (const item of orderItemsData) {
            const productRef = adminDb.collection("products").doc(item.productId);
            const productDoc = await t.get(productRef);
            const productData = productDoc.data();
            const currentStock = productData?.stockWeight || 0;
            const itemWeight = item.volume?.weight || 0;
            const requiredWeight = item.quantity * itemWeight;

            if (currentStock < requiredWeight) {
                throw new Error(`Stock changed for ${productData?.name}. Please retry.`);
            }

            t.update(productRef, { stockWeight: currentStock - requiredWeight });

            // Update sales data on product
            const currentSales = productData?.sales || { unitsSold: 0, revenue: 0 };
            t.update(productRef, {
                sales: {
                    unitsSold: currentSales.unitsSold + item.quantity,
                    revenue: currentSales.revenue + (item.price * item.quantity),
                }
            });
        }

        // Create the order document
        const orderRef = adminDb.collection("orders").doc();
        const orderData = {
            customerId: input.customerId,
            totalPrice,
            status: "PENDING",
            wilayaNumber: input.wilayaNumber || null,
            wilayaName: input.wilayaName || null,
            items: orderItemsData.map(i => ({
                productId: i.productId,
                quantity: i.quantity,
                volumeId: i.volumeId,
                price: i.price,
                volume: i.volume,
            })),
            logs: [{
                status: "PENDING",
                changedBy: input.createdBy || "CUSTOMER",
                message: input.notes || "Order placed successfully.",
                createdAt: new Date(),
            }],
            createdAt: new Date(),
        };
        t.set(orderRef, orderData);

        // Create invoice
        const invoiceNumber = `INV-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}-${Math.floor(Math.random() * 1000)}`;
        t.update(orderRef, {
            invoice: {
                invoiceNumber,
                issueDate: new Date(),
                totalAmount: totalPrice,
            }
        });

        // Inventory logs
        for (const item of orderItemsData) {
            const logRef = adminDb.collection("inventory_logs").doc();
            t.set(logRef, {
                productId: item.productId,
                changeType: "SALE",
                quantity: -(item.quantity * (item.volume?.weight || 0)),
                source: "ORDER",
                reason: `Sale from order ${orderRef.id}`,
                createdAt: new Date(),
            });
        }

        // Clear customer cart
        const cartRef = adminDb.collection("carts").doc(input.customerId);
        const cartDoc = await t.get(cartRef);
        if (cartDoc.exists) {
            t.update(cartRef, { items: [] });
        }

        return { id: orderRef.id, ...orderData };
    });

    // Post-transaction: Clear cache
    revalidateTag(`orders:${input.customerId}`);
    revalidateTag("orders");

    // Post-transaction: Trigger notifications
    try {
        const customerDoc = await adminDb.collection("customers").doc(input.customerId).get();
        const customerName = customerDoc.data()?.shopName || "Customer";
        await notifyNewOrder(order.id, customerName, totalPrice);

        for (const item of orderItemsData) {
            const product = productsMap.get(item.productId)!;
            const newStock = (product.stockWeight || 0) - (item.quantity * (item.volume?.weight || 0));
            if (newStock <= (product.lowStockThreshold || 500)) {
                await notifyLowStock(product.id, product.name, newStock);
            }
        }
    } catch (e) {
        console.error("Notification error (non-critical):", e);
    }

    return order;
};

// ── UPDATE ORDER STATUS (with Logging + Stock Management) ─────────────────
export const updateOrderStatus = async (
    orderId: string,
    status: string,
    changedBy: "ADMIN" | "CUSTOMER" | "SYSTEM" = "ADMIN",
    message?: string
) => {
    return await adminDb.runTransaction(async (t) => {
        const orderRef = adminDb.collection("orders").doc(orderId);
        const orderDoc = await t.get(orderRef);

        if (!orderDoc.exists) throw new Error("Order not found");

        const order = orderDoc.data()!;
        const oldStatus = order.status;

        // Stock automation: restore stock if cancelling a non-cancelled order
        if (status === "CANCELLED" && oldStatus !== "CANCELLED") {
            for (const item of (order.items || [])) {
                const productRef = adminDb.collection("products").doc(item.productId);
                const productDoc = await t.get(productRef);
                const productData = productDoc.data();

                const totalWeight = item.quantity * (item.volume?.weight || 0);
                const currentStock = productData?.stockWeight || 0;
                t.update(productRef, { stockWeight: currentStock + totalWeight });

                // Reverse the sales aggregation
                const currentSales = productData?.sales || { unitsSold: 0, revenue: 0 };
                t.update(productRef, {
                    sales: {
                        unitsSold: Math.max(0, currentSales.unitsSold - item.quantity),
                        revenue: Math.max(0, currentSales.revenue - (Number(item.price) * item.quantity)),
                    }
                });

                const logRef = adminDb.collection("inventory_logs").doc();
                t.set(logRef, {
                    productId: item.productId,
                    changeType: "CANCEL",
                    quantity: totalWeight,
                    source: changedBy === "CUSTOMER" ? "ORDER" : "ADMIN",
                    reason: `Restock from cancelled order ${orderId}`,
                    createdAt: new Date(),
                });
            }
        }

        // Create log entry
        const logMessage = message || `Status changed from ${oldStatus} to ${status}.`;
        const logs = order.logs || [];
        logs.push({
            status,
            changedBy,
            message: logMessage,
            createdAt: new Date(),
        });

        t.update(orderRef, { status, logs });

        revalidateTag(`orders:${order.customerId}`);
        revalidateTag("orders");

        // Return updated order
        const updatedOrder = { id: orderId, ...order, status, logs };
        return updatedOrder;
    });
};

// ── UPDATE SHIPPING INFO ──────────────────────────────────────────────────
export const updateOrderShipping = async (
    orderId: string,
    data: { shippingCompany?: string; trackingNumber?: string; shippingDate?: Date }
) => {
    const orderRef = adminDb.collection("orders").doc(orderId);
    const doc = await orderRef.get();
    if (!doc.exists) throw new Error("Order not found");

    const orderData = doc.data()!;
    await orderRef.update(data);

    // Log the change
    const logs = orderData.logs || [];
    logs.push({
        status: orderData.status,
        changedBy: "ADMIN",
        message: `Shipping information updated: ${data.shippingCompany || ''} ${data.trackingNumber || ''}`,
        createdAt: new Date(),
    });
    await orderRef.update({ logs });

    return { id: orderId, ...orderData, ...data, logs };
};

// ── READ ──────────────────────────────────────────────────────────────────
export const getOrders = async (limit = 50) => {
    const query = await adminDb.collection("orders")
        .orderBy("createdAt", "desc")
        .limit(limit)
        .get();

    return Promise.all(query.docs.map(async (doc) => {
        const data = doc.data();

        let customer = null;
        if (data.customerId) {
            const custDoc = await adminDb.collection("customers").doc(data.customerId).get();
            if (custDoc.exists) customer = { id: custDoc.id, ...custDoc.data() };
        }

        // Sort logs desc
        const logs = (data.logs || []).sort((a: any, b: any) => {
            const aTime = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
            const bTime = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
            return bTime - aTime;
        });

        return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate(),
            customer,
            logs,
        };
    }));
};

export const getOrderById = async (id: string) => {
    const doc = await adminDb.collection("orders").doc(id).get();
    if (!doc.exists) return null;

    const data = doc.data()!;
    let customer = null;
    if (data.customerId) {
        const custDoc = await adminDb.collection("customers").doc(data.customerId).get();
        if (custDoc.exists) customer = { id: custDoc.id, ...custDoc.data() };
    }

    const logs = (data.logs || []).sort((a: any, b: any) => {
        const aTime = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
        const bTime = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
        return bTime - aTime;
    });

    return { id: doc.id, ...data, createdAt: data.createdAt?.toDate(), customer, logs };
};

export const getOrdersByCustomer = (customerId: string, limit = 50, skip = 0) => {
    return unstable_cache(
        async () => {
            const query = await adminDb.collection("orders")
                .where("customerId", "==", customerId)
                .orderBy("createdAt", "desc")
                .get();

            const allOrders = query.docs.map(doc => {
                const data = doc.data();
                const logs = (data.logs || []).sort((a: any, b: any) => {
                    const aTime = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
                    const bTime = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
                    return bTime - aTime;
                });
                return {
                    id: doc.id,
                    ...data,
                    createdAt: data.createdAt?.toDate(),
                    logs,
                };
            });

            return allOrders.slice(skip, skip + limit);
        },
        [`orders-${customerId}-${limit}-${skip}`],
        { tags: [`orders:${customerId}`, "orders"], revalidate: 3600 }
    )();
};

export const countOrdersByCustomer = async (customerId: string) => {
    const result = await adminDb.collection("orders")
        .where("customerId", "==", customerId)
        .count()
        .get();
    return result.data().count;
};

// ── BEST SELLERS ──────────────────────────────────────────────────────────
export const getBestSellers = async (limit = 10) => {
    const query = await adminDb.collection("products").get();
    const products = query.docs.map(doc => {
        const d = doc.data();
        return {
            id: doc.id,
            ...d,
            unitsSold: d.sales?.unitsSold || 0,
        };
    });

    return products
        .sort((a, b) => b.unitsSold - a.unitsSold)
        .slice(0, limit)
        .map(p => ({
            productId: p.id,
            unitsSold: p.unitsSold,
            product: p,
        }));
};

// ── REORDER ───────────────────────────────────────────────────────────────
export const getReorderItems = async (orderId: string) => {
    const doc = await adminDb.collection("orders").doc(orderId).get();
    if (!doc.exists) throw new Error("Order not found");

    const order = doc.data()!;
    return (order.items || []).map((item: any) => ({
        productId: item.productId,
        name: item.productName || "Product",
        quantity: item.quantity,
        volumeId: item.volumeId,
        currentPrice: Number(item.volume?.price || item.price || 0),
    }));
};
