"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error("Global Error:", error);
    }, [error]);

    return (
        <div className="min-h-screen bg-[#FAFAF8] flex flex-col items-center justify-center p-6 text-center">
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-8">
                <AlertTriangle className="w-10 h-10 text-red-500" />
            </div>
            
            <h1 className="text-4xl font-serif text-primary-dark mb-4">Something went wrong</h1>
            <p className="text-gray-500 max-w-md mx-auto mb-10 leading-relaxed">
                We apologize for the inconvenience. Our technical team has been notified.
                Please try refreshing the page or contact support if the problem persists.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
                <button
                    onClick={() => reset()}
                    className="flex items-center gap-2 px-8 py-3.5 bg-primary text-white rounded-full font-bold hover:bg-primary-dark transition-all shadow-lg shadow-primary/20"
                >
                    <RefreshCw className="w-4 h-4" />
                    Try Again
                </button>
                <Link
                    href="/"
                    className="flex items-center gap-2 px-8 py-3.5 border border-gray-200 text-gray-600 rounded-full font-bold hover:bg-gray-50 transition-all"
                >
                    <Home className="w-4 h-4" />
                    Back to Home
                </Link>
            </div>

            {process.env.NODE_ENV === "development" && (
                <div className="mt-12 p-6 bg-white border border-red-100 rounded-2xl text-left max-w-2xl w-full overflow-auto">
                    <p className="text-xs font-black uppercase tracking-widest text-red-400 mb-2">Error Details (Dev Only)</p>
                    <p className="text-sm font-mono text-red-600">{error.message}</p>
                    {error.digest && (
                        <p className="text-[10px] font-mono text-gray-400 mt-2">Digest: {error.digest}</p>
                    )}
                </div>
            )}
        </div>
    );
}
