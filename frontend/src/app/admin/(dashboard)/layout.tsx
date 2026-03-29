'use client'

import AdminSidebar from '@/components/admin/AdminSidebar'
import AdminAuthGuard from '@/components/admin/AdminAuthGuard'
import { useState } from 'react'
import { Menu, X } from 'lucide-react'

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const [sidebarOpen, setSidebarOpen] = useState(false)

    return (
        <AdminAuthGuard>
            <div className="min-h-screen bg-gray-100 flex">
                {/* Sidebar */}
                <AdminSidebar externalOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

                {/* Main Content */}
                <main className="flex-1 min-h-screen">
                    <header className="h-14 bg-white border-b border-gray-200 sticky top-0 z-30 flex items-center justify-between px-6 shadow-sm">
                        <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="md:hidden bg-[#140152] text-white p-2 rounded-lg shadow-lg"
                        >
                            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                        </button>
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

