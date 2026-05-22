'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Loader2, Send, MessageCircle, RefreshCw } from 'lucide-react'
import { chatApi, ChatConversation, ChatMessage } from '@/lib/api'

const POLL_INTERVAL = 4000

export default function AdminChatPage() {
    const [conversations, setConversations] = useState<ChatConversation[]>([])
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
    const [messages, setMessages] = useState<ChatMessage[]>([])
    const [input, setInput] = useState('')
    const [loadingConvs, setLoadingConvs] = useState(true)
    const [loadingMsgs, setLoadingMsgs] = useState(false)
    const [sending, setSending] = useState(false)
    const bottomRef = useRef<HTMLDivElement>(null)
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

    const loadConversations = useCallback(async () => {
        try {
            const data = await chatApi.admin.getConversations()
            setConversations(data)
        } catch {
            // silently fail on poll
        }
    }, [])

    const loadMessages = useCallback(async (userId: string) => {
        try {
            const data = await chatApi.admin.getUserMessages(userId)
            setMessages(data)
        } catch {
            // silently fail on poll
        }
    }, [])

    // Load conversations on mount + poll
    useEffect(() => {
        loadConversations().finally(() => setLoadingConvs(false))
        const interval = setInterval(loadConversations, 10000)
        return () => clearInterval(interval)
    }, [loadConversations])

    // Load messages when user selected + poll
    useEffect(() => {
        if (!selectedUserId) return
        setLoadingMsgs(true)
        loadMessages(selectedUserId).finally(() => setLoadingMsgs(false))
        pollRef.current = setInterval(() => loadMessages(selectedUserId), POLL_INTERVAL)
        return () => { if (pollRef.current) clearInterval(pollRef.current) }
    }, [selectedUserId, loadMessages])

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    const handleSelect = (userId: string) => {
        setSelectedUserId(userId)
        setMessages([])
        // update unread count optimistically
        setConversations(prev => prev.map(c =>
            c.user_id === userId ? { ...c, unread_count: 0 } : c
        ))
    }

    const handleSend = async () => {
        if (!selectedUserId || !input.trim() || sending) return
        setSending(true)
        try {
            const msg = await chatApi.admin.reply(selectedUserId, input.trim())
            setMessages(prev => [...prev, msg])
            setInput('')
            // Refresh conversation list to update last_message
            loadConversations()
        } catch {
            // silently fail
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

    const selectedConv = conversations.find(c => c.user_id === selectedUserId)

    return (
        <div className="h-screen flex flex-col bg-gray-50">
            <div className="p-6 border-b bg-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <MessageCircle className="w-6 h-6 text-[#140152]" />
                    <h1 className="text-2xl font-black text-[#140152]">Live Chat</h1>
                    {conversations.reduce((acc, c) => acc + c.unread_count, 0) > 0 && (
                        <span className="bg-[#f5bb00] text-[#140152] text-xs font-bold px-2 py-0.5 rounded-full">
                            {conversations.reduce((acc, c) => acc + c.unread_count, 0)} unread
                        </span>
                    )}
                </div>
                <button onClick={() => loadConversations()}
                    className="text-gray-400 hover:text-[#140152] transition-colors">
                    <RefreshCw className="w-5 h-5" />
                </button>
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* Conversation list */}
                <div className="w-80 border-r bg-white flex flex-col overflow-hidden">
                    <div className="p-3 border-b">
                        <p className="text-xs text-gray-400 uppercase font-semibold tracking-wider">Conversations</p>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        {loadingConvs ? (
                            <div className="flex justify-center items-center h-32">
                                <Loader2 className="w-6 h-6 animate-spin text-[#140152]" />
                            </div>
                        ) : conversations.length === 0 ? (
                            <div className="text-center text-gray-400 text-sm p-8">
                                No conversations yet.
                            </div>
                        ) : conversations.map(conv => (
                            <button
                                key={conv.user_id}
                                onClick={() => handleSelect(conv.user_id)}
                                className={`w-full text-left px-4 py-3 border-b hover:bg-gray-50 transition-colors
                                    ${selectedUserId === conv.user_id ? 'bg-blue-50 border-l-4 border-l-[#140152]' : ''}`}
                            >
                                <div className="flex items-center justify-between mb-1">
                                    <p className="font-semibold text-sm text-gray-900 truncate">
                                        {conv.user_name || 'Anonymous'}
                                    </p>
                                    {conv.unread_count > 0 && (
                                        <span className="bg-[#f5bb00] text-[#140152] text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center shrink-0">
                                            {conv.unread_count}
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-gray-400 truncate">{conv.user_email}</p>
                                {conv.last_message && (
                                    <p className="text-xs text-gray-500 truncate mt-0.5">{conv.last_message}</p>
                                )}
                                <p className="text-xs text-gray-300 mt-1">
                                    {new Date(conv.updated_at).toLocaleDateString()}
                                </p>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Chat area */}
                <div className="flex-1 flex flex-col">
                    {!selectedUserId ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                            <MessageCircle className="w-16 h-16 mb-4 opacity-20" />
                            <p className="text-lg font-medium">Select a conversation</p>
                            <p className="text-sm">Choose a user from the left to start chatting.</p>
                        </div>
                    ) : (
                        <>
                            {/* Chat header */}
                            <div className="px-6 py-4 border-b bg-white flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-[#140152] flex items-center justify-center text-white font-bold">
                                    {selectedConv?.user_name?.[0]?.toUpperCase() || 'U'}
                                </div>
                                <div>
                                    <p className="font-bold text-[#140152]">{selectedConv?.user_name}</p>
                                    <p className="text-sm text-gray-400">{selectedConv?.user_email}</p>
                                </div>
                            </div>

                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-3 bg-gray-50">
                                {loadingMsgs ? (
                                    <div className="flex justify-center items-center h-full">
                                        <Loader2 className="w-6 h-6 animate-spin text-[#140152]" />
                                    </div>
                                ) : messages.length === 0 ? (
                                    <div className="text-center text-gray-400 text-sm mt-16">
                                        No messages yet. Send the first reply!
                                    </div>
                                ) : messages.map(msg => (
                                    <div key={msg.id}
                                        className={`flex ${msg.is_admin ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed
                                            ${msg.is_admin
                                                ? 'bg-[#140152] text-white rounded-tr-sm'
                                                : 'bg-white border border-gray-100 text-gray-800 rounded-tl-sm shadow-sm'}`}>
                                            {msg.content}
                                            <p className={`text-xs mt-1 ${msg.is_admin ? 'text-blue-200' : 'text-gray-400'}`}>
                                                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                {msg.is_admin ? ' · You' : ''}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                                <div ref={bottomRef} />
                            </div>

                            {/* Reply input */}
                            <div className="p-4 border-t bg-white flex gap-3">
                                <textarea
                                    rows={2}
                                    value={input}
                                    onChange={e => setInput(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder={`Reply to ${selectedConv?.user_name}…`}
                                    className="flex-1 resize-none border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#140152] focus:border-transparent"
                                />
                                <button
                                    onClick={handleSend}
                                    disabled={sending || !input.trim()}
                                    className="bg-[#140152] text-white px-5 py-3 rounded-xl hover:bg-[#1d0175] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 font-semibold"
                                >
                                    {sending
                                        ? <Loader2 className="w-4 h-4 animate-spin" />
                                        : <Send className="w-4 h-4" />}
                                    Send
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}
