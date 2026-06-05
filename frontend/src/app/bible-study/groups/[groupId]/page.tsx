'use client'

import React, { useEffect, useRef, useState, useCallback } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, Send, Loader2, Trash2, Users, MessageSquare, Search, Info, X } from 'lucide-react'
import { bibleStudyApi } from '@/lib/api'

interface GroupMsg {
    id: string
    group_id: string
    user_id: string
    sender_name: string
    content: string
    created_at: string
    edited_at?: string | null
    is_mine: boolean
}

function formatTime(iso: string) {
    const d = new Date(iso)
    const now = new Date()
    const sameDay = d.toDateString() === now.toDateString()
    if (sameDay) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    return d.toLocaleDateString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' })
}

function initials(name: string) {
    return name.split(' ').slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('')
}

// Pastel colour per sender name (stable)
const COLORS = ['#7c3aed','#0369a1','#be123c','#059669','#b45309','#4f46e5','#dc2626']
function senderColor(name: string) {
    let h = 0; for (const c of name) h = (h * 31 + c.charCodeAt(0)) & 0xffffffff
    return COLORS[Math.abs(h) % COLORS.length]
}

export default function GroupChatPage() {
    const params      = useParams()
    const searchParams = useSearchParams()
    const router      = useRouter()
    const groupId     = params?.groupId as string
    const groupName   = searchParams?.get('name') ?? 'Study Group'

    const [messages,   setMessages]    = useState<GroupMsg[]>([])
    const [draft,      setDraft]       = useState('')
    const [loading,    setLoading]     = useState(true)
    const [sending,    setSending]     = useState(false)
    const [error,      setError]       = useState('')
    const [myId,       setMyId]        = useState('')
    const [editingId,  setEditingId]   = useState<string | null>(null)
    const [editText,   setEditText]    = useState('')
    const [showInfo,   setShowInfo]    = useState(false)
    const [members,    setMembers]     = useState<any[]>([])
    const [searching,  setSearching]   = useState(false)
    const [searchQuery, setSearchQuery] = useState('')

    const bottomRef   = useRef<HTMLDivElement>(null)
    const pollRef     = useRef<ReturnType<typeof setInterval> | null>(null)
    const inputRef    = useRef<HTMLTextAreaElement>(null)

    const scrollBottom = () => setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 60)

    const loadMessages = useCallback(async () => {
        try {
            const data = await bibleStudyApi.getGroupMessages(groupId)
            setMessages(data)
        } catch (e: any) {
            if (e?.status === 403) setError('You must join this group before you can chat.')
            else if (e?.status === 401) router.push('/auth/login?next=/bible-study')
        }
    }, [groupId, router])

    useEffect(() => {
        const id = localStorage.getItem('userId') || ''
        setMyId(id)
        loadMessages().finally(() => setLoading(false))
        scrollBottom()
        // Poll every 4 seconds for new messages
        pollRef.current = setInterval(loadMessages, 4000)
        return () => { if (pollRef.current) clearInterval(pollRef.current) }
    }, [loadMessages])

    useEffect(() => { if (!loading) scrollBottom() }, [messages.length, loading])

    const send = async () => {
        if (!draft.trim() || sending) return
        setSending(true)
        const text = draft.trim()
        setDraft('')
        // Optimistic add
        const tmpMsg: GroupMsg = {
            id: 'tmp-' + Date.now(),
            group_id: groupId,
            user_id: myId,
            sender_name: 'You',
            content: text,
            created_at: new Date().toISOString(),
            is_mine: true,
        }
        setMessages(p => [...p, tmpMsg])
        scrollBottom()
        try {
            await bibleStudyApi.sendGroupMessage(groupId, text)
            await loadMessages()
        } catch (e: any) {
            setMessages(p => p.filter(m => m.id !== tmpMsg.id))
            alert('Could not send: ' + (e?.message || 'error'))
            setDraft(text)
        } finally {
            setSending(false)
            inputRef.current?.focus()
        }
    }

    const deleteMsg = async (id: string) => {
        if (!confirm('Delete this message?')) return
        setMessages(p => p.filter(m => m.id !== id))
        try { await bibleStudyApi.deleteGroupMessage(groupId, id) }
        catch { await loadMessages() }
    }

    const editMsg = async (id: string) => {
        if (!editText.trim()) return
        const oldMsg = messages.find(m => m.id === id)
        if (!oldMsg) return
        setMessages(p => p.map(m => m.id === id ? { ...m, content: editText.trim(), edited_at: new Date().toISOString() } : m))
        setEditingId(null)
        try {
            await bibleStudyApi.editGroupMessage(groupId, id, editText.trim())
            await loadMessages()
        } catch (e: any) {
            alert('Edit failed: ' + (e?.message || 'error'))
            await loadMessages()
        }
    }

    const loadGroupInfo = async () => {
        try {
            const info = await bibleStudyApi.getGroupInfo(groupId)
            setMembers(info.members || [])
            setShowInfo(true)
        } catch (e: any) {
            alert('Failed to load group info: ' + (e?.message || 'error'))
        }
    }

    const searchMessages = async () => {
        if (!searchQuery.trim() || searchQuery.length < 2) return
        setSearching(true)
        try {
            const results = await bibleStudyApi.searchGroupMessages(groupId, searchQuery)
            setMessages(results)
        } catch (e: any) {
            alert('Search failed: ' + (e?.message || 'error'))
        } finally {
            setSearching(false)
        }
    }

    if (loading) return (
        <div className="flex items-center justify-center min-h-screen bg-[#ece5dd]">
            <Loader2 className="w-10 h-10 animate-spin text-[#128c7e]" />
        </div>
    )

    if (error) return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-[#ece5dd] gap-4 px-4">
            <MessageSquare className="w-16 h-16 text-gray-400" />
            <p className="text-lg font-bold text-gray-600 text-center">{error}</p>
            <button onClick={() => router.back()} className="text-[#128c7e] font-bold hover:underline">← Go back</button>
        </div>
    )

    return (
        <div className="flex flex-col h-screen bg-[#ece5dd]" style={{ fontFamily: "'Helvetica Neue', sans-serif" }}>

            {/* ── Header (WhatsApp green) ── */}
            <div className="bg-[#128c7e] text-white px-4 py-3 flex items-center gap-2 shadow-md shrink-0">
                <button onClick={() => router.back()} className="p-1 hover:bg-white/10 rounded-full transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center shrink-0">
                    <Users className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="font-bold text-base leading-tight truncate">{groupName}</p>
                    <p className="text-[11px] text-white/70">Bible Study Group</p>
                </div>
                <button onClick={() => setSearching(!searching)} className="p-1 hover:bg-white/10 rounded-full transition-colors" title="Search">
                    <Search className="w-5 h-5" />
                </button>
                <button onClick={loadGroupInfo} className="p-1 hover:bg-white/10 rounded-full transition-colors" title="Group info">
                    <Info className="w-5 h-5" />
                </button>
            </div>

            {/* Search Bar */}
            {searching && (
                <div className="bg-white/10 px-4 py-2 flex gap-2 shrink-0">
                    <input
                        autoFocus
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') searchMessages(); }}
                        placeholder="Search messages…"
                        className="flex-1 bg-white/20 text-white placeholder-white/40 rounded-full px-3 py-1.5 text-sm outline-none"
                    />
                    <button onClick={() => setSearching(false)} className="p-1 text-white/60 hover:text-white">
                        <X className="w-5 h-5" />
                    </button>
                </div>
            )}

            {/* Group Info Panel */}
            {showInfo && (
                <div className="bg-[#f0f0f0] border-t border-gray-200 px-4 py-3 max-h-48 overflow-y-auto shrink-0">
                    <div className="flex items-center justify-between mb-3">
                        <p className="font-bold text-sm text-gray-800">{members.length} Members</p>
                        <button onClick={() => setShowInfo(false)} className="text-gray-400 hover:text-gray-600">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="space-y-2 text-xs">
                        {members.map(m => (
                            <div key={m.id} className="flex items-center gap-2 text-gray-700">
                                <div className="w-6 h-6 bg-[#128c7e] rounded-full text-white flex items-center justify-center font-bold text-[10px]">
                                    {(m.name || 'U').split(' ')[0][0]}
                                </div>
                                <span>{m.name || 'Unknown'}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ── Wallpaper + messages ── */}
            <div
                className="flex-1 overflow-y-auto px-4 py-4 space-y-1"
                style={{
                    backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23c4d7d4\' fill-opacity=\'0.3\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
                }}
            >
                {messages.length === 0 && (
                    <div className="flex justify-center">
                        <div className="bg-[#ffffffcc] rounded-2xl px-4 py-2 text-xs text-gray-500 shadow-sm">
                            No messages yet — be the first to say hello! 👋
                        </div>
                    </div>
                )}

                {/* Date grouping */}
                {messages.map((m, i) => {
                    const showDateSep = i === 0 ||
                        new Date(m.created_at).toDateString() !== new Date(messages[i - 1].created_at).toDateString()

                    return (
                        <React.Fragment key={m.id}>
                            {showDateSep && (
                                <div className="flex justify-center my-3">
                                    <span className="bg-[#ffffffcc] text-gray-500 text-[11px] font-medium rounded-full px-3 py-1 shadow-sm">
                                        {new Date(m.created_at).toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long' })}
                                    </span>
                                </div>
                            )}

                            <div className={`flex items-end gap-1.5 ${m.is_mine ? 'justify-end' : 'justify-start'}`}>
                                {/* Avatar for others */}
                                {!m.is_mine && (
                                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0 mb-1 shadow-sm"
                                        style={{ background: senderColor(m.sender_name) }}>
                                        {initials(m.sender_name)}
                                    </div>
                                )}

                                <div className={`group relative max-w-[72%] ${m.is_mine ? 'items-end' : 'items-start'} flex flex-col`}>
                                    {/* Sender name (for group chats, show for others) */}
                                    {!m.is_mine && (
                                        <span className="text-[11px] font-bold mb-0.5 ml-1" style={{ color: senderColor(m.sender_name) }}>
                                            {m.sender_name}
                                        </span>
                                    )}

                                    {/* Bubble */}
                                    <div className={`relative px-3 py-2 rounded-2xl shadow-sm text-sm leading-relaxed
                                        ${m.is_mine
                                            ? 'bg-[#dcf8c6] text-gray-900 rounded-br-sm'
                                            : 'bg-white text-gray-900 rounded-bl-sm'
                                        } ${m.id.startsWith('tmp-') ? 'opacity-70' : ''}`}
                                        onDoubleClick={() => { if (m.is_mine && !m.id.startsWith('tmp-')) { setEditingId(m.id); setEditText(m.content); } }}>
                                        {editingId === m.id ? (
                                            <div className="flex gap-2">
                                                <input
                                                    autoFocus
                                                    value={editText}
                                                    onChange={e => setEditText(e.target.value)}
                                                    onKeyDown={e => { if (e.key === 'Enter') editMsg(m.id); if (e.key === 'Escape') setEditingId(null); }}
                                                    className="flex-1 bg-transparent text-gray-900 outline-none text-sm"
                                                />
                                                <button onClick={() => editMsg(m.id)} className="text-green-600 font-bold text-xs">✓</button>
                                                <button onClick={() => setEditingId(null)} className="text-red-600 font-bold text-xs">✕</button>
                                            </div>
                                        ) : (
                                            <>
                                                <p className="whitespace-pre-wrap break-words pr-10">{m.content}</p>
                                                {m.edited_at && <span className="text-[9px] text-gray-400 italic"> (edited)</span>}
                                                <span className="text-[10px] text-gray-400 absolute bottom-1.5 right-2.5">
                                                    {formatTime(m.created_at)}
                                                </span>
                                            </>
                                        )}
                                    </div>

                                    {/* Delete button on hover (own messages) */}
                                    {m.is_mine && !m.id.startsWith('tmp-') && (
                                        <button
                                            onClick={() => deleteMsg(m.id)}
                                            className="absolute -top-2 -left-7 opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6 bg-white rounded-full shadow flex items-center justify-center"
                                            title="Delete message"
                                        >
                                            <Trash2 className="w-3 h-3 text-red-500" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </React.Fragment>
                    )
                })}
                <div ref={bottomRef} />
            </div>

            {/* ── Input bar ── */}
            <div className="bg-[#f0f0f0] px-3 py-2 flex items-end gap-2 shrink-0 border-t border-gray-200">
                <textarea
                    ref={inputRef}
                    value={draft}
                    onChange={e => setDraft(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
                    placeholder="Type a message…"
                    rows={1}
                    className="flex-1 resize-none rounded-3xl bg-white border-none outline-none px-4 py-2.5 text-sm text-gray-800 max-h-32 shadow-sm"
                    style={{ lineHeight: '1.4' }}
                />
                <button
                    onClick={send}
                    disabled={!draft.trim() || sending}
                    className="w-11 h-11 bg-[#128c7e] hover:bg-[#0f7a6e] disabled:bg-gray-300 rounded-full flex items-center justify-center transition-colors shadow shrink-0"
                >
                    {sending
                        ? <Loader2 className="w-5 h-5 text-white animate-spin" />
                        : <Send className="w-5 h-5 text-white" />
                    }
                </button>
            </div>
        </div>
    )
}
