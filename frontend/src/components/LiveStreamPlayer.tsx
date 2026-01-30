'use client'

import { useState, useEffect } from 'react'
import { liveStreamApi, LiveStream } from '@/lib/api'
import { Loader2, Radio } from 'lucide-react'

export default function LiveStreamPlayer() {
    const [stream, setStream] = useState<LiveStream | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchStream = async () => {
            try {
                const activeStream = await liveStreamApi.getActiveStream()
                setStream(activeStream)
            } catch (error) {
                console.error("Failed to fetch live stream", error)
            } finally {
                setLoading(false)
            }
        }
        fetchStream()
    }, [])

    if (loading) return null

    if (!stream || !stream.is_active || !stream.url) return null

    const getEmbedUrl = (url: string) => {
        try {
            let videoId = '';
            if (url.includes('youtube.com/watch?v=')) {
                videoId = url.split('v=')[1].split('&')[0];
            } else if (url.includes('youtu.be/')) {
                videoId = url.split('youtu.be/')[1].split('?')[0];
            } else if (url.includes('youtube.com/embed/')) {
                return url;
            } else {
                videoId = url;
            }
            return `https://www.youtube.com/embed/${videoId}?autoplay=1`;
        } catch (e) {
            return url;
        }
    }

    return (
        <section className="relative w-full bg-[#0a0129] pt-32 pb-20 overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#140152]/50 via-transparent to-[#0a0129] z-0"></div>
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-[#f5bb00]/10 blur-[100px] rounded-full z-0 pointer-events-none"></div>

            <div className="container relative z-10 mx-auto px-4">
                <div className="max-w-5xl mx-auto space-y-8">
                    {/* Header */}
                    <div className="text-center space-y-4">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-600/90 backdrop-blur-sm text-white text-sm font-bold tracking-wide shadow-lg shadow-red-600/20 animate-pulse">
                            <span className="relative flex h-2.5 w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
                            </span>
                            LIVE NOW
                        </div>

                        <h2 className="text-3xl md:text-5xl font-bold text-white tracking-tight drop-shadow-sm">
                            {stream.title || "Join Our Live Service"}
                        </h2>

                        <p className="text-white/80 text-lg max-w-2xl mx-auto">
                            We are currently broadcasting live throughout the world. Join us in worship and the word.
                        </p>
                    </div>

                    {/* Video Player Container */}
                    <div className="relative group">
                        {/* Glow Effect */}
                        <div className="absolute -inset-1 bg-gradient-to-r from-[#f5bb00] via-[#140152] to-[#f5bb00] rounded-2xl opacity-30 group-hover:opacity-50 blur-lg transition duration-500"></div>

                        <div className="relative aspect-video w-full rounded-2xl overflow-hidden shadow-2xl bg-black border border-white/10 ring-1 ring-white/5">
                            <iframe
                                width="100%"
                                height="100%"
                                src={getEmbedUrl(stream.url)}
                                title="Live Stream"
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                                className="absolute inset-0"
                            ></iframe>
                        </div>
                    </div>

                    {/* Footer Info (Optional) */}
                    <div className="flex justify-center items-center gap-6 text-white/50 text-sm">
                        <div className="flex items-center gap-2">
                            <Radio className="w-4 h-4" />
                            <span>Live Broadcast</span>
                        </div>
                        <div className="w-1 h-1 bg-white/30 rounded-full"></div>
                        <p>Light Encounter Tabernacle</p>
                    </div>
                </div>
            </div>
        </section>
    )
}
