import { adminDb, adminAuth } from "@/lib/firebase-admin";
import bcrypt from "bcryptjs";
import { Admin } from "@/types/firebase";

export type { Admin };

export const createAdminUser = async (data: {
    email: string;
    password: string;
    name?: string;
}) => {
    // 1. Create user in Firebase Auth
    const userRecord = await adminAuth.createUser({
        email: data.email,
        password: data.password,
        displayName: data.name,
    });

    // 2. Set custom claims for role
    await adminAuth.setCustomUserClaims(userRecord.uid, { role: "SUPER_ADMIN" });

    // 3. Store admin profile in Firestore
    const hashedPassword = await bcrypt.hash(data.password, 10);
    const adminDoc = {
        email: data.email,
        passwordHash: hashedPassword,
        name: data.name,
        role: "SUPER_ADMIN",
        createdAt: new Date(),
    };

    await adminDb.collection("admins").doc(userRecord.uid).set(adminDoc);

    return { id: userRecord.uid, ...adminDoc };
};

export const getAdminStats = async () => {
    try {
        const [ordersSnapshot, customersSnapshot, productsSnapshot] = await Promise.all([
            adminDb.collection("orders").count().get(),
            adminDb.collection("customers").count().get(),
            adminDb.collection("products").count().get(),
        ]);

        // Revenue calculation (might be slow for huge datasets without a counter, but works for smaller sets)
        const ordersQuery = await adminDb.collection("orders").get();
        let totalRevenue = 0;
        ordersQuery.forEach(doc => {
            const data = doc.data();
            totalRevenue += parseFloat(data.totalPrice || 0);
        });

        return {
            totalOrders: ordersSnapshot.data().count,
            totalCustomers: customersSnapshot.data().count,
            totalProducts: productsSnapshot.data().count,
            totalRevenue,
        };
    } catch (error) {
        console.error("Error getting admin stats:", error);
        return {
            totalOrders: 0,
            totalCustomers: 0,
            totalProducts: 0,
            totalRevenue: 0,
        };
    }
};

export const validateAdminCredentials = async (email: string, password: string) => {
    // Find admin in firestore
    const adminQuery = await adminDb.collection("admins").where("email", "==", email).limit(1).get();
    
    if (adminQuery.empty) return null;
    
    const adminDoc = adminQuery.docs[0];
    const admin = adminDoc.data();

    const isValid = await bcrypt.compare(password, admin.passwordHash);
    if (!isValid) return null;

    return { id: adminDoc.id, ...admin };
};
