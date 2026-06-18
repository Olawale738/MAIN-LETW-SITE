'use client'
import { useEffect, useState } from 'react'
import { Loader2, Plus, Save, Trash2, Sparkles, AlertCircle, CheckCircle, ArrowUp, ArrowDown } from 'lucide-react'
import { dailyVerseApi, type DailyVerse } from '@/lib/api'

export default function AdminDailyVersePage() {
    const [verses, setVerses] = useState<DailyVerse[]>([])
    const [loading, setLoading] = useState(true)
    const [showNew, setShowNew] = useState(false)
    const [editing, setEditing] = useState<DailyVerse | null>(null)
    const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)

    const load = async () => {
        try { setVerses(await dailyVerseApi.list()) }
        catch (e) { setMsg({ kind: 'err', text: (e as Error).message }) }
        finally { setLoading(false) }
    }
    useEffect(() => { load() }, [])
    useEffect(() => { if (msg) { const t = setTimeout(() => setMsg(null), 5000); return () => clearTimeout(t) } }, [msg])

    const save = async (v: DailyVerse) => {
        try {
            const body = { reference: v.reference, text: v.text, translation: v.translation, is_active: v.is_active, sort_order: v.sort_order }
            if (v.id) await dailyVerseApi.update(v.id, body)
            else await dailyVerseApi.create(body)
            setMsg({ kind: 'ok', text: 'Verse saved.' })
            setEditing(null); setShowNew(false); await load()
        } catch (e) { setMsg({ kind: 'err', text: (e as Error).message }) }
    }
    const remove = async (id: string) => {
        if (!confirm('Delete this verse from the rotation?')) return
        try { await dailyVerseApi.delete(id); await load() }
        catch (e) { setMsg({ kind: 'err', text: (e as Error).message }) }
    }
    const reorder = async (v: DailyVerse, delta: number) => {
        try { await dailyVerseApi.update(v.id, { ...v, sort_order: v.sort_order + delta }); await load() }
        catch (e) { setMsg({ kind: 'err', text: (e as Error).message }) }
    }

    if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-10 h-10 animate-spin text-[#140152]" /></div>

    return (
        <div className="p-4 sm:p-6 max-w-5xl mx-auto pb-20">
            <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
                <div>
                    <h1 className="text-3xl font-black text-[#140152] flex items-center gap-3"><Sparkles className="w-7 h-7 text-[#f5bb00]" /> Daily Verse Rotation</h1>
                    <p className="text-gray-500 mt-1 text-sm">A different verse from this list is shown on the homepage each day, rotating by day-of-year. Add as many as you like.</p>
                </div>
            </div>

            {msg && <div className={`mb-4 p-3 rounded-xl border flex items-start gap-2 ${msg.kind === 'ok' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                {msg.kind === 'ok' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}<span className="text-sm">{msg.text}</span>
            </div>}

            <div className="flex justify-end mb-4">
                <button onClick={() => setShowNew(true)} className="inline-flex items-center gap-2 bg-[#140152] hover:bg-[#1d0175] text-white font-bold px-4 py-2.5 rounded-lg text-sm"><Plus className="w-4 h-4" /> Add Verse</button>
            </div>

            {(showNew || editing) && (
                <VerseForm
                    verse={editing || { id: '', reference: '', text: '', translation: 'ESV', is_active: true, sort_order: (verses.at(-1)?.sort_order || 0) + 10 }}
                    onSave={save}
                    onCancel={() => { setEditing(null); setShowNew(false) }}
                />
            )}

            <div className="space-y-2 mt-5">
                {verses.length === 0 && <p className="text-center text-gray-400 py-12">No verses yet. Add a few to start the rotation.</p>}
                {verses.map((v, i) => (
                    <div key={v.id} className="bg-white border border-gray-100 rounded-xl px-5 py-4 flex items-start gap-4 shadow-sm">
                        <div className="w-10 h-10 rounded-xl bg-[#f5bb00]/15 text-[#140152] flex items-center justify-center font-black flex-shrink-0">{i + 1}</div>
                        <div className="flex-1 min-w-0">
                            <p className="font-bold text-[#140152]">{v.reference}{v.translation ? <span className="text-xs text-gray-400 font-normal ml-2">({v.translation})</span> : null}</p>
                            <p className="text-sm text-gray-600 mt-1 line-clamp-2">{v.text}</p>
                        </div>
                        <span className={`text-xs font-bold px-2 py-1 rounded ${v.is_active ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-400'}`}>{v.is_active ? 'Active' : 'Paused'}</span>
                        <button onClick={() => reorder(v, -15)} className="p-1.5 text-gray-400 hover:text-[#140152]" disabled={i === 0}><ArrowUp className="w-4 h-4" /></button>
                        <button onClick={() => reorder(v, 15)} className="p-1.5 text-gray-400 hover:text-[#140152]" disabled={i === verses.length - 1}><ArrowDown className="w-4 h-4" /></button>
                        <button onClick={() => setEditing(v)} className="text-sm font-bold text-[#140152] hover:underline">Edit</button>
                        <button onClick={() => remove(v.id)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                    </div>
                ))}
            </div>
        </div>
    )
}

function VerseForm({ verse, onSave, onCancel }: { verse: DailyVerse; onSave: (v: DailyVerse) => void; onCancel: () => void }) {
    const [v, setV] = useState(verse)
    return (
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-md">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                <div className="md:col-span-2">
                    <label className="text-xs font-bold uppercase text-gray-500 block mb-1">Reference</label>
                    <input value={v.reference} onChange={e => setV({ ...v, reference: e.target.value })} placeholder="John 3:16" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                    <label className="text-xs font-bold uppercase text-gray-500 block mb-1">Translation</label>
                    <input value={v.translation || ''} onChange={e => setV({ ...v, translation: e.target.value })} placeholder="ESV / NIV / KJV" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                </div>
            </div>
            <label className="text-xs font-bold uppercase text-gray-500 block mb-1">Verse Text</label>
            <textarea value={v.text} onChange={e => setV({ ...v, text: e.target.value })} rows={4} placeholder="For God so loved the world…" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-3" />
            <div className="flex items-center justify-between gap-3 flex-wrap">
                <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={v.is_active} onChange={e => setV({ ...v, is_active: e.target.checked })} /> Active in rotation
                </label>
                <div className="flex gap-2">
                    <button onClick={onCancel} className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-bold">Cancel</button>
                    <button onClick={() => onSave(v)} disabled={!v.reference.trim() || !v.text.trim()} className="inline-flex items-center gap-2 bg-[#140152] hover:bg-[#1d0175] text-white font-bold px-5 py-2 rounded-lg text-sm disabled:opacity-50"><Save className="w-4 h-4" /> Save</button>
                </div>
            </div>
        </div>
    )
}
