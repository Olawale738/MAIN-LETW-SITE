'use client'

import AdminSidebar from '@/components/admin/AdminSidebar'
import AdminAuthGuard from '@/components/admin/AdminAuthGuard'

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <AdminAuthGuard>
            <div className="min-h-screen bg-gray-100 flex">
                {/* Sidebar */}
                <AdminSidebar />

                {/* Main Content */}
                <main className="flex-1 min-h-screen">
                    <header className="h-14 bg-white border-b border-gray-200 sticky top-0 z-30 flex items-center justify-between px-6 shadow-sm">
                        <div className="md:hidden w-10" /> {/* Spacer for mobile menu button */}
                        <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Admin Panel</h2>
                        <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-full bg-[#140152] text-white flex items-center justify-center font-bold text-sm">
                                A
                            </div>
                        </div>
                    </header>
                    <div className="p-6">
                        {children}
                    </div>
                </main>
            </div>
        </AdminAuthGuard>
    )
}
