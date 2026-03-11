import { adminDb } from "@/lib/firebase-admin";

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
export const getCustomerById = async (id: string) => {
    const doc = await adminDb.collection("customers").doc(id).get();
    if (!doc.exists) return null;

    const ordersQuery = await adminDb.collection("orders")
        .where("customerId", "==", id)
        .orderBy("createdAt", "desc")
        .get();

    const orders = ordersQuery.docs.map(o => ({
        id: o.id,
        ...o.data(),
        createdAt: o.data().createdAt?.toDate()
    }));

    return { id: doc.id, ...doc.data(), orders };
};

export const getCustomerByPhone = async (phone: string) => {
    const query = await adminDb.collection("customers").where("phone", "==", phone).limit(1).get();
    if (query.empty) return null;
    return { id: query.docs[0].id, ...query.docs[0].data() };
};

export const getCustomers = async () => {
    const customersQuery = await adminDb.collection("customers").orderBy("createdAt", "desc").get();
    const ordersQuery = await adminDb.collection("orders").get();

    const customerOrdersMap = new Map();
    ordersQuery.docs.forEach(doc => {
        const o = doc.data();
        if (o.customerId) {
            const curr = customerOrdersMap.get(o.customerId) || [];
            curr.push({ id: doc.id, totalPrice: o.totalPrice, status: o.status });
            customerOrdersMap.set(o.customerId, curr);
        }
    });

    return customersQuery.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        orders: customerOrdersMap.get(doc.id) || []
    }));
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
