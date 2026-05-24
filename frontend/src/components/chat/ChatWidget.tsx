'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { MessageCircle, X, Send, Loader2, RefreshCw, WifiOff, Clock } from 'lucide-react'
import { chatApi, ChatMessage } from '@/lib/api'

const POLL_INTERVAL = 6000 // 6 seconds

type SendStatus = 'idle' | 'sending' | 'retrying' | 'error-network' | 'error-server'

export default function ChatWidget() {
    const [isOpen, setIsOpen] = useState(false)
    const [messages, setMessages] = useState<ChatMessage[]>([])
    const [input, setInput] = useState('')
    const [loading, setLoading] = useState(false)
    const [sendStatus, setSendStatus] = useState<SendStatus>('idle')
    const [unread, setUnread] = useState(0)
    const [isLoggedIn, setIsLoggedIn] = useState(false)
    const [mounted, setMounted] = useState(false)
    const bottomRef = useRef<HTMLDivElement>(null)
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
    const pendingMessage = useRef('')

    useEffect(() => {
        setIsLoggedIn(!!localStorage.getItem('isLoggedIn'))
        setMounted(true)
    }, [])

    const fetchMessages = useCallback(async () => {
        try {
            const msgs = await chatApi.getMessages()
            setMessages(msgs)
        } catch {
            // silently fail during polling
        }
    }, [])

    const fetchUnread = useCallback(async () => {
        try {
            const data = await chatApi.getUnreadCount()
            setUnread(data.unread_count)
        } catch {
            // silently fail
        }
    }, [])

    // Poll for new messages when open
    useEffect(() => {
        if (!isLoggedIn) return

        if (isOpen) {
            setLoading(true)
            fetchMessages().finally(() => setLoading(false))
            pollRef.current = setInterval(fetchMessages, POLL_INTERVAL)
        } else {
            fetchUnread()
            const unreadPoll = setInterval(fetchUnread, 15000)
            pollRef.current = unreadPoll
        }

        return () => {
            if (pollRef.current) clearInterval(pollRef.current)
        }
    }, [isOpen, isLoggedIn, fetchMessages, fetchUnread])

    // Scroll to bottom on new messages
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    const trySend = async (content: string): Promise<boolean> => {
        try {
            const msg = await chatApi.sendMessage(content)
            setMessages(prev => [...prev, msg])
            return true
        } catch (err: unknown) {
            // Distinguish network failures from server errors
            const isNetworkError =
                err instanceof TypeError ||
                (err instanceof Error && (
                    err.message.includes('fetch') ||
                    err.message.includes('network') ||
                    err.message.includes('Failed to fetch')
                ))
            setSendStatus(isNetworkError ? 'error-network' : 'error-server')
            return false
        }
    }

    const handleSend = async () => {
        const content = input.trim()
        if (!content || sendStatus === 'sending' || sendStatus === 'retrying') return

        pendingMessage.current = content
        setSendStatus('sending')

        const ok = await trySend(content)
        if (ok) {
            setInput('')
            pendingMessage.current = ''
            setSendStatus('idle')
        }
        // if not ok, status is already set to error-network or error-server
    }

    const handleRetry = async () => {
        const content = pendingMessage.current
        if (!content) return
        setSendStatus('retrying')

        // Small delay so the user sees "retrying…" feedback
        await new Promise(r => setTimeout(r, 800))

        const ok = await trySend(content)
        if (ok) {
            setInput('')
            pendingMessage.current = ''
            setSendStatus('idle')
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    const isBusy = sendStatus === 'sending' || sendStatus === 'retrying'

    // Only show to registered (logged-in) users
    if (!mounted || !isLoggedIn) return null

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
            {/* Chat window */}
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
                            messages.map(msg => (
                                <div
                                    key={msg.id}
                                    className={`flex ${msg.is_admin ? 'justify-start' : 'justify-end'}`}
                                >
                                    <div
                                        className={`max-w-[78%] px-3 py-2 rounded-2xl text-sm leading-relaxed shadow-sm
                                            ${msg.is_admin
                                                ? 'bg-white border border-gray-100 text-gray-800 rounded-tl-sm'
                                                : 'bg-[#140152] text-white rounded-tr-sm'}`}
                                    >
                                        {msg.is_admin && (
                                            <p className="text-[10px] font-bold text-[#f5bb00] mb-1 uppercase tracking-wide">Admin</p>
                                        )}
                                        <p>{msg.content}</p>
                                        <p className={`text-[10px] mt-1 ${msg.is_admin ? 'text-gray-400' : 'text-blue-200'}`}>
                                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}
                        <div ref={bottomRef} />
                    </div>

                    {/* Error / retrying banner */}
                    {(sendStatus === 'error-network' || sendStatus === 'error-server' || sendStatus === 'retrying') && (
                        <div className={`shrink-0 px-4 py-3 flex items-start gap-3 border-t text-sm
                            ${sendStatus === 'error-server'
                                ? 'bg-red-50 border-red-100'
                                : 'bg-amber-50 border-amber-100'}`}
                        >
                            <div className="shrink-0 mt-0.5">
                                {sendStatus === 'retrying'
                                    ? <Loader2 className="w-4 h-4 text-amber-500 animate-spin" />
                                    : sendStatus === 'error-network'
                                        ? <Clock className="w-4 h-4 text-amber-500" />
                                        : <WifiOff className="w-4 h-4 text-red-400" />}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className={`font-semibold text-xs ${sendStatus === 'error-server' ? 'text-red-600' : 'text-amber-700'}`}>
                                    {sendStatus === 'retrying'
                                        ? 'Waking server & retrying…'
                                        : sendStatus === 'error-network'
                                            ? 'Server is warming up…'
                                            : 'Message failed to send'}
                                </p>
                                <p className={`text-xs mt-0.5 ${sendStatus === 'error-server' ? 'text-red-500' : 'text-amber-600'}`}>
                                    {sendStatus === 'retrying'
                                        ? 'Hang on, this usually takes a few seconds.'
                                        : sendStatus === 'error-network'
                                            ? 'Our server may have been asleep. Click Retry — it wakes up within seconds.'
                                            : 'Something went wrong on our end. Please try again.'}
                                </p>
                            </div>
                            {sendStatus !== 'retrying' && (
                                <button
                                    onClick={handleRetry}
                                    className={`shrink-0 flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg transition-all
                                        ${sendStatus === 'error-server'
                                            ? 'bg-red-100 text-red-600 hover:bg-red-200'
                                            : 'bg-amber-100 text-amber-700 hover:bg-amber-200'}`}
                                >
                                    <RefreshCw className="w-3 h-3" />
                                    Retry
                                </button>
                            )}
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
                                    if (sendStatus !== 'idle' && sendStatus !== 'sending' && sendStatus !== 'retrying') {
                                        setSendStatus('idle')
                                    }
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
                                {sendStatus === 'sending'
                                    ? <Loader2 className="w-4 h-4 animate-spin" />
                                    : <Send className="w-4 h-4" />}
                            </button>
                        </div>
                        {sendStatus === 'sending' && (
                            <p className="text-[10px] text-gray-400 mt-1.5 px-1">Sending…</p>
                        )}
                    </div>
                </div>
            )}

            {/* FAB button */}
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
