'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import PremiumButton from '@/components/ui/PremiumButton'
import { ArrowLeft, Plus, Edit, Trash2, Loader2, X } from 'lucide-react'
import { prayerApi, PrayerStat, PrayerStatCreate } from '@/lib/api'
import { useToast } from '@/components/ui/toast'
import { motion, AnimatePresence } from 'framer-motion'

export default function PrayerStatsPage() {
  const router = useRouter()
  const { showToast } = useToast()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<PrayerStat[]>([])
  const [showModal, setShowModal] = useState(false)
  const [editingStat, setEditingStat] = useState<PrayerStat | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  const [formData, setFormData] = useState<PrayerStatCreate>({
    label: '',
    value: '',
    order_index: 0,
    is_active: true
  })

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      setLoading(true)
      const data = await prayerApi.admin.getStats()
      setStats(data.sort((a, b) => a.order_index - b.order_index))
    } catch (error) {
      console.error('Failed to fetch stats:', error)
      showToast('Failed to load stats', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenModal = (stat?: PrayerStat) => {
    if (stat) {
      setEditingStat(stat)
      setFormData({
        label: stat.label,
        value: stat.value,
        order_index: stat.order_index,
        is_active: stat.is_active
      })
    } else {
      setEditingStat(null)
      setFormData({
        label: '',
        value: '',
        order_index: stats.length,
        is_active: true
      })
    }
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingStat(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setSaving(true)
      if (editingStat) {
        await prayerApi.admin.updateStat(editingStat.id, formData)
        showToast('Stat updated successfully!', 'success')
      } else {
        await prayerApi.admin.createStat(formData)
        showToast('Stat created successfully!', 'success')
      }
      handleCloseModal()
      fetchStats()
    } catch (error) {
      console.error('Failed to save stat:', error)
      showToast('Failed to save stat', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this stat?')) return

    try {
      setDeleting(id)
      await prayerApi.admin.deleteStat(id)
      showToast('Stat deleted successfully!', 'success')
      fetchStats()
    } catch (error) {
      console.error('Failed to delete stat:', error)
      showToast('Failed to delete stat', 'error')
    } finally {
      setDeleting(null)
    }
  }

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
            <h1 className="text-3xl font-black text-[#140152]">Impact Statistics</h1>
            <p className="text-gray-600 mt-1">Manage prayer impact statistics</p>
          </div>
        </div>
        <PremiumButton
          onClick={() => handleOpenModal()}
          className="bg-[#140152] text-white hover:bg-[#1d0175]"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Stat
        </PremiumButton>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="p-12 text-center">
              <p className="text-gray-500">No stats yet. Create your first stat!</p>
            </CardContent>
          </Card>
        ) : (
          stats.map((stat) => (
            <Card key={stat.id} className={!stat.is_active ? 'opacity-60' : ''}>
              <CardContent className="p-6">
                <div className="text-center">
                  <div className="text-4xl font-black text-[#f5bb00] mb-2">{stat.value}</div>
                  <div className="text-sm font-semibold text-[#140152] mb-3">{stat.label}</div>
                  {!stat.is_active && (
                    <span className="px-2 py-1 bg-gray-200 text-gray-600 text-xs rounded-full">
                      Inactive
                    </span>
                  )}
                  <div className="flex items-center justify-center gap-2 mt-4">
                    <PremiumButton
                      onClick={() => handleOpenModal(stat)}
                      className="bg-blue-500 text-white hover:bg-blue-600 text-xs px-3 py-1"
                    >
                      <Edit className="w-3 h-3" />
                    </PremiumButton>
                    <PremiumButton
                      onClick={() => handleDelete(stat.id)}
                      disabled={deleting === stat.id}
                      className="bg-red-500 text-white hover:bg-red-600 text-xs px-3 py-1"
                    >
                      {deleting === stat.id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Trash2 className="w-3 h-3" />
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
              className="bg-white rounded-2xl shadow-2xl max-w-lg w-full"
            >
              <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-2xl font-black text-[#140152]">
                  {editingStat ? 'Edit Stat' : 'Add Stat'}
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
                    Label *
                  </label>
                  <input
                    type="text"
                    value={formData.label}
                    onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#140152] focus:border-transparent text-gray-900"
                    placeholder="e.g., Nations Interceding"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Value *
                  </label>
                  <input
                    type="text"
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#140152] focus:border-transparent text-gray-900"
                    placeholder="e.g., 178 or 3.4M+"
                    required
                  />
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
                      editingStat ? 'Update Stat' : 'Create Stat'
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
