import { supabaseAdmin } from "@/lib/supabase-admin";
import { notifyNewOrder, notifyLowStock } from "./notification-service";
import { Errors } from "@/lib/errors";
import { unstable_cache, revalidateTag } from "next/cache";

export interface OrderItem {
    id: string;
    productId: string;
    quantity: number;
    price: number;
    volumeId: string;
    volume?: any;
    product?: {
        name: string;
        brand: string;
        imageUrl: string;
    };
}

export interface Order {
    id: string;
    customerId: string;
    totalPrice: number;
    status: string;
    createdAt: Date;
    items: OrderItem[];
    customer?: any;
    shipping?: any;
    invoice?: any;
    wilayaName?: string | null;
    wilayaNumber?: string | null;
    logs: any[];
}

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

function mapOrder(data: any): Order {
    return {
        id: data.id,
        customerId: data.customer_id || "",
        totalPrice: Number(data.total_price || 0),
        status: data.status || "PENDING",
        createdAt: new Date(data.created_at),
        items: (data.order_items || []).map((item: any) => ({
            id: item.id,
            productId: item.product_id,
            quantity: Number(item.quantity || 0),
            price: Number(item.price || 0),
            volumeId: item.volume_id,
            volume: item.volume_data,
            product: item.products ? {
                name: item.products.name,
                brand: item.products.brand,
                imageUrl: item.products.image_url
            } : undefined
        })),
        customer: data.customers || null,
        shipping: data.shipping || null,
        invoice: data.invoice || null,
        wilayaName: data.wilaya_name || null,
        wilayaNumber: data.wilaya_number || null,
        logs: (data.logs || []).sort((a: any, b: any) => {
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }),
    };
}

// ── ATOMIC ORDER CREATION ──────────────────────────────────────────────────
export const createOrder = async (input: CreateOrderInput) => {
    if (!input.items || input.items.length === 0) {
        throw Errors.invalidInput("Cannot create an order without items.");
    }

    // Prepare items for RPC
    // We need to fetch prices and volume data first for the RPC
    const productIds = [...new Set(input.items.map(i => i.productId))];
    const { data: products, error: pError } = await supabaseAdmin
        .from('products')
        .select('*')
        .in('id', productIds);

    if (pError || !products) throw new Error("Failed to fetch products for order validation");

    const productsMap = new Map(products.map(p => [p.id, p]));
    const itemsWithData = input.items.map(item => {
        const product = productsMap.get(item.productId);
        if (!product) throw new Error(`Product not found: ${item.productId}`);
        
        const volume = (product.volumes || []).find((v: any) => v.id === item.volumeId);
        const unitPrice = volume?.price 
            ? Number(volume.price) 
            : (Number(product.base_price || 0) / 100) * (volume?.weight || 0);

        return {
            ...item,
            price: unitPrice,
            volume: volume || null
        };
    });

    // Call Supabase RPC for atomic transaction
    const { data: orderId, error } = await supabaseAdmin.rpc('create_order', {
        p_customer_id: input.customerId,
        p_items: itemsWithData,
        p_wilaya_name: input.wilayaName || null,
        p_wilaya_number: input.wilayaNumber || null,
        p_notes: input.notes || "Order placed successfully."
    });

    if (error) {
        console.error("Order creation RPC error:", error);
        throw new Error(error.message);
    }

    revalidateTag(`orders:${input.customerId}`);
    revalidateTag("orders");

    // Fetch the created order for mapping
    const order = await getOrderById(orderId);
    if (!order) throw new Error("Order created but could not be retrieved");

    try {
        await notifyNewOrder(order.id, order.customer?.shopName || "Customer", order.totalPrice);
    } catch (e) {
        console.error("Notification error:", e);
    }

    return order;
};

// ── READ ──────────────────────────────────────────────────────────────────
export const getOrders = async (limit = 50, startAfterStr?: string): Promise<Order[]> => {
    try {
        let query = supabaseAdmin
            .from('orders')
            .select('*, customers(id, shop_name), order_items(*, products(*))')
            .order('created_at', { ascending: false });
        
        if (startAfterStr) {
            query = query.lt('created_at', startAfterStr);
        }

        const { data, error } = await query.limit(limit);
        if (error) throw error;

        return (data || []).map(mapOrder);
    } catch (err) {
        console.error("Orders fetch error (getOrders):", err);
        return [];
    }
};

export const getOrderById = async (id: string): Promise<Order | null> => {
    try {
        const { data, error } = await supabaseAdmin
            .from('orders')
            .select('*, customers(*), order_items(*, products(*))')
            .eq('id', id)
            .single();

        if (error || !data) return null;
        return mapOrder(data);
    } catch (err) {
        console.error("Order fetch error (getOrderById):", err);
        return null;
    }
};

export const countOrdersByCustomer = (customerId: string): Promise<number> => {
    return unstable_cache(
        async () => {
            try {
                const { count, error } = await supabaseAdmin
                    .from('orders')
                    .select('id', { count: 'exact', head: true })
                    .eq('customer_id', customerId);
                
                if (error) throw error;
                return count || 0;
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
                const { data, error } = await supabaseAdmin
                    .from('orders')
                    .select('*, order_items(*, products(*))')
                    .eq('customer_id', customerId)
                    .order('created_at', { ascending: false })
                    .range(skip, skip + limit - 1);

                if (error) throw error;
                return (data || []).map(mapOrder);
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
    const { data: order, error: fetchError } = await supabaseAdmin
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

    if (fetchError || !order) throw new Error("Order not found");
    
    const logs = order.logs || [];
    logs.push({
        status,
        changedBy,
        message: message || `Status changed to ${status}`,
        createdAt: new Date().toISOString(),
    });

    const { data: updatedOrder, error: updateError } = await supabaseAdmin
        .from('orders')
        .update({ status, logs })
        .eq('id', orderId)
        .select('*, order_items(*, products(*))')
        .single();

    if (updateError) throw updateError;

    revalidateTag("orders");
    return mapOrder(updatedOrder);
};

export const updateOrderShipping = async (orderId: string, data: {
    shippingCompany?: string;
    trackingNumber?: string;
    shippingDate?: Date;
}) => {
    const shipping = {
        company: data.shippingCompany,
        trackingNumber: data.trackingNumber,
        date: (data.shippingDate || new Date()).toISOString(),
    };

    const { error } = await supabaseAdmin
        .from('orders')
        .update({ shipping })
        .eq('id', orderId);

    if (error) throw error;
    revalidateTag("orders");
    return { success: true };
};

export const getReorderItems = async (orderId: string): Promise<any[]> => {
    const { data, error } = await supabaseAdmin
        .from('order_items')
        .select('*, products(name)')
        .eq('order_id', orderId);

    if (error) throw error;
    
    return (data || []).map((item: any) => ({
        productId: item.product_id,
        quantity: item.quantity,
        volumeId: item.volume_id,
        name: item.products?.name || "Product",
    }));
};
