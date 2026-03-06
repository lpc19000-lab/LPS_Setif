"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

interface LogoutButtonProps {
    variant?: "admin" | "trader";
}

export default function LogoutButton({ variant = "trader" }: LogoutButtonProps) {
    const router = useRouter();

    const handleLogout = async () => {
        try {
            const endpoint = variant === "admin" ? "/api/admin/logout" : "/api/customers/logout";
            const redirectPath = variant === "admin" ? "/admin/login" : "/login";

            await fetch(endpoint, { method: "POST" });
            router.push(redirectPath);
            router.refresh();
        } catch (error) {
            console.error("Logout failed", error);
        }
    };

    return (
        <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-6 py-2.5 rounded-full border border-gray-200 text-gray-500 hover:text-red-600 hover:border-red-100 hover:bg-red-50 transition-all font-medium text-sm group"
        >
            <LogOut className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            Sign Out
        </button>
    );
}
