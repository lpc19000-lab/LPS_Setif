import { getOrders } from "@/services/order-service";
import OrderClientView from "@/components/admin/OrderClientView";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
    const orders = await getOrders();

    // Serialize Decimal amounts for the Client Component
    const serializedOrders = orders.map((o) => ({
        ...o,
        totalPrice: Number(o.totalPrice),
        items: o.items.map(i => ({
            ...i,
            price: Number(i.price),
            product: {
                ...i.product,
                basePrice: Number(i.product.basePrice),
            }
        })),
        invoice: o.invoice ? {
            ...o.invoice,
            totalAmount: Number(o.invoice.totalAmount)
        } : null
    }));

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-serif font-bold text-primary-dark tracking-tight">Orders</h1>
                    <p className="text-gray-500 mt-1 tracking-wide">Manage B2B orders and update fulfillment statuses.</p>
                </div>
            </div>

            <OrderClientView orders={serializedOrders} />
        </div>
    );
}
