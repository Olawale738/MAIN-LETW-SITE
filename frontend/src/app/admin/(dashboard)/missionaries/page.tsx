'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Loader2, Globe, Plus, Trash2, ExternalLink, AlertCircle, CheckCircle, Save } from 'lucide-react'
import { missionariesApi, type Missionary } from '@/lib/api'

export default function AdminMissionariesPage() {
    const [items, setItems] = useState<Missionary[]>([])
    const [loading, setLoading] = useState(true)
    const [editing, setEditing] = useState<Missionary | null>(null)
    const [showNew, setShowNew] = useState(false)
    const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)

    const load = async () => {
        try { setItems(await missionariesApi.list()) }
        catch (e) { setMsg({ kind: 'err', text: (e as Error).message }) }
        finally { setLoading(false) }
    }
    useEffect(() => { load() }, [])
    useEffect(() => { if (msg) { const t = setTimeout(() => setMsg(null), 5000); return () => clearTimeout(t) } }, [msg])

    const save = async (m: Partial<Missionary> & { id?: string }) => {
        try {
            if (m.id) await missionariesApi.adminUpdate(m.id, m)
            else await missionariesApi.adminCreate(m as any)
            setMsg({ kind: 'ok', text: 'Missionary saved.' })
            setEditing(null); setShowNew(false); await load()
        } catch (e) { setMsg({ kind: 'err', text: (e as Error).message }) }
    }

    const remove = async (id: string) => {
        if (!confirm('Delete this missionary?')) return
        try { await missionariesApi.adminDelete(id); await load() }
        catch (e) { setMsg({ kind: 'err', text: (e as Error).message }) }
    }

    if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-10 h-10 animate-spin text-[#140152]" /></div>

    return (
        <div className="p-4 sm:p-6 max-w-5xl mx-auto pb-20">
            <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
                <div>
                    <h1 className="text-3xl font-black text-[#140152] flex items-center gap-3"><Globe className="w-7 h-7 text-[#f5bb00]" /> Missionaries</h1>
                    <p className="text-gray-500 mt-1 text-sm">Manage missionary profiles + support goals. Public list at <Link href="/missions" target="_blank" className="text-[#140152] font-bold hover:underline inline-flex items-center gap-1">/missions <ExternalLink className="w-3 h-3" /></Link></p>
                </div>
                <button onClick={() => setShowNew(true)} className="bg-[#140152] hover:bg-[#1d0175] text-white font-bold px-5 py-3 rounded-xl inline-flex items-center gap-2"><Plus className="w-4 h-4" /> Add Missionary</button>
            </div>

            {msg && <div className={`mb-4 p-3 rounded-xl border flex items-start gap-2 ${msg.kind === 'ok' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                {msg.kind === 'ok' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}<span className="text-sm">{msg.text}</span>
            </div>}

            {(showNew || editing) && (
                <MissionaryForm
                    initial={editing || { name: '', country: '', ministry_focus: '', family_size: 1, currency: 'USD', monthly_support_goal: 0, is_active: true, is_featured: false, sort_order: 0 } as any}
                    onCancel={() => { setEditing(null); setShowNew(false) }}
                    onSave={save}
                />
            )}

            <div className="space-y-2 mt-5">
                {items.length === 0 && <p className="text-center text-gray-400 py-12">No missionaries yet.</p>}
                {items.map(m => (
                    <div key={m.id} className="bg-white border border-gray-100 rounded-xl px-5 py-3 flex items-center gap-4 shadow-sm">
                        {m.photo_url ? <img src={m.photo_url} alt="" className="w-10 h-10 rounded-full object-cover" /> :
                            <div className="w-10 h-10 rounded-full bg-[#140152]/10 text-[#140152] flex items-center justify-center font-bold">{m.name.slice(0, 1)}</div>}
                        <div className="flex-1 min-w-0">
                            <p className="font-bold text-[#140152] truncate">{m.name} {m.is_featured && <span className="text-xs bg-[#f5bb00] text-[#140152] px-2 py-0.5 rounded ml-2">Featured</span>}</p>
                            <p className="text-xs text-gray-500 truncate">{m.country} · {m.ministry_focus}</p>
                        </div>
                        <p className="text-xs text-gray-500 hidden sm:block">{m.currency} {m.monthly_support_goal.toLocaleString()}/mo</p>
                        <button onClick={() => setEditing(m)} className="text-sm font-bold text-[#140152] hover:underline">Edit</button>
                        <button onClick={() => remove(m.id)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
                    </div>
                ))}
            </div>
        </div>
    )
}

function MissionaryForm({ initial, onCancel, onSave }: { initial: Missionary; onCancel: () => void; onSave: (m: Partial<Missionary> & { id?: string }) => void }) {
    const [m, setM] = useState<Missionary>(initial)
    const setField = <K extends keyof Missionary>(k: K, v: Missionary[K]) => setM({ ...m, [k]: v })

    return (
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-md mb-5">
            <div className="grid md:grid-cols-2 gap-3">
                <Field label="Name" v={m.name || ''} on={v => setField('name', v)} />
                <Field label="Country" v={m.country || ''} on={v => setField('country', v)} />
                <Field label="Region (optional)" v={m.region || ''} on={v => setField('region', v)} />
                <Field label="Organisation" v={m.organisation || ''} on={v => setField('organisation', v)} />
                <Field label="Photo URL" v={m.photo_url || ''} on={v => setField('photo_url', v)} />
                <Field label="Currency" v={m.currency || 'USD'} on={v => setField('currency', v as any)} />
            </div>
            <Area label="Ministry focus (1-sentence)" v={m.ministry_focus || ''} on={v => setField('ministry_focus', v)} />
            <Area label="Bio / full story" v={m.bio || ''} on={v => setField('bio', v as any)} rows={6} />
            <div className="grid md:grid-cols-3 gap-3 mt-3">
                <Field label="Family size" type="number" v={String(m.family_size || 1)} on={v => setField('family_size', parseInt(v) || 1)} />
                <Field label="Monthly support goal" type="number" v={String(m.monthly_support_goal || 0)} on={v => setField('monthly_support_goal', parseFloat(v) || 0)} />
                <Field label="Sort order" type="number" v={String((m as any).sort_order || 0)} on={v => setField('sort_order' as any, parseInt(v) || 0)} />
            </div>
            <div className="mt-4 flex items-center justify-between gap-3 flex-wrap">
                <div className="flex gap-3 text-sm">
                    <label className="flex items-center gap-1"><input type="checkbox" checked={(m as any).is_active !== false} onChange={e => setField('is_active' as any, e.target.checked as any)} /> Active</label>
                    <label className="flex items-center gap-1"><input type="checkbox" checked={m.is_featured} onChange={e => setField('is_featured', e.target.checked)} /> Featured</label>
                </div>
                <div className="flex gap-2">
                    <button onClick={onCancel} className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-bold">Cancel</button>
                    <button onClick={() => onSave(m as any)} disabled={!m.name?.trim() || !m.country?.trim()} className="bg-[#140152] hover:bg-[#1d0175] text-white font-bold px-5 py-2 rounded-lg text-sm inline-flex items-center gap-2 disabled:opacity-50"><Save className="w-4 h-4" /> Save</button>
                </div>
            </div>
        </div>
    )
}

function Field({ label, v, on, type }: { label: string; v: string; on: (v: string) => void; type?: string }) {
    return (
        <div>
            <label className="text-xs font-bold uppercase text-gray-500 block mb-1">{label}</label>
            <input type={type || 'text'} value={v} onChange={e => on(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
        </div>
    )
}
function Area({ label, v, on, rows = 3 }: { label: string; v: string; on: (v: string) => void; rows?: number }) {
    return (
        <div className="mt-3">
            <label className="text-xs font-bold uppercase text-gray-500 block mb-1">{label}</label>
            <textarea value={v} onChange={e => on(e.target.value)} rows={rows} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
        </div>
    )
}
