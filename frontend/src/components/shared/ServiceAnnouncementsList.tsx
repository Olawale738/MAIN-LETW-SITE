'use client'
import React, { useEffect, useState } from 'react'
import { Bell, Calendar, Loader2 } from 'lucide-react'
import { announcementApi, Announcement } from '@/lib/api'
import { motion } from 'framer-motion'

interface ServiceAnnouncementsListProps {
    serviceName: string
}

const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-GB', {
        day: 'numeric', month: 'short', year: 'numeric',
    })

export default function ServiceAnnouncementsList({ serviceName }: ServiceAnnouncementsListProps) {
    const [announcements, setAnnouncements] = useState<Announcement[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        announcementApi.getForService(serviceName)
            .then(data => setAnnouncements(data.announcements))
            .catch(console.error)
            .finally(() => setLoading(false))
    }, [serviceName])

    if (loading) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-10 flex justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-[#140152]/40" />
            </div>
        )
    }

    if (announcements.length === 0) return null

    return (
        <section className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-[#f5bb00] rounded-xl">
                    <Bell className="w-5 h-5 text-[#140152]" />
                </div>
                <div>
                    <h2 className="text-xl font-black text-[#140152]">Announcements</h2>
                    <p className="text-sm text-gray-500">{announcements.length} message{announcements.length !== 1 ? 's' : ''} from ministry leadership</p>
                </div>
            </div>

            <div className="space-y-4">
                {announcements.map((ann, i) => (
                    <motion.div
                        key={ann.id}
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.06 }}
                        className="flex bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                    >
                        {/* Gold stripe */}
                        <div className="w-1.5 flex-shrink-0 bg-gradient-to-b from-[#f5bb00] to-[#f5bb00]/40" />

                        <div className="flex-1 p-5">
                            <h3 className="font-bold text-[#140152] text-base mb-2">{ann.title}</h3>
                            <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{ann.content}</p>
                            <div className="flex items-center gap-1.5 mt-3 text-xs text-gray-400">
                                <Calendar className="w-3.5 h-3.5" />
                                <span>{formatDate(ann.created_at)}</span>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </section>
    )
}
