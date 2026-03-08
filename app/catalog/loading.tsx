export default function CatalogLoading() {
    return (
        <main className="pt-24 pb-20 min-h-screen bg-[#FAFAF8]">
            <div className="max-w-7xl mx-auto px-6">
                {/* Header skeleton */}
                <div className="text-center mb-12">
                    <div className="h-10 w-64 bg-gray-200 rounded-lg mx-auto mb-3 animate-pulse" />
                    <div className="h-4 w-80 bg-gray-100 rounded mx-auto animate-pulse" />
                </div>

                {/* Filter bar skeleton */}
                <div className="flex flex-col md:flex-row gap-4 mb-10">
                    <div className="h-12 flex-1 bg-white border border-gray-200 rounded-xl animate-pulse" />
                    <div className="h-12 md:w-48 bg-white border border-gray-200 rounded-xl animate-pulse" />
                    <div className="h-12 md:w-48 bg-white border border-gray-200 rounded-xl animate-pulse" />
                    <div className="h-12 w-32 bg-white border border-gray-200 rounded-xl animate-pulse" />
                </div>

                {/* Products grid skeleton */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
                            <div className="aspect-square bg-gray-100 animate-pulse" />
                            <div className="p-5 space-y-3">
                                <div className="h-3 w-16 bg-gray-100 rounded animate-pulse" />
                                <div className="h-5 w-32 bg-gray-200 rounded animate-pulse" />
                                <div className="h-3 w-20 bg-gray-100 rounded animate-pulse" />
                                <div className="h-6 w-24 bg-gray-200 rounded animate-pulse" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </main>
    );
}
