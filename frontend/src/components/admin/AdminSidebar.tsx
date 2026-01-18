'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Video, Calendar, Settings, LogOut, Users, Home, ClipboardList } from 'lucide-react'
import { cn } from '@/lib/utils'
import { tokenManager } from '@/lib/api'

const sidebarItems = [
    {
        title: 'Dashboard',
        href: '/admin',
        icon: LayoutDashboard
    },
    {
        title: 'Service Requests',
        href: '/admin/service-requests',
        icon: ClipboardList
    },
    {
        title: 'Sermons',
        href: '/admin/sermons',
        icon: Video
    },
    {
        title: 'Events',
        href: '/admin/events',
        icon: Calendar
    },
    {
        title: 'Users',
        href: '/admin/users',
        icon: Users
    },
    {
        title: 'Settings',
        href: '/admin/settings',
        icon: Settings
    },
    {
        title: 'Home Site',
        href: '/',
        icon: Home
    }
]

export default function AdminSidebar() {
    const pathname = usePathname()

    const handleLogout = () => {
        tokenManager.clearTokens()
        window.location.href = '/auth/login'
    }

    return (
        <aside className="w-64 bg-[#140152] text-white min-h-screen flex flex-col fixed left-0 top-0 z-50">
            <div className="p-6 border-b border-white/10">
                <h1 className="text-xl font-bold font-serif text-[#f5bb00]">Light Encounter</h1>
                <p className="text-xs text-white/60 uppercase tracking-widest mt-1">Admin Portal</p>
            </div>

            <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                {sidebarItems.map((item) => {
                    const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href))

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                                isActive
                                    ? "bg-[#f5bb00] text-[#140152] font-bold shadow-lg"
                                    : "text-white/70 hover:bg-white/10 hover:text-white"
                            )}
                        >
                            <item.icon className={cn("w-5 h-5", isActive ? "text-[#140152]" : "text-white/70 group-hover:text-white")} />
                            <span>{item.title}</span>
                        </Link>
                    )
                })}
            </nav>

            <div className="p-4 border-t border-white/10">
                <button
                    onClick={handleLogout}
                    className="flex items-center space-x-3 px-4 py-3 rounded-xl text-white/70 hover:bg-red-500/10 hover:text-red-400 w-full transition-colors"
                >
                    <LogOut className="w-5 h-5" />
                    <span>Logout</span>
                </button>
            </div>
        </aside>
    )
}
