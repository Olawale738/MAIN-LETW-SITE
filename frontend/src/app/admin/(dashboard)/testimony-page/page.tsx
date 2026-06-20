'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Loader2, Save, MessageCircle, AlertCircle, CheckCircle, ExternalLink, Image as ImageIcon } from 'lucide-react'
import { ministryContentApi } from '@/lib/api'

interface Content {
    hero_image: string
    hero_alt: string
    share_eyebrow: string
    share_title: string
    share_body: string
    name_label: string
    email_label: string
    testimony_label: string
    submit_button: string
    submitting_text: string
    success_title: string
    success_body: string
    success_again: string
    wall_eyebrow: string
    wall_title: string
    wall_subtitle: string
    empty_text: string
}

const DEFAULTS: Content = {
    hero_image: '/Testimonies.png',
    hero_alt: 'Testimonies',
    share_eyebrow: 'Testify',
    share_title: 'Share Your Story',
    share_body: 'We would love to hear what GOD has done in your life. Every testimony submitted is reviewed by our team and, once approved, joins the wall of praise below to encourage the body of Christ across the world.',
    name_label: 'Name',
    email_label: 'Email (optional)',
    testimony_label: 'Testimony',
    submit_button: 'Submit Testimony',
    submitting_text: 'Submitting…',
    success_title: 'Thank you!',
    success_body: 'Your testimony has been received. An admin will review and publish it shortly. Glory to God.',
    success_again: 'Share another',
    wall_eyebrow: 'Faith Builders',
    wall_title: 'Wall of Testimonies',
    wall_subtitle: 'What the Lord has done in our midst — salvations, healings, restoration, breakthroughs.',
    empty_text: 'No testimonies yet. Be the first to share!',
}

export default function AdminTestimonyPage() {
    const [c, setC] = useState<Content>(DEFAULTS)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)

    useEffect(() => {
        ministryContentApi.get('testimony-page')
            .then(r => {
                const x = (r.content || {}) as Partial<Content>
                setC({ ...DEFAULTS, ...x })
            })
            .catch(() => { /* keep defaults */ })
            .finally(() => setLoading(false))
    }, [])

    useEffect(() => { if (msg) { const t = setTimeout(() => setMsg(null), 5000); return () => clearTimeout(t) } }, [msg])

    const save = async () => {
        setSaving(true)
        try {
            await ministryContentApi.update('testimony-page', c as unknown as Record<string, unknown>)
            setMsg({ kind: 'ok', text: 'Saved. Visit /testimony to see changes.' })
        } catch (e) { setMsg({ kind: 'err', text: (e as Error).message }) }
        finally { setSaving(false) }
    }

    const reset = () => {
        if (!confirm('Reset every field on this page back to factory defaults?')) return
        setC(DEFAULTS)
    }

    const set = (key: keyof Content) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        setC(prev => ({ ...prev, [key]: e.target.value }))

    if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-10 h-10 animate-spin text-[#140152]" /></div>

    return (
        <div className="p-4 sm:p-6 max-w-5xl mx-auto pb-32">
            <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
                <div>
                    <h1 className="text-3xl font-black text-[#140152] flex items-center gap-3"><MessageCircle className="w-7 h-7 text-[#f5bb00]" /> Testimony Page</h1>
                    <p className="text-gray-500 mt-1 text-sm">Edit every section of <Link href="/testimony" target="_blank" className="text-[#140152] font-bold hover:underline inline-flex items-center gap-1">/testimony <ExternalLink className="w-3 h-3" /></Link>. Public submissions land on <Link href="/admin/decisions" className="text-[#140152] font-bold hover:underline">Kingdom Outcomes</Link> for approval.</p>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={reset} className="px-4 py-3 border border-gray-200 text-gray-600 hover:text-[#140152] hover:border-gray-300 font-bold rounded-xl text-sm">Reset to defaults</button>
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

            <Section title="1 · Hero banner" subtitle="The big image at the top of the page.">
                <div className="grid md:grid-cols-2 gap-4">
                    <FieldText label="Hero image URL" icon={<ImageIcon className="w-4 h-4 text-gray-400" />} value={c.hero_image} onChange={set('hero_image')} placeholder="/Testimonies.png" />
                    <FieldText label="Image alt text (accessibility)" value={c.hero_alt} onChange={set('hero_alt')} placeholder="Testimonies" />
                </div>
            </Section>

            <Section title="2 · Share Your Story (left column)" subtitle="The pitch that invites visitors to testify.">
                <div className="grid md:grid-cols-2 gap-4">
                    <FieldText label="Eyebrow" value={c.share_eyebrow} onChange={set('share_eyebrow')} placeholder="Testify" />
                    <FieldText label="Title" value={c.share_title} onChange={set('share_title')} placeholder="Share Your Story" />
                </div>
                <FieldTextarea label="Body" rows={4} value={c.share_body} onChange={set('share_body')} placeholder="We would love to hear what GOD has done…" />
            </Section>

            <Section title="3 · Form labels" subtitle="What each input says.">
                <div className="grid md:grid-cols-3 gap-4">
                    <FieldText label="Name label" value={c.name_label} onChange={set('name_label')} />
                    <FieldText label="Email label" value={c.email_label} onChange={set('email_label')} />
                    <FieldText label="Testimony label" value={c.testimony_label} onChange={set('testimony_label')} />
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                    <FieldText label="Submit button text" value={c.submit_button} onChange={set('submit_button')} />
                    <FieldText label="Submitting text" value={c.submitting_text} onChange={set('submitting_text')} placeholder="Submitting…" />
                </div>
            </Section>

            <Section title="4 · Thank-you screen" subtitle="Shown after a visitor successfully submits.">
                <div className="grid md:grid-cols-2 gap-4">
                    <FieldText label="Success title" value={c.success_title} onChange={set('success_title')} placeholder="Thank you!" />
                    <FieldText label="'Share another' button" value={c.success_again} onChange={set('success_again')} placeholder="Share another" />
                </div>
                <FieldTextarea label="Success body" rows={3} value={c.success_body} onChange={set('success_body')} placeholder="Your testimony has been received…" />
            </Section>

            <Section title="5 · Wall of Testimonies" subtitle="The header of the public wall below the form.">
                <div className="grid md:grid-cols-2 gap-4">
                    <FieldText label="Eyebrow" value={c.wall_eyebrow} onChange={set('wall_eyebrow')} placeholder="Faith Builders" />
                    <FieldText label="Title" value={c.wall_title} onChange={set('wall_title')} placeholder="Wall of Testimonies" />
                </div>
                <FieldTextarea label="Subtitle" rows={2} value={c.wall_subtitle} onChange={set('wall_subtitle')} placeholder="What the Lord has done in our midst…" />
                <FieldText label="Empty state message" value={c.empty_text} onChange={set('empty_text')} placeholder="No testimonies yet. Be the first to share!" />
            </Section>

            {/* Sticky save bar on mobile/long pages */}
            <div className="sticky bottom-4 mt-8 z-30">
                <div className="bg-white border border-gray-200 shadow-lg rounded-2xl p-3 flex items-center justify-between">
                    <p className="text-xs text-gray-500 pl-2">All changes save together. Reset never deletes your testimonies.</p>
                    <button onClick={save} disabled={saving} className="inline-flex items-center gap-2 bg-[#140152] hover:bg-[#1d0175] text-white font-bold px-5 py-2.5 rounded-xl text-sm disabled:opacity-50">
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save changes
                    </button>
                </div>
            </div>
        </div>
    )
}

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 md:p-6 mb-5">
            <div className="mb-4">
                <h2 className="font-black text-[#140152]">{title}</h2>
                {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
            </div>
            <div className="space-y-4">{children}</div>
        </div>
    )
}

function FieldText({ label, value, onChange, placeholder, icon }: { label: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; placeholder?: string; icon?: React.ReactNode }) {
    return (
        <div>
            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 block mb-1.5">{label}</label>
            <div className="relative">
                {icon && <span className="absolute left-3 top-1/2 -translate-y-1/2">{icon}</span>}
                <input value={value} onChange={onChange} placeholder={placeholder}
                    className={`w-full border border-gray-200 rounded-lg ${icon ? 'pl-10' : 'pl-3'} pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#140152]/20 focus:border-[#140152]/30`} />
            </div>
        </div>
    )
}

function FieldTextarea({ label, value, onChange, placeholder, rows }: { label: string; value: string; onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void; placeholder?: string; rows?: number }) {
    return (
        <div>
            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 block mb-1.5">{label}</label>
            <textarea value={value} onChange={onChange} placeholder={placeholder} rows={rows || 3}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#140152]/20 focus:border-[#140152]/30 resize-y" />
        </div>
    )
}
