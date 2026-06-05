'use client'

import AdminSidebar from '@/components/admin/AdminSidebar'
import AdminAuthGuard from '@/components/admin/AdminAuthGuard'
import { Home } from 'lucide-react'
import Link from 'next/link'

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
                    <header className="h-16 bg-white border-b border-gray-200 sticky top-0 z-30 flex items-center justify-between px-6 shadow-sm">
                        <Link href="/admin/dashboard" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                            {/* Church Logo */}
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#140152] to-[#7c3aed] flex items-center justify-center">
                                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 2L2 8v3h2v9h16v-9h2V8L12 2zm0 2.5l7 3.5v2h-1v8H6v-8H5v-2l7-3.5zm0 3l-4 4v6h8v-6l-4-4z" />
                                </svg>
                            </div>
                            <div className="hidden md:flex flex-col">
                                <h1 className="text-sm font-bold text-gray-900">Church Admin</h1>
                                <p className="text-xs text-gray-500">Dashboard</p>
                            </div>
                        </Link>
                        <div className="flex items-center space-x-3">
                            <Link href="/dashboard" className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-600">
                                <Home className="w-5 h-5" />
                            </Link>
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
