'use client'

import { useState } from 'react'

import Hero from '@/components/shared/Hero'
import SectionWrapper from '@/components/shared/SectionWrapper'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import PremiumButton from '@/components/ui/PremiumButton'
import { PlayCircle, Calendar, ArrowRight, Share2, Youtube, Clock, Users } from 'lucide-react'
import Link from 'next/link'

// Placeholder data for sermons
const initialSermons = [
    {
        id: 1,
        title: "God Approved Faith",
        preacher: "Ps. Johnson O.",
        date: "Recent",
        series: "Faith Series",
        type: "youtube",
        thumbnail: "https://img.youtube.com/vi/j2T9yXwoFC8/maxresdefault.jpg",
        description: "Discover the kind of faith that moves mountains and gets God's approval.",
        videoId: "j2T9yXwoFC8"
    },
    {
        id: 2,
        title: "Be the Example",
        preacher: "Apostle Olawale N. Sanni",
        date: "Recent",
        series: "Leadership",
        type: "upload", // Simulated admin upload
        thumbnail: "https://images.unsplash.com/photo-1516280440614-6697288d5d38?w=800&q=80",
        description: "Leading by example is the most powerful way to influence others for Christ. (Uploaded Video)",
        videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
    },
    // ... other static sermons
]

export default function SermonsPage() {
    const [playingId, setPlayingId] = useState<number | null>(null)
    const [sermons, setSermons] = useState(initialSermons)

    useState(() => {
        // Fetch uploaded sermons from localStorage
        const stored = localStorage.getItem('sermons')
        if (stored) {
            const uploadedSermons = JSON.parse(stored)
            // Merge uploaded sermons with initial ones, putting new uploads first
            setSermons([...uploadedSermons, ...initialSermons])
        }
    })

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

                {/* Featured Latest Sermon (Large) */}
                <div className="mb-20 max-w-6xl mx-auto">
                    <Card className="border-none shadow-2xl overflow-hidden group rounded-[2rem] bg-[#140152]">
                        <div className="grid grid-cols-1 lg:grid-cols-2">
                            <div className="relative h-[300px] lg:h-[400px] overflow-hidden bg-black">
                                <iframe
                                    width="100%"
                                    height="100%"
                                    src={`https://www.youtube.com/embed/${sermons[0].videoId}`}
                                    title="YouTube video player"
                                    frameBorder="0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                    className="absolute inset-0 w-full h-full"
                                ></iframe>
                            </div>
                            <div className="p-8 lg:p-12 flex flex-col justify-center text-white">
                                <div className="flex items-center gap-2 text-[#f5bb00] text-sm font-bold uppercase tracking-widest mb-4">
                                    <span className="bg-[#f5bb00]/20 px-3 py-1 rounded-full">Featured</span>
                                    <span>{sermons[0].series}</span>
                                </div>
                                <h3 className="text-3xl lg:text-4xl font-black mb-4 leading-tight">{sermons[0].title}</h3>
                                <p className="text-white/70 text-lg mb-6 leading-relaxed line-clamp-3">
                                    {sermons[0].description}
                                </p>
                                <div className="flex items-center gap-6 text-sm font-medium text-white/60 mb-8">
                                    <div className="flex items-center gap-2">
                                        <Users className="w-4 h-4" />
                                        {sermons[0].preacher}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-4 h-4" />
                                        {sermons[0].date}
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <PremiumButton href={`https://www.youtube.com/watch?v=${sermons[0].videoId}`} target="_blank">
                                        Watch on YouTube
                                    </PremiumButton>
                                    <Button variant="outline" className="border-white/20 text-white hover:bg-white/10 rounded-xl h-12 px-6">
                                        <Share2 className="w-5 h-5" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Sermon Grid */}
                {/* Sermon Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
                    {sermons.slice(1).map((sermon) => (
                        <Card key={sermon.id} className="border-none shadow-lg hover:shadow-2xl transition-all duration-300 group rounded-[1.5rem] overflow-hidden flex flex-col h-full bg-white">
                            <div className="relative h-56 bg-black">
                                {playingId === sermon.id ? (
                                    sermon.type === 'youtube' ? (
                                        <iframe
                                            width="100%"
                                            height="100%"
                                            src={`https://www.youtube.com/embed/${sermon.videoId}?autoplay=1`}
                                            title={sermon.title}
                                            frameBorder="0"
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                            allowFullScreen
                                            className="absolute inset-0 w-full h-full"
                                        ></iframe>
                                    ) : (
                                        <video
                                            controls
                                            autoPlay
                                            className="absolute inset-0 w-full h-full object-cover"
                                            src={sermon.videoUrl}
                                        >
                                            Your browser does not support the video tag.
                                        </video>
                                    )
                                ) : (
                                    <div
                                        className="relative h-full w-full cursor-pointer"
                                        onClick={() => setPlayingId(sermon.id)}
                                    >
                                        <div
                                            className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
                                            style={{ backgroundImage: `url(${sermon.thumbnail})` }}
                                        />
                                        <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors" />
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                                <PlayCircle className="w-8 h-8 text-white" />
                                            </div>
                                        </div>
                                        <div className="absolute bottom-4 left-4 text-white">
                                            <span className="bg-[#f5bb00] text-[#140152] text-xs font-bold px-3 py-1 rounded-full">
                                                {sermon.series}
                                            </span>
                                        </div>
                                        <div className="absolute top-4 right-4 text-white/90 bg-black/50 backdrop-blur-md px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            {sermon.type === 'upload' ? 'Uploaded' : 'YouTube'}
                                        </div>
                                    </div>
                                )}
                            </div>
                            <CardContent className="p-6 flex-grow">
                                <div className="flex items-center gap-2 text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">
                                    <Calendar className="w-3 h-3" />
                                    {sermon.date}
                                </div>
                                <h3 className="text-xl font-black text-[#140152] mb-3 leading-snug group-hover:text-[#f5bb00] transition-colors">
                                    {sermon.title}
                                </h3>
                                <p className="text-gray-600 text-sm line-clamp-2 leading-relaxed">
                                    {sermon.description}
                                </p>
                            </CardContent>
                            <CardFooter className="p-6 pt-0 mt-auto border-t border-gray-50 flex items-center justify-between">
                                <div className="text-sm font-bold text-[#140152]/70 flex items-center gap-2">
                                    <Users className="w-4 h-4 text-[#f5bb00]" />
                                    {sermon.preacher}
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-[#140152] hover:text-[#f5bb00] p-0 font-bold group/btn"
                                    onClick={() => setPlayingId(playingId === sermon.id ? null : sermon.id)}
                                >
                                    {playingId === sermon.id ? 'Stop' : 'Watch'} <ArrowRight className="w-4 h-4 ml-1 group-hover/btn:translate-x-1 transition-transform" />
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>

                <div className="mt-16 text-center">
                    <PremiumButton href="/sermons/archive">View All Sermons Archive</PremiumButton>
                </div>
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
        </>
    )
}
