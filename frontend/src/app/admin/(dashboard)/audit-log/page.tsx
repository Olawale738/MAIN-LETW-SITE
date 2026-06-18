'use client'
import { useEffect, useState } from 'react'
import { Loader2, FileSearch, RefreshCw } from 'lucide-react'
import { governanceApi, type AuditEntry } from '@/lib/api'

const GROUP_KINDS = ['', 'custom_ministry', 'youth_program', 'department', 'volunteer_team']

export default function AdminAuditLogPage() {
    const [entries, setEntries] = useState<AuditEntry[]>([])
    const [loading, setLoading] = useState(true)
    const [groupKind, setGroupKind] = useState('')
    const [actionFilter, setActionFilter] = useState('')
    const [actorFilter, setActorFilter] = useState('')

    const load = async () => {
        setLoading(true)
        try {
            setEntries(await governanceApi.audit({
                group_kind: groupKind || undefined,
                action: actionFilter || undefined,
                actor_user_id: actorFilter || undefined,
                limit: 200,
            }))
        } catch { setEntries([]) }
        finally { setLoading(false) }
    }
    useEffect(() => { load() }, [groupKind, actionFilter, actorFilter])

    return (
        <div className="p-4 sm:p-6 max-w-6xl mx-auto pb-20">
            <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
                <div>
                    <h1 className="text-3xl font-black text-[#140152] flex items-center gap-3"><FileSearch className="w-7 h-7 text-[#140152]" /> Audit Log</h1>
                    <p className="text-gray-500 mt-1 text-sm">Every recorded action across moderators, ministries, programs and volunteer teams. Receipts for fair arbitration.</p>
                </div>
                <button onClick={load} className="text-sm text-gray-500 hover:text-[#140152] inline-flex items-center gap-1.5"><RefreshCw className="w-4 h-4" /> Refresh</button>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                        <label className="text-xs font-bold uppercase text-gray-500 block mb-1">Group Type</label>
                        <select value={groupKind} onChange={e => setGroupKind(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
                            {GROUP_KINDS.map(k => <option key={k} value={k}>{k || 'Any'}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-bold uppercase text-gray-500 block mb-1">Action (verb)</label>
                        <input value={actionFilter} onChange={e => setActionFilter(e.target.value)} placeholder="e.g. lead.assign" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono" />
                    </div>
                    <div>
                        <label className="text-xs font-bold uppercase text-gray-500 block mb-1">Actor user ID</label>
                        <input value={actorFilter} onChange={e => setActorFilter(e.target.value)} placeholder="user UUID" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono" />
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {loading ? <div className="p-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-[#140152]" /></div> :
                    entries.length === 0 ? <p className="text-center text-gray-400 py-12">No matching entries.</p> :
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 text-left text-xs uppercase tracking-wider text-gray-500">
                            <tr><th className="px-4 py-3">When</th><th className="px-4 py-3">Actor</th><th className="px-4 py-3">Action</th><th className="px-4 py-3">Group</th><th className="px-4 py-3">Target</th><th className="px-4 py-3">Details</th></tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {entries.map(e => (
                                <tr key={e.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{new Date(e.created_at).toLocaleString()}</td>
                                    <td className="px-4 py-3">
                                        <p className="font-bold text-[#140152]">{e.actor_name}</p>
                                        {e.actor_email && <p className="text-[10px] text-gray-400">{e.actor_email}</p>}
                                    </td>
                                    <td className="px-4 py-3"><code className="text-[11px] bg-gray-100 text-[#140152] px-1.5 py-0.5 rounded font-mono">{e.action}</code></td>
                                    <td className="px-4 py-3 text-xs">
                                        {e.group_kind && <span className="font-bold text-[#140152]">{e.group_kind}</span>}
                                        {e.group_id && <p className="text-gray-500 font-mono text-[10px]">{e.group_id.slice(0, 12)}…</p>}
                                    </td>
                                    <td className="px-4 py-3 text-xs">
                                        {e.target_kind && <span className="font-bold">{e.target_kind}</span>}
                                        {e.target_id && <p className="text-gray-500 font-mono text-[10px]">{e.target_id.slice(0, 12)}…</p>}
                                    </td>
                                    <td className="px-4 py-3 text-[10px] text-gray-500">
                                        {e.details && Object.keys(e.details).length > 0 ? <pre className="bg-gray-50 rounded p-1 overflow-x-auto max-w-xs whitespace-pre-wrap">{JSON.stringify(e.details)}</pre> : '—'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                }
            </div>
        </div>
    )
}
