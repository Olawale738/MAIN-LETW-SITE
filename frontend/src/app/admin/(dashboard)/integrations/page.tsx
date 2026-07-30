'use client'
/**
 * /admin/integrations — manage the shared secret that lets sharepoints.letw.org
 * fetch completed-couple details to issue the marriage certificate. Set the key
 * here (no server env needed); paste the same value on the sharepoints side.
 */
import { useEffect, useState } from 'react'
import { Loader2, Link2, CheckCircle, AlertCircle, Copy, RefreshCw, Save, Eye } from 'lucide-react'
import { integrationsApi } from '@/lib/api'

export default function AdminIntegrationsPage() {
    const [status, setStatus] = useState<{ configured: boolean; key_preview: string; lookup_url: string } | null>(null)
    const [keyInput, setKeyInput] = useState('')
    const [revealed, setRevealed] = useState('')   // full key shown once after generate
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)

    const refresh = () => integrationsApi.getSettings().then(setStatus).catch(() => setStatus(null)).finally(() => setLoading(false))
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
