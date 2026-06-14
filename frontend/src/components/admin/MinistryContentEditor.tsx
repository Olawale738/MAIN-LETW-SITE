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
    Calendar, Heart, Crown,
} from 'lucide-react'
import { ministryContentApi } from '@/lib/api'

type Pillar = { icon: string; title: string; desc: string }
type Program = { icon: string; title: string; desc: string; badge: string; cta: string }
type Carousel = { value: string; label: string }

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

    useEffect(() => {
        (async () => {
            try {
                const r = await ministryContentApi.get(ministryKey)
                const c = r.content || {}
                setForm(prev => ({
                    ...prev,
                    ...Object.fromEntries(Object.keys(prev).map(k => [k, (c as any)[k] ?? (prev as any)[k]])),
                }))
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
