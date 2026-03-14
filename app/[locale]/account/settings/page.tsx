import { Suspense } from "react";
import { getCustomerSession } from "@/lib/customer-auth";
import { getCustomerById } from "@/services/customer-service";
import { redirect } from "next/navigation";
import MerchantProfileForm from "@/components/shop/MerchantProfileForm";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
    const session = await getCustomerSession();

    if (!session || !session.id) {
        redirect("/login");
    }

    const customer = await getCustomerById(session.id);

    if (!customer) {
        redirect("/login");
    }

    return (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden animate-in fade-in duration-500">
            <div className="p-6 border-b border-gray-100">
                <h1 className="text-2xl font-serif font-bold text-gray-900 tracking-tight">Account Settings</h1>
                <p className="text-sm text-gray-500 mt-1">Manage your business profile and security preferences.</p>
            </div>

            <div className="p-6 lg:p-8">
                <div className="max-w-2xl">
                    <MerchantProfileForm customer={customer} />
                </div>
            </div>
        </div>
    );
}
