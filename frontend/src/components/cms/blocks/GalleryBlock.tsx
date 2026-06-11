'use client'
import React, { useState } from 'react'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import Image from 'next/image'
import { cmsApi } from '@/lib/api'

interface ImgItem { src: string; caption?: string }

interface Props {
    data: {
        title?: string
        subtitle?: string
        images?: ImgItem[]
        layout?: 'masonry' | 'grid' | 'marquee'
        bg?: 'white' | 'gray' | 'brand'
    }
}

function resolve(src: string) {
    if (!src) return ''
    return src.startsWith('http') || src.startsWith('/') ? src : cmsApi.getImageUrl(src)
}

export default function GalleryBlock({ data }: Props) {
    const { title, subtitle, images = [], layout = 'masonry', bg = 'white' } = data
    const [lightbox, setLightbox] = useState<number | null>(null)
    if (images.length === 0) return null

    const sectionBg =
        bg === 'brand' ? 'bg-gradient-to-br from-[#140152] to-[#0d0138]' :
        bg === 'gray' ? 'bg-gray-50' : 'bg-white'
    const titleColor = bg === 'brand' ? 'text-white' : 'text-[#140152]'
    const subColor = bg === 'brand' ? 'text-white/70' : 'text-gray-600'

    const next = () => setLightbox(c => c === null ? null : (c + 1) % images.length)
    const prev = () => setLightbox(c => c === null ? null : (c - 1 + images.length) % images.length)

    return (
        <section className={`py-20 overflow-hidden ${sectionBg}`}>
            <div className="container mx-auto px-4">
                {(title || subtitle) && (
                    <div className="text-center max-w-2xl mx-auto mb-10">
                        {title && <h2 className={`text-3xl md:text-4xl font-black ${titleColor}`}>{title}</h2>}
                        {subtitle && <p className={`mt-3 text-lg ${subColor}`}>{subtitle}</p>}
                        <div className="mt-5 mx-auto h-1.5 w-20 rounded-full bg-gradient-to-r from-[#f5bb00] to-[#7c3aed]" />
                    </div>
                )}

                {layout === 'marquee' ? (
                    <div className="relative -mx-4">
                        <div className="flex gap-4 animate-[letwMarquee_40s_linear_infinite]" style={{ width: 'max-content' }}>
                            {[...images, ...images].map((img, i) => (
                                <div key={i} className="relative shrink-0 w-72 h-48 rounded-2xl overflow-hidden shadow-md cursor-pointer group"
                                    onClick={() => setLightbox(i % images.length)}>
                                    <Image src={resolve(img.src)} alt={img.caption || ''} fill className="object-cover group-hover:scale-110 transition-transform duration-500" />
                                </div>
                            ))}
                        </div>
                        <style dangerouslySetInnerHTML={{ __html: '@keyframes letwMarquee{from{transform:translateX(0)}to{transform:translateX(-50%)}}' }} />
                    </div>
                ) : layout === 'grid' ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {images.map((img, i) => (
                            <div key={i} className="relative aspect-square rounded-2xl overflow-hidden shadow-sm cursor-pointer group"
                                onClick={() => setLightbox(i)}>
                                <Image src={resolve(img.src)} alt={img.caption || ''} fill className="object-cover group-hover:scale-110 transition-transform duration-500" />
                            </div>
                        ))}
                    </div>
                ) : (
                    // masonry-ish using CSS columns
                    <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 [column-fill:_balance]">
                        {images.map((img, i) => (
                            <div key={i} className="mb-4 break-inside-avoid rounded-2xl overflow-hidden shadow-sm cursor-pointer group relative"
                                onClick={() => setLightbox(i)}>
                                <Image src={resolve(img.src)} alt={img.caption || ''} width={800} height={600} className="w-full h-auto group-hover:scale-105 transition-transform duration-500" />
                            </div>
                        ))}
                    </div>
                )}

                {/* Lightbox */}
                {lightbox !== null && (
                    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setLightbox(null)}>
                        <button onClick={(e) => { e.stopPropagation(); setLightbox(null) }}
                            className="absolute top-4 right-4 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center">
                            <X className="w-6 h-6" />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); prev() }}
                            className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center">
                            <ChevronLeft className="w-6 h-6" />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); next() }}
                            className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center">
                            <ChevronRight className="w-6 h-6" />
                        </button>
                        <div className="relative max-w-5xl max-h-[85vh] w-full h-full" onClick={(e) => e.stopPropagation()}>
                            <Image src={resolve(images[lightbox].src)} alt={images[lightbox].caption || ''} fill className="object-contain" />
                            {images[lightbox].caption && (
                                <p className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white px-4 py-2 rounded-full text-sm">
                                    {images[lightbox].caption}
                                </p>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </section>
    )
}
