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
    ExternalLink, Image as ImageIcon, Sparkles, BookOpen, Target,
    Calendar, Heart, Crown, LayoutTemplate, Layers,
} from 'lucide-react'
import { ministryContentApi } from '@/lib/api'

type Pillar = { icon: string; title: string; desc: string }
type Program = { icon: string; title: string; desc: string; badge: string; cta: string }
type Carousel = { value: string; label: string }

type CustomSectionPosition = 'after_hero' | 'after_carousel' | 'after_pillars' | 'after_programs' | 'after_scripture' | 'after_join' | 'before_footer'
type CustomSectionKind = 'text' | 'scripture' | 'cards' | 'cta'
type CustomSection = {
    id?: string
    position: CustomSectionPosition
    kind: CustomSectionKind
    bg?: 'white' | 'tint' | 'dark'
    eyebrow?: string
    heading?: string
    subtitle?: string
    body?: string
    reference?: string
    button_text?: string
    button_link?: string
    items?: Array<{ icon?: string; title?: string; desc?: string }>
}

const POSITION_LABELS: Record<CustomSectionPosition, string> = {
    after_hero: 'After Hero',
    after_carousel: 'After Identity Carousel',
    after_pillars: 'After Pillars',
    after_programs: 'After Programs',
    after_scripture: 'After Scripture Band',
    after_join: 'After Join Form',
    before_footer: 'Before Footer CTA',
}

const KIND_LABELS: Record<CustomSectionKind, string> = {
    text: 'Text band (eyebrow + heading + paragraph)',
    scripture: 'Scripture band (italic quote + reference)',
    cards: 'Cards grid (2–4 cards with icon, title, description)',
    cta: 'Call-to-action band (heading + button)',
}

interface Props {
    ministryKey: 'women' | 'men'
    label: string                       // "Women's Ministry" / "Men's Ministry"
    livePath: string                    // "/women" / "/men"
    defaults: {
        hero_eyebrow: string
        hero_title_line1: string
        hero_title_highlight: string
        hero_title_line2: string
        hero_scripture: string
        hero_scripture_ref: string
        hero_description: string
        hero_primary_cta: string
        hero_secondary_cta: string
        carousel_eyebrow: string
        carousel: Carousel[]
        pillars_eyebrow: string
        pillars_heading: string
        pillars: Pillar[]
        programs_eyebrow: string
        programs_heading: string
        programs_subtitle: string
        programs: Program[]
        scripture_band_text: string
        scripture_band_ref: string
        join_eyebrow: string
        join_heading: string
        join_description: string
        footer_heading: string
        footer_subtext: string
    }
}

export default function MinistryContentEditor({ ministryKey, label, livePath, defaults }: Props) {
    const { showToast, ToastComponent } = useToast()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    const [form, setForm] = useState({ ...defaults })
    const [pillars, setPillars] = useState<Pillar[]>(defaults.pillars)
    const [programs, setPrograms] = useState<Program[]>(defaults.programs)
    const [carousel, setCarousel] = useState<Carousel[]>(defaults.carousel)
    const [customSections, setCustomSections] = useState<CustomSection[]>([])

    useEffect(() => {
        (async () => {
            try {
                const r = await ministryContentApi.get(ministryKey)
                const c = r.content || {}
                setForm(prev => ({
                    ...prev,
                    ...Object.fromEntries(Object.keys(prev).map(k => [k, (c as any)[k] ?? (prev as any)[k]])),
                }))
                if (Array.isArray(c.custom_sections)) setCustomSections(c.custom_sections)
                if (Array.isArray(c.pillars) && c.pillars.length > 0) setPillars(c.pillars)
                if (Array.isArray(c.programs) && c.programs.length > 0) setPrograms(c.programs)
                if (Array.isArray(c.carousel) && c.carousel.length > 0) setCarousel(c.carousel)
            } catch (e: any) {
                showToast('Failed to load (will save fresh)', 'info')
            } finally {
                setLoading(false)
            }
        })()
    }, [ministryKey])

    const set = (k: keyof typeof form, v: string) => setForm(prev => ({ ...prev, [k]: v }))

    const save = async () => {
        try {
            setSaving(true)
            const content = {
                ...form,
                pillars: pillars.filter(p => p.title?.trim()),
                programs: programs.filter(p => p.title?.trim()),
                carousel: carousel.filter(c => c.value?.trim() || c.label?.trim()),
                custom_sections: customSections,
            }
            await ministryContentApi.update(ministryKey, content)
            showToast(`Saved ${label} content`, 'success')
        } catch (e: any) {
            showToast(e?.message || 'Save failed', 'error')
        } finally {
            setSaving(false)
        }
    }

    if (loading) return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="w-8 h-8 animate-spin text-[#140152]" /></div>

    const move = <T,>(arr: T[], set: (a: T[]) => void, i: number, dir: -1 | 1) => {
        const j = i + dir
        if (j < 0 || j >= arr.length) return
        const next = [...arr]
        ;[next[i], next[j]] = [next[j], next[i]]
        set(next)
    }

    return (
        <div className="space-y-6 max-w-5xl">
            {ToastComponent()}

            {/* Header */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                    <Link href={`/admin/${ministryKey}`} className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-[#140152] mb-2">
                        <ArrowLeft className="w-3.5 h-3.5" /> Back to {label}
                    </Link>
                    <h1 className="text-3xl font-black text-[#140152]">Edit {label} Page</h1>
                    <p className="text-gray-600 mt-1">Every word on <code className="bg-gray-100 px-1 rounded text-xs">{livePath}</code> — editable here.</p>
                </div>
                <div className="flex gap-2">
                    <a href={livePath} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-white border border-gray-300 hover:bg-gray-50 text-[#140152] font-bold px-4 py-2.5 rounded-lg text-sm">
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
                        <Field label="Eyebrow" value={form.hero_eyebrow} onChange={v => set('hero_eyebrow', v)} />
                        <Field label="Headline Line 1" value={form.hero_title_line1} onChange={v => set('hero_title_line1', v)} />
                    </div>
                    <div className="grid md:grid-cols-2 gap-3">
                        <Field label="Highlighted Word (gold)" value={form.hero_title_highlight} onChange={v => set('hero_title_highlight', v)} />
                        <Field label="Headline Line 2" value={form.hero_title_line2} onChange={v => set('hero_title_line2', v)} />
                    </div>
                    <TextField label="Scripture (italic)" value={form.hero_scripture} onChange={v => set('hero_scripture', v)} />
                    <Field label="Scripture reference" value={form.hero_scripture_ref} onChange={v => set('hero_scripture_ref', v)} />
                    <TextField label="Description paragraph" value={form.hero_description} onChange={v => set('hero_description', v)} rows={3} />
                    <div className="grid md:grid-cols-2 gap-3">
                        <Field label="Primary CTA text" value={form.hero_primary_cta} onChange={v => set('hero_primary_cta', v)} />
                        <Field label="Secondary CTA text" value={form.hero_secondary_cta} onChange={v => set('hero_secondary_cta', v)} />
                    </div>
                </CardContent>
            </Card>

            {/* CAROUSEL */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center gap-2"><Heart className="w-5 h-5 text-[#f5bb00]" /> Identity Carousel</CardTitle>
                    <button type="button" onClick={() => setCarousel([...carousel, { value: '', label: '' }])} className="text-sm font-bold text-[#140152] hover:text-[#f5bb00] inline-flex items-center gap-1">
                        <Plus className="w-4 h-4" /> Add slide
                    </button>
                </CardHeader>
                <CardContent className="space-y-3">
                    <Field label="Carousel eyebrow" value={form.carousel_eyebrow} onChange={v => set('carousel_eyebrow', v)} />
                    {carousel.map((s, i) => (
                        <div key={i} className="grid grid-cols-12 gap-2 items-end bg-gray-50 rounded-lg p-3">
                            <div className="col-span-5"><label className="text-[10px] font-bold uppercase text-gray-500 mb-1 block">Big value</label>
                                <Input value={s.value} onChange={e => setCarousel(arr => arr.map((x, k) => k === i ? { ...x, value: e.target.value } : x))} placeholder="Daughters" className="text-gray-900" /></div>
                            <div className="col-span-5"><label className="text-[10px] font-bold uppercase text-gray-500 mb-1 block">Label</label>
                                <Input value={s.label} onChange={e => setCarousel(arr => arr.map((x, k) => k === i ? { ...x, label: e.target.value } : x))} placeholder="of the King" className="text-gray-900" /></div>
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
                    <CardTitle className="flex items-center gap-2"><Crown className="w-5 h-5 text-[#f5bb00]" /> Pillars Section</CardTitle>
                    <button type="button" onClick={() => setPillars([...pillars, { icon: 'Heart', title: '', desc: '' }])} className="text-sm font-bold text-[#140152] hover:text-[#f5bb00] inline-flex items-center gap-1">
                        <Plus className="w-4 h-4" /> Add pillar
                    </button>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="grid md:grid-cols-2 gap-3">
                        <Field label="Section eyebrow" value={form.pillars_eyebrow} onChange={v => set('pillars_eyebrow', v)} />
                        <Field label="Section heading" value={form.pillars_heading} onChange={v => set('pillars_heading', v)} />
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
                            <div className="grid md:grid-cols-2 gap-2">
                                <Input value={p.icon} onChange={e => setPillars(arr => arr.map((x, k) => k === i ? { ...x, icon: e.target.value } : x))} placeholder="Lucide icon (Heart, Sword, BookOpen...)" className="text-gray-900 font-mono text-sm" />
                                <Input value={p.title} onChange={e => setPillars(arr => arr.map((x, k) => k === i ? { ...x, title: e.target.value } : x))} placeholder="Pillar title" className="text-gray-900 text-sm" />
                            </div>
                            <Textarea value={p.desc} onChange={e => setPillars(arr => arr.map((x, k) => k === i ? { ...x, desc: e.target.value } : x))} rows={2} placeholder="Description" className="text-gray-900 text-sm" />
                        </div>
                    ))}
                </CardContent>
            </Card>

            {/* PROGRAMS */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center gap-2"><Target className="w-5 h-5 text-[#f5bb00]" /> Programs Section</CardTitle>
                    <button type="button" onClick={() => setPrograms([...programs, { icon: 'Heart', title: '', desc: '', badge: '', cta: 'Learn More' }])} className="text-sm font-bold text-[#140152] hover:text-[#f5bb00] inline-flex items-center gap-1">
                        <Plus className="w-4 h-4" /> Add program
                    </button>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="grid md:grid-cols-2 gap-3">
                        <Field label="Section eyebrow" value={form.programs_eyebrow} onChange={v => set('programs_eyebrow', v)} />
                        <Field label="Section heading" value={form.programs_heading} onChange={v => set('programs_heading', v)} />
                    </div>
                    <TextField label="Subtitle paragraph" value={form.programs_subtitle} onChange={v => set('programs_subtitle', v)} rows={2} />
                    {programs.map((p, i) => (
                        <div key={i} className="rounded-xl border border-gray-200 bg-gray-50 p-3 space-y-2">
                            <div className="flex items-center justify-between">
                                <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Program {i + 1}</p>
                                <div className="flex gap-1">
                                    <button type="button" onClick={() => move(programs, setPrograms, i, -1)} disabled={i === 0} className="p-1 hover:bg-gray-200 rounded disabled:opacity-30"><ChevronUp className="w-4 h-4" /></button>
                                    <button type="button" onClick={() => move(programs, setPrograms, i, 1)} disabled={i === programs.length - 1} className="p-1 hover:bg-gray-200 rounded disabled:opacity-30"><ChevronDown className="w-4 h-4" /></button>
                                    <button type="button" onClick={() => setPrograms(arr => arr.filter((_, k) => k !== i))} className="p-1 text-red-500 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
                                </div>
                            </div>
                            <div className="grid md:grid-cols-3 gap-2">
                                <Input value={p.icon} onChange={e => setPrograms(arr => arr.map((x, k) => k === i ? { ...x, icon: e.target.value } : x))} placeholder="Lucide icon" className="text-gray-900 font-mono text-sm" />
                                <Input value={p.title} onChange={e => setPrograms(arr => arr.map((x, k) => k === i ? { ...x, title: e.target.value } : x))} placeholder="Title" className="text-gray-900 text-sm md:col-span-2" />
                            </div>
                            <Textarea value={p.desc} onChange={e => setPrograms(arr => arr.map((x, k) => k === i ? { ...x, desc: e.target.value } : x))} rows={2} placeholder="Description" className="text-gray-900 text-sm" />
                            <div className="grid md:grid-cols-2 gap-2">
                                <Input value={p.badge} onChange={e => setPrograms(arr => arr.map((x, k) => k === i ? { ...x, badge: e.target.value } : x))} placeholder="Badge (top right of image)" className="text-gray-900 text-sm" />
                                <Input value={p.cta} onChange={e => setPrograms(arr => arr.map((x, k) => k === i ? { ...x, cta: e.target.value } : x))} placeholder="CTA button text" className="text-gray-900 text-sm" />
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>

            {/* SCRIPTURE BAND */}
            <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><BookOpen className="w-5 h-5 text-[#f5bb00]" /> Scripture Band</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                    <TextField label="Scripture text" value={form.scripture_band_text} onChange={v => set('scripture_band_text', v)} rows={3} />
                    <Field label="Reference" value={form.scripture_band_ref} onChange={v => set('scripture_band_ref', v)} />
                </CardContent>
            </Card>

            {/* JOIN */}
            <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><Calendar className="w-5 h-5 text-[#f5bb00]" /> Join Section</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                    <div className="grid md:grid-cols-2 gap-3">
                        <Field label="Eyebrow" value={form.join_eyebrow} onChange={v => set('join_eyebrow', v)} />
                        <Field label="Heading" value={form.join_heading} onChange={v => set('join_heading', v)} />
                    </div>
                    <TextField label="Description" value={form.join_description} onChange={v => set('join_description', v)} rows={2} />
                </CardContent>
            </Card>

            {/* CUSTOM SECTIONS — add your own NEW sections anywhere on the page */}
            <Card className="border-l-4 border-l-[#f5bb00]">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <LayoutTemplate className="w-5 h-5 text-[#f5bb00]" /> Custom Sections ({customSections.length})
                    </CardTitle>
                    <div className="flex gap-1.5 flex-wrap">
                        {(['text', 'scripture', 'cards', 'cta'] as CustomSectionKind[]).map(k => (
                            <button
                                key={k}
                                type="button"
                                onClick={() => setCustomSections(prev => [...prev, {
                                    id: `cs-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                                    position: 'after_pillars',
                                    kind: k,
                                    bg: k === 'scripture' || k === 'cta' ? 'dark' : 'white',
                                    eyebrow: '', heading: '', subtitle: '', body: '',
                                    reference: '', button_text: '', button_link: '',
                                    items: k === 'cards' ? [{ icon: 'Sparkles', title: '', desc: '' }] : undefined,
                                }])}
                                className="text-xs font-bold inline-flex items-center gap-1 bg-[#140152] hover:bg-[#1d0175] text-white px-2.5 py-1.5 rounded-md"
                            >
                                <Plus className="w-3 h-3" /> {k}
                            </button>
                        ))}
                    </div>
                </CardHeader>
                <CardContent>
                    <p className="text-xs text-gray-500 mb-4">
                        Add brand-new sections anywhere on the page. Pick a position (which existing
                        section it sits after) and a style. Sections render with the page's brand
                        colors automatically.
                    </p>

                    {customSections.length === 0 && (
                        <div className="rounded-xl border-2 border-dashed border-gray-200 p-8 text-center">
                            <Layers className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                            <p className="font-bold text-gray-500">No custom sections yet</p>
                            <p className="text-xs text-gray-400 mt-1">Click a button above to add your first.</p>
                        </div>
                    )}

                    <div className="space-y-3">
                        {customSections.map((s, i) => (
                            <CustomSectionCard
                                key={s.id || i}
                                section={s}
                                onChange={updated => setCustomSections(arr => arr.map((x, k) => k === i ? updated : x))}
                                onMove={(dir) => {
                                    const j = i + dir
                                    if (j < 0 || j >= customSections.length) return
                                    const next = [...customSections]
                                    ;[next[i], next[j]] = [next[j], next[i]]
                                    setCustomSections(next)
                                }}
                                onDelete={() => setCustomSections(arr => arr.filter((_, k) => k !== i))}
                                isFirst={i === 0}
                                isLast={i === customSections.length - 1}
                            />
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* FOOTER CTA */}
            <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><ImageIcon className="w-5 h-5 text-[#f5bb00]" /> Footer Call</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                    <Field label="Footer heading" value={form.footer_heading} onChange={v => set('footer_heading', v)} />
                    <TextField label="Footer subtext" value={form.footer_subtext} onChange={v => set('footer_subtext', v)} rows={2} />
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

function CustomSectionCard({
    section, onChange, onMove, onDelete, isFirst, isLast,
}: {
    section: CustomSection
    onChange: (s: CustomSection) => void
    onMove: (dir: -1 | 1) => void
    onDelete: () => void
    isFirst: boolean
    isLast: boolean
}) {
    const items = section.items || []

    return (
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 space-y-3">
            {/* Header strip */}
            <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2 flex-wrap text-xs">
                    <span className="font-black uppercase tracking-wider bg-[#140152] text-white px-2 py-1 rounded">{section.kind}</span>
                    <span className="font-bold text-gray-600">→ {POSITION_LABELS[section.position]}</span>
                </div>
                <div className="flex gap-1">
                    <button type="button" onClick={() => onMove(-1)} disabled={isFirst} className="p-1 hover:bg-gray-200 rounded disabled:opacity-30"><ChevronUp className="w-4 h-4" /></button>
                    <button type="button" onClick={() => onMove(1)} disabled={isLast} className="p-1 hover:bg-gray-200 rounded disabled:opacity-30"><ChevronDown className="w-4 h-4" /></button>
                    <button type="button" onClick={onDelete} className="p-1 text-red-500 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
                </div>
            </div>

            {/* Position + Background row */}
            <div className="grid md:grid-cols-2 gap-2">
                <div>
                    <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Position on page</label>
                    <select
                        value={section.position}
                        onChange={e => onChange({ ...section, position: e.target.value as CustomSectionPosition })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white"
                    >
                        {(Object.entries(POSITION_LABELS) as [CustomSectionPosition, string][]).map(([k, label]) => (
                            <option key={k} value={k}>{label}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Background</label>
                    <select
                        value={section.bg || 'white'}
                        onChange={e => onChange({ ...section, bg: e.target.value as 'white' | 'tint' | 'dark' })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white"
                    >
                        <option value="white">White</option>
                        <option value="tint">Tint (soft brand color wash)</option>
                        <option value="dark">Dark (brand gradient)</option>
                    </select>
                </div>
            </div>

            {/* Type-specific fields */}
            {section.kind === 'text' && (
                <>
                    <div className="grid md:grid-cols-2 gap-2">
                        <Input value={section.eyebrow || ''} onChange={e => onChange({ ...section, eyebrow: e.target.value })} placeholder="Eyebrow (optional, gold uppercase)" className="text-gray-900 text-sm" />
                        <Input value={section.heading || ''} onChange={e => onChange({ ...section, heading: e.target.value })} placeholder="Heading" className="text-gray-900 text-sm" />
                    </div>
                    <Input value={section.subtitle || ''} onChange={e => onChange({ ...section, subtitle: e.target.value })} placeholder="Italic subtitle (optional)" className="text-gray-900 text-sm" />
                    <Textarea value={section.body || ''} onChange={e => onChange({ ...section, body: e.target.value })} rows={3} placeholder="Body paragraph" className="text-gray-900 text-sm" />
                </>
            )}

            {section.kind === 'scripture' && (
                <>
                    <Input value={section.eyebrow || ''} onChange={e => onChange({ ...section, eyebrow: e.target.value })} placeholder="Eyebrow (optional)" className="text-gray-900 text-sm" />
                    <Textarea value={section.body || ''} onChange={e => onChange({ ...section, body: e.target.value })} rows={3} placeholder="Scripture text (no quotes — auto-added)" className="text-gray-900 text-sm" />
                    <Input value={section.reference || ''} onChange={e => onChange({ ...section, reference: e.target.value })} placeholder="Reference (e.g. — Romans 8:28)" className="text-gray-900 text-sm" />
                </>
            )}

            {section.kind === 'cta' && (
                <>
                    <div className="grid md:grid-cols-2 gap-2">
                        <Input value={section.eyebrow || ''} onChange={e => onChange({ ...section, eyebrow: e.target.value })} placeholder="Eyebrow (optional)" className="text-gray-900 text-sm" />
                        <Input value={section.heading || ''} onChange={e => onChange({ ...section, heading: e.target.value })} placeholder="Heading" className="text-gray-900 text-sm" />
                    </div>
                    <Textarea value={section.body || ''} onChange={e => onChange({ ...section, body: e.target.value })} rows={2} placeholder="Body" className="text-gray-900 text-sm" />
                    <div className="grid md:grid-cols-2 gap-2">
                        <Input value={section.button_text || ''} onChange={e => onChange({ ...section, button_text: e.target.value })} placeholder="Button text" className="text-gray-900 text-sm" />
                        <Input value={section.button_link || ''} onChange={e => onChange({ ...section, button_link: e.target.value })} placeholder="Button link (e.g. /events)" className="text-gray-900 text-sm" />
                    </div>
                </>
            )}

            {section.kind === 'cards' && (
                <>
                    <div className="grid md:grid-cols-2 gap-2">
                        <Input value={section.eyebrow || ''} onChange={e => onChange({ ...section, eyebrow: e.target.value })} placeholder="Eyebrow (optional)" className="text-gray-900 text-sm" />
                        <Input value={section.heading || ''} onChange={e => onChange({ ...section, heading: e.target.value })} placeholder="Heading" className="text-gray-900 text-sm" />
                    </div>
                    <Input value={section.subtitle || ''} onChange={e => onChange({ ...section, subtitle: e.target.value })} placeholder="Subtitle (optional)" className="text-gray-900 text-sm" />
                    <div className="border-t border-gray-200 pt-3">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-xs font-bold uppercase text-gray-500">Cards ({items.length})</p>
                            <button
                                type="button"
                                onClick={() => onChange({ ...section, items: [...items, { icon: 'Sparkles', title: '', desc: '' }] })}
                                className="text-xs font-bold inline-flex items-center gap-1 text-[#140152] hover:text-[#1d0175]"
                            >
                                <Plus className="w-3 h-3" /> Add card
                            </button>
                        </div>
                        <div className="space-y-2">
                            {items.map((it, j) => (
                                <div key={j} className="rounded-lg bg-white border border-gray-200 p-3 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <p className="text-[10px] font-bold uppercase text-gray-500">Card {j + 1}</p>
                                        <button
                                            type="button"
                                            onClick={() => onChange({ ...section, items: items.filter((_, k) => k !== j) })}
                                            className="p-1 text-red-500 hover:bg-red-50 rounded"
                                        ><Trash2 className="w-3.5 h-3.5" /></button>
                                    </div>
                                    <div className="grid md:grid-cols-2 gap-2">
                                        <Input value={it.icon || ''} onChange={e => onChange({ ...section, items: items.map((x, k) => k === j ? { ...x, icon: e.target.value } : x) })} placeholder="Icon (Heart, Sword, etc.)" className="text-gray-900 text-sm font-mono" />
                                        <Input value={it.title || ''} onChange={e => onChange({ ...section, items: items.map((x, k) => k === j ? { ...x, title: e.target.value } : x) })} placeholder="Title" className="text-gray-900 text-sm" />
                                    </div>
                                    <Textarea value={it.desc || ''} onChange={e => onChange({ ...section, items: items.map((x, k) => k === j ? { ...x, desc: e.target.value } : x) })} rows={2} placeholder="Description" className="text-gray-900 text-sm" />
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}
