'use client'
import { useEffect, useMemo, useState } from 'react'
import {
    Loader2, Heart, ChevronRight, Plus, Trash2, MessageCircle, Mail, Phone,
    MapPin, Users, RefreshCw, AlertCircle, CheckCircle, Sparkles, Clock
} from 'lucide-react'
import { conversionApi, type ConversionJourney, type ConversionStage } from '@/lib/api'

const STAGES: { key: ConversionStage; label: string; tint: string; icon: React.ReactNode }[] = [
    { key: 'welcomed',    label: 'Welcomed',    tint: 'bg-rose-100 text-rose-700 border-rose-200',    icon: <Sparkles className="w-3.5 h-3.5" /> },
    { key: 'called',      label: 'Called',      tint: 'bg-amber-100 text-amber-700 border-amber-200', icon: <Phone className="w-3.5 h-3.5" /> },
    { key: 'studying',    label: 'In Study',    tint: 'bg-blue-100 text-blue-700 border-blue-200',    icon: <MessageCircle className="w-3.5 h-3.5" /> },
    { key: 'baptism',     label: 'Baptism',     tint: 'bg-cyan-100 text-cyan-700 border-cyan-200',    icon: <Heart className="w-3.5 h-3.5" /> },
    { key: 'small_group', label: 'Small Group', tint: 'bg-purple-100 text-purple-700 border-purple-200', icon: <Users className="w-3.5 h-3.5" /> },
    { key: 'member',      label: 'Member',      tint: 'bg-green-100 text-green-700 border-green-200',  icon: <CheckCircle className="w-3.5 h-3.5" /> },
    { key: 'dormant',     label: 'Dormant',     tint: 'bg-gray-100 text-gray-600 border-gray-200',    icon: <Clock className="w-3.5 h-3.5" /> },
]

export default function AdminConversionPage() {
    const [items, setItems] = useState<ConversionJourney[]>([])
    const [counts, setCounts] = useState<Record<ConversionStage, number> | null>(null)
    const [loading, setLoading] = useState(true)
    const [stage, setStage] = useState<ConversionStage | 'all'>('all')
    const [adding, setAdding] = useState(false)
    const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)

    const load = async () => {
        setLoading(true)
        try {
            const [list, funnel] = await Promise.all([
                conversionApi.adminAll(),
                conversionApi.adminFunnel(),
            ])
            setItems(list); setCounts(funnel.counts)
        } catch (e) { setMsg({ kind: 'err', text: (e as Error).message }) }
        finally { setLoading(false) }
    }
    useEffect(() => { load() }, [])
    useEffect(() => { if (msg) { const t = setTimeout(() => setMsg(null), 5000); return () => clearTimeout(t) } }, [msg])

    const visible = stage === 'all' ? items : items.filter(i => i.stage === stage)

    const moveStage = async (j: ConversionJourney, next: ConversionStage) => {
        try { await conversionApi.adminUpdate(j.id, { stage: next }); await load() }
        catch (e) { setMsg({ kind: 'err', text: (e as Error).message }) }
    }
    const remove = async (id: string) => {
        if (!confirm('Delete this journey row?')) return
        try { await conversionApi.adminDelete(id); await load() }
        catch (e) { setMsg({ kind: 'err', text: (e as Error).message }) }
    }
    const sweepDormant = async () => {
        try {
            const r = await conversionApi.adminSweepDormant()
            setMsg({ kind: 'ok', text: `Moved ${r.moved} stale journeys to Dormant.` })
            await load()
        } catch (e) { setMsg({ kind: 'err', text: (e as Error).message }) }
    }

    return (
        <div className="p-4 sm:p-6 max-w-7xl mx-auto pb-20">
            <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
                <div>
                    <h1 className="text-3xl font-black text-[#140152] flex items-center gap-3"><Heart className="w-7 h-7 text-rose-500" /> Conversion Follow-Up</h1>
                    <p className="text-gray-500 mt-1 text-sm">Every altar-call respondent moves through this pipeline. Shepherd them from <span className="font-bold text-[#140152]">first yes → committed member</span>.</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={sweepDormant} className="text-xs font-bold text-gray-600 hover:text-[#140152] px-3 py-2 rounded-lg border border-gray-200 inline-flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" /> Sweep 30-day stale → Dormant
                    </button>
                    <button onClick={load} className="text-sm text-gray-500 hover:text-[#140152] inline-flex items-center gap-1.5"><RefreshCw className="w-4 h-4" /> Refresh</button>
                    <button onClick={() => setAdding(true)} className="bg-[#140152] hover:bg-[#1d0175] text-white font-bold px-4 py-2 rounded-xl text-sm inline-flex items-center gap-1.5"><Plus className="w-4 h-4" /> Add manually</button>
                </div>
            </div>

            {msg && (
                <div className={`mb-4 p-3 rounded-xl border flex items-start gap-2 ${msg.kind === 'ok' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                    {msg.kind === 'ok' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}<span className="text-sm">{msg.text}</span>
                </div>
            )}

            {/* Funnel */}
            {counts && (
                <div className="grid grid-cols-2 md:grid-cols-7 gap-2 mb-6">
                    <button onClick={() => setStage('all')} className={`p-3 rounded-xl border text-left ${stage === 'all' ? 'bg-[#140152] text-white border-[#140152]' : 'bg-white border-gray-100 hover:border-[#140152]/40'}`}>
                        <p className="text-[9px] uppercase tracking-widest font-bold opacity-80">All</p>
                        <p className="text-2xl font-black mt-0.5">{items.length}</p>
                    </button>
                    {STAGES.map(s => (
                        <button key={s.key} onClick={() => setStage(s.key)}
                            className={`p-3 rounded-xl border text-left transition-all ${stage === s.key ? 'bg-[#140152] text-white border-[#140152]' : 'bg-white border-gray-100 hover:border-[#140152]/40'}`}>
                            <p className={`text-[9px] uppercase tracking-widest font-bold ${stage === s.key ? 'opacity-80' : 'text-gray-400'} inline-flex items-center gap-1`}>{s.icon} {s.label}</p>
                            <p className="text-2xl font-black mt-0.5">{counts[s.key] || 0}</p>
                        </button>
                    ))}
                </div>
            )}

            {adding && <AddForm onCancel={() => setAdding(false)} onDone={() => { setAdding(false); load() }} onError={t => setMsg({ kind: 'err', text: t })} />}

            {/* List */}
            {loading ? (
                <div className="flex items-center justify-center min-h-[20vh]"><Loader2 className="w-8 h-8 animate-spin text-[#140152]" /></div>
            ) : visible.length === 0 ? (
                <div className="bg-white border border-gray-100 rounded-2xl p-10 text-center">
                    <Heart className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                    <p className="text-gray-500 text-sm">{stage === 'all' ? 'No journeys yet. Altar-call responses will appear here automatically.' : `No one currently in ${stage}.`}</p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="divide-y divide-gray-100">
                        {visible.map(j => <Row key={j.id} j={j} onMove={moveStage} onDelete={remove} />)}
                    </div>
                </div>
            )}
        </div>
    )
}

function Row({ j, onMove, onDelete }: { j: ConversionJourney; onMove: (j: ConversionJourney, n: ConversionStage) => void; onDelete: (id: string) => void }) {
    const stageDef = STAGES.find(s => s.key === j.stage) || STAGES[0]
    const next = useMemo(() => {
        const i = STAGES.findIndex(s => s.key === j.stage)
        return (i >= 0 && i < STAGES.length - 1) ? STAGES[i + 1] : null
    }, [j.stage])

    return (
        <div className="px-5 py-4 flex items-center gap-3 hover:bg-gray-50">
            <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-700 font-black flex items-center justify-center flex-shrink-0">
                {(j.name || '?').slice(0, 1).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
                <p className="font-black text-[#140152] truncate">{j.name}</p>
                <p className="text-xs text-gray-500 truncate inline-flex items-center gap-3">
                    {j.email && <span className="inline-flex items-center gap-1"><Mail className="w-3 h-3" /> {j.email}</span>}
                    {j.phone && <span className="inline-flex items-center gap-1"><Phone className="w-3 h-3" /> {j.phone}</span>}
                    {j.location && <span className="inline-flex items-center gap-1"><MapPin className="w-3 h-3" /> {j.location}</span>}
                </p>
            </div>
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded border ${stageDef.tint} inline-flex items-center gap-1.5`}>
                {stageDef.icon} {stageDef.label}
            </span>
            {next && (
                <button onClick={() => onMove(j, next.key)} title={`Advance to ${next.label}`}
                    className="text-[10px] font-bold px-3 py-1.5 rounded-lg bg-[#140152] text-white hover:bg-[#1d0175] inline-flex items-center gap-1">
                    → {next.label}
                </button>
            )}
            <button onClick={() => onDelete(j.id)} className="p-2 text-red-300 hover:text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
        </div>
    )
}

function AddForm({ onCancel, onDone, onError }: { onCancel: () => void; onDone: () => void; onError: (t: string) => void }) {
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [phone, setPhone] = useState('')
    const [location, setLocation] = useState('')
    const [notes, setNotes] = useState('')
    const [busy, setBusy] = useState(false)

    const submit = async () => {
        if (!name.trim()) return
        setBusy(true)
        try {
            await conversionApi.adminCreate({ name, email: email || undefined, phone: phone || undefined, location: location || undefined, notes: notes || undefined })
            onDone()
        } catch (e) { onError((e as Error).message) }
        finally { setBusy(false) }
    }

    return (
        <div className="bg-white rounded-2xl border-2 border-[#f5bb00] p-5 mb-5 shadow-md">
            <h3 className="font-black text-[#140152] mb-3">Add a journey manually</h3>
            <div className="grid md:grid-cols-2 gap-3">
                <input value={name} onChange={e => setName(e.target.value)} placeholder="Name *" className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm" />
                <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" type="email" className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm" />
                <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Phone" className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm" />
                <input value={location} onChange={e => setLocation(e.target.value)} placeholder="Location" className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm" />
            </div>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Notes (optional)" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm mt-3" />
            <div className="flex justify-end gap-2 mt-3">
                <button onClick={onCancel} className="px-4 py-2 text-sm font-bold text-gray-500">Cancel</button>
                <button onClick={submit} disabled={!name.trim() || busy} className="bg-[#140152] text-white font-bold px-5 py-2 rounded-lg text-sm disabled:opacity-50">
                    {busy ? <Loader2 className="w-4 h-4 animate-spin inline" /> : 'Add to pipeline'}
                </button>
            </div>
        </div>
    )
}
