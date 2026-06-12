'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import PremiumButton from '@/components/ui/PremiumButton'
import {
  Loader2,
  Settings,
  Eye,
  ExternalLink,
  Pencil,
  Image as ImageIcon,
  BarChart3,
  ListChecks,
  HandHeart,
  Calendar,
  Sparkles,
  Heart,
  MessageSquare,
  Flame,
  ScrollText,
  ArrowRight,
} from 'lucide-react'
import {
  prayerApi,
  PrayerCategory,
  PrayerSchedule,
  PrayerStat,
  PrayerRequest,
  PrayerPageSettings,
} from '@/lib/api'

type SectionCardProps = {
  index: number
  icon: React.ComponentType<{ className?: string }>
  title: string
  subtitle: string
  description: string
  status?: { label: string; tone: 'ok' | 'warn' | 'info' }[]
  primary: { label: string; href: string }
  secondary?: { label: string; href: string }
  accent: string  // tailwind border + background tint pair, e.g. 'border-l-[#f5bb00] from-[#f5bb00]/5'
}

function SectionCard({
  index, icon: Icon, title, subtitle, description, status, primary, secondary, accent,
}: SectionCardProps) {
  return (
    <Card className={`relative border-l-4 ${accent.split(' ')[0]} overflow-hidden hover:shadow-lg transition-shadow`}>
      <div className={`absolute inset-0 bg-gradient-to-br ${accent.split(' ').slice(1).join(' ')} to-transparent pointer-events-none opacity-50`} />
      <CardContent className="relative p-6 flex flex-col sm:flex-row sm:items-start gap-5">
        <div className="shrink-0">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#140152] to-[#1d0175] flex items-center justify-center shadow-lg">
            <Icon className="w-7 h-7 text-[#f5bb00]" />
          </div>
          <p className="mt-2 text-center text-[10px] font-bold tracking-widest uppercase text-gray-400">
            Section {index}
          </p>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="min-w-0">
              <h3 className="text-lg md:text-xl font-black text-[#140152] leading-tight">{title}</h3>
              <p className="text-sm text-[#f5bb00] font-bold uppercase tracking-wider mt-0.5">{subtitle}</p>
            </div>
            {status && status.length > 0 && (
              <div className="flex flex-wrap gap-1.5 shrink-0">
                {status.map((s, i) => (
                  <span
                    key={i}
                    className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                      s.tone === 'ok'   ? 'bg-emerald-100 text-emerald-700' :
                      s.tone === 'warn' ? 'bg-amber-100 text-amber-700' :
                                          'bg-blue-100 text-blue-700'
                    }`}
                  >
                    {s.label}
                  </span>
                ))}
              </div>
            )}
          </div>
          <p className="mt-2 text-sm text-gray-600 leading-relaxed">{description}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href={primary.href}
              className="inline-flex items-center gap-2 bg-[#140152] hover:bg-[#1d0175] text-white text-sm font-bold px-4 py-2 rounded-lg transition-colors"
            >
              <Pencil className="w-3.5 h-3.5" /> {primary.label}
            </Link>
            {secondary && (
              <Link
                href={secondary.href}
                className="inline-flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-[#140152] text-sm font-bold px-4 py-2 rounded-lg transition-colors"
              >
                {secondary.label} <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function AdminPrayerPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [settings, setSettings] = useState<PrayerPageSettings | null>(null)
  const [categories, setCategories] = useState<PrayerCategory[]>([])
  const [schedules, setSchedules] = useState<PrayerSchedule[]>([])
  const [stats, setStats] = useState<PrayerStat[]>([])
  const [requests, setRequests] = useState<PrayerRequest[]>([])

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [settingsData, categoriesData, schedulesData, statsData, requestsData] = await Promise.all([
        prayerApi.admin.getSettings(),
        prayerApi.admin.getCategories(),
        prayerApi.admin.getSchedules(),
        prayerApi.admin.getStats(),
        prayerApi.admin.getAllRequests(),
      ])
      setSettings(settingsData)
      setCategories(categoriesData)
      setSchedules(schedulesData)
      setStats(statsData)
      setRequests(requestsData)
    } catch (error) {
      console.error('Failed to fetch prayer data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-[#140152]" />
      </div>
    )
  }

  const activeCategories = categories.filter(c => c.is_active).length
  const activeSchedules = schedules.filter(s => s.is_active).length
  const activeStats = stats.filter(s => s.is_active).length
  const pendingRequests = requests.filter(r => r.status === 'pending').length
  const answeredCount = requests.filter(r => r.status === 'answered' && r.testimony && r.is_public).length
  const publicWallCount = requests.filter(r => r.is_public && r.status !== 'archived').length
  const pillarsCount = Array.isArray(settings?.manifesto_pillars) ? settings!.manifesto_pillars!.length : 0
  const stepsCount = Array.isArray(settings?.how_steps) ? settings!.how_steps!.length : 0

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-[#140152]">Prayer Page</h1>
          <p className="text-gray-600 mt-1">
            Every section of <Link href="/prayer" target="_blank" className="underline hover:text-[#140152]">/prayer</Link> is admin-controlled.
            Click any card below to edit just that section.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a
            href="/prayer"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-white border border-gray-300 hover:bg-gray-50 text-[#140152] font-bold px-4 py-2.5 rounded-lg transition-colors text-sm"
          >
            <Eye className="w-4 h-4" /> Preview live page <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <PremiumButton
            onClick={() => router.push('/admin/prayer/settings')}
            className="bg-[#140152] text-white hover:bg-[#1d0175]"
          >
            <Settings className="w-4 h-4 mr-2" /> All Page Settings
          </PremiumButton>
        </div>
      </div>

      {/* Top-level snapshot stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-[#140152]">
          <CardContent className="p-4">
            <p className="text-xs uppercase font-bold tracking-wider text-gray-500">Categories</p>
            <p className="text-3xl font-black text-[#140152] mt-1">{activeCategories}</p>
            <p className="text-xs text-gray-500 mt-0.5">active</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-[#f5bb00]">
          <CardContent className="p-4">
            <p className="text-xs uppercase font-bold tracking-wider text-gray-500">Schedules</p>
            <p className="text-3xl font-black text-[#f5bb00] mt-1">{activeSchedules}</p>
            <p className="text-xs text-gray-500 mt-0.5">active</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <p className="text-xs uppercase font-bold tracking-wider text-gray-500">Impact Stats</p>
            <p className="text-3xl font-black text-blue-500 mt-1">{activeStats}</p>
            <p className="text-xs text-gray-500 mt-0.5">active</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-emerald-500">
          <CardContent className="p-4">
            <p className="text-xs uppercase font-bold tracking-wider text-gray-500">Answered</p>
            <p className="text-3xl font-black text-emerald-500 mt-1">{answeredCount}</p>
            <p className="text-xs text-gray-500 mt-0.5">with testimonies</p>
          </CardContent>
        </Card>
      </div>

      {/* Page Sections — one card per section, in page order */}
      <div>
        <div className="flex items-baseline gap-3 mb-4">
          <h2 className="text-xl font-black text-[#140152]">Page sections (in order)</h2>
          <span className="text-xs text-gray-500">9 sections, each independently editable</span>
        </div>
        <div className="space-y-4">
          {/* 1. Hero */}
          <SectionCard
            index={1}
            icon={ImageIcon}
            title={settings?.hero_title || 'Hero'}
            subtitle={settings?.hero_eyebrow || 'United in Prayer'}
            description="Cinematic hero band: background image, eyebrow, title, italic subtitle, description, and two CTA buttons (Prayer Room + Submit Request)."
            primary={{ label: 'Edit Hero', href: '/admin/prayer/settings#hero' }}
            accent="border-l-[#140152] from-[#140152]/5"
            status={[
              settings?.hero_image_url ? { label: 'Image set', tone: 'ok' } : { label: 'No image', tone: 'warn' },
              settings?.primary_cta_link || settings?.live_prayer_link ? { label: 'Prayer link set', tone: 'ok' } : { label: 'No prayer link', tone: 'warn' },
            ]}
          />

          {/* 2. Manifesto */}
          <SectionCard
            index={2}
            icon={Flame}
            title={settings?.manifesto_heading || "We Don't Just Pray. We War."}
            subtitle={settings?.manifesto_eyebrow || 'The Heart Behind the Altar'}
            description={`The "Why We Pray" pillar band. ${pillarsCount > 0 ? `${pillarsCount} pillar${pillarsCount === 1 ? '' : 's'} configured.` : 'Renders 3 sensible defaults until you add your own.'}`}
            primary={{ label: 'Edit Manifesto', href: '/admin/prayer/settings#manifesto' }}
            accent="border-l-[#7c3aed] from-[#7c3aed]/5"
            status={[
              pillarsCount > 0 ? { label: `${pillarsCount} pillar${pillarsCount === 1 ? '' : 's'}`, tone: 'ok' } : { label: 'Using defaults', tone: 'info' },
            ]}
          />

          {/* 3. Stats Band */}
          <SectionCard
            index={3}
            icon={BarChart3}
            title={settings?.stats_heading || 'Lives Touched. Nations Shifted.'}
            subtitle={settings?.stats_eyebrow || 'The Movement'}
            description={`Animated counter strip. ${activeStats > 0 ? `${activeStats} stat${activeStats === 1 ? '' : 's'} active.` : 'Section auto-hides because zero stats are active.'}`}
            primary={{ label: 'Manage Stats', href: '/admin/prayer/stats' }}
            secondary={{ label: 'Edit headings', href: '/admin/prayer/settings#stats' }}
            accent="border-l-blue-500 from-blue-500/5"
            status={[
              activeStats > 0 ? { label: `${activeStats} active`, tone: 'ok' } : { label: 'Hidden (0 stats)', tone: 'warn' },
            ]}
          />

          {/* 4. Categories */}
          <SectionCard
            index={4}
            icon={ListChecks}
            title={settings?.categories_heading || 'What Happens When We Pray Together'}
            subtitle={settings?.categories_eyebrow || 'United in Prayer'}
            description={`Grid of prayer "experiences". ${activeCategories > 0 ? `${activeCategories} categor${activeCategories === 1 ? 'y' : 'ies'} active.` : 'Section auto-hides because zero categories are active.'}`}
            primary={{ label: 'Manage Categories', href: '/admin/prayer/categories' }}
            secondary={{ label: 'Edit headings', href: '/admin/prayer/settings#categories' }}
            accent="border-l-[#140152] from-[#140152]/5"
            status={[
              activeCategories > 0 ? { label: `${activeCategories} active`, tone: 'ok' } : { label: 'Hidden (0 cards)', tone: 'warn' },
            ]}
          />

          {/* 5. How To Pray */}
          <SectionCard
            index={5}
            icon={ScrollText}
            title={settings?.how_heading || 'How To Pray With Us'}
            subtitle={settings?.how_eyebrow || 'Three Steps'}
            description={`Numbered step cards (Submit → Pray → Testify). ${stepsCount > 0 ? `${stepsCount} step${stepsCount === 1 ? '' : 's'} configured.` : 'Renders 3 defaults until you add your own.'}`}
            primary={{ label: 'Edit Steps', href: '/admin/prayer/settings#how' }}
            accent="border-l-[#f5bb00] from-[#f5bb00]/10"
            status={[
              stepsCount > 0 ? { label: `${stepsCount} step${stepsCount === 1 ? '' : 's'}`, tone: 'ok' } : { label: 'Using defaults', tone: 'info' },
            ]}
          />

          {/* 6. Schedules */}
          <SectionCard
            index={6}
            icon={Calendar}
            title={settings?.schedules_heading || 'Join a Prayer Gathering'}
            subtitle={settings?.schedules_eyebrow || 'When We Gather'}
            description={`The gatherings grid. ${activeSchedules > 0 ? `${activeSchedules} gathering${activeSchedules === 1 ? '' : 's'} active.` : 'Section auto-hides because zero gatherings are active.'}`}
            primary={{ label: 'Manage Schedules', href: '/admin/prayer/schedules' }}
            secondary={{ label: 'Edit headings', href: '/admin/prayer/settings#schedules' }}
            accent="border-l-[#f5bb00] from-[#f5bb00]/5"
            status={[
              activeSchedules > 0 ? { label: `${activeSchedules} active`, tone: 'ok' } : { label: 'Hidden (0 schedules)', tone: 'warn' },
            ]}
          />

          {/* 7. Answered */}
          <SectionCard
            index={7}
            icon={Sparkles}
            title={settings?.answered_heading || 'Recent Answered Prayers'}
            subtitle={settings?.answered_eyebrow || 'He Is Faithful'}
            description={`Auto-pulled from requests with status=answered, public, and a testimony. ${answeredCount > 0 ? `${answeredCount} qualifying right now.` : 'Section auto-hides until at least one qualifies.'}`}
            primary={{ label: 'Edit headings + count', href: '/admin/prayer/settings#answered' }}
            secondary={{ label: 'Manage requests', href: '/admin/prayer/requests' }}
            accent="border-l-emerald-500 from-emerald-500/5"
            status={[
              answeredCount > 0 ? { label: `${answeredCount} visible`, tone: 'ok' } : { label: 'Hidden (0 testimonies)', tone: 'warn' },
            ]}
          />

          {/* 8. Prayer Wall preview */}
          <SectionCard
            index={8}
            icon={Heart}
            title={settings?.wall_heading || 'Stand With Your Brothers and Sisters'}
            subtitle={settings?.wall_eyebrow || 'The Wall Is Alive'}
            description={`Auto-pulled from recent public, non-archived requests. ${publicWallCount > 0 ? `${publicWallCount} candidate${publicWallCount === 1 ? '' : 's'} in pool.` : 'Section auto-hides until at least one exists.'}`}
            primary={{ label: 'Edit headings + CTA', href: '/admin/prayer/settings#wall' }}
            secondary={{ label: 'Manage requests', href: '/admin/prayer/requests' }}
            accent="border-l-rose-400 from-rose-400/5"
            status={[
              publicWallCount > 0 ? { label: `${publicWallCount} in pool`, tone: 'ok' } : { label: 'Hidden (0 public)', tone: 'warn' },
            ]}
          />

          {/* 9. Final CTA */}
          <SectionCard
            index={9}
            icon={HandHeart}
            title={settings?.final_heading || 'The Altar Is Open'}
            subtitle={settings?.final_eyebrow || 'The Altar Is Open'}
            description="Closing call: scripture (Isaiah 56:7 default), tagline, and the Prayer Room button."
            primary={{ label: 'Edit Final Call', href: '/admin/prayer/settings#final' }}
            accent="border-l-[#140152] from-[#140152]/10"
            status={[
              settings?.scripture_text ? { label: 'Scripture set', tone: 'ok' } : { label: 'No scripture', tone: 'warn' },
            ]}
          />
        </div>
      </div>

      {/* Pending requests preview at the bottom (kept for quick triage) */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-[#140152]" />
            Pending Prayer Requests
            {pendingRequests > 0 && (
              <span className="ml-1 text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold">{pendingRequests}</span>
            )}
          </CardTitle>
          <Link href="/admin/prayer/requests" className="text-sm font-bold text-[#140152] hover:underline inline-flex items-center gap-1">
            View all <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </CardHeader>
        <CardContent>
          {requests.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No prayer requests yet</p>
          ) : (
            <div className="space-y-3">
              {requests.slice(0, 5).map((r) => (
                <div key={r.id} className="flex items-start justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-[#140152] truncate">{r.title}</h4>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">{r.description}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs">
                      <span className={`px-2 py-0.5 rounded-full font-bold uppercase tracking-wide ${
                        r.status === 'pending'  ? 'bg-yellow-100 text-yellow-700' :
                        r.status === 'praying'  ? 'bg-blue-100 text-blue-700' :
                        r.status === 'answered' ? 'bg-emerald-100 text-emerald-700' :
                                                  'bg-gray-100 text-gray-700'
                      }`}>{r.status}</span>
                      <span className="text-gray-500 inline-flex items-center gap-1">
                        <Heart className="w-3 h-3" />{r.prayer_count}
                      </span>
                      {r.is_public ? (
                        <span className="text-emerald-600 font-bold">PUBLIC</span>
                      ) : (
                        <span className="text-gray-400">private</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
