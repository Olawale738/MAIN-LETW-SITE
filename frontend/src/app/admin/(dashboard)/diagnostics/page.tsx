'use client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Activity, ExternalLink, Globe, CheckCircle, AlertTriangle, Loader2, Server, Clock, Copy } from 'lucide-react'

/**
 * Live status of the frontend ↔ backend wiring.
 *
 * Pings the backend /health endpoint and shows the API URL the frontend is
 * actually configured to call. Designed so admins can self-diagnose
 * "Couldn't reach the server" errors without us:
 *   - If /health returns 200 → backend is awake & reachable. Errors are
 *     probably auth / endpoint-specific.
 *   - If /health takes >5s → cold start in progress.
 *   - If /health times out / errors → the Render service is asleep,
 *     crashed, or NEXT_PUBLIC_API_URL is wrong.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || ''
const HEALTH_URL = `${API_BASE.replace(/\/api\/?$/, '')}/health`

type Status = 'idle' | 'pinging' | 'ok' | 'error'

export default function DiagnosticsPage() {
    const [status, setStatus] = useState<Status>('idle')
    const [latency, setLatency] = useState<number | null>(null)
    const [body, setBody] = useState<string>('')
    const [errMsg, setErrMsg] = useState<string>('')
    const [history, setHistory] = useState<Array<{ at: string; ok: boolean; ms: number | null; msg?: string }>>([])
    const lastRunRef = useRef<number>(0)

    const ping = async (silent = false) => {
        if (!silent) setStatus('pinging')
        const start = performance.now()
        try {
            const ctl = new AbortController()
            const t = setTimeout(() => ctl.abort(), 60_000)
            const res = await fetch(HEALTH_URL, { signal: ctl.signal, cache: 'no-store' })
            clearTimeout(t)
            const ms = Math.round(performance.now() - start)
            const text = await res.text()
            if (res.ok) {
                setStatus('ok'); setLatency(ms); setBody(text); setErrMsg('')
                setHistory(h => [{ at: new Date().toISOString(), ok: true, ms }, ...h].slice(0, 10))
            } else {
                setStatus('error'); setLatency(ms); setBody(text); setErrMsg(`HTTP ${res.status}`)
                setHistory(h => [{ at: new Date().toISOString(), ok: false, ms, msg: `HTTP ${res.status}` }, ...h].slice(0, 10))
            }
        } catch (e) {
            const ms = Math.round(performance.now() - start)
            setStatus('error'); setLatency(ms); setBody('')
            const msg = (e as Error).message
            setErrMsg(msg)
            setHistory(h => [{ at: new Date().toISOString(), ok: false, ms, msg }, ...h].slice(0, 10))
        }
    }

    useEffect(() => {
        if (Date.now() - lastRunRef.current < 1000) return
        lastRunRef.current = Date.now()
        ping()
    }, [])

    const copyUrl = () => {
        try { navigator.clipboard.writeText(HEALTH_URL) } catch { /* noop */ }
    }

    return (
        <div className="p-4 sm:p-6 max-w-5xl mx-auto pb-20">
            <div className="mb-6">
                <h1 className="text-3xl font-black text-[#140152] flex items-center gap-3"><Activity className="w-7 h-7 text-[#f5bb00]" /> Backend Diagnostics</h1>
                <p className="text-gray-500 mt-1 text-sm">If an admin page is saying <span className="font-mono bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded">Couldn&apos;t reach the server</span>, run a ping here first.</p>
            </div>

            {/* Status big card */}
            <div className={`rounded-3xl p-6 border-2 mb-5 transition-colors ${status === 'ok' ? 'bg-green-50 border-green-200' : status === 'error' ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'}`}>
                <div className="flex items-start gap-4 flex-wrap">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white ${status === 'ok' ? 'bg-green-500' : status === 'error' ? 'bg-red-500' : 'bg-gray-400'}`}>
                        {status === 'pinging' ? <Loader2 className="w-7 h-7 animate-spin" /> :
                            status === 'ok' ? <CheckCircle className="w-7 h-7" /> :
                                status === 'error' ? <AlertTriangle className="w-7 h-7" /> :
                                    <Server className="w-7 h-7" />}
                    </div>
                    <div className="flex-1 min-w-[200px]">
                        <p className="font-black text-lg text-[#140152]">
                            {status === 'pinging' ? 'Pinging backend…' :
                                status === 'ok' ? 'Backend is reachable' :
                                    status === 'error' ? 'Backend not reachable' : 'Ready'}
                        </p>
                        <p className="text-sm text-gray-600 mt-0.5">
                            {status === 'pinging' && 'Render free-tier wake-up can take up to 60 seconds.'}
                            {status === 'ok' && latency !== null && (
                                <>Round-trip {latency}ms — {latency < 600 ? 'warm' : latency < 5000 ? 'cooling' : 'cold start (just woke up)'}.</>
                            )}
                            {status === 'error' && (
                                <>Could not reach the server. Likely causes: (1) Render service is asleep and didn&apos;t wake in 60s, (2) Render service has crashed, (3) NEXT_PUBLIC_API_URL is wrong, (4) CORS blocked.</>
                            )}
                        </p>
                        {errMsg && <p className="text-xs text-red-700 mt-2 font-mono break-all">{errMsg}</p>}
                    </div>
                    <button onClick={() => ping()} disabled={status === 'pinging'}
                        className="bg-[#140152] hover:bg-[#1d0175] text-white font-bold px-5 py-3 rounded-xl text-sm disabled:opacity-50">
                        {status === 'pinging' ? <Loader2 className="w-4 h-4 inline animate-spin" /> : 'Ping again'}
                    </button>
                </div>
            </div>

            {/* What the frontend is configured with */}
            <div className="bg-white border border-gray-100 rounded-2xl p-5 mb-5">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 mb-3">What the frontend calls</p>
                <div className="space-y-2 text-sm">
                    <Row label="NEXT_PUBLIC_API_URL" value={API_BASE || '(empty — defaulting to localhost!)'} mono />
                    <Row label="Health endpoint" value={HEALTH_URL} mono onCopy={copyUrl} />
                    <Row label="Frontend origin" value={typeof window !== 'undefined' ? window.location.origin : '(server-rendered)'} mono />
                </div>
                {!API_BASE && (
                    <div className="mt-3 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800">
                        <p className="font-bold">NEXT_PUBLIC_API_URL is empty.</p>
                        <p className="mt-1">Open Vercel → project → Settings → Environment Variables and set <span className="font-mono">NEXT_PUBLIC_API_URL=https://letw-backend.onrender.com/api</span>, then redeploy.</p>
                    </div>
                )}
            </div>

            {/* Ping history */}
            <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden mb-5">
                <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
                    <p className="font-bold text-[#140152] flex items-center gap-2"><Clock className="w-4 h-4" /> Recent pings (last 10)</p>
                </div>
                {history.length === 0 ? (
                    <p className="px-5 py-8 text-center text-gray-400 text-sm">No pings yet.</p>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {history.map((h, i) => (
                            <div key={i} className="px-5 py-2.5 flex items-center gap-3 text-sm">
                                {h.ok ? <CheckCircle className="w-4 h-4 text-green-500" /> : <AlertTriangle className="w-4 h-4 text-red-500" />}
                                <span className="text-gray-500 font-mono text-xs">{new Date(h.at).toLocaleTimeString()}</span>
                                <span className="flex-1 font-bold text-[#140152]">{h.ok ? `${h.ms}ms` : (h.msg || 'failed')}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Healthy response body */}
            {body && status === 'ok' && (
                <div className="bg-white border border-gray-100 rounded-2xl p-5 mb-5">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 mb-2">Health response</p>
                    <pre className="text-[11px] bg-gray-50 border border-gray-100 rounded-lg p-3 overflow-x-auto font-mono text-gray-700">{body}</pre>
                </div>
            )}

            {/* What to do next */}
            <div className="bg-purple-50 border border-purple-200 rounded-2xl p-5 text-sm text-purple-900">
                <p className="font-black mb-2">If pings keep failing</p>
                <ol className="list-decimal pl-5 space-y-1.5 leading-relaxed">
                    <li>Open the Render dashboard — confirm the backend service is <strong>Live</strong>, not <em>Failed</em> or <em>Sleeping (cannot wake)</em>.</li>
                    <li>If the service is sleeping, click <strong>Manual Deploy → Deploy latest commit</strong> to force-wake.</li>
                    <li>If the latest deploy failed, check the build logs — recent backend changes (decisions, intercessor, online-campus, cms list) may need a redeploy.</li>
                    <li>Verify <strong>NEXT_PUBLIC_API_URL</strong> in Vercel matches the Render service URL with <span className="font-mono">/api</span> suffix.</li>
                    <li>If CORS is the issue, the Render backend should already include <span className="font-mono">letw.org</span> as an allowed origin.</li>
                </ol>
                <div className="mt-4 flex gap-2 flex-wrap">
                    <a href="https://dashboard.render.com" target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 bg-white border border-purple-300 hover:bg-purple-100 text-purple-900 font-bold px-4 py-2 rounded-lg text-xs">
                        <Globe className="w-3.5 h-3.5" /> Open Render dashboard <ExternalLink className="w-3 h-3" />
                    </a>
                    <a href="https://vercel.com/dashboard" target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 bg-white border border-purple-300 hover:bg-purple-100 text-purple-900 font-bold px-4 py-2 rounded-lg text-xs">
                        <Globe className="w-3.5 h-3.5" /> Open Vercel dashboard <ExternalLink className="w-3 h-3" />
                    </a>
                </div>
            </div>
        </div>
    )
}

function Row({ label, value, mono, onCopy }: { label: string; value: string; mono?: boolean; onCopy?: () => void }) {
    return (
        <div className="flex items-start justify-between gap-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 pt-0.5 flex-shrink-0 w-40">{label}</p>
            <p className={`flex-1 break-all text-right text-[#140152] ${mono ? 'font-mono text-xs' : ''}`}>{value}</p>
            {onCopy && <button onClick={onCopy} className="text-gray-400 hover:text-[#140152] p-1" title="Copy"><Copy className="w-3.5 h-3.5" /></button>}
        </div>
    )
}
