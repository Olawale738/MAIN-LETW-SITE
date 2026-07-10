'use client'
/**
 * /admin/page-copy — one place to edit the hero + top-level copy on the
 * six public pages that are backed by data models (apps, sanctuary,
 * marriage-prep, download, life-events, fasting). Each tab writes to its
 * own ministry-content key; each public page reads it with field-level
 * fallbacks so a half-saved record can never blank the site.
 *
 * This complements — it does not replace — the specialised editors:
 *   /admin/site-content → Apps grid    (cards on /apps)
 *   /admin/sanctuary                    (rooms + bookings)
 *   /admin/marriage-prep               (curriculum + couples)
 *   /admin/downloads                    (files)
 *   /admin/life-events                  (requests)
 *   /admin/fasting                      (fasts + prayer prompts)
 */
import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
    Loader2, Save, RotateCcw, AlertCircle, CheckCircle, ExternalLink,
    LayoutGrid, MapPin, Heart, Download, CalendarHeart, Sparkles, Flame,
} from 'lucide-react'
import { ministryContentApi, type MinistryContentKey } from '@/lib/api'

interface PageCopy {
    eyebrow: string
    title:   string
    subtitle: string
    cta_label: string
    cta_href:  string
    section_heading?: string
    section_sub?:     string
    // Single source of truth for the marriage-prep course length. Every
    // surface that mentions "N weeks" (home page, road-ahead card,
    // certificate) reads this instead of hardcoding a number.
    course_weeks?: number
    // Jitsi video calls in the couple portal + admin. jitsi_enabled defaults
    // to true; jitsi_domain lets a church point at a self-hosted Jitsi.
    jitsi_enabled?: boolean
    jitsi_domain?: string
}

const DEFAULTS: Record<MinistryContentKey, PageCopy> = {
    'apps-page': {
        eyebrow: 'Church Apps Network',
        title:   'Every tool in one place.',
        subtitle: 'The complete LETW digital ecosystem. Worship, learn, give, grow — all part of one Kingdom.',
        cta_label: '',
        cta_href:  '',
    },
    'sanctuary-page': {
        eyebrow: 'Bookable Spaces',
        title:   'Sanctuary, halls & rooms',
        subtitle: 'Reserve our wedding hall, prayer chapel, conference rooms and more for your event, gathering or quiet retreat.',
        cta_label: '',
        cta_href:  '',
    },
    'marriage-prep-page': {
        eyebrow: 'Six-week guided course',
        title:   'Marriage prep, together.',
        subtitle: 'Six weeks of guided conversations, scriptures, and homework — finishing with a pastor’s sign-off so you walk into your covenant ready, not just rushed.',
        cta_label: 'Enrol your couple',
        cta_href:  '#enrol',
        section_heading: 'The journey',
        section_sub:     'One week at a time. No skipping ahead — even the rush is part of the lesson.',
        course_weeks: 6,
        jitsi_enabled: true,
        jitsi_domain: 'meet.jit.si',
    },
    'download-page': {
        eyebrow: '',
        title:   'Resources & Downloads',
        subtitle: 'Sermons, devotionals, study guides, music — free for the journey',
        cta_label: '',
        cta_href:  '',
    },
    'life-events-page': {
        eyebrow: 'Sacred Milestones',
        title:   'Mark the moments that matter.',
        subtitle: 'Wedding, baptism, child dedication, or memorial — request a date and our pastoral team will reach out.',
        cta_label: '',
        cta_href:  '',
    },
    'fasting-page': {
        eyebrow: 'Corporate fasting',
        title:   'Hunger for more of God.',
        subtitle: 'Join the whole church in seasons of consecration — daily prayer prompts, a shared rhythm, and the strength of fasting together.',
        cta_label: '',
        cta_href:  '',
    },
    // The union type requires all keys — the below are unused by this
    // editor. Keeping them as no-op defaults so TypeScript is happy.
    'women': BLANK(),           'men': BLANK(),                 'theology': BLANK(),
    'leadership': BLANK(),      'giving': BLANK(),              'statement-of-faith': BLANK(),
    'privacy-policy': BLANK(),  'terms-of-service': BLANK(),    'testimony-page': BLANK(),
    'hero-settings': BLANK(),   'apps-list': BLANK(),           'navbar': BLANK(),
    'footer': BLANK(),          'tour-page': BLANK(),           'voice-page': BLANK(),
    'grow-page': BLANK(),       'email-templates': BLANK(),     'onboarding-page': BLANK(),
    'volunteer-page': BLANK(),
}

function BLANK(): PageCopy {
    return { eyebrow: '', title: '', subtitle: '', cta_label: '', cta_href: '' }
}

const TABS: { key: MinistryContentKey; label: string; icon: any; public_path: string }[] = [
    { key: 'apps-page',          label: '/apps',          icon: LayoutGrid,   public_path: '/apps' },
    { key: 'sanctuary-page',     label: '/sanctuary',     icon: MapPin,       public_path: '/sanctuary' },
    { key: 'marriage-prep-page', label: '/marriage-prep', icon: Heart,        public_path: '/marriage-prep' },
    { key: 'download-page',      label: '/download',      icon: Download,     public_path: '/download' },
    { key: 'life-events-page',   label: '/life-events',   icon: CalendarHeart, public_path: '/life-events' },
    { key: 'fasting-page',       label: '/fasting',       icon: Flame,        public_path: '/fasting' },
]

export default function PageCopyAdmin() {
    const [tab, setTab] = useState<MinistryContentKey>('apps-page')
    const [data, setData] = useState<PageCopy>(DEFAULTS['apps-page'])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)

    // Reload whenever the tab changes.
    useEffect(() => {
        setLoading(true)
        ministryContentApi.get(tab)
            .then(r => {
                const c = (r.content || {}) as Partial<PageCopy>
                setData({ ...DEFAULTS[tab], ...c })
            })
            .catch(() => setData(DEFAULTS[tab]))
            .finally(() => setLoading(false))
    }, [tab])
    useEffect(() => { if (msg) { const t = setTimeout(() => setMsg(null), 5000); return () => clearTimeout(t) } }, [msg])

    const save = async () => {
        setSaving(true)
        try {
            await ministryContentApi.update(tab, data as unknown as Record<string, unknown>)
            setMsg({ kind: 'ok', text: `Saved. Refresh ${currentTab.public_path} to see the change.` })
        } catch (e) {
            setMsg({ kind: 'err', text: (e as Error).message })
        } finally { setSaving(false) }
    }
    const reset = () => {
        if (!confirm('Reset this tab to factory defaults?')) return
        setData(DEFAULTS[tab])
    }

    const currentTab = TABS.find(t => t.key === tab) || TABS[0]

    return (
        <div className="p-4 sm:p-6 max-w-5xl mx-auto pb-32">
            <div className="flex items-start justify-between flex-wrap gap-4 mb-5">
                <div>
                    <h1 className="text-3xl font-black text-[#140152]">Page copy</h1>
                    <p className="text-gray-500 mt-1 text-sm">
                        Edit the hero and top-level copy for each of the five data-backed public pages.
                        The item-level content (rooms, modules, files, requests) still lives in its own admin —
                        follow the &quot;View admin&quot; link on each tab.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={reset} className="px-4 py-3 border border-gray-200 text-gray-600 hover:text-[#140152] hover:border-gray-300 font-bold rounded-xl text-sm inline-flex items-center gap-1.5">
                        <RotateCcw className="w-4 h-4" /> Reset
                    </button>
                    <button onClick={save} disabled={saving || loading} className="inline-flex items-center gap-2 bg-[#140152] hover:bg-[#1d0175] text-white font-bold px-5 py-3 rounded-xl disabled:opacity-50">
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save {currentTab.label}
                    </button>
                </div>
            </div>

            {msg && (
                <div className={`mb-4 p-3 rounded-xl border flex items-start gap-2 ${msg.kind === 'ok' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                    {msg.kind === 'ok' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                    <span className="text-sm">{msg.text}</span>
                </div>
            )}

            {/* Tabs */}
            <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
                {TABS.map(t => {
                    const Icon = t.icon
                    return (
                        <button key={t.key} onClick={() => setTab(t.key)}
                            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-colors ${
                                tab === t.key ? 'bg-[#140152] text-white shadow' : 'bg-white border border-gray-200 text-gray-600 hover:text-[#140152] hover:border-gray-300'
                            }`}>
                            <Icon className="w-4 h-4" /> {t.label}
                        </button>
                    )
                })}
            </div>

            {/* Quick action bar for the current page */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4 flex items-center justify-between flex-wrap gap-3">
                <div className="text-xs text-amber-900">
                    Editing <code className="bg-white/60 border border-amber-200 px-1.5 py-0.5 rounded font-mono text-[11px]">{tab}</code>
                </div>
                <div className="flex items-center gap-3 text-xs">
                    <Link href={currentTab.public_path} target="_blank" className="text-amber-900 hover:underline inline-flex items-center gap-1">
                        View public page <ExternalLink className="w-3 h-3" />
                    </Link>
                    {tab === 'sanctuary-page' && <Link href="/admin/sanctuary" className="text-amber-900 hover:underline">Rooms + bookings →</Link>}
                    {tab === 'marriage-prep-page' && <Link href="/admin/marriage-prep" className="text-amber-900 hover:underline">Curriculum + couples →</Link>}
                    {tab === 'download-page' && <Link href="/admin/downloads" className="text-amber-900 hover:underline">Files →</Link>}
                    {tab === 'life-events-page' && <Link href="/admin/life-events" className="text-amber-900 hover:underline">Requests →</Link>}
                    {tab === 'fasting-page' && <Link href="/admin/fasting" className="text-amber-900 hover:underline">Fasts + prompts →</Link>}
                    {tab === 'apps-page' && <Link href="/admin/site-content" className="text-amber-900 hover:underline">Apps grid →</Link>}
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center min-h-[40vh]"><Loader2 className="w-10 h-10 animate-spin text-[#140152]" /></div>
            ) : (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    <Field label="Eyebrow (small line above the title)" value={data.eyebrow}
                        onChange={v => setData({ ...data, eyebrow: v })} />
                    <Field label="Title" value={data.title}
                        onChange={v => setData({ ...data, title: v })} />
                    <TextArea label="Subtitle" rows={3} value={data.subtitle}
                        onChange={v => setData({ ...data, subtitle: v })} />

                    {tab === 'marriage-prep-page' && (
                        <>
                            <div className="border-t border-gray-100 mt-4 pt-3">
                                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 mb-2">Course length</p>
                                <div className="mb-3 max-w-[220px]">
                                    <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 mb-1.5">Number of weeks</label>
                                    <input type="number" min={1} max={52} value={data.course_weeks ?? 6}
                                        onChange={e => setData({ ...data, course_weeks: Math.max(1, Number(e.target.value) || 1) })}
                                        className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm" />
                                </div>
                                <p className="text-xs text-gray-400 -mt-2 mb-3">
                                    Drives every "N weeks" mention on the public page, the couple&apos;s road-ahead
                                    checklist, and the printed certificate — including the eyebrow/subtitle text
                                    below if you mention the week count there too.
                                </p>
                            </div>
                            <div className="border-t border-gray-100 mt-1 pt-3">
                                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 mb-2">Video calls (Jitsi)</p>
                                <label className="flex items-center gap-2 text-sm text-[#140152] mb-3">
                                    <input type="checkbox" checked={data.jitsi_enabled !== false}
                                        onChange={e => setData({ ...data, jitsi_enabled: e.target.checked })} />
                                    Let couples &amp; pastors meet by video from the course portal
                                </label>
                                <Field label="Jitsi domain (advanced — leave as meet.jit.si unless self-hosting)"
                                    value={data.jitsi_domain || 'meet.jit.si'}
                                    onChange={v => setData({ ...data, jitsi_domain: v.trim() || 'meet.jit.si' })} />
                            </div>
                            <div className="border-t border-gray-100 mt-1 pt-3">
                                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 mb-2">Curriculum section</p>
                                <Field label="Heading (e.g. 'The journey')" value={data.section_heading || ''}
                                    onChange={v => setData({ ...data, section_heading: v })} />
                                <TextArea label="Sub-heading" rows={2} value={data.section_sub || ''}
                                    onChange={v => setData({ ...data, section_sub: v })} />
                            </div>
                        </>
                    )}

                    {(tab === 'marriage-prep-page') && (
                        <div className="border-t border-gray-100 mt-4 pt-3">
                            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 mb-2">Hero CTA button</p>
                            <div className="grid md:grid-cols-2 gap-3">
                                <Field label="Label" value={data.cta_label}
                                    onChange={v => setData({ ...data, cta_label: v })} />
                                <Field label="Anchor / URL" value={data.cta_href}
                                    onChange={v => setData({ ...data, cta_href: v })} />
                            </div>
                        </div>
                    )}
                </div>
            )}

            <div className="sticky bottom-4 mt-8 z-30">
                <div className="bg-white border border-gray-200 shadow-lg rounded-2xl p-3 flex items-center justify-between">
                    <p className="text-xs text-gray-500 pl-2 inline-flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-[#f5bb00]" /> Saves to ministry-content key <code className="font-mono">{tab}</code>.
                    </p>
                    <button onClick={save} disabled={saving || loading} className="inline-flex items-center gap-2 bg-[#140152] hover:bg-[#1d0175] text-white font-bold px-5 py-2.5 rounded-xl text-sm disabled:opacity-50">
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save changes
                    </button>
                </div>
            </div>
        </div>
    )
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
    return (
        <div className="mb-3">
            <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 mb-1.5">{label}</label>
            <input value={value} onChange={e => onChange(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm" />
        </div>
    )
}

function TextArea({ label, value, onChange, rows }: { label: string; value: string; onChange: (v: string) => void; rows: number }) {
    return (
        <div className="mb-3">
            <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 mb-1.5">{label}</label>
            <textarea value={value} onChange={e => onChange(e.target.value)} rows={rows} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm resize-y" />
        </div>
    )
}
