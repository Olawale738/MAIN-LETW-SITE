'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
    Loader2, Users, ArrowRight, MessageCircle, ChevronRight,
    Mail, Clock, MessageSquare, ArrowLeft, UserCheck
} from 'lucide-react'
import { messageApi } from '@/lib/api'

interface MentorConversation {
    id: string
    mentor_id: string
    mentor_name: string
    mentor_email: string
    subject: string
    last_message_preview: string | null
    last_message_at: string | null
    unread_count: number
    is_closed: boolean
}

function formatTime(iso: string | null) {
    if (!iso) return 'No messages yet'
    const d = new Date(iso)
    const now = new Date()
    const sameDay = d.toDateString() === now.toDateString()
    if (sameDay) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    const diff = (now.getTime() - d.getTime()) / 86400000
    if (diff < 7) return d.toLocaleDateString([], { weekday: 'short' })
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

function initials(name: string) {
    return name.split(' ').slice(0, 2).map(w => w[0]?.toUpperCase()).join('')
}

function randomColor() {
    const colors = ['#7c3aed', '#0284c7', '#059669', '#d97706', '#dc2626', '#db2777', '#ea580c']
    return colors[Math.floor(Math.random() * colors.length)]
}

export default function MenteeDashboard() {
    const router = useRouter()
    const [mentorConversations, setMentorConversations] = useState<MentorConversation[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        const init = async () => {
            try {
                const loggedIn = localStorage.getItem('isLoggedIn')
                if (!loggedIn) {
                    router.push('/auth/login?next=/dashboard/mentee')
                    return
                }

                const conversations = await messageApi.listConversations()

                // Filter conversations where current user is mentee (user_id) and has a mentor (admin exists)
                const mentorConvs = conversations.conversations
                    .filter(conv => {
                        // Show conversations where there's a mentor (admin participant)
                        return conv.admin && conv.status !== 'closed'
                    })
                    .map(conv => ({
                        id: conv.id,
                        mentor_id: conv.admin?.id || '',
                        mentor_name: conv.admin?.name || 'Your Mentor',
                        mentor_email: conv.admin?.email || '',
                        subject: conv.subject || 'Mentoring',
                        last_message_preview: conv.last_message_preview || null,
                        last_message_at: conv.last_message_at || null,
                        unread_count: conv.unread_for_user || 0,
                        is_closed: conv.status === 'closed',
                    }))

                setMentorConversations(mentorConvs)
            } catch (err: any) {
                console.error(err)
                setError(err?.message || 'Failed to load mentors')
            } finally {
                setLoading(false)
            }
        }
        init()
    }, [router])

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-[#140152]">
                <Loader2 className="w-12 h-12 animate-spin text-white" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#140152] to-purple-900">
            {/* Header */}
            <div className="bg-[#140152]/80 backdrop-blur-sm border-b border-white/10 px-4 md:px-12 py-6">
                <div className="max-w-6xl mx-auto flex items-center gap-4">
                    <button onClick={() => router.back()} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                        <ArrowLeft className="w-5 h-5 text-white" />
                    </button>
                    <div className="flex-1">
                        <h1 className="text-2xl md:text-3xl font-black text-white flex items-center gap-3">
                            <UserCheck className="w-8 h-8 text-[#f5bb00]" />
                            My Mentors
                        </h1>
                        <p className="text-white/60 text-sm mt-1">Direct messaging with your assigned mentors</p>
                    </div>
                    <Link href="/dashboard/mentor" className="hidden md:flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-white text-sm font-semibold">
                        <Users className="w-4 h-4" />
                        My Mentees
                        <ChevronRight className="w-4 h-4" />
                    </Link>
                </div>
            </div>

            {/* Body */}
            <main className="max-w-6xl mx-auto px-4 md:px-12 py-12">
                {error && (
                    <div className="bg-red-500/10 border border-red-500/30 text-red-200 rounded-2xl p-4 mb-6">
                        {error}
                    </div>
                )}

                {mentorConversations.length === 0 ? (
                    <div className="text-center py-20 bg-white/5 rounded-3xl border border-white/10 backdrop-blur-sm">
                        <MessageCircle className="w-16 h-16 text-white/30 mx-auto mb-4" />
                        <p className="text-xl font-bold text-white mb-2">No mentors assigned yet</p>
                        <p className="text-white/60 mb-2">Once an admin assigns you a mentor, you'll see them here</p>
                        <p className="text-sm text-white/40 mb-6">Contact your church coordinator to request a Bible study mentor</p>
                        <Link href="/dashboard" className="inline-flex items-center gap-2 px-6 py-3 bg-[#f5bb00] text-[#140152] rounded-xl font-bold hover:bg-white transition-colors">
                            Back to Dashboard
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {mentorConversations.map(conv => (
                            <Link
                                key={conv.id}
                                href={`/dashboard/messages?conversation=${conv.id}`}
                                className="block group"
                            >
                                <div className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/20 hover:border-white/20 transition-all">
                                    <div className="flex items-start gap-4">
                                        {/* Avatar */}
                                        <div
                                            className="w-14 h-14 rounded-xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0 group-hover:scale-105 transition-transform"
                                            style={{ backgroundColor: randomColor() }}
                                        >
                                            {initials(conv.mentor_name)}
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between mb-2">
                                                <div>
                                                    <h3 className="text-lg font-bold text-white group-hover:text-[#f5bb00] transition-colors">{conv.mentor_name}</h3>
                                                    <p className="text-white/60 text-sm">{conv.mentor_email}</p>
                                                </div>
                                                {conv.unread_count > 0 && (
                                                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-[#f5bb00] text-[#140152] text-xs font-bold flex-shrink-0">
                                                        {conv.unread_count}
                                                    </div>
                                                )}
                                            </div>
                                            <p className="text-white/40 text-sm mb-3">{conv.subject}</p>
                                            {conv.last_message_preview ? (
                                                <>
                                                    <p className="text-white/80 text-sm line-clamp-2 mb-2">{conv.last_message_preview}</p>
                                                    <div className="flex items-center gap-2 text-white/40 text-xs">
                                                        <Clock className="w-3 h-3" />
                                                        {formatTime(conv.last_message_at)}
                                                    </div>
                                                </>
                                            ) : (
                                                <p className="text-white/40 text-sm italic">No messages yet</p>
                                            )}
                                        </div>

                                        {/* Arrow */}
                                        <MessageSquare className="w-5 h-5 text-white/40 group-hover:text-white group-hover:translate-x-1 transition-all flex-shrink-0 mt-1" />
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}

                {/* Info section */}
                {mentorConversations.length > 0 && (
                    <div className="mt-12 bg-blue-500/10 border border-blue-500/30 rounded-2xl p-6">
                        <h3 className="text-white font-bold mb-3 flex items-center gap-2">
                            <MessageCircle className="w-5 h-5 text-[#f5bb00]" />
                            About Mentoring
                        </h3>
                        <ul className="text-white/80 text-sm space-y-2">
                            <li>• Click on any mentor to chat directly with them</li>
                            <li>• Your mentor is assigned by the church admin to help guide your spiritual growth</li>
                            <li>• You can message anytime and get responses when they're available</li>
                            <li>• Questions about Scripture? Ask your mentor!</li>
                        </ul>
                    </div>
                )}
            </main>
        </div>
    )
}
