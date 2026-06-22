'use client'
/**
 * Live Caption Operator — admin page.
 *
 * Captures the operator's speech (or a relay mic pointed at the service
 * audio) using the browser's Web Speech API, then streams each finalized
 * line to /api/live/captions where the backend translates it into all
 * supported languages and stores them for /live to display.
 *
 * Use Chrome / Edge — Safari's webkitSpeechRecognition is unreliable, and
 * Firefox doesn't ship the API at all. A clear notice tells the operator
 * if the browser is unsupported.
 */
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import {
    Mic, MicOff, Loader2, AlertCircle, CheckCircle, Radio, Globe2, Trash2, Sparkles,
} from 'lucide-react'
import { liveExpApi, onlineCampusApi, type CurrentService } from '@/lib/api'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

const SOURCE_LANGS = [
    { code: 'en-US', label: 'English (US)' },
    { code: 'en-GB', label: 'English (UK)' },
    { code: 'fr-FR', label: 'Français' },
    { code: 'es-ES', label: 'Español' },
    { code: 'yo-NG', label: 'Yorùbá' },
    { code: 'ig-NG', label: 'Igbo' },
    { code: 'ha-NG', label: 'Hausa' },
]

type RecognitionLike = {
    start: () => void
    stop: () => void
    abort: () => void
    onresult: ((e: any) => void) | null
    onerror: ((e: any) => void) | null
    onend: (() => void) | null
    continuous: boolean
    interimResults: boolean
    lang: string
}

export default function LiveCaptionsAdmin() {
    const [service, setService] = useState<CurrentService | null>(null)
    const [supported, setSupported] = useState<boolean | null>(null)
    const [listening, setListening] = useState(false)
    const [sourceLang, setSourceLang] = useState('en-US')
    const [interim, setInterim] = useState('')
    const [history, setHistory] = useState<{ text: string; sentAt: string; ok: boolean; error?: string }[]>([])
    const [manualText, setManualText] = useState('')
    const [sendingManual, setSendingManual] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [micStatus, setMicStatus] = useState<'unknown' | 'granted' | 'denied' | 'prompt'>('unknown')
    const [diag, setDiag] = useState<{ label: string; ok: boolean; detail: string }[] | null>(null)
    const [running, setRunning] = useState(false)
    const recogRef = useRef<RecognitionLike | null>(null)

    // Probe mic permission state (non-prompting; just reads the saved state).
    useEffect(() => {
        if (typeof navigator === 'undefined' || !navigator.permissions) return
        try {
            (navigator.permissions as any).query({ name: 'microphone' as any })
                .then((res: any) => {
                    setMicStatus(res.state)
                    res.onchange = () => setMicStatus(res.state)
                })
                .catch(() => { /* not supported */ })
        } catch { /* not supported */ }
    }, [])

    const runDiagnostics = async () => {
        setRunning(true)
        const results: { label: string; ok: boolean; detail: string }[] = []

        // 1. Browser support
        const SR: any = (typeof window !== 'undefined') && ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)
        results.push({ label: 'Browser Speech API', ok: !!SR, detail: SR ? 'available' : 'Use Chrome or Edge — Firefox/Safari do not ship this API reliably.' })

        // 2. HTTPS
        const secure = typeof window !== 'undefined' && (window.isSecureContext || location.hostname === 'localhost')
        results.push({ label: 'Secure context (HTTPS)', ok: secure, detail: secure ? location.origin : 'Speech API requires HTTPS — confirm letw.org loads over https://' })

        // 3. Auth token
        const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null
        results.push({ label: 'Admin auth token', ok: !!token, detail: token ? `present (${token.length} chars)` : 'No access_token in localStorage — log in again.' })

        // 4. Live service
        results.push({ label: 'Live service', ok: !!service?.id, detail: service?.id ? `${service.title} (${service.status})` : 'No service. Start one at /admin/online-campus first.' })

        // 5. Try a smoke-test POST to the captions endpoint
        if (service?.id && token) {
            try {
                const r = await fetch(`${API_BASE}/live/captions`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                    body: JSON.stringify({ service_id: service.id, text: '[caption operator smoke test]', language: 'en' }),
                })
                const body = await r.text()
                results.push({ label: 'POST /api/live/captions', ok: r.ok, detail: `HTTP ${r.status} ${r.statusText}${body && body.length < 200 ? ' — ' + body : ''}` })
            } catch (e) {
                results.push({ label: 'POST /api/live/captions', ok: false, detail: (e as Error).message })
            }
        } else {
            results.push({ label: 'POST /api/live/captions', ok: false, detail: 'skipped — needs both a live service and an auth token first' })
        }

        // 6. Mic permission
        results.push({ label: 'Microphone permission', ok: micStatus === 'granted' || micStatus === 'unknown' || micStatus === 'prompt', detail: micStatus })

        setDiag(results)
        setRunning(false)
    }

    // 1. Detect current live service so we have a service_id to push captions to.
    useEffect(() => {
        const load = () => onlineCampusApi.current().then(setService).catch(() => { /* noop */ })
        load()
        const id = setInterval(load, 10_000)
        return () => clearInterval(id)
    }, [])

    // 2. Check Speech Recognition support.
    useEffect(() => {
        const SR = (typeof window !== 'undefined') && ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)
        setSupported(!!SR)
    }, [])

    // 3. Send a finalized caption line to the backend.
    const send = async (text: string) => {
        if (!text.trim() || !service?.id) return
        const lang = sourceLang.split('-')[0]   // 'en-US' -> 'en'
        const startedAt = new Date().toISOString()
        try {
            await liveExpApi.ingestCaption({ service_id: service.id, text: text.trim(), language: lang })
            setHistory(h => [{ text, sentAt: startedAt, ok: true }, ...h].slice(0, 50))
        } catch (e) {
            setHistory(h => [{ text, sentAt: startedAt, ok: false, error: (e as Error).message }, ...h].slice(0, 50))
        }
    }

    // 4. Wire Web Speech API.
    const start = async () => {
        if (!service?.id) { setError('No live service is running. Start a service from /admin/online-campus first.'); return }
        const SR: any = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
        if (!SR) { setError('This browser does not support Speech Recognition. Use Chrome or Edge.'); return }
        // Explicitly request microphone first — on some browsers SpeechRecognition
        // silently fails when the mic hasn't been granted, instead of prompting.
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
            stream.getTracks().forEach(t => t.stop())   // we only needed the prompt; the API holds its own stream
        } catch (e) {
            setError(`Microphone access denied: ${(e as Error).message}. Click the lock icon in your address bar to grant it.`)
            return
        }
        const r: RecognitionLike = new SR()
        r.continuous = true
        r.interimResults = true
        r.lang = sourceLang
        r.onresult = (e: any) => {
            let interimAcc = ''
            for (let i = e.resultIndex; i < e.results.length; i++) {
                const res = e.results[i]
                const txt = res[0]?.transcript || ''
                if (res.isFinal) {
                    send(txt)
                    setInterim('')
                } else {
                    interimAcc += txt
                }
            }
            if (interimAcc) setInterim(interimAcc)
        }
        r.onerror = (e: any) => {
            const msg = e?.error || 'unknown'
            // 'no-speech' fires often during silence; ignore.
            if (msg !== 'no-speech') setError(`Recognition error: ${msg}`)
        }
        r.onend = () => {
            // Auto-restart so a single tap covers an entire service.
            if (listening) {
                try { r.start() } catch { /* noop */ }
            }
        }
        try { r.start(); recogRef.current = r; setListening(true); setError(null) }
        catch (e) { setError((e as Error).message) }
    }

    const stop = () => {
        setListening(false)
        try { recogRef.current?.stop() } catch { /* noop */ }
        recogRef.current = null
        setInterim('')
    }

    const sendManual = async () => {
        const txt = manualText.trim()
        if (!txt) return
        setSendingManual(true)
        await send(txt)
        setManualText('')
        setSendingManual(false)
    }

    return (
        <div className="p-4 sm:p-6 max-w-4xl mx-auto pb-32">
            <div className="flex items-start justify-between flex-wrap gap-4 mb-5">
                <div>
                    <h1 className="text-3xl font-black text-[#140152] flex items-center gap-3"><Mic className="w-7 h-7 text-[#f5bb00]" /> Live Caption Operator</h1>
                    <p className="text-gray-500 mt-1 text-sm">Capture sermon speech and stream multi-lingual captions to <Link href="/live" target="_blank" className="text-[#140152] font-bold hover:underline">letw.org/live</Link>.</p>
                </div>
            </div>

            {/* Status bar */}
            <div className="grid sm:grid-cols-4 gap-3 mb-5">
                <StatusCard label="Live service" value={service?.title || '— no active service —'} sub={service?.status === 'live' ? 'LIVE' : (service?.status || 'idle')} ok={service?.status === 'live'} />
                <StatusCard label="Browser" value={supported === null ? '…' : supported ? 'Speech API ready' : 'Not supported'} ok={!!supported} />
                <StatusCard label="Microphone" value={micStatus === 'unknown' ? '— will prompt —' : micStatus} ok={micStatus !== 'denied'} />
                <StatusCard label="Captions sent" value={String(history.filter(h => h.ok).length)} sub={history.length ? `${history.filter(h => !h.ok).length} failed` : ''} ok={history.every(h => h.ok)} />
            </div>

            {/* No-service helper */}
            {!service?.id && (
                <div className="mb-4 p-4 rounded-xl border bg-amber-50 border-amber-200 text-amber-900 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
                    <div className="text-sm">
                        <p className="font-bold mb-1">No live service is running.</p>
                        <p>Captions are tied to a service so viewers can be matched to the right service. Go to <Link href="/admin/online-campus" className="underline font-bold">Online Campus admin</Link>, set a service to <strong>Live</strong>, then come back here and the Start button will activate.</p>
                    </div>
                </div>
            )}

            {/* Diagnostics drawer */}
            <div className="mb-4">
                <button onClick={runDiagnostics} disabled={running}
                    className="text-xs underline text-gray-600 hover:text-[#140152] disabled:opacity-50">
                    {running ? 'Running diagnostics…' : 'Run end-to-end diagnostics'}
                </button>
                {diag && (
                    <ul className="mt-2 bg-gray-50 border border-gray-200 rounded-xl p-3 space-y-1.5 text-xs">
                        {diag.map((d, i) => (
                            <li key={i} className="flex items-start gap-2">
                                {d.ok ? <CheckCircle className="w-3.5 h-3.5 mt-0.5 text-emerald-600 shrink-0" /> : <AlertCircle className="w-3.5 h-3.5 mt-0.5 text-red-600 shrink-0" />}
                                <span className="font-mono"><strong>{d.label}:</strong> {d.detail}</span>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {error && (
                <div className="mb-4 p-3 rounded-xl border bg-red-50 border-red-200 text-red-800 flex items-start gap-2">
                    <AlertCircle className="w-5 h-5" /><span className="text-sm">{error}</span>
                    <button onClick={() => setError(null)} className="ml-auto text-xs underline">Dismiss</button>
                </div>
            )}

            {/* Controls */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-5">
                <h2 className="font-black text-[#140152] mb-3">1 · Speech-to-caption</h2>
                <p className="text-xs text-gray-500 mb-4">Speak into your mic (or point a mic at the audio source). Each completed sentence is sent to the backend, where it&apos;s translated into all 6 supported languages.</p>

                <div className="flex flex-wrap items-center gap-3">
                    <select value={sourceLang} onChange={e => setSourceLang(e.target.value)} disabled={listening}
                        className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm">
                        {SOURCE_LANGS.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
                    </select>

                    {!listening ? (
                        <button onClick={start} disabled={!service?.id || !supported}
                            className="inline-flex items-center gap-2 bg-[#140152] hover:bg-[#1d0175] disabled:opacity-40 text-white font-bold px-6 py-3 rounded-xl">
                            <Mic className="w-5 h-5" /> Start listening
                        </button>
                    ) : (
                        <button onClick={stop}
                            className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-3 rounded-xl animate-pulse">
                            <MicOff className="w-5 h-5" /> Stop
                        </button>
                    )}

                    {listening && (
                        <span className="text-xs text-emerald-700 inline-flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Listening …
                        </span>
                    )}
                </div>

                {/* Interim transcript */}
                {interim && (
                    <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-600 italic">
                        <span className="text-[10px] uppercase tracking-widest font-bold text-gray-400 block mb-1">Hearing</span>
                        {interim}
                    </div>
                )}
            </div>

            {/* Manual typing fallback */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-5">
                <h2 className="font-black text-[#140152] mb-3">2 · Or type a line</h2>
                <p className="text-xs text-gray-500 mb-3">Useful when the speaker pauses, or as backup if your mic is offline.</p>
                <div className="flex gap-2">
                    <input value={manualText} onChange={e => setManualText(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendManual()}
                        placeholder="Type a caption and press Enter…"
                        className="flex-1 border border-gray-200 rounded-lg px-3 py-2.5 text-sm" />
                    <button onClick={sendManual} disabled={!service?.id || !manualText.trim() || sendingManual}
                        className="inline-flex items-center gap-2 bg-[#f5bb00] hover:bg-amber-400 text-[#140152] font-bold px-5 py-2.5 rounded-lg disabled:opacity-40">
                        {sendingManual ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                        Send line
                    </button>
                </div>
            </div>

            {/* History */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-center justify-between mb-3">
                    <h2 className="font-black text-[#140152]">3 · Recently sent</h2>
                    {history.length > 0 && (
                        <button onClick={() => setHistory([])} className="text-xs text-gray-500 hover:text-red-600 inline-flex items-center gap-1">
                            <Trash2 className="w-3 h-3" /> Clear list
                        </button>
                    )}
                </div>
                {history.length === 0 ? (
                    <p className="text-sm text-gray-400 italic">Nothing sent yet.</p>
                ) : (
                    <ul className="space-y-2 max-h-96 overflow-y-auto">
                        {history.map((h, i) => (
                            <li key={i} className={`p-2.5 rounded-lg border text-sm flex items-start gap-2 ${h.ok ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-red-50 border-red-200 text-red-900'}`}>
                                {h.ok ? <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" /> : <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />}
                                <div className="flex-1 min-w-0">
                                    <p>{h.text}</p>
                                    {h.error && <p className="text-[11px] mt-0.5 opacity-70">{h.error}</p>}
                                </div>
                                <span className="text-[10px] text-gray-400 shrink-0">{new Date(h.sentAt).toLocaleTimeString()}</span>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    )
}

function StatusCard({ label, value, sub, ok }: { label: string; value: string; sub?: string; ok?: boolean }) {
    return (
        <div className={`bg-white rounded-xl border p-4 ${ok ? 'border-emerald-200' : 'border-gray-200'}`}>
            <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold">{label}</p>
            <p className="text-sm font-black text-[#140152] truncate mt-1">{value}</p>
            {sub && <p className={`text-[11px] mt-1 ${ok ? 'text-emerald-700' : 'text-gray-400'}`}>{sub}</p>}
        </div>
    )
}
