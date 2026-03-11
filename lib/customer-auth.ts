import { cookies } from "next/headers";
import { verifyJwtToken } from "./auth";
import { adminDb } from "./firebase-admin";

export async function getCustomerSession() {
    const cookieStore = await cookies();
    const token = cookieStore.get("customer_token")?.value;

    if (!token) return null;

    try {
        const payload = await verifyJwtToken(token);
        if (!payload || !payload.sub || payload.role !== "TRADER") {
            return null;
        }

        const customerDoc = await adminDb.collection("customers").doc(payload.sub as string).get();
        if (!customerDoc.exists) return null;

        const data = customerDoc.data()!;
        return {
            id: customerDoc.id,
            name: data.name,
            phone: data.phone,
            shopName: data.shopName,
            wilaya: data.wilaya,
            address: data.address,
        };
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
