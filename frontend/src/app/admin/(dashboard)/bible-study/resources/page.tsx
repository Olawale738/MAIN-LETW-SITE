'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { 
    FileText, Plus, Edit, Trash2, X, ArrowLeft, Star, Eye, EyeOff,
    Video, File, Headphones, Link as LinkIcon
} from 'lucide-react'
import { 
    bibleStudyApi, BibleStudyResource, BibleStudyResourceCreate
} from '@/lib/api'
import { useToast } from '@/components/ui/toast'
import Link from 'next/link'

export default function BibleStudyResourcesAdmin() {
    const { showToast, ToastComponent } = useToast()
    const [resources, setResources] = useState<BibleStudyResource[]>([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [editingResource, setEditingResource] = useState<BibleStudyResource | null>(null)
    const [formData, setFormData] = useState<BibleStudyResourceCreate>({
        title: '',
        description: '',
        resource_type: 'article',
        resource_url: '',
        category: '',
        is_featured: false,
        is_active: true,
        order_index: 0
    })

    useEffect(() => {
        fetchResources()
    }, [])

    const fetchResources = async () => {
        try {
            const data = await bibleStudyApi.getAllResources()
            setResources(data.sort((a, b) => a.order_index - b.order_index))
        } catch (error) {
            console.error('Failed to fetch resources:', error)
            showToast('Failed to load resources', 'error')
        } finally {
            setLoading(false)
        }
    }

    const handleOpenModal = (resource?: BibleStudyResource) => {
        if (resource) {
            setEditingResource(resource)
            setFormData({
                title: resource.title,
                description: resource.description || '',
                resource_type: resource.resource_type,
                resource_url: resource.resource_url || '',
                category: resource.category || '',
                is_featured: resource.is_featured,
                is_active: resource.is_active,
                order_index: resource.order_index
            })
        } else {
            setEditingResource(null)
            setFormData({
                title: '',
                description: '',
                resource_type: 'article',
                resource_url: '',
                category: '',
                is_featured: false,
                is_active: true,
                order_index: resources.length
            })
        }
        setShowModal(true)
    }

    const handleCloseModal = () => {
        setShowModal(false)
        setEditingResource(null)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        
        try {
            if (editingResource) {
                await bibleStudyApi.updateResource(editingResource.id, formData)
                showToast('Resource updated successfully!', 'success')
            } else {
                await bibleStudyApi.createResource(formData)
                showToast('Resource created successfully!', 'success')
            }
            handleCloseModal()
            await fetchResources()
        } catch (error: any) {
            console.error('Failed to save resource:', error)
            showToast(error.message || 'Failed to save resource', 'error')
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this resource?')) {
            return
        }

        try {
            await bibleStudyApi.deleteResource(id)
            showToast('Resource deleted successfully!', 'success')
            await fetchResources()
        } catch (error: any) {
            console.error('Failed to delete resource:', error)
            showToast(error.message || 'Failed to delete resource', 'error')
        }
    }

    const getResourceIcon = (type: string) => {
        switch (type.toLowerCase()) {
            case 'video':
                return <Video className="w-6 h-6 text-[#f5bb00]" />
            case 'audio':
                return <Headphones className="w-6 h-6 text-[#f5bb00]" />
            case 'pdf':
                return <File className="w-6 h-6 text-[#f5bb00]" />
            default:
                return <FileText className="w-6 h-6 text-[#f5bb00]" />
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
                <FileText className="w-12 h-12 animate-pulse text-[#140152]" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-neutral-50 p-8">
            {ToastComponent()}
            
            {/* Header */}
            <div className="mb-8">
                <Link href="/admin">
                    <Button variant="ghost" className="mb-4 text-[#140152] hover:text-[#f5bb00]">
                        <ArrowLeft className="mr-2 w-4 h-4" />
                        Back to Admin
                    </Button>
                </Link>
                
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-black text-[#140152] mb-2">Bible Study Resources</h1>
                        <p className="text-gray-600">Manage study materials and resources</p>
                    </div>
                    <Button 
                        onClick={() => handleOpenModal()}
                        className="bg-[#140152] text-white hover:bg-[#f5bb00] hover:text-[#140152]"
                    >
                        <Plus className="mr-2 w-5 h-5" />
                        Add Resource
                    </Button>
                </div>
            </div>

            {/* Resources List */}
            <div className="grid gap-4">
                {resources.map((resource, index) => (
                    <motion.div
                        key={resource.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                    >
                        <Card className="p-6 hover:shadow-lg transition-all">
                            <div className="flex items-start justify-between">
                                <div className="flex items-start gap-4 flex-1">
                                    <div className="w-12 h-12 bg-gradient-to-br from-[#140152] to-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                                        {getResourceIcon(resource.resource_type)}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <h3 className="text-xl font-bold text-[#140152]">{resource.title}</h3>
                                            {resource.is_featured && (
                                                <Star className="w-5 h-5 text-[#f5bb00] fill-[#f5bb00]" />
                                            )}
                                            {!resource.is_active && (
                                                <EyeOff className="w-5 h-5 text-gray-400" />
                                            )}
                                        </div>
                                        {resource.description && (
                                            <p className="text-gray-600 mb-2">{resource.description}</p>
                                        )}
                                        <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                                            <span className="capitalize">{resource.resource_type}</span>
                                            {resource.category && (
                                                <>
                                                    <span>•</span>
                                                    <span>{resource.category}</span>
                                                </>
                                            )}
                                            {resource.resource_url && (
                                                <>
                                                    <span>•</span>
                                                    <a
                                                        href={resource.resource_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-[#140152] hover:text-[#f5bb00] flex items-center gap-1"
                                                    >
                                                        <LinkIcon className="w-3 h-3" />
                                                        View Resource
                                                    </a>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        onClick={() => handleOpenModal(resource)}
                                        variant="outline"
                                        size="sm"
                                        className="border-[#140152] text-[#140152] hover:bg-[#140152] hover:text-white"
                                    >
                                        <Edit className="w-4 h-4" />
                                    </Button>
                                    <Button
                                        onClick={() => handleDelete(resource.id)}
                                        variant="outline"
                                        size="sm"
                                        className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    </motion.div>
                ))}
            </div>

            {resources.length === 0 && (
                <Card className="p-12 text-center">
                    <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-xl font-bold text-gray-700 mb-2">No Resources Yet</h3>
                    <p className="text-gray-600 mb-6">Add study resources for your congregation</p>
                    <Button
                        onClick={() => handleOpenModal()}
                        className="bg-[#140152] text-white hover:bg-[#f5bb00] hover:text-[#140152]"
                    >
                        <Plus className="mr-2 w-5 h-5" />
                        Add Resource
                    </Button>
                </Card>
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                    >
                        <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
                            <h2 className="text-2xl font-bold text-[#140152]">
                                {editingResource ? 'Edit Resource' : 'Add New Resource'}
                            </h2>
                            <Button
                                onClick={handleCloseModal}
                                variant="ghost"
                                size="sm"
                            >
                                <X className="w-5 h-5" />
                            </Button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Title *
                                </label>
                                <Input
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    required
                                    placeholder="e.g., Introduction to Bible Study Methods"
                                    className="text-gray-900"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Description
                                </label>
                                <Textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Describe the resource..."
                                    rows={3}
                                    className="text-gray-900"
                                />
                            </div>

                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Resource Type *
                                    </label>
                                    <select
                                        value={formData.resource_type}
                                        onChange={(e) => setFormData({ ...formData, resource_type: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                                        required
                                    >
                                        <option value="article">Article</option>
                                        <option value="video">Video</option>
                                        <option value="audio">Audio</option>
                                        <option value="pdf">PDF</option>
                                        <option value="link">External Link</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Category
                                    </label>
                                    <Input
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                        placeholder="e.g., Study Guides, Devotionals"
                                        className="text-gray-900"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Resource URL
                                </label>
                                <Input
                                    type="url"
                                    value={formData.resource_url}
                                    onChange={(e) => setFormData({ ...formData, resource_url: e.target.value })}
                                    placeholder="https://..."
                                    className="text-gray-900"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Order Index
                                </label>
                                <Input
                                    type="number"
                                    value={formData.order_index}
                                    onChange={(e) => setFormData({ ...formData, order_index: parseInt(e.target.value) })}
                                    min="0"
                                    className="text-gray-900"
                                />
                            </div>

                            <div className="flex gap-4">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.is_featured}
                                        onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                                        className="w-4 h-4 text-[#140152] rounded"
                                    />
                                    <span className="text-sm font-medium text-gray-700">Featured Resource</span>
                                </label>

                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.is_active}
                                        onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                        className="w-4 h-4 text-[#140152] rounded"
                                    />
                                    <span className="text-sm font-medium text-gray-700">Active</span>
                                </label>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <Button
                                    type="submit"
                                    className="flex-1 bg-[#140152] text-white hover:bg-[#f5bb00] hover:text-[#140152]"
                                >
                                    {editingResource ? 'Update Resource' : 'Create Resource'}
                                </Button>
                                <Button
                                    type="button"
                                    onClick={handleCloseModal}
                                    variant="outline"
                                    className="flex-1"
                                >
                                    Cancel
                                </Button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </div>
    )
}

