'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { MessageCircle, X, Send, Loader2 } from 'lucide-react'
import { chatApi, ChatMessage } from '@/lib/api'

const POLL_INTERVAL = 5000 // 5 seconds

export default function ChatWidget() {
    const [isOpen, setIsOpen] = useState(false)
    const [messages, setMessages] = useState<ChatMessage[]>([])
    const [input, setInput] = useState('')
    const [loading, setLoading] = useState(false)
    const [sending, setSending] = useState(false)
    const [unread, setUnread] = useState(0)
    const [isLoggedIn, setIsLoggedIn] = useState(false)
    const bottomRef = useRef<HTMLDivElement>(null)
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setIsLoggedIn(!!localStorage.getItem('isLoggedIn'))
        }
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
            // Poll unread count when closed
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

    const handleSend = async () => {
        if (!input.trim() || sending) return
        setSending(true)
        try {
            const msg = await chatApi.sendMessage(input.trim())
            setMessages(prev => [...prev, msg])
            setInput('')
        } catch {
            // could show toast here
        } finally {
            setSending(false)
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    if (!isLoggedIn) return null

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
            {/* Chat window */}
            {isOpen && (
                <div className="mb-4 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden"
                    style={{ height: '480px' }}>
                    {/* Header */}
                    <div className="bg-[#140152] text-white px-4 py-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#f5bb00] flex items-center justify-center">
                                <MessageCircle className="w-4 h-4 text-[#140152]" />
                            </div>
                            <div>
                                <p className="font-bold text-sm">LETW Support</p>
                                <p className="text-xs text-blue-200">Admin team</p>
                            </div>
                        </div>
                        <button onClick={() => setIsOpen(false)}
                            className="text-white/70 hover:text-white transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
                        {loading ? (
                            <div className="flex justify-center items-center h-full">
                                <Loader2 className="w-6 h-6 animate-spin text-[#140152]" />
                            </div>
                        ) : messages.length === 0 ? (
                            <div className="text-center text-gray-400 text-sm mt-8">
                                <MessageCircle className="w-10 h-10 mx-auto mb-2 opacity-30" />
                                <p>Send a message to start a conversation with our team.</p>
                            </div>
                        ) : (
                            messages.map(msg => (
                                <div key={msg.id}
                                    className={`flex ${msg.is_admin ? 'justify-start' : 'justify-end'}`}>
                                    <div className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm leading-relaxed
                                        ${msg.is_admin
                                            ? 'bg-white border border-gray-100 text-gray-800 rounded-tl-sm'
                                            : 'bg-[#140152] text-white rounded-tr-sm'}`}>
                                        {msg.is_admin && (
                                            <p className="text-xs font-semibold text-[#f5bb00] mb-1">Admin</p>
                                        )}
                                        {msg.content}
                                        <p className={`text-xs mt-1 ${msg.is_admin ? 'text-gray-400' : 'text-blue-200'}`}>
                                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}
                        <div ref={bottomRef} />
                    </div>

                    {/* Input */}
                    <div className="p-3 border-t border-gray-100 bg-white flex gap-2">
                        <textarea
                            rows={1}
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Type a message…"
                            className="flex-1 resize-none border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#140152] focus:border-transparent"
                        />
                        <button
                            onClick={handleSend}
                            disabled={sending || !input.trim()}
                            className="bg-[#140152] text-white p-2 rounded-xl hover:bg-[#1d0175] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                        >
                            {sending
                                ? <Loader2 className="w-4 h-4 animate-spin" />
                                : <Send className="w-4 h-4" />}
                        </button>
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
