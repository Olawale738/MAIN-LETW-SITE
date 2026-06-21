'use client'
import { useEffect, useState } from 'react'
import {
    Loader2, Baby, Plus, Trash2, AlertCircle, CheckCircle, Search,
    LogIn, LogOut, RefreshCw, Heart
} from 'lucide-react'
import { childrenCheckinApi, type ChildProfile, type ActiveCheckin } from '@/lib/api'

const AGE_GROUPS = ['nursery', 'toddler', 'kids', 'preteen'] as const

export default function ChildrenCheckinPage() {
    const [tab, setTab] = useState<'kiosk' | 'roster' | 'active'>('kiosk')
    const [children, setChildren] = useState<ChildProfile[]>([])
    const [active, setActive] = useState<ActiveCheckin[]>([])
    const [loading, setLoading] = useState(true)
    const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)

    const load = async () => {
        setLoading(true)
        try {
            const [c, a] = await Promise.all([childrenCheckinApi.listChildren(), childrenCheckinApi.active()])
            setChildren(c); setActive(a)
        } catch (e) { setMsg({ kind: 'err', text: (e as Error).message }) }
        finally { setLoading(false) }
    }
    useEffect(() => { load() }, [])
    useEffect(() => { if (msg) { const t = setTimeout(() => setMsg(null), 4500); return () => clearTimeout(t) } }, [msg])

    return (
        <div className="p-4 sm:p-6 max-w-6xl mx-auto pb-20">
            <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
                <div>
                    <h1 className="text-3xl font-black text-[#140152] flex items-center gap-3"><Baby className="w-7 h-7 text-pink-500" /> Children's Check-In</h1>
                    <p className="text-gray-500 mt-1 text-sm">Tap to check kids in. A 4-digit code is generated — only that code can sign the child out.</p>
                </div>
                <button onClick={load} className="text-sm text-gray-500 hover:text-[#140152] inline-flex items-center gap-1.5"><RefreshCw className="w-4 h-4" /> Refresh</button>
            </div>

            {msg && (
                <div className={`mb-4 p-3 rounded-xl border flex items-start gap-2 ${msg.kind === 'ok' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                    {msg.kind === 'ok' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}<span className="text-sm">{msg.text}</span>
                </div>
            )}

            <div className="flex items-center gap-1 mb-4 bg-white border border-gray-100 rounded-2xl p-1 w-fit">
                {(['kiosk', 'roster', 'active'] as const).map(t => (
                    <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 text-xs font-black uppercase tracking-widest rounded-lg ${tab === t ? 'bg-[#140152] text-white' : 'text-gray-500 hover:text-[#140152]'}`}>
                        {t === 'active' ? `Active (${active.length})` : t.charAt(0).toUpperCase() + t.slice(1)}
                    </button>
                ))}
            </div>

            {tab === 'kiosk' && <KioskTab children={children} loading={loading} onMsg={setMsg} reload={load} />}
            {tab === 'roster' && <RosterTab children={children} loading={loading} onMsg={setMsg} reload={load} />}
            {tab === 'active' && <ActiveTab active={active} loading={loading} onMsg={setMsg} reload={load} />}
        </div>
    )
}

function KioskTab({ children, loading, onMsg, reload }: {
    children: ChildProfile[]; loading: boolean;
    onMsg: (m: { kind: 'ok' | 'err'; text: string }) => void; reload: () => void;
}) {
    const [q, setQ] = useState('')
    const [code, setCode] = useState<{ child: string; code: string } | null>(null)
    const visible = children.filter(c => !q || (c.full_name + ' ' + c.guardian_name).toLowerCase().includes(q.toLowerCase()))

    const checkin = async (c: ChildProfile) => {
        try {
            const r = await childrenCheckinApi.checkin(c.id)
            setCode({ child: c.full_name, code: r.security_code })
            onMsg({ kind: 'ok', text: `${c.full_name} checked in. Code: ${r.security_code}` })
            reload()
        } catch (e) { onMsg({ kind: 'err', text: (e as Error).message }) }
    }

    if (loading) return <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 animate-spin text-[#140152]" /></div>

    return (
        <div>
            {code && (
                <div className="mb-5 bg-gradient-to-br from-pink-50 to-rose-50 border-2 border-pink-200 rounded-3xl p-6 text-center">
                    <p className="text-xs uppercase tracking-widest font-black text-pink-700">Security code for {code.child}</p>
                    <p className="font-mono text-7xl font-black text-pink-700 tracking-widest my-3">{code.code}</p>
                    <p className="text-xs text-pink-700/70">Write this on the guardian's wristband. Required to sign the child out.</p>
                    <button onClick={() => setCode(null)} className="mt-3 text-xs font-bold text-pink-700 hover:underline">Dismiss</button>
                </div>
            )}

            <div className="relative mb-4">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search child or guardian…"
                    className="w-full bg-white border border-gray-200 rounded-full pl-9 pr-3 py-2.5 text-sm" />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {visible.map(c => (
                    <button key={c.id} onClick={() => checkin(c)} className="bg-white border border-gray-100 rounded-2xl p-4 text-left hover:border-pink-300 hover:shadow-md transition-all">
                        <div className="w-12 h-12 rounded-xl bg-pink-100 text-pink-700 flex items-center justify-center mb-2">
                            <Baby className="w-6 h-6" />
                        </div>
                        <p className="font-black text-[#140152] text-sm truncate">{c.full_name}</p>
                        <p className="text-[11px] text-gray-500 truncate">{c.age_group} · {c.guardian_name}</p>
                        {c.allergies && <p className="text-[10px] text-red-600 mt-1 inline-flex items-center gap-1"><Heart className="w-3 h-3" /> Allergies</p>}
                        <p className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-pink-700"><LogIn className="w-3 h-3" /> Check in</p>
                    </button>
                ))}
                {visible.length === 0 && <p className="col-span-full text-center text-gray-400 py-12 text-sm">No children match. Try the Roster tab to add one.</p>}
            </div>
        </div>
    )
}

function RosterTab({ children, loading, onMsg, reload }: { children: ChildProfile[]; loading: boolean; onMsg: (m: { kind: 'ok' | 'err'; text: string }) => void; reload: () => void }) {
    const [adding, setAdding] = useState(false)

    const remove = async (cid: string) => {
        if (!confirm('Deactivate this child from the roster?')) return
        try { await childrenCheckinApi.removeChild(cid); reload() }
        catch (e) { onMsg({ kind: 'err', text: (e as Error).message }) }
    }

    return (
        <div>
            <div className="flex justify-end mb-3">
                <button onClick={() => setAdding(true)} className="bg-[#140152] text-white font-bold px-4 py-2 rounded-xl text-sm inline-flex items-center gap-1.5"><Plus className="w-4 h-4" /> Add child</button>
            </div>
            {adding && <ChildForm onCancel={() => setAdding(false)} onDone={() => { setAdding(false); reload() }} onError={t => onMsg({ kind: 'err', text: t })} />}

            {loading ? <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 animate-spin text-[#140152]" /></div> :
                children.length === 0 ? <p className="text-center text-gray-400 py-12 text-sm">No children on roster yet.</p> :
                    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                        <div className="divide-y divide-gray-100">
                            {children.map(c => (
                                <div key={c.id} className="px-5 py-3 flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-pink-100 text-pink-700 font-black flex items-center justify-center flex-shrink-0">{c.full_name.slice(0, 1).toUpperCase()}</div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-black text-[#140152] truncate">{c.full_name}</p>
                                        <p className="text-xs text-gray-500 truncate">{c.age_group} · Guardian: {c.guardian_name} ({c.guardian_phone})</p>
                                        {c.allergies && <p className="text-[11px] text-red-600 mt-0.5">Allergies: {c.allergies}</p>}
                                    </div>
                                    <button onClick={() => remove(c.id)} className="p-2 text-red-300 hover:text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
                                </div>
                            ))}
                        </div>
                    </div>
            }
        </div>
    )
}

function ActiveTab({ active, loading, onMsg, reload }: { active: ActiveCheckin[]; loading: boolean; onMsg: (m: { kind: 'ok' | 'err'; text: string }) => void; reload: () => void }) {
    const [checkout, setCheckout] = useState<{ ci: ActiveCheckin; code: string } | null>(null)

    const doCheckout = async () => {
        if (!checkout) return
        try {
            await childrenCheckinApi.checkout(checkout.ci.child_id, checkout.code)
            onMsg({ kind: 'ok', text: `${checkout.ci.child_name} signed out.` })
            setCheckout(null); reload()
        } catch (e) { onMsg({ kind: 'err', text: (e as Error).message }) }
    }

    if (loading) return <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 animate-spin text-[#140152]" /></div>
    if (active.length === 0) return <p className="text-center text-gray-400 py-12 text-sm">No children currently checked in.</p>

    return (
        <div>
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                <div className="divide-y divide-gray-100">
                    {active.map(a => (
                        <div key={a.checkin_id} className="px-5 py-3 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-green-100 text-green-700 font-black flex items-center justify-center flex-shrink-0">{a.child_name.slice(0, 1).toUpperCase()}</div>
                            <div className="flex-1 min-w-0">
                                <p className="font-black text-[#140152] truncate">{a.child_name}</p>
                                <p className="text-xs text-gray-500 truncate">{a.location} · Guardian: {a.guardian_name} · Since {new Date(a.checked_in_at).toLocaleTimeString()}</p>
                                {a.allergies && <p className="text-[11px] text-red-600 mt-0.5">⚠ {a.allergies}</p>}
                            </div>
                            <button onClick={() => setCheckout({ ci: a, code: '' })} className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-4 py-2 rounded-xl text-xs inline-flex items-center gap-1.5">
                                <LogOut className="w-3.5 h-3.5" /> Check out
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {checkout && (
                <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center">
                        <h3 className="font-black text-[#140152] text-lg">Sign out {checkout.ci.child_name}</h3>
                        <p className="text-xs text-gray-500 mt-1">Ask the guardian for the 4-digit code on their wristband.</p>
                        <input autoFocus value={checkout.code} onChange={e => setCheckout({ ...checkout, code: e.target.value })}
                            placeholder="0000" maxLength={4}
                            className="mt-5 w-full text-center font-mono text-4xl tracking-[0.5em] border-2 border-gray-200 rounded-2xl py-4" />
                        <div className="mt-5 flex gap-2">
                            <button onClick={() => setCheckout(null)} className="flex-1 px-4 py-3 text-sm font-bold text-gray-500 border border-gray-200 rounded-xl">Cancel</button>
                            <button onClick={doCheckout} disabled={checkout.code.length !== 4} className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-black px-4 py-3 rounded-xl text-sm disabled:opacity-50">Sign out</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

function ChildForm({ onCancel, onDone, onError }: { onCancel: () => void; onDone: () => void; onError: (t: string) => void }) {
    const [c, setC] = useState({ full_name: '', age_group: 'kids', guardian_name: '', guardian_phone: '', allergies: '', medical_notes: '' })
    const [busy, setBusy] = useState(false)

    const submit = async () => {
        if (!c.full_name || !c.guardian_name || !c.guardian_phone) return
        setBusy(true)
        try {
            await childrenCheckinApi.addChild({
                full_name: c.full_name, age_group: c.age_group,
                guardian_name: c.guardian_name, guardian_phone: c.guardian_phone,
                allergies: c.allergies || undefined, medical_notes: c.medical_notes || undefined,
            })
            onDone()
        } catch (e) { onError((e as Error).message) }
        finally { setBusy(false) }
    }

    return (
        <div className="bg-white rounded-2xl border-2 border-[#f5bb00] p-5 mb-5 shadow-md">
            <h3 className="font-black text-[#140152] mb-3">Add child to roster</h3>
            <div className="grid md:grid-cols-2 gap-3">
                <input value={c.full_name} onChange={e => setC({ ...c, full_name: e.target.value })} placeholder="Full name *" className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm" />
                <select value={c.age_group} onChange={e => setC({ ...c, age_group: e.target.value })} className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-white">
                    {AGE_GROUPS.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
                <input value={c.guardian_name} onChange={e => setC({ ...c, guardian_name: e.target.value })} placeholder="Guardian name *" className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm" />
                <input value={c.guardian_phone} onChange={e => setC({ ...c, guardian_phone: e.target.value })} placeholder="Guardian phone *" className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm" />
                <input value={c.allergies} onChange={e => setC({ ...c, allergies: e.target.value })} placeholder="Allergies (optional)" className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm md:col-span-2" />
                <textarea value={c.medical_notes} onChange={e => setC({ ...c, medical_notes: e.target.value })} rows={2} placeholder="Medical notes (optional)" className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm md:col-span-2" />
            </div>
            <div className="mt-3 flex justify-end gap-2">
                <button onClick={onCancel} className="px-4 py-2 text-sm font-bold text-gray-500">Cancel</button>
                <button onClick={submit} disabled={!c.full_name || !c.guardian_name || !c.guardian_phone || busy} className="bg-[#140152] text-white font-bold px-5 py-2 rounded-lg text-sm disabled:opacity-50">
                    {busy ? <Loader2 className="w-4 h-4 animate-spin inline" /> : 'Add to roster'}
                </button>
            </div>
        </div>
    )
}
