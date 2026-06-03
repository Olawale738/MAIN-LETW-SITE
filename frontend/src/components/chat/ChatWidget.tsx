'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { MessageCircle, X, Send, Loader2, RefreshCw, WifiOff, AlertTriangle, ChevronLeft, Plus, Shield } from 'lucide-react'
import { messageApi, ApiError, type ChatConversation, type ChatMessage } from '@/lib/api'
import { getCurrentUser } from '@/lib/dept-api'

type SendState = 'idle' | 'sending' | 'error'
type View = 'list' | 'thread'

export default function ChatWidget() {
    const [isOpen,        setIsOpen]        = useState(false)
    const [mounted,       setMounted]       = useState(false)
    const [isLoggedIn,    setIsLoggedIn]    = useState(false)
    const [view,          setView]          = useState<View>('list')
    const [loading,       setLoading]       = useState(false)
    const [conversations, setConversations] = useState<ChatConversation[]>([])
    const [messages,      setMessages]      = useState<ChatMessage[]>([])
    const [unread,        setUnread]        = useState(0)
    const [input,         setInput]         = useState('')
    const [sendState,     setSendState]     = useState<SendState>('idle')
    const [errorMsg,      setErrorMsg]      = useState('')
    const [loadError,     setLoadError]     = useState('')

    const activeIdRef    = useRef<string | null>(null)
    const myIdRef        = useRef<string | null>(null)
    const wsRef          = useRef<WebSocket | null>(null)
    const reconnTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const pollTimerRef   = useRef<ReturnType<typeof setInterval> | null>(null)
    const mountedRef     = useRef(false)
    const bottomRef      = useRef<HTMLDivElement>(null)

    // ── init ──────────────────────────────────────────────────────────
    useEffect(() => {
        mountedRef.current = true
        setMounted(true)
        setIsLoggedIn(!!localStorage.getItem('isLoggedIn') || !!localStorage.getItem('access_token'))
        // Resolve the real logged-in user id so we can align messages correctly
        getCurrentUser().then(u => { myIdRef.current = (u as { id?: string })?.id ?? null }).catch(() => {})
        return () => { mountedRef.current = false }
    }, [])

    useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

    // ── helpers ───────────────────────────────────────────────────────
    const addMsg = (msg: ChatMessage) =>
        setMessages(prev => prev.some(m => m.id === msg.id) ? prev : [...prev, msg])

    const isMine = (msg: ChatMessage) =>
        myIdRef.current ? msg.sender_id === myIdRef.current : msg.sender?.role !== 'admin'

    /** The other party in a conversation relative to the logged-in user. */
    const counterpart = (c: ChatConversation) => {
        const me = myIdRef.current
        if (me && c.user?.id === me) return c.admin
        if (me && c.admin?.id === me) return c.user
        // Fallback: assume I'm the user, counterpart is admin
        return c.admin ?? c.user
    }
    const convTitle = (c: ChatConversation) => {
        const other = counterpart(c)
        if (other?.name) return other.name
        return c.subject || 'LETW Support'
    }

    const describeError = (err: unknown): string => {
        if (err instanceof ApiError) {
            if (!err.status) return 'Cannot reach the server. It may be starting up — please try again shortly.'
            if (err.status === 401) return 'Your session has expired. Please log in again.'
            if (err.status === 403) return 'You do not have permission to use this chat.'
            if (err.status >= 500)  return `Server error (${err.status}). Please retry in a moment.`
            return `Error ${err.status}: ${err.message}`
        }
        if (err instanceof Error) return err.message
        return 'An unexpected error occurred. Please try again.'
    }

    // ── data loads ────────────────────────────────────────────────────
    const loadList = useCallback(async () => {
        setLoadError('')
        try {
            const { conversations: convs } = await messageApi.listConversations()
            if (!mountedRef.current) return
            setConversations(convs)
        } catch (err) {
            if (!mountedRef.current) return
            setLoadError(describeError(err))
        }
    }, [])

    const openConversation = useCallback(async (id: string) => {
        setView('thread')
        setLoading(true)
        setLoadError('')
        try {
            const detail = await messageApi.getConversation(id)
            if (!mountedRef.current) return
            activeIdRef.current = detail.id
            setMessages(detail.messages ?? [])
            messageApi.markRead(detail.id).catch(() => {})
            setConversations(prev => prev.map(c => c.id === detail.id ? { ...c, my_unread: 0 } : c))
        } catch (err) {
            if (!mountedRef.current) return
            setLoadError(describeError(err))
        } finally {
            if (mountedRef.current) setLoading(false)
        }
    }, [])

    const backToList = () => {
        activeIdRef.current = null
        setMessages([])
        setView('list')
        loadList()
    }

    // ── WebSocket ─────────────────────────────────────────────────────
    const connectWS = useCallback(() => {
        const url = messageApi.wsUrl()
        if (!url) return
        if (wsRef.current?.readyState === WebSocket.OPEN) return
        const ws = new WebSocket(url)
        wsRef.current = ws
        ws.onmessage = (evt) => {
            try {
                const frame = JSON.parse(evt.data)
                if (frame?.type === 'message.new' && frame.message) {
                    const m = frame.message as ChatMessage
                    if (frame.conversation_id === activeIdRef.current) {
                        addMsg(m)
                        if (!isMine(m) && activeIdRef.current) messageApi.markRead(activeIdRef.current).catch(() => {})
                    } else {
                        setUnread(u => u + 1)
                        loadList()
                    }
                } else if (frame?.type === 'conversation.created') {
                    loadList()
                    setUnread(u => u + 1)
                }
            } catch { /* ignore bad frames */ }
        }
        ws.onclose = () => { if (mountedRef.current) reconnTimerRef.current = setTimeout(connectWS, 4000) }
        ws.onerror = () => ws.close()
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    const disconnectWS = () => {
        if (reconnTimerRef.current) { clearTimeout(reconnTimerRef.current); reconnTimerRef.current = null }
        wsRef.current?.close()
        wsRef.current = null
    }

    // ── unread poll (while closed) ────────────────────────────────────
    const startUnreadPoll = useCallback(() => {
        const poll = async () => {
            try { const { unread_count } = await messageApi.unreadCount(); if (mountedRef.current) setUnread(unread_count) }
            catch { /* ignore */ }
        }
        poll()
        pollTimerRef.current = setInterval(poll, 15000)
    }, [])

    // ── open / close effect ───────────────────────────────────────────
    useEffect(() => {
        if (!isLoggedIn) return
        if (isOpen) {
            if (pollTimerRef.current) { clearInterval(pollTimerRef.current); pollTimerRef.current = null }
            setUnread(0)
            setView('list')
            setLoading(true)
            loadList().finally(() => { if (mountedRef.current) setLoading(false) })
            connectWS()
        } else {
            disconnectWS()
            startUnreadPoll()
        }
        return () => {
            disconnectWS()
            if (pollTimerRef.current) clearInterval(pollTimerRef.current)
        }
    }, [isOpen, isLoggedIn]) // eslint-disable-line react-hooks/exhaustive-deps

    // ── send ──────────────────────────────────────────────────────────
    const handleSend = useCallback(async () => {
        const content = input.trim()
        if (!content || sendState === 'sending') return
        setSendState('sending'); setErrorMsg('')
        try {
            if (!activeIdRef.current) {
                // No active thread → start a new conversation with the admin team
                const detail = await messageApi.createConversation({ initial_message: content })
                activeIdRef.current = detail.id
                setMessages(detail.messages ?? [])
                setView('thread')
                connectWS()
            } else {
                const msg = await messageApi.sendMessage(activeIdRef.current, { body: content })
                addMsg(msg)
            }
            setInput(''); setSendState('idle')
        } catch (err: unknown) {
            setErrorMsg(describeError(err)); setSendState('error')
        }
    }, [input, sendState, connectWS]) // eslint-disable-line react-hooks/exhaustive-deps

    const startNewAdminChat = () => {
        activeIdRef.current = null
        setMessages([])
        setView('thread')
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
    }

    if (!mounted || !isLoggedIn) return null

    const isBusy = sendState === 'sending'
    const activeConv = conversations.find(c => c.id === activeIdRef.current)
    const headerTitle = view === 'thread' && activeConv ? convTitle(activeConv) : 'Messages'

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
            {isOpen && (
                <div className="mb-4 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden" style={{ height: '520px' }}>
                    {/* Header */}
                    <div className="bg-[#140152] text-white px-4 py-3 flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-3 min-w-0">
                            {view === 'thread' ? (
                                <button onClick={backToList} className="text-white/70 hover:text-white p-1 -ml-1"><ChevronLeft className="w-5 h-5" /></button>
                            ) : (
                                <div className="w-9 h-9 rounded-full bg-[#f5bb00] flex items-center justify-center shrink-0">
                                    <MessageCircle className="w-4 h-4 text-[#140152]" />
                                </div>
                            )}
                            <div className="min-w-0">
                                <p className="font-bold text-sm truncate">{headerTitle}</p>
                                <div className="flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                                    <p className="text-xs text-blue-200 truncate">
                                        {view === 'thread'
                                            ? (activeConv?.subject === 'Bible Mentoring' ? 'Mentorship chat' : 'Online')
                                            : 'Your conversations'}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="text-white/60 hover:text-white p-1"><X className="w-5 h-5" /></button>
                    </div>

                    {/* Body */}
                    {view === 'list' ? (
                        <div className="flex-1 overflow-y-auto bg-gray-50">
                            {loading ? (
                                <div className="flex flex-col justify-center items-center h-full gap-3 text-gray-400">
                                    <Loader2 className="w-6 h-6 animate-spin text-[#140152]" /><p className="text-xs">Loading…</p>
                                </div>
                            ) : loadError ? (
                                <div className="flex flex-col items-center justify-center h-full gap-3 px-4 text-center">
                                    <AlertTriangle className="w-8 h-8 text-amber-400" />
                                    <p className="text-sm text-gray-600">{loadError}</p>
                                    <button onClick={() => { setLoading(true); loadList().finally(() => setLoading(false)) }}
                                        className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 bg-[#140152] text-white rounded-lg"><RefreshCw className="w-3 h-3" /> Try Again</button>
                                </div>
                            ) : conversations.length === 0 ? (
                                <div className="text-center text-gray-400 text-sm mt-12 px-6">
                                    <div className="w-14 h-14 bg-[#140152]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                        <MessageCircle className="w-7 h-7 text-[#140152]/30" />
                                    </div>
                                    <p className="font-semibold text-gray-500 mb-1">No conversations yet</p>
                                    <p className="text-xs text-gray-400">Start a chat with the admin team below.</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-100">
                                    {conversations.map(c => {
                                        const other = counterpart(c)
                                        const isMentor = c.subject === 'Bible Mentoring'
                                        return (
                                            <button key={c.id} onClick={() => openConversation(c.id)}
                                                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white transition-colors text-left">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm text-white shrink-0 ${isMentor ? 'bg-[#7c3aed]' : 'bg-[#140152]'}`}>
                                                    {other?.name ? other.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) : <Shield className="w-4 h-4" />}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-1.5">
                                                        <p className="font-bold text-sm text-gray-800 truncate">{convTitle(c)}</p>
                                                        {isMentor && <span className="text-[9px] font-bold text-[#7c3aed] bg-[#7c3aed]/10 px-1.5 py-0.5 rounded-full shrink-0">Mentor</span>}
                                                    </div>
                                                    <p className="text-xs text-gray-400 truncate">{c.last_message_preview || 'No messages yet'}</p>
                                                </div>
                                                {c.my_unread > 0 && (
                                                    <span className="w-5 h-5 bg-[#f5bb00] text-[#140152] text-[10px] font-black rounded-full flex items-center justify-center shrink-0">{c.my_unread}</span>
                                                )}
                                            </button>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
                            {loading ? (
                                <div className="flex flex-col justify-center items-center h-full gap-3 text-gray-400">
                                    <Loader2 className="w-6 h-6 animate-spin text-[#140152]" /><p className="text-xs">Loading messages…</p>
                                </div>
                            ) : messages.length === 0 ? (
                                <div className="text-center text-gray-400 text-sm mt-10 px-4">
                                    <p className="font-semibold text-gray-500 mb-1">Start the conversation</p>
                                    <p className="text-xs text-gray-400">Send a message below.</p>
                                </div>
                            ) : (
                                messages.map(msg => {
                                    const mine = isMine(msg)
                                    return (
                                        <div key={msg.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[78%] px-3 py-2 rounded-2xl text-sm leading-relaxed shadow-sm
                                                ${mine ? 'bg-[#140152] text-white rounded-tr-sm' : 'bg-white border border-gray-100 text-gray-800 rounded-tl-sm'}`}>
                                                {!mine && (
                                                    <p className="text-[10px] font-bold text-[#f5bb00] mb-1 uppercase tracking-wide">{msg.sender?.name || 'Them'}</p>
                                                )}
                                                <p className="whitespace-pre-wrap">{msg.body}</p>
                                                <p className={`text-[10px] mt-1 ${mine ? 'text-blue-200' : 'text-gray-400'}`}>
                                                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                        </div>
                                    )
                                })
                            )}
                            <div ref={bottomRef} />
                        </div>
                    )}

                    {/* Error banner */}
                    {sendState === 'error' && (
                        <div className="shrink-0 px-4 py-2.5 bg-red-50 border-t border-red-100 flex items-start gap-2">
                            <WifiOff className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                            <span className="flex-1 text-xs text-red-600">{errorMsg}</span>
                            <button onClick={() => { setSendState('idle'); handleSend() }}
                                className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 bg-red-100 text-red-600 hover:bg-red-200 rounded-lg shrink-0"><RefreshCw className="w-3 h-3" /> Retry</button>
                        </div>
                    )}

                    {/* Footer: input (thread) or new-chat button (list) */}
                    {view === 'thread' ? (
                        <div className="p-3 border-t border-gray-100 bg-white shrink-0">
                            <div className="flex gap-2 items-end">
                                <textarea rows={1} value={input}
                                    onChange={e => { setInput(e.target.value); if (sendState === 'error') { setSendState('idle'); setErrorMsg('') } }}
                                    onKeyDown={handleKeyDown} placeholder="Type a message…" disabled={isBusy}
                                    className="flex-1 resize-none border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#140152] focus:border-transparent disabled:opacity-60" style={{ maxHeight: '80px' }} />
                                <button onClick={handleSend} disabled={isBusy || !input.trim()}
                                    className="bg-[#140152] text-white p-2.5 rounded-xl hover:bg-[#1d0175] disabled:opacity-50 transition-all shrink-0">
                                    {isBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="p-3 border-t border-gray-100 bg-white shrink-0">
                            <button onClick={startNewAdminChat}
                                className="w-full flex items-center justify-center gap-2 bg-[#140152] text-white py-2.5 rounded-xl hover:bg-[#1d0175] transition-all text-sm font-bold">
                                <Plus className="w-4 h-4" /> Message Admin Team
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* FAB */}
            <button onClick={() => { setIsOpen(v => !v); setUnread(0) }}
                className="relative w-14 h-14 bg-[#140152] hover:bg-[#1d0175] text-white rounded-full shadow-2xl flex items-center justify-center transition-all hover:scale-110 active:scale-95"
                aria-label="Open chat">
                {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
                {!isOpen && unread > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#f5bb00] text-[#140152] text-xs font-black rounded-full flex items-center justify-center">{unread > 9 ? '9+' : unread}</span>
                )}
            </button>
        </div>
    )
}
