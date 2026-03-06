import prisma from "@/lib/db";

// ── TIERED PRICING HELPER ────────────────────────────────────────────────
export const getTieredPrice = async (productId: string, quantity: number): Promise<number | null> => {
    const tiers = await prisma.priceTier.findMany({
        where: { productId },
        orderBy: { minQuantity: "desc" },
    });
    for (const tier of tiers) {
        if (quantity >= tier.minQuantity) {
            return Number(tier.price);
        }
    }
    return null; // No tier matched — use default wholesale price
};

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

    // Calculate total using tiered pricing
    let totalPrice = 0;
    const enrichedItems = cart.items.map((item) => {
        const tiers = item.product.priceTiers;
        let unitPrice = Number(item.product.wholesalePrice);

        // Apply the best matching tier (sorted desc by minQuantity)
        for (let i = tiers.length - 1; i >= 0; i--) {
            if (item.quantity >= tiers[i].minQuantity) {
                unitPrice = Number(tiers[i].price);
                break;
            }
        }

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

    // Validate stock availability
    if (product.stockQuantity < quantity) {
        throw new Error(
            `Only ${product.stockQuantity} units available for "${product.name}"`
        );
    }

    // Ensure cart exists
    let cart = await prisma.cart.findUnique({ where: { customerId } });
    if (!cart) {
        cart = await prisma.cart.create({ data: { customerId } });
    }

    // Check if item is already in cart
    const existingItem = await prisma.cartItem.findFirst({
        where: { cartId: cart.id, productId },
    });

    if (existingItem) {
        return await prisma.cartItem.update({
            where: { id: existingItem.id },
            data: { quantity: existingItem.quantity + quantity },
            include: { product: true },
        });
    }

    return await prisma.cartItem.create({
        data: { cartId: cart.id, productId, quantity },
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

    // Validate units per box
    if (quantity % cartItem.product.unitsPerBox !== 0) {
        throw new Error(
            `Quantity must be a multiple of ${cartItem.product.unitsPerBox} (units per box)`
        );
    }

    // Validate minimum order quantity
    if (quantity < cartItem.product.minimumOrderQuantity) {
        throw new Error(
            `Minimum order quantity is ${cartItem.product.minimumOrderQuantity}`
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
