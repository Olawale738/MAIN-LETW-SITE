'use client'

import { useState, useEffect, useRef } from 'react'
import Hero from '@/components/shared/Hero'
import SectionWrapper from '@/components/shared/SectionWrapper'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import PremiumButton from '@/components/ui/PremiumButton'
import {
    PlayCircle, Calendar, Share2, Youtube, Users,
    Music, FileText, Download, X, Loader2, Pause, Play,
    Volume2, VolumeX, Maximize2, ExternalLink
} from 'lucide-react'
import { sermonApi, Sermon } from '@/lib/api'

export default function SermonsPage() {
    const [sermons, setSermons] = useState<Sermon[]>([])
    const [loading, setLoading] = useState(true)
    const [playingVideoId, setPlayingVideoId] = useState<string | null>(null)
    const [seriesList, setSeriesList] = useState<string[]>([])
    const [selectedSeries, setSelectedSeries] = useState<string>('')

    // Audio player state
    const [currentAudio, setCurrentAudio] = useState<{ sermon: Sermon, url: string } | null>(null)
    const [isPlaying, setIsPlaying] = useState(false)
    const [audioProgress, setAudioProgress] = useState(0)
    const [audioDuration, setAudioDuration] = useState(0)
    const [isMuted, setIsMuted] = useState(false)
    const audioRef = useRef<HTMLAudioElement>(null)

    // Document viewer state
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

    // Audio player functions
    const playAudio = (sermon: Sermon) => {
        const url = sermonApi.getAudioUrl(sermon.id)
        if (currentAudio?.sermon.id === sermon.id) {
            // Toggle play/pause
            if (isPlaying) {
                audioRef.current?.pause()
                setIsPlaying(false)
            } else {
                audioRef.current?.play()
                setIsPlaying(true)
            }
        } else {
            // Play new audio
            setCurrentAudio({ sermon, url })
            setIsPlaying(true)
            setAudioProgress(0)
        }
    }

    const handleAudioTimeUpdate = () => {
        if (audioRef.current) {
            setAudioProgress(audioRef.current.currentTime)
            setAudioDuration(audioRef.current.duration || 0)
        }
    }

    const handleAudioSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const time = parseFloat(e.target.value)
        if (audioRef.current) {
            audioRef.current.currentTime = time
            setAudioProgress(time)
        }
    }

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = Math.floor(seconds % 60)
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    const closeAudioPlayer = () => {
        audioRef.current?.pause()
        setCurrentAudio(null)
        setIsPlaying(false)
        setAudioProgress(0)
    }

    // Document viewer functions
    const viewDocument = (sermon: Sermon) => {
        const url = sermonApi.getDocumentUrl(sermon.id)
        setViewingDocument({ sermon, url })
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

    const featuredSermon = sermons.find(s => s.is_featured) || sermons[0]
    const otherSermons = sermons.filter(s => s.id !== featuredSermon?.id)

    return (
        <>
            <Hero
                title="Sermons & Messages"
                subtitle="Dive deeper into the Word of God"
                height="medium"
                backgroundImage="https://images.unsplash.com/photo-1478147427282-58a87a120781?w=1200"
            />

            <SectionWrapper>
                <div className="text-center mb-16 space-y-4">
                    <span className="text-[#f5bb00] font-bold uppercase tracking-[0.2em] text-sm">Media Library</span>
                    <h2 className="text-4xl md:text-5xl font-black text-[#140152]">Latest Messages</h2>
                    <div className="w-24 h-1.5 bg-[#f5bb00] mx-auto rounded-full" />
                </div>

                {/* Series Filter */}
                {seriesList.length > 0 && (
                    <div className="flex flex-wrap justify-center gap-2 mb-10">
                        <Button
                            variant={selectedSeries === '' ? 'primary' : 'outline'}
                            size="sm"
                            onClick={() => setSelectedSeries('')}
                        >
                            All Series
                        </Button>
                        {seriesList.map(series => (
                            <Button
                                key={series}
                                variant={selectedSeries === series ? 'primary' : 'outline'}
                                size="sm"
                                onClick={() => setSelectedSeries(series)}
                            >
                                {series}
                            </Button>
                        ))}
                    </div>
                )}

                {loading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="w-10 h-10 animate-spin text-[#140152]" />
                    </div>
                ) : sermons.length === 0 ? (
                    <div className="text-center py-20">
                        <Youtube className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                        <p className="text-xl font-medium text-gray-600">No sermons available yet</p>
                        <p className="text-gray-400">Check back soon for new messages!</p>
                    </div>
                ) : (
                    <>
                        {/* Featured Sermon */}
                        {featuredSermon && (
                            <div className="mb-20 max-w-6xl mx-auto">
                                <Card className="border-none shadow-2xl overflow-hidden group rounded-[2rem] bg-[#140152]">
                                    <div className="grid grid-cols-1 lg:grid-cols-2">
                                        <div className="relative h-[300px] lg:h-[400px] overflow-hidden bg-black">
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
                                                    className="relative h-full w-full cursor-pointer"
                                                    onClick={() => featuredSermon.video_url && setPlayingVideoId(featuredSermon.id)}
                                                >
                                                    <div
                                                        className="absolute inset-0 bg-cover bg-center"
                                                        style={{ backgroundImage: `url(${featuredSermon.video_thumbnail || 'https://images.unsplash.com/photo-1516280440614-6697288d5d38?w=800'})` }}
                                                    />
                                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                                        {featuredSermon.video_url && (
                                                            <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center">
                                                                <PlayCircle className="w-12 h-12 text-white" />
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        <div className="p-8 lg:p-12 flex flex-col justify-center text-white">
                                            <div className="flex items-center gap-2 text-[#f5bb00] text-sm font-bold uppercase tracking-widest mb-4">
                                                <span className="bg-[#f5bb00]/20 px-3 py-1 rounded-full">Featured</span>
                                                {featuredSermon.series && <span>{featuredSermon.series}</span>}
                                            </div>
                                            <h3 className="text-3xl lg:text-4xl font-black mb-4 leading-tight">{featuredSermon.title}</h3>
                                            <p className="text-white/70 text-lg mb-6 leading-relaxed line-clamp-3">
                                                {featuredSermon.description || 'A powerful message to transform your life.'}
                                            </p>
                                            <div className="flex items-center gap-6 text-sm font-medium text-white/60 mb-8">
                                                <div className="flex items-center gap-2">
                                                    <Users className="w-4 h-4" />
                                                    {featuredSermon.preacher}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="w-4 h-4" />
                                                    {new Date(featuredSermon.sermon_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                                                </div>
                                            </div>
                                            <div className="flex flex-wrap gap-3">
                                                {featuredSermon.video_url && (
                                                    <Button
                                                        onClick={() => setPlayingVideoId(featuredSermon.id)}
                                                        className="bg-[#f5bb00] text-[#140152] hover:bg-[#d9a600]"
                                                    >
                                                        <PlayCircle className="w-5 h-5 mr-2" /> Watch Now
                                                    </Button>
                                                )}
                                                {featuredSermon.has_audio && (
                                                    <Button
                                                        variant="outline"
                                                        className="border-white/30 text-white hover:bg-white/10"
                                                        onClick={() => playAudio(featuredSermon)}
                                                    >
                                                        <Music className="w-5 h-5 mr-2" />
                                                        {currentAudio?.sermon.id === featuredSermon.id && isPlaying ? 'Playing...' : 'Listen'}
                                                    </Button>
                                                )}
                                                {featuredSermon.has_document && (
                                                    <Button
                                                        variant="outline"
                                                        className="border-white/30 text-white hover:bg-white/10"
                                                        onClick={() => viewDocument(featuredSermon)}
                                                    >
                                                        <FileText className="w-5 h-5 mr-2" /> View Notes
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            </div>
                        )}

                        {/* Sermon Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
                            {otherSermons.map((sermon) => (
                                <Card key={sermon.id} className="border-none shadow-lg hover:shadow-2xl transition-all duration-300 group rounded-[1.5rem] overflow-hidden flex flex-col h-full bg-white">
                                    <div className="relative h-56 bg-black">
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
                                                className="relative h-full w-full cursor-pointer"
                                                onClick={() => sermon.video_url && setPlayingVideoId(sermon.id)}
                                            >
                                                <div
                                                    className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
                                                    style={{ backgroundImage: `url(${sermon.video_thumbnail || 'https://images.unsplash.com/photo-1516280440614-6697288d5d38?w=800'})` }}
                                                />
                                                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors" />
                                                {sermon.video_url && (
                                                    <div className="absolute inset-0 flex items-center justify-center">
                                                        <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                                            <PlayCircle className="w-8 h-8 text-white" />
                                                        </div>
                                                    </div>
                                                )}
                                                {sermon.series && (
                                                    <div className="absolute bottom-4 left-4">
                                                        <span className="bg-[#f5bb00] text-[#140152] text-xs font-bold px-3 py-1 rounded-full">
                                                            {sermon.series}
                                                        </span>
                                                    </div>
                                                )}
                                                {/* Media badges */}
                                                <div className="absolute top-4 right-4 flex gap-1">
                                                    {sermon.has_audio && (
                                                        <span className="bg-purple-500/80 backdrop-blur-md px-2 py-1 rounded-full text-xs text-white flex items-center gap-1">
                                                            <Music className="w-3 h-3" />
                                                        </span>
                                                    )}
                                                    {sermon.has_document && (
                                                        <span className="bg-blue-500/80 backdrop-blur-md px-2 py-1 rounded-full text-xs text-white flex items-center gap-1">
                                                            <FileText className="w-3 h-3" />
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <CardContent className="p-6 flex-grow">
                                        <div className="flex items-center gap-2 text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">
                                            <Calendar className="w-3 h-3" />
                                            {new Date(sermon.sermon_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                                        </div>
                                        <h3 className="text-xl font-black text-[#140152] mb-3 leading-snug group-hover:text-[#f5bb00] transition-colors">
                                            {sermon.title}
                                        </h3>
                                        <p className="text-gray-600 text-sm line-clamp-2 leading-relaxed">
                                            {sermon.description || 'A powerful message from the Word of God.'}
                                        </p>
                                    </CardContent>
                                    <CardFooter className="p-6 pt-0 mt-auto border-t border-gray-50">
                                        <div className="w-full">
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="text-sm font-bold text-[#140152]/70 flex items-center gap-2">
                                                    <Users className="w-4 h-4 text-[#f5bb00]" />
                                                    {sermon.preacher}
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                {sermon.video_url && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="flex-1"
                                                        onClick={() => setPlayingVideoId(playingVideoId === sermon.id ? null : sermon.id)}
                                                    >
                                                        <PlayCircle className="w-4 h-4 mr-1" />
                                                        {playingVideoId === sermon.id ? 'Stop' : 'Watch'}
                                                    </Button>
                                                )}
                                                {sermon.has_audio && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className={`${currentAudio?.sermon.id === sermon.id && isPlaying ? 'bg-purple-100 border-purple-300' : ''}`}
                                                        onClick={() => playAudio(sermon)}
                                                    >
                                                        {currentAudio?.sermon.id === sermon.id && isPlaying ? (
                                                            <Pause className="w-4 h-4" />
                                                        ) : (
                                                            <Music className="w-4 h-4" />
                                                        )}
                                                    </Button>
                                                )}
                                                {sermon.has_document && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => viewDocument(sermon)}
                                                    >
                                                        <FileText className="w-4 h-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </CardFooter>
                                </Card>
                            ))}
                        </div>
                    </>
                )}
            </SectionWrapper>

            {/* YouTube Channel CTA */}
            <SectionWrapper background="dark">
                <div className="text-center text-white max-w-4xl mx-auto space-y-8">
                    <Youtube className="w-20 h-20 text-[#f5bb00] mx-auto animate-pulse" />
                    <h2 className="text-4xl md:text-5xl font-black">Subscribe to Our Channel</h2>
                    <p className="text-xl text-white/80 leading-relaxed">
                        Don't miss out on live streams, worship sessions, and special content. Join our online community on YouTube.
                    </p>
                    <div className="flex justify-center">
                        <PremiumButton href="https://youtube.com">Subscribe Now</PremiumButton>
                    </div>
                </div>
            </SectionWrapper>

            {/* Hidden Audio Element */}
            {currentAudio && (
                <audio
                    ref={audioRef}
                    src={currentAudio.url}
                    onTimeUpdate={handleAudioTimeUpdate}
                    onLoadedMetadata={handleAudioTimeUpdate}
                    onEnded={() => setIsPlaying(false)}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    autoPlay
                />
            )}

            {/* Floating Audio Player */}
            {currentAudio && (
                <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-[#140152] to-[#2a0a6e] text-white shadow-2xl z-50 border-t border-white/10">
                    <div className="max-w-6xl mx-auto px-4 py-3">
                        <div className="flex items-center gap-4">
                            {/* Album Art / Icon */}
                            <div className="w-14 h-14 bg-[#f5bb00]/20 rounded-xl flex items-center justify-center flex-shrink-0">
                                <Music className="w-7 h-7 text-[#f5bb00]" />
                            </div>

                            {/* Song Info */}
                            <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-white truncate">{currentAudio.sermon.title}</h4>
                                <p className="text-sm text-white/60 truncate">{currentAudio.sermon.preacher}</p>
                            </div>

                            {/* Controls */}
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => {
                                        if (isPlaying) {
                                            audioRef.current?.pause()
                                        } else {
                                            audioRef.current?.play()
                                        }
                                    }}
                                    className="w-12 h-12 bg-[#f5bb00] rounded-full flex items-center justify-center hover:bg-[#d9a600] transition-colors"
                                >
                                    {isPlaying ? (
                                        <Pause className="w-5 h-5 text-[#140152]" />
                                    ) : (
                                        <Play className="w-5 h-5 text-[#140152] ml-0.5" />
                                    )}
                                </button>

                                <button
                                    onClick={() => {
                                        setIsMuted(!isMuted)
                                        if (audioRef.current) audioRef.current.muted = !isMuted
                                    }}
                                    className="p-2 hover:bg-white/10 rounded-lg"
                                >
                                    {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                                </button>

                                <button
                                    onClick={() => handleDownload(currentAudio.url, currentAudio.sermon.audio_filename || 'audio.mp3')}
                                    className="p-2 hover:bg-white/10 rounded-lg"
                                    title="Download"
                                >
                                    <Download className="w-5 h-5" />
                                </button>

                                <button
                                    onClick={closeAudioPlayer}
                                    className="p-2 hover:bg-white/10 rounded-lg"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="flex items-center gap-3 mt-2">
                            <span className="text-xs text-white/60 w-10">{formatTime(audioProgress)}</span>
                            <input
                                type="range"
                                min={0}
                                max={audioDuration || 100}
                                value={audioProgress}
                                onChange={handleAudioSeek}
                                className="flex-1 h-1 bg-white/20 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#f5bb00]"
                            />
                            <span className="text-xs text-white/60 w-10">{formatTime(audioDuration)}</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Document Viewer Modal */}
            {viewingDocument && (
                <div
                    className="fixed inset-0 bg-black/90 z-50 flex flex-col"
                    onClick={() => setViewingDocument(null)}
                >
                    {/* Header */}
                    <div className="bg-[#140152] text-white p-4 flex items-center justify-between" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-3">
                            <FileText className="w-6 h-6 text-[#f5bb00]" />
                            <div>
                                <h3 className="font-bold">{viewingDocument.sermon.title}</h3>
                                <p className="text-sm text-white/60">{viewingDocument.sermon.document_filename}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                className="border-white/30 text-white hover:bg-white/10"
                                onClick={() => handleDownload(viewingDocument.url, viewingDocument.sermon.document_filename || 'document.pdf')}
                            >
                                <Download className="w-4 h-4 mr-2" /> Download
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                className="border-white/30 text-white hover:bg-white/10"
                                onClick={() => window.open(viewingDocument.url, '_blank')}
                            >
                                <ExternalLink className="w-4 h-4 mr-2" /> Open in New Tab
                            </Button>
                            <button
                                onClick={() => setViewingDocument(null)}
                                className="p-2 hover:bg-white/10 rounded-lg ml-2"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                    </div>

                    {/* Document Embed */}
                    <div className="flex-1 bg-gray-100" onClick={e => e.stopPropagation()}>
                        <iframe
                            src={`${viewingDocument.url}#toolbar=1&navpanes=0`}
                            className="w-full h-full"
                            title={viewingDocument.sermon.title}
                        />
                    </div>
                </div>
            )}
        </>
    )
}
