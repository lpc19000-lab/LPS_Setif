import { getRestockSuggestions, getDeadStock } from "@/services/intelligence-service";
import RestockDashboardClient from "@/components/admin/RestockDashboardClient";

export const dynamic = "force-dynamic";

export default async function RestockPage() {
    const [suggestions, deadStock] = await Promise.all([
        getRestockSuggestions(),
        getDeadStock()
    ]);

    return (
        <div className="p-8 max-w-7xl mx-auto animate-in fade-in duration-500">
            <div className="mb-8">
                <h1 className="text-3xl font-serif font-bold text-primary-dark tracking-tight">Smart Restock & Dead Stock</h1>
                <p className="text-sm text-gray-500 mt-2 font-medium">AI-driven inventory predictions based on 30-day sales velocity and tying up capital analysis.</p>
            </div>

            <RestockDashboardClient suggestions={suggestions} deadStock={deadStock} />
        </div>
    );
}
