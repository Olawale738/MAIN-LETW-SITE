'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, MessageSquare, Users, Trash2, Pin, Search, ChevronDown, ChevronUp, AlertCircle, Settings } from 'lucide-react'
import { bibleStudyApi } from '@/lib/api'
import { useToast } from '@/components/ui/toast'
import { Button } from '@/components/ui/button'

interface ChatMessage {
    id: string
    user_id: string
    sender_name: string
    content: string
    created_at: string
    edited_at?: string | null
}

interface GroupMember {
    id: string
    name: string
    joined_at: string
}

interface GroupData {
    id: string
    name: string
    member_count: number
    members: GroupMember[]
    messages: ChatMessage[]
}

export default function AdminChatModerationPage() {
    const { showToast, ToastComponent } = useToast()

    const [loading, setLoading] = useState(true)
    const [groups, setGroups] = useState<GroupData[]>([])
    const [expandedGroupId, setExpandedGroupId] = useState<string | null>(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

    // Load groups and their messages
    const loadGroupsAndMessages = useCallback(async () => {
        setLoading(true)
        try {
            const settings = await bibleStudyApi.getPublicSettings()
            const groups_list = (settings.study_groups || [])
                .filter(g => typeof g.id === 'string')
                .map(g => ({
                    id: g.id,
                    name: g.name,
                    member_count: g.size || 0,
                    members: [] as GroupMember[],
                    messages: [] as ChatMessage[]
                }))

            // Fetch messages and members for each group
            const groupsWithData = await Promise.all(
                groups_list.map(async (group) => {
                    try {
                        const [info, messages] = await Promise.all([
                            bibleStudyApi.getGroupInfo(group.id),
                            bibleStudyApi.getGroupMessages(group.id)
                        ])

                        return {
                            ...group,
                            member_count: info.members?.length || 0,
                            members: info.members || [],
                            messages: messages || []
                        }
                    } catch (err) {
                        console.log(`Could not load data for group ${group.id}:`, err)
                        return group
                    }
                })
            )

            setGroups(groupsWithData)
        } catch (err) {
            console.error(err)
            showToast('Failed to load groups', 'error')
        } finally {
            setLoading(false)
        }
    }, [showToast])

    useEffect(() => {
        loadGroupsAndMessages()
    }, [loadGroupsAndMessages])

    const deleteMessage = async (groupId: string, messageId: string) => {
        try {
            await bibleStudyApi.deleteGroupMessage(groupId, messageId)
            showToast('Message deleted', 'success')
            setDeleteConfirm(null)

            // Refresh messages
            setGroups(prev => prev.map(g => g.id === groupId ? {
                ...g,
                messages: g.messages.filter(m => m.id !== messageId)
            } : g))
        } catch (err: any) {
            showToast(err?.message || 'Failed to delete message', 'error')
        }
    }

    const toggleGroupExpanded = (groupId: string) => {
        if (expandedGroupId === groupId) {
            setExpandedGroupId(null)
        } else {
            setExpandedGroupId(groupId)
        }
    }

    const filteredGroups = groups.filter(g =>
        g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        g.messages.some(m => m.content.toLowerCase().includes(searchQuery.toLowerCase()))
    )

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <Loader2 className="w-10 h-10 animate-spin text-[#128c7e] mx-auto mb-3" />
                    <p className="text-sm text-gray-500">Loading group chats...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="max-w-6xl space-y-6 pb-12">
            <ToastComponent />

            {/* Header */}
            <div>
                <h1 className="text-3xl font-black text-[#140152] flex items-center gap-3 mb-2">
                    <MessageSquare className="w-8 h-8 text-[#128c7e]" />
                    Admin Chat Moderation
                </h1>
                <p className="text-gray-600">View, moderate, and manage all Bible Study group chats</p>
            </div>

            {/* Search Bar */}
            <div className="relative">
                <Search className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                <input
                    type="text"
                    placeholder="Search groups or messages..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#128c7e]"
                />
            </div>

            {/* Groups List */}
            <div className="space-y-3">
                {filteredGroups.length === 0 ? (
                    <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl p-12 text-center">
                        <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 font-semibold">{searchQuery ? 'No results found' : 'No groups available'}</p>
                    </div>
                ) : (
                    filteredGroups.map(group => (
                        <motion.div
                            key={group.id}
                            layout
                            className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
                        >
                            {/* Group Header */}
                            <button
                                onClick={() => toggleGroupExpanded(group.id)}
                                className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                            >
                                <div className="flex items-center gap-4 flex-1 text-left">
                                    <div className="w-12 h-12 rounded-lg bg-[#128c7e] text-white flex items-center justify-center flex-shrink-0">
                                        <MessageSquare className="w-6 h-6" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-bold text-[#140152] text-base">{group.name}</h3>
                                        <p className="text-xs text-gray-500 mt-0.5">{group.member_count} members · {group.messages.length} messages</p>
                                    </div>
                                </div>
                                {expandedGroupId === group.id ? (
                                    <ChevronUp className="w-5 h-5 text-gray-400" />
                                ) : (
                                    <ChevronDown className="w-5 h-5 text-gray-400" />
                                )}
                            </button>

                            {/* Expanded Content */}
                            <AnimatePresence>
                                {expandedGroupId === group.id && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="border-t border-gray-200 bg-gray-50 px-6 py-4"
                                    >
                                        <div className="space-y-6">
                                            {/* Members Section */}
                                            <div>
                                                <h4 className="font-bold text-[#140152] text-sm mb-3 flex items-center gap-2">
                                                    <Users className="w-4 h-4 text-[#128c7e]" />
                                                    Members ({group.members.length})
                                                </h4>
                                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                                                    {group.members.map(member => (
                                                        <div key={member.id} className="bg-white rounded-lg border border-gray-200 p-3">
                                                            <p className="font-semibold text-sm text-[#140152]">{member.name}</p>
                                                            <p className="text-xs text-gray-500 mt-1">Joined {new Date(member.joined_at).toLocaleDateString()}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Messages Section */}
                                            <div>
                                                <h4 className="font-bold text-[#140152] text-sm mb-3 flex items-center gap-2">
                                                    <MessageSquare className="w-4 h-4 text-[#128c7e]" />
                                                    Messages ({group.messages.length})
                                                </h4>

                                                {group.messages.length === 0 ? (
                                                    <div className="bg-white rounded-lg border border-dashed border-gray-200 p-4 text-center">
                                                        <p className="text-xs text-gray-500">No messages yet</p>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-3 max-h-96 overflow-y-auto">
                                                        {[...group.messages].reverse().map(msg => (
                                                            <div key={msg.id} className="bg-white rounded-lg border border-gray-200 p-4">
                                                                <div className="flex items-start justify-between mb-2">
                                                                    <div>
                                                                        <p className="font-semibold text-sm text-[#140152]">{msg.sender_name}</p>
                                                                        <p className="text-xs text-gray-500">{new Date(msg.created_at).toLocaleString()}</p>
                                                                    </div>
                                                                    <div className="flex gap-1.5">
                                                                        <button
                                                                            title="Pin message"
                                                                            className="p-2 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors text-xs"
                                                                        >
                                                                            <Pin className="w-4 h-4" />
                                                                        </button>
                                                                        <button
                                                                            onClick={() => setDeleteConfirm(deleteConfirm === msg.id ? null : msg.id)}
                                                                            className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors text-xs"
                                                                            title="Delete message"
                                                                        >
                                                                            <Trash2 className="w-4 h-4" />
                                                                        </button>
                                                                    </div>
                                                                </div>

                                                                <p className="text-sm text-gray-700 mb-3 break-words">{msg.content}</p>

                                                                {msg.edited_at && (
                                                                    <p className="text-[10px] text-gray-400 italic mb-2">(edited)</p>
                                                                )}

                                                                {/* Delete Confirmation */}
                                                                {deleteConfirm === msg.id && (
                                                                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-3">
                                                                        <p className="text-xs text-red-700 font-semibold mb-2">Delete this message?</p>
                                                                        <div className="flex gap-2">
                                                                            <Button
                                                                                onClick={() => deleteMessage(group.id, msg.id)}
                                                                                className="bg-red-600 text-white hover:bg-red-700 text-xs"
                                                                            >
                                                                                Delete
                                                                            </Button>
                                                                            <Button
                                                                                onClick={() => setDeleteConfirm(null)}
                                                                                variant="outline"
                                                                                className="text-xs"
                                                                            >
                                                                                Cancel
                                                                            </Button>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    ))
                )}
            </div>

            {/* Info Box */}
            {groups.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3">
                    <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-700">
                        <p className="font-semibold">👨‍⚖️ Moderation Powers</p>
                        <ul className="mt-2 space-y-1 text-xs">
                            <li>• View all group members and their join dates</li>
                            <li>• See all messages in real-time</li>
                            <li>• Delete inappropriate messages immediately</li>
                            <li>• Pin important messages (coming soon)</li>
                            <li>• Monitor group activity and conversations</li>
                        </ul>
                    </div>
                </div>
            )}
        </div>
    )
}
