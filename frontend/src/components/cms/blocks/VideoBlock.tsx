'use client'
import React from 'react'

interface Props {
    data: {
        title?: string
        subtitle?: string
        url?: string         // YouTube/Vimeo URL or raw embed src
        caption?: string
        aspect?: '16:9' | '4:3' | '1:1'
        bg?: 'white' | 'gray' | 'brand'
    }
}

/** Convert a YouTube/Vimeo "watch" URL into an embeddable one. */
function toEmbed(url?: string): string | null {
    if (!url) return null
    try {
        const u = new URL(url)
        // YouTube short link
        if (u.hostname.includes('youtu.be')) {
            const id = u.pathname.replace('/', '')
            return `https://www.youtube.com/embed/${id}`
        }
        // YouTube standard
        if (u.hostname.includes('youtube.com')) {
            const id = u.searchParams.get('v')
            if (id) return `https://www.youtube.com/embed/${id}`
            if (u.pathname.startsWith('/embed/')) return url
            if (u.pathname.startsWith('/shorts/')) {
                const id = u.pathname.split('/')[2]
                return id ? `https://www.youtube.com/embed/${id}` : null
            }
        }
        // Vimeo
        if (u.hostname.includes('vimeo.com')) {
            const id = u.pathname.split('/').filter(Boolean)[0]
            return id ? `https://player.vimeo.com/video/${id}` : null
        }
        // Assume it's already an embed URL
        return url
    } catch {
        return null
    }
}

export default function VideoBlock({ data }: Props) {
    const { title, subtitle, url, caption, aspect = '16:9', bg = 'white' } = data
    const embed = toEmbed(url)
    if (!embed) return null

    const sectionBg =
        bg === 'brand' ? 'bg-gradient-to-br from-[#140152] to-[#0d0138]' :
        bg === 'gray' ? 'bg-gray-50' : 'bg-white'
    const titleColor = bg === 'brand' ? 'text-white' : 'text-[#140152]'
    const subColor = bg === 'brand' ? 'text-white/70' : 'text-gray-600'

    const aspectPad = aspect === '4:3' ? '75%' : aspect === '1:1' ? '100%' : '56.25%'

    return (
        <section className={`py-20 ${sectionBg}`}>
            <div className="container mx-auto px-4">
                {(title || subtitle) && (
                    <div className="text-center max-w-2xl mx-auto mb-10">
                        {title && <h2 className={`text-3xl md:text-4xl font-black ${titleColor}`}>{title}</h2>}
                        {subtitle && <p className={`mt-3 text-lg ${subColor}`}>{subtitle}</p>}
                    </div>
                )}

                <div className="max-w-4xl mx-auto">
                    <div className="relative rounded-3xl overflow-hidden shadow-2xl ring-1 ring-black/5 bg-black" style={{ paddingTop: aspectPad }}>
                        <iframe
                            src={embed}
                            className="absolute inset-0 w-full h-full"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            loading="lazy"
                            title={title || 'Video'}
                        />
                    </div>
                    {caption && <p className={`mt-4 text-center text-sm ${bg === 'brand' ? 'text-white/60' : 'text-gray-500'}`}>{caption}</p>}
                </div>
            </div>
        </section>
    )
}
