'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
    Loader2, ArrowLeft, ArrowRight, CheckCircle, Lock, LogIn, UserPlus,
    Calendar, Sparkles, Target, Heart, ChevronRight, Quote, MapPin, Clock,
} from 'lucide-react'
import * as LucideIcons from 'lucide-react'
import { youthProgramApi, YouthProgram, serviceRequestApi } from '@/lib/api'

const getIcon = (name?: string) => {
    if (!name) return Sparkles
    const I = (LucideIcons as any)[name]
    return I || Sparkles
}

export default function YouthProgramDetailPage() {
    const router = useRouter()
    const params = useParams<{ slug: string }>()
    const slug = params?.slug

    const [program, setProgram] = useState<YouthProgram | null>(null)
    const [loading, setLoading] = useState(true)
    const [notFound, setNotFound] = useState(false)

    const [isLoggedIn, setIsLoggedIn] = useState(false)
    const [authChecked, setAuthChecked] = useState(false)
    const [joinNote, setJoinNote] = useState('')
    const [joining, setJoining] = useState(false)
    const [joinSuccess, setJoinSuccess] = useState(false)
    const [joinError, setJoinError] = useState('')

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

    useEffect(() => {
        const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null
        setIsLoggedIn(!!token)
        setAuthChecked(true)
    }, [])

    const handleJoin = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!program) return
        setJoining(true)
        setJoinError('')
        try {
            const label = program.service_request_label || `Youth :: ${program.title}`
            await serviceRequestApi.submitRequests(
                [label],
                joinNote || `Interested in joining the ${program.title} program.`
            )
            setJoinSuccess(true)
        } catch (err: any) {
            setJoinError(err?.message || 'Something went wrong. Please try again.')
        } finally {
            setJoining(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center bg-neutral-50">
                <Loader2 className="w-10 h-10 animate-spin text-[#140152]" />
            </div>
        )
    }

    if (notFound || !program) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center bg-neutral-50 text-center p-8">
                <p className="text-2xl font-black text-[#140152] mb-2">Program not found</p>
                <p className="text-gray-500 mb-6">We couldn&apos;t find that youth program. It may have been renamed or archived.</p>
                <Link href="/youth" className="inline-flex items-center gap-2 bg-[#140152] text-white font-bold px-6 py-3 rounded-full">
                    <ArrowLeft className="w-4 h-4" /> Back to Youth Ministry
                </Link>
            </div>
        )
    }

    const HeroIcon = getIcon(program.icon)
    const items = program.what_youll_do || []
    const schedule = program.schedule || []
    const outcomes = program.outcomes || []
    const audience = program.who_its_for || []
    const heroImg = program.hero_image_url || '/youth-hero.jpg'

    return (
        <div className="min-h-screen bg-white">
            {/* ─── HERO ─────────────────────────────────────────────────── */}
            <section className="relative overflow-hidden bg-[#0a0028] text-white">
                <div className="absolute inset-0">
                    <img src={heroImg} alt={program.title} className="w-full h-full object-cover opacity-50" />
                    <div className="absolute inset-0 bg-gradient-to-b from-[#0a0028]/40 via-[#0a0028]/60 to-[#0a0028]/95" />
                    <div className="absolute top-1/4 right-0 w-[40rem] h-[40rem] bg-[#f5bb00]/15 rounded-full blur-[150px] pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-[35rem] h-[35rem] bg-[#7c3aed]/20 rounded-full blur-[120px] pointer-events-none" />
                </div>
                <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-28 md:py-36">
                    <Link href="/youth" className="inline-flex items-center gap-2 text-white/70 hover:text-[#f5bb00] text-sm font-bold mb-8 transition-colors">
                        <ArrowLeft className="w-4 h-4" /> All Youth Programs
                    </Link>

                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-14 h-14 rounded-2xl bg-[#f5bb00]/20 flex items-center justify-center backdrop-blur-sm border border-[#f5bb00]/30">
                            <HeroIcon className="w-7 h-7 text-[#f5bb00]" />
                        </div>
                        {program.badge && (
                            <span className="text-[11px] font-bold uppercase tracking-[0.3em] text-[#f5bb00] bg-[#f5bb00]/10 border border-[#f5bb00]/30 px-3 py-1.5 rounded-full">
                                {program.badge}
                            </span>
                        )}
                    </div>

                    <motion.h1
                        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                        className="text-4xl md:text-6xl lg:text-7xl font-black leading-[1.05] mb-6"
                    >
                        {program.title}
                    </motion.h1>

                    {program.short_description && (
                        <p className="text-xl md:text-2xl text-[#f5bb00] font-bold italic max-w-3xl mb-4" style={{ fontFamily: '"Cormorant Garamond","Playfair Display",Georgia,serif' }}>
                            &ldquo;{program.short_description}&rdquo;
                        </p>
                    )}

                    {program.long_description && (
                        <p className="text-lg text-white/85 max-w-3xl leading-relaxed mb-10">
                            {program.long_description}
                        </p>
                    )}

                    <div className="flex flex-wrap gap-3">
                        {program.registration_open ? (
                            <a href="#join" className="inline-flex items-center gap-2 bg-[#f5bb00] hover:bg-white text-[#140152] font-bold px-7 py-3.5 rounded-full transition-all hover:scale-105 shadow-2xl">
                                {program.join_cta_text || 'Join This Program'} <ArrowRight className="w-4 h-4" />
                            </a>
                        ) : (
                            <span className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-white/80 font-bold px-7 py-3.5 rounded-full">
                                <Lock className="w-4 h-4" /> Registration currently closed
                            </span>
                        )}
                        {isLoggedIn && (
                            <Link href={`/youth/${program.slug}/dashboard`} className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/30 text-white font-bold px-7 py-3.5 rounded-full transition-all">
                                Open Dashboard <ChevronRight className="w-4 h-4" />
                            </Link>
                        )}
                    </div>
                </div>
            </section>

            {/* ─── WHAT YOU'LL DO ──────────────────────────────────────── */}
            {items.length > 0 && (
                <section className="py-20 md:py-28 bg-gradient-to-b from-white to-neutral-50">
                    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-14 md:mb-16 space-y-4">
                            <span className="block text-[#f5bb00] font-bold uppercase tracking-[0.35em] text-xs">What You&apos;ll Do</span>
                            <h2 className="text-3xl md:text-5xl font-black text-[#140152] leading-tight">Inside the program</h2>
                            <div className="w-24 h-1.5 bg-[#f5bb00] mx-auto rounded-full" />
                        </div>
                        <div className={`grid gap-6 md:gap-8 ${
                            items.length === 1 ? 'grid-cols-1 max-w-md mx-auto' :
                            items.length === 2 ? 'grid-cols-1 md:grid-cols-2' :
                            'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
                        }`}>
                            {items.map((it, i) => {
                                const I = getIcon(it.icon)
                                return (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, y: 24 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: i * 0.07 }}
                                    >
                                        <Card className="h-full border-none shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all group bg-white">
                                            <CardContent className="p-7 md:p-8">
                                                <div className="w-14 h-14 bg-gradient-to-br from-[#140152] to-[#1d0175] rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 group-hover:rotate-3 transition-all shadow-lg">
                                                    <I className="w-7 h-7 text-[#f5bb00]" />
                                                </div>
                                                <h3 className="text-xl font-black text-[#140152] mb-2 leading-tight">{it.title}</h3>
                                                {it.description && (
                                                    <p className="text-gray-600 leading-relaxed text-[15px]">{it.description}</p>
                                                )}
                                            </CardContent>
                                        </Card>
                                    </motion.div>
                                )
                            })}
                        </div>
                    </div>
                </section>
            )}

            {/* ─── SCHEDULE + WHO IT'S FOR ────────────────────────────── */}
            {(schedule.length > 0 || audience.length > 0) && (
                <section className="py-20 md:py-28 bg-gradient-to-br from-[#0a0028] via-[#140152] to-[#0a0028] text-white">
                    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-[2fr_1fr] gap-12">
                        {/* Schedule */}
                        {schedule.length > 0 && (
                            <div>
                                <div className="flex items-center gap-3 mb-8">
                                    <Calendar className="w-6 h-6 text-[#f5bb00]" />
                                    <h2 className="text-2xl md:text-3xl font-black">When We Meet</h2>
                                </div>
                                <div className="space-y-3">
                                    {schedule.map((s, i) => (
                                        <motion.div
                                            key={i}
                                            initial={{ opacity: 0, x: -16 }}
                                            whileInView={{ opacity: 1, x: 0 }}
                                            viewport={{ once: true }}
                                            transition={{ delay: i * 0.06 }}
                                            className="relative rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm p-5 hover:border-[#f5bb00]/40 transition-colors"
                                        >
                                            <div className="flex items-start gap-4">
                                                <div className="shrink-0 w-16 h-16 rounded-xl bg-[#f5bb00] text-[#140152] flex flex-col items-center justify-center font-black text-xs leading-tight text-center px-1">
                                                    {s.day}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-3 mb-1">
                                                        {s.time && (
                                                            <p className="text-[11px] font-bold uppercase tracking-wider text-[#f5bb00]">
                                                                <Clock className="w-3 h-3 inline mr-1" /> {s.time}
                                                            </p>
                                                        )}
                                                    </div>
                                                    {s.title && <p className="font-bold text-lg leading-tight">{s.title}</p>}
                                                    {s.description && <p className="text-sm text-white/70 mt-1 leading-relaxed">{s.description}</p>}
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Who it's for */}
                        {audience.length > 0 && (
                            <div>
                                <div className="flex items-center gap-3 mb-8">
                                    <Target className="w-6 h-6 text-[#f5bb00]" />
                                    <h2 className="text-2xl md:text-3xl font-black">Who It&apos;s For</h2>
                                </div>
                                <div className="rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm p-7">
                                    <ul className="space-y-3">
                                        {audience.map((a, i) => (
                                            <li key={i} className="flex items-start gap-3">
                                                <CheckCircle className="w-5 h-5 text-[#f5bb00] shrink-0 mt-0.5" />
                                                <span className="text-white/90 leading-relaxed">{a}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        )}
                    </div>
                </section>
            )}

            {/* ─── OUTCOMES ────────────────────────────────────────────── */}
            {outcomes.length > 0 && (
                <section className="py-20 md:py-28 bg-white">
                    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-14 space-y-4">
                            <span className="block text-[#f5bb00] font-bold uppercase tracking-[0.35em] text-xs">When You&apos;re Done</span>
                            <h2 className="text-3xl md:text-5xl font-black text-[#140152] leading-tight">You&apos;ll walk away with</h2>
                            <div className="w-24 h-1.5 bg-[#f5bb00] mx-auto rounded-full" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                            {outcomes.map((o, i) => (
                                <div
                                    key={i}
                                    className="relative rounded-3xl bg-gradient-to-br from-white via-white to-[#fbf5e6] border border-gray-100 shadow-md p-7 hover:shadow-xl transition-all"
                                >
                                    <div className="text-3xl font-black text-[#f5bb00] mb-3">{String(i + 1).padStart(2, '0')}</div>
                                    <p className="text-gray-700 leading-relaxed">{o}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* ─── LEADER CARD ────────────────────────────────────────── */}
            {(program.leader_name || program.leader_bio) && (
                <section className="py-20 md:py-24 bg-neutral-50">
                    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="rounded-3xl bg-white shadow-xl p-7 md:p-10 flex flex-col md:flex-row gap-7 items-center md:items-start">
                            {program.leader_photo_url ? (
                                <img src={program.leader_photo_url} alt={program.leader_name} className="w-32 h-32 rounded-2xl object-cover shadow-lg shrink-0" />
                            ) : (
                                <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-[#140152] to-[#1d0175] flex items-center justify-center shrink-0">
                                    <HeroIcon className="w-14 h-14 text-[#f5bb00]" />
                                </div>
                            )}
                            <div className="text-center md:text-left">
                                <p className="text-[11px] font-bold uppercase tracking-[0.35em] text-[#f5bb00] mb-2">Program Lead</p>
                                <h3 className="text-2xl font-black text-[#140152] leading-tight mb-1">{program.leader_name || 'Youth Director'}</h3>
                                {program.leader_role && <p className="text-sm font-bold text-[#7c3aed] mb-3">{program.leader_role}</p>}
                                {program.leader_bio && <p className="text-gray-600 leading-relaxed">{program.leader_bio}</p>}
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {/* ─── JOIN FORM ───────────────────────────────────────────── */}
            <section id="join" className="py-20 md:py-28 bg-gradient-to-br from-[#140152] via-[#1d0175] to-[#140152] text-white">
                <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-10 space-y-4">
                        <span className="block text-[#f5bb00] font-bold uppercase tracking-[0.35em] text-xs">Get Involved</span>
                        <h2 className="text-3xl md:text-5xl font-black leading-tight">Join {program.title}</h2>
                        <p className="text-white/75 leading-relaxed">
                            Submit your interest and our youth coordinator will reach out to welcome you in.
                        </p>
                    </div>

                    {!authChecked ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="w-10 h-10 animate-spin text-[#f5bb00]" />
                        </div>
                    ) : joinSuccess ? (
                        <div className="bg-white/10 border-2 border-[#f5bb00]/30 rounded-3xl p-10 text-center">
                            <div className="w-20 h-20 bg-[#f5bb00] rounded-full flex items-center justify-center mx-auto mb-6">
                                <CheckCircle className="w-10 h-10 text-[#140152]" />
                            </div>
                            <h3 className="text-2xl font-black mb-3">Application received 🙌</h3>
                            <p className="text-white/80 mb-6 leading-relaxed">
                                Your interest in <strong>{program.title}</strong> has been sent to our Youth Coordinator. You&apos;ll typically hear back within 24–48 hours.
                            </p>
                            <Link href={`/youth/${program.slug}/dashboard`} className="inline-flex items-center gap-2 bg-[#f5bb00] text-[#140152] font-bold px-6 py-3 rounded-full hover:bg-white transition-colors">
                                Go to your Dashboard <ChevronRight className="w-4 h-4" />
                            </Link>
                        </div>
                    ) : !isLoggedIn ? (
                        <Card className="border-none shadow-2xl rounded-3xl overflow-hidden bg-white">
                            <div className="bg-[#0a0028] px-8 py-8 text-center">
                                <div className="w-16 h-16 bg-[#f5bb00]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Lock className="w-8 h-8 text-[#f5bb00]" />
                                </div>
                                <h3 className="text-white font-black text-xl mb-2">Sign in to join</h3>
                                <p className="text-blue-200 text-sm">Free account, takes under a minute.</p>
                            </div>
                            <CardContent className="p-8">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <Link href={`/auth/login?next=/youth/${program.slug}%23join`} className="flex items-center justify-center gap-2 bg-[#140152] text-white font-black px-6 py-4 rounded-2xl hover:bg-[#1d0175] transition-all">
                                        <LogIn className="w-5 h-5" /> Sign In
                                    </Link>
                                    <Link href={`/auth/register?next=/youth/${program.slug}%23join`} className="flex items-center justify-center gap-2 bg-[#f5bb00] text-[#140152] font-black px-6 py-4 rounded-2xl hover:bg-yellow-300 transition-all">
                                        <UserPlus className="w-5 h-5" /> Create Account
                                    </Link>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <Card className="border-none shadow-2xl rounded-3xl overflow-hidden bg-white">
                            <CardContent className="p-8">
                                {joinError && (
                                    <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-sm border border-red-100">
                                        {joinError}
                                    </div>
                                )}
                                <form onSubmit={handleJoin} className="space-y-5">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">
                                            Why are you interested? <span className="text-gray-400 font-normal">(optional)</span>
                                        </label>
                                        <textarea
                                            value={joinNote}
                                            onChange={(e) => setJoinNote(e.target.value)}
                                            rows={4}
                                            placeholder={`What draws you to ${program.title}? Any questions for the coordinator?`}
                                            className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#140152] outline-none bg-gray-50 focus:bg-white transition-all text-gray-900"
                                        />
                                    </div>
                                    <Button
                                        type="submit"
                                        disabled={joining}
                                        className="w-full bg-[#140152] text-white font-black py-6 rounded-2xl hover:bg-[#1d0175] transition-all"
                                    >
                                        {joining ? (
                                            <><Loader2 className="w-5 h-5 mr-2 animate-spin inline" /> Submitting…</>
                                        ) : (
                                            <>{program.join_cta_text || `Join ${program.title}`} <ArrowRight className="w-5 h-5 ml-2 inline" /></>
                                        )}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </section>
        </div>
    )
}
