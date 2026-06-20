'use client'
import { useEffect, useState } from 'react'
import { Loader2, Sparkles, Plus, Trash2, AlertCircle, CheckCircle, Eye, EyeOff, MessageCircle, Heart } from 'lucide-react'
import { decisionsApi, type DecisionEntry, type DecisionKind, type DecisionCounts } from '@/lib/api'

const KINDS: DecisionKind[] = ['salvation', 'baptism', 'healing', 'marriage_restored', 'prodigal_returned', 'deliverance', 'rededication', 'dedication', 'calling', 'other']

export default function AdminDecisionsPage() {
    const [decisions, setDecisions] = useState<DecisionEntry[]>([])
    const [counts, setCounts] = useState<DecisionCounts | null>(null)
    const [loading, setLoading] = useState(true)
    const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)
    const [form, setForm] = useState<{ kind: DecisionKind; person_name: string; location: string; testimony: string; decided_on: string; is_public: boolean }>({
        kind: 'salvation', person_name: '', location: '', testimony: '', decided_on: new Date().toISOString().slice(0, 10), is_public: true,
    })

    const load = async () => {
        try {
            const [d, c] = await Promise.all([decisionsApi.adminAll(), decisionsApi.counts(new Date().getFullYear())])
            setDecisions(d); setCounts(c)
        } catch (e) { setMsg({ kind: 'err', text: (e as Error).message }) }
        finally { setLoading(false) }
    }
    useEffect(() => { load() }, [])
    useEffect(() => { if (msg) { const t = setTimeout(() => setMsg(null), 5000); return () => clearTimeout(t) } }, [msg])

    const submit = async () => {
        if (!form.person_name.trim()) return
        try {
            await decisionsApi.submit({ ...form, decided_on: form.decided_on })
            setMsg({ kind: 'ok', text: 'Decision recorded. Glory to God.' })
            setForm({ ...form, person_name: '', location: '', testimony: '' })
            await load()
        } catch (e) { setMsg({ kind: 'err', text: (e as Error).message }) }
    }

    const remove = async (id: string) => {
        if (!confirm('Delete this decision?')) return
        try { await decisionsApi.adminDelete(id); await load() }
        catch (e) { setMsg({ kind: 'err', text: (e as Error).message }) }
    }

    const toggleTestimony = async (d: DecisionEntry) => {
        if (!d.testimony || !d.testimony.trim()) { setMsg({ kind: 'err', text: 'Add a testimony first before showing on /testimony.' }); return }
        try {
            await decisionsApi.adminUpdate(d.id, {
                kind: d.kind, person_name: d.person_name,
                location: d.location || undefined, testimony: d.testimony || undefined,
                decided_on: d.decided_on, is_public: d.is_public,
                show_in_testimony: !d.show_in_testimony,
            }, d.is_verified)
            await load()
        } catch (e) { setMsg({ kind: 'err', text: (e as Error).message }) }
    }

    if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-10 h-10 animate-spin text-[#140152]" /></div>

    return (
        <div className="p-4 sm:p-6 max-w-6xl mx-auto pb-20">
            <div className="mb-6">
                <h1 className="text-3xl font-black text-[#140152] flex items-center gap-3"><Sparkles className="w-7 h-7 text-[#f5bb00]" /> Kingdom Outcomes</h1>
                <p className="text-gray-500 mt-1 text-sm">Record every salvation, baptism, healing, and breakthrough. Public counter at <a href="/outcomes" target="_blank" className="text-[#140152] font-bold hover:underline">/outcomes</a>.</p>
            </div>

            {msg && <div className={`mb-4 p-3 rounded-xl border flex items-start gap-2 ${msg.kind === 'ok' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                {msg.kind === 'ok' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}<span className="text-sm">{msg.text}</span>
            </div>}

            {counts && (
                <div className="bg-gradient-to-br from-[#140152] to-[#1a0270] text-white rounded-2xl p-5 mb-6">
                    <p className="text-xs uppercase tracking-wider text-[#f5bb00] font-bold mb-1">{new Date().getFullYear()} totals</p>
                    <p className="text-4xl font-black">{counts.total.toLocaleString()}</p>
                    <p className="text-xs text-white/70 mt-2">{Object.entries(counts.by_kind).filter(([_, n]) => n > 0).map(([k, n]) => `${k}: ${n}`).join(' · ') || 'No decisions yet'}</p>
                </div>
            )}

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6">
                <h2 className="text-lg font-bold text-[#140152] mb-4 flex items-center gap-2"><Plus className="w-5 h-5" /> Record a decision</h2>
                <div className="grid md:grid-cols-2 gap-3">
                    <div>
                        <label className="text-xs font-bold uppercase text-gray-500 block mb-1">Kind</label>
                        <select value={form.kind} onChange={e => setForm({ ...form, kind: e.target.value as DecisionKind })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
                            {KINDS.map(k => <option key={k} value={k}>{k.replace('_', ' ')}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-bold uppercase text-gray-500 block mb-1">Person name</label>
                        <input value={form.person_name} onChange={e => setForm({ ...form, person_name: e.target.value })} placeholder="Anonymous if confidential" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                    </div>
                    <div>
                        <label className="text-xs font-bold uppercase text-gray-500 block mb-1">Location (optional)</label>
                        <input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="e.g. Sunday service" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                    </div>
                    <div>
                        <label className="text-xs font-bold uppercase text-gray-500 block mb-1">Decided on</label>
                        <input type="date" value={form.decided_on} onChange={e => setForm({ ...form, decided_on: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                    </div>
                </div>
                <label className="text-xs font-bold uppercase text-gray-500 block mb-1 mt-3">Testimony (optional, public)</label>
                <textarea value={form.testimony} onChange={e => setForm({ ...form, testimony: e.target.value })} rows={2} placeholder="Brief testimony to encourage the body" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                <div className="mt-4 flex items-center justify-between gap-3 flex-wrap">
                    <label className="flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={form.is_public} onChange={e => setForm({ ...form, is_public: e.target.checked })} /> Show in public counter
                    </label>
                    <button onClick={submit} disabled={!form.person_name.trim()} className="bg-[#140152] hover:bg-[#1d0175] text-white font-bold px-5 py-2 rounded-lg text-sm inline-flex items-center gap-2 disabled:opacity-50">
                        <Plus className="w-4 h-4" /> Record decision
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-5 py-3 border-b border-gray-100"><p className="font-bold text-[#140152]">Recent ({decisions.length})</p></div>
                <div className="divide-y divide-gray-100">
                    {decisions.length === 0 && <p className="px-5 py-12 text-center text-gray-400">No decisions yet.</p>}
                    {decisions.slice(0, 50).map(d => (
                        <div key={d.id} className="px-5 py-3 flex items-center gap-3 hover:bg-gray-50">
                            <span className="text-xs font-bold bg-[#f5bb00]/15 text-[#140152] px-2 py-1 rounded">{d.kind.replace('_', ' ')}</span>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-[#140152] truncate">{d.person_name}</p>
                                {d.testimony && <p className="text-xs text-gray-500 truncate italic">"{d.testimony}"</p>}
                            </div>
                            <p className="text-xs text-gray-400">{new Date(d.decided_on).toLocaleDateString()}</p>
                            {d.is_public ? <Eye className="w-4 h-4 text-green-500" /> : <EyeOff className="w-4 h-4 text-gray-300" />}
                            <button onClick={() => toggleTestimony(d)}
                                title={d.show_in_testimony ? 'Hide from /testimony' : 'Show on /testimony'}
                                className={`p-1.5 rounded ${d.show_in_testimony ? 'text-rose-600 bg-rose-50 hover:bg-rose-100' : 'text-gray-300 hover:text-rose-500 hover:bg-rose-50'}`}>
                                <Heart className={`w-4 h-4 ${d.show_in_testimony ? 'fill-current' : ''}`} />
                            </button>
                            <button onClick={() => remove(d.id)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
