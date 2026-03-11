import { adminDb } from "@/lib/firebase-admin";

// ── STOCK ADJUSTMENTS ─────────────────────────────────────────────────────
export const decrementStock = async (productId: string, quantity: number, weight: number = 100) => {
    const totalWeight = quantity * weight;
    
    return await adminDb.runTransaction(async (t) => {
        const productRef = adminDb.collection("products").doc(productId);
        const productDoc = await t.get(productRef);
        
        if (!productDoc.exists) throw new Error(`Product ${productId} not found`);
        
        const data = productDoc.data();
        const currentStock = data?.stockWeight || 0;
        
        if (currentStock < totalWeight) {
            throw new Error(`Insufficient stock for "${data?.name}". Available: ${currentStock}g, Requested: ${totalWeight}g`);
        }
        
        t.update(productRef, { stockWeight: currentStock - totalWeight });
        return { id: productId, ...data, stockWeight: currentStock - totalWeight };
    });
};

export const incrementStock = async (productId: string, quantity: number, weight: number = 100) => {
    const totalWeight = quantity * weight;
    return await adminDb.runTransaction(async (t) => {
        const productRef = adminDb.collection("products").doc(productId);
        const productDoc = await t.get(productRef);
        
        if (!productDoc.exists) throw new Error(`Product ${productId} not found`);
        const currentStock = productDoc.data()?.stockWeight || 0;
        
        t.update(productRef, { stockWeight: currentStock + totalWeight });
        return { id: productId, ...productDoc.data(), stockWeight: currentStock + totalWeight };
    });
};

// ── STOCK QUERIES ─────────────────────────────────────────────────────────
export const getStockLevel = async (productId: string) => {
    const doc = await adminDb.collection("products").doc(productId).get();
    if (!doc.exists) return null;
    const data = doc.data();
    return { id: doc.id, name: data?.name, stockWeight: data?.stockWeight };
};

export const getLowStockProducts = async (threshold = 500) => {
    const query = await adminDb.collection("products").where("stockWeight", "<=", threshold).orderBy("stockWeight", "asc").get();
    return query.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// ── ADMIN ADJUSTMENTS ─────────────────────────────────────────────────────
export const adjustStock = async (
    productId: string,
    weightAmount: number, // can be positive or negative
    reason: string
) => {
    return await adminDb.runTransaction(async (t) => {
        const productRef = adminDb.collection("products").doc(productId);
        const productDoc = await t.get(productRef);
        
        if (!productDoc.exists) throw new Error("Product not found");

        const data = productDoc.data();
        const currentStock = data?.stockWeight || 0;
        const newStock = currentStock + weightAmount;
        
        if (newStock < 0) {
            throw new Error("Cannot adjust stock below 0g.");
        }

        t.update(productRef, { stockWeight: newStock });

        const logRef = adminDb.collection("inventory_logs").doc();
        t.set(logRef, {
            productId,
            changeType: "MANUAL_ADJUSTMENT",
            quantity: weightAmount,
            source: "ADMIN",
            reason,
            createdAt: new Date()
        });

        return { id: productId, ...data, stockWeight: newStock };
    });
};

// ── HISTORY ───────────────────────────────────────────────────────────────
export const getInventoryHistory = async (filters?: { productId?: string; changeType?: "SALE" | "CANCEL" | "RESTOCK" | "MANUAL_ADJUSTMENT" }) => {
    let queryRef: any = adminDb.collection("inventory_logs");
    
    if (filters?.productId) {
        queryRef = queryRef.where("productId", "==", filters.productId);
    }
    if (filters?.changeType) {
        queryRef = queryRef.where("changeType", "==", filters.changeType);
    }
    
    // We disable sorting by createdAt locally if query requires compound index that doesn't exist yet
    // For migration, we'll fetch then sort to be safe
    const query = await queryRef.get();
    
    const logs = await Promise.all(query.docs.map(async (doc: any) => {
        const data = doc.data();
        let productInfo = null;
        if (data.productId) {
            const pDoc = await adminDb.collection("products").doc(data.productId).get();
            if (pDoc.exists) {
                const pData = pDoc.data();
                productInfo = { name: pData?.name, brand: pData?.brand, imageUrl: pData?.imageUrl };
            }
        }
        return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate(),
            product: productInfo
        };
    }));
    
    return logs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
};
