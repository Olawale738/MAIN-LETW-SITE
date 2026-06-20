'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Radio, X } from 'lucide-react'
import { onlineCampusApi } from '@/lib/api'

/**
 * Floating "We're LIVE" banner — pops in bottom-right corner of every public
 * page when a service goes live. Dismissable per-session. Pulses to grab
 * attention without dominating the page.
 *
 * Auto-hides on:
 *   - /live (don't show it on the page itself)
 *   - /admin/* (admin sees a different indicator in their dashboard)
 */
export default function FloatingLiveBanner() {
    const path = usePathname() || ''
    const [show, setShow] = useState(false)
    const [title, setTitle] = useState('')
    const [dismissed, setDismissed] = useState(false)

    useEffect(() => {
        try { if (sessionStorage.getItem('live-banner-dismissed') === '1') setDismissed(true) } catch { /* noop */ }
    }, [])

    useEffect(() => {
        if (path.startsWith('/admin') || path === '/live' || path.startsWith('/auth')) return
        if (dismissed) return
        const load = async () => {
            try {
                const c = await onlineCampusApi.current()
                if (c.status === 'live') { setShow(true); setTitle(c.title || 'Service is live now') }
                else setShow(false)
            } catch { setShow(false) }
        }
        load()
        const id = setInterval(load, 30000)
        return () => clearInterval(id)
    }, [path, dismissed])

    if (!show || dismissed) return null

    const dismiss = () => {
        setDismissed(true)
        try { sessionStorage.setItem('live-banner-dismissed', '1') } catch { /* noop */ }
    }

    return (
        <div className="fixed bottom-5 right-5 z-50 max-w-sm">
            <div className="bg-gradient-to-br from-red-600 via-red-500 to-orange-500 text-white rounded-2xl shadow-2xl shadow-red-500/40 overflow-hidden border-2 border-white/20">
                <div className="absolute inset-0 opacity-30">
                    <div className="absolute -top-10 -left-10 w-32 h-32 bg-white/30 rounded-full blur-2xl" />
                </div>
                <div className="relative p-4 flex items-start gap-3">
                    <div className="relative flex h-3 w-3 mt-1.5 flex-shrink-0">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-[10px] uppercase tracking-[0.25em] font-black opacity-80">LIVE NOW</p>
                        <p className="font-black text-sm leading-tight truncate">{title}</p>
                        <Link href="/live" className="inline-flex items-center gap-1.5 mt-2 bg-white text-red-600 hover:bg-yellow-50 font-black px-3 py-1.5 rounded-lg text-xs uppercase tracking-wider transition-colors">
                            <Radio className="w-3 h-3" /> Watch live
                        </Link>
                    </div>
                    <button onClick={dismiss} aria-label="Dismiss" className="p-1 hover:bg-white/20 rounded-lg flex-shrink-0"><X className="w-4 h-4" /></button>
                </div>
            </div>
        </div>
    )
}
