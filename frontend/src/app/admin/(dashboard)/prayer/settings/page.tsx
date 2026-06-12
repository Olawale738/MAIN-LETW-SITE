'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import PremiumButton from '@/components/ui/PremiumButton'
import { ArrowLeft, Save, Loader2, Image as ImageIcon } from 'lucide-react'
import { prayerApi, cmsApi, PrayerPageSettings } from '@/lib/api'
import { useToast } from '@/components/ui/toast'

const inputCls =
  'w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#140152] focus:border-transparent text-gray-900'
const labelCls = 'block text-sm font-semibold text-gray-700 mb-2'
const hintCls = 'text-xs text-gray-500 mt-1'

type FormState = {
  // Hero
  hero_eyebrow: string
  hero_title: string
  hero_subtitle: string
  hero_description: string
  hero_image_url: string
  primary_cta_text: string
  primary_cta_link: string
  secondary_cta_text: string
  secondary_cta_link: string
  // Stats
  stats_eyebrow: string
  stats_heading: string
  stats_subtitle: string
  // Categories
  categories_eyebrow: string
  categories_heading: string
  categories_subtitle: string
  // Schedules
  schedules_eyebrow: string
  schedules_heading: string
  schedules_subtitle: string
  // Final
  final_eyebrow: string
  final_heading: string
  scripture_text: string
  scripture_reference: string
  call_to_action_text: string
  live_prayer_link: string
}

const blank: FormState = {
  hero_eyebrow: '', hero_title: '', hero_subtitle: '', hero_description: '', hero_image_url: '',
  primary_cta_text: '', primary_cta_link: '', secondary_cta_text: '', secondary_cta_link: '',
  stats_eyebrow: '', stats_heading: '', stats_subtitle: '',
  categories_eyebrow: '', categories_heading: '', categories_subtitle: '',
  schedules_eyebrow: '', schedules_heading: '', schedules_subtitle: '',
  final_eyebrow: '', final_heading: '',
  scripture_text: '', scripture_reference: '', call_to_action_text: '', live_prayer_link: ''
}

export default function PrayerSettingsPage() {
  const router = useRouter()
  const { showToast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [formData, setFormData] = useState<FormState>(blank)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      setLoading(true)
      const data = await prayerApi.admin.getSettings()
      setFormData({
        hero_eyebrow: data.hero_eyebrow || '',
        hero_title: data.hero_title,
        hero_subtitle: data.hero_subtitle,
        hero_description: data.hero_description,
        hero_image_url: data.hero_image_url || '',
        primary_cta_text: data.primary_cta_text || '',
        primary_cta_link: data.primary_cta_link || '',
        secondary_cta_text: data.secondary_cta_text || '',
        secondary_cta_link: data.secondary_cta_link || '',
        stats_eyebrow: data.stats_eyebrow || '',
        stats_heading: data.stats_heading || '',
        stats_subtitle: data.stats_subtitle || '',
        categories_eyebrow: data.categories_eyebrow || '',
        categories_heading: data.categories_heading || '',
        categories_subtitle: data.categories_subtitle || '',
        schedules_eyebrow: data.schedules_eyebrow || '',
        schedules_heading: data.schedules_heading || '',
        schedules_subtitle: data.schedules_subtitle || '',
        final_eyebrow: data.final_eyebrow || '',
        final_heading: data.final_heading || '',
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

  const set = (field: keyof FormState, value: string) =>
    setFormData(prev => ({ ...prev, [field]: value }))

  const handleHeroUpload = async (file: File) => {
    try {
      setUploading(true)
      const res = await cmsApi.uploadImage(file)
      set('hero_image_url', res.url || '')
      showToast('Image uploaded', 'success')
    } catch (e) {
      console.error(e)
      showToast('Image upload failed', 'error')
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setSaving(true)
      await prayerApi.admin.updateSettings(formData)
      showToast('Prayer page updated', 'success')
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
          <p className="text-gray-600 mt-1">Every word, link, and section heading on /prayer.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ─── 1. Hero ────────────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle>1. Hero Section</CardTitle>
            <p className="text-xs text-gray-500">Top of /prayer — overlaid on a background image.</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Hero Eyebrow</label>
                <input type="text" value={formData.hero_eyebrow} onChange={(e) => set('hero_eyebrow', e.target.value)} className={inputCls} placeholder="United in Prayer" />
              </div>
              <div>
                <label className={labelCls}>Hero Title</label>
                <input type="text" value={formData.hero_title} onChange={(e) => set('hero_title', e.target.value)} className={inputCls} required />
              </div>
            </div>
            <div>
              <label className={labelCls}>Hero Subtitle (italic line)</label>
              <input type="text" value={formData.hero_subtitle} onChange={(e) => set('hero_subtitle', e.target.value)} className={inputCls} required />
            </div>
            <div>
              <label className={labelCls}>Hero Description</label>
              <textarea value={formData.hero_description} onChange={(e) => set('hero_description', e.target.value)} className={inputCls} rows={3} required />
            </div>

            <div>
              <label className={labelCls}>Hero Background Image</label>
              <div className="flex gap-3 items-start">
                <input
                  type="text"
                  value={formData.hero_image_url}
                  onChange={(e) => set('hero_image_url', e.target.value)}
                  className={inputCls}
                  placeholder="/PrayerMeeting.png or full URL or upload below"
                />
                <label className="shrink-0 inline-flex items-center gap-2 bg-[#140152] hover:bg-[#1d0175] text-white font-bold px-4 py-3 rounded-lg cursor-pointer">
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
                  Upload
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleHeroUpload(e.target.files[0])}
                  />
                </label>
              </div>
              {formData.hero_image_url && (
                <div className="mt-3 rounded-lg overflow-hidden border border-gray-200 max-w-md">
                  <img src={formData.hero_image_url.startsWith('http') || formData.hero_image_url.startsWith('/') ? formData.hero_image_url : cmsApi.getImageUrl(formData.hero_image_url)} alt="Hero preview" className="w-full h-auto" />
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-dashed border-gray-200 grid md:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Primary CTA Text</label>
                <input type="text" value={formData.primary_cta_text} onChange={(e) => set('primary_cta_text', e.target.value)} className={inputCls} placeholder="Enter the Prayer Room" />
              </div>
              <div>
                <label className={labelCls}>Primary CTA Link</label>
                <input type="text" value={formData.primary_cta_link} onChange={(e) => set('primary_cta_link', e.target.value)} className={inputCls} placeholder="https://zoom.us/... or /prayer-room" />
                <p className={hintCls}>If empty, falls back to "Live Prayer Link" below.</p>
              </div>
              <div>
                <label className={labelCls}>Secondary CTA Text</label>
                <input type="text" value={formData.secondary_cta_text} onChange={(e) => set('secondary_cta_text', e.target.value)} className={inputCls} placeholder="Submit a Prayer Request" />
              </div>
              <div>
                <label className={labelCls}>Secondary CTA Link</label>
                <input type="text" value={formData.secondary_cta_link} onChange={(e) => set('secondary_cta_link', e.target.value)} className={inputCls} placeholder="/prayer-request" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ─── 2. Stats Band ──────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle>2. Stats Band</CardTitle>
            <p className="text-xs text-gray-500">Heading copy for the impact-numbers band. Add/edit the actual numbers under <strong>Impact Stats</strong>.</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Stats Eyebrow</label>
                <input type="text" value={formData.stats_eyebrow} onChange={(e) => set('stats_eyebrow', e.target.value)} className={inputCls} placeholder="The Movement" />
              </div>
              <div>
                <label className={labelCls}>Stats Heading</label>
                <input type="text" value={formData.stats_heading} onChange={(e) => set('stats_heading', e.target.value)} className={inputCls} placeholder="Lives Touched. Nations Shifted." />
              </div>
            </div>
            <div>
              <label className={labelCls}>Stats Subtitle (optional)</label>
              <textarea value={formData.stats_subtitle} onChange={(e) => set('stats_subtitle', e.target.value)} className={inputCls} rows={2} />
            </div>
          </CardContent>
        </Card>

        {/* ─── 3. Categories Grid ─────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle>3. "What Happens When We Pray Together" Grid</CardTitle>
            <p className="text-xs text-gray-500">Heading copy only. Add/edit the actual cards under <strong>Prayer Categories</strong>.</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Categories Eyebrow</label>
                <input type="text" value={formData.categories_eyebrow} onChange={(e) => set('categories_eyebrow', e.target.value)} className={inputCls} placeholder="United in Prayer" />
              </div>
              <div>
                <label className={labelCls}>Categories Heading</label>
                <input type="text" value={formData.categories_heading} onChange={(e) => set('categories_heading', e.target.value)} className={inputCls} placeholder="What Happens When We Pray Together" />
              </div>
            </div>
            <div>
              <label className={labelCls}>Categories Subtitle (optional)</label>
              <textarea value={formData.categories_subtitle} onChange={(e) => set('categories_subtitle', e.target.value)} className={inputCls} rows={2} />
            </div>
          </CardContent>
        </Card>

        {/* ─── 4. Schedules Grid ──────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle>4. "Join a Prayer Gathering" Grid</CardTitle>
            <p className="text-xs text-gray-500">Heading copy only. Add/edit the actual gatherings under <strong>Prayer Schedules</strong>.</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Schedules Eyebrow</label>
                <input type="text" value={formData.schedules_eyebrow} onChange={(e) => set('schedules_eyebrow', e.target.value)} className={inputCls} placeholder="When We Gather" />
              </div>
              <div>
                <label className={labelCls}>Schedules Heading</label>
                <input type="text" value={formData.schedules_heading} onChange={(e) => set('schedules_heading', e.target.value)} className={inputCls} placeholder="Join a Prayer Gathering" />
              </div>
            </div>
            <div>
              <label className={labelCls}>Schedules Subtitle (optional)</label>
              <textarea value={formData.schedules_subtitle} onChange={(e) => set('schedules_subtitle', e.target.value)} className={inputCls} rows={2} />
            </div>
          </CardContent>
        </Card>

        {/* ─── 5. The Altar is Open ───────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle>5. The Altar Is Open — Final Call</CardTitle>
            <p className="text-xs text-gray-500">Closing section with scripture + tagline + CTAs.</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Final Eyebrow</label>
                <input type="text" value={formData.final_eyebrow} onChange={(e) => set('final_eyebrow', e.target.value)} className={inputCls} placeholder="The Altar Is Open" />
              </div>
              <div>
                <label className={labelCls}>Final Heading</label>
                <input type="text" value={formData.final_heading} onChange={(e) => set('final_heading', e.target.value)} className={inputCls} placeholder="Will You Step In?" />
              </div>
            </div>

            <div>
              <label className={labelCls}>Scripture Text</label>
              <textarea value={formData.scripture_text} onChange={(e) => set('scripture_text', e.target.value)} className={inputCls} rows={3} required />
            </div>
            <div>
              <label className={labelCls}>Scripture Reference</label>
              <input type="text" value={formData.scripture_reference} onChange={(e) => set('scripture_reference', e.target.value)} className={inputCls} placeholder="Isaiah 56:7" required />
            </div>
            <div>
              <label className={labelCls}>Call-to-Action Tagline</label>
              <textarea value={formData.call_to_action_text} onChange={(e) => set('call_to_action_text', e.target.value)} className={inputCls} rows={2} required placeholder="Join the global prayer movement. Your voice matters. Your prayer changes history." />
            </div>
            <div>
              <label className={labelCls}>Live Prayer Link (default for Primary CTA)</label>
              <input type="url" value={formData.live_prayer_link} onChange={(e) => set('live_prayer_link', e.target.value)} className={inputCls} placeholder="https://zoom.us/j/..." />
              <p className={hintCls}>Used by the Primary CTA when its own link is empty.</p>
            </div>
          </CardContent>
        </Card>

        {/* Submit */}
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
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
            ) : (
              <><Save className="w-4 h-4 mr-2" /> Save Settings</>
            )}
          </PremiumButton>
        </div>
      </form>
    </div>
  )
}
