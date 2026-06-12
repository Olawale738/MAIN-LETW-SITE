'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import PremiumButton from '@/components/ui/PremiumButton'
import { ArrowLeft, Save, Loader2, Image as ImageIcon, Plus, Trash2, ChevronUp, ChevronDown } from 'lucide-react'
import { prayerApi, cmsApi, PrayerPageSettings } from '@/lib/api'
import { useToast } from '@/components/ui/toast'

const inputCls =
  'w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#140152] focus:border-transparent text-gray-900'
const labelCls = 'block text-sm font-semibold text-gray-700 mb-2'
const hintCls = 'text-xs text-gray-500 mt-1'

type Pillar = { icon?: string; title: string; description: string }
type Step = { number?: string; title: string; description?: string; link?: string; link_text?: string }

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
  // Manifesto (NEW)
  manifesto_eyebrow: string
  manifesto_heading: string
  manifesto_subtitle: string
  // How To Pray (NEW)
  how_eyebrow: string
  how_heading: string
  how_subtitle: string
  // Answered (NEW)
  answered_eyebrow: string
  answered_heading: string
  answered_subtitle: string
  answered_max_items: string
  // Prayer Wall preview (NEW)
  wall_eyebrow: string
  wall_heading: string
  wall_subtitle: string
  wall_link: string
  wall_link_text: string
  wall_max_items: string
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
  manifesto_eyebrow: '', manifesto_heading: '', manifesto_subtitle: '',
  how_eyebrow: '', how_heading: '', how_subtitle: '',
  answered_eyebrow: '', answered_heading: '', answered_subtitle: '', answered_max_items: '',
  wall_eyebrow: '', wall_heading: '', wall_subtitle: '', wall_link: '', wall_link_text: '', wall_max_items: '',
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
  const [pillars, setPillars] = useState<Pillar[]>([])
  const [steps, setSteps] = useState<Step[]>([])

  useEffect(() => {
    fetchSettings()
  }, [])

  // Deep-link: when settings finish loading and there's a #hash, scroll to it.
  useEffect(() => {
    if (loading) return
    if (typeof window === 'undefined') return
    const hash = window.location.hash.replace('#', '')
    if (!hash) return
    const el = document.getElementById(hash)
    if (el) {
      setTimeout(() => {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
        el.classList.add('ring-2', 'ring-[#f5bb00]', 'ring-offset-2')
        setTimeout(() => el.classList.remove('ring-2', 'ring-[#f5bb00]', 'ring-offset-2'), 2400)
      }, 100)
    }
  }, [loading])

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
        manifesto_eyebrow: data.manifesto_eyebrow || '',
        manifesto_heading: data.manifesto_heading || '',
        manifesto_subtitle: data.manifesto_subtitle || '',
        how_eyebrow: data.how_eyebrow || '',
        how_heading: data.how_heading || '',
        how_subtitle: data.how_subtitle || '',
        answered_eyebrow: data.answered_eyebrow || '',
        answered_heading: data.answered_heading || '',
        answered_subtitle: data.answered_subtitle || '',
        answered_max_items: data.answered_max_items != null ? String(data.answered_max_items) : '',
        wall_eyebrow: data.wall_eyebrow || '',
        wall_heading: data.wall_heading || '',
        wall_subtitle: data.wall_subtitle || '',
        wall_link: data.wall_link || '',
        wall_link_text: data.wall_link_text || '',
        wall_max_items: data.wall_max_items != null ? String(data.wall_max_items) : '',
        final_eyebrow: data.final_eyebrow || '',
        final_heading: data.final_heading || '',
        scripture_text: data.scripture_text,
        scripture_reference: data.scripture_reference,
        call_to_action_text: data.call_to_action_text,
        live_prayer_link: data.live_prayer_link || ''
      })
      setPillars(Array.isArray(data.manifesto_pillars) ? data.manifesto_pillars : [])
      setSteps(Array.isArray(data.how_steps) ? data.how_steps : [])
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
      const payload: any = { ...formData }
      payload.manifesto_pillars = pillars.filter(p => p.title?.trim())
      payload.how_steps = steps.filter(s => s.title?.trim())
      payload.answered_max_items = formData.answered_max_items ? parseInt(formData.answered_max_items, 10) : undefined
      payload.wall_max_items = formData.wall_max_items ? parseInt(formData.wall_max_items, 10) : undefined
      await prayerApi.admin.updateSettings(payload)
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
        <Card id="hero">
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
        <Card id="stats">
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
        <Card id="categories">
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
        <Card id="schedules">
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

        {/* ─── NEW: Manifesto / Why We Pray ──────────────────────── */}
        <Card id="manifesto">
          <CardHeader>
            <CardTitle>★ Manifesto — &ldquo;Why We Pray&rdquo; band</CardTitle>
            <p className="text-xs text-gray-500">Sits right after the hero. 1–4 pillar cards.</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Manifesto Eyebrow</label>
                <input type="text" value={formData.manifesto_eyebrow} onChange={(e) => set('manifesto_eyebrow', e.target.value)} className={inputCls} placeholder="The Heart Behind the Altar" />
              </div>
              <div>
                <label className={labelCls}>Manifesto Heading</label>
                <input type="text" value={formData.manifesto_heading} onChange={(e) => set('manifesto_heading', e.target.value)} className={inputCls} placeholder="We Don't Just Pray. We War." />
              </div>
            </div>
            <div>
              <label className={labelCls}>Manifesto Subtitle (optional)</label>
              <textarea value={formData.manifesto_subtitle} onChange={(e) => set('manifesto_subtitle', e.target.value)} className={inputCls} rows={2} />
            </div>

            <div className="border-t pt-4 mt-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-gray-700">Pillars</p>
                <button type="button" onClick={() => setPillars([...pillars, { icon: 'Flame', title: '', description: '' }])} className="inline-flex items-center gap-1 text-sm font-bold text-[#140152] hover:text-[#1d0175]">
                  <Plus className="w-4 h-4" /> Add pillar
                </button>
              </div>
              {pillars.length === 0 && (
                <p className="text-xs text-gray-400 italic">No pillars saved — the page will render 3 sensible defaults until you add your own.</p>
              )}
              {pillars.map((p, idx) => (
                <div key={idx} className="rounded-xl border border-gray-200 p-4 space-y-3 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Pillar {idx + 1}</p>
                    <div className="flex items-center gap-1">
                      <button type="button" onClick={() => { if (idx === 0) return; const n = [...pillars]; [n[idx - 1], n[idx]] = [n[idx], n[idx - 1]]; setPillars(n); }} disabled={idx === 0} className="p-1 hover:bg-gray-200 rounded disabled:opacity-30"><ChevronUp className="w-4 h-4" /></button>
                      <button type="button" onClick={() => { if (idx === pillars.length - 1) return; const n = [...pillars]; [n[idx + 1], n[idx]] = [n[idx], n[idx + 1]]; setPillars(n); }} disabled={idx === pillars.length - 1} className="p-1 hover:bg-gray-200 rounded disabled:opacity-30"><ChevronDown className="w-4 h-4" /></button>
                      <button type="button" onClick={() => setPillars(pillars.filter((_, i) => i !== idx))} className="p-1 text-red-500 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-gray-600">Icon (lucide name)</label>
                      <input value={p.icon || ''} onChange={(e) => { const n = [...pillars]; n[idx] = { ...n[idx], icon: e.target.value }; setPillars(n); }} className={inputCls + ' py-2 text-sm'} placeholder="Flame, Sword, HeartHandshake, Sparkles..." />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-600">Title</label>
                      <input value={p.title} onChange={(e) => { const n = [...pillars]; n[idx] = { ...n[idx], title: e.target.value }; setPillars(n); }} className={inputCls + ' py-2 text-sm'} placeholder="Persistent" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600">Description</label>
                    <textarea value={p.description} onChange={(e) => { const n = [...pillars]; n[idx] = { ...n[idx], description: e.target.value }; setPillars(n); }} className={inputCls + ' py-2 text-sm'} rows={2} placeholder="What this pillar means to us." />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* ─── NEW: How To Pray With Us ──────────────────────────── */}
        <Card id="how">
          <CardHeader>
            <CardTitle>★ How To Pray With Us — Steps</CardTitle>
            <p className="text-xs text-gray-500">Sits after the &ldquo;What Happens&rdquo; grid. 1–4 numbered steps.</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>How Eyebrow</label>
                <input type="text" value={formData.how_eyebrow} onChange={(e) => set('how_eyebrow', e.target.value)} className={inputCls} placeholder="Three Steps" />
              </div>
              <div>
                <label className={labelCls}>How Heading</label>
                <input type="text" value={formData.how_heading} onChange={(e) => set('how_heading', e.target.value)} className={inputCls} placeholder="How To Pray With Us" />
              </div>
            </div>
            <div>
              <label className={labelCls}>How Subtitle (optional)</label>
              <textarea value={formData.how_subtitle} onChange={(e) => set('how_subtitle', e.target.value)} className={inputCls} rows={2} />
            </div>

            <div className="border-t pt-4 mt-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-gray-700">Steps</p>
                <button type="button" onClick={() => setSteps([...steps, { number: String(steps.length + 1).padStart(2, '0'), title: '', description: '' }])} className="inline-flex items-center gap-1 text-sm font-bold text-[#140152] hover:text-[#1d0175]">
                  <Plus className="w-4 h-4" /> Add step
                </button>
              </div>
              {steps.length === 0 && (
                <p className="text-xs text-gray-400 italic">No steps saved — the page will render 3 sensible defaults until you add your own.</p>
              )}
              {steps.map((s, idx) => (
                <div key={idx} className="rounded-xl border border-gray-200 p-4 space-y-3 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Step {idx + 1}</p>
                    <div className="flex items-center gap-1">
                      <button type="button" onClick={() => { if (idx === 0) return; const n = [...steps]; [n[idx - 1], n[idx]] = [n[idx], n[idx - 1]]; setSteps(n); }} disabled={idx === 0} className="p-1 hover:bg-gray-200 rounded disabled:opacity-30"><ChevronUp className="w-4 h-4" /></button>
                      <button type="button" onClick={() => { if (idx === steps.length - 1) return; const n = [...steps]; [n[idx + 1], n[idx]] = [n[idx], n[idx + 1]]; setSteps(n); }} disabled={idx === steps.length - 1} className="p-1 hover:bg-gray-200 rounded disabled:opacity-30"><ChevronDown className="w-4 h-4" /></button>
                      <button type="button" onClick={() => setSteps(steps.filter((_, i) => i !== idx))} className="p-1 text-red-500 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                  <div className="grid md:grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-gray-600">Number</label>
                      <input value={s.number || ''} onChange={(e) => { const n = [...steps]; n[idx] = { ...n[idx], number: e.target.value }; setSteps(n); }} className={inputCls + ' py-2 text-sm'} placeholder="01" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-xs font-semibold text-gray-600">Title</label>
                      <input value={s.title} onChange={(e) => { const n = [...steps]; n[idx] = { ...n[idx], title: e.target.value }; setSteps(n); }} className={inputCls + ' py-2 text-sm'} placeholder="Submit Your Request" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600">Description</label>
                    <textarea value={s.description || ''} onChange={(e) => { const n = [...steps]; n[idx] = { ...n[idx], description: e.target.value }; setSteps(n); }} className={inputCls + ' py-2 text-sm'} rows={2} />
                  </div>
                  <div className="grid md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-gray-600">Link URL (optional)</label>
                      <input value={s.link || ''} onChange={(e) => { const n = [...steps]; n[idx] = { ...n[idx], link: e.target.value }; setSteps(n); }} className={inputCls + ' py-2 text-sm'} placeholder="/prayer-request" />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-600">Link text (optional)</label>
                      <input value={s.link_text || ''} onChange={(e) => { const n = [...steps]; n[idx] = { ...n[idx], link_text: e.target.value }; setSteps(n); }} className={inputCls + ' py-2 text-sm'} placeholder="Submit a Request" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* ─── NEW: Answered Prayers ─────────────────────────────── */}
        <Card id="answered">
          <CardHeader>
            <CardTitle>★ Recent Answered Prayers</CardTitle>
            <p className="text-xs text-gray-500">Auto-pulls from <strong>Prayer Requests</strong> with status=answered, public, with a testimony. Only headings/subtitle here.</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Answered Eyebrow</label>
                <input type="text" value={formData.answered_eyebrow} onChange={(e) => set('answered_eyebrow', e.target.value)} className={inputCls} placeholder="He Is Faithful" />
              </div>
              <div>
                <label className={labelCls}>Answered Heading</label>
                <input type="text" value={formData.answered_heading} onChange={(e) => set('answered_heading', e.target.value)} className={inputCls} placeholder="Recent Answered Prayers" />
              </div>
            </div>
            <div>
              <label className={labelCls}>Answered Subtitle (optional)</label>
              <textarea value={formData.answered_subtitle} onChange={(e) => set('answered_subtitle', e.target.value)} className={inputCls} rows={2} />
            </div>
            <div className="max-w-xs">
              <label className={labelCls}>Max items shown</label>
              <input type="number" min="1" max="24" value={formData.answered_max_items} onChange={(e) => set('answered_max_items', e.target.value)} className={inputCls} placeholder="6" />
              <p className={hintCls}>Section hides if there are zero answered prayers with testimonies.</p>
            </div>
          </CardContent>
        </Card>

        {/* ─── NEW: Prayer Wall Preview ──────────────────────────── */}
        <Card id="wall">
          <CardHeader>
            <CardTitle>★ Prayer Wall preview</CardTitle>
            <p className="text-xs text-gray-500">Auto-pulls from recent public Prayer Requests. Shows N items + a CTA.</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Wall Eyebrow</label>
                <input type="text" value={formData.wall_eyebrow} onChange={(e) => set('wall_eyebrow', e.target.value)} className={inputCls} placeholder="The Wall Is Alive" />
              </div>
              <div>
                <label className={labelCls}>Wall Heading</label>
                <input type="text" value={formData.wall_heading} onChange={(e) => set('wall_heading', e.target.value)} className={inputCls} placeholder="Stand With Your Brothers and Sisters" />
              </div>
            </div>
            <div>
              <label className={labelCls}>Wall Subtitle (optional)</label>
              <textarea value={formData.wall_subtitle} onChange={(e) => set('wall_subtitle', e.target.value)} className={inputCls} rows={2} />
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className={labelCls}>Max items shown</label>
                <input type="number" min="1" max="20" value={formData.wall_max_items} onChange={(e) => set('wall_max_items', e.target.value)} className={inputCls} placeholder="4" />
              </div>
              <div>
                <label className={labelCls}>CTA URL</label>
                <input type="text" value={formData.wall_link} onChange={(e) => set('wall_link', e.target.value)} className={inputCls} placeholder="/dashboard/prayer-wall" />
              </div>
              <div>
                <label className={labelCls}>CTA text</label>
                <input type="text" value={formData.wall_link_text} onChange={(e) => set('wall_link_text', e.target.value)} className={inputCls} placeholder="See The Whole Wall" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ─── 5. The Altar is Open ───────────────────────────────── */}
        <Card id="final">
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
