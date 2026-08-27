'use client'
/**
 * /theology-school/student — the student dashboard created on acceptance.
 * Shows admission, programme, classroom access and student-ID status.
 */
import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import {
    GraduationCap, Loader2, ExternalLink, IdCard, BookOpen, CheckCircle, Clock, ShieldAlert, FileText,
} from 'lucide-react'
import { theologyApi, type TheologyApplication } from '@/lib/api'

// The PDF is served by the API, not the Next app.
const API_ORIGIN = (process.env.NEXT_PUBLIC_API_URL || 'https://letw-backend.onrender.com/api').replace(/\/$/, '')

export default function StudentDashboard() {
    const [records, setRecords] = useState<TheologyApplication[] | null>(null)
    const [classroom, setClassroom] = useState('https://live.letw.org/login')
    const [err, setErr] = useState<string | null>(null)

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

    if (err === 'auth') return (
        <main className="min-h-screen flex items-center justify-center p-6 text-center">
            <div>
                <p className="text-gray-600 mb-3">Please sign in with the email you used to apply.</p>
                <Link href="/auth/login?next=/theology-school/student" className="inline-block bg-[#140152] text-white font-bold px-5 py-2.5 rounded-lg">Sign in</Link>
            </div>
        </main>
    )
    if (err) return <main className="min-h-screen flex items-center justify-center p-6 text-center text-gray-500">{err}</main>
    if (!records) return <main className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-[#140152]" /></main>

    if (records.length === 0) return (
        <main className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
            <div className="max-w-md text-center bg-white border border-dashed border-gray-300 rounded-2xl p-10">
                <GraduationCap className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600">No student record found for your account yet.</p>
                <Link href="/theology-school/apply" className="inline-block mt-4 bg-[#140152] text-white font-bold px-5 py-2.5 rounded-lg text-sm">Apply to the Theology School</Link>
            </div>
        </main>
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
                                    {r.lms_status === 'enrolled' ? (
                                        <>
                                            <p className="text-xs text-gray-600 mb-2">You&apos;re enrolled. Sign in with <strong>{r.email}</strong>.</p>
                                            <a href={classroom} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 bg-[#140152] text-white font-bold px-3 py-2 rounded-lg text-xs">
                                                Open classroom <ExternalLink className="w-3.5 h-3.5" />
                                            </a>
                                        </>
                                    ) : (
                                        <p className="text-xs text-gray-500 inline-flex items-start gap-1.5"><Clock className="w-3.5 h-3.5 mt-0.5 shrink-0" /> Your course access is being set up. You&apos;ll be emailed as soon as it&apos;s ready.</p>
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
