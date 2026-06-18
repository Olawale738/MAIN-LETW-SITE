'use client'
import { useEffect, useState } from 'react'
import { Download, X } from 'lucide-react'

/** Registers the service worker and shows an "Add to Home Screen" prompt
 *  when the browser fires beforeinstallprompt. iOS Safari users see an
 *  instruction banner since iOS hides the install prompt. */
export default function PWARegister() {
    const [installEvt, setInstallEvt] = useState<any>(null)
    const [show, setShow] = useState(false)
    const [isIOS, setIsIOS] = useState(false)

    useEffect(() => {
        if (typeof window === 'undefined') return
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js').catch(() => {})
        }
        const ua = window.navigator.userAgent.toLowerCase()
        const ios = /iphone|ipad|ipod/.test(ua) && !/crios|fxios/.test(ua)
        const standalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone
        if (standalone) return
        if (sessionStorage.getItem('letw-pwa-dismiss') === '1') return

        const onPrompt = (e: any) => {
            e.preventDefault()
            setInstallEvt(e)
            setTimeout(() => setShow(true), 4000) // wait so we don't annoy on first paint
        }
        window.addEventListener('beforeinstallprompt', onPrompt)

        if (ios) {
            setIsIOS(true)
            setTimeout(() => setShow(true), 6000)
        }
        return () => window.removeEventListener('beforeinstallprompt', onPrompt)
    }, [])

    const install = async () => {
        if (!installEvt) return
        installEvt.prompt()
        const { outcome } = await installEvt.userChoice
        if (outcome === 'accepted' || outcome === 'dismissed') setShow(false)
        sessionStorage.setItem('letw-pwa-dismiss', '1')
    }

    const dismiss = () => {
        setShow(false)
        sessionStorage.setItem('letw-pwa-dismiss', '1')
    }

    if (!show || (!installEvt && !isIOS)) return null

    return (
        <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-sm z-50 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4">
            <div className="bg-[#140152] text-white shadow-2xl rounded-2xl p-4 border border-[#1d0175]">
                <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#f5bb00] text-[#140152] flex items-center justify-center flex-shrink-0"><Download className="w-5 h-5" /></div>
                    <div className="flex-1">
                        <p className="font-bold">Add LETW to your phone</p>
                        {isIOS ? (
                            <p className="text-xs text-white/70 mt-1 leading-relaxed">Tap <strong>Share</strong> in Safari, then <strong>Add to Home Screen</strong>.</p>
                        ) : (
                            <p className="text-xs text-white/70 mt-1 leading-relaxed">Quick access to sermons, prayer, and giving — works offline.</p>
                        )}
                    </div>
                    <button onClick={dismiss} className="p-1.5 hover:bg-white/10 rounded-lg" aria-label="Dismiss"><X className="w-4 h-4" /></button>
                </div>
                {!isIOS && (
                    <div className="flex justify-end gap-2 mt-3">
                        <button onClick={dismiss} className="text-xs font-bold px-3 py-1.5 hover:bg-white/10 rounded-lg">Not now</button>
                        <button onClick={install} className="text-xs font-bold px-4 py-1.5 bg-[#f5bb00] hover:bg-[#ffc820] text-[#140152] rounded-lg">Install</button>
                    </div>
                )}
            </div>
        </div>
    )
}
