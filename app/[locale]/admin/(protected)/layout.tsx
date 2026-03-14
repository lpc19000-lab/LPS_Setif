import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminHeader from "@/components/admin/AdminHeader";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex h-screen bg-[#FDFBF7] overflow-hidden">
            <AdminSidebar />
            <main className="flex-1 overflow-y-auto overflow-x-hidden relative">
                {/* Decorative background blur */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#D4AF37]/5 rounded-full blur-[100px] pointer-events-none -z-10" />

                <div className="max-w-[1600px] mx-auto p-4 pt-24 lg:p-12 w-full h-full flex flex-col">
                    <AdminHeader />
                    <div className="flex-1">
                        {children}
                    </div>
                </div>
            </main>
        </div>
    );
}
