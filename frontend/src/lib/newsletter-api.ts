/** Newsletter API client (subscribers + broadcasts). */

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
        const err = await res.json().catch(() => ({ detail: res.statusText }))
        throw new Error(err.detail || 'Request failed')
    }
    if (res.status === 204) return {} as T
    return res.json()
}

export interface Subscriber {
    id: string
    email: string
    name?: string
    is_active: boolean
    source?: string
    subscribed_at: string
}

export interface Broadcast {
    id: string
    subject: string
    recipients_count: number
    success_count: number
    failure_count: number
    created_at: string
}

export const newsletterApi = {
    subscribe: (email: string, name?: string, source = 'homepage') =>
        request<{ message: string }>(`/newsletter/subscribe`, {
            method: 'POST', body: JSON.stringify({ email, name, source }),
        }),

    listSubscribers: (activeOnly = true) =>
        request<Subscriber[]>(`/newsletter/subscribers?active_only=${activeOnly}`),

    subscriberCount: () =>
        request<{ active_subscribers: number }>(`/newsletter/subscribers/count`),

    deleteSubscriber: (id: string) =>
        request<{ message: string }>(`/newsletter/subscribers/${id}`, { method: 'DELETE' }),

    broadcast: (subject: string, body_html: string) =>
        request<Broadcast>(`/newsletter/broadcast`, {
            method: 'POST', body: JSON.stringify({ subject, body_html }),
        }),

    listBroadcasts: () =>
        request<Broadcast[]>(`/newsletter/broadcasts`),
}
