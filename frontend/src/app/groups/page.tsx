'use client'
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
    Users, Search, MapPin, Calendar, ArrowRight, Loader2, CheckCircle2,
    Wifi, AlertCircle, Heart, Sparkles
} from 'lucide-react'
import PageCmsOverlay from '@/components/cms/PageCmsOverlay'
import { smallGroupsApi, type SmallGroup, type SmallGroupAudience } from '@/lib/api'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const AUDIENCES: { key: SmallGroupAudience | 'any'; label: string }[] = [
    { key: 'any', label: 'Everyone' },
    { key: 'newcomers', label: 'Newcomers' },
    { key: 'young_adults', label: 'Young Adults' },
    { key: 'couples', label: 'Couples' },
    { key: 'families', label: 'Families' },
    { key: 'seniors', label: 'Seniors' },
    { key: 'men', label: 'Men' },
    { key: 'women', label: 'Women' },
    { key: 'students', label: 'Students' },
]

export default function GroupsPage() {
    const [groups, setGroups] = useState<SmallGroup[]>([])
    const [loading, setLoading] = useState(true)
    const [q, setQ] = useState('')
    const [audience, setAudience] = useState<SmallGroupAudience | 'any'>('any')
    const [day, setDay] = useState<number | 'any'>('any')
    const [online, setOnline] = useState<'any' | 'online' | 'in_person'>('any')
    const [picked, setPicked] = useState<SmallGroup | null>(null)

    useEffect(() => {
        smallGroupsApi.listPublic()
            .then(setGroups)
            .catch(() => setGroups([]))
            .finally(() => setLoading(false))
    }, [])

    const visible = useMemo(() => {
        const query = q.trim().toLowerCase()
        return groups.filter(g => {
            if (audience !== 'any' && g.audience !== audience) return false
            if (day !== 'any' && g.day_of_week !== day) return false
            if (online === 'online' && !g.is_online) return false
            if (online === 'in_person' && g.is_online) return false
            if (!query) return true
            return (g.name + ' ' + (g.description || '') + ' ' + (g.topics || '') + ' ' + (g.city || '')).toLowerCase().includes(query)
        })
    }, [groups, q, audience, day, online])

    return (
        <main className="min-h-screen bg-gradient-to-b from-[#fbf5e6] via-white to-[#fbf5e6]">
            <PageCmsOverlay slug="groups" position="top" />

            {/* Hero */}
            <section className="max-w-5xl mx-auto px-6 pt-24 pb-8 text-center">
                <p className="text-[#f5bb00] font-bold tracking-[0.35em] text-[10px] uppercase mb-3 inline-flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5" /> Small Groups · House Fellowships
                </p>
                <h1 className="font-serif text-4xl md:text-6xl font-black text-[#140152] leading-tight">
                    Find your <span className="bg-gradient-to-r from-[#f5bb00] via-amber-500 to-[#f5bb00] bg-clip-text text-transparent">people</span>
                </h1>
                <p className="font-sans text-[#140152]/70 mt-4 max-w-xl mx-auto leading-relaxed">
                    Sunday gatherings are wonderful — but life change happens in living rooms. Find a small group near you that fits your stage of life.
                </p>
            </section>

            {/* Filters */}
            <section className="sticky top-0 z-20 bg-[#fbf5e6]/95 backdrop-blur border-y border-[#140152]/10 py-3 mb-8">
                <div className="max-w-5xl mx-auto px-6 flex items-center gap-3 flex-wrap">
                    <div className="relative flex-1 min-w-[180px]">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search topic, city…"
                            className="w-full bg-white border border-gray-200 rounded-full pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#140152]/20" />
                    </div>
                    <select value={audience} onChange={e => setAudience(e.target.value as SmallGroupAudience | 'any')}
                        className="bg-white border border-gray-200 rounded-full px-3 py-2 text-sm">
                        {AUDIENCES.map(a => <option key={a.key} value={a.key}>{a.label}</option>)}
                    </select>
                    <select value={day} onChange={e => setDay(e.target.value === 'any' ? 'any' : parseInt(e.target.value, 10))}
                        className="bg-white border border-gray-200 rounded-full px-3 py-2 text-sm">
                        <option value="any">Any day</option>
                        {DAYS.map((d, i) => <option key={d} value={i}>{d}day</option>)}
                    </select>
                    <select value={online} onChange={e => setOnline(e.target.value as 'any' | 'online' | 'in_person')}
                        className="bg-white border border-gray-200 rounded-full px-3 py-2 text-sm">
                        <option value="any">Online or in-person</option>
                        <option value="in_person">In-person only</option>
                        <option value="online">Online only</option>
                    </select>
                </div>
            </section>

            <section className="max-w-6xl mx-auto px-6 pb-20">
                {loading ? (
                    <div className="flex items-center justify-center py-24"><Loader2 className="w-10 h-10 animate-spin text-[#140152]" /></div>
                ) : visible.length === 0 ? (
                    <div className="text-center py-16">
                        <Users className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                        <p className="text-gray-500">{groups.length === 0 ? 'No groups published yet. Check back soon.' : 'No groups match your filters. Try a different combination.'}</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {visible.map(g => <GroupCard key={g.id} g={g} onJoin={() => setPicked(g)} />)}
                    </div>
                )}
            </section>

            {picked && <JoinModal group={picked} onClose={() => setPicked(null)} />}

            <PageCmsOverlay slug="groups" position="bottom" />
        </main>
    )
}

function GroupCard({ g, onJoin }: { g: SmallGroup; onJoin: () => void }) {
    const aud = AUDIENCES.find(a => a.key === g.audience) || AUDIENCES[0]
    const slots = Math.max(0, g.capacity - g.current_size)
    return (
        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-xl transition-all">
            {g.cover_image_url ? (
                <img src={g.cover_image_url} alt={g.name} className="w-full h-32 object-cover" />
            ) : (
                <div className="h-3 bg-gradient-to-r from-[#140152] via-[#7c3aed] to-[#f5bb00]" />
            )}
            <div className="p-5">
                <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-[#f5bb00]">{aud.label}</span>
                    {g.is_online && <span className="text-[10px] font-bold inline-flex items-center gap-1 text-blue-600"><Wifi className="w-3 h-3" /> Online</span>}
                </div>
                <h3 className="font-black text-[#140152] text-lg leading-tight">{g.name}</h3>
                {g.description && <p className="text-sm text-gray-600 mt-1 line-clamp-2 leading-relaxed">{g.description}</p>}

                <div className="mt-4 space-y-1 text-xs text-[#140152]/70">
                    <p className="inline-flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {DAYS[g.day_of_week]} · {g.time_text} · {g.cadence}</p>
                    {(g.city || g.location_label) && <p className="inline-flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> {g.city ? `${g.city}${g.country ? ', ' + g.country : ''}` : g.location_label}</p>}
                    <p className="inline-flex items-center gap-1.5"><Heart className="w-3.5 h-3.5" /> Led by {g.leader_name} · {slots} {slots === 1 ? 'spot' : 'spots'} left</p>
                </div>

                {g.topics && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                        {g.topics.split(',').slice(0, 4).map(t => t.trim()).filter(Boolean).map(t => (
                            <span key={t} className="text-[10px] bg-[#140152]/5 text-[#140152] px-2 py-1 rounded-full">{t}</span>
                        ))}
                    </div>
                )}

                <button onClick={onJoin} disabled={slots === 0}
                    className="mt-4 w-full bg-[#140152] hover:bg-[#1d0175] text-white font-black px-4 py-2.5 rounded-full text-sm uppercase tracking-widest inline-flex items-center justify-center gap-2 disabled:opacity-50">
                    {slots === 0 ? 'Group is full' : <>Express interest <ArrowRight className="w-4 h-4" /></>}
                </button>
            </div>
        </div>
    )
}

function JoinModal({ group, onClose }: { group: SmallGroup; onClose: () => void }) {
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [phone, setPhone] = useState('')
    const [note, setNote] = useState('')
    const [busy, setBusy] = useState(false)
    const [done, setDone] = useState(false)
    const [err, setErr] = useState<string | null>(null)

    const submit = async () => {
        if (!name || !email) return
        setBusy(true); setErr(null)
        try {
            await smallGroupsApi.expressInterest(group.id, { name, email, phone: phone || undefined, note: note || undefined })
            setDone(true)
        } catch (e) { setErr((e as Error).message) }
        finally { setBusy(false) }
    }

    return (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-[fadeIn_300ms]">
            <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl">
                {done ? (
                    <div className="p-10 text-center">
                        <CheckCircle2 className="w-14 h-14 mx-auto text-green-500 mb-3" />
                        <h3 className="font-serif text-2xl font-black text-[#140152]">We've passed your details on</h3>
                        <p className="text-gray-600 mt-2">{group.leader_name} will reach out within a few days to welcome you.</p>
                        <button onClick={onClose} className="mt-6 bg-[#140152] text-white font-bold px-6 py-3 rounded-full text-sm">Close</button>
                    </div>
                ) : (
                    <div className="p-6">
                        <p className="text-[10px] uppercase tracking-widest font-bold text-[#f5bb00]">Join Group</p>
                        <h3 className="font-serif text-2xl font-black text-[#140152] mt-1">{group.name}</h3>
                        <p className="text-xs text-gray-500 mt-1">{DAYS[group.day_of_week]} · {group.time_text} · {group.leader_name}</p>

                        {err && <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-700 inline-flex gap-2"><AlertCircle className="w-4 h-4" /> {err}</div>}

                        <div className="mt-5 space-y-3">
                            <input value={name} onChange={e => setName(e.target.value)} placeholder="Your name *" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm" />
                            <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email *" type="email" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm" />
                            <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Phone (optional)" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm" />
                            <textarea value={note} onChange={e => setNote(e.target.value)} rows={3} placeholder="Anything you'd like the leader to know? (optional)" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm" />
                        </div>

                        <div className="mt-5 flex justify-end gap-2">
                            <button onClick={onClose} className="px-4 py-2 text-sm font-bold text-gray-500">Cancel</button>
                            <button onClick={submit} disabled={!name || !email || busy} className="bg-[#140152] hover:bg-[#1d0175] text-white font-bold px-5 py-2 rounded-lg text-sm disabled:opacity-50">
                                {busy ? <Loader2 className="w-4 h-4 animate-spin inline" /> : 'Send'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
            <style jsx>{`@keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }`}</style>
        </div>
    )
}
