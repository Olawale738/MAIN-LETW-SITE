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
}
