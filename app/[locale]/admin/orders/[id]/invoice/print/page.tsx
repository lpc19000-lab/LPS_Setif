import { getInvoiceByOrderId } from "@/services/invoice-service";
import { notFound } from "next/navigation";
import InvoiceView from "@/components/shop/InvoiceView";
import PrintInvoiceButton from "@/components/shop/PrintInvoiceButton";

export const dynamic = "force-dynamic";

export default async function PrintInvoicePage({ params }: { params: Promise<{ locale: string; id: string }> }) {
    const { locale, id } = await params;
    const invoiceData = await getInvoiceByOrderId(id);

    if (!invoiceData) notFound();

    const order = invoiceData.order;

    // Adapt the unified service data to InvoiceView structure
    const unifiedInvoice = {
        invoiceNumber: invoiceData.invoiceNumber,
        issueDate: invoiceData.issueDate || new Date(),
        totalAmount: order.total_price,
        orderId: order.id,
        amountPaid: Number(order.amount_paid || 0),
        paymentStatus: order.payment_status || "UNPAID",
        order: {
            customer: {
                shopName: order.customer?.shop_name || "Unknown",
                name: order.customer?.name || "",
                address: order.customer?.address || "",
                wilaya: order.customer?.wilaya || "",
                phone: order.customer?.phone || "",
            },
            items: (order.items || []).map((item: any) => {
                const prod = Array.isArray(item.product) ? item.product[0] : item.product;
                return {
                    product: {
                        name: (prod?.name || item.product_name) || "Product",
                        brand: prod?.brand || "",
                        imageUrl: prod?.image_url || null
                    },
                    quantity: item.quantity,
                    price: item.price
                };
            })
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 print:bg-white p-4 sm:p-12">
            <div className="max-w-4xl mx-auto mb-8 flex items-center justify-end print:hidden">
                <PrintInvoiceButton />
            </div>
            <InvoiceView invoice={unifiedInvoice} locale={locale} />
        </div>
    );
}
