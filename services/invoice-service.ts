import { supabaseAdmin } from "@/lib/supabase-admin";

// ── READ ──────────────────────────────────────────────────────────────────
export const getInvoices = async () => {
    // Invoices are embedded in the 'orders' table in Supabase (JSONB)
    const { data, error } = await supabaseAdmin
        .from('orders')
        .select('*, customers(*)')
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
            items: order.order_items || []
        }
    }));
};

export const getInvoiceById = async (id: string) => {
    // Search within orders for the specific invoice number
    const { data, error } = await supabaseAdmin
        .from('orders')
        .select('*, customers(*)')
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
            items: data.order_items || []
        }
    };
};

export const getInvoiceByOrderId = async (orderId: string) => {
    const { data, error } = await supabaseAdmin
        .from('orders')
        .select('*, customers(*)')
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
            items: data.order_items || []
        }
    };
};

// ── CREATE ────────────────────────────────────────────────────────────────
export const createInvoice = async (orderId: string, amount: number) => {
    const { data, error } = await supabaseAdmin.functions.invoke('generate-invoice', {
        body: { orderId }
    });

    if (error) throw error;
    if (!data.success) throw new Error(data.error || "Failed to generate invoice");

    return { 
        id: data.invoice.invoiceNumber, 
        orderId, 
        ...data.invoice 
    };
};
