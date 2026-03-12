import { adminDb } from "@/lib/firebase-admin";
import { Customer } from "@/types/firebase";

export type { Customer };

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
    const existing = await adminDb.collection("customers").where("phone", "==", data.phone).limit(1).get();
    
    if (!existing.empty) {
        throw new Error("A customer with this phone number already exists");
    }

    const docRef = await adminDb.collection("customers").add({
        ...data,
        wilaya: `${data.wilayaNumber} - ${data.wilayaName}`,
        createdAt: new Date(),
    });

    return { id: docRef.id, ...data };
};

// ── READ ──────────────────────────────────────────────────────────────────
export const getCustomerById = async (id: string): Promise<Customer | null> => {
    try {
        const doc = await adminDb.collection("customers").doc(id).get();
        if (!doc.exists) return null;

        const d = doc.data()!;
        const ordersQuery = await adminDb.collection("orders")
            .where("customerId", "==", id)
            .orderBy("createdAt", "desc")
            .get();

        const orders = ordersQuery.docs.map(o => ({
            id: o.id,
            ...o.data(),
            createdAt: o.data().createdAt?.toDate()
        }));

        return {
            id: doc.id,
            ...d,
            email: d.email || "",
            name: d.name || "Unknown",
            phone: d.phone || "",
            wilaya: d.wilaya || "",
            address: d.address || "",
            shopName: d.shopName || "Customer",
            createdAt: d.createdAt?.toDate ? d.createdAt.toDate() : new Date(d.createdAt),
            ordersCount: orders.length,
            orders
        } as Customer;
    } catch (err) {
        console.error("Customer fetch error (getCustomerById):", err);
        return null;
    }
};

export const getCustomerByPhone = async (phone: string): Promise<Customer | null> => {
    try {
        const query = await adminDb.collection("customers").where("phone", "==", phone).limit(1).get();
        if (query.empty) return null;
        const doc = query.docs[0];
        const d = doc.data();
        return {
            id: doc.id,
            ...d,
            email: d.email || "",
            shopName: d.shopName || "Customer",
            createdAt: d.createdAt?.toDate ? d.createdAt.toDate() : new Date(d.createdAt),
            ordersCount: 0, // Simplified for byPhone read
        } as Customer;
    } catch (err) {
        console.error("Customer fetch error (getCustomerByPhone):", err);
        return null;
    }
};

export const getCustomers = async (): Promise<Customer[]> => {
    try {
        const customersQuery = await adminDb.collection("customers").orderBy("createdAt", "desc").get();
        const ordersQuery = await adminDb.collection("orders").get();

        const orderCountMap = new Map<string, number>();
        ordersQuery.docs.forEach(doc => {
            const cid = doc.data().customerId;
            if (cid) orderCountMap.set(cid, (orderCountMap.get(cid) || 0) + 1);
        });

        return customersQuery.docs.map(doc => {
            const d = doc.data();
            const ordersCount = orderCountMap.get(doc.id) || 0;
            return {
                id: doc.id,
                ...d,
                email: d.email || "",
                name: d.name || "Unknown",
                phone: d.phone || "",
                wilaya: d.wilaya || "",
                address: d.address || "",
                shopName: d.shopName || "Customer",
                createdAt: d.createdAt?.toDate ? d.createdAt.toDate() : new Date(d.createdAt),
                ordersCount,
                _count: { orders: ordersCount } // Maintain for compatibility
            } as Customer;
        });
    } catch (err) {
        console.error("Customers fetch error (getCustomers):", err);
        return [];
    }
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
    await adminDb.collection("customers").doc(id).update(data);
    return { id, ...data };
};
