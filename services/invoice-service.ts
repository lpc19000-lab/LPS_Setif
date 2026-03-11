import { adminDb } from "@/lib/firebase-admin";

// ── READ ──────────────────────────────────────────────────────────────────
export const getInvoices = async () => {
    // We assume invoices are embedded in orders or in a separate collection
    // Let's use separate 'invoices' collection for querying if they exist, or fetch orders that have invoices.
    const query = await adminDb.collection("orders").where("invoice.invoiceNumber", "!=", null).orderBy("issueDate", "desc").get();
    
    // In our schema, invoices are inside orders: order.invoice = { invoiceNumber, issueDate, totalAmount }
    const invoices = await Promise.all(query.docs.map(async (doc) => {
        const orderData = doc.data();
        
        let customerInfo = null;
        if (orderData.customerId) {
            const customerDoc = await adminDb.collection("customers").doc(orderData.customerId).get();
            customerInfo = { id: customerDoc.id, ...customerDoc.data() };
        }
        
        // Items logic could be detailed, simplified here
        const items = (orderData.items || []).map((i: any) => ({ ...i, product: { id: i.productId } }));

        return {
            id: orderData.invoice?.invoiceNumber || doc.id,
            orderId: doc.id,
            invoiceNumber: orderData.invoice?.invoiceNumber,
            issueDate: orderData.invoice?.issueDate?.toDate(),
            totalAmount: orderData.invoice?.totalAmount,
            order: {
                id: doc.id,
                ...orderData,
                customer: customerInfo,
                items
            }
        };
    }));

    return invoices;
};

export const getInvoiceById = async (id: string) => {
    return null; // Not typically used alone if invoice ID == invoiceNumber
};

export const getInvoiceByOrderId = async (orderId: string) => {
    const doc = await adminDb.collection("orders").doc(orderId).get();
    if (!doc.exists) return null;
    
    const orderData = doc.data();
    if (!orderData?.invoice) return null;
    
    let customerInfo = null;
    if (orderData.customerId) {
        const customerDoc = await adminDb.collection("customers").doc(orderData.customerId).get();
        customerInfo = { id: customerDoc.id, ...customerDoc.data() };
    }
    
    // Items logic could be detailed, simplified here
    const items = (orderData.items || []).map((i: any) => ({ ...i, product: { id: i.productId } }));

    return {
        id: orderData.invoice.invoiceNumber || doc.id,
        orderId: doc.id,
        invoiceNumber: orderData.invoice.invoiceNumber,
        issueDate: orderData.invoice.issueDate?.toDate(),
        totalAmount: orderData.invoice.totalAmount,
        order: {
            id: doc.id,
            ...orderData,
            customer: customerInfo,
            items
        }
    };
};

// ── CREATE (used internally by OrderService transaction) ──────────────────
export const createInvoice = async (orderId: string, amount: number) => {
    // Handled usually by updating the order document
    const invoiceCount = (await adminDb.collection("orders").where("invoice.invoiceNumber", "!=", null).count().get()).data().count;
    const invoiceNumber = `INV-${new Date().getFullYear()}-${(invoiceCount + 1)
        .toString()
        .padStart(4, "0")}`;

    const invoiceObj = {
        invoiceNumber,
        issueDate: new Date(),
        totalAmount: amount,
    };

    await adminDb.collection("orders").doc(orderId).update({ invoice: invoiceObj });

    return { id: invoiceNumber, orderId, ...invoiceObj };
};
