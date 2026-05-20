'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Bell, ArrowLeft, Loader2, CheckCheck, Inbox } from 'lucide-react'
import { notificationApi, type Notification } from '@/lib/api'

function timeAgo(iso: string) {
    const ms = Date.now() - new Date(iso).getTime()
    const s = Math.floor(ms / 1000)
    if (s < 60) return 'just now'
    const m = Math.floor(s / 60); if (m < 60) return `${m}m ago`
    const h = Math.floor(m / 60); if (h < 24) return `${h}h ago`
    const d = Math.floor(h / 24); if (d < 7) return `${d}d ago`
    return new Date(iso).toLocaleDateString()
}

export default function NotificationsPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [items, setItems] = useState<Notification[]>([])
    const [marking, setMarking] = useState(false)
    const [filter, setFilter] = useState<'all' | 'unread'>('all')

    useEffect(() => {
        if (typeof window !== 'undefined' && !localStorage.getItem('isLoggedIn')) {
            router.push('/auth/login'); return
        }
        ;(async () => {
            try {
                const data = await notificationApi.getNotifications(50, 0, filter === 'unread')
                setItems(data.notifications)
            } catch (e) { console.error(e) } finally { setLoading(false) }
        })()
    }, [filter, router])

    const unread = items.filter(n => !n.is_read).length

    async function markAll() {
        setMarking(true)
        try {
            await notificationApi.markAllAsRead()
            setItems(prev => prev.map(n => ({ ...n, is_read: true })))
        } catch (e) { console.error(e) } finally { setMarking(false) }
    }

    async function markOne(id: string) {
        try {
            await notificationApi.markAsRead(id)
            setItems(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
        } catch (e) { console.error(e) }
    }

    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            <div className="bg-[#140152] text-white">
                <div className="max-w-4xl mx-auto px-4 md:px-8 py-6 flex items-center gap-4">
                    <button onClick={() => router.push('/dashboard')} className="p-2 rounded-full hover:bg-white/10">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="flex-1">
                        <h1 className="text-2xl md:text-3xl font-black tracking-tight flex items-center gap-3">
                            <Bell className="w-7 h-7" /> Notifications
                        </h1>
                        <p className="text-blue-200 text-sm">{unread} unread</p>
                    </div>
                    {unread > 0 && (
                        <button
                            onClick={markAll}
                            disabled={marking}
                            className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-white/10 hover:bg-white/20 text-sm font-semibold"
                        >
                            <CheckCheck className="w-4 h-4" /> Mark all read
                        </button>
                    )}
                </div>
            </div>

            <div className="max-w-4xl mx-auto p-4 md:p-6">
                <div className="flex gap-2 mb-4">
                    {(['all', 'unread'] as const).map(k => (
                        <button
                            key={k}
                            onClick={() => setFilter(k)}
                            className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${filter === k ? 'bg-[#140152] text-white' : 'bg-white text-gray-700 border border-gray-200'}`}
                        >
                            {k === 'all' ? 'All' : 'Unread'}
                        </button>
                    ))}
                </div>

                <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
                    {loading ? (
                        <div className="p-16 flex items-center justify-center text-gray-400">
                            <Loader2 className="w-6 h-6 animate-spin" />
                        </div>
                    ) : items.length === 0 ? (
                        <div className="p-16 text-center text-gray-500">
                            <Inbox className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                            <p>You're all caught up.</p>
                        </div>
                    ) : items.map(n => (
                        <div
                            key={n.id}
                            onClick={() => !n.is_read && markOne(n.id)}
                            className={`px-5 py-4 border-b border-gray-50 last:border-0 cursor-pointer hover:bg-gray-50 ${!n.is_read ? 'bg-blue-50/40' : ''}`}
                        >
                            <div className="flex items-start gap-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${!n.is_read ? 'bg-[#140152] text-white' : 'bg-gray-100 text-gray-500'}`}>
                                    <Bell className="w-4 h-4" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2">
                                        <p className={`font-bold truncate ${!n.is_read ? 'text-[#140152]' : 'text-gray-900'}`}>{n.title}</p>
                                        <span className="text-xs text-gray-400 shrink-0">{timeAgo(n.created_at)}</span>
                                    </div>
                                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">{n.message}</p>
                                </div>
                                {!n.is_read && <span className="w-2 h-2 rounded-full bg-[#f5bb00] mt-2" />}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
