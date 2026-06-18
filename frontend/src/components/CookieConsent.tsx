'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Cookie, X } from 'lucide-react'

const KEY = 'letw-cookie-consent-v1'

export default function CookieConsent() {
    const [open, setOpen] = useState(false)

    useEffect(() => {
        try {
            const stored = localStorage.getItem(KEY)
            if (!stored) setOpen(true)
        } catch { /* private mode */ }
    }, [])

    const save = (choice: 'accept' | 'reject') => {
        try {
            localStorage.setItem(KEY, JSON.stringify({ choice, when: new Date().toISOString() }))
        } catch { /* noop */ }
        // Broadcast so analytics scripts can react
        try { window.dispatchEvent(new CustomEvent('letw-cookie-consent', { detail: choice })) } catch { /* noop */ }
        setOpen(false)
    }

    if (!open) return null

    return (
        <div className="fixed bottom-4 left-4 right-4 sm:left-6 sm:right-auto sm:max-w-md z-50 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4">
            <div className="bg-white border border-gray-200 shadow-2xl rounded-2xl p-5">
                <div className="flex items-start gap-3 mb-3">
                    <div className="w-9 h-9 rounded-xl bg-[#f5bb00]/15 text-[#140152] flex items-center justify-center flex-shrink-0"><Cookie className="w-5 h-5" /></div>
                    <div className="flex-1">
                        <p className="font-bold text-[#140152]">We use cookies</p>
                        <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                            Essential cookies keep you signed in and remember your preferences. With your permission we also use analytics cookies to understand which pages are loved most. You can change your mind any time.
                        </p>
                    </div>
                    <button onClick={() => save('reject')} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg" aria-label="Reject and close"><X className="w-4 h-4" /></button>
                </div>
                <div className="flex items-center justify-between gap-3 flex-wrap">
                    <Link href="/privacy" className="text-xs text-gray-500 hover:text-[#140152] underline">Privacy policy</Link>
                    <div className="flex gap-2">
                        <button onClick={() => save('reject')} className="text-xs font-bold px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-700">Decline</button>
                        <button onClick={() => save('accept')} className="text-xs font-bold px-4 py-2 bg-[#140152] hover:bg-[#1d0175] text-white rounded-lg">Accept</button>
                    </div>
                </div>
            </div>
        </div>
    )
}
