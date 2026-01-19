'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import {
    LogOut,
    Bell,
    Menu,
    X,
    Home,
    ChevronLeft,
    Loader2,
    Settings,
    User,
    ChevronDown,
    Shield
} from 'lucide-react'
import { tokenManager, notificationApi, Notification, authApi } from '@/lib/api'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

export default function DashboardNavbar() {
    const router = useRouter()
    const pathname = usePathname()
    const [userName, setUserName] = useState('')
    const [userEmail, setUserEmail] = useState('')
    const [userRole, setUserRole] = useState('')
    const [unreadCount, setUnreadCount] = useState(0)
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

    // Notification state
    const [showNotifications, setShowNotifications] = useState(false)
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [notificationsLoading, setNotificationsLoading] = useState(false)

    // Profile Dropdown state
    const [showProfileMenu, setShowProfileMenu] = useState(false)

    // Refs for clicking outside
    const notificationRef = useRef<HTMLDivElement>(null)
    const profileRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const init = async () => {
            try {
                // Get user info from API to ensure we have role and email
                const user = await authApi.getCurrentUser()
                setUserName(user.name)
                setUserEmail(user.email)
                setUserRole(user.role || 'user')
                localStorage.setItem('userName', user.name)

                const countData = await notificationApi.getUnreadCount()
                setUnreadCount(countData.unread_count)
            } catch (err) {
                console.error('Failed to load user data', err)
                // Fallback to local storage if API fails
                setUserName(localStorage.getItem('userName') || 'User')
            }
        }
        init()

        // Click outside handler
        const handleClickOutside = (event: MouseEvent) => {
            if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
                setShowNotifications(false)
            }
            if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
                setShowProfileMenu(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
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
            setShowProfileMenu(false)
        }
        setShowNotifications(!showNotifications)
    }

    const toggleProfileMenu = () => {
        if (!showProfileMenu) {
            setShowNotifications(false)
        }
        setShowProfileMenu(!showProfileMenu)
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
        if (pathname?.includes('settings')) return 'Settings'
        return 'Dashboard'
    }

    const isOnMainDashboard = pathname === '/dashboard' || pathname === '/admin'

    return (
        <header className="bg-white/80 backdrop-blur-xl border-b border-gray-100 sticky top-0 z-50 transition-all duration-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Left Section */}
                    <div className="flex items-center gap-4">
                        {/* Logo */}
                        <Link href={userRole === 'admin' ? '/admin' : '/dashboard'} className="flex items-center gap-3 group">
                            <motion.div
                                whileHover={{ scale: 1.05 }}
                                className="w-10 h-10 flex items-center justify-center bg-gradient-to-br from-[#140152] to-[#1d0175] rounded-xl shadow-lg shadow-indigo-900/20"
                            >
                                <img src="/LETWlogo.png" alt="LETW" className="w-full h-full object-cover rounded-xl" />
                            </motion.div>
                            <span className="font-black text-sm text-[#140152] hidden sm:block tracking-tight">
                                LETW <span className="text-[#f5bb00] font-normal">PORTAL</span>
                            </span>
                        </Link>

                        {/* Breadcrumb / Section indicator */}
                        {!isOnMainDashboard && (
                            <div className="hidden sm:flex items-center gap-2 text-gray-400">
                                <span className="text-gray-300">/</span>
                                <span className="text-[#140152] font-medium px-3 py-1 bg-[#140152]/5 rounded-full text-xs">
                                    {getCurrentSection()}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Center - Back to Dashboard (when not on main dashboard) */}
                    {!isOnMainDashboard && (
                        <Link
                            href={userRole === 'admin' ? '/admin' : '/dashboard'}
                            className="hidden md:flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 hover:text-[#140152] hover:bg-gray-50 rounded-full transition-all group"
                        >
                            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                            Back to Dashboard
                        </Link>
                    )}

                    {/* Right Section */}
                    <div className="flex items-center gap-2">
                        {/* Notification Bell with Dropdown */}
                        <div className="relative" ref={notificationRef}>
                            <motion.button
                                whileTap={{ scale: 0.95 }}
                                onClick={toggleNotifications}
                                className={cn(
                                    "relative p-2.5 rounded-full transition-all duration-200 outline-none",
                                    showNotifications ? "bg-[#140152]/10 text-[#140152]" : "text-gray-500 hover:text-[#140152] hover:bg-gray-50"
                                )}
                            >
                                <Bell className="w-5 h-5" />
                                {unreadCount > 0 && (
                                    <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full"></span>
                                )}
                            </motion.button>

                            {/* Notifications Dropdown */}
                            <AnimatePresence>
                                {showNotifications && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                        transition={{ duration: 0.2 }}
                                        className="absolute right-0 mt-3 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50 origin-top-right"
                                    >
                                        <div className="p-4 border-b border-gray-50 flex items-center justify-between bg-gray-50/50 backdrop-blur-sm">
                                            <h3 className="font-bold text-[#140152]">Notifications</h3>
                                            <div className="flex items-center gap-2">
                                                {unreadCount > 0 && (
                                                    <button
                                                        onClick={markAllAsRead}
                                                        className="text-xs font-medium text-[#140152] hover:text-[#f5bb00] transition-colors"
                                                    >
                                                        Mark all read
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => setShowNotifications(false)}
                                                    className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
                                            {notificationsLoading ? (
                                                <div className="p-12 text-center">
                                                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#140152]/30" />
                                                </div>
                                            ) : notifications.length === 0 ? (
                                                <div className="p-12 text-center flex flex-col items-center">
                                                    <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                                                        <Bell className="w-6 h-6 text-gray-300" />
                                                    </div>
                                                    <p className="text-gray-500 text-sm">No notifications yet</p>
                                                </div>
                                            ) : (
                                                notifications.map((notification) => (
                                                    <div
                                                        key={notification.id}
                                                        onClick={() => !notification.is_read && markAsRead(notification.id)}
                                                        className={cn(
                                                            "p-4 border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-all",
                                                            !notification.is_read ? "bg-blue-50/30" : ""
                                                        )}
                                                    >
                                                        <div className="flex items-start gap-3">
                                                            <div className={cn(
                                                                "w-2 h-2 rounded-full mt-2 flex-shrink-0 shadow-sm",
                                                                notification.type === 'service_approved' ? 'bg-green-500 shadow-green-200' :
                                                                    notification.type === 'service_rejected' ? 'bg-red-500 shadow-red-200' :
                                                                        'bg-blue-500 shadow-blue-200'
                                                            )} />
                                                            <div className="flex-1 min-w-0">
                                                                <p className="font-semibold text-sm text-[#140152]">
                                                                    {notification.title}
                                                                </p>
                                                                <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">
                                                                    {notification.message}
                                                                </p>
                                                                <p className="text-[10px] text-gray-400 mt-2 font-medium">
                                                                    {formatTimeAgo(notification.created_at)}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* User Profile Dropdown */}
                        <div className="relative pl-2" ref={profileRef}>
                            <motion.button
                                whileTap={{ scale: 0.95 }}
                                onClick={toggleProfileMenu}
                                className={cn(
                                    "hidden sm:flex items-center gap-3 p-1 pr-3 rounded-full border transition-all duration-200",
                                    showProfileMenu
                                        ? "bg-[#140152] border-[#140152]"
                                        : "bg-white border-gray-100 hover:border-gray-200 hover:shadow-sm"
                                )}
                            >
                                <div className={cn(
                                    "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors",
                                    showProfileMenu ? "bg-white/10 text-white" : "bg-[#140152] text-white"
                                )}>
                                    {userName.charAt(0).toUpperCase()}
                                </div>
                                <span className={cn(
                                    "text-sm font-medium transition-colors max-w-[100px] truncate",
                                    showProfileMenu ? "text-white" : "text-[#140152]"
                                )}>
                                    {userName}
                                </span>
                                <ChevronDown className={cn(
                                    "w-4 h-4 transition-transform duration-200",
                                    showProfileMenu ? "text-white/70 rotate-180" : "text-gray-400"
                                )} />
                            </motion.button>

                            <AnimatePresence>
                                {showProfileMenu && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                        transition={{ duration: 0.2 }}
                                        className="absolute right-0 mt-3 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50 origin-top-right ring-1 ring-black/5"
                                    >
                                        <div className="p-4 bg-gray-50/50 border-b border-gray-50">
                                            <p className="text-sm font-bold text-[#140152] truncate">{userName}</p>
                                            <p className="text-xs text-gray-500 truncate">{userEmail}</p>
                                            {userRole === 'admin' && (
                                                <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#f5bb00]/10 text-[#bf8c00] text-[10px] font-bold uppercase tracking-wider">
                                                    <Shield className="w-3 h-3" />
                                                    Administrator
                                                </div>
                                            )}
                                        </div>

                                        <div className="p-2 space-y-1">
                                            <Link
                                                href={userRole === 'admin' ? '/admin/settings' : '/dashboard/settings'}
                                                onClick={() => setShowProfileMenu(false)}
                                                className="flex items-center gap-3 w-full px-3 py-2.5 text-sm text-gray-600 hover:text-[#140152] hover:bg-gray-50 rounded-xl transition-colors group"
                                            >
                                                <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-500 group-hover:bg-[#140152]/10 group-hover:text-[#140152] transition-colors">
                                                    <Settings className="w-4 h-4" />
                                                </div>
                                                <span className="font-medium">Settings</span>
                                            </Link>

                                            <Link
                                                href={userRole === 'admin' ? '/admin/settings' : '/dashboard/settings'}
                                                onClick={() => setShowProfileMenu(false)}
                                                className="flex items-center gap-3 w-full px-3 py-2.5 text-sm text-gray-600 hover:text-[#140152] hover:bg-gray-50 rounded-xl transition-colors group"
                                            >
                                                <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-500 group-hover:bg-[#140152]/10 group-hover:text-[#140152] transition-colors">
                                                    <User className="w-4 h-4" />
                                                </div>
                                                <span className="font-medium">Profile</span>
                                            </Link>
                                        </div>

                                        <div className="p-2 border-t border-gray-50">
                                            <button
                                                onClick={handleLogout}
                                                className="flex items-center gap-3 w-full px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-xl transition-colors group"
                                            >
                                                <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center text-red-500 group-hover:bg-red-100 transition-colors">
                                                    <LogOut className="w-4 h-4" />
                                                </div>
                                                <span className="font-medium">Sign Out</span>
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Mobile Menu Toggle */}
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="sm:hidden p-2 text-gray-500 hover:text-[#140152] hover:bg-gray-50 rounded-full transition-colors"
                        >
                            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="sm:hidden bg-white border-t border-gray-100 overflow-hidden"
                    >
                        <div className="p-4 space-y-2">
                            <div className="p-4 bg-gray-50 rounded-2xl mb-4 flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-[#140152] flex items-center justify-center text-white font-bold text-lg">
                                    {userName.charAt(0).toUpperCase()}
                                </div>
                                <div className="overflow-hidden">
                                    <p className="font-bold text-[#140152] truncate">{userName}</p>
                                    <p className="text-xs text-gray-500 truncate">{userEmail}</p>
                                </div>
                            </div>

                            <Link
                                href={userRole === 'admin' ? '/admin' : '/dashboard'}
                                onClick={() => setMobileMenuOpen(false)}
                                className="flex items-center gap-3 p-3 text-gray-600 hover:bg-gray-50 rounded-xl transition-colors"
                            >
                                <Home className="w-5 h-5" />
                                <span className="font-medium">Dashboard</span>
                            </Link>

                            <Link
                                href={userRole === 'admin' ? '/admin/settings' : '/dashboard/settings'}
                                onClick={() => setMobileMenuOpen(false)}
                                className="flex items-center gap-3 p-3 text-gray-600 hover:bg-gray-50 rounded-xl transition-colors"
                            >
                                <Settings className="w-5 h-5" />
                                <span className="font-medium">Settings</span>
                            </Link>

                            <div className="h-px bg-gray-100 my-2" />

                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center gap-3 p-3 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                            >
                                <LogOut className="w-5 h-5" />
                                <span className="font-medium">Sign Out</span>
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </header>
    )
}
