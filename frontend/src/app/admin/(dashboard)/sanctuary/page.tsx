'use client'
/**
 * /admin/sanctuary — manage bookable spaces + approve/decline requests.
 *
 * Tabs: Rooms (CRUD) · Bookings (approve / decline / annotate).
 */
import { useEffect, useState } from 'react'
import {
    Loader2, Plus, Save, Trash2, Calendar, CheckCircle, XCircle, AlertCircle, MapPin, Users, FileText, Copy,
} from 'lucide-react'
import { sanctuaryApi, type SanctuaryRoom, type SanctuaryBooking } from '@/lib/api'

export default function SanctuaryAdmin() {
    const [tab, setTab] = useState<'rooms' | 'bookings'>('rooms')
    const [rooms, setRooms] = useState<SanctuaryRoom[]>([])
    const [bookings, setBookings] = useState<SanctuaryBooking[]>([])
    const [loading, setLoading] = useState(true)
    const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)

    const refresh = async () => {
        setLoading(true)
        try {
            const [r, b] = await Promise.all([sanctuaryApi.rooms(), sanctuaryApi.listBookings()])
            setRooms(r); setBookings(b)
        } catch (e) { setMsg({ kind: 'err', text: (e as Error).message }) }
        finally { setLoading(false) }
    }
    useEffect(() => { refresh() }, [])
    useEffect(() => { if (msg) { const t = setTimeout(() => setMsg(null), 5000); return () => clearTimeout(t) } }, [msg])

    return (
        <div className="p-4 sm:p-6 max-w-6xl mx-auto pb-32">
            <div className="flex items-start justify-between flex-wrap gap-4 mb-4">
                <div>
                    <h1 className="text-3xl font-black text-[#140152] flex items-center gap-3"><MapPin className="w-7 h-7 text-[#f5bb00]" /> Sanctuary / Hall Booking</h1>
                    <p className="text-gray-500 mt-1 text-sm">Manage bookable rooms and approve / decline incoming requests.</p>
                </div>
            </div>

            <div className="inline-flex bg-white border border-gray-200 rounded-2xl p-1 shadow-sm mb-4">
                <button onClick={() => setTab('rooms')} className={`px-4 py-2 rounded-xl text-sm font-bold ${tab === 'rooms' ? 'bg-[#140152] text-white' : 'text-gray-600 hover:bg-gray-50'}`}>Rooms ({rooms.length})</button>
                <button onClick={() => setTab('bookings')} className={`px-4 py-2 rounded-xl text-sm font-bold ${tab === 'bookings' ? 'bg-[#140152] text-white' : 'text-gray-600 hover:bg-gray-50'}`}>Bookings ({bookings.length})</button>
            </div>

            {msg && (
                <div className={`mb-4 p-3 rounded-xl border flex items-start gap-2 ${msg.kind === 'ok' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                    {msg.kind === 'ok' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}<span className="text-sm">{msg.text}</span>
                </div>
            )}

            {loading ? <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-[#140152]" /></div> : tab === 'rooms' ? (
                <RoomsTab rooms={rooms} onSaved={refresh} onMsg={setMsg} />
            ) : (
                <BookingsTab bookings={bookings} rooms={rooms} onSaved={refresh} onMsg={setMsg} />
            )}
        </div>
    )
}

function RoomsTab({ rooms, onSaved, onMsg }: { rooms: SanctuaryRoom[]; onSaved: () => void; onMsg: (m: { kind: 'ok' | 'err'; text: string }) => void }) {
    const [editing, setEditing] = useState<Omit<SanctuaryRoom, 'id'> | null>(null)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [saving, setSaving] = useState(false)

    const blank: Omit<SanctuaryRoom, 'id'> = {
        name: '', description: '', capacity: 0, location: '', image_url: '',
        equipment: [], rate_note: '', is_active: true, sort_order: 0,
    }

    const save = async () => {
        if (!editing || !editing.name) return
        setSaving(true)
        try {
            if (editingId) await sanctuaryApi.updateRoom(editingId, editing)
            else await sanctuaryApi.createRoom(editing)
            setEditing(null); setEditingId(null)
            onMsg({ kind: 'ok', text: 'Saved.' })
            onSaved()
        } catch (e) { onMsg({ kind: 'err', text: (e as Error).message }) }
        finally { setSaving(false) }
    }

    return (
        <div className="space-y-3">
            {editing && (
                <div className="bg-white border border-[#140152] rounded-2xl shadow-md p-5">
                    <h2 className="font-black text-[#140152] mb-3">{editingId ? 'Edit room' : 'New room'}</h2>
                    <div className="grid md:grid-cols-2 gap-3">
                        <input value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })} placeholder="Name (Wedding Hall, Prayer Chapel…)" className="border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                        <input value={editing.location || ''} onChange={e => setEditing({ ...editing, location: e.target.value })} placeholder="Location (Building B, Floor 2)" className="border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                        <input type="number" min={0} value={editing.capacity} onChange={e => setEditing({ ...editing, capacity: parseInt(e.target.value) || 0 })} placeholder="Capacity (0 = no limit)" className="border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                        <input value={editing.rate_note || ''} onChange={e => setEditing({ ...editing, rate_note: e.target.value })} placeholder="Rate note (Free for members, ₦50k for events…)" className="border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                        <input value={editing.image_url || ''} onChange={e => setEditing({ ...editing, image_url: e.target.value })} placeholder="Image URL (optional)" className="border border-gray-200 rounded-lg px-3 py-2 text-sm md:col-span-2" />
                        <input value={(editing.equipment || []).join(', ')} onChange={e => setEditing({ ...editing, equipment: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })} placeholder="Equipment (projector, AC, sound system…)" className="border border-gray-200 rounded-lg px-3 py-2 text-sm md:col-span-2" />
                    </div>
                    <textarea value={editing.description || ''} onChange={e => setEditing({ ...editing, description: e.target.value })} placeholder="Description" rows={3} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-3" />
                    <div className="flex items-center gap-4 mt-3">
                        <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={editing.is_active} onChange={e => setEditing({ ...editing, is_active: e.target.checked })} /> Active (publicly bookable)</label>
                        <input type="number" value={editing.sort_order} onChange={e => setEditing({ ...editing, sort_order: parseInt(e.target.value) || 0 })} placeholder="Sort order" className="w-24 border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                        <div className="flex-1" />
                        <button onClick={() => { setEditing(null); setEditingId(null) }} className="text-sm text-gray-500 hover:text-gray-800">Cancel</button>
                        <button onClick={save} disabled={saving} className="inline-flex items-center gap-2 bg-[#140152] hover:bg-[#1d0175] text-white font-bold px-5 py-2.5 rounded-xl text-sm disabled:opacity-50">
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save
                        </button>
                    </div>
                </div>
            )}

            {!editing && (
                <button onClick={() => { setEditing(blank); setEditingId(null) }} className="inline-flex items-center gap-2 bg-[#f5bb00] hover:bg-amber-400 text-[#140152] font-black px-5 py-2.5 rounded-xl text-sm">
                    <Plus className="w-4 h-4" /> New room
                </button>
            )}

            <div className="grid md:grid-cols-2 gap-3">
                {rooms.map(r => (
                    <div key={r.id} className="bg-white border border-gray-100 rounded-2xl shadow-sm p-4">
                        <div className="flex items-start justify-between gap-2">
                            <div>
                                <p className="font-black text-[#140152]">{r.name}</p>
                                <p className="text-xs text-gray-500">{r.location || '—'} · cap {r.capacity}</p>
                            </div>
                            <div className="flex items-center gap-1">
                                <button onClick={() => { setEditing({ ...r }); setEditingId(r.id) }} className="text-xs underline text-[#140152]">Edit</button>
                                <button onClick={async () => { if (confirm(`Delete "${r.name}"?`)) { try { await sanctuaryApi.deleteRoom(r.id); onSaved() } catch (e) { onMsg({ kind: 'err', text: (e as Error).message }) } } }} className="p-1.5 text-red-400 hover:text-red-700 hover:bg-red-50 rounded">
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                        {r.description && <p className="text-xs text-gray-600 mt-2 line-clamp-2">{r.description}</p>}
                        {r.equipment.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                                {r.equipment.map((e, i) => <span key={i} className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{e}</span>)}
                            </div>
                        )}
                        {!r.is_active && <p className="mt-2 text-[10px] uppercase tracking-widest text-red-500 font-bold">Inactive</p>}
                    </div>
                ))}
            </div>
        </div>
    )
}

function BookingsTab({ bookings, rooms, onSaved, onMsg }: { bookings: SanctuaryBooking[]; rooms: SanctuaryRoom[]; onSaved: () => void; onMsg: (m: { kind: 'ok' | 'err'; text: string }) => void }) {
    const roomName = (id: string) => rooms.find(r => r.id === id)?.name || '—'

    const act = async (b: SanctuaryBooking, status: SanctuaryBooking['status']) => {
        try {
            await sanctuaryApi.updateBooking(b.id, { status })
            onSaved()
            onMsg({ kind: 'ok', text: `Marked ${status}.` })
        } catch (e) { onMsg({ kind: 'err', text: (e as Error).message }) }
    }

    return (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm divide-y divide-gray-100">
            {bookings.length === 0 && <p className="p-6 text-center text-gray-400 text-sm">No bookings yet.</p>}
            {bookings.map(b => (
                <div key={b.id} className="p-4 grid md:grid-cols-[1fr_auto] gap-3 items-start">
                    <div>
                        <div className="flex items-baseline gap-2 flex-wrap">
                            <p className="font-bold text-[#140152]">{b.purpose}</p>
                            <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${
                                b.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                                b.status === 'declined' ? 'bg-red-100 text-red-700' :
                                b.status === 'cancelled' ? 'bg-gray-100 text-gray-500' :
                                'bg-amber-100 text-amber-700'
                            }`}>{b.status}</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                            <Calendar className="w-3 h-3 inline mr-1" />
                            {new Date(b.starts_at).toLocaleString()} → {new Date(b.ends_at).toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-500"><MapPin className="w-3 h-3 inline mr-1" /> {roomName(b.room_id)}</p>
                        <p className="text-xs text-gray-500 mt-1">{b.contact_name} · {b.contact_email}{b.contact_phone ? ` · ${b.contact_phone}` : ''}</p>
                        {b.note && <p className="text-xs text-gray-600 mt-2 italic">"{b.note}"</p>}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                        {b.status !== 'approved' && <button onClick={() => act(b, 'approved')} className="inline-flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg"><CheckCircle className="w-3 h-3" /> Approve</button>}
                        {b.status !== 'declined' && <button onClick={() => act(b, 'declined')} className="inline-flex items-center gap-1 bg-red-100 text-red-700 hover:bg-red-200 text-xs font-bold px-3 py-1.5 rounded-lg"><XCircle className="w-3 h-3" /> Decline</button>}
                        {b.status === 'approved' && (
                            <>
                                <a href={`/sanctuary/letter/${b.id}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 bg-[#140152] hover:bg-[#1d0175] text-white text-xs font-bold px-3 py-1.5 rounded-lg"><FileText className="w-3 h-3" /> Permission letter</a>
                                <button onClick={() => {
                                    const url = `${window.location.origin}/sanctuary/letter/${b.id}`
                                    navigator.clipboard.writeText(url).then(() => onMsg({ kind: 'ok', text: 'Letter link copied.' })).catch(() => onMsg({ kind: 'err', text: url }))
                                }} className="inline-flex items-center gap-1 bg-[#f5bb00]/15 hover:bg-[#f5bb00]/30 text-[#8a6d00] text-xs font-bold px-3 py-1.5 rounded-lg"><Copy className="w-3 h-3" /> Copy link</button>
                            </>
                        )}
                    </div>
                </div>
            ))}
        </div>
    )
}
