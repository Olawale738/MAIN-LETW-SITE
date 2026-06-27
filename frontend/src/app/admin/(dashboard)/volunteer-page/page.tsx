'use client'
/**
 * /admin/volunteer-page — every visible string on letw.org/volunteer.
 * Saves to ministry-content key 'volunteer-page'. Public page merges
 * fields onto bundled defaults so a half-saved record never blanks the
 * site.
 */
import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
    Loader2, Save, RotateCcw, AlertCircle, CheckCircle, ExternalLink, Heart, Plus, Trash2, ArrowUp, ArrowDown, Sparkles,
} from 'lucide-react'
import { ministryContentApi } from '@/lib/api'

// Mirror of the public allow-list. Keep in sync if you add icons there.
const ICON_NAMES = [
    'Heart', 'Users', 'Music', 'BookOpen', 'Camera', 'Coffee',
    'Shield', 'Mic2', 'Baby', 'Star', 'Sparkles', 'CheckCircle',
]

interface VolunteerDept   { icon: string; title: string; desc: string; spots: string }
interface VolunteerReason { icon: string; title: string; desc: string }
interface VolunteerConfig {
    hero: { eyebrow: string; title_line_1: string; title_line_2: string; subtitle: string; cta_label: string }
    why: { eyebrow: string; heading: string; points: VolunteerReason[] }
    departments: { eyebrow: string; heading: string; items: VolunteerDept[] }
    form: {
        eyebrow: string; heading: string; sub: string; submit_label: string
        success_heading: string; success_body: string
        availability_options: string[]
    }
    banner: { quote: string; ref: string; cta_label: string; ask_label: string }
}

const DEFAULTS: VolunteerConfig = {
    hero: {
        eyebrow: 'Serve with Purpose',
        title_line_1: 'Your Time.',
        title_line_2: "God's Work.",
        subtitle: "Volunteering at LETW is not about filling a role — it's about fulfilling your calling. Join hundreds of members who are changing lives through faithful service.",
        cta_label: 'Apply to Volunteer',
    },
    why: {
        eyebrow: 'Why It Matters',
        heading: 'Why Serve at LETW?',
        points: [
            { icon: 'Sparkles', title: 'Eternal Impact',  desc: 'Every hour you serve plants seeds that last beyond this lifetime.' },
            { icon: 'Users',    title: 'Community',       desc: 'Forge deep friendships with like-minded believers who share your values.' },
            { icon: 'Star',     title: 'Grow Your Gifts', desc: 'Discover and develop the unique gifts God has placed inside you.' },
            { icon: 'Heart',    title: 'Give Back',       desc: "Respond to God's goodness by investing your time in His house." },
        ],
    },
    departments: {
        eyebrow: 'Find Your Place',
        heading: 'Volunteer Departments',
        items: [
            { icon: 'Music',    title: 'Worship Team',              desc: 'Singers, musicians, and sound engineers glorifying God through music.', spots: 'Open spots' },
            { icon: 'Baby',     title: "Children's Ministry",       desc: 'Teach, nurture, and protect the next generation in faith.',             spots: 'Open spots' },
            { icon: 'Users',    title: 'Ushering & Welcome',        desc: 'Be the first smile people see. Create a warm atmosphere for all.',      spots: 'Open spots' },
            { icon: 'BookOpen', title: 'Bible Study Facilitator',   desc: 'Lead small-group discussions and help members dig into the Word.',      spots: 'Open spots' },
            { icon: 'Camera',   title: 'Media & Creative',          desc: 'Photography, videography, graphics, and social media for the church.',  spots: 'Open spots' },
            { icon: 'Coffee',   title: 'Hospitality Team',          desc: 'Food, fellowship events, and making everyone feel at home.',            spots: 'Open spots' },
            { icon: 'Mic2',     title: 'Youth Ministry',            desc: 'Mentor and empower teens and young adults to lead lives of purpose.',   spots: 'Open spots' },
            { icon: 'Shield',   title: 'Security & Safety',         desc: 'Keep the church environment safe and orderly for all members.',         spots: 'Open spots' },
            { icon: 'Heart',    title: 'Counselling Support',       desc: 'Assist our counselling team with admin, scheduling, and prayer support.', spots: 'Open spots' },
        ],
    },
    form: {
        eyebrow: 'Take the First Step',
        heading: 'Volunteer Application',
        sub: 'Our team will review your application and reach out shortly.',
        submit_label: 'Submit Application',
        success_heading: 'Application Received!',
        success_body: 'Thank you for your heart to serve! Our volunteer coordinator will contact you shortly. Welcome to the family of servants.',
        availability_options: ['Sundays only', 'Weekdays', 'Weekends', 'Any day', 'Flexible / as needed'],
    },
    banner: {
        quote: '"Each of you should use whatever gift you have received to serve others."',
        ref: '— 1 Peter 4:10',
        cta_label: 'Apply Now',
        ask_label: 'Ask a Question',
    },
}

function move<T>(arr: T[], i: number, dir: 'up' | 'down'): T[] {
    const j = dir === 'up' ? i - 1 : i + 1
    if (j < 0 || j >= arr.length) return arr
    const next = arr.slice()
    ;[next[i], next[j]] = [next[j], next[i]]
    return next
}

export default function VolunteerPageAdmin() {
    const [cfg, setCfg] = useState<VolunteerConfig>(DEFAULTS)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)

    useEffect(() => {
        ministryContentApi.get('volunteer-page')
            .then(r => {
                const c = (r.content || {}) as Partial<VolunteerConfig>
                setCfg({
                    hero: { ...DEFAULTS.hero, ...(c.hero || {}) },
                    why: {
                        ...DEFAULTS.why, ...(c.why || {}),
                        points: (c.why?.points && c.why.points.length > 0) ? c.why.points : DEFAULTS.why.points,
                    },
                    departments: {
                        ...DEFAULTS.departments, ...(c.departments || {}),
                        items: (c.departments?.items && c.departments.items.length > 0) ? c.departments.items : DEFAULTS.departments.items,
                    },
                    form: {
                        ...DEFAULTS.form, ...(c.form || {}),
                        availability_options:
                            (c.form?.availability_options && c.form.availability_options.length > 0)
                                ? c.form.availability_options
                                : DEFAULTS.form.availability_options,
                    },
                    banner: { ...DEFAULTS.banner, ...(c.banner || {}) },
                })
            })
            .catch(() => { /* keep DEFAULTS */ })
            .finally(() => setLoading(false))
    }, [])

    useEffect(() => { if (msg) { const t = setTimeout(() => setMsg(null), 5000); return () => clearTimeout(t) } }, [msg])

    const save = async () => {
        setSaving(true)
        try {
            await ministryContentApi.update('volunteer-page', cfg as unknown as Record<string, unknown>)
            setMsg({ kind: 'ok', text: 'Saved. Refresh letw.org/volunteer to see the change.' })
        } catch (e) {
            setMsg({ kind: 'err', text: (e as Error).message })
        } finally {
            setSaving(false)
        }
    }

    const reset = () => {
        if (!confirm('Reset every field on /volunteer back to factory defaults?')) return
        setCfg(DEFAULTS)
    }

    if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-10 h-10 animate-spin text-[#140152]" /></div>

    return (
        <div className="p-4 sm:p-6 max-w-5xl mx-auto pb-32">
            <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
                <div>
                    <h1 className="text-3xl font-black text-[#140152] flex items-center gap-3"><Heart className="w-7 h-7 text-[#f5bb00]" /> Volunteer Page</h1>
                    <p className="text-gray-500 mt-1 text-sm">Edit every visible word on <Link href="/volunteer" target="_blank" className="text-[#140152] font-bold hover:underline inline-flex items-center gap-1">letw.org/volunteer <ExternalLink className="w-3 h-3" /></Link></p>
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
            <Card title="1 · Hero" sub="The deep-navy header with the big 'Your Time. God's Work.' title.">
                <Field label="Eyebrow" value={cfg.hero.eyebrow} onChange={v => setCfg({ ...cfg, hero: { ...cfg.hero, eyebrow: v } })} />
                <div className="grid md:grid-cols-2 gap-3 mt-3">
                    <Field label="Title line 1 (white)" value={cfg.hero.title_line_1} onChange={v => setCfg({ ...cfg, hero: { ...cfg.hero, title_line_1: v } })} />
                    <Field label="Title line 2 (gold gradient)" value={cfg.hero.title_line_2} onChange={v => setCfg({ ...cfg, hero: { ...cfg.hero, title_line_2: v } })} />
                </div>
                <TextArea label="Subtitle" rows={3} value={cfg.hero.subtitle} onChange={v => setCfg({ ...cfg, hero: { ...cfg.hero, subtitle: v } })} />
                <Field label="CTA button label" value={cfg.hero.cta_label} onChange={v => setCfg({ ...cfg, hero: { ...cfg.hero, cta_label: v } })} />
            </Card>

            {/* WHY */}
            <Card title="2 · Why serve?" sub="Four reason cards.">
                <div className="grid md:grid-cols-2 gap-3 mb-4">
                    <Field label="Eyebrow" value={cfg.why.eyebrow} onChange={v => setCfg({ ...cfg, why: { ...cfg.why, eyebrow: v } })} />
                    <Field label="Heading" value={cfg.why.heading} onChange={v => setCfg({ ...cfg, why: { ...cfg.why, heading: v } })} />
                </div>
                {cfg.why.points.map((p, i) => (
                    <ItemFrame key={i} index={i} total={cfg.why.points.length}
                        onMove={dir => setCfg({ ...cfg, why: { ...cfg.why, points: move(cfg.why.points, i, dir) } })}
                        onDelete={() => setCfg({ ...cfg, why: { ...cfg.why, points: cfg.why.points.filter((_, j) => j !== i) } })}>
                        <div className="grid md:grid-cols-2 gap-3">
                            <IconPicker value={p.icon} onChange={v => setCfg({ ...cfg, why: { ...cfg.why, points: cfg.why.points.map((x, j) => j === i ? { ...x, icon: v } : x) } })} />
                            <Field label="Title" value={p.title} onChange={v => setCfg({ ...cfg, why: { ...cfg.why, points: cfg.why.points.map((x, j) => j === i ? { ...x, title: v } : x) } })} />
                        </div>
                        <TextArea label="Description" rows={2} value={p.desc} onChange={v => setCfg({ ...cfg, why: { ...cfg.why, points: cfg.why.points.map((x, j) => j === i ? { ...x, desc: v } : x) } })} />
                    </ItemFrame>
                ))}
                <AddButton label="Add reason" onClick={() => setCfg({ ...cfg, why: { ...cfg.why, points: [...cfg.why.points, { icon: 'Heart', title: 'New reason', desc: '' }] } })} />
            </Card>

            {/* DEPARTMENTS */}
            <Card title="3 · Departments" sub="The list of teams members can join. Also drives the form dropdown.">
                <div className="grid md:grid-cols-2 gap-3 mb-4">
                    <Field label="Eyebrow" value={cfg.departments.eyebrow} onChange={v => setCfg({ ...cfg, departments: { ...cfg.departments, eyebrow: v } })} />
                    <Field label="Heading" value={cfg.departments.heading} onChange={v => setCfg({ ...cfg, departments: { ...cfg.departments, heading: v } })} />
                </div>
                {cfg.departments.items.map((d, i) => (
                    <ItemFrame key={i} index={i} total={cfg.departments.items.length}
                        onMove={dir => setCfg({ ...cfg, departments: { ...cfg.departments, items: move(cfg.departments.items, i, dir) } })}
                        onDelete={() => setCfg({ ...cfg, departments: { ...cfg.departments, items: cfg.departments.items.filter((_, j) => j !== i) } })}>
                        <div className="grid md:grid-cols-3 gap-3">
                            <IconPicker value={d.icon} onChange={v => setCfg({ ...cfg, departments: { ...cfg.departments, items: cfg.departments.items.map((x, j) => j === i ? { ...x, icon: v } : x) } })} />
                            <Field label="Title" value={d.title} onChange={v => setCfg({ ...cfg, departments: { ...cfg.departments, items: cfg.departments.items.map((x, j) => j === i ? { ...x, title: v } : x) } })} />
                            <Field label="Spots badge (blank to hide)" value={d.spots} onChange={v => setCfg({ ...cfg, departments: { ...cfg.departments, items: cfg.departments.items.map((x, j) => j === i ? { ...x, spots: v } : x) } })} />
                        </div>
                        <TextArea label="Description" rows={2} value={d.desc} onChange={v => setCfg({ ...cfg, departments: { ...cfg.departments, items: cfg.departments.items.map((x, j) => j === i ? { ...x, desc: v } : x) } })} />
                    </ItemFrame>
                ))}
                <AddButton label="Add department" onClick={() => setCfg({ ...cfg, departments: { ...cfg.departments, items: [...cfg.departments.items, { icon: 'Users', title: 'New department', desc: '', spots: 'Open spots' }] } })} />
            </Card>

            {/* FORM */}
            <Card title="4 · Application form" sub="The form members fill out + success state.">
                <div className="grid md:grid-cols-2 gap-3">
                    <Field label="Eyebrow" value={cfg.form.eyebrow} onChange={v => setCfg({ ...cfg, form: { ...cfg.form, eyebrow: v } })} />
                    <Field label="Heading" value={cfg.form.heading} onChange={v => setCfg({ ...cfg, form: { ...cfg.form, heading: v } })} />
                </div>
                <TextArea label="Sub-heading" rows={2} value={cfg.form.sub} onChange={v => setCfg({ ...cfg, form: { ...cfg.form, sub: v } })} />
                <Field label="Submit button label" value={cfg.form.submit_label} onChange={v => setCfg({ ...cfg, form: { ...cfg.form, submit_label: v } })} />

                <div className="border-t border-gray-100 mt-4 pt-3">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-700 mb-2">Success state</p>
                    <Field label="Success heading" value={cfg.form.success_heading} onChange={v => setCfg({ ...cfg, form: { ...cfg.form, success_heading: v } })} />
                    <TextArea label="Success body" rows={3} value={cfg.form.success_body} onChange={v => setCfg({ ...cfg, form: { ...cfg.form, success_body: v } })} />
                </div>

                <div className="border-t border-gray-100 mt-4 pt-3">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 mb-2">Availability dropdown options</p>
                    {cfg.form.availability_options.map((opt, i) => (
                        <div key={i} className="flex items-center gap-2 mb-2">
                            <input value={opt} onChange={e => setCfg({ ...cfg, form: { ...cfg.form, availability_options: cfg.form.availability_options.map((x, j) => j === i ? e.target.value : x) } })} className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                            <button onClick={() => setCfg({ ...cfg, form: { ...cfg.form, availability_options: cfg.form.availability_options.filter((_, j) => j !== i) } })} className="text-red-500 hover:text-red-700"><Trash2 className="w-4 h-4" /></button>
                        </div>
                    ))}
                    <AddButton label="Add option" onClick={() => setCfg({ ...cfg, form: { ...cfg.form, availability_options: [...cfg.form.availability_options, 'New option'] } })} />
                </div>
            </Card>

            {/* BANNER */}
            <Card title="5 · Bottom banner" sub="The gold pull-quote at the very bottom.">
                <TextArea label="Quote" rows={2} value={cfg.banner.quote} onChange={v => setCfg({ ...cfg, banner: { ...cfg.banner, quote: v } })} />
                <Field label="Reference (e.g. — 1 Peter 4:10)" value={cfg.banner.ref} onChange={v => setCfg({ ...cfg, banner: { ...cfg.banner, ref: v } })} />
                <div className="grid md:grid-cols-2 gap-3 mt-3">
                    <Field label="Primary CTA label" value={cfg.banner.cta_label} onChange={v => setCfg({ ...cfg, banner: { ...cfg.banner, cta_label: v } })} />
                    <Field label="Secondary 'Ask a question' label" value={cfg.banner.ask_label} onChange={v => setCfg({ ...cfg, banner: { ...cfg.banner, ask_label: v } })} />
                </div>
            </Card>

            {/* Sticky save */}
            <div className="sticky bottom-4 mt-8 z-30">
                <div className="bg-white border border-gray-200 shadow-lg rounded-2xl p-3 flex items-center justify-between">
                    <p className="text-xs text-gray-500 pl-2 inline-flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-[#f5bb00]" /> Saves to ministry-content key &quot;volunteer-page&quot;.
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

function IconPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
    return (
        <div>
            <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 mb-1.5">Icon</label>
            <select value={value} onChange={e => onChange(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm">
                {ICON_NAMES.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
        </div>
    )
}

function ItemFrame({ index, total, onMove, onDelete, children }: { index: number; total: number; onMove: (d: 'up' | 'down') => void; onDelete: () => void; children: React.ReactNode }) {
    return (
        <div className="border border-gray-200 rounded-xl p-3 mt-2">
            <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">#{index + 1}</span>
                <div className="flex items-center gap-1">
                    <button onClick={() => onMove('up')} disabled={index === 0} className="p-1 text-gray-400 hover:text-[#140152] disabled:opacity-30"><ArrowUp className="w-4 h-4" /></button>
                    <button onClick={() => onMove('down')} disabled={index === total - 1} className="p-1 text-gray-400 hover:text-[#140152] disabled:opacity-30"><ArrowDown className="w-4 h-4" /></button>
                    <button onClick={onDelete} className="p-1 text-red-500 hover:text-red-700"><Trash2 className="w-4 h-4" /></button>
                </div>
            </div>
            {children}
        </div>
    )
}

function AddButton({ label, onClick }: { label: string; onClick: () => void }) {
    return (
        <button onClick={onClick} className="mt-3 inline-flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 hover:border-[#140152] text-sm font-bold text-gray-600 rounded-lg">
            <Plus className="w-4 h-4" /> {label}
        </button>
    )
}
