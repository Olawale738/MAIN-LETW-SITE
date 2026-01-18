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
            <div className="min-h-screen bg-gray-50 flex">
                {/* Sidebar */}
                <AdminSidebar />

                {/* Main Content */}
                <main className="flex-1 ml-64 min-h-screen">
                    <header className="h-16 bg-white border-b border-gray-200 sticky top-0 z-40 flex items-center justify-between px-8 shadow-sm">
                        <h2 className="text-lg font-semibold text-gray-800">Dashboard</h2>
                        <div className="flex items-center space-x-4">
                            <div className="w-8 h-8 rounded-full bg-[#140152] text-white flex items-center justify-center font-bold text-sm">
                                A
                            </div>
                            <span className="text-sm font-medium text-gray-600">Admin User</span>
                        </div>
                    </header>
                    <div className="p-8">
                        {children}
                    </div>
                </main>
            </div>
        </AdminAuthGuard>
    )
}
