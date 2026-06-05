'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
    Loader2, Send, MessageCircle, RefreshCw, X,
    User, Circle, Search, CheckCheck, Clock, Trash2,
} from 'lucide-react'
import { messageApi, ChatConversationDetail, ChatConversation } from '@/lib/api'

const POLL_INTERVAL = 4000   // ms — conversations list refresh
const MSG_POLL     = 3000    // ms — messages poll when WS is unavailable

export default function AdminChatPage() {
    const [conversations,   setConversations]   = useState<ChatConversation[]>([])
    const [selectedConvId,  setSelectedConvId]  = useState<string | null>(null)
    const [convDetail,      setConvDetail]       = useState<ChatConversationDetail | null>(null)
    const [input,           setInput]            = useState('')
    const [loadingConvs,    setLoadingConvs]     = useState(true)
    const [loadingMsgs,     setLoadingMsgs]      = useState(false)
    const [sending,         setSending]          = useState(false)
    const [search,          setSearch]           = useState('')
    const [clearingAll,     setClearingAll]      = useState(false)
    const [clearResult,     setClearResult]      = useState<string | null>(null)

    const bottomRef  = useRef<HTMLDivElement>(null)
    const wsRef      = useRef<WebSocket | null>(null)
    const convPollRef = useRef<ReturnType<typeof setInterval> | null>(null)
    const msgPollRef  = useRef<ReturnType<typeof setInterval> | null>(null)
    const selectedRef = useRef<string | null>(null)   // keep ref in sync for callbacks

    // ── load conversations list ───────────────────────────────────────
    const loadConversations = useCallback(async () => {
        try {
            const { conversations: data } = await messageApi.admin.getInbox()
            setConversations(data)
        } catch { /* silently fail on poll */ }
    }, [])

    useEffect(() => {
        loadConversations().finally(() => setLoadingConvs(false))
        convPollRef.current = setInterval(loadConversations, POLL_INTERVAL)
        return () => { if (convPollRef.current) clearInterval(convPollRef.current) }
    }, [loadConversations])

    // ── auto-scroll ───────────────────────────────────────────────────
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [convDetail?.messages])

    // ── load / poll messages for selected conversation ────────────────
    const loadMessages = useCallback(async (convId: string) => {
        try {
            const detail = await messageApi.admin.getConversation(convId)
            setConvDetail(detail)
            // Mark as read
            messageApi.admin.markRead(convId).catch(() => {})
            // Update unread badge in sidebar
            setConversations(prev =>
                prev.map(c => c.id === convId ? { ...c, unread_for_admin: 0, my_unread: 0 } : c)
            )
        } catch { /* ignore */ }
    }, [])

    useEffect(() => {
        selectedRef.current = selectedConvId
        if (!selectedConvId) {
            setConvDetail(null)
            if (msgPollRef.current) { clearInterval(msgPollRef.current); msgPollRef.current = null }
            return
        }
        setLoadingMsgs(true)
        loadMessages(selectedConvId).finally(() => setLoadingMsgs(false))
        msgPollRef.current = setInterval(() => {
            if (selectedRef.current) loadMessages(selectedRef.current)
        }, MSG_POLL)
        return () => { if (msgPollRef.current) clearInterval(msgPollRef.current) }
    }, [selectedConvId, loadMessages])

    // ── WebSocket — admin connects to receive any new messages ────────
    useEffect(() => {
        const url = messageApi.wsUrl()
        if (!url) return

        const ws = new WebSocket(url)
        wsRef.current = ws

        ws.onmessage = (evt) => {
            try {
                const msg = JSON.parse(evt.data)
                if (msg.type === 'message.deleted') {
                    // Optimistically remove deleted message from view
                    if (selectedRef.current && msg.conversation_id === selectedRef.current) {
                        setConvDetail(prev => prev
                            ? { ...prev, messages: prev.messages!.filter(m => m.id !== msg.message_id) }
                            : prev
                        )
                    }
                    loadConversations()
                } else {
                    // If message belongs to the open conversation, refresh it
                    if (selectedRef.current && msg.conversation_id === selectedRef.current) {
                        loadMessages(selectedRef.current)
                    }
                    // Always refresh sidebar list
                    loadConversations()
                }
            } catch { /* ignore bad frames */ }
        }

        ws.onclose = () => {
            wsRef.current = null
            // Fall back to polling — msgPollRef already handles this
        }

        return () => { ws.close() }
    }, [loadMessages, loadConversations])

    // ── select conversation ───────────────────────────────────────────
    const handleSelect = (convId: string) => {
        setSelectedConvId(convId)
        setConvDetail(null)
        setInput('')
    }

    // ── delete message ────────────────────────────────────────────────
    const handleDeleteMessage = async (conversationId: string, messageId: string) => {
        if (!confirm('Delete this message? This cannot be undone.')) return
        try {
            await messageApi.admin.deleteMessage(conversationId, messageId)
            // Optimistic update — remove from local state
            setConvDetail(prev => prev
                ? { ...prev, messages: prev.messages!.filter(m => m.id !== messageId) }
                : prev
            )
            await loadConversations()
        } catch (e: any) {
            alert(e?.message || 'Failed to delete message')
        }
    }

    // ── send message ──────────────────────────────────────────────────
    const handleSend = async () => {
        if (!selectedConvId || !input.trim() || sending) return
        setSending(true)
        try {
            await messageApi.admin.sendMessage(selectedConvId, input.trim())
            setInput('')
            await loadMessages(selectedConvId)
            await loadConversations()
        } catch { /* silently fail */ }
        finally { setSending(false) }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
    }

    // ── helpers ───────────────────────────────────────────────────────
    const fmtTime = (iso: string) =>
        new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

    const fmtDate = (iso: string) => {
        const d = new Date(iso)
        const today = new Date()
        if (d.toDateString() === today.toDateString()) return 'Today'
        const yesterday = new Date(today)
        yesterday.setDate(yesterday.getDate() - 1)
        if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'
        return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
    }

    const selectedConv = conversations.find(c => c.id === selectedConvId)
    const totalUnread  = conversations.reduce((acc, c) => acc + (c.unread_for_admin ?? c.my_unread ?? 0), 0)

    const handleClearAllChats = async () => {
        if (!confirm('Delete ALL chat messages across the entire site?\n\nThis includes:\n• All DM conversations\n• Live chat widget\n• All 7 department group chats\n• Choir chat\n\nThis CANNOT be undone.')) return
        setClearingAll(true)
        setClearResult(null)
        try {
            const token = localStorage.getItem('access_token')
            const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'
            const res = await fetch(`${base}/messages/admin/reset-all-chats`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            })
            if (!res.ok) throw new Error(await res.text())
            const data = await res.json()
            setConversations([])
            setConvDetail(null)
            setSelectedConvId(null)
            setClearResult(`✅ Done — ${data.total} messages deleted`)
            setTimeout(() => setClearResult(null), 5000)
        } catch (e: any) {
            setClearResult(`❌ Failed: ${e?.message || 'error'}`)
            setTimeout(() => setClearResult(null), 5000)
        } finally {
            setClearingAll(false)
        }
    }

    const filtered = conversations.filter(c => {
        const name = c.user?.name || ''
        return name.toLowerCase().includes(search.toLowerCase())
    })

    // ── render ────────────────────────────────────────────────────────
    return (
        <div className="h-screen flex flex-col bg-gray-50">

            {/* Top bar */}
            <div className="shrink-0 px-6 py-4 border-b bg-white flex items-center justify-between shadow-sm gap-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                    <MessageCircle className="w-6 h-6 text-[#140152] shrink-0" />
                    <h1 className="text-2xl font-black text-[#140152]">Member Chat</h1>
                    {totalUnread > 0 && (
                        <span className="bg-[#f5bb00] text-[#140152] text-xs font-bold px-2 py-0.5 rounded-full shrink-0">
                            {totalUnread} unread
                        </span>
                    )}
                    {clearResult && (
                        <span className={`text-xs font-semibold px-3 py-1 rounded-full shrink-0 ${clearResult.startsWith('✅') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {clearResult}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    {/* Delete all chats button */}
                    <button
                        onClick={handleClearAllChats}
                        disabled={clearingAll}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-xl text-xs font-bold transition-colors disabled:opacity-50"
                        title="Delete all chat messages across the entire site"
                    >
                        {clearingAll
                            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            : <Trash2 className="w-3.5 h-3.5" />
                        }
                        {clearingAll ? 'Clearing…' : 'Clear All Chats'}
                    </button>
                    <button
                        onClick={() => loadConversations()}
                        className="text-gray-400 hover:text-[#140152] transition-colors p-1 rounded-lg hover:bg-gray-100"
                        title="Refresh"
                    >
                        <RefreshCw className="w-4 h-4" />
                    </button>
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden">

                {/* ── Sidebar: conversation list ── */}
                <div className="w-72 xl:w-80 border-r bg-white flex flex-col shrink-0 overflow-hidden">
                    {/* Search */}
                    <div className="p-3 border-b">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Search members…"
                                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#140152]/30"
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        {loadingConvs ? (
                            <div className="flex justify-center items-center h-32">
                                <Loader2 className="w-6 h-6 animate-spin text-[#140152]" />
                            </div>
                        ) : filtered.length === 0 ? (
                            <div className="text-center text-gray-400 text-sm p-8 space-y-2">
                                <User className="w-10 h-10 mx-auto opacity-20" />
                                <p className="font-semibold">No conversations yet</p>
                                <p className="text-xs">Registered users can chat via the widget on the site.</p>
                            </div>
                        ) : filtered.map(conv => {
                            const unread = conv.unread_for_admin ?? conv.my_unread ?? 0
                            const initial = conv.user?.name?.[0]?.toUpperCase() || 'U'
                            const isSelected = selectedConvId === conv.id
                            return (
                                <button
                                    key={conv.id}
                                    onClick={() => handleSelect(conv.id)}
                                    className={`w-full text-left px-4 py-3.5 border-b transition-colors
                                        ${isSelected
                                            ? 'bg-[#140152]/5 border-l-4 border-l-[#140152]'
                                            : 'hover:bg-gray-50 border-l-4 border-l-transparent'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="relative shrink-0">
                                            <div className="w-10 h-10 rounded-full bg-[#140152] flex items-center justify-center text-white font-bold text-sm">
                                                {initial}
                                            </div>
                                            {unread > 0 && (
                                                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[#f5bb00] text-[#140152] text-[10px] font-black rounded-full flex items-center justify-center">
                                                    {unread > 9 ? '9+' : unread}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-0.5">
                                                <p className={`text-sm truncate ${unread > 0 ? 'font-black text-gray-900' : 'font-semibold text-gray-700'}`}>
                                                    {conv.user?.name || 'Unknown User'}
                                                </p>
                                                {conv.last_message_at && (
                                                    <span className="text-[10px] text-gray-400 shrink-0 ml-1">
                                                        {fmtDate(conv.last_message_at)}
                                                    </span>
                                                )}
                                            </div>
                                            {conv.last_message_preview && (
                                                <p className={`text-xs truncate ${unread > 0 ? 'text-gray-600 font-medium' : 'text-gray-400'}`}>
                                                    {conv.last_message_preview}
                                                </p>
                                            )}
                                            <div className="flex items-center gap-1 mt-0.5">
                                                <Circle className={`w-1.5 h-1.5 ${conv.status === 'open' ? 'fill-green-500 text-green-500' : 'fill-gray-300 text-gray-300'}`} />
                                                <span className="text-[10px] text-gray-400 capitalize">{conv.status}</span>
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            )
                        })}
                    </div>
                </div>

                {/* ── Chat area ── */}
                <div className="flex-1 flex flex-col overflow-hidden">
                    {!selectedConvId ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-4">
                            <div className="w-20 h-20 bg-[#140152]/5 rounded-3xl flex items-center justify-center">
                                <MessageCircle className="w-10 h-10 text-[#140152]/20" />
                            </div>
                            <div className="text-center">
                                <p className="text-lg font-bold text-gray-500">Select a conversation</p>
                                <p className="text-sm text-gray-400 mt-1">Choose a member from the left to start chatting.</p>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Chat header */}
                            <div className="px-6 py-4 border-b bg-white flex items-center justify-between shrink-0 shadow-sm">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-[#140152] flex items-center justify-center text-white font-bold">
                                        {selectedConv?.user?.name?.[0]?.toUpperCase() || 'U'}
                                    </div>
                                    <div>
                                        <p className="font-bold text-[#140152]">{selectedConv?.user?.name || 'Member'}</p>
                                        <div className="flex items-center gap-1.5">
                                            <Circle className="w-1.5 h-1.5 fill-green-500 text-green-500" />
                                            <p className="text-xs text-gray-400">Registered member</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {selectedConv?.status === 'open' && (
                                        <button
                                            onClick={async () => {
                                                await messageApi.admin.closeConversation(selectedConvId)
                                                loadConversations()
                                                loadMessages(selectedConvId)
                                            }}
                                            className="text-xs text-gray-400 hover:text-red-500 font-semibold px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors flex items-center gap-1.5"
                                        >
                                            <X className="w-3.5 h-3.5" /> Close chat
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
                                {loadingMsgs ? (
                                    <div className="flex justify-center items-center h-full">
                                        <Loader2 className="w-6 h-6 animate-spin text-[#140152]" />
                                    </div>
                                ) : !convDetail?.messages?.length ? (
                                    <div className="text-center text-gray-400 text-sm mt-16">
                                        No messages yet. Send the first reply!
                                    </div>
                                ) : (
                                    convDetail.messages.map((msg, i) => {
                                        const isAdmin = (msg as {sender?: {role?: string}}).sender?.role === 'ADMIN'
                                            || (msg as {sender?: {role?: string}}).sender?.role === 'admin'
                                        const prevMsg = convDetail.messages![i - 1]
                                        const showDate = !prevMsg || fmtDate(msg.created_at) !== fmtDate(prevMsg.created_at)
                                        return (
                                            <React.Fragment key={msg.id}>
                                                {showDate && (
                                                    <div className="flex items-center gap-3 my-2">
                                                        <div className="flex-1 h-px bg-gray-200" />
                                                        <span className="text-xs text-gray-400 font-semibold">{fmtDate(msg.created_at)}</span>
                                                        <div className="flex-1 h-px bg-gray-200" />
                                                    </div>
                                                )}
                                                <div className={`flex items-end gap-1 group/msg ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                                                    {!isAdmin && (
                                                        <div className="w-8 h-8 rounded-full bg-[#140152] flex items-center justify-center text-white text-xs font-bold mr-1 shrink-0">
                                                            {selectedConv?.user?.name?.[0]?.toUpperCase() || 'U'}
                                                        </div>
                                                    )}
                                                    {/* Delete button — left of admin bubbles, right of member bubbles */}
                                                    {isAdmin && (
                                                        <button
                                                            onClick={() => handleDeleteMessage(msg.conversation_id, msg.id)}
                                                            title="Delete message"
                                                            className="opacity-0 group-hover/msg:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-500 shrink-0 self-center"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    )}
                                                    <div className="max-w-[65%]">
                                                        <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm
                                                            ${isAdmin
                                                                ? 'bg-[#140152] text-white rounded-tr-sm'
                                                                : 'bg-white border border-gray-100 text-gray-800 rounded-tl-sm'
                                                            }`}
                                                        >
                                                            {(msg as {body?: string}).body || (msg as {content?: string}).content}
                                                        </div>
                                                        <div className={`flex items-center gap-1 mt-1 px-1 ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                                                            <Clock className="w-2.5 h-2.5 text-gray-400" />
                                                            <span className="text-[10px] text-gray-400">{fmtTime(msg.created_at)}</span>
                                                            {isAdmin && <CheckCheck className="w-3 h-3 text-gray-400" />}
                                                        </div>
                                                    </div>
                                                    {/* Delete button for member messages */}
                                                    {!isAdmin && (
                                                        <button
                                                            onClick={() => handleDeleteMessage(msg.conversation_id, msg.id)}
                                                            title="Delete message"
                                                            className="opacity-0 group-hover/msg:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-500 shrink-0 self-center"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    )}
                                                    {isAdmin && (
                                                        <div className="w-8 h-8 rounded-full bg-[#f5bb00] flex items-center justify-center text-[#140152] text-xs font-black ml-1 shrink-0">
                                                            A
                                                        </div>
                                                    )}
                                                </div>
                                            </React.Fragment>
                                        )
                                    })
                                )}
                                <div ref={bottomRef} />
                            </div>

                            {/* Closed banner */}
                            {selectedConv?.status === 'closed' && (
                                <div className="shrink-0 px-6 py-3 bg-gray-100 border-t border-gray-200 text-center">
                                    <p className="text-xs text-gray-500 font-semibold">This conversation is closed. The member can reopen it by sending a new message.</p>
                                </div>
                            )}

                            {/* Reply input */}
                            {selectedConv?.status !== 'closed' && (
                                <div className="p-4 border-t bg-white shrink-0">
                                    <div className="flex gap-3 items-end">
                                        <textarea
                                            rows={2}
                                            value={input}
                                            onChange={e => setInput(e.target.value)}
                                            onKeyDown={handleKeyDown}
                                            placeholder={`Reply to ${selectedConv?.user?.name || 'member'}… (Enter to send)`}
                                            className="flex-1 resize-none border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#140152] focus:border-transparent transition-all"
                                        />
                                        <button
                                            onClick={handleSend}
                                            disabled={sending || !input.trim()}
                                            className="bg-[#140152] text-white px-5 py-3 rounded-xl hover:bg-[#1d0175] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 font-semibold shrink-0"
                                        >
                                            {sending
                                                ? <Loader2 className="w-4 h-4 animate-spin" />
                                                : <Send className="w-4 h-4" />}
                                            Send
                                        </button>
                                    </div>
                                    <p className="text-[10px] text-gray-400 mt-1.5 px-1">
                                        Your reply will appear instantly in the member's chat widget · Shift+Enter for new line
                                    </p>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}
