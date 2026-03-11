import { adminDb } from "@/lib/firebase-admin";

// ── READ ──────────────────────────────────────────────────────────────────
export const getCart = async (customerId: string) => {
    const doc = await adminDb.collection("carts").doc(customerId).get();

    if (!doc.exists) return { items: [], totalPrice: 0 };
    
    const cartData = doc.data();
    const items = cartData?.items || [];

    // Calculate total using volume-based pricing
    let totalPrice = 0;
    
    // We need to fetch product info for these items
    const enrichedItems = await Promise.all(items.map(async (item: any) => {
        const pDoc = await adminDb.collection("products").doc(item.productId).get();
        if (!pDoc.exists) return null;
        
        const product: any = { id: pDoc.id, ...pDoc.data() };
        
        let volumeData: any = null;
        let weight = 0;
        let unitPrice = 0;

        if (item.volumeId && product.volumes && Array.isArray(product.volumes)) {
            volumeData = product.volumes.find((v: any) => v.id === item.volumeId);
            if (volumeData) {
                weight = volumeData.weight || 0;
                unitPrice = Number(volumeData.price);
            }
        }
        
        if (!volumeData) {
            weight = 0;
            unitPrice = (Number(product.basePrice) / 100) * weight;
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
            weight,
            product,
            volume: volumeData
        };
    }));

    const validItems = enrichedItems.filter(Boolean);

    return { id: customerId, customerId, createdAt: cartData?.createdAt?.toDate(), items: validItems, totalPrice };
};

// ── ADD TO CART ───────────────────────────────────────────────────────────
export const addToCart = async (
    customerId: string,
    productId: string,
    quantity: number,
    volumeId: string
) => {
    // Validate product existence
    const productDoc = await adminDb.collection("products").doc(productId).get();
    if (!productDoc.exists) throw new Error("Product not found");

    const product = productDoc.data();
    
    // Validate volume
    let volume = null;
    if (volumeId && product?.volumes && Array.isArray(product.volumes)) {
        volume = product.volumes.find((v: any) => v.id === volumeId);
    }
    
    if (!volume && volumeId) throw new Error("Volume not found");

    // Validate stock availability
    const requiredWeight = quantity * (volume?.weight || 0);
    if ((product?.stockWeight || 0) < requiredWeight) {
        throw new Error(`Insufficient stock for "${product?.name}". Available: ${product?.stockWeight}g`);
    }

    // Ensure cart exists
    const cartRef = adminDb.collection("carts").doc(customerId);
    const cartDoc = await cartRef.get();
    
    let items = [];
    if (!cartDoc.exists) {
        await cartRef.set({ customerId, items: [], createdAt: new Date() });
    } else {
        items = cartDoc.data()?.items || [];
    }

    // UNIQUE CONSTRAINT: Identify item by (cart, product, volumeId)
    const existingIndex = items.findIndex((i: any) => i.productId === productId && i.volumeId === volumeId);

    let updatedItem;
    if (existingIndex > -1) {
        items[existingIndex].quantity += quantity;
        updatedItem = items[existingIndex];
    } else {
        updatedItem = {
            id: adminDb.collection('carts').doc().id, // Generate a random ID for the item
            productId,
            quantity,
            volumeId
        };
        items.push(updatedItem);
    }

    await cartRef.update({ items });

    return { ...updatedItem, product: { id: productId, ...product }, volume };
};

// ── UPDATE CART ITEM ──────────────────────────────────────────────────────
export const updateCartItem = async (cartItemId: string, quantity: number) => {
    // Since items are inside carts by array, we have to find which cart has this cartItemId
    // This isn't efficient in NoSQL without knowing the cart ID. 
    // Ideally, the client passes customerId as well, but for compatibility let's search.
    const cartsQuery = await adminDb.collection("carts").get();
    let foundCart = null;
    let foundItemIndex = -1;
    
    for (const doc of cartsQuery.docs) {
        const items = doc.data().items || [];
        const index = items.findIndex((i: any) => i.id === cartItemId);
        if (index > -1) {
            foundCart = { id: doc.id, items };
            foundItemIndex = index;
            break;
        }
    }

    if (!foundCart || foundItemIndex === -1) throw new Error("Cart item not found");

    const cartRef = adminDb.collection("carts").doc(foundCart.id);
    const cartItem = foundCart.items[foundItemIndex];

    if (quantity <= 0) {
        foundCart.items.splice(foundItemIndex, 1);
        await cartRef.update({ items: foundCart.items });
        return { id: cartItemId };
    }

    // Stock validation
    const pDoc = await adminDb.collection("products").doc(cartItem.productId).get();
    const productData = pDoc.data();
    
    let volumeWeight = 0;
    let volumeData = null;
    if (cartItem.volumeId && productData?.volumes) {
        volumeData = productData.volumes.find((v: any) => v.id === cartItem.volumeId);
        volumeWeight = volumeData?.weight || 0;
    }
    
    const requiredWeight = quantity * volumeWeight;
    if ((productData?.stockWeight || 0) < requiredWeight) {
        throw new Error(`Insufficient stock. Available: ${productData?.stockWeight}g`);
    }

    foundCart.items[foundItemIndex].quantity = quantity;
    await cartRef.update({ items: foundCart.items });

    return {
        ...foundCart.items[foundItemIndex],
        product: { id: pDoc.id, ...productData },
        volume: volumeData
    };
};

// ── REMOVE CART ITEM ──────────────────────────────────────────────────────
export const removeCartItem = async (cartItemId: string) => {
    // Find and remove
    const cartsQuery = await adminDb.collection("carts").get();
    let foundCart = null;
    let foundItemIndex = -1;
    
    for (const doc of cartsQuery.docs) {
        const items = doc.data().items || [];
        const index = items.findIndex((i: any) => i.id === cartItemId);
        if (index > -1) {
            foundCart = { id: doc.id, items };
            foundItemIndex = index;
            break;
        }
    }

    if (foundCart && foundItemIndex > -1) {
        foundCart.items.splice(foundItemIndex, 1);
        await adminDb.collection("carts").doc(foundCart.id).update({ items: foundCart.items });
    }
    return { id: cartItemId };
};

// ── CLEAR CART ────────────────────────────────────────────────────────────
export const clearCart = async (customerId: string) => {
    const cartRef = adminDb.collection("carts").doc(customerId);
    const doc = await cartRef.get();
    if (doc.exists) {
        await cartRef.update({ items: [] });
    }
};
