/**
 * Custom Ministries API client
 * Admin-created ministries (Women's, Men's, Marriage, Singles, etc.)
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

export interface Ministry {
  id: string
  slug: string
  name: string
  tagline?: string
  description?: string
  hero_image_url?: string
  icon_url?: string
  color: string
  secondary_color: string
  icon_name: string
  emoji?: string
  is_active: boolean
  accepts_members: boolean
  meeting_schedule?: string
  location?: string
  features?: Record<string, any>
  sort_order: number
  member_count: number
  created_at: string
  // Extended fields
  mission_statement?: string
  vision_statement?: string
  core_values?: string
  scripture_verse?: string
  scripture_reference?: string
  contact_email?: string
  contact_phone?: string
  whatsapp_number?: string
  whatsapp_group_link?: string
  facebook_url?: string
  instagram_url?: string
  twitter_url?: string
  youtube_url?: string
  website_url?: string
  meeting_day?: string
  meeting_time?: string
  online_meeting_link?: string
  category?: string
  target_audience?: string
  age_min?: number
  age_max?: number
  gender_filter?: string
  requires_approval?: boolean
  membership_fee?: number
  requires_baptism?: boolean
  requires_application?: boolean
  application_questions?: any
  gallery_images?: any
  goals?: string
  impact_stats?: any
  faqs?: any
  is_featured?: boolean
  show_on_homepage?: boolean
}

export interface MinistryLeader {
  id: string
  name: string
  role_type: string
  role_title?: string
  bio?: string
  photo_url?: string
  email?: string
  phone?: string
  is_primary: boolean
  sort_order: number
  user_id?: string
  created_at: string
}

export interface MinistryEvent {
  id: string
  title: string
  description?: string
  event_type: string
  event_date: string
  event_time?: string
  end_time?: string
  location?: string
  online_link?: string
  image_url?: string
  is_recurring: boolean
  recurrence_pattern?: string
  max_attendees?: number
  requires_rsvp: boolean
  is_public: boolean
  is_cancelled: boolean
  rsvp_count: number
  created_at: string
}

export interface MinistryResource {
  id: string
  title: string
  description?: string
  resource_type: string
  url: string
  file_size?: number
  category?: string
  thumbnail_url?: string
  download_count: number
  is_featured: boolean
  sort_order: number
  created_at: string
}

export interface MinistryTestimonial {
  id: string
  author_name: string
  author_role?: string
  photo_url?: string
  content: string
  rating?: number
  is_approved: boolean
  is_featured: boolean
  created_at: string
}

export interface MinistryPrayerRequest {
  id: string
  author_name: string
  request: string
  is_anonymous: boolean
  is_urgent: boolean
  is_answered: boolean
  answer_testimony?: string
  prayer_count: number
  created_at: string
}

export interface MinistryActivity {
  id: string
  activity_type: string
  title: string
  description?: string
  activity_date: string
  duration_hours?: number
  participants_count?: number
  lives_impacted?: number
  location?: string
  image_url?: string
  created_at: string
}

export interface MinistryStats {
  members: number
  pending_members: number
  events: number
  upcoming_events: number
  resources: number
  announcements: number
  testimonials: number
  prayer_requests: number
  answered_prayers: number
  activities: number
  leaders: number
}

export interface MinistryCreate {
  name: string
  slug?: string
  tagline?: string
  description?: string
  hero_image_url?: string
  icon_url?: string
  color?: string
  secondary_color?: string
  icon_name?: string
  emoji?: string
  accepts_members?: boolean
  meeting_schedule?: string
  location?: string
  features?: Record<string, any>
  // Extended
  mission_statement?: string
  vision_statement?: string
  core_values?: string
  scripture_verse?: string
  scripture_reference?: string
  contact_email?: string
  contact_phone?: string
  whatsapp_number?: string
  whatsapp_group_link?: string
  facebook_url?: string
  instagram_url?: string
  twitter_url?: string
  youtube_url?: string
  website_url?: string
  meeting_day?: string
  meeting_time?: string
  online_meeting_link?: string
  category?: string
  target_audience?: string
  age_min?: number
  age_max?: number
  gender_filter?: string
  requires_approval?: boolean
  membership_fee?: number
  requires_baptism?: boolean
  requires_application?: boolean
  application_questions?: any
  gallery_images?: any
  goals?: string
  impact_stats?: any
  faqs?: any
  is_featured?: boolean
  show_on_homepage?: boolean
}

export interface MinistryMember {
  id: string
  user_id: string
  name: string
  email: string
  status: 'pending' | 'active' | 'suspended' | 'rejected'
  is_coordinator: boolean
  role_label?: string
  join_message?: string
  notes?: string
  requested_at: string
  approved_at?: string
}

export interface MinistryAnnouncement {
  id: string
  title: string
  body: string
  author_name?: string
  is_pinned: boolean
  created_at: string
}

export interface MinistryMessage {
  id: string
  sender_id: string
  sender_name: string
  content: string
  created_at: string
  is_mine: boolean
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init?.headers as Record<string, string> ?? {}),
  }
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(`${API_BASE_URL}${path}`, { ...init, headers })
  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(error.detail || 'Request failed')
  }
  // 204 No Content
  if (res.status === 204) return {} as T
  return res.json()
}

// ─── Public ─────────────────────────────────────────────────────────────────

export const ministriesApi = {
  // List all active ministries
  list: (): Promise<Ministry[]> => request('/ministries'),

  // List ALL including inactive (admin)
  listAll: (): Promise<Ministry[]> =>
    request('/ministries?include_inactive=true'),

  // Get ministry by slug
  get: (slug: string): Promise<Ministry> => request(`/ministries/${slug}`),

  // ─── Members ──────────────────────────────────────────────────────────────

  // Request to join a ministry
  join: (slug: string, message?: string): Promise<{ message: string; status: string }> =>
    request(`/ministries/${slug}/join`, {
      method: 'POST',
      body: JSON.stringify({ message: message || null }),
    }),

  // List members of a ministry
  listMembers: (slug: string, statusFilter?: string): Promise<MinistryMember[]> => {
    const q = statusFilter ? `?status_filter=${statusFilter}` : ''
    return request(`/ministries/${slug}/members${q}`)
  },

  approveMember: (slug: string, userId: string): Promise<{ message: string }> =>
    request(`/ministries/${slug}/members/${userId}/approve`, { method: 'POST' }),

  rejectMember: (slug: string, userId: string): Promise<{ message: string }> =>
    request(`/ministries/${slug}/members/${userId}/reject`, { method: 'POST' }),

  assignCoordinator: (slug: string, userId: string, make: boolean = true): Promise<{ message: string }> =>
    request(`/ministries/${slug}/members/${userId}/coordinator?make_coordinator=${make}`, {
      method: 'POST',
    }),

  removeMember: (slug: string, userId: string): Promise<{ message: string }> =>
    request(`/ministries/${slug}/members/${userId}`, { method: 'DELETE' }),

  // ─── Announcements ────────────────────────────────────────────────────────

  listAnnouncements: (slug: string): Promise<MinistryAnnouncement[]> =>
    request(`/ministries/${slug}/announcements`),

  createAnnouncement: (
    slug: string,
    body: { title: string; body: string; is_pinned?: boolean }
  ): Promise<MinistryAnnouncement> =>
    request(`/ministries/${slug}/announcements`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  // ─── Chat Messages ────────────────────────────────────────────────────────

  listMessages: (slug: string, limit = 50): Promise<MinistryMessage[]> =>
    request(`/ministries/${slug}/messages?limit=${limit}`),

  sendMessage: (slug: string, content: string): Promise<MinistryMessage> =>
    request(`/ministries/${slug}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    }),

  // ─── Admin: CRUD ──────────────────────────────────────────────────────────

  create: (body: MinistryCreate): Promise<Ministry> =>
    request('/ministries', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  update: (slug: string, body: Partial<MinistryCreate & { is_active?: boolean; sort_order?: number }>): Promise<Ministry> =>
    request(`/ministries/${slug}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),

  delete: (slug: string): Promise<{ message: string }> =>
    request(`/ministries/${slug}`, { method: 'DELETE' }),

  // ─── Leaders ──────────────────────────────────────────────────────────────
  listLeaders: (slug: string): Promise<MinistryLeader[]> =>
    request(`/ministries/${slug}/leaders`),

  addLeader: (slug: string, body: Partial<MinistryLeader> & { name: string; role_type: string }): Promise<MinistryLeader> =>
    request(`/ministries/${slug}/leaders`, { method: 'POST', body: JSON.stringify(body) }),

  deleteLeader: (slug: string, leaderId: string): Promise<{ message: string }> =>
    request(`/ministries/${slug}/leaders/${leaderId}`, { method: 'DELETE' }),

  // ─── Events ───────────────────────────────────────────────────────────────
  listEvents: (slug: string, upcomingOnly = true): Promise<MinistryEvent[]> =>
    request(`/ministries/${slug}/events?upcoming_only=${upcomingOnly}`),

  createEvent: (slug: string, body: Partial<MinistryEvent> & { title: string; event_date: string }): Promise<MinistryEvent> =>
    request(`/ministries/${slug}/events`, { method: 'POST', body: JSON.stringify(body) }),

  rsvpEvent: (slug: string, eventId: string, status: string = 'attending'): Promise<{ message: string }> =>
    request(`/ministries/${slug}/events/${eventId}/rsvp?status=${status}`, { method: 'POST' }),

  deleteEvent: (slug: string, eventId: string): Promise<{ message: string }> =>
    request(`/ministries/${slug}/events/${eventId}`, { method: 'DELETE' }),

  // ─── Resources ────────────────────────────────────────────────────────────
  listResources: (slug: string): Promise<MinistryResource[]> =>
    request(`/ministries/${slug}/resources`),

  addResource: (slug: string, body: Partial<MinistryResource> & { title: string; url: string }): Promise<MinistryResource> =>
    request(`/ministries/${slug}/resources`, { method: 'POST', body: JSON.stringify(body) }),

  deleteResource: (slug: string, resourceId: string): Promise<{ message: string }> =>
    request(`/ministries/${slug}/resources/${resourceId}`, { method: 'DELETE' }),

  // ─── Testimonials ─────────────────────────────────────────────────────────
  listTestimonials: (slug: string, approvedOnly = true): Promise<MinistryTestimonial[]> =>
    request(`/ministries/${slug}/testimonials?approved_only=${approvedOnly}`),

  addTestimonial: (slug: string, body: { content: string; author_role?: string; rating?: number; photo_url?: string }): Promise<MinistryTestimonial> =>
    request(`/ministries/${slug}/testimonials`, { method: 'POST', body: JSON.stringify(body) }),

  approveTestimonial: (slug: string, testimonialId: string): Promise<{ message: string }> =>
    request(`/ministries/${slug}/testimonials/${testimonialId}/approve`, { method: 'POST' }),

  // ─── Prayer Requests ──────────────────────────────────────────────────────
  listPrayerRequests: (slug: string): Promise<MinistryPrayerRequest[]> =>
    request(`/ministries/${slug}/prayer-requests`),

  addPrayerRequest: (slug: string, body: { request: string; is_anonymous?: boolean; is_urgent?: boolean; is_visible_to_public?: boolean }): Promise<MinistryPrayerRequest> =>
    request(`/ministries/${slug}/prayer-requests`, { method: 'POST', body: JSON.stringify(body) }),

  prayForRequest: (slug: string, requestId: string): Promise<{ prayer_count: number }> =>
    request(`/ministries/${slug}/prayer-requests/${requestId}/pray`, { method: 'POST' }),

  // ─── Activities ───────────────────────────────────────────────────────────
  listActivities: (slug: string): Promise<MinistryActivity[]> =>
    request(`/ministries/${slug}/activities`),

  logActivity: (slug: string, body: Partial<MinistryActivity> & { activity_type: string; title: string; activity_date: string }): Promise<MinistryActivity> =>
    request(`/ministries/${slug}/activities`, { method: 'POST', body: JSON.stringify(body) }),

  // ─── Stats ────────────────────────────────────────────────────────────────
  getStats: (slug: string): Promise<MinistryStats> =>
    request(`/ministries/${slug}/stats`),
}
