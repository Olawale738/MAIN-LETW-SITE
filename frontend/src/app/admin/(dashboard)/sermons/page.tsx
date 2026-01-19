'use client'
import React, { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import {
    Plus, Trash2, Loader2, Edit2, Video, Search, Eye, EyeOff,
    Star, StarOff, Music, FileText, Upload, X, Calendar, User
} from 'lucide-react'
import { sermonApi, Sermon, SermonCreateData } from '@/lib/api'

export default function AdminSermonsPage() {
    const [sermons, setSermons] = useState<Sermon[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)
    const [searchQuery, setSearchQuery] = useState('')

    // Form state
    const [showForm, setShowForm] = useState(false)
    const [editingSermon, setEditingSermon] = useState<Sermon | null>(null)
    const [submitting, setSubmitting] = useState(false)

    // Form fields
    const [title, setTitle] = useState('')
    const [preacher, setPreacher] = useState('')
    const [sermonDate, setSermonDate] = useState('')
    const [description, setDescription] = useState('')
    const [series, setSeries] = useState('')
    const [videoUrl, setVideoUrl] = useState('')
    const [isFeatured, setIsFeatured] = useState(false)
    const [isPublished, setIsPublished] = useState(true)
    const [audioFile, setAudioFile] = useState<File | null>(null)
    const [documentFile, setDocumentFile] = useState<File | null>(null)
    const [thumbnailFile, setThumbnailFile] = useState<File | null>(null)

    const audioInputRef = useRef<HTMLInputElement>(null)
    const documentInputRef = useRef<HTMLInputElement>(null)
    const thumbnailInputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        loadSermons()
    }, [])

    useEffect(() => {
        if (error || success) {
            const timer = setTimeout(() => {
                setError(null)
                setSuccess(null)
            }, 5000)
            return () => clearTimeout(timer)
        }
    }, [error, success])

    const loadSermons = async () => {
        try {
            setLoading(true)
            const data = await sermonApi.getAllSermons(true)
            setSermons(data.sermons)
        } catch (err: any) {
            setError(err.message || 'Failed to load sermons')
        } finally {
            setLoading(false)
        }
    }

    const resetForm = () => {
        setTitle('')
        setPreacher('')
        setSermonDate('')
        setDescription('')
        setSeries('')
        setVideoUrl('')
        setIsFeatured(false)
        setIsPublished(true)
        setAudioFile(null)
        setDocumentFile(null)
        setThumbnailFile(null)
        setEditingSermon(null)
        setShowForm(false)
    }

    const handleEdit = (sermon: Sermon) => {
        setEditingSermon(sermon)
        setTitle(sermon.title)
        setPreacher(sermon.preacher)
        setSermonDate(sermon.sermon_date)
        setDescription(sermon.description || '')
        setSeries(sermon.series || '')
        setVideoUrl(sermon.video_url || '')
        setIsFeatured(sermon.is_featured)
        setIsPublished(sermon.is_published)
        setShowForm(true)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        setSubmitting(true)

        try {
            const data: SermonCreateData = {
                title,
                preacher,
                sermon_date: sermonDate,
                description: description || undefined,
                series: series || undefined,
                video_url: videoUrl || undefined,
                is_featured: isFeatured,
                is_published: isPublished,
                audio: audioFile || undefined,
                document: documentFile || undefined,
                thumbnail: thumbnailFile || undefined,
            }

            if (editingSermon) {
                await sermonApi.updateSermon(editingSermon.id, data)
                setSuccess('Sermon updated successfully!')
            } else {
                await sermonApi.createSermon(data)
                setSuccess('Sermon created successfully!')
            }

            resetForm()
            await loadSermons()
        } catch (err: any) {
            setError(err.message || 'Failed to save sermon')
        } finally {
            setSubmitting(false)
        }
    }

    const handleDelete = async (sermonId: string) => {
        if (!confirm('Delete this sermon? This cannot be undone.')) return
        try {
            await sermonApi.deleteSermon(sermonId)
            setSuccess('Sermon deleted')
            await loadSermons()
        } catch (err: any) {
            setError(err.message || 'Failed to delete')
        }
    }

    const toggleFeatured = async (sermon: Sermon) => {
        try {
            await sermonApi.updateSermon(sermon.id, { is_featured: !sermon.is_featured })
            await loadSermons()
        } catch (err: any) {
            setError(err.message || 'Failed to update')
        }
    }

    const togglePublished = async (sermon: Sermon) => {
        try {
            await sermonApi.updateSermon(sermon.id, { is_published: !sermon.is_published })
            setSuccess(sermon.is_published ? 'Sermon hidden' : 'Sermon published')
            await loadSermons()
        } catch (err: any) {
            setError(err.message || 'Failed to update')
        }
    }

    const formatFileSize = (bytes?: number) => {
        if (!bytes) return ''
        if (bytes < 1024) return `${bytes} B`
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    }

    const filteredSermons = sermons.filter(s =>
        s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.preacher.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.series && s.series.toLowerCase().includes(searchQuery.toLowerCase()))
    )

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-[#140152]">Sermons & Messages</h1>
                    <p className="text-gray-500 text-sm">Manage your video library, audio messages, and documents</p>
                </div>
                <Button
                    onClick={() => { resetForm(); setShowForm(true) }}
                    className="bg-[#f5bb00] text-[#140152] hover:bg-[#d9a600] font-bold"
                >
                    <Plus className="w-4 h-4 mr-2" /> Add Sermon
                </Button>
            </div>

            {error && <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}
            {success && <div className="p-3 bg-green-50 text-green-700 rounded-lg text-sm">{success}</div>}

            {/* Create/Edit Form */}
            {showForm && (
                <Card className="border-2 border-purple-200 shadow-lg">
                    <CardHeader className="pb-3">
                        <div className="flex justify-between items-center">
                            <CardTitle>{editingSermon ? 'Edit Sermon' : 'Add New Sermon'}</CardTitle>
                            <Button variant="ghost" size="sm" onClick={resetForm}>
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                                    <input
                                        value={title}
                                        onChange={e => setTitle(e.target.value)}
                                        placeholder="e.g., Walking in Victory"
                                        className="w-full p-2 border rounded-lg"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Preacher *</label>
                                    <input
                                        value={preacher}
                                        onChange={e => setPreacher(e.target.value)}
                                        placeholder="e.g., Ps. Johnson O."
                                        className="w-full p-2 border rounded-lg"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                                    <input
                                        type="date"
                                        value={sermonDate}
                                        onChange={e => setSermonDate(e.target.value)}
                                        className="w-full p-2 border rounded-lg"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Series</label>
                                    <input
                                        value={series}
                                        onChange={e => setSeries(e.target.value)}
                                        placeholder="e.g., Faith Series"
                                        className="w-full p-2 border rounded-lg"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <textarea
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                    placeholder="Brief summary of the message..."
                                    className="w-full p-2 border rounded-lg"
                                    rows={2}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">YouTube URL</label>
                                <input
                                    value={videoUrl}
                                    onChange={e => setVideoUrl(e.target.value)}
                                    placeholder="https://youtube.com/watch?v=..."
                                    className="w-full p-2 border rounded-lg"
                                />
                            </div>

                            {/* File Uploads */}
                            <div className="grid md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Audio (MP3)</label>
                                    <div
                                        className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-purple-400 transition-colors"
                                        onClick={() => audioInputRef.current?.click()}
                                    >
                                        <input
                                            ref={audioInputRef}
                                            type="file"
                                            accept="audio/*"
                                            className="hidden"
                                            onChange={e => setAudioFile(e.target.files?.[0] || null)}
                                        />
                                        {audioFile ? (
                                            <span className="text-green-600 text-sm">{audioFile.name}</span>
                                        ) : editingSermon?.has_audio ? (
                                            <span className="text-blue-600 text-sm">{editingSermon.audio_filename}</span>
                                        ) : (
                                            <span className="text-gray-400 text-sm"><Music className="w-5 h-5 inline mr-1" />Upload Audio</span>
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Document (PDF)</label>
                                    <div
                                        className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-blue-400 transition-colors"
                                        onClick={() => documentInputRef.current?.click()}
                                    >
                                        <input
                                            ref={documentInputRef}
                                            type="file"
                                            accept=".pdf,.doc,.docx"
                                            className="hidden"
                                            onChange={e => setDocumentFile(e.target.files?.[0] || null)}
                                        />
                                        {documentFile ? (
                                            <span className="text-green-600 text-sm">{documentFile.name}</span>
                                        ) : editingSermon?.has_document ? (
                                            <span className="text-blue-600 text-sm">{editingSermon.document_filename}</span>
                                        ) : (
                                            <span className="text-gray-400 text-sm"><FileText className="w-5 h-5 inline mr-1" />Upload Doc</span>
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Thumbnail (Image)</label>
                                    <div
                                        className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-yellow-400 transition-colors"
                                        onClick={() => thumbnailInputRef.current?.click()}
                                    >
                                        <input
                                            ref={thumbnailInputRef}
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={e => setThumbnailFile(e.target.files?.[0] || null)}
                                        />
                                        {thumbnailFile ? (
                                            <span className="text-green-600 text-sm">{thumbnailFile.name}</span>
                                        ) : (
                                            <span className="text-gray-400 text-sm"><Upload className="w-5 h-5 inline mr-1" />Thumbnail</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-4 items-center">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={isFeatured}
                                        onChange={e => setIsFeatured(e.target.checked)}
                                        className="w-4 h-4"
                                    />
                                    <span className="text-sm">Featured</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={isPublished}
                                        onChange={e => setIsPublished(e.target.checked)}
                                        className="w-4 h-4"
                                    />
                                    <span className="text-sm">Published</span>
                                </label>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <Button type="submit" disabled={submitting} className="bg-[#140152] hover:bg-[#1d0175]">
                                    {submitting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                                    {editingSermon ? 'Update Sermon' : 'Create Sermon'}
                                </Button>
                                <Button type="button" variant="outline" onClick={resetForm}>Cancel</Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            {/* Sermons List */}
            <Card>
                <CardHeader className="border-b pb-4">
                    <div className="flex items-center space-x-2 bg-gray-50 p-2 rounded-lg w-fit">
                        <Search className="w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search sermons..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="bg-transparent border-none outline-none text-sm w-64"
                        />
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-purple-500" /></div>
                    ) : filteredSermons.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            {searchQuery ? 'No sermons match your search' : 'No sermons yet. Add your first one!'}
                        </div>
                    ) : (
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-gray-500 uppercase bg-gray-50/50">
                                <tr>
                                    <th className="px-6 py-3">Title</th>
                                    <th className="px-6 py-3">Preacher</th>
                                    <th className="px-6 py-3">Date</th>
                                    <th className="px-6 py-3">Media</th>
                                    <th className="px-6 py-3">Status</th>
                                    <th className="px-6 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredSermons.map((sermon) => (
                                    <tr key={sermon.id} className={`bg-white border-b hover:bg-gray-50 transition-colors ${!sermon.is_published ? 'opacity-60' : ''}`}>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-[#140152]/10 flex items-center justify-center overflow-hidden">
                                                    {sermon.video_thumbnail ? (
                                                        <img src={sermon.video_thumbnail} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <Video className="w-4 h-4 text-[#140152]" />
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="font-medium text-[#140152]">{sermon.title}</div>
                                                    {sermon.series && <div className="text-xs text-gray-500">{sermon.series}</div>}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">{sermon.preacher}</td>
                                        <td className="px-6 py-4 text-gray-500">{sermon.sermon_date}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex gap-1">
                                                {sermon.video_url && (
                                                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-600">Video</span>
                                                )}
                                                {sermon.has_audio && (
                                                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-600">Audio</span>
                                                )}
                                                {sermon.has_document && (
                                                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-600">Doc</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex gap-1 items-center">
                                                {sermon.is_featured && <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />}
                                                {sermon.is_published ? (
                                                    <span className="text-green-600 text-xs">Published</span>
                                                ) : (
                                                    <span className="text-gray-400 text-xs">Draft</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-1">
                                                <Button variant="ghost" size="sm" onClick={() => toggleFeatured(sermon)} title="Toggle Featured">
                                                    {sermon.is_featured ? <StarOff className="w-4 h-4 text-yellow-500" /> : <Star className="w-4 h-4 text-gray-400" />}
                                                </Button>
                                                <Button variant="ghost" size="sm" onClick={() => togglePublished(sermon)} title="Toggle Published">
                                                    {sermon.is_published ? <Eye className="w-4 h-4 text-green-500" /> : <EyeOff className="w-4 h-4 text-gray-400" />}
                                                </Button>
                                                <Button variant="ghost" size="sm" onClick={() => handleEdit(sermon)}>
                                                    <Edit2 className="w-4 h-4 text-blue-500" />
                                                </Button>
                                                <Button variant="ghost" size="sm" onClick={() => handleDelete(sermon.id)}>
                                                    <Trash2 className="w-4 h-4 text-red-500" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
