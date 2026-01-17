'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Upload, Youtube, Video, Save } from 'lucide-react'
import Link from 'next/link'

export default function NewSermonPage() {
    const [videoType, setVideoType] = useState<'youtube' | 'upload'>('youtube')
    const [dragActive, setDragActive] = useState(false)

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true)
        } else if (e.type === "dragleave") {
            setDragActive(false)
        }
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center space-x-4">
                <Button asChild variant="ghost" size="icon">
                    <Link href="/admin/sermons"><ArrowLeft className="w-5 h-5" /></Link>
                </Button>
                <div>
                    <h1 className="text-3xl font-bold text-[#140152]">Add New Sermon</h1>
                    <p className="text-gray-500">Upload a new message or link to YouTube.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Form */}
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg text-[#140152]">Sermon Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Title</label>
                                <input type="text" className="w-full p-3 rounded-lg border border-gray-200 outline-none focus:border-[#f5bb00] transition-colors" placeholder="e.g. Walking in Victory" />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">Preacher</label>
                                    <input type="text" className="w-full p-3 rounded-lg border border-gray-200 outline-none focus:border-[#f5bb00] transition-colors" placeholder="e.g. Ps. Johnson" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">Date</label>
                                    <input type="date" className="w-full p-3 rounded-lg border border-gray-200 outline-none focus:border-[#f5bb00] transition-colors" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Series (Optional)</label>
                                <input type="text" className="w-full p-3 rounded-lg border border-gray-200 outline-none focus:border-[#f5bb00] transition-colors" placeholder="e.g. Faith Series" />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Description</label>
                                <textarea className="w-full p-3 rounded-lg border border-gray-200 outline-none focus:border-[#f5bb00] transition-colors min-h-[120px]" placeholder="Brief summary of the message..." />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg text-[#140152]">Video Source</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Source Toggle */}
                            <div className="flex bg-gray-100 p-1 rounded-xl w-fit">
                                <button
                                    onClick={() => setVideoType('youtube')}
                                    className={`flex items-center space-x-2 px-6 py-2 rounded-lg text-sm font-bold transition-all ${videoType === 'youtube' ? 'bg-white shadow text-[#140152]' : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                >
                                    <Youtube className="w-4 h-4" />
                                    <span>YouTube Link</span>
                                </button>
                                <button
                                    onClick={() => setVideoType('upload')}
                                    className={`flex items-center space-x-2 px-6 py-2 rounded-lg text-sm font-bold transition-all ${videoType === 'upload' ? 'bg-white shadow text-[#140152]' : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                >
                                    <Upload className="w-4 h-4" />
                                    <span>Direct Upload</span>
                                </button>
                            </div>

                            {/* Dynamic Input Area */}
                            {videoType === 'youtube' ? (
                                <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                    <label className="text-sm font-medium text-gray-700">YouTube Video URL</label>
                                    <div className="flex space-x-2">
                                        <div className="flex-1 relative">
                                            <Video className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                            <input
                                                type="text"
                                                className="w-full pl-10 p-3 rounded-lg border border-gray-200 outline-none focus:border-[#f5bb00] transition-colors text-blue-600"
                                                placeholder="https://youtube.com/watch?v=..."
                                            />
                                        </div>
                                        <Button className="bg-[#140152] hover:bg-[#1e0275]">Check</Button>
                                    </div>
                                    <p className="text-xs text-gray-500">Paste the full YouTube URL to automatically fetch the thumbnail and duration.</p>
                                </div>
                            ) : (
                                <div
                                    className={`border-2 border-dashed rounded-xl p-10 text-center transition-colors animate-in fade-in slide-in-from-bottom-2 duration-300 ${dragActive ? 'border-[#f5bb00] bg-[#f5bb00]/5' : 'border-gray-200 hover:border-[#140152]/30'
                                        }`}
                                    onDragEnter={handleDrag}
                                    onDragLeave={handleDrag}
                                    onDragOver={handleDrag}
                                    onDrop={handleDrag}
                                >
                                    <div className="w-16 h-16 bg-[#140152]/5 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Upload className="w-8 h-8 text-[#140152]" />
                                    </div>
                                    <h3 className="text-lg font-bold text-[#140152]">Drag & Drop Video Here</h3>
                                    <p className="text-sm text-gray-500 mt-2 mb-6">or click to browse your files</p>
                                    <p className="text-xs text-gray-400">Supported formats: MP4, MOV, AVI (Max 2GB)</p>
                                    <Button variant="outline" className="mt-4 border-[#140152] text-[#140152]">Browse Files</Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <div className="flex justify-end space-x-4">
                        <Button variant="ghost" className="text-gray-500">Cancel</Button>
                        <Button className="bg-[#f5bb00] text-[#140152] hover:bg-[#d9a600] font-bold px-8">
                            <Save className="w-4 h-4 mr-2" />
                            Publish Sermon
                        </Button>
                    </div>
                </div>

                {/* Sidebar / Preview (Optional) */}
                <div className="space-y-6">
                    <Card className="bg-[#140152] text-white border-none">
                        <CardHeader>
                            <CardTitle className="text-lg">Publishing Tips</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 text-sm text-white/70">
                            <p>• Ensure your video has clear audio.</p>
                            <p>• YouTube links are recommended for better streaming performance.</p>
                            <p>• Direct uploads are great for exclusive content not meant for public YouTube channels.</p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
