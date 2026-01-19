'use client'
import React, { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
    Plus, Trash2, Loader2, Edit2, ChevronDown, ChevronUp,
    Youtube, FileText, Upload, Eye, EyeOff, X, Save, AlertCircle
} from 'lucide-react'
import {
    leadershipApi, LeadershipModule, LeadershipContent,
    ModuleCreate, VideoContentCreate
} from '@/lib/api'

export default function LeadershipAdminPage() {
    const [modules, setModules] = useState<LeadershipModule[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)

    // Module form state
    const [showModuleForm, setShowModuleForm] = useState(false)
    const [editingModule, setEditingModule] = useState<LeadershipModule | null>(null)
    const [moduleForm, setModuleForm] = useState<ModuleCreate>({
        title: '', description: '', order_index: 0, is_published: false
    })
    const [submittingModule, setSubmittingModule] = useState(false)

    // Content form state
    const [addingContentTo, setAddingContentTo] = useState<string | null>(null)
    const [contentType, setContentType] = useState<'video' | 'document'>('video')
    const [videoForm, setVideoForm] = useState({ title: '', youtube_url: '' })
    const [docForm, setDocForm] = useState({ title: '' })
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [submittingContent, setSubmittingContent] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Expanded modules
    const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set())

    useEffect(() => {
        loadModules()
    }, [])

    // Clear messages after 5 seconds
    useEffect(() => {
        if (error || success) {
            const timer = setTimeout(() => {
                setError(null)
                setSuccess(null)
            }, 5000)
            return () => clearTimeout(timer)
        }
    }, [error, success])

    const loadModules = async () => {
        try {
            setLoading(true)
            const data = await leadershipApi.getModules(true)
            setModules(data.modules)
        } catch (err: any) {
            setError(err.message || 'Failed to load modules')
        } finally {
            setLoading(false)
        }
    }

    const handleModuleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        setSubmittingModule(true)

        try {
            if (editingModule) {
                await leadershipApi.updateModule(editingModule.id, moduleForm)
                setSuccess('Module updated!')
            } else {
                const newModule = await leadershipApi.createModule(moduleForm)
                setSuccess('Module created! Now add videos or documents to it.')
                // Auto-expand the new module
                setExpandedModules(new Set([newModule.id]))
            }
            resetModuleForm()
            await loadModules()
        } catch (err: any) {
            setError(err.message || 'Failed to save module')
        } finally {
            setSubmittingModule(false)
        }
    }

    const resetModuleForm = () => {
        setModuleForm({ title: '', description: '', order_index: modules.length, is_published: false })
        setEditingModule(null)
        setShowModuleForm(false)
    }

    const handleEditModule = (module: LeadershipModule) => {
        setEditingModule(module)
        setModuleForm({
            title: module.title,
            description: module.description || '',
            order_index: module.order_index,
            is_published: module.is_published
        })
        setShowModuleForm(true)
    }

    const handleDeleteModule = async (moduleId: string) => {
        if (!confirm('Delete this module and all its content? This cannot be undone.')) return
        try {
            await leadershipApi.deleteModule(moduleId)
            setSuccess('Module deleted')
            await loadModules()
        } catch (err: any) {
            setError(err.message || 'Failed to delete module')
        }
    }

    const togglePublish = async (module: LeadershipModule) => {
        try {
            await leadershipApi.updateModule(module.id, { is_published: !module.is_published })
            setSuccess(module.is_published ? 'Module hidden from users' : 'Module published!')
            await loadModules()
        } catch (err: any) {
            setError(err.message || 'Failed to update')
        }
    }

    const handleAddContent = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!addingContentTo) return

        setError(null)
        setSubmittingContent(true)

        try {
            if (contentType === 'video') {
                if (!videoForm.youtube_url.includes('youtube.com') && !videoForm.youtube_url.includes('youtu.be')) {
                    setError('Please enter a valid YouTube URL')
                    setSubmittingContent(false)
                    return
                }
                await leadershipApi.addVideo(addingContentTo, {
                    title: videoForm.title,
                    youtube_url: videoForm.youtube_url,
                    order_index: 0
                })
                setSuccess('Video added!')
            } else {
                if (!selectedFile) {
                    setError('Please select a file to upload')
                    setSubmittingContent(false)
                    return
                }
                await leadershipApi.addDocument(addingContentTo, selectedFile, docForm.title || selectedFile.name)
                setSuccess('Document uploaded!')
            }
            resetContentForm()
            await loadModules()
        } catch (err: any) {
            setError(err.message || 'Failed to add content')
        } finally {
            setSubmittingContent(false)
        }
    }

    const resetContentForm = () => {
        setAddingContentTo(null)
        setVideoForm({ title: '', youtube_url: '' })
        setDocForm({ title: '' })
        setSelectedFile(null)
        setContentType('video')
    }

    const handleDeleteContent = async (contentId: string) => {
        if (!confirm('Delete this content?')) return
        try {
            await leadershipApi.deleteContent(contentId)
            setSuccess('Content deleted')
            await loadModules()
        } catch (err: any) {
            setError(err.message || 'Failed to delete')
        }
    }

    const toggleExpand = (moduleId: string) => {
        const newExpanded = new Set(expandedModules)
        if (newExpanded.has(moduleId)) {
            newExpanded.delete(moduleId)
        } else {
            newExpanded.add(moduleId)
        }
        setExpandedModules(newExpanded)
    }

    const formatFileSize = (bytes?: number) => {
        if (!bytes) return ''
        if (bytes < 1024) return `${bytes} B`
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-[#140152]">Leadership Training</h1>
                    <p className="text-gray-500 text-sm">Create modules, add YouTube videos and upload documents</p>
                </div>
                <Button
                    onClick={() => {
                        setModuleForm({ title: '', description: '', order_index: modules.length, is_published: false })
                        setShowModuleForm(true)
                    }}
                    className="bg-[#140152] hover:bg-[#1d0175] text-white"
                >
                    <Plus className="w-4 h-4 mr-2" /> New Module
                </Button>
            </div>

            {/* Messages */}
            {error && (
                <div className="p-3 bg-red-50 text-red-700 rounded-lg flex items-center gap-2 text-sm">
                    <AlertCircle className="w-4 h-4" /> {error}
                </div>
            )}
            {success && (
                <div className="p-3 bg-green-50 text-green-700 rounded-lg text-sm">{success}</div>
            )}

            {/* How it works - collapsed info */}
            <details className="bg-blue-50 rounded-lg p-4 text-sm">
                <summary className="cursor-pointer font-medium text-blue-800">How does this work?</summary>
                <div className="mt-3 text-blue-700 space-y-2">
                    <p><strong>Step 1:</strong> Create a module (e.g., "The Heart of a Servant")</p>
                    <p><strong>Step 2:</strong> Expand the module and click "Add Video" or "Add Document"</p>
                    <p><strong>Step 3:</strong> Publish the module to make it visible to users</p>
                </div>
            </details>

            {/* Module Form */}
            {showModuleForm && (
                <Card className="border-2 border-purple-300 shadow-lg">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg">{editingModule ? 'Edit Module' : 'Create New Module'}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleModuleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Module Title *</label>
                                <input
                                    placeholder="e.g., The Heart of a Servant"
                                    value={moduleForm.title}
                                    onChange={e => setModuleForm({ ...moduleForm, title: e.target.value })}
                                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <textarea
                                    placeholder="Brief description of what this module covers..."
                                    value={moduleForm.description}
                                    onChange={e => setModuleForm({ ...moduleForm, description: e.target.value })}
                                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-500"
                                    rows={2}
                                />
                            </div>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={moduleForm.is_published}
                                    onChange={e => setModuleForm({ ...moduleForm, is_published: e.target.checked })}
                                    className="w-4 h-4 rounded"
                                />
                                <span className="text-sm">Publish immediately (users can see it)</span>
                            </label>
                            <div className="flex gap-3 pt-2">
                                <Button type="submit" disabled={submittingModule} className="bg-purple-600 hover:bg-purple-700">
                                    {submittingModule ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                                    {editingModule ? 'Save Changes' : 'Create Module'}
                                </Button>
                                <Button type="button" variant="outline" onClick={resetModuleForm}>Cancel</Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            {/* Modules List */}
            {loading ? (
                <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-purple-500" /></div>
            ) : modules.length === 0 ? (
                <Card className="text-center py-12">
                    <p className="text-gray-500 mb-4">No modules yet</p>
                    <Button onClick={() => setShowModuleForm(true)} variant="outline">
                        <Plus className="w-4 h-4 mr-2" /> Create Your First Module
                    </Button>
                </Card>
            ) : (
                <div className="space-y-3">
                    {modules.map((module, index) => (
                        <Card key={module.id} className={`overflow-hidden ${!module.is_published ? 'border-dashed border-gray-300' : 'border-gray-200'}`}>
                            {/* Module Header */}
                            <div
                                className="p-4 flex items-center gap-3 cursor-pointer hover:bg-gray-50"
                                onClick={() => toggleExpand(module.id)}
                            >
                                <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold text-sm">
                                    {index + 1}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-semibold text-gray-800 truncate">{module.title}</h3>
                                        {!module.is_published && (
                                            <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded">Draft</span>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-500">{module.contents.length} items</p>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={(e) => { e.stopPropagation(); togglePublish(module) }}
                                        title={module.is_published ? 'Hide from users' : 'Publish'}
                                    >
                                        {module.is_published ? <Eye className="w-4 h-4 text-green-600" /> : <EyeOff className="w-4 h-4 text-gray-400" />}
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={(e) => { e.stopPropagation(); handleEditModule(module) }}
                                    >
                                        <Edit2 className="w-4 h-4 text-gray-500" />
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={(e) => { e.stopPropagation(); handleDeleteModule(module.id) }}
                                    >
                                        <Trash2 className="w-4 h-4 text-red-500" />
                                    </Button>
                                    {expandedModules.has(module.id) ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                                </div>
                            </div>

                            {/* Expanded Content */}
                            {expandedModules.has(module.id) && (
                                <div className="border-t bg-gray-50 p-4">
                                    {module.description && <p className="text-sm text-gray-600 mb-4">{module.description}</p>}

                                    {/* Content Items */}
                                    {module.contents.length > 0 && (
                                        <div className="space-y-2 mb-4">
                                            {module.contents.map(content => (
                                                <div key={content.id} className="flex items-center gap-3 p-3 bg-white rounded-lg border">
                                                    {content.content_type === 'video' ? (
                                                        <>
                                                            {content.youtube_thumbnail && (
                                                                <img src={content.youtube_thumbnail} alt="" className="w-16 h-10 object-cover rounded" />
                                                            )}
                                                            <Youtube className="w-5 h-5 text-red-500 flex-shrink-0" />
                                                        </>
                                                    ) : (
                                                        <FileText className="w-5 h-5 text-blue-500 flex-shrink-0" />
                                                    )}
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-medium text-sm truncate">{content.title}</p>
                                                        {content.file_name && (
                                                            <p className="text-xs text-gray-400">{content.file_name} ({formatFileSize(content.file_size)})</p>
                                                        )}
                                                    </div>
                                                    <Button size="sm" variant="ghost" onClick={() => handleDeleteContent(content.id)}>
                                                        <Trash2 className="w-4 h-4 text-red-400" />
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Add Content Section */}
                                    {addingContentTo === module.id ? (
                                        <div className="bg-white rounded-lg border-2 border-dashed border-purple-300 p-4">
                                            {/* Content Type Tabs */}
                                            <div className="flex gap-2 mb-4">
                                                <button
                                                    type="button"
                                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${contentType === 'video' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                                                    onClick={() => setContentType('video')}
                                                >
                                                    <Youtube className="w-4 h-4" /> YouTube Video
                                                </button>
                                                <button
                                                    type="button"
                                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${contentType === 'document' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                                                    onClick={() => setContentType('document')}
                                                >
                                                    <FileText className="w-4 h-4" /> Document
                                                </button>
                                            </div>

                                            <form onSubmit={handleAddContent} className="space-y-3">
                                                {contentType === 'video' ? (
                                                    <>
                                                        <input
                                                            placeholder="Video Title"
                                                            value={videoForm.title}
                                                            onChange={e => setVideoForm({ ...videoForm, title: e.target.value })}
                                                            className="w-full p-2 border rounded-lg text-sm"
                                                            required
                                                        />
                                                        <input
                                                            placeholder="YouTube URL (e.g., https://youtube.com/watch?v=...)"
                                                            value={videoForm.youtube_url}
                                                            onChange={e => setVideoForm({ ...videoForm, youtube_url: e.target.value })}
                                                            className="w-full p-2 border rounded-lg text-sm"
                                                            required
                                                        />
                                                    </>
                                                ) : (
                                                    <>
                                                        <input
                                                            placeholder="Document Title (optional)"
                                                            value={docForm.title}
                                                            onChange={e => setDocForm({ ...docForm, title: e.target.value })}
                                                            className="w-full p-2 border rounded-lg text-sm"
                                                        />
                                                        <div
                                                            className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
                                                            onClick={() => fileInputRef.current?.click()}
                                                        >
                                                            <input
                                                                ref={fileInputRef}
                                                                type="file"
                                                                accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt"
                                                                onChange={e => setSelectedFile(e.target.files?.[0] || null)}
                                                                className="hidden"
                                                            />
                                                            {selectedFile ? (
                                                                <div className="text-green-600">
                                                                    <FileText className="w-8 h-8 mx-auto mb-2" />
                                                                    <p className="font-medium">{selectedFile.name}</p>
                                                                    <p className="text-xs text-gray-500">{formatFileSize(selectedFile.size)}</p>
                                                                </div>
                                                            ) : (
                                                                <div className="text-gray-500">
                                                                    <Upload className="w-8 h-8 mx-auto mb-2" />
                                                                    <p>Click to upload PDF, DOC, PPT, etc.</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </>
                                                )}
                                                <div className="flex gap-2">
                                                    <Button type="submit" size="sm" disabled={submittingContent} className="bg-purple-600 hover:bg-purple-700">
                                                        {submittingContent ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
                                                        {contentType === 'video' ? 'Add Video' : 'Upload Document'}
                                                    </Button>
                                                    <Button type="button" size="sm" variant="outline" onClick={resetContentForm}>Cancel</Button>
                                                </div>
                                            </form>
                                        </div>
                                    ) : (
                                        <div className="flex gap-2">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => { setAddingContentTo(module.id); setContentType('video') }}
                                                className="text-red-600 border-red-200 hover:bg-red-50"
                                            >
                                                <Youtube className="w-4 h-4 mr-1" /> Add Video
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => { setAddingContentTo(module.id); setContentType('document') }}
                                                className="text-blue-600 border-blue-200 hover:bg-blue-50"
                                            >
                                                <Upload className="w-4 h-4 mr-1" /> Add Document
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
