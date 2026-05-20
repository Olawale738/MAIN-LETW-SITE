'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
    ArrowLeft, Activity as ActivityIcon, MessageCircle, Heart, Briefcase, Bell,
    Loader2, History,
} from 'lucide-react'
import { activityApi, type ActivityItem } from '@/lib/api'

const KIND_ICONS: Record<string, any> = {
    prayer_request: Heart,
    service_request: Briefcase,
    message: MessageCircle,
    notification: Bell,
    bible_progress: ActivityIcon,
}
const KIND_LABELS: Record<string, string> = {
    prayer_request: 'Prayer request',
    service_request: 'Service request',
    message: 'Message',
    notification: 'Notification',
    bible_progress: 'Bible reading',
}

function formatTime(iso: string) {
    const d = new Date(iso)
    return d.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })
}

export default function ActivityPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [items, setItems] = useState<ActivityItem[]>([])
    const [counts, setCounts] = useState<Record<string, number>>({})
    const [filter, setFilter] = useState<string>('all')

    useEffect(() => {
        if (typeof window !== 'undefined' && !localStorage.getItem('isLoggedIn')) {
            router.push('/auth/login'); return
        }
        ;(async () => {
            try {
                const data = await activityApi.me(100)
                setItems(data.items)
                setCounts(data.counts)
            } catch (e) { console.error(e) } finally { setLoading(false) }
        })()
    }, [router])

    const visible = filter === 'all' ? items : items.filter(i => i.kind === filter)

    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            <div className="bg-[#140152] text-white">
                <div className="max-w-4xl mx-auto px-4 md:px-8 py-6 flex items-center gap-4">
                    <button onClick={() => router.push('/dashboard')} className="p-2 rounded-full hover:bg-white/10">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-black tracking-tight flex items-center gap-3">
                            <History className="w-7 h-7" /> My Activity
                        </h1>
                        <p className="text-blue-200 text-sm">Your journey across LETW in one place</p>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto p-4 md:p-6">
                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                    {[
                        { k: 'prayer_requests', label: 'Prayers', icon: Heart },
                        { k: 'service_requests', label: 'Services', icon: Briefcase },
                        { k: 'conversations', label: 'Chats', icon: MessageCircle },
                        { k: 'notifications', label: 'Alerts', icon: Bell },
                    ].map(({ k, label, icon: Icon }) => (
                        <div key={k} className="bg-white rounded-2xl shadow p-4 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-[#140152]/10 text-[#140152] flex items-center justify-center">
                                <Icon className="w-5 h-5" />
                            </div>
                            <div>
                                <div className="text-2xl font-black text-[#140152]">{counts[k] ?? 0}</div>
                                <div className="text-xs text-gray-500 uppercase tracking-wide">{label}</div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Filter */}
                <div className="flex flex-wrap gap-2 mb-4">
                    {['all', 'prayer_request', 'service_request', 'message', 'notification'].map(k => (
                        <button
                            key={k}
                            onClick={() => setFilter(k)}
                            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${filter === k ? 'bg-[#140152] text-white' : 'bg-white text-gray-700 border border-gray-200'}`}
                        >
                            {k === 'all' ? 'All' : KIND_LABELS[k] || k}
                        </button>
                    ))}
                </div>

                {/* Timeline */}
                <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
                    {loading ? (
                        <div className="p-16 flex items-center justify-center text-gray-400">
                            <Loader2 className="w-6 h-6 animate-spin" />
                        </div>
                    ) : visible.length === 0 ? (
                        <div className="p-16 text-center text-gray-500">
                            <ActivityIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                            <p>No activity yet.</p>
                        </div>
                    ) : (
                        <ol className="relative">
                            {visible.map((it, i) => {
                                const Icon = KIND_ICONS[it.kind] || ActivityIcon
                                return (
                                    <li key={`${it.kind}-${i}`} className="px-5 py-4 border-b border-gray-50 last:border-0">
                                        <div className="flex gap-3 items-start">
                                            <div className="w-10 h-10 rounded-full bg-[#140152]/10 text-[#140152] flex items-center justify-center shrink-0">
                                                <Icon className="w-4 h-4" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between gap-2">
                                                    <p className="font-bold text-gray-900 truncate">{it.title}</p>
                                                    <span className="text-xs text-gray-400 shrink-0">{formatTime(it.happened_at)}</span>
                                                </div>
                                                {it.description && (
                                                    <p className="text-sm text-gray-600 mt-0.5 line-clamp-2">{it.description}</p>
                                                )}
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-[10px] uppercase font-bold text-[#140152] bg-blue-50 px-2 py-0.5 rounded-full">
                                                        {KIND_LABELS[it.kind] || it.kind}
                                                    </span>
                                                    {it.status && <span className="text-[10px] text-gray-500">· {it.status}</span>}
                                                    {it.link && (
                                                        <Link href={it.link} className="text-[10px] text-[#140152] hover:underline ml-auto">
                                                            View →
                                                        </Link>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </li>
                                )
                            })}
                        </ol>
                    )}
                </div>
            </div>
        </div>
    )
}
