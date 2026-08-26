'use client'
/**
 * /admin/theology-admissions — run the Theology School: create programmes
 * (name, fee, duration, LMS course code) and manage applications through
 * payment → admission → acceptance → enrolment → student ID.
 */
import { useCallback, useEffect, useState } from 'react'
import {
    GraduationCap, Loader2, Plus, Save, Trash2, CheckCircle, AlertCircle,
    RefreshCw, ShieldAlert, IdCard, X,
} from 'lucide-react'
import { theologyApi, type TheologyProgram, type TheologyApplication } from '@/lib/api'

const BLANK: Partial<TheologyProgram> = {
    name: '', summary: '', level: 'certificate', duration_months: 12,
    tuition_amount: 0, currency: 'NGN', lms_course_code: '', program_code: '', is_open: true, sort_order: 0,
}

export default function TheologyAdmissionsPage() {
    const [tab, setTab] = useState<'programs' | 'applications'>('programs')
    const [programs, setPrograms] = useState<TheologyProgram[]>([])
    const [apps, setApps] = useState<TheologyApplication[]>([])
    const [loading, setLoading] = useState(true)
    const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)
    const [editing, setEditing] = useState<Partial<TheologyProgram> | null>(null)
    const [saving, setSaving] = useState(false)
    const [busyId, setBusyId] = useState('')

    const load = useCallback(async () => {
        setLoading(true)
        try {
            const [p, a] = await Promise.all([theologyApi.adminPrograms(), theologyApi.adminApplications()])
            setPrograms(p); setApps(a)
        } catch (e) { setMsg({ kind: 'err', text: (e as Error).message }) }
        finally { setLoading(false) }
    }, [])
    useEffect(() => { load() }, [load])
    useEffect(() => { if (msg) { const t = setTimeout(() => setMsg(null), 6000); return () => clearTimeout(t) } }, [msg])

    const saveProgram = async () => {
        if (!editing?.name?.trim()) { setMsg({ kind: 'err', text: 'Programme name is required.' }); return }
        setSaving(true)
        try {
            if (editing.id) await theologyApi.updateProgram(editing.id, editing)
            else await theologyApi.createProgram(editing)
            setMsg({ kind: 'ok', text: 'Programme saved — it is now on the application page.' })
            setEditing(null); load()
        } catch (e) { setMsg({ kind: 'err', text: (e as Error).message }) }
        finally { setSaving(false) }
    }
    const removeProgram = async (p: TheologyProgram) => {
        if (!confirm(`Delete "${p.name}"?`)) return
        try { await theologyApi.deleteProgram(p.id); setMsg({ kind: 'ok', text: 'Deleted.' }); load() }
        catch (e) { setMsg({ kind: 'err', text: (e as Error).message }) }
    }

    const act = async (id: string, fn: () => Promise<unknown>, ok: string) => {
        setBusyId(id)
        try { await fn(); setMsg({ kind: 'ok', text: ok }); load() }
        catch (e) { setMsg({ kind: 'err', text: (e as Error).message }) }
        finally { setBusyId('') }
    }

    return (
        <div className="p-4 sm:p-6 max-w-6xl mx-auto pb-32">
            <h1 className="text-3xl font-black text-[#140152] flex items-center gap-3 mb-1">
                <GraduationCap className="w-7 h-7 text-[#f5bb00]" /> Theology School
            </h1>
            <p className="text-gray-500 text-sm mb-4">Create programmes and manage admissions from application to enrolled student.</p>

            {msg && <div className={`mb-4 p-3 rounded-xl border flex items-start gap-2 text-sm ${msg.kind === 'ok' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>{msg.kind === 'ok' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}<span>{msg.text}</span></div>}

            {!loading && programs.length > 0 && programs.every(p => !p.is_open) && (
                <div className="mb-4 p-4 rounded-xl border border-amber-300 bg-amber-50 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                        <p className="font-bold text-amber-900 text-sm">Applications are closed — two steps to open them</p>
                        <p className="text-amber-800 text-xs mt-1">
                            Your {programs.length} programmes are ready. For each one: <strong>Edit</strong> → set the
                            exact fee and currency → tick <strong>Open for applications</strong> → Save.
                            Until a programme is open, <span className="font-mono">/theology-school/apply</span> has nothing to show.
                        </p>
                    </div>
                </div>
            )}

            <div className="inline-flex bg-white border border-gray-200 rounded-xl p-1 shadow-sm mb-5">
                <button onClick={() => setTab('programs')} className={`px-4 py-1.5 rounded-lg text-xs font-bold ${tab === 'programs' ? 'bg-[#140152] text-white' : 'text-gray-600'}`}>Programmes ({programs.length})</button>
                <button onClick={() => setTab('applications')} className={`px-4 py-1.5 rounded-lg text-xs font-bold ${tab === 'applications' ? 'bg-[#140152] text-white' : 'text-gray-600'}`}>Applications ({apps.length})</button>
            </div>

            {loading ? <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-[#140152]" /></div> : tab === 'programs' ? (
                <>
                    <div className="flex flex-wrap gap-2 mb-4">
                        <button onClick={() => setEditing({ ...BLANK })} className="inline-flex items-center gap-2 bg-[#140152] text-white font-bold px-4 py-2.5 rounded-lg text-sm">
                            <Plus className="w-4 h-4" /> New programme
                        </button>
                        <button onClick={async () => {
                            try {
                                const r = await theologyApi.importPrograms()
                                setMsg({ kind: 'ok', text: r.imported ? `Imported ${r.imported}: ${r.names.join(', ')}. ${r.note}` : 'Nothing new to import — they already exist.' })
                                load()
                            } catch (e) { setMsg({ kind: 'err', text: (e as Error).message }) }
                        }} className="inline-flex items-center gap-2 border border-gray-300 text-[#140152] font-bold px-4 py-2.5 rounded-lg text-sm hover:bg-gray-50">
                            <RefreshCw className="w-4 h-4" /> Import from school page
                        </button>
                    </div>
                    {programs.length === 0 ? (
                        <div className="bg-white border border-dashed border-gray-300 rounded-2xl p-10 text-center">
                            <p className="text-gray-500 text-sm mb-1">No applyable programmes yet.</p>
                            <p className="text-gray-400 text-xs">The programmes shown on the public school page are page content. Click <strong>Import from school page</strong> to turn them into real programmes people can apply and pay for — then set each exact fee and switch it to Open.</p>
                        </div>
                    ) : (
                        <div className="grid sm:grid-cols-2 gap-3">
                            {programs.map(p => (
                                <div key={p.id} className="bg-white border border-gray-100 rounded-2xl shadow-sm p-4">
                                    <div className="flex items-start justify-between gap-2">
                                        <div>
                                            <p className="font-black text-[#140152]">{p.name}</p>
                                            <p className="text-[11px] uppercase tracking-widest text-gray-400">{p.level} · {p.duration_months} months</p>
                                        </div>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${p.is_open ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>{p.is_open ? 'Open' : 'Closed'}</span>
                                    </div>
                                    <p className="mt-2 font-bold text-[#b8860b]">
                                        {Number(p.tuition_amount) > 0
                                            ? `${p.currency} ${Number(p.tuition_amount).toLocaleString()}`
                                            : <span className="text-amber-700">Fee not set yet</span>}
                                    </p>
                                    {p.lms_course_code && <p className="text-[11px] text-gray-400 mt-1">LMS course: <span className="font-mono">{p.lms_course_code}</span></p>}
                                    <div className="flex gap-2 mt-3">
                                        <button onClick={() => setEditing(p)} className="text-xs font-bold text-[#140152] underline">Edit</button>
                                        <button onClick={() => removeProgram(p)} className="text-xs font-bold text-red-500 underline">Delete</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            ) : (
                <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                    {apps.length === 0 ? <p className="p-10 text-center text-gray-400 text-sm">No applications yet.</p> : (
                        <div className="divide-y divide-gray-100">
                            {apps.map(a => (
                                <div key={a.id} className="p-4 flex flex-wrap items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <p className="font-bold text-[#140152]">{a.full_name} <span className="text-[10px] font-black uppercase tracking-widest bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full ml-1">{a.status}</span></p>
                                        <p className="text-xs text-gray-500">{a.email} · {a.program_name || '—'}</p>
                                        <p className="text-[11px] text-gray-400 mt-0.5">
                                            {a.admission_number ? <>Admission {a.admission_number} · </> : null}
                                            {a.paid_at ? <>Paid {a.currency} {Number(a.amount_paid || 0).toLocaleString()} · </> : 'Unpaid · '}
                                            LMS: {a.lms_status || '—'}
                                            {a.student_id_number ? <> · ID {a.student_id_number}</> : null}
                                        </p>
                                        {a.lms_error && <p className="text-[11px] text-amber-700 mt-1">{a.lms_error}</p>}
                                    </div>
                                    <div className="flex flex-wrap gap-1.5">
                                        {!a.paid_at && (
                                            <button onClick={() => act(a.id, () => theologyApi.markPaid(a.id), 'Marked paid — admission letter sent.')} disabled={busyId === a.id}
                                                className="inline-flex items-center gap-1 bg-emerald-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg disabled:opacity-50">
                                                {busyId === a.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />} Mark paid
                                            </button>
                                        )}
                                        {(a.status === 'accepted' || a.status === 'enrolled') && (
                                            <>
                                                <button onClick={() => act(a.id, () => theologyApi.retryProvisioning(a.id), 'Re-ran enrolment + student-ID push.')} disabled={busyId === a.id}
                                                    className="inline-flex items-center gap-1 bg-[#140152] text-white text-xs font-bold px-3 py-1.5 rounded-lg disabled:opacity-50">
                                                    <RefreshCw className="w-3 h-3" /> Retry setup
                                                </button>
                                                <button onClick={() => { if (confirm(`Reset ${a.full_name}'s account access? A new password is emailed to them.`)) act(a.id, () => theologyApi.resetAccess(a.id), 'Access reset — new password emailed.') }} disabled={busyId === a.id}
                                                    className="inline-flex items-center gap-1 text-red-500 hover:bg-red-50 text-xs font-bold px-3 py-1.5 rounded-lg disabled:opacity-50">
                                                    <ShieldAlert className="w-3 h-3" /> Reset access
                                                </button>
                                            </>
                                        )}
                                        {a.student_id_card_url && (
                                            <a href={a.student_id_card_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 bg-[#f5bb00] text-[#140152] text-xs font-bold px-3 py-1.5 rounded-lg"><IdCard className="w-3 h-3" /> ID card</a>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Programme editor */}
            {editing && (
                <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setEditing(null)}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-5 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-3">
                            <p className="font-black text-[#140152]">{editing.id ? 'Edit programme' : 'New programme'}</p>
                            <button onClick={() => setEditing(null)} className="text-gray-400"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="space-y-3">
                            <F label="Programme name *" value={editing.name || ''} onChange={v => setEditing({ ...editing, name: v })} placeholder="Diploma in Theology" />
                            <label className="block">
                                <span className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-gray-500">Summary</span>
                                <textarea value={editing.summary || ''} onChange={e => setEditing({ ...editing, summary: e.target.value })} rows={3} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                                <label className="block">
                                    <span className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-gray-500">Level</span>
                                    <select value={editing.level || 'certificate'} onChange={e => setEditing({ ...editing, level: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
                                        <option value="certificate">Certificate</option>
                                        <option value="diploma">Diploma</option>
                                        <option value="degree">Degree</option>
                                        <option value="masters">Masters</option>
                                    </select>
                                </label>
                                <F label="Duration (months)" type="number" value={String(editing.duration_months ?? 12)} onChange={v => setEditing({ ...editing, duration_months: Number(v) || 0 })} />
                                <F label="Exact fee *" type="number" value={String(editing.tuition_amount ?? 0)} onChange={v => setEditing({ ...editing, tuition_amount: Number(v) || 0 })} />
                                <F label="Currency" value={editing.currency || 'NGN'} onChange={v => setEditing({ ...editing, currency: v.toUpperCase() })} />
                            </div>
                            <F label="LMS course code (live.letw.org)" value={editing.lms_course_code || ''} onChange={v => setEditing({ ...editing, lms_course_code: v })} placeholder="e.g. THEO-101" />
                            <F label="Sharepoints programme code *" value={editing.program_code || ''} onChange={v => setEditing({ ...editing, program_code: v })} placeholder="must match the code on sharepoints" />
                            <label className="flex items-center gap-2 text-sm text-gray-700">
                                <input type="checkbox" checked={editing.is_open ?? true} onChange={e => setEditing({ ...editing, is_open: e.target.checked })} />
                                Open for applications
                            </label>
                        </div>
                        <button onClick={saveProgram} disabled={saving} className="mt-4 inline-flex items-center gap-2 bg-[#140152] text-white font-bold px-5 py-2.5 rounded-lg text-sm disabled:opacity-50">
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save programme
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}

function F({ label, value, onChange, type = 'text', placeholder }: { label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string }) {
    return (
        <label className="block">
            <span className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-gray-500">{label}</span>
            <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
        </label>
    )
}
