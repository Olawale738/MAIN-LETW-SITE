'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import PremiumButton from '@/components/ui/PremiumButton'
import { ArrowLeft, Plus, Edit, Trash2, Loader2, X } from 'lucide-react'
import { prayerApi, PrayerSchedule, PrayerScheduleCreate } from '@/lib/api'
import { useToast } from '@/components/ui/toast'
import { motion, AnimatePresence } from 'framer-motion'

export default function PrayerSchedulesPage() {
  const router = useRouter()
  const { showToast } = useToast()
  const [loading, setLoading] = useState(true)
  const [schedules, setSchedules] = useState<PrayerSchedule[]>([])
  const [showModal, setShowModal] = useState(false)
  const [editingSchedule, setEditingSchedule] = useState<PrayerSchedule | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  const [formData, setFormData] = useState<PrayerScheduleCreate>({
    program_name: '',
    time_description: '',
    description: '',
    icon: 'Clock',
    meeting_link: '',
    order_index: 0,
    is_active: true
  })

  useEffect(() => {
    fetchSchedules()
  }, [])

  const fetchSchedules = async () => {
    try {
      setLoading(true)
      const data = await prayerApi.admin.getSchedules()
      setSchedules(data.sort((a, b) => a.order_index - b.order_index))
    } catch (error) {
      console.error('Failed to fetch schedules:', error)
      showToast('Failed to load schedules', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenModal = (schedule?: PrayerSchedule) => {
    if (schedule) {
      setEditingSchedule(schedule)
      setFormData({
        program_name: schedule.program_name,
        time_description: schedule.time_description,
        description: schedule.description || '',
        icon: schedule.icon || 'Clock',
        meeting_link: schedule.meeting_link || '',
        order_index: schedule.order_index,
        is_active: schedule.is_active
      })
    } else {
      setEditingSchedule(null)
      setFormData({
        program_name: '',
        time_description: '',
        description: '',
        icon: 'Clock',
        meeting_link: '',
        order_index: schedules.length,
        is_active: true
      })
    }
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingSchedule(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setSaving(true)
      if (editingSchedule) {
        await prayerApi.admin.updateSchedule(editingSchedule.id, formData)
        showToast('Schedule updated successfully!', 'success')
      } else {
        await prayerApi.admin.createSchedule(formData)
        showToast('Schedule created successfully!', 'success')
      }
      handleCloseModal()
      fetchSchedules()
    } catch (error) {
      console.error('Failed to save schedule:', error)
      showToast('Failed to save schedule', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this schedule?')) return

    try {
      setDeleting(id)
      await prayerApi.admin.deleteSchedule(id)
      showToast('Schedule deleted successfully!', 'success')
      fetchSchedules()
    } catch (error) {
      console.error('Failed to delete schedule:', error)
      showToast('Failed to delete schedule', 'error')
    } finally {
      setDeleting(null)
    }
  }

  const commonIcons = [
    'Clock', 'Calendar', 'Moon', 'Sun', 'Globe', 'Users',
    'Video', 'Radio', 'Mic', 'Bell', 'Star', 'Zap'
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
            <h1 className="text-3xl font-black text-[#140152]">Prayer Schedules</h1>
            <p className="text-gray-600 mt-1">Manage prayer programs and schedules</p>
          </div>
        </div>
        <PremiumButton
          onClick={() => handleOpenModal()}
          className="bg-[#140152] text-white hover:bg-[#1d0175]"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Schedule
        </PremiumButton>
      </div>

      {/* Schedules List */}
      <div className="grid gap-4">
        {schedules.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-gray-500">No schedules yet. Create your first schedule!</p>
            </CardContent>
          </Card>
        ) : (
          schedules.map((schedule) => (
            <Card key={schedule.id} className={!schedule.is_active ? 'opacity-60' : ''}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-[#140152]">{schedule.program_name}</h3>
                      {!schedule.is_active && (
                        <span className="px-2 py-1 bg-gray-200 text-gray-600 text-xs rounded-full">
                          Inactive
                        </span>
                      )}
                    </div>
                    <p className="text-[#f5bb00] font-semibold mb-2">{schedule.time_description}</p>
                    <p className="text-gray-600 mb-3">{schedule.description}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>Icon: {schedule.icon || 'Clock'}</span>
                      <span>Order: {schedule.order_index}</span>
                      {schedule.meeting_link && (
                        <a
                          href={schedule.meeting_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:underline"
                        >
                          Meeting Link →
                        </a>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <PremiumButton
                      onClick={() => handleOpenModal(schedule)}
                      className="bg-blue-500 text-white hover:bg-blue-600"
                    >
                      <Edit className="w-4 h-4" />
                    </PremiumButton>
                    <PremiumButton
                      onClick={() => handleDelete(schedule.id)}
                      disabled={deleting === schedule.id}
                      className="bg-red-500 text-white hover:bg-red-600"
                    >
                      {deleting === schedule.id ? (
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
                  {editingSchedule ? 'Edit Schedule' : 'Add Schedule'}
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
                    Program Name *
                  </label>
                  <input
                    type="text"
                    value={formData.program_name}
                    onChange={(e) => setFormData({ ...formData, program_name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#140152] focus:border-transparent text-gray-900"
                    placeholder="e.g., Daily Prayer Hour"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Time Description *
                  </label>
                  <input
                    type="text"
                    value={formData.time_description}
                    onChange={(e) => setFormData({ ...formData, time_description: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#140152] focus:border-transparent text-gray-900"
                    placeholder="e.g., Every Day • 7:00 PM GMT"
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
                    placeholder="Brief description of the prayer program"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Meeting Link
                  </label>
                  <input
                    type="url"
                    value={formData.meeting_link}
                    onChange={(e) => setFormData({ ...formData, meeting_link: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#140152] focus:border-transparent text-gray-900"
                    placeholder="https://zoom.us/j/..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Icon
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
                      editingSchedule ? 'Update Schedule' : 'Create Schedule'
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
