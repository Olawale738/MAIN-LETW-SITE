'use client'
import React, { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { authApi, userApi, settingsApi, User } from '@/lib/api'
import Link from 'next/link'
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
    School,
    Users,
    Music,
    Heart,
    Zap,
    ExternalLink,
    KeyRound,
    Save,
    Trash2,
    AlertTriangle,
    MessageCircle,
    RefreshCw
} from 'lucide-react'
import { Button } from '@/components/ui/button'

/* ─── Ministry role helpers ────────────────────────────────────── */
const ROLE_KEYS = {
    choirmaster:   'letw_choirmaster_creds',
    youthCoord:    'letw_youth_coord_creds',
    childrenCoord: 'letw_children_coord_creds',
} as const

type RoleKey = keyof typeof ROLE_KEYS

interface RoleCreds { name: string; username: string; password: string }

const ROLE_DEFAULTS: Record<RoleKey, RoleCreds> = {
    choirmaster:   { name: '', username: 'choirmaster', password: 'LETW@Choir2026'    },
    youthCoord:    { name: '', username: 'youthcoord',  password: 'LETW@Youth2026'    },
    childrenCoord: { name: '', username: 'childcoord',  password: 'LETW@Children2026' },
}

function loadRoleCreds(key: RoleKey): RoleCreds {
    if (typeof window === 'undefined') return { ...ROLE_DEFAULTS[key] }
    try {
        const raw = localStorage.getItem(ROLE_KEYS[key])
        if (raw) return { ...ROLE_DEFAULTS[key], ...JSON.parse(raw) }
    } catch { /* ignore */ }
    return { ...ROLE_DEFAULTS[key] }
}

function saveRoleCreds(key: RoleKey, creds: RoleCreds) {
    localStorage.setItem(ROLE_KEYS[key], JSON.stringify(creds))
}

export default function AdminSettingsPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'registrations' | 'ministry' | 'danger'>(
        (searchParams.get('tab') as 'profile' | 'security' | 'registrations' | 'ministry' | 'danger') || 'profile'
    )

    // Danger zone state
    const [resetting, setResetting] = useState(false)
    const [resetResult, setResetResult] = useState<{ total: number; deleted: Record<string, number> } | null>(null)
    const [resetConfirmText, setResetConfirmText] = useState('')

    const handleResetAllChats = async () => {
        if (resetConfirmText !== 'RESET ALL CHATS') return
        setResetting(true)
        setResetResult(null)
        try {
            const token = localStorage.getItem('access_token')
            const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'
            const res = await fetch(`${base}/messages/admin/reset-all-chats`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            })
            if (!res.ok) throw new Error(await res.text())
            const data = await res.json()
            setResetResult(data)
            setResetConfirmText('')
        } catch (e: any) {
            alert('Reset failed: ' + (e?.message || 'Unknown error'))
        } finally {
            setResetting(false)
        }
    }

    // Registration Settings state
    const [theologyRegistrationOpen, setTheologyRegistrationOpen] = useState(true)
    const [registrationLoading, setRegistrationLoading] = useState(false)

    // Ministry roles state
    const [roles, setRoles] = useState<Record<RoleKey, RoleCreds>>({
        choirmaster:   { ...ROLE_DEFAULTS.choirmaster },
        youthCoord:    { ...ROLE_DEFAULTS.youthCoord },
        childrenCoord: { ...ROLE_DEFAULTS.childrenCoord },
    })
    const [roleShowPw, setRoleShowPw] = useState<Record<RoleKey, boolean>>({ choirmaster: false, youthCoord: false, childrenCoord: false })
    const [roleSaved, setRoleSaved]   = useState<Record<RoleKey, boolean>>({ choirmaster: false, youthCoord: false, childrenCoord: false })

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
        // Load ministry role credentials from localStorage
        setRoles({
            choirmaster:   loadRoleCreds('choirmaster'),
            youthCoord:    loadRoleCreds('youthCoord'),
            childrenCoord: loadRoleCreds('childrenCoord'),
        })

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

    const handleSaveRole = (key: RoleKey) => {
        if (!roles[key].username.trim() || !roles[key].password.trim()) return
        saveRoleCreds(key, roles[key])
        setRoleSaved(prev => ({ ...prev, [key]: true }))
        setTimeout(() => setRoleSaved(prev => ({ ...prev, [key]: false })), 2500)
    }

    const updateRole = (key: RoleKey, field: keyof RoleCreds, value: string) => {
        setRoles(prev => ({ ...prev, [key]: { ...prev[key], [field]: value } }))
    }

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
        { id: 'profile'      as const, label: 'Profile',         icon: UserIcon },
        { id: 'security'     as const, label: 'Security',         icon: Shield   },
        { id: 'danger'       as const, label: 'Danger Zone',      icon: AlertTriangle },
        { id: 'registrations'as const, label: 'Registrations',    icon: School   },
        { id: 'ministry'     as const, label: 'Ministry Roles',   icon: Users    },
    ]

    const ROLE_CARDS: { key: RoleKey; label: string; icon: React.ElementType; color: string; href: string; desc: string }[] = [
        { key: 'choirmaster',   label: 'Choir Master',          icon: Music,  color: '#7c3aed', href: '/services/alter-sound/choirmaster', desc: 'Controls the Alter Sound choir portal' },
        { key: 'youthCoord',    label: 'Youth Coordinator',     icon: Zap,    color: '#4f46e5', href: '/youth/coordinator',                desc: 'Manages the Youth Ministry portal'     },
        { key: 'childrenCoord', label: "Children's Coordinator", icon: Heart,  color: '#10b981', href: '/children/coordinator',             desc: "Manages the Children's Ministry portal" },
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

                        {activeTab === 'ministry' && (
                            <motion.div
                                key="ministry"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                            >
                                <div className="mb-6">
                                    <h3 className="text-lg font-semibold text-[#140152] mb-1">Ministry Portal Roles</h3>
                                    <p className="text-sm text-gray-500">Set the login credentials for each ministry coordinator. These are saved locally and used to control access to each portal.</p>
                                </div>

                                <div className="space-y-6">
                                    {ROLE_CARDS.map(({ key, label, icon: Icon, color, href, desc }) => (
                                        <div key={key} className="border border-gray-200 rounded-2xl overflow-hidden">
                                            {/* Card header */}
                                            <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100"
                                                style={{ background: color + '0d' }}>
                                                <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                                                    style={{ background: color + '18' }}>
                                                    <Icon className="w-5 h-5" style={{ color }} />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="font-bold text-[#140152] text-sm">{label}</p>
                                                    <p className="text-xs text-gray-500">{desc}</p>
                                                </div>
                                                <Link href={href} target="_blank"
                                                    className="flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:border-current transition-colors"
                                                    style={{ color }}>
                                                    <ExternalLink className="w-3 h-3" /> Open Portal
                                                </Link>
                                            </div>

                                            {/* Fields */}
                                            <div className="px-5 py-4 space-y-3">
                                                <div className="grid sm:grid-cols-2 gap-3">
                                                    <div>
                                                        <label className="block text-xs font-semibold text-gray-600 mb-1">
                                                            <UserIcon className="inline w-3 h-3 mr-1" />Holder's Name
                                                        </label>
                                                        <input
                                                            value={roles[key].name}
                                                            onChange={e => updateRole(key, 'name', e.target.value)}
                                                            className="w-full p-2.5 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 text-sm"
                                                            style={{ '--tw-ring-color': color } as React.CSSProperties}
                                                            placeholder={`e.g. Bro. Samuel Akin`}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-semibold text-gray-600 mb-1">
                                                            <KeyRound className="inline w-3 h-3 mr-1" />Login Username
                                                        </label>
                                                        <input
                                                            value={roles[key].username}
                                                            onChange={e => updateRole(key, 'username', e.target.value)}
                                                            className="w-full p-2.5 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 text-sm font-mono"
                                                            placeholder="username"
                                                        />
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                                                        <Lock className="inline w-3 h-3 mr-1" />Login Password
                                                    </label>
                                                    <div className="relative">
                                                        <input
                                                            type={roleShowPw[key] ? 'text' : 'password'}
                                                            value={roles[key].password}
                                                            onChange={e => updateRole(key, 'password', e.target.value)}
                                                            className="w-full p-2.5 pr-10 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 text-sm font-mono"
                                                            placeholder="Set a strong password"
                                                        />
                                                        <button type="button"
                                                            onClick={() => setRoleShowPw(prev => ({ ...prev, [key]: !prev[key] }))}
                                                            className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600">
                                                            {roleShowPw[key] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3 pt-1">
                                                    <button
                                                        onClick={() => handleSaveRole(key)}
                                                        disabled={!roles[key].username.trim() || !roles[key].password.trim()}
                                                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-50 transition-all"
                                                        style={{ background: color }}>
                                                        <Save className="w-4 h-4" />
                                                        Save Credentials
                                                    </button>
                                                    {roleSaved[key] && (
                                                        <span className="flex items-center gap-1.5 text-xs font-semibold text-green-600">
                                                            <CheckCircle className="w-4 h-4" /> Saved!
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800 flex gap-2">
                                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                    <p>Credentials are stored in your browser's local storage. Share the username and password directly with each coordinator so they can access their portal.</p>
                                </div>
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
                        {/* ── Danger Zone tab ── */}
                        {activeTab === 'danger' && (
                            <motion.div key="danger" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                                <div className="p-6 space-y-6">
                                    <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-2xl">
                                        <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
                                        <p className="text-sm text-red-700 font-medium">
                                            Actions in this zone are <strong>permanent and irreversible</strong>. Proceed only if you are absolutely certain.
                                        </p>
                                    </div>

                                    {/* Reset All Chats */}
                                    <div className="border-2 border-red-100 rounded-2xl overflow-hidden">
                                        <div className="bg-red-50 px-5 py-4 flex items-center gap-3">
                                            <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center shrink-0">
                                                <MessageCircle className="w-5 h-5 text-red-600" />
                                            </div>
                                            <div>
                                                <p className="font-black text-red-800">Reset All Chats</p>
                                                <p className="text-xs text-red-600 mt-0.5">
                                                    Permanently deletes every message across all 5 chat systems
                                                </p>
                                            </div>
                                        </div>

                                        <div className="p-5 bg-white space-y-4">
                                            {/* What will be deleted */}
                                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                                                {[
                                                    { icon: '💬', label: 'DM Conversations' },
                                                    { icon: '📢', label: 'Live Chat (widget)' },
                                                    { icon: '🎵', label: 'Choir Group Chat' },
                                                    { icon: '🏢', label: 'All 7 Dept Chats' },
                                                    { icon: '👥', label: 'Mentor ↔ Mentee DMs' },
                                                    { icon: '📋', label: 'Coordinator DMs' },
                                                ].map(item => (
                                                    <div key={item.label} className="flex items-center gap-1.5 bg-gray-50 rounded-lg px-2.5 py-1.5 text-gray-600">
                                                        <span>{item.icon}</span>
                                                        <span>{item.label}</span>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Success result */}
                                            {resetResult && (
                                                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <CheckCircle className="w-4 h-4 text-green-600" />
                                                        <p className="text-sm font-bold text-green-700">
                                                            Reset complete — {resetResult.total} records deleted
                                                        </p>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-1.5 text-xs text-green-700">
                                                        {Object.entries(resetResult.deleted).map(([key, count]) => (
                                                            <span key={key}>{key.replace(/_/g, ' ')}: <strong>{count}</strong></span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Confirmation input */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Type <code className="bg-gray-100 px-1 py-0.5 rounded text-red-600 text-xs font-mono">RESET ALL CHATS</code> to confirm
                                                </label>
                                                <input
                                                    type="text"
                                                    value={resetConfirmText}
                                                    onChange={e => setResetConfirmText(e.target.value)}
                                                    placeholder="RESET ALL CHATS"
                                                    className="w-full p-3 border-2 border-gray-200 rounded-xl font-mono text-sm focus:outline-none focus:border-red-400 transition-colors"
                                                />
                                            </div>

                                            <button
                                                onClick={handleResetAllChats}
                                                disabled={resetConfirmText !== 'RESET ALL CHATS' || resetting}
                                                className="flex items-center gap-2 px-5 py-3 bg-red-600 text-white rounded-xl font-bold text-sm hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                                            >
                                                {resetting
                                                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Resetting…</>
                                                    : <><RefreshCw className="w-4 h-4" /> Reset All Chats Now</>
                                                }
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                    </AnimatePresence>
                </div>
            </div>
        </div>
    )
}
