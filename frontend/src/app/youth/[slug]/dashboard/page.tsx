'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
    Loader2, ArrowLeft, Megaphone, Calendar, BookOpen, Download, Play,
    Sparkles, ChevronRight, Lock, ExternalLink, LayoutDashboard,
    Home, MessageCircle, Users, Send, Trash2, Crown, ShieldCheck,
    CalendarPlus, Check, X, ClipboardCheck, UserPlus, UserCheck, UserX,
    Plus, MapPin, Clock, Flame, Award, Activity as ActivityIcon,
} from 'lucide-react'
import * as LucideIcons from 'lucide-react'
import {
    youthProgramApi, YouthProgram, YouthProgramChatMessage,
    YouthProgramMember, YouthProgramMembershipStatus,
    YouthProgramActivity, YouthProgramAttendanceSummary, YouthProgramAttendanceRow,
    YouthProgramPendingMember,
} from '@/lib/api'

const getIcon = (name?: string) => {
    if (!name) return Sparkles
    const I = (LucideIcons as any)[name]
    return I || Sparkles
}

function initials(name: string) {
    return name.split(' ').map(p => p[0] || '').slice(0, 2).join('').toUpperCase() || '?'
}

function relativeTime(iso: string) {
    const d = new Date(iso).getTime()
    const now = Date.now()
    const diff = Math.max(0, now - d)
    const sec = Math.floor(diff / 1000)
    if (sec < 60) return 'just now'
    const min = Math.floor(sec / 60)
    if (min < 60) return `${min}m ago`
    const hr = Math.floor(min / 60)
    if (hr < 24) return `${hr}h ago`
    return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

type Tab = 'overview' | 'chat' | 'activities' | 'attendance' | 'members' | 'coord'

export default function YouthProgramDashboard() {
    const params = useParams<{ slug: string }>()
    const slug = params?.slug as string | undefined

    const [program, setProgram] = useState<YouthProgram | null>(null)
    const [membership, setMembership] = useState<YouthProgramMembershipStatus | null>(null)
    const [loading, setLoading] = useState(true)
    const [notFound, setNotFound] = useState(false)
    const [forbidden, setForbidden] = useState(false)
    const [isLoggedIn, setIsLoggedIn] = useState(false)
    const [authChecked, setAuthChecked] = useState(false)

    const [tab, setTab] = useState<Tab>('overview')

    // Chat state
    const [messages, setMessages] = useState<YouthProgramChatMessage[]>([])
    const [draft, setDraft] = useState('')
    const [sending, setSending] = useState(false)
    const [chatError, setChatError] = useState('')
    const chatBottomRef = useRef<HTMLDivElement>(null)

    // Members state
    const [members, setMembers] = useState<YouthProgramMember[]>([])
    const [membersLoading, setMembersLoading] = useState(false)

    // Activities
    const [activities, setActivities] = useState<YouthProgramActivity[]>([])
    const [activitiesLoading, setActivitiesLoading] = useState(false)
    const [showActivityForm, setShowActivityForm] = useState(false)
    const [newActivity, setNewActivity] = useState({ title: '', description: '', activity_type: '', location: '', start_at: '', end_at: '' })
    const [savingActivity, setSavingActivity] = useState(false)

    // Attendance (self)
    const [attendanceSummary, setAttendanceSummary] = useState<YouthProgramAttendanceSummary | null>(null)
    const [attendanceLoading, setAttendanceLoading] = useState(false)

    // Coordinator panel
    const [pending, setPending] = useState<YouthProgramPendingMember[]>([])
    const [pendingLoading, setPendingLoading] = useState(false)
    const [announcementForm, setAnnouncementForm] = useState({ title: '', body: '', urgent: false })
    const [resourceForm, setResourceForm] = useState({ title: '', url: '', type: 'link', meta: '' })
    const [coordBusy, setCoordBusy] = useState(false)

    // Coordinator: attendance recording for a chosen activity
    const [recordingForActivity, setRecordingForActivity] = useState<string | null>(null)
    const [attendanceDraft, setAttendanceDraft] = useState<Record<string, boolean>>({})
    const [recordingMembers, setRecordingMembers] = useState<YouthProgramMember[]>([])
    const [recordingExisting, setRecordingExisting] = useState<Record<string, boolean>>({})

    // ── Auth check ──────────────────────────────────────────────────────────
    useEffect(() => {
        const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null
        setIsLoggedIn(!!token)
        setAuthChecked(true)
    }, [])

    // ── Load program + membership ──────────────────────────────────────────
    useEffect(() => {
        if (!slug || !authChecked) return
        let cancelled = false
        ;(async () => {
            try {
                const p = await youthProgramApi.get(slug)
                if (cancelled) return
                setProgram(p)
                if (isLoggedIn) {
                    try {
                        const m = await youthProgramApi.membership(slug)
                        if (!cancelled) {
                            setMembership(m)
                            if (!m.can_access) setForbidden(true)
                        }
                    } catch {
                        if (!cancelled) setForbidden(true)
                    }
                }
            } catch (e) {
                if (!cancelled) setNotFound(true)
            } finally {
                if (!cancelled) setLoading(false)
            }
        })()
        return () => { cancelled = true }
    }, [slug, authChecked, isLoggedIn])

    // ── Load chat when chat tab opens (and poll every 15 s) ────────────────
    useEffect(() => {
        if (!slug || tab !== 'chat' || !membership?.can_access) return
        let cancelled = false
        let poll: ReturnType<typeof setInterval> | null = null

        const load = async () => {
            try {
                const msgs = await youthProgramApi.listMessages(slug)
                if (!cancelled) {
                    setMessages(msgs)
                    setChatError('')
                }
            } catch (e: any) {
                if (!cancelled) setChatError(e?.message || 'Failed to load messages.')
            }
        }
        load()
        poll = setInterval(load, 15000)
        return () => {
            cancelled = true
            if (poll) clearInterval(poll)
        }
    }, [slug, tab, membership?.can_access])

    // Scroll chat to bottom on new messages
    useEffect(() => {
        if (tab === 'chat') chatBottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
    }, [messages.length, tab])

    // ── Load members on tab open ───────────────────────────────────────────
    useEffect(() => {
        if (!slug || tab !== 'members' || !membership?.can_access) return
        let cancelled = false
        ;(async () => {
            try {
                setMembersLoading(true)
                const ms = await youthProgramApi.listMembers(slug)
                if (!cancelled) setMembers(ms)
            } catch {
                /* swallow — empty state shows */
            } finally {
                if (!cancelled) setMembersLoading(false)
            }
        })()
        return () => { cancelled = true }
    }, [slug, tab, membership?.can_access])

    // ── Load activities ────────────────────────────────────────────────────
    const loadActivities = async () => {
        if (!slug) return
        try {
            setActivitiesLoading(true)
            const list = await youthProgramApi.listActivities(slug)
            setActivities(list)
        } catch {
            // empty list shows
        } finally {
            setActivitiesLoading(false)
        }
    }
    useEffect(() => {
        if (!slug || tab !== 'activities' || !membership?.can_access) return
        loadActivities()
    }, [slug, tab, membership?.can_access])

    // ── Load my attendance ────────────────────────────────────────────────
    useEffect(() => {
        if (!slug || tab !== 'attendance' || !membership?.can_access) return
        let cancelled = false
        ;(async () => {
            try {
                setAttendanceLoading(true)
                const s = await youthProgramApi.myAttendance(slug)
                if (!cancelled) setAttendanceSummary(s)
            } catch {
                /* */
            } finally {
                if (!cancelled) setAttendanceLoading(false)
            }
        })()
        return () => { cancelled = true }
    }, [slug, tab, membership?.can_access])

    // ── Load pending (coord) ──────────────────────────────────────────────
    const loadPending = async () => {
        if (!slug) return
        try {
            setPendingLoading(true)
            const list = await youthProgramApi.coordListPending(slug)
            setPending(list)
        } catch {
            setPending([])
        } finally {
            setPendingLoading(false)
        }
    }
    useEffect(() => {
        if (!slug || tab !== 'coord') return
        if (!membership?.is_coordinator && !membership?.is_admin) return
        loadPending()
    }, [slug, tab, membership?.is_coordinator, membership?.is_admin])

    // ── Activity create / delete / RSVP ───────────────────────────────────
    const saveActivity = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!slug || !newActivity.title.trim() || !newActivity.start_at) return
        try {
            setSavingActivity(true)
            await youthProgramApi.createActivity(slug, {
                title: newActivity.title.trim(),
                description: newActivity.description || undefined,
                activity_type: newActivity.activity_type || undefined,
                location: newActivity.location || undefined,
                start_at: new Date(newActivity.start_at).toISOString(),
                end_at: newActivity.end_at ? new Date(newActivity.end_at).toISOString() : undefined,
            })
            setNewActivity({ title: '', description: '', activity_type: '', location: '', start_at: '', end_at: '' })
            setShowActivityForm(false)
            await loadActivities()
        } catch (e: any) {
            alert(e?.message || 'Failed to save')
        } finally {
            setSavingActivity(false)
        }
    }

    const removeActivity = async (id: string) => {
        if (!slug || !confirm('Delete this activity?')) return
        try {
            await youthProgramApi.deleteActivity(slug, id)
            setActivities(prev => prev.filter(a => a.id !== id))
        } catch (e: any) {
            alert(e?.message || 'Failed')
        }
    }

    const setRsvp = async (activityId: string, status: 'yes' | 'maybe' | 'no') => {
        if (!slug) return
        try {
            await youthProgramApi.setRsvp(slug, activityId, status)
            await loadActivities()
        } catch (e: any) {
            alert(e?.message || 'RSVP failed')
        }
    }

    // ── Coordinator: announcements ────────────────────────────────────────
    const submitAnnouncement = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!slug || !announcementForm.title.trim()) return
        try {
            setCoordBusy(true)
            await youthProgramApi.coordPostAnnouncement(slug, {
                title: announcementForm.title.trim(),
                body: announcementForm.body || undefined,
                urgent: announcementForm.urgent,
            })
            // Refresh program data so Overview reflects new announcement
            const p = await youthProgramApi.get(slug)
            setProgram(p)
            setAnnouncementForm({ title: '', body: '', urgent: false })
            alert('Announcement posted')
        } catch (e: any) {
            alert(e?.message || 'Failed')
        } finally {
            setCoordBusy(false)
        }
    }

    const removeAnnouncement = async (index: number) => {
        if (!slug || !confirm('Delete this announcement?')) return
        try {
            await youthProgramApi.coordDeleteAnnouncement(slug, index)
            const p = await youthProgramApi.get(slug)
            setProgram(p)
        } catch (e: any) {
            alert(e?.message || 'Failed')
        }
    }

    // ── Coordinator: resources ────────────────────────────────────────────
    const submitResource = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!slug || !resourceForm.title.trim() || !resourceForm.url.trim()) return
        try {
            setCoordBusy(true)
            await youthProgramApi.coordAddResource(slug, {
                title: resourceForm.title.trim(),
                url: resourceForm.url.trim(),
                type: resourceForm.type,
                meta: resourceForm.meta || undefined,
            })
            const p = await youthProgramApi.get(slug)
            setProgram(p)
            setResourceForm({ title: '', url: '', type: 'link', meta: '' })
            alert('Resource added')
        } catch (e: any) {
            alert(e?.message || 'Failed')
        } finally {
            setCoordBusy(false)
        }
    }

    const removeResource = async (index: number) => {
        if (!slug || !confirm('Delete this resource?')) return
        try {
            await youthProgramApi.coordDeleteResource(slug, index)
            const p = await youthProgramApi.get(slug)
            setProgram(p)
        } catch (e: any) {
            alert(e?.message || 'Failed')
        }
    }

    // ── Coordinator: pending approval ─────────────────────────────────────
    const approvePending = async (requestId: string) => {
        if (!slug) return
        try {
            await youthProgramApi.coordApprovePending(slug, requestId)
            await loadPending()
        } catch (e: any) {
            alert(e?.message || 'Failed')
        }
    }
    const rejectPending = async (requestId: string) => {
        if (!slug || !confirm('Reject this request?')) return
        try {
            await youthProgramApi.coordRejectPending(slug, requestId)
            await loadPending()
        } catch (e: any) {
            alert(e?.message || 'Failed')
        }
    }

    // ── Coordinator: attendance recording ─────────────────────────────────
    const openAttendanceRecorder = async (activityId: string) => {
        if (!slug) return
        try {
            const [memberList, existing] = await Promise.all([
                youthProgramApi.listMembers(slug),
                youthProgramApi.listActivityAttendance(slug, activityId),
            ])
            const memberOnly = memberList.filter(m => m.role === 'member' || m.role === 'coordinator')
            setRecordingMembers(memberOnly)
            const existingMap: Record<string, boolean> = {}
            existing.forEach(e => { existingMap[e.user_id] = e.present })
            setRecordingExisting(existingMap)
            // initial draft = existing where set, else true
            const draft: Record<string, boolean> = {}
            memberOnly.forEach(m => { draft[m.user_id] = existingMap[m.user_id] ?? false })
            setAttendanceDraft(draft)
            setRecordingForActivity(activityId)
        } catch (e: any) {
            alert(e?.message || 'Failed to load')
        }
    }

    const saveAttendance = async () => {
        if (!slug || !recordingForActivity) return
        try {
            const entries = Object.entries(attendanceDraft).map(([user_id, present]) => ({ user_id, present }))
            await youthProgramApi.recordAttendance(slug, recordingForActivity, entries)
            setRecordingForActivity(null)
            setAttendanceDraft({})
            await loadActivities()
            alert('Attendance saved')
        } catch (e: any) {
            alert(e?.message || 'Failed')
        }
    }

    const sendChat = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!slug || !draft.trim() || sending) return
        setSending(true)
        setChatError('')
        try {
            const m = await youthProgramApi.sendMessage(slug, draft.trim())
            setMessages(prev => [...prev, m])
            setDraft('')
        } catch (e: any) {
            setChatError(e?.message || 'Failed to send.')
        } finally {
            setSending(false)
        }
    }

    const deleteChat = async (id: string) => {
        if (!slug) return
        if (!confirm('Delete this message?')) return
        try {
            await youthProgramApi.deleteMessage(slug, id)
            setMessages(prev => prev.filter(m => m.id !== id))
        } catch (e: any) {
            setChatError(e?.message || 'Failed to delete.')
        }
    }

    // ── Loading / guards ───────────────────────────────────────────────────
    if (loading || !authChecked) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center bg-neutral-50">
                <Loader2 className="w-10 h-10 animate-spin text-[#140152]" />
            </div>
        )
    }

    if (!isLoggedIn) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center bg-neutral-50 text-center p-8">
                <div className="w-16 h-16 bg-[#140152] rounded-full flex items-center justify-center mb-4">
                    <Lock className="w-8 h-8 text-[#f5bb00]" />
                </div>
                <p className="text-2xl font-black text-[#140152] mb-2">Sign in to view your dashboard</p>
                <p className="text-gray-500 mb-6">This is a members-only area for program participants.</p>
                <Link href={`/auth/login?next=/youth/${slug}/dashboard`} className="inline-flex items-center gap-2 bg-[#140152] text-white font-bold px-6 py-3 rounded-full">
                    Sign In
                </Link>
            </div>
        )
    }

    if (notFound || !program) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center bg-neutral-50 text-center p-8">
                <p className="text-2xl font-black text-[#140152] mb-2">Program not found</p>
                <Link href="/youth" className="inline-flex items-center gap-2 bg-[#140152] text-white font-bold px-6 py-3 rounded-full mt-4">
                    <ArrowLeft className="w-4 h-4" /> Back to Youth Ministry
                </Link>
            </div>
        )
    }

    if (forbidden) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center bg-neutral-50 text-center p-8">
                <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-4">
                    <Lock className="w-8 h-8 text-amber-700" />
                </div>
                <p className="text-2xl font-black text-[#140152] mb-2">Not a member yet</p>
                <p className="text-gray-500 mb-6 max-w-md">
                    You haven&apos;t been approved into <strong>{program.title}</strong> yet. Submit a request and the coordinator will get back to you.
                </p>
                <div className="flex gap-3 flex-wrap justify-center">
                    <Link href={`/youth/${program.slug}#join`} className="inline-flex items-center gap-2 bg-[#140152] text-white font-bold px-6 py-3 rounded-full">
                        Request to Join <ChevronRight className="w-4 h-4" />
                    </Link>
                    <Link href={`/youth/${program.slug}`} className="inline-flex items-center gap-2 bg-white border border-gray-300 text-[#140152] font-bold px-6 py-3 rounded-full">
                        Program overview
                    </Link>
                </div>
            </div>
        )
    }

    const HeroIcon = getIcon(program.icon)
    const announcements = program.announcements || []
    const resources = program.resources || []
    const schedule = program.schedule || []

    return (
        <div className="min-h-screen bg-neutral-50">
            {/* Header strip */}
            <div className="bg-gradient-to-br from-[#0a0028] via-[#140152] to-[#0a0028] text-white">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
                    <Link href={`/youth/${program.slug}`} className="inline-flex items-center gap-2 text-white/70 hover:text-[#f5bb00] text-sm font-bold mb-5 transition-colors">
                        <ArrowLeft className="w-4 h-4" /> Program overview
                    </Link>
                    <div className="flex items-center gap-4 flex-wrap">
                        <div className="w-14 h-14 rounded-2xl bg-[#f5bb00]/20 flex items-center justify-center backdrop-blur-sm border border-[#f5bb00]/30">
                            <HeroIcon className="w-7 h-7 text-[#f5bb00]" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-[#f5bb00] mb-1 inline-flex items-center gap-1.5">
                                <LayoutDashboard className="w-3 h-3" /> Member Dashboard
                            </p>
                            <h1 className="text-2xl md:text-4xl font-black leading-tight truncate">{program.title}</h1>
                        </div>
                        {(membership?.is_coordinator || membership?.is_admin) && (
                            <span className="inline-flex items-center gap-1.5 bg-[#f5bb00]/20 border border-[#f5bb00]/30 text-[#f5bb00] text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full">
                                <Crown className="w-3.5 h-3.5" /> {membership.is_admin ? 'Admin' : 'Coordinator'}
                            </span>
                        )}
                    </div>

                    {/* Tabs */}
                    <div className="mt-7 flex gap-1 overflow-x-auto pb-1">
                        {(() => {
                            const baseTabs: { id: Tab; label: string; icon: any }[] = [
                                { id: 'overview', label: 'Overview', icon: Home },
                                { id: 'chat', label: 'Chat', icon: MessageCircle },
                                { id: 'activities', label: 'Activities', icon: CalendarPlus },
                                { id: 'attendance', label: 'My Attendance', icon: ClipboardCheck },
                                { id: 'members', label: 'Members', icon: Users },
                            ]
                            if (membership?.is_coordinator || membership?.is_admin) {
                                baseTabs.push({ id: 'coord', label: 'Coordinator', icon: Crown })
                            }
                            return baseTabs
                        })().map(t => (
                            <button
                                key={t.id}
                                onClick={() => setTab(t.id)}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm whitespace-nowrap transition-all ${
                                    tab === t.id
                                        ? 'bg-[#f5bb00] text-[#140152] shadow-lg'
                                        : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
                                }`}
                            >
                                <t.icon className="w-4 h-4" /> {t.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10">
                <AnimatePresence mode="wait">
                    {/* ─── Overview tab ──────────────────────────────────────────── */}
                    {tab === 'overview' && (
                        <motion.div
                            key="overview"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            className="space-y-8"
                        >
                            {/* Announcements */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Megaphone className="w-5 h-5 text-[#140152]" />
                                        Announcements
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {announcements.length === 0 ? (
                                        <div className="text-center py-10 text-gray-500">
                                            <p className="font-bold">No announcements yet.</p>
                                            <p className="text-sm mt-1">The coordinator posts updates and reminders here.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {announcements.map((a, i) => (
                                                <div key={i} className={`p-4 rounded-xl border ${a.urgent ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'}`}>
                                                    <div className="flex items-start justify-between gap-3 mb-1">
                                                        <p className={`font-black ${a.urgent ? 'text-red-700' : 'text-[#140152]'}`}>{a.title}</p>
                                                        {a.date && <span className="text-xs text-gray-500 shrink-0">{new Date(a.date).toLocaleDateString()}</span>}
                                                    </div>
                                                    {a.body && <p className={`text-sm leading-relaxed ${a.urgent ? 'text-red-800/90' : 'text-gray-700'}`}>{a.body}</p>}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            <div className="grid lg:grid-cols-2 gap-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Calendar className="w-5 h-5 text-[#140152]" /> When We Meet
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        {schedule.length === 0 ? (
                                            <p className="text-gray-500 text-sm text-center py-6">No schedule set yet.</p>
                                        ) : (
                                            <div className="space-y-3">
                                                {schedule.map((s, i) => (
                                                    <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
                                                        <div className="shrink-0 w-12 h-12 rounded-lg bg-[#140152] text-white flex flex-col items-center justify-center font-black text-[10px] leading-tight text-center px-1">
                                                            {s.day}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            {s.time && <p className="text-[10px] font-bold uppercase tracking-wider text-[#f5bb00] mb-0.5">{s.time}</p>}
                                                            {s.title && <p className="font-bold text-[#140152] text-sm leading-tight">{s.title}</p>}
                                                            {s.description && <p className="text-xs text-gray-600 mt-1 leading-relaxed">{s.description}</p>}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <BookOpen className="w-5 h-5 text-[#140152]" /> Resources
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        {resources.length === 0 ? (
                                            <p className="text-gray-500 text-sm text-center py-6">No resources uploaded yet.</p>
                                        ) : (
                                            <div className="space-y-2">
                                                {resources.map((r, i) => {
                                                    const Icon = r.type === 'video' ? Play : r.type === 'pdf' ? Download : ExternalLink
                                                    return (
                                                        <a key={i} href={r.url} target="_blank" rel="noopener noreferrer"
                                                            className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100 hover:border-[#f5bb00] hover:bg-[#fbf5e6] transition-colors group">
                                                            <div className="w-10 h-10 rounded-xl bg-[#140152] text-[#f5bb00] flex items-center justify-center shrink-0">
                                                                <Icon className="w-5 h-5" />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="font-bold text-[#140152] text-sm truncate group-hover:underline">{r.title}</p>
                                                                {r.meta && <p className="text-xs text-gray-500">{r.meta}</p>}
                                                            </div>
                                                            <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-[#140152] shrink-0" />
                                                        </a>
                                                    )
                                                })}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>
                        </motion.div>
                    )}

                    {/* ─── Chat tab ──────────────────────────────────────────────── */}
                    {tab === 'chat' && (
                        <motion.div
                            key="chat"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                        >
                            <Card className="flex flex-col h-[calc(100vh-22rem)] min-h-[480px]">
                                <CardHeader className="border-b border-gray-100">
                                    <CardTitle className="flex items-center gap-2">
                                        <MessageCircle className="w-5 h-5 text-[#140152]" />
                                        Program Chat
                                        <span className="text-xs font-normal text-gray-500 ml-auto">Auto-refreshes every 15s</span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="flex-1 overflow-y-auto p-5 space-y-3 bg-neutral-50">
                                    {chatError && (
                                        <div className="text-center text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">{chatError}</div>
                                    )}
                                    {messages.length === 0 && !chatError ? (
                                        <div className="text-center py-12 text-gray-500">
                                            <MessageCircle className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                                            <p className="font-bold">No messages yet.</p>
                                            <p className="text-sm mt-1">Be the first to say something!</p>
                                        </div>
                                    ) : (
                                        messages.map(m => (
                                            <div key={m.id} className={`flex items-end gap-2 ${m.is_mine ? 'flex-row-reverse' : ''}`}>
                                                {m.user_avatar_url ? (
                                                    <img src={m.user_avatar_url} alt={m.user_name} className="w-8 h-8 rounded-full object-cover shrink-0" />
                                                ) : (
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${m.is_mine ? 'bg-[#f5bb00] text-[#140152]' : 'bg-[#140152] text-[#f5bb00]'}`}>
                                                        {initials(m.user_name)}
                                                    </div>
                                                )}
                                                <div className={`max-w-[75%] flex flex-col ${m.is_mine ? 'items-end' : 'items-start'}`}>
                                                    {!m.is_mine && (
                                                        <p className="text-[10px] font-bold text-gray-500 mb-0.5 px-1">{m.user_name}</p>
                                                    )}
                                                    <div className={`rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-words ${
                                                        m.is_mine
                                                            ? 'bg-[#140152] text-white rounded-br-md'
                                                            : 'bg-white text-gray-800 border border-gray-200 rounded-bl-md'
                                                    }`}>
                                                        {m.body}
                                                    </div>
                                                    <div className="flex items-center gap-2 mt-0.5 px-1">
                                                        <p className="text-[10px] text-gray-400">{relativeTime(m.created_at)}</p>
                                                        {m.can_delete && (
                                                            <button onClick={() => deleteChat(m.id)} className="text-[10px] text-red-400 hover:text-red-600 inline-flex items-center gap-0.5">
                                                                <Trash2 className="w-3 h-3" /> delete
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                    <div ref={chatBottomRef} />
                                </CardContent>
                                <div className="border-t border-gray-100 p-3 bg-white">
                                    <form onSubmit={sendChat} className="flex items-end gap-2">
                                        <textarea
                                            value={draft}
                                            onChange={(e) => setDraft(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && !e.shiftKey) {
                                                    e.preventDefault()
                                                    sendChat(e as any)
                                                }
                                            }}
                                            rows={1}
                                            placeholder={`Message ${program.title}…`}
                                            className="flex-1 resize-none border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#140152]/30 bg-gray-50 text-gray-900"
                                            maxLength={4000}
                                        />
                                        <button
                                            type="submit"
                                            disabled={!draft.trim() || sending}
                                            className="bg-[#140152] text-white p-3 rounded-xl hover:bg-[#1d0175] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                            aria-label="Send"
                                        >
                                            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                        </button>
                                    </form>
                                </div>
                            </Card>
                        </motion.div>
                    )}

                    {/* ─── Members tab ───────────────────────────────────────────── */}
                    {tab === 'members' && (
                        <motion.div
                            key="members"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                        >
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Users className="w-5 h-5 text-[#140152]" /> Members ({members.length})
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {membersLoading ? (
                                        <div className="flex items-center justify-center py-10">
                                            <Loader2 className="w-6 h-6 animate-spin text-[#140152]" />
                                        </div>
                                    ) : members.length === 0 ? (
                                        <p className="text-center text-gray-500 py-10">No approved members yet.</p>
                                    ) : (
                                        <div className="space-y-2">
                                            {members.map(m => (
                                                <div key={m.user_id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
                                                    {m.avatar_url ? (
                                                        <img src={m.avatar_url} alt={m.name} className="w-10 h-10 rounded-full object-cover shrink-0" />
                                                    ) : (
                                                        <div className="w-10 h-10 rounded-full bg-[#140152] text-[#f5bb00] flex items-center justify-center font-black text-xs shrink-0">
                                                            {initials(m.name)}
                                                        </div>
                                                    )}
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-bold text-[#140152] truncate">{m.name}</p>
                                                        {m.email && <p className="text-xs text-gray-500 truncate">{m.email}</p>}
                                                    </div>
                                                    {m.role === 'coordinator' && (
                                                        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-[#f5bb00]/20 text-[#140152] border border-[#f5bb00]/40 px-2.5 py-1 rounded-full shrink-0">
                                                            <ShieldCheck className="w-3 h-3" /> Coordinator
                                                        </span>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </motion.div>
                    )}

                    {/* ─── Activities tab ────────────────────────────────────── */}
                    {tab === 'activities' && (
                        <motion.div
                            key="activities"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            className="space-y-5"
                        >
                            {(membership?.is_coordinator || membership?.is_admin) && (
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between">
                                        <CardTitle className="flex items-center gap-2">
                                            <CalendarPlus className="w-5 h-5 text-[#140152]" /> Create activity
                                        </CardTitle>
                                        <button onClick={() => setShowActivityForm(!showActivityForm)} className="text-xs font-bold text-[#140152] hover:text-[#1d0175] inline-flex items-center gap-1">
                                            {showActivityForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                                            {showActivityForm ? 'Cancel' : 'New activity'}
                                        </button>
                                    </CardHeader>
                                    {showActivityForm && (
                                        <CardContent>
                                            <form onSubmit={saveActivity} className="space-y-3">
                                                <input value={newActivity.title} onChange={e => setNewActivity({ ...newActivity, title: e.target.value })} placeholder="Title" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900" required />
                                                <textarea value={newActivity.description} onChange={e => setNewActivity({ ...newActivity, description: e.target.value })} placeholder="Description (optional)" rows={2} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900" />
                                                <div className="grid md:grid-cols-2 gap-3">
                                                    <input value={newActivity.activity_type} onChange={e => setNewActivity({ ...newActivity, activity_type: e.target.value })} placeholder="Type (workshop, meetup, retreat...)" className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900" />
                                                    <input value={newActivity.location} onChange={e => setNewActivity({ ...newActivity, location: e.target.value })} placeholder="Location" className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900" />
                                                </div>
                                                <div className="grid md:grid-cols-2 gap-3">
                                                    <div>
                                                        <label className="text-xs font-bold text-gray-600">Start</label>
                                                        <input type="datetime-local" value={newActivity.start_at} onChange={e => setNewActivity({ ...newActivity, start_at: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900" required />
                                                    </div>
                                                    <div>
                                                        <label className="text-xs font-bold text-gray-600">End (optional)</label>
                                                        <input type="datetime-local" value={newActivity.end_at} onChange={e => setNewActivity({ ...newActivity, end_at: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900" />
                                                    </div>
                                                </div>
                                                <button type="submit" disabled={savingActivity} className="bg-[#140152] text-white font-bold px-5 py-2.5 rounded-lg hover:bg-[#1d0175] disabled:opacity-50">
                                                    {savingActivity ? <Loader2 className="w-4 h-4 animate-spin inline" /> : 'Create activity'}
                                                </button>
                                            </form>
                                        </CardContent>
                                    )}
                                </Card>
                            )}

                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <ActivityIcon className="w-5 h-5 text-[#140152]" /> Activities ({activities.length})
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {activitiesLoading ? (
                                        <div className="flex items-center justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-[#140152]" /></div>
                                    ) : activities.length === 0 ? (
                                        <p className="text-center text-gray-500 py-10 text-sm">No activities yet. {(membership?.is_coordinator || membership?.is_admin) && 'Create one above.'}</p>
                                    ) : (
                                        <div className="space-y-3">
                                            {activities.map(a => {
                                                const dt = new Date(a.start_at)
                                                const dtStr = dt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) + ' · ' + dt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
                                                return (
                                                    <div key={a.id} className="p-4 rounded-xl border border-gray-200 bg-white">
                                                        <div className="flex items-start justify-between gap-3 mb-2">
                                                            <div className="min-w-0">
                                                                <p className="font-black text-[#140152] leading-tight">{a.title}</p>
                                                                <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                                                                    <span className="inline-flex items-center gap-1"><Clock className="w-3 h-3" /> {dtStr}</span>
                                                                    {a.location && <span className="inline-flex items-center gap-1"><MapPin className="w-3 h-3" /> {a.location}</span>}
                                                                    {a.activity_type && <span className="text-[10px] font-bold uppercase tracking-wider bg-[#7c3aed]/10 text-[#7c3aed] px-1.5 py-0.5 rounded">{a.activity_type}</span>}
                                                                </div>
                                                            </div>
                                                            {a.can_manage && (
                                                                <div className="flex items-center gap-1 shrink-0">
                                                                    <button onClick={() => openAttendanceRecorder(a.id)} className="text-xs font-bold text-[#140152] hover:bg-gray-100 px-2 py-1 rounded inline-flex items-center gap-1">
                                                                        <ClipboardCheck className="w-3.5 h-3.5" /> Attendance
                                                                    </button>
                                                                    <button onClick={() => removeActivity(a.id)} className="text-red-500 hover:bg-red-50 p-1 rounded"><Trash2 className="w-3.5 h-3.5" /></button>
                                                                </div>
                                                            )}
                                                        </div>
                                                        {a.description && <p className="text-sm text-gray-700 leading-relaxed mt-2 mb-3">{a.description}</p>}
                                                        <div className="flex items-center justify-between flex-wrap gap-3 pt-3 border-t border-gray-100 mt-2">
                                                            <div className="text-xs text-gray-500 flex items-center gap-3">
                                                                <span>{a.rsvp_yes} going</span>
                                                                {a.rsvp_maybe > 0 && <span>{a.rsvp_maybe} maybe</span>}
                                                            </div>
                                                            <div className="flex gap-1">
                                                                {(['yes', 'maybe', 'no'] as const).map(s => (
                                                                    <button
                                                                        key={s}
                                                                        onClick={() => setRsvp(a.id, s)}
                                                                        className={`text-xs font-bold px-3 py-1.5 rounded-lg uppercase tracking-wide transition-colors ${
                                                                            a.my_rsvp === s
                                                                                ? s === 'yes' ? 'bg-emerald-500 text-white' : s === 'maybe' ? 'bg-amber-400 text-white' : 'bg-gray-400 text-white'
                                                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                                        }`}
                                                                    >
                                                                        {s}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </motion.div>
                    )}

                    {/* ─── Attendance tab ────────────────────────────────────── */}
                    {tab === 'attendance' && (
                        <motion.div
                            key="attendance"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            className="space-y-5"
                        >
                            {attendanceLoading ? (
                                <div className="flex items-center justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-[#140152]" /></div>
                            ) : !attendanceSummary || attendanceSummary.total_recorded === 0 ? (
                                <Card>
                                    <CardContent className="p-10 text-center">
                                        <ClipboardCheck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                        <p className="font-bold text-[#140152]">No attendance recorded yet</p>
                                        <p className="text-sm text-gray-500 mt-1">Once you attend an activity and the coordinator records it, your history shows here.</p>
                                    </CardContent>
                                </Card>
                            ) : (
                                <>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <Card><CardContent className="p-5"><p className="text-xs uppercase font-bold tracking-wider text-gray-500">Total recorded</p><p className="text-3xl font-black text-[#140152] mt-1">{attendanceSummary.total_recorded}</p></CardContent></Card>
                                        <Card><CardContent className="p-5"><p className="text-xs uppercase font-bold tracking-wider text-gray-500">Present</p><p className="text-3xl font-black text-emerald-500 mt-1">{attendanceSummary.present_count}</p></CardContent></Card>
                                        <Card><CardContent className="p-5"><p className="text-xs uppercase font-bold tracking-wider text-gray-500">Rate</p><p className="text-3xl font-black text-[#7c3aed] mt-1">{Math.round(attendanceSummary.rate * 100)}%</p></CardContent></Card>
                                        <Card><CardContent className="p-5"><p className="text-xs uppercase font-bold tracking-wider text-gray-500">Streak</p><p className="text-3xl font-black text-[#f5bb00] mt-1 inline-flex items-center gap-1">{attendanceSummary.streak}<Flame className="w-6 h-6" /></p></CardContent></Card>
                                    </div>
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2"><Award className="w-5 h-5 text-[#140152]" /> Recent history</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="space-y-2">
                                                {attendanceSummary.history.map(h => (
                                                    <div key={h.activity_id + h.recorded_at} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100">
                                                        <div className="min-w-0">
                                                            <p className="font-bold text-[#140152] truncate">{h.activity_title}</p>
                                                            <p className="text-xs text-gray-500">{new Date(h.activity_start_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                                                        </div>
                                                        {h.present ? (
                                                            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full"><Check className="w-3 h-3" /> Present</span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1 text-xs font-bold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full"><X className="w-3 h-3" /> Absent</span>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </CardContent>
                                    </Card>
                                </>
                            )}
                        </motion.div>
                    )}

                    {/* ─── Coordinator tab ───────────────────────────────────── */}
                    {tab === 'coord' && (membership?.is_coordinator || membership?.is_admin) && (
                        <motion.div
                            key="coord"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            className="space-y-6"
                        >
                            {/* Pending approvals */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <UserPlus className="w-5 h-5 text-[#140152]" /> Pending join requests
                                        {pending.length > 0 && <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold">{pending.length}</span>}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {pendingLoading ? (
                                        <div className="flex items-center justify-center py-6"><Loader2 className="w-6 h-6 animate-spin text-[#140152]" /></div>
                                    ) : pending.length === 0 ? (
                                        <p className="text-center text-gray-500 py-6 text-sm">No pending requests.</p>
                                    ) : (
                                        <div className="space-y-2">
                                            {pending.map(pm => (
                                                <div key={pm.request_id} className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
                                                    <div className="w-10 h-10 rounded-full bg-[#140152] text-[#f5bb00] flex items-center justify-center font-black text-xs shrink-0">{initials(pm.name)}</div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-bold text-[#140152]">{pm.name}</p>
                                                        <p className="text-xs text-gray-500">{pm.email}</p>
                                                        {pm.note && <p className="text-sm text-gray-700 mt-1 italic">&ldquo;{pm.note}&rdquo;</p>}
                                                    </div>
                                                    <div className="flex gap-1 shrink-0">
                                                        <button onClick={() => approvePending(pm.request_id)} className="bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-emerald-600 inline-flex items-center gap-1"><UserCheck className="w-3.5 h-3.5" /> Approve</button>
                                                        <button onClick={() => rejectPending(pm.request_id)} className="bg-gray-200 text-gray-700 text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-gray-300 inline-flex items-center gap-1"><UserX className="w-3.5 h-3.5" /> Reject</button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            <div className="grid lg:grid-cols-2 gap-6">
                                {/* Post announcement */}
                                <Card>
                                    <CardHeader><CardTitle className="flex items-center gap-2"><Megaphone className="w-5 h-5 text-[#140152]" /> Post announcement</CardTitle></CardHeader>
                                    <CardContent>
                                        <form onSubmit={submitAnnouncement} className="space-y-3">
                                            <input value={announcementForm.title} onChange={e => setAnnouncementForm({ ...announcementForm, title: e.target.value })} placeholder="Title" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900" required />
                                            <textarea value={announcementForm.body} onChange={e => setAnnouncementForm({ ...announcementForm, body: e.target.value })} placeholder="Body" rows={3} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900" />
                                            <label className="flex items-center gap-2 text-sm">
                                                <input type="checkbox" checked={announcementForm.urgent} onChange={e => setAnnouncementForm({ ...announcementForm, urgent: e.target.checked })} />
                                                <span className="font-bold text-red-700">Mark urgent</span>
                                            </label>
                                            <button type="submit" disabled={coordBusy} className="bg-[#140152] text-white font-bold px-5 py-2.5 rounded-lg hover:bg-[#1d0175] disabled:opacity-50">Post</button>
                                        </form>
                                        {(program.announcements || []).length > 0 && (
                                            <div className="mt-5 pt-5 border-t border-gray-100 space-y-2">
                                                <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Existing — click to delete</p>
                                                {(program.announcements || []).map((a: any, i: number) => (
                                                    <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-gray-50 text-sm">
                                                        <span className="truncate text-[#140152] font-bold">{a.title}</span>
                                                        <button onClick={() => removeAnnouncement(i)} className="text-red-500 hover:bg-red-50 p-1 rounded shrink-0"><Trash2 className="w-3.5 h-3.5" /></button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>

                                {/* Add resource */}
                                <Card>
                                    <CardHeader><CardTitle className="flex items-center gap-2"><BookOpen className="w-5 h-5 text-[#140152]" /> Add resource</CardTitle></CardHeader>
                                    <CardContent>
                                        <form onSubmit={submitResource} className="space-y-3">
                                            <input value={resourceForm.title} onChange={e => setResourceForm({ ...resourceForm, title: e.target.value })} placeholder="Title" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900" required />
                                            <input value={resourceForm.url} onChange={e => setResourceForm({ ...resourceForm, url: e.target.value })} placeholder="URL" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900" required />
                                            <div className="grid grid-cols-2 gap-3">
                                                <select value={resourceForm.type} onChange={e => setResourceForm({ ...resourceForm, type: e.target.value })} className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900">
                                                    <option value="link">Link</option>
                                                    <option value="pdf">PDF</option>
                                                    <option value="video">Video</option>
                                                </select>
                                                <input value={resourceForm.meta} onChange={e => setResourceForm({ ...resourceForm, meta: e.target.value })} placeholder="Meta (e.g. 12 pages)" className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900" />
                                            </div>
                                            <button type="submit" disabled={coordBusy} className="bg-[#140152] text-white font-bold px-5 py-2.5 rounded-lg hover:bg-[#1d0175] disabled:opacity-50">Add</button>
                                        </form>
                                        {(program.resources || []).length > 0 && (
                                            <div className="mt-5 pt-5 border-t border-gray-100 space-y-2">
                                                <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Existing — click to delete</p>
                                                {(program.resources || []).map((r: any, i: number) => (
                                                    <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-gray-50 text-sm">
                                                        <span className="truncate text-[#140152] font-bold">{r.title}</span>
                                                        <button onClick={() => removeResource(i)} className="text-red-500 hover:bg-red-50 p-1 rounded shrink-0"><Trash2 className="w-3.5 h-3.5" /></button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Attendance recorder modal */}
            {recordingForActivity && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setRecordingForActivity(null)}>
                    <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-black text-[#140152] inline-flex items-center gap-2"><ClipboardCheck className="w-5 h-5" /> Record attendance</h3>
                            <button onClick={() => setRecordingForActivity(null)} className="p-1 hover:bg-gray-100 rounded"><X className="w-4 h-4" /></button>
                        </div>
                        {recordingMembers.length === 0 ? (
                            <p className="text-center text-gray-500 py-6">No members yet.</p>
                        ) : (
                            <div className="space-y-1.5">
                                {recordingMembers.map(m => (
                                    <label key={m.user_id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={!!attendanceDraft[m.user_id]}
                                            onChange={e => setAttendanceDraft(prev => ({ ...prev, [m.user_id]: e.target.checked }))}
                                            className="w-4 h-4"
                                        />
                                        <div className="w-8 h-8 rounded-full bg-[#140152] text-[#f5bb00] flex items-center justify-center font-black text-[10px] shrink-0">{initials(m.name)}</div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-sm text-[#140152] truncate">{m.name}</p>
                                            {m.email && <p className="text-xs text-gray-500 truncate">{m.email}</p>}
                                        </div>
                                        {m.user_id in recordingExisting && (
                                            <span className="text-[10px] text-gray-400">{recordingExisting[m.user_id] ? '(was present)' : '(was absent)'}</span>
                                        )}
                                    </label>
                                ))}
                            </div>
                        )}
                        <div className="flex justify-end gap-2 mt-5 pt-4 border-t border-gray-100">
                            <button onClick={() => setRecordingForActivity(null)} className="px-4 py-2 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                            <button onClick={saveAttendance} className="bg-[#140152] text-white text-sm font-bold px-5 py-2 rounded-lg hover:bg-[#1d0175]">Save attendance</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
