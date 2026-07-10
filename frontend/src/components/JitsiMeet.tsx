'use client'
/**
 * JitsiMeet — embeds a Jitsi video call via the External API.
 *
 * The room name is the caller's responsibility; for marriage prep we derive
 * it deterministically from the couple's UUID so both the couple and their
 * pastor land in the same room without any signalling server of our own.
 * The UUID is unguessable, so knowing the room is the access credential —
 * the same capability-link model the rest of marriage prep already uses.
 *
 * Loads meet.jit.si's external_api.js once (cached across mounts) and disposes
 * the meeting on unmount so navigating away actually leaves the call.
 */
import { useEffect, useRef, useState } from 'react'
import { Loader2, AlertCircle } from 'lucide-react'

// The external API attaches this constructor to window at runtime.
declare global {
    interface Window {
        JitsiMeetExternalAPI?: new (domain: string, options: Record<string, unknown>) => { dispose: () => void; on: (evt: string, cb: (...a: unknown[]) => void) => void }
    }
}

let scriptPromise: Promise<void> | null = null

function loadJitsiScript(domain: string): Promise<void> {
    if (typeof window !== 'undefined' && window.JitsiMeetExternalAPI) return Promise.resolve()
    if (scriptPromise) return scriptPromise
    scriptPromise = new Promise<void>((resolve, reject) => {
        const s = document.createElement('script')
        s.src = `https://${domain}/external_api.js`
        s.async = true
        s.onload = () => resolve()
        s.onerror = () => { scriptPromise = null; reject(new Error('Could not load the video call library.')) }
        document.body.appendChild(s)
    })
    return scriptPromise
}

export default function JitsiMeet({
    room,
    displayName,
    subject,
    domain = 'meet.jit.si',
    onClose,
}: {
    room: string
    displayName?: string
    subject?: string
    domain?: string
    onClose?: () => void
}) {
    const containerRef = useRef<HTMLDivElement>(null)
    const apiRef = useRef<{ dispose: () => void; on: (evt: string, cb: (...a: unknown[]) => void) => void } | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        let cancelled = false
        loadJitsiScript(domain)
            .then(() => {
                if (cancelled || !containerRef.current || !window.JitsiMeetExternalAPI) return
                const api = new window.JitsiMeetExternalAPI(domain, {
                    roomName: room,
                    parentNode: containerRef.current,
                    width: '100%',
                    height: '100%',
                    userInfo: displayName ? { displayName } : undefined,
                    configOverwrite: { subject: subject || '', prejoinPageEnabled: true, disableDeepLinking: true },
                    interfaceConfigOverwrite: { MOBILE_APP_PROMO: false },
                })
                apiRef.current = api
                api.on('videoConferenceLeft', () => { onClose?.() })
                api.on('readyToClose', () => { onClose?.() })
                setLoading(false)
            })
            .catch((e: Error) => { if (!cancelled) { setError(e.message); setLoading(false) } })
        return () => {
            cancelled = true
            try { apiRef.current?.dispose() } catch { /* already gone */ }
            apiRef.current = null
        }
    }, [room, displayName, subject, domain, onClose])

    if (error) {
        return (
            <div className="w-full h-full min-h-[300px] flex flex-col items-center justify-center text-center gap-2 bg-gray-50 rounded-2xl border border-gray-100 p-6">
                <AlertCircle className="w-8 h-8 text-amber-500" />
                <p className="text-sm text-gray-600">{error}</p>
                <a href={`https://${domain}/${encodeURIComponent(room)}`} target="_blank" rel="noreferrer"
                    className="text-sm font-bold text-[#140152] underline">Open the call in a new tab instead →</a>
            </div>
        )
    }

    return (
        <div className="relative w-full h-full min-h-[300px] rounded-2xl overflow-hidden border border-gray-100 bg-black">
            {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
                    <Loader2 className="w-8 h-8 animate-spin text-[#140152]" />
                </div>
            )}
            <div ref={containerRef} className="w-full h-full" />
        </div>
    )
}

/** Deterministic, unguessable room name for a couple's marriage-prep call. */
export function marriagePrepRoom(coupleId: string): string {
    return `LETW-MarriagePrep-${coupleId}`
}
