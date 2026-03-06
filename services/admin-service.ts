import prisma from "@/lib/db";
import bcrypt from "bcryptjs";

export const createAdminUser = async (data: {
    email: string;
    password: string;
    name?: string;
}) => {
    const hashedPassword = await bcrypt.hash(data.password, 10);
    return await prisma.admin.create({
        data: {
            email: data.email,
            passwordHash: hashedPassword,
            name: data.name,
        },
    });
};

export const getAdminStats = async () => {
    const [totalOrders, totalCustomers, totalProducts, totalRevenue] = await Promise.all([
        prisma.order.count(),
        prisma.customer.count(),
        prisma.product.count(),
        prisma.order.aggregate({
            _sum: {
                totalPrice: true,
            },
        }),
    ]);

    return {
        totalOrders,
        totalCustomers,
        totalProducts,
        totalRevenue: totalRevenue._sum.totalPrice || 0,
    };
};

export const validateAdminCredentials = async (email: string, password: string) => {
    const admin = await prisma.admin.findUnique({
        where: { email },
    });

    if (!admin) return null;

    const isValid = await bcrypt.compare(password, admin.passwordHash);
    if (!isValid) return null;

    return admin;
};
