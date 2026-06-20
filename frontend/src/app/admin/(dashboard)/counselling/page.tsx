'use client'
import { useEffect, useState } from 'react'
import { Loader2, Plus, Save, Trash2, Calendar, AlertCircle, CheckCircle, Clock, User as UserIcon } from 'lucide-react'
import { counsellingApi, wakeBackend, type CounsellingAvailability, type CounsellingBooking } from '@/lib/api'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export default function AdminCounsellingPage() {
    const [tab, setTab] = useState<'bookings' | 'availability'>('bookings')
    const [bookings, setBookings] = useState<CounsellingBooking[]>([])
    const [avails, setAvails] = useState<CounsellingAvailability[]>([])
    const [loading, setLoading] = useState(true)
    const [showNewAvail, setShowNewAvail] = useState(false)
    const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)

    const [loadError, setLoadError] = useState<string | null>(null)
    const load = async () => {
        setLoadError(null)
        try {
            const [bb, aa] = await Promise.all([counsellingApi.listBookings(), counsellingApi.listAvailability()])
            setBookings(bb); setAvails(aa)
        } catch (e) { setLoadError((e as Error).message) }
        finally { setLoading(false) }
    }
    useEffect(() => { load() }, [])
    useEffect(() => { if (msg) { const t = setTimeout(() => setMsg(null), 5000); return () => clearTimeout(t) } }, [msg])

    const updateBooking = async (id: string, status: string) => {
        try { await counsellingApi.updateBooking(id, { status }); setMsg({ kind: 'ok', text: `Marked ${status}.` }); await load() }
        catch (e) { setMsg({ kind: 'err', text: (e as Error).message }) }
    }
    const deleteBooking = async (id: string) => {
        if (!confirm('Delete this booking?')) return
        try { await counsellingApi.deleteBooking(id); await load() }
        catch (e) { setMsg({ kind: 'err', text: (e as Error).message }) }
    }
    const saveAvail = async (a: CounsellingAvailability) => {
        try {
            const body = { pastor_id: a.pastor_id, day_of_week: a.day_of_week, start_time: a.start_time, end_time: a.end_time, slot_minutes: a.slot_minutes, is_active: a.is_active }
            if (a.id) await counsellingApi.updateAvailability(a.id, body)
            else await counsellingApi.addAvailability(body)
            setShowNewAvail(false); await load()
        } catch (e) { setMsg({ kind: 'err', text: (e as Error).message }) }
    }
    const deleteAvail = async (id: string) => {
        if (!confirm('Delete this availability window?')) return
        try { await counsellingApi.deleteAvailability(id); await load() }
        catch (e) { setMsg({ kind: 'err', text: (e as Error).message }) }
    }

    if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-10 h-10 animate-spin text-[#140152]" /></div>

    if (loadError) return (
        <div className="max-w-md mx-auto mt-24 bg-white border border-red-100 rounded-2xl p-8 text-center shadow-sm">
            <AlertCircle className="w-12 h-12 mx-auto text-red-500 mb-3" />
            <h2 className="text-xl font-black text-[#140152]">Counselling couldn't load</h2>
            <p className="text-sm text-gray-600 mt-2 break-words">{loadError}</p>
            <p className="text-xs text-gray-400 mt-3">Render free-tier servers sleep after inactivity. The first request after idle can take 30–60 seconds to wake.</p>
            <div className="mt-5 flex gap-2 justify-center flex-wrap">
                <button onClick={async () => {
                    setLoadError(null)
                    const ok = await wakeBackend(60_000)
                    if (ok) { setLoading(true); load() }
                    else setLoadError("Backend still not responding after 60 seconds. Check Render dashboard.")
                }} className="bg-[#f5bb00] hover:bg-amber-400 text-[#140152] font-bold px-5 py-2.5 rounded-xl text-sm">
                    Wake server &amp; retry
                </button>
                <button onClick={() => { setLoading(true); load() }} className="bg-[#140152] hover:bg-[#1d0175] text-white font-bold px-5 py-2.5 rounded-xl text-sm">Try again</button>
            </div>
        </div>
    )

    return (
        <div className="p-4 sm:p-6 max-w-6xl mx-auto pb-20">
            <div className="mb-6">
                <h1 className="text-3xl font-black text-[#140152] flex items-center gap-3"><Calendar className="w-7 h-7" /> Counselling</h1>
                <p className="text-gray-500 mt-1 text-sm">Manage pastor availability and member bookings.</p>
            </div>

            {msg && <div className={`mb-4 p-3 rounded-xl border flex items-start gap-2 ${msg.kind === 'ok' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                {msg.kind === 'ok' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}<span className="text-sm">{msg.text}</span>
            </div>}

            <div className="flex gap-1 mb-6 border-b border-gray-200">
                <button onClick={() => setTab('bookings')} className={`px-4 py-2.5 text-sm font-bold border-b-2 -mb-px ${tab === 'bookings' ? 'text-[#140152] border-[#140152]' : 'text-gray-500 border-transparent hover:text-[#140152]'}`}>Bookings ({bookings.length})</button>
                <button onClick={() => setTab('availability')} className={`px-4 py-2.5 text-sm font-bold border-b-2 -mb-px ${tab === 'availability' ? 'text-[#140152] border-[#140152]' : 'text-gray-500 border-transparent hover:text-[#140152]'}`}>Availability ({avails.length})</button>
            </div>

            {tab === 'bookings' && (
                <div className="space-y-3">
                    {bookings.length === 0 && <p className="text-center text-gray-400 py-12">No bookings yet.</p>}
                    {bookings.map(b => (
                        <div key={b.id} className="bg-white border border-gray-100 rounded-xl px-5 py-4 shadow-sm">
                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-full bg-[#140152]/10 text-[#140152] flex items-center justify-center font-bold text-sm flex-shrink-0">
                                    {b.user_name.slice(0, 1).toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-[#140152] truncate">{b.user_name} <span className="text-xs text-gray-400 font-normal">· {b.user_email}</span></p>
                                    <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-2"><Clock className="w-3 h-3" />{new Date(b.scheduled_at).toLocaleString()} · {b.duration_minutes} min</p>
                                    {b.topic && <p className="text-sm text-gray-600 mt-1">Topic: {b.topic}</p>}
                                    {b.notes && <p className="text-xs text-gray-500 mt-1 italic">{b.notes}</p>}
                                </div>
                                <span className={`text-xs font-bold px-2 py-1 rounded ${b.status === 'confirmed' ? 'bg-green-50 text-green-700' : b.status === 'cancelled' ? 'bg-red-50 text-red-700' : b.status === 'completed' ? 'bg-gray-50 text-gray-500' : 'bg-amber-50 text-amber-700'}`}>{b.status}</span>
                            </div>
                            <div className="mt-3 flex flex-wrap gap-2">
                                {b.status === 'pending' && <button onClick={() => updateBooking(b.id, 'confirmed')} className="text-xs font-bold px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg">Confirm</button>}
                                {b.status === 'pending' && <button onClick={() => updateBooking(b.id, 'cancelled')} className="text-xs font-bold px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg">Decline</button>}
                                {b.status === 'confirmed' && <button onClick={() => updateBooking(b.id, 'completed')} className="text-xs font-bold px-3 py-1.5 bg-[#140152] hover:bg-[#1d0175] text-white rounded-lg">Mark Completed</button>}
                                <button onClick={() => deleteBooking(b.id)} className="text-xs font-bold px-3 py-1.5 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 className="w-3 h-3 inline mr-1" /> Delete</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {tab === 'availability' && (
                <div>
                    <div className="flex justify-end mb-4">
                        <button onClick={() => setShowNewAvail(true)} className="inline-flex items-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 text-[#140152] font-bold px-4 py-2.5 rounded-lg text-sm"><Plus className="w-4 h-4" /> Add Window</button>
                    </div>
                    {showNewAvail && (
                        <AvailForm onSave={saveAvail} onCancel={() => setShowNewAvail(false)} />
                    )}
                    <div className="space-y-2">
                        {avails.length === 0 && <p className="text-center text-gray-400 py-12">No availability windows yet. Add one so members can book.</p>}
                        {avails.map(a => (
                            <div key={a.id} className="bg-white border border-gray-100 rounded-xl px-5 py-4 flex items-center gap-4 shadow-sm">
                                <div className="w-10 h-10 rounded-xl bg-[#140152]/10 text-[#140152] flex items-center justify-center font-black flex-shrink-0">{DAYS[a.day_of_week]}</div>
                                <div className="flex-1">
                                    <p className="font-bold text-[#140152]">{a.start_time} – {a.end_time}</p>
                                    <p className="text-xs text-gray-400">{a.slot_minutes}-min slots · pastor ID: {a.pastor_id.slice(0, 8)}…</p>
                                </div>
                                <button onClick={() => a.id && deleteAvail(a.id)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}

function AvailForm({ onSave, onCancel }: { onSave: (a: CounsellingAvailability) => void; onCancel: () => void }) {
    const [a, setA] = useState<CounsellingAvailability>({ pastor_id: '', day_of_week: 1, start_time: '10:00', end_time: '12:00', slot_minutes: 30, is_active: true })
    return (
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-md mb-4">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-3">
                <div className="md:col-span-2">
                    <label className="text-xs font-bold uppercase text-gray-500 block mb-1">Pastor User ID</label>
                    <input value={a.pastor_id} onChange={e => setA({ ...a, pastor_id: e.target.value })} placeholder="user UUID" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                    <label className="text-xs font-bold uppercase text-gray-500 block mb-1">Day</label>
                    <select value={a.day_of_week} onChange={e => setA({ ...a, day_of_week: parseInt(e.target.value) })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
                        {DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
                    </select>
                </div>
                <div>
                    <label className="text-xs font-bold uppercase text-gray-500 block mb-1">Start</label>
                    <input type="time" value={a.start_time} onChange={e => setA({ ...a, start_time: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                    <label className="text-xs font-bold uppercase text-gray-500 block mb-1">End</label>
                    <input type="time" value={a.end_time} onChange={e => setA({ ...a, end_time: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                    <label className="text-xs font-bold uppercase text-gray-500 block mb-1">Slot Length (min)</label>
                    <input type="number" min={15} step={15} value={a.slot_minutes} onChange={e => setA({ ...a, slot_minutes: parseInt(e.target.value) || 30 })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                </div>
            </div>
            <div className="flex justify-end gap-2">
                <button onClick={onCancel} className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-bold">Cancel</button>
                <button onClick={() => onSave(a)} disabled={!a.pastor_id} className="inline-flex items-center gap-2 bg-[#140152] hover:bg-[#1d0175] text-white font-bold px-5 py-2 rounded-lg text-sm disabled:opacity-50"><Save className="w-4 h-4" /> Save</button>
            </div>
        </div>
    )
}
