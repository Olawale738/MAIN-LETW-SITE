'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Video, Calendar, Settings, LogOut, Users, Home, ClipboardList, Megaphone, Crown, ChevronDown, Menu, X, BookOpen, Target, HandHeart, Music, Book, Globe, Radio, Church, MessageCircle, Zap, Baby, UserCheck, Bell } from 'lucide-react'
import { cn } from '@/lib/utils'
import { tokenManager, chatApi, serviceRequestApi } from '@/lib/api'
import { useState, useEffect } from 'react'
import { listMembers, adminPendingDeptRequests } from '@/lib/dept-api'

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
        title: 'Pending Approvals',
        href: '/admin/approvals',
        icon: Bell
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
        title: 'Bible Study Groups',
        href: '/admin/bible-study/groups',
        icon: BookOpen
    },
    {
        title: 'Group Chat Moderation',
        href: '/admin/bible-study/chat-moderation',
        icon: MessageCircle
    },
]

export default function AdminSidebar() {
    const pathname = usePathname()
    const [mobileOpen, setMobileOpen] = useState(false)
    const [chatUnread, setChatUnread] = useState(0)
    const [allPendingCount, setAllPendingCount] = useState(0)
    const [volunteerCount, setVolunteerCount] = useState(0)
    const [youthPending, setYouthPending] = useState(0)
    const [childrenPending, setChildrenPending] = useState(0)

    useEffect(() => {
        const interval = setInterval(async () => {
            try {
                const counts = await chatApi.getUnreadGroupCount()
                setChatUnread(counts.unread_count)
            } catch { }
        }, 30000)

        return () => clearInterval(interval)
    }, [])

    useEffect(() => {
        const interval = setInterval(async () => {
            try {
                const [approvals, vol, youth, children] = await Promise.all([
                    serviceRequestApi.getAdminPending(),
                    listMembers('ushering'),
                    adminPendingDeptRequests('youth'),
                    adminPendingDeptRequests('children')
                ])

                const pending = approvals.filter((r: any) => r.status === 'pending').length
                setAllPendingCount(pending)
                setVolunteerCount(vol.length)
                setYouthPending(youth.length)
                setChildrenPending(children.length)
            } catch { }
        }, 30000)

        return () => clearInterval(interval)
    }, [])

    const handleLogout = () => {
        tokenManager.clearTokens()
        window.location.href = '/'
    }

    const SidebarContent = (
        <>
            <Link href="/admin" className="p-5 border-b border-white/10 flex items-center gap-3 hover:opacity-80 transition-opacity group">
                <div className="w-10 h-10 rounded-lg bg-white/10 flex-shrink-0 flex items-center justify-center">
                    <img src="/NewLETWlogo1.jpg" alt="LETW" className="w-full h-full object-cover rounded-lg" />
                </div>
                <div className="hidden sm:block">
                    <h1 className="text-sm font-bold text-[#f5bb00]">LETW</h1>
                    <p className="text-xs text-white/60 uppercase tracking-widest">Admin</p>
                </div>
            </Link>

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
                            {item.href === '/admin/approvals' && allPendingCount > 0 && (
                                <span className="bg-red-500 text-white text-xs font-black min-w-[1.25rem] h-5 px-1 rounded-full flex items-center justify-center animate-pulse">
                                    {allPendingCount > 9 ? '9+' : allPendingCount}
                                </span>
                            )}
                            {item.href === '/admin/volunteers' && volunteerCount > 0 && (
                                <span className="bg-purple-500 text-white text-xs font-black w-5 h-5 rounded-full flex items-center justify-center">
                                    {volunteerCount > 9 ? '9+
