'use client'
/**
 * /admin/onboarding-page — focused editor for every visible string on
 * letw.org/onboarding. Stores the whole shape under ministry-content key
 * 'onboarding-page'. Public page merges saved fields with built-in defaults
 * so a half-saved record can never blank the site.
 */
import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
    Loader2, Save, AlertCircle, CheckCircle, RotateCcw, Sparkles, ExternalLink, BookOpen, Compass,
} from 'lucide-react'
import { ministryContentApi } from '@/lib/api'

interface Chapter {
    eyebrow: string; title: string; desc: string; href: string
}
interface OnboardingConfig {
    hero: {
        eyebrow: string; title_line_1: string; title_line_2: string; subtitle: string
        cta1_label: string; cta1_href: string
        cta2_label: string; cta2_href: string
        scroll_label: string
    }
    chapters: Chapter[]
    scripture: { tagline: string }
    final_cta: {
        eyebrow: string; heading: string; body: string
        cta1_label: string; cta1_href: string
        cta2_label: string; cta2_href: string
    }
}

const DEFAULTS: OnboardingConfig = {
    hero: {
        eyebrow: 'A guided welcome',
        title_line_1: 'Welcome to',
        title_line_2: 'the Family',
        subtitle: 'Five short chapters to make Light Encounter Tabernacle your home — at your own pace. Start where you are. Finish closer to Jesus.',
        cta1_label: 'Begin chapter one',
        cta1_href: '#step-1',
        cta2_label: 'Skip to membership',
        cta2_href: '/join',
        scroll_label: 'Scroll',
    },
    chapters: [
        { eyebrow: 'First Sunday',         title: 'Plan your visit',           desc: 'Attend a Sunday service — in the sanctuary or online. We will save you a seat and a fresh cup of coffee.',                 href: '/services/sunday-service' },
        { eyebrow: 'Beyond the Pew',       title: 'Connect with a pastor',     desc: 'Book a 30-minute welcome conversation. We want to know your name, your story, and how to pray for you.',                href: '/contact' },
        { eyebrow: 'Our Foundation',       title: 'Discover what we believe',  desc: 'Read our Statement of Faith. Know what you are stepping into — no surprises, no fine print.',                            href: '/about' },
        { eyebrow: 'Faith in Community',   title: 'Join a small group',        desc: 'Christianity was never meant to be lived alone. Find a midweek group near your home or workplace.',                      href: '/bible-study' },
        { eyebrow: 'A Public Yes',         title: 'Get baptized & serve',      desc: 'Make your faith public, then put it to work. Join a ministry team and become part of the unfolding story.',              href: '/life-events' },
    ],
    scripture: { tagline: 'A fresh verse rises with the sun. Walk the 365-day path with us.' },
    final_cta: {
        eyebrow: 'The next step is yours',
        heading: 'Make it official.',
        body: 'One name. One email. One step. A real pastor — not a chatbot, not a form-letter — will call to learn your story, pray with you, and walk this road beside you. No script. No salesman energy. Just family making room.',
        cta1_label: 'Become a member',
        cta1_href: '/join',
        cta2_label: 'Visit us first',
        cta2_href: '/contact',
    },
}

// The 5 visual hues are fixed in the public component; surface them here as
// read-only context so admin understands which chapter gets which colour.
const CHAPTER_HUES = [
    { name: 'Violet',   hue: '#7c3aed' },
    { name: 'Rose',     hue: '#ec4899' },
    { name: 'Gold',     hue: '#f5bb00' },
    { name: 'Emerald',  hue: '#10b981' },
    { name: 'Cyan',     hue: '#06b6d4' },
]

export default function OnboardingPageAdmin() {
    const [cfg, setCfg] = useState<OnboardingConfig>(DEFAULTS)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)

    useEffect(() => {
        ministryContentApi.get('onboarding-page')
            .then(r => {
                const c = (r.content || {}) as Partial<OnboardingConfig> & { chapters?: Partial<Chapter>[] }
                const mergedChapters = DEFAULTS.chapters.map((d, i) => ({ ...d, ...(c.chapters?.[i] || {}) }))
                setCfg({
                    hero: { ...DEFAULTS.hero, ...(c.hero || {}) },
                    chapters: mergedChapters,
                    scripture: { ...DEFAULTS.scripture, ...(c.scripture || {}) },
                    final_cta: { ...DEFAULTS.final_cta, ...(c.final_cta || {}) },
                })
            })
            .catch(() => { /* keep defaults */ })
            .finally(() => setLoading(false))
    }, [])

    useEffect(() => { if (msg) { const t = setTimeout(() => setMsg(null), 5000); return () => clearTimeout(t) } }, [msg])

    const save = async () => {
        setSaving(true)
        try {
            await ministryContentApi.update('onboarding-page', cfg as unknown as Record<string, unknown>)
            setMsg({ kind: 'ok', text: 'Saved. Refresh letw.org/onboarding to see the change.' })
        } catch (e) {
            setMsg({ kind: 'err', text: (e as Error).message })
        } finally {
            setSaving(false)
        }
    }

    const reset = () => {
        if (!confirm('Reset every field on /onboarding back to factory defaults?')) return
        setCfg(DEFAULTS)
    }

    if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-10 h-10 animate-spin text-[#140152]" /></div>

    return (
        <div className="p-4 sm:p-6 max-w-5xl mx-auto pb-32">
            {/* Header */}
            <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
                <div>
                    <h1 className="text-3xl font-black text-[#140152] flex items-center gap-3"><Compass className="w-7 h-7 text-[#f5bb00]" /> Onboarding Page</h1>
                    <p className="text-gray-500 mt-1 text-sm">Edit every visible word on <Link href="/onboarding" target="_blank" className="text-[#140152] font-bold hover:underline inline-flex items-center gap-1">letw.org/onboarding <ExternalLink className="w-3 h-3" /></Link>. Chapter colours stay fixed for visual consistency.</p>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={reset} className="px-4 py-3 border border-gray-200 text-gray-600 hover:text-[#140152] hover:border-gray-300 font-bold rounded-xl text-sm inline-flex items-center gap-1.5">
                        <RotateCcw className="w-4 h-4" /> Reset
                    </button>
                    <button onClick={save} disabled={saving} className="inline-flex items-center gap-2 bg-[#140152] hover:bg-[#1d0175] text-white font-bold px-5 py-3 rounded-xl disabled:opacity-50">
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save changes
                    </button>
                </div>
            </div>

            {msg && (
                <div className={`mb-4 p-3 rounded-xl border flex items-start gap-2 ${msg.kind === 'ok' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                    {msg.kind === 'ok' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}<span className="text-sm">{msg.text}</span>
                </div>
            )}

            {/* HERO */}
            <Card title="1 · Hero" sub="The deep-navy opening stage with the cinematic title and CTAs.">
                <div className="grid md:grid-cols-2 gap-3">
                    <Field label="Eyebrow (small gold line above the title)" value={cfg.hero.eyebrow}
                        onChange={v => setCfg({ ...cfg, hero: { ...cfg.hero, eyebrow: v } })} />
                    <Field label="Scroll label (bottom of hero)" value={cfg.hero.scroll_label}
                        onChange={v => setCfg({ ...cfg, hero: { ...cfg.hero, scroll_label: v } })} />
                    <Field label="Title — line 1 (white)" value={cfg.hero.title_line_1}
                        onChange={v => setCfg({ ...cfg, hero: { ...cfg.hero, title_line_1: v } })} />
                    <Field label="Title — line 2 (shimmering gold)" value={cfg.hero.title_line_2}
                        onChange={v => setCfg({ ...cfg, hero: { ...cfg.hero, title_line_2: v } })} />
                </div>
                <TextArea label="Subtitle" rows={3} value={cfg.hero.subtitle}
                    onChange={v => setCfg({ ...cfg, hero: { ...cfg.hero, subtitle: v } })} />
                <div className="border-t border-gray-100 mt-4 pt-3">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#f5bb00] mb-2">Primary button (gold)</p>
                    <div className="grid md:grid-cols-2 gap-3">
                        <Field label="Label" value={cfg.hero.cta1_label}
                            onChange={v => setCfg({ ...cfg, hero: { ...cfg.hero, cta1_label: v } })} />
                        <Field label="Link / anchor (e.g. #step-1)" value={cfg.hero.cta1_href}
                            onChange={v => setCfg({ ...cfg, hero: { ...cfg.hero, cta1_href: v } })} />
                    </div>
                </div>
                <div className="border-t border-gray-100 mt-3 pt-3">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 mb-2">Secondary button (glass)</p>
                    <div className="grid md:grid-cols-2 gap-3">
                        <Field label="Label" value={cfg.hero.cta2_label}
                            onChange={v => setCfg({ ...cfg, hero: { ...cfg.hero, cta2_label: v } })} />
                        <Field label="Link / URL" value={cfg.hero.cta2_href}
                            onChange={v => setCfg({ ...cfg, hero: { ...cfg.hero, cta2_href: v } })} />
                    </div>
                </div>
            </Card>

            {/* CHAPTERS */}
            <Card title="2 · Chapters" sub="Five magazine-style chapters. The colour palette stays fixed; edit text + link for each.">
                {cfg.chapters.map((c, i) => (
                    <div key={i} className="border border-gray-200 rounded-2xl p-4 mt-3 first:mt-0">
                        <div className="flex items-center gap-2 mb-3">
                            <span className="w-4 h-4 rounded-full" style={{ background: CHAPTER_HUES[i].hue }} />
                            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">
                                Chapter {String(i + 1).padStart(2, '0')} · {CHAPTER_HUES[i].name}
                            </span>
                        </div>
                        <div className="grid md:grid-cols-2 gap-3">
                            <Field label="Eyebrow (italic above title)" value={c.eyebrow}
                                onChange={v => setCfg({ ...cfg, chapters: cfg.chapters.map((x, j) => j === i ? { ...x, eyebrow: v } : x) })} />
                            <Field label="Title" value={c.title}
                                onChange={v => setCfg({ ...cfg, chapters: cfg.chapters.map((x, j) => j === i ? { ...x, title: v } : x) })} />
                        </div>
                        <TextArea label="Description" rows={2} value={c.desc}
                            onChange={v => setCfg({ ...cfg, chapters: cfg.chapters.map((x, j) => j === i ? { ...x, desc: v } : x) })} />
                        <Field label="Link (Begin this chapter →)" value={c.href}
                            onChange={v => setCfg({ ...cfg, chapters: cfg.chapters.map((x, j) => j === i ? { ...x, href: v } : x) })} />
                    </div>
                ))}
            </Card>

            {/* SCRIPTURE */}
            <Card title="3 · Scripture moment" sub="The deep-navy break that auto-rotates today's verse from the 365-day plan. The verse itself is not editable here — edit lib/dailyVerses.ts for that. The tagline below sits underneath the verse.">
                <div className="flex items-start gap-2 mb-3 p-2 rounded-lg bg-amber-50 border border-amber-200">
                    <BookOpen className="w-4 h-4 text-amber-600 mt-0.5" />
                    <p className="text-xs text-amber-900">The verse itself rotates daily from the 365-day plan. This field is the small italic tagline shown <strong>below</strong> the verse.</p>
                </div>
                <Field label="Tagline below verse" value={cfg.scripture.tagline}
                    onChange={v => setCfg({ ...cfg, scripture: { tagline: v } })} />
            </Card>

            {/* FINAL CTA */}
            <Card title="4 · Final CTA" sub="The cinematic closing section.">
                <div className="grid md:grid-cols-2 gap-3">
                    <Field label="Eyebrow (gold, all caps)" value={cfg.final_cta.eyebrow}
                        onChange={v => setCfg({ ...cfg, final_cta: { ...cfg.final_cta, eyebrow: v } })} />
                    <Field label="Headline" value={cfg.final_cta.heading}
                        onChange={v => setCfg({ ...cfg, final_cta: { ...cfg.final_cta, heading: v } })} />
                </div>
                <TextArea label="Body paragraph" rows={4} value={cfg.final_cta.body}
                    onChange={v => setCfg({ ...cfg, final_cta: { ...cfg.final_cta, body: v } })} />
                <div className="border-t border-gray-100 mt-4 pt-3">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#f5bb00] mb-2">Primary button (gold). Leave label blank to hide.</p>
                    <div className="grid md:grid-cols-2 gap-3">
                        <Field label="Label" value={cfg.final_cta.cta1_label}
                            onChange={v => setCfg({ ...cfg, final_cta: { ...cfg.final_cta, cta1_label: v } })} />
                        <Field label="Link / URL" value={cfg.final_cta.cta1_href}
                            onChange={v => setCfg({ ...cfg, final_cta: { ...cfg.final_cta, cta1_href: v } })} />
                    </div>
                </div>
                <div className="border-t border-gray-100 mt-3 pt-3">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 mb-2">Secondary button (glass). Leave label blank to hide.</p>
                    <div className="grid md:grid-cols-2 gap-3">
                        <Field label="Label" value={cfg.final_cta.cta2_label}
                            onChange={v => setCfg({ ...cfg, final_cta: { ...cfg.final_cta, cta2_label: v } })} />
                        <Field label="Link / URL" value={cfg.final_cta.cta2_href}
                            onChange={v => setCfg({ ...cfg, final_cta: { ...cfg.final_cta, cta2_href: v } })} />
                    </div>
                </div>
            </Card>

            {/* Sticky save bar */}
            <div className="sticky bottom-4 mt-8 z-30">
                <div className="bg-white border border-gray-200 shadow-lg rounded-2xl p-3 flex items-center justify-between">
                    <p className="text-xs text-gray-500 pl-2 inline-flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-[#f5bb00]" /> Saves to ministry-content key &quot;onboarding-page&quot;.
                    </p>
                    <button onClick={save} disabled={saving} className="inline-flex items-center gap-2 bg-[#140152] hover:bg-[#1d0175] text-white font-bold px-5 py-2.5 rounded-xl text-sm disabled:opacity-50">
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save changes
                    </button>
                </div>
            </div>
        </div>
    )
}

// ── Local widgets ──────────────────────────────────────────────────────

function Card({ title, sub, children }: { title: string; sub: string; children: React.ReactNode }) {
    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 md:p-6 mb-5">
            <h2 className="font-black text-[#140152] mb-1">{title}</h2>
            <p className="text-xs text-gray-500 mb-4">{sub}</p>
            {children}
        </div>
    )
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
    return (
        <div>
            <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 mb-1.5">{label}</label>
            <input value={value} onChange={e => onChange(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm" />
        </div>
    )
}

function TextArea({ label, value, onChange, rows }: { label: string; value: string; onChange: (v: string) => void; rows: number }) {
    return (
        <div className="mt-3">
            <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 mb-1.5">{label}</label>
            <textarea value={value} onChange={e => onChange(e.target.value)} rows={rows} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm resize-y" />
        </div>
    )
}
