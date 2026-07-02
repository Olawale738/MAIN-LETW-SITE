'use client'
/**
 * Site Chrome admin — single page, seven tabs, one ministry-content key per tab.
 *
 * All edits flow through the existing /api/ministry-content/{key} endpoint, so
 * there is no new backend infrastructure: each tab loads its key on focus and
 * the Save button PUTs the JSON blob back.
 *
 * Public consumers (Navbar, Footer, /apps, /tour, /voice, /grow, email
 * senders) read these same keys with the previous hardcoded values as their
 * fallback so the site keeps working even before the first save.
 */
import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
    Loader2, Save, Plus, Trash2, ArrowUp, ArrowDown, AlertCircle, CheckCircle,
    LayoutGrid, Compass, Footprints, Map, Mic, Sprout, Mail,
} from 'lucide-react'
import { ministryContentApi, MinistryContentKey } from '@/lib/api'

// ───────────────────────────────────────────────────────────────────────────
// Defaults — these mirror what's currently hardcoded on the public surfaces,
// so editing in admin replaces them; not editing leaves the site unchanged.
// ───────────────────────────────────────────────────────────────────────────

const DEFAULTS: Record<string, any> = {
    'apps-list': {
        apps: [
            { name: 'LETW Radio', tagline: '24/7 worship + Word', description: 'Anointed worship, sermons, and teachings broadcasting around the clock to every corner of the world.', url: 'https://radio.letw.org', category: 'Worship', pulse: true },
            { name: 'Listen Now', tagline: 'Tune in instantly', description: 'One-click access to the radio player. No app, no setup — just press play and let the Spirit move.', url: 'https://radio.letw.org/listen', category: 'Worship' },
            { name: 'Live Stream', tagline: 'Broadcast quality audio', description: 'High-fidelity stream optimised for desktop, mobile, and in-car listening. Always on, always free.', url: 'https://radio.letw.org/stream', category: 'Worship' },
            { name: 'MGM', tagline: 'Mission, growth, ministry', description: 'The hub for our mission programs, growth initiatives, and ministry leadership development.', url: 'https://mgmt.letw.org', category: 'Ministry' },
            { name: 'SharePoints', tagline: 'Resources for the body', description: 'A shared library of files, documents, and resources for leaders, members, and ministry teams.', url: 'https://sharepoints.letw.org', category: 'Ministry' },
            { name: 'LessonHub', tagline: 'Discipleship that goes deep', description: 'Curated courses, lessons, and study materials for every season of your spiritual journey.', url: 'https://lessonhub.letw.org', category: 'Learning' },
            { name: 'Devotion', tagline: 'Daily encounter with God', description: 'Morning and evening devotionals to anchor your day in the Word. Always one breath from God.', url: 'https://devotion.letw.org', category: 'Devotional' },
        ],
    },
    navbar: {
        main: [
            { name: 'Home', href: '/' },
            { name: 'About', href: '/about' },
            { name: 'Services', href: '/services' },
            { name: 'Events', href: '/events' },
            { name: 'Sermons', href: '/sermons' },
            { name: 'Impact', href: '/impact' },
            { name: 'Give', href: '/giving' },
        ],
        ministries: [
            { name: 'Youth Ministry', href: '/youth' },
            { name: "Children's Ministry", href: '/children' },
            { name: "Men's Ministry", href: '/men' },
            { name: "Women's Ministry", href: '/women' },
        ],
        education: [
            { name: 'Overview', href: '/education' },
            { name: 'Primary School', href: '/education/primary-school' },
            { name: 'Secondary School', href: '/education/secondary-school' },
            { name: 'University', href: '/education/university' },
            { name: 'Theology School', href: '/education/theology-school' },
        ],
        cta_label: 'Join Us',
        cta_href: '/join',
    },
    footer: {
        cta_heading: 'Stay connected with LETW',
        cta_sub: 'Join thousands of believers walking in faith.',
        brand_blurb: 'A bible believing church where the word of God is taught with simplicity and clarity. Experience the divine presence.',
        socials: [
            { name: 'Facebook', href: 'https://facebook.com/LightEncounterTabernacle' },
            { name: 'Twitter', href: 'https://twitter.com/LightEncounterTabernacle' },
            { name: 'Instagram', href: 'https://instagram.com/LightEncounterTabernacle' },
            { name: 'YouTube', href: 'https://www.youtube.com/@LightEncounterTabernacle' },
        ],
        connect_primary: [
            { name: "Pastor's Blog", href: '/blog' },
            { name: 'Church Apps', href: '/apps' },
            { name: 'Give', href: '/giving' },
            { name: 'Volunteer', href: '/volunteer' },
            { name: 'Contact', href: '/contact' },
        ],
        connect_more: [
            { name: 'New here? Start here', href: '/onboarding' },
            { name: 'Free Resources & Downloads', href: '/download' },
            { name: 'Small Groups', href: '/groups' },
            { name: 'Member Directory', href: '/family' },
            { name: 'Grow — Verses & Habits', href: '/grow' },
            { name: 'Virtual Church Tour', href: '/tour' },
            { name: 'Voice & Smart Speakers', href: '/voice' },
            { name: 'Sermon Podcast (RSS)', href: '/sermons/podcast.xml' },
        ],
        ministries: [
            { name: 'Alter Sound', href: '/services/alter-sound' },
            { name: 'Counselling', href: '/services/counselling' },
            { name: 'Bible Study', href: '/bible-study' },
            { name: 'Prayer', href: '/prayer' },
            { name: 'Weddings · Baptism · Dedication', href: '/life-events' },
        ],
        address: 'Abuja, FCT, Nigeria',
        phone: '+234 123 456 7890',
        email: 'info@letw.org',
        service_times: [
            { day: 'Sunday', time: '9:00 AM' },
            { day: 'Tuesday', time: '6:00 PM' },
            { day: 'Friday', time: '8:00 PM' },
        ],
        copyright: '© {year} Light Encounter Tabernacle Worldwide. All rights reserved.',
    },
    'tour-page': {
        title: 'Virtual Church Tour',
        intro: 'Walk through 8 cinematic stops — from Welcome Plaza to Mission Hub — before you ever visit in person.',
        stops: [
            { name: 'Welcome Plaza', description: 'Begin your journey at the heart of LETW.' },
            { name: 'Main Auditorium', description: 'Where worship and the Word meet.' },
            { name: 'Prayer Garden', description: 'A quiet place to commune with God.' },
            { name: 'Youth Wing', description: 'Built for the next generation of leaders.' },
            { name: "Children's Sanctuary", description: 'Where little ones meet Jesus.' },
            { name: 'Resource Library', description: 'Books, sermons, and teachings.' },
            { name: 'Café & Lounge', description: 'Connect over coffee with the family.' },
            { name: 'Mission Hub', description: 'From here, the gospel goes to every nation.' },
        ],
    },
    'voice-page': {
        title: 'Hear the Word — anywhere',
        intro: 'Ask Alexa, Google, Siri, or your browser for today’s verse, a prayer, or a sermon snippet on demand.',
        commands: [
            'Alexa, open Light Encounter',
            'Hey Google, ask LETW for today’s verse',
            'Hey Siri, play a prayer from LETW',
        ],
        outro: 'Available wherever your voice assistant works. Free, no account required.',
    },
    'grow-page': {
        title: 'Grow — Verses & Habits',
        intro: 'Memorise scripture with spaced repetition. Build prayer, fasting, and scripture habits with daily streaks.',
        habit_presets: [
            { name: 'Pray for 10 minutes', frequency: 'daily' },
            { name: 'Read one chapter', frequency: 'daily' },
            { name: 'Fast a meal', frequency: 'weekly' },
            { name: 'Memorise one verse', frequency: 'weekly' },
        ],
    },
    'email-templates': {
        welcome: { subject: 'Welcome to the LETW family', body: 'Hi {name},\n\nWelcome to Light Encounter Tabernacle Worldwide. You are now part of a global family carrying the gospel into every nation.\n\nGrace and peace,\nLETW' },
        password_reset: { subject: 'Reset your LETW password', body: 'Hi {name},\n\nClick the link below to reset your password. It expires in 30 minutes.\n\n{reset_link}\n\nIf you did not request this, you can ignore the email.\n\nLETW' },
        prayer_received: { subject: 'Your prayer request has been received', body: 'Hi {name},\n\nThank you for sharing your request. Our intercessors are praying for you.\n\nGrace and peace,\nLETW' },
        decision_followup: { subject: 'A next step in your walk with Christ', body: 'Hi {name},\n\nHeaven rejoices over you. Here are some next steps:\n\n• Read John 3:16 today\n• Join a small group at /groups\n• Reach out — we are here.\n\nGrace and peace,\nLETW' },
    },
}

const TABS: { key: MinistryContentKey; label: string; icon: any }[] = [
    { key: 'apps-list',       label: 'Apps grid',      icon: LayoutGrid },
    { key: 'navbar',          label: 'Navbar',         icon: Compass },
    { key: 'footer',          label: 'Footer',         icon: Footprints },
    { key: 'tour-page',       label: 'Tour page',      icon: Map },
    { key: 'voice-page',      label: 'Voice page',     icon: Mic },
    { key: 'grow-page',       label: 'Grow page',      icon: Sprout },
    { key: 'email-templates', label: 'Email templates', icon: Mail },
]

export default function SiteContentAdmin() {
    const [tab, setTab] = useState<MinistryContentKey>('apps-list')
    const [data, setData] = useState<Record<string, any>>({})
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)

    useEffect(() => {
        setLoading(true)
        ministryContentApi.get(tab)
            .then(r => {
                const fetched = r.content && Object.keys(r.content).length > 0 ? r.content : DEFAULTS[tab]
                setData({ ...DEFAULTS[tab], ...fetched })
            })
            .catch(() => setData(DEFAULTS[tab]))
            .finally(() => setLoading(false))
    }, [tab])

    useEffect(() => { if (msg) { const t = setTimeout(() => setMsg(null), 5000); return () => clearTimeout(t) } }, [msg])

    const save = async () => {
        setSaving(true)
        try {
            await ministryContentApi.update(tab, data)
            setMsg({ kind: 'ok', text: 'Saved. Public site updates within seconds.' })
        } catch (e) {
            setMsg({ kind: 'err', text: (e as Error).message })
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="p-4 sm:p-6 max-w-6xl mx-auto pb-32">
            <div className="flex items-start justify-between flex-wrap gap-4 mb-5">
                <div>
                    <h1 className="text-3xl font-black text-[#140152]">Site Chrome &amp; Pages</h1>
                    <p className="text-gray-500 mt-1 text-sm">Edit every link, label, and copy block on the public chrome — navbar, footer, /apps, /tour, /voice, /grow, and email templates.</p>
                </div>
                <button onClick={save} disabled={saving || loading} className="inline-flex items-center gap-2 bg-[#140152] hover:bg-[#1d0175] text-white font-bold px-5 py-3 rounded-xl disabled:opacity-50">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save {TABS.find(t => t.key === tab)?.label}
                </button>
            </div>

            {msg && (
                <div className={`mb-4 p-3 rounded-xl border flex items-start gap-2 ${msg.kind === 'ok' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                    {msg.kind === 'ok' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}<span className="text-sm">{msg.text}</span>
                </div>
            )}

            {/* Tabs */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                {TABS.map(t => {
                    const Icon = t.icon
                    return (
                        <button key={t.key} onClick={() => setTab(t.key)}
                            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-colors ${tab === t.key ? 'bg-[#140152] text-white shadow' : 'bg-white border border-gray-200 text-gray-600 hover:text-[#140152] hover:border-gray-300'}`}>
                            <Icon className="w-4 h-4" /> {t.label}
                        </button>
                    )
                })}
            </div>

            {loading ? (
                <div className="flex items-center justify-center min-h-[40vh]"><Loader2 className="w-10 h-10 animate-spin text-[#140152]" /></div>
            ) : (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 md:p-6">
                    {tab === 'apps-list'       && <AppsTab d={data} setD={setData} />}
                    {tab === 'navbar'          && <NavbarTab d={data} setD={setData} />}
                    {tab === 'footer'          && <FooterTab d={data} setD={setData} />}
                    {tab === 'tour-page'       && <TourTab d={data} setD={setData} />}
                    {tab === 'voice-page'      && <VoiceTab d={data} setD={setData} />}
                    {tab === 'grow-page'       && <GrowTab d={data} setD={setData} />}
                    {tab === 'email-templates' && <EmailsTab d={data} setD={setData} />}
                </div>
            )}

            {/* Sticky save bar */}
            <div className="sticky bottom-4 mt-8 z-30">
                <div className="bg-white border border-gray-200 shadow-lg rounded-2xl p-3 flex items-center justify-between">
                    <p className="text-xs text-gray-500 pl-2">Editing key <code className="bg-gray-100 px-1 py-0.5 rounded">{tab}</code>.</p>
                    <button onClick={save} disabled={saving || loading} className="inline-flex items-center gap-2 bg-[#140152] hover:bg-[#1d0175] text-white font-bold px-5 py-2.5 rounded-xl text-sm disabled:opacity-50">
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save changes
                    </button>
                </div>
            </div>
        </div>
    )
}

// ───────────────────────────────────────────────────────────────────────────
// Tab bodies
// ───────────────────────────────────────────────────────────────────────────

function AppsTab({ d, setD }: TabProps) {
    const apps = (d.apps ?? []) as any[]
    const setApps = (next: any[]) => setD({ ...d, apps: next })
    return (
        <div>
            <Header title="Cards on /apps" sub="Reorder, add, remove, and edit every app card. Set 'pulse' for a live indicator." />
            {apps.map((a, i) => (
                <ItemFrame key={i} index={i} total={apps.length}
                    onMove={(dir) => setApps(move(apps, i, dir))}
                    onDelete={() => setApps(apps.filter((_, j) => j !== i))}>
                    <div className="grid md:grid-cols-2 gap-3">
                        <Field label="Name" value={a.name || ''} onChange={v => setApps(apps.map((x, j) => j === i ? { ...x, name: v } : x))} />
                        <Field label="Tagline" value={a.tagline || ''} onChange={v => setApps(apps.map((x, j) => j === i ? { ...x, tagline: v } : x))} />
                        <Field label="URL" value={a.url || ''} onChange={v => setApps(apps.map((x, j) => j === i ? { ...x, url: v } : x))} />
                        <Field label="Category (Worship · Ministry · Learning · Devotional)" value={a.category || ''} onChange={v => setApps(apps.map((x, j) => j === i ? { ...x, category: v } : x))} />
                    </div>
                    <TextArea label="Description" value={a.description || ''} onChange={v => setApps(apps.map((x, j) => j === i ? { ...x, description: v } : x))} rows={2} />
                    <label className="inline-flex items-center gap-2 mt-2 text-xs">
                        <input type="checkbox" checked={!!a.pulse} onChange={e => setApps(apps.map((x, j) => j === i ? { ...x, pulse: e.target.checked } : x))} />
                        Show live (pulse) badge
                    </label>
                </ItemFrame>
            ))}
            <AddButton label="Add app" onClick={() => setApps([...apps, { name: 'New App', tagline: '', description: '', url: '', category: 'Ministry' }])} />
        </div>
    )
}

function NavbarTab({ d, setD }: TabProps) {
    const dropdowns: { label: string; items: { name?: string; href?: string }[] }[] = Array.isArray(d.dropdowns) ? d.dropdowns : []
    return (
        <div className="space-y-6">
            <Header title="Main navigation" sub="Top-level navbar links shown on every page (flat, no dropdown)." />
            <LinkRepeater value={d.main || []} onChange={v => setD({ ...d, main: v })} label="Link" />

            <Header title="Ministries dropdown" sub="Built-in Ministries menu." />
            <LinkRepeater value={d.ministries || []} onChange={v => setD({ ...d, ministries: v })} label="Ministry link" />

            <Header title="Education dropdown" sub="Built-in Education menu." />
            <LinkRepeater value={d.education || []} onChange={v => setD({ ...d, education: v })} label="Education link" />

            {/* Fully admin-defined dropdowns — new in this build. Add as many
                as you like; each renders on the desktop navbar between the
                built-in dropdowns and the CTA. */}
            <Header title="Custom dropdowns" sub="Group any items into your own dropdown. Set a label, then add / reorder items inside. Delete a dropdown to remove it entirely." />
            {dropdowns.map((dd, di) => (
                <div key={di} className="border border-gray-200 rounded-2xl p-4 mt-2">
                    <div className="flex items-center gap-2 mb-3">
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 w-16 shrink-0">Dropdown #{di + 1}</span>
                        <input
                            value={dd.label || ''}
                            onChange={e => {
                                const next = dropdowns.slice()
                                next[di] = { ...dd, label: e.target.value }
                                setD({ ...d, dropdowns: next })
                            }}
                            placeholder="Dropdown label (e.g. Resources, Connect, Worship)"
                            className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm"
                        />
                        <button
                            onClick={() => setD({ ...d, dropdowns: dropdowns.filter((_, j) => j !== di) })}
                            className="text-xs font-bold text-red-500 hover:text-red-700">
                            Delete
                        </button>
                    </div>
                    <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-gray-400 mb-2">Items</p>
                    <LinkRepeater
                        value={dd.items || []}
                        onChange={items => {
                            const next = dropdowns.slice()
                            next[di] = { ...dd, items }
                            setD({ ...d, dropdowns: next })
                        }}
                        label="Item"
                    />
                </div>
            ))}
            <AddButton
                label="Add dropdown"
                onClick={() => setD({ ...d, dropdowns: [...dropdowns, { label: 'New dropdown', items: [] }] })}
            />

            <Header title="CTA button" sub="Right-side gold button on the navbar." />
            <div className="grid md:grid-cols-2 gap-3">
                <Field label="Label" value={d.cta_label || ''} onChange={v => setD({ ...d, cta_label: v })} />
                <Field label="URL" value={d.cta_href || ''} onChange={v => setD({ ...d, cta_href: v })} />
            </div>
        </div>
    )
}

function FooterTab({ d, setD }: TabProps) {
    return (
        <div className="space-y-6">
            <Header title="Top CTA strip" sub="Sits above the columns." />
            <div className="grid md:grid-cols-2 gap-3">
                <Field label="Heading" value={d.cta_heading || ''} onChange={v => setD({ ...d, cta_heading: v })} />
                <Field label="Sub-heading" value={d.cta_sub || ''} onChange={v => setD({ ...d, cta_sub: v })} />
            </div>

            <Header title="Brand blurb" sub="" />
            <TextArea label="Short paragraph below the logo" value={d.brand_blurb || ''} onChange={v => setD({ ...d, brand_blurb: v })} rows={3} />

            <Header title="Social media" sub="Names supported: Facebook · Twitter · Instagram · YouTube." />
            <LinkRepeater value={d.socials || []} onChange={v => setD({ ...d, socials: v })} label="Social link" nameLabel="Platform" />

            <Header title="Connect column — primary 5" sub="Always visible." />
            <LinkRepeater value={d.connect_primary || []} onChange={v => setD({ ...d, connect_primary: v })} label="Connect link" />

            <Header title="Connect column — 'More' dropdown" sub="Hidden behind the toggle." />
            <LinkRepeater value={d.connect_more || []} onChange={v => setD({ ...d, connect_more: v })} label="More link" />

            <Header title="Ministries column" sub="" />
            <LinkRepeater value={d.ministries || []} onChange={v => setD({ ...d, ministries: v })} label="Ministry link" />

            <Header title="Contact info" sub="" />
            <div className="grid md:grid-cols-3 gap-3">
                <Field label="Address" value={d.address || ''} onChange={v => setD({ ...d, address: v })} />
                <Field label="Phone" value={d.phone || ''} onChange={v => setD({ ...d, phone: v })} />
                <Field label="Email" value={d.email || ''} onChange={v => setD({ ...d, email: v })} />
            </div>

            <Header title="Service times" sub="" />
            {(d.service_times || []).map((s: any, i: number) => (
                <ItemFrame key={i} index={i} total={(d.service_times || []).length}
                    onMove={dir => setD({ ...d, service_times: move(d.service_times, i, dir) })}
                    onDelete={() => setD({ ...d, service_times: d.service_times.filter((_: any, j: number) => j !== i) })}>
                    <div className="grid md:grid-cols-2 gap-3">
                        <Field label="Day" value={s.day || ''} onChange={v => setD({ ...d, service_times: d.service_times.map((x: any, j: number) => j === i ? { ...x, day: v } : x) })} />
                        <Field label="Time" value={s.time || ''} onChange={v => setD({ ...d, service_times: d.service_times.map((x: any, j: number) => j === i ? { ...x, time: v } : x) })} />
                    </div>
                </ItemFrame>
            ))}
            <AddButton label="Add service time" onClick={() => setD({ ...d, service_times: [...(d.service_times || []), { day: '', time: '' }] })} />

            <Header title="Copyright line" sub="Use {year} for the auto-updating year." />
            <Field label="Copyright" value={d.copyright || ''} onChange={v => setD({ ...d, copyright: v })} />
        </div>
    )
}

function TourTab({ d, setD }: TabProps) {
    return (
        <div className="space-y-4">
            <Header title="/tour copy" sub="Public route: letw.org/tour" />
            <Field label="Title" value={d.title || ''} onChange={v => setD({ ...d, title: v })} />
            <TextArea label="Intro paragraph" value={d.intro || ''} onChange={v => setD({ ...d, intro: v })} rows={3} />

            <Header title="Tour stops" sub="Each stop becomes a card on the page." />
            {(d.stops || []).map((s: any, i: number) => (
                <ItemFrame key={i} index={i} total={d.stops.length}
                    onMove={dir => setD({ ...d, stops: move(d.stops, i, dir) })}
                    onDelete={() => setD({ ...d, stops: d.stops.filter((_: any, j: number) => j !== i) })}>
                    <Field label="Stop name" value={s.name || ''} onChange={v => setD({ ...d, stops: d.stops.map((x: any, j: number) => j === i ? { ...x, name: v } : x) })} />
                    <TextArea label="Description" value={s.description || ''} onChange={v => setD({ ...d, stops: d.stops.map((x: any, j: number) => j === i ? { ...x, description: v } : x) })} rows={2} />
                </ItemFrame>
            ))}
            <AddButton label="Add stop" onClick={() => setD({ ...d, stops: [...(d.stops || []), { name: '', description: '' }] })} />
        </div>
    )
}

function VoiceTab({ d, setD }: TabProps) {
    return (
        <div className="space-y-4">
            <Header title="/voice copy" sub="Public route: letw.org/voice" />
            <Field label="Title" value={d.title || ''} onChange={v => setD({ ...d, title: v })} />
            <TextArea label="Intro" value={d.intro || ''} onChange={v => setD({ ...d, intro: v })} rows={3} />

            <Header title="Sample voice commands" sub="Shown as quotes." />
            {(d.commands || []).map((c: string, i: number) => (
                <ItemFrame key={i} index={i} total={d.commands.length}
                    onMove={dir => setD({ ...d, commands: move(d.commands, i, dir) })}
                    onDelete={() => setD({ ...d, commands: d.commands.filter((_: string, j: number) => j !== i) })}>
                    <Field label="Command" value={c} onChange={v => setD({ ...d, commands: d.commands.map((x: string, j: number) => j === i ? v : x) })} />
                </ItemFrame>
            ))}
            <AddButton label="Add command" onClick={() => setD({ ...d, commands: [...(d.commands || []), ''] })} />

            <TextArea label="Outro" value={d.outro || ''} onChange={v => setD({ ...d, outro: v })} rows={2} />
        </div>
    )
}

function GrowTab({ d, setD }: TabProps) {
    return (
        <div className="space-y-4">
            <Header title="/grow copy" sub="Public route: letw.org/grow" />
            <Field label="Title" value={d.title || ''} onChange={v => setD({ ...d, title: v })} />
            <TextArea label="Intro" value={d.intro || ''} onChange={v => setD({ ...d, intro: v })} rows={3} />

            <Header title="Habit presets" sub="Shown as quick-add options." />
            {(d.habit_presets || []).map((h: any, i: number) => (
                <ItemFrame key={i} index={i} total={d.habit_presets.length}
                    onMove={dir => setD({ ...d, habit_presets: move(d.habit_presets, i, dir) })}
                    onDelete={() => setD({ ...d, habit_presets: d.habit_presets.filter((_: any, j: number) => j !== i) })}>
                    <div className="grid md:grid-cols-2 gap-3">
                        <Field label="Habit name" value={h.name || ''} onChange={v => setD({ ...d, habit_presets: d.habit_presets.map((x: any, j: number) => j === i ? { ...x, name: v } : x) })} />
                        <Field label="Frequency (daily / weekly)" value={h.frequency || ''} onChange={v => setD({ ...d, habit_presets: d.habit_presets.map((x: any, j: number) => j === i ? { ...x, frequency: v } : x) })} />
                    </div>
                </ItemFrame>
            ))}
            <AddButton label="Add habit preset" onClick={() => setD({ ...d, habit_presets: [...(d.habit_presets || []), { name: '', frequency: 'daily' }] })} />
        </div>
    )
}

function EmailsTab({ d, setD }: TabProps) {
    const slots: { key: string; label: string; tokens: string }[] = [
        { key: 'welcome',           label: 'Welcome (new member)',  tokens: '{name}' },
        { key: 'password_reset',    label: 'Password reset',        tokens: '{name}, {reset_link}' },
        { key: 'prayer_received',   label: 'Prayer received',       tokens: '{name}' },
        { key: 'decision_followup', label: 'Decision follow-up',    tokens: '{name}' },
    ]
    return (
        <div className="space-y-6">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800">
                <strong>Note:</strong> templates save immediately, but the backend email senders need to be updated to read these keys (this is the next backend task). Until then, hard-coded versions still send.
            </div>
            {slots.map(s => {
                const t = d[s.key] || { subject: '', body: '' }
                return (
                    <div key={s.key} className="border border-gray-100 rounded-xl p-4">
                        <div className="flex items-baseline justify-between flex-wrap gap-2 mb-2">
                            <h3 className="font-black text-[#140152]">{s.label}</h3>
                            <p className="text-[11px] text-gray-400">Placeholders: <code className="bg-gray-100 px-1 rounded">{s.tokens}</code></p>
                        </div>
                        <Field label="Subject" value={t.subject || ''} onChange={v => setD({ ...d, [s.key]: { ...t, subject: v } })} />
                        <TextArea label="Body" value={t.body || ''} onChange={v => setD({ ...d, [s.key]: { ...t, body: v } })} rows={8} />
                    </div>
                )
            })}
        </div>
    )
}

// ───────────────────────────────────────────────────────────────────────────
// Shared little widgets
// ───────────────────────────────────────────────────────────────────────────

interface TabProps { d: Record<string, any>; setD: (n: Record<string, any>) => void }

function move<T>(arr: T[], i: number, dir: 'up' | 'down'): T[] {
    const j = dir === 'up' ? i - 1 : i + 1
    if (j < 0 || j >= arr.length) return arr
    const next = arr.slice()
    ;[next[i], next[j]] = [next[j], next[i]]
    return next
}

function Header({ title, sub }: { title: string; sub: string }) {
    return (
        <div className="mb-3">
            <h2 className="font-black text-[#140152] text-sm uppercase tracking-widest">{title}</h2>
            {sub && <p className="text-xs text-gray-500 mt-0.5">{sub}</p>}
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
        <div className="mt-2">
            <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 mb-1.5">{label}</label>
            <textarea value={value} onChange={e => onChange(e.target.value)} rows={rows} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm font-mono resize-y" />
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

function LinkRepeater({ value, onChange, label, nameLabel = 'Label' }: { value: { name?: string; href?: string }[]; onChange: (n: { name?: string; href?: string }[]) => void; label: string; nameLabel?: string }) {
    return (
        <>
            {value.map((l, i) => (
                <ItemFrame key={i} index={i} total={value.length}
                    onMove={dir => onChange(move(value, i, dir))}
                    onDelete={() => onChange(value.filter((_, j) => j !== i))}>
                    <div className="grid md:grid-cols-2 gap-3">
                        <Field label={nameLabel} value={l.name || ''} onChange={v => onChange(value.map((x, j) => j === i ? { ...x, name: v } : x))} />
                        <Field label="URL" value={l.href || ''} onChange={v => onChange(value.map((x, j) => j === i ? { ...x, href: v } : x))} />
                    </div>
                </ItemFrame>
            ))}
            <AddButton label={`Add ${label.toLowerCase()}`} onClick={() => onChange([...value, { name: '', href: '' }])} />
        </>
    )
}
