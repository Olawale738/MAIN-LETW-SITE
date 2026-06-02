/**
 * Department API client — Choir, Youth, Children.
 * All requests require a valid Bearer token stored in localStorage.
 */

const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

// ─── Types ────────────────────────────────────────────────────────────────────

export type Department = 'choir' | 'youth' | 'children' | 'media' | 'hospitality' | 'ushering' | 'security'

export interface DeptUser {
  id: string
  name: string
  email: string
  role: string
  status: string
}

export interface DeptMember {
  id: string
  user_id: string
  name: string
  email: string
  role_label: string | null
  is_active: boolean
  notes: string | null
  extra_info: Record<string, unknown> | null
  joined_at: string
}

export interface DeptAnnouncement {
  id: string
  department: string
  title: string
  body: string
  author_name: string | null
  is_urgent: boolean
  is_pinned: boolean
  created_at: string
}

export interface DeptActivity {
  id: string
  department: string
  title: string
  description: string | null
  activity_type: string
  activity_date: string | null
  activity_time: string | null
  venue: string | null
  creator_name: string | null
  created_at: string
}

export interface AttendanceRow {
  id: string
  user_id: string
  member_name: string
  session_label: string
  session_date: string
  present: boolean
  notes: string | null
}

export interface MyAttendanceRow {
  session_label: string
  session_date: string
  present: boolean
  notes: string | null
}

export interface MembershipStatus {
  is_member: boolean
  is_active: boolean
  role_label: string | null
  joined_at: string | null
}

export interface DeptMessage {
  id: string
  user_id: string
  sender_name: string
  content: string
  created_at: string
  is_mine: boolean
}

export interface DeptStats {
  total_members: number
  total_announcements: number
  total_activities: number
}

export interface AdminUser {
  id: string
  name: string
  email: string
  role: string
  status: string
  created_at: string
}

// ─── HTTP helper ──────────────────────────────────────────────────────────────

function authHeaders(): Record<string, string> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { ...authHeaders(), ...(init.headers as Record<string, string> || {}) },
  })
  if (res.status === 401) {
    if (typeof window !== 'undefined') window.location.href = '/auth/login'
    throw new Error('Unauthorized')
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail || 'Request failed')
  }
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

// ─── Current user ─────────────────────────────────────────────────────────────

export async function getCurrentUser(): Promise<DeptUser> {
  return request<DeptUser>('/users/me')
}

// ─── Stats ────────────────────────────────────────────────────────────────────

export async function getDeptStats(dept: Department): Promise<DeptStats> {
  return request<DeptStats>(`/departments/${dept}/stats`)
}

// ─── Members ─────────────────────────────────────────────────────────────────

export async function listMembers(dept: Department): Promise<DeptMember[]> {
  return request<DeptMember[]>(`/departments/${dept}/members`)
}

export async function addMember(
  dept: Department,
  email: string,
  role_label?: string,
  notes?: string,
  extra_info?: Record<string, unknown>
): Promise<{ message: string }> {
  return request(`/departments/${dept}/members`, {
    method: 'POST',
    body: JSON.stringify({ email, role_label, notes, extra_info }),
  })
}

export async function updateMember(
  dept: Department,
  userId: string,
  data: { role_label?: string; is_active?: boolean; notes?: string; extra_info?: Record<string, unknown> }
): Promise<{ message: string }> {
  return request(`/departments/${dept}/members/${userId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

export async function removeMember(dept: Department, userId: string): Promise<{ message: string }> {
  return request(`/departments/${dept}/members/${userId}`, { method: 'DELETE' })
}

// ─── Announcements ────────────────────────────────────────────────────────────

export async function listAnnouncements(dept: Department): Promise<DeptAnnouncement[]> {
  return request<DeptAnnouncement[]>(`/departments/${dept}/announcements`)
}

export async function createAnnouncement(
  dept: Department,
  data: { title: string; body: string; is_urgent?: boolean; is_pinned?: boolean }
): Promise<{ message: string }> {
  return request(`/departments/${dept}/announcements`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function deleteAnnouncement(dept: Department, annId: string): Promise<{ message: string }> {
  return request(`/departments/${dept}/announcements/${annId}`, { method: 'DELETE' })
}

// ─── Activities ───────────────────────────────────────────────────────────────

export async function listActivities(dept: Department): Promise<DeptActivity[]> {
  return request<DeptActivity[]>(`/departments/${dept}/activities`)
}

export async function createActivity(
  dept: Department,
  data: {
    title: string
    description?: string
    activity_type?: string
    activity_date?: string
    activity_time?: string
    venue?: string
  }
): Promise<{ message: string }> {
  return request(`/departments/${dept}/activities`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function deleteActivity(dept: Department, actId: string): Promise<{ message: string }> {
  return request(`/departments/${dept}/activities/${actId}`, { method: 'DELETE' })
}

// ─── Attendance ───────────────────────────────────────────────────────────────

export async function listAttendance(dept: Department, sessionLabel?: string): Promise<AttendanceRow[]> {
  const qs = sessionLabel ? `?session_label=${encodeURIComponent(sessionLabel)}` : ''
  return request<AttendanceRow[]>(`/departments/${dept}/attendance${qs}`)
}

export async function myAttendance(dept: Department): Promise<MyAttendanceRow[]> {
  return request<MyAttendanceRow[]>(`/departments/${dept}/attendance/me`)
}

export async function recordSessionAttendance(
  dept: Department,
  sessionLabel: string,
  sessionDate: string,
  entries: { user_id: string; present: boolean; notes?: string }[]
): Promise<{ message: string }> {
  return request(`/departments/${dept}/attendance/session`, {
    method: 'POST',
    body: JSON.stringify({ session_label: sessionLabel, session_date: sessionDate, entries }),
  })
}

// ─── My memberships ───────────────────────────────────────────────────────────

export async function myMemberships(): Promise<{ department: string; role_label: string | null; joined_at: string }[]> {
  return request('/departments/me')
}

// ─── Self-join ────────────────────────────────────────────────────────────────

export async function joinDepartment(dept: Department): Promise<{ message: string; status: string }> {
  return request(`/departments/${dept}/join`, { method: 'POST' })
}

export async function checkMembership(dept: Department): Promise<MembershipStatus> {
  return request<MembershipStatus>(`/departments/${dept}/membership/me`)
}

// ─── Group Chat ───────────────────────────────────────────────────────────────

export async function getDeptMessages(dept: Department, limit = 60): Promise<DeptMessage[]> {
  return request<DeptMessage[]>(`/departments/${dept}/chat?limit=${limit}`)
}

export async function sendDeptMessage(dept: Department, content: string): Promise<DeptMessage> {
  return request<DeptMessage>(`/departments/${dept}/chat`, {
    method: 'POST',
    body: JSON.stringify({ content }),
  })
}

// ─── Admin ────────────────────────────────────────────────────────────────────

export async function adminListUsers(search?: string): Promise<AdminUser[]> {
  const qs = search ? `?search=${encodeURIComponent(search)}` : ''
  return request<AdminUser[]>(`/admin/users${qs}`)
}

export async function adminListLeaders(): Promise<AdminUser[]> {
  return request<AdminUser[]>('/admin/leaders')
}

export async function adminAssignRole(userId: string, role: string): Promise<{ message: string }> {
  return request('/admin/role/assign', {
    method: 'POST',
    body: JSON.stringify({ user_id: userId, role }),
  })
}

export async function adminRevokeRole(userId: string): Promise<{ message: string }> {
  return request('/admin/role/revoke', {
    method: 'POST',
    body: JSON.stringify({ user_id: userId }),
  })
}
