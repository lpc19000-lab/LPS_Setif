export default function Loading() {
    return (
        <main className="min-h-screen bg-[#FAFAF8]">
            {/* Hero skeleton */}
            <div className="h-screen bg-[#121212] animate-pulse" />

            {/* Product section skeleton */}
            <section className="py-20 bg-[#FAFAF8]">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-12">
                        <div className="h-8 w-48 bg-gray-200 rounded-lg mx-auto mb-3 animate-pulse" />
                        <div className="h-4 w-64 bg-gray-100 rounded mx-auto animate-pulse" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {Array.from({ length: 4 }).map((_, i) => (
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
            </section>
        </main>
    );
}
