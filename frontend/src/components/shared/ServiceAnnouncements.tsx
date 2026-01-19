'use client'
import React, { useEffect, useState } from 'react'
import { Megaphone, X, Loader2 } from 'lucide-react'
import { announcementApi, Announcement } from '@/lib/api'

interface ServiceAnnouncementsProps {
    serviceName: string
}

export default function ServiceAnnouncements({ serviceName }: ServiceAnnouncementsProps) {
    const [announcements, setAnnouncements] = useState<Announcement[]>([])
    const [loading, setLoading] = useState(true)
    const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set())

    useEffect(() => {
        const fetchAnnouncements = async () => {
            try {
                const data = await announcementApi.getForService(serviceName)
                setAnnouncements(data.announcements)
            } catch (err) {
                console.error('Failed to load announcements', err)
            } finally {
                setLoading(false)
            }
        }

        fetchAnnouncements()

        // Load dismissed IDs from localStorage
        const stored = localStorage.getItem(`dismissed_announcements_${serviceName}`)
        if (stored) {
            setDismissedIds(new Set(JSON.parse(stored)))
        }
    }, [serviceName])

    const dismissAnnouncement = (id: string) => {
        const newDismissed = new Set(dismissedIds)
        newDismissed.add(id)
        setDismissedIds(newDismissed)
        localStorage.setItem(
            `dismissed_announcements_${serviceName}`,
            JSON.stringify(Array.from(newDismissed))
        )
    }

    const formatTimeAgo = (dateString: string) => {
        // Backend stores UTC but may not include timezone, so append 'Z' if missing
        const normalizedDate = dateString.endsWith('Z') || dateString.includes('+')
            ? dateString
            : dateString + 'Z'
        const date = new Date(normalizedDate)
        const now = new Date()
        const diffMs = now.getTime() - date.getTime()
        const diffMins = Math.floor(diffMs / 60000)
        const diffHours = Math.floor(diffMins / 60)
        const diffDays = Math.floor(diffHours / 24)

        if (diffMins < 1) return 'Just now'
        if (diffMins < 60) return `${diffMins}m ago`
        if (diffHours < 24) return `${diffHours}h ago`
        if (diffDays < 7) return `${diffDays}d ago`
        return date.toLocaleDateString()
    }

    // Filter out dismissed announcements
    const visibleAnnouncements = announcements.filter(a => !dismissedIds.has(a.id))

    if (loading) {
        return (
            <div className="mb-6 p-4 bg-blue-50 rounded-xl flex items-center justify-center">
                <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
            </div>
        )
    }

    if (visibleAnnouncements.length === 0) {
        return null
    }

    return (
        <div className="mb-6 space-y-4">
            {visibleAnnouncements.map((announcement) => (
                <div
                    key={announcement.id}
                    className="bg-gradient-to-r from-[#140152] to-[#1d0175] text-white p-5 rounded-2xl shadow-lg relative overflow-hidden"
                >
                    {/* Decorative background pattern */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#f5bb00]/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-[#f5bb00]/5 rounded-full translate-y-1/2 -translate-x-1/2" />

                    <div className="relative z-10">
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex items-start gap-3 flex-1">
                                <div className="p-2 bg-[#f5bb00] rounded-lg flex-shrink-0">
                                    <Megaphone className="w-5 h-5 text-[#140152]" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-xs font-medium text-[#f5bb00] uppercase tracking-wider">
                                            Announcement
                                        </span>
                                        <span className="text-xs text-white/60">
                                            {formatTimeAgo(announcement.created_at)}
                                        </span>
                                    </div>
                                    <h3 className="text-lg font-bold text-white mb-2">
                                        {announcement.title}
                                    </h3>
                                    <p className="text-white/80 text-sm leading-relaxed whitespace-pre-wrap">
                                        {announcement.content}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => dismissAnnouncement(announcement.id)}
                                className="p-1.5 hover:bg-white/10 rounded-lg transition-colors flex-shrink-0"
                                title="Dismiss"
                            >
                                <X className="w-4 h-4 text-white/60 hover:text-white" />
                            </button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    )
}
