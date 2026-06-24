'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Video, Calendar, Settings, LogOut, Users, Home, ClipboardList, Megaphone, Crown, ChevronDown, Menu, X, BookOpen, Target, HandHeart, Music, Book, Globe, Radio, Church, MessageCircle, Zap, Baby, UserCheck, Bell, Heart, Sparkles, FileText, Tag, Plus, BarChart, ChevronRight, Mail, ShieldCheck, Image as ImageIcon, PenSquare, Share2, Database } from 'lucide-react'
import { cn } from '@/lib/utils'
import { tokenManager, chatApi, serviceRequestApi } from '@/lib/api'
import { useState, useEffect } from 'react'
import { listMembers, adminPendingDeptRequests } from '@/lib/dept-api'

// Section types: simple item or expandable group with sub-items
type SimpleItem = { title: string; href: string; icon: any }
type GroupItem = { title: string; icon: any; items: SimpleItem[] }
type SidebarItem = SimpleItem | GroupItem

const sidebarItems: SidebarItem[] = [
    { title: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { title: 'Live Stream', href: '/admin/live-stream', icon: Radio },
    { title: 'Pending Approvals', href: '/admin/approvals', icon: Bell },
    { title: 'Service Requests', href: '/admin/service-requests', icon: ClipboardList },
    { title: 'Volunteers', href: '/admin/volunteers', icon: UserCheck },
    { title: 'Announcements', href: '/admin/announcements', icon: Megaphone },
    { title: 'Newsletter', href: '/admin/newsletter', icon: Mail },
    { title: 'Sermons', href: '/admin/sermons', icon: Video },
    { title: 'Events', href: '/admin/events', icon: Calendar },
    { title: 'Users', href: '/admin/users', icon: Users },
    { title: 'Nominations', href: '/admin/nominations', icon: Crown },
    // Bible Study expandable group
    {
        title: 'Bible Study',
        icon: BookOpen,
        items: [
            { title: 'Overview',         href: '/admin/bible-study',                  icon: LayoutDashboard },
            { title: 'Reading Plans',    href: '/admin/bible-study/plans',            icon: BookOpen },
            { title: 'Daily Readings',   href: '/admin/bible-study/readings',         icon: Book },
            { title: 'Resources',        href: '/admin/bible-study/resources',        icon: FileText },
            { title: 'Settings',         href: '/admin/bible-study/settings',         icon: Settings },
            { title: 'Groups',           href: '/admin/bible-study/groups',           icon: Users },
            { title: 'Chat Moderation',  href: '/admin/bible-study/chat-moderation',  icon: MessageCircle },
        ]
    },
    // Alter Sound expandable group
    {
        title: 'Alter Sound',
        icon: Music,
        items: [
            { title: 'Overview',         href: '/admin/alter-sound',            icon: LayoutDashboard },
            { title: 'Categories',       href: '/admin/alter-sound/categories', icon: Tag },
            { title: 'Tracks',           href: '/admin/alter-sound/tracks',     icon: Music },
            { title: 'Settings',         href: '/admin/alter-sound/settings',   icon: Settings },
        ]
    },
    // Prayer expandable group
    {
        title: 'Prayer',
        icon: HandHeart,
        items: [
            { title: 'Overview',         href: '/admin/prayer',            icon: LayoutDashboard },
            { title: 'Categories',       href: '/admin/prayer/categories', icon: Tag },
            { title: 'Schedules',        href: '/admin/prayer/schedules',  icon: Calendar },
            { title: 'Requests',         href: '/admin/prayer/requests',   icon: HandHeart },
            { title: 'Stats',            href: '/admin/prayer/stats',      icon: BarChart },
            { title: 'Settings',         href: '/admin/prayer/settings',   icon: Settings },
        ]
    },
    // Career expandable group
    {
        title: 'Career',
        icon: Target,
        items: [
            { title: 'Modules',          href: '/admin/career',          icon: Target },
            { title: 'Create Module',    href: '/admin/career/create',   icon: Plus },
            { title: 'Sessions',         href: '/admin/career/sessions', icon: Calendar },
        ]
    },
    // Skills expandable group
    {
        title: 'Skills Development',
        icon: Sparkles,
        items: [
            { title: 'All Courses',      href: '/admin/skills',        icon: Sparkles },
            { title: 'Create Course',    href: '/admin/skills/create', icon: Plus },
        ]
    },
    // Leadership
    { title: 'Leadership Training', href: '/admin/leadership', icon: Crown },
    // Universal page editor (lists every public page)
    { title: 'All Pages', href: '/admin/pages', icon: FileText },
    { title: 'Evangelism Sign-Ups', href: '/admin/evangelism-signups', icon: HandHeart },
    // Ministries group
    {
        title: 'Ministries',
        icon: Heart,
        items: [
            { title: 'Custom Ministries',     href: '/admin/ministries',             icon: Heart },
            { title: 'Volunteer Departments', href: '/admin/volunteer-departments',  icon: HandHeart },
            { title: 'Youth Overview',        href: '/admin/youth',                  icon: Zap },
            { title: 'Youth Ministry',        href: '/youth/coordinator',            icon: Zap },
            { title: 'Youth Programs',        href: '/admin/youth/programs',         icon: Sparkles },
            { title: 'Children Ministry',     href: '/children/coordinator',         icon: Baby },
            { title: "Men's Ministry",        href: '/admin/men',                    icon: ShieldCheck },
            { title: "Women's Ministry",      href: '/admin/women',                  icon: Heart },
            { title: 'Theology School',       href: '/admin/theology-school',        icon: BookOpen },
            { title: 'Leadership Page',       href: '/admin/leadership-content',     icon: Crown },
            { title: 'Department Coords',     href: '/admin/coordinators',           icon: Users },
            { title: 'Volunteer Dashboard',   href: '/dashboard/volunteer',          icon: HandHeart },
            { title: 'Mentor Dashboard',      href: '/dashboard/mentor',             icon: BookOpen },
        ]
    },
    { title: 'Daily Verse', href: '/admin/daily-verse', icon: Sparkles },
    { title: "Pastor's Blog", href: '/admin/blog', icon: PenSquare },
    { title: 'Social Auto-Poster', href: '/admin/social-posts', icon: Share2 },
    { title: 'SEO Meta', href: '/admin/seo-meta', icon: Globe },
    { title: 'Statement of Faith', href: '/admin/statement-of-faith', icon: BookOpen },
    { title: 'Testimony Page', href: '/admin/testimony-page', icon: MessageCircle },
    { title: 'Homepage Hero Video', href: '/admin/hero-video', icon: Video },
    { title: 'Site Chrome (nav · footer · apps · pages · emails)', href: '/admin/site-content', icon: LayoutDashboard },
    { title: 'Caption Operator', href: '/admin/live-captions', icon: Megaphone },
    { title: 'Moderators', href: '/admin/moderators', icon: ShieldCheck },
    { title: 'Database Backups', href: '/admin/backups', icon: Database },
    { title: 'Downloads', href: '/admin/downloads', icon: FileText },
    { title: 'Backend Diagnostics', href: '/admin/diagnostics', icon: Zap },
    {
        title: 'Tier 3 (Global)',
        icon: Sparkles,
        items: [
            { title: 'AI Features',       href: '/admin/ai',            icon: Sparkles },
            { title: 'Online Campus',     href: '/admin/online-campus', icon: Radio },
            { title: 'Kingdom Outcomes',  href: '/admin/decisions',     icon: Sparkles },
            { title: 'Conversion CRM',    href: '/admin/conversion',    icon: Heart },
            { title: 'Pastoral Care',     href: '/admin/pastoral-care', icon: ShieldCheck },
            { title: 'Small Groups',      href: '/admin/small-groups',  icon: Users },
            { title: 'Children Check-In', href: '/admin/children-checkin', icon: Baby },
            { title: 'Church Locations',  href: '/admin/locations',     icon: Globe },
            { title: 'Missionaries',      href: '/admin/missionaries',  icon: Globe },
            { title: 'Live Prayer Center', href: '/admin/intercessors', icon: Heart },
        ]
    },
    { title: 'Two-Factor Auth', href: '/admin/2fa', icon: ShieldCheck },
    { title: 'Legal Pages', href: '/admin/legal', icon: FileText },
    {
        title: 'Governance',
        icon: Crown,
        items: [
            { title: 'Lead Coordinators', href: '/admin/leads',     icon: Crown },
            { title: 'Audit Log',         href: '/admin/audit-log', icon: FileText },
        ],
    },
    { title: 'Messages', href: '/admin/chat', icon: MessageCircle },
    {
        title: 'Member Journey',
        icon: Sparkles,
        items: [
            { title: 'Welcome Flow',         href: '/admin/welcome-flow',  icon: Mail },
            { title: 'Discipleship Pathway', href: '/admin/discipleship',  icon: Sparkles },
            { title: 'Counselling',          href: '/admin/counselling',   icon: Calendar },
            { title: 'Life Events',          href: '/admin/life-events',   icon: Heart },
        ],
    },
    {
        title: 'Giving',
        icon: HandHeart,
        items: [
            { title: 'Giving Page Content',  href: '/admin/giving-content', icon: FileText },
            { title: 'Payment Providers',    href: '/admin/payments',      icon: HandHeart },
            { title: 'Donations Log',        href: '/admin/donations',     icon: BarChart },
        ],
    },
    { title: 'Branding (Logo + Favicon)', href: '/admin/branding', icon: ImageIcon },
    { title: 'Admin Settings', href: '/admin/settings', icon: Settings },
]

export default function AdminSidebar() {
    const pathname = usePathname()
    const [mobileOpen, setMobileOpen] = useState(false)
    const [chatUnread, setChatUnread] = useState(0)
    const [allPendingCount, setAllPendingCount] = useState(0)
    const [volunteerCount, setVolunteerCount] = useState(0)
    const [youthPending, setYouthPending] = useState(0)
    const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({})
    const [childrenPending, setChildrenPending] = useState(0)

    useEffect(() => {
        const interval = setInterval(async () => {
            try {
                const counts = await chatApi.getUnreadCount()
                setChatUnread(counts.unread_count)
            } catch { }
        }, 30000)

        return () => clearInterval(interval)
    }, [])

    useEffect(() => {
        const interval = setInterval(async () => {
            try {
                const [approvals, vol] = await Promise.all([
                    serviceRequestApi.getAllRequests('pending'),
                    listMembers('ushering')
                ])

                setAllPendingCount(approvals.requests.length)
                setVolunteerCount(vol.length)
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

            {/* Visit Site Button at top of sidebar */}
            <div className="px-3 pt-3">
                <a href="/" target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-gradient-to-r from-[#f5bb00] to-[#ffd633] text-[#140152] text-sm font-black hover:shadow-lg transition-all">
                    <Globe className="w-4 h-4" />
                    <span className="flex-1">Visit Public Site</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                </a>
            </div>

            <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
                {sidebarItems.map((item, idx) => {
                    const isGroup = 'items' in item
                    if (isGroup) {
                        const group = item as GroupItem
                        const isExpanded = expandedGroups[group.title] ?? group.items.some(s => pathname === s.href || (s.href !== '/admin' && pathname.startsWith(s.href)))
                        return (
                            <div key={`group-${idx}`}>
                                <button
                                    onClick={() => setExpandedGroups(prev => ({ ...prev, [group.title]: !isExpanded }))}
                                    className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200 group text-sm text-white/70 hover:bg-white/10 hover:text-white"
                                >
                                    <group.icon className="w-4 h-4" />
                                    <span className="flex-1 text-left font-semibold">{group.title}</span>
                                    {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                                </button>
                                {isExpanded && (
                                    <div className="ml-3 mt-1 space-y-0.5 border-l border-white/10 pl-3">
                                        {group.items.map((sub) => {
                                            const subActive = pathname === sub.href || (sub.href !== '/admin' && pathname.startsWith(sub.href) && sub.href.length > 6)
                                            return (
                                                <Link key={sub.href} href={sub.href} onClick={() => setMobileOpen(false)}
                                                    className={cn(
                                                        "flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200 group text-[13px]",
                                                        subActive
                                                            ? "bg-[#f5bb00]/90 text-[#140152] font-bold"
                                                            : "text-white/60 hover:bg-white/10 hover:text-white"
                                                    )}>
                                                    <sub.icon className={cn("w-3.5 h-3.5", subActive ? "text-[#140152]" : "text-white/60")} />
                                                    <span className="flex-1">{sub.title}</span>
                                                </Link>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>
                        )
                    }

                    const simple = item as SimpleItem
                    const isActive = pathname === simple.href || (simple.href !== '/admin' && pathname.startsWith(simple.href))

                    return (
                        <Link
                            key={simple.href}
                            href={simple.href}
                            onClick={() => setMobileOpen(false)}
                            className={cn(
                                "flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200 group text-sm",
                                isActive
                                    ? "bg-[#f5bb00] text-[#140152] font-bold"
                                    : "text-white/70 hover:bg-white/10 hover:text-white"
                            )}
                        >
                            <simple.icon className={cn("w-4 h-4", isActive ? "text-[#140152]" : "text-white/70 group-hover:text-white")} />
                            <span className="flex-1">{simple.title}</span>
                            {simple.href === '/admin/chat' && chatUnread > 0 && (
                                <span className="bg-[#f5bb00] text-[#140152] text-xs font-black w-5 h-5 rounded-full flex items-center justify-center">
                                    {chatUnread > 9 ? '9+' : chatUnread}
                                </span>
                            )}
                            {simple.href === '/admin/approvals' && allPendingCount > 0 && (
                                <span className="bg-red-500 text-white text-xs font-black min-w-[1.25rem] h-5 px-1 rounded-full flex items-center justify-center animate-pulse">
                                    {allPendingCount > 9 ? '9+' : allPendingCount}
                                </span>
                            )}
                            {simple.href === '/admin/volunteers' && volunteerCount > 0 && (
                                <span className="bg-purple-500 text-white text-xs font-black w-5 h-5 rounded-full flex items-center justify-center">
                                    {volunteerCount > 9 ? '9+' : volunteerCount}
                                </span>
                            )}
                        </Link>
                    )
                })}
            </nav>

            {/* Logout Button */}
            <div className="p-3 border-t border-white/10">
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200 group text-sm text-red-300 hover:bg-red-500/20 hover:text-red-100 font-medium"
                >
                    <LogOut className="w-4 h-4" />
                    <span className="flex-1 text-left">Log Out</span>
                </button>
            </div>
        </>
    )

    return (
        <>
            {/* Desktop Sidebar */}
            <aside className="hidden lg:flex w-64 bg-gradient-to-b from-[#140152] to-[#220263] border-r border-white/10 flex-col h-screen">
                {SidebarContent}
            </aside>

            {/* Mobile Header */}
            <div className="lg:hidden flex items-center justify-between bg-gradient-to-b from-[#140152] to-[#220263] border-b border-white/10 px-4 py-3 sticky top-0 z-50">
                <Link href="/admin" className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                        <img src="/NewLETWlogo1.jpg" alt="LETW" className="w-full h-full object-cover rounded-lg" />
                    </div>
                    <span className="font-bold text-[#f5bb00] text-sm">LETW</span>
                </Link>
                <button onClick={() => setMobileOpen(!mobileOpen)} className="text-white p-2">
                    {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
            </div>

            {/* Mobile Sidebar */}
            {mobileOpen && (
                <aside className="lg:hidden fixed inset-0 top-[60px] bg-gradient-to-b from-[#140152] to-[#220263] border-r border-white/10 overflow-y-auto z-40">
                    {SidebarContent}
                </aside>
            )}
        </>
    )
}
