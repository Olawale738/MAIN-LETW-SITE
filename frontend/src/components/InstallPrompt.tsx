'use client'
import { useEffect, useState } from 'react'
import { Smartphone, X, Download } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const DISMISSED_KEY = 'letw-install-dismissed-v1'

/**
 * Native install prompt banner.
 *
 * Listens for the `beforeinstallprompt` event (Chrome/Edge/Samsung Internet)
 * and surfaces a subtle bottom banner offering install. On iOS Safari (where
 * beforeinstallprompt is not supported) we show an "Add to Home Screen"
 * hint instead.
 *
 * Dismissed banners are remembered for 7 days.
 */
export default function InstallPrompt() {
    const [evt, setEvt] = useState<BeforeInstallPromptEvent | null>(null)
    const [iosHint, setIosHint] = useState(false)
    const [open, setOpen] = useState(false)

    useEffect(() => {
        try {
            const raw = localStorage.getItem(DISMISSED_KEY)
            if (raw) {
                const t = parseInt(raw, 10)
                if (!isNaN(t) && Date.now() - t < 7 * 24 * 3600 * 1000) return
            }
        } catch { /* noop */ }

        // Already installed?
        if (typeof window !== 'undefined' &&
            window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) {
            return
        }

        const onBeforeInstall = (e: Event) => {
            e.preventDefault()
            setEvt(e as BeforeInstallPromptEvent)
            // Slight delay so it doesn't pop the instant a user arrives
            setTimeout(() => setOpen(true), 3000)
        }
        window.addEventListener('beforeinstallprompt', onBeforeInstall)

        // iOS heuristic
        const ua = navigator.userAgent
        const isIos = /iPad|iPhone|iPod/.test(ua) && !/CriOS|FxiOS/.test(ua)
        const isStandalone = (window.navigator as Navigator & { standalone?: boolean }).standalone === true
        if (isIos && !isStandalone) {
            setIosHint(true)
            setTimeout(() => setOpen(true), 6000)
        }

        return () => window.removeEventListener('beforeinstallprompt', onBeforeInstall)
    }, [])

    const install = async () => {
        if (!evt) return
        try {
            await evt.prompt()
            await evt.userChoice
        } catch { /* noop */ }
        setOpen(false)
    }
    const dismiss = () => {
        setOpen(false)
        try { localStorage.setItem(DISMISSED_KEY, String(Date.now())) } catch { /* noop */ }
    }

    if (!open || (!evt && !iosHint)) return null

    return (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-md animate-[slideUp_500ms_ease-out]">
            <div className="bg-gradient-to-br from-[#140152] to-[#1d0175] text-white rounded-2xl shadow-2xl shadow-[#140152]/40 p-4 flex items-center gap-3 border border-white/15">
                <div className="w-11 h-11 rounded-xl bg-[#f5bb00] text-[#140152] flex items-center justify-center flex-shrink-0">
                    <Smartphone className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="font-black text-sm">{iosHint ? 'Add LETW to your home screen' : 'Install LETW'}</p>
                    <p className="text-[11px] text-white/70 leading-snug">
                        {iosHint ? "Tap the Share icon then 'Add to Home Screen' for one-tap access." : 'Faster, fullscreen, gets push notifications.'}
                    </p>
                </div>
                {!iosHint && (
                    <button onClick={install} className="bg-[#f5bb00] hover:bg-amber-400 text-[#140152] font-black px-4 py-2 rounded-lg text-xs inline-flex items-center gap-1.5">
                        <Download className="w-3.5 h-3.5" /> Install
                    </button>
                )}
                <button onClick={dismiss} aria-label="Dismiss" className="p-1.5 text-white/60 hover:text-white hover:bg-white/10 rounded">
                    <X className="w-4 h-4" />
                </button>
            </div>
            <style jsx>{`
                @keyframes slideUp {
                    from { opacity: 0; transform: translate(-50%, 20px); }
                    to   { opacity: 1; transform: translate(-50%, 0); }
                }
            `}</style>
        </div>
    )
}
