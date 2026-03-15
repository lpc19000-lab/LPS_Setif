import type { Metadata } from "next";
import { Playfair_Display, Inter, Noto_Sans_Arabic } from "next/font/google";
import "../globals.css";
import Navbar from "@/components/Navbar";
import { getCustomerSession } from "@/lib/customer-auth";
import { CartProvider } from "@/context/CartContext";
import ToastContainer from "@/components/ui/Toast";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';

const playfair = Playfair_Display({
    subsets: ["latin"],
    variable: "--font-serif",
});

const inter = Inter({
    subsets: ["latin"],
    variable: "--font-sans",
});

const notoArabic = Noto_Sans_Arabic({
    subsets: ["arabic"],
    variable: "--font-arabic",
    weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
    title: "LPS Perfume | B2B Wholesale Luxury Perfumes",
    description:
        "Premium B2B wholesale platform for perfume distributors in Algeria. Luxury fragrances at wholesale prices.",
    manifest: "/manifest.json",
    themeColor: "#D4AF37",
    viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0",
};

import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import { getSiteSettings } from "@/services/settings-service";
import AnnouncementMarquee from "@/components/shop/AnnouncementMarquee";

export default async function RootLayout(props: {
    children: React.ReactNode;
    params: Promise<{ locale: string }>;
}) {
    const { children } = props;
    const { locale } = await props.params;

    // Validate that the incoming `locale` is supported
    if (!routing.locales.includes(locale as any)) {
        notFound();
    }

    const messages = await getMessages();
    const customer = await getCustomerSession();
    const settings = await getSiteSettings();
    const direction = locale === 'ar' ? 'rtl' : 'ltr';

    return (
        <html lang={locale} dir={direction}>
            <body
                className={`${playfair.variable} ${inter.variable} ${notoArabic.variable} ${locale === 'ar' ? 'font-arabic' : 'font-sans'} antialiased`}
            >
                <NextIntlClientProvider messages={messages}>
                    <CartProvider>
                        <AnnouncementMarquee />
                        <Navbar customerName={customer?.name} settings={settings} />
                        <main className="min-h-screen">
                            {children}
                        </main>
                        <Footer settings={settings} />
                        <WhatsAppButton phoneNumber={settings.whatsapp_number} />
                        <ToastContainer />
                    </CartProvider>
                </NextIntlClientProvider>
            </body>
        </html>
    );
}
