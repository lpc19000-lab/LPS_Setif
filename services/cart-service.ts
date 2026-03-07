import prisma from "@/lib/db";

// PriceTier is no longer used for volume-based selling

// ── READ ──────────────────────────────────────────────────────────────────
export const getCart = async (customerId: string) => {
    const cart = await prisma.cart.findUnique({
        where: { customerId },
        include: {
            items: {
                include: {
                    product: {
                        include: { category: true, priceTiers: { orderBy: { minQuantity: "asc" } } },
                    },
                },
            },
        },
    });

    if (!cart) return { items: [], totalPrice: 0 };

    // Calculate total using volume-based pricing
    let totalPrice = 0;
    const enrichedItems = cart.items.map((item) => {
        // Find the matching volume price
        const volumeData = (item.product as any).volumes?.find((v: any) => v.ml === item.selectedVolume);
        const unitPrice = volumeData ? Number(volumeData.price) : (Number(item.product.basePrice) / 100) * item.selectedVolume;

        const lineTotal = unitPrice * item.quantity;
        totalPrice += lineTotal;
        return { ...item, unitPrice, lineTotal };
    });

    return { ...cart, items: enrichedItems, totalPrice };
};

// ── ADD TO CART ───────────────────────────────────────────────────────────
export const addToCart = async (
    customerId: string,
    productId: string,
    quantity: number
) => {
    // Validate product exists
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new Error("Product not found");

    // Validate minimum order quantity
    if (quantity < product.minimumOrderQuantity) {
        throw new Error(
            `Minimum order quantity for "${product.name}" is ${product.minimumOrderQuantity}`
        );
    }

    // Validate units per box
    if (quantity % product.unitsPerBox !== 0) {
        throw new Error(
            `Quantity must be a multiple of ${product.unitsPerBox} (units per box)`
        );
    }

    // Validate stock availability (ml-based)
    const requiredMl = quantity * (selectedVolume || 100);
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

    // Check if item with same volume is already in cart
    const existingItem = await prisma.cartItem.findFirst({
        where: { cartId: cart.id, productId, selectedVolume: selectedVolume || 100 },
    });

    if (existingItem) {
        return await prisma.cartItem.update({
            where: { id: existingItem.id },
            data: { quantity: existingItem.quantity + quantity },
            include: { product: true },
        });
    }

    return await prisma.cartItem.create({
        data: { cartId: cart.id, productId, quantity, selectedVolume: selectedVolume || 100 },
        include: { product: true },
    });
};

export const addToCart = async (
    customerId: string,
    productId: string,
    quantity: number,
    selectedVolume: number = 100
) => {
    // Validate product exists
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new Error("Product not found");

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
