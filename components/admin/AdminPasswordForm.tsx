"use client";

import { useState } from "react";
import { Lock, Eye, EyeOff, KeyRound } from "lucide-react";
import { useTranslations } from "next-intl";

export default function AdminPasswordForm() {
    const t = useTranslations("admin.settings");
    
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error", text: string } | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);

        if (newPassword !== confirmPassword) {
            setMessage({ type: "error", text: t("security.passwords_mismatch") || "New passwords do not match" });
            return;
        }

        if (newPassword.length < 6) {
            setMessage({ type: "error", text: t("security.password_too_short") || "Password must be at least 6 characters" });
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await fetch("/api/admin/change-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ currentPassword, newPassword }),
            });

            const data = await response.json();

            if (data.success) {
                setMessage({ type: "success", text: t("security.password_changed") || "Password updated successfully" });
                setCurrentPassword("");
                setNewPassword("");
                setConfirmPassword("");
            } else {
                setMessage({ type: "error", text: data.error || "Failed to update password" });
            }
        } catch (error) {
            setMessage({ type: "error", text: "An unexpected error occurred" });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
            {message && (
                <div className={`p-3 rounded-xl text-sm ${message.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
                    {message.text}
                </div>
            )}

            <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">{t("security.current_password") || "Current Password"}</label>
                <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 rtl:left-auto rtl:right-3" />
                    <input
                        type={showCurrent ? "text" : "password"}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        required
                        className="w-full pl-10 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/30 rtl:pl-10 rtl:pr-10 transition-shadow"
                    />
                    <button
                        type="button"
                        onClick={() => setShowCurrent(!showCurrent)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 rtl:right-auto rtl:left-3"
                    >
                        {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                </div>
            </div>

            <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">{t("security.new_password") || "New Password"}</label>
                <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 rtl:left-auto rtl:right-3" />
                    <input
                        type={showNew ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        className="w-full pl-10 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/30 rtl:pl-10 rtl:pr-10 transition-shadow"
                    />
                    <button
                        type="button"
                        onClick={() => setShowNew(!showNew)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 rtl:right-auto rtl:left-3"
                    >
                        {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                </div>
            </div>

            <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">{t("security.confirm_password") || "Confirm New Password"}</label>
                <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 rtl:left-auto rtl:right-3" />
                    <input
                        type={showConfirm ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        className="w-full pl-10 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/30 rtl:pl-10 rtl:pr-10 transition-shadow"
                    />
                    <button
                        type="button"
                        onClick={() => setShowConfirm(!showConfirm)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 rtl:right-auto rtl:left-3"
                    >
                        {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                </div>
            </div>

            <div className="pt-2">
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-2.5 px-4 bg-primary text-white font-medium text-sm rounded-xl hover:bg-primary-dark transition-colors disabled:opacity-70 disabled:cursor-not-allowed shadow-sm shadow-primary/20"
                >
                    {isSubmitting ? (t("security.updating") || "Updating...") : (t("security.update_button") || "Update Password")}
                </button>
            </div>
        </form>
    );
}
