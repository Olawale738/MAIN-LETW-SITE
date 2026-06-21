'use client'
import { useEffect, useState } from 'react'
import {
    Loader2, ShieldCheck, Plus, Trash2, AlertCircle, CheckCircle, Search,
    User, Calendar, Heart, Stethoscope, Cross, Phone
} from 'lucide-react'
import { pastoralApi, type PastoralNote, type PastoralKind } from '@/lib/api'

const KIND_META: Record<PastoralKind, { label: string; icon: React.ReactNode; tint: string }> = {
    visitation:   { label: 'Visitation',   icon: <User className="w-3.5 h-3.5" />,       tint: 'bg-blue-100 text-blue-700' },
    call:         { label: 'Call',         icon: <Phone className="w-3.5 h-3.5" />,      tint: 'bg-teal-100 text-teal-700' },
    hospital:     { label: 'Hospital',     icon: <Stethoscope className="w-3.5 h-3.5" />,tint: 'bg-rose-100 text-rose-700' },
    bereavement:  { label: 'Bereavement',  icon: <Cross className="w-3.5 h-3.5" />,      tint: 'bg-gray-100 text-gray-700' },
    counsel:      { label: 'Counsel',      icon: <ShieldCheck className="w-3.5 h-3.5" />,tint: 'bg-purple-100 text-purple-700' },
    celebration:  { label: 'Celebration',  icon: <Heart className="w-3.5 h-3.5" />,      tint: 'bg-amber-100 text-amber-700' },
    prayer:       { label: 'Prayer',       icon: <Heart className="w-3.5 h-3.5" />,      tint: 'bg-pink-100 text-pink-700' },
    concern:      { label: 'Concern',      icon: <AlertCircle className="w-3.5 h-3.5" />,tint: 'bg-orange-100 text-orange-700' },
}

export default function AdminPastoralCarePage() {
    const [notes, setNotes] = useState<PastoralNote[]>([])
    const [loading, setLoading] = useState(true)
    const [q, setQ] = useState('')
    const [filterKind, setFilterKind] = useState<PastoralKind | ''>('')
    const [adding, setAdding] = useState(false)
    const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)

    const load = async () => {
        setLoading(true)
        try { setNotes(await pastoralApi.listNotes({ q: q || undefined, kind: filterKind || undefined })) }
        catch (e) { setMsg({ kind: 'err', text: (e as Error).message }) }
        finally { setLoading(false) }
    }
    useEffect(() => { load() }, [filterKind])
    useEffect(() => { const t = setTimeout(load, 350); return () => clearTimeout(t) }, [q])
    useEffect(() => { if (msg) { const t = setTimeout(() => setMsg(null), 4000); return () => clearTimeout(t) } }, [msg])

    const remove = async (id: string) => {
        if (!confirm('Delete this note? It is confidential pastoral data.')) return
        try { await pastoralApi.deleteNote(id); await load() }
        catch (e) { setMsg({ kind: 'err', text: (e as Error).message }) }
    }

    return (
        <div className="p-4 sm:p-6 max-w-6xl mx-auto pb-20">
            <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
                <div>
                    <h1 className="text-3xl font-black text-[#140152] flex items-center gap-3"><ShieldCheck className="w-7 h-7 text-purple-500" /> Pastoral Care</h1>
                    <p className="text-gray-500 mt-1 text-sm">Confidential shepherd notes per member — visitations, hospital visits, bereavement, counsel, concern.</p>
                </div>
                <button onClick={() => setAdding(true)} className="bg-[#140152] hover:bg-[#1d0175] text-white font-bold px-4 py-2 rounded-xl text-sm inline-flex items-center gap-1.5"><Plus className="w-4 h-4" /> New note</button>
            </div>

            {msg && (
                <div className={`mb-4 p-3 rounded-xl border flex items-start gap-2 ${msg.kind === 'ok' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                    {msg.kind === 'ok' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}<span className="text-sm">{msg.text}</span>
                </div>
            )}

            <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1">
                <div className="relative flex-1 min-w-[180px]">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search member or content…"
                        className="w-full bg-white border border-gray-200 rounded-full pl-9 pr-3 py-2 text-sm" />
                </div>
                <button onClick={() => setFilterKind('')} className={`px-3 py-1.5 text-xs font-bold rounded-full whitespace-nowrap ${!filterKind ? 'bg-[#140152] text-white' : 'bg-white border border-gray-200 text-gray-600'}`}>All</button>
                {(Object.keys(KIND_META) as PastoralKind[]).map(k => (
                    <button key={k} onClick={() => setFilterKind(filterKind === k ? '' : k)}
                        className={`px-3 py-1.5 text-xs font-bold rounded-full inline-flex items-center gap-1.5 whitespace-nowrap ${filterKind === k ? 'bg-[#140152] text-white' : 'bg-white border border-gray-200 text-gray-600'}`}>
                        {KIND_META[k].icon} {KIND_META[k].label}
                    </button>
                ))}
            </div>

            {adding && <NoteForm onCancel={() => setAdding(false)} onDone={() => { setAdding(false); load() }} onError={t => setMsg({ kind: 'err', text: t })} />}

            {loading ? (
                <div className="flex items-center justify-center min-h-[20vh]"><Loader2 className="w-8 h-8 animate-spin text-[#140152]" /></div>
            ) : notes.length === 0 ? (
                <div className="bg-white border border-gray-100 rounded-2xl p-10 text-center">
                    <ShieldCheck className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                    <p className="text-gray-500 text-sm">No notes yet. Use "New note" to record your first pastoral interaction.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {notes.map(n => {
                        const m = KIND_META[n.kind]
                        return (
                            <div key={n.id} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                                <div className="flex items-start gap-3 mb-2">
                                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded inline-flex items-center gap-1 ${m.tint}`}>{m.icon} {m.label}</span>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-black text-[#140152] truncate">{n.title}</p>
                                        <p className="text-xs text-gray-500">{n.member_name} · {new Date(n.created_at).toLocaleString()}</p>
                                    </div>
                                    <button onClick={() => remove(n.id)} className="p-1.5 text-red-300 hover:text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
                                </div>
                                <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{n.body}</p>
                                {n.follow_up_on && <p className="mt-2 text-xs text-[#f5bb00] font-bold inline-flex items-center gap-1"><Calendar className="w-3 h-3" /> Follow up by {new Date(n.follow_up_on).toLocaleDateString()}</p>}
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}

function NoteForm({ onCancel, onDone, onError }: { onCancel: () => void; onDone: () => void; onError: (t: string) => void }) {
    const [memberName, setMemberName] = useState('')
    const [memberEmail, setMemberEmail] = useState('')
    const [kind, setKind] = useState<PastoralKind>('visitation')
    const [title, setTitle] = useState('')
    const [body, setBody] = useState('')
    const [followUp, setFollowUp] = useState('')
    const [busy, setBusy] = useState(false)

    const submit = async () => {
        if (!memberName || !title || !body) return
        setBusy(true)
        try {
            await pastoralApi.createNote({
                member_name: memberName, member_email: memberEmail || undefined,
                kind, title, body, follow_up_on: followUp || undefined,
            })
            onDone()
        } catch (e) { onError((e as Error).message) }
        finally { setBusy(false) }
    }

    return (
        <div className="bg-white rounded-2xl border-2 border-[#f5bb00] p-5 mb-5 shadow-md">
            <h3 className="font-black text-[#140152] mb-3">New pastoral note</h3>
            <div className="grid md:grid-cols-2 gap-3 mb-3">
                <input value={memberName} onChange={e => setMemberName(e.target.value)} placeholder="Member name *" className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm" />
                <input value={memberEmail} onChange={e => setMemberEmail(e.target.value)} placeholder="Member email (optional)" className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm" />
                <select value={kind} onChange={e => setKind(e.target.value as PastoralKind)} className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-white">
                    {(Object.keys(KIND_META) as PastoralKind[]).map(k => <option key={k} value={k}>{KIND_META[k].label}</option>)}
                </select>
                <input type="date" value={followUp} onChange={e => setFollowUp(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm" />
            </div>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Subject *" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm mb-2" />
            <textarea value={body} onChange={e => setBody(e.target.value)} rows={5} placeholder="Notes *" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm" />
            <div className="mt-3 flex justify-end gap-2">
                <button onClick={onCancel} className="px-4 py-2 text-sm font-bold text-gray-500">Cancel</button>
                <button onClick={submit} disabled={!memberName || !title || !body || busy} className="bg-[#140152] text-white font-bold px-5 py-2 rounded-lg text-sm disabled:opacity-50">
                    {busy ? <Loader2 className="w-4 h-4 animate-spin inline" /> : 'Save note'}
                </button>
            </div>
        </div>
    )
}
