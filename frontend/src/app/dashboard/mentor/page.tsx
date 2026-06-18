'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
    Loader2, Users, ArrowRight, MessageCircle, ChevronRight,
    Mail, Clock, MessageSquare, ArrowLeft, UserCheck
} from 'lucide-react'
import { messageApi } from '@/lib/api'
import LeadsPanel from '@/components/governance/LeadsPanel'
import AuditLogPanel from '@/components/governance/AuditLogPanel'

interface Mentee {
    id: string
    mentee_id: string
    mentee_name: string
    mentee_email: string
    subject: string
    last_message_preview: string | null
    last_message_at: string | null
    unread_count: number
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

export default function MentorDashboard() {
    const router = useRouter()
    const [mentees, setMentees] = useState<Mentee[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        const init = async () => {
            try {
                const loggedIn = localStorage.getItem('isLoggedIn')
                if (!loggedIn) {
                    router.push('/auth/login?next=/dashboard/mentor')
                    return
                }
                const data = await messageApi.listMentees()
                setMentees(data || [])
            } catch (err: any) {
                setError(err?.message || 'Failed to load mentees')
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
                            <Users className="w-8 h-8 text-[#f5bb00]" />
                            My Mentees
                        </h1>
                        <p className="text-white/60 text-sm mt-1">Direct messaging with your assigned mentees</p>
                    </div>
                    <Link href="/dashboard/mentee" className="hidden md:flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-white text-sm font-semibold">
                        <UserCheck className="w-4 h-4" />
                        My Mentors
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

                {mentees.length === 0 ? (
                    <div className="text-center py-20 bg-white/5 rounded-3xl border border-white/10 backdrop-blur-sm">
                        <MessageCircle className="w-16 h-16 text-white/30 mx-auto mb-4" />
                        <p className="text-xl font-bold text-white mb-2">No mentees assigned yet</p>
                        <p className="text-white/60 text-sm mb-6">Once admin assigns mentees to you, they'll appear here</p>
                        <Link href="/dashboard" className="text-[#f5bb00] font-bold hover:underline inline-flex items-center gap-2">
                            Back to Dashboard <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                ) : (
                    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                        {mentees.map(mentee => (
                            <Link key={mentee.id} href={`/dashboard/messages?c=${mentee.id}`}>
                                <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-5 hover:bg-white/15 hover:border-white/30 transition-all group h-full">
                                    <div className="flex items-start gap-3 mb-4">
                                        <div className="w-12 h-12 rounded-full bg-[#f5bb00] text-[#140152] flex items-center justify-center font-black text-sm shrink-0">
                                            {initials(mentee.mentee_name)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-white truncate">{mentee.mentee_name}</p>
                                            <a href={`mailto:${mentee.mentee_email}`}
                                                onClick={e => e.preventDefault()}
                                                className="text-xs text-blue-300 hover:underline flex items-center gap-1">
                                                <Mail className="w-3 h-3" /> {mentee.mentee_email}
                                            </a>
                                        </div>
                                        {mentee.unread_count > 0 && (
                                            <span className="text-[10px] font-black bg-[#f5bb00] text-[#140152] px-2 py-1 rounded-full shrink-0">
                                                {mentee.unread_count}
                                            </span>
                                        )}
                                    </div>

                                    {mentee.subject && (
                                        <p className="text-xs font-semibold text-white/80 mb-2 line-clamp-1">{mentee.subject}</p>
                                    )}

                                    <div className="bg-white/5 rounded-xl p-3 mb-4 min-h-[60px] flex flex-col">
                                        {mentee.last_message_preview ? (
                                            <>
                                                <p className="text-sm text-white/70 line-clamp-2 mb-2 flex-1">{mentee.last_message_preview}</p>
                                                <p className="text-[10px] text-white/50 flex items-center gap-1">
                                                    <Clock className="w-3 h-3" /> {formatTime(mentee.last_message_at)}
                                                </p>
                                            </>
                                        ) : (
                                            <p className="text-xs text-white/40 italic">No messages yet</p>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-2 text-[#f5bb00] group-hover:gap-3 transition-all">
                                        <MessageSquare className="w-4 h-4" />
                                        <span className="text-xs font-bold">Send Message</span>
                                        <ChevronRight className="w-4 h-4 ml-auto" />
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}

                <div className="grid lg:grid-cols-2 gap-4 mt-8">
                    <LeadsPanel groupKind="volunteer_team" groupId="mentors" groupLabel="Mentor Team" />
                    <AuditLogPanel groupKind="volunteer_team" groupId="mentors" title="Mentor Team — Activity Log" canCustomLog />
                </div>
            </main>
        </div>
    )
}
