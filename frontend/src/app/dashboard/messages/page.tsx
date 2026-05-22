'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
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
                        setActive(prev => prev && prev.id === convId
                            ? { ...prev, messages: [...prev.messages, msg], last_message_preview: msg.body, last_message_at: msg.created_at }
                            : prev)
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
        try {
            const msg = await messageApi.sendMessage(activeId, { body: draft.trim() })
            setActive(prev => prev && prev.id === activeId ? { ...prev, messages: [...prev.messages, msg] } : prev)
            setConversations(prev => {
                const idx = prev.findIndex(c => c.id === activeId)
                if (idx === -1) return prev
                const updated = { ...prev[idx], last_message_preview: msg.body, last_message_at: msg.created_at }
                return [updated, ...prev.filter((_, i) => i !== idx)]
            })
            setDraft('')
        } catch (err) {
            console.error(err)
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

    /** Determine the peer name shown at top of the open thread. */
    const peer = useMemo(() => {
        if (!active) return null
        if (me?.id && active.user?.id === me.id) return active.admin
        return active.admin && active.user
            ? (active.admin.role === 'admin' ? active.admin : active.user)
            : (active.admin || active.user)
    }, [active, me?.id])

    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            {/* Header */}
            <div className="bg-[#140152] text-white">
                <div className="max-w-6xl mx-auto px-4 md:px-8 py-6 flex items-center gap-4">
                    <button onClick={() => router.push('/dashboard')} className="p-2 rounded-full hover:bg-white/10">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="flex-1">
                        <h1 className="text-2xl md:text-3xl font-black tracking-tight">Messages</h1>
                        <p className="text-blue-200 text-sm">Chat directly with pastors and admins</p>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                        <span className={`w-2 h-2 rounded-full ${connStatus === 'live' ? 'bg-green-400 animate-pulse' : connStatus === 'connecting' ? 'bg-yellow-400' : 'bg-red-400'}`} />
                        <span className="text-blue-100">{connStatus === 'live' ? 'Live' : connStatus === 'connecting' ? 'Connecting' : 'Offline'}</span>
                    </div>
                </div>
            </div>

            {/* Body */}
            <div className="max-w-6xl mx-auto p-4 md:p-6">
                <div className="bg-white rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-[340px_1fr] h-[calc(100vh-180px)] min-h-[520px]">
                    {/* Sidebar - conversation list */}
                    <aside className={`border-r border-gray-100 flex flex-col ${active && 'hidden md:flex'}`}>
                        <div className="p-4 border-b border-gray-100 flex items-center gap-2">
                            <div className="relative flex-1">
                                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    value={search} onChange={e => setSearch(e.target.value)}
                                    placeholder="Search conversations"
                                    className="w-full pl-9 pr-3 py-2 rounded-full bg-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-[#140152]"
                                />
                            </div>
                            <button
                                onClick={() => setShowNew(true)}
                                className="p-2 rounded-full bg-[#140152] text-white hover:bg-[#140152]/90 transition-colors"
                                title="New conversation"
                            >
                                <Plus className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto">
                            {loading ? (
                                <div className="p-12 flex items-center justify-center text-gray-400">
                                    <Loader2 className="w-6 h-6 animate-spin" />
                                </div>
                            ) : filtered.length === 0 ? (
                                <div className="p-12 text-center text-gray-500">
                                    <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                    <p className="text-sm">No conversations yet.</p>
                                    <button
                                        onClick={() => setShowNew(true)}
                                        className="mt-4 text-[#140152] font-semibold text-sm hover:underline"
                                    >
                                        Start one
                                    </button>
                                </div>
                            ) : filtered.map(c => {
                                const peerName = c.admin?.name || 'Pastor / Admin'
                                const isActive = c.id === activeId
                                return (
                                    <button
                                        key={c.id}
                                        onClick={() => setActiveId(c.id)}
                                        className={`w-full text-left px-4 py-3 border-b border-gray-50 flex gap-3 hover:bg-gray-50 transition-colors ${isActive ? 'bg-blue-50' : ''}`}
                                    >
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#140152] to-blue-700 text-white flex items-center justify-center font-bold shrink-0">
                                            {initials(peerName)}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center justify-between gap-2">
                                                <p className={`truncate font-semibold ${isActive ? 'text-[#140152]' : 'text-gray-900'}`}>
                                                    {peerName}
                                                </p>
                                                <span className="text-xs text-gray-400 shrink-0">{formatTime(c.last_message_at)}</span>
                                            </div>
                                            <div className="flex items-center justify-between gap-2 mt-0.5">
                                                <p className="truncate text-sm text-gray-500">
                                                    {c.last_message_preview || c.subject || 'No messages'}
                                                </p>
                                                {c.my_unread > 0 && (
                                                    <span className="text-[10px] font-bold bg-[#f5bb00] text-[#140152] px-2 py-0.5 rounded-full">{c.my_unread}</span>
                                                )}
                                            </div>
                                            {c.subject && (
                                                <p className="truncate text-xs text-gray-400 mt-0.5">{c.subject}</p>
                                            )}
                                        </div>
                                    </button>
                                )
                            })}
                        </div>
                    </aside>

                    {/* Conversation thread */}
                    <section className={`flex flex-col ${active ? '' : 'hidden md:flex'}`}>
                        {active ? (
                            <>
                                <header className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
                                    <button
                                        onClick={() => { setActiveId(undefined); setActive(null) }}
                                        className="md:hidden p-2 rounded-full hover:bg-gray-100"
                                    >
                                        <ArrowLeft className="w-5 h-5" />
                                    </button>
                                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#140152] to-blue-700 text-white flex items-center justify-center font-bold">
                                        {initials(peer?.name)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p className="font-bold text-gray-900 truncate">{peer?.name || 'Pastor / Admin'}</p>
                                            {peer?.role === 'admin' && (
                                                <span className="text-[10px] font-bold uppercase bg-blue-100 text-[#140152] px-2 py-0.5 rounded-full flex items-center gap-1">
                                                    <Shield className="w-3 h-3" /> Pastor
                                                </span>
                                            )}
                                        </div>
                                        {active.subject && (
                                            <p className="text-xs text-gray-500 truncate">{active.subject}</p>
                                        )}
                                    </div>
                                </header>

                                <div className="flex-1 overflow-y-auto p-5 bg-gradient-to-b from-white to-gray-50">
                                    {active.messages.length === 0 && (
                                        <div className="text-center text-gray-400 py-12">No messages yet. Say hello!</div>
                                    )}
                                    <div className="space-y-3">
                                        {active.messages.map(m => {
                                            const mine = me?.id ? m.sender_id === me.id : m.sender?.role !== 'admin'
                                            return (
                                                <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                                                    <div className={`max-w-[78%] rounded-2xl px-4 py-2.5 ${mine
                                                        ? 'bg-[#140152] text-white rounded-br-sm'
                                                        : 'bg-white border border-gray-200 text-gray-900 rounded-bl-sm'
                                                        } shadow-sm`}>
                                                        {!mine && (
                                                            <p className="text-[11px] font-bold text-[#140152] mb-1">{m.sender?.name || 'Pastor'}</p>
                                                        )}
                                                        <p className="text-sm whitespace-pre-wrap break-words">{m.body}</p>
                                                        <div className={`text-[10px] mt-1 flex items-center gap-1 ${mine ? 'text-blue-200 justify-end' : 'text-gray-400'}`}>
                                                            <span>{formatTime(m.created_at)}</span>
                                                            {mine && (m.is_read
                                                                ? <CheckCheck className="w-3 h-3" />
                                                                : <Check className="w-3 h-3" />)}
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                        {peerTyping[active.id] && (
                                            <div className="flex justify-start">
                                                <div className="bg-white border border-gray-200 rounded-2xl px-4 py-2 shadow-sm">
                                                    <span className="inline-flex gap-1">
                                                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" />
                                                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:120ms]" />
                                                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:240ms]" />
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <div ref={messagesEndRef} />
                                </div>

                                <form
                                    onSubmit={(e) => { e.preventDefault(); send() }}
                                    className="border-t border-gray-100 p-3 flex items-end gap-2 bg-white"
                                >
                                    <textarea
                                        value={draft}
                                        onChange={(e) => onDraftChange(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
                                        }}
                                        rows={1}
                                        placeholder="Type a message…"
                                        className="flex-1 resize-none rounded-2xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#140152] max-h-32"
                                    />
                                    <button
                                        type="submit"
                                        disabled={!draft.trim() || sending}
                                        className="p-3 rounded-full bg-[#140152] text-white disabled:opacity-40 hover:bg-[#140152]/90 transition-colors"
                                    >
                                        {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                                    </button>
                                </form>
                            </>
                        ) : (
                            <div className="flex-1 flex items-center justify-center text-center px-8 py-16 text-gray-500">
                                <div>
                                    <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                                    <p className="text-lg font-semibold text-gray-700">Pick a conversation</p>
                                    <p className="text-sm mt-1">Or start a new one with one of our pastors / admins.</p>
                                    <button
                                        onClick={() => setShowNew(true)}
                                        className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#140152] text-white text-sm font-semibold hover:bg-[#140152]/90"
                                    >
                                        <Plus className="w-4 h-4" /> New conversation
                                    </button>
                                </div>
                            </div>
                        )}
                    </section>
                </div>
            </div>

            {/* New conversation modal */}
            {showNew && (
                <div className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50 p-0 md:p-4">
                    <div className="bg-white w-full md:max-w-md rounded-t-3xl md:rounded-3xl p-6 shadow-2xl">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-[#140152]">New conversation</h2>
                            <button onClick={() => setShowNew(false)} className="p-2 hover:bg-gray-100 rounded-full">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <label className="text-xs font-semibold uppercase text-gray-500">To</label>
                        <select
                            value={newRecipient}
                            onChange={(e) => setNewRecipient(e.target.value)}
                            className="w-full mt-1 mb-4 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#140152]"
                        >
                            <option value="">Any available pastor / admin</option>
                            {admins.map(a => (
                                <option key={a.id} value={a.id}>{a.name}</option>
                            ))}
                        </select>

                        <label className="text-xs font-semibold uppercase text-gray-500">Subject (optional)</label>
                        <input
                            value={newSubject}
                            onChange={(e) => setNewSubject(e.target.value)}
                            placeholder="e.g. Prayer for my family"
                            className="w-full mt-1 mb-4 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#140152]"
                        />

                        <label className="text-xs font-semibold uppercase text-gray-500">Message</label>
                        <textarea
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            rows={4}
                            placeholder="Write your first message…"
                            className="w-full mt-1 mb-4 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#140152] resize-none"
                        />

                        <button
                            onClick={startNewConversation}
                            disabled={!newMessage.trim()}
                            className="w-full py-3 rounded-xl bg-[#140152] text-white font-bold disabled:opacity-50"
                        >
                            Send
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
