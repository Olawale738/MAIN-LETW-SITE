'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import PremiumButton from '@/components/ui/PremiumButton'
import { ArrowLeft, Plus, Edit, Trash2, Loader2, X } from 'lucide-react'
import { prayerApi, PrayerCategory, PrayerCategoryCreate } from '@/lib/api'
import { useToast } from '@/components/ui/toast'
import { motion, AnimatePresence } from 'framer-motion'

export default function PrayerCategoriesPage() {
  const router = useRouter()
  const { showToast } = useToast()
  const [loading, setLoading] = useState(true)
  const [categories, setCategories] = useState<PrayerCategory[]>([])
  const [showModal, setShowModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState<PrayerCategory | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  const [formData, setFormData] = useState<PrayerCategoryCreate>({
    title: '',
    description: '',
    icon: 'Globe',
    order_index: 0,
    is_active: true
  })

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      setLoading(true)
      const data = await prayerApi.admin.getCategories()
      setCategories(data.sort((a, b) => a.order_index - b.order_index))
    } catch (error) {
      console.error('Failed to fetch categories:', error)
      showToast('Failed to load categories', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenModal = (category?: PrayerCategory) => {
    if (category) {
      setEditingCategory(category)
      setFormData({
        title: category.title,
        description: category.description || '',
        icon: category.icon || 'Globe',
        order_index: category.order_index,
        is_active: category.is_active
      })
    } else {
      setEditingCategory(null)
      setFormData({
        title: '',
        description: '',
        icon: 'Globe',
        order_index: categories.length,
        is_active: true
      })
    }
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingCategory(null)
    setFormData({
      title: '',
      description: '',
      icon: 'Globe',
      order_index: 0,
      is_active: true
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setSaving(true)
      if (editingCategory) {
        await prayerApi.admin.updateCategory(editingCategory.id, formData)
        showToast('Category updated successfully!', 'success')
      } else {
        await prayerApi.admin.createCategory(formData)
        showToast('Category created successfully!', 'success')
      }
      handleCloseModal()
      fetchCategories()
    } catch (error) {
      console.error('Failed to save category:', error)
      showToast('Failed to save category', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return

    try {
      setDeleting(id)
      await prayerApi.admin.deleteCategory(id)
      showToast('Category deleted successfully!', 'success')
      fetchCategories()
    } catch (error) {
      console.error('Failed to delete category:', error)
      showToast('Failed to delete category', 'error')
    } finally {
      setDeleting(null)
    }
  }

  const commonIcons = [
    'Globe', 'Heart', 'Shield', 'BookOpen', 'Users', 'Zap',
    'Star', 'Sun', 'Moon', 'Cloud', 'Flame', 'Cross',
    'HandHeart', 'Sparkles', 'Crown', 'Target', 'Award'
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-[#140152]" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <PremiumButton
            onClick={() => router.push('/admin/prayer')}
            className="bg-gray-100 text-gray-700 hover:bg-gray-200"
          >
            <ArrowLeft className="w-4 h-4" />
          </PremiumButton>
          <div>
            <h1 className="text-3xl font-black text-[#140152]">Prayer Categories</h1>
            <p className="text-gray-600 mt-1">Manage prayer experience categories</p>
          </div>
        </div>



        <PremiumButton
          onClick={() => handleOpenModal()}
          className="bg-[#140152] text-white hover:bg-[#1d0175]"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Category
        </PremiumButton>
      </div>

      {/* Categories List */}
      <div className="grid gap-4">
        {categories.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-gray-500">No categories yet. Create your first category!</p>
            </CardContent>
          </Card>
        ) : (
          categories.map((category) => (
            <Card key={category.id} className={!category.is_active ? 'opacity-60' : ''}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-[#140152]">{category.title}</h3>
                      {!category.is_active && (
                        <span className="px-2 py-1 bg-gray-200 text-gray-600 text-xs rounded-full">
                          Inactive
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 mb-3">{category.description}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>Icon: {category.icon || 'Globe'}</span>
                      <span>Order: {category.order_index}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <PremiumButton
                      onClick={() => handleOpenModal(category)}
                      className="bg-blue-500 text-white hover:bg-blue-600"
                    >
                      <Edit className="w-4 h-4" />
                    </PremiumButton>
                    <PremiumButton
                      onClick={() => handleDelete(category.id)}
                      disabled={deleting === category.id}
                      className="bg-red-500 text-white hover:bg-red-600"
                    >
                      {deleting === category.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </PremiumButton>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
                <h2 className="text-2xl font-black text-[#140152]">
                  {editingCategory ? 'Edit Category' : 'Add Category'}
                </h2>
                <button
                  onClick={handleCloseModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#140152] focus:border-transparent text-gray-900"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#140152] focus:border-transparent text-gray-900"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Icon (Lucide Icon Name)
                  </label>
                  <select
                    value={formData.icon}
                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#140152] focus:border-transparent text-gray-900"
                  >
                    {commonIcons.map((icon) => (
                      <option key={icon} value={icon}>{icon}</option>
                    ))}
                  </select>
                  <p className="text-sm text-gray-500 mt-1">
                    Choose from common Lucide React icons
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Order Index
                  </label>
                  <input
                    type="number"
                    value={formData.order_index}
                    onChange={(e) => setFormData({ ...formData, order_index: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#140152] focus:border-transparent text-gray-900"
                    min="0"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Lower numbers appear first
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-5 h-5 text-[#140152] border-gray-300 rounded focus:ring-[#140152]"
                  />
                  <label htmlFor="is_active" className="text-sm font-semibold text-gray-700">
                    Active (visible on prayer page)
                  </label>
                </div>

                <div className="flex justify-end gap-4 pt-4">
                  <PremiumButton
                    type="button"
                    onClick={handleCloseModal}
                    className="bg-gray-100 text-gray-700 hover:bg-gray-200"
                  >
                    Cancel
                  </PremiumButton>
                  <PremiumButton
                    type="submit"
                    disabled={saving}
                    className="bg-[#140152] text-white hover:bg-[#1d0175]"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      editingCategory ? 'Update Category' : 'Create Category'
                    )}
                  </PremiumButton>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
