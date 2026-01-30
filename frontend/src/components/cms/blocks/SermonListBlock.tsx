'use client'
import React, { useEffect, useState } from 'react';
import { Sermon, sermonApi } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { PlayCircle, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface SermonListBlockProps {
    data: {
        title?: string;
        count?: number;
    };
}

export default function SermonListBlock({ data }: SermonListBlockProps) {
    const { title = "Latest Sermons", count = 3 } = data;
    const [sermons, setSermons] = useState<Sermon[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSermons = async () => {
            try {
                // Fetch more than needed to filter for video
                const response = await sermonApi.getPublicSermons(undefined, count * 2);
                const videoSermons = response.sermons.filter(s => s.video_url).slice(0, count);
                setSermons(videoSermons);
            } catch (error) {
                console.error("Failed to fetch sermons", error);
            } finally {
                setLoading(false);
            }
        };
        fetchSermons();
    }, [count]);

    const extractYoutubeId = (url: string): string | null => {
        const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
        return match ? match[1] : null;
    };

    if (loading) {
        return (
            <section className="py-24 bg-[#140152]">
                <div className="container px-4 mx-auto">
                    <h2 className="text-3xl md:text-5xl font-black text-[#f5bb00] mb-12 text-center">{title}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="bg-white/5 rounded-2xl h-80 animate-pulse" />
                        ))}
                    </div>
                </div>
            </section>
        );
    }

    if (sermons.length === 0) return null;

    return (
        <section className="py-24 bg-[#140152]">
            <div className="container px-4 mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-end mb-12">
                    <div className="max-w-2xl">
                        <h2 className="text-3xl md:text-5xl font-black text-[#f5bb00] mb-4">{title}</h2>
                        <p className="text-[#fff]/60 text-lg">Dive into the Word. Watch our latest messages and series.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {sermons.map((sermon) => (
                        <motion.div
                            key={sermon.id}
                            whileHover={{ y: -10 }}
                            transition={{ type: "spring", stiffness: 300 }}
                        >
                            <Card className="overflow-hidden border-none shadow-xl hover:shadow-2xl transition-shadow bg-white h-full flex flex-col">
                                <div className="relative aspect-video bg-black">
                                    {sermon.video_url ? (
                                        <iframe
                                            width="100%"
                                            height="100%"
                                            src={`https://www.youtube.com/embed/${extractYoutubeId(sermon.video_url)}`}
                                            title={sermon.title}
                                            frameBorder="0"
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                            allowFullScreen
                                            className="absolute inset-0 w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-gray-200">
                                            <PlayCircle className="w-12 h-12 text-gray-400" />
                                        </div>
                                    )}
                                </div>
                                <CardContent className="p-6 flex-grow flex flex-col justify-between">
                                    <div>
                                        <span className="text-xs font-bold text-[#f5bb00] uppercase tracking-wider mb-2 block">
                                            {sermon.series || "Sunday Service"}
                                        </span>
                                        <h3 className="text-xl font-bold text-[#140152] mb-2 leading-tight line-clamp-2">{sermon.title}</h3>
                                        <p className="text-sm text-gray-500 mb-4 line-clamp-2">{sermon.description}</p>
                                    </div>
                                    <div className="flex items-center text-[#140152] font-semibold text-sm group cursor-pointer">
                                        Watch Now <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
