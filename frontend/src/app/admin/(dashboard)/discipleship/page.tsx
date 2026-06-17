'use client'
import { useEffect, useState } from 'react'
import { Loader2, Plus, Save, Trash2, Sparkles, AlertCircle, CheckCircle, ArrowUp, ArrowDown } from 'lucide-react'
import { discipleshipApi, type DiscipleshipStage } from '@/lib/api'

const ICONS = ['Sparkles', 'Heart', 'Cross', 'Users', 'HandHeart', 'BookOpen', 'Crown', 'Flame', 'Church', 'Shield']

export default function AdminDiscipleshipPage() {
    const [stages, setStages] = useState<DiscipleshipStage[]>([])
    const [loading, setLoading] = useState(true)
    const [showNew, setShowNew] = useState(false)
    const [editing, setEditing] = useState<DiscipleshipStage | null>(null)
    const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)

    const load = async () => {
        try { setStages(await discipleshipApi.adminStages()) }
        catch (e) { setMsg({ kind: 'err', text: (e as Error).message }) }
        finally { setLoading(false) }
    }
    useEffect(() => { load() }, [])
    useEffect(() => { if (msg) { const t = setTimeout(() => setMsg(null), 5000); return () => clearTimeout(t) } }, [msg])

    const save = async (stage: DiscipleshipStage) => {
        try {
            const body = { key: stage.key, title: stage.title, description: stage.description, icon: stage.icon,
                cta_label: stage.cta_label || null, cta_href: stage.cta_href || null,
                sort_order: stage.sort_order, is_active: stage.is_active }
            if (stage.id) await discipleshipApi.updateStage(stage.id, body)
            else await discipleshipApi.createStage(body)
            setMsg({ kind: 'ok', text: 'Stage saved.' })
            setEditing(null); setShowNew(false); await load()
        } catch (e) { setMsg({ kind: 'err', text: (e as Error).message }) }
    }
    const remove = async (id: string) => {
        if (!confirm('Delete this stage? Members who completed it will keep their record.')) return
        try { await discipleshipApi.deleteStage(id); setMsg({ kind: 'ok', text: 'Stage deleted.' }); await load() }
        catch (e) { setMsg({ kind: 'err', text: (e as Error).message }) }
    }
    const reorder = async (s: DiscipleshipStage, delta: number) => {
        try { await discipleshipApi.updateStage(s.id, { ...s, sort_order: s.sort_order + delta }); await load() }
        catch (e) { setMsg({ kind: 'err', text: (e as Error).message }) }
    }

    if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-10 h-10 animate-spin text-[#140152]" /></div>

    return (
        <div className="p-4 sm:p-6 max-w-5xl mx-auto pb-20">
            <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
                <div>
                    <h1 className="text-3xl font-black text-[#140152] flex items-center gap-3"><Sparkles className="w-7 h-7 text-[#f5bb00]" /> Discipleship Pathway</h1>
                    <p className="text-gray-500 mt-1 text-sm">Every member sees their next step. Sequence: new believer → baptized → small group → serving → leader (or whatever stages you set).</p>
                </div>
            </div>

            {msg && <div className={`mb-4 p-3 rounded-xl border flex items-start gap-2 ${msg.kind === 'ok' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                {msg.kind === 'ok' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}<span className="text-sm">{msg.text}</span>
            </div>}

            <div className="flex justify-end mb-4">
                <button onClick={() => setShowNew(true)} className="inline-flex items-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 text-[#140152] font-bold px-4 py-2.5 rounded-lg text-sm"><Plus className="w-4 h-4" /> New Stage</button>
            </div>

            {(showNew || editing) && (
                <StageForm
                    stage={editing || { id: '', key: '', title: '', description: '', icon: 'Sparkles', cta_label: '', cta_href: '', sort_order: (stages.at(-1)?.sort_order || 0) + 10, is_active: true }}
                    onSave={save}
                    onCancel={() => { setEditing(null); setShowNew(false) }}
                />
            )}

            <div className="space-y-2 mt-5">
                {stages.length === 0 && <p className="text-center text-gray-400 py-12">No stages defined. Click "New Stage" to set up the journey.</p>}
                {stages.map((s, i) => (
                    <div key={s.id} className="bg-white border border-gray-100 rounded-xl px-5 py-4 flex items-center gap-4 shadow-sm">
                        <div className="w-10 h-10 rounded-xl bg-[#f5bb00]/15 text-[#140152] flex items-center justify-center font-black flex-shrink-0">{i + 1}</div>
                        <div className="flex-1 min-w-0">
                            <p className="font-bold text-[#140152] truncate">{s.title}</p>
                            <p className="text-xs text-gray-400 truncate">{s.description}</p>
                        </div>
                        <span className={`text-xs font-bold px-2 py-1 rounded ${s.is_active ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-400'}`}>{s.is_active ? 'Active' : 'Paused'}</span>
                        <button onClick={() => reorder(s, -15)} className="p-1.5 text-gray-400 hover:text-[#140152]" disabled={i === 0}><ArrowUp className="w-4 h-4" /></button>
                        <button onClick={() => reorder(s, 15)} className="p-1.5 text-gray-400 hover:text-[#140152]" disabled={i === stages.length - 1}><ArrowDown className="w-4 h-4" /></button>
                        <button onClick={() => setEditing(s)} className="text-sm font-bold text-[#140152] hover:underline">Edit</button>
                        <button onClick={() => remove(s.id)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                    </div>
                ))}
            </div>
        </div>
    )
}

function StageForm({ stage, onSave, onCancel }: { stage: DiscipleshipStage; onSave: (s: DiscipleshipStage) => void; onCancel: () => void }) {
    const [s, setS] = useState(stage)
    return (
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-md">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                <div>
                    <label className="text-xs font-bold uppercase text-gray-500 block mb-1">Key (slug)</label>
                    <input value={s.key} onChange={e => setS({ ...s, key: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })} placeholder="new-believer" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                    <label className="text-xs font-bold uppercase text-gray-500 block mb-1">Title</label>
                    <input value={s.title} onChange={e => setS({ ...s, title: e.target.value })} placeholder="New Believer" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                </div>
            </div>
            <label className="text-xs font-bold uppercase text-gray-500 block mb-1">Description</label>
            <textarea value={s.description} onChange={e => setS({ ...s, description: e.target.value })} rows={3}
                placeholder="You've welcomed Jesus. Here's how to grow from here." className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-3" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                <div>
                    <label className="text-xs font-bold uppercase text-gray-500 block mb-1">Icon</label>
                    <select value={s.icon} onChange={e => setS({ ...s, icon: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
                        {ICONS.map(i => <option key={i} value={i}>{i}</option>)}
                    </select>
                </div>
                <div>
                    <label className="text-xs font-bold uppercase text-gray-500 block mb-1">Button Label (optional)</label>
                    <input value={s.cta_label || ''} onChange={e => setS({ ...s, cta_label: e.target.value })} placeholder="Get Baptized" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                    <label className="text-xs font-bold uppercase text-gray-500 block mb-1">Button Link (optional)</label>
                    <input value={s.cta_href || ''} onChange={e => setS({ ...s, cta_href: e.target.value })} placeholder="/life-events?kind=baptism" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                </div>
            </div>
            <div className="flex items-center justify-between gap-3 flex-wrap">
                <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={s.is_active} onChange={e => setS({ ...s, is_active: e.target.checked })} /> Active
                </label>
                <div className="flex gap-2">
                    <button onClick={onCancel} className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-bold">Cancel</button>
                    <button onClick={() => onSave(s)} disabled={!s.key.trim() || !s.title.trim()} className="inline-flex items-center gap-2 bg-[#140152] hover:bg-[#1d0175] text-white font-bold px-5 py-2 rounded-lg text-sm disabled:opacity-50"><Save className="w-4 h-4" /> Save</button>
                </div>
            </div>
        </div>
    )
}
