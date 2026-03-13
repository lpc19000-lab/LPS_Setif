import { adminDb } from "@/lib/firebase-admin";
import { QueryDocumentSnapshot, DocumentData } from "firebase-admin/firestore";
import { notifyNewOrder, notifyLowStock } from "./notification-service";
import { Errors } from "@/lib/errors";
import { unstable_cache, revalidateTag } from "next/cache";
import { Order, OrderItem } from "@/types/firebase";

export type { Order, OrderItem };

// ── TYPES (Internal) ──────────────────────────────────────────────────────
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

function mapOrder(docId: string, data: any): Order {
    return {
        id: docId,
        customerId: data.customerId || "",
        totalPrice: Number(data.totalPrice || 0),
        status: data.status || "PENDING",
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt || Date.now()),
        items: (data.items || []).map((item: any, idx: number) => ({
            ...item,
            id: item.id || `${docId}-item-${idx}`,
            price: Number(item.price || 0),
            quantity: Number(item.quantity || 0),
        })),
        customer: data.customer || null,
        shipping: data.shipping || null,
        invoice: data.invoice || null,
        wilayaName: data.wilayaName || null,
        logs: (data.logs || []).sort((a: any, b: any) => {
            const aTime = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
            const bTime = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
            return bTime - aTime;
        }),
    } as Order;
}

// ── ATOMIC ORDER CREATION ──────────────────────────────────────────────────
export const createOrder = async (input: CreateOrderInput) => {
    if (!input.items || input.items.length === 0) {
        throw Errors.invalidInput("Cannot create an order without items.");
    }

    const productIds = [...new Set(input.items.map(i => i.productId))];
    const productDocs = await Promise.all(
        productIds.map(id => adminDb.collection("products").doc(id).get())
    );

    const productsMap = new Map<string, any>();
    productDocs.forEach(doc => {
        if (!doc.exists) throw Errors.invalidInput(`Product not found: ${doc.id}`);
        productsMap.set(doc.id, { id: doc.id, ...doc.data() });
    });

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
            : (Number(product.basePrice || product.price || 0) / 100) * itemWeight;

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

    const order = await adminDb.runTransaction(async (t) => {
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

            const currentSales = productData?.sales || { unitsSold: 0, revenue: 0 };
            t.update(productRef, {
                sales: {
                    unitsSold: currentSales.unitsSold + item.quantity,
                    revenue: currentSales.revenue + (item.price * item.quantity),
                }
            });
        }

        const orderRef = adminDb.collection("orders").doc();
        const orderData = {
            customerId: input.customerId,
            totalPrice,
            status: "PENDING",
            wilayaNumber: input.wilayaNumber || null,
            wilayaName: input.wilayaName || null,
            items: orderItemsData,
            logs: [{
                status: "PENDING",
                changedBy: input.createdBy || "CUSTOMER",
                message: input.notes || "Order placed successfully.",
                createdAt: new Date(),
            }],
            createdAt: new Date(),
        };
        t.set(orderRef, orderData);

        return { id: orderRef.id, ...orderData };
    });

    (revalidateTag as any)(`orders:${input.customerId}`);
    (revalidateTag as any)("orders");

    try {
        const customerDoc = await adminDb.collection("customers").doc(input.customerId).get();
        const customerName = customerDoc.data()?.shopName || "Customer";
        await notifyNewOrder(order.id, customerName, totalPrice);
    } catch (e) {
        console.error("Notification error (non-critical):", e);
    }

    return mapOrder(order.id, order);
};

// ── READ ──────────────────────────────────────────────────────────────────
export const getOrders = async (limit = 50, startAfterStr?: string): Promise<Order[]> => {
    try {
        let queryRef: any = adminDb.collection("orders").orderBy("createdAt", "desc");
        
        if (startAfterStr) {
            // Need the exact document snapshot to start after in Firestore, or by field.
            // Using field 'createdAt' is simpler if startAfterStr is a timestamp
            const dateCursor = new Date(startAfterStr);
            if (!isNaN(dateCursor.getTime())) {
                queryRef = queryRef.startAfter(dateCursor);
            }
        }

        queryRef = queryRef.limit(limit);
        const snapshot = await queryRef.get();

        return Promise.all(snapshot.docs.map(async (doc: QueryDocumentSnapshot<DocumentData>) => {
            const data = doc.data();
            let customer = null;
            if (data.customerId) {
                const custDoc = await adminDb.collection("customers").doc(data.customerId).get();
                if (custDoc.exists) customer = { id: custDoc.id, ...custDoc.data() };
            }
            return mapOrder(doc.id, { ...data, customer });
        }));
    } catch (err) {
        console.error("Orders fetch error (getOrders):", err);
        return [];
    }
};

export const getOrderById = async (id: string): Promise<Order | null> => {
    try {
        const doc = await adminDb.collection("orders").doc(id).get();
        if (!doc.exists) return null;

        const data = doc.data()!;
        let customer = null;
        if (data.customerId) {
            const custDoc = await adminDb.collection("customers").doc(data.customerId).get();
            if (custDoc.exists) customer = { id: custDoc.id, ...custDoc.data() };
        }

        const items = await Promise.all((data.items || []).map(async (item: any, idx: number) => {
            const productDoc = await adminDb.collection("products").doc(item.productId).get();
            const productData = productDoc.exists ? productDoc.data() : null;
            return {
                ...item,
                id: item.id || `${doc.id}-item-${idx}`,
                product: {
                    name: productData?.name || "Unknown Product",
                    brand: productData?.brand || "Unknown Brand",
                    imageUrl: productData?.imageUrl || productData?.image || "",
                }
            };
        }));

        return mapOrder(doc.id, { ...data, customer, items });
    } catch (err) {
        console.error("Order fetch error (getOrderById):", err);
        return null;
    }
};

export const countOrdersByCustomer = (customerId: string): Promise<number> => {
    return unstable_cache(
        async () => {
            try {
                const snapshot = await adminDb.collection("orders")
                    .where("customerId", "==", customerId)
                    .count()
                    .get();
                return snapshot.data().count;
            } catch (err) {
                console.error("Order fetch error (countOrdersByCustomer):", err);
                return 0;
            }
        },
        [`orders-count-${customerId}`],
        { tags: [`orders:${customerId}`], revalidate: 3600 }
    )();
};

export const getOrdersByCustomer = (customerId: string, limit = 50, skip = 0): Promise<Order[]> => {
    return unstable_cache(
        async () => {
            try {
                const query = await adminDb.collection("orders")
                    .where("customerId", "==", customerId)
                    .orderBy("createdAt", "desc")
                    .get();

                const allOrders = query.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => mapOrder(doc.id, doc.data()));
                return allOrders.slice(skip, skip + limit);
            } catch (err) {
                console.error("Order fetch error (getOrdersByCustomer):", err);
                return [];
            }
        },
        [`orders-${customerId}-${limit}-${skip}`],
        { tags: [`orders:${customerId}`, "orders"], revalidate: 3600 }
    )();
};

export const updateOrderStatus = async (orderId: string, status: string, changedBy: string = "ADMIN", message?: string) => {
    const orderRef = adminDb.collection("orders").doc(orderId);
    const orderDoc = await orderRef.get();
    if (!orderDoc.exists) throw new Error("Order not found");
    const orderData = orderDoc.data()!;
    
    const logs = orderData.logs || [];
    logs.push({
        status,
        changedBy,
        message: message || `Status changed to ${status}`,
        createdAt: new Date(),
    });

    await orderRef.update({ status, logs });
    (revalidateTag as any)("orders");
    return mapOrder(orderId, { ...orderData, status, logs });
};

export const updateOrderShipping = async (orderId: string, data: {
    shippingCompany?: string;
    trackingNumber?: string;
    shippingDate?: Date;
}) => {
    const orderRef = adminDb.collection("orders").doc(orderId);
    const orderDoc = await orderRef.get();
    if (!orderDoc.exists) throw new Error("Order not found");

    const shipping = {
        company: data.shippingCompany,
        trackingNumber: data.trackingNumber,
        date: data.shippingDate || new Date(),
    };

    await orderRef.update({ shipping });
    (revalidateTag as any)("orders");
    return { success: true };
};

export const getReorderItems = async (orderId: string): Promise<any[]> => {
    const doc = await adminDb.collection("orders").doc(orderId).get();
    if (!doc.exists) throw new Error("Order not found");
    const data = doc.data()!;
    return (data.items || []).map((item: any) => ({
        productId: item.productId,
        quantity: item.quantity,
        volumeId: item.volumeId,
        name: item.product?.name || "Product",
    }));
};
