/**
 * Event Extensions API Client
 * RSVPs, speakers, sessions, gallery, comments, tickets,
 * sponsors, volunteers, FAQ, tags, polls, donations, etc.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

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
  if (res.status === 204) return {} as T
  return res.json()
}

// ── Types ──────────────────────────────────────────────────────────────────

export interface EventRsvp {
  id: string
  event_id: string
  user_id?: string
  user_name?: string
  guest_name?: string
  guest_email?: string
  status: 'attending' | 'maybe' | 'declined' | 'waitlisted'
  plus_ones: number
  payment_status: string
  checked_in: boolean
  checked_in_at?: string
  qr_token: string
  created_at: string
}

export interface EventSpeaker {
  id: string
  name: string
  title?: string
  bio?: string
  photo_url?: string
  organization?: string
  twitter_url?: string
  linkedin_url?: string
  website_url?: string
  is_keynote: boolean
  sort_order: number
}

export interface EventSession {
  id: string
  title: string
  description?: string
  session_date: string
  start_time: string
  end_time?: string
  room?: string
  track?: string
  speaker_ids?: { ids: string[] }
  session_type: string
  capacity?: number
  sort_order: number
}

export interface EventPhoto {
  id: string
  image_url: string
  thumbnail_url?: string
  caption?: string
  photographer?: string
  phase: 'promotional' | 'before' | 'during' | 'after'
  is_cover: boolean
  sort_order: number
}

export interface EventComment {
  id: string
  user_id?: string
  author_name: string
  content: string
  parent_id?: string
  is_question: boolean
  is_answered: boolean
  upvotes: number
  is_pinned: boolean
  created_at: string
}

export interface EventTicket {
  id: string
  name: string
  description?: string
  price: number
  currency: string
  capacity?: number
  sold_count: number
  benefits?: { items: string[] }
  is_active: boolean
  sort_order: number
}

export interface EventSponsor {
  id: string
  name: string
  logo_url?: string
  website_url?: string
  description?: string
  tier: 'platinum' | 'gold' | 'silver' | 'bronze' | 'standard'
  sort_order: number
}

export interface EventVolunteerPosition {
  id: string
  role_name: string
  description?: string
  slots_needed: number
  slots_filled: number
  shift_time?: string
  skills_required?: string
  is_active: boolean
}

export interface EventFaq {
  id: string
  question: string
  answer: string
  sort_order: number
}

export interface EventUpdate {
  id: string
  title: string
  content: string
  is_urgent: boolean
  created_at: string
}

export interface EventPollData {
  id: string
  question: string
  total_votes: number
  options: Array<{
    index: number
    option: string
    votes: number
    percentage: number
  }>
}

export interface EventFullStats {
  rsvps: number
  speakers: number
  sessions: number
  photos: number
  comments: number
  questions: number
  tickets: number
  sponsors: number
  volunteer_positions: number
  faqs: number
  updates: number
  polls: number
}

// ── API ────────────────────────────────────────────────────────────────────

export const eventExtensionsApi = {
  // ─── RSVPs ────────────────────────────────────────────────────────────────
  rsvp: (eventId: string, data: { status?: string; plus_ones?: number; notes?: string; responses?: any }) =>
    request<EventRsvp>(`/events/${eventId}/rsvp`, {
      method: 'POST', body: JSON.stringify(data),
    }),
  listRsvps: (eventId: string, statusFilter?: string): Promise<EventRsvp[]> =>
    request(`/events/${eventId}/rsvps${statusFilter ? `?status_filter=${statusFilter}` : ''}`),
  myRsvp: (eventId: string) => request(`/events/${eventId}/rsvp/my`),
  cancelMyRsvp: (eventId: string) =>
    request(`/events/${eventId}/rsvp`, { method: 'DELETE' }),
  checkInByQr: (qrToken: string) =>
    request(`/events/check-in-by-qr/${qrToken}`, { method: 'POST' }),
  checkInRsvp: (rsvpId: string) =>
    request(`/events/rsvp/${rsvpId}/check-in`, { method: 'POST' }),

  // ─── Speakers ────────────────────────────────────────────────────────────
  listSpeakers: (eventId: string): Promise<EventSpeaker[]> =>
    request(`/events/${eventId}/speakers`),
  addSpeaker: (eventId: string, data: Partial<EventSpeaker> & { name: string }) =>
    request(`/events/${eventId}/speakers`, {
      method: 'POST', body: JSON.stringify(data),
    }),
  deleteSpeaker: (eventId: string, speakerId: string) =>
    request(`/events/${eventId}/speakers/${speakerId}`, { method: 'DELETE' }),

  // ─── Sessions ────────────────────────────────────────────────────────────
  listSessions: (eventId: string): Promise<EventSession[]> =>
    request(`/events/${eventId}/sessions`),
  addSession: (eventId: string, data: Partial<EventSession> & { title: string; session_date: string; start_time: string }) =>
    request(`/events/${eventId}/sessions`, {
      method: 'POST', body: JSON.stringify(data),
    }),
  deleteSession: (eventId: string, sessionId: string) =>
    request(`/events/${eventId}/sessions/${sessionId}`, { method: 'DELETE' }),

  // ─── Photos ──────────────────────────────────────────────────────────────
  listPhotos: (eventId: string, phase?: string): Promise<EventPhoto[]> =>
    request(`/events/${eventId}/photos${phase ? `?phase=${phase}` : ''}`),
  addPhoto: (eventId: string, data: Partial<EventPhoto> & { image_url: string }) =>
    request(`/events/${eventId}/photos`, {
      method: 'POST', body: JSON.stringify(data),
    }),
  deletePhoto: (eventId: string, photoId: string) =>
    request(`/events/${eventId}/photos/${photoId}`, { method: 'DELETE' }),

  // ─── Comments ────────────────────────────────────────────────────────────
  listComments: (eventId: string, questionsOnly = false): Promise<EventComment[]> =>
    request(`/events/${eventId}/comments${questionsOnly ? '?questions_only=true' : ''}`),
  addComment: (eventId: string, content: string, isQuestion = false, parentId?: string) =>
    request(`/events/${eventId}/comments`, {
      method: 'POST', body: JSON.stringify({ content, is_question: isQuestion, parent_id: parentId || null }),
    }),
  upvoteComment: (commentId: string) =>
    request(`/events/comments/${commentId}/upvote`, { method: 'POST' }),
  deleteComment: (commentId: string) =>
    request(`/events/comments/${commentId}`, { method: 'DELETE' }),

  // ─── Tickets ─────────────────────────────────────────────────────────────
  listTickets: (eventId: string): Promise<EventTicket[]> =>
    request(`/events/${eventId}/tickets`),
  addTicket: (eventId: string, data: { name: string; price: number; description?: string; capacity?: number; benefits?: any }) =>
    request(`/events/${eventId}/tickets`, {
      method: 'POST', body: JSON.stringify(data),
    }),

  // ─── Sponsors ────────────────────────────────────────────────────────────
  listSponsors: (eventId: string): Promise<EventSponsor[]> =>
    request(`/events/${eventId}/sponsors`),
  addSponsor: (eventId: string, data: Partial<EventSponsor> & { name: string }) =>
    request(`/events/${eventId}/sponsors`, {
      method: 'POST', body: JSON.stringify(data),
    }),

  // ─── Volunteer Positions ─────────────────────────────────────────────────
  listVolunteerPositions: (eventId: string): Promise<EventVolunteerPosition[]> =>
    request(`/events/${eventId}/volunteer-positions`),
  addVolunteerPosition: (eventId: string, data: { role_name: string; description?: string; slots_needed?: number; shift_time?: string; skills_required?: string }) =>
    request(`/events/${eventId}/volunteer-positions`, {
      method: 'POST', body: JSON.stringify(data),
    }),
  signupVolunteer: (positionId: string) =>
    request(`/events/volunteer-positions/${positionId}/signup`, { method: 'POST' }),

  // ─── FAQ ─────────────────────────────────────────────────────────────────
  listFaqs: (eventId: string): Promise<EventFaq[]> =>
    request(`/events/${eventId}/faqs`),
  addFaq: (eventId: string, data: { question: string; answer: string; sort_order?: number }) =>
    request(`/events/${eventId}/faqs`, {
      method: 'POST', body: JSON.stringify(data),
    }),

  // ─── Tags ────────────────────────────────────────────────────────────────
  listTags: (eventId: string): Promise<string[]> =>
    request(`/events/${eventId}/tags`),
  addTag: (eventId: string, tag: string) =>
    request(`/events/${eventId}/tags?tag=${encodeURIComponent(tag)}`, { method: 'POST' }),
  searchByTag: (tag: string) =>
    request(`/events/search/by-tag/${encodeURIComponent(tag)}`),

  // ─── Reminders ───────────────────────────────────────────────────────────
  setReminder: (eventId: string, hoursBefore = 24) =>
    request(`/events/${eventId}/remind-me?hours_before=${hoursBefore}`, { method: 'POST' }),

  // ─── Updates / Announcements ─────────────────────────────────────────────
  listUpdates: (eventId: string): Promise<EventUpdate[]> =>
    request(`/events/${eventId}/updates`),
  postUpdate: (eventId: string, data: { title: string; content: string; is_urgent?: boolean }) =>
    request(`/events/${eventId}/updates`, {
      method: 'POST', body: JSON.stringify(data),
    }),

  // ─── Donations ───────────────────────────────────────────────────────────
  donate: (eventId: string, amount: number, options: { message?: string; is_anonymous?: boolean; donor_name?: string } = {}) =>
    request(`/events/${eventId}/donations`, {
      method: 'POST', body: JSON.stringify({ amount, currency: 'USD', ...options }),
    }),
  donationTotal: (eventId: string): Promise<{ total_raised: number; donor_count: number }> =>
    request(`/events/${eventId}/donations/total`),

  // ─── Polls ───────────────────────────────────────────────────────────────
  listPolls: (eventId: string): Promise<EventPollData[]> =>
    request(`/events/${eventId}/polls`),
  createPoll: (eventId: string, data: { question: string; options: string[]; show_results_after_vote?: boolean }) =>
    request(`/events/${eventId}/polls`, {
      method: 'POST', body: JSON.stringify(data),
    }),
  votePoll: (pollId: string, optionIndex: number) =>
    request(`/events/polls/${pollId}/vote?option_index=${optionIndex}`, { method: 'POST' }),

  // ─── Stats ───────────────────────────────────────────────────────────────
  fullStats: (eventId: string): Promise<EventFullStats> =>
    request(`/events/${eventId}/full-details`),

  // ─── Calendar export ─────────────────────────────────────────────────────
  calendarUrl: (eventId: string): string =>
    `${API_BASE_URL}/events/${eventId}/calendar.ics`,
}
