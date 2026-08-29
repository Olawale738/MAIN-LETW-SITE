'use client'
/**
 * /admin/theology-admissions — run the Theology School: create programmes
 * (name, fee, duration, LMS course code) and manage applications through
 * payment → admission → acceptance → enrolment → student ID.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import {
    GraduationCap, Loader2, Plus, Save, Trash2, CheckCircle, AlertCircle,
    RefreshCw, ShieldAlert, IdCard, X, UploadCloud, Send, FileText, Undo2, ImagePlus, Mail, KeyRound, BookOpen,
} from 'lucide-react'
import Link from 'next/link'
import RegistrarPanel from '@/components/admin/RegistrarPanel'
import { theologyApi, type TheologyProgram, type TheologyApplication, type TheologyBridgeStatus } from '@/lib/api'

const BLANK: Partial<TheologyProgram> = {
    name: '', summary: '', level: 'certificate', duration_months: 12,
    tuition_amount: 0, currency: 'NGN', lms_course_code: '', program_code: '', is_open: true, sort_order: 0,
}

export default function TheologyAdmissionsPage() {
    const [tab, setTab] = useState<'programs' | 'applications' | 'signatories'>('programs')
    const [programs, setPrograms] = useState<TheologyProgram[]>([])
    const [apps, setApps] = useState<TheologyApplication[]>([])
    const [loading, setLoading] = useState(true)
    const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)
    const [editing, setEditing] = useState<Partial<TheologyProgram> | null>(null)
    const [saving, setSaving] = useState(false)
    const [busyId, setBusyId] = useState('')
    const [bridge, setBridge] = useState<TheologyBridgeStatus | null>(null)
    const [publishing, setPublishing] = useState(false)
    const [photoFor, setPhotoFor] = useState('')
    const photoInput = useRef<HTMLInputElement>(null)

    const load = useCallback(async () => {
        setLoading(true)
        try {
            const [p, a] = await Promise.all([theologyApi.adminPrograms(), theologyApi.adminApplications()])
            setPrograms(p); setApps(a)
            theologyApi.bridgeStatus().then(setBridge).catch(() => setBridge(null))
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

    const pickPhoto = (id: string) => { setPhotoFor(id); photoInput.current?.click() }
    const sendPhoto = async (file: File) => {
        if (!photoFor) return
        await act(photoFor, () => theologyApi.adminUploadPhoto(photoFor, file), 'Photograph saved — it prints on the admission letter.')
        setPhotoFor('')
    }

    const publishAll = async () => {
        setPublishing(true)
        try {
            const r = await theologyApi.publishAllPrograms()
            const failed = r.results.filter(x => !x.ok)
            setMsg(failed.length
                ? { kind: 'err', text: `Registered ${r.published} of ${r.total}. ${failed[0].name}: ${failed[0].reason}` }
                : { kind: 'ok', text: `Registered ${r.published} programme${r.published === 1 ? '' : 's'} with SharePoints. Admissions can now be issued.` })
            load()
        } catch (e) { setMsg({ kind: 'err', text: (e as Error).message }) }
        finally { setPublishing(false) }
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

            {bridge && (() => {
                const unpublished = bridge.programs.filter(p => !p.published)
                const stuck = bridge.stuck.length
                const mailDead = bridge.email && !bridge.email.live
                const noSignatory = bridge.signatory && !bridge.signatory.name?.trim()
                const dupes = bridge.duplicates ?? []
                const healthy = bridge.secret_set && unpublished.length === 0 && stuck === 0 && !mailDead && !noSignatory && dupes.length === 0
                return (
                    <div className={`mb-4 rounded-xl border p-4 ${healthy ? 'border-emerald-200 bg-emerald-50' : 'border-amber-300 bg-amber-50'}`}>
                        <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="min-w-0">
                                <p className={`font-bold text-sm flex items-center gap-2 ${healthy ? 'text-emerald-900' : 'text-amber-900'}`}>
                                    {healthy ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                                    SharePoints admissions {healthy ? 'are flowing' : 'need attention'}
                                </p>
                                <ul className="mt-1.5 space-y-0.5 text-xs text-gray-700">
                                    {dupes.length > 0 && (
                                        <li className="font-bold text-red-700">
                                            · {dupes.length} {dupes.length === 1 ? 'person has' : 'people have'} more than one live application for the same programme
                                            ({dupes.map(d => d.name).join(', ')}). Decide which is real before admitting — two admissions for one person cannot be told apart afterwards.
                                        </li>
                                    )}
                                    {noSignatory && (
                                        <li className="font-bold text-red-700">· No Registrar has been set, so admission letters are not being generated or sent. Set one under <button onClick={() => setTab('signatories')} className="underline">Signatories</button>.</li>
                                    )}
                                    {mailDead && (
                                        <li className="font-bold text-red-700">· No email is being sent — {bridge.email!.reason} Candidates will not receive their admission letter.</li>
                                    )}
                                    {!bridge.secret_set && (
                                        <li>· No shared secret yet — set one in <Link href="/admin/integrations" className="font-bold underline">Integrations</Link>.</li>
                                    )}
                                    {unpublished.length > 0 && (
                                        <li>· {unpublished.length} programme{unpublished.length === 1 ? ' is' : 's are'} not registered with SharePoints yet, so it cannot issue their admission letters.</li>
                                    )}
                                    {stuck > 0 && (
                                        <li>· {stuck} paid application{stuck === 1 ? '' : 's'} never reached SharePoints — open the Applications tab to resend.</li>
                                    )}
                                    {healthy && <li>· Every programme is registered and every paid application has been handed over.</li>}
                                </ul>
                            </div>
                            <button onClick={async () => {
                                setPublishing(true)
                                try {
                                    const r = await theologyApi.pullClassroom()
                                    const bits = [`${r.newly_enrolled} newly enrolled`, `${r.already_enrolled} already`]
                                    if (r.wrong_course) bits.push(`${r.wrong_course} on a different course`)
                                    if (r.unverified_course) bits.push(`${r.unverified_course} unverified (programme not mapped)`)
                                    if (r.unmatched) bits.push(`${r.unmatched} not our students`)
                                    setMsg({ kind: r.wrong_course ? 'err' : 'ok', text: `Read ${r.rows_read} from the classroom — ${bits.join(', ')}.` })
                                    load()
                                } catch (e) { setMsg({ kind: 'err', text: (e as Error).message }) }
                                finally { setPublishing(false) }
                            }} disabled={publishing}
                                className="inline-flex items-center gap-2 border border-gray-300 text-[#140152] font-bold px-4 py-2 rounded-lg text-xs disabled:opacity-50 shrink-0 mr-2">
                                <RefreshCw className="w-3.5 h-3.5" /> Fetch enrolments from classroom
                            </button>
                            <button onClick={publishAll} disabled={publishing || !bridge.secret_set}
                                className="inline-flex items-center gap-2 bg-[#140152] text-white font-bold px-4 py-2 rounded-lg text-xs disabled:opacity-50 shrink-0">
                                {publishing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UploadCloud className="w-3.5 h-3.5" />}
                                Register programmes with SharePoints
                            </button>
                        </div>
                    </div>
                )
            })()}

            <div className="inline-flex bg-white border border-gray-200 rounded-xl p-1 shadow-sm mb-5">
                <button onClick={() => setTab('programs')} className={`px-4 py-1.5 rounded-lg text-xs font-bold ${tab === 'programs' ? 'bg-[#140152] text-white' : 'text-gray-600'}`}>Programmes ({programs.length})</button>
                <button onClick={() => setTab('applications')} className={`px-4 py-1.5 rounded-lg text-xs font-bold ${tab === 'applications' ? 'bg-[#140152] text-white' : 'text-gray-600'}`}>Applications ({apps.length})</button>
                <button onClick={() => setTab('signatories')} className={`px-4 py-1.5 rounded-lg text-xs font-bold ${tab === 'signatories' ? 'bg-[#140152] text-white' : 'text-gray-600'}`}>Signatories</button>
            </div>

            {tab === 'signatories' ? <RegistrarPanel /> : loading ? <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-[#140152]" /></div> : tab === 'programs' ? (
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
                                    <p className="text-[11px] mt-1">
                                        {p.program_code
                                            ? <span className="text-gray-400">SharePoints code: <span className="font-mono text-emerald-700">{p.program_code}</span></span>
                                            : <span className="text-amber-700 font-bold">Not registered with SharePoints yet</span>}
                                    </p>
                                    <div className="flex flex-wrap gap-2 mt-3">
                                        <button onClick={() => setEditing(p)} className="text-xs font-bold text-[#140152] underline">Edit</button>
                                        <button onClick={async () => {
                                            setBusyId(p.id)
                                            try {
                                                const r = await theologyApi.classroomCourses()
                                                if (!r.count) { setMsg({ kind: 'err', text: r.note || 'The classroom has no published courses yet.' }); return }
                                                const list = r.courses.map((c, i) => `${i + 1}. ${c.title || c.slug} (${c.slug})`).join('\n')
                                                const pick = prompt(`Which classroom course is "${p.name}"?\n\n${list}\n\nEnter a number, or paste a course code:`)
                                                if (!pick) return
                                                const n = parseInt(pick, 10)
                                                const code = (!isNaN(n) && r.courses[n - 1]) ? r.courses[n - 1].slug : pick.trim()
                                                const m = await theologyApi.mapCourse(p.id, code)
                                                setMsg({ kind: 'ok', text: `${m.name} is now mapped to ${m.lms_course_code}.` })
                                                load()
                                            } catch (e) { setMsg({ kind: 'err', text: (e as Error).message }) }
                                            finally { setBusyId('') }
                                        }} disabled={busyId === p.id}
                                            className="text-xs font-bold text-[#140152] underline disabled:opacity-50">
                                            Map to classroom course
                                        </button>
                                        <button onClick={() => act(p.id, async () => {
                                            const r = await theologyApi.publishProgram(p.id)
                                            if (!r.ok) throw new Error(r.reason || 'SharePoints rejected the programme.')
                                        }, 'Registered with SharePoints.')} disabled={busyId === p.id}
                                            className="text-xs font-bold text-[#140152] underline disabled:opacity-50">
                                            {busyId === p.id ? 'Registering…' : 'Register with SharePoints'}
                                        </button>
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
                                        {a.initial_password && (
                                            <p className="text-[11px] mt-1 inline-flex flex-wrap items-center gap-1.5">
                                                <span className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">First password</span>
                                                <button onClick={() => navigator.clipboard.writeText(a.initial_password!).then(() => setMsg({ kind: 'ok', text: 'Password copied.' })).catch(() => {})}
                                                    className="font-mono font-black text-[#140152] bg-amber-50 border border-amber-300 rounded px-1.5 py-0.5 hover:bg-amber-100">
                                                    {a.initial_password}
                                                </button>
                                                <span className="text-gray-400">— disappears once they sign in</span>
                                            </p>
                                        )}
                                        {a.status !== 'pending' && !a.admission_email_sent_at && (
                                            <p className="text-[11px] text-amber-700 mt-1 font-bold">Admission letter has never been emailed.</p>
                                        )}
                                        {a.status !== 'pending' && (
                                            a.bridge_status === 'accepted'
                                                ? <p className="text-[11px] text-emerald-700 mt-1">SharePoints issued {a.offer_number || 'the offer'}.</p>
                                                : <p className="text-[11px] text-amber-700 mt-1">Not with SharePoints yet{a.bridge_error ? ` — ${a.bridge_error}` : ''}.</p>
                                        )}
                                    </div>
                                    <div className="flex flex-wrap gap-1.5">
                                        {!a.paid_at && (
                                            <button onClick={() => act(a.id, () => theologyApi.markPaid(a.id), 'Marked paid — admission letter sent.')} disabled={busyId === a.id}
                                                className="inline-flex items-center gap-1 bg-emerald-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg disabled:opacity-50">
                                                {busyId === a.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />} Mark paid
                                            </button>
                                        )}
                                        {a.status !== 'pending' && a.bridge_status !== 'accepted' && (
                                            <button onClick={() => act(a.id, async () => {
                                                const r = await theologyApi.resendToSharepoints(a.id)
                                                if (r.bridge_status !== 'accepted') throw new Error(r.bridge_error || 'SharePoints did not accept it.')
                                            }, 'Sent to SharePoints — admission letter issued.')} disabled={busyId === a.id}
                                                className="inline-flex items-center gap-1 bg-amber-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg disabled:opacity-50">
                                                {busyId === a.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />} Send to SharePoints
                                            </button>
                                        )}
                                        {a.paid_at && a.bridge_status === 'accepted' && (
                                            <button onClick={() => { if (confirm(`Report ${a.full_name}'s tuition payment as refunded?\n\nSharePoints will treat the admission as no longer paid for.`)) act(a.id, () => theologyApi.reportRefund(a.id, 'REFUND'), 'Refund reported to SharePoints.') }} disabled={busyId === a.id}
                                                className="inline-flex items-center gap-1 border border-gray-300 text-gray-600 text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-gray-50">
                                                <Undo2 className="w-3 h-3" /> Report refund
                                            </button>
                                        )}
                                        {a.status !== 'pending' && (
                                            <button onClick={() => act(a.id, () => theologyApi.sendLetter(a.id), 'Signed letter generated and emailed.')} disabled={busyId === a.id}
                                                title={a.admission_email_sent_at ? `Last sent ${new Date(a.admission_email_sent_at).toLocaleString()}` : 'Never sent'}
                                                className={`inline-flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg border ${a.admission_email_sent_at ? 'border-gray-300 text-[#140152] hover:bg-gray-50' : 'border-amber-400 bg-amber-50 text-amber-800'} disabled:opacity-50`}>
                                                <Mail className="w-3 h-3" /> {a.admission_email_sent_at ? 'Resend letter' : 'Email letter'}
                                            </button>
                                        )}
                                        {(a.status === 'accepted' || a.status === 'enrolled') && a.lms_status !== 'enrolled' && (
                                            <button onClick={() => { if (confirm(`Confirm that ${a.full_name} now has a seat in the classroom?

Do this after creating their account in live.letw.org. It stops them waiting and tells SharePoints.`)) act(a.id, () => theologyApi.confirmSeat(a.id), 'Seat confirmed — SharePoints notified.') }} disabled={busyId === a.id}
                                                className="inline-flex items-center gap-1 bg-blue-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg disabled:opacity-50">
                                                <BookOpen className="w-3 h-3" /> Seat created
                                            </button>
                                        )}
                                        {(a.status === 'accepted' || a.status === 'enrolled') && !a.initial_password && (
                                            <button onClick={async () => {
                                                if (!confirm(`Issue a new first password for ${a.full_name}?

This replaces their current one — anyone already signed in with the old password is locked out.`)) return
                                                setBusyId(a.id)
                                                try {
                                                    const r = await theologyApi.reissuePassword(a.id)
                                                    await navigator.clipboard.writeText(r.initial_password).catch(() => {})
                                                    setMsg({ kind: 'ok', text: `New password ${r.initial_password} copied — give it to ${r.email}.` })
                                                    load()
                                                } catch (e) { setMsg({ kind: 'err', text: (e as Error).message }) }
                                                finally { setBusyId('') }
                                            }} disabled={busyId === a.id}
                                                className="inline-flex items-center gap-1 border border-gray-300 text-[#140152] text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-gray-50 disabled:opacity-50">
                                                <KeyRound className="w-3 h-3" /> New password
                                            </button>
                                        )}
                                        {(a.status === 'accepted' || a.status === 'enrolled') && (
                                            <button onClick={async () => {
                                                setBusyId(a.id)
                                                try {
                                                    const r = await theologyApi.setupLink(a.id)
                                                    await navigator.clipboard.writeText(r.setup_url).catch(() => {})
                                                    setMsg({ kind: 'ok', text: `Sign-in link copied — send it to ${r.email}. It lasts ${r.expires_in_days} days and works once.` })
                                                } catch (e) { setMsg({ kind: 'err', text: (e as Error).message }) }
                                                finally { setBusyId('') }
                                            }} disabled={busyId === a.id}
                                                className="inline-flex items-center gap-1 border border-gray-300 text-[#140152] text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-gray-50 disabled:opacity-50">
                                                <KeyRound className="w-3 h-3" /> Sign-in link
                                            </button>
                                        )}
                                        <button onClick={() => pickPhoto(a.id)} disabled={busyId === a.id}
                                            className="inline-flex items-center gap-1 border border-gray-300 text-[#140152] text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-gray-50 disabled:opacity-50">
                                            <ImagePlus className="w-3 h-3" /> {a.photo_url ? 'Replace photo' : 'Add photo'}
                                        </button>
                                        {a.acceptance_token && a.admission_number && (
                                            <a href={`/theology-school/offer/${a.acceptance_token}/letter`} target="_blank" rel="noreferrer"
                                                className="inline-flex items-center gap-1 border border-gray-300 text-[#140152] text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-gray-50">
                                                <FileText className="w-3 h-3" /> Letter
                                            </a>
                                        )}
                                        {a.admission_letter_url && (
                                            <a href={a.admission_letter_url} target="_blank" rel="noreferrer"
                                                className="inline-flex items-center gap-1 border border-emerald-300 text-emerald-700 text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-emerald-50">
                                                <FileText className="w-3 h-3" /> Official letter
                                            </a>
                                        )}
                                        {(a.status === 'accepted' || a.status === 'enrolled') && (
                                            <>
                                                <button onClick={() => act(a.id, () => theologyApi.retryProvisioning(a.id), 'Re-ran enrolment + student-ID push.')} disabled={busyId === a.id}
                                                    className="inline-flex items-center gap-1 bg-[#140152] text-white text-xs font-bold px-3 py-1.5 rounded-lg disabled:opacity-50">
                                                    <RefreshCw className="w-3 h-3" /> Retry setup
                                                </button>
                                                <button onClick={() => { if (confirm(`Reset ${a.full_name}'s letw.org password? A new one is emailed to them.\n\nThis covers letw.org only. If the account was actually compromised, use "Secure everywhere" instead — that also signs them out of SharePoints and secures the classroom.`)) act(a.id, () => theologyApi.resetAccess(a.id), 'Access reset — new password emailed.') }} disabled={busyId === a.id}
                                                    className="inline-flex items-center gap-1 text-red-500 hover:bg-red-50 text-xs font-bold px-3 py-1.5 rounded-lg disabled:opacity-50">
                                                    <ShieldAlert className="w-3 h-3" /> Reset password
                                                </button>
                                                <a href="https://sharepoints.letw.org/theology/recovery" target="_blank" rel="noreferrer"
                                                    title="Protected recovery on SharePoints — signs the student out everywhere, forces a new password and secures their classroom account"
                                                    className="inline-flex items-center gap-1 border border-red-300 text-red-600 text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-red-50">
                                                    <ShieldAlert className="w-3 h-3" /> Secure everywhere
                                                </a>
                                            </>
                                        )}
                                        {(a.status === 'accepted' || a.status === 'enrolled') && (
                                            <button onClick={() => act(a.id, async () => {
                                                const r = await theologyApi.adminRefreshCredentials(a.id)
                                                setMsg({ kind: 'ok', text: `SharePoints: ${r.student_id_number || 'no ID yet'}, ${r.certificates} certificate(s).` })
                                            }, 'Credentials refreshed from SharePoints.')} disabled={busyId === a.id}
                                                className="inline-flex items-center gap-1 border border-gray-300 text-[#140152] text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-gray-50 disabled:opacity-50">
                                                <RefreshCw className="w-3 h-3" /> Credentials
                                            </button>
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

            <input ref={photoInput} type="file" accept="image/*" className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) sendPhoto(f); e.target.value = '' }} />

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
