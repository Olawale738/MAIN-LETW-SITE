'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
    Users, Search, MapPin, Heart, Loader2, Send, ShieldCheck, AlertCircle,
    CheckCircle2, X, Sparkles, Settings, Inbox
} from 'lucide-react'
import PageCmsOverlay from '@/components/cms/PageCmsOverlay'
import { directoryApi, tokenManager, type DirectoryProfile } from '@/lib/api'

export default function FamilyPage() {
    const [profiles, setProfiles] = useState<DirectoryProfile[]>([])
    const [me, setMe] = useState<DirectoryProfile | null>(null)
    const [loading, setLoading] = useState(true)
    const [q, setQ] = useState('')
    const [city, setCity] = useState('')
    const [partnerOnly, setPartnerOnly] = useState(false)
    const [editingMe, setEditingMe] = useState(false)
    const [msgTo, setMsgTo] = useState<DirectoryProfile | null>(null)
    const [authMsg, setAuthMsg] = useState<string | null>(null)

    const load = async () => {
        setLoading(true)
        try {
            const [list, mine] = await Promise.all([
                directoryApi.search({ q: q || undefined, city: city || undefined, prayer_partner: partnerOnly }).catch(() => []),
                directoryApi.me().catch(() => null),
            ])
            setProfiles(list); setMe(mine)
        } catch (e) { setAuthMsg((e as Error).message) }
        finally { setLoading(false) }
    }

    useEffect(() => {
        if (!tokenManager.isLoggedIn()) {
            setLoading(false); setAuthMsg('signin')
            return
        }
        load()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
    useEffect(() => { if (tokenManager.isLoggedIn()) { const t = setTimeout(load, 300); return () => clearTimeout(t) } }, [q, city, partnerOnly])

    if (authMsg === 'signin') {
        return (
            <main className="min-h-screen bg-[#fbf5e6] flex items-center justify-center p-6">
                <PageCmsOverlay slug="family" position="top" />
                <div className="bg-white rounded-3xl shadow-xl p-10 max-w-md text-center">
                    <Users className="w-12 h-12 mx-auto text-[#f5bb00] mb-3" />
                    <h2 className="text-2xl font-black text-[#140152]">Sign in to meet the family</h2>
                    <p className="text-gray-600 mt-3">Our directory is for signed-in members only — it keeps it a real community, not an open scrape target.</p>
                    <Link href="/auth/login?redirect=/family" className="inline-block mt-5 bg-[#140152] hover:bg-[#1d0175] text-white font-bold px-6 py-3 rounded-xl">Sign in</Link>
                </div>
            </main>
        )
    }

    return (
        <main className="min-h-screen bg-gradient-to-b from-[#fbf5e6] via-white to-[#fbf5e6]">
            <PageCmsOverlay slug="family" position="top" />

            <section className="max-w-5xl mx-auto px-6 pt-24 pb-8 text-center">
                <p className="text-[#f5bb00] font-bold tracking-[0.35em] text-[10px] uppercase mb-3 inline-flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5" /> The LETW Family
                </p>
                <h1 className="font-serif text-4xl md:text-6xl font-black text-[#140152] leading-tight">
                    Find your <span className="bg-gradient-to-r from-[#f5bb00] via-amber-500 to-[#f5bb00] bg-clip-text text-transparent">brothers and sisters</span>
                </h1>
                <p className="font-sans text-[#140152]/70 mt-4 max-w-xl mx-auto leading-relaxed">
                    Connect with believers across the LETW family. Find a prayer partner, an accountability buddy, or someone in your city.
                </p>

                <div className="mt-6 flex items-center justify-center gap-2 flex-wrap">
                    <button onClick={() => setEditingMe(true)} className="bg-white border-2 border-[#140152]/20 hover:border-[#140152] text-[#140152] font-bold px-4 py-2 rounded-full text-xs uppercase tracking-widest inline-flex items-center gap-2">
                        <Settings className="w-3.5 h-3.5" /> {me ? 'Edit my profile' : 'Add my profile'}
                    </button>
                    <Link href="/messages" className="bg-[#140152] text-white font-bold px-4 py-2 rounded-full text-xs uppercase tracking-widest inline-flex items-center gap-2">
                        <Inbox className="w-3.5 h-3.5" /> My messages
                    </Link>
                </div>
            </section>

            {/* Filters */}
            <section className="sticky top-0 z-10 bg-[#fbf5e6]/95 backdrop-blur border-y border-[#140152]/10 py-3 mb-8">
                <div className="max-w-5xl mx-auto px-6 flex items-center gap-3 flex-wrap">
                    <div className="relative flex-1 min-w-[180px]">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search name, gift, bio…"
                            className="w-full bg-white border border-gray-200 rounded-full pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#140152]/20" />
                    </div>
                    <input value={city} onChange={e => setCity(e.target.value)} placeholder="City"
                        className="bg-white border border-gray-200 rounded-full px-3 py-2 text-sm w-32" />
                    <label className="inline-flex items-center gap-2 text-sm font-bold text-[#140152] cursor-pointer">
                        <input type="checkbox" checked={partnerOnly} onChange={e => setPartnerOnly(e.target.checked)} />
                        Prayer partners only
                    </label>
                </div>
            </section>

            <section className="max-w-6xl mx-auto px-6 pb-20">
                {loading ? (
                    <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-[#140152]" /></div>
                ) : profiles.length === 0 ? (
                    <div className="text-center py-16">
                        <Users className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                        <p className="text-gray-500 text-sm">No profiles match. Be the first by adding yours above.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {profiles.map(p => <Card key={p.id} p={p} mine={me?.user_id === p.user_id} onMessage={() => setMsgTo(p)} />)}
                    </div>
                )}
            </section>

            {editingMe && (
                <ProfileForm initial={me} onCancel={() => setEditingMe(false)} onDone={() => { setEditingMe(false); load() }} />
            )}

            {msgTo && <MessageModal to={msgTo} onClose={() => setMsgTo(null)} />}

            <PageCmsOverlay slug="family" position="bottom" />
        </main>
    )
}

function Card({ p, mine, onMessage }: { p: DirectoryProfile; mine: boolean; onMessage: () => void }) {
    return (
        <div className="bg-white border border-gray-100 rounded-2xl p-5 hover:shadow-xl transition-all">
            <div className="flex items-start gap-3 mb-3">
                {p.photo_url ? (
                    <img src={p.photo_url} alt={p.display_name} className="w-14 h-14 rounded-full object-cover" />
                ) : (
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#140152] to-[#7c3aed] text-white text-xl font-black flex items-center justify-center flex-shrink-0">
                        {p.display_name.slice(0, 1).toUpperCase()}
                    </div>
                )}
                <div className="flex-1 min-w-0">
                    <p className="font-black text-[#140152] truncate">{p.display_name}</p>
                    {p.city && <p className="text-xs text-gray-500 truncate inline-flex items-center gap-1"><MapPin className="w-3 h-3" /> {p.city}{p.country ? `, ${p.country}` : ''}</p>}
                    {p.is_prayer_partner && <p className="text-[10px] text-rose-600 font-black uppercase tracking-wider mt-1 inline-flex items-center gap-1"><Heart className="w-3 h-3 fill-current" /> Prayer partner</p>}
                </div>
            </div>
            {p.bio && <p className="text-sm text-gray-700 leading-relaxed line-clamp-3 mb-3">{p.bio}</p>}
            {p.gifts && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                    {p.gifts.split(',').slice(0, 4).map(t => t.trim()).filter(Boolean).map(t => (
                        <span key={t} className="text-[10px] bg-[#140152]/5 text-[#140152] px-2 py-1 rounded-full">{t}</span>
                    ))}
                </div>
            )}
            {!mine && p.allow_messages && (
                <button onClick={onMessage}
                    className="w-full mt-2 bg-[#140152] hover:bg-[#1d0175] text-white font-black px-4 py-2 rounded-full text-xs uppercase tracking-widest inline-flex items-center justify-center gap-2">
                    <Send className="w-3.5 h-3.5" /> Send a message
                </button>
            )}
        </div>
    )
}

function ProfileForm({ initial, onCancel, onDone }: { initial: DirectoryProfile | null; onCancel: () => void; onDone: () => void }) {
    const [p, setP] = useState({
        display_name: initial?.display_name || '',
        city: initial?.city || '',
        country: initial?.country || '',
        bio: initial?.bio || '',
        gifts: initial?.gifts || '',
        languages: initial?.languages || '',
        photo_url: initial?.photo_url || '',
        is_public: initial?.is_public ?? true,
        allow_messages: initial?.allow_messages ?? true,
        is_prayer_partner: initial?.is_prayer_partner ?? false,
    })
    const [busy, setBusy] = useState(false)
    const [err, setErr] = useState<string | null>(null)

    const submit = async () => {
        if (!p.display_name) return
        setBusy(true); setErr(null)
        try { await directoryApi.upsertMe(p); onDone() }
        catch (e) { setErr((e as Error).message) }
        finally { setBusy(false) }
    }
    const remove = async () => {
        if (!initial) return
        if (!confirm('Remove your profile from the directory?')) return
        setBusy(true)
        try { await directoryApi.deleteMe(); onDone() }
        catch (e) { setErr((e as Error).message) }
        finally { setBusy(false) }
    }

    return (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl my-8">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="font-serif text-2xl font-black text-[#140152]">{initial ? 'Edit my profile' : 'Join the directory'}</h3>
                    <button onClick={onCancel} className="text-gray-400 hover:text-gray-700"><X className="w-5 h-5" /></button>
                </div>
                <div className="p-6 space-y-3">
                    {err && <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-xs text-red-700 inline-flex gap-2 items-start"><AlertCircle className="w-4 h-4 flex-shrink-0" /> {err}</div>}
                    <input value={p.display_name} onChange={e => setP({ ...p, display_name: e.target.value })} placeholder="Display name *" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm" />
                    <div className="grid grid-cols-2 gap-3">
                        <input value={p.city} onChange={e => setP({ ...p, city: e.target.value })} placeholder="City" className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm" />
                        <input value={p.country} onChange={e => setP({ ...p, country: e.target.value })} placeholder="Country" className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm" />
                    </div>
                    <textarea value={p.bio} onChange={e => setP({ ...p, bio: e.target.value })} rows={3} placeholder="A short bio — what God is doing in your life" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm" />
                    <input value={p.gifts} onChange={e => setP({ ...p, gifts: e.target.value })} placeholder="Spiritual gifts / ministry interests (comma-separated)" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm" />
                    <input value={p.languages} onChange={e => setP({ ...p, languages: e.target.value })} placeholder="Languages you speak" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm" />
                    <input value={p.photo_url} onChange={e => setP({ ...p, photo_url: e.target.value })} placeholder="Photo URL (optional)" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm" />

                    <div className="space-y-2 pt-2 border-t border-gray-100">
                        <label className="flex items-center gap-2 text-sm cursor-pointer">
                            <input type="checkbox" checked={p.is_public} onChange={e => setP({ ...p, is_public: e.target.checked })} />
                            Show my profile to other signed-in members
                        </label>
                        <label className="flex items-center gap-2 text-sm cursor-pointer">
                            <input type="checkbox" checked={p.allow_messages} onChange={e => setP({ ...p, allow_messages: e.target.checked })} />
                            Allow other members to message me
                        </label>
                        <label className="flex items-center gap-2 text-sm cursor-pointer">
                            <input type="checkbox" checked={p.is_prayer_partner} onChange={e => setP({ ...p, is_prayer_partner: e.target.checked })} />
                            I'm open to being a prayer partner
                        </label>
                    </div>
                </div>
                <div className="p-6 border-t border-gray-100 flex items-center justify-between gap-2">
                    {initial && <button onClick={remove} className="text-xs font-bold text-red-500 hover:text-red-700">Delete my profile</button>}
                    <div className="flex gap-2 ml-auto">
                        <button onClick={onCancel} className="px-4 py-2 text-sm font-bold text-gray-500">Cancel</button>
                        <button onClick={submit} disabled={!p.display_name || busy} className="bg-[#140152] text-white font-bold px-5 py-2 rounded-lg text-sm disabled:opacity-50">
                            {busy ? <Loader2 className="w-4 h-4 animate-spin inline" /> : 'Save profile'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

function MessageModal({ to, onClose }: { to: DirectoryProfile; onClose: () => void }) {
    const [body, setBody] = useState('')
    const [busy, setBusy] = useState(false)
    const [done, setDone] = useState(false)
    const [err, setErr] = useState<string | null>(null)

    const submit = async () => {
        if (!body.trim()) return
        setBusy(true); setErr(null)
        try { await directoryApi.send(to.user_id, body.trim()); setDone(true) }
        catch (e) { setErr((e as Error).message) }
        finally { setBusy(false) }
    }

    return (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl">
                {done ? (
                    <div className="p-10 text-center">
                        <CheckCircle2 className="w-14 h-14 mx-auto text-green-500 mb-3" />
                        <h3 className="font-serif text-2xl font-black text-[#140152]">Sent</h3>
                        <p className="text-gray-600 mt-2">{to.display_name} will see this in their inbox.</p>
                        <button onClick={onClose} className="mt-6 bg-[#140152] text-white font-bold px-6 py-3 rounded-full text-sm">Close</button>
                    </div>
                ) : (
                    <div className="p-6">
                        <p className="text-[10px] uppercase tracking-widest font-bold text-[#f5bb00]">Message</p>
                        <h3 className="font-serif text-2xl font-black text-[#140152] mt-1">{to.display_name}</h3>
                        <p className="text-xs text-gray-500 inline-flex items-center gap-1 mt-1"><ShieldCheck className="w-3 h-3" /> Replies happen in their inbox — your email is not shared.</p>
                        {err && <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-700 inline-flex gap-2"><AlertCircle className="w-4 h-4" /> {err}</div>}
                        <textarea autoFocus value={body} onChange={e => setBody(e.target.value)} rows={5} maxLength={2000}
                            placeholder="Write something kind…" className="w-full mt-4 border border-gray-200 rounded-lg px-3 py-2.5 text-sm" />
                        <p className="text-[10px] text-gray-400 mt-1 text-right">{body.length} / 2000</p>
                        <div className="mt-3 flex justify-end gap-2">
                            <button onClick={onClose} className="px-4 py-2 text-sm font-bold text-gray-500">Cancel</button>
                            <button onClick={submit} disabled={!body.trim() || busy} className="bg-[#140152] hover:bg-[#1d0175] text-white font-bold px-5 py-2 rounded-lg text-sm disabled:opacity-50">
                                {busy ? <Loader2 className="w-4 h-4 animate-spin inline" /> : <><Send className="w-4 h-4 inline mr-1.5" /> Send</>}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
