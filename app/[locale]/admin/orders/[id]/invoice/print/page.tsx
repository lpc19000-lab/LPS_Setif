
import { getInvoiceByOrderId } from "@/services/invoice-service";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import PrintButton from "@/components/admin/PrintButton";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ locale: string; id: string }>;
}

export default async function PrintInvoicePage({ params }: PageProps) {
  const { locale, id } = await params;
  const t = await getTranslations({ locale, namespace: "admin.orders" });
  const invoice = await getInvoiceByOrderId(id);

  if (!invoice) {
    notFound();
  }

  const order = invoice.order;

  return (
    <div className="bg-white min-h-screen p-8 max-w-[800px] mx-auto text-gray-900 font-sans print:p-0">
      {/* Print Controls (Hidden on Print) */}
      <div className="mb-8 flex justify-between items-center print:hidden bg-gray-50 p-4 rounded-xl border border-gray-100">
        <p className="text-sm font-medium text-gray-500 italic">Preuve d'impression - Format Officiel</p>
        <PrintButton label="Imprimer / Télécharger PDF" />
      </div>

      {/* Invoice Header */}
      <div className="flex justify-between items-start mb-12 border-b-2 border-primary pb-8">
        <div>
          <h1 className="text-4xl font-serif font-black text-primary-dark tracking-tighter uppercase mb-2">FACTURE</h1>
          <p className="text-lg font-bold text-gray-500">{invoice.invoiceNumber}</p>
        </div>
        <div className="text-right">
          <h2 className="text-2xl font-serif font-bold text-gray-900">LPS SETIF</h2>
          <p className="text-sm text-gray-600">Lattafa Perfumes Store</p>
          <p className="text-sm text-gray-600">Sétif, Algérie</p>
          <p className="text-sm text-gray-600">+213 542 30 34 96</p>
        </div>
      </div>

      {/* Billing Info */}
      <div className="grid grid-cols-2 gap-12 mb-12">
        <div>
          <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Facturer à</h3>
          <p className="text-lg font-bold text-gray-900">{order.customer?.shopName}</p>
          <p className="text-sm text-gray-700">{order.customer?.name}</p>
          <p className="text-sm text-gray-600">{order.customer?.address}</p>
          <p className="text-sm text-gray-600">{order.customer?.wilaya}, Algérie</p>
          <p className="text-sm text-gray-600">{order.customer?.phone}</p>
        </div>
        <div className="text-right">
          <div className="mb-4">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Date d'émission</h3>
            <p className="text-sm font-bold text-gray-900">
              {invoice.issueDate 
                ? new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long' }).format(new Date(invoice.issueDate))
                : 'N/A'}
            </p>
          </div>
          <div>
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Commande ID</h3>
            <p className="text-xs font-mono text-gray-500">#{order.id.toUpperCase()}</p>
          </div>
        </div>
      </div>

      {/* Items Table */}
      <table className="w-full mb-12 border-collapse">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Description</th>
            <th className="text-center py-4 text-xs font-black text-gray-400 uppercase tracking-widest w-24">Quantité</th>
            <th className="text-right py-4 text-xs font-black text-gray-400 uppercase tracking-widest w-32">Prix Unitaire</th>
            <th className="text-right py-4 text-xs font-black text-gray-400 uppercase tracking-widest w-32">Total</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {(order.order_items || []).map((item : any, idx: number) => (
            <tr key={idx}>
              <td className="py-4">
                <p className="text-sm font-bold text-gray-900 uppercase">{item.product_name || 'Parfum'}</p>
                <p className="text-xs text-gray-500 capitalize">{item.category || 'Collection'}</p>
              </td>
              <td className="py-4 text-center font-bold text-gray-900">{item.quantity}</td>
              <td className="py-4 text-right text-sm text-gray-600">{Number(item.price).toLocaleString()} DA</td>
              <td className="py-4 text-right font-bold text-primary-dark">{Number(item.price * item.quantity).toLocaleString()} DA</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div className="flex justify-end pt-8 border-t-2 border-gray-100">
        <div className="w-64 space-y-3">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Sous-total</span>
            <span className="font-medium">{Number(order.total_price).toLocaleString()} DA</span>
          </div>
          <div className="flex justify-between text-sm text-gray-600 pb-3 border-b border-gray-100">
            <span>Livraison</span>
            <span className="font-medium text-emerald-600">Gratuit</span>
          </div>
          <div className="flex justify-between items-center text-xl font-black text-primary-dark pt-1">
            <span className="uppercase tracking-tighter italic">Total Net</span>
            <span>{Number(order.total_price).toLocaleString()} DA</span>
          </div>
        </div>
      </div>

      {/* Footer / Notes */}
      <div className="mt-24 pt-12 border-t border-gray-100 text-center">
        <p className="text-sm font-serif italic text-gray-500 mb-2">Merci pour votre confiance en LPS Sétif</p>
        <div className="flex justify-center gap-6 text-[10px] font-black uppercase tracking-[0.2em] text-gray-300 pointer-events-none">
          <span>AUTHENTICITÉ</span>
          <span>•</span>
          <span>LÉGANCE</span>
          <span>•</span>
          <span>QUALITÉ</span>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body { padding: 0; margin: 0; background: white; }
          .print-hidden { display: none !important; }
          @page { margin: 1cm; }
        }
      `}} />
    </div>
  );
}
