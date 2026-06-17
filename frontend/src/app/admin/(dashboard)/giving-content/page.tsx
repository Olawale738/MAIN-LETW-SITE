'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Loader2, Save, AlertCircle, CheckCircle, HandHeart, ExternalLink } from 'lucide-react'
import { ministryContentApi } from '@/lib/api'

const DEFAULTS = {
    hero: {
        eyebrow: 'Secure Giving',
        title_a: 'Sow Into',
        title_b: 'Good Ground',
        scripture: '"Give, and it will be given to you. A good measure, pressed down, shaken together and running over, will be poured into your lap."',
        scripture_ref: '— Luke 6:38',
        footer_name: 'Join Our Givers Family',
        footer_subtitle: 'Hearts sown into the vision',
    },
    tabs: { card: 'Card', bank: 'Transfer', intl: 'International', paypal: 'Paypal' },
    bank_naira: { heading: 'Naira Account', bank_label: 'Bank', bank_value: 'Providus Bank', account_label: 'Account', account_value: 'Light Encounter Tabernacle', number: '1308078805' },
    bank_usd: { heading: 'Domiciliary (USD)', bank_label: 'Bank', bank_value: 'Zenith Bank', account_label: '', account_value: '', number: '' },
    paypal: { heading: 'PayPal', body: 'Send your gift via PayPal to our church account.', footer: 'Transactions are inevitable and non-reversible.' },
}

export default function AdminGivingContentPage() {
    const [c, setC] = useState<typeof DEFAULTS>(DEFAULTS)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)

    useEffect(() => {
        ministryContentApi.get('giving').then((r) => {
            const x = r.content || {}
            setC({
                hero: { ...DEFAULTS.hero, ...(x.hero || {}) },
                tabs: { ...DEFAULTS.tabs, ...(x.tabs || {}) },
                bank_naira: { ...DEFAULTS.bank_naira, ...(x.bank_naira || {}) },
                bank_usd: { ...DEFAULTS.bank_usd, ...(x.bank_usd || {}) },
                paypal: { ...DEFAULTS.paypal, ...(x.paypal || {}) },
            })
        }).catch(() => {}).finally(() => setLoading(false))
    }, [])
    useEffect(() => { if (msg) { const t = setTimeout(() => setMsg(null), 5000); return () => clearTimeout(t) } }, [msg])

    const save = async () => {
        setSaving(true)
        try { await ministryContentApi.update('giving', c); setMsg({ kind: 'ok', text: 'Saved. Visit /giving to see changes.' }) }
        catch (e) { setMsg({ kind: 'err', text: (e as Error).message }) }
        finally { setSaving(false) }
    }

    const setHero = (k: keyof typeof c.hero, v: string) => setC({ ...c, hero: { ...c.hero, [k]: v } })
    const setTab = (k: keyof typeof c.tabs, v: string) => setC({ ...c, tabs: { ...c.tabs, [k]: v } })
    const setNaira = (k: keyof typeof c.bank_naira, v: string) => setC({ ...c, bank_naira: { ...c.bank_naira, [k]: v } })
    const setUsd = (k: keyof typeof c.bank_usd, v: string) => setC({ ...c, bank_usd: { ...c.bank_usd, [k]: v } })
    const setPay = (k: keyof typeof c.paypal, v: string) => setC({ ...c, paypal: { ...c.paypal, [k]: v } })

    if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-10 h-10 animate-spin text-[#140152]" /></div>

    return (
        <div className="p-4 sm:p-6 max-w-5xl mx-auto pb-32">
            <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
                <div>
                    <h1 className="text-3xl font-black text-[#140152] flex items-center gap-3"><HandHeart className="w-7 h-7 text-[#f5bb00]" /> Giving Page Content</h1>
                    <p className="text-gray-500 mt-1 text-sm">Every word on <Link href="/giving" target="_blank" className="text-[#140152] font-bold inline-flex items-center gap-1 hover:underline">/giving <ExternalLink className="w-3 h-3" /></Link>. Payment provider keys are managed at <Link href="/admin/payments" className="text-[#140152] font-bold hover:underline">/admin/payments</Link>.</p>
                </div>
                <button onClick={save} disabled={saving} className="inline-flex items-center gap-2 bg-[#140152] hover:bg-[#1d0175] text-white font-bold px-5 py-3 rounded-xl disabled:opacity-50">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save
                </button>
            </div>

            {msg && <div className={`mb-4 p-3 rounded-xl border flex items-start gap-2 ${msg.kind === 'ok' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                {msg.kind === 'ok' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}<span className="text-sm">{msg.text}</span>
            </div>}

            <Section title="Hero (left column of the page)">
                <Field label="Eyebrow chip" v={c.hero.eyebrow} on={v => setHero('eyebrow', v)} />
                <div className="grid md:grid-cols-2 gap-3">
                    <Field label="Title line 1" v={c.hero.title_a} on={v => setHero('title_a', v)} />
                    <Field label="Title line 2 (gold gradient)" v={c.hero.title_b} on={v => setHero('title_b', v)} />
                </div>
                <TextArea label="Scripture quote" v={c.hero.scripture} on={v => setHero('scripture', v)} />
                <Field label="Scripture reference" v={c.hero.scripture_ref} on={v => setHero('scripture_ref', v)} />
                <div className="grid md:grid-cols-2 gap-3">
                    <Field label="Giver community name" v={c.hero.footer_name} on={v => setHero('footer_name', v)} />
                    <Field label="Giver community subtitle" v={c.hero.footer_subtitle} on={v => setHero('footer_subtitle', v)} />
                </div>
            </Section>

            <Section title="Tab Labels">
                <div className="grid md:grid-cols-4 gap-3">
                    <Field label="Card tab" v={c.tabs.card} on={v => setTab('card', v)} />
                    <Field label="Bank tab" v={c.tabs.bank} on={v => setTab('bank', v)} />
                    <Field label="International tab" v={c.tabs.intl} on={v => setTab('intl', v)} />
                    <Field label="PayPal tab" v={c.tabs.paypal} on={v => setTab('paypal', v)} />
                </div>
            </Section>

            <Section title="Bank Transfer — Naira Account">
                <Field label="Heading" v={c.bank_naira.heading} on={v => setNaira('heading', v)} />
                <div className="grid md:grid-cols-2 gap-3">
                    <Field label="Bank label" v={c.bank_naira.bank_label} on={v => setNaira('bank_label', v)} />
                    <Field label="Bank name" v={c.bank_naira.bank_value} on={v => setNaira('bank_value', v)} />
                    <Field label="Account label" v={c.bank_naira.account_label} on={v => setNaira('account_label', v)} />
                    <Field label="Account name" v={c.bank_naira.account_value} on={v => setNaira('account_value', v)} />
                </div>
                <Field label="Account number" v={c.bank_naira.number} on={v => setNaira('number', v)} />
            </Section>

            <Section title="Bank Transfer — Domiciliary (USD) — leave blank fields to hide">
                <Field label="Heading" v={c.bank_usd.heading} on={v => setUsd('heading', v)} />
                <div className="grid md:grid-cols-2 gap-3">
                    <Field label="Bank label" v={c.bank_usd.bank_label} on={v => setUsd('bank_label', v)} />
                    <Field label="Bank name" v={c.bank_usd.bank_value} on={v => setUsd('bank_value', v)} />
                    <Field label="Account label" v={c.bank_usd.account_label} on={v => setUsd('account_label', v)} />
                    <Field label="Account name" v={c.bank_usd.account_value} on={v => setUsd('account_value', v)} />
                </div>
                <Field label="Account number" v={c.bank_usd.number} on={v => setUsd('number', v)} />
            </Section>

            <Section title="PayPal Tab">
                <Field label="Heading" v={c.paypal.heading} on={v => setPay('heading', v)} />
                <TextArea label="Body" v={c.paypal.body} on={v => setPay('body', v)} />
                <Field label="Footer note" v={c.paypal.footer} on={v => setPay('footer', v)} />
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
function Field({ label, v, on }: { label: string; v: string; on: (v: string) => void }) {
    return (
        <div>
            <label className="text-xs font-bold uppercase text-gray-500 block mb-1">{label}</label>
            <input value={v || ''} onChange={e => on(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
        </div>
    )
}
function TextArea({ label, v, on }: { label: string; v: string; on: (v: string) => void }) {
    return (
        <div>
            <label className="text-xs font-bold uppercase text-gray-500 block mb-1">{label}</label>
            <textarea value={v || ''} onChange={e => on(e.target.value)} rows={3} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
        </div>
    )
}
