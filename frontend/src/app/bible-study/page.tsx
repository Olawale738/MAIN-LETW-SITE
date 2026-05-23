'use client'

import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import SectionWrapper from '@/components/shared/SectionWrapper'
import {
    BookOpen, Cross, Flame, Heart, Sun, Users, Calendar, MessageCircle,
    ArrowRight, CheckCircle, Search, Play, Download, Star, Clock,
    TrendingUp, Award, Mic2, Globe, Lightbulb, Shield, Target,
    ChevronDown, ChevronRight, BookMarked, Scroll, PenLine, Bell
} from 'lucide-react'
import Link from 'next/link'
import { bibleStudyApi, QuarterlyTheme, BibleStudyPageSettings } from '@/lib/api'

// ─── Static fallback themes ────────────────────────────────────────────────────
const FALLBACK_THEMES = [
    {
        id: 1,
        title: "The Cost of Discipleship",
        scripture: "Luke 14:27–35",
        description: "A call to wholehearted commitment—embracing sacrifice, obedience, and unwavering devotion to Christ, regardless of the cost.",
        accent_color: "#7c3aed",
        bgImage: "https://images.unsplash.com/photo-1504052434569-70ad5836ab65?w=800&auto=format&fit=crop&q=60"
    },
    {
        id: 2,
        title: "Experiencing Transformative Power Through Fruitfulness",
        scripture: "John 15:16",
        description: "Understanding divine selection and purpose, and walking in a life that produces lasting spiritual fruit through abiding in Christ.",
        accent_color: "#0284c7",
        bgImage: "https://images.unsplash.com/photo-1490730141103-6cac27aaab94?w=800&auto=format&fit=crop&q=60"
    },
    {
        id: 3,
        title: "The Sustaining Power of the Holy Spirit",
        scripture: "Acts 1:8; Hebrews 12:22–24",
        description: "Living daily by the enabling strength of the Holy Spirit—empowered for witness, endurance, and victorious Christian living.",
        accent_color: "#d97706",
        bgImage: "https://images.unsplash.com/photo-1501952476817-d7ae22e3f2d2?w=800&auto=format&fit=crop&q=60"
    },
    {
        id: 4,
        title: "Enter into His Rest Through Faith",
        scripture: "Hebrews 11:24–26",
        description: "Choosing faith over fear and eternal reward over temporary pleasure, as believers rest in God's promises and purposes.",
        accent_color: "#059669",
        bgImage: "https://images.unsplash.com/photo-1499209974431-9dddcece7f88?w=800&auto=format&fit=crop&q=60"
    }
]

const QUARTER_BG: Record<number, string> = {
    1: "https://images.unsplash.com/photo-1504052434569-70ad5836ab65?w=800&auto=format&fit=crop&q=60",
    2: "https://images.unsplash.com/photo-1490730141103-6cac27aaab94?w=800&auto=format&fit=crop&q=60",
    3: "https://images.unsplash.com/photo-1501952476817-d7ae22e3f2d2?w=800&auto=format&fit=crop&q=60",
    4: "https://images.unsplash.com/photo-1499209974431-9dddcece7f88?w=800&auto=format&fit=crop&q=60",
}

const QUARTER_ICONS = [
    <Cross className="w-8 h-8 text-white" key="1" />,
    <Heart className="w-8 h-8 text-white" key="2" />,
    <Flame className="w-8 h-8 text-white" key="3" />,
    <Sun className="w-8 h-8 text-white" key="4" />,
]

const benefits = [
    { icon: <Users className="w-6 h-6 text-[#f5bb00]" />, title: "Community Learning", description: "Study alongside fellow believers in a supportive environment" },
    { icon: <Calendar className="w-6 h-6 text-[#f5bb00]" />, title: "Structured Curriculum", description: "Follow our carefully designed quarterly themes throughout the year" },
    { icon: <MessageCircle className="w-6 h-6 text-[#f5bb00]" />, title: "Interactive Discussions", description: "Engage in meaningful conversations and share insights" },
    { icon: <BookOpen className="w-6 h-6 text-[#f5bb00]" />, title: "Deep Bible Study", description: "Dive deeper into Scripture with expert guidance and resources" },
]

const weeklyTopics = [
    { week: 'Week 1', title: 'The Nature of God', verse: 'Exodus 34:6-7', category: 'Foundation', color: '#7c3aed' },
    { week: 'Week 2', title: 'The Person of Jesus', verse: 'Colossians 1:15-20', category: 'Christology', color: '#0284c7' },
    { week: 'Week 3', title: 'The Work of the Holy Spirit', verse: 'John 16:5-15', category: 'Pneumatology', color: '#d97706' },
    { week: 'Week 4', title: 'Prayer & Intimacy with God', verse: 'Matthew 6:5-13', category: 'Devotional', color: '#059669' },
    { week: 'Week 5', title: 'Living by Faith', verse: 'Hebrews 11:1-6', category: 'Christian Life', color: '#ef4444' },
    { week: 'Week 6', title: 'The Church & Community', verse: 'Acts 2:42-47', category: 'Ecclesiology', color: '#8b5cf6' },
]

const resources = [
    { type: 'pdf', title: 'Q1 Study Guide — The Cost of Discipleship', pages: '24 pages', icon: Download, color: 'bg-red-100 text-red-600' },
    { type: 'video', title: 'Introduction to Expository Bible Study', duration: '38 min', icon: Play, color: 'bg-blue-100 text-blue-600' },
    { type: 'pdf', title: 'How to Study the Bible Effectively', pages: '16 pages', icon: Download, color: 'bg-green-100 text-green-600' },
    { type: 'audio', title: 'Lectio Divina — Ancient Bible Meditation', duration: '22 min', icon: Mic2, color: 'bg-purple-100 text-purple-600' },
    { type: 'pdf', title: 'Prayer & Bible Study Journal Template', pages: '8 pages', icon: PenLine, color: 'bg-amber-100 text-amber-600' },
    { type: 'video', title: 'Understanding Biblical Context & Culture', duration: '45 min', icon: Play, color: 'bg-indigo-100 text-indigo-600' },
]

const groups = [
    { name: 'Young Adults Group', leader: 'Bro. Emmanuel', time: 'Tuesdays 6:00 PM', size: 18, level: 'Open to all' },
    { name: "Women's Bible Circle", leader: 'Sis. Grace', time: 'Thursdays 5:00 PM', size: 22, level: 'Women only' },
    { name: "Men's Study Fellowship", leader: 'Bro. Daniel', time: 'Saturdays 8:00 AM', size: 14, level: 'Men only' },
    { name: 'Deeper Life Class', leader: 'Pastor Wale', time: 'Sundays 2:00 PM', size: 30, level: 'Advanced' },
]

const stats = [
    { val: '200+', label: 'Active Participants' },
    { val: '4', label: 'Study Groups' },
    { val: '52', label: 'Weeks Per Year' },
    { val: '6+', label: 'Years Running' },
]

const studyMethods = [
    { icon: Search, title: 'Inductive Study', desc: 'Observe, interpret, and apply Scripture through careful reading and questioning.' },
    { icon: Scroll, title: 'Expository Preaching', desc: 'Systematic, verse-by-verse exposition of entire books of the Bible.' },
    { icon: BookMarked, title: 'Topical Study', desc: 'Deep dives into key biblical themes across Old and New Testaments.' },
    { icon: PenLine, title: 'Journaling & Reflection', desc: 'Personal application through guided journaling and prayer prompts.' },
]

export default function BibleStudyPage() {
    const [adminThemes, setAdminThemes] = useState<QuarterlyTheme[]>([])
    const [settings, setSettings] = useState<BibleStudyPageSettings | null>(null)
    const [loading, setLoading] = useState(true)
    const [activeSection, setActiveSection] = useState<'curriculum' | 'weekly' | 'groups' | 'resources'>('curriculum')
    const [expandedWeek, setExpandedWeek] = useState<number | null>(null)

    useEffect(() => {
        Promise.all([
            bibleStudyApi.getQuarterlyThemes().catch(() => []),
            bibleStudyApi.getSettings().catch(() => null),
        ]).then(([themes, settingsData]) => {
            if (themes.length > 0) setAdminThemes(themes)
            if (settingsData) setSettings(settingsData)
        }).finally(() => setLoading(false))
    }, [])

    const activeThemes = adminThemes.length > 0
        ? adminThemes.map(t => ({
            id: t.quarter_number,
            title: t.title,
            scripture: t.scripture,
            description: t.description ?? '',
            accent_color: t.accent_color,
            bgImage: QUARTER_BG[t.quarter_number] ?? QUARTER_BG[1],
        }))
        : FALLBACK_THEMES

    const yearLabel = settings?.year_label ?? '2026'

    const navItems = [
        { id: 'curriculum', label: '2026 Curriculum', icon: BookOpen },
        { id: 'weekly', label: 'Weekly Topics', icon: Calendar },
        { id: 'groups', label: 'Study Groups', icon: Users },
        { id: 'resources', label: 'Resources', icon: Download },
    ] as const

    return (
        <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
            {/* Hero image */}
            <div className="w-full relative">
                <img src="/Bible-study.png" alt="Bible Study" className="w-full h-auto block" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#140152]/60 to-transparent flex items-end">
                    <div className="p-8 md:p-16 max-w-3xl">
                        <span className="inline-block px-4 py-1.5 bg-[#f5bb00] text-[#140152] rounded-full text-sm font-bold mb-4">Live Every Tuesday · 6:00 PM</span>
                        <h1 className="text-4xl md:text-6xl font-black text-white leading-tight mb-4">Dig Deeper Into<br />God's Word</h1>
                        <p className="text-white/80 text-lg max-w-xl">Structured, Spirit-led Bible study that transforms minds, builds faith, and creates community.</p>
                    </div>
                </div>
            </div>

            {/* Stats bar */}
            <div className="bg-[#140152] py-6">
                <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 px-4 text-center">
                    {stats.map((s, i) => (
                        <div key={i}>
                            <div className="text-3xl font-black text-[#f5bb00]">{s.val}</div>
                            <div className="text-sm text-white/70">{s.label}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Sticky nav */}
            <div className="sticky top-0 z-30 bg-white dark:bg-neutral-900 border-b border-gray-200 dark:border-neutral-700 shadow-sm">
                <div className="max-w-6xl mx-auto px-4 flex gap-1 overflow-x-auto py-3">
                    {navItems.map(n => (
                        <button key={n.id} onClick={() => setActiveSection(n.id)}
                            className={`flex items-center gap-2 px-5 py-2 rounded-lg font-semibold text-sm whitespace-nowrap transition-all ${activeSection === n.id ? 'bg-[#140152] text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
                            <n.icon className="w-4 h-4" /> {n.label}
                        </button>
                    ))}
                </div>
            </div>

            <SectionWrapper>
                {/* ── CURRICULUM ── */}
                {activeSection === 'curriculum' && (
                    <>
                        <div className="text-center mb-16 space-y-4">
                            <span className="text-[#f5bb00] font-bold uppercase tracking-[0.2em] text-sm">{yearLabel} Curriculum</span>
                            <h2 className="text-4xl md:text-5xl font-black text-[#140152] dark:text-white">Quarterly Themes</h2>
                            <div className="w-24 h-1.5 bg-[#f5bb00] mx-auto rounded-full" />
                            <p className="max-w-2xl mx-auto text-gray-600 dark:text-gray-300 mt-4">
                                This year, we embark on a journey of deeper discipleship, spiritual empowerment, and fruitful living.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
                            {(loading ? FALLBACK_THEMES : activeThemes).map((theme) => (
                                <motion.div key={theme.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: theme.id * 0.1 }}>
                                    <Card className="h-full border-none shadow-lg hover:shadow-xl transition-all duration-300 group overflow-hidden relative">
                                        <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110" style={{ backgroundImage: `url(${theme.bgImage})` }} />
                                        <div className="absolute inset-0 bg-gradient-to-b from-[#140152]/90 via-[#140152]/85 to-[#140152]/95" />
                                        <div className="absolute top-0 left-0 right-0 h-1" style={{ backgroundColor: theme.accent_color }} />
                                        <CardHeader className="space-y-4 relative z-10">
                                            <div className="w-14 h-14 backdrop-blur-sm rounded-xl flex items-center justify-center" style={{ backgroundColor: `${theme.accent_color}30` }}>
                                                {QUARTER_ICONS[(theme.id - 1) % 4]}
                                            </div>
                                            <div>
                                                <span className="text-sm font-bold uppercase tracking-wider" style={{ color: theme.accent_color }}>Quarter {theme.id}</span>
                                                <CardTitle className="text-2xl font-bold text-white mt-2 group-hover:text-[#f5bb00] transition-colors">{theme.title}</CardTitle>
                                                <p className="text-sm font-semibold text-gray-300 mt-1">{theme.scripture}</p>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="relative z-10">
                                            <p className="text-gray-200 leading-relaxed">{theme.description}</p>
                                            {adminThemes.length > 0 && (() => {
                                                const t = adminThemes.find(a => a.quarter_number === theme.id)
                                                return t ? (
                                                    <span className="inline-block mt-3 text-xs text-white/50 border border-white/20 rounded-full px-3 py-1">Weeks {t.week_start}–{t.week_end}</span>
                                                ) : null
                                            })()}
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            ))}
                        </div>

                        {/* Study Methods */}
                        <div className="mb-16">
                            <div className="text-center mb-12">
                                <span className="text-[#f5bb00] font-bold uppercase tracking-[0.2em] text-sm">How We Study</span>
                                <h2 className="text-3xl font-black text-[#140152] dark:text-white mt-2">Our Study Approaches</h2>
                            </div>
                            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                                {studyMethods.map((m, i) => (
                                    <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                                        className="p-6 bg-white dark:bg-neutral-800 rounded-2xl border border-gray-100 dark:border-neutral-700 hover:border-[#f5bb00] hover:shadow-lg transition-all group text-center">
                                        <div className="w-14 h-14 bg-[#140152]/5 rounded-2xl flex items-center justify-center mx-auto mb-5 group-hover:bg-[#f5bb00]/10 transition-colors">
                                            <m.icon className="w-7 h-7 text-[#140152] group-hover:text-[#f5bb00] transition-colors" />
                                        </div>
                                        <h3 className="font-bold text-[#140152] dark:text-white mb-2">{m.title}</h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">{m.desc}</p>
                                    </motion.div>
                                ))}
                            </div>
                        </div>

                        {/* Why Join */}
                        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                            className="mb-16 bg-white dark:bg-neutral-800 rounded-3xl p-8 md:p-12 shadow-lg">
                            <div className="text-center mb-12">
                                <h3 className="text-3xl md:text-4xl font-black text-[#140152] dark:text-white mb-4">Why Join Our Bible Study?</h3>
                                <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">Experience transformative growth through our comprehensive Bible study program</p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                                {benefits.map((benefit, index) => (
                                    <motion.div key={index} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.1 }}
                                        className="text-center p-6 rounded-2xl bg-neutral-50 dark:bg-neutral-700 hover:bg-[#140152]/5 dark:hover:bg-[#140152]/20 transition-colors">
                                        <div className="w-12 h-12 bg-[#f5bb00]/10 rounded-xl flex items-center justify-center mx-auto mb-4">{benefit.icon}</div>
                                        <h4 className="font-bold text-[#140152] dark:text-white mb-2">{benefit.title}</h4>
                                        <p className="text-sm text-gray-600 dark:text-gray-300">{benefit.description}</p>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>

                        {/* How It Works */}
                        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-16">
                            <div className="text-center mb-12">
                                <span className="text-[#f5bb00] font-bold uppercase tracking-[0.2em] text-sm">Simple Process</span>
                                <h3 className="text-3xl md:text-4xl font-black text-[#140152] dark:text-white mt-2">How It Works</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                {[
                                    { step: "01", title: "Register", description: "Create your account and join our Bible study community" },
                                    { step: "02", title: "Access Resources", description: "Get instant access to study materials, guides, and recordings" },
                                    { step: "03", title: "Grow Together", description: "Participate in live sessions and connect with fellow believers" }
                                ].map((item, index) => (
                                    <div key={index}>
                                        <div className="text-[#f5bb00]/20 font-black text-7xl mb-4">{item.step}</div>
                                        <h4 className="text-xl font-bold text-[#140152] dark:text-white mb-2">{item.title}</h4>
                                        <p className="text-gray-600 dark:text-gray-300">{item.description}</p>
                                    </div>
                                ))}
                            </div>
                        </motion.div>

                        {/* CTA */}
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
                            className="bg-gradient-to-br from-[#140152] to-[#1a0670] rounded-3xl p-8 md:p-12 text-center text-white relative overflow-hidden mb-16">
                            <div className="relative z-10 max-w-3xl mx-auto space-y-8">
                                <h3 className="text-2xl md:text-3xl font-bold mb-4 text-[#f5bb00]">Ready to Begin Your Journey?</h3>
                                <p className="text-lg md:text-xl leading-relaxed text-gray-200 mb-6">Join our Bible study community today and experience transformative growth in your faith journey.</p>
                                <Link href="/auth/login">
                                    <Button size="lg" className="bg-[#f5bb00] hover:bg-[#f5bb00]/90 text-[#140152] font-bold text-lg px-8 py-6 rounded-full shadow-xl group">
                                        Get Started Now <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                                    </Button>
                                </Link>
                                <div className="flex items-center justify-center gap-2 text-sm text-gray-300">
                                    <CheckCircle className="w-4 h-4 text-[#f5bb00]" />
                                    <span>Free to join · Instant access · Community support</span>
                                </div>
                            </div>
                        </motion.div>

                        <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
                            className="bg-neutral-100 dark:bg-neutral-800 rounded-3xl p-8 md:p-12 text-center">
                            <h3 className="text-2xl md:text-3xl font-bold mb-6 text-[#f5bb00]">Closing Theme Statement</h3>
                            <p className="text-lg md:text-xl leading-relaxed text-gray-700 dark:text-gray-200">
                                &ldquo;The {yearLabel} Quarterly Themes call believers into deeper discipleship, Spirit-empowered living, fruitful purpose, and a faith that enters into God&apos;s promised rest.&rdquo;
                            </p>
                        </motion.div>
                    </>
                )}

                {/* ── WEEKLY TOPICS ── */}
                {activeSection === 'weekly' && (
                    <>
                        <div className="text-center mb-16">
                            <span className="text-[#f5bb00] font-bold uppercase tracking-[0.2em] text-sm">Current Quarter</span>
                            <h2 className="text-4xl font-black text-[#140152] dark:text-white mt-2">Weekly Study Topics</h2>
                            <p className="text-gray-500 mt-4 max-w-xl mx-auto">Every Tuesday at 6:00 PM. Each week builds on the last — attend live or catch the recording.</p>
                        </div>

                        <div className="space-y-4 mb-16">
                            {weeklyTopics.map((topic, i) => (
                                <motion.div key={i} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.07 }}>
                                    <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-gray-100 dark:border-neutral-700 overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer"
                                        onClick={() => setExpandedWeek(expandedWeek === i ? null : i)}>
                                        <div className="flex items-center gap-5 p-5">
                                            <div className="w-12 h-12 rounded-xl flex items-center justify-center font-black text-white text-sm flex-shrink-0"
                                                style={{ backgroundColor: topic.color }}>
                                                W{i + 1}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-1">
                                                    <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: topic.color }}>{topic.category}</span>
                                                    <span className="text-xs text-gray-400">{topic.week}</span>
                                                </div>
                                                <h3 className="font-bold text-[#140152] dark:text-white text-lg">{topic.title}</h3>
                                                <p className="text-sm text-gray-500">{topic.verse}</p>
                                            </div>
                                            <div className="flex items-center gap-3 flex-shrink-0">
                                                <span className="hidden md:inline-flex items-center gap-1 text-xs text-gray-400 border border-gray-200 rounded-lg px-3 py-1.5">
                                                    <Clock className="w-3.5 h-3.5" /> 6:00 PM Tues
                                                </span>
                                                {expandedWeek === i ? <ChevronDown className="w-5 h-5 text-gray-400" /> : <ChevronRight className="w-5 h-5 text-gray-400" />}
                                            </div>
                                        </div>
                                        {expandedWeek === i && (
                                            <div className="border-t border-gray-100 dark:border-neutral-700 p-5 bg-gray-50 dark:bg-neutral-700/50">
                                                <div className="grid md:grid-cols-3 gap-4">
                                                    <div className="md:col-span-2">
                                                        <h4 className="font-bold text-[#140152] dark:text-white mb-3">Study Focus</h4>
                                                        <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                                                            This week we explore <strong>{topic.title}</strong> through the lens of <em>{topic.verse}</em>. Come prepared to engage with the text, ask questions, and share how this truth applies to your daily walk with Christ.
                                                        </p>
                                                        <div className="flex gap-3 mt-5">
                                                            <Button size="sm" className="bg-[#140152] text-white hover:bg-[#1a0270]">
                                                                <Play className="w-4 h-4 mr-1" /> Watch Recording
                                                            </Button>
                                                            <Button size="sm" variant="outline" className="border-[#140152] text-[#140152]">
                                                                <Download className="w-4 h-4 mr-1" /> Study Notes
                                                            </Button>
                                                        </div>
                                                    </div>
                                                    <div className="bg-white dark:bg-neutral-800 rounded-xl p-4">
                                                        <h4 className="font-bold text-[#140152] dark:text-white mb-3 text-sm">Discussion Questions</h4>
                                                        <ol className="text-sm text-gray-600 dark:text-gray-300 space-y-2 list-decimal pl-4">
                                                            <li>What stands out most in this passage?</li>
                                                            <li>How does this change your view of God?</li>
                                                            <li>What one step will you take this week?</li>
                                                        </ol>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        {/* Reading plan CTA */}
                        <div className="bg-gradient-to-r from-[#140152] to-[#1a0270] rounded-3xl p-10 text-white text-center">
                            <BookOpen className="w-14 h-14 text-[#f5bb00] mx-auto mb-5" />
                            <h3 className="text-2xl font-black mb-3">Want a Full Year Reading Plan?</h3>
                            <p className="text-white/70 mb-7 max-w-md mx-auto">Join our Bible Reading plan and track your progress through the entire Bible in a structured, manageable way.</p>
                            <Link href="/services/bible-reading">
                                <Button className="bg-[#f5bb00] text-[#140152] font-black px-8 py-4 rounded-xl hover:bg-[#f5bb00]/90">
                                    Start Reading Plan <ArrowRight className="w-5 h-5 ml-2" />
                                </Button>
                            </Link>
                        </div>
                    </>
                )}

                {/* ── STUDY GROUPS ── */}
                {activeSection === 'groups' && (
                    <>
                        <div className="text-center mb-16">
                            <span className="text-[#f5bb00] font-bold uppercase tracking-[0.2em] text-sm">Small Groups</span>
                            <h2 className="text-4xl font-black text-[#140152] dark:text-white mt-2">Find Your Study Group</h2>
                            <p className="text-gray-500 mt-4 max-w-xl mx-auto">Smaller groups. Deeper conversations. Stronger community. Find the group that fits your season of life.</p>
                        </div>

                        <div className="grid md:grid-cols-2 gap-8 mb-16">
                            {groups.map((g, i) => (
                                <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                                    className="bg-white dark:bg-neutral-800 rounded-2xl p-8 border border-gray-100 dark:border-neutral-700 shadow-sm hover:shadow-xl hover:border-[#f5bb00] transition-all group">
                                    <div className="flex items-start gap-5 mb-6">
                                        <div className="w-14 h-14 bg-[#140152]/5 group-hover:bg-[#f5bb00]/10 rounded-2xl flex items-center justify-center flex-shrink-0 transition-colors">
                                            <Users className="w-7 h-7 text-[#140152] group-hover:text-[#f5bb00] transition-colors" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-[#140152] dark:text-white">{g.name}</h3>
                                            <p className="text-[#f5bb00] font-semibold text-sm">Led by {g.leader}</p>
                                        </div>
                                    </div>
                                    <div className="space-y-3 mb-6">
                                        <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300 text-sm">
                                            <Clock className="w-4 h-4 text-[#f5bb00]" /> {g.time}
                                        </div>
                                        <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300 text-sm">
                                            <Users className="w-4 h-4 text-[#f5bb00]" /> {g.size} members
                                        </div>
                                        <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300 text-sm">
                                            <Shield className="w-4 h-4 text-[#f5bb00]" /> {g.level}
                                        </div>
                                    </div>
                                    <Link href="/auth/register">
                                        <Button className="w-full bg-[#140152] text-white hover:bg-[#1a0270] rounded-xl">
                                            Join This Group
                                        </Button>
                                    </Link>
                                </motion.div>
                            ))}
                        </div>

                        {/* Start a group */}
                        <div className="bg-gray-50 dark:bg-neutral-800 rounded-3xl p-10 text-center border border-dashed border-gray-300 dark:border-neutral-600">
                            <Globe className="w-12 h-12 text-[#f5bb00] mx-auto mb-5" />
                            <h3 className="text-2xl font-bold text-[#140152] dark:text-white mb-3">Start a New Group</h3>
                            <p className="text-gray-500 mb-7 max-w-md mx-auto">Have a passion for a particular area of Scripture or a specific demographic? Start your own study group with our support.</p>
                            <Link href="/contact">
                                <Button className="bg-[#140152] text-white px-8 py-4 rounded-xl hover:bg-[#1a0270]">
                                    Speak with a Leader
                                </Button>
                            </Link>
                        </div>
                    </>
                )}

                {/* ── RESOURCES ── */}
                {activeSection === 'resources' && (
                    <>
                        <div className="text-center mb-16">
                            <span className="text-[#f5bb00] font-bold uppercase tracking-[0.2em] text-sm">Library</span>
                            <h2 className="text-4xl font-black text-[#140152] dark:text-white mt-2">Study Resources</h2>
                            <p className="text-gray-500 mt-4 max-w-xl mx-auto">Guides, videos, audio messages, and templates to deepen your personal Bible study.</p>
                        </div>

                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
                            {resources.map((r, i) => (
                                <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                                    className="bg-white dark:bg-neutral-800 rounded-2xl p-6 border border-gray-100 dark:border-neutral-700 shadow-sm hover:shadow-lg hover:border-[#f5bb00] transition-all group">
                                    <div className={`w-12 h-12 ${r.color} rounded-xl flex items-center justify-center mb-5`}>
                                        <r.icon className="w-6 h-6" />
                                    </div>
                                    <h3 className="font-bold text-[#140152] dark:text-white mb-2">{r.title}</h3>
                                    <p className="text-sm text-gray-400 mb-5">{r.pages || r.duration}</p>
                                    <Link href="/auth/login">
                                        <Button size="sm" className="w-full bg-[#140152] text-white hover:bg-[#1a0270] rounded-lg">
                                            {r.type === 'pdf' ? 'Download' : r.type === 'video' ? 'Watch' : 'Listen'} — Sign In
                                        </Button>
                                    </Link>
                                </motion.div>
                            ))}
                        </div>

                        {/* Recommended Tools */}
                        <div className="bg-[#140152] rounded-3xl p-10">
                            <h3 className="text-2xl font-black text-white mb-8 text-center">Recommended Bible Study Tools</h3>
                            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
                                {[
                                    { name: 'YouVersion Bible App', desc: 'Free Bible + reading plans', tag: 'Free' },
                                    { name: 'Blue Letter Bible', desc: 'Deep word & commentary study', tag: 'Free' },
                                    { name: 'Logos Bible Software', desc: 'Professional study library', tag: 'Paid' },
                                    { name: 'Bible Project', desc: 'Visual book overviews', tag: 'Free' },
                                ].map((tool, i) => (
                                    <div key={i} className="bg-white/10 rounded-2xl p-5">
                                        <div className="flex items-center justify-between mb-3">
                                            <Lightbulb className="w-6 h-6 text-[#f5bb00]" />
                                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${tool.tag === 'Free' ? 'bg-green-500/20 text-green-300' : 'bg-amber-500/20 text-amber-300'}`}>{tool.tag}</span>
                                        </div>
                                        <h4 className="font-bold text-white mb-1">{tool.name}</h4>
                                        <p className="text-xs text-white/60">{tool.desc}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                )}
            </SectionWrapper>

            {/* Fixed bottom join CTA on mobile */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-40">
                <Link href="/auth/register">
                    <Button className="w-full bg-[#140152] text-white font-bold py-4 rounded-xl">
                        Join Bible Study — Free
                    </Button>
                </Link>
            </div>
        </div>
    )
}
