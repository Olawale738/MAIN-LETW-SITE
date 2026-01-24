'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Music, Settings, Folder, Upload, Play, Eye } from 'lucide-react'
import Link from 'next/link'
import { alterSoundApi, AudioCategory, AudioTrack } from '@/lib/api'

export default function AlterSoundAdminPage() {
    const [categories, setCategories] = useState<AudioCategory[]>([])
    const [tracks, setTracks] = useState<AudioTrack[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [categoriesData, tracksData] = await Promise.all([
                    alterSoundApi.getAllCategories(),
                    alterSoundApi.getAllTracks()
                ])
                setCategories(categoriesData)
                setTracks(tracksData)
            } catch (error) {
                console.error('Failed to load Alter Sound data:', error)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [])

    const activeCategories = categories.filter(c => c.is_active).length
    const activeTracks = tracks.filter(t => t.is_active).length
    const featuredTracks = tracks.filter(t => t.is_featured).length
    const totalPlays = tracks.reduce((sum, t) => sum + t.play_count, 0)

    return (
        <div className="p-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-[#140152] mb-2">Alter Sound Management</h1>
                <p className="text-gray-600">Manage audio worship content, categories, and page settings</p>
            </div>

            {/* Stats Overview */}
            <div className="grid md:grid-cols-4 gap-6 mb-8">
                <Card className="p-6 border-l-4 border-l-[#140152]">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 mb-1">Total Tracks</p>
                            <p className="text-3xl font-bold text-[#140152]">{tracks.length}</p>
                            <p className="text-xs text-gray-500 mt-1">{activeTracks} active</p>
                        </div>
                        <Music className="w-12 h-12 text-[#f5bb00]" />
                    </div>
                </Card>

                <Card className="p-6 border-l-4 border-l-[#f5bb00]">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 mb-1">Categories</p>
                            <p className="text-3xl font-bold text-[#140152]">{categories.length}</p>
                            <p className="text-xs text-gray-500 mt-1">{activeCategories} active</p>
                        </div>
                        <Folder className="w-12 h-12 text-[#f5bb00]" />
                    </div>
                </Card>

                <Card className="p-6 border-l-4 border-l-purple-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 mb-1">Featured</p>
                            <p className="text-3xl font-bold text-[#140152]">{featuredTracks}</p>
                            <p className="text-xs text-gray-500 mt-1">tracks featured</p>
                        </div>
                        <Eye className="w-12 h-12 text-purple-500" />
                    </div>
                </Card>

                <Card className="p-6 border-l-4 border-l-green-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 mb-1">Total Plays</p>
                            <p className="text-3xl font-bold text-[#140152]">{totalPlays.toLocaleString()}</p>
                            <p className="text-xs text-gray-500 mt-1">all time</p>
                        </div>
                        <Play className="w-12 h-12 text-green-500" />
                    </div>
                </Card>
            </div>

            {/* Quick Actions */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <Link href="/admin/alter-sound/tracks">
                    <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer border-2 border-transparent hover:border-[#140152]">
                        <Upload className="w-10 h-10 text-[#140152] mb-4" />
                        <h3 className="font-bold text-lg text-[#140152] mb-2">Manage Tracks</h3>
                        <p className="text-sm text-gray-600">Upload and manage audio tracks</p>
                    </Card>
                </Link>

                <Link href="/admin/alter-sound/categories">
                    <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer border-2 border-transparent hover:border-[#f5bb00]">
                        <Folder className="w-10 h-10 text-[#f5bb00] mb-4" />
                        <h3 className="font-bold text-lg text-[#140152] mb-2">Categories</h3>
                        <p className="text-sm text-gray-600">Organize audio by categories</p>
                    </Card>
                </Link>

                <Link href="/admin/alter-sound/settings">
                    <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer border-2 border-transparent hover:border-purple-500">
                        <Settings className="w-10 h-10 text-purple-500 mb-4" />
                        <h3 className="font-bold text-lg text-[#140152] mb-2">Page Settings</h3>
                        <p className="text-sm text-gray-600">Customize page content</p>
                    </Card>
                </Link>

                <Link href="/services/alter-sound" target="_blank">
                    <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer border-2 border-transparent hover:border-green-500">
                        <Eye className="w-10 h-10 text-green-500 mb-4" />
                        <h3 className="font-bold text-lg text-[#140152] mb-2">View Page</h3>
                        <p className="text-sm text-gray-600">See public Alter Sound page</p>
                    </Card>
                </Link>
            </div>

            {/* Recent Tracks */}
            <Card className="p-6">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-[#140152]">Recent Tracks</h2>
                    <Link href="/admin/alter-sound/tracks">
                        <Button variant="outline" size="sm">View All</Button>
                    </Link>
                </div>
                <div className="space-y-4">
                    {tracks.slice(0, 5).map((track) => (
                        <div key={track.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-4">
                                <Music className="w-8 h-8 text-[#140152]" />
                                <div>
                                    <p className="font-semibold text-[#140152]">{track.title}</p>
                                    <p className="text-sm text-gray-600">{track.artist || 'Unknown Artist'} • {track.category.name}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="text-right">
                                    <p className="text-sm text-gray-600">{track.play_count} plays</p>
                                    {track.is_featured && <span className="text-xs text-purple-600 font-semibold">Featured</span>}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </Card>
        </div>
    )
}

