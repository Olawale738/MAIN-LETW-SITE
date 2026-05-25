'use client'
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Video, Calendar, Users, Activity, TrendingUp, Megaphone, Loader2, FileText, Clock, User, ArrowRight, BookOpen, Music, Briefcase, HandHeart, Settings, Crown, Baby, Zap, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'
import { dashboardApi, DashboardStats, RecentActivity } from '@/lib/api'
import { listMembers, updateMember, removeMember, DeptMember } from '@/lib/dept-api'

export default function AdminDashboardPage() {
    const [stats, setStats] = useState<DashboardStats | null>(null)
    const [activities, setActivities] = useState<RecentActivity[]>([])
    const [loading, setLoading] = useState(true)
    const [pendingYouth, setPendingYouth] = useState<DeptMember[]>([])
    const [pendingChildren, setPendingChildren] = useState<DeptMember[]>([])
    const [approvingId, setApprovingId] = useState<string | null>(null)

    useEffect(() => {
        loadDashboardData()
    }, [])

    const loadDashboardData = async () => {
        try {
            const [statsData, activityData, youthMembers, childrenMembers] = await Promise.all([
                dashboardApi.getStats(),
                dashboardApi.getRecentActivity(5),
                listMembers('youth').catch(() => [] as DeptMember[]),
                listMembers('children').catch(() => [] as DeptMember[]),
            ])
            setStats(statsData)
            setActivities(activityData.activities)
            setPendingYouth(youthMembers.filter(m => !m.is_active))
            setPendingChildren(childrenMembers.filter(m => !m.is_active))
        } catch (err) {
            console.error('Failed to load dashboard data', err)
        } finally {
            setLoading(false)
        }
    }

    const approveMember = async (dept: 'youth' | 'children', member: DeptMember) => {
        setApprovingId(member.user_id)
        try {
            await updateMember(dept, member.user_id, { is_active: true })
            if (dept === 'youth') setPendingYouth(p => p.filter(m => m.user_id !== member.user_id))
            else setPendingChildren(p => p.filter(m => m.user_id !== member.user_id))
        } catch (err) {
            console.error('Approval failed', err)
        } finally {
            setApprovingId(null)
        }
    }

    const declineMember = async (dept: 'youth' | 'children', member: DeptMember) => {
        setApprovingId(member.user_id + '-decline')
        try {
            await removeMember(dept, member.user_id)
            if (dept === 'youth') setPendingYouth(p => p.filter(m => m.user_id !== member.user_id))
            else setPendingChildren(p => p.filter(m => m.user_id !== member.user_id))
        } catch (err) {
            console.error('Decline failed', err)
        } finally {
            setApprovingId(null)
        }
    }

    const formatTimeAgo = (timestamp: string) => {
        const now = new Date()
        const date = new Date(timestamp)
        const diff = Math.floor((now.getTime() - date.getTime()) / 1000)
        if (diff < 60) return 'Just now'
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
        if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
        return `${Math.floor(diff / 86400)}d ago`
    }

    const getActivityIcon = (type: string) => {
        switch (type) {
            case 'sermon': return <Video className="w-4 h-4 text-red-500" />
            case 'user': return <User className="w-4 h-4 text-blue-500" />
            case 'event': return <Calendar className="w-4 h-4 text-purple-500" />
            default: return <Activity className="w-4 h-4 text-gray-500" />
        }
    }

    if (loading) {
        return (
            <div className="flex justify-center py-20">
                <Loader2 className="w-10 h-10 animate-spin text-[#140152]" />
            </div>
        )
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-[#140152]">Dashboard</h1>
                <p className="text-gray-500 mt-2">Welcome back! Here's what's happening.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="border-none shadow-md hover:shadow-lg transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500 uppercase tracking-wider">Total Sermons</CardTitle>
                        <Video className="w-4 h-4 text-[#f5bb00]" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-[#140152]">{stats?.total_sermons || 0}</div>
                        <p className="text-xs text-gray-500 mt-1 flex items-center">
                            <TrendingUp className="w-3 h-3 text-green-500 mr-1" />
                            <span className="text-green-600 font-medium">+{stats?.sermons_this_month || 0}</span> this month
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-md hover:shadow-lg transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500 uppercase tracking-wider">Upcoming Events</CardTitle>
                        <Calendar className="w-4 h-4 text-[#f5bb00]" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-[#140152]">{stats?.upcoming_events || 0}</div>
                        <p className="text-xs text-gray-500 mt-1">
                            {stats?.next_event_title ? (
                                <>Next: {stats.next_event_title}</>
                            ) : (
                                'No upcoming events'
                            )}
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-md hover:shadow-lg transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500 uppercase tracking-wider">Active Users</CardTitle>
                        <Users className="w-4 h-4 text-[#f5bb00]" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-[#140152]">{stats?.active_users || 0}</div>
                        <p className="text-xs text-gray-500 mt-1 flex items-center">
                            <TrendingUp className="w-3 h-3 text-green-500 mr-1" />
                            <span className="text-green-600 font-medium">+{stats?.new_users_this_month || 0}</span> this month
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-md hover:shadow-lg transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500 uppercase tracking-wider">Pending</CardTitle>
                        <Activity className="w-4 h-4 text-[#f5bb00]" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-[#140152]">{stats?.pending_requests || 0}</div>
                        <p className="text-xs text-gray-500 mt-1">Service requests</p>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Activity / Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card className="border-none shadow-md">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-[#140152]">Recent Activity</CardTitle>
                        <Clock className="w-4 h-4 text-gray-400" />
                    </CardHeader>
                    <CardContent>
                        {activities.length === 0 ? (
                            <p className="text-center text-gray-400 py-8">No recent activity</p>
                        ) : (
                            <div className="space-y-4">
                                {activities.map((activity, i) => (
                                    <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm">
                                                {getActivityIcon(activity.type)}
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-[#140152]">{activity.title}</p>
                                                <p className="text-xs text-gray-500">{activity.description}</p>
                                            </div>
                                        </div>
                                        <span className="text-xs text-gray-400">{formatTimeAgo(activity.timestamp)}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card className="border-none shadow-md bg-gradient-to-br from-[#140152] to-[#1e0275] text-white">
                    <CardHeader>
                        <CardTitle className="text-white">Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-4">
                        <Link href="/admin/sermons" className="p-4 bg-white/10 hover:bg-white/20 rounded-xl transition-colors text-left group">
                            <Video className="w-6 h-6 mb-2 text-[#f5bb00]" />
                            <span className="block font-bold">Add Sermon</span>
                            <span className="text-xs text-white/60 group-hover:text-white/80">Upload or link content</span>
                        </Link>
                        <Link href="/admin/events" className="p-4 bg-white/10 hover:bg-white/20 rounded-xl transition-colors text-left group">
                            <Calendar className="w-6 h-6 mb-2 text-[#f5bb00]" />
                            <span className="block font-bold">Create Event</span>
                            <span className="text-xs text-white/60 group-hover:text-white/80">Schedule new event</span>
                        </Link>
                        <Link href="/admin/announcements" className="p-4 bg-white/10 hover:bg-white/20 rounded-xl transition-colors text-left group">
                            <Megaphone className="w-6 h-6 mb-2 text-[#f5bb00]" />
                            <span className="block font-bold">Announcement</span>
                            <span className="text-xs text-white/60 group-hover:text-white/80">Notify members</span>
                        </Link>
                        <Link href="/admin/users" className="p-4 bg-white/10 hover:bg-white/20 rounded-xl transition-colors text-left group">
                            <Users className="w-6 h-6 mb-2 text-[#f5bb00]" />
                            <span className="block font-bold">Manage Users</span>
                            <span className="text-xs text-white/60 group-hover:text-white/80">{stats?.total_users || 0} total users</span>
                        </Link>
                        <Link href="/admin/nominations" className="p-4 bg-white/10 hover:bg-white/20 rounded-xl transition-colors text-left group">
                            <Crown className="w-6 h-6 mb-2 text-[#f5bb00]" />
                            <span className="block font-bold">Nominations</span>
                            <span className="text-xs text-white/60 group-hover:text-white/80">Assign leaders</span>
                        </Link>
                    </CardContent>
                </Card>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Link href="/admin/sermons">
                    <Card className="border-none shadow-md hover:shadow-lg transition-all cursor-pointer group">
                        <CardContent className="p-6 flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Sermons</p>
                                <p className="text-2xl font-bold text-[#140152]">{stats?.total_sermons || 0}</p>
                            </div>
                            <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-[#f5bb00] transition-colors" />
                        </CardContent>
                    </Card>
                </Link>
                <Link href="/admin/events">
                    <Card className="border-none shadow-md hover:shadow-lg transition-all cursor-pointer group">
                        <CardContent className="p-6 flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Events</p>
                                <p className="text-2xl font-bold text-[#140152]">{stats?.total_events || 0}</p>
                            </div>
                            <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-[#f5bb00] transition-colors" />
                        </CardContent>
                    </Card>
                </Link>
                <Link href="/admin/announcements">
                    <Card className="border-none shadow-md hover:shadow-lg transition-all cursor-pointer group">
                        <CardContent className="p-6 flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Active Announcements</p>
                                <p className="text-2xl font-bold text-[#140152]">{stats?.total_announcements || 0}</p>
                            </div>
                            <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-[#f5bb00] transition-colors" />
                        </CardContent>
                    </Card>
                </Link>
            </div>

            {/* Pending Ministry Approvals */}
            {(pendingYouth.length > 0 || pendingChildren.length > 0) && (
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <AlertTriangle className="w-5 h-5 text-amber-500" />
                        <h2 className="text-2xl font-bold text-[#140152]">Pending Ministry Approvals</h2>
                        <span className="bg-amber-100 text-amber-800 text-xs font-black px-2.5 py-1 rounded-full">
                            {pendingYouth.length + pendingChildren.length} waiting
                        </span>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Youth Pending */}
                        {pendingYouth.length > 0 && (
                            <Card className="border-none shadow-md border-t-4 border-t-amber-500">
                                <CardHeader className="pb-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                                                <Zap className="w-4 h-4 text-amber-600" />
                                            </div>
                                            <CardTitle className="text-base text-[#140152]">Youth Ministry</CardTitle>
                                        </div>
                                        <span className="text-xs bg-amber-100 text-amber-700 font-bold px-2 py-0.5 rounded-full">{pendingYouth.length} pending</span>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {pendingYouth.map(member => (
                                        <div key={member.user_id} className="flex items-center justify-between bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
                                            <div className="min-w-0 flex-1">
                                                <p className="text-sm font-bold text-[#140152] truncate">{member.name}</p>
                                                <p className="text-xs text-gray-500 truncate">{member.email}</p>
                                            </div>
                                            <div className="flex items-center gap-2 ml-3 shrink-0">
                                                <Button
                                                    size="sm"
                                                    disabled={!!approvingId}
                                                    onClick={() => approveMember('youth', member)}
                                                    className="bg-green-600 hover:bg-green-700 text-white text-xs px-3 h-8"
                                                >
                                                    {approvingId === member.user_id ? <Loader2 className="w-3 h-3 animate-spin" /> : <><CheckCircle className="w-3 h-3 mr-1" />Approve</>}
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    disabled={!!approvingId}
                                                    onClick={() => declineMember('youth', member)}
                                                    className="border-red-200 text-red-600 hover:bg-red-50 text-xs px-3 h-8"
                                                >
                                                    {approvingId === member.user_id + '-decline' ? <Loader2 className="w-3 h-3 animate-spin" /> : <><XCircle className="w-3 h-3 mr-1" />Decline</>}
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                    <Link href="/youth/coordinator" className="flex items-center gap-1 text-xs text-amber-600 hover:underline font-medium pt-1">
                                        View all in Youth Leader Dashboard <ArrowRight className="w-3 h-3" />
                                    </Link>
                                </CardContent>
                            </Card>
                        )}

                        {/* Children Pending */}
                        {pendingChildren.length > 0 && (
                            <Card className="border-none shadow-md border-t-4 border-t-violet-500">
                                <CardHeader className="pb-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center">
                                                <Baby className="w-4 h-4 text-violet-600" />
                                            </div>
                                            <CardTitle className="text-base text-[#140152]">Children Ministry</CardTitle>
                                        </div>
                                        <span className="text-xs bg-violet-100 text-violet-700 font-bold px-2 py-0.5 rounded-full">{pendingChildren.length} pending</span>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {pendingChildren.map(member => (
                                        <div key={member.user_id} className="flex items-center justify-between bg-violet-50 border border-violet-100 rounded-xl px-4 py-3">
                                            <div className="min-w-0 flex-1">
                                                <p className="text-sm font-bold text-[#140152] truncate">{member.name}</p>
                                                <p className="text-xs text-gray-500 truncate">{member.email}</p>
                                            </div>
                                            <div className="flex items-center gap-2 ml-3 shrink-0">
                                                <Button
                                                    size="sm"
                                                    disabled={!!approvingId}
                                                    onClick={() => approveMember('children', member)}
                                                    className="bg-green-600 hover:bg-green-700 text-white text-xs px-3 h-8"
                                                >
                                                    {approvingId === member.user_id ? <Loader2 className="w-3 h-3 animate-spin" /> : <><CheckCircle className="w-3 h-3 mr-1" />Approve</>}
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    disabled={!!approvingId}
                                                    onClick={() => declineMember('children', member)}
                                                    className="border-red-200 text-red-600 hover:bg-red-50 text-xs px-3 h-8"
                                                >
                                                    {approvingId === member.user_id + '-decline' ? <Loader2 className="w-3 h-3 animate-spin" /> : <><XCircle className="w-3 h-3 mr-1" />Decline</>}
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                    <Link href="/children/coordinator" className="flex items-center gap-1 text-xs text-violet-600 hover:underline font-medium pt-1">
                                        View all in Coordinator Dashboard <ArrowRight className="w-3 h-3" />
                                    </Link>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            )}

            {/* Ministry Departments */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-[#140152]">Ministry Departments</h2>
                    <Link href="/admin/nominations" className="text-sm text-[#140152] hover:underline flex items-center gap-1 font-medium">
                        <Crown className="w-4 h-4 text-amber-500" /> Manage Nominations
                    </Link>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                    {/* Choir (Alter Sound) */}
                    <Card className="border-none shadow-md hover:shadow-lg transition-all group border-t-4 border-t-indigo-500">
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
                                        <Music className="w-5 h-5 text-indigo-600" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-base text-[#140152]">Choir</CardTitle>
                                        <p className="text-xs text-gray-400">Alter Sound</p>
                                    </div>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-1.5">
                            <Link href="/services/alter-sound/choirmaster" className="flex items-center justify-between p-2.5 hover:bg-indigo-50 rounded-xl transition-colors group/link">
                                <div>
                                    <p className="text-sm font-medium text-gray-700">Choirmaster Dashboard</p>
                                    <p className="text-xs text-gray-400">Members, attendance, notices</p>
                                </div>
                                <ArrowRight className="w-4 h-4 text-gray-300 group-hover/link:text-indigo-500 transition-colors" />
                            </Link>
                            <Link href="/admin/alter-sound/tracks" className="flex items-center justify-between p-2.5 hover:bg-indigo-50 rounded-xl transition-colors group/link">
                                <div>
                                    <p className="text-sm font-medium text-gray-700">Manage Tracks</p>
                                    <p className="text-xs text-gray-400">Upload choir audio</p>
                                </div>
                                <ArrowRight className="w-4 h-4 text-gray-300 group-hover/link:text-indigo-500 transition-colors" />
                            </Link>
                            <Link href="/admin/nominations" className="flex items-center justify-between p-2.5 hover:bg-indigo-50 rounded-xl transition-colors group/link">
                                <div>
                                    <p className="text-sm font-medium text-gray-700">Assign Choirmaster</p>
                                    <p className="text-xs text-gray-400">Admin-only nomination</p>
                                </div>
                                <Crown className="w-4 h-4 text-gray-300 group-hover/link:text-amber-500 transition-colors" />
                            </Link>
                        </CardContent>
                    </Card>

                    {/* Youth Ministry */}
                    <Card className="border-none shadow-md hover:shadow-lg transition-all group border-t-4 border-t-amber-500">
                        <CardHeader className="pb-3">
                            <div className="flex items-center gap-2">
                                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                                    <Zap className="w-5 h-5 text-amber-600" />
                                </div>
                                <div>
                                    <CardTitle className="text-base text-[#140152]">Youth Ministry</CardTitle>
                                    <p className="text-xs text-gray-400">Leader &amp; member access</p>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-1.5">
                            <Link href="/youth/coordinator" className="flex items-center justify-between p-2.5 hover:bg-amber-50 rounded-xl transition-colors group/link">
                                <div>
                                    <p className="text-sm font-medium text-gray-700">Youth Leader Dashboard</p>
                                    <p className="text-xs text-gray-400">Members, activities, attendance</p>
                                </div>
                                <ArrowRight className="w-4 h-4 text-gray-300 group-hover/link:text-amber-500 transition-colors" />
                            </Link>
                            <Link href="/youth/dashboard" className="flex items-center justify-between p-2.5 hover:bg-amber-50 rounded-xl transition-colors group/link">
                                <div>
                                    <p className="text-sm font-medium text-gray-700">Member Dashboard</p>
                                    <p className="text-xs text-gray-400">View as a youth member</p>
                                </div>
                                <ArrowRight className="w-4 h-4 text-gray-300 group-hover/link:text-amber-500 transition-colors" />
                            </Link>
                            <Link href="/admin/nominations" className="flex items-center justify-between p-2.5 hover:bg-amber-50 rounded-xl transition-colors group/link">
                                <div>
                                    <p className="text-sm font-medium text-gray-700">Assign Youth Leader</p>
                                    <p className="text-xs text-gray-400">Admin-only nomination</p>
                                </div>
                                <Crown className="w-4 h-4 text-gray-300 group-hover/link:text-amber-500 transition-colors" />
                            </Link>
                        </CardContent>
                    </Card>

                    {/* Children Ministry */}
                    <Card className="border-none shadow-md hover:shadow-lg transition-all group border-t-4 border-t-violet-500">
                        <CardHeader className="pb-3">
                            <div className="flex items-center gap-2">
                                <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
                                    <Baby className="w-5 h-5 text-violet-600" />
                                </div>
                                <div>
                                    <CardTitle className="text-base text-[#140152]">Children Ministry</CardTitle>
                                    <p className="text-xs text-gray-400">Coordinator &amp; member access</p>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-1.5">
                            <Link href="/children/coordinator" className="flex items-center justify-between p-2.5 hover:bg-violet-50 rounded-xl transition-colors group/link">
                                <div>
                                    <p className="text-sm font-medium text-gray-700">Coordinator Dashboard</p>
                                    <p className="text-xs text-gray-400">Members, activities, attendance</p>
                                </div>
                                <ArrowRight className="w-4 h-4 text-gray-300 group-hover/link:text-violet-500 transition-colors" />
                            </Link>
                            <Link href="/children/dashboard" className="flex items-center justify-between p-2.5 hover:bg-violet-50 rounded-xl transition-colors group/link">
                                <div>
                                    <p className="text-sm font-medium text-gray-700">Member Dashboard</p>
                                    <p className="text-xs text-gray-400">View as a children member</p>
                                </div>
                                <ArrowRight className="w-4 h-4 text-gray-300 group-hover/link:text-violet-500 transition-colors" />
                            </Link>
                            <Link href="/admin/nominations" className="flex items-center justify-between p-2.5 hover:bg-violet-50 rounded-xl transition-colors group/link">
                                <div>
                                    <p className="text-sm font-medium text-gray-700">Assign Coordinator</p>
                                    <p className="text-xs text-gray-400">Admin-only nomination</p>
                                </div>
                                <Crown className="w-4 h-4 text-gray-300 group-hover/link:text-violet-500 transition-colors" />
                            </Link>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Services Management Section */}
            <div className="space-y-4">
                <h2 className="text-2xl font-bold text-[#140152]">Services Management</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Bible Study */}
                    <Card className="border-none shadow-md hover:shadow-lg transition-all group">
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <BookOpen className="w-8 h-8 text-[#140152]" />
                                <Settings className="w-4 h-4 text-gray-400" />
                            </div>
                            <CardTitle className="text-lg text-[#140152] mt-2">Bible Study</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <Link href="/admin/bible-study/plans" className="block p-2 hover:bg-gray-50 rounded-lg transition-colors">
                                <p className="text-sm font-medium text-gray-700">Reading Plans</p>
                                <p className="text-xs text-gray-500">Manage reading plans</p>
                            </Link>
                            <Link href="/admin/bible-study/readings" className="block p-2 hover:bg-gray-50 rounded-lg transition-colors">
                                <p className="text-sm font-medium text-gray-700">Daily Readings</p>
                                <p className="text-xs text-gray-500">Add daily readings</p>
                            </Link>
                            <Link href="/admin/bible-study/resources" className="block p-2 hover:bg-gray-50 rounded-lg transition-colors">
                                <p className="text-sm font-medium text-gray-700">Resources</p>
                                <p className="text-xs text-gray-500">Study materials</p>
                            </Link>
                            <Link href="/admin/bible-study/settings" className="block p-2 hover:bg-gray-50 rounded-lg transition-colors">
                                <p className="text-sm font-medium text-gray-700">Settings</p>
                                <p className="text-xs text-gray-500">Page configuration</p>
                            </Link>
                        </CardContent>
                    </Card>

                    {/* Alter Sound */}
                    <Card className="border-none shadow-md hover:shadow-lg transition-all group">
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <Music className="w-8 h-8 text-[#140152]" />
                                <Settings className="w-4 h-4 text-gray-400" />
                            </div>
                            <CardTitle className="text-lg text-[#140152] mt-2">Alter Sound</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <Link href="/admin/alter-sound/categories" className="block p-2 hover:bg-gray-50 rounded-lg transition-colors">
                                <p className="text-sm font-medium text-gray-700">Categories</p>
                                <p className="text-xs text-gray-500">Manage categories</p>
                            </Link>
                            <Link href="/admin/alter-sound/tracks" className="block p-2 hover:bg-gray-50 rounded-lg transition-colors">
                                <p className="text-sm font-medium text-gray-700">Tracks</p>
                                <p className="text-xs text-gray-500">Upload audio tracks</p>
                            </Link>
                            <Link href="/admin/alter-sound/settings" className="block p-2 hover:bg-gray-50 rounded-lg transition-colors">
                                <p className="text-sm font-medium text-gray-700">Settings</p>
                                <p className="text-xs text-gray-500">Page configuration</p>
                            </Link>
                        </CardContent>
                    </Card>

                    {/* Prayer */}
                    <Card className="border-none shadow-md hover:shadow-lg transition-all group">
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <HandHeart className="w-8 h-8 text-[#140152]" />
                                <Settings className="w-4 h-4 text-gray-400" />
                            </div>
                            <CardTitle className="text-lg text-[#140152] mt-2">Prayer</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <Link href="/admin/prayer/categories" className="block p-2 hover:bg-gray-50 rounded-lg transition-colors">
                                <p className="text-sm font-medium text-gray-700">Categories</p>
                                <p className="text-xs text-gray-500">Prayer categories</p>
                            </Link>
                            <Link href="/admin/prayer/schedules" className="block p-2 hover:bg-gray-50 rounded-lg transition-colors">
                                <p className="text-sm font-medium text-gray-700">Schedules</p>
                                <p className="text-xs text-gray-500">Prayer schedules</p>
                            </Link>
                            <Link href="/admin/prayer/requests" className="block p-2 hover:bg-gray-50 rounded-lg transition-colors">
                                <p className="text-sm font-medium text-gray-700">Requests</p>
                                <p className="text-xs text-gray-500">Prayer requests</p>
                            </Link>
                            <Link href="/admin/prayer/settings" className="block p-2 hover:bg-gray-50 rounded-lg transition-colors">
                                <p className="text-sm font-medium text-gray-700">Settings</p>
                                <p className="text-xs text-gray-500">Page configuration</p>
                            </Link>
                        </CardContent>
                    </Card>

                    {/* Career */}
                    <Card className="border-none shadow-md hover:shadow-lg transition-all group">
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <Briefcase className="w-8 h-8 text-[#140152]" />
                                <Settings className="w-4 h-4 text-gray-400" />
                            </div>
                            <CardTitle className="text-lg text-[#140152] mt-2">Career</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <Link href="/admin/career" className="block p-2 hover:bg-gray-50 rounded-lg transition-colors">
                                <p className="text-sm font-medium text-gray-700">Modules</p>
                                <p className="text-xs text-gray-500">Career modules</p>
                            </Link>
                            <Link href="/admin/career/sessions" className="block p-2 hover:bg-gray-50 rounded-lg transition-colors">
                                <p className="text-sm font-medium text-gray-700">Sessions</p>
                                <p className="text-xs text-gray-500">Manage sessions</p>
                            </Link>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
