'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { serviceResourceApi, ServiceResourceItem, ServiceResourceCreate } from '@/lib/api'
import { Plus, Edit2, Trash2, FileText, ExternalLink, Link2, Upload, X, Save, Eye, EyeOff, ArrowUp, ArrowDown, Loader2 } from 'lucide-react'
import * as LucideIcons from 'lucide-react'

const ICON_OPTIONS = [
    'FileText', 'PenTool', 'Heart', 'BookOpen', 'Download', 'Music',
    'Video', 'Image', 'File', 'Folder', 'Globe', 'Link', 'Star',
    'Users', 'Calendar', 'Clock', 'Shield', 'Award', 'Gift', 'Smile',
]

const SERVICE_SLUGS = [
    { value: 'sunday-service', label: 'Sunday Service' },
    { value: 'alter-sound', label: 'Alter Sound' },
    { value: 'bible-reading', label: 'Bible Reading' },
    { value: 'counselling', label: 'Counselling' },
    { value: 'kids-ministry', label: 'Kids Ministry' },
]

const RESOURCE_TYPES = [
    { value: 'file', label: 'File Upload', icon: Upload },
    { value: 'link', label: 'External Link', icon: ExternalLink },
    { value: 'page', label: 'Internal Page', icon: Link2 },
]

const DynamicIcon = ({ name, className }: { name: string; className?: string }) => {
    // @ts-ignore
    const Icon = LucideIcons[name]
    if (!Icon) return <FileText className={className} />
    return <Icon className={className} />
}

const emptyForm: ServiceResourceCreate = {
    title: '',
    description: '',
    icon: 'FileText',
    resource_type: 'link',
    file_url: '',
    external_url: '',
    service_slug: 'sunday-service',
    is_active: true,
    display_order: 0,
}

export default function ServiceResourcesPage() {
    const [resources, setResources] = useState<ServiceResourceItem[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [showModal, setShowModal] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [form, setForm] = useState<ServiceResourceCreate>(emptyForm)
    const [uploading, setUploading] = useState(false)
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')

    const fetchResources = useCallback(async () => {
        try {
            setLoading(true)
            const data = await serviceResourceApi.getAll()
            setResources(data.resources)
        } catch (e: any) {
            setError('Failed to load resources')
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchResources()
    }, [fetchResources])

    const openCreate = () => {
        setEditingId(null)
        setForm({ ...emptyForm, display_order: resources.length })
        setShowModal(true)
        setError('')
    }

    const openEdit = (r: ServiceResourceItem) => {
        setEditingId(r.id)
        setForm({
            title: r.title,
            description: r.description || '',
            icon: r.icon || 'FileText',
            resource_type: r.resource_type,
            file_url: r.file_url || '',
            external_url: r.external_url || '',
            service_slug: r.service_slug,
            is_active: r.is_active,
            display_order: r.display_order,
        })
        setShowModal(true)
        setError('')
    }

    const handleSave = async () => {
        if (!form.title.trim()) {
            setError('Title is required')
            return
        }
        try {
            setSaving(true)
            setError('')
            if (editingId) {
                await serviceResourceApi.update(editingId, form)
                setSuccess('Resource updated successfully!')
            } else {
                await serviceResourceApi.create(form)
                setSuccess('Resource created successfully!')
            }
            setShowModal(false)
            await fetchResources()
            setTimeout(() => setSuccess(''), 3000)
        } catch (e: any) {
            setError(e.message || 'Failed to save')
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async (id: string) => {
        try {
            await serviceResourceApi.delete(id)
            setSuccess('Resource deleted successfully!')
            setDeleteConfirm(null)
            await fetchResources()
            setTimeout(() => setSuccess(''), 3000)
        } catch (e: any) {
            setError(e.message || 'Failed to delete')
        }
    }

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        try {
            setUploading(true)
            const result = await serviceResourceApi.uploadFile(file)
            setForm(prev => ({ ...prev, file_url: result.file_url }))
        } catch (err: any) {
            setError(err.message || 'Upload failed')
        } finally {
            setUploading(false)
        }
    }

    const toggleActive = async (r: ServiceResourceItem) => {
        try {
            await serviceResourceApi.update(r.id, { is_active: !r.is_active })
            await fetchResources()
        } catch (e: any) {
            setError(e.message || 'Failed to update')
        }
    }

    const getResourceUrl = (r: ServiceResourceItem) => {
        if (r.resource_type === 'file') return r.file_url
        return r.external_url
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-10 h-10 animate-spin text-[#140152]" />
            </div>
        )
    }

    return (
        <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Service Resources</h1>
                    <p className="text-gray-500 mt-1">Manage downloadable files, links, and materials for service pages</p>
                </div>
                <button
                    onClick={openCreate}
                    className="flex items-center gap-2 bg-[#140152] text-white px-4 py-2.5 rounded-lg hover:bg-[#1a0270] transition-colors font-medium"
                >
                    <Plus className="w-4 h-4" />
                    Add Resource
                </button>
            </div>

            {/* Alerts */}
            {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center justify-between">
                    <span>{error}</span>
                    <button onClick={() => setError('')}><X className="w-4 h-4" /></button>
                </div>
            )}
            {success && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg">
                    {success}
                </div>
            )}

            {/* Resources Table */}
            {resources.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
                    <FileText className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">No Resources Yet</h3>
                    <p className="text-gray-500 mb-6">Create your first service resource — bulletins, sermon notes, and more.</p>
                    <button onClick={openCreate} className="bg-[#140152] text-white px-5 py-2.5 rounded-lg hover:bg-[#1a0270] transition font-medium">
                        <Plus className="w-4 h-4 inline mr-2" />Add First Resource
                    </button>
                </div>
            ) : (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-gray-50 text-left text-xs text-gray-500 uppercase tracking-wider">
                                <th className="px-5 py-3">Resource</th>
                                <th className="px-5 py-3">Type</th>
                                <th className="px-5 py-3">Service</th>
                                <th className="px-5 py-3 text-center">Status</th>
                                <th className="px-5 py-3 text-center">Order</th>
                                <th className="px-5 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {resources.map((r) => (
                                <tr key={r.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-5 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-[#140152]/5 rounded-lg">
                                                <DynamicIcon name={r.icon || 'FileText'} className="w-5 h-5 text-[#140152]" />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-900">{r.title}</p>
                                                {r.description && (
                                                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-1 max-w-xs">{r.description}</p>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-5 py-4">
                                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${r.resource_type === 'file' ? 'bg-blue-50 text-blue-700' :
                                            r.resource_type === 'link' ? 'bg-purple-50 text-purple-700' :
                                                'bg-green-50 text-green-700'
                                            }`}>
                                            {r.resource_type === 'file' ? <Upload className="w-3 h-3" /> :
                                                r.resource_type === 'link' ? <ExternalLink className="w-3 h-3" /> :
                                                    <Link2 className="w-3 h-3" />}
                                            {r.resource_type}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4">
                                        <span className="text-sm text-gray-600">
                                            {SERVICE_SLUGS.find(s => s.value === r.service_slug)?.label || r.service_slug}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4 text-center">
                                        <button
                                            onClick={() => toggleActive(r)}
                                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition ${r.is_active
                                                ? 'bg-green-50 text-green-700 hover:bg-green-100'
                                                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                                }`}
                                        >
                                            {r.is_active ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                                            {r.is_active ? 'Active' : 'Hidden'}
                                        </button>
                                    </td>
                                    <td className="px-5 py-4 text-center">
                                        <span className="text-sm font-mono text-gray-500">{r.display_order}</span>
                                    </td>
                                    <td className="px-5 py-4 text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            {getResourceUrl(r) && (
                                                <a
                                                    href={r.resource_type === 'file'
                                                        ? `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:8000'}${r.file_url}`
                                                        : r.external_url || '#'
                                                    }
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition"
                                                    title="Preview"
                                                >
                                                    <ExternalLink className="w-4 h-4" />
                                                </a>
                                            )}
                                            <button
                                                onClick={() => openEdit(r)}
                                                className="p-2 text-gray-400 hover:text-[#140152] rounded-lg hover:bg-gray-100 transition"
                                                title="Edit"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            {deleteConfirm === r.id ? (
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        onClick={() => handleDelete(r.id)}
                                                        className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 transition"
                                                    >
                                                        Confirm
                                                    </button>
                                                    <button
                                                        onClick={() => setDeleteConfirm(null)}
                                                        className="px-2 py-1 text-xs bg-gray-200 rounded hover:bg-gray-300 transition"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => setDeleteConfirm(r.id)}
                                                    className="p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-5 border-b">
                            <h2 className="text-lg font-bold text-gray-900">
                                {editingId ? 'Edit Resource' : 'Create Resource'}
                            </h2>
                            <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-gray-100 rounded-lg transition">
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        <div className="p-5 space-y-5">
                            {/* Title */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Title *</label>
                                <input
                                    type="text"
                                    value={form.title}
                                    onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))}
                                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#140152]/20 focus:border-[#140152] outline-none transition"
                                    placeholder="e.g. Weekly Bulletin"
                                />
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
                                <textarea
                                    value={form.description || ''}
                                    onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#140152]/20 focus:border-[#140152] outline-none transition resize-none"
                                    rows={2}
                                    placeholder="Brief description of this resource..."
                                />
                            </div>

                            {/* Icon Picker */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Icon</label>
                                <div className="flex flex-wrap gap-2">
                                    {ICON_OPTIONS.map(iconName => (
                                        <button
                                            key={iconName}
                                            onClick={() => setForm(prev => ({ ...prev, icon: iconName }))}
                                            className={`p-2 rounded-lg border-2 transition ${form.icon === iconName
                                                ? 'border-[#140152] bg-[#140152]/5'
                                                : 'border-gray-200 hover:border-gray-300'
                                                }`}
                                            title={iconName}
                                        >
                                            <DynamicIcon name={iconName} className="w-5 h-5 text-[#140152]" />
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Service Slug */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Service Page</label>
                                <select
                                    value={form.service_slug}
                                    onChange={e => setForm(prev => ({ ...prev, service_slug: e.target.value }))}
                                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#140152]/20 focus:border-[#140152] outline-none transition"
                                >
                                    {SERVICE_SLUGS.map(s => (
                                        <option key={s.value} value={s.value}>{s.label}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Resource Type */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Resource Type</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {RESOURCE_TYPES.map(rt => (
                                        <button
                                            key={rt.value}
                                            onClick={() => setForm(prev => ({ ...prev, resource_type: rt.value as 'file' | 'link' | 'page' }))}
                                            className={`flex items-center gap-2 px-3 py-2.5 border-2 rounded-lg text-sm font-medium transition ${form.resource_type === rt.value
                                                ? 'border-[#140152] bg-[#140152]/5 text-[#140152]'
                                                : 'border-gray-200 text-gray-500 hover:border-gray-300'
                                                }`}
                                        >
                                            <rt.icon className="w-4 h-4" />
                                            {rt.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* File Upload (for file type) */}
                            {form.resource_type === 'file' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Upload File</label>
                                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                                        {form.file_url ? (
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-green-600 font-medium">
                                                    ✓ File uploaded: {form.file_url.split('/').pop()}
                                                </span>
                                                <button
                                                    onClick={() => setForm(prev => ({ ...prev, file_url: '' }))}
                                                    className="text-red-400 hover:text-red-600"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ) : (
                                            <>
                                                <Upload className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                                                <p className="text-sm text-gray-500 mb-2">PDF, DOC, XLSX, PPTX, images</p>
                                                <label className="cursor-pointer bg-[#140152] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#1a0270] transition inline-block">
                                                    {uploading ? 'Uploading...' : 'Choose File'}
                                                    <input
                                                        type="file"
                                                        className="hidden"
                                                        onChange={handleFileUpload}
                                                        accept=".pdf,.doc,.docx,.txt,.xlsx,.pptx,.png,.jpg,.jpeg"
                                                        disabled={uploading}
                                                    />
                                                </label>
                                            </>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* External URL (for link/page type) */}
                            {(form.resource_type === 'link' || form.resource_type === 'page') && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                        {form.resource_type === 'link' ? 'External URL' : 'Page Path'}
                                    </label>
                                    <input
                                        type="text"
                                        value={form.external_url || ''}
                                        onChange={e => setForm(prev => ({ ...prev, external_url: e.target.value }))}
                                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#140152]/20 focus:border-[#140152] outline-none transition"
                                        placeholder={form.resource_type === 'link' ? 'https://example.com/resource' : '/connect'}
                                    />
                                </div>
                            )}

                            {/* Display Order */}
                            <div className="flex items-center gap-4">
                                <div className="flex-1">
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Display Order</label>
                                    <input
                                        type="number"
                                        value={form.display_order}
                                        onChange={e => setForm(prev => ({ ...prev, display_order: parseInt(e.target.value) || 0 }))}
                                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#140152]/20 focus:border-[#140152] outline-none transition"
                                        min={0}
                                    />
                                </div>
                                <div className="flex-1">
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Visibility</label>
                                    <button
                                        onClick={() => setForm(prev => ({ ...prev, is_active: !prev.is_active }))}
                                        className={`w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border-2 font-medium text-sm transition ${form.is_active
                                            ? 'border-green-200 bg-green-50 text-green-700'
                                            : 'border-gray-300 bg-gray-50 text-gray-500'
                                            }`}
                                    >
                                        {form.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                        {form.is_active ? 'Visible' : 'Hidden'}
                                    </button>
                                </div>
                            </div>

                            {error && (
                                <p className="text-sm text-red-500">{error}</p>
                            )}
                        </div>

                        <div className="flex items-center justify-end gap-3 p-5 border-t bg-gray-50 rounded-b-2xl">
                            <button
                                onClick={() => setShowModal(false)}
                                className="px-4 py-2.5 text-gray-600 hover:bg-gray-100 rounded-lg transition font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="flex items-center gap-2 bg-[#140152] text-white px-5 py-2.5 rounded-lg hover:bg-[#1a0270] transition font-medium disabled:opacity-50"
                            >
                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                {editingId ? 'Update' : 'Create'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
