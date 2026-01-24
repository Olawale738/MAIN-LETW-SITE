'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import PremiumButton from '@/components/ui/PremiumButton'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
import { prayerApi, PrayerPageSettings } from '@/lib/api'
import { useToast } from '@/components/ui/toast'

export default function PrayerSettingsPage() {
  const router = useRouter()
  const { showToast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState<PrayerPageSettings | null>(null)

  const [formData, setFormData] = useState({
    hero_title: '',
    hero_subtitle: '',
    hero_description: '',
    hero_image_url: '',
    scripture_text: '',
    scripture_reference: '',
    call_to_action_text: '',
    live_prayer_link: ''
  })

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      setLoading(true)
      const data = await prayerApi.admin.getSettings()
      setSettings(data)
      setFormData({
        hero_title: data.hero_title,
        hero_subtitle: data.hero_subtitle,
        hero_description: data.hero_description,
        hero_image_url: data.hero_image_url || '',
        scripture_text: data.scripture_text,
        scripture_reference: data.scripture_reference,
        call_to_action_text: data.call_to_action_text,
        live_prayer_link: data.live_prayer_link || ''
      })
    } catch (error) {
      console.error('Failed to fetch settings:', error)
      showToast('Failed to load settings', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setSaving(true)
      await prayerApi.admin.updateSettings(formData)
      showToast('Settings updated successfully!', 'success')
      router.push('/admin/prayer')
    } catch (error) {
      console.error('Failed to update settings:', error)
      showToast('Failed to update settings', 'error')
    } finally {
      setSaving(false)
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
      <div className="flex items-center gap-4">
        <PremiumButton
          onClick={() => router.push('/admin/prayer')}
          className="bg-gray-100 text-gray-700 hover:bg-gray-200"
        >
          <ArrowLeft className="w-4 h-4" />
        </PremiumButton>
        <div>
          <h1 className="text-3xl font-black text-[#140152]">Prayer Page Settings</h1>
          <p className="text-gray-600 mt-1">Customize the prayer page content</p>
        </div>
      </div>

      {/* Settings Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Hero Section */}
        <Card>
          <CardHeader>
            <CardTitle>Hero Section</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Hero Title
              </label>
              <input
                type="text"
                value={formData.hero_title}
                onChange={(e) => setFormData({ ...formData, hero_title: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#140152] focus:border-transparent text-gray-900"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Hero Subtitle
              </label>
              <input
                type="text"
                value={formData.hero_subtitle}
                onChange={(e) => setFormData({ ...formData, hero_subtitle: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#140152] focus:border-transparent text-gray-900"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Hero Description
              </label>
              <textarea
                value={formData.hero_description}
                onChange={(e) => setFormData({ ...formData, hero_description: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#140152] focus:border-transparent text-gray-900"
                rows={3}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Hero Background Image URL
              </label>
              <input
                type="url"
                value={formData.hero_image_url}
                onChange={(e) => setFormData({ ...formData, hero_image_url: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#140152] focus:border-transparent text-gray-900"
                placeholder="https://example.com/image.jpg"
              />
            </div>
          </CardContent>
        </Card>

        {/* Scripture Section */}
        <Card>
          <CardHeader>
            <CardTitle>Scripture Section</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Scripture Text
              </label>
              <textarea
                value={formData.scripture_text}
                onChange={(e) => setFormData({ ...formData, scripture_text: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#140152] focus:border-transparent text-gray-900"
                rows={3}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Scripture Reference
              </label>
              <input
                type="text"
                value={formData.scripture_reference}
                onChange={(e) => setFormData({ ...formData, scripture_reference: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#140152] focus:border-transparent text-gray-900"
                placeholder="e.g., Isaiah 56:7"
                required
              />
            </div>
          </CardContent>
        </Card>

        {/* Call to Action */}
        <Card>
          <CardHeader>
            <CardTitle>Call to Action</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Call to Action Text
              </label>
              <textarea
                value={formData.call_to_action_text}
                onChange={(e) => setFormData({ ...formData, call_to_action_text: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#140152] focus:border-transparent text-gray-900"
                rows={2}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Live Prayer Link (Optional)
              </label>
              <input
                type="url"
                value={formData.live_prayer_link}
                onChange={(e) => setFormData({ ...formData, live_prayer_link: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#140152] focus:border-transparent text-gray-900"
                placeholder="https://zoom.us/j/..."
              />
              <p className="text-sm text-gray-500 mt-1">
                Link to join live prayer sessions (e.g., Zoom, YouTube Live)
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-end gap-4">
          <PremiumButton
            type="button"
            onClick={() => router.push('/admin/prayer')}
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
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Settings
              </>
            )}
          </PremiumButton>
        </div>
      </form>
    </div>
  )
}
