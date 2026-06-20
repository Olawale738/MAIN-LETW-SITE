'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Radio } from 'lucide-react'
import { onlineCampusApi } from '@/lib/api'

/**
 * Polls /api/online-campus/current every 30s. When a service is LIVE, renders
 * a pulsing red "LIVE NOW" badge that links to /live. When no service is live
 * but one is upcoming, renders a quiet "Live →" hint. When neither, renders
 * a small quiet link.
 */
export default function LiveIndicator({ compact = false }: { compact?: boolean }) {
    const [status, setStatus] = useState<'live' | 'upcoming' | 'none'>('none')

    useEffect(() => {
        const load = async () => {
            try {
                const c = await onlineCampusApi.current()
                if (c.status === 'live') setStatus('live')
                else if (c.status === 'upcoming') setStatus('upcoming')
                else setStatus('none')
            } catch { setStatus('none') }
        }
        load()
        const id = setInterval(load, 30000)
        return () => clearInterval(id)
    }, [])

    if (status === 'live') {
        return (
            <Link href="/live" aria-label="A service is live now — click to join"
                className="inline-flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white font-black px-3 py-1.5 rounded-full text-xs uppercase tracking-wider shadow-lg shadow-red-500/40 transition-all hover:scale-105">
                <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
                </span>
                {compact ? 'LIVE' : 'Live Now'}
            </Link>
        )
    }
    if (status === 'upcoming') {
        return (
            <Link href="/live" className="inline-flex items-center gap-1.5 text-xs font-bold text-[#140152] hover:text-[#f5bb00] transition-colors">
                <Radio className="w-3.5 h-3.5" /> {compact ? 'Live' : 'Upcoming Live'}
            </Link>
        )
    }
    return (
        <Link href="/live" className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-[#140152] transition-colors">
            <Radio className="w-3.5 h-3.5" /> Live
        </Link>
    )
}
