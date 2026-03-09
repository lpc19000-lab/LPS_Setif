export default function AdminLoading() {
    return (
        <div className="flex-1 flex flex-col items-center justify-center min-h-[400px]">
            <div className="flex flex-col items-center gap-4">
                <div className="w-10 h-10 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 animate-pulse">
                    Synchronizing Data...
                </p>
            </div>
        </div>
    );
}
