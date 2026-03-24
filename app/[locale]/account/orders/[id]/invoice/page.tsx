import { requireCustomerSession } from "@/lib/customer-auth";
import { getOrderById } from "@/services/order-service";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Printer } from "lucide-react";
import Link from "next/link";
import InvoiceView from "@/components/shop/InvoiceView";
import PrintInvoiceButton from "@/components/shop/PrintInvoiceButton";

export const dynamic = "force-dynamic";

export default async function CustomerInvoicePage({ params }: { params: Promise<{ id: string, locale: string }> }) {
    const { id, locale } = await params;
    const customerSession = await requireCustomerSession();
    const order = await getOrderById(id);

    if (!order) notFound();
    if (!order.customer || order.customer.id !== customerSession.id) {
        redirect(`/${locale}/account/orders`);
    }

    if (!order.invoice) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 text-center max-w-sm">
                    <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center text-amber-500 mx-auto mb-4">
                        <Printer className="w-8 h-8 opacity-20" />
                    </div>
                    <h1 className="text-xl font-bold text-gray-900 mb-2">Invoice Not Available</h1>
                    <p className="text-sm text-gray-500 mb-6">Your invoice is being processed and will be available once the order is confirmed.</p>
                    <Link href={`/${locale}/account/orders/${id}`} className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:text-primary-dark transition-colors font-serif italic">
                        <ArrowLeft className="w-4 h-4" /> Back to Order Details
                    </Link>
                </div>
            </div>
        );
    }

    // Adapt order data to InvoiceView format
    const invoiceData = {
        invoiceNumber: order.invoice.invoiceNumber,
        issueDate: new Date(order.invoice.issueDate || order.createdAt),
        totalAmount: order.totalPrice,
        orderId: order.id,
        amountPaid: Number(order.amountPaid || 0),
        paymentStatus: order.paymentStatus || "UNPAID",
        order: {
            customer: {
                shopName: customerSession.shopName,
                name: customerSession.name,
                address: customerSession.address,
                wilaya: customerSession.wilaya,
                phone: customerSession.phone,
            },
            items: order.items.map((item: any) => ({
                product: {
                    name: item.product?.name || "Product",
                    brand: item.product?.brand || "",
                    imageUrl: item.product?.imageUrl
                },
                quantity: item.quantity,
                price: item.price,
                volume: item.volume,
                volumeId: item.volumeId
            }))
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 print:bg-white p-4 sm:p-12">
            {/* Action Bar */}
            <div className="max-w-4xl mx-auto mb-8 flex items-center justify-between border-b border-gray-100 pb-4 print:hidden">
                <Link href={`/${locale}/account/orders/${id}`} className="flex items-center gap-2 text-sm text-gray-500 hover:text-primary transition-colors font-bold">
                    <ArrowLeft className="w-4 h-4" /> Back to Order
                </Link>
                <PrintInvoiceButton />
            </div>

            <InvoiceView invoice={invoiceData} locale={locale} />
        </div>
    );
}
