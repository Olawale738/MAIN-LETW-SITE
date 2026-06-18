'use client'
import { useEffect, useState } from 'react'
import { Loader2, Plus, Save, Trash2, BookOpen, AlertCircle, CheckCircle, ArrowUp, ArrowDown } from 'lucide-react'
import Link from 'next/link'
import { ministryContentApi } from '@/lib/api'

const DEFAULTS = {
    eyebrow: 'What We Believe',
    title: 'Statement of Faith',
    subtitle: 'These are the core convictions on which Light Encounter Tabernacle stands. They are the foundation of how we worship, teach, and live.',
    articles: [
        { title: 'The Bible', body: 'We believe the Bible — the 66 books of the Old and New Testaments — is the inspired, infallible, and authoritative Word of God…' },
        { title: 'The Trinity', body: 'We believe in one eternal God, existing in three persons — Father, Son, and Holy Spirit…' },
    ],
}

interface Article { title: string; body: string }

export default function AdminStatementOfFaithPage() {
    const [c, setC] = useState(DEFAULTS)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)

    useEffect(() => {
        ministryContentApi.get('statement-of-faith').then((r) => {
            const x = r.content || {}
            setC({
                eyebrow: x.eyebrow || DEFAULTS.eyebrow,
                title: x.title || DEFAULTS.title,
                subtitle: x.subtitle || DEFAULTS.subtitle,
                articles: Array.isArray(x.articles) && x.articles.length ? x.articles : DEFAULTS.articles,
            })
        }).catch(() => {}).finally(() => setLoading(false))
    }, [])
    useEffect(() => { if (msg) { const t = setTimeout(() => setMsg(null), 5000); return () => clearTimeout(t) } }, [msg])

    const save = async () => {
        setSaving(true)
        try { await ministryContentApi.update('statement-of-faith', c); setMsg({ kind: 'ok', text: 'Saved. Visit /about to see changes.' }) }
        catch (e) { setMsg({ kind: 'err', text: (e as Error).message }) }
        finally { setSaving(false) }
    }

    const setArt = (i: number, k: keyof Article, v: string) => {
        const a = [...c.articles]; a[i] = { ...a[i], [k]: v }; setC({ ...c, articles: a })
    }
    const addArt = () => setC({ ...c, articles: [...c.articles, { title: 'New Article', body: '' }] })
    const removeArt = (i: number) => setC({ ...c, articles: c.articles.filter((_, idx) => idx !== i) })
    const move = (i: number, dir: -1 | 1) => {
        const j = i + dir; if (j < 0 || j >= c.articles.length) return
        const a = [...c.articles];[a[i], a[j]] = [a[j], a[i]]; setC({ ...c, articles: a })
    }

    if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-10 h-10 animate-spin text-[#140152]" /></div>

    return (
        <div className="p-4 sm:p-6 max-w-5xl mx-auto pb-32">
            <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
                <div>
                    <h1 className="text-3xl font-black text-[#140152] flex items-center gap-3"><BookOpen className="w-7 h-7 text-[#f5bb00]" /> Statement of Faith</h1>
                    <p className="text-gray-500 mt-1 text-sm">Edit the doctrinal accordion on <Link href="/about" target="_blank" className="text-[#140152] font-bold hover:underline">/about</Link>. Articles render in the order shown.</p>
                </div>
                <button onClick={save} disabled={saving} className="inline-flex items-center gap-2 bg-[#140152] hover:bg-[#1d0175] text-white font-bold px-5 py-3 rounded-xl disabled:opacity-50">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save
                </button>
            </div>

            {msg && <div className={`mb-4 p-3 rounded-xl border flex items-start gap-2 ${msg.kind === 'ok' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                {msg.kind === 'ok' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}<span className="text-sm">{msg.text}</span>
            </div>}

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6 mb-5">
                <h2 className="text-lg font-bold text-[#140152] mb-4">Section Heading</h2>
                <div className="space-y-3">
                    <div>
                        <label className="text-xs font-bold uppercase text-gray-500 block mb-1">Eyebrow</label>
                        <input value={c.eyebrow} onChange={e => setC({ ...c, eyebrow: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                    </div>
                    <div>
                        <label className="text-xs font-bold uppercase text-gray-500 block mb-1">Title</label>
                        <input value={c.title} onChange={e => setC({ ...c, title: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                    </div>
                    <div>
                        <label className="text-xs font-bold uppercase text-gray-500 block mb-1">Subtitle</label>
                        <textarea value={c.subtitle} onChange={e => setC({ ...c, subtitle: e.target.value })} rows={2} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-[#140152]">Articles of Faith ({c.articles.length})</h2>
                    <button onClick={addArt} className="inline-flex items-center gap-1.5 text-sm font-bold text-[#140152] hover:underline"><Plus className="w-4 h-4" /> Add Article</button>
                </div>
                <div className="space-y-3">
                    {c.articles.map((a, i) => (
                        <div key={i} className="border border-gray-100 rounded-xl p-4 bg-gray-50">
                            <div className="flex items-center justify-between gap-2 mb-3">
                                <div className="flex items-center gap-2">
                                    <span className="w-7 h-7 rounded-lg bg-[#f5bb00]/15 text-[#140152] flex items-center justify-center text-xs font-black">{i + 1}</span>
                                    <button onClick={() => move(i, -1)} disabled={i === 0} className="p-1 text-gray-400 hover:text-[#140152] disabled:opacity-30"><ArrowUp className="w-4 h-4" /></button>
                                    <button onClick={() => move(i, 1)} disabled={i === c.articles.length - 1} className="p-1 text-gray-400 hover:text-[#140152] disabled:opacity-30"><ArrowDown className="w-4 h-4" /></button>
                                </div>
                                <button onClick={() => removeArt(i)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-100 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                            </div>
                            <input value={a.title} onChange={e => setArt(i, 'title', e.target.value)} placeholder="Article title (e.g. The Bible)" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-2 font-bold" />
                            <textarea value={a.body} onChange={e => setArt(i, 'body', e.target.value)} rows={4} placeholder="Body text… use line breaks to separate paragraphs. You can include scripture refs inline." className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                        </div>
                    ))}
                </div>
            </div>

            <div className="mt-8 flex justify-end">
                <button onClick={save} disabled={saving} className="inline-flex items-center gap-2 bg-[#140152] hover:bg-[#1d0175] text-white font-bold px-6 py-3 rounded-xl disabled:opacity-50">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save All
                </button>
            </div>
        </div>
    )
}
