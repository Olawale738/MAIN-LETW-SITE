'use client'

import { useEffect, useState } from 'react'
import AdminSidebar from '@/components/admin/AdminSidebar'
import AdminAuthGuard from '@/components/admin/AdminAuthGuard'
import { Home, ExternalLink, Globe, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { wakeBackend } from '@/lib/api'

/**
 * On first admin entry in a session, fire a /health ping in the background to
 * wake the Render free-tier backend. Subsequent admin actions then hit a warm
 * server instead of failing with "Failed to fetch" on cold-start.
 */
function useBackendWarmup() {
    const [warming, setWarming] = useState(false)
    useEffect(() => {
        try {
            if (sessionStorage.getItem('admin-warmed') === '1') return
            // Fire and forget — if the server is already awake, /health returns in ms.
            // Only show the banner if the ping is taking measurably long.
            const slowTimer = setTimeout(() => setWarming(true), 1500)
            wakeBackend(75_000).then(() => {
                clearTimeout(slowTimer)
                setWarming(false)
                try { sessionStorage.setItem('admin-warmed', '1') } catch { /* noop */ }
            })
        } catch { /* noop */ }
    }, [])
    return warming
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const warming = useBackendWarmup()

    return (
        <AdminAuthGuard>
            <div className="min-h-screen bg-gray-100 flex">
                <AdminSidebar />

                <main className="flex-1 min-h-screen">
                    <header className="h-16 bg-white border-b border-gray-200 sticky top-0 z-30 flex items-center justify-between px-6 shadow-sm">
                        <Link href="/admin/dashboard" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
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
                            <Link href="/" target="_blank" rel="noopener noreferrer"
                                className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-[#140152] to-[#7c3aed] text-white text-sm font-bold hover:shadow-lg hover:scale-105 transition-all"
                                title="Visit public site">
                                <Globe className="w-4 h-4" />
                                <span>Visit Site</span>
                                <ExternalLink className="w-3 h-3" />
                            </Link>
                            <Link href="/" target="_blank" rel="noopener noreferrer"
                                className="sm:hidden p-2 rounded-lg bg-gradient-to-r from-[#140152] to-[#7c3aed] text-white"
                                title="Visit public site">
                                <Globe className="w-5 h-5" />
                            </Link>
                            <Link href="/dashboard" className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-600" title="My Dashboard">
                                <Home className="w-5 h-5" />
                            </Link>
                            <div className="w-8 h-8 rounded-full bg-[#140152] text-white flex items-center justify-center font-bold text-sm">
                                A
                            </div>
                        </div>
                    </header>

                    {warming && (
                        <div className="bg-amber-50 border-b border-amber-200 px-6 py-2 text-amber-900 text-xs inline-flex items-center gap-2 w-full">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            Waking the server — Render free-tier cold start. Actions you trigger now may take 20–60s the first time.
                        </div>
                    )}

                    <div className="p-6">
                        {children}
                    </div>
                </main>
            </div>
        </AdminAuthGuard>
    )
}
