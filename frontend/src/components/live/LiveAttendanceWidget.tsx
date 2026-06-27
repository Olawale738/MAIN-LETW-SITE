'use client'
/**
 * Anonymous live-attendance widget for /live.
 *
 * The viewer's browser sends a heartbeat to /api/live-attendance/heartbeat
 * every 15s while the page is visible. The backend tracks an in-memory TTL
 * set keyed on a session id, geolocates via Cloudflare/Vercel edge headers,
 * and returns a snapshot of {total, countries[], continents{}}. No accounts,
 * no IP storage, no analytics — just an honest live count.
 */
import { useEffect, useRef, useState } from 'react'
import { Globe2, Users } from 'lucide-react'
import { liveAttendanceApi, type AttendanceSnapshot } from '@/lib/api'

const STORAGE_KEY = 'letw-live-session-id'
const HEARTBEAT_MS = 15_000

// Country code → flag emoji (works for any ISO alpha-2).
function flag(cc: string): string {
    if (!cc || cc.length !== 2) return '🏳️'
    const A = 0x1f1e6
    const codePoints = cc.toUpperCase().split('').map(c => A + (c.charCodeAt(0) - 65))
    return String.fromCodePoint(...codePoints)
}

export default function LiveAttendanceWidget() {
    const [snap, setSnap] = useState<AttendanceSnapshot | null>(null)
    const sessionRef = useRef<string>('')

    useEffect(() => {
        // Persist a session id locally so refreshes during a service don't
        // inflate the counter.
        try {
            sessionRef.current = localStorage.getItem(STORAGE_KEY) || ''
        } catch { /* private mode — fresh id every tab is fine */ }

        let cancelled = false
        const beat = async () => {
            // Skip heartbeat if the tab is backgrounded — saves the backend
            // churn and reflects real attention.
            if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return
            try {
                const r = await liveAttendanceApi.heartbeat(sessionRef.current || undefined)
                if (cancelled) return
                sessionRef.current = r.session_id
                try { localStorage.setItem(STORAGE_KEY, r.session_id) } catch { /* noop */ }
                setSnap({ total: r.total, countries: r.countries, continents: r.continents })
            } catch { /* network blip — just retry next tick */ }
        }
        beat()
        const id = setInterval(beat, HEARTBEAT_MS)
        return () => { cancelled = true; clearInterval(id) }
    }, [])

    if (!snap) return null

    return (
        <div className="bg-white/5 backdrop-blur border border-white/10 rounded-3xl p-5 max-w-5xl mx-auto">
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="inline-flex items-center gap-2 text-white">
                    <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-300" />
                    </span>
                    <Users className="w-4 h-4 text-[#f5bb00]" />
                    <span className="font-black text-lg">{snap.total.toLocaleString()}</span>
                    <span className="text-white/60 text-sm">watching from</span>
                    <Globe2 className="w-4 h-4 text-[#f5bb00]" />
                    <span className="font-black text-lg">{snap.countries.length.toLocaleString()}</span>
                    <span className="text-white/60 text-sm">countries</span>
                </div>
                <p className="text-[10px] uppercase tracking-[0.3em] text-white/40">anonymous · real-time</p>
            </div>

            {snap.countries.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-1.5">
                    {snap.countries.slice(0, 24).map(c => (
                        <span key={c.code} className="inline-flex items-center gap-1 bg-white/5 border border-white/10 rounded-full px-2.5 py-1 text-xs text-white/80">
                            <span className="text-base leading-none">{flag(c.code)}</span>
                            <span className="font-bold">{c.code}</span>
                            <span className="text-white/40">·</span>
                            <span>{c.count}</span>
                        </span>
                    ))}
                </div>
            )}

            {Object.keys(snap.continents).length > 0 && (
                <div className="mt-3 flex flex-wrap gap-3 text-[10px] uppercase tracking-widest text-white/40">
                    {Object.entries(snap.continents).map(([k, v]) => (
                        <span key={k}><strong className="text-white/70 font-black">{v}</strong> {k}</span>
                    ))}
                </div>
            )}
        </div>
    )
}
