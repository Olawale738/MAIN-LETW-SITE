'use client'

import { useEffect, useMemo, useRef, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
    MessageCircle, Send, Plus, Loader2, ArrowLeft, Search,
    Check, CheckCheck, Shield, X
} from 'lucide-react'
import {
    messageApi, type ChatConversation, type ChatConversationDetail,
    type ChatMessage, type ChatParticipant,
} from '@/lib/api'

const BRAND_DARK = '#140152'
const BRAND_GOLD = '#f5bb00'

function formatTime(iso?: string | null) {
    if (!iso) return ''
    const d = new Date(iso)
    const today = new Date()
    const sameDay = d.toDateString() === today.toDateString()
    if (sameDay) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    const diff = (today.getTime() - d.getTime()) / 86400000
    if (diff < 7) return d.toLocaleDateString([], { weekday: 'short' })
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

function initials(name?: string | null) {
    if (!name) return '?'
    return name.split(' ').filter(Boolean).slice(0, 2).map(s => s[0]?.toUpperCase()).join('')
}

export default function MessagesPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#140152]" /></div>}>
            <MessagesContent />
        </Suspense>
    )
}

function MessagesContent() {
    const router = useRouter()
    const params = useSearchParams()
    const wantConv = params.get('c') || undefined

    const [loading, setLoading] = useState(true)
    const [conversations, setConversations] = useState<ChatConversation[]>([])
    const [active, setActive] = useState<ChatConversationDetail | null>(null)
    const [activeId, setActiveId] = useState<string | undefined>(wantConv)
    const [sending, setSending] = useState(false)
    const [draft, setDraft] = useState('')
    const [search, setSearch] = useState('')
    const [showNew, setShowNew] = useState(false)
    const [admins, setAdmins] = useState<ChatParticipant[]>([])
    const [newRecipient, setNewRecipient] = useState<string>('')
    const [newSubject, setNewSubject] = useState('')
    const [newMessage, setNewMessage] = useState('')
    const [me, setMe] = useState<{ id: string; name: string } | null>(null)
    const [peerTyping, setPeerTyping] = useState<{ [convId: string]: boolean }>({})
    const [connStatus, setConnStatus] = useState<'connecting' | 'live' | 'offline'>('connecting')

    const wsRef = useRef<WebSocket | null>(null)
    const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
    const messagesEndRef = useRef<HTMLDivElement | null>(null)
    const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

    /** Initial bootstrap. */
    useEffect(() => {
        if (typeof window === 'undefined') return
        const loggedIn = localStorage.getItem('isLoggedIn')
        if (!loggedIn) { router.push('/auth/login'); return }
        setMe({
            id: localStorage.getItem('userId') || '',
            name: localStorage.getItem('userName') || 'You',
        })

        ;(async () => {
            try {
                const list = await messageApi.listConversations()
                setConversations(list.conversations)
                if (wantConv) setActiveId(wantConv)
                else if (list.conversations[0]) setActiveId(list.conversations[0].id)
            } catch (err) {
                console.error(err)
            } finally {
                setLoading(false)
            }
            try {
                const a = await messageApi.listAdmins()
                setAdmins(a)
            } catch { /* ignore */ }
        })()
    }, [router, wantConv])

    /** WebSocket connection (with auto-reconnect). */
    useEffect(() => {
        let cancelled = false

        function connect() {
            const url = messageApi.wsUrl()
            if (!url) return
            setConnStatus('connecting')
            const ws = new WebSocket(url)
            wsRef.current = ws

            ws.onopen = () => setConnStatus('live')

            ws.onmessage = (ev) => {
                try {
                    const data = JSON.parse(ev.data)
                    if (data.type === 'message.new') {
                        const msg: ChatMessage = data.message
                        const convId: string = data.conversation_id
                        setActive(prev => {
                            if (!prev || prev.id !== convId) return prev
                            // Check if message already exists by ID to prevent duplicates
                            if (prev.messages.some(m => m.id === msg.id)) {
                                return prev
                            }
                            return {
                                ...prev,
                                messages: [...prev.messages, msg],
                                last_message_preview: msg.body,
                                last_message_at: msg.created_at
                            }
                        })
                        setConversations(prev => {
                            const idx = prev.findIndex(c => c.id === convId)
                            if (idx === -1) {
                                // We weren't tracking this conversation - fetch fresh list later
                                return prev
                            }
                            const updated = { ...prev[idx],
                                last_message_preview: msg.body,
                                last_message_at: msg.created_at,
                                my_unread: convId === activeId ? 0 : prev[idx].my_unread + (msg.sender_id !== me?.id ? 1 : 0),
                            }
                            const next = [updated, ...prev.filter((_, i) => i !== idx)]
                            return next
                        })
                    } else if (data.type === 'conversation.created') {
                        const conv: ChatConversation = data.conversation
                        setConversations(prev => [conv, ...prev.filter(c => c.id !== conv.id)])
                    } else if (data.type === 'typing') {
                        setPeerTyping(p => ({ ...p, [data.conversation_id]: !!data.is_typing }))
                    }
                } catch (e) { console.warn('bad WS msg', e) }
            }

            ws.onerror = () => setConnStatus('offline')
            ws.onclose = () => {
                setConnStatus('offline')
                if (cancelled) return
                if (reconnectTimer.current) clearTimeout(reconnectTimer.current)
                reconnectTimer.current = setTimeout(connect, 3000)
            }
        }

        connect()
        return () => {
            cancelled = true
            if (reconnectTimer.current) clearTimeout(reconnectTimer.current)
            wsRef.current?.close()
        }
    }, [activeId, me?.id])

    /** Load active conversation detail. */
    useEffect(() => {
        if (!activeId) { setActive(null); return }
        (async () => {
            try {
                const detail = await messageApi.getConversation(activeId)
                setActive(detail)
                setConversations(prev => prev.map(c => c.id === activeId ? { ...c, my_unread: 0 } : c))
            } catch (err) {
                console.error(err)
            }
        })()
    }, [activeId])

    /** Auto-scroll to bottom on new messages. */
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [active?.messages.length])

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase()
        if (!q) return conversations
        return conversations.filter(c =>
            (c.subject || '').toLowerCase().includes(q)
            || (c.admin?.name || '').toLowerCase().includes(q)
            || (c.user?.name || '').toLowerCase().includes(q)
            || (c.last_message_preview || '').toLowerCase().includes(q)
        )
    }, [conversations, search])

    async function send() {
        if (!draft.trim() || !activeId || sending) return
        setSending(true)
        const body = draft.trim()
        setDraft('')  // Clear immediately for better UX
        try {
            // Send to API (but don't add to state - WebSocket will handle it)
            await messageApi.sendMessage(activeId, { body })
            // Message will be added by WebSocket handler
        } catch (err) {
            console.error(err)
            setDraft(body)  // Restore draft on error
            alert('Failed to send message')
        } finally {
            setSending(false)
        }
    }

    function emitTyping(isTyping: boolean) {
        if (!activeId || wsRef.current?.readyState !== WebSocket.OPEN) return
        wsRef.current.send(JSON.stringify({
            type: 'typing',
            conversation_id: activeId,
            is_typing: isTyping,
        }))
    }

    function onDraftChange(v: string) {
        setDraft(v)
        emitTyping(true)
        if (typingTimer.current) clearTimeout(typingTimer.current)
        typingTimer.current = setTimeout(() => emitTyping(false), 1500)
    }

    async function startNewConversation() {
        if (!newMessage.trim()) return
        try {
            const detail = await messageApi.createConversation({
                subject: newSubject.trim() || undefined,
                initial_message: newMessage.trim(),
                admin_id: newRecipient || undefined,
            })
            setShowNew(false)
            setNewMessage(''); setNewSubject(''); setNewRecipient('')
            setConversations(prev => [detail, ...prev.filter(c => c.id !== detail.id)])
            setActiveId(detail.id)
            setActive(detail)
        } catch (err) {
            console.error(err)
            alert('Failed to start conversation')
        }
    }

    /** Determine the peer name shown at top of the open thread.
     *  Works for member↔admin AND mentor↔mentee conversations:
     *  - If I am the user_id party  → peer is admin slot (mentor/admin)
     *  - If I am the admin_id party → peer is user slot  (mentee/member)
     *  - Fallback: whoever is not null                                   */
    const peer = useMemo(() => {
        if (!active) return null
        if (me?.id && active.user?.id === me.id) return active.admin   // I'm the user  → show admin/mentor
        if (me?.id && active.admin?.id === me.id) return active.user   // I'm the admin/mentor → show mentee
        return active.admin || active.user                              // fallback
    }, [active, me?.id])

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 font-sans">
            {/* Modern Header */}
            <div className="bg-gradient-to-r from-[#140152] via-[#1a0064] to-[#140152] text-white shadow-lg border-b border-white/10">
                <div className="max-w-7xl mx-auto px-4 md:px-8 py-5 flex items-center gap-4">
                    <button onClick={() => router.push('/dashboard')} className="p-2 rounded-full hover:bg-white/10 transition-all duration-200 hover:scale-110">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="flex-1">
                        <h1 className="text-2xl md:text-3xl font-black tracking-tight">Messages</h1>
                        <p className="text-indigo-200 text-sm">Real-time chat with pastors and mentors</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${connStatus === 'live' ? 'bg-green-500/20' : connStatus === 'connecting' ? 'bg-yellow-500/20' : 'bg-red-500/20'}`}>
                            <span className={`w-2 h-2 rounded-full ${connStatus === 'live' ? 'bg-green-400 animate-pulse' : connStatus === 'connecting' ? 'bg-yellow-400 animate-bounce' : 'bg-red-400'}`} />
                            <span className="text-xs font-semibold">{connStatus === 'live' ? 'Live' : connStatus === 'connecting' ? 'Connecting...' : 'Offline'}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Body */}
            <div className="max-w-7xl mx-auto p-3 md:p-6">
                <div className="bg-white rounded-2xl shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-[300px_1fr] h-[calc(100vh-160px)] min-h-[520px] backdrop-blur-sm border border-gray-200/50">
                    {/* Sidebar - conversation list - WhatsApp style */}
                    <aside className={`border-r border-gray-200 flex flex-col bg-white ${active && 'hidden md:flex'}`}>
                        <div className="p-3 md:p-4 border-b border-gray-200 space-y-3">
                            <div className="relative flex-1">
                                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                                <input
                                    value={search} onChange={e => setSearch(e.target.value)}
                                    placeholder="Search or start new chat"
                                    className="w-full pl-9 pr-3 py-2.5 rounded-full bg-gray-100 hover:bg-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#140152] focus:bg-white transition-all"
                                />
                            </div>
                            <button
                                onClick={() => setShowNew(true)}
                                className="w-full py-2.5 rounded-full bg-gradient-to-r from-[#140152] to-[#1a0064] text-white hover:shadow-lg hover:from-[#1a0064] hover:to-[#220080] transition-all duration-200 font-semibold text-sm flex items-center justify-center gap-2"
                                title="New conversation"
                            >
                                <Plus className="w-4 h-4" />
                                New Chat
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent hover:scrollbar-thumb-gray-400">
                            {loading ? (
                                <div className="p-12 flex items-center justify-center text-gray-400">
                                    <Loader2 className="w-6 h-6 animate-spin" />
                                </div>
                            ) : filtered.length === 0 ? (
                                <div className="p-8 md:p-12 text-center text-gray-500">
                                    <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-gray-200 flex items-center justify-center">
                                        <MessageCircle className="w-7 h-7 text-gray-400" />
                                    </div>
                                    <p className="text-sm font-semibold text-gray-700">No conversations</p>
                                    <p className="text-xs text-gray-500 mt-1">Create one to start chatting</p>
                                    <button
                                        onClick={() => setShowNew(true)}
                                        className="mt-4 inline-flex items-center gap-1 text-[#140152] font-semibold text-sm hover:text-[#1a0064] transition-colors"
                                    >
                                        <Plus className="w-4 h-4" /> Create
                                    </button>
                                </div>
                            ) : filtered.map(c => {
                                // Show the OTHER person's name — not the current user's own name.
                                const peerName = me?.id === c.user?.id
                                    ? (c.admin?.name || 'Mentor / Pastor')
                                    : me?.id === c.admin?.id
                                        ? (c.user?.name || 'Member')
                                        : (c.admin?.name || c.user?.name || 'Pastor / Admin')
                                const isActive = c.id === activeId
                                return (
                                    <button
                                        key={c.id}
                                        onClick={() => setActiveId(c.id)}
                                        className={`w-full text-left px-3 md:px-4 py-3 flex gap-3 hover:bg-gray-50 transition-all duration-150 border-b border-gray-100 ${isActive ? 'bg-gradient-to-r from-blue-50 to-transparent border-l-4 border-l-[#140152]' : ''}`}
                                    >
                                        <div className={`w-12 h-12 rounded-full shrink-0 flex items-center justify-center font-bold text-white text-sm shadow-md ${isActive ? 'ring-2 ring-[#140152] ring-offset-1' : 'shadow-md'}`}
                                            style={{
                                                background: `linear-gradient(135deg, hsl(${(peerName.charCodeAt(0) * 17) % 360}, 70%, 60%), hsl(${(peerName.charCodeAt(0) * 23) % 360}, 60%, 50%))`
                                            }}
                                        >
                                            {initials(peerName)}
                                        </div>
                                        <div className="min-w-0 flex-1 py-1">
                                            <div className="flex items-center justify-between gap-2">
                                                <p className={`truncate font-semibold text-sm ${isActive ? 'text-[#140152]' : 'text-gray-900'}`}>
                                                    {peerName}
                                                </p>
                                                <span className="text-xs text-gray-400 shrink-0 font-medium">{formatTime(c.last_message_at)}</span>
                                            </div>
                                            <div className="flex items-center justify-between gap-2 mt-1">
                                                <p className={`truncate text-xs line-clamp-1 ${c.my_unread > 0 ? 'text-gray-800 font-semibold' : 'text-gray-500'}`}>
                                                    {c.last_message_preview || c.subject || 'No messages'}
                                                </p>
                                                {c.my_unread > 0 && (
                                                    <span className="text-[10px] font-bold bg-[#25D366] text-white px-2 py-0.5 rounded-full shrink-0 shadow-md">{c.my_unread}</span>
                                                )}
                                            </div>
                                        </div>
                                    </button>
                                )
                            })}
                        </div>
                    </aside>

                    {/* Conversation thread - WhatsApp style */}
                    <section className={`flex flex-col bg-gradient-to-b from-gray-50 to-white ${active ? '' : 'hidden md:flex'}`}>
                        {active ? (
                            <>
                                <header className="px-4 md:px-5 py-4 border-b border-gray-200 flex items-center gap-3 bg-white shadow-sm">
                                    <button
                                        onClick={() => { setActiveId(undefined); setActive(null) }}
                                        className="md:hidden p-2 rounded-full hover:bg-gray-100 transition-colors"
                                    >
                                        <ArrowLeft className="w-5 h-5" />
                                    </button>
                                    <div className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-white shadow-md"
                                        style={{
                                            background: `linear-gradient(135deg, hsl(${(peer?.name?.charCodeAt(0) ?? 0 * 17) % 360}, 70%, 60%), hsl(${(peer?.name?.charCodeAt(0) ?? 0 * 23) % 360}, 60%, 50%))`
                                        }}
                                    >
                                        {initials(peer?.name)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p className="font-bold text-gray-900 truncate">{peer?.name || 'Pastor / Admin'}</p>
                                            {peer?.role === 'admin' && (
                                                <span className="text-[10px] font-bold uppercase bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                                                    <Shield className="w-3 h-3" /> Admin
                                                </span>
                                            )}
                                        </div>
                                        {active.subject && (
                                            <p className="text-xs text-gray-500 truncate">{active.subject}</p>
                                        )}
                                    </div>
                                </header>

                                <div className="flex-1 overflow-y-auto p-4 md:p-5 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent space-y-3">
                                    {active.messages.length === 0 && (
                                        <div className="text-center text-gray-400 py-12">
                                            <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                            <p className="text-sm">No messages yet. Start the conversation!</p>
                                        </div>
                                    )}
                                    {active.messages.map(m => {
                                        const mine = m.sender_id === me?.id
                                        return (
                                            <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-1 duration-300`}>
                                                <div className={`max-w-xs lg:max-w-md rounded-2xl px-4 py-2.5 shadow-md transition-all ${mine
                                                    ? 'bg-gradient-to-br from-[#140152] to-[#1a0064] text-white rounded-br-none'
                                                    : 'bg-white text-gray-900 rounded-bl-none border border-gray-200/50 shadow-sm'
                                                    }`}>
                                                    {!mine && (
                                                        <p className="text-[11px] font-bold opacity-70 mb-1">{m.sender?.name || peer?.name || 'Mentor'}</p>
                                                    )}
                                                    <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">{m.body}</p>
                                                    <div className={`text-[10px] mt-1.5 flex items-center justify-end gap-1 ${mine ? 'text-blue-100' : 'text-gray-400'}`}>
                                                        <span>{formatTime(m.created_at)}</span>
                                                        {mine && (m.is_read
                                                            ? <CheckCheck className="w-3.5 h-3.5 text-green-300" />
                                                            : <Check className="w-3.5 h-3.5" />)}
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                    {peerTyping[active.id] && (
                                        <div className="flex justify-start animate-in fade-in">
                                            <div className="bg-white border border-gray-200/50 rounded-2xl rounded-bl-none px-4 py-2.5 shadow-sm">
                                                <span className="inline-flex gap-1.5">
                                                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}} />
                                                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}} />
                                                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}} />
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                    <div ref={messagesEndRef} />
                                </div>

                                <form
                                    onSubmit={(e) => { e.preventDefault(); send() }}
                                    className="border-t border-gray-200 p-3 md:p-4 flex items-end gap-2 md:gap-3 bg-white shadow-lg"
                                >
                                    <textarea
                                        value={draft}
                                        onChange={(e) => onDraftChange(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
                                        }}
                                        rows={1}
                                        placeholder="Type a message…"
                                        className="flex-1 resize-none rounded-full border border-gray-300 px-4 md:px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#140152]/50 focus:border-transparent max-h-32 bg-gray-50 hover:bg-white transition-all"
                                    />
                                    <button
                                        type="submit"
                                        disabled={!draft.trim() || sending}
                                        className="p-3 rounded-full bg-gradient-to-r from-[#140152] to-[#1a0064] text-white disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-lg hover:from-[#1a0064] hover:to-[#220080] transition-all duration-200 flex-shrink-0"
                                        title={sending ? "Sending..." : "Send message (Enter)"}
                                    >
                                        {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                                    </button>
                                </form>
                            </>
                        ) : (
                            <div className="flex-1 flex items-center justify-center text-center px-8 py-16 text-gray-500 bg-gradient-to-b from-gray-50 to-white">
                                <div>
                                    <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-[#140152]/10 to-blue-500/10 flex items-center justify-center">
                                        <MessageCircle className="w-10 h-10 text-[#140152]/40" />
                                    </div>
                                    <p className="text-lg font-bold text-gray-900">Select a conversation</p>
                                    <p className="text-sm mt-2 text-gray-600 max-w-sm">Pick one from the list or start a new chat with a pastor or mentor</p>
                                    <button
                                        onClick={() => setShowNew(true)}
                                        className="mt-8 inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-[#140152] to-[#1a0064] text-white text-sm font-bold hover:shadow-lg hover:from-[#1a0064] hover:to-[#220080] transition-all duration-200"
                                    >
                                        <Plus className="w-4 h-4" /> Start New Chat
                                    </button>
                                </div>
                            </div>
                        )}
                    </section>
                </div>
            </div>

            {/* New conversation modal - Beautiful WhatsApp style */}
            {showNew && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end md:items-center justify-center z-50 p-0 md:p-4">
                    <div className="bg-white w-full md:max-w-md rounded-t-3xl md:rounded-2xl p-6 shadow-2xl md:border border-gray-200">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-2xl font-bold text-[#140152]">New Chat</h2>
                                <p className="text-xs text-gray-500 mt-0.5">Start a conversation with a mentor or pastor</p>
                            </div>
                            <button onClick={() => setShowNew(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold uppercase text-gray-600 tracking-wide">With</label>
                                <select
                                    value={newRecipient}
                                    onChange={(e) => setNewRecipient(e.target.value)}
                                    className="w-full mt-2 px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#140152]/50 focus:border-transparent bg-gray-50 hover:bg-white transition-all"
                                >
                                    <option value="">Any available mentor / admin</option>
                                    {admins.map(a => (
                                        <option key={a.id} value={a.id}>{a.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="text-xs font-bold uppercase text-gray-600 tracking-wide">Subject (optional)</label>
                                <input
                                    value={newSubject}
                                    onChange={(e) => setNewSubject(e.target.value)}
                                    placeholder="e.g. Prayer request"
                                    className="w-full mt-2 px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#140152]/50 focus:border-transparent bg-gray-50 hover:bg-white transition-all"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-bold uppercase text-gray-600 tracking-wide">Your Message</label>
                                <textarea
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    rows={4}
                                    placeholder="Write your first message…"
                                    className="w-full mt-2 px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#140152]/50 focus:border-transparent bg-gray-50 hover:bg-white transition-all resize-none"
                                />
                            </div>
                        </div>

                        <div className="mt-6 space-y-3">
                            <button
                                onClick={startNewConversation}
                                disabled={!newMessage.trim()}
                                className="w-full py-3 rounded-full bg-gradient-to-r from-[#140152] to-[#1a0064] text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:from-[#1a0064] hover:to-[#220080] transition-all duration-200"
                            >
                                Send Message
                            </button>
                            <button
                                onClick={() => setShowNew(false)}
                                className="w-full py-3 rounded-full border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
