'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
    BookOpen, GraduationCap, Globe, Users, Award, ArrowRight, CheckCircle,
    Scroll, Flame, Anchor, ChevronLeft, ChevronRight, Sparkles, Compass,
    Calendar, FileCheck, Quote, Star,
} from 'lucide-react'
import * as LucideIcons from 'lucide-react'

const getIcon = (name?: string | any, fallback: any = BookOpen) => {
    if (!name) return fallback
    if (typeof name !== 'string') return name
    const I = (LucideIcons as any)[name]
    return I || fallback
}

/* ────────────────────────────────────────────────────────────────────────────
   Brand palette + theme
   ──────────────────────────────────────────────────────────────────────── */
const NAVY = '#140152'
const GOLD = '#f5bb00'
const CREAM = '#fbf5e6'

const CAROUSEL_IMAGES = [
    { src: '/theology1.png', alt: 'Theology Flyer 1' },
    { src: '/theology2.png', alt: 'Theology Flyer 2' },
    { src: '/theology3.png', alt: 'Theology Flyer 3' },
]

const PILLARS = [
    { id: '01', title: 'Biblical Foundation', desc: "Master the complete biblical narrative from Genesis to Revelation. Develop rigorous exegetical skills in Hebrew and Greek to unlock Scripture in its original languages.", icon: BookOpen },
    { id: '02', title: 'Theological Depth',   desc: "Journey through systematic theology — the doctrine of God, pneumatology, ecclesiology, and the historical frameworks that shape Christian thought.", icon: Scroll },
    { id: '03', title: 'Ministry Excellence',  desc: "From pastoral care to church planting, homiletics to leadership — gain practical skills tested through internships and real-world application.", icon: Users },
    { id: '04', title: 'Global Perspective',   desc: "Engage Christianity in its global context. Cross-cultural ministry, world religions, and the Bible's response to contemporary challenges.", icon: Globe },
    { id: '05', title: 'Spiritual Formation',  desc: "Your education is transformational, not merely academic. Cultivate a deep, authentic walk with God that sustains lifelong ministry.", icon: Flame },
    { id: '06', title: 'Mission & Impact',     desc: "Graduate equipped for evangelism, apologetics, social transformation, and kingdom advancement — locally and globally.", icon: Anchor },
]

const PROGRAMS = [
    {
        level: 1,
        title: 'Certificate in Ministry',
        subtitle: 'Foundation Program',
        tag: 'Open to those beginning their theological journey',
        duration: '1 Year',
        credits: '36–40 Credit Hours',
        courses_count: '15 Core Courses',
        description: 'Build a strong foundation in biblical studies, theology, and practical ministry. Introduces you to Scripture, Christian doctrine, spiritual formation, and essential ministry skills.',
        accent: '#3b82f6',
        accentTo: '#06b6d4',
        semesters: [
            { name: 'Semester 1', courses: ['Ministry Formation','Introduction to Biblical Literature','Foundations of Ministry','Intro to Christian Theology','Spiritual Disciplines','Old Testament Survey','Synoptic Gospels','Ethics & Christian Worldview'] },
            { name: 'Semester 2', courses: ['Pentateuch','New Testament Survey','Jesus and the Gospels','Spiritual Gifts I','Introduction to Worship & Service','Biblical Interpretation & Application','Introduction to Christian Ethics','Introduction to Church History','World Religions Overview'] },
        ],
        requirements: {
            basics: ['Basic secondary school education (or equivalent life experience)','Ability to read, write, and communicate effectively in English','Personal commitment to Christian faith and spiritual growth','Interest in ministry, leadership, or biblical studies'],
            docs:   ['Completed application form','Short personal statement (calling, faith journey, ministry interest)','Recommendation from a pastor, church leader, or mentor (optional but encouraged)'],
        },
    },
    {
        level: 2,
        title: 'Diploma in Ministry and Divinity',
        subtitle: 'Intermediate Program',
        tag: 'Deeper academic and practical ministry formation',
        duration: '1 Year',
        credits: '36–40 Credit Hours',
        courses_count: '18 Advanced Courses',
        description: 'Deepen your theological understanding and ministry competencies. Advances your study in systematic theology, biblical exegesis, church history, and practical applications including preaching and discipleship.',
        accent: '#7c3aed',
        accentTo: '#a855f7',
        semesters: [
            { name: 'Semester 1', courses: ['Theology II (Systematic Theology)','Scripture, Exegesis & Hermeneutics','Cultures of Ancient Civilizations','Spiritual Gifts II','Church History: Early to Medieval Period','Mission in Contemporary Context','Christian Doctrine & Ethics','Pauline Theology','Protestant Reformation'] },
            { name: 'Semester 2', courses: ['Christian Communication Skills','Romans (Biblical Book Study)','Exploring Other Faiths','Kings & Prophets','Biblical Exegesis Practicum','Preaching & Teaching Practicum','Methods in Discipleship','Church Planting & Evangelism','Leadership and Spirituality'] },
        ],
        requirements: {
            basics: ['Successful completion of Certificate in Ministry OR equivalent theological training','Demonstrated commitment to church involvement or ministry service','Basic understanding of Scripture and Christian doctrine'],
            docs:   ['Completed application form','Academic transcript or proof of prior theological study','Personal statement outlining ministry goals','Recommendation from a pastor or ministry supervisor'],
        },
    },
    {
        level: 3,
        title: 'Advanced Diploma in Ministry and Divinity',
        subtitle: 'Advanced Leadership',
        tag: 'For strategic ministry, pastoral work, and theological engagement',
        duration: '1 Year',
        credits: '36–40 Credit Hours',
        courses_count: '29 Specialized Courses + Internship',
        description: 'Achieve scholarly expertise and advanced ministry leadership. Master biblical languages, engage with cutting-edge theological discourse, specialize in pastoral care or missional leadership, and complete a comprehensive internship.',
        accent: '#f5bb00',
        accentTo: '#ea580c',
        semesters: [
            { name: 'Semester 1', courses: ['Greek & Hebrew Exegesis Studies','Theology III (Advanced Systematic Theology)','Pastoral Leadership & Care','Doctrine of God','Digital Theology','Global Theologies','Christianity and the Arts','Pneumatology','Evangelism & Apologetics','Church History: Reformation to Contemporary','Ecclesiology & Church Mission','Church Planting & Evangelism'] },
            { name: 'Semester 2', courses: ['Contextualized Ministry','Hermeneutics & Homiletics','The Bible and Global Challenges','Wisdom Literature','Political Theologies: Wealth, Race, Gender','Leadership & Theology for Ministry & Mission','Multimedia Worship Skills','Cross-cultural Ministry','Missions & Social Transformation','Counselling in a Pastoral Setting','Internship (Practical Ministry Experience)'] },
        ],
        requirements: {
            basics: ['Successful completion of Diploma in Ministry and Divinity OR equivalent qualification','Demonstrated leadership responsibility in church or ministry context','Academic readiness for advanced theological study','Willingness to complete internship/supervised ministry placement'],
            docs:   ['Completed application form','Official transcripts or evidence of prior theological education','Detailed personal statement or ministry vision statement','Pastoral or professional reference confirming leadership experience'],
        },
    },
]

const JOURNEY = [
    { step: '1', title: 'Foundation Year',   desc: 'Begin with the Certificate in Ministry. Master biblical literacy, theological foundations, and essential ministry skills. Discover your calling and develop spiritual disciplines that sustain a lifetime.' },
    { step: '2', title: 'Development Year',  desc: 'Advance to the Diploma. Deepen your theological understanding, master exegetical methods, explore church history, and begin practical ministry application through preaching and discipleship training.' },
    { step: '3', title: 'Mastery Year',      desc: 'Complete the Advanced Diploma. Achieve scholarly expertise in biblical languages, engage contemporary theological issues, specialize in your area of calling, and complete a hands-on ministry internship.' },
]

const GAINS = [
    'Comprehensive biblical and theological training across three progressive levels',
    'Mastery of biblical languages (Hebrew & Greek) for original text study',
    'Practical ministry skills in preaching, teaching, pastoral care, and leadership',
    'Global perspective on Christianity and cross-cultural ministry',
    'Hands-on ministry experience through internship placements',
    'Internationally recognized qualifications (Certificate, Diploma, Advanced Diploma)',
    'Spiritual formation and personal transformation',
    'Network of like-minded ministry professionals and lifelong mentors',
]

const CAROUSEL_QUOTES = [
    { value: 'Hebrew',  label: 'and Greek Mastery' },
    { value: 'Doctrine', label: 'You Can Defend' },
    { value: 'Ministry', label: 'You Can Lead' },
    { value: 'Calling',  label: 'You Can Walk Out' },
]

/* ────────────────────────────────────────────────────────────────────────────
   Page
   ──────────────────────────────────────────────────────────────────────── */

export default function TheologySchoolPage() {
    const [activeLevel, setActiveLevel] = useState(1)
    const [activeSem, setActiveSem] = useState(0)
    const [slide, setSlide] = useState(0)
    const [paused, setPaused] = useState(false)
    const [imgSlide, setImgSlide] = useState(0)
    const [content, setContent] = useState<Record<string, any>>({})

    useEffect(() => {
        let cancelled = false
        import('@/lib/api').then(({ ministryContentApi }) =>
            ministryContentApi.get('theology')
                .then(r => { if (!cancelled) setContent(r.content || {}) })
                .catch(() => {})
        )
        return () => { cancelled = true }
    }, [])

    // Merge admin overrides with hardcoded defaults
    const livePillars = (Array.isArray(content.pillars) && content.pillars.length > 0) ? content.pillars : PILLARS
    const livePrograms = (Array.isArray(content.programs) && content.programs.length > 0) ? content.programs : PROGRAMS
    const liveJourney = (Array.isArray(content.journey) && content.journey.length > 0) ? content.journey : JOURNEY
    const liveGains = (Array.isArray(content.gains) && content.gains.length > 0) ? content.gains : GAINS
    const liveCarouselQuotes = (Array.isArray(content.carousel) && content.carousel.length > 0) ? content.carousel : CAROUSEL_QUOTES
    const liveStats = (Array.isArray(content.stats) && content.stats.length > 0) ? content.stats : [
        { value: '3',  label: 'Progressive Programs' },
        { value: '6',  label: 'Pillars of Formation' },
        { value: '60+', label: 'Specialized Courses' },
        { value: '100%', label: 'Christ-Centered' },
    ]
    const liveImages = (Array.isArray(content.images) && content.images.length > 0) ? content.images : CAROUSEL_IMAGES

    const c = {
        hero_eyebrow:         content.hero_eyebrow         || 'Theology School',
        hero_title_line1:     content.hero_title_line1     || 'Be Formed by',
        hero_title_highlight: content.hero_title_highlight || 'the Word.',
        hero_title_line2:     content.hero_title_line2     || 'Sent by the Spirit.',
        hero_scripture:       content.hero_scripture       || 'The fear of the LORD is the beginning of wisdom, and the knowledge of the Holy One is understanding.',
        hero_scripture_ref:   content.hero_scripture_ref   || '— Proverbs 9:10',
        hero_description:     content.hero_description     || 'A three-year academic and spiritual journey — Certificate, Diploma, Advanced Diploma — equipping you with biblical depth, theological clarity, and ministry skill for a lifetime of impact.',
        hero_primary_cta:     content.hero_primary_cta     || 'View the Three Programs',
        hero_secondary_cta:   content.hero_secondary_cta   || 'Apply Now',
        carousel_eyebrow:     content.carousel_eyebrow     || 'What You Walk Away With',
        pillars_eyebrow:      content.pillars_eyebrow      || 'What We Form In You',
        pillars_heading:      content.pillars_heading      || 'Six Pillars of Formation',
        images_eyebrow:       content.images_eyebrow       || 'From the Classroom',
        images_heading:       content.images_heading       || 'Inside Our School',
        programs_eyebrow:     content.programs_eyebrow     || 'Three Progressive Programs',
        programs_heading:     content.programs_heading     || 'Build Your Path',
        programs_subtitle:    content.programs_subtitle    || 'From Foundation to Mastery — each year builds on the last.',
        journey_eyebrow:      content.journey_eyebrow      || 'Your Journey',
        journey_heading:      content.journey_heading      || 'Three Years. One Calling.',
        gains_eyebrow:        content.gains_eyebrow        || 'By the End',
        gains_heading:        content.gains_heading        || "What You'll Walk Away With",
        final_eyebrow:        content.final_eyebrow        || 'The Altar Is Open',
        final_title_line1:    content.final_title_line1    || 'Step Into',
        final_title_highlight:content.final_title_highlight|| 'Your Calling.',
        final_title_line2:    content.final_title_line2    || '',
        final_body:           content.final_body           || "Whether you're beginning the journey or advancing to mastery, our admissions team will walk you through every step. The next cohort is forming now.",
        final_primary_cta:    content.final_primary_cta    || 'Begin Your Application',
        final_secondary_cta:  content.final_secondary_cta  || 'Talk to Admissions',
        final_quote:          content.final_quote          || 'Study to shew thyself approved unto God, a workman that needeth not to be ashamed, rightly dividing the word of truth. — 2 Timothy 2:15',
    }

    useEffect(() => {
        if (paused) return
        const t = setInterval(() => setSlide(i => (i + 1) % liveCarouselQuotes.length), 4500)
        return () => clearInterval(t)
    }, [paused])

    useEffect(() => {
        const t = setInterval(() => setImgSlide(i => (i + 1) % liveImages.length), 4500)
        return () => clearInterval(t)
    }, [])

    const currentProgram = livePrograms.find((p:any) => p.level === activeLevel) || livePrograms[0]

    return (
        <div className="min-h-screen bg-white">

            {/* ═══════════════════════════════════════════════════════════════════
                HERO — cinematic navy gradient, floating gold + violet orbs
                ═══════════════════════════════════════════════════════════════ */}
            <section className="relative overflow-hidden min-h-[92vh] flex items-center text-white"
                style={{ background: `linear-gradient(135deg, #0a0028 0%, ${NAVY} 55%, #1d0175 100%)` }}>

                {/* Ambient glows */}
                <div className="absolute inset-0 pointer-events-none">
                    <motion.div
                        className="absolute -top-40 -left-40 w-[44rem] h-[44rem] rounded-full blur-[140px]"
                        style={{ background: `${GOLD}33` }}
                        animate={{ scale: [1, 1.08, 1], opacity: [0.7, 1, 0.7] }}
                        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                    />
                    <motion.div
                        className="absolute -bottom-40 -right-20 w-[52rem] h-[52rem] rounded-full blur-[160px]"
                        style={{ background: 'rgba(124,58,237,0.35)' }}
                        animate={{ scale: [1.05, 1, 1.05], opacity: [0.55, 0.85, 0.55] }}
                        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
                    />
                </div>

                {/* Grid texture */}
                <div className="absolute inset-0 opacity-[0.05] pointer-events-none"
                    style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '64px 64px' }} />

                <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-32 md:py-40 text-center">
                    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
                        <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-[#f5bb00]/40 rounded-full px-4 py-1.5 mb-7">
                            <GraduationCap className="w-4 h-4 text-[#f5bb00]" />
                            <span className="text-xs font-bold uppercase tracking-[0.35em] text-[#f5bb00]">{c.hero_eyebrow}</span>
                        </div>
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.85, delay: 0.1 }}
                        className="text-5xl md:text-7xl lg:text-8xl font-black leading-[1.02] mb-7"
                    >
                        {c.hero_title_line1} <span className="bg-gradient-to-r from-[#f5bb00] via-white to-[#f5bb00] bg-clip-text text-transparent">{c.hero_title_highlight}</span>
                        <br/>{c.hero_title_line2}
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
                        A three-year academic and spiritual journey — Certificate, Diploma, Advanced Diploma —
                        equipping you with biblical depth, theological clarity, and ministry skill for
                        a lifetime of impact.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.55 }}
                        className="flex flex-col sm:flex-row gap-4 justify-center items-center"
                    >
                        <a href="#programs" className="inline-flex items-center gap-2 bg-[#f5bb00] hover:bg-white text-[#140152] font-bold px-8 py-4 rounded-full transition-all hover:scale-105 shadow-2xl">
                            {c.hero_primary_cta} <ArrowRight className="w-4 h-4" />
                        </a>
                        <a href="#apply" className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/30 text-white font-bold px-8 py-4 rounded-full transition-all hover:scale-105">
                            Apply Now
                        </a>
                    </motion.div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════════════════════════════
                STATS BAND — quick credibility numbers
                ═══════════════════════════════════════════════════════════════ */}
            <section className="relative overflow-hidden py-14 md:py-16" style={{ background: NAVY }}>
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[60rem] h-[60rem] rounded-full blur-[140px]" style={{ background: `${GOLD}1a` }} />
                </div>
                <div className="relative max-w-6xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                    {liveStats.map((s: any, i: number) => (
                        <motion.div
                            key={s.label || i}
                            initial={{ opacity: 0, y: 12 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.08 }}
                        >
                            <p className="text-5xl md:text-6xl font-black bg-gradient-to-br from-white via-white to-[#f5bb00] bg-clip-text text-transparent leading-none">
                                {s.value}
                            </p>
                            <p className="mt-3 text-[10px] md:text-xs font-black uppercase tracking-[0.3em] text-white/80">
                                {s.label}
                            </p>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* ═══════════════════════════════════════════════════════════════════
                IDENTITY CAROUSEL — rotating "what you'll gain"
                ═══════════════════════════════════════════════════════════════ */}
            <section
                className="relative overflow-hidden py-20 md:py-24"
                style={{ background: `linear-gradient(120deg, ${NAVY} 0%, #0a0028 100%)` }}
                onMouseEnter={() => setPaused(true)}
                onMouseLeave={() => setPaused(false)}
            >
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute -top-32 -left-32 w-[28rem] h-[28rem] rounded-full blur-[120px]" style={{ background: `${GOLD}26` }} />
                    <div className="absolute -bottom-40 -right-20 w-[32rem] h-[32rem] rounded-full blur-[140px]" style={{ background: '#7c3aed33' }} />
                </div>
                <div className="relative max-w-4xl mx-auto px-4 text-center">
                    <p className="text-[10px] md:text-xs font-black uppercase tracking-[0.4em] text-[#f5bb00] mb-8">{c.carousel_eyebrow}</p>
                    <div className="relative min-h-[180px] md:min-h-[200px] flex items-center justify-center">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={slide}
                                initial={{ opacity: 0, y: 24, scale: 0.92 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -24, scale: 0.92 }}
                                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                                className="text-center"
                            >
                                <p className="text-6xl md:text-8xl font-black leading-none bg-gradient-to-br from-white via-white to-[#f5bb00] bg-clip-text text-transparent drop-shadow-[0_4px_30px_rgba(245,187,0,0.25)]"
                                   style={{ fontFamily: '"Cormorant Garamond","Playfair Display",Georgia,serif', fontStyle: 'italic' }}>
                                    {liveCarouselQuotes[slide].value}
                                </p>
                                <p className="mt-5 text-sm md:text-base font-black uppercase tracking-[0.3em] text-white">{liveCarouselQuotes[slide].label}</p>
                                <div className="mt-2 mx-auto h-0.5 w-32 bg-gradient-to-r from-transparent via-[#f5bb00] to-transparent" />
                            </motion.div>
                        </AnimatePresence>
                    </div>
                    <div className="flex items-center justify-center gap-2.5 mt-10">
                        {liveCarouselQuotes.map((_, i) => (
                            <button key={i} onClick={() => setSlide(i)} aria-label={`Slide ${i + 1}`}
                                className="h-2 rounded-full transition-all duration-500"
                                style={{ width: i === slide ? '2.5rem' : '0.5rem', background: i === slide ? GOLD : 'rgba(255,255,255,0.3)' }} />
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════════════════════════════
                SIX PILLARS OF FORMATION
                ═══════════════════════════════════════════════════════════════ */}
            <section className="py-24 md:py-32 bg-white">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16 space-y-4">
                        <p className="text-[10px] font-black uppercase tracking-[0.4em]" style={{ color: NAVY }}>{c.pillars_eyebrow}</p>
                        <h2 className="text-4xl md:text-5xl font-black text-[#140152] leading-tight">{c.pillars_heading}</h2>
                        <div className="w-24 h-1.5 mx-auto rounded-full" style={{ background: `linear-gradient(to right, ${NAVY}, ${GOLD})` }} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {livePillars.map((p: any, i: number) => {
                            const Icon = getIcon(p.icon, BookOpen)
                            return (
                            <motion.div
                                key={p.id || i}
                                initial={{ opacity: 0, y: 24 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.06 }}
                            >
                                <div className="relative h-full rounded-3xl bg-white border border-gray-100 shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all group p-7 overflow-hidden">
                                    <div className="absolute top-0 left-0 right-0 h-1.5" style={{ background: `linear-gradient(to right, ${NAVY}, ${GOLD})` }} />
                                    <div className="flex items-center justify-between mb-5">
                                        <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all"
                                             style={{ background: `linear-gradient(135deg, ${NAVY}, #1d0175)` }}>
                                            <Icon className="w-7 h-7 text-[#f5bb00]" />
                                        </div>
                                        <span className="text-[40px] font-black leading-none" style={{ fontFamily: '"Cormorant Garamond",serif', color: `${NAVY}11` }}>{p.id}</span>
                                    </div>
                                    <h3 className="text-xl font-black text-[#140152] mb-3 leading-tight">{p.title}</h3>
                                    <p className="text-gray-600 leading-relaxed text-[15px]">{p.desc}</p>
                                </div>
                            </motion.div>
                            )
                        })}
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════════════════════════════
                THEOLOGY FLYER CAROUSEL — visual highlight
                ═══════════════════════════════════════════════════════════════ */}
            <section className="relative overflow-hidden py-20 md:py-24" style={{ background: CREAM }}>
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-10 space-y-4">
                        <p className="text-[10px] font-black uppercase tracking-[0.4em]" style={{ color: NAVY }}>{c.images_eyebrow}</p>
                        <h2 className="text-3xl md:text-5xl font-black text-[#140152] leading-tight">{c.images_heading}</h2>
                        <div className="w-24 h-1.5 mx-auto rounded-full" style={{ background: `linear-gradient(to right, ${NAVY}, ${GOLD})` }} />
                    </div>
                    <div className="relative max-w-4xl mx-auto">
                        <div className="relative aspect-[16/9] md:aspect-[2/1] rounded-[2rem] overflow-hidden shadow-2xl ring-1 ring-black/10 bg-[#0a0028]">
                            <AnimatePresence mode="wait">
                                <motion.img
                                    key={liveImages[imgSlide].src}
                                    src={liveImages[imgSlide].src}
                                    alt={liveImages[imgSlide].alt}
                                    initial={{ opacity: 0, scale: 1.04 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.98 }}
                                    transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                                    className="absolute inset-0 w-full h-full object-cover"
                                />
                            </AnimatePresence>
                        </div>
                        <button
                            onClick={() => setImgSlide(i => (i - 1 + liveImages.length) % liveImages.length)}
                            className="absolute left-2 md:-left-5 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white shadow-lg flex items-center justify-center hover:scale-110 transition-transform"
                            aria-label="Previous"
                        >
                            <ChevronLeft className="w-5 h-5 text-[#140152]" />
                        </button>
                        <button
                            onClick={() => setImgSlide(i => (i + 1) % liveImages.length)}
                            className="absolute right-2 md:-right-5 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white shadow-lg flex items-center justify-center hover:scale-110 transition-transform"
                            aria-label="Next"
                        >
                            <ChevronRight className="w-5 h-5 text-[#140152]" />
                        </button>
                        <div className="flex justify-center gap-2 mt-6">
                            {liveImages.map((_, i) => (
                                <button key={i} onClick={() => setImgSlide(i)}
                                    className="h-2 rounded-full transition-all duration-500"
                                    style={{ width: i === imgSlide ? '2.5rem' : '0.5rem', background: i === imgSlide ? NAVY : 'rgba(20,1,82,0.25)' }} />
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════════════════════════════
                THE THREE PROGRAMS — interactive selector
                ═══════════════════════════════════════════════════════════════ */}
            <section id="programs" className="py-24 md:py-32 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12 space-y-4">
                        <p className="text-[10px] font-black uppercase tracking-[0.4em]" style={{ color: NAVY }}>{c.programs_eyebrow}</p>
                        <h2 className="text-4xl md:text-5xl font-black text-[#140152] leading-tight">{c.programs_heading}</h2>
                        <div className="w-24 h-1.5 mx-auto rounded-full" style={{ background: `linear-gradient(to right, ${NAVY}, ${GOLD})` }} />
                        <p className="text-gray-600 max-w-2xl mx-auto leading-relaxed">
                            {c.programs_subtitle}
                        </p>
                    </div>

                    {/* Level selector tabs */}
                    <div className="flex flex-wrap justify-center gap-3 mb-12">
                        {livePrograms.map((p: any) => (
                            <button
                                key={p.level}
                                onClick={() => { setActiveLevel(p.level); setActiveSem(0) }}
                                className="group relative px-5 py-3 rounded-2xl text-left transition-all"
                                style={{
                                    background: activeLevel === p.level ? `linear-gradient(135deg, ${p.accent}, ${p.accentTo})` : 'white',
                                    color: activeLevel === p.level ? 'white' : '#140152',
                                    boxShadow: activeLevel === p.level ? '0 20px 40px -10px rgba(20,1,82,0.25)' : '0 1px 4px rgba(0,0,0,0.06)',
                                    border: activeLevel === p.level ? 'none' : '1px solid rgb(229,231,235)',
                                }}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center font-black"
                                        style={{ color: activeLevel === p.level ? 'white' : p.accent }}>
                                        L{p.level}
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold uppercase tracking-wider opacity-80">{p.subtitle}</p>
                                        <p className="font-black text-sm">{p.title}</p>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>

                    {/* Active program card */}
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeLevel}
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -16 }}
                            transition={{ duration: 0.4 }}
                        >
                            <div className="rounded-[2rem] overflow-hidden shadow-2xl bg-white">
                                {/* Program header */}
                                <div className="relative overflow-hidden p-8 md:p-12 text-white"
                                    style={{ background: `linear-gradient(135deg, ${currentProgram.accent} 0%, ${currentProgram.accentTo} 100%)` }}>
                                    <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full blur-3xl opacity-30 bg-white" />
                                    <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full blur-3xl opacity-20 bg-[#f5bb00]" />
                                    <div className="relative">
                                        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/80 mb-2">Level {currentProgram.level} · {currentProgram.subtitle}</p>
                                        <h3 className="text-3xl md:text-5xl font-black mb-3 leading-tight">{currentProgram.title}</h3>
                                        <p className="text-white/90 italic max-w-2xl" style={{ fontFamily: '"Cormorant Garamond",serif' }}>
                                            {currentProgram.tag}
                                        </p>

                                        <div className="mt-8 grid grid-cols-3 gap-4">
                                            {[
                                                { icon: Calendar, label: 'Duration', value: currentProgram.duration },
                                                { icon: Award, label: 'Credits', value: currentProgram.credits },
                                                { icon: BookOpen, label: 'Courses', value: currentProgram.courses_count },
                                            ].map(stat => (
                                                <div key={stat.label} className="bg-white/15 backdrop-blur-sm border border-white/20 rounded-2xl p-4">
                                                    <stat.icon className="w-5 h-5 text-[#f5bb00] mb-2" />
                                                    <p className="text-[10px] font-black uppercase tracking-wider text-white/80">{stat.label}</p>
                                                    <p className="text-sm md:text-base font-black mt-0.5 leading-tight">{stat.value}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Body */}
                                <div className="p-7 md:p-10 grid lg:grid-cols-[1.5fr_1fr] gap-10">
                                    {/* Curriculum + semester switcher */}
                                    <div>
                                        <p className="text-gray-700 leading-relaxed mb-7 text-[15px]">{currentProgram.description}</p>

                                        <div className="flex items-center gap-2 mb-5">
                                            <BookOpen className="w-5 h-5 text-[#140152]" />
                                            <h4 className="text-lg font-black text-[#140152]">Curriculum</h4>
                                        </div>

                                        <div className="flex gap-2 mb-5">
                                            {currentProgram.semesters.map((s: any, i: number) => (
                                                <button
                                                    key={i}
                                                    onClick={() => setActiveSem(i)}
                                                    className="px-4 py-2 rounded-xl text-sm font-bold transition-all"
                                                    style={{
                                                        background: activeSem === i ? currentProgram.accent : '#f3f4f6',
                                                        color: activeSem === i ? 'white' : '#374151',
                                                    }}
                                                >
                                                    {s.name}
                                                </button>
                                            ))}
                                        </div>

                                        <div className="grid sm:grid-cols-2 gap-2.5">
                                            {currentProgram.semesters[activeSem].courses.map((course: string, i: number) => (
                                                <motion.div
                                                    key={course}
                                                    initial={{ opacity: 0, x: -8 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: i * 0.03 }}
                                                    className="flex items-center gap-2.5 p-2.5 rounded-lg bg-gray-50 hover:bg-[#fbf5e6] transition-colors"
                                                >
                                                    <CheckCircle className="w-4 h-4 flex-shrink-0" style={{ color: currentProgram.accent }} />
                                                    <span className="text-sm text-gray-800 leading-tight">{course}</span>
                                                </motion.div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Requirements panel */}
                                    <aside className="rounded-2xl p-6 md:p-7 h-fit lg:sticky lg:top-24"
                                        style={{ background: `linear-gradient(135deg, ${NAVY} 0%, #0a0028 100%)`, color: 'white' }}>
                                        <div className="flex items-center gap-2 mb-5">
                                            <FileCheck className="w-5 h-5 text-[#f5bb00]" />
                                            <h4 className="text-lg font-black">Admission Requirements</h4>
                                        </div>

                                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#f5bb00] mb-2">Eligibility</p>
                                        <ul className="space-y-2 mb-5">
                                            {currentProgram.requirements.basics.map((r: string) => (
                                                <li key={r} className="flex items-start gap-2 text-sm text-white/85 leading-relaxed">
                                                    <Star className="w-3.5 h-3.5 text-[#f5bb00] flex-shrink-0 mt-0.5" />
                                                    {r}
                                                </li>
                                            ))}
                                        </ul>

                                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#f5bb00] mb-2">Documents</p>
                                        <ul className="space-y-2 mb-7">
                                            {currentProgram.requirements.docs.map((d: string) => (
                                                <li key={d} className="flex items-start gap-2 text-sm text-white/85 leading-relaxed">
                                                    <CheckCircle className="w-3.5 h-3.5 text-[#f5bb00] flex-shrink-0 mt-0.5" />
                                                    {d}
                                                </li>
                                            ))}
                                        </ul>

                                        <a href="#apply" className="inline-flex items-center gap-2 w-full justify-center bg-[#f5bb00] hover:bg-white text-[#140152] font-black px-6 py-3.5 rounded-full transition-all hover:scale-[1.02] shadow-lg">
                                            Apply for {currentProgram.subtitle} <ArrowRight className="w-4 h-4" />
                                        </a>
                                    </aside>
                                </div>
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </div>
            </section>

            {/* ═══════════════════════════════════════════════════════════════════
                THE JOURNEY — 3-step timeline
                ═══════════════════════════════════════════════════════════════ */}
            <section className="py-24 md:py-32" style={{ background: `linear-gradient(180deg, ${CREAM} 0%, white 100%)` }}>
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16 space-y-4">
                        <p className="text-[10px] font-black uppercase tracking-[0.4em]" style={{ color: NAVY }}>{c.journey_eyebrow}</p>
                        <h2 className="text-4xl md:text-5xl font-black text-[#140152] leading-tight">{c.journey_heading}</h2>
                        <div className="w-24 h-1.5 mx-auto rounded-full" style={{ background: `linear-gradient(to right, ${NAVY}, ${GOLD})` }} />
                    </div>

                    <div className="relative">
                        {/* Vertical line for md+ */}
                        <div className="hidden md:block absolute left-1/2 -translate-x-1/2 top-12 bottom-12 w-0.5 bg-gradient-to-b from-[#140152] via-[#f5bb00] to-[#140152]" />

                        <div className="space-y-10 md:space-y-20">
                            {liveJourney.map((j: any, i: number) => (
                                <motion.div
                                    key={j.step || i}
                                    initial={{ opacity: 0, y: 24 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true, margin: '-100px' }}
                                    transition={{ delay: i * 0.1 }}
                                    className={`relative flex flex-col md:flex-row gap-6 md:gap-12 items-center ${i % 2 === 1 ? 'md:flex-row-reverse' : ''}`}
                                >
                                    {/* Card */}
                                    <div className="flex-1 w-full">
                                        <div className="rounded-3xl bg-white shadow-xl p-7 md:p-9 border border-gray-100 hover:shadow-2xl transition-shadow">
                                            <p className="text-[10px] font-black uppercase tracking-[0.4em] mb-2" style={{ color: GOLD }}>Step {j.step}</p>
                                            <h3 className="text-2xl md:text-3xl font-black text-[#140152] mb-3 leading-tight">{j.title}</h3>
                                            <p className="text-gray-600 leading-relaxed">{j.desc}</p>
                                        </div>
                                    </div>
                                    {/* Number circle on the line */}
                                    <div className="relative md:absolute md:left-1/2 md:-translate-x-1/2 w-16 h-16 rounded-full flex items-center justify-center text-2xl font-black text-white shadow-2xl ring-4 ring-white"
                                        style={{ background: `linear-gradient(135deg, ${NAVY}, #1d0175)` }}>
                                        {j.step}
                                    </div>
                                    {/* Spacer for the other column */}
                                    <div className="hidden md:block flex-1" />
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════════════════════════════
                WHAT YOU GAIN
                ═══════════════════════════════════════════════════════════════ */}
            <section className="py-24 md:py-32 bg-white">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-14 space-y-4">
                        <p className="text-[10px] font-black uppercase tracking-[0.4em]" style={{ color: NAVY }}>{c.gains_eyebrow}</p>
                        <h2 className="text-4xl md:text-5xl font-black text-[#140152] leading-tight">{c.gains_heading}</h2>
                        <div className="w-24 h-1.5 mx-auto rounded-full" style={{ background: `linear-gradient(to right, ${NAVY}, ${GOLD})` }} />
                    </div>

                    <div className="grid md:grid-cols-2 gap-3">
                        {liveGains.map((g: string, i: number) => (
                            <motion.div
                                key={g || i}
                                initial={{ opacity: 0, y: 12 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.04 }}
                                className="flex items-start gap-4 p-5 rounded-2xl bg-gradient-to-br from-white via-white to-[#fbf5e6] border border-gray-100 hover:shadow-lg transition-shadow"
                            >
                                <div className="w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center"
                                    style={{ background: `linear-gradient(135deg, ${NAVY}, #1d0175)` }}>
                                    <CheckCircle className="w-4.5 h-4.5 text-[#f5bb00]" />
                                </div>
                                <p className="text-gray-800 leading-relaxed text-[15px] pt-1">{g}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════════════════════════════
                FINAL APPLY CTA
                ═══════════════════════════════════════════════════════════════ */}
            <section id="apply" className="relative overflow-hidden py-24 md:py-32 text-white"
                style={{ background: `linear-gradient(135deg, #0a0028 0%, ${NAVY} 50%, #1d0175 100%)` }}>
                <div className="absolute inset-0 pointer-events-none">
                    <motion.div
                        className="absolute -top-40 -left-40 w-[40rem] h-[40rem] rounded-full blur-[140px]"
                        style={{ background: `${GOLD}33` }}
                        animate={{ scale: [1, 1.08, 1] }}
                        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                    />
                    <motion.div
                        className="absolute -bottom-40 -right-20 w-[50rem] h-[50rem] rounded-full blur-[160px]"
                        style={{ background: 'rgba(124,58,237,0.35)' }}
                        animate={{ scale: [1.05, 1, 1.05] }}
                        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
                    />
                </div>

                <div className="relative max-w-4xl mx-auto px-4 text-center">
                    <Sparkles className="w-10 h-10 mx-auto mb-6" style={{ color: GOLD }} />
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#f5bb00] mb-5">{c.final_eyebrow}</p>
                    <h2 className="text-4xl md:text-6xl font-black leading-[1.05] mb-7">
                        {c.final_title_line1} <span className="bg-gradient-to-r from-[#f5bb00] via-white to-[#f5bb00] bg-clip-text text-transparent">{c.final_title_highlight}</span>{c.final_title_line2 ? <> {c.final_title_line2}</> : null}
                    </h2>
                    <p className="text-white/85 max-w-2xl mx-auto leading-relaxed mb-12 text-lg whitespace-pre-line">
                        {c.final_body}
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                        <Link href="/auth/register?next=/education/theology-school"
                            className="inline-flex items-center gap-2 bg-[#f5bb00] hover:bg-white text-[#140152] font-bold px-8 py-4 rounded-full transition-all hover:scale-105 shadow-2xl">
                            {c.final_primary_cta} <ArrowRight className="w-4 h-4" />
                        </Link>
                        <Link href="/contact"
                            className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/30 text-white font-bold px-8 py-4 rounded-full transition-all hover:scale-105">
                            <Quote className="w-4 h-4" /> {c.final_secondary_cta}
                        </Link>
                    </div>

                    <p className="mt-10 text-xs text-white/60 italic" style={{ fontFamily: '"Cormorant Garamond",serif' }}>
                        {c.final_quote}
                    </p>
                </div>
            </section>
        </div>
    )
}
