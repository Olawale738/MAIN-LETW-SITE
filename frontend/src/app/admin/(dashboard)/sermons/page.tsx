'use client'
import React, { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import {
    Plus, Trash2, Loader2, Edit2, Video, Search, Eye, EyeOff,
    Star, StarOff, FileText, Upload, X, Calendar, User, Link as LinkIcon
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
    const [documentUrl, setDocumentUrl] = useState('')
    const [isFeatured, setIsFeatured] = useState(false)
    const [isPublished, setIsPublished] = useState(true)
    const [documentFile, setDocumentFile] = useState<File | null>(null)
    const [thumbnailFile, setThumbnailFile] = useState<File | null>(null)

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
        setDocumentUrl('')
        setIsFeatured(false)
        setIsPublished(true)
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
        setDocumentUrl(sermon.document_url || '')
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
                document_url: documentUrl || undefined,
                is_featured: isFeatured,
                is_published: isPublished,
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

    const filteredSermons = sermons.filter(s =>
        s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.preacher.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.series && s.series.toLowerCase().includes(searchQuery.toLowerCase()))
    )

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-[#140152]">Sermons & Books</h1>
                    <p className="text-gray-500 text-sm">Manage your video library and books (PDF)</p>
                </div>
                <Button
                    onClick={() => { resetForm(); setShowForm(true) }}
                    className="bg-[#f5bb00] text-[#140152] hover:bg-[#d9a600] font-bold"
                >
                    <Plus className="w-4 h-4 mr-2" /> Add Content
                </Button>
            </div>

            {error && <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}
            {success && <div className="p-3 bg-green-50 text-green-700 rounded-lg text-sm">{success}</div>}

            {/* Create/Edit Form */}
            {showForm && (
                <Card className="border-2 border-purple-200 shadow-lg">
                    <CardHeader className="pb-3">
                        <div className="flex justify-between items-center">
                            <CardTitle>{editingSermon ? 'Edit Content' : 'Add New Content'}</CardTitle>
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
                                        placeholder="e.g., Walking in Victory or Book Title"
                                        className="w-full p-2 border rounded-lg"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Preacher / Author *</label>
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
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Series (Optional)</label>
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
                                    placeholder="Brief summary..."
                                    className="w-full p-2 border rounded-lg"
                                    rows={2}
                                />
                            </div>

                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">YouTube URL</label>
                                    <input
                                        value={videoUrl}
                                        onChange={e => setVideoUrl(e.target.value)}
                                        placeholder="https://youtube.com/watch?v=..."
                                        className="w-full p-2 border rounded-lg"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Document URL (PDF)</label>
                                    <input
                                        value={documentUrl}
                                        onChange={e => setDocumentUrl(e.target.value)}
                                        placeholder="https://example.com/book.pdf"
                                        className="w-full p-2 border rounded-lg"
                                    />
                                </div>
                            </div>

                            {/* File Uploads */}
                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Or Upload Document (PDF)</label>
                                    <div
                                        className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-blue-400 transition-colors bg-gray-50 hover:bg-white"
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
                                            <span className="text-green-600 text-sm font-medium">{documentFile.name}</span>
                                        ) : editingSermon?.has_document ? (
                                            <span className="text-blue-600 text-sm font-medium">{editingSermon.document_filename}</span>
                                        ) : (
                                            <span className="text-gray-400 text-sm flex items-center justify-center gap-2">
                                                <Upload className="w-5 h-5" />
                                                <span>Choose PDF File</span>
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Thumbnail (Image)</label>
                                    <div
                                        className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-yellow-400 transition-colors bg-gray-50 hover:bg-white"
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
                                            <span className="text-green-600 text-sm font-medium">{thumbnailFile.name}</span>
                                        ) : (
                                            <span className="text-gray-400 text-sm flex items-center justify-center gap-2">
                                                <Upload className="w-5 h-5" />
                                                <span>Choose Image</span>
                                            </span>
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
                                        className="w-4 h-4 text-purple-600 rounded"
                                    />
                                    <span className="text-sm font-medium text-gray-700">Featured</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={isPublished}
                                        onChange={e => setIsPublished(e.target.checked)}
                                        className="w-4 h-4 text-purple-600 rounded"
                                    />
                                    <span className="text-sm font-medium text-gray-700">Published</span>
                                </label>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <Button type="submit" disabled={submitting} className="bg-[#140152] hover:bg-[#1d0175]">
                                    {submitting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                                    {editingSermon ? 'Update Content' : 'Create Content'}
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
                            placeholder="Search content..."
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
                            {searchQuery ? 'No content matches your search' : 'No content yet. Add your first video or book!'}
                        </div>
                    ) : (
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-gray-500 uppercase bg-gray-50/50">
                                <tr>
                                    <th className="px-6 py-3">Title</th>
                                    <th className="px-6 py-3">Type</th>
                                    <th className="px-6 py-3">Author/Preacher</th>
                                    <th className="px-6 py-3">Date</th>
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
                                                        <div className="text-[#140152]">
                                                            {sermon.video_url ? <Video className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="font-medium text-[#140152]">{sermon.title}</div>
                                                    {sermon.series && <div className="text-xs text-gray-500">{sermon.series}</div>}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex gap-1">
                                                {sermon.video_url && (
                                                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-600 flex items-center gap-1">
                                                        <Video className="w-3 h-3" /> Video
                                                    </span>
                                                )}
                                                {(sermon.has_document || sermon.document_url) && (
                                                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-600 flex items-center gap-1">
                                                        <FileText className="w-3 h-3" /> Book
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">{sermon.preacher}</td>
                                        <td className="px-6 py-4 text-gray-500">{sermon.sermon_date}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex gap-1 items-center">
                                                {sermon.is_featured && <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />}
                                                {sermon.is_published ? (
                                                    <span className="text-green-600 text-xs font-bold">Published</span>
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
