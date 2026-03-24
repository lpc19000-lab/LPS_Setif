import { supabaseAdmin } from "@/lib/supabase-admin";

// ── READ ──────────────────────────────────────────────────────────────────
export const getInvoices = async () => {
    // Invoices are embedded in the 'orders' table in Supabase (JSONB)
    const { data, error } = await supabaseAdmin
        .from('orders')
        .select('*, customers(*), order_items(*, products(*))')
        .not('invoice', 'is', null)
        .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map(order => ({
        id: order.invoice?.invoiceNumber || order.id,
        orderId: order.id,
        invoiceNumber: order.invoice?.invoiceNumber,
        issueDate: order.invoice?.issueDate ? new Date(order.invoice.issueDate) : null,
        totalAmount: order.invoice?.totalAmount,
        order: {
            id: order.id,
            ...order,
            customer: order.customers,
            items: (order.order_items || []).map((item: any) => ({
                ...item,
                volume: item.volume_data,
                volumeId: item.volume_data?.id,
                product: Array.isArray(item.products) ? item.products[0] : item.products
            }))
        }
    }));
};

export const getInvoiceById = async (id: string) => {
    // Search within orders for the specific invoice number
    const { data, error } = await supabaseAdmin
        .from('orders')
        .select('*, customers(*), order_items(*, products(*))')
        .eq('invoice->>invoiceNumber', id)
        .maybeSingle();

    if (error || !data) return null;

    return {
        id: data.invoice?.invoiceNumber || data.id,
        orderId: data.id,
        invoiceNumber: data.invoice?.invoiceNumber,
        issueDate: data.invoice?.issueDate ? new Date(data.invoice.issueDate) : null,
        totalAmount: data.invoice?.totalAmount,
        order: {
            id: data.id,
            ...data,
            customer: data.customers,
            items: (data.order_items || []).map((item: any) => ({
                ...item,
                volume: item.volume_data,
                volumeId: item.volume_data?.id,
                product: Array.isArray(item.products) ? item.products[0] : item.products
            }))
        }
    };
};

export const getInvoiceByOrderId = async (orderId: string) => {
    const { data, error } = await supabaseAdmin
        .from('orders')
        .select('*, customers(*), order_items(*, products(*))')
        .eq('id', orderId)
        .single();

    if (error || !data || !data.invoice) return null;

    return {
        id: data.invoice.invoiceNumber || data.id,
        orderId: data.id,
        invoiceNumber: data.invoice.invoiceNumber,
        issueDate: data.invoice.issueDate ? new Date(data.invoice.issueDate) : null,
        totalAmount: data.invoice.totalAmount,
        order: {
            id: data.id,
            ...data,
            customer: data.customers,
            items: (data.order_items || []).map((item: any) => ({
                ...item,
                volume: item.volume_data,
                volumeId: item.volume_data?.id,
                product: Array.isArray(item.products) ? item.products[0] : item.products
            }))
        }
    };
};

// ── CREATE ────────────────────────────────────────────────────────────────
export const createInvoice = async (orderId: string, amount: number) => {
    // Generate invoice data locally instead of relying on the failing edge function
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const random = Math.floor(1000 + Math.random() * 9000);
    const invoiceNumber = `INV-${year}${month}-${random}`;
    
    const invoiceData = {
        invoiceNumber,
        issueDate: date.toISOString(),
        totalAmount: amount
    };

    const { data: updatedOrder, error } = await supabaseAdmin
        .from('orders')
        .update({ invoice: invoiceData })
        .eq('id', orderId)
        .select()
        .single();

    if (error) throw error;
    if (!updatedOrder) throw new Error("Failed to update order with invoice");

    return { 
        id: invoiceNumber, 
        orderId, 
        ...invoiceData 
    };
};
