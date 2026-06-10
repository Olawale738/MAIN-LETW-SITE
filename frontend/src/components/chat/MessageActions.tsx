'use client'
/**
 * Message Actions Component
 * Provides emoji reactions, reply, star, pin, forward, edit, delete, copy.
 * Drop into any chat UI to enable 360-degree message interactions.
 */
import React, { useState, useEffect } from 'react'
import {
    Smile, Reply, Star, Pin, Forward, Edit2, Trash2, Copy,
    MoreVertical, Check, X, Heart, ThumbsUp, ThumbsDown,
    Laugh, Frown, Lightbulb,
} from 'lucide-react'
import { chatExtensionsApi, Reaction } from '@/lib/chat-extensions-api'

const QUICK_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🙏', '🔥', '🎉']
const FULL_EMOJI_GROUPS = [
    { label: 'Smileys', emojis: ['😀','😃','😄','😁','😆','😅','😂','🤣','😊','😇','🙂','🙃','😉','😌','😍','🥰','😘','😗','😙','😚','😋','😛','😝','😜','🤪','🤨','🧐','🤓','😎','🤩','🥳'] },
    { label: 'Reactions', emojis: ['❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔','❣️','💕','💞','💓','💗','💖','💘','💝','💟','♥️','💯','💢','💥','💫','💦','💨','🕳️','💣','💬','👁️‍🗨️','🗨️','🗯️','💭','💤'] },
    { label: 'Hands', emojis: ['👍','👎','👊','✊','🤛','🤜','🤞','✌️','🤟','🤘','👌','🤏','👈','👉','👆','👇','☝️','✋','🤚','🖐️','🖖','👋','🤙','💪','🦾','🙏','✍️','💅'] },
    { label: 'Symbols', emojis: ['🎉','🎊','🎈','🎁','🎀','✨','🌟','⭐','🌠','🔥','💥','💫','💢','⚡','☀️','🌙','⛅','🌈','☔','❄️','⛄','🎇','🎆'] },
    { label: 'Faith', emojis: ['🙏','✝️','⛪','📖','🕊️','😇','👼','🌅','💒','🛐','📿','🕯️','✨','🌟','⭐'] },
]

export interface MessageActionsProps {
    messageId: string
    senderId: string
    body: string
    conversationId?: string
    currentUserId: string
    isOwn?: boolean
    onReply?: (messageId: string, body: string) => void
    onForward?: (messageId: string) => void
    onEdit?: (messageId: string, newBody: string) => void
    onDelete?: (messageId: string, forEveryone: boolean) => void
    onUpdate?: () => void
}

export function MessageActions({
    messageId, senderId, body, conversationId, currentUserId, isOwn,
    onReply, onForward, onEdit, onDelete, onUpdate,
}: MessageActionsProps) {
    const [showActions, setShowActions] = useState(false)
    const [showEmojiPicker, setShowEmojiPicker] = useState(false)
    const [showFullEmojis, setShowFullEmojis] = useState(false)
    const [reactions, setReactions] = useState<Reaction[]>([])
    const [starred, setStarred] = useState(false)
    const [pinned, setPinned] = useState(false)
    const [editMode, setEditMode] = useState(false)
    const [editText, setEditText] = useState(body)

    useEffect(() => {
        chatExtensionsApi.getReactions(messageId).then(setReactions).catch(() => {})
    }, [messageId])

    const addReaction = async (emoji: string) => {
        try {
            await chatExtensionsApi.addReaction(messageId, emoji)
            const updated = await chatExtensionsApi.getReactions(messageId)
            setReactions(updated)
            setShowEmojiPicker(false)
            setShowFullEmojis(false)
            onUpdate?.()
        } catch (e) { console.error(e) }
    }

    const removeReaction = async (emoji: string) => {
        try {
            await chatExtensionsApi.removeReaction(messageId, emoji)
            const updated = await chatExtensionsApi.getReactions(messageId)
            setReactions(updated)
            onUpdate?.()
        } catch (e) { console.error(e) }
    }

    const toggleReaction = (emoji: string) => {
        const myReaction = reactions.find(r =>
            r.emoji === emoji && r.users.some(u => u.id === currentUserId)
        )
        if (myReaction) removeReaction(emoji)
        else addReaction(emoji)
    }

    const handleStar = async () => {
        try {
            if (starred) {
                await chatExtensionsApi.unstarMessage(messageId)
                setStarred(false)
            } else {
                await chatExtensionsApi.starMessage(messageId)
                setStarred(true)
            }
        } catch (e) { console.error(e) }
    }

    const handlePin = async () => {
        if (!conversationId) return
        try {
            if (pinned) {
                await chatExtensionsApi.unpinMessage(conversationId, messageId)
                setPinned(false)
            } else {
                await chatExtensionsApi.pinMessage(conversationId, messageId)
                setPinned(true)
            }
        } catch (e) { console.error(e) }
    }

    const handleCopy = () => {
        navigator.clipboard.writeText(body)
        setShowActions(false)
    }

    const handleSaveEdit = async () => {
        if (!editText.trim() || editText === body) {
            setEditMode(false); return
        }
        try {
            await chatExtensionsApi.editMessage(messageId, editText)
            onEdit?.(messageId, editText)
            setEditMode(false)
        } catch (e) {
            alert((e as Error).message)
        }
    }

    const handleDelete = async (forEveryone: boolean) => {
        if (!confirm(forEveryone ? 'Delete for everyone?' : 'Delete for me?')) return
        try {
            await chatExtensionsApi.deleteMessage(messageId, forEveryone)
            onDelete?.(messageId, forEveryone)
            setShowActions(false)
        } catch (e) {
            alert((e as Error).message)
        }
    }

    // Edit mode UI
    if (editMode) {
        return (
            <div className="my-1 p-2 bg-blue-50 border border-blue-200 rounded-lg space-y-2">
                <textarea
                    value={editText}
                    onChange={e => setEditText(e.target.value)}
                    rows={2}
                    autoFocus
                    className="w-full p-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
                <div className="flex gap-2 justify-end">
                    <button onClick={() => { setEditMode(false); setEditText(body) }}
                        className="px-3 py-1.5 text-xs font-bold rounded-md hover:bg-white">
                        <X className="w-3 h-3 inline mr-1" /> Cancel
                    </button>
                    <button onClick={handleSaveEdit}
                        className="px-3 py-1.5 text-xs font-bold rounded-md bg-blue-600 text-white hover:bg-blue-700">
                        <Check className="w-3 h-3 inline mr-1" /> Save
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="relative inline-flex flex-col gap-1">
            {/* Reactions display */}
            {reactions.length > 0 && (
                <div className={`flex flex-wrap gap-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                    {reactions.map(r => {
                        const isMine = r.users.some(u => u.id === currentUserId)
                        return (
                            <button key={r.emoji} onClick={() => toggleReaction(r.emoji)}
                                title={r.users.map(u => u.name).join(', ')}
                                className={`flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs transition-all hover:scale-110 ${
                                    isMine
                                        ? 'bg-blue-50 border-blue-200 text-blue-700'
                                        : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                                }`}>
                                <span>{r.emoji}</span>
                                <span className="font-bold">{r.count}</span>
                            </button>
                        )
                    })}
                </div>
            )}

            {/* Action buttons (visible on hover) */}
            <div className={`flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ${isOwn ? 'justify-end' : 'justify-start'}`}>
                <button onClick={() => setShowEmojiPicker(p => !p)}
                    title="React"
                    className="p-1.5 rounded-full hover:bg-gray-200 text-gray-500 hover:text-gray-700">
                    <Smile className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => onReply?.(messageId, body)}
                    title="Reply"
                    className="p-1.5 rounded-full hover:bg-gray-200 text-gray-500 hover:text-gray-700">
                    <Reply className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => setShowActions(p => !p)}
                    title="More"
                    className="p-1.5 rounded-full hover:bg-gray-200 text-gray-500 hover:text-gray-700">
                    <MoreVertical className="w-3.5 h-3.5" />
                </button>
            </div>

            {/* Emoji picker - quick row */}
            {showEmojiPicker && (
                <div className="absolute z-50 bg-white rounded-xl border border-gray-200 shadow-lg p-2 -top-12 left-0 flex items-center gap-1">
                    {QUICK_EMOJIS.map(e => (
                        <button key={e} onClick={() => addReaction(e)}
                            className="text-xl hover:scale-125 transition-transform p-1">
                            {e}
                        </button>
                    ))}
                    <div className="w-px h-6 bg-gray-200 mx-1" />
                    <button onClick={() => { setShowFullEmojis(true); setShowEmojiPicker(false) }}
                        className="text-sm px-2 py-1 rounded-md bg-gray-100 hover:bg-gray-200 font-bold">
                        +
                    </button>
                </div>
            )}

            {/* Full emoji picker */}
            {showFullEmojis && (
                <div className="absolute z-50 bg-white rounded-xl border border-gray-200 shadow-2xl p-3 w-72 max-h-80 overflow-y-auto -top-2 left-0">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-bold text-gray-600">Choose emoji</p>
                        <button onClick={() => setShowFullEmojis(false)}>
                            <X className="w-4 h-4 text-gray-400" />
                        </button>
                    </div>
                    {FULL_EMOJI_GROUPS.map(g => (
                        <div key={g.label} className="mb-3">
                            <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">{g.label}</p>
                            <div className="grid grid-cols-8 gap-1">
                                {g.emojis.map(e => (
                                    <button key={e} onClick={() => addReaction(e)}
                                        className="text-xl hover:scale-125 transition-transform p-1 rounded hover:bg-gray-100">
                                        {e}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* More actions menu */}
            {showActions && (
                <div className={`absolute z-50 bg-white rounded-xl border border-gray-200 shadow-2xl py-1 w-56 ${isOwn ? 'right-0' : 'left-0'} top-8`}>
                    <button onClick={() => { onReply?.(messageId, body); setShowActions(false) }}
                        className="w-full text-left px-4 py-2.5 hover:bg-gray-50 flex items-center gap-3 text-sm">
                        <Reply className="w-4 h-4 text-gray-500" /> Reply
                    </button>
                    <button onClick={() => { handleStar(); setShowActions(false) }}
                        className="w-full text-left px-4 py-2.5 hover:bg-gray-50 flex items-center gap-3 text-sm">
                        <Star className={`w-4 h-4 ${starred ? 'fill-amber-400 text-amber-400' : 'text-gray-500'}`} />
                        {starred ? 'Unstar' : 'Star'}
                    </button>
                    {conversationId && (
                        <button onClick={() => { handlePin(); setShowActions(false) }}
                            className="w-full text-left px-4 py-2.5 hover:bg-gray-50 flex items-center gap-3 text-sm">
                            <Pin className={`w-4 h-4 ${pinned ? 'fill-blue-500 text-blue-500' : 'text-gray-500'}`} />
                            {pinned ? 'Unpin' : 'Pin'}
                        </button>
                    )}
                    <button onClick={() => { onForward?.(messageId); setShowActions(false) }}
                        className="w-full text-left px-4 py-2.5 hover:bg-gray-50 flex items-center gap-3 text-sm">
                        <Forward className="w-4 h-4 text-gray-500" /> Forward
                    </button>
                    <button onClick={handleCopy}
                        className="w-full text-left px-4 py-2.5 hover:bg-gray-50 flex items-center gap-3 text-sm">
                        <Copy className="w-4 h-4 text-gray-500" /> Copy text
                    </button>
                    {isOwn && (
                        <>
                            <div className="my-1 border-t border-gray-100" />
                            <button onClick={() => { setEditMode(true); setShowActions(false) }}
                                className="w-full text-left px-4 py-2.5 hover:bg-gray-50 flex items-center gap-3 text-sm">
                                <Edit2 className="w-4 h-4 text-gray-500" /> Edit (15 min)
                            </button>
                            <button onClick={() => handleDelete(false)}
                                className="w-full text-left px-4 py-2.5 hover:bg-red-50 text-red-600 flex items-center gap-3 text-sm">
                                <Trash2 className="w-4 h-4" /> Delete for me
                            </button>
                            <button onClick={() => handleDelete(true)}
                                className="w-full text-left px-4 py-2.5 hover:bg-red-50 text-red-600 flex items-center gap-3 text-sm">
                                <Trash2 className="w-4 h-4" /> Delete for everyone
                            </button>
                        </>
                    )}
                </div>
            )}

            {/* Close on outside click */}
            {(showActions || showEmojiPicker || showFullEmojis) && (
                <div className="fixed inset-0 z-40"
                    onClick={() => { setShowActions(false); setShowEmojiPicker(false); setShowFullEmojis(false) }} />
            )}
        </div>
    )
}
