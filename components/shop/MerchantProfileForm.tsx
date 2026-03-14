"use client";

import { useState } from "react";
import { updateMerchantProfile } from "@/app/[locale]/account/actions/profile";
import { User, Store, MapPin, Lock, KeyRound } from "lucide-react";
import { Customer } from "@/services/customer-service";

interface MerchantProfileFormProps {
    customer: Customer;
}

export default function MerchantProfileForm({ customer }: MerchantProfileFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error", text: string } | null>(null);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setMessage(null);
        
        const formData = new FormData(e.currentTarget);
        const newPassword = formData.get("newPassword") as string;
        const confirmPassword = formData.get("confirmPassword") as string;

        if (newPassword && newPassword !== confirmPassword) {
            setMessage({ type: "error", text: "New passwords do not match" });
            return;
        }

        setIsSubmitting(true);

        try {
            const res = await updateMerchantProfile(formData);
            if (res.success) {
                setMessage({ type: "success", text: "Profile updated successfully" });
                // Reset password fields
                (document.getElementById("currentPassword") as HTMLInputElement).value = "";
                (document.getElementById("newPassword") as HTMLInputElement).value = "";
                (document.getElementById("confirmPassword") as HTMLInputElement).value = "";
            } else {
                setMessage({ type: "error", text: res.error || "Failed to update profile" });
            }
        } catch (error) {
            setMessage({ type: "error", text: "An unexpected error occurred" });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-8">
            {message && (
                <div className={`p-4 rounded-xl text-sm ${message.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
                    {message.text}
                </div>
            )}

            <div className="space-y-4">
                <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-2">Business Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-gray-700">Owner Name</label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                name="name"
                                defaultValue={customer.name}
                                required
                                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/30 transition-shadow"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-gray-700">Shop Name</label>
                        <div className="relative">
                            <Store className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                name="shopName"
                                defaultValue={customer.shopName}
                                required
                                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/30 transition-shadow"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5 md:col-span-2">
                        <label className="text-sm font-medium text-gray-700">Address (Street/Details)</label>
                        <div className="relative">
                            <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                            <textarea
                                name="address"
                                defaultValue={customer.address}
                                required
                                rows={2}
                                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/30 transition-shadow resize-none"
                            ></textarea>
                        </div>
                        <p className="text-xs text-gray-500">Note: Region ({customer.wilaya}) and Commune ({customer.commune}) can only be changed by contacting support.</p>
                    </div>
                </div>
            </div>

            <div className="space-y-4 pt-4">
                <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-2">Change Password</h3>
                <p className="text-sm text-gray-500">Leave these fields blank if you do not wish to change your password.</p>
                
                <div className="space-y-4 max-w-md">
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-gray-700">Current Password</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="password"
                                name="currentPassword"
                                id="currentPassword"
                                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/30 transition-shadow"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-gray-700">New Password</label>
                        <div className="relative">
                            <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="password"
                                name="newPassword"
                                id="newPassword"
                                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/30 transition-shadow"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-gray-700">Confirm New Password</label>
                        <div className="relative">
                            <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="password"
                                name="confirmPassword"
                                id="confirmPassword"
                                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/30 transition-shadow"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-gray-100">
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="py-2.5 px-6 bg-primary text-white font-medium text-sm rounded-xl hover:bg-primary-dark transition-colors disabled:opacity-70 disabled:cursor-not-allowed shadow-sm shadow-primary/20"
                >
                    {isSubmitting ? "Saving Changes..." : "Save Changes"}
                </button>
            </div>
        </form>
    );
}
