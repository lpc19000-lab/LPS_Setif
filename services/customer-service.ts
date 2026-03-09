import prisma from "@/lib/db";

// ── REGISTER ──────────────────────────────────────────────────────────────
export const registerCustomer = async (data: {
    name: string;
    phone: string;
    wilayaNumber: string;
    wilayaName: string;
    address: string;
    shopName: string;
}) => {
    // Check if phone is already registered
    const existing = await prisma.customer.findUnique({
        where: { phone: data.phone },
    });
    if (existing) {
        throw new Error("A customer with this phone number already exists");
    }

    return await prisma.customer.create({ 
        data: {
            ...data,
            wilaya: `${data.wilayaNumber} - ${data.wilayaName}`
        }
    });
};

// ── READ ──────────────────────────────────────────────────────────────────
export const getCustomerById = async (id: string) => {
    return await prisma.customer.findUnique({
        where: { id },
        include: { orders: { include: { items: true } } },
    });
};

export const getCustomerByPhone = async (phone: string) => {
    return await prisma.customer.findUnique({
        where: { phone },
    });
};

export const getCustomers = async () => {
    return await prisma.customer.findMany({
        include: { orders: { select: { id: true, totalPrice: true, status: true } } },
        orderBy: { createdAt: "desc" },
    });
};

// ── UPDATE ────────────────────────────────────────────────────────────────
export const updateCustomer = async (
    id: string,
    data: Partial<{
        name: string;
        phone: string;
        wilayaNumber: string;
        wilayaName: string;
        address: string;
        shopName: string;
    }>
) => {
    return await prisma.customer.update({ where: { id }, data });
};
