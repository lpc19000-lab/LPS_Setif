import prisma from "@/lib/db";

// ── READ ──────────────────────────────────────────────────────────────────
export const getCart = async (customerId: string) => {
    const cart = await prisma.cart.findUnique({
        where: { customerId },
        include: {
            items: {
                include: {
                    product: {
                        include: { 
                            category: true, 
                            volumes: true 
                        },
                    },
                },
            },
        },
    });

    if (!cart) return { items: [], totalPrice: 0 };

    // Calculate total using volume-based pricing
    let totalPrice = 0;
    const enrichedItems = cart.items.map((item) => {
        // Find matching volume price in database
        const volumeData = item.product.volumes.find((v) => v.ml === item.selectedVolume);
        
        // Calculate unit price: fixed volume price OR calculated from basePrice
        const unitPrice = volumeData 
            ? Number(volumeData.price) 
            : (Number(item.product.basePrice) / 100) * item.selectedVolume;

        const lineTotal = unitPrice * item.quantity;
        totalPrice += lineTotal;
        
        return { 
            ...item, 
            unitPrice, 
            lineTotal 
        };
    });

    return { ...cart, items: enrichedItems, totalPrice };
};

// ── ADD TO CART ───────────────────────────────────────────────────────────
export const addToCart = async (
    customerId: string,
    productId: string,
    quantity: number,
    selectedVolume: number = 100
) => {
    // Validate product existence and fetch necessary fields
    const product = await prisma.product.findUnique({ 
        where: { id: productId },
        select: { id: true, name: true, stockMl: true }
    });
    
    if (!product) throw new Error("Product not found");

    // Validate stock availability (ml-based)
    const requiredMl = quantity * selectedVolume;
    if (product.stockMl < requiredMl) {
        throw new Error(
            `Insufficient stock for "${product.name}". Available: ${product.stockMl}ml`
        );
    }

    // Ensure cart exists
    let cart = await prisma.cart.findUnique({ where: { customerId } });
    if (!cart) {
        cart = await prisma.cart.create({ data: { customerId } });
    }

    // UNIQUE CONSTRAINT: Identify item by (cart, product, volume)
    const existingItem = await prisma.cartItem.findFirst({
        where: { 
            cartId: cart.id, 
            productId, 
            selectedVolume 
        },
    });

    if (existingItem) {
        // Update quantity
        return await prisma.cartItem.update({
            where: { id: existingItem.id },
            data: { quantity: existingItem.quantity + quantity },
            include: { product: true },
        });
    }

    // Create new line item
    return await prisma.cartItem.create({
        data: { 
            cartId: cart.id, 
            productId, 
            quantity, 
            selectedVolume 
        },
        include: { product: true },
    });
};

// ── UPDATE CART ITEM ──────────────────────────────────────────────────────
export const updateCartItem = async (cartItemId: string, quantity: number) => {
    const cartItem = await prisma.cartItem.findUnique({
        where: { id: cartItemId },
        include: { product: true },
    });

    if (!cartItem) throw new Error("Cart item not found");

    if (quantity <= 0) {
        return await prisma.cartItem.delete({ where: { id: cartItemId } });
    }

    // Stock validation for update
    const requiredMl = quantity * cartItem.selectedVolume;
    if (cartItem.product.stockMl < requiredMl) {
        throw new Error(
            `Insufficient stock. Available: ${cartItem.product.stockMl}ml`
        );
    }

    return await prisma.cartItem.update({
        where: { id: cartItemId },
        data: { quantity },
        include: { product: true },
    });
};

// ── REMOVE CART ITEM ──────────────────────────────────────────────────────
export const removeCartItem = async (cartItemId: string) => {
    return await prisma.cartItem.delete({ where: { id: cartItemId } });
};

// ── CLEAR CART ────────────────────────────────────────────────────────────
export const clearCart = async (customerId: string) => {
    const cart = await prisma.cart.findUnique({ where: { customerId } });
    if (cart) {
        await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    }
};
