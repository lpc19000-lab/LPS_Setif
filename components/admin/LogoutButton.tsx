"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

export default function LogoutButton() {
    const router = useRouter();

    const handleLogout = async () => {
        try {
            await fetch("/api/admin/logout", { method: "POST" });
            router.push("/admin/login");
            router.refresh();
        } catch (error) {
            console.error("Logout failed", error);
        }
    };

    return (
        <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full text-left text-sm text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors duration-200 group"
        >
            <LogOut className="w-5 h-5 text-gray-400 group-hover:text-red-500 transition-colors" />
            <span className="font-medium tracking-wide">Sign Out</span>
        </button>
    );
}
