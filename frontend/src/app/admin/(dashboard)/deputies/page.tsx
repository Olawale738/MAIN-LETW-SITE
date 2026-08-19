'use client'
/**
 * /admin/deputies — appoint Deputy Admin 1-3 and decide exactly what each of
 * them can access. Deputies sign in to the same admin dashboard but only see
 * the sections ticked here (the server enforces the same scopes per endpoint).
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
    ShieldCheck, Loader2, Search, Save, UserMinus, CheckCircle, AlertCircle, UserPlus, X,
} from 'lucide-react'
import { moderatorsApi, DEPUTY_ROLES, DEPUTY_LABEL, type Moderator, type ModeratorScope } from '@/lib/api'

export default function DeputiesPage() {
    const [scopes, setScopes] = useState<ModeratorScope[]>([])
    const [staff, setStaff] = useState<Moderator[]>([])
    const [loading, setLoading] = useState(true)
    const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)
    const [picking, setPicking] = useState<string | null>(null)

    const load = useCallback(async () => {
        setLoading(true)
        try {
            const [sc, list] = await Promise.all([moderatorsApi.scopes(), moderatorsApi.list()])
            setScopes(sc.scopes); setStaff(list)
        } catch (e) { setMsg({ kind: 'err', text: (e as Error).message }) }
        finally { setLoading(false) }
    }, [])
    useEffect(() => { load() }, [load])
    useEffect(() => { if (msg) { const t = setTimeout(() => setMsg(null), 5000); return () => clearTimeout(t) } }, [msg])

    const holderOf = (role: string) => staff.find(s => s.role === role) || null

    if (loading) return <div className="flex justify-center py-24"><Loader2 className="w-8 h-8 animate-spin text-[#140152]" /></div>

    return (
        <div className="p-4 sm:p-6 max-w-4xl mx-auto pb-32">
            <h1 className="text-3xl font-black text-[#140152] flex items-center gap-3 mb-1"><ShieldCheck className="w-7 h-7 text-[#f5bb00]" /> Deputy Admins</h1>
            <p className="text-gray-500 text-sm mb-5">Appoint up to three deputies and choose exactly which areas each one can open. They use the same admin dashboard — anything you leave unticked stays hidden and is blocked on the server.</p>

            {msg && <div className={`mb-4 p-3 rounded-xl border flex items-start gap-2 text-sm ${msg.kind === 'ok' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>{msg.kind === 'ok' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}<span>{msg.text}</span></div>}

            <div className="space-y-4">
                {DEPUTY_ROLES.map(role => (
                    <DeputyCard
                        key={role} role={role} holder={holderOf(role)} scopes={scopes}
                        onPick={() => setPicking(role)} onMsg={setMsg} onSaved={load}
                    />
                ))}
            </div>

            {picking && (
                <PersonPicker
                    role={picking}
                    onClose={() => setPicking(null)}
                    onMsg={setMsg}
                    onSaved={() => { setPicking(null); load() }}
                />
            )}
        </div>
    )
}

function DeputyCard({ role, holder, scopes, onPick, onMsg, onSaved }: {
    role: string; holder: Moderator | null; scopes: ModeratorScope[]
    onPick: () => void; onMsg: (m: { kind: 'ok' | 'err'; text: string }) => void; onSaved: () => void
}) {
    const [sel, setSel] = useState<string[]>(holder?.scopes || [])
    const [saving, setSaving] = useState(false)
    useEffect(() => { setSel(holder?.scopes || []) }, [holder])

    const groups = useMemo(() => {
        const g: Record<string, ModeratorScope[]> = {}
        for (const s of scopes) (g[s.group] ||= []).push(s)
        return g
    }, [scopes])

    const toggle = (k: string) => setSel(p => p.includes(k) ? p.filter(x => x !== k) : [...p, k])
    const allKeys = scopes.map(s => s.key)

    const save = async () => {
        if (!holder) return
        setSaving(true)
        try { await moderatorsApi.setGrants(holder.user_id, sel); onMsg({ kind: 'ok', text: `Access updated for ${holder.name}.` }); onSaved() }
        catch (e) { onMsg({ kind: 'err', text: (e as Error).message }) }
        finally { setSaving(false) }
    }
    const remove = async () => {
        if (!holder || !confirm(`Remove ${holder.name} as ${DEPUTY_LABEL[role]}? They lose all admin access.`)) return
        try { await moderatorsApi.demote(holder.user_id); onMsg({ kind: 'ok', text: `${holder.name} removed.` }); onSaved() }
        catch (e) { onMsg({ kind: 'err', text: (e as Error).message }) }
    }

    return (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <div>
                    <p className="font-black text-[#140152]">{DEPUTY_LABEL[role]}</p>
                    {holder
                        ? <p className="text-xs text-gray-500">{holder.name} · {holder.email} · <span className="font-semibold text-[#140152]">{holder.scopes.length} area{holder.scopes.length === 1 ? '' : 's'}</span></p>
                        : <p className="text-xs text-gray-400">Vacant — no one appointed yet.</p>}
                </div>
                <div className="flex gap-2">
                    <button onClick={onPick} className="inline-flex items-center gap-1.5 bg-[#140152] hover:bg-[#1d0175] text-white font-bold px-3 py-2 rounded-lg text-xs">
                        <UserPlus className="w-3.5 h-3.5" /> {holder ? 'Replace person' : 'Appoint someone'}
                    </button>
                    {holder && <button onClick={remove} className="inline-flex items-center gap-1.5 text-red-500 hover:bg-red-50 font-bold px-3 py-2 rounded-lg text-xs"><UserMinus className="w-3.5 h-3.5" /> Remove</button>}
                </div>
            </div>

            {holder && (
                <>
                    <div className="flex items-center gap-2 mb-2">
                        <button onClick={() => setSel(allKeys)} className="text-[11px] font-bold text-[#140152] underline">Select all</button>
                        <button onClick={() => setSel([])} className="text-[11px] font-bold text-gray-400 underline">Clear</button>
                        <span className="text-[11px] text-gray-400 ml-auto">{sel.length}/{allKeys.length} selected</span>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-x-6 gap-y-3 max-h-72 overflow-y-auto pr-1">
                        {Object.entries(groups).map(([g, list]) => (
                            <div key={g}>
                                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">{g}</p>
                                {list.map(sc => (
                                    <label key={sc.key} className="flex items-center gap-2 py-0.5 text-sm text-gray-700 cursor-pointer">
                                        <input type="checkbox" checked={sel.includes(sc.key)} onChange={() => toggle(sc.key)} />
                                        {sc.label}
                                    </label>
                                ))}
                            </div>
                        ))}
                    </div>
                    <button onClick={save} disabled={saving} className="mt-3 inline-flex items-center gap-2 bg-[#f5bb00] hover:bg-amber-400 text-[#140152] font-black px-4 py-2 rounded-lg text-sm disabled:opacity-50">
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save access
                    </button>
                </>
            )}
        </div>
    )
}

function PersonPicker({ role, onClose, onMsg, onSaved }: {
    role: string; onClose: () => void; onMsg: (m: { kind: 'ok' | 'err'; text: string }) => void; onSaved: () => void
}) {
    const [q, setQ] = useState('')
    const [people, setPeople] = useState<Array<{ id: string; email: string; name: string }>>([])
    const [busy, setBusy] = useState(false)

    useEffect(() => {
        const t = setTimeout(() => { moderatorsApi.candidates(q).then(setPeople).catch(() => setPeople([])) }, 250)
        return () => clearTimeout(t)
    }, [q])

    const appoint = async (userId: string, name: string) => {
        setBusy(true)
        try {
            await moderatorsApi.promote(userId, [], role)
            onMsg({ kind: 'ok', text: `${name} appointed ${DEPUTY_LABEL[role]}. Now tick the areas they can access.` })
            onSaved()
        } catch (e) { onMsg({ kind: 'err', text: (e as Error).message }) }
        finally { setBusy(false) }
    }

    return (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-5" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-3">
                    <p className="font-black text-[#140152]">Appoint {DEPUTY_LABEL[role]}</p>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
                </div>
                <div className="relative mb-3">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search members by name or email…" className="w-full border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-sm" autoFocus />
                </div>
                <div className="max-h-72 overflow-y-auto divide-y divide-gray-100">
                    {people.length === 0 && <p className="text-xs text-gray-400 py-6 text-center">No matching members.</p>}
                    {people.map(p => (
                        <button key={p.id} disabled={busy} onClick={() => appoint(p.id, p.name || p.email)}
                            className="w-full text-left py-2.5 px-1 hover:bg-gray-50 disabled:opacity-50">
                            <p className="text-sm font-semibold text-[#140152]">{p.name || p.email.split('@')[0]}</p>
                            <p className="text-xs text-gray-500">{p.email}</p>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    )
}
