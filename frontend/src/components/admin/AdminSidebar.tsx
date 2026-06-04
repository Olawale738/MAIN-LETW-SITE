'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Video, Calendar, Settings, LogOut, Users, Home, ClipboardList, Megaphone, Crown, ChevronDown, Menu, X, BookOpen, Target, HandHeart, Music, Book, Globe, Radio, Church, MessageCircle, Zap, Baby, UserCheck } from 'lucide-react'
import { cn } from '@/lib/utils'
import { tokenManager, chatApi, serviceRequestApi } from '@/lib/api'
import { useState, useEffect } from 'react'
import { listMembers } from '@/lib/dept-api'

const sidebarItems = [
    {
        title: 'Dashboard',
        href: '/admin',
        icon: LayoutDashboard
    },
    {
        title: 'Live Stream',
        href: '/admin/live-stream',
        icon: Radio
    },
    {
        title: 'Service Requests',
        href: '/admin/service-requests',
        icon: ClipboardList
    },
    {
        title: 'Volunteers',
        href: '/admin/volunteers',
        icon: UserCheck
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
        title: 'Home Page',
        href: '/admin/pages/home',
        icon: Home
    },
    {
        title: 'About Page',
        href: '/admin/pages/about',
        icon: Users
    },
    {
        title: 'Impact Page',
        href: '/admin/pages/impact',
        icon: Globe
    },
    {
        title: 'Sunday Service',
        href: '/admin/pages/sunday-service',
        icon: Church
    },
    {
        title: 'Evangelism Page',
        href: '/admin/pages/evangelism',
        icon: Globe
    },
    {
        title: 'Evangelism Sign-Ups',
        href: '/admin/evangelism-signups',
        icon: HandHeart
    },
    {
        title: 'Users',
        href: '/admin/users',
        icon: Users
    },
    {
        title: 'Nominations',
        href: '/admin/nominations',
        icon: Crown
    },
    {
        title: 'Youth Ministry',
        href: '/youth/coordinator',
        icon: Zap
    },
    {
        title: 'Children Ministry',
        href: '/children/coordinator',
        icon: Baby
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
    {
        title: 'Live Chat',
        href: '/admin/chat',
        icon: MessageCircle
    },
    {
        title: 'Ministry Staff',
        href: '/admin/settings?tab=ministry',
        icon: Crown
    },
]

export default function AdminSidebar() {
    const pathname = usePathname()
    const [mobileOpen, setMobileOpen] = useState(false)
    const [chatUnread, setChatUnread] = useState(0)
    const [youthPending, setYouthPending] = useState(0)
    const [childrenPending, setChildrenPending] = useState(0)
    const [volunteerCount, setVolunteerCount] = useState(0)

    useEffect(() => {
        const fetchUnread = async () => {
            try {
                const data = await chatApi.admin.getTotalUnread()
                setChatUnread(data.unread_count)
            } catch { /* not an admin or not logged in */ }
        }
        fetchUnread()
        const interval = setInterval(fetchUnread, 30000)
        return () => clearInterval(interval)
    }, [])

    useEffect(() => {
        const fetchPending = async () => {
            try {
                const [youthMembers, childrenMembers] = await Promise.all([
                    listMembers('youth'),
                    listMembers('children'),
                ])
                setYouthPending(youthMembers.filter(m => !m.is_active).length)
                setChildrenPending(childrenMembers.filter(m => !m.is_active).length)
            } catch { /* ignore — non-admin sessions won't have access */ }
        }
        fetchPending()
        const interval = setInterval(fetchPending, 60000)
        return () => clearInterval(interval)
    }, [])

    useEffect(() => {
        const fetchVolunteers = async () => {
            try {
                const res = await serviceRequestApi.getAllRequests('approved')
                setVolunteerCount(res.requests.filter(r => r.service_name === 'Volunteer').length)
            } catch { /* non-admin */ }
        }
        fetchVolunteers()
    }, [])

    const handleLogout = () => {
        tokenManager.clearTokens()
        window.location.href = '/auth/login'
    }

    const SidebarContent = (
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
                            <span className="flex-1">{item.title}</span>
                            {item.href === '/admin/chat' && chatUnread > 0 && (
                                <span className="bg-[#f5bb00] text-[#140152] text-xs font-black w-5 h-5 rounded-full flex items-center justify-center">
                                    {chatUnread > 9 ? '9+' : chatUnread}
                                </span>
                            )}
                            {item.href === '/admin/volunteers' && volunteerCount > 0 && (
                                <span className="bg-purple-500 text-white text-xs font-black w-5 h-5 rounded-full flex items-center justify-center">
                                    {volunteerCount > 9 ? '9+' : volunteerCount}
                                </span>
                            )}
                            {item.href === '/youth/coordinator' && youthPending > 0 && (
                                <span className="bg-amber-400 text-white text-xs font-black w-5 h-5 rounded-full flex items-center justify-center">
                                    {youthPending > 9 ? '9+' : youthPending}
                                </span>
                            )}
                            {item.href === '/children/coordinator' && childrenPending > 0 && (
                                <span className="bg-amber-400 text-white text-xs font-black w-5 h-5 rounded-full flex items-center justify-center">
                                    {childrenPending > 9 ? '9+' : childrenPending}
                                </span>
                            )}
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
                {SidebarContent}
            </aside>

            {/* Desktop Sidebar */}
            <aside className="hidden md:flex w-56 bg-[#140152] text-white h-screen flex-col sticky top-0">
                {SidebarContent}
            </aside>
        </>
    )
}
