'use client'
import React, { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import Link from 'next/link'
import {
    Users, MessageSquare, Bell, Home, Send, ArrowLeft,
    Loader2, AlertCircle, CheckCircle, XCircle, Crown,
    Pin, Plus, Sparkles,
} from 'lucide-react'
import {
    ministriesApi, Ministry, MinistryMember,
    MinistryAnnouncement, MinistryMessage,
} from '@/lib/ministries-api'

type Tab = 'home' | 'chat' | 'announcements' | 'members'

export default function MinistryDashboardPage() {
    const params = useParams()
    const router = useRouter()
    const slug = params?.slug as string

    const [ministry, setMinistry] = useState<Ministry | null>(null)
    const [tab, setTab] = useState<Tab>('home')
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [me, setMe] = useState<{ id: string; name: string } | null>(null)

    // Data
    const [members, setMembers] = useState<MinistryMember[]>([])
    const [announcements, setAnnouncements] = useState<MinistryAnnouncement[]>([])
    const [messages, setMessages] = useState<MinistryMessage[]>([])

    // Chat
    const [draft, setDraft] = useState('')
    const [sending, setSending] = useState(false)
    const chatEndRef = useRef<HTMLDivElement>(null)

    // Announcement form
    const [showAnnForm, setShowAnnForm] = useState(false)
    const [annTitle, setAnnTitle] = useState('')
    const [annBody, setAnnBody] = useState('')
    const [annPinned, setAnnPinned] = useState(false)
    const [postingAnn, setPostingAnn] = useState(false)

    const isCoordinator = members.find(m => m.user_id === me?.id)?.is_coordinator
    const isAdmin = typeof window !== 'undefined' && localStorage.getItem('userRole') === 'admin'
    const canManage = isCoordinator || isAdmin

    useEffect(() => {
        if (typeof window !== 'undefined' && !localStorage.getItem('isLoggedIn')) {
            router.push(`/auth/login?next=/ministries/${slug}/dashboard`)
            return
        }
        setMe({
            id: localStorage.getItem('userId') || '',
            name: localStorage.getItem('userName') || 'You',
        })

        if (!slug) return

        ;(async () => {
            try {
                const [m, mems, anns, msgs] = await Promise.all([
                    ministriesApi.get(slug),
                    ministriesApi.listMembers(slug).catch(() => []),
                    ministriesApi.listAnnouncements(slug).catch(() => []),
                    ministriesApi.listMessages(slug).catch(() => []),
                ])
                setMinistry(m)
                setMembers(mems)
                setAnnouncements(anns)
                setMessages(msgs)
            } catch (e) {
                setError((e as Error).message)
            } finally {
                setLoading(false)
            }
        })()
    }, [slug, router])

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages, tab])

    const sendMessage = async () => {
        if (!draft.trim() || sending) return
        setSending(true)
        try {
            const newMsg = await ministriesApi.sendMessage(slug, draft.trim())
            setMessages(prev => [...prev, newMsg])
            setDraft('')
        } catch (e) {
            alert((e as Error).message)
        } finally {
            setSending(false)
        }
    }

    const postAnnouncement = async () => {
        if (!annTitle.trim() || !annBody.trim()) return
        setPostingAnn(true)
        try {
            const newAnn = await ministriesApi.createAnnouncement(slug, {
                title: annTitle, body: annBody, is_pinned: annPinned,
            })
            setAnnouncements(prev => [newAnn, ...prev])
            setAnnTitle(''); setAnnBody(''); setAnnPinned(false)
            setShowAnnForm(false)
        } catch (e) {
            alert((e as Error).message)
        } finally {
            setPostingAnn(false)
        }
    }

    const approveMember = async (userId: string) => {
        try {
            await ministriesApi.approveMember(slug, userId)
            const updated = await ministriesApi.listMembers(slug)
            setMembers(updated)
        } catch (e) { alert((e as Error).message) }
    }

    const rejectMember = async (userId: string) => {
        if (!confirm('Reject this member request?')) return
        try {
            await ministriesApi.rejectMember(slug, userId)
            const updated = await ministriesApi.listMembers(slug)
            setMembers(updated)
        } catch (e) { alert((e as Error).message) }
    }

    const toggleCoordinator = async (userId: string, currentlyIs: boolean) => {
        try {
            await ministriesApi.assignCoordinator(slug, userId, !currentlyIs)
            const updated = await ministriesApi.listMembers(slug)
            setMembers(updated)
        } catch (e) { alert((e as Error).message) }
    }

    const removeMember = async (userId: string, name: string) => {
        if (!confirm(`Remove ${name} from ${ministry?.name}?`)) return
        try {
            await ministriesApi.removeMember(slug, userId)
            setMembers(prev => prev.filter(m => m.user_id !== userId))
        } catch (e) { alert((e as Error).message) }
    }

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center">
            <Loader2 className="w-12 h-12 animate-spin text-[#140152]" />
        </div>
    )

    if (error || !ministry) return (
        <div className="min-h-screen flex flex-col items-center justify-center p-8">
            <AlertCircle className="w-16 h-16 text-red-400 mb-4" />
            <p className="text-gray-700 mb-4">{error || 'Ministry not found'}</p>
            <Link href="/" className="bg-[#140152] text-white px-6 py-3 rounded-xl font-bold">Home</Link>
        </div>
    )

    const bgGradient = `linear-gradient(135deg, ${ministry.color}, ${ministry.secondary_color})`
    const activeMembers = members.filter(m => m.status === 'active')
    const pendingMembers = members.filter(m => m.status === 'pending')

    const TABS: { id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
        { id: 'home',          label: 'Home',          icon: Home },
        { id: 'chat',          label: 'Chat',          icon: MessageSquare },
        { id: 'announcements', label: 'Announcements', icon: Bell },
        { id: 'members',       label: 'Members',       icon: Users },
    ]

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="relative" style={{ background: bgGradient }}>
                {ministry.hero_image_url && (
                    <img src={ministry.hero_image_url} alt="" className="absolute inset-0 w-full h-full object-cover opacity-30" />
                )}
                <div className="absolute inset-0 bg-black/40" />
                <div className="relative max-w-6xl mx-auto px-6 py-8">
                    <Link href={`/ministries/${slug}`} className="text-white/80 hover:text-white text-sm flex items-center gap-2 mb-4">
                        <ArrowLeft className="w-4 h-4" /> Back to {ministry.name}
                    </Link>
                    <div className="flex items-center gap-4">
                        <div className="text-5xl">{ministry.emoji || '✨'}</div>
                        <div>
                            <h1 className="text-3xl font-black text-white">{ministry.name}</h1>
                            <p className="text-white/80 text-sm">Member Dashboard</p>
                        </div>
                        {canManage && (
                            <div className="ml-auto bg-[#f5bb00] text-[#140152] px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                                <Crown className="w-3 h-3" /> {isAdmin ? 'Admin' : 'Coordinator'}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="bg-white border-b border-gray-100 sticky top-0 z-20">
                <div className="max-w-6xl mx-auto px-6 flex gap-1 overflow-x-auto">
                    {TABS.map(t => {
                        const isActive = tab === t.id
                        const Icon = t.icon
                        const badge = t.id === 'members' && pendingMembers.length > 0
                            ? pendingMembers.length
                            : undefined
                        return (
                            <button key={t.id} onClick={() => setTab(t.id)}
                                className={`flex items-center gap-2 px-5 py-4 text-sm font-bold border-b-2 transition-all whitespace-nowrap ${
                                    isActive
                                        ? 'border-current'
                                        : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                                style={isActive ? { color: ministry.color } : undefined}>
                                <Icon className="w-4 h-4" />
                                {t.label}
                                {badge !== undefined && (
                                    <span className="bg-red-500 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center">
                                        {badge}
                                    </span>
                                )}
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* Content */}
            <div className="max-w-6xl mx-auto px-6 py-8">
                {tab === 'home' && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                                <Users className="w-8 h-8 mb-3" style={{ color: ministry.color }} />
                                <p className="text-3xl font-black text-gray-900">{activeMembers.length}</p>
                                <p className="text-sm text-gray-500">Active Members</p>
                            </div>
                            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                                <Bell className="w-8 h-8 mb-3" style={{ color: ministry.color }} />
                                <p className="text-3xl font-black text-gray-900">{announcements.length}</p>
                                <p className="text-sm text-gray-500">Announcements</p>
                            </div>
                            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                                <MessageSquare className="w-8 h-8 mb-3" style={{ color: ministry.color }} />
                                <p className="text-3xl font-black text-gray-900">{messages.length}</p>
                                <p className="text-sm text-gray-500">Messages</p>
                            </div>
                        </div>

                        {ministry.description && (
                            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                                <h3 className="font-bold text-gray-900 mb-3">About</h3>
                                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{ministry.description}</p>
                            </div>
                        )}

                        {canManage && pendingMembers.length > 0 && (
                            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
                                <p className="font-bold text-amber-900 mb-2 flex items-center gap-2">
                                    <Bell className="w-5 h-5" /> {pendingMembers.length} Pending Requests
                                </p>
                                <p className="text-sm text-amber-700 mb-4">Review and approve new members in the Members tab.</p>
                                <button onClick={() => setTab('members')}
                                    className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg font-bold text-sm">
                                    Review Now
                                </button>
                            </div>
                        )}
                    </motion.div>
                )}

                {tab === 'chat' && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col" style={{ height: '70vh' }}>
                        <div className="flex-1 overflow-y-auto p-6 space-y-3">
                            {messages.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                                    <MessageSquare className="w-16 h-16 mb-3 opacity-30" />
                                    <p className="font-bold">No messages yet</p>
                                    <p className="text-sm">Be the first to start the conversation!</p>
                                </div>
                            ) : (
                                messages.map((msg, i) => {
                                    const isMine = msg.is_mine
                                    const prev = messages[i - 1]
                                    const showSender = !prev || prev.sender_id !== msg.sender_id
                                    return (
                                        <div key={msg.id} className={`flex gap-2 ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>
                                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0"
                                                style={{ background: showSender ? ministry.color : 'transparent', opacity: showSender ? 1 : 0 }}>
                                                {msg.sender_name.charAt(0).toUpperCase()}
                                            </div>
                                            <div className={`max-w-md ${isMine ? 'items-end' : 'items-start'} flex flex-col`}>
                                                {showSender && !isMine && (
                                                    <p className="text-xs font-bold text-gray-600 mb-1 ml-1">{msg.sender_name}</p>
                                                )}
                                                <div className={`px-4 py-2 rounded-2xl ${
                                                    isMine ? 'rounded-br-sm text-white' : 'bg-gray-100 text-gray-900 rounded-bl-sm'
                                                }`} style={isMine ? { background: bgGradient } : undefined}>
                                                    {msg.content}
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })
                            )}
                            <div ref={chatEndRef} />
                        </div>
                        <div className="border-t border-gray-100 p-4 flex gap-3">
                            <input value={draft} onChange={e => setDraft(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                                placeholder="Type a message..." disabled={sending}
                                className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2"
                                style={{ ['--tw-ring-color' as any]: ministry.color }} />
                            <button onClick={sendMessage} disabled={!draft.trim() || sending}
                                className="px-5 py-3 rounded-xl text-white font-bold disabled:opacity-50 flex items-center gap-2"
                                style={{ background: bgGradient }}>
                                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                Send
                            </button>
                        </div>
                    </motion.div>
                )}

                {tab === 'announcements' && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                        {canManage && (
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                                {!showAnnForm ? (
                                    <button onClick={() => setShowAnnForm(true)}
                                        className="w-full flex items-center justify-center gap-2 py-4 border-2 border-dashed border-gray-200 rounded-xl text-gray-600 hover:border-gray-300 hover:text-gray-800">
                                        <Plus className="w-5 h-5" /> Post New Announcement
                                    </button>
                                ) : (
                                    <div className="space-y-4">
                                        <input value={annTitle} onChange={e => setAnnTitle(e.target.value)}
                                            placeholder="Title" className="w-full px-4 py-3 border border-gray-200 rounded-xl" />
                                        <textarea value={annBody} onChange={e => setAnnBody(e.target.value)}
                                            placeholder="Body" rows={4}
                                            className="w-full px-4 py-3 border border-gray-200 rounded-xl resize-none" />
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input type="checkbox" checked={annPinned} onChange={e => setAnnPinned(e.target.checked)} />
                                            <Pin className="w-4 h-4" /> Pin to top
                                        </label>
                                        <div className="flex gap-3">
                                            <button onClick={() => { setShowAnnForm(false); setAnnTitle(''); setAnnBody('') }}
                                                className="flex-1 py-3 border border-gray-200 rounded-xl font-bold">Cancel</button>
                                            <button onClick={postAnnouncement} disabled={postingAnn || !annTitle.trim() || !annBody.trim()}
                                                className="flex-1 py-3 rounded-xl text-white font-bold disabled:opacity-50 flex items-center justify-center gap-2"
                                                style={{ background: bgGradient }}>
                                                {postingAnn ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                                Post
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {announcements.length === 0 ? (
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
                                <Bell className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                <p className="text-gray-500">No announcements yet</p>
                            </div>
                        ) : (
                            announcements.map(a => (
                                <div key={a.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                                    <div className="flex items-start gap-3">
                                        {a.is_pinned && <Pin className="w-4 h-4 text-amber-500 mt-1.5 flex-shrink-0" />}
                                        <div className="flex-1">
                                            <h3 className="font-bold text-gray-900 text-lg">{a.title}</h3>
                                            <p className="text-xs text-gray-500 mb-3">
                                                By {a.author_name || 'Coordinator'} · {new Date(a.created_at).toLocaleDateString()}
                                            </p>
                                            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{a.body}</p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </motion.div>
                )}

                {tab === 'members' && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                        {/* Pending */}
                        {canManage && pendingMembers.length > 0 && (
                            <div>
                                <h3 className="font-bold text-amber-900 mb-3 flex items-center gap-2">
                                    <Bell className="w-5 h-5" /> Pending Requests ({pendingMembers.length})
                                </h3>
                                <div className="space-y-2">
                                    {pendingMembers.map(m => (
                                        <div key={m.id} className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
                                                style={{ background: ministry.color }}>
                                                {m.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold text-gray-900 truncate">{m.name}</p>
                                                <p className="text-xs text-gray-500 truncate">{m.email}</p>
                                                {m.join_message && <p className="text-xs text-gray-600 mt-1 italic truncate">"{m.join_message}"</p>}
                                            </div>
                                            <div className="flex gap-2 flex-shrink-0">
                                                <button onClick={() => approveMember(m.user_id)}
                                                    className="bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1">
                                                    <CheckCircle className="w-3 h-3" /> Approve
                                                </button>
                                                <button onClick={() => rejectMember(m.user_id)}
                                                    className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-3 py-2 rounded-lg text-xs font-bold">
                                                    <XCircle className="w-3 h-3" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Active */}
                        <div>
                            <h3 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
                                <Users className="w-5 h-5" /> Active Members ({activeMembers.length})
                            </h3>
                            <div className="space-y-2">
                                {activeMembers.length === 0 ? (
                                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center text-gray-500">
                                        No active members yet
                                    </div>
                                ) : (
                                    activeMembers.map(m => (
                                        <div key={m.id} className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center gap-3 shadow-sm">
                                            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
                                                style={{ background: ministry.color }}>
                                                {m.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold text-gray-900 truncate flex items-center gap-2">
                                                    {m.name}
                                                    {m.is_coordinator && (
                                                        <span className="bg-[#f5bb00] text-[#140152] text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                                                            <Crown className="w-2.5 h-2.5" /> Coordinator
                                                        </span>
                                                    )}
                                                </p>
                                                <p className="text-xs text-gray-500 truncate">{m.email}</p>
                                            </div>
                                            {isAdmin && (
                                                <div className="flex gap-2 flex-shrink-0">
                                                    <button onClick={() => toggleCoordinator(m.user_id, m.is_coordinator)}
                                                        className={`text-xs font-bold px-3 py-2 rounded-lg ${
                                                            m.is_coordinator
                                                                ? 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                                                                : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                                                        }`}>
                                                        <Crown className="w-3 h-3 inline mr-1" />
                                                        {m.is_coordinator ? 'Unset' : 'Make Coord'}
                                                    </button>
                                                    <button onClick={() => removeMember(m.user_id, m.name)}
                                                        className="bg-red-50 hover:bg-red-100 text-red-600 px-3 py-2 rounded-lg text-xs font-bold">
                                                        Remove
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    )
}
