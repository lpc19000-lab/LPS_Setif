import { cookies } from "next/headers";
import { verifyJwtToken } from "./auth";
import prisma from "./db";

export async function getCustomerSession() {
    const cookieStore = await cookies();
    const token = cookieStore.get("customer_token")?.value;

    if (!token) return null;

    try {
        const payload = await verifyJwtToken(token);
        if (!payload || !payload.sub || payload.role !== "TRADER") {
            return null;
        }

        const customer = await prisma.customer.findUnique({
            where: { id: payload.sub as string },
            select: {
                id: true,
                name: true,
                phone: true,
                shopName: true,
                wilaya: true,
                address: true,
            },
        });

        return customer;
    } catch (error) {
        return null;
    }
}

export async function requireCustomerSession() {
    const session = await getCustomerSession();
    if (!session) {
        throw new Error("Unauthorized: Trader session required");
    }
    return session;
}
