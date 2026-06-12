'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
    Loader2, ArrowLeft, Megaphone, Calendar, BookOpen, Download, Play,
    Sparkles, ChevronRight, Lock, ExternalLink, LayoutDashboard,
} from 'lucide-react'
import * as LucideIcons from 'lucide-react'
import { youthProgramApi, YouthProgram } from '@/lib/api'

const getIcon = (name?: string) => {
    if (!name) return Sparkles
    const I = (LucideIcons as any)[name]
    return I || Sparkles
}

export default function YouthProgramDashboard() {
    const params = useParams<{ slug: string }>()
    const slug = params?.slug

    const [program, setProgram] = useState<YouthProgram | null>(null)
    const [loading, setLoading] = useState(true)
    const [notFound, setNotFound] = useState(false)
    const [isLoggedIn, setIsLoggedIn] = useState(false)
    const [authChecked, setAuthChecked] = useState(false)

    useEffect(() => {
        const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null
        setIsLoggedIn(!!token)
        setAuthChecked(true)
    }, [])

    useEffect(() => {
        if (!slug) return
        let cancelled = false
        ;(async () => {
            try {
                const p = await youthProgramApi.get(slug as string)
                if (!cancelled) setProgram(p)
            } catch (e) {
                if (!cancelled) setNotFound(true)
            } finally {
                if (!cancelled) setLoading(false)
            }
        })()
        return () => { cancelled = true }
    }, [slug])

    if (loading || !authChecked) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center bg-neutral-50">
                <Loader2 className="w-10 h-10 animate-spin text-[#140152]" />
            </div>
        )
    }

    if (!isLoggedIn) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center bg-neutral-50 text-center p-8">
                <div className="w-16 h-16 bg-[#140152] rounded-full flex items-center justify-center mb-4">
                    <Lock className="w-8 h-8 text-[#f5bb00]" />
                </div>
                <p className="text-2xl font-black text-[#140152] mb-2">Sign in to view your dashboard</p>
                <p className="text-gray-500 mb-6">This is a members-only area for program participants.</p>
                <Link href={`/auth/login?next=/youth/${slug}/dashboard`} className="inline-flex items-center gap-2 bg-[#140152] text-white font-bold px-6 py-3 rounded-full">
                    Sign In
                </Link>
            </div>
        )
    }

    if (notFound || !program) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center bg-neutral-50 text-center p-8">
                <p className="text-2xl font-black text-[#140152] mb-2">Program not found</p>
                <Link href="/youth" className="inline-flex items-center gap-2 bg-[#140152] text-white font-bold px-6 py-3 rounded-full mt-4">
                    <ArrowLeft className="w-4 h-4" /> Back to Youth Ministry
                </Link>
            </div>
        )
    }

    const HeroIcon = getIcon(program.icon)
    const announcements = program.announcements || []
    const resources = program.resources || []
    const schedule = program.schedule || []

    return (
        <div className="min-h-screen bg-neutral-50">
            {/* Header strip */}
            <div className="bg-gradient-to-br from-[#0a0028] via-[#140152] to-[#0a0028] text-white">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
                    <Link href={`/youth/${program.slug}`} className="inline-flex items-center gap-2 text-white/70 hover:text-[#f5bb00] text-sm font-bold mb-5 transition-colors">
                        <ArrowLeft className="w-4 h-4" /> Program overview
                    </Link>
                    <div className="flex items-center gap-4 flex-wrap">
                        <div className="w-14 h-14 rounded-2xl bg-[#f5bb00]/20 flex items-center justify-center backdrop-blur-sm border border-[#f5bb00]/30">
                            <HeroIcon className="w-7 h-7 text-[#f5bb00]" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-[#f5bb00] mb-1 inline-flex items-center gap-1.5">
                                <LayoutDashboard className="w-3 h-3" /> Member Dashboard
                            </p>
                            <h1 className="text-2xl md:text-4xl font-black leading-tight truncate">{program.title}</h1>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-12 space-y-10">
                {/* Announcements */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Megaphone className="w-5 h-5 text-[#140152]" />
                            Announcements
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {announcements.length === 0 ? (
                            <div className="text-center py-10 text-gray-500">
                                <p className="font-bold">No announcements yet.</p>
                                <p className="text-sm mt-1">Check back here — the coordinator posts updates and reminders for the program.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {announcements.map((a, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.04 }}
                                        className={`p-4 rounded-xl border ${a.urgent ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'}`}
                                    >
                                        <div className="flex items-start justify-between gap-3 mb-1">
                                            <p className={`font-black ${a.urgent ? 'text-red-700' : 'text-[#140152]'}`}>{a.title}</p>
                                            {a.date && <span className="text-xs text-gray-500 shrink-0">{new Date(a.date).toLocaleDateString()}</span>}
                                        </div>
                                        {a.body && <p className={`text-sm leading-relaxed ${a.urgent ? 'text-red-800/90' : 'text-gray-700'}`}>{a.body}</p>}
                                        {a.urgent && (
                                            <span className="inline-block mt-2 text-[10px] font-bold uppercase tracking-wider bg-red-100 text-red-700 px-2 py-0.5 rounded">Urgent</span>
                                        )}
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Schedule + Resources two-column */}
                <div className="grid lg:grid-cols-2 gap-6">
                    {/* Schedule */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-[#140152]" />
                                When We Meet
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {schedule.length === 0 ? (
                                <p className="text-gray-500 text-sm text-center py-6">No schedule set yet. The coordinator will publish meeting times here.</p>
                            ) : (
                                <div className="space-y-3">
                                    {schedule.map((s, i) => (
                                        <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
                                            <div className="shrink-0 w-12 h-12 rounded-lg bg-[#140152] text-white flex flex-col items-center justify-center font-black text-[10px] leading-tight text-center px-1">
                                                {s.day}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                {s.time && <p className="text-[10px] font-bold uppercase tracking-wider text-[#f5bb00] mb-0.5">{s.time}</p>}
                                                {s.title && <p className="font-bold text-[#140152] text-sm leading-tight">{s.title}</p>}
                                                {s.description && <p className="text-xs text-gray-600 mt-1 leading-relaxed">{s.description}</p>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Resources */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <BookOpen className="w-5 h-5 text-[#140152]" />
                                Resources
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {resources.length === 0 ? (
                                <p className="text-gray-500 text-sm text-center py-6">No resources uploaded yet. PDFs, videos and links from the coordinator will appear here.</p>
                            ) : (
                                <div className="space-y-2">
                                    {resources.map((r, i) => {
                                        const Icon = r.type === 'video' ? Play : r.type === 'pdf' ? Download : ExternalLink
                                        return (
                                            <a
                                                key={i}
                                                href={r.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100 hover:border-[#f5bb00] hover:bg-[#fbf5e6] transition-colors group"
                                            >
                                                <div className="w-10 h-10 rounded-xl bg-[#140152] text-[#f5bb00] flex items-center justify-center shrink-0">
                                                    <Icon className="w-5 h-5" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-bold text-[#140152] text-sm truncate group-hover:underline">{r.title}</p>
                                                    {r.meta && <p className="text-xs text-gray-500">{r.meta}</p>}
                                                </div>
                                                <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-[#140152] shrink-0" />
                                            </a>
                                        )
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Footer card */}
                <Card>
                    <CardContent className="p-7 text-center">
                        <p className="text-sm text-gray-600 mb-4">
                            Want to invite a friend to {program.title}?
                        </p>
                        <Link href={`/youth/${program.slug}#join`} className="inline-flex items-center gap-2 bg-[#140152] text-white font-bold px-6 py-3 rounded-full hover:bg-[#1d0175] transition-colors">
                            Share program link <ChevronRight className="w-4 h-4" />
                        </Link>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
