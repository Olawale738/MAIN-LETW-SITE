'use client'
/**
 * Public /sanctuary — browse bookable rooms + submit a booking request.
 *
 * Each room card shows capacity, equipment chips, and a "Request booking"
 * button that opens a modal. Submission posts to the public endpoint; admin
 * picks it up in /admin/sanctuary and approves or declines.
 */
import { useEffect, useState } from 'react'
import {
    Loader2, MapPin, Users, Calendar, Send, CheckCircle, X, AlertCircle, Sparkles,
} from 'lucide-react'
import { sanctuaryApi, ministryContentApi, type SanctuaryRoom } from '@/lib/api'

const DEFAULT_COPY = {
    eyebrow: 'Bookable Spaces',
    title:   'Sanctuary, halls & rooms',
    subtitle: 'Reserve our wedding hall, prayer chapel, conference rooms and more for your event, gathering or quiet retreat.',
}

export default function SanctuaryPage() {
    const [rooms, setRooms] = useState<SanctuaryRoom[]>([])
    const [loading, setLoading] = useState(true)
    const [picked, setPicked] = useState<SanctuaryRoom | null>(null)
    const [copy, setCopy] = useState(DEFAULT_COPY)

    useEffect(() => {
        sanctuaryApi.rooms()
            .then(setRooms)
            .catch(() => { /* page renders empty-state */ })
            .finally(() => setLoading(false))
        ministryContentApi.get('sanctuary-page')
            .then(r => setCopy({ ...DEFAULT_COPY, ...(r.content || {}) }))
            .catch(() => { /* keep defaults */ })
    }, [])

    const active = rooms.filter(r => r.is_active)

    return (
        <main className="min-h-screen bg-gradient-to-b from-[#fbf5e6] via-white to-[#fbf5e6]">
            {/* Hero */}
            <section className="relative overflow-hidden py-24 px-4">
                <div className="absolute -top-40 right-0 w-[500px] h-[500px] rounded-full bg-[#f5bb00]/15 blur-[120px] pointer-events-none" />
                <div className="absolute -bottom-40 left-0 w-[500px] h-[500px] rounded-full bg-[#140152]/10 blur-[120px] pointer-events-none" />
                <div className="relative max-w-3xl mx-auto text-center">
                    <p className="inline-flex items-center gap-2 text-[#f5bb00] font-bold tracking-[0.4em] text-xs uppercase mb-4">
                        <Sparkles className="w-3.5 h-3.5" /> {copy.eyebrow}
                    </p>
                    <h1 className="text-4xl md:text-6xl font-black text-[#140152] leading-[1.05] tracking-tight">
                        {copy.title}
                    </h1>
                    <p className="text-lg text-[#140152]/70 mt-5 max-w-xl mx-auto leading-relaxed">
                        {copy.subtitle}
                    </p>
                </div>
            </section>

            {/* Rooms grid */}
            <section className="max-w-6xl mx-auto px-4 pb-24">
                {loading ? (
                    <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-[#140152]" /></div>
                ) : active.length === 0 ? (
                    <div className="text-center py-16 text-[#140152]/60">
                        <MapPin className="w-12 h-12 mx-auto mb-3 opacity-40" />
                        <p>No rooms are listed for booking yet. Please check back soon.</p>
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {active.map(r => (
                            <article key={r.id} className="group bg-white border border-gray-100 rounded-3xl shadow-sm hover:shadow-xl transition-shadow overflow-hidden flex flex-col">
                                {r.image_url ? (
                                    <img src={r.image_url} alt={r.name} className="aspect-[16/10] object-cover w-full" />
                                ) : (
                                    <div className="aspect-[16/10] bg-gradient-to-br from-[#140152]/10 via-[#f5bb00]/10 to-[#140152]/5 flex items-center justify-center text-[#140152]/30">
                                        <MapPin className="w-12 h-12" />
                                    </div>
                                )}
                                <div className="p-5 flex-1 flex flex-col">
                                    <h2 className="font-black text-[#140152] text-lg">{r.name}</h2>
                                    {r.location && <p className="text-xs text-gray-500 mt-0.5 inline-flex items-center gap-1"><MapPin className="w-3 h-3" /> {r.location}</p>}
                                    <p className="text-xs text-gray-500 inline-flex items-center gap-1 mt-1"><Users className="w-3 h-3" /> Up to {r.capacity}</p>
                                    {r.description && <p className="text-sm text-gray-700 mt-3 leading-relaxed flex-1">{r.description}</p>}
                                    {r.equipment.length > 0 && (
                                        <div className="mt-3 flex flex-wrap gap-1">
                                            {r.equipment.map((e, i) => <span key={i} className="text-[10px] bg-[#140152]/5 text-[#140152] px-2 py-0.5 rounded-full">{e}</span>)}
                                        </div>
                                    )}
                                    {r.rate_note && <p className="text-xs italic text-gray-500 mt-3">{r.rate_note}</p>}
                                    <button onClick={() => setPicked(r)} className="mt-4 inline-flex items-center justify-center gap-2 bg-[#140152] hover:bg-[#1d0175] text-white font-bold px-5 py-3 rounded-full text-sm">
                                        Request booking <Calendar className="w-4 h-4" />
                                    </button>
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </section>

            {picked && <BookingModal room={picked} onClose={() => setPicked(null)} />}
        </main>
    )
}

function BookingModal({ room, onClose }: { room: SanctuaryRoom; onClose: () => void }) {
    const [purpose, setPurpose] = useState('')
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [phone, setPhone] = useState('')
    const [start, setStart] = useState('')
    const [end, setEnd] = useState('')
    const [attendees, setAttendees] = useState<number>(0)
    const [note, setNote] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [done, setDone] = useState(false)
    const [err, setErr] = useState<string | null>(null)

    const submit = async (e: React.FormEvent) => {
        e.preventDefault()
        setErr(null)
        if (!purpose || !name || !email || !start || !end) return
        if (new Date(end) <= new Date(start)) { setErr('End time must be after start time.'); return }
        if (attendees > room.capacity) { setErr(`Capacity for ${room.name} is ${room.capacity}.`); return }
        setSubmitting(true)
        try {
            await sanctuaryApi.requestBooking({
                room_id: room.id, purpose,
                contact_name: name, contact_email: email, contact_phone: phone || null,
                starts_at: new Date(start).toISOString(), ends_at: new Date(end).toISOString(),
                attendees, note: note || null,
            })
            setDone(true)
        } catch (e) { setErr((e as Error).message) }
        finally { setSubmitting(false) }
    }

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={onClose}>
            <div onClick={e => e.stopPropagation()} className="bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-100 flex items-start justify-between">
                    <div>
                        <p className="text-[10px] uppercase tracking-[0.3em] font-bold text-[#f5bb00]">Booking request</p>
                        <h3 className="font-black text-[#140152] text-xl mt-1">{room.name}</h3>
                    </div>
                    <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
                </div>

                {done ? (
                    <div className="p-8 text-center">
                        <CheckCircle className="w-14 h-14 text-emerald-500 mx-auto mb-3" />
                        <h4 className="text-2xl font-black text-[#140152]">Request received</h4>
                        <p className="text-gray-600 mt-3 text-sm">
                            We&apos;ve emailed a confirmation to <strong className="text-[#140152]">{email}</strong>.
                        </p>
                        <div className="mt-5 bg-gray-50 border border-gray-100 rounded-2xl p-4 text-left">
                            <p className="text-[10px] font-black uppercase tracking-widest text-[#f5bb00] mb-2">What happens next</p>
                            <ol className="text-xs text-gray-700 space-y-1.5 list-decimal ml-4">
                                <li>A coordinator checks {room.name}&apos;s calendar against your window.</li>
                                <li>You&apos;ll get an <strong>approval or decline</strong> email within 48 hours.</li>
                                <li>On approval, we&apos;ll send arrival and setup notes for the space.</li>
                            </ol>
                        </div>
                        <button onClick={onClose} className="mt-6 inline-flex items-center gap-2 bg-[#140152] text-white font-bold px-5 py-2.5 rounded-full text-sm">Close</button>
                    </div>
                ) : (
                    <form onSubmit={submit} className="p-6 space-y-3">
                        {err && (
                            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm flex items-start gap-2">
                                <AlertCircle className="w-4 h-4 mt-0.5" />{err}
                            </div>
                        )}
                        <input value={purpose} onChange={e => setPurpose(e.target.value)} required placeholder="Purpose (Wedding, Conference, Prayer night…)" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm" />
                        <div className="grid grid-cols-2 gap-2">
                            <input value={name} onChange={e => setName(e.target.value)} required placeholder="Your name" className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm" />
                            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="Email" className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm" />
                        </div>
                        <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Phone (optional)" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm" />
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="block text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-1 pl-1">Start</label>
                                <input type="datetime-local" value={start} onChange={e => setStart(e.target.value)} required className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm" />
                            </div>
                            <div>
                                <label className="block text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-1 pl-1">End</label>
                                <input type="datetime-local" value={end} onChange={e => setEnd(e.target.value)} required className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm" />
                            </div>
                        </div>
                        <input type="number" min={0} max={room.capacity} value={attendees || ''} onChange={e => setAttendees(parseInt(e.target.value) || 0)} placeholder={`Expected attendees (max ${room.capacity})`} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm" />
                        <textarea value={note} onChange={e => setNote(e.target.value)} rows={3} placeholder="Anything else we should know? (catering, AV needs, accessibility)" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm resize-y" />
                        <button type="submit" disabled={submitting} className="w-full inline-flex items-center justify-center gap-2 bg-[#140152] hover:bg-[#1d0175] text-white font-black px-5 py-3 rounded-full text-sm disabled:opacity-60">
                            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                            Send request
                        </button>
                    </form>
                )}
            </div>
        </div>
    )
}
