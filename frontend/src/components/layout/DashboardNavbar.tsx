'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { LogOut, Bell, Menu, X, Home, ChevronLeft, Loader2 } from 'lucide-react'
import { tokenManager, notificationApi, Notification } from '@/lib/api'

export default function DashboardNavbar() {
    const router = useRouter()
    const pathname = usePathname()
    const [userName, setUserName] = useState('')
    const [unreadCount, setUnreadCount] = useState(0)
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

    // Notification state
    const [showNotifications, setShowNotifications] = useState(false)
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [notificationsLoading, setNotificationsLoading] = useState(false)

    useEffect(() => {
        const init = async () => {
            const name = localStorage.getItem('userName') || 'User'
            setUserName(name)

            try {
                const countData = await notificationApi.getUnreadCount()
                setUnreadCount(countData.unread_count)
            } catch (err) {
                console.error('Failed to load notifications count', err)
            }
        }
        init()
    }, [])

    const handleLogout = () => {
        tokenManager.clearTokens()
        router.push('/')
    }

    const loadNotifications = async () => {
        setNotificationsLoading(true)
        try {
            const data = await notificationApi.getNotifications(10, 0)
            setNotifications(data.notifications)
            setUnreadCount(data.unread_count)
        } catch (err) {
            console.error('Failed to load notifications', err)
        } finally {
            setNotificationsLoading(false)
        }
    }

    const toggleNotifications = async () => {
        if (!showNotifications) {
            await loadNotifications()
        }
        setShowNotifications(!showNotifications)
    }

    const markAsRead = async (notificationId: string) => {
        try {
            await notificationApi.markAsRead(notificationId)
            setNotifications(prev =>
                prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
            )
            setUnreadCount(prev => Math.max(0, prev - 1))
        } catch (err) {
            console.error('Failed to mark notification as read', err)
        }
    }

    const markAllAsRead = async () => {
        try {
            await notificationApi.markAllAsRead()
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
            setUnreadCount(0)
        } catch (err) {
            console.error('Failed to mark all notifications as read', err)
        }
    }

    const formatTimeAgo = (dateString: string) => {
        const date = new Date(dateString)
        const now = new Date()
        const diffMs = now.getTime() - date.getTime()
        const diffMins = Math.floor(diffMs / 60000)
        const diffHours = Math.floor(diffMins / 60)
        const diffDays = Math.floor(diffHours / 24)

        if (diffMins < 1) return 'Just now'
        if (diffMins < 60) return `${diffMins}m ago`
        if (diffHours < 24) return `${diffHours}h ago`
        return `${diffDays}d ago`
    }

    // Determine current section based on pathname
    const getCurrentSection = () => {
        if (pathname?.includes('career-guidance')) return 'Career Guidance'
        if (pathname?.includes('skill-development')) return 'Skill Development'
        if (pathname?.includes('leadership')) return 'Leadership'
        if (pathname?.includes('bible-reading')) return 'Bible Study'
        if (pathname?.includes('prayer')) return 'Prayer'
        if (pathname?.includes('evangelism')) return 'Evangelism'
        if (pathname?.includes('counselling')) return 'Counselling'
        if (pathname?.includes('education')) return 'Education'
        return 'Dashboard'
    }

    const isOnMainDashboard = pathname === '/dashboard'

    return (
        <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Left Section */}
                    <div className="flex items-center gap-4">
                        {/* Logo */}
                        <Link href="/dashboard" className="flex items-center gap-3 group">
                            <div className="w-10 h-10 flex items-center justify-center">
                                <img src="/LETWlogo.png" alt="LETW" className="w-full h-full object-cover" />
                            </div>
                            <span className="font-black text-sm text-[#140152] hidden sm:block">
                                LETW
                            </span>
                        </Link>

                        {/* Breadcrumb / Section indicator */}
                        {!isOnMainDashboard && (
                            <div className="hidden sm:flex items-center gap-2 text-gray-400">
                                <span>/</span>
                                <span className="text-[#140152] font-medium">{getCurrentSection()}</span>
                            </div>
                        )}
                    </div>

                    {/* Center - Back to Dashboard (when not on main dashboard) */}
                    {!isOnMainDashboard && (
                        <Link
                            href="/dashboard"
                            className="hidden md:flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 hover:text-[#140152] hover:bg-gray-50 rounded-full transition-colors"
                        >
                            <ChevronLeft className="w-4 h-4" />
                            Back to Dashboard
                        </Link>
                    )}

                    {/* Right Section */}
                    <div className="flex items-center gap-3">
                        {/* Notification Bell with Dropdown */}
                        <div className="relative">
                            <button
                                onClick={toggleNotifications}
                                className="relative p-2 text-gray-500 hover:text-[#140152] hover:bg-gray-50 rounded-full transition-colors"
                            >
                                <Bell className="w-5 h-5" />
                                {unreadCount > 0 && (
                                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                                        {unreadCount > 9 ? '9+' : unreadCount}
                                    </span>
                                )}
                            </button>

                            {/* Notifications Dropdown */}
                            {showNotifications && (
                                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-50">
                                    <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                                        <h3 className="font-bold text-[#140152]">Notifications</h3>
                                        <div className="flex items-center gap-2">
                                            {unreadCount > 0 && (
                                                <button
                                                    onClick={markAllAsRead}
                                                    className="text-xs text-[#140152] hover:underline"
                                                >
                                                    Mark all read
                                                </button>
                                            )}
                                            <button
                                                onClick={() => setShowNotifications(false)}
                                                className="text-gray-400 hover:text-gray-600"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="max-h-80 overflow-y-auto">
                                        {notificationsLoading ? (
                                            <div className="p-8 text-center">
                                                <Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-400" />
                                            </div>
                                        ) : notifications.length === 0 ? (
                                            <div className="p-8 text-center text-gray-500 text-sm">
                                                No notifications yet
                                            </div>
                                        ) : (
                                            notifications.map((notification) => (
                                                <div
                                                    key={notification.id}
                                                    onClick={() => !notification.is_read && markAsRead(notification.id)}
                                                    className={`p-4 border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors ${!notification.is_read ? 'bg-blue-50/50' : ''}`}
                                                >
                                                    <div className="flex items-start gap-3">
                                                        <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${notification.type === 'service_approved' ? 'bg-green-500' :
                                                                notification.type === 'service_rejected' ? 'bg-red-500' :
                                                                    'bg-blue-500'
                                                            }`} />
                                                        <div className="flex-1 min-w-0">
                                                            <p className="font-medium text-sm text-[#140152]">
                                                                {notification.title}
                                                            </p>
                                                            <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                                                                {notification.message}
                                                            </p>
                                                            <p className="text-xs text-gray-400 mt-1">
                                                                {formatTimeAgo(notification.created_at)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* User Avatar & Name */}
                        <div className="hidden sm:flex items-center gap-3 pl-3 border-l border-gray-100">
                            <div className="w-8 h-8 rounded-full bg-[#140152] flex items-center justify-center text-white font-bold text-sm">
                                {userName.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-sm font-medium text-[#140152]">{userName}</span>
                        </div>

                        {/* Logout Button */}
                        <button
                            onClick={handleLogout}
                            className="hidden sm:flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                        >
                            <LogOut className="w-4 h-4" />
                            <span className="hidden lg:inline">Logout</span>
                        </button>

                        {/* Mobile Menu Toggle */}
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="sm:hidden p-2 text-gray-500 hover:text-[#140152] hover:bg-gray-50 rounded-full transition-colors"
                        >
                            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {mobileMenuOpen && (
                <div className="sm:hidden bg-white border-t border-gray-100 py-4 px-4 space-y-2">
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl mb-4">
                        <div className="w-10 h-10 rounded-full bg-[#140152] flex items-center justify-center text-white font-bold">
                            {userName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <p className="font-semibold text-[#140152]">{userName}</p>
                            <p className="text-xs text-gray-500">Member</p>
                        </div>
                    </div>

                    <Link
                        href="/dashboard"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-3 p-3 text-gray-600 hover:bg-gray-50 rounded-xl transition-colors"
                    >
                        <Home className="w-5 h-5" />
                        <span className="font-medium">Dashboard</span>
                    </Link>

                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 p-3 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                    >
                        <LogOut className="w-5 h-5" />
                        <span className="font-medium">Logout</span>
                    </button>
                </div>
            )}
        </header>
    )
}
