'use client'
import { useEffect, useState } from 'react'
import { Loader2, Save, Plus, Trash2, AlertCircle, CheckCircle, Crown, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { ministryContentApi } from '@/lib/api'

const ICONS = ['Flame', 'Shield', 'Target', 'Globe', 'Users', 'Lightbulb', 'Heart', 'BookOpen', 'Crown', 'Award', 'Trophy', 'Star', 'Zap']

export default function AdminLeadershipContentPage() {
    const [c, setC] = useState<any>({})
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)

    useEffect(() => {
        ministryContentApi.get('leadership').then(r => setC(r.content || {})).catch(() => {}).finally(() => setLoading(false))
    }, [])
    useEffect(() => { if (msg) { const t = setTimeout(() => setMsg(null), 5000); return () => clearTimeout(t) } }, [msg])

    const save = async () => {
        setSaving(true)
        try { await ministryContentApi.update('leadership', c); setMsg({ kind: 'ok', text: 'Saved. Visit /leadership to see live.' }) }
        catch (e) { setMsg({ kind: 'err', text: (e as Error).message }) }
        finally { setSaving(false) }
    }

    const setHero = (k: string, v: any) => setC({ ...c, hero: { ...(c.hero || {}), [k]: v } })
    const setHeading = (k: string, v: any) => setC({ ...c, headings: { ...(c.headings || {}), [k]: v } })
    const setArr = (k: string, v: any[]) => setC({ ...c, [k]: v })

    if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-10 h-10 animate-spin text-[#140152]" /></div>

    const hero = c.hero || {}
    const headings = c.headings || {}
    const stats: any[] = c.stats || []
    const pillars: any[] = c.pillars || []
    const tracks: any[] = c.tracks || []
    const mentors: any[] = c.mentors || []
    const journey: any[] = c.journey || []
    const gains: string[] = c.gains || []

    return (
        <div className="p-4 sm:p-6 max-w-5xl mx-auto pb-32">
            <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
                <div>
                    <h1 className="text-3xl font-black text-[#140152] flex items-center gap-3"><Crown className="w-7 h-7 text-[#f5bb00]" /> Leadership Page</h1>
                    <p className="text-gray-500 mt-1 text-sm">Every word on <Link href="/leadership" target="_blank" className="text-[#140152] font-bold inline-flex items-center gap-1 hover:underline">/leadership <ExternalLink className="w-3 h-3" /></Link>. Leave blank to keep defaults.</p>
                </div>
                <button onClick={save} disabled={saving} className="inline-flex items-center gap-2 bg-[#140152] hover:bg-[#1d0175] text-white font-bold px-5 py-3 rounded-xl disabled:opacity-50">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save
                </button>
            </div>

            {msg && <div className={`mb-4 p-3 rounded-xl border flex items-start gap-2 ${msg.kind === 'ok' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                {msg.kind === 'ok' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}<span className="text-sm">{msg.text}</span>
            </div>}

            {/* Hero */}
            <Section title="Hero">
                <Field label="Eyebrow" v={hero.eyebrow} on={v => setHero('eyebrow', v)} />
                <div className="grid md:grid-cols-3 gap-3">
                    <Field label="Title line 1" v={hero.title_a} on={v => setHero('title_a', v)} />
                    <Field label="Title accent" v={hero.title_b} on={v => setHero('title_b', v)} />
                    <Field label="Title rest" v={hero.title_c} on={v => setHero('title_c', v)} />
                </div>
                <TextArea label="Description" v={hero.description} on={v => setHero('description', v)} />
                <div className="grid md:grid-cols-2 gap-3">
                    <Field label="Primary CTA" v={hero.cta_primary} on={v => setHero('cta_primary', v)} />
                    <Field label="Secondary CTA" v={hero.cta_secondary} on={v => setHero('cta_secondary', v)} />
                </div>
            </Section>

            {/* Stats */}
            <Section title="Stats Band">
                {stats.map((s, i) => (
                    <Row key={i} onRemove={() => setArr('stats', stats.filter((_, j) => j !== i))}>
                        <Field label="Value" v={s.val} on={v => setArr('stats', stats.map((x, j) => j === i ? { ...x, val: v } : x))} />
                        <Field label="Label" v={s.label} on={v => setArr('stats', stats.map((x, j) => j === i ? { ...x, label: v } : x))} />
                    </Row>
                ))}
                <AddBtn onClick={() => setArr('stats', [...stats, { val: '', label: '' }])} text="Add stat" />
            </Section>

            {/* Section headings */}
            <Section title="Section Headings">
                <div className="grid md:grid-cols-2 gap-3">
                    <Field label="Pillars eyebrow" v={headings.pillars_eyebrow} on={v => setHeading('pillars_eyebrow', v)} />
                    <Field label="Pillars title" v={headings.pillars_title} on={v => setHeading('pillars_title', v)} />
                    <Field label="Tracks eyebrow" v={headings.tracks_eyebrow} on={v => setHeading('tracks_eyebrow', v)} />
                    <Field label="Tracks title" v={headings.tracks_title} on={v => setHeading('tracks_title', v)} />
                    <Field label="Journey eyebrow" v={headings.journey_eyebrow} on={v => setHeading('journey_eyebrow', v)} />
                    <Field label="Journey title" v={headings.journey_title} on={v => setHeading('journey_title', v)} />
                    <Field label="Mentors eyebrow" v={headings.mentors_eyebrow} on={v => setHeading('mentors_eyebrow', v)} />
                    <Field label="Mentors title" v={headings.mentors_title} on={v => setHeading('mentors_title', v)} />
                    <Field label="Gains eyebrow" v={headings.gains_eyebrow} on={v => setHeading('gains_eyebrow', v)} />
                    <Field label="Gains title" v={headings.gains_title} on={v => setHeading('gains_title', v)} />
                    <Field label="Certificate title" v={headings.cert_title} on={v => setHeading('cert_title', v)} />
                    <Field label="Certificate CTA" v={headings.cert_cta} on={v => setHeading('cert_cta', v)} />
                </div>
                <TextArea label="Certificate body" v={headings.cert_body} on={v => setHeading('cert_body', v)} />
                <TextArea label="Quote" v={headings.quote} on={v => setHeading('quote', v)} />
                <Field label="Quote reference" v={headings.quote_ref} on={v => setHeading('quote_ref', v)} />
                <Field label="Quote CTA" v={headings.quote_cta} on={v => setHeading('quote_cta', v)} />
            </Section>

            {/* Pillars */}
            <Section title="Pillars">
                {pillars.map((p, i) => (
                    <Row key={i} onRemove={() => setArr('pillars', pillars.filter((_, j) => j !== i))}>
                        <div>
                            <label className="text-xs font-bold uppercase text-gray-500 block mb-1">Icon</label>
                            <select value={p.icon || 'Flame'} onChange={e => setArr('pillars', pillars.map((x, j) => j === i ? { ...x, icon: e.target.value } : x))}
                                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
                                {ICONS.map(ic => <option key={ic}>{ic}</option>)}
                            </select>
                        </div>
                        <Field label="Title" v={p.title} on={v => setArr('pillars', pillars.map((x, j) => j === i ? { ...x, title: v } : x))} />
                        <TextArea label="Description" v={p.desc} on={v => setArr('pillars', pillars.map((x, j) => j === i ? { ...x, desc: v } : x))} />
                    </Row>
                ))}
                <AddBtn onClick={() => setArr('pillars', [...pillars, { icon: 'Flame', title: '', desc: '' }])} text="Add pillar" />
            </Section>

            {/* Tracks */}
            <Section title="Training Tracks">
                {tracks.map((t, i) => (
                    <Row key={i} onRemove={() => setArr('tracks', tracks.filter((_, j) => j !== i))}>
                        <div className="grid md:grid-cols-4 gap-3">
                            <Field label="Level" v={t.level} on={v => setArr('tracks', tracks.map((x, j) => j === i ? { ...x, level: v } : x))} />
                            <Field label="Tag" v={t.tag} on={v => setArr('tracks', tracks.map((x, j) => j === i ? { ...x, tag: v } : x))} />
                            <Field label="Color (hex)" v={t.color} on={v => setArr('tracks', tracks.map((x, j) => j === i ? { ...x, color: v } : x))} />
                            <Field label="Modules" type="number" v={t.modules} on={v => setArr('tracks', tracks.map((x, j) => j === i ? { ...x, modules: parseInt(v) || 0 } : x))} />
                        </div>
                        <TextArea label="Description" v={t.desc} on={v => setArr('tracks', tracks.map((x, j) => j === i ? { ...x, desc: v } : x))} />
                    </Row>
                ))}
                <AddBtn onClick={() => setArr('tracks', [...tracks, { level: '', tag: '', color: '#f5bb00', modules: 0, desc: '' }])} text="Add track" />
            </Section>

            {/* Journey */}
            <Section title="Journey Steps">
                {journey.map((j, i) => (
                    <Row key={i} onRemove={() => setArr('journey', journey.filter((_, k) => k !== i))}>
                        <div className="grid md:grid-cols-3 gap-3">
                            <Field label="Step" v={j.step} on={v => setArr('journey', journey.map((x, k) => k === i ? { ...x, step: v } : x))} />
                            <div className="md:col-span-2"><Field label="Title" v={j.title} on={v => setArr('journey', journey.map((x, k) => k === i ? { ...x, title: v } : x))} /></div>
                        </div>
                        <TextArea label="Description" v={j.desc} on={v => setArr('journey', journey.map((x, k) => k === i ? { ...x, desc: v } : x))} />
                    </Row>
                ))}
                <AddBtn onClick={() => setArr('journey', [...journey, { step: '0' + (journey.length + 1), title: '', desc: '' }])} text="Add step" />
            </Section>

            {/* Mentors */}
            <Section title="Mentors">
                {mentors.map((m, i) => (
                    <Row key={i} onRemove={() => setArr('mentors', mentors.filter((_, j) => j !== i))}>
                        <div className="grid md:grid-cols-3 gap-3">
                            <Field label="Name" v={m.name} on={v => setArr('mentors', mentors.map((x, j) => j === i ? { ...x, name: v } : x))} />
                            <Field label="Role" v={m.role} on={v => setArr('mentors', mentors.map((x, j) => j === i ? { ...x, role: v } : x))} />
                            <Field label="Specialty" v={m.specialty} on={v => setArr('mentors', mentors.map((x, j) => j === i ? { ...x, specialty: v } : x))} />
                        </div>
                    </Row>
                ))}
                <AddBtn onClick={() => setArr('mentors', [...mentors, { name: '', role: '', specialty: '' }])} text="Add mentor" />
            </Section>

            {/* Gains */}
            <Section title="What You'll Gain (bullet list)">
                {gains.map((g, i) => (
                    <Row key={i} onRemove={() => setArr('gains', gains.filter((_, j) => j !== i))}>
                        <Field label={`Item ${i + 1}`} v={g} on={v => setArr('gains', gains.map((x, j) => j === i ? v : x))} />
                    </Row>
                ))}
                <AddBtn onClick={() => setArr('gains', [...gains, ''])} text="Add gain" />
            </Section>

            <div className="mt-8 flex justify-end">
                <button onClick={save} disabled={saving} className="inline-flex items-center gap-2 bg-[#140152] hover:bg-[#1d0175] text-white font-bold px-6 py-3 rounded-xl disabled:opacity-50">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save All
                </button>
            </div>
        </div>
    )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6 mb-5">
            <h2 className="text-lg font-bold text-[#140152] mb-4">{title}</h2>
            <div className="space-y-3">{children}</div>
        </div>
    )
}
function Field({ label, v, on, type = 'text' }: { label: string; v: any; on: (v: string) => void; type?: string }) {
    return (
        <div>
            <label className="text-xs font-bold uppercase text-gray-500 block mb-1">{label}</label>
            <input type={type} value={v || ''} onChange={e => on(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
        </div>
    )
}
function TextArea({ label, v, on }: { label: string; v: any; on: (v: string) => void }) {
    return (
        <div>
            <label className="text-xs font-bold uppercase text-gray-500 block mb-1">{label}</label>
            <textarea value={v || ''} onChange={e => on(e.target.value)} rows={3} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
        </div>
    )
}
function Row({ children, onRemove }: { children: React.ReactNode; onRemove: () => void }) {
    return (
        <div className="border border-gray-100 rounded-xl p-4 relative space-y-3 bg-gray-50/30">
            <button onClick={onRemove} className="absolute top-2 right-2 p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button>
            {children}
        </div>
    )
}
function AddBtn({ onClick, text }: { onClick: () => void; text: string }) {
    return (
        <button onClick={onClick} className="w-full border-2 border-dashed border-gray-200 hover:border-[#140152] hover:bg-[#140152]/5 rounded-xl py-3 text-sm font-bold text-gray-500 hover:text-[#140152] inline-flex items-center justify-center gap-2">
            <Plus className="w-4 h-4" /> {text}
        </button>
    )
}
