'use client'
import { useEffect, useState } from 'react'
import { Loader2, ShieldCheck, AlertCircle, CheckCircle, Copy, KeyRound } from 'lucide-react'
import { twoFactorApi } from '@/lib/api'

export default function AdminTwoFactorPage() {
    const [status, setStatus] = useState<{ enabled: boolean; verified: boolean; last_used_at: string | null } | null>(null)
    const [setupData, setSetupData] = useState<{ secret: string; otpauth_uri: string; qr_png_base64: string } | null>(null)
    const [code, setCode] = useState('')
    const [recovery, setRecovery] = useState<string[] | null>(null)
    const [loading, setLoading] = useState(true)
    const [working, setWorking] = useState(false)
    const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)

    const load = async () => {
        try { setStatus(await twoFactorApi.status()) }
        catch (e) { setMsg({ kind: 'err', text: (e as Error).message }) }
        finally { setLoading(false) }
    }
    useEffect(() => { load() }, [])
    useEffect(() => { if (msg) { const t = setTimeout(() => setMsg(null), 6000); return () => clearTimeout(t) } }, [msg])

    const startSetup = async () => {
        setWorking(true)
        try { setSetupData(await twoFactorApi.setup()); setRecovery(null) }
        catch (e) { setMsg({ kind: 'err', text: (e as Error).message }) }
        finally { setWorking(false) }
    }
    const verifyCode = async () => {
        if (!code.trim()) return
        setWorking(true)
        try {
            const r = await twoFactorApi.verify(code.trim())
            setRecovery(r.recovery_codes)
            setSetupData(null); setCode('')
            setMsg({ kind: 'ok', text: '2FA enabled. Save your recovery codes below.' })
            await load()
        } catch (e) { setMsg({ kind: 'err', text: (e as Error).message }) }
        finally { setWorking(false) }
    }
    const disable = async () => {
        if (!code.trim() || !confirm('Disable 2FA on this account? You will only need your password to sign in.')) return
        setWorking(true)
        try { await twoFactorApi.disable(code.trim()); setMsg({ kind: 'ok', text: '2FA disabled.' }); setCode(''); await load() }
        catch (e) { setMsg({ kind: 'err', text: (e as Error).message }) }
        finally { setWorking(false) }
    }

    if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-10 h-10 animate-spin text-[#140152]" /></div>

    return (
        <div className="p-4 sm:p-6 max-w-3xl mx-auto pb-32">
            <div className="mb-6">
                <h1 className="text-3xl font-black text-[#140152] flex items-center gap-3"><ShieldCheck className="w-7 h-7 text-[#f5bb00]" /> Two-Factor Authentication</h1>
                <p className="text-gray-500 mt-1 text-sm">Add a code-from-your-phone step on top of your password. Strongly recommended for every admin and moderator.</p>
            </div>

            {msg && <div className={`mb-4 p-3 rounded-xl border flex items-start gap-2 ${msg.kind === 'ok' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                {msg.kind === 'ok' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}<span className="text-sm">{msg.text}</span>
            </div>}

            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm mb-5">
                <div className="flex items-center justify-between flex-wrap gap-3 mb-1">
                    <p className="font-bold text-[#140152]">Status</p>
                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${status?.verified ? 'bg-green-100 text-green-700' : status?.enabled ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'}`}>
                        {status?.verified ? '● Enabled and verified' : status?.enabled ? '○ Setup started — not verified' : '○ Not enabled'}
                    </span>
                </div>
                {status?.last_used_at && <p className="text-xs text-gray-500">Last used: {new Date(status.last_used_at).toLocaleString()}</p>}
            </div>

            {!status?.verified && !setupData && !recovery && (
                <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm mb-5">
                    <h2 className="font-bold text-[#140152] mb-3">Enable 2FA</h2>
                    <ol className="text-sm text-gray-600 space-y-1.5 mb-4 list-decimal list-inside">
                        <li>Install <strong>Google Authenticator</strong>, <strong>Authy</strong>, <strong>Microsoft Authenticator</strong>, or <strong>1Password</strong> on your phone.</li>
                        <li>Click the button below — we'll generate a QR code.</li>
                        <li>Scan it in your authenticator app.</li>
                        <li>Type the 6-digit code your app shows you.</li>
                    </ol>
                    <button onClick={startSetup} disabled={working} className="bg-[#140152] hover:bg-[#1d0175] text-white font-bold px-5 py-2.5 rounded-xl inline-flex items-center gap-2 disabled:opacity-50">
                        {working ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />} Begin setup
                    </button>
                </div>
            )}

            {setupData && (
                <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm mb-5">
                    <h2 className="font-bold text-[#140152] mb-3">Step 1 — scan this QR code</h2>
                    <div className="bg-gray-50 rounded-xl p-5 flex flex-col items-center mb-4">
                        <img src={setupData.qr_png_base64} alt="2FA QR code" className="w-56 h-56 object-contain" />
                        <p className="text-xs text-gray-500 mt-3">If you can't scan, type this secret manually:</p>
                        <div className="mt-1 flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2">
                            <code className="text-xs font-mono text-[#140152]">{setupData.secret}</code>
                            <button onClick={() => navigator.clipboard?.writeText(setupData.secret)} className="p-1 text-gray-400 hover:text-[#140152]"><Copy className="w-3.5 h-3.5" /></button>
                        </div>
                    </div>
                    <h2 className="font-bold text-[#140152] mb-2">Step 2 — verify the code</h2>
                    <input value={code} onChange={e => setCode(e.target.value)} placeholder="6-digit code" inputMode="numeric" maxLength={6}
                        className="w-full border border-gray-200 rounded-lg px-3 py-3 text-xl font-mono text-center tracking-widest" />
                    <div className="mt-3 flex justify-end gap-2">
                        <button onClick={() => setSetupData(null)} className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-bold">Cancel</button>
                        <button onClick={verifyCode} disabled={code.length < 6 || working} className="bg-[#140152] hover:bg-[#1d0175] text-white font-bold px-5 py-2 rounded-lg text-sm inline-flex items-center gap-2 disabled:opacity-50">
                            {working ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Verify &amp; Enable
                        </button>
                    </div>
                </div>
            )}

            {recovery && (
                <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-5 mb-5">
                    <h2 className="font-bold text-amber-900 mb-2">Save these recovery codes</h2>
                    <p className="text-sm text-amber-800 mb-4">If you lose your phone, each of these 8 codes can be used <strong>once</strong> to sign in. Print or store them somewhere safe — we cannot show them again.</p>
                    <div className="grid grid-cols-2 gap-2 mb-3">
                        {recovery.map(c => <code key={c} className="bg-white border border-amber-200 rounded px-3 py-2 text-sm font-mono text-amber-900 text-center">{c}</code>)}
                    </div>
                    <button onClick={() => navigator.clipboard?.writeText(recovery.join('\n'))} className="text-xs font-bold text-amber-900 inline-flex items-center gap-1 hover:underline"><Copy className="w-3.5 h-3.5" /> Copy all to clipboard</button>
                </div>
            )}

            {status?.verified && !recovery && (
                <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                    <h2 className="font-bold text-[#140152] mb-3">Disable 2FA</h2>
                    <p className="text-xs text-gray-500 mb-3">Enter your current 6-digit code to confirm.</p>
                    <input value={code} onChange={e => setCode(e.target.value)} placeholder="6-digit code" inputMode="numeric" maxLength={6}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-3 font-mono text-center tracking-widest" />
                    <button onClick={disable} disabled={code.length < 6 || working} className="text-sm font-bold text-red-600 hover:bg-red-50 px-4 py-2 rounded-lg disabled:opacity-50">Disable 2FA</button>
                </div>
            )}
        </div>
    )
}
