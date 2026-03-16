"use client";

import { MessageCircle } from "lucide-react";

interface WhatsAppButtonProps {
    phoneNumber: string;
}

export default function WhatsAppButton({ phoneNumber }: WhatsAppButtonProps) {
    if (!phoneNumber) return null;

    const formattedNumber = phoneNumber.replace(/\+/g, "");

    return (
        <a
            href={`https://wa.me/${formattedNumber}`}
            target="_blank"
            rel="noopener noreferrer"
            className="fixed bottom-6 right-6 z-[60] flex items-center justify-center w-14 h-14 bg-green-500 text-white rounded-full shadow-2xl hover:bg-green-600 hover:scale-110 transition-all duration-300 group print:hidden"
            aria-label="Contact on WhatsApp"
        >
            <MessageCircle className="w-7 h-7" />
            
            {/* Tooltip */}
            <span className="absolute right-full mr-3 px-3 py-1.5 bg-gray-900 text-white text-xs font-bold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                WhatsApp Contact
            </span>

            {/* Pulsing Effect */}
            <span className="absolute inset-0 rounded-full bg-green-500/40 animate-ping -z-10" />
        </a>
    );
}
