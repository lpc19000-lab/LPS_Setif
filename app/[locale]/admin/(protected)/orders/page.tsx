import { adminDb } from "@/lib/firebase-admin";
import { QueryDocumentSnapshot, DocumentData } from "firebase-admin/firestore";
import { getOrders } from "@/services/order-service";
import OrderClientView from "@/components/admin/OrderClientView";
import RealtimeReloader from "@/components/admin/RealtimeReloader";
import { getTranslations } from "next-intl/server";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: "admin.orders" });
    const ordersSnap = await adminDb.collection("orders").orderBy("createdAt", "desc").get();
    const orders = ordersSnap.docs.map((o: QueryDocumentSnapshot<DocumentData>) => ({
        id: o.id,
        ...o.data() as any,
        createdAt: (o.data() as any).createdAt?.toDate(),
        items: (o.data() as any).items.map((i: any) => ({
            ...i,
            price: Number(i.price || 0),
            product: i.product ? {
                ...i.product,
                basePrice: Number((i.product as any).basePrice || (i.product as any).price || 0),
            } : null
        })),
        invoice: (o.data() as any).invoice ? {
            ...(o.data() as any).invoice,
            totalAmount: Number((o.data() as any).invoice.totalAmount || 0)
        } : null
    }));

    // Serialize Decimal amounts for the Client Component
    const serializedOrders = orders.map((o) => ({
        ...o,
        totalPrice: Number(o.totalPrice),
        items: o.items.map((i: any) => ({
            ...i,
            price: Number(i.price || 0),
            product: i.product ? {
                ...i.product,
                basePrice: Number((i.product as any).basePrice || (i.product as any).price || 0),
            } : null
        })),
        invoice: o.invoice ? {
            ...o.invoice,
            totalAmount: Number(o.invoice.totalAmount || 0)
        } : null
    }));

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-serif font-bold text-primary-dark tracking-tight">{t("title")}</h1>
                    <p className="text-gray-500 mt-1 tracking-wide">{t("subtitle")}</p>
                </div>
            </div>

            <OrderClientView orders={serializedOrders} />
            <RealtimeReloader />
        </div>
    );
}
