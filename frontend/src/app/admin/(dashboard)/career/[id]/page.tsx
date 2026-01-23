'use client'

import React, { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
    ArrowLeft, Loader2, Plus, Trash, Edit, FileDown, PlayCircle, 
    FileText, Link as LinkIcon, CheckSquare 
} from 'lucide-react'
import { 
    careerApi, CareerModule, CareerResource, CareerTask, 
    CareerModuleCreate, CareerResourceCreate, CareerTaskCreate 
} from '@/lib/api'

export default function EditCareerModulePage() {
    const router = useRouter()
    const params = useParams()
    const moduleId = params.id as string

    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [module, setModule] = useState<CareerModule | null>(null)
    const [formData, setFormData] = useState<Partial<CareerModuleCreate>>({})
    
    // Resource modal
    const [showResourceModal, setShowResourceModal] = useState(false)
    const [resourceForm, setResourceForm] = useState<CareerResourceCreate>({
        title: '',
        description: '',
        resource_type: 'pdf',
        order_index: 0
    })
    
    // Task modal
    const [showTaskModal, setShowTaskModal] = useState(false)
    const [taskForm, setTaskForm] = useState<CareerTaskCreate>({
        title: '',
        description: '',
        order_index: 0
    })

    useEffect(() => {
        loadModule()
    }, [moduleId])

    const loadModule = async () => {
        try {
            setLoading(true)
            const data = await careerApi.admin.getModule(moduleId)
            setModule(data)
            setFormData({
                title: data.title,
                description: data.description,
                icon: data.icon,
                order_index: data.order_index,
                is_published: data.is_published
            })
        } catch (err) {
            console.error('Failed to load module', err)
            router.push('/admin/career')
        } finally {
            setLoading(false)
        }
    }

    const handleUpdateModule = async (e: React.FormEvent) => {
        e.preventDefault()
        
        try {
            setSaving(true)
            await careerApi.admin.updateModule(moduleId, formData)
            await loadModule()
            alert('Module updated successfully!')
        } catch (err) {
            console.error('Failed to update module', err)
            alert('Failed to update module. Please try again.')
        } finally {
            setSaving(false)
        }
    }

    const handleAddResource = async (e: React.FormEvent) => {
        e.preventDefault()
        
        try {
            await careerApi.admin.createResource(moduleId, resourceForm)
            setShowResourceModal(false)
            setResourceForm({
                title: '',
                description: '',
                resource_type: 'pdf',
                order_index: 0
            })
            await loadModule()
        } catch (err) {
            console.error('Failed to add resource', err)
            alert('Failed to add resource. Please try again.')
        }
    }

    const handleDeleteResource = async (resourceId: string) => {
        if (!confirm('Are you sure you want to delete this resource?')) return
        
        try {
            await careerApi.admin.deleteResource(resourceId)
            await loadModule()
        } catch (err) {
            console.error('Failed to delete resource', err)
        }
    }

    const handleAddTask = async (e: React.FormEvent) => {
        e.preventDefault()
        
        try {
            await careerApi.admin.createTask(moduleId, taskForm)
            setShowTaskModal(false)
            setTaskForm({
                title: '',
                description: '',
                order_index: 0
            })
            await loadModule()
        } catch (err) {
            console.error('Failed to add task', err)
            alert('Failed to add task. Please try again.')
        }
    }

    const handleDeleteTask = async (taskId: string) => {
        if (!confirm('Are you sure you want to delete this task?')) return
        
        try {
            await careerApi.admin.deleteTask(taskId)
            await loadModule()
        } catch (err) {
            console.error('Failed to delete task', err)
        }
    }

    const getResourceIcon = (type: string) => {
        switch (type) {
            case 'pdf': return FileDown
            case 'video': return PlayCircle
            case 'article': return FileText
            case 'link': return LinkIcon
            default: return FileText
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        )
    }

    if (!module) return null

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button
                    variant="ghost"
                    onClick={() => router.push('/admin/career')}
                    className="-ml-2"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                </Button>
                <div>
                    <h1 className="text-2xl font-bold text-primary">Edit Career Module</h1>
                    <p className="text-gray-500 dark:text-gray-400">Manage module details, resources, and tasks</p>
                </div>
            </div>

            {/* Module Details Form */}
            <form onSubmit={handleUpdateModule}>
                <Card>
                    <CardHeader>
                        <CardTitle>Module Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Title *
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Description
                            </label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                rows={4}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Icon
                                </label>
                                <input
                                    type="text"
                                    value={formData.icon}
                                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Order Index
                                </label>
                                <input
                                    type="number"
                                    value={formData.order_index}
                                    onChange={(e) => setFormData({ ...formData, order_index: parseInt(e.target.value) })}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                                    min="0"
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="is_published"
                                checked={formData.is_published}
                                onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
                                className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                            />
                            <label htmlFor="is_published" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Published
                            </label>
                        </div>

                        <div className="flex gap-3 pt-4">
                            <Button
                                type="submit"
                                disabled={saving}
                                className="bg-primary hover:bg-primary/90 text-white"
                            >
                                {saving ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    'Save Changes'
                                )}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </form>

            {/* Resources Section */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Resources ({module.resources?.length || 0})</CardTitle>
                    <Button
                        onClick={() => setShowResourceModal(true)}
                        size="sm"
                        className="bg-primary hover:bg-primary/90 text-white"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Resource
                    </Button>
                </CardHeader>
                <CardContent>
                    {module.resources && module.resources.length > 0 ? (
                        <div className="space-y-3">
                            {module.resources.map((resource) => {
                                const Icon = getResourceIcon(resource.resource_type)
                                return (
                                    <div
                                        key={resource.id}
                                        className="flex items-center gap-4 p-4 border border-gray-200 dark:border-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50"
                                    >
                                        <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                            <Icon className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-semibold text-gray-900 dark:text-white">{resource.title}</h4>
                                            <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                                                {resource.description || 'No description'}
                                            </p>
                                            <span className="text-xs text-gray-500 dark:text-gray-400 uppercase">
                                                {resource.resource_type}
                                            </span>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDeleteResource(resource.id)}
                                            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                                        >
                                            <Trash className="w-4 h-4" />
                                        </Button>
                                    </div>
                                )
                            })}
                        </div>
                    ) : (
                        <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                            No resources yet. Add your first resource to get started.
                        </p>
                    )}
                </CardContent>
            </Card>

            {/* Tasks Section */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Action Items ({module.tasks?.length || 0})</CardTitle>
                    <Button
                        onClick={() => setShowTaskModal(true)}
                        size="sm"
                        className="bg-primary hover:bg-primary/90 text-white"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Task
                    </Button>
                </CardHeader>
                <CardContent>
                    {module.tasks && module.tasks.length > 0 ? (
                        <div className="space-y-3">
                            {module.tasks.map((task) => (
                                <div
                                    key={task.id}
                                    className="flex items-center gap-4 p-4 border border-gray-200 dark:border-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50"
                                >
                                    <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg text-green-600">
                                        <CheckSquare className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-semibold text-gray-900 dark:text-white">{task.title}</h4>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            {task.description || 'No description'}
                                        </p>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleDeleteTask(task.id)}
                                        className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                                    >
                                        <Trash className="w-4 h-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                            No tasks yet. Add your first task to get started.
                        </p>
                    )}
                </CardContent>
            </Card>

            {/* Resource Modal */}
            {showResourceModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-900 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <form onSubmit={handleAddResource}>
                            <div className="p-6 border-b border-gray-200 dark:border-gray-800">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Add Resource</h2>
                            </div>
                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Title *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={resourceForm.title}
                                        onChange={(e) => setResourceForm({ ...resourceForm, title: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Description
                                    </label>
                                    <textarea
                                        value={resourceForm.description}
                                        onChange={(e) => setResourceForm({ ...resourceForm, description: e.target.value })}
                                        rows={3}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Resource Type *
                                    </label>
                                    <select
                                        required
                                        value={resourceForm.resource_type}
                                        onChange={(e) => setResourceForm({ ...resourceForm, resource_type: e.target.value as any })}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                                    >
                                        <option value="pdf">PDF Document</option>
                                        <option value="video">Video</option>
                                        <option value="article">Article</option>
                                        <option value="link">External Link</option>
                                    </select>
                                </div>

                                {resourceForm.resource_type === 'pdf' && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            PDF URL
                                        </label>
                                        <input
                                            type="url"
                                            value={resourceForm.file_url || ''}
                                            onChange={(e) => setResourceForm({ ...resourceForm, file_url: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                                            placeholder="https://..."
                                        />
                                    </div>
                                )}

                                {resourceForm.resource_type === 'video' && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Video URL
                                        </label>
                                        <input
                                            type="url"
                                            value={resourceForm.video_url || ''}
                                            onChange={(e) => setResourceForm({ ...resourceForm, video_url: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                                            placeholder="https://youtube.com/..."
                                        />
                                    </div>
                                )}

                                {resourceForm.resource_type === 'article' && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Article Content
                                        </label>
                                        <textarea
                                            value={resourceForm.article_content || ''}
                                            onChange={(e) => setResourceForm({ ...resourceForm, article_content: e.target.value })}
                                            rows={6}
                                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                                        />
                                    </div>
                                )}

                                {resourceForm.resource_type === 'link' && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            External Link
                                        </label>
                                        <input
                                            type="url"
                                            value={resourceForm.external_link || ''}
                                            onChange={(e) => setResourceForm({ ...resourceForm, external_link: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                                            placeholder="https://..."
                                        />
                                    </div>
                                )}
                            </div>
                            <div className="p-6 border-t border-gray-200 dark:border-gray-800 flex gap-3">
                                <Button type="submit" className="bg-primary hover:bg-primary/90 text-white">
                                    Add Resource
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setShowResourceModal(false)}
                                >
                                    Cancel
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Task Modal */}
            {showTaskModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-900 rounded-xl max-w-2xl w-full">
                        <form onSubmit={handleAddTask}>
                            <div className="p-6 border-b border-gray-200 dark:border-gray-800">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Add Task</h2>
                            </div>
                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Title *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={taskForm.title}
                                        onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Description
                                    </label>
                                    <textarea
                                        value={taskForm.description}
                                        onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                                        rows={3}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                                    />
                                </div>
                            </div>
                            <div className="p-6 border-t border-gray-200 dark:border-gray-800 flex gap-3">
                                <Button type="submit" className="bg-primary hover:bg-primary/90 text-white">
                                    Add Task
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setShowTaskModal(false)}
                                >
                                    Cancel
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

