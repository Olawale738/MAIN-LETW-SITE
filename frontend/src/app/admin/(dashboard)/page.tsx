'use client'
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Video, Calendar, Users, Activity, TrendingUp, Megaphone, Loader2, FileText, Clock, User, ArrowRight, BookOpen, Music, Briefcase, HandHeart, Settings } from 'lucide-react'
import { dashboardApi, DashboardStats, RecentActivity } from '@/lib/api'

export default function AdminDashboardPage() {
    const [stats, setStats] = useState<DashboardStats | null>(null)
    const [activities, setActivities] = useState<RecentActivity[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadDashboardData()
    }, [])

    const loadDashboardData = async () => {
        try {
            const [statsData, activityData] = await Promise.all([
                dashboardApi.getStats(),
                dashboardApi.getRecentActivity(5)
            ])
            setStats(statsData)
            setActivities(activityData.activities)
        } catch (err) {
            console.error('Failed to load dashboard data', err)
        } finally {
            setLoading(false)
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
