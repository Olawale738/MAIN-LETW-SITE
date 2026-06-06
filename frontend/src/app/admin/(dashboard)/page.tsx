'use client'
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
    Video, Calendar, Users, Activity, TrendingUp, Megaphone, Loader2,
    FileText, Clock, User, ArrowRight, BookOpen, Music, Briefcase,
    HandHeart, Settings, Crown, Baby, Zap, CheckCircle, XCircle,
    AlertTriangle, BarChart2, Bell, ChevronRight, Radio, MessageCircle,
    Target, Globe, Shield, RefreshCw, UserCheck,
} from 'lucide-react'
import { dashboardApi, DashboardStats, RecentActivity } from '@/lib/api'
import { listMembers, updateMember, removeMember, adminPendingDeptRequests, adminApproveDeptMember, adminRejectDeptMember, DeptMember, PendingDeptRequest, type Department } from '@/lib/dept-api'

// ── Helpers ────────────────────────────────────────────────────────────────────

function greeting() {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
}

function formatTimeAgo(timestamp: string) {
    const diff = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000)
    if (diff < 60) return 'Just now'
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    return `${Math.floor(diff / 86400)}d ago`
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function StatCard({ label, value, trend, trendLabel, icon: Icon, color, bg }: {
    label: string; value: number | string; trend?: number; trendLabel?: string
    icon: React.ElementType; color: string; bg: string
}) {
    return (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all group">
            <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: bg }}>
                    <Icon className="w-5 h-5" style={{ color }} />
                </div>
                {trend !== undefined && (
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5 ${trend >= 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
                        <TrendingUp className="w-3 h-3" /> +{trend}
                    </span>
                )}
            </div>
            <p className="text-2xl font-black text-[#140152] leading-none">{value}</p>
            <p className="text-xs text-gray-500 font-medium mt-1.5">{label}</p>
            {trendLabel && <p className="text-[10px] text-gray-400 mt-0.5">{trendLabel}</p>}
        </motion.div>
    )
}

function SectionHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
    return (
        <div className="flex items-end justify-between mb-5">
            <div>
                <h2 className="text-lg font-black text-[#140152]">{title}</h2>
                {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
            </div>
            {action}
        </div>
    )
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function AdminDashboardPage() {
    const [stats, setStats]                   = useState<DashboardStats | null>(null)
    const [activities, setActivities]         = useState<RecentActivity[]>([])
    const [loading, setLoading]               = useState(true)
    const [refreshing, setRefreshing]         = useState(false)
    const [pendingYouth, setPendingYouth]     = useState<DeptMember[]>([])
    const [pendingChildren, setPendingChildren] = useState<DeptMember[]>([])
    const [allPendingDept, setAllPendingDept] = useState<PendingDeptRequest[]>([])
    const [approvingId, setApprovingId]       = useState<string | null>(null)

    const load = async (showRefresh = false) => {
        if (showRefresh) setRefreshing(true)
        try {
            const [statsData, activityData, youthMembers, childrenMembers, pendingDept] = await Promise.all([
                dashboardApi.getStats(),
                dashboardApi.getRecentActivity(6),
                listMembers('youth').catch(() => [] as DeptMember[]),
                listMembers('children').catch(() => [] as DeptMember[]),
                adminPendingDeptRequests().catch(() => [] as PendingDeptRequest[]),
            ])
            setStats(statsData)
            setActivities(activityData.activities)
            setPendingYouth(youthMembers.filter(m => !m.is_active))
            setPendingChildren(childrenMembers.filter(m => !m.is_active))
            setAllPendingDept(pendingDept)
        } catch (err) {
            console.error('Failed to load dashboard data', err)
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }

    useEffect(() => { load() }, [])

    const approveMember = async (dept: 'youth' | 'children', member: DeptMember) => {
        const label = dept === 'youth' ? 'Youth Ministry' : 'Children Ministry'
        if (!confirm(`Approve ${member.name} for ${label}?`)) return
        setApprovingId(member.user_id)
        try {
            await updateMember(dept, member.user_id, { is_active: true })
            dept === 'youth'
                ? setPendingYouth(p => p.filter(m => m.user_id !== member.user_id))
                : setPendingChildren(p => p.filter(m => m.user_id !== member.user_id))
            setAllPendingDept(p => p.filter(m => !(m.user_id === member.user_id && m.department === dept)))
        } catch (err) { console.error('Approval failed', err) }
        finally { setApprovingId(null) }
    }

    const declineMember = async (dept: 'youth' | 'children', member: DeptMember) => {
        setApprovingId(member.user_id + '-decline')
        try {
            await removeMember(dept, member.user_id)
            dept === 'youth'
                ? setPendingYouth(p => p.filter(m => m.user_id !== member.user_id))
                : setPendingChildren(p => p.filter(m => m.user_id !== member.user_id))
            setAllPendingDept(p => p.filter(m => !(m.user_id === member.user_id && m.department === dept)))
        } catch (err) { console.error('Decline failed', err) }
        finally { setApprovingId(null) }
    }

    const quickApproveD = async (r: PendingDeptRequest) => {
        setApprovingId(r.id)
        try {
            await adminApproveDeptMember(r.department as Department, r.user_id)
            setAllPendingDept(p => p.filter(x => x.id !== r.id))
        } catch (err) { console.error('Approval failed', err) }
        finally { setApprovingId(null) }
    }

    const quickRejectD = async (r: PendingDeptRequest) => {
        setApprovingId(r.id + '-reject')
        try {
            await adminRejectDeptMember(r.department as Department, r.user_id)
            setAllPendingDept(p => p.filter(x => x.id !== r.id))
        } catch (err) { console.error('Decline failed', err) }
        finally { setApprovingId(null) }
    }

    const getActivityStyle = (type: string) => {
        switch (type) {
            case 'sermon':  return { icon: Video,    bg: '#fee2e2', color: '#dc2626' }
            case 'user':    return { icon: User,     bg: '#dbeafe', color: '#2563eb' }
            case 'event':   return { icon: Calendar, bg: '#f3e8ff', color: '#7c3aed' }
            default:        return { icon: Activity, bg: '#f3f4f6', color: '#6b7280' }
        }
    }

    const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    const pendingTotal = allPendingDept.length   // use the unified list from the new endpoint

    if (loading) return (
        <div className="flex flex-col items-center justify-center py-32 gap-4">
            <div className="w-16 h-16 rounded-2xl bg-[#140152] flex items-center justify-center shadow-xl">
                <Loader2 className="w-8 h-8 animate-spin text-[#f5bb00]" />
            </div>
            <p className="text-sm text-gray-400 font-medium">Loading dashboard…</p>
        </div>
    )

    return (
        <div className="space-y-8 pb-10">

            {/* ── Welcome Banner ── */}
            <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#140152] via-[#1e0275] to-[#0d0133] p-7">
                {/* Decorative orbs */}
                <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-[#f5bb00]/10 blur-2xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-purple-600/20 blur-2xl pointer-events-none" />

                <div className="relative z-10 flex items-start justify-between gap-4 flex-wrap">
                    <div>
                        <p className="text-[#f5bb00]/80 text-sm font-semibold mb-1">{today}</p>
                        <h1 className="text-2xl font-black text-white leading-tight">{greeting()}, Admin 👋</h1>
                        <p className="text-white/50 text-sm mt-1">Here's what's happening at LETW today.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        {pendingTotal > 0 && (
                            <Link href="/admin/service-requests"
                                className="flex items-center gap-2 bg-amber-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl hover:bg-amber-600 transition-all shadow-lg">
                                <Bell className="w-3.5 h-3.5" />
                                {pendingTotal} Pending
                            </Link>
                        )}
                        <button onClick={() => load(true)} disabled={refreshing}
                            className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all border border-white/10">
                            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                            Refresh
                        </button>
                    </div>
                </div>

                {/* Quick stat pills */}
                <div className="relative z-10 flex flex-wrap gap-3 mt-6">
                    {[
                        { label: 'Members', val: stats?.total_users ?? 0 },
                        { label: 'Sermons',  val: stats?.total_sermons ?? 0 },
                        { label: 'Events',   val: stats?.upcoming_events ?? 0 },
                        { label: 'Requests', val: stats?.pending_requests ?? 0 },
                    ].map((s, i) => (
                        <div key={i} className="bg-white/10 border border-white/10 rounded-xl px-4 py-2 text-center">
                            <p className="text-[#f5bb00] font-black text-lg leading-none">{s.val}</p>
                            <p className="text-white/50 text-[10px] mt-0.5">{s.label}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Stats Grid ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Total Sermons"    value={stats?.total_sermons ?? 0}         trend={stats?.sermons_this_month}   trendLabel="this month" icon={Video}       color="#dc2626" bg="#fee2e2" />
                <StatCard label="Upcoming Events"  value={stats?.upcoming_events ?? 0}                                                                    icon={Calendar}    color="#7c3aed" bg="#f3e8ff" />
                <StatCard label="Active Members"   value={stats?.active_users ?? 0}           trend={stats?.new_users_this_month} trendLabel="this month" icon={Users}       color="#2563eb" bg="#dbeafe" />
                <StatCard label="Service Requests" value={stats?.pending_requests ?? 0}                                                                    icon={Activity}    color="#d97706" bg="#fef3c7" />
            </div>

            {/* ── Activity + Quick Actions ── */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

                {/* Recent Activity */}
                <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
                        <div>
                            <h2 className="font-black text-[#140152] text-sm">Recent Activity</h2>
                            <p className="text-[10px] text-gray-400 mt-0.5">Latest actions across the platform</p>
                        </div>
                        <Clock className="w-4 h-4 text-gray-300" />
                    </div>
                    <div className="divide-y divide-gray-50">
                        {activities.length === 0 ? (
                            <div className="py-12 text-center">
                                <Activity className="w-8 h-8 text-gray-200 mx-auto mb-3" />
                                <p className="text-sm text-gray-400">No recent activity</p>
                            </div>
                        ) : activities.map((act, i) => {
                            const { icon: Icon, bg, color } = getActivityStyle(act.type)
                            return (
                                <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                                    className="flex items-center gap-4 px-6 py-3.5 hover:bg-gray-50 transition-colors group">
                                    <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: bg }}>
                                        <Icon className="w-4 h-4" style={{ color }} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-gray-800 truncate">{act.title}</p>
                                        <p className="text-xs text-gray-400 truncate">{act.description}</p>
                                    </div>
                                    <span className="text-[10px] text-gray-300 font-medium flex-shrink-0">{formatTimeAgo(act.timestamp)}</span>
                                </motion.div>
                            )
                        })}
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="lg:col-span-2 bg-gradient-to-br from-[#140152] to-[#1e0275] rounded-2xl p-5 shadow-sm">
                    <h2 className="font-black text-white text-sm mb-4">Quick Actions</h2>
                    <div className="grid grid-cols-2 gap-2.5">
                        {[
                            { href: '/admin/sermons',       icon: Video,     label: 'Add Sermon',    sub: 'Upload content' },
                            { href: '/admin/events',        icon: Calendar,  label: 'New Event',     sub: 'Schedule event' },
                            { href: '/admin/announcements', icon: Megaphone, label: 'Announce',      sub: 'Notify members' },
                            { href: '/admin/users',         icon: Users,     label: 'Users',         sub: `${stats?.total_users ?? 0} total` },
                            { href: '/admin/nominations',   icon: Crown,     label: 'Nominations',   sub: 'Assign leaders' },
                            { href: '/admin/volunteers',    icon: UserCheck, label: 'Volunteers',    sub: 'View directory' },
                            { href: '/admin/settings?tab=ministry', icon: Settings, label: 'Ministry Roles', sub: 'Manage coordinators' },
                            { href: '/admin/live-stream',   icon: Radio,     label: 'Live Stream',   sub: 'Manage broadcast' },
                        ].map((a, i) => (
                            <Link key={i} href={a.href}
                                className="bg-white/8 hover:bg-white/15 border border-white/10 rounded-xl p-3 transition-all group">
                                <div className="w-7 h-7 rounded-lg bg-[#f5bb00]/20 flex items-center justify-center mb-2">
                                    <a.icon className="w-3.5 h-3.5 text-[#f5bb00]" />
                                </div>
                                <p className="text-white text-xs font-bold leading-tight">{a.label}</p>
                                <p className="text-white/40 text-[10px] mt-0.5">{a.sub}</p>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Pending Approvals (ALL departments) ── */}
            {allPendingDept.length > 0 && (
                <div>
                    <SectionHeader
                        title="Pending Volunteer Approvals"
                        subtitle={`${pendingTotal} member${pendingTotal !== 1 ? 's' : ''} waiting across all departments`}
                        action={
                            <Link href="/admin/approvals"
                                className="flex items-center gap-1.5 text-xs font-bold bg-amber-100 text-amber-700 px-3 py-1.5 rounded-full hover:bg-amber-200 transition-colors">
                                {pendingTotal} waiting — Review all <ChevronRight className="w-3.5 h-3.5" />
                            </Link>
                        }
                    />
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="divide-y divide-gray-50">
                            {allPendingDept.slice(0, 8).map(r => {
                                const DEPT_LABELS: Record<string, string> = {
                                    choir: 'Worship Team', media: 'Media & Creative', hospitality: 'Hospitality Team',
                                    ushering: 'Ushering & Welcome', security: 'Security & Safety',
                                    youth: 'Youth Ministry', children: "Children's Ministry",
                                }
                                const daysAgo = r.joined_at ? Math.floor((Date.now() - new Date(r.joined_at).getTime()) / 86_400_000) : null
                                const isBusy = approvingId === r.id || approvingId === r.id + '-reject'
                                return (
                                    <div key={r.id} className="flex items-center gap-3 px-5 py-3 hover:bg-amber-50/30 transition-colors">
                                        <div className="w-8 h-8 rounded-full bg-[#140152] text-white flex items-center justify-center font-black text-xs shrink-0">
                                            {r.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-[#140152] truncate">{r.name}</p>
                                            <p className="text-[10px] text-gray-400 truncate">
                                                {DEPT_LABELS[r.department] ?? r.department}
                                                {daysAgo !== null && ` · ${daysAgo === 0 ? 'today' : daysAgo + 'd ago'}`}
                                            </p>
                                        </div>
                                        <div className="flex gap-1.5 shrink-0">
                                            <button onClick={() => quickApproveD(r)} disabled={!!approvingId}
                                                className="flex items-center gap-1 px-2.5 py-1.5 bg-green-600 hover:bg-green-700 text-white text-[10px] font-bold rounded-lg disabled:opacity-50 transition-all">
                                                {isBusy ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />} Approve
                                            </button>
                                            <button onClick={() => quickRejectD(r)} disabled={!!approvingId}
                                                className="px-2.5 py-1.5 border border-red-200 text-red-600 hover:bg-red-50 text-[10px] font-bold rounded-lg disabled:opacity-50 transition-all">
                                                <XCircle className="w-3 h-3" />
                                            </button>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                        {allPendingDept.length > 8 && (
                            <div className="px-5 py-3 border-t border-gray-50 text-center">
                                <Link href="/admin/approvals" className="text-xs font-bold text-[#140152] hover:underline">
                                    +{allPendingDept.length - 8} more — View all pending approvals
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ── Ministry Departments ── */}
            <div>
                <SectionHeader
                    title="Ministry Departments"
                    subtitle="Manage all ministry coordinator portals and team members"
                    action={
                        <Link href="/admin/nominations" className="flex items-center gap-1.5 text-xs font-bold text-[#140152] hover:text-[#f5bb00] transition-colors">
                            <Crown className="w-3.5 h-3.5 text-amber-500" /> Nominations
                        </Link>
                    }
                />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[
                        {
                            label: 'Choir', sub: 'Alter Sound', icon: Music, color: '#4f46e5', bg: '#eef2ff',
                            links: [
                                { href: '/services/alter-sound/choirmaster', label: 'Choirmaster Dashboard', sub: 'Members, attendance, notices' },
                                { href: '/admin/alter-sound/tracks',         label: 'Manage Tracks',         sub: 'Upload choir audio' },
                                { href: '/admin/nominations',                label: 'Assign Choirmaster',    sub: 'Admin-only nomination', crown: true },
                            ],
                        },
                        {
                            label: 'Youth Ministry', sub: 'Leader & member access', icon: Zap, color: '#d97706', bg: '#fef3c7',
                            links: [
                                { href: '/youth/coordinator', label: 'Youth Leader Dashboard', sub: 'Members, activities, attendance' },
                                { href: '/youth/dashboard',   label: 'Member Dashboard',       sub: 'View as a youth member' },
                                { href: '/admin/nominations', label: 'Assign Youth Leader',    sub: 'Admin-only nomination', crown: true },
                            ],
                        },
                        {
                            label: 'Children Ministry', sub: 'Coordinator & member access', icon: Baby, color: '#7c3aed', bg: '#f3e8ff',
                            links: [
                                { href: '/children/coordinator', label: 'Coordinator Dashboard', sub: 'Members, activities, attendance' },
                                { href: '/children/dashboard',   label: 'Member Dashboard',      sub: 'View as a children member' },
                                { href: '/admin/nominations',    label: 'Assign Coordinator',    sub: 'Admin-only nomination', crown: true },
                            ],
                        },
                        {
                            label: 'Evangelism', sub: 'Outreach & sign-ups', icon: Megaphone, color: '#dc2626', bg: '#fee2e2',
                            links: [
                                { href: '/services/evangelism',          label: 'Evangelism Portal',     sub: 'Manage outreach activities' },
                                { href: '/admin/evangelism-signups',     label: 'View Sign-Ups',         sub: 'Visitor interest registrations' },
                                { href: '/admin/pages/evangelism',       label: 'Edit Evangelism Page',  sub: 'CMS content management' },
                            ],
                        },
                        {
                            label: 'Volunteer Teams', sub: 'All volunteer departments', icon: HandHeart, color: '#b45309', bg: '#fef3c7',
                            links: [
                                { href: '/dashboard/volunteer',  label: 'Volunteer Dashboard',  sub: 'Manage all teams' },
                                { href: '/admin/volunteers',     label: 'Volunteer Directory',  sub: 'View all volunteers' },
                                { href: '/admin/approvals',      label: 'Pending Approvals',    sub: 'Review applications' },
                            ],
                        },
                        {
                            label: 'Bible Study & Mentoring', sub: 'Mentor coordinator', icon: BookOpen, color: '#059669', bg: '#ecfdf5',
                            links: [
                                { href: '/dashboard/mentor',                  label: 'Mentor Dashboard',     sub: 'Oversee mentees' },
                                { href: '/admin/bible-study/groups',           label: 'Bible Study Groups',   sub: 'Manage study groups' },
                                { href: '/admin/bible-study/chat-moderation',  label: 'Chat Moderation',      sub: 'Monitor discussions' },
                            ],
                        },
                    ].map((dept, i) => (
                        <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                            className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-all">
                            <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-50">
                                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: dept.bg }}>
                                    <dept.icon className="w-4.5 h-4.5" style={{ color: dept.color }} />
                                </div>
                                <div>
                                    <p className="text-sm font-black text-[#140152]">{dept.label}</p>
                                    <p className="text-[10px] text-gray-400">{dept.sub}</p>
                                </div>
                            </div>
                            <div className="divide-y divide-gray-50">
                                {dept.links.map((l, j) => (
                                    <Link key={j} href={l.href}
                                        className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors group">
                                        <div>
                                            <p className="text-sm font-semibold text-gray-700 group-hover:text-[#140152] transition-colors">{l.label}</p>
                                            <p className="text-[10px] text-gray-400">{l.sub}</p>
                                        </div>
                                        {l.crown
                                            ? <Crown className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                                            : <ChevronRight className="w-4 h-4 text-gray-200 group-hover:text-gray-400 transition-colors flex-shrink-0" />}
                                    </Link>
                                ))}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* ── Volunteer Departments ── */}
            <div>
                <SectionHeader
                    title="Volunteer Departments"
                    subtitle="Direct access to all volunteer team dashboards"
                    action={
                        <Link href="/dashboard/volunteer" className="flex items-center gap-1.5 text-xs font-bold text-[#140152] hover:text-[#f5bb00] transition-colors">
                            <HandHeart className="w-3.5 h-3.5 text-amber-500" /> Volunteer Coordinator
                        </Link>
                    }
                />
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    {[
                        { label: 'Security',    sub: 'Safety & order', href: '/services/security',    icon: Shield,     color: '#dc2626', bg: '#fee2e2' },
                        { label: 'Ushering',    sub: 'Welcome team',   href: '/services/ushering',    icon: UserCheck,  color: '#0284c7', bg: '#e0f2fe' },
                        { label: 'Hospitality', sub: 'Guest care',     href: '/services/hospitality', icon: HandHeart,  color: '#db2777', bg: '#fdf2f8' },
                        { label: 'Media',       sub: 'Creative team',  href: '/services/media',       icon: Video,      color: '#7c3aed', bg: '#f3e8ff' },
                        { label: 'Evangelism',  sub: 'Outreach',       href: '/services/evangelism',  icon: Megaphone,  color: '#ea580c', bg: '#fff7ed' },
                    ].map((d, i) => (
                        <Link key={i} href={d.href}
                            className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all p-4 group">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: d.bg }}>
                                <d.icon className="w-5 h-5" style={{ color: d.color }} />
                            </div>
                            <p className="text-sm font-black text-[#140152] group-hover:text-[#f5bb00] transition-colors">{d.label}</p>
                            <p className="text-[10px] text-gray-400 mt-0.5">{d.sub}</p>
                        </Link>
                    ))}
                </div>
            </div>

            {/* ── CMS Pages & Content ── */}
            <div>
                <SectionHeader
                    title="CMS Pages & Content"
                    subtitle="Manage church website pages and content"
                />
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    {[
                        { label: 'Home Page',       href: '/admin/pages/home',           icon: Home,       color: '#059669', bg: '#ecfdf5' },
                        { label: 'About Page',      href: '/admin/pages/about',          icon: Users,      color: '#0284c7', bg: '#e0f2fe' },
                        { label: 'Impact Page',     href: '/admin/pages/impact',         icon: Globe,      color: '#7c3aed', bg: '#f3e8ff' },
                        { label: 'Sunday Service',  href: '/admin/pages/sunday-service', icon: BookOpen,   color: '#d97706', bg: '#fef3c7' },
                        { label: 'Evangelism Page', href: '/admin/pages/evangelism',     icon: Megaphone,  color: '#dc2626', bg: '#fee2e2' },
                    ].map((p, i) => (
                        <Link key={i} href={p.href}
                            className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all p-4 group">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: p.bg }}>
                                <p.icon className="w-5 h-5" style={{ color: p.color }} />
                            </div>
                            <p className="text-sm font-black text-[#140152] group-hover:text-[#f5bb00] transition-colors">{p.label}</p>
                            <p className="text-[10px] text-gray-400 mt-0.5">Edit content</p>
                        </Link>
                    ))}
                </div>
            </div>

            {/* ── Services Management ── */}
            <div>
                <SectionHeader title="Services Management" subtitle="Configure and manage all church services" />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        {
                            icon: BookOpen, label: 'Bible Study', color: '#059669', bg: '#ecfdf5',
                            links: [
                                { href: '/admin/bible-study/plans',    label: 'Reading Plans'  },
                                { href: '/admin/bible-study/readings', label: 'Daily Readings' },
                                { href: '/admin/bible-study/resources', label: 'Resources'     },
                                { href: '/admin/bible-study/settings', label: 'Settings'       },
                            ],
                        },
                        {
                            icon: Music, label: 'Alter Sound', color: '#4f46e5', bg: '#eef2ff',
                            links: [
                                { href: '/admin/alter-sound/categories', label: 'Categories' },
                                { href: '/admin/alter-sound/tracks',     label: 'Tracks'     },
                                { href: '/admin/alter-sound/settings',   label: 'Settings'   },
                            ],
                        },
                        {
                            icon: HandHeart, label: 'Prayer', color: '#db2777', bg: '#fdf2f8',
                            links: [
                                { href: '/admin/prayer/categories', label: 'Categories' },
                                { href: '/admin/prayer/schedules',  label: 'Schedules'  },
                                { href: '/admin/prayer/requests',   label: 'Requests'   },
                                { href: '/admin/prayer/settings',   label: 'Settings'   },
                            ],
                        },
                        {
                            icon: Target, label: 'Career', color: '#0284c7', bg: '#e0f2fe',
                            links: [
                                { href: '/admin/career',          label: 'Modules'  },
                                { href: '/admin/career/sessions', label: 'Sessions' },
                            ],
                        },
                    ].map((svc, i) => (
                        <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-all">
                            <div className="flex items-center gap-2.5 px-4 py-3.5 border-b border-gray-50">
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: svc.bg }}>
                                    <svc.icon className="w-4 h-4" style={{ color: svc.color }} />
                                </div>
                                <p className="text-sm font-black text-[#140152]">{svc.label}</p>
                            </div>
                            <div className="divide-y divide-gray-50">
                                {svc.links.map((l, j) => (
                                    <Link key={j} href={l.href}
                                        className="flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 transition-colors group">
                                        <span className="text-xs font-semibold text-gray-600 group-hover:text-[#140152] transition-colors">{l.label}</span>
                                        <ChevronRight className="w-3.5 h-3.5 text-gray-200 group-hover:text-gray-400 transition-colors flex-shrink-0" />
                                    </Link>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Communication & Admin Settings ── */}
            <div>
                <SectionHeader
                    title="Communication & Settings"
                    subtitle="Messages, notifications, and system configuration"
                />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { label: 'Messages',         sub: 'User conversations',    href: '/admin/chat',         icon: MessageCircle, color: '#2563eb', bg: '#dbeafe' },
                        { label: 'Group Chat',       sub: 'Bible study moderation', href: '/admin/bible-study/chat-moderation', icon: MessageCircle, color: '#059669', bg: '#ecfdf5' },
                        { label: 'Admin Settings',   sub: 'Profile & security',    href: '/admin/settings',     icon: Settings,      color: '#6b7280', bg: '#f3f4f6' },
                        { label: 'Ministry Roles',   sub: 'Coordinator creds',     href: '/admin/settings?tab=ministry', icon: Crown, color: '#f59e0b', bg: '#fef3c7' },
                    ].map((c, i) => (
                        <Link key={i} href={c.href}
                            className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all p-4 group">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: c.bg }}>
                                <c.icon className="w-5 h-5" style={{ color: c.color }} />
                            </div>
                            <p className="text-sm font-black text-[#140152] group-hover:text-[#f5bb00] transition-colors">{c.label}</p>
                            <p className="text-[10px] text-gray-400 mt-0.5">{c.sub}</p>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    )
}
