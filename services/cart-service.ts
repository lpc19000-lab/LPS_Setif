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
                    volume: true
                },
            },
        },
    });

    if (!cart) return { items: [], totalPrice: 0 };

    // Calculate total using volume-based pricing
    let totalPrice = 0;
    const enrichedItems = cart.items.map((item) => {
        const volumeData = item.volume;

        const weight = volumeData?.weight || 0;
        const unitPrice = volumeData
            ? Number(volumeData.price)
            : (Number(item.product.basePrice) / 100) * weight;

        const lineTotal = unitPrice * item.quantity;
        totalPrice += lineTotal;

        return {
            ...item,
            unitPrice,
            lineTotal,
            weight
        };
    });

    return { ...cart, items: enrichedItems, totalPrice };
};

// ── ADD TO CART ───────────────────────────────────────────────────────────
export const addToCart = async (
    customerId: string,
    productId: string,
    quantity: number,
    volumeId: string
) => {
    // Validate product and volume existence
    const [product, volume] = await Promise.all([
        prisma.product.findUnique({
            where: { id: productId },
            select: { id: true, name: true, stockWeight: true }
        }),
        prisma.productVolume.findUnique({
            where: { id: volumeId }
        })
    ]);

    if (!product) throw new Error("Product not found");
    if (!volume) throw new Error("Volume not found");

    // Validate stock availability (weight-based)
    const requiredWeight = quantity * (volume.weight || 0);
    if (product.stockWeight < requiredWeight) {
        throw new Error(
            `Insufficient stock for "${product.name}". Available: ${product.stockWeight}g`
        );
    }

    // Ensure cart exists
    let cart = await prisma.cart.findUnique({ where: { customerId } });
    cart ??= await prisma.cart.create({ data: { customerId } });

    // UNIQUE CONSTRAINT: Identify item by (cart, product, volumeId)
    const existingItem = await prisma.cartItem.findFirst({
        where: {
            cartId: cart.id,
            productId,
            volumeId
        },
    });

    if (existingItem) {
        // Update quantity
        return await prisma.cartItem.update({
            where: { id: existingItem.id },
            data: { quantity: existingItem.quantity + quantity },
            include: { product: true, volume: true },
        });
    }

    // Create new line item
    return await prisma.cartItem.create({
        data: {
            cartId: cart.id,
            productId,
            quantity,
            volumeId
        },
        include: { product: true, volume: true },
    });
};

// ── UPDATE CART ITEM ──────────────────────────────────────────────────────
export const updateCartItem = async (cartItemId: string, quantity: number) => {
    const cartItem = await prisma.cartItem.findUnique({
        where: { id: cartItemId },
        include: { product: true, volume: true },
    });

    if (!cartItem) throw new Error("Cart item not found");

    if (quantity <= 0) {
        return await prisma.cartItem.delete({ where: { id: cartItemId } });
    }

    // Stock validation for update
    const requiredWeight = quantity * (cartItem.volume?.weight || 0);
    if (cartItem.product.stockWeight < requiredWeight) {
        throw new Error(
            `Insufficient stock. Available: ${cartItem.product.stockWeight}g`
        );
    }

    return await prisma.cartItem.update({
        where: { id: cartItemId },
        data: { quantity },
        include: { product: true, volume: true },
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
