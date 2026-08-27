'use client'
/**
 * /theology-school/student — the student dashboard created on acceptance.
 * Shows admission, programme, classroom access and student-ID status.
 */
import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import {
    GraduationCap, Loader2, ExternalLink, IdCard, BookOpen, CheckCircle, Clock, ShieldAlert, FileText, RefreshCw, AlertCircle,
} from 'lucide-react'
import { theologyApi, type TheologyApplication } from '@/lib/api'

// The PDF is served by the API, not the Next app.
const API_ORIGIN = (process.env.NEXT_PUBLIC_API_URL || 'https://letw-backend.onrender.com/api').replace(/\/$/, '')

export default function StudentDashboard() {
    const [records, setRecords] = useState<TheologyApplication[] | null>(null)
    const [classroom, setClassroom] = useState('https://live.letw.org/login')
    const [err, setErr] = useState<string | null>(null)
    const [entering, setEntering] = useState(false)
    const [refreshing, setRefreshing] = useState(false)
    const [slow, setSlow] = useState(false)
    const [signedInAs, setSignedInAs] = useState('')

    // Ask sharepoints directly for the current ID and certificates. It is the
    // authority on both, and on which of them have been revoked.
    const refreshCredentials = async () => {
        setRefreshing(true)
        try { await theologyApi.refreshCredentials(); await load() }
        catch { /* the card keeps showing whatever we already had */ }
        finally { setRefreshing(false) }
    }

    // Ask the server for the classroom address and nudge the seat on the way
    // out. A failure here must never stand between a student and their class,
    // so we fall back to the plain classroom URL.
    const enterClassroom = async (email: string) => {
        setEntering(true)
        let url = classroom
        try {
            const r = await theologyApi.classroom()
            url = r.classroom_url || classroom
        } catch { /* fall through to the default */ }
        finally { setEntering(false) }
        try { await navigator.clipboard.writeText(email) } catch { /* not critical */ }
        window.open(url, '_blank', 'noopener')
    }

    const load = useCallback(async () => {
        try {
            const r = await theologyApi.myRecords()
            setRecords(r.records); setClassroom(r.classroom_url)
        } catch (e) {
            const m = (e as Error).message || ''
            setErr(/401|unauth|log/i.test(m) ? 'auth' : m)
        }
    }, [])
    useEffect(() => { load() }, [load])
    // Only mention the wait once it is actually a wait.
    useEffect(() => { const t = setTimeout(() => setSlow(true), 4000); return () => clearTimeout(t) }, [])
    useEffect(() => {
        try { setSignedInAs(localStorage.getItem('userEmail') || '') } catch { /* not critical */ }
    }, [])

    if (err === 'auth') return (
        <main className="min-h-screen flex items-center justify-center p-6 text-center">
            <div>
                <p className="text-gray-600 mb-3">Please sign in with the email you used to apply.</p>
                <Link href="/auth/login?redirect=/theology-school/student" className="inline-block bg-[#140152] text-white font-bold px-5 py-2.5 rounded-lg">Sign in</Link>
            </div>
        </main>
    )
    if (err) return (
        <Panel>
            <AlertCircle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
            <p className="font-bold text-[#140152]">We couldn&apos;t open your portal</p>
            <p className="text-gray-600 text-sm mt-1">{err}</p>
            <button onClick={() => { setErr(null); setRecords(null); load() }}
                className="inline-flex items-center gap-2 mt-4 bg-[#140152] text-white font-bold px-5 py-2.5 rounded-lg text-sm">
                <RefreshCw className="w-4 h-4" /> Try again
            </button>
            <p className="text-[11px] text-gray-400 mt-3">
                If this keeps happening, contact the school office with your admission number.
            </p>
        </Panel>
    )

    // The API retries for ~25s to ride out a sleeping server, so this state can
    // last a while. A bare spinner reads as a broken page; say what is going on.
    if (!records) return (
        <Panel>
            <Loader2 className="w-8 h-8 animate-spin text-[#140152] mx-auto" />
            <p className="text-gray-600 text-sm mt-4">Opening your portal…</p>
            {slow && (
                <p className="text-[11px] text-gray-400 mt-2">
                    The server may be waking up — this can take up to a minute the first time each day.
                </p>
            )}
        </Panel>
    )

    if (records.length === 0) return (
        <Panel>
            <GraduationCap className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="font-bold text-[#140152]">Nothing here under this account yet</p>
            <p className="text-gray-600 text-sm mt-2">
                Your studies appear here once you accept your offer of admission. If you have already
                applied, open the offer link that was issued to you — accepting it creates your record.
            </p>
            <p className="text-[11px] text-gray-500 mt-3">
                Signed in as <strong className="text-[#140152]">{signedInAs || 'this account'}</strong>.
                If you applied with a different email, sign in with that one instead.
            </p>
            <div className="flex flex-wrap gap-2 justify-center mt-4">
                <Link href="/auth/login?redirect=/theology-school/student" className="border border-gray-300 text-[#140152] font-bold px-4 py-2.5 rounded-lg text-sm">Use a different email</Link>
                <Link href="/contact" className="border border-gray-300 text-[#140152] font-bold px-4 py-2.5 rounded-lg text-sm">Ask the school office</Link>
                <Link href="/theology-school/apply" className="bg-[#140152] text-white font-bold px-4 py-2.5 rounded-lg text-sm">Apply</Link>
            </div>
        </Panel>
    )

    return (
        <main className="min-h-screen bg-gray-50 py-10 px-4">
            <div className="max-w-3xl mx-auto">
                <h1 className="text-3xl font-black text-[#140152] flex items-center gap-3 mb-1">
                    <GraduationCap className="w-8 h-8 text-[#f5bb00]" /> My Studies
                </h1>
                <p className="text-gray-500 text-sm mb-6">Your admission, classroom and student ID in one place.</p>

                <div className="space-y-4">
                    {records.map(r => (
                        <div key={r.id} className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                            <div className="bg-[#140152] text-white px-5 py-4 flex flex-wrap items-center justify-between gap-2">
                                <div>
                                    <p className="font-black">{r.program_name || 'Theology programme'}</p>
                                    <p className="text-xs text-white/70">Admission {r.admission_number || '—'}</p>
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-widest bg-[#f5bb00] text-[#140152] px-3 py-1 rounded-full">{r.status}</span>
                            </div>

                            <div className="p-5 grid sm:grid-cols-2 gap-3">
                                <Card icon={BookOpen} title="Classroom" tone="#eff6ff" ic="#2563eb">
                                    <p className="text-xs text-gray-600 mb-2">
                                        Sign in with <strong>{r.email}</strong> and your letw.org password — the classroom
                                        checks your account here, so there is nothing separate to set up.
                                    </p>
                                    <button onClick={() => enterClassroom(r.email)} disabled={entering}
                                        className="inline-flex items-center gap-1.5 bg-[#140152] text-white font-bold px-3 py-2 rounded-lg text-xs disabled:opacity-50">
                                        {entering ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ExternalLink className="w-3.5 h-3.5" />}
                                        Enter classroom
                                    </button>
                                    {r.lms_status !== 'enrolled' && (
                                        <p className="text-[11px] text-amber-700 mt-2 inline-flex items-start gap-1.5">
                                            <Clock className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                                            Your seat is still being created. You can go in now — we&apos;ll ask the
                                            classroom to set it up as you do.
                                        </p>
                                    )}
                                </Card>

                                <Card icon={IdCard} title="Student ID" tone="#f0fdf4" ic="#16a34a">
                                    {r.student_id_number ? (
                                        <>
                                            <p className="text-xs text-gray-600">Number: <strong className="text-[#140152]">{r.student_id_number}</strong></p>
                                            {r.student_id_card_url && (
                                                <a href={r.student_id_card_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 mt-2 bg-[#f5bb00] text-[#140152] font-bold px-3 py-2 rounded-lg text-xs">
                                                    View my ID card <ExternalLink className="w-3.5 h-3.5" />
                                                </a>
                                            )}
                                        </>
                                    ) : (
                                        <p className="text-xs text-gray-500 inline-flex items-start gap-1.5"><Clock className="w-3.5 h-3.5 mt-0.5 shrink-0" /> Your student ID is being processed. It appears here once issued.</p>
                                    )}
                                </Card>

                                <Card icon={CheckCircle} title="Admission" tone="#fef3c7" ic="#d97706">
                                    <p className="text-xs text-gray-600">Offer accepted {r.accepted_at ? new Date(r.accepted_at).toLocaleDateString() : '—'}</p>
                                    {r.paid_at && <p className="text-xs text-gray-500 mt-1">Fee paid: {r.currency} {Number(r.amount_paid || 0).toLocaleString()}</p>}
                                    <div className="flex flex-wrap gap-2 mt-2.5">
                                        {r.acceptance_token && (
                                            <>
                                                <a href={`${API_ORIGIN}/theology/offer/${r.acceptance_token}/letter.pdf`}
                                                    target="_blank" rel="noreferrer"
                                                    className="inline-flex items-center gap-1.5 bg-[#140152] text-white font-bold px-3 py-2 rounded-lg text-xs">
                                                    <FileText className="w-3.5 h-3.5" /> Admission letter (PDF)
                                                </a>
                                                <Link href={`/theology-school/offer/${r.acceptance_token}/letter`}
                                                    className="inline-flex items-center gap-1.5 border border-gray-300 text-[#140152] font-bold px-3 py-2 rounded-lg text-xs">
                                                    View on screen
                                                </Link>
                                            </>
                                        )}
                                        {r.admission_letter_url && (
                                            <a href={r.admission_letter_url} target="_blank" rel="noreferrer"
                                                className="inline-flex items-center gap-1.5 border border-gray-300 text-[#140152] font-bold px-3 py-2 rounded-lg text-xs">
                                                Official copy <ExternalLink className="w-3.5 h-3.5" />
                                            </a>
                                        )}
                                    </div>
                                </Card>

                                <Card icon={FileText} title="My documents" tone="#eef2ff" ic="#4f46e5">
                                    <button onClick={refreshCredentials} disabled={refreshing}
                                        className="float-right -mt-6 inline-flex items-center gap-1 text-[11px] font-bold text-[#4f46e5] hover:underline disabled:opacity-50">
                                        {refreshing ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />} Check for new
                                    </button>
                                    {(r.documents?.length ?? 0) > 0 ? (
                                        <ul className="space-y-1.5">
                                            {r.documents!.map((d, i) => (
                                                <li key={`${d.kind}-${i}`}>
                                                    <a href={d.url} target="_blank" rel="noreferrer"
                                                        className="inline-flex items-center gap-1.5 text-xs font-bold text-[#140152] hover:underline">
                                                        <FileText className="w-3.5 h-3.5 shrink-0" />
                                                        <span className="min-w-0 break-words">{d.title}</span>
                                                        <ExternalLink className="w-3 h-3 shrink-0 opacity-60" />
                                                    </a>
                                                    {d.number && <span className="block text-[11px] text-gray-400 pl-5 font-mono">{d.number}</span>}
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p className="text-xs text-gray-500 inline-flex items-start gap-1.5">
                                            <Clock className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                                            Certificates and your ID card appear here as the school office issues them.
                                        </p>
                                    )}
                                </Card>

                                <Card icon={ShieldAlert} title="Account security" tone="#fdf2f8" ic="#db2777">
                                    <p className="text-xs text-gray-600">Never share your password. If someone else has used your account, start a protected recovery — it signs you out everywhere, forces a new password, and secures your classroom access at the same time.</p>
                                    <a href="https://sharepoints.letw.org/theology/recovery" target="_blank" rel="noreferrer"
                                        className="inline-flex items-center gap-1.5 mt-2 bg-[#db2777] text-white font-bold px-3 py-2 rounded-lg text-xs">
                                        Secure my account <ExternalLink className="w-3.5 h-3.5" />
                                    </a>
                                    <p className="text-[11px] text-gray-500 mt-2">
                                        You&apos;ll need your student ID number{r.student_id_number ? <> (<strong className="text-[#140152]">{r.student_id_number}</strong>)</> : null} and the email you applied with.
                                    </p>
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        <Link href="/auth/forgot-password" className="text-xs font-bold text-[#140152] underline">Just reset my password</Link>
                                        <Link href="/contact" className="text-xs font-bold text-[#140152] underline">Tell the school office</Link>
                                    </div>
                                </Card>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </main>
    )
}

function Card({ icon: Icon, title, tone, ic, children }: { icon: React.ElementType; title: string; tone: string; ic: string; children: React.ReactNode }) {
    return (
        <div className="border border-gray-100 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
                <span className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: tone }}><Icon className="w-4 h-4" style={{ color: ic }} /></span>
                <span className="text-[11px] font-black uppercase tracking-wider text-gray-500">{title}</span>
            </div>
            {children}
        </div>
    )
}

function Panel({ children }: { children: React.ReactNode }) {
    return (
        <main className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
            <div className="max-w-md w-full text-center bg-white border border-gray-100 rounded-2xl shadow-sm p-8">
                {children}
            </div>
        </main>
    )
}
