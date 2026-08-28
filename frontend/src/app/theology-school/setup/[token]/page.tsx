'use client'
/**
 * /theology-school/setup/[token] — the candidate chooses their own password and
 * lands in their portal signed in.
 *
 * This exists so reaching the portal never depends on an email arriving. The
 * link is handed over in the accept response itself, and the office can mint a
 * fresh one for anyone who missed it.
 */
import { useCallback, useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import { Loader2, AlertCircle, Eye, EyeOff, KeyRound } from 'lucide-react'
import { theologyApi, type TheologySetup } from '@/lib/api'

export default function StudentSetupPage() {
    const { token } = useParams<{ token: string }>()
    const router = useRouter()
    const [info, setInfo] = useState<TheologySetup | null>(null)
    const [err, setErr] = useState<string | null>(null)
    const [password, setPassword] = useState('')
    const [confirm, setConfirm] = useState('')
    const [show, setShow] = useState(false)
    const [busy, setBusy] = useState(false)

    const load = useCallback(async () => {
        try { setInfo(await theologyApi.setupDetails(token)) }
        catch (e) { setErr((e as Error).message) }
    }, [token])
    useEffect(() => { if (token) load() }, [token, load])

    const submit = async () => {
        if (password.length < 10) { setErr('Use at least 10 characters. A short phrase is easier to remember and harder to guess.'); return }
        if (password !== confirm) { setErr('Both passwords must match.'); return }
        setBusy(true); setErr(null)
        try {
            const r = await theologyApi.completeSetup(token, password)
            // Signed in immediately — the same tokens a normal sign-in stores.
            localStorage.setItem('access_token', r.access_token)
            localStorage.setItem('refresh_token', r.refresh_token)
            router.push('/theology-school/student')
        } catch (e) { setErr((e as Error).message); setBusy(false) }
    }

    if (err && !info) return (
        <Shell>
            <div className="text-center">
                <AlertCircle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
                <p className="text-gray-600 text-sm">{err}</p>
            </div>
        </Shell>
    )
    if (!info) return <Shell><div className="flex justify-center py-6"><Loader2 className="w-8 h-8 animate-spin text-[#140152]" /></div></Shell>

    return (
        <Shell>
            <div className="text-center mb-6">
                <div className="w-14 h-14 rounded-full bg-[#140152]/[0.06] flex items-center justify-center mx-auto">
                    <KeyRound className="w-7 h-7 text-[#140152]" />
                </div>
                <h1 className="text-xl font-black text-[#140152] mt-3">Set your password</h1>
                <p className="text-gray-600 text-sm mt-1">
                    Welcome, {info.full_name.split(' ')[0]}. Choose a password to open your student portal.
                </p>
            </div>

            <dl className="rounded-xl bg-gray-50 border border-gray-100 p-3 mb-5 text-xs space-y-1">
                <div className="flex gap-2">
                    <dt className="w-28 shrink-0 text-gray-400 font-bold uppercase tracking-widest text-[10px] pt-0.5">Sign-in email</dt>
                    <dd className="font-bold text-[#140152] min-w-0 break-words">{info.email}</dd>
                </div>
                <div className="flex gap-2">
                    <dt className="w-28 shrink-0 text-gray-400 font-bold uppercase tracking-widest text-[10px] pt-0.5">Admission no.</dt>
                    <dd className="font-mono font-bold text-[#140152]">{info.admission_number}</dd>
                </div>
                {info.program_name && (
                    <div className="flex gap-2">
                        <dt className="w-28 shrink-0 text-gray-400 font-bold uppercase tracking-widest text-[10px] pt-0.5">Programme</dt>
                        <dd className="text-gray-700 min-w-0">{info.program_name}</dd>
                    </div>
                )}
            </dl>

            {err && (
                <div className="mb-4 p-3 rounded-xl border border-red-200 bg-red-50 text-red-800 text-sm flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /><span>{err}</span>
                </div>
            )}

            <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">New password</label>
            <div className="relative">
                <input type={show ? 'text' : 'password'} value={password} autoComplete="new-password"
                    onChange={e => setPassword(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') submit() }}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 pr-10 text-sm" />
                <button type="button" onClick={() => setShow(v => !v)}
                    aria-label={show ? 'Hide password' : 'Show password'}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
            </div>
            <p className="text-[11px] text-gray-400 mt-1">At least 10 characters. Three unrelated words make a strong, memorable password.</p>

            <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1 mt-3">Confirm password</label>
            <input type={show ? 'text' : 'password'} value={confirm} autoComplete="new-password"
                onChange={e => setConfirm(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') submit() }}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm" />

            <button onClick={submit} disabled={busy}
                className="w-full mt-5 inline-flex items-center justify-center gap-2 bg-[#140152] hover:bg-[#1d0175] text-white font-bold px-5 py-3 rounded-lg text-sm disabled:opacity-50">
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
                Set password &amp; open my portal
            </button>

            <p className="text-[11px] text-gray-400 mt-3 text-center">
                You&apos;ll use this same email and password for your classes on live.letw.org.
            </p>
        </Shell>
    )
}

function Shell({ children }: { children: React.ReactNode }) {
    return (
        <main className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
            <div className="max-w-md w-full">
                <div className="flex items-center justify-center gap-2 mb-5">
                    <div className="relative w-9 h-9">
                        <Image src="/logo.png" alt="LETW" fill sizes="36px" className="object-contain" />
                    </div>
                    <div>
                        <p className="text-[11px] font-black text-[#140152] leading-tight">LIGHT ENCOUNTER TABERNACLE WORLDWIDE</p>
                        <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#9a6f00]">School of Theology</p>
                    </div>
                </div>
                <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-7">{children}</div>
            </div>
        </main>
    )
}
