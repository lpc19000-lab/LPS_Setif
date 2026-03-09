export default function ProductLoading() {
    return (
        <main className="pt-24 pb-20 min-h-screen bg-[#FAFAF8]">
            <div className="max-w-7xl mx-auto px-6">
                {/* Back link skeleton */}
                <div className="flex items-center justify-between mb-12">
                    <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
                    {/* Image skeleton */}
                    <div className="aspect-square rounded-[3rem] bg-white border border-gray-100 shadow-sm animate-pulse" />

                    {/* Content skeleton */}
                    <div className="space-y-6">
                        <div className="h-6 w-24 bg-primary/10 rounded-full animate-pulse" />
                        <div className="h-12 w-3/4 bg-gray-200 rounded-lg animate-pulse" />
                        <div className="flex items-center gap-4">
                            <div className="h-6 w-24 bg-gray-100 rounded animate-pulse" />
                            <div className="h-6 w-20 bg-green-50 rounded-lg animate-pulse" />
                        </div>
                        <div className="space-y-2">
                            <div className="h-4 w-full bg-gray-100 rounded animate-pulse" />
                            <div className="h-4 w-5/6 bg-gray-100 rounded animate-pulse" />
                            <div className="h-4 w-2/3 bg-gray-100 rounded animate-pulse" />
                        </div>
                        {/* Price card skeleton */}
                        <div className="bg-[#1A1A1A] rounded-[2.5rem] p-10 animate-pulse">
                            <div className="h-4 w-32 bg-[#D4AF37]/20 rounded mb-3" />
                            <div className="h-12 w-48 bg-white/10 rounded mb-8" />
                            <div className="grid grid-cols-2 gap-6">
                                <div className="h-16 bg-white/5 rounded" />
                                <div className="h-16 bg-white/5 rounded" />
                            </div>
                        </div>
                        {/* Controls skeleton */}
                        <div className="space-y-4">
                            <div className="h-4 w-28 bg-gray-200 rounded animate-pulse" />
                            <div className="flex gap-3">
                                {Array.from({ length: 4 }).map((_, i) => (
                                    <div key={i} className="h-14 w-20 bg-white border border-gray-100 rounded-2xl animate-pulse" />
                                ))}
                            </div>
                        </div>
                        <div className="h-16 w-full bg-primary/20 rounded-2xl animate-pulse" />
                    </div>
                </div>
            </div>
        </main>
    );
}
