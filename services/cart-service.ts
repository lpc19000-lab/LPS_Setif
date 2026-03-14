import { supabaseAdmin } from "@/lib/supabase-admin";

// ── READ ──────────────────────────────────────────────────────────────────
export const getCart = async (customerId: string) => {
    const { data: cart, error: cError } = await supabaseAdmin
        .from('carts')
        .select('*')
        .eq('customer_id', customerId)
        .maybeSingle();

    if (cError || !cart) return { items: [], totalPrice: 0 };
    
    const items = cart.items || [];
    let totalPrice = 0;

    // Enrich items with product data
    const productIds = [...new Set(items.map((i: any) => i.productId))];
    const { data: products } = await supabaseAdmin
        .from('products')
        .select('*')
        .in('id', productIds);

    const productsMap = new Map((products || []).map(p => [p.id, p]));

    const enrichedItems = items.map((item: any) => {
        const product = productsMap.get(item.productId);
        if (!product) return null;
        
        let volumeData: any = null;
        let unitPrice = 0;

        if (item.volumeId && product.volumes) {
            volumeData = product.volumes.find((v: any) => v.id === item.volumeId);
            if (volumeData) {
                unitPrice = Number(volumeData.price);
            }
        }
        
        if (!volumeData) {
            unitPrice = 0; // Or standard pricing logic
        }

        const lineTotal = unitPrice * item.quantity;
        totalPrice += lineTotal;

        return {
            id: item.id,
            cartId: customerId,
            productId: item.productId,
            quantity: item.quantity,
            volumeId: item.volumeId,
            unitPrice,
            lineTotal,
            weight: volumeData?.weight || 0,
            product,
            volume: volumeData
        };
    }).filter(Boolean);

    return { 
        id: customerId, 
        customerId, 
        createdAt: new Date(cart.created_at), 
        items: enrichedItems, 
        totalPrice 
    };
};

// ── ADD TO CART ───────────────────────────────────────────────────────────
export const addToCart = async (
    customerId: string,
    productId: string,
    quantity: number,
    volumeId: string
) => {
    const { data: product, error: pError } = await supabaseAdmin
        .from('products')
        .select('*')
        .eq('id', productId)
        .single();

    if (pError || !product) throw new Error("Product not found");

    const volume = (product.volumes || []).find((v: any) => v.id === volumeId);
    if (!volume && volumeId) throw new Error("Volume not found");

    const requiredWeight = quantity * (volume?.weight || 0);
    if ((product.stock_weight || 0) < requiredWeight) {
        throw new Error(`Insufficient stock for "${product.name}".`);
    }

    const { data: cart } = await supabaseAdmin
        .from('carts')
        .select('*')
        .eq('customer_id', customerId)
        .maybeSingle();

    let items = cart?.items || [];
    const existingIndex = items.findIndex((i: any) => i.productId === productId && i.volumeId === volumeId);

    let updatedItem;
    if (existingIndex > -1) {
        items[existingIndex].quantity += quantity;
        updatedItem = items[existingIndex];
    } else {
        updatedItem = {
            id: crypto.randomUUID(),
            productId,
            quantity,
            volumeId
        };
        items.push(updatedItem);
    }

    if (!cart) {
        await supabaseAdmin.from('carts').insert([{ customer_id: customerId, items }]);
    } else {
        await supabaseAdmin.from('carts').update({ items }).eq('customer_id', customerId);
    }

    return { ...updatedItem, product, volume };
};

// ── UPDATE CART ITEM ──────────────────────────────────────────────────────
export const updateCartItem = async (cartItemId: string, quantity: number) => {
    // In Supabase, we'll search carts for this item
    const { data: carts } = await supabaseAdmin.from('carts').select('*');
    
    let foundCart = null;
    let foundItemIndex = -1;
    
    for (const cart of (carts || [])) {
        const items = cart.items || [];
        const index = items.findIndex((i: any) => i.id === cartItemId);
        if (index > -1) {
            foundCart = cart;
            foundItemIndex = index;
            break;
        }
    }

    if (!foundCart || foundItemIndex === -1) throw new Error("Cart item not found");

    const cartItem = foundCart.items[foundItemIndex];

    if (quantity <= 0) {
        foundCart.items.splice(foundItemIndex, 1);
        await supabaseAdmin.from('carts').update({ items: foundCart.items }).eq('id', foundCart.id);
        return { id: cartItemId };
    }

    const { data: product } = await supabaseAdmin.from('products').select('*').eq('id', cartItem.productId).single();
    if (!product) throw new Error("Product not found");

    let volumeData = (product.volumes || []).find((v: any) => v.id === cartItem.volumeId);
    const requiredWeight = quantity * (volumeData?.weight || 0);
    if ((product.stock_weight || 0) < requiredWeight) {
        throw new Error(`Insufficient stock.`);
    }

    foundCart.items[foundItemIndex].quantity = quantity;
    await supabaseAdmin.from('carts').update({ items: foundCart.items }).eq('id', foundCart.id);

    return {
        ...foundCart.items[foundItemIndex],
        product,
        volume: volumeData
    };
};

// ── REMOVE CART ITEM ──────────────────────────────────────────────────────
export const removeCartItem = async (cartItemId: string) => {
    const { data: carts } = await supabaseAdmin.from('carts').select('*');
    for (const cart of (carts || [])) {
        const items = cart.items || [];
        const index = items.findIndex((i: any) => i.id === cartItemId);
        if (index > -1) {
            items.splice(index, 1);
            await supabaseAdmin.from('carts').update({ items }).eq('id', cart.id);
            break;
        }
    }
    return { id: cartItemId };
};

// ── CLEAR CART ────────────────────────────────────────────────────────────
export const clearCart = async (customerId: string) => {
    await supabaseAdmin.from('carts').update({ items: [] }).eq('customer_id', customerId);
};
