'use client'
import { useEffect, useMemo, useState } from 'react'
import { Loader2, ShieldCheck, AlertCircle, CheckCircle, Plus, Search, X, Save, UserMinus, Check, CheckSquare, Square } from 'lucide-react'
import { moderatorsApi, type Moderator, type ModeratorScope } from '@/lib/api'

export default function AdminModeratorsPage() {
    const [scopes, setScopes] = useState<ModeratorScope[]>([])
    const [mods, setMods] = useState<Moderator[]>([])
    const [loading, setLoading] = useState(true)
    const [adding, setAdding] = useState(false)
    const [editing, setEditing] = useState<Moderator | null>(null)
    const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)

    const load = async () => {
        try {
            const [s, m] = await Promise.all([moderatorsApi.scopes(), moderatorsApi.list()])
            setScopes(s.scopes); setMods(m)
        } catch (e) { setMsg({ kind: 'err', text: (e as Error).message }) }
        finally { setLoading(false) }
    }
    useEffect(() => { load() }, [])
    useEffect(() => { if (msg) { const t = setTimeout(() => setMsg(null), 5000); return () => clearTimeout(t) } }, [msg])

    const demote = async (uid: string) => {
        if (!confirm('Demote this moderator back to a regular user? All their grants will be revoked.')) return
        try { await moderatorsApi.demote(uid); setMsg({ kind: 'ok', text: 'Demoted.' }); await load() }
        catch (e) { setMsg({ kind: 'err', text: (e as Error).message }) }
    }

    if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-10 h-10 animate-spin text-[#140152]" /></div>

    return (
        <div className="p-4 sm:p-6 max-w-6xl mx-auto pb-20">
            <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
                <div>
                    <h1 className="text-3xl font-black text-[#140152] flex items-center gap-3"><ShieldCheck className="w-7 h-7 text-[#f5bb00]" /> Moderators</h1>
                    <p className="text-gray-500 mt-1 text-sm">Promote any registered user to moderator and grant them access to specific admin sections. Admins keep full access; moderators see only what you allow.</p>
                </div>
                <button onClick={() => setAdding(true)} className="inline-flex items-center gap-2 bg-[#140152] hover:bg-[#1d0175] text-white font-bold px-5 py-3 rounded-xl"><Plus className="w-4 h-4" /> Promote User</button>
            </div>

            {msg && <div className={`mb-4 p-3 rounded-xl border flex items-start gap-2 ${msg.kind === 'ok' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                {msg.kind === 'ok' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}<span className="text-sm">{msg.text}</span>
            </div>}

            {adding && <PromoteDialog scopes={scopes} onClose={() => setAdding(false)} onDone={async () => { setAdding(false); await load() }} setMsg={setMsg} />}
            {editing && <GrantsDialog mod={editing} scopes={scopes} onClose={() => setEditing(null)} onDone={async () => { setEditing(null); await load() }} setMsg={setMsg} />}

            <div className="space-y-3">
                {mods.length === 0 && <p className="text-center text-gray-400 py-12">No moderators yet. Click "Promote User" to create one.</p>}
                {mods.map(m => (
                    <div key={m.user_id} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                        <div className="flex items-start gap-4 mb-3">
                            <div className="w-12 h-12 rounded-full bg-[#140152]/10 text-[#140152] flex items-center justify-center font-bold flex-shrink-0">
                                {m.name.slice(0, 1).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-bold text-[#140152]">{m.name}</p>
                                <p className="text-xs text-gray-500">{m.email}</p>
                            </div>
                            <button onClick={() => setEditing(m)} className="text-sm font-bold text-[#140152] hover:underline">Edit grants</button>
                            <button onClick={() => demote(m.user_id)} className="text-xs font-bold text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg inline-flex items-center gap-1"><UserMinus className="w-3.5 h-3.5" /> Demote</button>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                            {m.scopes.length === 0 ? (
                                <span className="text-xs text-amber-700 bg-amber-50 px-2 py-1 rounded">No grants yet — moderator can't access anything.</span>
                            ) : m.scopes.map(s => {
                                const sc = scopes.find(x => x.key === s)
                                return <span key={s} className="text-[11px] font-bold bg-[#f5bb00]/15 text-[#140152] px-2 py-1 rounded">{sc?.label || s}</span>
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

function PromoteDialog({ scopes, onClose, onDone, setMsg }: { scopes: ModeratorScope[]; onClose: () => void; onDone: () => void; setMsg: (m: { kind: 'ok' | 'err'; text: string }) => void }) {
    const [q, setQ] = useState('')
    const [candidates, setCandidates] = useState<Array<{ id: string; email: string; name: string }>>([])
    const [picked, setPicked] = useState<{ id: string; email: string; name: string } | null>(null)
    const [selectedScopes, setSelectedScopes] = useState<Set<string>>(new Set())
    const [submitting, setSubmitting] = useState(false)

    useEffect(() => {
        const id = setTimeout(() => { moderatorsApi.candidates(q || undefined).then(setCandidates).catch(() => setCandidates([])) }, 200)
        return () => clearTimeout(id)
    }, [q])

    const submit = async () => {
        if (!picked) return
        setSubmitting(true)
        try {
            await moderatorsApi.promote(picked.id, [...selectedScopes])
            setMsg({ kind: 'ok', text: `${picked.name} is now a moderator.` })
            onDone()
        } catch (e) { setMsg({ kind: 'err', text: (e as Error).message }) }
        finally { setSubmitting(false) }
    }

    return (
        <Modal title="Promote user to moderator" onClose={onClose}>
            {!picked ? (
                <>
                    <div className="relative mb-3">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search by name or email…" className="w-full border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-sm" />
                    </div>
                    <div className="max-h-72 overflow-y-auto divide-y divide-gray-100">
                        {candidates.length === 0 && <p className="text-center text-sm text-gray-400 py-6">No matching users.</p>}
                        {candidates.map(c => (
                            <button key={c.id} onClick={() => setPicked(c)} className="w-full text-left py-3 px-2 hover:bg-gray-50 rounded">
                                <p className="font-bold text-sm text-[#140152]">{c.name}</p>
                                <p className="text-xs text-gray-500">{c.email}</p>
                            </button>
                        ))}
                    </div>
                </>
            ) : (
                <>
                    <div className="bg-[#140152]/5 rounded-lg p-3 mb-4 flex items-center justify-between">
                        <div>
                            <p className="font-bold text-[#140152]">{picked.name}</p>
                            <p className="text-xs text-gray-500">{picked.email}</p>
                        </div>
                        <button onClick={() => setPicked(null)} className="text-xs font-bold text-gray-500 hover:text-[#140152]">Change</button>
                    </div>
                    <ScopeGrid scopes={scopes} selected={selectedScopes} onChange={setSelectedScopes} />
                    <div className="mt-5 flex justify-end gap-2">
                        <button onClick={onClose} className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-bold">Cancel</button>
                        <button onClick={submit} disabled={submitting} className="inline-flex items-center gap-2 bg-[#140152] hover:bg-[#1d0175] text-white font-bold px-5 py-2 rounded-lg text-sm disabled:opacity-50">
                            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Promote &amp; grant ({selectedScopes.size})
                        </button>
                    </div>
                </>
            )}
        </Modal>
    )
}

function GrantsDialog({ mod, scopes, onClose, onDone, setMsg }: { mod: Moderator; scopes: ModeratorScope[]; onClose: () => void; onDone: () => void; setMsg: (m: { kind: 'ok' | 'err'; text: string }) => void }) {
    const [selected, setSelected] = useState<Set<string>>(new Set(mod.scopes))
    const [saving, setSaving] = useState(false)

    const save = async () => {
        setSaving(true)
        try {
            await moderatorsApi.setGrants(mod.user_id, [...selected])
            setMsg({ kind: 'ok', text: 'Grants updated.' })
            onDone()
        } catch (e) { setMsg({ kind: 'err', text: (e as Error).message }) }
        finally { setSaving(false) }
    }

    return (
        <Modal title={`Edit grants — ${mod.name}`} onClose={onClose}>
            <p className="text-xs text-gray-500 mb-3">{mod.email}</p>
            <ScopeGrid scopes={scopes} selected={selected} onChange={setSelected} />
            <div className="mt-5 flex justify-end gap-2">
                <button onClick={onClose} className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-bold">Cancel</button>
                <button onClick={save} disabled={saving} className="inline-flex items-center gap-2 bg-[#140152] hover:bg-[#1d0175] text-white font-bold px-5 py-2 rounded-lg text-sm disabled:opacity-50">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save ({selected.size})
                </button>
            </div>
        </Modal>
    )
}

function ScopeGrid({ scopes, selected, onChange }: { scopes: ModeratorScope[]; selected: Set<string>; onChange: (s: Set<string>) => void }) {
    const grouped = useMemo(() => {
        const m: Record<string, ModeratorScope[]> = {}
        scopes.forEach(s => { (m[s.group] = m[s.group] || []).push(s) })
        return m
    }, [scopes])
    const toggle = (key: string) => {
        const next = new Set(selected); next.has(key) ? next.delete(key) : next.add(key); onChange(next)
    }
    const allInGroup = (keys: string[]) => keys.every(k => selected.has(k))
    const toggleGroup = (keys: string[]) => {
        const next = new Set(selected)
        if (allInGroup(keys)) keys.forEach(k => next.delete(k))
        else keys.forEach(k => next.add(k))
        onChange(next)
    }
    const toggleAll = () => {
        const all = scopes.map(s => s.key)
        onChange(selected.size === all.length ? new Set() : new Set(all))
    }
    return (
        <div className="max-h-[60vh] overflow-y-auto pr-2 -mr-2">
            <div className="flex items-center justify-between mb-2 sticky top-0 bg-white py-1">
                <span className="text-xs font-bold text-gray-500">{selected.size} of {scopes.length} granted</span>
                <button onClick={toggleAll} className="text-xs font-bold text-[#140152] hover:underline">{selected.size === scopes.length ? 'Clear all' : 'Select all'}</button>
            </div>
            {Object.entries(grouped).map(([g, items]) => {
                const keys = items.map(i => i.key)
                const all = allInGroup(keys)
                return (
                    <div key={g} className="mb-3">
                        <button onClick={() => toggleGroup(keys)} className="w-full flex items-center gap-2 text-left text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5 hover:text-[#140152]">
                            {all ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />} {g}
                        </button>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                            {items.map(s => (
                                <button key={s.key} onClick={() => toggle(s.key)} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left border ${selected.has(s.key) ? 'border-[#140152] bg-[#140152]/5 text-[#140152] font-bold' : 'border-gray-200 hover:bg-gray-50 text-gray-600'}`}>
                                    {selected.has(s.key) ? <Check className="w-4 h-4 text-[#140152] flex-shrink-0" /> : <span className="w-4 h-4 rounded border border-gray-300 flex-shrink-0" />}
                                    {s.label}
                                </button>
                            ))}
                        </div>
                    </div>
                )
            })}
        </div>
    )
}

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
    return (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div onClick={e => e.stopPropagation()} className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-black text-[#140152]">{title}</h3>
                    <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
                </div>
                {children}
            </div>
        </div>
    )
}
