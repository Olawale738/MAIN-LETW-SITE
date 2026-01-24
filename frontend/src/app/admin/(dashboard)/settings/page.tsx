'use client'
import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { authApi, userApi, settingsApi, User } from '@/lib/api'
import {
    User as UserIcon,
    Lock,
    Mail,
    Calendar,
    CheckCircle,
    AlertCircle,
    Loader2,
    Eye,
    EyeOff,
    Shield,
    Crown,
    School
} from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function AdminSettingsPage() {
    const router = useRouter()
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'registrations'>('profile')

    // Registration Settings state
    const [theologyRegistrationOpen, setTheologyRegistrationOpen] = useState(true)
    const [registrationLoading, setRegistrationLoading] = useState(false)

    // Profile form state
    const [name, setName] = useState('')
    const [profileLoading, setProfileLoading] = useState(false)
    const [profileSuccess, setProfileSuccess] = useState(false)
    const [profileError, setProfileError] = useState('')

    // Password form state
    const [currentPassword, setCurrentPassword] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showPasswords, setShowPasswords] = useState(false)
    const [passwordLoading, setPasswordLoading] = useState(false)
    const [passwordSuccess, setPasswordSuccess] = useState(false)
    const [passwordError, setPasswordError] = useState('')

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const userData = await authApi.getCurrentUser()
                if (userData.role !== 'admin') {
                    router.push('/dashboard')
                    return
                }
                setUser(userData)
                setName(userData.name)

                // Fetch settings
                const settings = await settingsApi.getTheologyRegistrationStatus()
                setTheologyRegistrationOpen(settings.isOpen)
            } catch (error) {
                console.error('Failed to fetch user', error)
                router.push('/auth/login')
            } finally {
                setLoading(false)
            }
        }
        fetchUser()
    }, [router])

    const handleRegistrationToggle = async (checked: boolean) => {
        setRegistrationLoading(true)
        try {
            await settingsApi.setTheologyRegistrationStatus(checked)
            setTheologyRegistrationOpen(checked)
        } catch (error) {
            console.error('Failed to update settings', error)
        } finally {
            setRegistrationLoading(false)
        }
    }

    const handleProfileUpdate = async (e: React.FormEvent) => {
        e.preventDefault()
        setProfileLoading(true)
        setProfileError('')
        setProfileSuccess(false)

        try {
            const updatedUser = await userApi.updateProfile(name)
            setUser(updatedUser)
            localStorage.setItem('userName', updatedUser.name)
            setProfileSuccess(true)
            setTimeout(() => setProfileSuccess(false), 3000)
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to update profile'
            setProfileError(errorMessage)
        } finally {
            setProfileLoading(false)
        }
    }

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault()

        if (newPassword !== confirmPassword) {
            setPasswordError('New passwords do not match')
            return
        }

        if (newPassword.length < 8) {
            setPasswordError('Password must be at least 8 characters')
            return
        }

        setPasswordLoading(true)
        setPasswordError('')
        setPasswordSuccess(false)

        try {
            await authApi.changePassword(currentPassword, newPassword)
            setPasswordSuccess(true)
            setCurrentPassword('')
            setNewPassword('')
            setConfirmPassword('')
            setTimeout(() => setPasswordSuccess(false), 3000)
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to change password'
            setPasswordError(errorMessage)
        } finally {
            setPasswordLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-[#140152]" />
            </div>
        )
    }

    const tabs = [
        { id: 'profile' as const, label: 'Profile', icon: UserIcon },
        { id: 'security' as const, label: 'Security', icon: Shield },
        { id: 'registrations' as const, label: 'Registrations', icon: School },
    ]

    return (
        <div className="p-6">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-[#140152]">Admin Settings</h1>
                <p className="text-gray-500 mt-1">Manage your admin account settings</p>
            </div>

            {/* Settings Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden max-w-3xl">
                {/* Tabs */}
                <div className="flex border-b border-gray-100">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors relative ${activeTab === tab.id
                                ? 'text-[#140152]'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            <tab.icon className="w-4 h-4" />
                            {tab.label}
                            {activeTab === tab.id && (
                                <motion.div
                                    layoutId="adminActiveTab"
                                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#140152]"
                                />
                            )}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="p-6">
                    <AnimatePresence mode="wait">
                        {activeTab === 'registrations' && (
                            <motion.div
                                key="registrations"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                            >
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                                        <div>
                                            <h3 className="font-bold text-[#140152]">Theology School Registration</h3>
                                            <p className="text-sm text-gray-500">Enable or disable new student applications</p>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                className="sr-only peer"
                                                checked={theologyRegistrationOpen}
                                                onChange={(e) => handleRegistrationToggle(e.target.checked)}
                                                disabled={registrationLoading}
                                            />
                                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#f5bb00]"></div>
                                            {registrationLoading && (
                                                <div className="absolute right-12">
                                                    <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                                                </div>
                                            )}
                                        </label>
                                    </div>

                                    <div className="p-4 bg-blue-50 text-blue-800 rounded-xl text-sm">
                                        <div className="flex gap-2">
                                            <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                            <p>
                                                When registration is closed, the "Apply Now" buttons on the Theology School page will be disabled, and a message will be displayed to visitors.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                        {activeTab === 'profile' && (
                            <motion.div
                                key="profile"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                            >
                                {/* Admin Profile Info Card */}
                                <div className="mb-8 p-6 bg-gradient-to-r from-[#140152] to-[#1d0175] rounded-xl text-white relative overflow-hidden">
                                    <div className="absolute top-2 right-2">
                                        <div className="flex items-center gap-1 bg-[#f5bb00] text-[#140152] px-2 py-1 rounded-full text-xs font-bold">
                                            <Crown className="w-3 h-3" />
                                            Admin
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold">
                                            {user?.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold">{user?.name}</h3>
                                            <p className="text-white/70">{user?.email}</p>
                                        </div>
                                    </div>
                                    <div className="mt-4 pt-4 border-t border-white/20 flex gap-6 text-sm">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-4 h-4 text-white/60" />
                                            <span className="text-white/70">Admin since {new Date(user?.created_at || '').toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Edit Profile Form */}
                                <h3 className="text-lg font-semibold text-[#140152] mb-4">Edit Profile</h3>

                                {profileSuccess && (
                                    <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-xl flex items-center gap-2 text-sm">
                                        <CheckCircle className="w-4 h-4" />
                                        Profile updated successfully!
                                    </div>
                                )}

                                {profileError && (
                                    <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-2 text-sm">
                                        <AlertCircle className="w-4 h-4" />
                                        {profileError}
                                    </div>
                                )}

                                <form onSubmit={handleProfileUpdate} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                                        <input
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#140152] focus:border-transparent transition-all text-gray-900"
                                            required
                                            minLength={2}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                                        <div className="flex items-center gap-2 p-3 border border-gray-200 rounded-xl bg-gray-100 text-gray-500">
                                            <Mail className="w-4 h-4" />
                                            {user?.email}
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                                    </div>

                                    <Button
                                        type="submit"
                                        disabled={profileLoading || name === user?.name}
                                        className="bg-[#140152] hover:bg-[#1d0175] text-white py-3 px-6"
                                    >
                                        {profileLoading ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                                Saving...
                                            </>
                                        ) : (
                                            'Save Changes'
                                        )}
                                    </Button>
                                </form>
                            </motion.div>
                        )}

                        {activeTab === 'security' && (
                            <motion.div
                                key="security"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                            >
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-10 h-10 rounded-full bg-[#140152]/10 flex items-center justify-center">
                                        <Lock className="w-5 h-5 text-[#140152]" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-[#140152]">Change Password</h3>
                                        <p className="text-sm text-gray-500">Update your admin password</p>
                                    </div>
                                </div>

                                {passwordSuccess && (
                                    <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-xl flex items-center gap-2 text-sm">
                                        <CheckCircle className="w-4 h-4" />
                                        Password changed successfully!
                                    </div>
                                )}

                                {passwordError && (
                                    <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-2 text-sm">
                                        <AlertCircle className="w-4 h-4" />
                                        {passwordError}
                                    </div>
                                )}

                                <form onSubmit={handlePasswordChange} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                                        <div className="relative">
                                            <input
                                                type={showPasswords ? 'text' : 'password'}
                                                value={currentPassword}
                                                onChange={(e) => setCurrentPassword(e.target.value)}
                                                className="w-full p-3 pr-12 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#140152] focus:border-transparent transition-all text-gray-900"
                                                required
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPasswords(!showPasswords)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                            >
                                                {showPasswords ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                            </button>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                                        <input
                                            type={showPasswords ? 'text' : 'password'}
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#140152] focus:border-transparent transition-all text-gray-900"
                                            required
                                            minLength={8}
                                        />
                                        <p className="text-xs text-gray-500 mt-1">Must be at least 8 characters</p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                                        <input
                                            type={showPasswords ? 'text' : 'password'}
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#140152] focus:border-transparent transition-all"
                                            required
                                        />
                                    </div>

                                    <Button
                                        type="submit"
                                        disabled={passwordLoading || !currentPassword || !newPassword || !confirmPassword}
                                        className="bg-[#140152] hover:bg-[#1d0175] text-white py-3 px-6"
                                    >
                                        {passwordLoading ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                                Changing...
                                            </>
                                        ) : (
                                            'Change Password'
                                        )}
                                    </Button>
                                </form>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    )
}
