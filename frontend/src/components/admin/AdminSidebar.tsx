'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Video, Calendar, Settings, LogOut, Users, Home, ClipboardList, Megaphone, Crown, ChevronDown, Menu, X, BookOpen, Target, HandHeart, Music, Book } from 'lucide-react'
import { cn } from '@/lib/utils'
import { tokenManager } from '@/lib/api'
import { useState } from 'react'

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
        title: 'Announcements',
        href: '/admin/announcements',
        icon: Megaphone
    },
    {
        title: 'Leadership Training',
        href: '/admin/leadership',
        icon: Crown
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
        title: 'Skill Development',
        href: '/admin/skills',
        icon: BookOpen
    },
    {
        title: 'Career Guidance',
        href: '/admin/career',
        icon: Target
    },
    {
        title: 'Prayer',
        href: '/admin/prayer',
        icon: HandHeart
    },
    {
        title: 'Alter Sound',
        href: '/admin/alter-sound',
        icon: Music
    },
    {
        title: 'Bible Study',
        href: '/admin/bible-study',
        icon: Book
    },
]

export default function AdminSidebar() {
    const pathname = usePathname()
    const [mobileOpen, setMobileOpen] = useState(false)

    const handleLogout = () => {
        tokenManager.clearTokens()
        window.location.href = '/auth/login'
    }

    const SidebarContent = () => (
        <>
            <div className="p-5 border-b border-white/10">
                <h1 className="text-lg font-bold font-serif text-[#f5bb00]">Light Encounter</h1>
                <p className="text-xs text-white/60 uppercase tracking-widest mt-1">Admin Portal</p>
            </div>

            <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
                {sidebarItems.map((item) => {
                    const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href))

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setMobileOpen(false)}
                            className={cn(
                                "flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200 group text-sm",
                                isActive
                                    ? "bg-[#f5bb00] text-[#140152] font-bold"
                                    : "text-white/70 hover:bg-white/10 hover:text-white"
                            )}
                        >
                            <item.icon className={cn("w-4 h-4", isActive ? "text-[#140152]" : "text-white/70 group-hover:text-white")} />
                            <span>{item.title}</span>
                        </Link>
                    )
                })}
            </nav>

            {/* Bottom Section - Always visible */}
            <div className="p-3 border-t border-white/10 mt-auto space-y-1">
                <Link
                    href="/"
                    className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-white/70 hover:bg-white/10 hover:text-white w-full transition-colors text-sm"
                >
                    <Home className="w-4 h-4" />
                    <span>View Site</span>
                </Link>
                <Link
                    href="/admin/settings"
                    className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-white/70 hover:bg-white/10 hover:text-white w-full transition-colors text-sm"
                >
                    <Settings className="w-4 h-4" />
                    <span>Settings</span>
                </Link>
                <button
                    onClick={handleLogout}
                    className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-red-400 hover:bg-red-500/20 hover:text-red-300 w-full transition-colors text-sm font-medium"
                >
                    <LogOut className="w-4 h-4" />
                    <span>Logout</span>
                </button>
            </div>
        </>
    )

    return (
        <>
            {/* Mobile Toggle Button */}
            <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="md:hidden fixed top-4 left-4 z-[60] bg-[#140152] text-white p-2 rounded-lg shadow-lg"
            >
                {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            {/* Mobile Overlay */}
            {mobileOpen && (
                <div
                    className="md:hidden fixed inset-0 bg-black/50 z-40"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            {/* Mobile Sidebar */}
            <aside className={cn(
                "md:hidden fixed left-0 top-0 bottom-0 w-64 bg-[#140152] text-white flex flex-col z-50 transition-transform duration-300",
                mobileOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <SidebarContent />
            </aside>

            {/* Desktop Sidebar */}
            <aside className="hidden md:flex w-56 bg-[#140152] text-white h-screen flex-col sticky top-0">
                <SidebarContent />
            </aside>
        </>
    )
}
