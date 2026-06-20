'use client'
import { useEffect, useState } from 'react'
import { Loader2, Heart, AlertCircle, CheckCircle, Trash2, Calendar, Save } from 'lucide-react'
import { lifeEventApi, type LifeEventRequest } from '@/lib/api'

const KIND_LABEL: Record<string, string> = { wedding: 'Wedding', baptism: 'Baptism', dedication: 'Dedication' }
const KIND_COLOR: Record<string, string> = {
    wedding: 'bg-rose-50 text-rose-700', baptism: 'bg-sky-50 text-sky-700',
    dedication: 'bg-amber-50 text-amber-700',
}

export default function AdminLifeEventsPage() {
    const [requests, setRequests] = useState<LifeEventRequest[]>([])
    const [filter, setFilter] = useState<string>('')
    const [loading, setLoading] = useState(true)
    const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)

    const load = async () => {
        try { setRequests(await lifeEventApi.list(filter || undefined)) }
        catch (e) { setMsg({ kind: 'err', text: (e as Error).message }) }
        finally { setLoading(false) }
    }
    useEffect(() => { load() }, [filter])
    useEffect(() => { if (msg) { const t = setTimeout(() => setMsg(null), 5000); return () => clearTimeout(t) } }, [msg])

    const updateStatus = async (id: string, status: string, approved_date?: string) => {
        try { await lifeEventApi.update(id, { status, approved_date }); setMsg({ kind: 'ok', text: `Marked ${status}.` }); await load() }
        catch (e) { setMsg({ kind: 'err', text: (e as Error).message }) }
    }
    const saveNotes = async (id: string, admin_notes: string) => {
        try { await lifeEventApi.update(id, { admin_notes }); setMsg({ kind: 'ok', text: 'Notes saved.' }); await load() }
        catch (e) { setMsg({ kind: 'err', text: (e as Error).message }) }
    }
    const remove = async (id: string) => {
        if (!confirm('Delete this request?')) return
        try { await lifeEventApi.delete(id); await load() }
        catch (e) { setMsg({ kind: 'err', text: (e as Error).message }) }
    }

    if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-10 h-10 animate-spin text-[#140152]" /></div>

    return (
        <div className="p-4 sm:p-6 max-w-6xl mx-auto pb-20">
            <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
                <div>
                    <h1 className="text-3xl font-black text-[#140152] flex items-center gap-3"><Heart className="w-7 h-7 text-rose-500" /> Life Events</h1>
                    <p className="text-gray-500 mt-1 text-sm">Wedding · Baptism · Dedication requests from members.</p>
                </div>
                <div className="flex gap-2">
                    {['', 'pending', 'approved', 'declined', 'completed'].map(s => (
                        <button key={s} onClick={() => setFilter(s)} className={`px-3 py-1.5 text-xs font-bold rounded-lg ${filter === s ? 'bg-[#140152] text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                            {s || 'All'}
                        </button>
                    ))}
                </div>
            </div>

            {msg && <div className={`mb-4 p-3 rounded-xl border flex items-start gap-2 ${msg.kind === 'ok' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                {msg.kind === 'ok' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}<span className="text-sm">{msg.text}</span>
            </div>}

            <div className="space-y-4">
                {requests.length === 0 && <p className="text-center text-gray-400 py-12">No requests {filter && `with status "${filter}"`}.</p>}
                {requests.map(r => (
                    <RequestCard key={r.id} r={r} onStatus={updateStatus} onSaveNotes={saveNotes} onDelete={remove} />
                ))}
            </div>
        </div>
    )
}

function RequestCard({ r, onStatus, onSaveNotes, onDelete }: { r: LifeEventRequest; onStatus: (id: string, s: string, d?: string) => void; onSaveNotes: (id: string, n: string) => void; onDelete: (id: string) => void }) {
    const [notes, setNotes] = useState(r.admin_notes || '')
    const [approvedDate, setApprovedDate] = useState(r.approved_date || r.preferred_date)
    return (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
            <div className={`px-5 py-3 border-b border-gray-100 flex items-center justify-between gap-2 ${KIND_COLOR[r.kind] || ''}`}>
                <span className="font-bold text-sm">{KIND_LABEL[r.kind] || r.kind}</span>
                <span className="text-xs font-bold uppercase tracking-wider">{r.status}</span>
            </div>
            <div className="p-5">
                <div className="flex items-start gap-4 mb-4">
                    <div className="flex-1 min-w-0">
                        <p className="font-bold text-[#140152]">{r.requester_name}</p>
                        <p className="text-xs text-gray-500">{r.requester_email}{r.requester_phone ? ` · ${r.requester_phone}` : ''}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-gray-400 uppercase font-bold">Preferred</p>
                        <p className="text-sm font-bold text-[#140152]">{new Date(r.preferred_date).toLocaleDateString()}</p>
                        {r.alternate_date && <p className="text-xs text-gray-500">alt: {new Date(r.alternate_date).toLocaleDateString()}</p>}
                    </div>
                </div>
                {r.details && Object.keys(r.details).length > 0 && (
                    <div className="text-xs text-gray-600 bg-gray-50 rounded-lg p-3 mb-3">
                        {Object.entries(r.details).map(([k, v]) => <div key={k}><span className="font-bold capitalize">{k}:</span> {String(v)}</div>)}
                    </div>
                )}
                <label className="text-xs font-bold uppercase text-gray-500 block mb-1">Internal notes</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-3" />
                <div className="flex flex-wrap items-end gap-2 justify-between">
                    <div className="flex items-center gap-2">
                        <label className="text-xs font-bold uppercase text-gray-500">Approved date</label>
                        <input type="date" value={approvedDate} onChange={e => setApprovedDate(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm" />
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <button onClick={() => onSaveNotes(r.id, notes)} className="text-xs font-bold px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg inline-flex items-center gap-1.5"><Save className="w-3 h-3" /> Save Notes</button>
                        {r.status !== 'approved' && <button onClick={() => onStatus(r.id, 'approved', approvedDate)} className="text-xs font-bold px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg inline-flex items-center gap-1.5"><Calendar className="w-3 h-3" /> Approve</button>}
                        {r.status !== 'declined' && <button onClick={() => onStatus(r.id, 'declined')} className="text-xs font-bold px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg">Decline</button>}
                        {r.status !== 'completed' && <button onClick={() => onStatus(r.id, 'completed')} className="text-xs font-bold px-3 py-1.5 bg-[#140152] hover:bg-[#1d0175] text-white rounded-lg">Mark Completed</button>}
                        <button onClick={() => onDelete(r.id)} className="text-xs font-bold px-3 py-1.5 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 className="w-3 h-3 inline" /></button>
                    </div>
                </div>
            </div>
        </div>
    )
}
