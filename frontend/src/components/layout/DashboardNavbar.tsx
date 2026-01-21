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
    Loader2,
    Settings,
    User,
    ChevronDown,
    Shield,
    ArrowLeft
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
        <header className="bg-gradient-to-r from-[#140152] via-[#1a0670] to-[#140152] backdrop-blur-xl border-b border-white/10 sticky top-0 z-50 shadow-2xl shadow-[#140152]/20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-20">
                    {/* Left Section */}
                    <div className="flex items-center gap-6">
                        {/* Logo */}
                        <Link href={userRole === 'admin' ? '/admin' : '/dashboard'} className="flex items-center gap-3 group">
                            <motion.div
                                whileHover={{ scale: 1.05, rotate: 5 }}
                                whileTap={{ scale: 0.95 }}
                                className="w-12 h-12 flex items-center justify-center bg-gradient-to-br from-[#f5bb00] to-[#d4a000] rounded-2xl shadow-xl shadow-[#f5bb00]/30 ring-2 ring-white/20"
                            >
                                <img src="/LETWlogo.png" alt="LETW" className="w-full h-full object-cover rounded-2xl" />
                            </motion.div>
                            <div className="hidden sm:block">
                                <span className="font-black text-lg text-white block tracking-tight leading-tight">
                                    LETW
                                </span>
                                <span className="text-xs text-[#f5bb00] font-semibold uppercase tracking-widest">
                                    Portal
                                </span>
                            </div>
                        </Link>

                        {/* Breadcrumb / Section indicator */}
                        {!isOnMainDashboard && (
                            <div className="hidden md:flex items-center gap-3">
                                <div className="w-px h-8 bg-white/20" />
                                <span className="text-white/90 font-semibold px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-sm border border-white/20">
                                    {getCurrentSection()}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Right Section */}
                    <div className="flex items-center gap-3">
                        {/* Back to Dashboard - Repositioned to right side */}
                        {!isOnMainDashboard && (
                            <Link
                                href={userRole === 'admin' ? '/admin' : '/dashboard'}
                                className="hidden lg:flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white/80 hover:text-white bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full transition-all border border-white/20 group"
                            >
                                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                                Dashboard
                            </Link>
                        )}

                        {/* Notification Bell with Dropdown */}
                        <div className="relative" ref={notificationRef}>
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={toggleNotifications}
                                className={cn(
                                    "relative p-3 rounded-2xl transition-all duration-200 outline-none border",
                                    showNotifications
                                        ? "bg-white/20 text-white border-white/30 shadow-lg"
                                        : "bg-white/5 text-white/70 hover:text-white hover:bg-white/10 border-white/10"
                                )}
                            >
                                <Bell className="w-5 h-5" />
                                {unreadCount > 0 && (
                                    <motion.span
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-br from-red-500 to-red-600 border-2 border-[#140152] rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-lg"
                                    >
                                        {unreadCount > 9 ? '9+' : unreadCount}
                                    </motion.span>
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
                                        className="absolute right-0 mt-3 w-80 sm:w-96 bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden z-50 origin-top-right"
                                    >
                                        <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white">
                                            <h3 className="font-black text-[#140152] text-lg">Notifications</h3>
                                            <div className="flex items-center gap-2">
                                                {unreadCount > 0 && (
                                                    <button
                                                        onClick={markAllAsRead}
                                                        className="text-xs font-bold text-[#140152] hover:text-[#f5bb00] transition-colors px-3 py-1 rounded-full bg-[#140152]/5 hover:bg-[#f5bb00]/10"
                                                    >
                                                        Mark all read
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => setShowNotifications(false)}
                                                    className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
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
                                                    <div className="w-16 h-16 bg-gradient-to-br from-gray-50 to-gray-100 rounded-full flex items-center justify-center mb-4">
                                                        <Bell className="w-8 h-8 text-gray-300" />
                                                    </div>
                                                    <p className="text-gray-500 text-sm font-medium">No notifications yet</p>
                                                </div>
                                            ) : (
                                                notifications.map((notification) => (
                                                    <div
                                                        key={notification.id}
                                                        onClick={() => !notification.is_read && markAsRead(notification.id)}
                                                        className={cn(
                                                            "p-4 border-b border-gray-50 hover:bg-gray-50 transition-all cursor-pointer",
                                                            !notification.is_read ? "bg-blue-50/30" : ""
                                                        )}
                                                    >
                                                        <div className="flex items-start gap-3">
                                                            <div className={cn(
                                                                "w-2.5 h-2.5 rounded-full mt-2 flex-shrink-0 shadow-lg",
                                                                notification.type === 'service_approved' ? 'bg-green-500 shadow-green-200' :
                                                                    notification.type === 'service_rejected' ? 'bg-red-500 shadow-red-200' :
                                                                        'bg-blue-500 shadow-blue-200'
                                                            )} />
                                                            <div className="flex-1 min-w-0">
                                                                <p className="font-bold text-sm text-[#140152]">
                                                                    {notification.title}
                                                                </p>
                                                                <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">
                                                                    {notification.message}
                                                                </p>
                                                                <p className="text-[10px] text-gray-400 mt-2 font-semibold">
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
                        <div className="relative" ref={profileRef}>
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={toggleProfileMenu}
                                className={cn(
                                    "hidden sm:flex items-center gap-3 p-1.5 pr-4 rounded-full border-2 transition-all duration-200",
                                    showProfileMenu
                                        ? "bg-white border-white shadow-xl"
                                        : "bg-white/10 border-white/20 hover:bg-white/20 hover:border-white/30 backdrop-blur-sm"
                                )}
                            >
                                <div className={cn(
                                    "w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-lg transition-colors",
                                    showProfileMenu ? "bg-gradient-to-br from-[#140152] to-[#1d0175] text-white" : "bg-[#f5bb00] text-[#140152]"
                                )}>
                                    {userName.charAt(0).toUpperCase()}
                                </div>
                                <div className="text-left">
                                    <span className={cn(
                                        "text-sm font-bold block transition-colors max-w-[100px] truncate",
                                        showProfileMenu ? "text-[#140152]" : "text-white"
                                    )}>
                                        {userName}
                                    </span>
                                    {userRole === 'admin' && (
                                        <span className={cn(
                                            "text-[10px] font-semibold uppercase tracking-wider",
                                            showProfileMenu ? "text-[#f5bb00]" : "text-[#f5bb00]/90"
                                        )}>
                                            Admin
                                        </span>
                                    )}
                                </div>
                                <ChevronDown className={cn(
                                    "w-4 h-4 transition-transform duration-200",
                                    showProfileMenu ? "text-[#140152] rotate-180" : "text-white/70"
                                )} />
                            </motion.button>

                            <AnimatePresence>
                                {showProfileMenu && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                        transition={{ duration: 0.2 }}
                                        className="absolute right-0 mt-3 w-72 bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden z-50 origin-top-right"
                                    >
                                        <div className="p-6 bg-gradient-to-br from-[#140152] to-[#1d0175] border-b border-white/10">
                                            <div className="flex items-center gap-4">
                                                <div className="w-14 h-14 rounded-2xl bg-[#f5bb00] flex items-center justify-center text-[#140152] font-black text-2xl shadow-xl">
                                                    {userName.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-base font-bold text-white truncate">{userName}</p>
                                                    <p className="text-xs text-white/70 truncate">{userEmail}</p>
                                                    {userRole === 'admin' && (
                                                        <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f5bb00] text-[#140152] text-[10px] font-black uppercase tracking-wider">
                                                            <Shield className="w-3 h-3" />
                                                            Administrator
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="p-3 space-y-1">
                                            <Link
                                                href={userRole === 'admin' ? '/admin/settings' : '/dashboard/settings'}
                                                onClick={() => setShowProfileMenu(false)}
                                                className="flex items-center gap-3 w-full px-4 py-3 text-sm text-gray-600 hover:text-[#140152] hover:bg-gray-50 rounded-2xl transition-all group"
                                            >
                                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center text-gray-500 group-hover:from-[#140152] group-hover:to-[#1d0175] group-hover:text-white transition-all shadow-sm">
                                                    <Settings className="w-5 h-5" />
                                                </div>
                                                <span className="font-semibold">Settings</span>
                                            </Link>

                                            <Link
                                                href={userRole === 'admin' ? '/admin/settings' : '/dashboard/settings'}
                                                onClick={() => setShowProfileMenu(false)}
                                                className="flex items-center gap-3 w-full px-4 py-3 text-sm text-gray-600 hover:text-[#140152] hover:bg-gray-50 rounded-2xl transition-all group"
                                            >
                                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center text-gray-500 group-hover:from-[#140152] group-hover:to-[#1d0175] group-hover:text-white transition-all shadow-sm">
                                                    <User className="w-5 h-5" />
                                                </div>
                                                <span className="font-semibold">Profile</span>
                                            </Link>
                                        </div>

                                        <div className="p-3 border-t border-gray-100">
                                            <button
                                                onClick={handleLogout}
                                                className="flex items-center gap-3 w-full px-4 py-3 text-sm text-red-600 hover:bg-red-50 rounded-2xl transition-all group"
                                            >
                                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center text-red-500 group-hover:from-red-500 group-hover:to-red-600 group-hover:text-white transition-all shadow-sm">
                                                    <LogOut className="w-5 h-5" />
                                                </div>
                                                <span className="font-semibold">Sign Out</span>
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Mobile Menu Toggle */}
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="sm:hidden p-2.5 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all border border-white/10"
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
                        className="sm:hidden bg-gradient-to-b from-[#140152] to-[#1a0670] border-t border-white/10 overflow-hidden"
                    >
                        <div className="p-4 space-y-2">
                            <div className="p-4 bg-white/10 backdrop-blur-sm rounded-2xl mb-4 flex items-center gap-3 border border-white/20">
                                <div className="w-12 h-12 rounded-full bg-[#f5bb00] flex items-center justify-center text-[#140152] font-bold text-lg shadow-lg">
                                    {userName.charAt(0).toUpperCase()}
                                </div>
                                <div className="overflow-hidden">
                                    <p className="font-bold text-white truncate">{userName}</p>
                                    <p className="text-xs text-white/70 truncate">{userEmail}</p>
                                </div>
                            </div>

                            <Link
                                href={userRole === 'admin' ? '/admin' : '/dashboard'}
                                onClick={() => setMobileMenuOpen(false)}
                                className="flex items-center gap-3 p-3 text-white hover:bg-white/10 rounded-xl transition-all backdrop-blur-sm border border-white/10"
                            >
                                <Home className="w-5 h-5" />
                                <span className="font-semibold">Dashboard</span>
                            </Link>

                            <Link
                                href={userRole === 'admin' ? '/admin/settings' : '/dashboard/settings'}
                                onClick={() => setMobileMenuOpen(false)}
                                className="flex items-center gap-3 p-3 text-white hover:bg-white/10 rounded-xl transition-all backdrop-blur-sm border border-white/10"
                            >
                                <Settings className="w-5 h-5" />
                                <span className="font-semibold">Settings</span>
                            </Link>

                            <div className="h-px bg-white/10 my-2" />

                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center gap-3 p-3 text-red-300 hover:bg-red-500/20 rounded-xl transition-all backdrop-blur-sm border border-red-500/20"
                            >
                                <LogOut className="w-5 h-5" />
                                <span className="font-semibold">Sign Out</span>
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </header>
    )
}
