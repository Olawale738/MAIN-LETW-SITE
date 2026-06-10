'use client'

import { useState, useEffect, useCallback, FormEvent } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  ExternalLink,
  Loader2,
  LayoutDashboard,
  Users,
  Mic2,
  CalendarDays,
  Ticket,
  Award,
  HandHeart,
  HelpCircle,
  Tag as TagIcon,
  Image as ImageIcon,
  Megaphone,
  BarChart3,
  Trash2,
  Plus,
  CheckCircle2,
  QrCode,
  X,
  Copy,
  Download,
  MapPin,
  Calendar,
  AlertTriangle,
  MessageSquare,
  Crown,
} from 'lucide-react'
import { eventApi, Event } from '@/lib/api'
import {
  eventExtensionsApi,
  EventSpeaker,
  EventSession,
  EventPhoto,
  EventTicket,
  EventSponsor,
  EventVolunteerPosition,
  EventFaq,
  EventUpdate,
  EventPollData,
  EventRsvp,
  EventFullStats,
} from '@/lib/event-extensions-api'

type TabKey =
  | 'overview'
  | 'registrations'
  | 'speakers'
  | 'agenda'
  | 'tickets'
  | 'sponsors'
  | 'volunteers'
  | 'faq'
  | 'tags'
  | 'gallery'
  | 'updates'
  | 'polls'

interface TabDef {
  key: TabKey
  label: string
  icon: React.ComponentType<{ className?: string }>
}

const TABS: TabDef[] = [
  { key: 'overview', label: 'Overview', icon: LayoutDashboard },
  { key: 'registrations', label: 'Registrations', icon: Users },
  { key: 'speakers', label: 'Speakers', icon: Mic2 },
  { key: 'agenda', label: 'Agenda', icon: CalendarDays },
  { key: 'tickets', label: 'Tickets', icon: Ticket },
  { key: 'sponsors', label: 'Sponsors', icon: Award },
  { key: 'volunteers', label: 'Volunteers', icon: HandHeart },
  { key: 'faq', label: 'FAQ', icon: HelpCircle },
  { key: 'tags', label: 'Tags', icon: TagIcon },
  { key: 'gallery', label: 'Gallery', icon: ImageIcon },
  { key: 'updates', label: 'Updates', icon: Megaphone },
  { key: 'polls', label: 'Polls', icon: BarChart3 },
]

const NAVY = '#140152'
const GOLD = '#f5bb00'

function errMsg(e: unknown): string {
  return (e as Error)?.message || 'Something went wrong'
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return ''
  const d = new Date(dateStr.length <= 10 ? `${dateStr}T00:00:00` : dateStr)
  if (isNaN(d.getTime())) return dateStr
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

function formatTime(t?: string): string {
  if (!t) return ''
  const [h, m] = t.split(':')
  if (h === undefined || m === undefined) return t
  const hour = parseInt(h, 10)
  const suffix = hour >= 12 ? 'PM' : 'AM'
  const hr12 = hour % 12 === 0 ? 12 : hour % 12
  return `${hr12}:${m} ${suffix}`
}

function formatPrice(price: number, currency: string): string {
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: currency || 'USD' }).format(price)
  } catch {
    return `${currency || 'USD'} ${price.toFixed(2)}`
  }
}

// ── Shared small UI ──────────────────────────────────────────────────────────

function Banner({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) {
  return (
    <div
      className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm ${
        type === 'success'
          ? 'border-green-200 bg-green-50 text-green-800'
          : 'border-red-200 bg-red-50 text-red-800'
      }`}
    >
      <span>{message}</span>
      <button onClick={onClose} className="rounded-md p-1 hover:bg-black/5" aria-label="Dismiss">
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-gray-100 bg-white shadow-sm ${className}`}>{children}</div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-lg font-semibold text-[#140152]">{children}</h2>
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-[#140152] focus:ring-2 focus:ring-[#140152]/10 ${props.className ?? ''}`}
    />
  )
}

function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-[#140152] focus:ring-2 focus:ring-[#140152]/10 ${props.className ?? ''}`}
    />
  )
}

function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-[#140152] focus:ring-2 focus:ring-[#140152]/10 ${props.className ?? ''}`}
    />
  )
}

function PrimaryButton({
  children,
  saving,
  ...props
}: { children: React.ReactNode; saving?: boolean } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      disabled={saving || props.disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-lg bg-[#140152] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#1d0277] disabled:cursor-not-allowed disabled:opacity-60 ${props.className ?? ''}`}
    >
      {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
      {saving ? 'Saving…' : children}
    </button>
  )
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-6 py-10 text-center text-sm text-gray-500">
      {label}
    </div>
  )
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="mb-1 block text-xs font-medium text-gray-600">{children}</label>
}

// ── Stat card ────────────────────────────────────────────────────────────────

function StatCard({
  icon: Icon,
  value,
  label,
}: {
  icon: React.ComponentType<{ className?: string }>
  value: number
  label: string
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-xl"
          style={{ backgroundColor: `${NAVY}10`, color: NAVY }}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <div className="text-2xl font-bold text-[#140152]">{value ?? 0}</div>
          <div className="text-xs font-medium text-gray-500">{label}</div>
        </div>
      </div>
    </Card>
  )
}

// ── Main page ────────────────────────────────────────────────────────────────

export default function ManageEventPage() {
  const { id } = useParams() as { id: string }
  const router = useRouter()

  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [loadError, setLoadError] = useState<string>('')
  const [activeTab, setActiveTab] = useState<TabKey>('overview')

  const [banner, setBanner] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const notifyOk = useCallback((m: string) => setBanner({ message: m, type: 'success' }), [])
  const notifyErr = useCallback((m: string) => setBanner({ message: m, type: 'error' }), [])

  useEffect(() => {
    let active = true
    setLoading(true)
    setLoadError('')
    eventApi
      .getEvent(id)
      .then((ev) => {
        if (active) setEvent(ev)
      })
      .catch((e) => {
        if (active) setLoadError(errMsg(e))
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [id])

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#140152]" />
      </div>
    )
  }

  if (loadError || !event) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16">
        <Card className="p-8 text-center">
          <AlertTriangle className="mx-auto mb-4 h-10 w-10 text-red-500" />
          <h1 className="mb-2 text-lg font-semibold text-[#140152]">Could not load event</h1>
          <p className="mb-6 text-sm text-gray-600">{loadError || 'Event not found.'}</p>
          <button
            onClick={() => router.push('/admin/events')}
            className="inline-flex items-center gap-2 rounded-lg bg-[#140152] px-4 py-2 text-sm font-medium text-white hover:bg-[#1d0277]"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Events
          </button>
        </Card>
      </div>
    )
  }

  const subtitle = [formatDate(event.event_date), event.location].filter(Boolean).join(' · ')

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      {/* Sticky header */}
      <div className="sticky top-0 z-20 border-b border-gray-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <button
              onClick={() => router.push('/admin/events')}
              className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border border-gray-200 text-gray-600 transition hover:bg-gray-50"
              aria-label="Back to events"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="min-w-0">
              <h1 className="truncate text-base font-semibold text-[#140152] sm:text-lg">{event.title}</h1>
              {subtitle ? <p className="truncate text-xs text-gray-500">{subtitle}</p> : null}
            </div>
          </div>
          <a
            href={`/events/${id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex flex-shrink-0 items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-[#140152] transition hover:bg-gray-50"
          >
            <ExternalLink className="h-4 w-4" /> View Public Page
          </a>
        </div>

        {/* Tab bar */}
        <div className="mx-auto max-w-6xl px-2">
          <div className="flex gap-1 overflow-x-auto pb-2 [scrollbar-width:thin]">
            {TABS.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.key
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`inline-flex flex-shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
                    isActive
                      ? 'bg-[#140152] text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-6xl px-4 pt-6">
        {banner ? (
          <div className="mb-5">
            <Banner message={banner.message} type={banner.type} onClose={() => setBanner(null)} />
          </div>
        ) : null}

        {activeTab === 'overview' && <OverviewTab id={id} onError={notifyErr} />}
        {activeTab === 'registrations' && (
          <RegistrationsTab id={id} onOk={notifyOk} onError={notifyErr} />
        )}
        {activeTab === 'speakers' && <SpeakersTab id={id} onOk={notifyOk} onError={notifyErr} />}
        {activeTab === 'agenda' && <AgendaTab id={id} onOk={notifyOk} onError={notifyErr} />}
        {activeTab === 'tickets' && <TicketsTab id={id} onOk={notifyOk} onError={notifyErr} />}
        {activeTab === 'sponsors' && <SponsorsTab id={id} onOk={notifyOk} onError={notifyErr} />}
        {activeTab === 'volunteers' && <VolunteersTab id={id} onOk={notifyOk} onError={notifyErr} />}
        {activeTab === 'faq' && <FaqTab id={id} onOk={notifyOk} onError={notifyErr} />}
        {activeTab === 'tags' && <TagsTab id={id} onOk={notifyOk} onError={notifyErr} />}
        {activeTab === 'gallery' && <GalleryTab id={id} onOk={notifyOk} onError={notifyErr} />}
        {activeTab === 'updates' && <UpdatesTab id={id} onOk={notifyOk} onError={notifyErr} />}
        {activeTab === 'polls' && <PollsTab id={id} onOk={notifyOk} onError={notifyErr} />}
      </div>
    </div>
  )
}

// ── Tab loading wrapper ──────────────────────────────────────────────────────

function TabLoader() {
  return (
    <div className="flex items-center justify-center py-16">
      <Loader2 className="h-6 w-6 animate-spin text-[#140152]" />
    </div>
  )
}

interface TabProps {
  id: string
  onOk: (m: string) => void
  onError: (m: string) => void
}

// ── 1. Overview ──────────────────────────────────────────────────────────────

function OverviewTab({ id, onError }: { id: string; onError: (m: string) => void }) {
  const [stats, setStats] = useState<EventFullStats | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [copied, setCopied] = useState<boolean>(false)

  useEffect(() => {
    let active = true
    setLoading(true)
    eventExtensionsApi
      .fullStats(id)
      .then((s) => {
        if (active) setStats(s)
      })
      .catch((e) => {
        if (active) onError(errMsg(e))
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [id, onError])

  const registrationLink =
    typeof window !== 'undefined' ? `${window.location.origin}/events/${id}` : `/events/${id}`

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(registrationLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (e) {
      onError(errMsg(e))
    }
  }

  if (loading) return <TabLoader />

  const cards: { icon: React.ComponentType<{ className?: string }>; value: number; label: string }[] = [
    { icon: Users, value: stats?.rsvps ?? 0, label: 'RSVPs' },
    { icon: Mic2, value: stats?.speakers ?? 0, label: 'Speakers' },
    { icon: CalendarDays, value: stats?.sessions ?? 0, label: 'Sessions' },
    { icon: ImageIcon, value: stats?.photos ?? 0, label: 'Photos' },
    { icon: MessageSquare, value: stats?.comments ?? 0, label: 'Comments' },
    { icon: HelpCircle, value: stats?.questions ?? 0, label: 'Questions' },
    { icon: Ticket, value: stats?.tickets ?? 0, label: 'Tickets' },
    { icon: Award, value: stats?.sponsors ?? 0, label: 'Sponsors' },
    { icon: HandHeart, value: stats?.volunteer_positions ?? 0, label: 'Volunteer Positions' },
    { icon: HelpCircle, value: stats?.faqs ?? 0, label: 'FAQs' },
    { icon: Megaphone, value: stats?.updates ?? 0, label: 'Updates' },
    { icon: BarChart3, value: stats?.polls ?? 0, label: 'Polls' },
  ]

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {cards.map((c) => (
          <StatCard key={c.label} icon={c.icon} value={c.value} label={c.label} />
        ))}
      </div>

      <Card className="p-5">
        <SectionTitle>Quick actions</SectionTitle>
        <div className="mt-4 space-y-4">
          <div>
            <FieldLabel>Registration link</FieldLabel>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input readOnly value={registrationLink} onFocus={(e) => e.currentTarget.select()} />
              <button
                onClick={copyLink}
                className="inline-flex flex-shrink-0 items-center justify-center gap-2 rounded-lg bg-[#f5bb00] px-4 py-2 text-sm font-semibold text-[#140152] transition hover:brightness-95"
              >
                {copied ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? 'Copied!' : 'Copy link'}
              </button>
            </div>
          </div>

          <div>
            <FieldLabel>Calendar export</FieldLabel>
            <a
              href={eventExtensionsApi.calendarUrl(id)}
              download
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-[#140152] transition hover:bg-gray-50"
            >
              <Download className="h-4 w-4" /> Download .ics
            </a>
          </div>
        </div>
      </Card>
    </motion.div>
  )
}

// ── 2. Registrations ─────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, string> = {
  attending: 'bg-green-100 text-green-700',
  maybe: 'bg-amber-100 text-amber-700',
  waitlisted: 'bg-blue-100 text-blue-700',
  declined: 'bg-gray-100 text-gray-600',
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
        STATUS_STYLES[status] ?? 'bg-gray-100 text-gray-600'
      }`}
    >
      {status}
    </span>
  )
}

function RegistrationsTab({ id, onOk, onError }: TabProps) {
  const [rsvps, setRsvps] = useState<EventRsvp[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [filter, setFilter] = useState<string>('all')
  const [checkingId, setCheckingId] = useState<string>('')
  const [qrToken, setQrToken] = useState<string>('')
  const [qrChecking, setQrChecking] = useState<boolean>(false)

  const load = useCallback(
    (statusFilter: string) => {
      setLoading(true)
      eventExtensionsApi
        .listRsvps(id, statusFilter === 'all' ? undefined : statusFilter)
        .then((rows) => setRsvps(rows ?? []))
        .catch((e) => onError(errMsg(e)))
        .finally(() => setLoading(false))
    },
    [id, onError],
  )

  useEffect(() => {
    load(filter)
  }, [load, filter])

  const checkIn = async (rsvpId: string) => {
    setCheckingId(rsvpId)
    try {
      await eventExtensionsApi.checkInRsvp(rsvpId)
      onOk('Attendee checked in.')
      load(filter)
    } catch (e) {
      onError(errMsg(e))
    } finally {
      setCheckingId('')
    }
  }

  const checkInByQr = async () => {
    if (!qrToken.trim()) return
    setQrChecking(true)
    try {
      const res = (await eventExtensionsApi.checkInByQr(qrToken.trim())) as {
        user_name?: string
        guest_name?: string
        name?: string
      }
      const name = res?.user_name || res?.guest_name || res?.name || 'Attendee'
      onOk(`Checked in: ${name}`)
      setQrToken('')
      load(filter)
    } catch (e) {
      onError(errMsg(e))
    } finally {
      setQrChecking(false)
    }
  }

  const attendingCount = rsvps.filter((r) => r.status === 'attending').length

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
      <Card className="p-5">
        <SectionTitle>Check in by QR token</SectionTitle>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <Input
            placeholder="Paste QR token"
            value={qrToken}
            onChange={(e) => setQrToken(e.target.value)}
          />
          <PrimaryButton onClick={checkInByQr} saving={qrChecking} disabled={!qrToken.trim()}>
            <QrCode className="h-4 w-4" /> Check In
          </PrimaryButton>
        </div>
      </Card>

      <Card className="p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <SectionTitle>Registrations</SectionTitle>
            <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
              {attendingCount} attending
            </span>
          </div>
          <div className="w-full sm:w-48">
            <Select value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="all">All</option>
              <option value="attending">Attending</option>
              <option value="maybe">Maybe</option>
              <option value="waitlisted">Waitlisted</option>
            </Select>
          </div>
        </div>

        <div className="mt-4">
          {loading ? (
            <TabLoader />
          ) : rsvps.length === 0 ? (
            <EmptyState label="No registrations yet." />
          ) : (
            <div className="divide-y divide-gray-100">
              {rsvps.map((r) => {
                const name = r.user_name || r.guest_name || 'Guest'
                return (
                  <div
                    key={r.id}
                    className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="font-medium text-gray-900">{name}</span>
                      <StatusBadge status={r.status} />
                      {r.plus_ones > 0 ? (
                        <span className="text-xs text-gray-500">+{r.plus_ones} guest{r.plus_ones > 1 ? 's' : ''}</span>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-2">
                      {r.checked_in ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Checked in
                        </span>
                      ) : (
                        <button
                          onClick={() => checkIn(r.id)}
                          disabled={checkingId === r.id}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-[#140152]/20 px-3 py-1.5 text-xs font-medium text-[#140152] transition hover:bg-[#140152]/5 disabled:opacity-60"
                        >
                          {checkingId === r.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          )}
                          Check In
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  )
}

// ── 3. Speakers ──────────────────────────────────────────────────────────────

function SpeakersTab({ id, onOk, onError }: TabProps) {
  const [speakers, setSpeakers] = useState<EventSpeaker[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [saving, setSaving] = useState<boolean>(false)
  const [deletingId, setDeletingId] = useState<string>('')
  const [form, setForm] = useState<{
    name: string
    title: string
    organization: string
    bio: string
    photo_url: string
    is_keynote: boolean
  }>({ name: '', title: '', organization: '', bio: '', photo_url: '', is_keynote: false })

  const load = useCallback(() => {
    setLoading(true)
    eventExtensionsApi
      .listSpeakers(id)
      .then((rows) => setSpeakers(rows ?? []))
      .catch((e) => onError(errMsg(e)))
      .finally(() => setLoading(false))
  }, [id, onError])

  useEffect(() => {
    load()
  }, [load])

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) return
    setSaving(true)
    try {
      await eventExtensionsApi.addSpeaker(id, {
        name: form.name.trim(),
        title: form.title.trim() || undefined,
        organization: form.organization.trim() || undefined,
        bio: form.bio.trim() || undefined,
        photo_url: form.photo_url.trim() || undefined,
        is_keynote: form.is_keynote,
      })
      onOk('Speaker added.')
      setForm({ name: '', title: '', organization: '', bio: '', photo_url: '', is_keynote: false })
      load()
    } catch (err) {
      onError(errMsg(err))
    } finally {
      setSaving(false)
    }
  }

  const remove = async (speakerId: string) => {
    setDeletingId(speakerId)
    try {
      await eventExtensionsApi.deleteSpeaker(id, speakerId)
      onOk('Speaker removed.')
      load()
    } catch (e) {
      onError(errMsg(e))
    } finally {
      setDeletingId('')
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
      <Card className="p-5">
        <SectionTitle>Add speaker</SectionTitle>
        <form onSubmit={submit} className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <FieldLabel>Name *</FieldLabel>
            <Input
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Jane Doe"
            />
          </div>
          <div>
            <FieldLabel>Title</FieldLabel>
            <Input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Lead Pastor"
            />
          </div>
          <div>
            <FieldLabel>Organization</FieldLabel>
            <Input
              value={form.organization}
              onChange={(e) => setForm((f) => ({ ...f, organization: e.target.value }))}
            />
          </div>
          <div>
            <FieldLabel>Photo URL</FieldLabel>
            <Input
              value={form.photo_url}
              onChange={(e) => setForm((f) => ({ ...f, photo_url: e.target.value }))}
              placeholder="https://…"
            />
          </div>
          <div className="sm:col-span-2">
            <FieldLabel>Bio</FieldLabel>
            <Textarea
              rows={3}
              value={form.bio}
              onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-700 sm:col-span-2">
            <input
              type="checkbox"
              checked={form.is_keynote}
              onChange={(e) => setForm((f) => ({ ...f, is_keynote: e.target.checked }))}
              className="h-4 w-4 rounded border-gray-300 text-[#140152] focus:ring-[#140152]"
            />
            Keynote speaker
          </label>
          <div className="sm:col-span-2">
            <PrimaryButton type="submit" saving={saving} disabled={!form.name.trim()}>
              <Plus className="h-4 w-4" /> Add Speaker
            </PrimaryButton>
          </div>
        </form>
      </Card>

      {loading ? (
        <TabLoader />
      ) : speakers.length === 0 ? (
        <EmptyState label="No speakers added yet." />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {speakers.map((s) => (
            <Card key={s.id} className="p-4">
              <div className="flex items-start gap-3">
                {s.photo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={s.photo_url}
                    alt={s.name}
                    className="h-14 w-14 flex-shrink-0 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-[#140152]/10 text-lg font-semibold text-[#140152]">
                    {s.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate font-semibold text-gray-900">{s.name}</span>
                    {s.is_keynote ? <Crown className="h-3.5 w-3.5 flex-shrink-0 text-[#f5bb00]" /> : null}
                  </div>
                  {s.title ? <p className="truncate text-xs text-gray-500">{s.title}</p> : null}
                  {s.organization ? (
                    <p className="truncate text-xs text-gray-400">{s.organization}</p>
                  ) : null}
                </div>
                <button
                  onClick={() => remove(s.id)}
                  disabled={deletingId === s.id}
                  className="flex-shrink-0 rounded-lg p-1.5 text-gray-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                  aria-label="Delete speaker"
                >
                  {deletingId === s.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </button>
              </div>
              {s.bio ? <p className="mt-3 line-clamp-3 text-xs text-gray-500">{s.bio}</p> : null}
            </Card>
          ))}
        </div>
      )}
    </motion.div>
  )
}

// ── 4. Agenda ────────────────────────────────────────────────────────────────

function AgendaTab({ id, onOk, onError }: TabProps) {
  const [sessions, setSessions] = useState<EventSession[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [saving, setSaving] = useState<boolean>(false)
  const [deletingId, setDeletingId] = useState<string>('')
  const [form, setForm] = useState<{
    title: string
    session_date: string
    start_time: string
    end_time: string
    room: string
    track: string
    session_type: string
  }>({
    title: '',
    session_date: '',
    start_time: '',
    end_time: '',
    room: '',
    track: '',
    session_type: 'talk',
  })

  const load = useCallback(() => {
    setLoading(true)
    eventExtensionsApi
      .listSessions(id)
      .then((rows) => setSessions(rows ?? []))
      .catch((e) => onError(errMsg(e)))
      .finally(() => setLoading(false))
  }, [id, onError])

  useEffect(() => {
    load()
  }, [load])

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!form.title.trim() || !form.session_date || !form.start_time) return
    setSaving(true)
    try {
      await eventExtensionsApi.addSession(id, {
        title: form.title.trim(),
        session_date: form.session_date,
        start_time: form.start_time,
        end_time: form.end_time || undefined,
        room: form.room.trim() || undefined,
        track: form.track.trim() || undefined,
        session_type: form.session_type,
      })
      onOk('Session added.')
      setForm({
        title: '',
        session_date: '',
        start_time: '',
        end_time: '',
        room: '',
        track: '',
        session_type: 'talk',
      })
      load()
    } catch (err) {
      onError(errMsg(err))
    } finally {
      setSaving(false)
    }
  }

  const remove = async (sessionId: string) => {
    setDeletingId(sessionId)
    try {
      await eventExtensionsApi.deleteSession(id, sessionId)
      onOk('Session removed.')
      load()
    } catch (e) {
      onError(errMsg(e))
    } finally {
      setDeletingId('')
    }
  }

  const ordered = [...sessions].sort((a, b) => {
    const d = a.session_date.localeCompare(b.session_date)
    if (d !== 0) return d
    return (a.start_time || '').localeCompare(b.start_time || '')
  })

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
      <Card className="p-5">
        <SectionTitle>Add session</SectionTitle>
        <form onSubmit={submit} className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <FieldLabel>Title *</FieldLabel>
            <Input
              required
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Opening Worship"
            />
          </div>
          <div>
            <FieldLabel>Date *</FieldLabel>
            <Input
              type="date"
              required
              value={form.session_date}
              onChange={(e) => setForm((f) => ({ ...f, session_date: e.target.value }))}
            />
          </div>
          <div>
            <FieldLabel>Session type</FieldLabel>
            <Select
              value={form.session_type}
              onChange={(e) => setForm((f) => ({ ...f, session_type: e.target.value }))}
            >
              <option value="talk">Talk</option>
              <option value="workshop">Workshop</option>
              <option value="break">Break</option>
              <option value="panel">Panel</option>
            </Select>
          </div>
          <div>
            <FieldLabel>Start time *</FieldLabel>
            <Input
              type="time"
              required
              value={form.start_time}
              onChange={(e) => setForm((f) => ({ ...f, start_time: e.target.value }))}
            />
          </div>
          <div>
            <FieldLabel>End time</FieldLabel>
            <Input
              type="time"
              value={form.end_time}
              onChange={(e) => setForm((f) => ({ ...f, end_time: e.target.value }))}
            />
          </div>
          <div>
            <FieldLabel>Room</FieldLabel>
            <Input
              value={form.room}
              onChange={(e) => setForm((f) => ({ ...f, room: e.target.value }))}
              placeholder="Main Hall"
            />
          </div>
          <div>
            <FieldLabel>Track</FieldLabel>
            <Input
              value={form.track}
              onChange={(e) => setForm((f) => ({ ...f, track: e.target.value }))}
            />
          </div>
          <div className="sm:col-span-2">
            <PrimaryButton
              type="submit"
              saving={saving}
              disabled={!form.title.trim() || !form.session_date || !form.start_time}
            >
              <Plus className="h-4 w-4" /> Add Session
            </PrimaryButton>
          </div>
        </form>
      </Card>

      {loading ? (
        <TabLoader />
      ) : ordered.length === 0 ? (
        <EmptyState label="No sessions scheduled yet." />
      ) : (
        <div className="space-y-3">
          {ordered.map((s) => (
            <Card key={s.id} className="flex items-start justify-between gap-4 p-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-gray-900">{s.title}</span>
                  <span className="rounded-full bg-[#140152]/10 px-2 py-0.5 text-[11px] font-medium capitalize text-[#140152]">
                    {s.session_type}
                  </span>
                  {s.track ? (
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600">
                      {s.track}
                    </span>
                  ) : null}
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" /> {formatDate(s.session_date)}
                  </span>
                  <span>
                    {formatTime(s.start_time)}
                    {s.end_time ? ` – ${formatTime(s.end_time)}` : ''}
                  </span>
                  {s.room ? (
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" /> {s.room}
                    </span>
                  ) : null}
                </div>
                {s.description ? <p className="mt-2 text-xs text-gray-500">{s.description}</p> : null}
              </div>
              <button
                onClick={() => remove(s.id)}
                disabled={deletingId === s.id}
                className="flex-shrink-0 rounded-lg p-1.5 text-gray-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                aria-label="Delete session"
              >
                {deletingId === s.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </button>
            </Card>
          ))}
        </div>
      )}
    </motion.div>
  )
}

// ── 5. Tickets ───────────────────────────────────────────────────────────────

function TicketsTab({ id, onOk, onError }: TabProps) {
  const [tickets, setTickets] = useState<EventTicket[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [saving, setSaving] = useState<boolean>(false)
  const [form, setForm] = useState<{ name: string; price: string; description: string; capacity: string }>({
    name: '',
    price: '',
    description: '',
    capacity: '',
  })

  const load = useCallback(() => {
    setLoading(true)
    eventExtensionsApi
      .listTickets(id)
      .then((rows) => setTickets(rows ?? []))
      .catch((e) => onError(errMsg(e)))
      .finally(() => setLoading(false))
  }, [id, onError])

  useEffect(() => {
    load()
  }, [load])

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) return
    setSaving(true)
    try {
      await eventExtensionsApi.addTicket(id, {
        name: form.name.trim(),
        price: parseFloat(form.price) || 0,
        description: form.description.trim() || undefined,
        capacity: form.capacity ? parseInt(form.capacity, 10) : undefined,
      })
      onOk('Ticket tier added.')
      setForm({ name: '', price: '', description: '', capacity: '' })
      load()
    } catch (err) {
      onError(errMsg(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
      <Card className="p-5">
        <SectionTitle>Add ticket tier</SectionTitle>
        <form onSubmit={submit} className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <FieldLabel>Name *</FieldLabel>
            <Input
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="General Admission"
            />
          </div>
          <div>
            <FieldLabel>Price</FieldLabel>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={form.price}
              onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
              placeholder="0.00"
            />
          </div>
          <div>
            <FieldLabel>Capacity</FieldLabel>
            <Input
              type="number"
              min="0"
              value={form.capacity}
              onChange={(e) => setForm((f) => ({ ...f, capacity: e.target.value }))}
              placeholder="Unlimited"
            />
          </div>
          <div>
            <FieldLabel>Description</FieldLabel>
            <Input
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </div>
          <div className="sm:col-span-2">
            <PrimaryButton type="submit" saving={saving} disabled={!form.name.trim()}>
              <Plus className="h-4 w-4" /> Add Ticket
            </PrimaryButton>
          </div>
        </form>
      </Card>

      {loading ? (
        <TabLoader />
      ) : tickets.length === 0 ? (
        <EmptyState label="No ticket tiers yet." />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {tickets.map((t) => (
            <Card key={t.id} className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">{t.name}</h3>
                  {t.description ? <p className="mt-0.5 text-xs text-gray-500">{t.description}</p> : null}
                </div>
                <span className="text-lg font-bold text-[#140152]">
                  {formatPrice(t.price, t.currency)}
                </span>
              </div>
              <div className="mt-3 text-xs text-gray-500">
                Sold {t.sold_count}
                {typeof t.capacity === 'number' ? ` / ${t.capacity}` : ''}
              </div>
              {typeof t.capacity === 'number' && t.capacity > 0 ? (
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full bg-[#f5bb00]"
                    style={{ width: `${Math.min(100, (t.sold_count / t.capacity) * 100)}%` }}
                  />
                </div>
              ) : null}
            </Card>
          ))}
        </div>
      )}
    </motion.div>
  )
}

// ── 6. Sponsors ──────────────────────────────────────────────────────────────

const TIER_STYLES: Record<string, string> = {
  platinum: 'bg-slate-200 text-slate-800',
  gold: 'bg-[#f5bb00]/20 text-[#8a6d00]',
  silver: 'bg-gray-200 text-gray-700',
  bronze: 'bg-orange-100 text-orange-700',
  standard: 'bg-gray-100 text-gray-600',
}

function SponsorsTab({ id, onOk, onError }: TabProps) {
  const [sponsors, setSponsors] = useState<EventSponsor[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [saving, setSaving] = useState<boolean>(false)
  const [form, setForm] = useState<{
    name: string
    tier: EventSponsor['tier']
    logo_url: string
    website_url: string
  }>({ name: '', tier: 'standard', logo_url: '', website_url: '' })

  const load = useCallback(() => {
    setLoading(true)
    eventExtensionsApi
      .listSponsors(id)
      .then((rows) => setSponsors(rows ?? []))
      .catch((e) => onError(errMsg(e)))
      .finally(() => setLoading(false))
  }, [id, onError])

  useEffect(() => {
    load()
  }, [load])

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) return
    setSaving(true)
    try {
      await eventExtensionsApi.addSponsor(id, {
        name: form.name.trim(),
        tier: form.tier,
        logo_url: form.logo_url.trim() || undefined,
        website_url: form.website_url.trim() || undefined,
      })
      onOk('Sponsor added.')
      setForm({ name: '', tier: 'standard', logo_url: '', website_url: '' })
      load()
    } catch (err) {
      onError(errMsg(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
      <Card className="p-5">
        <SectionTitle>Add sponsor</SectionTitle>
        <form onSubmit={submit} className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <FieldLabel>Name *</FieldLabel>
            <Input
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </div>
          <div>
            <FieldLabel>Tier</FieldLabel>
            <Select
              value={form.tier}
              onChange={(e) => setForm((f) => ({ ...f, tier: e.target.value as EventSponsor['tier'] }))}
            >
              <option value="platinum">Platinum</option>
              <option value="gold">Gold</option>
              <option value="silver">Silver</option>
              <option value="bronze">Bronze</option>
              <option value="standard">Standard</option>
            </Select>
          </div>
          <div>
            <FieldLabel>Logo URL</FieldLabel>
            <Input
              value={form.logo_url}
              onChange={(e) => setForm((f) => ({ ...f, logo_url: e.target.value }))}
              placeholder="https://…"
            />
          </div>
          <div>
            <FieldLabel>Website URL</FieldLabel>
            <Input
              value={form.website_url}
              onChange={(e) => setForm((f) => ({ ...f, website_url: e.target.value }))}
              placeholder="https://…"
            />
          </div>
          <div className="sm:col-span-2">
            <PrimaryButton type="submit" saving={saving} disabled={!form.name.trim()}>
              <Plus className="h-4 w-4" /> Add Sponsor
            </PrimaryButton>
          </div>
        </form>
      </Card>

      {loading ? (
        <TabLoader />
      ) : sponsors.length === 0 ? (
        <EmptyState label="No sponsors yet." />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {sponsors.map((sp) => (
            <Card key={sp.id} className="flex items-center gap-3 p-4">
              {sp.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={sp.logo_url}
                  alt={sp.name}
                  className="h-12 w-12 flex-shrink-0 rounded-lg object-contain"
                />
              ) : (
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-gray-100 text-sm font-semibold text-gray-500">
                  {sp.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate font-semibold text-gray-900">{sp.name}</span>
                </div>
                <span
                  className={`mt-1 inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium capitalize ${
                    TIER_STYLES[sp.tier] ?? 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {sp.tier}
                </span>
                {sp.website_url ? (
                  <a
                    href={sp.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 block truncate text-xs text-[#140152] hover:underline"
                  >
                    {sp.website_url}
                  </a>
                ) : null}
              </div>
            </Card>
          ))}
        </div>
      )}
    </motion.div>
  )
}

// ── 7. Volunteers ────────────────────────────────────────────────────────────

function VolunteersTab({ id, onOk, onError }: TabProps) {
  const [positions, setPositions] = useState<EventVolunteerPosition[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [saving, setSaving] = useState<boolean>(false)
  const [form, setForm] = useState<{
    role_name: string
    slots_needed: string
    shift_time: string
    skills_required: string
    description: string
  }>({ role_name: '', slots_needed: '', shift_time: '', skills_required: '', description: '' })

  const load = useCallback(() => {
    setLoading(true)
    eventExtensionsApi
      .listVolunteerPositions(id)
      .then((rows) => setPositions(rows ?? []))
      .catch((e) => onError(errMsg(e)))
      .finally(() => setLoading(false))
  }, [id, onError])

  useEffect(() => {
    load()
  }, [load])

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!form.role_name.trim()) return
    setSaving(true)
    try {
      await eventExtensionsApi.addVolunteerPosition(id, {
        role_name: form.role_name.trim(),
        slots_needed: form.slots_needed ? parseInt(form.slots_needed, 10) : undefined,
        shift_time: form.shift_time.trim() || undefined,
        skills_required: form.skills_required.trim() || undefined,
        description: form.description.trim() || undefined,
      })
      onOk('Volunteer position added.')
      setForm({ role_name: '', slots_needed: '', shift_time: '', skills_required: '', description: '' })
      load()
    } catch (err) {
      onError(errMsg(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
      <Card className="p-5">
        <SectionTitle>Add volunteer position</SectionTitle>
        <form onSubmit={submit} className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <FieldLabel>Role name *</FieldLabel>
            <Input
              required
              value={form.role_name}
              onChange={(e) => setForm((f) => ({ ...f, role_name: e.target.value }))}
              placeholder="Usher"
            />
          </div>
          <div>
            <FieldLabel>Slots needed</FieldLabel>
            <Input
              type="number"
              min="1"
              value={form.slots_needed}
              onChange={(e) => setForm((f) => ({ ...f, slots_needed: e.target.value }))}
              placeholder="5"
            />
          </div>
          <div>
            <FieldLabel>Shift time</FieldLabel>
            <Input
              value={form.shift_time}
              onChange={(e) => setForm((f) => ({ ...f, shift_time: e.target.value }))}
              placeholder="9:00 AM – 12:00 PM"
            />
          </div>
          <div>
            <FieldLabel>Skills required</FieldLabel>
            <Input
              value={form.skills_required}
              onChange={(e) => setForm((f) => ({ ...f, skills_required: e.target.value }))}
            />
          </div>
          <div className="sm:col-span-2">
            <FieldLabel>Description</FieldLabel>
            <Textarea
              rows={2}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </div>
          <div className="sm:col-span-2">
            <PrimaryButton type="submit" saving={saving} disabled={!form.role_name.trim()}>
              <Plus className="h-4 w-4" /> Add Position
            </PrimaryButton>
          </div>
        </form>
      </Card>

      {loading ? (
        <TabLoader />
      ) : positions.length === 0 ? (
        <EmptyState label="No volunteer positions yet." />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {positions.map((p) => {
            const pct = p.slots_needed > 0 ? Math.min(100, (p.slots_filled / p.slots_needed) * 100) : 0
            return (
              <Card key={p.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-semibold text-gray-900">{p.role_name}</h3>
                  <span className="flex-shrink-0 text-xs font-medium text-gray-500">
                    {p.slots_filled}/{p.slots_needed} filled
                  </span>
                </div>
                {p.shift_time ? <p className="mt-1 text-xs text-gray-500">{p.shift_time}</p> : null}
                {p.description ? <p className="mt-1 text-xs text-gray-500">{p.description}</p> : null}
                {p.skills_required ? (
                  <p className="mt-1 text-[11px] text-gray-400">Skills: {p.skills_required}</p>
                ) : null}
                <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                  <div className="h-full rounded-full bg-[#140152]" style={{ width: `${pct}%` }} />
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </motion.div>
  )
}

// ── 8. FAQ ───────────────────────────────────────────────────────────────────

function FaqTab({ id, onOk, onError }: TabProps) {
  const [faqs, setFaqs] = useState<EventFaq[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [saving, setSaving] = useState<boolean>(false)
  const [form, setForm] = useState<{ question: string; answer: string }>({ question: '', answer: '' })

  const load = useCallback(() => {
    setLoading(true)
    eventExtensionsApi
      .listFaqs(id)
      .then((rows) => setFaqs(rows ?? []))
      .catch((e) => onError(errMsg(e)))
      .finally(() => setLoading(false))
  }, [id, onError])

  useEffect(() => {
    load()
  }, [load])

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!form.question.trim() || !form.answer.trim()) return
    setSaving(true)
    try {
      await eventExtensionsApi.addFaq(id, { question: form.question.trim(), answer: form.answer.trim() })
      onOk('FAQ added.')
      setForm({ question: '', answer: '' })
      load()
    } catch (err) {
      onError(errMsg(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
      <Card className="p-5">
        <SectionTitle>Add FAQ</SectionTitle>
        <form onSubmit={submit} className="mt-4 space-y-3">
          <div>
            <FieldLabel>Question *</FieldLabel>
            <Input
              required
              value={form.question}
              onChange={(e) => setForm((f) => ({ ...f, question: e.target.value }))}
            />
          </div>
          <div>
            <FieldLabel>Answer *</FieldLabel>
            <Textarea
              rows={3}
              required
              value={form.answer}
              onChange={(e) => setForm((f) => ({ ...f, answer: e.target.value }))}
            />
          </div>
          <PrimaryButton type="submit" saving={saving} disabled={!form.question.trim() || !form.answer.trim()}>
            <Plus className="h-4 w-4" /> Add FAQ
          </PrimaryButton>
        </form>
      </Card>

      {loading ? (
        <TabLoader />
      ) : faqs.length === 0 ? (
        <EmptyState label="No FAQs yet." />
      ) : (
        <div className="space-y-3">
          {faqs.map((f) => (
            <Card key={f.id} className="p-4">
              <h3 className="font-semibold text-gray-900">{f.question}</h3>
              <p className="mt-1 text-sm text-gray-600">{f.answer}</p>
            </Card>
          ))}
        </div>
      )}
    </motion.div>
  )
}

// ── 9. Tags ──────────────────────────────────────────────────────────────────

function TagsTab({ id, onOk, onError }: TabProps) {
  const [tags, setTags] = useState<string[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [saving, setSaving] = useState<boolean>(false)
  const [value, setValue] = useState<string>('')

  const load = useCallback(() => {
    setLoading(true)
    eventExtensionsApi
      .listTags(id)
      .then((rows) => setTags(rows ?? []))
      .catch((e) => onError(errMsg(e)))
      .finally(() => setLoading(false))
  }, [id, onError])

  useEffect(() => {
    load()
  }, [load])

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const tag = value.trim()
    if (!tag) return
    setSaving(true)
    try {
      await eventExtensionsApi.addTag(id, tag)
      onOk('Tag added.')
      setValue('')
      load()
    } catch (err) {
      onError(errMsg(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
      <Card className="p-5">
        <SectionTitle>Tags</SectionTitle>
        <form onSubmit={submit} className="mt-4 flex flex-col gap-2 sm:flex-row">
          <Input placeholder="Add a tag…" value={value} onChange={(e) => setValue(e.target.value)} />
          <PrimaryButton type="submit" saving={saving} disabled={!value.trim()}>
            <Plus className="h-4 w-4" /> Add
          </PrimaryButton>
        </form>

        <div className="mt-5">
          {loading ? (
            <TabLoader />
          ) : tags.length === 0 ? (
            <EmptyState label="No tags yet." />
          ) : (
            <div className="flex flex-wrap gap-2">
              {tags.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#140152]/10 px-3 py-1 text-sm font-medium text-[#140152]"
                >
                  <TagIcon className="h-3.5 w-3.5" />
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  )
}

// ── 10. Gallery ──────────────────────────────────────────────────────────────

const PHASE_STYLES: Record<string, string> = {
  promotional: 'bg-purple-100 text-purple-700',
  before: 'bg-blue-100 text-blue-700',
  during: 'bg-green-100 text-green-700',
  after: 'bg-amber-100 text-amber-700',
}

function GalleryTab({ id, onOk, onError }: TabProps) {
  const [photos, setPhotos] = useState<EventPhoto[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [saving, setSaving] = useState<boolean>(false)
  const [deletingId, setDeletingId] = useState<string>('')
  const [form, setForm] = useState<{
    image_url: string
    caption: string
    phase: EventPhoto['phase']
    is_cover: boolean
  }>({ image_url: '', caption: '', phase: 'promotional', is_cover: false })

  const load = useCallback(() => {
    setLoading(true)
    eventExtensionsApi
      .listPhotos(id)
      .then((rows) => setPhotos(rows ?? []))
      .catch((e) => onError(errMsg(e)))
      .finally(() => setLoading(false))
  }, [id, onError])

  useEffect(() => {
    load()
  }, [load])

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!form.image_url.trim()) return
    setSaving(true)
    try {
      await eventExtensionsApi.addPhoto(id, {
        image_url: form.image_url.trim(),
        caption: form.caption.trim() || undefined,
        phase: form.phase,
        is_cover: form.is_cover,
      })
      onOk('Photo added.')
      setForm({ image_url: '', caption: '', phase: 'promotional', is_cover: false })
      load()
    } catch (err) {
      onError(errMsg(err))
    } finally {
      setSaving(false)
    }
  }

  const remove = async (photoId: string) => {
    setDeletingId(photoId)
    try {
      await eventExtensionsApi.deletePhoto(id, photoId)
      onOk('Photo removed.')
      load()
    } catch (e) {
      onError(errMsg(e))
    } finally {
      setDeletingId('')
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
      <Card className="p-5">
        <SectionTitle>Add photo</SectionTitle>
        <form onSubmit={submit} className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <FieldLabel>Image URL *</FieldLabel>
            <Input
              required
              value={form.image_url}
              onChange={(e) => setForm((f) => ({ ...f, image_url: e.target.value }))}
              placeholder="https://…"
            />
          </div>
          <div>
            <FieldLabel>Caption</FieldLabel>
            <Input
              value={form.caption}
              onChange={(e) => setForm((f) => ({ ...f, caption: e.target.value }))}
            />
          </div>
          <div>
            <FieldLabel>Phase</FieldLabel>
            <Select
              value={form.phase}
              onChange={(e) => setForm((f) => ({ ...f, phase: e.target.value as EventPhoto['phase'] }))}
            >
              <option value="promotional">Promotional</option>
              <option value="before">Before</option>
              <option value="during">During</option>
              <option value="after">After</option>
            </Select>
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-700 sm:col-span-2">
            <input
              type="checkbox"
              checked={form.is_cover}
              onChange={(e) => setForm((f) => ({ ...f, is_cover: e.target.checked }))}
              className="h-4 w-4 rounded border-gray-300 text-[#140152] focus:ring-[#140152]"
            />
            Set as cover photo
          </label>
          <div className="sm:col-span-2">
            <PrimaryButton type="submit" saving={saving} disabled={!form.image_url.trim()}>
              <Plus className="h-4 w-4" /> Add Photo
            </PrimaryButton>
          </div>
        </form>
      </Card>

      {loading ? (
        <TabLoader />
      ) : photos.length === 0 ? (
        <EmptyState label="No photos yet." />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {photos.map((p) => (
            <Card key={p.id} className="overflow-hidden">
              <div className="relative aspect-square bg-gray-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.image_url} alt={p.caption ?? 'Event photo'} className="h-full w-full object-cover" />
                <span
                  className={`absolute left-2 top-2 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${
                    PHASE_STYLES[p.phase] ?? 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {p.phase}
                </span>
                {p.is_cover ? (
                  <span className="absolute right-2 top-2 inline-flex items-center rounded-full bg-[#f5bb00] px-2 py-0.5 text-[10px] font-semibold text-[#140152]">
                    Cover
                  </span>
                ) : null}
                <button
                  onClick={() => remove(p.id)}
                  disabled={deletingId === p.id}
                  className="absolute bottom-2 right-2 rounded-lg bg-white/90 p-1.5 text-gray-500 shadow-sm transition hover:bg-white hover:text-red-600 disabled:opacity-50"
                  aria-label="Delete photo"
                >
                  {deletingId === p.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
              {p.caption ? <p className="truncate px-2 py-1.5 text-xs text-gray-600">{p.caption}</p> : null}
            </Card>
          ))}
        </div>
      )}
    </motion.div>
  )
}

// ── 11. Updates ──────────────────────────────────────────────────────────────

function UpdatesTab({ id, onOk, onError }: TabProps) {
  const [updates, setUpdates] = useState<EventUpdate[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [saving, setSaving] = useState<boolean>(false)
  const [form, setForm] = useState<{ title: string; content: string; is_urgent: boolean }>({
    title: '',
    content: '',
    is_urgent: false,
  })

  const load = useCallback(() => {
    setLoading(true)
    eventExtensionsApi
      .listUpdates(id)
      .then((rows) => setUpdates(rows ?? []))
      .catch((e) => onError(errMsg(e)))
      .finally(() => setLoading(false))
  }, [id, onError])

  useEffect(() => {
    load()
  }, [load])

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!form.title.trim() || !form.content.trim()) return
    setSaving(true)
    try {
      await eventExtensionsApi.postUpdate(id, {
        title: form.title.trim(),
        content: form.content.trim(),
        is_urgent: form.is_urgent,
      })
      onOk('Update posted. Attendees have been notified.')
      setForm({ title: '', content: '', is_urgent: false })
      load()
    } catch (err) {
      onError(errMsg(err))
    } finally {
      setSaving(false)
    }
  }

  const ordered = [...updates].sort((a, b) => b.created_at.localeCompare(a.created_at))

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
      <Card className="p-5">
        <SectionTitle>Post update</SectionTitle>
        <p className="mt-1 text-xs text-gray-500">Posting an update notifies all attendees.</p>
        <form onSubmit={submit} className="mt-4 space-y-3">
          <div>
            <FieldLabel>Title *</FieldLabel>
            <Input
              required
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            />
          </div>
          <div>
            <FieldLabel>Content *</FieldLabel>
            <Textarea
              rows={3}
              required
              value={form.content}
              onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={form.is_urgent}
              onChange={(e) => setForm((f) => ({ ...f, is_urgent: e.target.checked }))}
              className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
            />
            Mark as urgent
          </label>
          <PrimaryButton type="submit" saving={saving} disabled={!form.title.trim() || !form.content.trim()}>
            <Megaphone className="h-4 w-4" /> Post Update
          </PrimaryButton>
        </form>
      </Card>

      {loading ? (
        <TabLoader />
      ) : ordered.length === 0 ? (
        <EmptyState label="No updates posted yet." />
      ) : (
        <div className="space-y-3">
          {ordered.map((u) => (
            <Card
              key={u.id}
              className={`p-4 ${u.is_urgent ? 'border-red-200 bg-red-50' : ''}`}
            >
              <div className="flex items-center gap-2">
                {u.is_urgent ? <AlertTriangle className="h-4 w-4 flex-shrink-0 text-red-600" /> : null}
                <h3 className={`font-semibold ${u.is_urgent ? 'text-red-800' : 'text-gray-900'}`}>
                  {u.title}
                </h3>
              </div>
              <p className={`mt-1 text-sm ${u.is_urgent ? 'text-red-700' : 'text-gray-600'}`}>{u.content}</p>
              <p className="mt-2 text-[11px] text-gray-400">{formatDate(u.created_at)}</p>
            </Card>
          ))}
        </div>
      )}
    </motion.div>
  )
}

// ── 12. Polls ────────────────────────────────────────────────────────────────

function PollsTab({ id, onOk, onError }: TabProps) {
  const [polls, setPolls] = useState<EventPollData[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [saving, setSaving] = useState<boolean>(false)
  const [question, setQuestion] = useState<string>('')
  const [options, setOptions] = useState<string[]>(['', ''])

  const load = useCallback(() => {
    setLoading(true)
    eventExtensionsApi
      .listPolls(id)
      .then((rows) => setPolls(rows ?? []))
      .catch((e) => onError(errMsg(e)))
      .finally(() => setLoading(false))
  }, [id, onError])

  useEffect(() => {
    load()
  }, [load])

  const setOption = (idx: number, val: string) => {
    setOptions((prev) => prev.map((o, i) => (i === idx ? val : o)))
  }
  const addOption = () => setOptions((prev) => [...prev, ''])
  const removeOption = (idx: number) =>
    setOptions((prev) => (prev.length > 2 ? prev.filter((_, i) => i !== idx) : prev))

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const cleaned = options.map((o) => o.trim()).filter(Boolean)
    if (!question.trim() || cleaned.length < 2) return
    setSaving(true)
    try {
      await eventExtensionsApi.createPoll(id, { question: question.trim(), options: cleaned })
      onOk('Poll created.')
      setQuestion('')
      setOptions(['', ''])
      load()
    } catch (err) {
      onError(errMsg(err))
    } finally {
      setSaving(false)
    }
  }

  const validOptions = options.filter((o) => o.trim()).length

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
      <Card className="p-5">
        <SectionTitle>Create poll</SectionTitle>
        <form onSubmit={submit} className="mt-4 space-y-3">
          <div>
            <FieldLabel>Question *</FieldLabel>
            <Input
              required
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="What time works best?"
            />
          </div>
          <div>
            <FieldLabel>Options (min 2)</FieldLabel>
            <div className="space-y-2">
              {options.map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input
                    value={opt}
                    onChange={(e) => setOption(i, e.target.value)}
                    placeholder={`Option ${i + 1}`}
                  />
                  {options.length > 2 ? (
                    <button
                      type="button"
                      onClick={() => removeOption(i)}
                      className="flex-shrink-0 rounded-lg p-2 text-gray-400 transition hover:bg-red-50 hover:text-red-600"
                      aria-label="Remove option"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  ) : null}
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addOption}
              className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-[#140152] hover:underline"
            >
              <Plus className="h-3.5 w-3.5" /> Add option
            </button>
          </div>
          <PrimaryButton type="submit" saving={saving} disabled={!question.trim() || validOptions < 2}>
            <Plus className="h-4 w-4" /> Create Poll
          </PrimaryButton>
        </form>
      </Card>

      {loading ? (
        <TabLoader />
      ) : polls.length === 0 ? (
        <EmptyState label="No polls yet." />
      ) : (
        <div className="space-y-3">
          {polls.map((poll) => (
            <Card key={poll.id} className="p-5">
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-semibold text-gray-900">{poll.question}</h3>
                <span className="flex-shrink-0 text-xs text-gray-500">{poll.total_votes} votes</span>
              </div>
              <div className="mt-3 space-y-2.5">
                {poll.options?.map((opt) => (
                  <div key={opt.index}>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="font-medium text-gray-700">{opt.option}</span>
                      <span className="text-gray-500">
                        {opt.votes} · {Math.round(opt.percentage)}%
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                      <div
                        className="h-full rounded-full bg-[#140152]"
                        style={{ width: `${Math.min(100, opt.percentage)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}
    </motion.div>
  )
}
