'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Edit, Trash2, ArrowLeft, Music, Heart, Sparkles, Star, Mic, Radio } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { alterSoundApi, AudioCategory } from '@/lib/api'
import * as LucideIcons from 'lucide-react'
import { useToast } from '@/components/ui/toast'

const AVAILABLE_ICONS = [
    { name: 'Music', icon: Music },
    { name: 'Heart', icon: Heart },
    { name: 'Sparkles', icon: Sparkles },
    { name: 'Star', icon: Star },
    { name: 'Mic', icon: Mic },
    { name: 'Radio', icon: Radio },
]

export default function AlterSoundCategoriesPage() {
    const router = useRouter()
    const [categories, setCategories] = useState<AudioCategory[]>([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [editingCategory, setEditingCategory] = useState<AudioCategory | null>(null)
    const { showToast, ToastComponent } = useToast()

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        icon: 'Music',
        order_index: 0,
        is_active: true,
    })

    useEffect(() => {
        fetchCategories()
    }, [])

    const fetchCategories = async () => {
        try {
            const data = await alterSoundApi.getAllCategories()
            setCategories(data.sort((a, b) => a.order_index - b.order_index))
        } catch (error) {
            console.error('Failed to load categories:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleOpenModal = (category?: AudioCategory) => {
        if (category) {
            setEditingCategory(category)
            setFormData({
                name: category.name,
                description: category.description || '',
                icon: category.icon || 'Music',
                order_index: category.order_index,
                is_active: category.is_active,
            })
        } else {
            setEditingCategory(null)
            setFormData({
                name: '',
                description: '',
                icon: 'Music',
                order_index: categories.length,
                is_active: true,
            })
        }
        setShowModal(true)
    }

    const handleCloseModal = () => {
        setShowModal(false)
        setEditingCategory(null)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            if (editingCategory) {
                await alterSoundApi.updateCategory(editingCategory.id, formData)
                showToast('Category updated successfully!', 'success')
            } else {
                await alterSoundApi.createCategory(formData)
                showToast('Category created successfully!', 'success')
            }
            await fetchCategories()
            handleCloseModal()
        } catch (error) {
            console.error('Failed to save category:', error)
            showToast('Failed to save category', 'error')
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this category?')) return
        try {
            await alterSoundApi.deleteCategory(id)
            showToast('Category deleted successfully!', 'success')
            await fetchCategories()
        } catch (error) {
            console.error('Failed to delete category:', error)
            showToast('Failed to delete category', 'error')
        }
    }

    const getIconComponent = (iconName: string) => {
        const IconComponent = AVAILABLE_ICONS.find(i => i.name === iconName)?.icon || Music
        return IconComponent
    }

    return (
        <div className="p-8 relative">
            <div className="mb-8 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link
                        href="/admin/pages/alter-sound"
                        className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-semibold transition-all duration-300 h-9 px-4 border-2 border-[#140152] text-[#140152] hover:bg-[#140152] hover:text-white relative z-[100] cursor-pointer"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold text-[#140152]">Audio Categories</h1>
                        <p className="text-gray-600">Organize your audio tracks by categories</p>
                    </div>
                </div>
                <Button
                    onClick={() => handleOpenModal()}
                    className="bg-[#140152] text-white hover:bg-[#140152]/90"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Category
                </Button>
            </div>

            {/* Categories Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {categories.map((category) => {
                    const IconComponent = getIconComponent(category.icon || 'Music')
                    return (
                        <Card key={category.id} className="p-6 hover:shadow-lg transition-shadow">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-[#f5bb00]/10 rounded-lg flex items-center justify-center">
                                        <IconComponent className="w-6 h-6 text-[#f5bb00]" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-[#140152]">{category.name}</h3>
                                        <p className="text-xs text-gray-500">Order: {category.order_index}</p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleOpenModal(category)}
                                    >
                                        <Edit className="w-4 h-4" />
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleDelete(category.id)}
                                    >
                                        <Trash2 className="w-4 h-4 text-red-500" />
                                    </Button>
                                </div>
                            </div>
                            <p className="text-sm text-gray-600 mb-3">{category.description || 'No description'}</p>
                            <div className="flex items-center gap-2">
                                <span className={`text-xs px-2 py-1 rounded-full ${category.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                                    {category.is_active ? 'Active' : 'Inactive'}
                                </span>
                            </div>
                        </Card>
                    )
                })}
            </div>

            {/* Modal */}
            <AnimatePresence>
                {showModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                        onClick={handleCloseModal}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto"
                        >
                            <h2 className="text-2xl font-bold text-[#140152] mb-4">
                                {editingCategory ? 'Edit Category' : 'Add Category'}
                            </h2>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <Label htmlFor="name" className="text-gray-900">Category Name</Label>
                                    <Input
                                        id="name"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        required
                                        className="text-gray-900"
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="description" className="text-gray-900">Description</Label>
                                    <Textarea
                                        id="description"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        rows={3}
                                        className="text-gray-900"
                                    />
                                </div>

                                <div>
                                    <Label className="text-gray-900">Icon</Label>
                                    <div className="grid grid-cols-3 gap-2 mt-2">
                                        {AVAILABLE_ICONS.map(({ name, icon: Icon }) => (
                                            <button
                                                key={name}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, icon: name })}
                                                className={`p-3 border rounded-lg flex flex-col items-center gap-1 hover:bg-gray-50 ${formData.icon === name ? 'border-[#140152] bg-[#140152]/5' : 'border-gray-300'
                                                    }`}
                                            >
                                                <Icon className="w-6 h-6 text-[#140152]" />
                                                <span className="text-xs text-gray-900">{name}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <Label htmlFor="order_index" className="text-gray-900">Order Index</Label>
                                    <Input
                                        id="order_index"
                                        type="number"
                                        value={formData.order_index}
                                        onChange={(e) => setFormData({ ...formData, order_index: parseInt(e.target.value) })}
                                        required
                                        className="text-gray-900"
                                    />
                                </div>

                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="is_active"
                                        checked={formData.is_active}
                                        onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                        className="w-4 h-4"
                                    />
                                    <Label htmlFor="is_active" className="text-gray-900">Active</Label>
                                </div>

                                <div className="flex gap-2 pt-4">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={handleCloseModal}
                                        className="flex-1"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        className="flex-1 bg-[#140152] text-white hover:bg-[#140152]/90"
                                    >
                                        {editingCategory ? 'Update' : 'Create'}
                                    </Button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
            <ToastComponent />
        </div>
    )
}

