import { supabaseAdmin } from "@/lib/supabase-admin";

// ── STOCK ADJUSTMENTS ─────────────────────────────────────────────────────
export const decrementStock = async (productId: string, quantity: number, weight: number = 100) => {
    const totalWeight = quantity * weight;
    
    // Using a simple RPC or direct update with check
    // Ideally use an RPC for atomic "check and update"
    const { data, error } = await supabaseAdmin.rpc('adjust_stock', {
        p_product_id: productId,
        p_amount: -totalWeight,
        p_reason: 'DECREMENT_STOCK',
        p_source: 'SYSTEM'
    });

    if (error) throw error;
    return { id: productId, stockWeight: data };
};

export const incrementStock = async (productId: string, quantity: number, weight: number = 100) => {
    const totalWeight = quantity * weight;
    const { data, error } = await supabaseAdmin.rpc('adjust_stock', {
        p_product_id: productId,
        p_amount: totalWeight,
        p_reason: 'INCREMENT_STOCK',
        p_source: 'SYSTEM'
    });

    if (error) throw error;
    return { id: productId, stockWeight: data };
};

// ── STOCK QUERIES ─────────────────────────────────────────────────────────
export const getStockLevel = async (productId: string) => {
    const { data, error } = await supabaseAdmin
        .from('products')
        .select('id, name, stock_weight')
        .eq('id', productId)
        .single();
    
    if (error || !data) return null;
    return { id: data.id, name: data.name, stockWeight: data.stock_weight };
};

export const getLowStockProducts = async (threshold = 500) => {
    const { data, error } = await supabaseAdmin
        .from('products')
        .select('*')
        .lte('stock_weight', threshold)
        .order('stock_weight', { ascending: true });

    if (error) throw error;
    return (data || []).map(p => ({
        ...p,
        stockWeight: p.stock_weight
    }));
};

// ── ADMIN ADJUSTMENTS ─────────────────────────────────────────────────────
export const adjustStock = async (
    productId: string,
    weightAmount: number, // can be positive or negative
    reason: string
) => {
    const { data, error } = await supabaseAdmin.rpc('adjust_stock', {
        p_product_id: productId,
        p_amount: weightAmount,
        p_reason: reason,
        p_source: 'ADMIN'
    });

    if (error) throw error;
    
    // Fetch product to return full data as before
    const { data: product } = await supabaseAdmin
        .from('products')
        .select('*')
        .eq('id', productId)
        .single();

    return { ...product, stockWeight: product?.stock_weight };
};

// ── HISTORY ───────────────────────────────────────────────────────────────
export const getInventoryHistory = async (filters?: { productId?: string; changeType?: string }) => {
    let query = supabaseAdmin
        .from('inventory_logs')
        .select('*, products(name, brand, image_url)')
        .order('created_at', { ascending: false });
    
    if (filters?.productId) {
        query = query.eq('product_id', filters.productId);
    }
    if (filters?.changeType) {
        query = query.eq('change_type', filters.changeType);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    
    return (data || []).map(log => ({
        id: log.id,
        productId: log.product_id,
        changeType: log.change_type,
        quantity: log.quantity,
        source: log.source,
        reason: log.reason,
        createdAt: new Date(log.created_at),
        product: log.products ? {
            name: log.products.name,
            brand: log.products.brand,
            imageUrl: log.products.image_url
        } : null
    }));
};
