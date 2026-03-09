import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import "../globals.css";
import Navbar from "@/components/Navbar";
import { getCustomerSession } from "@/lib/customer-auth";
import { CartProvider } from "@/context/CartContext";
import ToastContainer from "@/components/ui/Toast";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';

const playfair = Playfair_Display({
    subsets: ["latin"],
    variable: "--font-serif",
});

const inter = Inter({
    subsets: ["latin"],
    variable: "--font-sans",
});

export const metadata: Metadata = {
    title: "LPS Perfume | B2B Wholesale Luxury Perfumes",
    description:
        "Premium B2B wholesale platform for perfume distributors in Algeria. Luxury fragrances at wholesale prices.",
};

export default async function RootLayout({
    children,
    params: { locale }
}: {
    children: React.ReactNode;
    params: { locale: string };
}) {
    // Validate that the incoming `locale` is supported
    if (!['fr', 'ar'].includes(locale)) {
        notFound();
    }

    const messages = await getMessages();
    const customer = await getCustomerSession();
    const direction = locale === 'ar' ? 'rtl' : 'ltr';

    return (
        <html lang={locale} dir={direction}>
            <body
                className={`${playfair.variable} ${inter.variable} font-sans antialiased`}
            >
                <NextIntlClientProvider messages={messages}>
                    <CartProvider>
                        <Navbar customerName={customer?.name} />
                        <main className="min-h-screen">
                            {children}
                        </main>
                        <ToastContainer />
                    </CartProvider>
                </NextIntlClientProvider>
            </body>
        </html>
    );
}
