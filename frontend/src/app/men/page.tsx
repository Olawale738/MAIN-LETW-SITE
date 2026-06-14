'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import {
    Loader2, ArrowRight, Sparkles, Sword, Anchor, Mountain, Shield,
    Users, Hammer, BookOpen, Crown, Flame, Target,
    LogIn, UserPlus, Lock, CheckCircle, ChevronRight,
} from 'lucide-react'
import * as LucideIcons from 'lucide-react'
import { CustomSectionsAt, type CustomSection } from '@/components/ministry/MinistryCustomSection'

const getIcon = (name?: string, fallback: any = Sparkles) => {
    if (!name) return fallback
    const I = (LucideIcons as any)[name]
    return I || fallback
}

const STEEL = '#1f2937'
const STEEL_DARK = '#0f172a'
const GOLD = '#f5bb00'
const NAVY = '#140152'

const pillars = [
    { icon: Anchor,   title: 'Word-Forged',     desc: 'Scripture is the anvil that shapes every man. We hammer truth into character, week after week.' },
    { icon: Shield,   title: 'Brother-Backed',  desc: 'No man walks alone here. Real accountability, no performance, no posturing — just brothers who go to war for you.' },
    { icon: Hammer,   title: 'Purpose-Built',   desc: 'You were made to build something that outlives you. We help you find it, sharpen it, and ship it.' },
    { icon: Mountain, title: 'Battle-Ready',    desc: 'Husband, father, leader, soldier — every battlefield gets the same answer: discipline rooted in surrender to Christ.' },
]

const programs = [
    { icon: Sword,    title: 'Iron Sharpens Iron',  desc: 'Weekly small groups where men get real about marriage, money, mission, and what God is asking of them.', badge: 'Weekly Brotherhood', cta: 'Join a Group' },
    { icon: Hammer,   title: 'Forged Mentorship',   desc: 'One-on-one pairings with seasoned fathers in the faith. Real talk on career, marriage, fatherhood, calling.',   badge: 'Mentorship',         cta: 'Find a Father' },
    { icon: BookOpen, title: 'Men of the Word',     desc: 'Saturday morning Bible study — deep teaching, hard questions, scripture you can build a life on.',             badge: 'Bible Study',        cta: 'Pull Up a Chair' },
    { icon: Target,   title: 'The Arena',           desc: 'Quarterly retreats — sweat, scripture, story. Three days that recalibrate the man you came as.',                badge: 'Quarterly Retreat',  cta: 'Step Into the Arena' },
    { icon: Crown,    title: 'Fathered & Fathering', desc: 'A track for fathers and fathers-in-waiting: legacy, discipline, presence, intentionality.',                    badge: 'Family Track',       cta: 'Become a Father' },
    { icon: Flame,    title: 'On Mission',          desc: 'Outreach to fatherless boys, men in addiction, and brothers behind bars. We go where the bleeding is.',         badge: 'Outreach',           cta: 'Get In the Fight' },
]

const carouselQuotes = [
    { value: 'Iron',    label: 'Sharpens Iron' },
    { value: 'Sons',    label: 'of the King' },
    { value: 'Built',   label: 'On the Rock' },
    { value: 'Sent',    label: 'To War' },
]

export default function MenMinistryPage() {
    const [authChecked, setAuthChecked] = useState(false)
    const [isLoggedIn, setIsLoggedIn] = useState(false)
    const [slideIndex, setSlideIndex] = useState(0)
    const [paused, setPaused] = useState(false)
    const [content, setContent] = useState<Record<string, any>>({})

    useEffect(() => {
        const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null
        setIsLoggedIn(!!token)
        setAuthChecked(true)
    }, [])

    useEffect(() => {
        let cancelled = false
        import('@/lib/api').then(({ ministryContentApi }) =>
            ministryContentApi.get('men')
                .then(r => { if (!cancelled) setContent(r.content || {}) })
                .catch(() => {})
        )
        return () => { cancelled = true }
    }, [])

    const livePillars = (Array.isArray(content.pillars) && content.pillars.length > 0)
        ? content.pillars.map((p: any) => ({ icon: getIcon(p.icon, Sword), title: p.title || '', desc: p.desc || '' }))
        : pillars
    const livePrograms = (Array.isArray(content.programs) && content.programs.length > 0)
        ? content.programs.map((p: any) => ({ icon: getIcon(p.icon, Sword), title: p.title || '', desc: p.desc || '', badge: p.badge || '', cta: p.cta || 'Learn More' }))
        : programs
    const liveCarousel = (Array.isArray(content.carousel) && content.carousel.length > 0)
        ? content.carousel.map((c: any) => ({ value: c.value || '', label: c.label || '' }))
        : carouselQuotes
    const customSections: CustomSection[] = Array.isArray(content.custom_sections) ? content.custom_sections : []
    const slotProps = { sections: customSections, primary: STEEL, accent: GOLD, navy: NAVY }

    const c = {
        hero_eyebrow:           content.hero_eyebrow           || "Men's Ministry",
        hero_title_line1:       content.hero_title_line1       || 'Be',
        hero_title_highlight:   content.hero_title_highlight   || 'Strong.',
        hero_title_line2:       content.hero_title_line2       || 'Be Courageous.',
        hero_scripture:         content.hero_scripture         || 'Be on your guard; stand firm in the faith; be courageous; be strong. Do everything in love.',
        hero_scripture_ref:     content.hero_scripture_ref     || '— 1 Corinthians 16:13–14',
        hero_description:       content.hero_description       || 'A brotherhood of men forged in the Word, sharpened in accountability, and sent into every battle — at home, at work, in our cities — as men who fear God and nothing else.',
        hero_primary_cta:       content.hero_primary_cta       || 'Join the Brotherhood',
        hero_secondary_cta:     content.hero_secondary_cta     || 'Explore Programs',
        carousel_eyebrow:       content.carousel_eyebrow       || 'Who We Are',
        pillars_eyebrow:        content.pillars_eyebrow        || 'Our Foundation',
        pillars_heading:        content.pillars_heading        || 'Four Pillars Every Man Stands On',
        programs_eyebrow:       content.programs_eyebrow       || 'Our Programs',
        programs_heading:       content.programs_heading       || 'Six Battlegrounds. One Brotherhood.',
        programs_subtitle:      content.programs_subtitle      || "Whatever season of warfare you're in — there's a band of brothers ready to fight beside you.",
        scripture_band_text:    content.scripture_band_text    || 'As iron sharpens iron, so one man sharpens another.',
        scripture_band_ref:     content.scripture_band_ref     || '— Proverbs 27:17',
        join_eyebrow:           content.join_eyebrow           || 'Step In',
        join_heading:           content.join_heading           || 'Take Your Position',
        join_description:       content.join_description       || "Tell us where you're at. Our men's lead will reach out within 48 hours.",
        footer_heading:         content.footer_heading         || "You're not alone, brother.",
        footer_subtext:         content.footer_subtext         || 'Already a member? Open your dashboard for announcements, upcoming events, and your iron-sharpens-iron group.',
    }

    useEffect(() => {
        if (paused) return
        const t = setInterval(() => setSlideIndex(i => (i + 1) % liveCarousel.length), 4500)
        return () => clearInterval(t)
    }, [paused, liveCarousel.length])

    return (
        <div className="min-h-screen bg-white">
            {/* ─── HERO ──────────────────────────────────────────────────── */}
            <section className="relative overflow-hidden min-h-[88vh] flex items-center" style={{ background: `linear-gradient(135deg, ${STEEL_DARK} 0%, ${NAVY} 60%, ${STEEL} 100%)` }}>
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute -top-40 -left-40 w-[40rem] h-[40rem] rounded-full blur-[140px]" style={{ background: `${GOLD}33` }} />
                    <div className="absolute -bottom-40 -right-20 w-[50rem] h-[50rem] rounded-full blur-[140px]" style={{ background: `${NAVY}88` }} />
                </div>
                <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '64px 64px' }} />

                <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-32 md:py-40 text-center text-white">
                    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
                        <div className="inline-flex items-center gap-2 bg-white/5 backdrop-blur-sm border border-[#f5bb00]/40 rounded-full px-4 py-1.5 mb-7">
                            <Sword className="w-4 h-4 text-[#f5bb00]" />
                            <span className="text-xs font-bold uppercase tracking-[0.35em] text-[#f5bb00]">{c.hero_eyebrow}</span>
                        </div>
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.1 }}
                        className="text-5xl md:text-7xl lg:text-8xl font-black leading-[1.02] mb-7"
                    >
                        {c.hero_title_line1} <span className="bg-gradient-to-r from-[#f5bb00] via-white to-[#f5bb00] bg-clip-text text-transparent">{c.hero_title_highlight}</span>
                        <br />{c.hero_title_line2}
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.25 }}
                        className="text-xl md:text-2xl text-[#f5bb00] font-bold italic max-w-3xl mx-auto mb-3"
                        style={{ fontFamily: '"Cormorant Garamond","Playfair Display",Georgia,serif' }}
                    >
                        &ldquo;{c.hero_scripture}&rdquo;
                    </motion.p>
                    <motion.p
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
                        className="text-sm text-white/70 tracking-[0.3em] uppercase font-bold mb-12"
                    >{c.hero_scripture_ref}</motion.p>

                    <motion.p
                        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.4 }}
                        className="text-base md:text-lg text-white/85 max-w-2xl mx-auto leading-relaxed mb-12"
                    >
                        {c.hero_description}
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.55 }}
                        className="flex flex-col sm:flex-row gap-4 justify-center items-center"
                    >
                        <a href="#join"
                           className="inline-flex items-center gap-2 bg-[#f5bb00] hover:bg-white text-[#140152] font-bold px-8 py-4 rounded-full transition-all hover:scale-105 shadow-2xl">
                            {c.hero_primary_cta} <ArrowRight className="w-4 h-4" />
                        </a>
                        <a href="#programs"
                           className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/30 text-white font-bold px-8 py-4 rounded-full transition-all hover:scale-105">
                            {c.hero_secondary_cta}
                        </a>
                    </motion.div>
                </div>
            </section>

            <CustomSectionsAt {...slotProps} position="after_hero" />

            {/* ─── ROTATING IDENTITY BAND ────────────────────────────────── */}
            <section
                className="relative overflow-hidden py-20 md:py-24"
                style={{ background: `linear-gradient(120deg, ${STEEL_DARK} 0%, ${NAVY} 100%)` }}
                onMouseEnter={() => setPaused(true)}
                onMouseLeave={() => setPaused(false)}
            >
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute -top-32 -left-32 w-[28rem] h-[28rem] rounded-full blur-[120px]" style={{ background: `${GOLD}26` }} />
                    <div className="absolute -bottom-40 -right-20 w-[32rem] h-[32rem] rounded-full blur-[140px]" style={{ background: `#7c3aed33` }} />
                </div>
                <div className="relative max-w-4xl mx-auto px-4 text-center">
                    <p className="text-[10px] md:text-xs font-black uppercase tracking-[0.4em] text-[#f5bb00] mb-8">{c.carousel_eyebrow}</p>
                    <div className="relative min-h-[180px] md:min-h-[200px] flex items-center justify-center">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={slideIndex}
                                initial={{ opacity: 0, y: 24, scale: 0.92 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -24, scale: 0.92 }}
                                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                                className="text-center"
                            >
                                <p className="text-7xl md:text-9xl font-black leading-none bg-gradient-to-br from-white via-white to-[#f5bb00] bg-clip-text text-transparent drop-shadow-[0_4px_30px_rgba(245,187,0,0.25)]">
                                    {liveCarousel[slideIndex].value}
                                </p>
                                <p className="mt-5 text-sm md:text-base font-black uppercase tracking-[0.3em] text-white">{liveCarousel[slideIndex].label}</p>
                                <div className="mt-2 mx-auto h-0.5 w-32 bg-gradient-to-r from-transparent via-[#f5bb00] to-transparent" />
                            </motion.div>
                        </AnimatePresence>
                    </div>
                    <div className="flex items-center justify-center gap-2.5 mt-10">
                        {liveCarousel.map((_, i) => (
                            <button key={i} onClick={() => setSlideIndex(i)} aria-label={`Slide ${i + 1}`}
                                className="h-2 rounded-full transition-all duration-500"
                                style={{ width: i === slideIndex ? '2.5rem' : '0.5rem', background: i === slideIndex ? GOLD : 'rgba(255,255,255,0.3)' }} />
                        ))}
                    </div>
                </div>
            </section>

            <CustomSectionsAt {...slotProps} position="after_carousel" />

            {/* ─── PILLARS ───────────────────────────────────────────────── */}
            <section className="py-24 md:py-32 bg-white">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16 space-y-4">
                        <p className="text-[10px] font-black uppercase tracking-[0.4em]" style={{ color: STEEL }}>{c.pillars_eyebrow}</p>
                        <h2 className="text-4xl md:text-5xl font-black text-[#140152] leading-tight">{c.pillars_heading}</h2>
                        <div className="w-24 h-1.5 mx-auto rounded-full" style={{ background: `linear-gradient(to right, ${STEEL}, ${GOLD})` }} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {livePillars.map((p, i) => (
                            <motion.div
                                key={p.title}
                                initial={{ opacity: 0, y: 24 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.08 }}
                            >
                                <Card className="h-full border-none shadow-md hover:shadow-2xl hover:-translate-y-1 transition-all group bg-white relative overflow-hidden">
                                    <div className="absolute top-0 left-0 right-0 h-1.5" style={{ background: `linear-gradient(to right, ${STEEL_DARK}, ${GOLD})` }} />
                                    <CardContent className="p-7">
                                        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 transition-transform"
                                             style={{ background: `linear-gradient(135deg, ${STEEL_DARK}, ${NAVY})` }}>
                                            <p.icon className="w-7 h-7 text-[#f5bb00]" />
                                        </div>
                                        <h3 className="text-xl font-black text-[#140152] mb-3 leading-tight">{p.title}</h3>
                                        <p className="text-gray-600 leading-relaxed text-[15px]">{p.desc}</p>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            <CustomSectionsAt {...slotProps} position="after_pillars" />

            {/* ─── PROGRAMS ──────────────────────────────────────────────── */}
            <section id="programs" className="py-24 md:py-32" style={{ background: 'linear-gradient(180deg, #f3f4f6 0%, white 100%)' }}>
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16 space-y-4">
                        <p className="text-[10px] font-black uppercase tracking-[0.4em]" style={{ color: STEEL }}>{c.programs_eyebrow}</p>
                        <h2 className="text-4xl md:text-5xl font-black text-[#140152] leading-tight">{c.programs_heading}</h2>
                        <div className="w-24 h-1.5 mx-auto rounded-full" style={{ background: `linear-gradient(to right, ${STEEL}, ${GOLD})` }} />
                        <p className="text-gray-600 max-w-2xl mx-auto leading-relaxed">{c.programs_subtitle}</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {livePrograms.map((p, i) => (
                            <motion.div
                                key={p.title}
                                initial={{ opacity: 0, y: 24 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.06 }}
                            >
                                <Card className="h-full border-none shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all group bg-white relative overflow-hidden flex flex-col">
                                    <div className="absolute top-3 right-3 z-10 text-[10px] font-bold uppercase tracking-wider bg-white/95 text-[#140152] px-2.5 py-1 rounded-full shadow-md">{p.badge}</div>
                                    <div className="relative w-full h-44 overflow-hidden flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${STEEL_DARK}, ${NAVY})` }}>
                                        <div className="absolute inset-0 pointer-events-none">
                                            <div className="absolute -top-20 -right-10 w-60 h-60 rounded-full blur-[80px]" style={{ background: `${GOLD}40` }} />
                                        </div>
                                        <p.icon className="relative w-20 h-20 text-[#f5bb00] drop-shadow-lg" />
                                    </div>
                                    <CardContent className="p-6 flex flex-col flex-1">
                                        <h3 className="font-black text-[#140152] text-xl mb-3 leading-tight">{p.title}</h3>
                                        <p className="text-sm text-gray-600 leading-relaxed flex-1 mb-5">{p.desc}</p>
                                        <a href="#join" className="inline-flex items-center gap-2 text-white font-bold text-sm px-5 py-3 rounded-xl transition-all group-hover:gap-3 self-start"
                                           style={{ background: NAVY }}>
                                            {p.cta} <ArrowRight className="w-4 h-4" />
                                        </a>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            <CustomSectionsAt {...slotProps} position="after_programs" />

            {/* ─── SCRIPTURE BAND ────────────────────────────────────────── */}
            <section className="py-20 md:py-24 relative overflow-hidden" style={{ background: STEEL_DARK }}>
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[60rem] h-[60rem] rounded-full blur-[140px]" style={{ background: `${NAVY}88` }} />
                </div>
                <div className="relative max-w-4xl mx-auto px-4 text-center">
                    <Sparkles className="w-10 h-10 mx-auto mb-6" style={{ color: GOLD }} />
                    <p className="text-2xl md:text-4xl leading-snug font-bold italic text-white" style={{ fontFamily: '"Cormorant Garamond","Playfair Display",Georgia,serif' }}>
                        &ldquo;{c.scripture_band_text}&rdquo;
                    </p>
                    <p className="mt-7 text-xs font-bold uppercase tracking-[0.4em] text-[#f5bb00]">{c.scripture_band_ref}</p>
                </div>
            </section>

            <CustomSectionsAt {...slotProps} position="after_scripture" />

            {/* ─── JOIN FORM ─────────────────────────────────────────────── */}
            <section id="join" className="py-24 md:py-32 bg-white">
                <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-10 space-y-4">
                        <p className="text-[10px] font-black uppercase tracking-[0.4em]" style={{ color: STEEL }}>{c.join_eyebrow}</p>
                        <h2 className="text-4xl md:text-5xl font-black text-[#140152] leading-tight">{c.join_heading}</h2>
                        <div className="w-24 h-1.5 mx-auto rounded-full" style={{ background: `linear-gradient(to right, ${STEEL}, ${GOLD})` }} />
                        <p className="text-gray-600 leading-relaxed">{c.join_description}</p>
                    </div>

                    {!authChecked ? (
                        <div className="flex justify-center py-12"><Loader2 className="w-10 h-10 animate-spin" style={{ color: STEEL }} /></div>
                    ) : !isLoggedIn ? (
                        <Card className="border-none shadow-2xl rounded-3xl overflow-hidden">
                            <div className="px-8 py-8 text-center" style={{ background: `linear-gradient(135deg, ${STEEL_DARK}, ${NAVY})` }}>
                                <div className="w-16 h-16 bg-[#f5bb00]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Lock className="w-8 h-8 text-[#f5bb00]" />
                                </div>
                                <h3 className="text-white font-black text-2xl mb-2">Welcome, Brother</h3>
                                <p className="text-white/80 text-sm">Sign in or create a free account to join the brotherhood.</p>
                            </div>
                            <CardContent className="p-8">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <Link href="/auth/login?next=/men%23join" className="flex items-center justify-center gap-3 bg-[#140152] text-white font-black px-6 py-4 rounded-2xl hover:bg-[#1d0175] transition-all">
                                        <LogIn className="w-5 h-5" /> Sign In
                                    </Link>
                                    <Link href="/auth/register?next=/men%23join" className="flex items-center justify-center gap-3 bg-[#f5bb00] text-[#140152] font-black px-6 py-4 rounded-2xl hover:bg-yellow-300 transition-all">
                                        <UserPlus className="w-5 h-5" /> Create Account
                                    </Link>
                                </div>
                                <p className="text-center text-sm text-gray-400 mt-6">Free, takes a minute.</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <MenJoinForm />
                    )}
                </div>
            </section>

            <CustomSectionsAt {...slotProps} position="after_join" />
            <CustomSectionsAt {...slotProps} position="before_footer" />

            {/* ─── FOOTER CTA ────────────────────────────────────────────── */}
            <section className="py-20" style={{ background: `linear-gradient(135deg, ${STEEL_DARK} 0%, ${NAVY} 100%)` }}>
                <div className="max-w-3xl mx-auto px-4 text-center text-white">
                    <Sword className="w-10 h-10 mx-auto mb-5" style={{ color: GOLD }} />
                    <h3 className="text-3xl md:text-4xl font-black mb-4">{c.footer_heading}</h3>
                    <p className="text-white/80 leading-relaxed mb-8">{c.footer_subtext}</p>
                    <Link href="/men/dashboard" className="inline-flex items-center gap-2 bg-white text-[#140152] font-bold px-7 py-3.5 rounded-full hover:bg-[#f5bb00] transition-all hover:scale-105 shadow-2xl">
                        Open Your Dashboard <ChevronRight className="w-4 h-4" />
                    </Link>
                </div>
            </section>
        </div>
    )
}

function MenJoinForm() {
    const [formData, setFormData] = useState({ name: '', email: '', phone: '', stage: '', interest: '' })
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const [error, setError] = useState('')

    const handleJoin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')
        try {
            const { serviceRequestApi } = await import('@/lib/api')
            await serviceRequestApi.submitRequests(
                ["Men's Ministry"],
                `Stage: ${formData.stage}\nPhone: ${formData.phone}\nInterest: ${formData.interest}`
            )
            setSuccess(true)
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    if (success) return (
        <div className="bg-gray-50 border-2 border-gray-200 rounded-3xl p-12 text-center">
            <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10" style={{ color: STEEL }} />
            </div>
            <h3 className="text-2xl font-black text-[#140152] mb-3">Welcome, brother ⚔️</h3>
            <p className="text-gray-600 leading-relaxed">Your application has been received. Our men&apos;s lead will reach out within 48 hours to welcome you in.</p>
        </div>
    )

    return (
        <Card className="border-none shadow-2xl rounded-3xl overflow-hidden">
            <div className="px-8 py-6" style={{ background: `linear-gradient(135deg, ${STEEL_DARK}, ${NAVY})` }}>
                <h3 className="text-white font-black text-xl">Registration Form</h3>
                <p className="text-white/70 text-sm mt-1">Complete your details and we&apos;ll be in touch.</p>
            </div>
            <CardContent className="p-8">
                {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-sm border border-red-100">{error}</div>}
                <form onSubmit={handleJoin} className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Full Name *</label>
                            <input required type="text" placeholder="John Doe" value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                                className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-400 outline-none bg-gray-50 focus:bg-white transition-all" />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Email *</label>
                            <input required type="email" placeholder="you@example.com" value={formData.email} onChange={e => setFormData(p => ({ ...p, email: e.target.value }))}
                                className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-400 outline-none bg-gray-50 focus:bg-white transition-all" />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Phone</label>
                            <input type="tel" value={formData.phone} onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))}
                                className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-400 outline-none bg-gray-50 focus:bg-white transition-all" />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Stage of Life</label>
                            <select value={formData.stage} onChange={e => setFormData(p => ({ ...p, stage: e.target.value }))}
                                className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-400 outline-none bg-gray-50 focus:bg-white transition-all">
                                <option value="">Select…</option>
                                <option>Single</option><option>Engaged</option><option>Newlywed</option>
                                <option>Married</option><option>Father</option>
                                <option>Career Builder</option><option>Empty Nester</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Why now? (optional)</label>
                        <textarea value={formData.interest} onChange={e => setFormData(p => ({ ...p, interest: e.target.value }))}
                            rows={3} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-400 outline-none bg-gray-50 focus:bg-white transition-all" />
                    </div>
                    <button type="submit" disabled={loading} className="w-full font-black py-4 rounded-2xl transition-all hover:scale-[1.01] disabled:opacity-50"
                        style={{ background: `linear-gradient(135deg, ${STEEL_DARK}, ${NAVY})`, color: 'white' }}>
                        {loading ? <Loader2 className="w-5 h-5 inline animate-spin" /> : 'Join the Brotherhood'}
                    </button>
                </form>
            </CardContent>
        </Card>
    )
}
