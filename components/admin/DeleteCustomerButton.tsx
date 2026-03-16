"use client";

import { useState } from "react";
import { UserMinus } from "lucide-react";
import { deleteCustomer } from "@/app/[locale]/admin/actions/customer";
import { useTranslations } from "next-intl";

interface DeleteCustomerButtonProps {
    customerId: string;
    customerName: string;
}

export default function DeleteCustomerButton({ customerId, customerName }: DeleteCustomerButtonProps) {
    const t = useTranslations("admin.customers");
    const [isPending, setIsPending] = useState(false);

    const handleDelete = async () => {
        if (!confirm(`Êtes-vous sûr de vouloir supprimer définitivement le compte de ${customerName} ? Cette action est irréversible et supprimera toutes ses données.`)) {
            return;
        }

        setIsPending(true);
        const res = await deleteCustomer(customerId);
        setIsPending(false);

        if (!res.success) {
            alert(res.error);
        }
    };

    return (
        <button
            onClick={handleDelete}
            disabled={isPending}
            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
            title="Supprimer le compte"
        >
            <UserMinus className="w-4 h-4" />
        </button>
    );
}
