'use client'
/**
 * /admin/integrations — manage the shared secret that lets sharepoints.letw.org
 * fetch completed-couple details to issue the marriage certificate. Set the key
 * here (no server env needed); paste the same value on the sharepoints side.
 */
import { useEffect, useState } from 'react'
import { Loader2, Link2, CheckCircle, AlertCircle, Copy, RefreshCw, Save, Eye, Image as ImageIcon } from 'lucide-react'
import { integrationsApi, theologyApi, type SharepointsTest } from '@/lib/api'

export default function AdminIntegrationsPage() {
    const [status, setStatus] = useState<{ configured: boolean; key_preview: string; lookup_url: string } | null>(null)
    const [keyInput, setKeyInput] = useState('')
    const [revealed, setRevealed] = useState('')   // full key shown once after generate
    const [webhookUrl, setWebhookUrl] = useState('')
    const [officeEmail, setOfficeEmail] = useState('')
    const [bapWebhookUrl, setBapWebhookUrl] = useState('')
    const [bapOfficeEmail, setBapOfficeEmail] = useState('')
    const [sealUrl, setSealUrl] = useState('')
    const [studentUrl, setStudentUrl] = useState('')
    const [lmsBase, setLmsBase] = useState('')
    const [lmsKey, setLmsKey] = useState('')
    const [lmsKeySet, setLmsKeySet] = useState(false)
    const [lmsKeyAlt, setLmsKeyAlt] = useState('')
    const [lmsKeyAltSet, setLmsKeyAltSet] = useState(false)
    const [signSecret, setSignSecret] = useState('')
    const [signSecretSet, setSignSecretSet] = useState(false)
    const [lmsPath, setLmsPath] = useState('')
    const [savingLinks, setSavingLinks] = useState(false)
    const [testingLms, setTestingLms] = useState(false)
    const [lmsTest, setLmsTest] = useState<{ base_url: string; key_set: boolean; verdict: string; summary: string; checks: { label: string; status: number | null; error?: string }[] } | null>(null)
    const [testing, setTesting] = useState(false)
    const [test, setTest] = useState<SharepointsTest | null>(null)
    const [intakeDefault, setIntakeDefault] = useState('')
    const [savingSeal, setSavingSeal] = useState(false)
    const [savingTargets, setSavingTargets] = useState(false)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)

    const refresh = () => integrationsApi.getSettings().then(s => {
        setStatus(s)
        setWebhookUrl(s.sharepoints_webhook_url || ''); setOfficeEmail(s.marriage_office_email || '')
        setBapWebhookUrl(s.baptism_webhook_url || ''); setBapOfficeEmail(s.baptism_office_email || '')
        setSealUrl(s.marriage_seal_url || '')
        setStudentUrl(s.student_webhook_url || ''); setLmsBase(s.lms_base_url || '')
        setLmsPath(s.lms_enrol_path || ''); setLmsKeySet(!!s.lms_key_set); setLmsKeyAltSet(!!s.lms_key_alt_set); setSignSecretSet(!!s.signing_secret_set)
        setIntakeDefault(s.theology_intake_default || '')
    }).catch(() => setStatus(null)).finally(() => setLoading(false))
    useEffect(() => { refresh() }, [])
    useEffect(() => { if (msg) { const t = setTimeout(() => setMsg(null), 6000); return () => clearTimeout(t) } }, [msg])

    const save = async () => {
        if (keyInput.trim().length < 12) { setMsg({ kind: 'err', text: 'Use a longer secret (12+ characters).' }); return }
        setSaving(true)
        try { await integrationsApi.setKey(keyInput.trim()); setRevealed(keyInput.trim()); setKeyInput(''); setMsg({ kind: 'ok', text: 'Saved. Paste the same secret on sharepoints.' }); refresh() }
        catch (e) { setMsg({ kind: 'err', text: (e as Error).message }) }
        finally { setSaving(false) }
    }
    const generate = async () => {
        setSaving(true)
        try { const r = await integrationsApi.generateKey(); setRevealed(r.sharepoints_api_key); setMsg({ kind: 'ok', text: 'New secret generated and saved. Copy it now — it is shown once.' }); refresh() }
        catch (e) { setMsg({ kind: 'err', text: (e as Error).message }) }
        finally { setSaving(false) }
    }
    const copy = (v: string) => navigator.clipboard.writeText(v).then(() => setMsg({ kind: 'ok', text: 'Copied.' })).catch(() => {})
    const saveTargets = async () => {
        setSavingTargets(true)
        try { await integrationsApi.saveTargets({ sharepoints_webhook_url: webhookUrl.trim(), marriage_office_email: officeEmail.trim(), baptism_webhook_url: bapWebhookUrl.trim(), baptism_office_email: bapOfficeEmail.trim() }); setMsg({ kind: 'ok', text: 'Saved. Approved couples & baptisms are now auto-sent on sign-off.' }); refresh() }
        catch (e) { setMsg({ kind: 'err', text: (e as Error).message }) }
        finally { setSavingTargets(false) }
    }
    const saveLinks = async () => {
        setSavingLinks(true)
        try {
            await integrationsApi.saveTheologyAndLms({
                student_webhook_url: studentUrl.trim(),
                lms_base_url: lmsBase.trim(),
                lms_enrol_path: lmsPath.trim(),
                ...(lmsKey.trim() ? { lms_api_key: lmsKey.trim() } : {}),
                ...(lmsKeyAlt.trim() ? { lms_api_key_alt: lmsKeyAlt.trim() } : {}),
                ...(signSecret.trim() ? { integration_signing_secret: signSecret.trim() } : {}),
            })
            setLmsKey(''); setLmsKeyAlt(''); setSignSecret('')
            setMsg({ kind: 'ok', text: 'Saved.' }); refresh()
        } catch (e) { setMsg({ kind: 'err', text: (e as Error).message }) }
        finally { setSavingLinks(false) }
    }
    const runTest = async () => {
        setTesting(true); setTest(null)
        try { setTest(await integrationsApi.testSharepoints()) }
        catch (e) { setTest({ ok: false, reason: (e as Error).message }) }
        finally { setTesting(false) }
    }

    const onSealFile = (file: File) => {
        const reader = new FileReader()
        reader.onload = () => {
            const img = new window.Image()
            img.onload = () => {
                const max = 400
                const scale = Math.min(1, max / Math.max(img.width, img.height))
                const canvas = document.createElement('canvas')
                canvas.width = Math.round(img.width * scale); canvas.height = Math.round(img.height * scale)
                const ctx = canvas.getContext('2d')
                if (ctx) { ctx.drawImage(img, 0, 0, canvas.width, canvas.height); setSealUrl(canvas.toDataURL('image/png')) }
            }
            img.src = reader.result as string
        }
        reader.readAsDataURL(file)
    }
    const saveSeal = async () => {
        setSavingSeal(true)
        try { await integrationsApi.saveSeal(sealUrl); setMsg({ kind: 'ok', text: 'Church seal saved — it will print on new certificates.' }); refresh() }
        catch (e) { setMsg({ kind: 'err', text: (e as Error).message }) }
        finally { setSavingSeal(false) }
    }

    return (
        <div className="p-4 sm:p-6 max-w-3xl mx-auto pb-32">
            <h1 className="text-3xl font-black text-[#140152] flex items-center gap-3 mb-1"><Link2 className="w-7 h-7 text-[#f5bb00]" /> Partner Integrations</h1>
            <p className="text-gray-500 text-sm mb-4">Connect sharepoints.letw.org so it can issue the marriage certificate from a couple&apos;s training certificate number.</p>

            {status && (
                <div className={`mb-4 p-3 rounded-xl border flex items-center gap-2 text-sm ${status.configured ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-amber-50 border-amber-200 text-amber-900'}`}>
                    {status.configured ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                    {status.configured ? `Connected — shared secret is set (${status.key_preview}).` : 'Not connected yet — set a shared secret below.'}
                </div>
            )}
            {msg && <div className={`mb-4 p-3 rounded-xl border flex items-start gap-2 text-sm ${msg.kind === 'ok' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>{msg.kind === 'ok' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}<span>{msg.text}</span></div>}

            {loading ? <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-[#140152]" /></div> : (
                <div className="space-y-4">
                    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5">
                        <h2 className="font-black text-[#140152] mb-1">Shared secret</h2>
                        <p className="text-xs text-gray-500 mb-3">This secret proves a request really comes from sharepoints. Generate one (recommended) or type your own, then set the <strong>same value</strong> on the sharepoints side.</p>

                        {revealed && (
                            <div className="mb-3 bg-[#140152] text-white rounded-xl p-3">
                                <p className="text-[10px] uppercase tracking-widest text-[#f5bb00] font-black mb-1">Your secret (shown once — copy it now)</p>
                                <div className="flex items-center gap-2">
                                    <code className="flex-1 break-all text-xs font-mono bg-white/10 rounded px-2 py-1.5">{revealed}</code>
                                    <button onClick={() => copy(revealed)} className="shrink-0 inline-flex items-center gap-1 bg-[#f5bb00] text-[#140152] font-bold px-3 py-1.5 rounded-lg text-xs"><Copy className="w-3.5 h-3.5" /> Copy</button>
                                </div>
                            </div>
                        )}

                        <div className="flex flex-wrap items-center gap-2">
                            <input value={keyInput} onChange={e => setKeyInput(e.target.value)} placeholder="Paste or type a secret (12+ chars)" className="flex-1 min-w-[220px] border border-gray-200 rounded-lg px-3 py-2.5 text-sm font-mono" />
                            <button onClick={save} disabled={saving || !keyInput.trim()} className="inline-flex items-center gap-2 bg-[#140152] hover:bg-[#1d0175] text-white font-bold px-4 py-2.5 rounded-lg text-sm disabled:opacity-50">
                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save
                            </button>
                            <button onClick={generate} disabled={saving} className="inline-flex items-center gap-2 bg-[#f5bb00] hover:bg-amber-400 text-[#140152] font-bold px-4 py-2.5 rounded-lg text-sm disabled:opacity-50">
                                <RefreshCw className="w-4 h-4" /> Generate
                            </button>
                        </div>
                    </div>

                    {/* Auto-send on approval */}
                    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5">
                        <h2 className="font-black text-[#140152] mb-1">Auto-send on approval</h2>
                        <p className="text-xs text-gray-500 mb-3">When a pastor signs off a couple or a baptism, letw.org immediately hands the record to sharepoints — a webhook push and/or an email to your certificate office with a one-click generate link. Leave a field blank to skip that channel.</p>
                        <div className="space-y-4">
                            <div className="space-y-3">
                                <p className="text-[11px] font-black uppercase tracking-widest text-[#140152]">Marriage certificate</p>
                                <div>
                                    <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">Sharepoints webhook URL (optional)</label>
                                    <input value={webhookUrl} onChange={e => setWebhookUrl(e.target.value)} placeholder="https://sharepoints.letw.org/api/letw-marriage/incoming" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">Marriage-certificate office email (optional)</label>
                                    <input type="email" value={officeEmail} onChange={e => setOfficeEmail(e.target.value)} placeholder="marriage@letw.org" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                                </div>
                            </div>
                            <div className="space-y-3 pt-3 border-t border-gray-100">
                                <p className="text-[11px] font-black uppercase tracking-widest text-[#140152]">Baptism certificate</p>
                                <div>
                                    <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">Sharepoints webhook URL (optional)</label>
                                    <input value={bapWebhookUrl} onChange={e => setBapWebhookUrl(e.target.value)} placeholder="https://sharepoints.letw.org/api/letw-baptism/incoming" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">Baptism-certificate office email (optional)</label>
                                    <input type="email" value={bapOfficeEmail} onChange={e => setBapOfficeEmail(e.target.value)} placeholder="baptism@letw.org" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                                </div>
                            </div>
                            <button onClick={saveTargets} disabled={savingTargets} className="inline-flex items-center gap-2 bg-[#140152] hover:bg-[#1d0175] text-white font-bold px-4 py-2.5 rounded-lg text-sm disabled:opacity-50">
                                {savingTargets ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save auto-send
                            </button>
                        </div>
                    </div>

                    {/* Church seal — printed on the certificates */}
                    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5">
                        <h2 className="font-black text-[#140152] mb-1">Church seal</h2>
                        <p className="text-xs text-gray-500 mb-3">Upload the official church seal (PNG with transparency looks best). It prints on the marriage certificate — on letw.org and on sharepoints via the handshake. Leave blank for the default gold seal.</p>
                        <div className="flex items-center gap-3">
                            {sealUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={sealUrl} alt="" className="h-16 w-16 object-contain rounded border border-gray-200 bg-gray-50 p-1" />
                            ) : (
                                <div className="h-16 w-16 rounded-full border-[3px] border-[#b8860b] flex items-center justify-center text-[9px] font-black text-[#b8860b] text-center" style={{ background: 'radial-gradient(circle,#fff8e6,#f7e9c0)' }}>LETW<br />SEAL</div>
                            )}
                            <div className="flex flex-col gap-2">
                                <label className="inline-flex items-center gap-1.5 cursor-pointer bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold px-3 py-2 rounded-lg text-xs w-fit">
                                    <ImageIcon className="w-4 h-4" /> {sealUrl ? 'Change seal' : 'Upload seal'}
                                    <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && onSealFile(e.target.files[0])} />
                                </label>
                                <div className="flex items-center gap-2">
                                    {sealUrl && <button onClick={() => setSealUrl('')} className="text-xs text-red-500 font-semibold">Reset to default</button>}
                                    <button onClick={saveSeal} disabled={savingSeal} className="inline-flex items-center gap-2 bg-[#140152] hover:bg-[#1d0175] text-white font-bold px-4 py-2 rounded-lg text-xs disabled:opacity-50">
                                        {savingSeal ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save seal
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Connection status */}
                    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5">
                        <div className="flex items-center justify-between gap-2 mb-1">
                            <h2 className="font-black text-[#140152]">Connection status</h2>
                            <button onClick={runTest} disabled={testing} className="inline-flex items-center gap-2 bg-[#140152] text-white font-bold px-3 py-1.5 rounded-lg text-xs disabled:opacity-50">
                                {testing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />} Test connection
                            </button>
                        </div>
                        <p className="text-xs text-gray-500">Asks sharepoints what it can do, using your shared secret.</p>
                        {test && (test.ok ? (
                            <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                                <p className="text-sm font-bold text-emerald-800 flex items-center gap-1.5"><CheckCircle className="w-4 h-4" /> Connected to {test.service}</p>
                                {!!test.capabilities?.length && (
                                    <ul className="mt-2 grid sm:grid-cols-2 gap-x-4 gap-y-1">
                                        {test.capabilities.map(c => (
                                            <li key={c} className="text-xs text-emerald-900 flex items-center gap-1.5">
                                                <CheckCircle className="w-3 h-3 shrink-0" /> {c.replace(/([A-Z])/g, ' $1')}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        ) : (
                            <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800 flex items-start gap-2">
                                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /><span>{test.reason}</span>
                            </div>
                        ))}
                    </div>

                    {/* Theology School + classroom */}
                    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5">
                        <h2 className="font-black text-[#140152] mb-1">Theology School</h2>
                        <p className="text-xs text-gray-500 mb-3">Where paid applications go for the official offer, admission letter and student ID. The classroom is separate and only runs lessons.</p>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">Sharepoints student intake URL</label>
                                <input value={studentUrl} onChange={e => setStudentUrl(e.target.value)} placeholder={intakeDefault} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono" />
                                {intakeDefault && !studentUrl && (
                                    <button onClick={() => setStudentUrl(intakeDefault)} className="mt-1 text-[11px] font-bold text-[#140152] underline">Use the standard URL</button>
                                )}
                            </div>
                            <div className="pt-3 border-t border-gray-100">
                                <p className="text-[11px] font-black uppercase tracking-widest text-[#140152] mb-2">Classroom (live.letw.org)</p>
                                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">
                                    LMS API key {lmsKeySet && <span className="text-emerald-600 normal-case tracking-normal">saved</span>}
                                </label>
                                <input value={lmsKey} onChange={e => setLmsKey(e.target.value)} type="password" placeholder={lmsKeySet ? 'leave blank to keep the saved key' : 'paste the classroom key'} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono" />
                                <p className="text-[11px] text-gray-400 mt-1">The classroom uses this to pull admitted students and to sign students in.</p>
                                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1 mt-3">
                                    Second accepted key {lmsKeyAltSet && <span className="text-emerald-600 normal-case tracking-normal">saved</span>}
                                </label>
                                <input value={lmsKeyAlt} onChange={e => setLmsKeyAlt(e.target.value)} type="password"
                                    placeholder={lmsKeyAltSet ? 'leave blank to keep the saved key' : 'optional — a second key the classroom may send'}
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono" />
                                <p className="text-[11px] text-gray-400 mt-1">
                                    Both keys are accepted on anything the classroom sends us, so it does not matter which
                                    of the two their system uses. It also lets you rotate without downtime: add the new key
                                    here, let them switch over, then clear this field.
                                </p>
                                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1 mt-3">
                                    SharePoints signing secret {signSecretSet && <span className="text-emerald-600 normal-case tracking-normal">saved</span>}
                                </label>
                                <input value={signSecret} onChange={e => setSignSecret(e.target.value)} type="password"
                                    placeholder={signSecretSet ? 'leave blank to keep the saved secret' : 'optional — agree this with the SharePoints developer'}
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono" />
                                <p className="text-[11px] text-gray-400 mt-1">
                                    Signs every message to and from SharePoints, on top of the shared key. Leave blank
                                    until both sides hold the same value — set it on one side only and their calls to us
                                    start failing. It is separate from the API key on purpose: a leaked key should not
                                    also forge signatures.
                                </p>

                                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1 mt-3">Classroom base URL (optional)</label>
                                <input value={lmsBase} onChange={e => setLmsBase(e.target.value)} placeholder="https://live.letw.org" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono" />
                                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1 mt-3">Push enrolment path (optional)</label>
                                <input value={lmsPath} onChange={e => setLmsPath(e.target.value)} placeholder="leave blank — the classroom pulls from us" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono" />
                            </div>
                            <button onClick={async () => {
                                setTestingLms(true); setLmsTest(null)
                                try { setLmsTest(await theologyApi.testClassroom()) }
                                catch (e) { setLmsTest({ verdict: 'error', summary: (e as Error).message, base_url: '', key_set: false, checks: [] }) }
                                finally { setTestingLms(false) }
                            }} disabled={testingLms}
                                className="inline-flex items-center gap-2 border border-gray-300 text-[#140152] font-bold px-4 py-2.5 rounded-lg text-sm disabled:opacity-50 mr-2">
                                {testingLms ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />} Test classroom
                            </button>
                            {lmsTest && (
                                <div className={`mt-3 mb-3 rounded-xl border p-3 text-xs ${lmsTest.verdict === 'ok' ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-amber-50 border-amber-300 text-amber-900'}`}>
                                    <p className="font-bold">{lmsTest.summary}</p>
                                    {lmsTest.checks?.length > 0 && (
                                        <ul className="mt-2 space-y-0.5 font-mono text-[11px] opacity-80">
                                            {lmsTest.checks.map(c => (
                                                <li key={c.label}>{c.label}: {c.status ?? c.error}</li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            )}
                            <button onClick={saveLinks} disabled={savingLinks} className="inline-flex items-center gap-2 bg-[#140152] hover:bg-[#1d0175] text-white font-bold px-4 py-2.5 rounded-lg text-sm disabled:opacity-50">
                                {savingLinks ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save school and classroom
                            </button>
                        </div>
                    </div>

                    {/* How sharepoints uses it */}
                    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5">
                        <h2 className="font-black text-[#140152] mb-2 inline-flex items-center gap-2"><Eye className="w-4 h-4 text-[#f5bb00]" /> How sharepoints connects</h2>
                        <p className="text-xs text-gray-600 mb-3">On sharepoints (Vercel), store the same secret as an environment variable (e.g. <code className="bg-gray-100 px-1 rounded">LETW_API_KEY</code>) and call this endpoint with it:</p>
                        <pre className="bg-gray-900 text-gray-100 text-[11px] rounded-xl p-3 overflow-x-auto"><code>{`GET ${status?.lookup_url || 'https://letw-backend.onrender.com/api/integrations/marriage/couple'}?cert_no=LETW-MP-XXXXXXXX
Header:  X-API-Key: <the shared secret>

→ { training_verified, partner_a_name, partner_b_name,
    intended_wedding_date, completed_at, pastor_signature, ... }`}</code></pre>
                        <p className="text-[11px] text-gray-400 mt-2">Keep the secret server-side on sharepoints (in an API route / server action), never in browser code.</p>
                    </div>
                </div>
            )}
        </div>
    )
}
