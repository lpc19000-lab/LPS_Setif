import { FileText, MapPin, Phone, Mail, Globe } from "lucide-react";
import SafeImage from "@/components/SafeImage";

interface InvoiceProps {
    invoice: {
        invoiceNumber: string;
        issueDate: Date;
        totalAmount: number;
        orderId: string;
        order: {
            customer: {
                shopName: string;
                name: string;
                address: string;
                wilaya: string;
                phone: string;
            };
            items: Array<{
                product: {
                    name: string;
                    brand: string;
                    imageUrl?: string;
                };
                quantity: number;
                price: number;
            }>;
        };
        amountPaid?: number;
        paymentStatus?: string;
    };
    locale: string;
}

export default function InvoiceView({ invoice, locale }: InvoiceProps) {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat(locale === "ar" ? "ar-DZ" : "fr-FR", {
            style: "currency",
            currency: "DZD"
        }).format(amount).replace("DZD", "DA");
    };

    const formatDate = (date: Date) => {
        return new Intl.DateTimeFormat(locale === "ar" ? "ar-DZ" : "fr-FR", { dateStyle: "long" }).format(date);
    };

    const isRtl = locale === 'ar';

    return (
        <div className={`max-w-4xl mx-auto p-8 sm:p-16 bg-white border border-gray-100 rounded-[2.5rem] shadow-2xl print:border-none print:shadow-none print:p-0 print:rounded-none ${isRtl ? 'rtl' : 'ltr'}`}>
            {/* Invoice Header */}
            <div className={`flex flex-col sm:flex-row justify-between items-start gap-8 mb-16 ${isRtl ? 'sm:flex-row-reverse' : ''}`}>
                <div>
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-primary-dark rounded-2xl flex items-center justify-center text-[#D4AF37] shadow-xl shadow-primary/20">
                            <FileText className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="font-serif font-black text-3xl text-primary-dark tracking-tighter">LPS PERFUME</div>
                            <p className="text-gray-400 font-bold uppercase tracking-[0.3em] text-[9px]">Commercial Division • wholesale</p>
                        </div>
                    </div>
                    <div className="space-y-1 text-xs text-gray-500 font-medium">
                        <div className={`flex items-center gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}><MapPin className="w-3 h-3 text-[#D4AF37]" /> Cite 500 Logements, Setif, 19000</div>
                        <div className={`flex items-center gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}><Mail className="w-3 h-3 text-[#D4AF37]" /> contact@lps-perfume.dz</div>
                        <div className={`flex items-center gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}><Phone className="w-3 h-3 text-[#D4AF37]" /> +213 555 12 34 56</div>
                    </div>
                </div>

                <div className={`${isRtl ? 'text-left' : 'text-right'} relative`}>
                    <div className="relative z-10">
                        <h1 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Invoice Details</h1>
                        <p className="text-3xl font-serif font-bold text-primary-dark mb-1">{invoice.invoiceNumber}</p>
                        <p className="text-sm font-medium text-gray-500">Issued: {formatDate(invoice.issueDate)}</p>
                        <div className={`mt-4 inline-flex items-center gap-2 px-3 py-1 ${(invoice.paymentStatus || 'UNPAID') === 'PAID' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : (invoice.paymentStatus || 'UNPAID') === 'PARTIAL' ? 'bg-amber-50 text-amber-700 border-amber-100' : 'bg-red-50 text-red-700 border-red-100'} rounded-full text-[10px] font-black uppercase tracking-widest border ${isRtl ? 'flex-row-reverse' : ''}`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${(invoice.paymentStatus || 'UNPAID') === 'PAID' ? 'bg-emerald-500' : (invoice.paymentStatus || 'UNPAID') === 'PARTIAL' ? 'bg-amber-500' : 'bg-red-500'} animate-pulse`}></div>
                            {(invoice.paymentStatus || 'UNPAID') === 'PAID' ? 'Paid & Validated' : (invoice.paymentStatus || 'UNPAID') === 'PARTIAL' ? 'Partially Paid' : 'Awaiting Payment'}
                        </div>
                    </div>
                </div>
            </div>

            {/* billing Info */}
            <div className={`grid grid-cols-1 sm:grid-cols-2 gap-12 mb-16 ${isRtl ? 'sm:grid-cols-reverse' : ''}`}>
                <div className={`p-8 bg-gray-50/50 rounded-3xl border border-gray-100 hover:border-primary/20 transition-colors ${isRtl ? 'text-right' : 'text-left'}`}>
                    <h2 className={`text-[10px] font-black uppercase tracking-widest text-[#D4AF37] mb-6 flex items-center gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
                        <div className="w-1 h-3 bg-[#D4AF37] rounded-full"></div>
                        Billed To
                    </h2>
                    <div className="space-y-2">
                        <p className="text-2xl font-serif font-bold text-primary-dark leading-tight">{invoice.order.customer.shopName}</p>
                        <p className="font-bold text-gray-700 text-sm">{invoice.order.customer.name}</p>
                        <p className="text-gray-500 leading-relaxed text-sm max-w-[240px]">{invoice.order.customer.address}</p>
                        <div className={`flex items-center gap-2 mt-4 text-xs font-black text-primary-dark uppercase tracking-wider ${isRtl ? 'flex-row-reverse' : ''}`}>
                            <MapPin className="w-3.5 h-3.5 text-[#D4AF37]" />
                            {invoice.order.customer.wilaya}, Algeria
                        </div>
                    </div>
                </div>

                <div className={`p-8 bg-primary-dark text-white rounded-3xl shadow-2xl shadow-primary/10 relative overflow-hidden ${isRtl ? 'text-right' : 'text-left'}`}>
                    <div className="relative z-10">
                        <h2 className={`text-[10px] font-black uppercase tracking-widest text-[#D4AF37] mb-6 flex items-center gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
                            <div className="w-1 h-3 bg-[#D4AF37] rounded-full"></div>
                            Reference
                        </h2>
                        <div className="space-y-4">
                            <div>
                                <p className="text-[10px] text-white/40 uppercase tracking-widest mb-1">Order Identifier</p>
                                <p className="text-sm font-mono font-bold tracking-tight">#{invoice.orderId.toUpperCase()}</p>
                            </div>
                            <div>
                                <p className="text-[10px] text-white/40 uppercase tracking-widest mb-1">Payment Method</p>
                                <p className="text-sm font-bold">Standard Bank Transfer / Cash on Delivery</p>
                            </div>
                        </div>
                    </div>
                    {/* Background Detail */}
                    <div className={`absolute bottom-[-20px] opacity-10 ${isRtl ? 'left-[-20px]' : 'right-[-20px]'}`}>
                        <FileText className="w-32 h-32" />
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="mb-12">
                <table className={`w-full ${isRtl ? 'text-right' : 'text-left'}`}>
                    <thead>
                        <tr className={`border-b-2 border-primary-dark ${isRtl ? 'flex-row-reverse' : ''}`}>
                            <th className="py-5 font-black text-gray-900 text-[10px] uppercase tracking-[0.2em]">{isRtl ? 'الوصف' : 'Description'}</th>
                            <th className="py-5 font-black text-gray-900 text-[10px] uppercase tracking-[0.2em] text-center">{isRtl ? 'الكمية' : 'Qty'}</th>
                            <th className={`py-5 font-black text-gray-900 text-[10px] uppercase tracking-[0.2em] ${isRtl ? 'text-left' : 'text-right'}`}>{isRtl ? 'السعر' : 'Price'}</th>
                            <th className={`py-5 font-black text-gray-900 text-[10px] uppercase tracking-[0.2em] ${isRtl ? 'text-left' : 'text-right'}`}>{isRtl ? 'المجموع' : 'Total'}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 border-b border-gray-100">
                        {invoice.order.items.map((item, idx) => (
                            <tr key={idx} className="group hover:bg-gray-50/50 transition-colors">
                                <td className="py-8">
                                    <div className="font-bold text-lg text-gray-900 mb-1 group-hover:text-primary transition-colors">{item.product.name}</div>
                                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em]">{item.product.brand}</div>
                                </td>
                                <td className="py-8 text-center text-gray-600 font-bold font-mono">{item.quantity}</td>
                                <td className={`py-8 text-gray-600 font-medium ${isRtl ? 'text-left' : 'text-right'}`}>{formatCurrency(item.price)}</td>
                                <td className={`py-8 font-serif font-black text-primary-dark text-xl ${isRtl ? 'text-left' : 'text-right'}`}>{formatCurrency(item.price * item.quantity)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Footer Totals */}
            <div className={`flex justify-end mb-20 ${isRtl ? 'flex-row-reverse' : ''}`}>
                <div className="w-full sm:w-[380px] space-y-4">
                    <div className={`flex justify-between items-center text-gray-400 uppercase tracking-[0.2em] text-[10px] font-black ${isRtl ? 'flex-row-reverse' : ''}`}>
                        <span>{isRtl ? 'المجموع الفرعي' : 'Subtotal'}</span>
                        <span className="text-gray-900 font-bold">{formatCurrency(invoice.totalAmount)}</span>
                    </div>
                    <div className={`flex justify-between items-center text-gray-400 uppercase tracking-[0.2em] text-[10px] font-black ${isRtl ? 'flex-row-reverse' : ''}`}>
                        <span>{isRtl ? 'تكاليف الشحن' : 'Shipping'}</span>
                        <span className="text-amber-600 font-bold">+ {isRtl ? 'رسوم التوصيل' : 'SHIPPING COSTS'}</span>
                    </div>
                    <div className="pt-4">
                        <div className={`flex justify-between items-center bg-primary-dark p-8 rounded-[2rem] text-white shadow-2xl shadow-primary/20 relative overflow-hidden group ${isRtl ? 'flex-row-reverse' : ''}`}>
                            <div className="relative z-10">
                                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#D4AF37] mb-1 block">Total amount due</span>
                                <span className="text-4xl font-serif font-bold tracking-tight">{formatCurrency(invoice.totalAmount)}</span>
                            </div>
                            <div className="relative z-10 text-right">
                                <span className="text-[10px] text-white/30 font-mono block">DZD / DA</span>
                            </div>
                            {/* Accent Circle */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4AF37]/10 rounded-full blur-3xl -translate-y-12 translate-x-12"></div>
                        </div>
                    </div>
                    {/* Payment Info */}
                    {(invoice.amountPaid !== undefined && invoice.amountPaid !== null) && (
                        <div className="space-y-3 pt-2">
                            <div className={`flex justify-between items-center text-gray-400 uppercase tracking-[0.2em] text-[10px] font-black ${isRtl ? 'flex-row-reverse' : ''}`}>
                                <span>Amount Paid</span>
                                <span className="text-emerald-600 font-bold">{formatCurrency(invoice.amountPaid)}</span>
                            </div>
                            {(invoice.totalAmount - (invoice.amountPaid || 0)) > 0 && (
                                <div className={`flex justify-between items-center text-gray-400 uppercase tracking-[0.2em] text-[10px] font-black ${isRtl ? 'flex-row-reverse' : ''}`}>
                                    <span>Balance Due</span>
                                    <span className="text-red-600 font-bold">{formatCurrency(invoice.totalAmount - (invoice.amountPaid || 0))}</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Bottom Footer */}
            <div className="pt-12 border-t border-gray-100 text-center">
                <div className="flex items-center justify-center gap-6 mb-6">
                    <div className="w-2 h-2 rounded-full bg-primary-dark/10"></div>
                    <p className="text-[10px] text-gray-400 uppercase tracking-[0.4em] font-black">Quality Guaranteed</p>
                    <div className="w-2 h-2 rounded-full bg-primary-dark/10"></div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-[9px] font-bold text-gray-300 uppercase tracking-widest max-w-2xl mx-auto mb-8">
                    <div className="flex items-center justify-center gap-2"><Globe className="w-3 h-3" /> LPS-PERFUME.DZ</div>
                    <div className="flex items-center justify-center gap-2 text-primary-dark"><FileText className="w-3 h-3" /> OFFICIAL DOCUMENT</div>
                    <div className="flex items-center justify-center gap-2">SETIF DISTRICT</div>
                </div>
                <p className="text-[10px] text-gray-300 leading-relaxed uppercase tracking-wider">
                    Thank you for partnering with LPS Perfume. <br />
                    This document is electronically generated and valid without signature under B2B wholesale regulations.
                </p>
            </div>
        </div>
    );
}
