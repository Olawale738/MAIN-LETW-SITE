'use client'
import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import PremiumButton from '@/components/ui/PremiumButton'
import {
    PlayCircle, Calendar, Youtube, Users,
    FileText, Download, Loader2, BookOpen, ExternalLink
} from 'lucide-react'
import { sermonApi, Sermon } from '@/lib/api'
import { Spotlight } from '@/components/ui/spotlight'

export default function SermonsPage() {
    const [sermons, setSermons] = useState<Sermon[]>([])
    const [loading, setLoading] = useState(true)
    const [playingVideoId, setPlayingVideoId] = useState<string | null>(null)
    const [seriesList, setSeriesList] = useState<string[]>([])
    const [selectedSeries, setSelectedSeries] = useState<string>('')
    const [viewingDocument, setViewingDocument] = useState<{ sermon: Sermon, url: string } | null>(null)

    useEffect(() => {
        loadSermons()
        loadSeries()
    }, [selectedSeries])

    const loadSermons = async () => {
        try {
            setLoading(true)
            const data = await sermonApi.getPublicSermons(selectedSeries || undefined)
            setSermons(data.sermons)
        } catch (err) {
            console.error('Failed to load sermons', err)
        } finally {
            setLoading(false)
        }
    }

    const loadSeries = async () => {
        try {
            const data = await sermonApi.getSeries()
            setSeriesList(data.series)
        } catch (err) {
            console.error('Failed to load series', err)
        }
    }

    const extractYoutubeId = (url: string): string | null => {
        const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/)
        return match ? match[1] : null
    }

    const handleDownload = async (url: string, filename: string) => {
        try {
            const response = await fetch(url)
            const blob = await response.blob()
            const downloadUrl = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = downloadUrl
            a.download = filename
            document.body.appendChild(a)
            a.click()
            a.remove()
            window.URL.revokeObjectURL(downloadUrl)
        } catch (err) {
            console.error('Download failed', err)
        }
    }

    const viewDocument = (sermon: Sermon) => {
        const url = sermon.document_url || (sermon.id ? sermonApi.getDocumentUrl(sermon.id) : '')
        if (url) {
            setViewingDocument({ sermon, url })
        }
    }

    // Filter sermons
    const videoSermons = sermons.filter(s => s.video_url)
    const bookContent = sermons.filter(s => s.has_document || s.document_url)

    const featuredSermon = videoSermons.find(s => s.is_featured) || videoSermons[0]
    const otherSermons = videoSermons.filter(s => s.id !== featuredSermon?.id)

    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            {/* Spotlight Hero Section */}
            <div 
                className="relative bg-[#140152] pt-32 pb-24 px-4 md:px-12 overflow-hidden min-h-screen flex flex-col justify-center bg-cover bg-center" 
                style={{ backgroundImage: 'url("/SERMONS.png")' }}
            >
                <div className="absolute inset-0 bg-[#140152]/60 pointer-events-none" />
                <Spotlight className="-top-10 left-0 md:left-60 md:-top-20 z-0" fill="white" />
                <div className="max-w-7xl mx-auto relative z-10 text-center">
                    <h1 className="text-4xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60 mb-6 tracking-tight">
                        Sermons & Library
                    </h1>
                    <p className="text-blue-200 text-lg md:text-xl max-w-2xl mx-auto font-light leading-relaxed">
                        Explore our collection of life-changing messages and spiritual resources.
                    </p>
                </div>
            </div>

            <main className="py-16 px-4 md:px-12 space-y-24 max-w-7xl mx-auto">

                {/* 1. MESSAGES SECTION */}
                <section>
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <span className="text-[#f5bb00] font-bold uppercase tracking-[0.2em] text-sm block mb-2">Watch</span>
                            <h2 className="text-3xl md:text-4xl font-black text-[#140152]">Latest Messages</h2>
                        </div>
                        {/* Series Filter */}
                        {seriesList.length > 0 && (
                            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                                <Button
                                    variant={selectedSeries === '' ? 'primary' : 'outline'}
                                    size="sm"
                                    onClick={() => setSelectedSeries('')}
                                    className={`rounded-full ${selectedSeries === '' ? 'bg-[#140152] text-white hover:bg-[#140152]/90' : 'border-gray-200 text-gray-600'}`}
                                >
                                    All
                                </Button>
                                {seriesList.map(series => (
                                    <Button
                                        key={series}
                                        variant={selectedSeries === series ? 'primary' : 'outline'}
                                        size="sm"
                                        onClick={() => setSelectedSeries(series)}
                                        className={`rounded-full whitespace-nowrap ${selectedSeries === series ? 'bg-[#140152] text-white hover:bg-[#140152]/90' : 'border-gray-200 text-gray-600'}`}
                                    >
                                        {series}
                                    </Button>
                                ))}
                            </div>
                        )}
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-20">
                            <Loader2 className="w-10 h-10 animate-spin text-[#140152]" />
                        </div>
                    ) : (
                        <>
                            {/* Featured Sermon */}
                            {featuredSermon && (
                                <div className="mb-12">
                                    <div className="bg-[#140152] rounded-3xl overflow-hidden shadow-2xl relative group">
                                        <div className="grid grid-cols-1 lg:grid-cols-2">
                                            <div className="relative h-[300px] lg:h-[450px] bg-black">
                                                {playingVideoId === featuredSermon.id && featuredSermon.video_url ? (
                                                    <iframe
                                                        width="100%"
                                                        height="100%"
                                                        src={`https://www.youtube.com/embed/${extractYoutubeId(featuredSermon.video_url)}?autoplay=1`}
                                                        title="YouTube video player"
                                                        frameBorder="0"
                                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                        allowFullScreen
                                                        className="absolute inset-0 w-full h-full"
                                                    />
                                                ) : (
                                                    <div
                                                        className="relative h-full w-full cursor-pointer group/video"
                                                        onClick={() => featuredSermon.video_url && setPlayingVideoId(featuredSermon.id)}
                                                    >
                                                        <div
                                                            className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover/video:scale-105"
                                                            style={{
                                                                backgroundImage: `url(${featuredSermon.has_thumbnail ? sermonApi.getThumbnailUrl(featuredSermon.id) : (featuredSermon.video_thumbnail || 'https://images.unsplash.com/photo-1516280440614-6697288d5d38?w=800')})`
                                                            }}
                                                        />
                                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                                            <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center group-hover/video:scale-110 transition-transform">
                                                                <PlayCircle className="w-10 h-10 text-white fill-white/20" />
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="p-8 lg:p-12 flex flex-col justify-center relative">
                                                <div className="absolute top-0 right-0 p-8 opacity-10">
                                                    <Youtube className="w-32 h-32 text-white" />
                                                </div>
                                                <div className="relative z-10">
                                                    <div className="flex items-center gap-2 text-[#f5bb00] text-sm font-bold uppercase tracking-widest mb-4">
                                                        <span className="bg-[#f5bb00]/20 px-3 py-1 rounded-full">Featured Message</span>
                                                    </div>
                                                    <h3 className="text-3xl lg:text-4xl font-black text-white mb-4 leading-tight">{featuredSermon.title}</h3>
                                                    <p className="text-white/70 text-lg mb-8 leading-relaxed line-clamp-3">
                                                        {featuredSermon.description || 'A powerful message to transform your life.'}
                                                    </p>

                                                    <div className="flex flex-wrap items-center gap-6 mb-8 text-white/60 font-medium">
                                                        <span className="flex items-center gap-2"><Users className="w-4 h-4" /> {featuredSermon.preacher}</span>
                                                        <span className="flex items-center gap-2"><Calendar className="w-4 h-4" /> {new Date(featuredSermon.sermon_date).toLocaleDateString()}</span>
                                                    </div>

                                                    <Button
                                                        onClick={() => setPlayingVideoId(featuredSermon.id)}
                                                        className="bg-[#f5bb00] text-[#140152] hover:bg-[#d9a600] font-bold text-lg px-8 py-6 rounded-xl w-fit"
                                                    >
                                                        <PlayCircle className="w-5 h-5 mr-2" /> Watch Now
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Sermon Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {otherSermons.map((sermon) => (
                                    <div key={sermon.id} className="group bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 flex flex-col">
                                        {/* Thumbnail Area */}
                                        <div className="relative aspect-video bg-black overflow-hidden">
                                            {playingVideoId === sermon.id && sermon.video_url ? (
                                                <iframe
                                                    width="100%"
                                                    height="100%"
                                                    src={`https://www.youtube.com/embed/${extractYoutubeId(sermon.video_url)}?autoplay=1`}
                                                    title={sermon.title}
                                                    frameBorder="0"
                                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                    allowFullScreen
                                                    className="absolute inset-0 w-full h-full"
                                                />
                                            ) : (
                                                <div
                                                    className="w-full h-full cursor-pointer relative"
                                                    onClick={() => sermon.video_url && setPlayingVideoId(sermon.id)}
                                                >
                                                    <div
                                                        className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                                                        style={{
                                                            backgroundImage: `url(${sermon.has_thumbnail ? sermonApi.getThumbnailUrl(sermon.id) : (sermon.video_thumbnail || 'https://images.unsplash.com/photo-1516280440614-6697288d5d38?w=800')})`
                                                        }}
                                                    />
                                                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                                                        <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center">
                                                            <PlayCircle className="w-6 h-6 text-white" />
                                                        </div>
                                                    </div>
                                                    {sermon.series && (
                                                        <div className="absolute top-4 left-4">
                                                            <span className="bg-[#140152]/80 backdrop-blur-sm text-white text-xs font-bold px-3 py-1 rounded-full">
                                                                {sermon.series}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {/* Content */}
                                        <div className="p-6 flex flex-col flex-grow">
                                            <div className="text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider flex items-center gap-2">
                                                <Calendar className="w-3 h-3" />
                                                {new Date(sermon.sermon_date).toLocaleDateString()}
                                            </div>
                                            <h3 className="text-lg font-bold text-[#140152] mb-2 line-clamp-2 group-hover:text-blue-700 transition-colors">
                                                {sermon.title}
                                            </h3>
                                            <p className="text-sm text-gray-500 line-clamp-2 mb-4 flex-grow">
                                                {sermon.description || 'Watch this powerful message.'}
                                            </p>
                                            <div className="flex items-center justify-between border-t border-gray-100 pt-4 mt-auto">
                                                <span className="text-sm font-medium text-gray-600 flex items-center gap-2">
                                                    <Users className="w-4 h-4 text-[#f5bb00]" /> {sermon.preacher}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {videoSermons.length === 0 && (
                                <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-gray-200">
                                    <Video className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                                    <h3 className="text-xl font-bold text-gray-400">No messages found</h3>
                                </div>
                            )}
                        </>
                    )}
                </section>

                {/* 2. LIBRARY / BOOKS SECTION */}
                <section>
                    <div className="flex items-end justify-between mb-8 border-b border-gray-200 pb-4">
                        <div>
                            <span className="text-[#f5bb00] font-bold uppercase tracking-[0.2em] text-sm block mb-2">Read</span>
                            <h2 className="text-3xl md:text-4xl font-black text-[#140152]">Books & Resources</h2>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {bookContent.map((book) => (
                            <div key={book.id} className="group relative bg-[#f8f9fc] rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-100 flex flex-col h-full hover:-translate-y-1">
                                <div className="aspect-[3/4] bg-white relative overflow-hidden flex items-center justify-center p-8 bg-gradient-to-br from-gray-50 to-gray-100">
                                    {/* Book Cover Simulation */}
                                    <div
                                        className="w-full h-full shadow-[0_10px_20px_rgba(0,0,0,0.15)] rounded-r-md border-l-4 border-gray-300 relative transform transition-transform duration-500 group-hover:scale-105 bg-cover bg-center"
                                        style={{
                                            backgroundImage: `url(${book.has_thumbnail ? sermonApi.getThumbnailUrl(book.id) : (book.video_thumbnail || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=600')})`
                                        }}
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-r from-black/10 to-transparent pointer-events-none" />
                                    </div>
                                </div>

                                <div className="p-5 flex flex-col flex-grow bg-white">
                                    <h3 className="font-bold text-[#140152] text-lg leading-tight mb-1 line-clamp-2">{book.title}</h3>
                                    <p className="text-sm text-gray-500 font-medium mb-3">{book.preacher}</p>

                                    <div className="mt-auto space-y-2">
                                        {book.has_document && !book.document_url && (
                                            <Button
                                                className="w-full bg-[#140152] text-white hover:bg-[#2a0a6e]"
                                                onClick={() => handleDownload(sermonApi.getDocumentUrl(book.id), book.document_filename || 'book.pdf')}
                                            >
                                                <Download className="w-4 h-4 mr-2" /> Download
                                            </Button>
                                        )}
                                        {book.document_url && (
                                            <Button
                                                className="w-full bg-[#140152] text-white hover:bg-[#2a0a6e]"
                                                onClick={() => window.open(book.document_url, '_blank')}
                                            >
                                                <ExternalLink className="w-4 h-4 mr-2" /> Open Resource
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* Example Placeholder Books if library is empty */}
                        {bookContent.length === 0 && !loading && (
                            <div className="col-span-full py-12 text-center bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                                <BookOpen className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                                <p className="text-gray-500 font-medium">No books currently available in the library.</p>
                            </div>
                        )}
                    </div>
                </section>
            </main>

            {/* Viewer Modal */}
            {viewingDocument && (
                <div
                    className="fixed inset-0 bg-black/95 z-50 flex flex-col animate-in fade-in duration-200"
                    onClick={() => setViewingDocument(null)}
                >
                    <div className="bg-[#140152] text-white p-4 flex items-center justify-between shadow-lg" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-3">
                            <div className="bg-white/10 p-2 rounded-lg">
                                <FileText className="w-5 h-5 text-[#f5bb00]" />
                            </div>
                            <div>
                                <h3 className="font-bold text-sm md:text-base">{viewingDocument.sermon.title}</h3>
                                <p className="text-xs text-white/50">{viewingDocument.sermon.preacher}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-white hover:bg-white/10"
                                onClick={() => window.open(viewingDocument.url, '_blank')}
                            >
                                <ExternalLink className="w-4 h-4 mr-2" /> Open External
                            </Button>
                            <button
                                onClick={() => setViewingDocument(null)}
                                className="p-2 hover:bg-white/10 rounded-full transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                    </div>
                    <div className="flex-1 bg-gray-900 overflow-hidden relative" onClick={e => e.stopPropagation()}>
                        <iframe
                            src={viewingDocument.url}
                            className="w-full h-full border-none"
                            title={viewingDocument.sermon.title}
                        />
                    </div>
                </div>
            )}
        </div>
    )
}

function Video({ className }: { className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="m22 8-6 4 6 4V8Z" />
            <rect width="14" height="12" x="2" y="6" rx="2" ry="2" />
        </svg>
    )
}

function X({ className }: { className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
        </svg>
    )
}
