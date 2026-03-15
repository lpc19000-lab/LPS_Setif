"use client";

import { Printer } from "lucide-react";

export default function PrintInvoiceButton() {
    return (
        <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-6 py-2.5 bg-primary-dark text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-primary transition-all active:scale-95"
        >
            <Printer className="w-4 h-4" /> Print Invoice
        </button>
    );
}
