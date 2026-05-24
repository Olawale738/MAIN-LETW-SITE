'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { MessageCircle, X, Send, Loader2, RefreshCw, WifiOff } from 'lucide-react'
import { messageApi } from '@/lib/api'

type SendState = 'idle' | 'sending' | 'error'

// Local types — avoids the duplicate-export ambiguity in api.ts
interface MsgSender { id: string; name: string; role: string }
interface Msg {
    id: string
    conversation_id: string
    sender_id: string
    sender?: MsgSender | null
    body: string
    is_read: boolean
    created_at: string
}

export default function ChatWidget() {
    const [isOpen,     setIsOpen]     = useState(false)
    const [mounted,    setMounted]    = useState(false)
    const [isLoggedIn, setIsLoggedIn] = useState(false)
    const [loading,    setLoading]    = useState(false)
    const [messages,   setMessages]   = useState<Msg[]>([])
    const [unread,     setUnread]     = useState(0)
    const [input,      setInput]      = useState('')
    const [sendState,  setSendState]  = useState<SendState>('idle')
    const [errorMsg,   setErrorMsg]   = useState('')

    const convIdRef      = useRef<string | null>(null)
    const userIdRef      = useRef<string | null>(null)   // non-admin participant id
    const wsRef          = useRef<WebSocket | null>(null)
    const reconnTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const pollTimerRef   = useRef<ReturnType<typeof setInterval> | null>(null)
    const mountedRef     = useRef(false)
    const bottomRef      = useRef<HTMLDivElement>(null)

    // ── init ──────────────────────────────────────────────────────────
    useEffect(() => {
        mountedRef.current = true
        setMounted(true)
        setIsLoggedIn(!!localStorage.getItem('isLoggedIn'))
        return () => { mountedRef.current = false }
    }, [])

    // auto-scroll on new messages
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    // ── helpers ───────────────────────────────────────────────────────
    const addMsg = (msg: Msg) =>
        setMessages(prev => prev.some(m => m.id === msg.id) ? prev : [...prev, msg])

    const isAdminMsg = (msg: Msg) =>
        userIdRef.current
            ? msg.sender_id !== userIdRef.current
            : msg.sender?.role === 'admin'

    // ── load conversation ─────────────────────────────────────────────
    const loadConversation = useCallback(async () => {
        try {
            const { conversations } = await messageApi.listConversations()
            if (!conversations.length) return
            const conv = conversations.find(c => c.status === 'open') ?? conversations[0]
            const detail = await messageApi.getConversation(conv.id)
            if (!mountedRef.current) return
            convIdRef.current = detail.id
            userIdRef.current = detail.user?.id ?? null
            setMessages((detail.messages ?? []) as unknown as Msg[])
            messageApi.markRead(detail.id).catch(() => {})
        } catch { /* no conversations yet — that is fine */ }
    }, [])

    // ── WebSocket ─────────────────────────────────────────────────────
    const connectWS = useCallback(() => {
        const url = messageApi.wsUrl()
        if (!url) return
        if (wsRef.current?.readyState === WebSocket.OPEN) return

        const ws = new WebSocket(url)
        wsRef.current = ws

        ws.onmessage = (evt) => {
            try {
                const msg = JSON.parse(evt.data) as Msg
                if (!convIdRef.current || msg.conversation_id !== convIdRef.current) return
                addMsg(msg)
                if (isAdminMsg(msg)) {
                    setUnread(u => u + 1)
                    if (convIdRef.current) messageApi.markRead(convIdRef.current).catch(() => {})
                }
            } catch { /* ignore bad frames */ }
        }

        ws.onclose = () => {
            if (!mountedRef.current) return
            reconnTimerRef.current = setTimeout(connectWS, 4000)
        }
        ws.onerror = () => ws.close()
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    const disconnectWS = () => {
        if (reconnTimerRef.current) { clearTimeout(reconnTimerRef.current); reconnTimerRef.current = null }
        wsRef.current?.close()
        wsRef.current = null
    }

    // ── unread poll (while chat is closed) ────────────────────────────
    const startUnreadPoll = useCallback(() => {
        const poll = async () => {
            try {
                const { unread_count } = await messageApi.unreadCount()
                if (mountedRef.current) setUnread(unread_count)
            } catch { /* ignore */ }
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
            setLoading(true)
            loadConversation().finally(() => { if (mountedRef.current) setLoading(false) })
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

        setSendState('sending')
        setErrorMsg('')

        try {
            if (!convIdRef.current) {
                // First message ever — create conversation
                const detail = await messageApi.createConversation({ initial_message: content })
                convIdRef.current = detail.id
                userIdRef.current = detail.user?.id ?? null
                setMessages((detail.messages ?? []) as unknown as Msg[])
                connectWS()
            } else {
                const msg = await messageApi.sendMessage(convIdRef.current, { body: content })
                addMsg(msg as unknown as Msg)
            }
            setInput('')
            setSendState('idle')
        } catch (err: unknown) {
            const isNetwork =
                err instanceof TypeError ||
                (err instanceof Error && err.message.toLowerCase().includes('fetch'))
            setErrorMsg(isNetwork
                ? 'Connection lost. Check your internet and tap Retry.'
                : 'Message failed to send. Please try again.')
            setSendState('error')
        }
    }, [input, sendState, connectWS]) // eslint-disable-line react-hooks/exhaustive-deps

    const handleRetry = () => {
        setSendState('idle')
        setErrorMsg('')
        handleSend()
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
    }

    if (!mounted || !isLoggedIn) return null

    const isBusy = sendState === 'sending'

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">

            {/* ── Chat window ── */}
            {isOpen && (
                <div
                    className="mb-4 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden"
                    style={{ height: '500px' }}
                >
                    {/* Header */}
                    <div className="bg-[#140152] text-white px-4 py-3 flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-[#f5bb00] flex items-center justify-center">
                                <MessageCircle className="w-4 h-4 text-[#140152]" />
                            </div>
                            <div>
                                <p className="font-bold text-sm">LETW Support</p>
                                <div className="flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                                    <p className="text-xs text-blue-200">Admin team · Online</p>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="text-white/60 hover:text-white transition-colors p-1"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
                        {loading ? (
                            <div className="flex flex-col justify-center items-center h-full gap-3 text-gray-400">
                                <Loader2 className="w-6 h-6 animate-spin text-[#140152]" />
                                <p className="text-xs">Loading messages…</p>
                            </div>
                        ) : messages.length === 0 ? (
                            <div className="text-center text-gray-400 text-sm mt-10 px-4">
                                <div className="w-14 h-14 bg-[#140152]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <MessageCircle className="w-7 h-7 text-[#140152]/30" />
                                </div>
                                <p className="font-semibold text-gray-500 mb-1">Start a conversation</p>
                                <p className="text-xs text-gray-400 leading-relaxed">
                                    Send a message and our admin team will get back to you.
                                </p>
                            </div>
                        ) : (
                            messages.map(msg => {
                                const admin = isAdminMsg(msg)
                                return (
                                    <div key={msg.id} className={`flex ${admin ? 'justify-start' : 'justify-end'}`}>
                                        <div className={`max-w-[78%] px-3 py-2 rounded-2xl text-sm leading-relaxed shadow-sm
                                            ${admin
                                                ? 'bg-white border border-gray-100 text-gray-800 rounded-tl-sm'
                                                : 'bg-[#140152] text-white rounded-tr-sm'}`}
                                        >
                                            {admin && (
                                                <p className="text-[10px] font-bold text-[#f5bb00] mb-1 uppercase tracking-wide">
                                                    {msg.sender?.name || 'Admin'}
                                                </p>
                                            )}
                                            <p>{msg.body}</p>
                                            <p className={`text-[10px] mt-1 ${admin ? 'text-gray-400' : 'text-blue-200'}`}>
                                                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>
                                )
                            })
                        )}
                        <div ref={bottomRef} />
                    </div>

                    {/* Error banner */}
                    {sendState === 'error' && (
                        <div className="shrink-0 px-4 py-2.5 bg-red-50 border-t border-red-100 flex items-center gap-2">
                            <WifiOff className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                            <span className="flex-1 text-xs text-red-600">{errorMsg}</span>
                            <button
                                onClick={handleRetry}
                                className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 bg-red-100 text-red-600 hover:bg-red-200 rounded-lg transition-all flex-shrink-0"
                            >
                                <RefreshCw className="w-3 h-3" /> Retry
                            </button>
                        </div>
                    )}

                    {/* Input */}
                    <div className="p-3 border-t border-gray-100 bg-white shrink-0">
                        <div className="flex gap-2 items-end">
                            <textarea
                                rows={1}
                                value={input}
                                onChange={e => {
                                    setInput(e.target.value)
                                    if (sendState === 'error') { setSendState('idle'); setErrorMsg('') }
                                }}
                                onKeyDown={handleKeyDown}
                                placeholder="Type a message…"
                                disabled={isBusy}
                                className="flex-1 resize-none border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#140152] focus:border-transparent disabled:opacity-60 disabled:bg-gray-50 transition-all"
                                style={{ maxHeight: '80px' }}
                            />
                            <button
                                onClick={handleSend}
                                disabled={isBusy || !input.trim()}
                                className="bg-[#140152] text-white p-2.5 rounded-xl hover:bg-[#1d0175] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center shrink-0"
                            >
                                {isBusy
                                    ? <Loader2 className="w-4 h-4 animate-spin" />
                                    : <Send className="w-4 h-4" />}
                            </button>
                        </div>
                        {isBusy && (
                            <p className="text-[10px] text-gray-400 mt-1.5 px-1">Sending…</p>
                        )}
                    </div>
                </div>
            )}

            {/* ── FAB ── */}
            <button
                onClick={() => { setIsOpen(v => !v); setUnread(0) }}
                className="relative w-14 h-14 bg-[#140152] hover:bg-[#1d0175] text-white rounded-full shadow-2xl flex items-center justify-center transition-all hover:scale-110 active:scale-95"
                aria-label="Open chat"
            >
                {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
                {!isOpen && unread > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#f5bb00] text-[#140152] text-xs font-black rounded-full flex items-center justify-center">
                        {unread > 9 ? '9+' : unread}
                    </span>
                )}
            </button>
        </div>
    )
}
