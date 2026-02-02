'use client'

import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Pause, Music, Filter, Search } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { alterSoundApi, AudioTrack, AudioCategory } from '@/lib/api'

export default function AudioLibraryPage() {
    const [tracks, setTracks] = useState<AudioTrack[]>([])
    const [categories, setCategories] = useState<AudioCategory[]>([])
    const [selectedCategory, setSelectedCategory] = useState<string>('all')
    const [searchQuery, setSearchQuery] = useState('')
    const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    const audioRef = useRef<HTMLAudioElement | null>(null)

    useEffect(() => {
        const fetchData = async () => {
            try {
                const data = await alterSoundApi.getPageData()
                setTracks(data.all_tracks.filter(t => t.is_active))
                setCategories(data.categories.filter(c => c.is_active))
            } catch (error) {
                console.error('Failed to load audio library:', error)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [])

    const filteredTracks = tracks.filter(track => {
        const matchesCategory = selectedCategory === 'all' || track.category_id === selectedCategory
        const matchesSearch = track.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            track.artist?.toLowerCase().includes(searchQuery.toLowerCase())
        return matchesCategory && matchesSearch
    })

    const handlePlay = async (trackId: string) => {
        const track = tracks.find(t => t.id === trackId)
        if (!track) {
            console.error('Track not found')
            return
        }

        // If clicking the same track that's playing, pause it
        if (currentlyPlaying === trackId && audioRef.current) {
            audioRef.current.pause()
            setCurrentlyPlaying(null)
            return
        }

        // Stop current audio if playing
        if (audioRef.current) {
            audioRef.current.pause()
            audioRef.current.currentTime = 0
        }

        // Create new audio element and play
        try {
            const audioUrl = alterSoundApi.getAudioUrl(trackId)
            const audio = new Audio(audioUrl)
            audioRef.current = audio

            // Set up event listeners
            audio.addEventListener('ended', () => {
                setCurrentlyPlaying(null)
            })

            audio.addEventListener('error', (e) => {
                console.error('Audio playback error:', e)
                setCurrentlyPlaying(null)
            })

            await audio.play()
            setCurrentlyPlaying(trackId)

            // Increment play count
            await alterSoundApi.incrementPlayCount(trackId)
        } catch (error) {
            console.error('Failed to play audio:', error)
            setCurrentlyPlaying(null)
        }
    }

    // Cleanup audio on unmount
    useEffect(() => {
        return () => {
            if (audioRef.current) {
                audioRef.current.pause()
                audioRef.current = null
            }
        }
    }, [])

    return (
        <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
            {/* Hero Header - Fixed padding for navbar */}
            <div className="bg-[#140152] text-white pt-32 pb-16 px-4">
                <div className="container mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center max-w-4xl mx-auto"
                    >
                        <span className="text-[#f5bb00] font-bold uppercase tracking-[0.2em] text-sm mb-4 inline-block">Alter Sound</span>
                        <h1 className="text-4xl md:text-6xl font-black mb-4">
                            Audio <span className="text-[#f5bb00]">Library</span>
                        </h1>
                        <p className="text-lg text-gray-300 max-w-2xl mx-auto">
                            Explore our collection of anointed worship and prophetic sound
                        </p>
                    </motion.div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-12">
                {/* Filters */}
                <div className="mb-8 space-y-4">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <Input
                                type="text"
                                placeholder="Search tracks or artists..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 bg-white border-gray-200 text-[#140152] placeholder:text-gray-400"
                            />
                        </div>
                    </div>

                    <div className="flex gap-2 flex-wrap">
                        <Button
                            onClick={() => setSelectedCategory('all')}
                            variant={selectedCategory === 'all' ? 'primary' : 'outline'}
                            className={selectedCategory === 'all' ? 'bg-[#f5bb00] text-[#140152] hover:bg-[#f5bb00]/90' : 'bg-white text-[#140152] border-gray-200 hover:bg-gray-50'}
                        >
                            All Categories
                        </Button>
                        {categories.map((category) => (
                            <Button
                                key={category.id}
                                onClick={() => setSelectedCategory(category.id)}
                                variant={selectedCategory === category.id ? 'primary' : 'outline'}
                                className={selectedCategory === category.id ? 'bg-[#f5bb00] text-[#140152] hover:bg-[#f5bb00]/90' : 'bg-white text-[#140152] border-gray-200 hover:bg-gray-50'}
                            >
                                {category.name}
                            </Button>
                        ))}
                    </div>
                </div>

                {/* Tracks Grid */}
                {loading ? (
                    <div className="text-center py-20">
                        <Music className="w-16 h-16 text-[#f5bb00] mx-auto mb-4 animate-pulse" />
                        <p className="text-gray-600">Loading audio library...</p>
                    </div>
                ) : filteredTracks.length === 0 ? (
                    <div className="text-center py-20">
                        <Music className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">No tracks found</p>
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <AnimatePresence>
                            {filteredTracks.map((track) => (
                                <motion.div
                                    key={track.id}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                >
                                    <Card className="bg-white border-gray-200 hover:shadow-xl transition-all overflow-hidden group">
                                        <div className="relative aspect-square bg-gradient-to-br from-[#140152] to-purple-900">
                                            <img
                                                src={alterSoundApi.getCoverUrl(track.id)}
                                                alt={track.title}
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    // Show fallback icon if cover image doesn't exist
                                                    e.currentTarget.style.display = 'none'
                                                    const fallback = e.currentTarget.nextElementSibling as HTMLElement
                                                    if (fallback) fallback.style.display = 'flex'
                                                }}
                                            />
                                            <div className="w-full h-full hidden items-center justify-center absolute top-0 left-0">
                                                <Music className="w-20 h-20 text-[#f5bb00]/30" />
                                            </div>
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <Button
                                                    onClick={() => handlePlay(track.id)}
                                                    className="bg-[#f5bb00] text-[#140152] hover:bg-white rounded-full w-16 h-16"
                                                >
                                                    {currentlyPlaying === track.id ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8 ml-1" />}
                                                </Button>
                                            </div>
                                        </div>
                                        <div className="p-4">
                                            <h3 className="font-bold text-lg text-[#140152] mb-1 truncate">{track.title}</h3>
                                            <p className="text-sm text-gray-600 mb-2">{track.artist || 'Unknown Artist'}</p>
                                            <div className="flex items-center justify-between text-xs text-gray-500">
                                                <span>{track.category.name}</span>
                                                <span>{track.play_count} plays</span>
                                            </div>
                                        </div>
                                    </Card>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>
        </div>
    )
}

