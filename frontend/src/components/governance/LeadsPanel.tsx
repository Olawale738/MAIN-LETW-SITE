'use client'
import { useEffect, useState } from 'react'
import { Crown, Loader2, Plus, X, AlertCircle, CheckCircle, Search } from 'lucide-react'
import { governanceApi, type GroupKind, type LeadAssignment } from '@/lib/api'

interface Props {
    groupKind: GroupKind
    groupId: string
    groupLabel?: string
    canManage?: boolean         // true if current user can assign / remove leads (admin only)
    candidateLookup?: (q: string) => Promise<Array<{ id: string; name: string; email: string }>>
}

export default function LeadsPanel({ groupKind, groupId, groupLabel, canManage = false, candidateLookup }: Props) {
    const [leads, setLeads] = useState<LeadAssignment[]>([])
    const [loading, setLoading] = useState(true)
    const [adding, setAdding] = useState(false)
    const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)

    const load = async () => {
        try { setLeads(await governanceApi.listLeads(groupKind, groupId)) }
        catch (e) { setMsg({ kind: 'err', text: (e as Error).message }) }
        finally { setLoading(false) }
    }
    useEffect(() => { load() }, [groupKind, groupId])
    useEffect(() => { if (msg) { const t = setTimeout(() => setMsg(null), 4000); return () => clearTimeout(t) } }, [msg])

    const remove = async (id: string) => {
        if (!confirm('Remove this Lead Coordinator? They remain a member but lose final-say authority.')) return
        try { await governanceApi.removeLead(id); await load() }
        catch (e) { setMsg({ kind: 'err', text: (e as Error).message }) }
    }

    return (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5">
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                <h3 className="text-lg font-bold text-[#140152] flex items-center gap-2"><Crown className="w-5 h-5 text-[#f5bb00]" /> Lead Coordinators{groupLabel ? <span className="text-xs text-gray-500 font-normal">— {groupLabel}</span> : null}</h3>
                {canManage && <button onClick={() => setAdding(true)} className="inline-flex items-center gap-1.5 bg-[#140152] hover:bg-[#1d0175] text-white font-bold px-3 py-1.5 rounded-lg text-xs"><Plus className="w-3.5 h-3.5" /> Promote to Lead</button>}
            </div>
            <p className="text-xs text-gray-500 mb-4">A Lead has final say when coordinators disagree. Only admins can promote or remove a Lead.</p>

            {msg && <div className={`mb-3 p-2 rounded-lg text-xs flex items-start gap-2 ${msg.kind === 'ok' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
                {msg.kind === 'ok' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}{msg.text}
            </div>}

            {loading ? <Loader2 className="w-5 h-5 animate-spin text-[#140152]" /> : leads.length === 0 ? (
                <p className="text-sm text-gray-400">No Lead Coordinator assigned yet.</p>
            ) : (
                <div className="space-y-2">
                    {leads.map(l => (
                        <div key={l.id} className="flex items-center gap-3 bg-[#f5bb00]/10 border border-[#f5bb00]/40 rounded-xl px-4 py-2.5">
                            <div className="w-9 h-9 rounded-full bg-[#140152] text-[#f5bb00] flex items-center justify-center font-black flex-shrink-0"><Crown className="w-4 h-4" /></div>
                            <div className="flex-1 min-w-0">
                                <p className="font-bold text-[#140152] truncate">{l.user_name}</p>
                                <p className="text-[11px] text-gray-500 truncate">{l.user_email}</p>
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#140152] bg-white px-2 py-1 rounded">Lead</span>
                            {canManage && <button onClick={() => remove(l.id)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg" title="Remove Lead"><X className="w-4 h-4" /></button>}
                        </div>
                    ))}
                </div>
            )}

            {adding && (
                <PromoteDialog
                    groupKind={groupKind} groupId={groupId}
                    candidateLookup={candidateLookup}
                    onClose={() => setAdding(false)}
                    onDone={async () => { setAdding(false); await load() }}
                    setMsg={setMsg}
                />
            )}
        </div>
    )
}

function PromoteDialog({ groupKind, groupId, candidateLookup, onClose, onDone, setMsg }: {
    groupKind: GroupKind; groupId: string;
    candidateLookup?: (q: string) => Promise<Array<{ id: string; name: string; email: string }>>
    onClose: () => void; onDone: () => void;
    setMsg: (m: { kind: 'ok' | 'err'; text: string }) => void
}) {
    const [q, setQ] = useState('')
    const [results, setResults] = useState<Array<{ id: string; name: string; email: string }>>([])
    const [manualId, setManualId] = useState('')
    const [submitting, setSubmitting] = useState(false)

    useEffect(() => {
        if (!candidateLookup) return
        const id = setTimeout(() => { candidateLookup(q).then(setResults).catch(() => setResults([])) }, 200)
        return () => clearTimeout(id)
    }, [q, candidateLookup])

    const promote = async (userId: string) => {
        setSubmitting(true)
        try {
            await governanceApi.assignLead({ user_id: userId, group_kind: groupKind, group_id: groupId })
            setMsg({ kind: 'ok', text: 'Lead Coordinator assigned.' })
            onDone()
        } catch (e) { setMsg({ kind: 'err', text: (e as Error).message }) }
        finally { setSubmitting(false) }
    }

    return (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div onClick={e => e.stopPropagation()} className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-black text-[#140152]">Promote to Lead Coordinator</h3>
                    <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="w-4 h-4" /></button>
                </div>
                {candidateLookup ? (
                    <>
                        <div className="relative mb-2">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search member by name or email…" className="w-full border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-sm" />
                        </div>
                        <div className="max-h-72 overflow-y-auto divide-y divide-gray-100">
                            {results.length === 0 && <p className="text-center text-xs text-gray-400 py-4">No matching members.</p>}
                            {results.map(r => (
                                <button key={r.id} onClick={() => promote(r.id)} disabled={submitting}
                                    className="w-full text-left py-2.5 px-2 hover:bg-[#f5bb00]/10 rounded disabled:opacity-50">
                                    <p className="font-bold text-sm text-[#140152]">{r.name}</p>
                                    <p className="text-xs text-gray-500">{r.email}</p>
                                </button>
                            ))}
                        </div>
                    </>
                ) : (
                    <>
                        <label className="text-xs font-bold text-gray-500 block mb-1">User ID</label>
                        <input value={manualId} onChange={e => setManualId(e.target.value)} placeholder="user UUID" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-3 font-mono" />
                        <div className="flex justify-end gap-2">
                            <button onClick={onClose} className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-bold">Cancel</button>
                            <button onClick={() => manualId && promote(manualId)} disabled={!manualId || submitting} className="bg-[#140152] hover:bg-[#1d0175] text-white font-bold px-5 py-2 rounded-lg text-sm disabled:opacity-50">
                                {submitting ? <Loader2 className="w-4 h-4 animate-spin inline" /> : 'Promote'}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}
