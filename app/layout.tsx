import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { getCustomerSession } from "@/lib/customer-auth";
import { CartProvider } from "@/context/CartContext";

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
}: Readonly<{
    children: React.ReactNode;
}>) {
    const customer = await getCustomerSession();

    return (
        <html lang="en">
            <body
                className={`${playfair.variable} ${inter.variable} font-sans antialiased`}
            >
                <CartProvider>
                    <Navbar customerName={customer?.name} />
                    {children}
                </CartProvider>
            </body>
        </html>
    );
}
