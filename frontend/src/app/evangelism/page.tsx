'use client'

import React, { useEffect, useState } from 'react'
import { cmsApi, Block, evangelismApi } from '@/lib/api'
import PageRenderer from '@/components/cms/PageRenderer'
import { DEFAULT_EVANGELISM_BLOCKS } from '@/lib/cmsDefaults'
import { Loader2, Send, CheckCircle, ChevronDown, Globe, MapPin, Users, Flame } from 'lucide-react'
import Link from 'next/link'

// ─── Interest sign-up form (public, no login) ─────────────────────────────────

function GetInvolvedForm() {
    const [form, setForm] = useState({ name: '', email: '', phone: '', availability: '', message: '' })
    const [loading, setLoading] = useState(false)
    const [done, setDone] = useState(false)
    const [error, setError] = useState('')

    const handle = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
        setForm({ ...form, [e.target.name]: e.target.value })

    const submit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!form.name.trim() || !form.email.trim()) { setError('Name and email are required.'); return }
        setLoading(true); setError('')
        try {
            await evangelismApi.registerInterest(form)
            setDone(true)
        } catch (err: any) {
            setError(err.message || 'Something went wrong. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    if (done) {
        return (
            <div className="text-center py-10">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
                    <CheckCircle className="w-10 h-10 text-green-500" />
                </div>
                <h3 className="text-2xl font-black text-[#140152] mb-2">You're In!</h3>
                <p className="text-gray-600 max-w-md mx-auto">
                    Thank you for your heart to serve. Our evangelism coordinator will reach out to you soon. God bless you!
                </p>
                <p className="mt-4 text-[#f5bb00] font-bold italic text-sm">
                    "The harvest is plentiful but the workers are few." — Matthew 9:37
                </p>
            </div>
        )
    }

    return (
        <form onSubmit={submit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-bold text-[#140152] mb-1.5">Full Name *</label>
                    <input name="name" required value={form.name} onChange={handle}
                        placeholder="Your name"
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#140152]/30 focus:border-[#140152] bg-white" />
                </div>
                <div>
                    <label className="block text-sm font-bold text-[#140152] mb-1.5">Email Address *</label>
                    <input name="email" required type="email" value={form.email} onChange={handle}
                        placeholder="you@email.com"
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#140152]/30 focus:border-[#140152] bg-white" />
                </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-bold text-[#140152] mb-1.5">Phone Number</label>
                    <input name="phone" value={form.phone} onChange={handle}
                        placeholder="+234 xxx xxxx xxx"
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#140152]/30 focus:border-[#140152] bg-white" />
                </div>
                <div>
                    <label className="block text-sm font-bold text-[#140152] mb-1.5">Availability</label>
                    <select name="availability" value={form.availability} onChange={handle}
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#140152]/30 focus:border-[#140152] bg-white">
                        <option value="">Select availability…</option>
                        <option>Saturdays</option>
                        <option>Sundays</option>
                        <option>Weekday evenings</option>
                        <option>Any day</option>
                        <option>Flexible / as needed</option>
                        <option>Online only</option>
                    </select>
                </div>
            </div>
            <div>
                <label className="block text-sm font-bold text-[#140152] mb-1.5">How would you like to help? (optional)</label>
                <textarea name="message" value={form.message} onChange={handle as any}
                    rows={3} placeholder="Street outreach, compassion events, online evangelism, prayer, follow-up..."
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#140152]/30 focus:border-[#140152] bg-white resize-none" />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button type="submit" disabled={loading}
                className="w-full bg-[#140152] text-white font-black py-4 rounded-xl text-base hover:bg-[#1a0175] transition-all disabled:opacity-60 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl">
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                {loading ? 'Sending…' : 'Join Our Outreach Team'}
            </button>
            <p className="text-center text-xs text-gray-400">No account needed. We'll never spam you.</p>
        </form>
    )
}

// ─── Social sharing panel ─────────────────────────────────────────────────────

function ShareGospel() {
    const url = typeof window !== 'undefined' ? window.location.href : 'https://letw.org/evangelism'
    const text = 'Join LETW in spreading the Gospel! Check out our evangelism outreach at'
    const shares = [
        { name: 'WhatsApp', href: `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`, bg: '#25D366', emoji: '💬' },
        { name: 'Facebook', href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, bg: '#1877F2', emoji: '📘' },
        { name: 'Twitter/X', href: `https://x.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, bg: '#000', emoji: '🐦' },
        { name: 'Copy Link', href: '#', bg: '#140152', emoji: '🔗' },
    ]
    const copyLink = (e: React.MouseEvent) => {
        e.preventDefault()
        navigator.clipboard.writeText(url).then(() => alert('Link copied!'))
    }
    return (
        <div className="flex flex-wrap gap-3 justify-center">
            {shares.map(s => (
                s.name === 'Copy Link'
                    ? <button key={s.name} onClick={copyLink}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-bold transition-transform hover:scale-105"
                        style={{ background: s.bg }}>
                        {s.emoji} {s.name}
                    </button>
                    : <a key={s.name} href={s.href} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-bold transition-transform hover:scale-105"
                        style={{ background: s.bg }}>
                        {s.emoji} {s.name}
                    </a>
            ))}
        </div>
    )
}

// ─── The Roman Road gospel tool ───────────────────────────────────────────────

const ROMAN_ROAD = [
    { ref: 'Romans 3:23', text: '"For all have sinned and fall short of the glory of God."' },
    { ref: 'Romans 6:23', text: '"For the wages of sin is death, but the gift of God is eternal life in Christ Jesus our Lord."' },
    { ref: 'Romans 5:8', text: '"But God demonstrates his own love for us in this: While we were still sinners, Christ died for us."' },
    { ref: 'Romans 10:9', text: '"If you declare with your mouth, 'Jesus is Lord,' and believe in your heart that God raised him from the dead, you will be saved."' },
    { ref: 'Romans 10:13', text: '"For everyone who calls on the name of the Lord will be saved."' },
]

function RomanRoad() {
    const [open, setOpen] = useState(false)
    return (
        <div className="bg-[#140152]/5 rounded-2xl overflow-hidden">
            <button onClick={() => setOpen(o => !o)}
                className="w-full flex items-center justify-between px-6 py-4 text-left font-black text-[#140152]">
                <span className="flex items-center gap-2">📖 The Roman Road to Salvation</span>
                <ChevronDown className={`w-5 h-5 transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>
            {open && (
                <div className="px-6 pb-6 space-y-4">
                    {ROMAN_ROAD.map((v, i) => (
                        <div key={i} className="border-l-4 border-[#f5bb00] pl-4">
                            <p className="text-xs font-black text-[#140152] uppercase tracking-widest mb-1">{v.ref}</p>
                            <p className="text-gray-700 italic text-sm leading-relaxed">{v.text}</p>
                        </div>
                    ))}
                    <div className="mt-6 bg-[#140152] text-white rounded-xl p-4">
                        <p className="font-black mb-2">🙏 Prayer of Salvation</p>
                        <p className="text-white/80 text-sm italic leading-relaxed">
                            "Lord Jesus, I confess that I am a sinner. I believe You died for my sins and rose again. I ask You to forgive me and come into my heart as my Lord and Saviour. I turn from my old ways and choose to follow You. Amen."
                        </p>
                    </div>
                    <p className="text-xs text-gray-500">If you just prayed this prayer, <Link href="/prayer-request" className="text-[#140152] font-bold underline">let us know</Link> — our team would love to pray with you and help you take your next steps.</p>
                </div>
            )}
        </div>
    )
}

// ─── Quick stats strip ────────────────────────────────────────────────────────

const QUICK_LINKS = [
    { icon: MapPin,  label: 'Find an Outreach', href: '#get-involved', color: '#be123c' },
    { icon: Users,   label: 'Join a Team',       href: '#get-involved', color: '#0369a1' },
    { icon: Globe,   label: 'Pray for Nations',  href: '/prayer-request', color: '#059669' },
    { icon: Flame,   label: 'Share the Gospel',  href: '#share',       color: '#d97706' },
]

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function EvangelismPage() {
    const [blocks, setBlocks] = useState<Block[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        cmsApi.getPage('evangelism')
            .then(data => {
                if (data?.content?.blocks?.length) setBlocks(data.content.blocks)
                else setBlocks(DEFAULT_EVANGELISM_BLOCKS)
            })
            .catch(() => setBlocks(DEFAULT_EVANGELISM_BLOCKS))
            .finally(() => setLoading(false))
    }, [])

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-white">
                <Loader2 className="w-12 h-12 animate-spin text-[#140152]" />
            </div>
        )
    }

    return (
        <div className="bg-white min-h-screen">
            {/* ── CMS-driven sections ── */}
            <PageRenderer blocks={blocks} />

            {/* ── Quick action strip ── */}
            <section className="py-14 bg-gray-50 border-y border-gray-100">
                <div className="max-w-5xl mx-auto px-4">
                    <p className="text-center text-xs text-[#f5bb00] font-bold uppercase tracking-[0.25em] mb-8">Get Involved Today</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {QUICK_LINKS.map(({ icon: Icon, label, href, color }) => (
                            <Link key={label} href={href}
                                className="group flex flex-col items-center gap-3 bg-white rounded-2xl p-6 border border-gray-100 hover:border-transparent hover:shadow-xl transition-all">
                                <div className="w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110"
                                    style={{ background: `${color}18` }}>
                                    <Icon className="w-6 h-6" style={{ color }} />
                                </div>
                                <span className="text-sm font-black text-[#140152] text-center">{label}</span>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Gospel tools (no login needed) ── */}
            <section id="how-to-share" className="py-20 bg-white">
                <div className="max-w-3xl mx-auto px-4 space-y-8">
                    <div className="text-center">
                        <p className="text-[#f5bb00] font-bold uppercase tracking-[0.25em] text-xs mb-3">Tools For You</p>
                        <h2 className="text-3xl md:text-4xl font-black text-[#140152] mb-2">Share The Gospel Today</h2>
                        <p className="text-gray-500">Everything you need to lead someone to Christ — available to everyone, no account needed.</p>
                        <div className="w-16 h-1 bg-[#f5bb00] mx-auto rounded-full mt-4" />
                    </div>

                    {/* Roman Road accordion */}
                    <RomanRoad />

                    {/* How to share steps */}
                    <div id="roman-road" className="bg-gradient-to-br from-[#140152] to-[#220274] rounded-2xl p-8 text-white">
                        <h3 className="text-xl font-black mb-6 flex items-center gap-2">💡 How to Start a Gospel Conversation</h3>
                        <ol className="space-y-4">
                            {[
                                ['Pray first', 'Ask God to open the door and soften the person\'s heart before you speak.'],
                                ['Start with genuine care', '"How are you really doing?" — people open up when they feel heard.'],
                                ['Share your story', 'A brief testimony of what Jesus has done in your life is powerful and personal.'],
                                ['Present the Gospel', 'Use the Roman Road or simply explain: sin, the consequence, God\'s solution (Jesus), and the response.'],
                                ['Invite a decision', '"Would you like to receive Jesus as your Lord and Saviour today?" — never push, just invite.'],
                                ['Follow up', 'Exchange contacts, pray together, and connect them to the church.'],
                            ].map(([title, desc], i) => (
                                <li key={i} className="flex gap-4">
                                    <span className="w-8 h-8 rounded-full bg-[#f5bb00] text-[#140152] font-black text-sm flex items-center justify-center shrink-0 mt-0.5">
                                        {i + 1}
                                    </span>
                                    <div>
                                        <p className="font-bold text-[#f5bb00]">{title}</p>
                                        <p className="text-white/75 text-sm mt-0.5">{desc}</p>
                                    </div>
                                </li>
                            ))}
                        </ol>
                    </div>

                    {/* Digital tract */}
                    <div id="digital-tract" className="bg-[#f5bb00]/10 border border-[#f5bb00]/30 rounded-2xl p-6">
                        <h3 className="text-lg font-black text-[#140152] mb-2">📲 Share Our Digital Gospel Tract</h3>
                        <p className="text-gray-600 text-sm mb-4">Share this page directly on WhatsApp, Facebook, Twitter/X or copy the link — every share could reach someone who needs the Gospel.</p>
                        <ShareGospel />
                    </div>
                </div>
            </section>

            {/* ── Sign-up form (no login) ── */}
            <section id="get-involved" className="py-20 bg-gray-50">
                <div className="max-w-2xl mx-auto px-4">
                    <div className="text-center mb-10">
                        <p className="text-[#f5bb00] font-bold uppercase tracking-[0.25em] text-xs mb-3">No Account Needed</p>
                        <h2 className="text-3xl md:text-4xl font-black text-[#140152] mb-3">Join Our Outreach Team</h2>
                        <p className="text-gray-500 text-sm max-w-lg mx-auto">
                            You don't need to be a theologian. You need a willing heart. Fill in your details and we'll connect you with the right outreach activity for you.
                        </p>
                        <div className="w-16 h-1 bg-[#f5bb00] mx-auto rounded-full mt-4" />
                    </div>
                    <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
                        <GetInvolvedForm />
                    </div>
                </div>
            </section>

            {/* ── Final motivational strip ── */}
            <section className="py-16 bg-[#f5bb00]">
                <div className="max-w-4xl mx-auto px-4 text-center">
                    <h2 className="text-3xl md:text-4xl font-black text-[#140152] mb-3">
                        "Go and make disciples of all nations."
                    </h2>
                    <p className="text-[#140152]/70 font-semibold mb-8">— Matthew 28:19</p>
                    <div className="flex flex-wrap gap-4 justify-center">
                        <a href="#get-involved"
                            className="inline-flex items-center gap-2 bg-[#140152] text-white font-black px-8 py-4 rounded-full text-base hover:bg-[#1a0175] transition-all hover:scale-105 shadow-lg">
                            Join an Outreach
                        </a>
                        <Link href="/prayer-request"
                            className="inline-flex items-center gap-2 border-2 border-[#140152]/30 text-[#140152] font-bold px-8 py-4 rounded-full text-base hover:bg-[#140152]/10 transition-all">
                            Pray for a Soul
                        </Link>
                        <a href="#share"
                            className="inline-flex items-center gap-2 border-2 border-[#140152]/30 text-[#140152] font-bold px-8 py-4 rounded-full text-base hover:bg-[#140152]/10 transition-all">
                            Share the Gospel
                        </a>
                    </div>
                </div>
            </section>
        </div>
    )
}
