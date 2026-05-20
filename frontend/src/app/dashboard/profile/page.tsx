'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
    ArrowLeft, User as UserIcon, Mail, Phone, MapPin, Camera, Loader2, Save,
    KeyRound, CheckCircle2,
} from 'lucide-react'
import { profileApi, type UserProfile } from '@/lib/api'

export default function ProfilePage() {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [profile, setProfile] = useState<UserProfile | null>(null)
    const [success, setSuccess] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)

    const [name, setName] = useState('')
    const [bio, setBio] = useState('')
    const [phone, setPhone] = useState('')
    const [location, setLocation] = useState('')

    const [currentPwd, setCurrentPwd] = useState('')
    const [newPwd, setNewPwd] = useState('')
    const [confirmPwd, setConfirmPwd] = useState('')
    const [changingPwd, setChangingPwd] = useState(false)

    const fileRef = useRef<HTMLInputElement | null>(null)

    useEffect(() => {
        if (typeof window !== 'undefined' && !localStorage.getItem('isLoggedIn')) {
            router.push('/auth/login'); return
        }
        ;(async () => {
            try {
                const p = await profileApi.me()
                setProfile(p)
                setName(p.name || '')
                setBio(p.bio || '')
                setPhone(p.phone || '')
                setLocation(p.location || '')
            } catch (e) { console.error(e) } finally { setLoading(false) }
        })()
    }, [router])

    function flashSuccess(m: string) {
        setSuccess(m); setError(null)
        setTimeout(() => setSuccess(null), 3000)
    }
    function flashError(m: string) {
        setError(m); setSuccess(null)
        setTimeout(() => setError(null), 4000)
    }

    async function save() {
        setSaving(true)
        try {
            const updated = await profileApi.update({ name, bio, phone, location })
            setProfile(updated)
            if (typeof window !== 'undefined') localStorage.setItem('userName', updated.name)
            flashSuccess('Profile saved')
        } catch (e: any) { flashError(e?.message || 'Failed to save') }
        finally { setSaving(false) }
    }

    async function onPickAvatar(f: File) {
        setUploading(true)
        try {
            const updated = await profileApi.uploadAvatar(f)
            setProfile(updated)
            flashSuccess('Avatar updated')
        } catch (e: any) { flashError(e?.message || 'Upload failed') }
        finally { setUploading(false) }
    }

    async function changePassword() {
        if (newPwd !== confirmPwd) { flashError('Passwords do not match'); return }
        if (newPwd.length < 8) { flashError('New password must be at least 8 chars'); return }
        setChangingPwd(true)
        try {
            await profileApi.changePassword(currentPwd, newPwd)
            setCurrentPwd(''); setNewPwd(''); setConfirmPwd('')
            flashSuccess('Password updated')
        } catch (e: any) { flashError(e?.message || 'Could not update password') }
        finally { setChangingPwd(false) }
    }

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-[#140152]" /></div>
    }

    const avatarSrc = profile?.avatar_url
        ? (profile.avatar_url.startsWith('http')
            ? profile.avatar_url
            : `${(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api').replace(/\/api\/?$/, '')}${profile.avatar_url}`)
        : null

    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            <div className="bg-[#140152] text-white">
                <div className="max-w-4xl mx-auto px-4 md:px-8 py-6 flex items-center gap-4">
                    <button onClick={() => router.push('/dashboard')} className="p-2 rounded-full hover:bg-white/10">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-black tracking-tight">My Profile</h1>
                        <p className="text-blue-200 text-sm">Personal info, photo, and security</p>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
                {success && (
                    <div className="bg-green-50 border border-green-200 text-green-800 rounded-2xl px-4 py-3 flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5" /> {success}
                    </div>
                )}
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-800 rounded-2xl px-4 py-3">{error}</div>
                )}

                {/* Profile card */}
                <div className="bg-white rounded-3xl shadow-xl p-6 md:p-8">
                    <div className="flex flex-col md:flex-row gap-6 items-start">
                        {/* Avatar */}
                        <div className="relative shrink-0 mx-auto md:mx-0">
                            <div className="w-32 h-32 rounded-full overflow-hidden bg-gradient-to-br from-[#140152] to-blue-700 flex items-center justify-center text-white text-3xl font-black">
                                {avatarSrc ? <img src={avatarSrc} alt="" className="w-full h-full object-cover" /> : (profile?.name?.[0]?.toUpperCase() || '?')}
                            </div>
                            <button
                                onClick={() => fileRef.current?.click()}
                                className="absolute bottom-1 right-1 p-2 bg-[#f5bb00] text-[#140152] rounded-full shadow-lg hover:scale-105 transition-transform"
                                title="Change photo"
                            >
                                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                            </button>
                            <input
                                ref={fileRef} type="file" hidden accept="image/*"
                                onChange={e => e.target.files?.[0] && onPickAvatar(e.target.files[0])}
                            />
                        </div>

                        <div className="flex-1 w-full">
                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-semibold uppercase text-gray-500 flex items-center gap-1"><UserIcon className="w-3 h-3" /> Full name</label>
                                    <input value={name} onChange={e => setName(e.target.value)} className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#140152]" />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold uppercase text-gray-500 flex items-center gap-1"><Mail className="w-3 h-3" /> Email</label>
                                    <input value={profile?.email || ''} disabled className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-500" />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold uppercase text-gray-500 flex items-center gap-1"><Phone className="w-3 h-3" /> Phone</label>
                                    <input value={phone} onChange={e => setPhone(e.target.value)} className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#140152]" />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold uppercase text-gray-500 flex items-center gap-1"><MapPin className="w-3 h-3" /> Location</label>
                                    <input value={location} onChange={e => setLocation(e.target.value)} className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#140152]" />
                                </div>
                            </div>

                            <div className="mt-4">
                                <label className="text-xs font-semibold uppercase text-gray-500">About me</label>
                                <textarea
                                    value={bio} onChange={e => setBio(e.target.value)} rows={4}
                                    placeholder="A little about you, your testimony, ministries you love…"
                                    className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#140152] resize-none"
                                />
                            </div>

                            <button
                                onClick={save}
                                disabled={saving}
                                className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#140152] text-white font-semibold disabled:opacity-50"
                            >
                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                Save changes
                            </button>
                        </div>
                    </div>
                </div>

                {/* Password card */}
                <div className="bg-white rounded-3xl shadow-xl p-6 md:p-8">
                    <h2 className="text-lg font-bold text-[#140152] flex items-center gap-2 mb-4">
                        <KeyRound className="w-5 h-5" /> Change password
                    </h2>
                    <div className="grid md:grid-cols-3 gap-4">
                        <div>
                            <label className="text-xs font-semibold uppercase text-gray-500">Current</label>
                            <input type="password" value={currentPwd} onChange={e => setCurrentPwd(e.target.value)} className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#140152]" />
                        </div>
                        <div>
                            <label className="text-xs font-semibold uppercase text-gray-500">New</label>
                            <input type="password" value={newPwd} onChange={e => setNewPwd(e.target.value)} className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#140152]" />
                        </div>
                        <div>
                            <label className="text-xs font-semibold uppercase text-gray-500">Confirm new</label>
                            <input type="password" value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)} className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#140152]" />
                        </div>
                    </div>
                    <button
                        onClick={changePassword}
                        disabled={changingPwd || !currentPwd || !newPwd}
                        className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#140152] text-white font-semibold disabled:opacity-50"
                    >
                        {changingPwd ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
                        Update password
                    </button>
                </div>
            </div>
        </div>
    )
}
