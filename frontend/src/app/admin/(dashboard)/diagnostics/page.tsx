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
        <DiagnosticsView
            status={status} latency={latency} body={body} errMsg={errMsg}
            history={history} onPing={() => ping()} onCopy={copyUrl}
        />
    )
}

interface DiagnosticsViewProps {
    status: Status
    latency: number | null
    body: string
    errMsg: string
    history: Array<{ at: string; ok: boolean; ms: number | null; msg?: string }>
    onPing: () => void
    onCopy: () => void
}

function DiagnosticsView({ status, latency, body, errMsg, history, onPing, onCopy }: DiagnosticsViewProps) {
    // ─── Endpoint probe ──────────────────────────────────────────────────
    // Lets admin test a specific failing endpoint (defaults to run-tick) so
    // they can see exactly what the server returns: status code, body, CORS
    // headers, and whether the auth token was actually attached.
    const [probePath, setProbePath] = useState('/api/welcome-flow/run-tick')
    const [probeMethod, setProbeMethod] = useState<'GET' | 'POST'>('POST')
    const [probing, setProbing] = useState(false)
    const [probeResult, setProbeResult] = useState<null | {
        url: string; method: string;
        status: number | null; statusText: string;
        elapsedMs: number; bodyText: string; corsOrigin: string | null;
        authAttached: boolean; error?: string;
    }>(null)

    const runProbe = async () => {
        setProbing(true); setProbeResult(null)
        const url = `${API_BASE.replace(/\/api\/?$/, '')}${probePath.startsWith('/') ? '' : '/'}${probePath}`
        const token = typeof localStorage !== 'undefined' ? localStorage.getItem('access_token') : null
        const start = performance.now()
        try {
            const res = await fetch(url, {
                method: probeMethod,
                headers: token ? { 'Authorization': `Bearer ${token}` } : {},
                cache: 'no-store',
            })
            const text = await res.text().catch(() => '')
            setProbeResult({
                url, method: probeMethod,
                status: res.status, statusText: res.statusText,
                elapsedMs: Math.round(performance.now() - start),
                bodyText: text.slice(0, 2000),
                corsOrigin: res.headers.get('access-control-allow-origin'),
                authAttached: !!token,
            })
        } catch (e) {
            setProbeResult({
                url, method: probeMethod,
                status: null, statusText: 'fetch threw',
                elapsedMs: Math.round(performance.now() - start),
                bodyText: '', corsOrigin: null,
                authAttached: !!token,
                error: (e as Error).message,
            })
        } finally {
            setProbing(false)
        }
    }

    const verdict = (() => {
        if (!probeResult) return null
        if (probeResult.error) {
            return { kind: 'cors-or-network', msg: "Browser blocked the request before any response — likely a CORS preflight failure or the server isn't reachable." }
        }
        if (probeResult.status === 401) return { kind: 'auth', msg: 'Backend rejected the request (401). Your admin token is missing or expired — sign out and back in.' }
        if (probeResult.status === 403) return { kind: 'auth', msg: 'Signed in but not authorized (403). Make sure your user has the admin role.' }
        if (probeResult.status === 404) return { kind: 'route', msg: 'Backend says the route does not exist (404). Render may be running an older deploy — trigger a manual redeploy.' }
        if (probeResult.status === 405) return { kind: 'method', msg: `Backend rejected the HTTP method (405). Tried ${probeResult.method}; try the other method.` }
        if (probeResult.status === 500) return { kind: 'crash', msg: 'Backend exception (500). Check Render logs for the traceback.' }
        if (probeResult.status === 503) return { kind: 'down', msg: 'Service unavailable (503) — Render is starting up. Try once more in 30s.' }
        if (probeResult.status && probeResult.status >= 200 && probeResult.status < 300) return { kind: 'ok', msg: 'Endpoint is healthy — the original error has been resolved or was transient.' }
        return { kind: 'other', msg: `Non-success response (${probeResult.status})` }
    })()

    return (
        <DiagnosticsLayout
            status={status} latency={latency} body={body} errMsg={errMsg}
            history={history} onPing={onPing} onCopy={onCopy}
        >
            <div className="bg-white border border-gray-100 rounded-2xl p-5 mb-5">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 mb-3">Probe a specific endpoint</p>
                <p className="text-xs text-gray-500 mb-3">Replays the request that&apos;s failing with whatever auth token you currently have, and shows the raw server response.</p>
                <div className="flex gap-2 flex-wrap items-end">
                    <div className="flex-1 min-w-[260px]">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block mb-1">Path</label>
                        <input value={probePath} onChange={e => setProbePath(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono" />
                    </div>
                    <div>
                        <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block mb-1">Method</label>
                        <select value={probeMethod} onChange={e => setProbeMethod(e.target.value as 'GET' | 'POST')}
                            className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white">
                            <option>POST</option>
                            <option>GET</option>
                        </select>
                    </div>
                    <button onClick={runProbe} disabled={probing} className="bg-[#140152] hover:bg-[#1d0175] text-white font-bold px-4 py-2 rounded-lg text-sm disabled:opacity-50">
                        {probing ? <Loader2 className="w-4 h-4 animate-spin inline" /> : 'Run probe'}
                    </button>
                </div>

                {probeResult && (
                    <div className="mt-4 space-y-3">
                        {verdict && (
                            <div className={`p-3 rounded-xl border flex items-start gap-2 text-sm ${verdict.kind === 'ok' ? 'bg-green-50 border-green-200 text-green-900' : verdict.kind === 'auth' ? 'bg-amber-50 border-amber-200 text-amber-900' : 'bg-red-50 border-red-200 text-red-900'}`}>
                                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-black">Verdict: {verdict.kind}</p>
                                    <p className="text-xs mt-1">{verdict.msg}</p>
                                </div>
                            </div>
                        )}
                        <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 text-xs font-mono space-y-1">
                            <p><span className="text-gray-400">URL</span> {probeResult.url}</p>
                            <p><span className="text-gray-400">Method</span> {probeResult.method}</p>
                            <p><span className="text-gray-400">Status</span> {probeResult.status ?? '(no response)'} {probeResult.statusText}</p>
                            <p><span className="text-gray-400">Elapsed</span> {probeResult.elapsedMs}ms</p>
                            <p><span className="text-gray-400">Auth attached</span> {probeResult.authAttached ? 'yes — Bearer token from localStorage' : 'NO — no access_token in localStorage'}</p>
                            <p><span className="text-gray-400">CORS allow-origin</span> {probeResult.corsOrigin || '(missing)'}</p>
                            {probeResult.error && <p className="text-red-600"><span className="text-gray-400">Fetch error</span> {probeResult.error}</p>}
                        </div>
                        {probeResult.bodyText && (
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">Response body</p>
                                <pre className="text-[11px] bg-gray-50 border border-gray-100 rounded-lg p-3 overflow-x-auto font-mono text-gray-700 max-h-60">{probeResult.bodyText}</pre>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </DiagnosticsLayout>
    )
}

function DiagnosticsLayout({ status, latency, body, errMsg, history, onPing, onCopy, children }: DiagnosticsViewProps & { children?: React.ReactNode }) {

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
                    <button onClick={onPing} disabled={status === 'pinging'}
                        className="bg-[#140152] hover:bg-[#1d0175] text-white font-bold px-5 py-3 rounded-xl text-sm disabled:opacity-50">
                        {status === 'pinging' ? <Loader2 className="w-4 h-4 inline animate-spin" /> : 'Ping again'}
                    </button>
                </div>
            </div>

            {children}

            {/* What the frontend is configured with */}
            <div className="bg-white border border-gray-100 rounded-2xl p-5 mb-5">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 mb-3">What the frontend calls</p>
                <div className="space-y-2 text-sm">
                    <Row label="NEXT_PUBLIC_API_URL" value={API_BASE || '(empty — defaulting to localhost!)'} mono />
                    <Row label="Health endpoint" value={HEALTH_URL} mono onCopy={onCopy} />
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
