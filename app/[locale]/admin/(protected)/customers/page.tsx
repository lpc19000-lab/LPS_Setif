import { getCustomers, Customer } from "@/services/customer-service";
import CustomerClientView from "@/components/admin/CustomerClientView";

export const dynamic = "force-dynamic";

export default async function AdminCustomersPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const customers: Customer[] = await getCustomers();

    return (
        <div className="animate-in fade-in duration-500">
            <CustomerClientView customers={customers} locale={locale} />
        </div>
    );
}
