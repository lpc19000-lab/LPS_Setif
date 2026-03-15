
"use client";

import { Printer } from "lucide-react";

export default function PrintButton({ label }: { label: string }) {
  return (
    <button 
      onClick={() => window.print()} 
      className="bg-primary text-white px-6 py-2 rounded-lg font-bold hover:bg-primary-dark transition-all flex items-center gap-2 shadow-lg shadow-primary/20 active:scale-95"
    >
      <Printer className="w-4 h-4" />
      {label}
    </button>
  );
}
