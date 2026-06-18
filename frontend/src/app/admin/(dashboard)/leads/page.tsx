'use client'
import { useEffect, useMemo, useState } from 'react'
import { Loader2, Crown, AlertCircle, CheckCircle, Plus, X, Search } from 'lucide-react'
import { governanceApi, moderatorsApi, type GroupKind, type LeadAssignment } from '@/lib/api'

const KIND_LABEL: Record<GroupKind, string> = {
    custom_ministry: 'Custom Ministry',
    youth_program: 'Youth Program',
    department: 'Department',
    volunteer_team: 'Volunteer Team',
}

export default function AdminLeadsPage() {
    const [leads, setLeads] = useState<LeadAssignment[]>([])
    const [loading, setLoading] = useState(true)
    const [adding, setAdding] = useState(false)
    const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)

    const load = async () => {
        try { setLeads(await governanceApi.listLeads()) }
        catch (e) { setMsg({ kind: 'err', text: (e as Error).message }) }
        finally { setLoading(false) }
    }
    useEffect(() => { load() }, [])
    useEffect(() => { if (msg) { const t = setTimeout(() => setMsg(null), 5000); return () => clearTimeout(t) } }, [msg])

    const remove = async (id: string) => {
        if (!confirm('Remove this Lead Coordinator? They remain a member but lose final-say authority.')) return
        try { await governanceApi.removeLead(id); await load() }
        catch (e) { setMsg({ kind: 'err', text: (e as Error).message }) }
    }

    const grouped = useMemo(() => {
        const map: Record<string, LeadAssignment[]> = {}
        leads.forEach(l => {
            const key = `${l.group_kind}/${l.group_id}`
            ;(map[key] = map[key] || []).push(l)
        })
        return map
    }, [leads])

    if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-10 h-10 animate-spin text-[#140152]" /></div>

    return (
        <div className="p-4 sm:p-6 max-w-5xl mx-auto pb-20">
            <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
                <div>
                    <h1 className="text-3xl font-black text-[#140152] flex items-center gap-3"><Crown className="w-7 h-7 text-[#f5bb00]" /> Lead Coordinators</h1>
                    <p className="text-gray-500 mt-1 text-sm">A Lead has final say when coordinators in the same group disagree. Each group can have one or more Leads.</p>
                </div>
                <button onClick={() => setAdding(true)} className="inline-flex items-center gap-2 bg-[#140152] hover:bg-[#1d0175] text-white font-bold px-5 py-3 rounded-xl"><Plus className="w-4 h-4" /> Assign Lead</button>
            </div>

            {msg && <div className={`mb-4 p-3 rounded-xl border flex items-start gap-2 ${msg.kind === 'ok' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                {msg.kind === 'ok' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}<span className="text-sm">{msg.text}</span>
            </div>}

            {Object.keys(grouped).length === 0 ? (
                <p className="text-center text-gray-400 py-12">No Lead Coordinators assigned yet.</p>
            ) : (
                <div className="space-y-4">
                    {Object.entries(grouped).map(([key, ls]) => {
                        const first = ls[0]
                        return (
                            <div key={key} className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5">
                                <div className="flex items-center justify-between gap-2 mb-3">
                                    <div>
                                        <p className="text-xs font-bold uppercase tracking-wider text-gray-500">{KIND_LABEL[first.group_kind] || first.group_kind}</p>
                                        <p className="text-sm font-mono text-gray-600">{first.group_id}</p>
                                    </div>
                                    <span className="text-xs font-bold bg-[#f5bb00]/15 text-[#140152] px-2 py-1 rounded">{ls.length} Lead{ls.length === 1 ? '' : 's'}</span>
                                </div>
                                <div className="space-y-2">
                                    {ls.map(l => (
                                        <div key={l.id} className="flex items-center gap-3 bg-gray-50 rounded-xl px-3 py-2">
                                            <Crown className="w-4 h-4 text-[#f5bb00] flex-shrink-0" />
                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold text-sm text-[#140152] truncate">{l.user_name}</p>
                                                <p className="text-[11px] text-gray-500 truncate">{l.user_email}</p>
                                            </div>
                                            <p className="text-[10px] text-gray-400 hidden sm:block">{new Date(l.assigned_at).toLocaleDateString()}</p>
                                            <button onClick={() => remove(l.id)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded"><X className="w-4 h-4" /></button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {adding && <AssignDialog onClose={() => setAdding(false)} onDone={async () => { setAdding(false); await load() }} setMsg={setMsg} />}
        </div>
    )
}

function AssignDialog({ onClose, onDone, setMsg }: { onClose: () => void; onDone: () => void; setMsg: (m: { kind: 'ok' | 'err'; text: string }) => void }) {
    const [groupKind, setGroupKind] = useState<GroupKind>('custom_ministry')
    const [groupId, setGroupId] = useState('')
    const [q, setQ] = useState('')
    const [candidates, setCandidates] = useState<Array<{ id: string; name: string; email: string }>>([])
    const [submitting, setSubmitting] = useState<string | null>(null)

    useEffect(() => {
        const id = setTimeout(() => { moderatorsApi.candidates(q || undefined).then(setCandidates).catch(() => setCandidates([])) }, 200)
        return () => clearTimeout(id)
    }, [q])

    const assign = async (userId: string) => {
        if (!groupId.trim()) { setMsg({ kind: 'err', text: 'Enter a group ID first.' }); return }
        setSubmitting(userId)
        try {
            await governanceApi.assignLead({ user_id: userId, group_kind: groupKind, group_id: groupId.trim() })
            setMsg({ kind: 'ok', text: 'Lead Coordinator assigned.' })
            onDone()
        } catch (e) { setMsg({ kind: 'err', text: (e as Error).message }) }
        finally { setSubmitting(null) }
    }

    return (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div onClick={e => e.stopPropagation()} className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-black text-[#140152]">Assign Lead Coordinator</h3>
                    <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="w-4 h-4" /></button>
                </div>

                <label className="text-xs font-bold uppercase text-gray-500 block mb-1">Group Type</label>
                <select value={groupKind} onChange={e => setGroupKind(e.target.value as GroupKind)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-3">
                    <option value="custom_ministry">Custom Ministry (women/men/etc.)</option>
                    <option value="youth_program">Youth Program</option>
                    <option value="department">Department (choir/youth/children)</option>
                    <option value="volunteer_team">Volunteer Team</option>
                </select>

                <label className="text-xs font-bold uppercase text-gray-500 block mb-1">Group ID</label>
                <input value={groupId} onChange={e => setGroupId(e.target.value)} placeholder="UUID or slug" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono mb-4" />

                <label className="text-xs font-bold uppercase text-gray-500 block mb-1">Pick User</label>
                <div className="relative mb-2">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search by name or email…" className="w-full border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-sm" />
                </div>
                <div className="max-h-60 overflow-y-auto divide-y divide-gray-100">
                    {candidates.length === 0 && <p className="text-center text-xs text-gray-400 py-4">No matching users.</p>}
                    {candidates.map(c => (
                        <button key={c.id} onClick={() => assign(c.id)} disabled={!!submitting}
                            className="w-full text-left py-2 px-2 hover:bg-[#f5bb00]/10 rounded disabled:opacity-50">
                            <p className="font-bold text-sm text-[#140152]">{c.name}</p>
                            <p className="text-xs text-gray-500">{c.email}</p>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    )
}
