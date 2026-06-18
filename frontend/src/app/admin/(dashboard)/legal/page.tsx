'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Loader2, Save, AlertCircle, CheckCircle, Scale, ShieldCheck, ExternalLink } from 'lucide-react'
import { ministryContentApi } from '@/lib/api'
import RichTextEditor from '@/components/ui/rich-text-editor'

type Doc = { title: string; last_updated: string; body_html: string }
const KEYS: Array<{ key: 'privacy-policy' | 'terms-of-service'; label: string; href: string; icon: any }> = [
    { key: 'privacy-policy', label: 'Privacy Policy', href: '/privacy', icon: ShieldCheck },
    { key: 'terms-of-service', label: 'Terms of Service', href: '/terms', icon: Scale },
]

const EMPTY: Doc = { title: '', last_updated: new Date().toISOString().slice(0, 10), body_html: '' }

export default function AdminLegalPage() {
    const [active, setActive] = useState<typeof KEYS[number]['key']>('privacy-policy')
    const [docs, setDocs] = useState<Record<string, Doc>>({})
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)

    useEffect(() => {
        Promise.all(KEYS.map(k => ministryContentApi.get(k.key)
            .then(r => [k.key, { ...EMPTY, ...(r.content || {}) }] as const)
            .catch(() => [k.key, EMPTY] as const)))
            .then(rows => setDocs(Object.fromEntries(rows)))
            .finally(() => setLoading(false))
    }, [])
    useEffect(() => { if (msg) { const t = setTimeout(() => setMsg(null), 5000); return () => clearTimeout(t) } }, [msg])

    const current = docs[active] || EMPTY
    const update = (patch: Partial<Doc>) => setDocs({ ...docs, [active]: { ...current, ...patch } })

    const save = async () => {
        setSaving(true)
        try {
            await ministryContentApi.update(active, { ...current, last_updated: new Date().toISOString().slice(0, 10) })
            setMsg({ kind: 'ok', text: 'Saved. Public page updates immediately.' })
        } catch (e) { setMsg({ kind: 'err', text: (e as Error).message }) }
        finally { setSaving(false) }
    }

    if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-10 h-10 animate-spin text-[#140152]" /></div>

    return (
        <div className="p-4 sm:p-6 max-w-5xl mx-auto pb-32">
            <div className="mb-6">
                <h1 className="text-3xl font-black text-[#140152] flex items-center gap-3"><Scale className="w-7 h-7 text-[#f5bb00]" /> Legal Pages</h1>
                <p className="text-gray-500 mt-1 text-sm">Edit Privacy Policy and Terms of Service. Both ship with solid defaults — tweak as needed for your jurisdiction.</p>
            </div>

            {msg && <div className={`mb-4 p-3 rounded-xl border flex items-start gap-2 ${msg.kind === 'ok' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                {msg.kind === 'ok' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}<span className="text-sm">{msg.text}</span>
            </div>}

            <div className="flex gap-2 mb-4">
                {KEYS.map(k => {
                    const Icon = k.icon
                    return (
                        <button key={k.key} onClick={() => setActive(k.key)} className={`px-4 py-2.5 text-sm font-bold rounded-lg flex items-center gap-2 ${active === k.key ? 'bg-[#140152] text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                            <Icon className="w-4 h-4" /> {k.label}
                        </button>
                    )
                })}
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                <div className="flex items-start justify-between mb-3 gap-2 flex-wrap">
                    <Link href={KEYS.find(k => k.key === active)!.href} target="_blank" className="text-xs text-gray-500 hover:text-[#140152] inline-flex items-center gap-1"><ExternalLink className="w-3.5 h-3.5" /> View public page</Link>
                    <span className="text-xs text-gray-400">Last updated will refresh on save</span>
                </div>
                <label className="text-xs font-bold uppercase text-gray-500 block mb-1">Page Title</label>
                <input value={current.title} onChange={e => update({ title: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-4 font-bold" />
                <label className="text-xs font-bold uppercase text-gray-500 block mb-1">Body</label>
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                    <RichTextEditor content={current.body_html} onChange={(html) => update({ body_html: html })} />
                </div>
                <div className="mt-4 flex justify-end">
                    <button onClick={save} disabled={saving} className="bg-[#140152] hover:bg-[#1d0175] text-white font-bold px-6 py-2.5 rounded-xl inline-flex items-center gap-2 disabled:opacity-50">
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save
                    </button>
                </div>
            </div>
        </div>
    )
}
