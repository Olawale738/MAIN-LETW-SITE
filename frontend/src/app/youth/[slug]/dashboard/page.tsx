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
} from 'lucide-react'
import * as LucideIcons from 'lucide-react'
import {
    youthProgramApi, YouthProgram, YouthProgramChatMessage,
    YouthProgramMember, YouthProgramMembershipStatus,
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

type Tab = 'overview' | 'chat' | 'members'

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
                        {([
                            { id: 'overview', label: 'Overview', icon: Home },
                            { id: 'chat', label: 'Chat', icon: MessageCircle },
                            { id: 'members', label: 'Members', icon: Users },
                        ] as { id: Tab; label: string; icon: any }[]).map(t => (
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
                </AnimatePresence>
            </div>
        </div>
    )
}
