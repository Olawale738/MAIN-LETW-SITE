'use client'
/**
 * /marriage-prep/counsellor — portal for the member assigned to shepherd a
 * couple through marriage prep. No admin access required; scoped by the backend
 * to only the couples this signed-in user is assigned to. They can schedule
 * video sessions (which email the couple a calendar invite) and open the room.
 */
import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Loader2, CalendarClock, Video, HeartHandshake, CheckCircle, AlertCircle } from 'lucide-react'
import { marriagePrepApi, authApi, type MarriagePrepCouple } from '@/lib/api'

export default function CounsellorPortal() {
    const [couples, setCouples] = useState<MarriagePrepCouple[] | null>(null)
    const [err, setErr] = useState<string | null>(null)
    const [name, setName] = useState('')
    const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)

    const load = useCallback(async () => {
        try {
            const list = await marriagePrepApi.counsellorCouples()
            setCouples(list)
        } catch (e) {
            const m = (e as Error).message || ''
            setErr(/401|unauth|log/i.test(m) ? 'auth' : m)
        }
    }, [])
    useEffect(() => {
        authApi.getCurrentUser().then(u => setName(u.name)).catch(() => setErr('auth'))
        load()
    }, [load])
    useEffect(() => { if (msg) { const t = setTimeout(() => setMsg(null), 5000); return () => clearTimeout(t) } }, [msg])

    if (err === 'auth') return (
        <main className="min-h-screen flex items-center justify-center p-6 text-center">
            <div>
                <p className="text-gray-600 mb-3">Please sign in to view the couples assigned to you.</p>
                <Link href="/auth/login?next=/marriage-prep/counsellor" className="inline-block bg-[#140152] text-white font-bold px-5 py-2.5 rounded-lg">Sign in</Link>
            </div>
        </main>
    )
    if (err) return <main className="min-h-screen flex items-center justify-center p-6 text-center text-gray-500">{err}</main>
    if (!couples) return <main className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-[#140152]" /></main>

    return (
        <main className="min-h-screen bg-gray-50 py-8 px-4">
            <div className="max-w-3xl mx-auto">
                <h1 className="text-3xl font-black text-[#140152] flex items-center gap-3"><HeartHandshake className="w-7 h-7 text-[#f5bb00]" /> Marriage Counselling</h1>
                <p className="text-gray-500 text-sm mt-1 mb-5">{name ? `Welcome, ${name}. ` : ''}Couples assigned to you for marriage preparation.</p>

                {msg && <div className={`mb-4 p-3 rounded-xl border flex items-start gap-2 text-sm ${msg.kind === 'ok' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>{msg.kind === 'ok' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}<span>{msg.text}</span></div>}

                {couples.length === 0 ? (
                    <div className="bg-white border border-dashed border-gray-300 rounded-2xl p-10 text-center text-gray-500">No couples are assigned to you yet. An admin assigns couples to you on the marriage-prep dashboard.</div>
                ) : (
                    <div className="space-y-3">
                        {couples.map(c => <CoupleCard key={c.id} c={c} onMsg={setMsg} onSaved={load} />)}
                    </div>
                )}
            </div>
        </main>
    )
}

function CoupleCard({ c, onMsg, onSaved }: { c: MarriagePrepCouple; onMsg: (m: { kind: 'ok' | 'err'; text: string }) => void; onSaved: () => void }) {
    const [when, setWhen] = useState(c.session_at ? c.session_at.slice(0, 16) : '')
    const [note, setNote] = useState(c.session_note || '')
    const [saving, setSaving] = useState(false)
    const room = `https://meet.jit.si/LETW-MarriagePrep-${c.id}`

    const save = async (clear = false) => {
        setSaving(true)
        try {
            await marriagePrepApi.counsellorSchedule(c.id, clear ? null : (when ? new Date(when).toISOString() : null), clear ? undefined : note)
            onMsg({ kind: 'ok', text: clear ? 'Session cleared.' : 'Session scheduled — the couple was emailed an invite with the video link.' })
            onSaved()
        } catch (e) { onMsg({ kind: 'err', text: (e as Error).message }) }
        finally { setSaving(false) }
    }

    return (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                    <p className="font-bold text-[#140152]">{c.partner_a_name} <span className="text-gray-400 font-normal">&amp;</span> {c.partner_b_name}</p>
                    <p className="text-xs text-gray-500">{c.partner_a_email}{c.partner_b_email ? ` · ${c.partner_b_email}` : ''}</p>
                    <p className="text-[10px] uppercase tracking-widest mt-1 font-bold inline-block px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">{c.status}</p>
                </div>
                <Link href={`/marriage-prep/journey/${c.id}`} target="_blank" className="text-xs font-semibold text-[#140152] underline">View progress ↗</Link>
            </div>

            {c.session_at && (
                <p className="text-xs text-rose-700 mt-2 inline-flex items-center gap-1"><CalendarClock className="w-3 h-3" /> Session {new Date(c.session_at).toLocaleString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</p>
            )}

            <div className="mt-3 grid sm:grid-cols-[1fr_auto] gap-2 items-end">
                <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Schedule a session</label>
                    <input type="datetime-local" value={when} onChange={e => setWhen(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                    <input value={note} onChange={e => setNote(e.target.value)} placeholder="Optional note to the couple" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-2" />
                </div>
                <div className="flex flex-col gap-2">
                    <button onClick={() => save(false)} disabled={saving || !when} className="inline-flex items-center justify-center gap-2 bg-[#140152] hover:bg-[#1d0175] text-white font-bold px-4 py-2 rounded-lg text-sm disabled:opacity-50">{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CalendarClock className="w-4 h-4" />} Save & email</button>
                    <a href={room} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 bg-[#f5bb00] text-[#140152] font-bold px-4 py-2 rounded-lg text-sm"><Video className="w-4 h-4" /> Join video room</a>
                    {c.session_at && <button onClick={() => save(true)} disabled={saving} className="text-xs text-gray-400 hover:text-red-500 font-semibold">Clear session</button>}
                </div>
            </div>
        </div>
    )
}
