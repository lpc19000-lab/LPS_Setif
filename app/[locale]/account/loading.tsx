export default function AccountLoading() {
    return (
        <div className="max-w-7xl mx-auto px-6 pt-32 pb-20">
            {/* Header skeleton */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                <div>
                    <div className="h-8 w-48 bg-gray-200 rounded-lg animate-pulse mb-2" />
                    <div className="h-4 w-32 bg-gray-100 rounded animate-pulse" />
                </div>
                <div className="h-10 w-24 bg-gray-100 rounded-xl animate-pulse" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Profile Card skeleton */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-16 h-16 rounded-full bg-gray-100 animate-pulse" />
                            <div className="space-y-2">
                                <div className="h-5 w-32 bg-gray-200 rounded animate-pulse" />
                                <div className="h-3 w-20 bg-gray-100 rounded animate-pulse" />
                            </div>
                        </div>
                        <div className="space-y-6">
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-xl bg-gray-50 animate-pulse" />
                                <div className="space-y-2">
                                    <div className="h-3 w-20 bg-gray-100 rounded animate-pulse" />
                                    <div className="h-4 w-28 bg-gray-200 rounded animate-pulse" />
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-xl bg-gray-50 animate-pulse" />
                                <div className="space-y-2">
                                    <div className="h-3 w-20 bg-gray-100 rounded animate-pulse" />
                                    <div className="h-4 w-40 bg-gray-200 rounded animate-pulse" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats & Orders skeleton */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {[1, 2].map((i) => (
                            <div key={i} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                                <div className="h-3 w-20 bg-gray-100 rounded animate-pulse mb-2" />
                                <div className="h-8 w-24 bg-gray-200 rounded animate-pulse" />
                            </div>
                        ))}
                    </div>
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-gray-100">
                            <div className="h-5 w-32 bg-gray-200 rounded animate-pulse" />
                        </div>
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="flex items-center justify-between p-6 border-b border-gray-50">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-lg bg-gray-100 animate-pulse" />
                                    <div className="space-y-2">
                                        <div className="h-4 w-28 bg-gray-200 rounded animate-pulse" />
                                        <div className="h-3 w-20 bg-gray-100 rounded animate-pulse" />
                                    </div>
                                </div>
                                <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
