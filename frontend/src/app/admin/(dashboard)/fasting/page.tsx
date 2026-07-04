'use client'
/**
 * /admin/fasting — CRUD corporate fasts + see participation stats.
 * Prayer prompts: one per line in the textarea; day N shows line N (cycling).
 */
import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
    Loader2, Plus, Save, Trash2, Flame, CheckCircle, AlertCircle, Users, ExternalLink,
} from 'lucide-react'
import { fastingApi, type Fast } from '@/lib/api'

type FastForm = {
    title: string; description: string; kind: Fast['kind']
    start_date: string; end_date: string
    scripture_focus: string; prompts_text: string; is_published: boolean
}

const BLANK: FastForm = {
    title: '', description: '', kind: 'full',
    start_date: '', end_date: '',
    scripture_focus: '', prompts_text: '', is_published: true,
}

export default function FastingAdmin() {
    const [fasts, setFasts] = useState<Fast[]>([])
    const [stats, setStats] = useState<Record<string, { participants: number; checked_in_today: number }>>({})
    const [loading, setLoading] = useState(true)
    const [editing, setEditing] = useState<FastForm | null>(null)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [saving, setSaving] = useState(false)
    const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)

    const refresh = async () => {
        setLoading(true)
        try {
            const list = await fastingApi.adminList()
            setFasts(list)
            // Stats for active/completed fasts, in parallel, best-effort.
            const entries = await Promise.all(list.map(async f => {
                try { return [f.id, await fastingApi.stats(f.id)] as const }
                catch { return [f.id, { participants: 0, checked_in_today: 0 }] as const }
            }))
            setStats(Object.fromEntries(entries))
        } catch (e) { setMsg({ kind: 'err', text: (e as Error).message }) }
        finally { setLoading(false) }
    }
    useEffect(() => { refresh() }, [])
    useEffect(() => { if (msg) { const t = setTimeout(() => setMsg(null), 5000); return () => clearTimeout(t) } }, [msg])

    const save = async () => {
        if (!editing || !editing.title || !editing.start_date || !editing.end_date) return
        setSaving(true)
        try {
            const body = {
                title: editing.title,
                description: editing.description || null,
                kind: editing.kind,
                start_date: editing.start_date,
                end_date: editing.end_date,
                scripture_focus: editing.scripture_focus || null,
                prayer_prompts: editing.prompts_text.split('\n').map(s => s.trim()).filter(Boolean),
                is_published: editing.is_published,
            }
            if (editingId) await fastingApi.update(editingId, body as any)
            else await fastingApi.create(body as any)
            setEditing(null); setEditingId(null)
            setMsg({ kind: 'ok', text: 'Saved.' })
            refresh()
        } catch (e) { setMsg({ kind: 'err', text: (e as Error).message }) }
        finally { setSaving(false) }
    }

    const startEdit = (f: Fast) => {
        setEditing({
            title: f.title, description: f.description || '', kind: f.kind,
            start_date: f.start_date.slice(0, 10), end_date: f.end_date.slice(0, 10),
            scripture_focus: f.scripture_focus || '',
            prompts_text: (f.prayer_prompts || []).join('\n'),
            is_published: f.is_published,
        })
        setEditingId(f.id)
    }

    return (
        <div className="p-4 sm:p-6 max-w-5xl mx-auto pb-32">
            <div className="flex items-start justify-between flex-wrap gap-4 mb-4">
                <div>
                    <h1 className="text-3xl font-black text-[#140152] flex items-center gap-3"><Flame className="w-7 h-7 text-[#f5bb00]" /> Fasting Calendar</h1>
                    <p className="text-gray-500 mt-1 text-sm">Corporate fasts appear on <Link href="/fasting" target="_blank" className="text-[#140152] font-bold hover:underline inline-flex items-center gap-1">letw.org/fasting <ExternalLink className="w-3 h-3" /></Link> with daily prayer prompts and member check-ins.</p>
                </div>
            </div>

            {msg && (
                <div className={`mb-4 p-3 rounded-xl border flex items-start gap-2 ${msg.kind === 'ok' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                    {msg.kind === 'ok' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}<span className="text-sm">{msg.text}</span>
                </div>
            )}

            {editing ? (
                <div className="bg-white border border-[#140152] rounded-2xl shadow-md p-5 mb-5">
                    <h2 className="font-black text-[#140152] mb-3">{editingId ? 'Edit fast' : 'New fast'}</h2>
                    <div className="grid md:grid-cols-2 gap-3">
                        <input value={editing.title} onChange={e => setEditing({ ...editing, title: e.target.value })} placeholder="Title (21 Days of Consecration…)" className="border border-gray-200 rounded-lg px-3 py-2 text-sm md:col-span-2" />
                        <select value={editing.kind} onChange={e => setEditing({ ...editing, kind: e.target.value as Fast['kind'] })} className="border border-gray-200 rounded-lg px-3 py-2 text-sm">
                            <option value="full">Full fast</option>
                            <option value="daniel">Daniel fast</option>
                            <option value="partial">Partial fast</option>
                            <option value="media">Media fast</option>
                        </select>
                        <input value={editing.scripture_focus} onChange={e => setEditing({ ...editing, scripture_focus: e.target.value })} placeholder="Scripture focus (Joel 2:12)" className="border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">Start</label>
                            <input type="date" value={editing.start_date} onChange={e => setEditing({ ...editing, start_date: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">End</label>
                            <input type="date" value={editing.end_date} onChange={e => setEditing({ ...editing, end_date: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                        </div>
                    </div>
                    <textarea value={editing.description} onChange={e => setEditing({ ...editing, description: e.target.value })} placeholder="Description — why this fast, what to expect" rows={3} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-3" />
                    <div className="mt-3">
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">Daily prayer prompts — one per line (line 1 = day 1; cycles if shorter than the fast)</label>
                        <textarea value={editing.prompts_text} onChange={e => setEditing({ ...editing, prompts_text: e.target.value })} rows={8}
                            placeholder={"Pray for personal consecration.\nPray for your family.\nPray for the church's mission…"}
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono" />
                    </div>
                    <div className="flex items-center gap-4 mt-3">
                        <label className="text-sm inline-flex items-center gap-2"><input type="checkbox" checked={editing.is_published} onChange={e => setEditing({ ...editing, is_published: e.target.checked })} /> Published</label>
                        <div className="flex-1" />
                        <button onClick={() => { setEditing(null); setEditingId(null) }} className="text-sm text-gray-500 hover:text-gray-800">Cancel</button>
                        <button onClick={save} disabled={saving} className="inline-flex items-center gap-2 bg-[#140152] hover:bg-[#1d0175] text-white font-bold px-5 py-2.5 rounded-xl text-sm disabled:opacity-50">
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save fast
                        </button>
                    </div>
                </div>
            ) : (
                <button onClick={() => { setEditing(BLANK); setEditingId(null) }} className="mb-5 inline-flex items-center gap-2 bg-[#f5bb00] hover:bg-amber-400 text-[#140152] font-black px-5 py-2.5 rounded-xl text-sm">
                    <Plus className="w-4 h-4" /> New fast
                </button>
            )}

            {loading ? <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-[#140152]" /></div> : (
                <div className="space-y-3">
                    {fasts.length === 0 && <p className="text-center text-gray-400 py-8">No fasts yet — create the first one above.</p>}
                    {fasts.map(f => {
                        const s = stats[f.id]
                        return (
                            <div key={f.id} className="bg-white border border-gray-100 rounded-2xl shadow-sm p-4 flex items-start gap-4">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${f.status === 'active' ? 'bg-[#f5bb00] text-[#140152]' : 'bg-gray-100 text-gray-500'}`}>
                                    <Flame className="w-5 h-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <p className="font-black text-[#140152]">{f.title}</p>
                                        <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${
                                            f.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                                            f.status === 'upcoming' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'
                                        }`}>{f.status}{f.current_day ? ` · day ${f.current_day}` : ''}</span>
                                        {!f.is_published && <span className="text-[10px] font-bold uppercase tracking-widest text-red-500">Unpublished</span>}
                                    </div>
                                    <p className="text-xs text-gray-500 mt-0.5">
                                        {new Date(f.start_date).toLocaleDateString()} — {new Date(f.end_date).toLocaleDateString()} · {f.total_days} days · {f.kind}
                                    </p>
                                    {s && (s.participants > 0 || f.status !== 'upcoming') && (
                                        <p className="text-xs text-gray-600 mt-1 inline-flex items-center gap-1">
                                            <Users className="w-3 h-3 text-[#f5bb00]" /> {s.participants} participants · {s.checked_in_today} checked in today
                                        </p>
                                    )}
                                </div>
                                <div className="flex gap-1.5">
                                    <button onClick={() => startEdit(f)} className="text-xs underline text-[#140152]">Edit</button>
                                    <button onClick={async () => {
                                        if (!confirm(`Delete "${f.title}" and all its check-ins?`)) return
                                        try { await fastingApi.remove(f.id); refresh() }
                                        catch (e) { setMsg({ kind: 'err', text: (e as Error).message }) }
                                    }} className="p-1.5 text-red-400 hover:text-red-700 hover:bg-red-50 rounded"><Trash2 className="w-3.5 h-3.5" /></button>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
