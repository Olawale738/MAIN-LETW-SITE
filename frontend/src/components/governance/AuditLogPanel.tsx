'use client'
import { useEffect, useState } from 'react'
import { Loader2, FileSearch, RefreshCw, Plus } from 'lucide-react'
import { governanceApi, type AuditEntry } from '@/lib/api'

interface Props {
    groupKind?: string
    groupId?: string
    title?: string
    actorUserId?: string
    canCustomLog?: boolean   // show a "Log a note" button (coordinator-recorded entry)
}

export default function AuditLogPanel({ groupKind, groupId, title, actorUserId, canCustomLog = false }: Props) {
    const [entries, setEntries] = useState<AuditEntry[]>([])
    const [loading, setLoading] = useState(true)
    const [showAdd, setShowAdd] = useState(false)

    const load = async () => {
        try { setEntries(await governanceApi.audit({ group_kind: groupKind, group_id: groupId, actor_user_id: actorUserId, limit: 100 })) }
        catch { /* no-op */ }
        finally { setLoading(false) }
    }
    useEffect(() => { load() }, [groupKind, groupId, actorUserId])

    return (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5">
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                <h3 className="text-lg font-bold text-[#140152] flex items-center gap-2"><FileSearch className="w-5 h-5 text-[#140152]" /> {title || 'Activity Log'}</h3>
                <div className="flex gap-2">
                    {canCustomLog && <button onClick={() => setShowAdd(true)} className="inline-flex items-center gap-1.5 bg-white border border-gray-200 hover:bg-gray-50 text-[#140152] font-bold px-3 py-1.5 rounded-lg text-xs"><Plus className="w-3.5 h-3.5" /> Log a note</button>}
                    <button onClick={load} className="text-xs text-gray-500 hover:text-[#140152] inline-flex items-center gap-1"><RefreshCw className="w-3.5 h-3.5" /> Refresh</button>
                </div>
            </div>

            {loading ? <Loader2 className="w-5 h-5 animate-spin text-[#140152]" /> : entries.length === 0 ? (
                <p className="text-sm text-gray-400">No activity recorded yet.</p>
            ) : (
                <div className="space-y-1 max-h-[420px] overflow-y-auto pr-2 -mr-2">
                    {entries.map(e => <EntryRow key={e.id} e={e} />)}
                </div>
            )}

            {showAdd && (
                <NoteDialog
                    groupKind={groupKind} groupId={groupId}
                    onClose={() => setShowAdd(false)}
                    onDone={async () => { setShowAdd(false); await load() }}
                />
            )}
        </div>
    )
}

function EntryRow({ e }: { e: AuditEntry }) {
    const when = new Date(e.created_at)
    return (
        <div className="flex items-start gap-3 py-2 border-b border-gray-50">
            <div className="w-1.5 h-1.5 rounded-full bg-[#f5bb00] mt-2 flex-shrink-0" />
            <div className="flex-1 min-w-0">
                <p className="text-sm">
                    <span className="font-bold text-[#140152]">{e.actor_name}</span>
                    <span className="text-gray-400"> · </span>
                    <code className="text-[11px] bg-gray-100 text-[#140152] px-1.5 py-0.5 rounded">{e.action}</code>
                    {e.target_kind && <span className="text-xs text-gray-500"> on {e.target_kind} {e.target_id?.slice(0, 8)}…</span>}
                </p>
                {e.details && Object.keys(e.details).length > 0 && (
                    <pre className="text-[10px] text-gray-500 bg-gray-50 rounded p-1.5 mt-1 overflow-x-auto whitespace-pre-wrap">{JSON.stringify(e.details, null, 0)}</pre>
                )}
                <p className="text-[10px] text-gray-400 mt-0.5">{when.toLocaleString()}</p>
            </div>
        </div>
    )
}

function NoteDialog({ groupKind, groupId, onClose, onDone }: { groupKind?: string; groupId?: string; onClose: () => void; onDone: () => void }) {
    const [action, setAction] = useState('note.record')
    const [note, setNote] = useState('')
    const [submitting, setSubmitting] = useState(false)

    const save = async () => {
        if (!note.trim()) return
        setSubmitting(true)
        try {
            await governanceApi.logCustom({ action, group_kind: groupKind, group_id: groupId, details: { note } })
            onDone()
        } finally { setSubmitting(false) }
    }
    return (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div onClick={e => e.stopPropagation()} className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-5">
                <h3 className="font-black text-[#140152] mb-3">Log a note for the record</h3>
                <label className="text-xs font-bold text-gray-500 block mb-1">Action (verb)</label>
                <input value={action} onChange={e => setAction(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-3 font-mono" />
                <label className="text-xs font-bold text-gray-500 block mb-1">Note</label>
                <textarea value={note} onChange={e => setNote(e.target.value)} rows={4} placeholder="What happened, who was involved, what was decided…" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-3" />
                <div className="flex justify-end gap-2">
                    <button onClick={onClose} className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-bold">Cancel</button>
                    <button onClick={save} disabled={!note.trim() || submitting} className="bg-[#140152] hover:bg-[#1d0175] text-white font-bold px-5 py-2 rounded-lg text-sm disabled:opacity-50">
                        {submitting ? <Loader2 className="w-4 h-4 animate-spin inline" /> : 'Save'}
                    </button>
                </div>
            </div>
        </div>
    )
}
