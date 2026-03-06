export default function Loading() {
    return (
        <main className="pt-24 pb-20 min-h-screen bg-[#FAFAF8] flex justify-center items-center">
            <div className="flex flex-col items-center gap-4">
                <div className="w-10 h-10 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                <p className="text-sm font-serif text-primary uppercase tracking-widest animate-pulse">
                    Loading Collection...
                </p>
            </div>
        </main>
    );
}
