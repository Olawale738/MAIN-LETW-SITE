'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/toast'
import {
    Loader2, Save, ArrowLeft, Plus, Trash2, ChevronUp, ChevronDown,
    ExternalLink, Sparkles, BookOpen, Crown, Target, Calendar, GraduationCap,
    BarChart3, Image as ImageIcon,
} from 'lucide-react'
import { ministryContentApi } from '@/lib/api'

type Pillar = { id?: string; icon: string; title: string; desc: string }
type JourneyStep = { step: string; title: string; desc: string }
type StatItem = { value: string; label: string }
type CarouselSlide = { value: string; label: string }
type ImageItem = { src: string; alt: string }

export default function TheologyContentEditorPage() {
    const { showToast, ToastComponent } = useToast()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    // Text fields
    const [hero, setHero] = useState({
        hero_eyebrow: 'Theology School',
        hero_title_line1: 'Be Formed by',
        hero_title_highlight: 'the Word.',
        hero_title_line2: 'Sent by the Spirit.',
        hero_scripture: 'The fear of the LORD is the beginning of wisdom, and the knowledge of the Holy One is understanding.',
        hero_scripture_ref: '— Proverbs 9:10',
        hero_description: 'A three-year academic and spiritual journey — Certificate, Diploma, Advanced Diploma — equipping you with biblical depth, theological clarity, and ministry skill for a lifetime of impact.',
        hero_primary_cta: 'View the Three Programs',
        hero_secondary_cta: 'Apply Now',
    })
    const [sections, setSections] = useState({
        carousel_eyebrow: 'What You Walk Away With',
        pillars_eyebrow: 'What We Form In You',
        pillars_heading: 'Six Pillars of Formation',
        images_eyebrow: 'From the Classroom',
        images_heading: 'Inside Our School',
        programs_eyebrow: 'Three Progressive Programs',
        programs_heading: 'Build Your Path',
        programs_subtitle: 'From Foundation to Mastery — each year builds on the last.',
        journey_eyebrow: 'Your Journey',
        journey_heading: 'Three Years. One Calling.',
        gains_eyebrow: 'By the End',
        gains_heading: "What You'll Walk Away With",
    })
    const [final, setFinal] = useState({
        final_eyebrow: 'The Altar Is Open',
        final_title_line1: 'Step Into',
        final_title_highlight: 'Your Calling.',
        final_title_line2: '',
        final_body: "Whether you're beginning the journey or advancing to mastery, our admissions team will walk you through every step. The next cohort is forming now.",
        final_primary_cta: 'Begin Your Application',
        final_secondary_cta: 'Talk to Admissions',
        final_quote: 'Study to shew thyself approved unto God, a workman that needeth not to be ashamed, rightly dividing the word of truth. — 2 Timothy 2:15',
    })

    // Repeaters
    const [stats, setStats] = useState<StatItem[]>([
        { value: '3', label: 'Progressive Programs' },
        { value: '6', label: 'Pillars of Formation' },
        { value: '60+', label: 'Specialized Courses' },
        { value: '100%', label: 'Christ-Centered' },
    ])
    const [carousel, setCarousel] = useState<CarouselSlide[]>([
        { value: 'Hebrew',   label: 'and Greek Mastery' },
        { value: 'Doctrine', label: 'You Can Defend' },
        { value: 'Ministry', label: 'You Can Lead' },
        { value: 'Calling',  label: 'You Can Walk Out' },
    ])
    const [pillars, setPillars] = useState<Pillar[]>([
        { id: '01', icon: 'BookOpen', title: 'Biblical Foundation', desc: '' },
        { id: '02', icon: 'Scroll',   title: 'Theological Depth',   desc: '' },
        { id: '03', icon: 'Users',    title: 'Ministry Excellence', desc: '' },
        { id: '04', icon: 'Globe',    title: 'Global Perspective',  desc: '' },
        { id: '05', icon: 'Flame',    title: 'Spiritual Formation', desc: '' },
        { id: '06', icon: 'Anchor',   title: 'Mission & Impact',    desc: '' },
    ])
    const [journey, setJourney] = useState<JourneyStep[]>([
        { step: '1', title: 'Foundation Year',  desc: '' },
        { step: '2', title: 'Development Year', desc: '' },
        { step: '3', title: 'Mastery Year',     desc: '' },
    ])
    const [gains, setGains] = useState<string[]>([
        'Comprehensive biblical and theological training',
        'Mastery of biblical languages (Hebrew & Greek)',
        'Practical ministry skills',
        'Global perspective on Christianity',
    ])
    const [images, setImages] = useState<ImageItem[]>([
        { src: '/theology1.png', alt: 'Theology Flyer 1' },
        { src: '/theology2.png', alt: 'Theology Flyer 2' },
        { src: '/theology3.png', alt: 'Theology Flyer 3' },
    ])

    useEffect(() => {
        (async () => {
            try {
                const r = await ministryContentApi.get('theology')
                const c = r.content || {}
                const set = (s: any, k: string, fallback: any) => (c[k] !== undefined && c[k] !== null) ? c[k] : fallback
                setHero(prev => ({
                    hero_eyebrow:         set(prev, 'hero_eyebrow', prev.hero_eyebrow),
                    hero_title_line1:     set(prev, 'hero_title_line1', prev.hero_title_line1),
                    hero_title_highlight: set(prev, 'hero_title_highlight', prev.hero_title_highlight),
                    hero_title_line2:     set(prev, 'hero_title_line2', prev.hero_title_line2),
                    hero_scripture:       set(prev, 'hero_scripture', prev.hero_scripture),
                    hero_scripture_ref:   set(prev, 'hero_scripture_ref', prev.hero_scripture_ref),
                    hero_description:     set(prev, 'hero_description', prev.hero_description),
                    hero_primary_cta:     set(prev, 'hero_primary_cta', prev.hero_primary_cta),
                    hero_secondary_cta:   set(prev, 'hero_secondary_cta', prev.hero_secondary_cta),
                }))
                setSections(prev => ({
                    carousel_eyebrow:   set(prev, 'carousel_eyebrow', prev.carousel_eyebrow),
                    pillars_eyebrow:    set(prev, 'pillars_eyebrow', prev.pillars_eyebrow),
                    pillars_heading:    set(prev, 'pillars_heading', prev.pillars_heading),
                    images_eyebrow:     set(prev, 'images_eyebrow', prev.images_eyebrow),
                    images_heading:     set(prev, 'images_heading', prev.images_heading),
                    programs_eyebrow:   set(prev, 'programs_eyebrow', prev.programs_eyebrow),
                    programs_heading:   set(prev, 'programs_heading', prev.programs_heading),
                    programs_subtitle:  set(prev, 'programs_subtitle', prev.programs_subtitle),
                    journey_eyebrow:    set(prev, 'journey_eyebrow', prev.journey_eyebrow),
                    journey_heading:    set(prev, 'journey_heading', prev.journey_heading),
                    gains_eyebrow:      set(prev, 'gains_eyebrow', prev.gains_eyebrow),
                    gains_heading:      set(prev, 'gains_heading', prev.gains_heading),
                }))
                setFinal(prev => ({
                    final_eyebrow:        set(prev, 'final_eyebrow', prev.final_eyebrow),
                    final_title_line1:    set(prev, 'final_title_line1', prev.final_title_line1),
                    final_title_highlight:set(prev, 'final_title_highlight', prev.final_title_highlight),
                    final_title_line2:    set(prev, 'final_title_line2', prev.final_title_line2),
                    final_body:           set(prev, 'final_body', prev.final_body),
                    final_primary_cta:    set(prev, 'final_primary_cta', prev.final_primary_cta),
                    final_secondary_cta:  set(prev, 'final_secondary_cta', prev.final_secondary_cta),
                    final_quote:          set(prev, 'final_quote', prev.final_quote),
                }))
                if (Array.isArray(c.stats) && c.stats.length > 0) setStats(c.stats)
                if (Array.isArray(c.carousel) && c.carousel.length > 0) setCarousel(c.carousel)
                if (Array.isArray(c.pillars) && c.pillars.length > 0) setPillars(c.pillars)
                if (Array.isArray(c.journey) && c.journey.length > 0) setJourney(c.journey)
                if (Array.isArray(c.gains) && c.gains.length > 0) setGains(c.gains)
                if (Array.isArray(c.images) && c.images.length > 0) setImages(c.images)
            } catch (e) {
                showToast('Load failed — will save fresh', 'info')
            } finally {
                setLoading(false)
            }
        })()
    }, [])

    const save = async () => {
        try {
            setSaving(true)
            const content: any = {
                ...hero, ...sections, ...final,
                stats: stats.filter(s => s.value?.trim() || s.label?.trim()),
                carousel: carousel.filter(c => c.value?.trim() || c.label?.trim()),
                pillars: pillars.filter(p => p.title?.trim()),
                journey: journey.filter(j => j.title?.trim()),
                gains: gains.filter(g => g.trim()),
                images: images.filter(i => i.src?.trim()),
            }
            await ministryContentApi.update('theology', content)
            showToast('Saved theology school content', 'success')
        } catch (e: any) {
            showToast(e?.message || 'Save failed', 'error')
        } finally {
            setSaving(false)
        }
    }

    const move = <T,>(arr: T[], set: (a: T[]) => void, i: number, dir: -1 | 1) => {
        const j = i + dir
        if (j < 0 || j >= arr.length) return
        const next = [...arr]
        ;[next[i], next[j]] = [next[j], next[i]]
        set(next)
    }

    if (loading) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="w-8 h-8 animate-spin text-[#140152]" />
        </div>
    )

    return (
        <div className="space-y-6 max-w-5xl">
            {ToastComponent()}

            {/* Header */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                    <Link href="/admin/theology-school" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-[#140152] mb-2">
                        <ArrowLeft className="w-3.5 h-3.5" /> Back
                    </Link>
                    <h1 className="text-3xl font-black text-[#140152] inline-flex items-center gap-3">
                        <GraduationCap className="w-7 h-7 text-[#f5bb00]" /> Edit Theology School Page
                    </h1>
                    <p className="text-gray-600 mt-1">Every word on <code className="bg-gray-100 px-1 rounded text-xs">/education/theology-school</code> — editable here.</p>
                </div>
                <div className="flex gap-2">
                    <a href="/education/theology-school" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-white border border-gray-300 hover:bg-gray-50 text-[#140152] font-bold px-4 py-2.5 rounded-lg text-sm">
                        <ExternalLink className="w-3.5 h-3.5" /> View live
                    </a>
                    <Button onClick={save} disabled={saving} className="bg-[#140152] text-white hover:bg-[#1d0175]">
                        {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                        Save Changes
                    </Button>
                </div>
            </div>

            {/* HERO */}
            <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><Sparkles className="w-5 h-5 text-[#f5bb00]" /> Hero Section</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                    <div className="grid md:grid-cols-2 gap-3">
                        <Field label="Eyebrow" value={hero.hero_eyebrow} onChange={v => setHero({ ...hero, hero_eyebrow: v })} />
                        <Field label="Title Line 1" value={hero.hero_title_line1} onChange={v => setHero({ ...hero, hero_title_line1: v })} />
                    </div>
                    <div className="grid md:grid-cols-2 gap-3">
                        <Field label="Highlighted word (gold)" value={hero.hero_title_highlight} onChange={v => setHero({ ...hero, hero_title_highlight: v })} />
                        <Field label="Title Line 2" value={hero.hero_title_line2} onChange={v => setHero({ ...hero, hero_title_line2: v })} />
                    </div>
                    <TextField label="Scripture (italic)" value={hero.hero_scripture} onChange={v => setHero({ ...hero, hero_scripture: v })} />
                    <Field label="Scripture reference" value={hero.hero_scripture_ref} onChange={v => setHero({ ...hero, hero_scripture_ref: v })} />
                    <TextField label="Description paragraph" value={hero.hero_description} onChange={v => setHero({ ...hero, hero_description: v })} rows={3} />
                    <div className="grid md:grid-cols-2 gap-3">
                        <Field label="Primary CTA text" value={hero.hero_primary_cta} onChange={v => setHero({ ...hero, hero_primary_cta: v })} />
                        <Field label="Secondary CTA text" value={hero.hero_secondary_cta} onChange={v => setHero({ ...hero, hero_secondary_cta: v })} />
                    </div>
                </CardContent>
            </Card>

            {/* STATS BAND */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center gap-2"><BarChart3 className="w-5 h-5 text-[#f5bb00]" /> Stats Band ({stats.length})</CardTitle>
                    <button type="button" onClick={() => setStats([...stats, { value: '', label: '' }])} className="text-sm font-bold text-[#140152] hover:text-[#f5bb00] inline-flex items-center gap-1">
                        <Plus className="w-4 h-4" /> Add stat
                    </button>
                </CardHeader>
                <CardContent className="space-y-2">
                    {stats.map((s, i) => (
                        <div key={i} className="grid grid-cols-12 gap-2 items-end bg-gray-50 p-3 rounded-lg">
                            <div className="col-span-3"><label className="text-[10px] font-bold uppercase text-gray-500 mb-1 block">Value</label>
                                <Input value={s.value} onChange={e => setStats(arr => arr.map((x, k) => k === i ? { ...x, value: e.target.value } : x))} placeholder="3" className="text-gray-900 text-sm" /></div>
                            <div className="col-span-7"><label className="text-[10px] font-bold uppercase text-gray-500 mb-1 block">Label</label>
                                <Input value={s.label} onChange={e => setStats(arr => arr.map((x, k) => k === i ? { ...x, label: e.target.value } : x))} placeholder="Progressive Programs" className="text-gray-900 text-sm" /></div>
                            <div className="col-span-2 flex justify-end gap-1">
                                <button type="button" onClick={() => move(stats, setStats, i, -1)} disabled={i === 0} className="p-1 hover:bg-gray-200 rounded disabled:opacity-30"><ChevronUp className="w-4 h-4" /></button>
                                <button type="button" onClick={() => move(stats, setStats, i, 1)} disabled={i === stats.length - 1} className="p-1 hover:bg-gray-200 rounded disabled:opacity-30"><ChevronDown className="w-4 h-4" /></button>
                                <button type="button" onClick={() => setStats(arr => arr.filter((_, k) => k !== i))} className="p-1 text-red-500 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>

            {/* IDENTITY CAROUSEL */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center gap-2"><Sparkles className="w-5 h-5 text-[#f5bb00]" /> Identity Carousel ({carousel.length})</CardTitle>
                    <button type="button" onClick={() => setCarousel([...carousel, { value: '', label: '' }])} className="text-sm font-bold text-[#140152] hover:text-[#f5bb00] inline-flex items-center gap-1">
                        <Plus className="w-4 h-4" /> Add slide
                    </button>
                </CardHeader>
                <CardContent className="space-y-2">
                    <Field label="Carousel eyebrow" value={sections.carousel_eyebrow} onChange={v => setSections({ ...sections, carousel_eyebrow: v })} />
                    {carousel.map((s, i) => (
                        <div key={i} className="grid grid-cols-12 gap-2 items-end bg-gray-50 p-3 rounded-lg">
                            <div className="col-span-5"><label className="text-[10px] font-bold uppercase text-gray-500 mb-1 block">Big value</label>
                                <Input value={s.value} onChange={e => setCarousel(arr => arr.map((x, k) => k === i ? { ...x, value: e.target.value } : x))} placeholder="Hebrew" className="text-gray-900 text-sm" /></div>
                            <div className="col-span-5"><label className="text-[10px] font-bold uppercase text-gray-500 mb-1 block">Label</label>
                                <Input value={s.label} onChange={e => setCarousel(arr => arr.map((x, k) => k === i ? { ...x, label: e.target.value } : x))} placeholder="and Greek Mastery" className="text-gray-900 text-sm" /></div>
                            <div className="col-span-2 flex justify-end gap-1">
                                <button type="button" onClick={() => move(carousel, setCarousel, i, -1)} disabled={i === 0} className="p-1 hover:bg-gray-200 rounded disabled:opacity-30"><ChevronUp className="w-4 h-4" /></button>
                                <button type="button" onClick={() => move(carousel, setCarousel, i, 1)} disabled={i === carousel.length - 1} className="p-1 hover:bg-gray-200 rounded disabled:opacity-30"><ChevronDown className="w-4 h-4" /></button>
                                <button type="button" onClick={() => setCarousel(arr => arr.filter((_, k) => k !== i))} className="p-1 text-red-500 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>

            {/* PILLARS */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center gap-2"><Crown className="w-5 h-5 text-[#f5bb00]" /> Pillars ({pillars.length})</CardTitle>
                    <button type="button" onClick={() => setPillars([...pillars, { id: String(pillars.length + 1).padStart(2, '0'), icon: 'BookOpen', title: '', desc: '' }])} className="text-sm font-bold text-[#140152] hover:text-[#f5bb00] inline-flex items-center gap-1">
                        <Plus className="w-4 h-4" /> Add pillar
                    </button>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="grid md:grid-cols-2 gap-3">
                        <Field label="Eyebrow" value={sections.pillars_eyebrow} onChange={v => setSections({ ...sections, pillars_eyebrow: v })} />
                        <Field label="Heading" value={sections.pillars_heading} onChange={v => setSections({ ...sections, pillars_heading: v })} />
                    </div>
                    {pillars.map((p, i) => (
                        <div key={i} className="rounded-xl border border-gray-200 bg-gray-50 p-3 space-y-2">
                            <div className="flex items-center justify-between">
                                <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Pillar {i + 1}</p>
                                <div className="flex gap-1">
                                    <button type="button" onClick={() => move(pillars, setPillars, i, -1)} disabled={i === 0} className="p-1 hover:bg-gray-200 rounded disabled:opacity-30"><ChevronUp className="w-4 h-4" /></button>
                                    <button type="button" onClick={() => move(pillars, setPillars, i, 1)} disabled={i === pillars.length - 1} className="p-1 hover:bg-gray-200 rounded disabled:opacity-30"><ChevronDown className="w-4 h-4" /></button>
                                    <button type="button" onClick={() => setPillars(arr => arr.filter((_, k) => k !== i))} className="p-1 text-red-500 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
                                </div>
                            </div>
                            <div className="grid md:grid-cols-3 gap-2">
                                <Input value={p.id || ''} onChange={e => setPillars(arr => arr.map((x, k) => k === i ? { ...x, id: e.target.value } : x))} placeholder="01" className="text-gray-900 text-sm font-mono" />
                                <Input value={p.icon} onChange={e => setPillars(arr => arr.map((x, k) => k === i ? { ...x, icon: e.target.value } : x))} placeholder="Lucide icon (BookOpen, Scroll...)" className="text-gray-900 text-sm font-mono" />
                                <Input value={p.title} onChange={e => setPillars(arr => arr.map((x, k) => k === i ? { ...x, title: e.target.value } : x))} placeholder="Title" className="text-gray-900 text-sm" />
                            </div>
                            <Textarea value={p.desc} onChange={e => setPillars(arr => arr.map((x, k) => k === i ? { ...x, desc: e.target.value } : x))} rows={2} placeholder="Description" className="text-gray-900 text-sm" />
                        </div>
                    ))}
                </CardContent>
            </Card>

            {/* SECTION HEADINGS (programs/journey/gains/images) */}
            <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><Target className="w-5 h-5 text-[#f5bb00]" /> Section Headings</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                    <div className="grid md:grid-cols-2 gap-3">
                        <Field label="Image carousel eyebrow" value={sections.images_eyebrow} onChange={v => setSections({ ...sections, images_eyebrow: v })} />
                        <Field label="Image carousel heading" value={sections.images_heading} onChange={v => setSections({ ...sections, images_heading: v })} />
                    </div>
                    <div className="grid md:grid-cols-2 gap-3">
                        <Field label="Programs eyebrow" value={sections.programs_eyebrow} onChange={v => setSections({ ...sections, programs_eyebrow: v })} />
                        <Field label="Programs heading" value={sections.programs_heading} onChange={v => setSections({ ...sections, programs_heading: v })} />
                    </div>
                    <TextField label="Programs subtitle" value={sections.programs_subtitle} onChange={v => setSections({ ...sections, programs_subtitle: v })} rows={2} />
                    <div className="grid md:grid-cols-2 gap-3">
                        <Field label="Journey eyebrow" value={sections.journey_eyebrow} onChange={v => setSections({ ...sections, journey_eyebrow: v })} />
                        <Field label="Journey heading" value={sections.journey_heading} onChange={v => setSections({ ...sections, journey_heading: v })} />
                    </div>
                    <div className="grid md:grid-cols-2 gap-3">
                        <Field label="Gains eyebrow" value={sections.gains_eyebrow} onChange={v => setSections({ ...sections, gains_eyebrow: v })} />
                        <Field label="Gains heading" value={sections.gains_heading} onChange={v => setSections({ ...sections, gains_heading: v })} />
                    </div>
                </CardContent>
            </Card>

            {/* JOURNEY */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center gap-2"><Calendar className="w-5 h-5 text-[#f5bb00]" /> Journey Steps ({journey.length})</CardTitle>
                    <button type="button" onClick={() => setJourney([...journey, { step: String(journey.length + 1), title: '', desc: '' }])} className="text-sm font-bold text-[#140152] hover:text-[#f5bb00] inline-flex items-center gap-1">
                        <Plus className="w-4 h-4" /> Add step
                    </button>
                </CardHeader>
                <CardContent className="space-y-3">
                    {journey.map((j, i) => (
                        <div key={i} className="rounded-xl border border-gray-200 bg-gray-50 p-3 space-y-2">
                            <div className="flex items-center justify-between">
                                <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Step {i + 1}</p>
                                <div className="flex gap-1">
                                    <button type="button" onClick={() => move(journey, setJourney, i, -1)} disabled={i === 0} className="p-1 hover:bg-gray-200 rounded disabled:opacity-30"><ChevronUp className="w-4 h-4" /></button>
                                    <button type="button" onClick={() => move(journey, setJourney, i, 1)} disabled={i === journey.length - 1} className="p-1 hover:bg-gray-200 rounded disabled:opacity-30"><ChevronDown className="w-4 h-4" /></button>
                                    <button type="button" onClick={() => setJourney(arr => arr.filter((_, k) => k !== i))} className="p-1 text-red-500 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
                                </div>
                            </div>
                            <div className="grid md:grid-cols-3 gap-2">
                                <Input value={j.step} onChange={e => setJourney(arr => arr.map((x, k) => k === i ? { ...x, step: e.target.value } : x))} placeholder="1" className="text-gray-900 text-sm font-mono" />
                                <div className="md:col-span-2"><Input value={j.title} onChange={e => setJourney(arr => arr.map((x, k) => k === i ? { ...x, title: e.target.value } : x))} placeholder="Foundation Year" className="text-gray-900 text-sm" /></div>
                            </div>
                            <Textarea value={j.desc} onChange={e => setJourney(arr => arr.map((x, k) => k === i ? { ...x, desc: e.target.value } : x))} rows={2} placeholder="Step description" className="text-gray-900 text-sm" />
                        </div>
                    ))}
                </CardContent>
            </Card>

            {/* GAINS */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center gap-2"><BookOpen className="w-5 h-5 text-[#f5bb00]" /> Gains ({gains.length})</CardTitle>
                    <button type="button" onClick={() => setGains([...gains, ''])} className="text-sm font-bold text-[#140152] hover:text-[#f5bb00] inline-flex items-center gap-1">
                        <Plus className="w-4 h-4" /> Add gain
                    </button>
                </CardHeader>
                <CardContent>
                    <TextField label="One gain per line (or add buttons above)" value={gains.join('\n')} onChange={v => setGains(v.split('\n').filter(x => x.trim().length > 0))} rows={6} />
                </CardContent>
            </Card>

            {/* IMAGES */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center gap-2"><ImageIcon className="w-5 h-5 text-[#f5bb00]" /> Image Carousel ({images.length})</CardTitle>
                    <button type="button" onClick={() => setImages([...images, { src: '', alt: '' }])} className="text-sm font-bold text-[#140152] hover:text-[#f5bb00] inline-flex items-center gap-1">
                        <Plus className="w-4 h-4" /> Add image
                    </button>
                </CardHeader>
                <CardContent className="space-y-2">
                    {images.map((im, i) => (
                        <div key={i} className="grid grid-cols-12 gap-2 items-end bg-gray-50 p-3 rounded-lg">
                            <div className="col-span-6"><label className="text-[10px] font-bold uppercase text-gray-500 mb-1 block">Image URL or path</label>
                                <Input value={im.src} onChange={e => setImages(arr => arr.map((x, k) => k === i ? { ...x, src: e.target.value } : x))} placeholder="/theology1.png" className="text-gray-900 text-sm font-mono" /></div>
                            <div className="col-span-4"><label className="text-[10px] font-bold uppercase text-gray-500 mb-1 block">Alt text</label>
                                <Input value={im.alt} onChange={e => setImages(arr => arr.map((x, k) => k === i ? { ...x, alt: e.target.value } : x))} placeholder="Theology Flyer 1" className="text-gray-900 text-sm" /></div>
                            <div className="col-span-2 flex justify-end gap-1">
                                <button type="button" onClick={() => move(images, setImages, i, -1)} disabled={i === 0} className="p-1 hover:bg-gray-200 rounded disabled:opacity-30"><ChevronUp className="w-4 h-4" /></button>
                                <button type="button" onClick={() => move(images, setImages, i, 1)} disabled={i === images.length - 1} className="p-1 hover:bg-gray-200 rounded disabled:opacity-30"><ChevronDown className="w-4 h-4" /></button>
                                <button type="button" onClick={() => setImages(arr => arr.filter((_, k) => k !== i))} className="p-1 text-red-500 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>

            {/* FINAL CTA */}
            <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><Sparkles className="w-5 h-5 text-[#f5bb00]" /> Final CTA</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                    <Field label="Eyebrow" value={final.final_eyebrow} onChange={v => setFinal({ ...final, final_eyebrow: v })} />
                    <div className="grid md:grid-cols-3 gap-3">
                        <Field label="Title Line 1" value={final.final_title_line1} onChange={v => setFinal({ ...final, final_title_line1: v })} />
                        <Field label="Highlighted word (gold)" value={final.final_title_highlight} onChange={v => setFinal({ ...final, final_title_highlight: v })} />
                        <Field label="Title Line 2 (optional)" value={final.final_title_line2} onChange={v => setFinal({ ...final, final_title_line2: v })} />
                    </div>
                    <TextField label="Body" value={final.final_body} onChange={v => setFinal({ ...final, final_body: v })} rows={3} />
                    <div className="grid md:grid-cols-2 gap-3">
                        <Field label="Primary CTA text" value={final.final_primary_cta} onChange={v => setFinal({ ...final, final_primary_cta: v })} />
                        <Field label="Secondary CTA text" value={final.final_secondary_cta} onChange={v => setFinal({ ...final, final_secondary_cta: v })} />
                    </div>
                    <TextField label="Closing quote (small italic)" value={final.final_quote} onChange={v => setFinal({ ...final, final_quote: v })} rows={2} />
                </CardContent>
            </Card>

            {/* PROGRAMS NOTE */}
            <Card className="border-l-4 border-l-amber-400 bg-amber-50/30">
                <CardContent className="p-5 text-sm text-amber-900">
                    <p className="font-bold mb-1">A note on the three programs</p>
                    <p>
                        The Certificate / Diploma / Advanced Diploma programs (with their semester course
                        lists, requirements, and credit hours) live in code as protected defaults. To rename
                        or restructure them, ping a developer — the rest of the page (every heading, every
                        pillar, every step, every CTA, every image, every stat) is fully editable above.
                    </p>
                </CardContent>
            </Card>

            {/* Sticky save */}
            <div className="sticky bottom-4 flex justify-end">
                <Button onClick={save} disabled={saving} className="bg-[#140152] text-white hover:bg-[#1d0175] shadow-lg">
                    {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                    Save Changes
                </Button>
            </div>
        </div>
    )
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
    return (
        <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">{label}</label>
            <Input value={value} onChange={e => onChange(e.target.value)} className="text-gray-900" />
        </div>
    )
}
function TextField({ label, value, onChange, rows = 3 }: { label: string; value: string; onChange: (v: string) => void; rows?: number }) {
    return (
        <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">{label}</label>
            <Textarea value={value} onChange={e => onChange(e.target.value)} rows={rows} className="text-gray-900" />
        </div>
    )
}
