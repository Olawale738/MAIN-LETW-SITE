/**
 * API client for backend communication.
 * Handles authentication and API calls.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

/**
 * Ping the backend /health endpoint patiently to wake a sleeping Render free-tier
 * instance. Returns true once the server responds (or false after maxMs).
 * Useful as a manual "Wake server" action from error screens.
 */
export async function wakeBackend(maxMs = 60_000): Promise<boolean> {
    const start = Date.now()
    // /health is on the root, not under /api. Strip /api suffix from the base.
    const healthUrl = `${API_BASE_URL.replace(/\/api\/?$/, '')}/health`
    while (Date.now() - start < maxMs) {
        try {
            const ctl = new AbortController()
            const t = setTimeout(() => ctl.abort(), 6000)
            const r = await fetch(healthUrl, { signal: ctl.signal, cache: 'no-store' })
            clearTimeout(t)
            if (r.ok) return true
        } catch { /* keep trying */ }
        await new Promise(r => setTimeout(r, 2000))
    }
    return false
}

// ============= Types =============

export interface RegisterRequest {
    name: string;
    email: string;
    phone?: string;
    country_code?: string;
    country_name?: string;
    continent?: string;
}

export interface RegisterResponse {
    message: string;
    email: string;
    success: boolean;
}

export interface VerifyTokenRequest {
    token: string;
}

export interface VerifyTokenResponse {
    valid: boolean;
    user: User | null;
    message: string;
}

export interface SetPasswordRequest {
    token: string;
    password: string;
}

export interface LoginRequest {
    email: string;
    password: string;
}

export interface TokenResponse {
    access_token: string;
    refresh_token: string;
    token_type: string;
    expires_in: number;
}

export interface User {
    id: string;
    name: string;
    email: string;
    status: 'pending' | 'active' | 'suspended';
    services: string[];
    created_at: string;
    role?: 'user' | 'admin';
}

export interface MessageResponse {
    message: string;
    success: boolean;
}

export interface UpdateServicesRequest {
    services: string[];
}

// ============= API Client =============

export class ApiError extends Error {
    constructor(public status: number, message: string) {
        super(message);
        this.name = 'ApiError';
    }
}

// ============= Token Refresh Helpers =============

// Flag to prevent concurrent refresh attempts
let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

/**
 * Attempt to refresh the access token using the refresh token.
 * Prevents concurrent refresh attempts by returning the same promise.
 */
async function attemptTokenRefresh(): Promise<boolean> {
    // Prevent concurrent refresh attempts
    if (isRefreshing && refreshPromise) {
        return refreshPromise;
    }

    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) {
        return false;
    }

    isRefreshing = true;
    refreshPromise = (async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refresh_token: refreshToken }),
            });

            if (response.ok) {
                const tokens = await response.json();
                localStorage.setItem('access_token', tokens.access_token);
                localStorage.setItem('refresh_token', tokens.refresh_token);
                localStorage.setItem('isLoggedIn', 'true');
                return true;
            }
            return false;
        } catch {
            return false;
        } finally {
            isRefreshing = false;
            refreshPromise = null;
        }
    })();

    return refreshPromise;
}

/**
 * Handle authentication failure by clearing tokens and redirecting to login.
 */
function handleAuthFailure(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userName');
    // Redirect to login
    window.location.href = '/auth/login';
}

// ============= API Client =============

async function fetchApi<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string>),
    };

    // Add auth token if available
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('access_token');
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
    }

    // Cold-start safe fetch — Render free tier can sleep ~30-60s, so first
    // request after idle can throw "Failed to fetch". Retry with exponential
    // backoff totalling ~30s before giving up.
    async function fetchWithRetry(input: string, init: RequestInit, attempts = 6): Promise<Response> {
        const delays = [1500, 3000, 5000, 7000, 9000]   // 5 waits between 6 attempts ≈ 25s
        let lastErr: unknown
        for (let i = 0; i < attempts; i++) {
            try {
                return await fetch(input, init)
            } catch (e) {
                lastErr = e
                // Only retry on the bare network error (TypeError: Failed to fetch).
                // 4xx/5xx come back as a Response, not a thrown error.
                if (i === attempts - 1) break
                await new Promise(r => setTimeout(r, delays[i] ?? 9000))
            }
        }
        const hint = url.includes('localhost') || !url.startsWith('http')
            ? ` (the frontend is configured to call ${API_BASE_URL || '(empty)'} — check NEXT_PUBLIC_API_URL in Vercel)`
            : ` (target: ${url})`
        throw lastErr instanceof Error
            ? new Error(`Couldn't reach the server.${hint}`)
            : new Error(`Couldn't reach the server.${hint}`)
    }
    const response = await fetchWithRetry(url, { ...options, headers });

    if (!response.ok) {
        // Handle 401 Unauthorized - token expired
        if (response.status === 401 && typeof window !== 'undefined') {
            // Don't try to refresh for auth endpoints (prevent infinite loop)
            if (!endpoint.startsWith('/auth/')) {
                const refreshed = await attemptTokenRefresh();
                if (refreshed) {
                    // Retry the request with new token
                    const newToken = localStorage.getItem('access_token');
                    if (newToken) {
                        headers['Authorization'] = `Bearer ${newToken}`;
                    }
                    const retryResponse = await fetch(url, { ...options, headers });
                    if (retryResponse.ok) {
                        return retryResponse.json();
                    }
                }
                // Refresh failed or retry failed - logout and redirect
                handleAuthFailure();
                throw new ApiError(401, 'Session expired. Please login again.');
            }
        }
        const errorData = await response.json().catch(() => ({ detail: 'An error occurred' }));
        throw new ApiError(response.status, errorData.detail || 'An error occurred');
    }

    // 204 No Content — body is empty, return undefined rather than crashing on JSON.parse
    if (response.status === 204) return undefined as T;

    // Some successful responses have an empty body (e.g. certain 200s from proxies)
    const text = await response.text();
    if (!text) return undefined as T;
    try {
        return JSON.parse(text) as T;
    } catch {
        return undefined as T;
    }
}

// ============= Auth API =============

export const authApi = {
    /**
     * Register a new user
     */
    register: async (data: RegisterRequest): Promise<RegisterResponse> => {
        return fetchApi<RegisterResponse>('/auth/register', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    /**
     * Verify a token from email link
     */
    verifyToken: async (token: string): Promise<VerifyTokenResponse> => {
        return fetchApi<VerifyTokenResponse>('/auth/verify-token', {
            method: 'POST',
            body: JSON.stringify({ token }),
        });
    },

    /**
     * Set password after email verification
     */
    setPassword: async (data: SetPasswordRequest): Promise<TokenResponse> => {
        return fetchApi<TokenResponse>('/auth/set-password', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    /**
     * Login with email and password
     */
    login: async (data: LoginRequest): Promise<TokenResponse> => {
        return fetchApi<TokenResponse>('/auth/login', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    /**
     * Refresh access token
     */
    refreshToken: async (refreshToken: string): Promise<TokenResponse> => {
        return fetchApi<TokenResponse>('/auth/refresh', {
            method: 'POST',
            body: JSON.stringify({ refresh_token: refreshToken }),
        });
    },

    /**
     * Request password reset email
     */
    forgotPassword: async (email: string): Promise<MessageResponse> => {
        return fetchApi<MessageResponse>('/auth/forgot-password', {
            method: 'POST',
            body: JSON.stringify({ email }),
        });
    },

    /**
     * Reset password with token from email
     */
    resetPassword: async (token: string, password: string): Promise<MessageResponse> => {
        return fetchApi<MessageResponse>('/auth/reset-password', {
            method: 'POST',
            body: JSON.stringify({ token, password }),
        });
    },

    /**
     * Change password (for logged-in users)
     */
    changePassword: async (currentPassword: string, newPassword: string): Promise<MessageResponse> => {
        return fetchApi<MessageResponse>('/auth/change-password', {
            method: 'PUT',
            body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
        });
    },

    /**
     * Get current user info
     */
    getCurrentUser: async (): Promise<User> => {
        return fetchApi<User>('/auth/me');
    },
};

// ============= User API =============

export const userApi = {
    /**
     * Get available services list
     */
    getAvailableServices: async (): Promise<string[]> => {
        return fetchApi<string[]>('/users/services');
    },

    /**
     * Update user services
     */
    updateServices: async (services: string[]): Promise<User> => {
        return fetchApi<User>('/users/me/services', {
            method: 'PUT',
            body: JSON.stringify({ services }),
        });
    },

    /**
     * Get my profile (from users endpoint)
     */
    getProfile: async (): Promise<User> => {
        return fetchApi<User>('/users/me');
    },

    /**
     * Update user profile (name)
     */
    updateProfile: async (name: string): Promise<User> => {
        return fetchApi<User>('/users/me', {
            method: 'PUT',
            body: JSON.stringify({ name }),
        });
    }
};

// ============= Service Request Types =============

export type ServiceRequestStatus = 'pending' | 'approved' | 'rejected' | 'suspended';

export interface ServiceRequest {
    id: string;
    user_id: string;
    user_name?: string;
    user_email?: string;
    service_name: string;
    message?: string;
    status: ServiceRequestStatus;
    reviewed_by?: string;
    reviewed_at?: string;
    admin_note?: string;
    created_at: string;
    updated_at: string;
}

export interface MyServiceRequestsResponse {
    pending: ServiceRequest[];
    approved: ServiceRequest[];
    rejected: ServiceRequest[];
}

export interface ServiceRequestListResponse {
    requests: ServiceRequest[];
    total: number;
}

// ============= Notification Types =============

export type NotificationType = 'service_approved' | 'service_rejected' | 'new_service_request' | 'general';

export interface Notification {
    id: string;
    title: string;
    message: string;
    type: NotificationType;
    is_read: boolean;
    reference_id?: string;
    created_at: string;
}

export interface NotificationListResponse {
    notifications: Notification[];
    total: number;
    unread_count: number;
}

// ============= Service Request API =============

export const serviceRequestApi = {
    /**
     * Submit service requests (creates pending requests)
     */
    submitRequests: async (services: string[], message?: string): Promise<MessageResponse> => {
        return fetchApi<MessageResponse>('/service-requests', {
            method: 'POST',
            body: JSON.stringify({ services, message }),
        });
    },

    /**
     * Get my service requests grouped by status
     */
    getMyRequests: async (): Promise<MyServiceRequestsResponse> => {
        return fetchApi<MyServiceRequestsResponse>('/service-requests/my');
    },

    /**
     * Get all service requests (admin only)
     */
    getAllRequests: async (status?: ServiceRequestStatus): Promise<ServiceRequestListResponse> => {
        const params = status ? `?status_filter=${status}` : '';
        return fetchApi<ServiceRequestListResponse>(`/service-requests${params}`);
    },

    /**
     * Approve a service request (admin only)
     */
    approve: async (requestId: string, note?: string): Promise<ServiceRequest> => {
        return fetchApi<ServiceRequest>(`/service-requests/${requestId}/approve`, {
            method: 'PUT',
            body: JSON.stringify({ note }),
        });
    },

    /**
     * Reject a service request (admin only)
     */
    reject: async (requestId: string, note?: string): Promise<ServiceRequest> => {
        return fetchApi<ServiceRequest>(`/service-requests/${requestId}/reject`, {
            method: 'PUT',
            body: JSON.stringify({ note }),
        });
    },

    /**
     * Delete a service request entirely (admin only).
     * If the request was approved, also revokes the service from the user's services list.
     */
    deleteRequest: async (requestId: string): Promise<void> => {
        return fetchApi<void>(`/service-requests/${requestId}`, { method: 'DELETE' });
    },

    /** Temporarily suspend an approved volunteer/service (admin only, reversible) */
    suspend: async (requestId: string, note?: string): Promise<ServiceRequest> => {
        return fetchApi<ServiceRequest>(`/service-requests/${requestId}/suspend`, {
            method: 'PUT',
            body: JSON.stringify({ note }),
        });
    },

    /** Reinstate a suspended volunteer/service (admin only) */
    reinstate: async (requestId: string): Promise<ServiceRequest> => {
        return fetchApi<ServiceRequest>(`/service-requests/${requestId}/reinstate`, {
            method: 'PUT',
        });
    },
};

// ============= Notification API =============

export const notificationApi = {
    /**
     * Get notifications
     */
    getNotifications: async (limit = 20, offset = 0, unreadOnly = false): Promise<NotificationListResponse> => {
        const params = new URLSearchParams({
            limit: limit.toString(),
            offset: offset.toString(),
            unread_only: unreadOnly.toString(),
        });
        return fetchApi<NotificationListResponse>(`/notifications?${params}`);
    },

    /**
     * Get unread count
     */
    getUnreadCount: async (): Promise<{ unread_count: number }> => {
        return fetchApi<{ unread_count: number }>('/notifications/unread-count');
    },

    /**
     * Mark a notification as read
     */
    markAsRead: async (notificationId: string): Promise<Notification> => {
        return fetchApi<Notification>(`/notifications/${notificationId}/read`, {
            method: 'PUT',
        });
    },

    /**
     * Mark all notifications as read
     */
    markAllAsRead: async (): Promise<MessageResponse> => {
        return fetchApi<MessageResponse>('/notifications/mark-all-read', {
            method: 'PUT',
        });
    },
};

// ============= Token Management =============

export const tokenManager = {
    saveTokens: (tokens: TokenResponse) => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('access_token', tokens.access_token);
            localStorage.setItem('refresh_token', tokens.refresh_token);
            localStorage.setItem('isLoggedIn', 'true'); // Required for dashboard check
        }
    },

    clearTokens: () => {
        if (typeof window !== 'undefined') {
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            localStorage.removeItem('isLoggedIn');
            localStorage.removeItem('userName');
        }
    },

    getAccessToken: (): string | null => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('access_token');
        }
        return null;
    },

    getRefreshToken: (): string | null => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('refresh_token');
        }
        return null;
    },

    isLoggedIn: (): boolean => {
        return !!tokenManager.getAccessToken();
    },
};

// ============= Announcement Types =============

export interface Announcement {
    id: string;
    service_name: string;
    title: string;
    content: string;
    created_by: string | null;
    created_at: string;
    is_active: boolean;
}

export interface AnnouncementListResponse {
    announcements: Announcement[];
    total: number;
}

export interface AnnouncementCreate {
    service_name: string;
    title: string;
    content: string;
}

// ============= Announcement API =============

export const announcementApi = {
    /**
     * Create a new announcement (admin only)
     */
    create: async (data: AnnouncementCreate): Promise<Announcement> => {
        return fetchApi<Announcement>('/announcements', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    /**
     * Get all announcements (admin only)
     */
    getAll: async (): Promise<AnnouncementListResponse> => {
        return fetchApi<AnnouncementListResponse>('/announcements');
    },

    /**
     * Get announcements for a specific service
     */
    getForService: async (serviceName: string): Promise<AnnouncementListResponse> => {
        return fetchApi<AnnouncementListResponse>(`/announcements/service/${encodeURIComponent(serviceName)}`);
    },

    /**
     * Delete an announcement (admin only)
     */
    delete: async (id: string): Promise<MessageResponse> => {
        return fetchApi<MessageResponse>(`/announcements/${id}`, {
            method: 'DELETE',
        });
    },
};

// ============= Leadership Types =============

export interface LeadershipContent {
    id: string;
    module_id: string;
    content_type: 'video' | 'document';
    title: string;
    description?: string;
    youtube_url?: string;
    youtube_thumbnail?: string;
    file_name?: string;
    file_size?: number;
    order_index: number;
    created_at: string;
}

export interface LeadershipModule {
    id: string;
    title: string;
    description?: string;
    order_index: number;
    is_published: boolean;
    created_at: string;
    contents: LeadershipContent[];
}

export interface ModuleListResponse {
    modules: LeadershipModule[];
    total: number;
}

export interface ModuleCreate {
    title: string;
    description?: string;
    order_index?: number;
    is_published?: boolean;
}

export interface ModuleUpdate {
    title?: string;
    description?: string;
    order_index?: number;
    is_published?: boolean;
}

export interface VideoContentCreate {
    title: string;
    description?: string;
    youtube_url: string;
    order_index?: number;
}

// ============= Leadership API =============

export const leadershipApi = {
    // Module endpoints
    createModule: async (data: ModuleCreate): Promise<LeadershipModule> => {
        return fetchApi<LeadershipModule>('/leadership/modules', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    getModules: async (includeUnpublished: boolean = false): Promise<ModuleListResponse> => {
        return fetchApi<ModuleListResponse>(`/leadership/modules?include_unpublished=${includeUnpublished}`);
    },

    getModule: async (moduleId: string): Promise<LeadershipModule> => {
        return fetchApi<LeadershipModule>(`/leadership/modules/${moduleId}`);
    },

    updateModule: async (moduleId: string, data: ModuleUpdate): Promise<LeadershipModule> => {
        return fetchApi<LeadershipModule>(`/leadership/modules/${moduleId}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    deleteModule: async (moduleId: string): Promise<void> => {
        await fetchApi(`/leadership/modules/${moduleId}`, {
            method: 'DELETE',
        });
    },

    // Content endpoints
    addVideo: async (moduleId: string, data: VideoContentCreate): Promise<LeadershipContent> => {
        return fetchApi<LeadershipContent>(`/leadership/modules/${moduleId}/video`, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    addDocument: async (moduleId: string, file: File, title: string, description?: string, orderIndex: number = 0): Promise<LeadershipContent> => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('title', title);
        if (description) formData.append('description', description);
        formData.append('order_index', orderIndex.toString());

        const token = localStorage.getItem('access_token');
        const response = await fetch(`${API_BASE_URL}/leadership/modules/${moduleId}/document`, {
            method: 'POST',
            headers: {
                ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
            },
            body: formData,
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ detail: 'Upload failed' }));
            throw new ApiError(response.status, errorData.detail);
        }

        return response.json();
    },

    deleteContent: async (contentId: string): Promise<void> => {
        await fetchApi(`/leadership/content/${contentId}`, {
            method: 'DELETE',
        });
    },

    getDownloadUrl: (contentId: string): string => {
        return `${API_BASE_URL}/leadership/content/${contentId}/download`;
    },

    // Progress tracking
    getProgress: async (): Promise<{ completed_content_ids: string[] }> => {
        return fetchApi<{ completed_content_ids: string[] }>('/leadership/progress');
    },

    markContentComplete: async (contentId: string): Promise<{ message: string; content_id: string }> => {
        return fetchApi<{ message: string; content_id: string }>(`/leadership/content/${contentId}/complete`, {
            method: 'POST',
        });
    },

    unmarkContentComplete: async (contentId: string): Promise<{ message: string; content_id: string }> => {
        return fetchApi<{ message: string; content_id: string }>(`/leadership/content/${contentId}/complete`, {
            method: 'DELETE',
        });
    },
};

// ============= Settings API =============

export const settingsApi = {
    /**
     * Get theology school registration status
     */
    getTheologyRegistrationStatus: async (): Promise<{ isOpen: boolean }> => {
        // In a real app, this would be a backend call
        // return fetchApi<{ isOpen: boolean }>('/settings/theology-registration');

        // Mock implementation using localStorage
        if (typeof window !== 'undefined') {
            const status = localStorage.getItem('theology_registration_open');
            return { isOpen: status !== 'false' }; // Default to true
        }
        return { isOpen: true };
    },

    /**
     * Set theology school registration status
     */
    setTheologyRegistrationStatus: async (isOpen: boolean): Promise<{ success: boolean }> => {
        // In a real app, this would be a backend call
        // return fetchApi<{ success: boolean }>('/settings/theology-registration', {
        //     method: 'PUT',
        //     body: JSON.stringify({ isOpen }),
        // });

        // Mock implementation using localStorage
        if (typeof window !== 'undefined') {
            localStorage.setItem('theology_registration_open', String(isOpen));
            // Simulate network delay
            await new Promise(resolve => setTimeout(resolve, 500));
            return { success: true };
        }
        return { success: false };
    }
};

// ============= Sermon Types =============

export interface Sermon {
    id: string;
    title: string;
    description?: string;
    preacher: string;
    sermon_date: string;
    series?: string;
    video_url?: string;
    video_thumbnail?: string;
    has_audio: boolean;
    audio_filename?: string;
    audio_size?: number;
    has_document: boolean;
    document_filename?: string;
    document_url?: string;
    document_size?: number;
    has_thumbnail: boolean;
    is_featured: boolean;
    is_published: boolean;
    view_count: number;
    created_at: string;
}

export interface SermonListResponse {
    sermons: Sermon[];
    total: number;
}

export interface SermonCreateData {
    title: string;
    preacher: string;
    sermon_date: string;
    description?: string;
    series?: string;
    video_url?: string;
    document_url?: string;
    is_featured?: boolean;
    is_published?: boolean;
    audio?: File;
    document?: File;
    thumbnail?: File;
}

// ============= Sermon API =============

export const sermonApi = {
    // Public endpoint - no auth required
    getPublicSermons: async (series?: string, limit?: number, offset?: number): Promise<SermonListResponse> => {
        const params = new URLSearchParams();
        if (series) params.append('series', series);
        if (limit) params.append('limit', limit.toString());
        if (offset) params.append('offset', offset.toString());
        const queryString = params.toString();

        const response = await fetch(`${API_BASE_URL}/sermons/public${queryString ? '?' + queryString : ''}`);
        if (!response.ok) {
            throw new Error('Failed to fetch sermons');
        }
        return response.json();
    },

    // Get sermon series list
    getSeries: async (): Promise<{ series: string[] }> => {
        const response = await fetch(`${API_BASE_URL}/sermons/series`);
        if (!response.ok) {
            throw new Error('Failed to fetch series');
        }
        return response.json();
    },

    // Admin endpoints
    getAllSermons: async (includeUnpublished: boolean = true): Promise<SermonListResponse> => {
        return fetchApi<SermonListResponse>(`/sermons?include_unpublished=${includeUnpublished}`);
    },

    getSermon: async (sermonId: string): Promise<Sermon> => {
        return fetchApi<Sermon>(`/sermons/${sermonId}`);
    },

    createSermon: async (data: SermonCreateData): Promise<Sermon> => {
        const formData = new FormData();
        formData.append('title', data.title);
        formData.append('preacher', data.preacher);
        formData.append('sermon_date', data.sermon_date);
        if (data.description) formData.append('description', data.description);
        if (data.series) formData.append('series', data.series);
        if (data.video_url) formData.append('video_url', data.video_url);
        if (data.document_url) formData.append('document_url', data.document_url);
        formData.append('is_featured', String(data.is_featured || false));
        formData.append('is_published', String(data.is_published !== false));
        if (data.audio) formData.append('audio', data.audio);
        if (data.document) formData.append('document', data.document);
        if (data.thumbnail) formData.append('thumbnail', data.thumbnail);

        const token = localStorage.getItem('access_token');
        const response = await fetch(`${API_BASE_URL}/sermons/`, {
            method: 'POST',
            headers: token ? { 'Authorization': `Bearer ${token}` } : {},
            body: formData,
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ detail: 'Failed to create sermon' }));
            throw new Error(error.detail || 'Failed to create sermon');
        }
        return response.json();
    },

    updateSermon: async (sermonId: string, data: Partial<SermonCreateData> & { remove_audio?: boolean; remove_document?: boolean }): Promise<Sermon> => {
        const formData = new FormData();
        if (data.title) formData.append('title', data.title);
        if (data.preacher) formData.append('preacher', data.preacher);
        if (data.sermon_date) formData.append('sermon_date', data.sermon_date);
        if (data.description !== undefined) formData.append('description', data.description || '');
        if (data.series !== undefined) formData.append('series', data.series || '');
        if (data.video_url !== undefined) formData.append('video_url', data.video_url || '');
        if (data.document_url !== undefined) formData.append('document_url', data.document_url || '');
        if (data.is_featured !== undefined) formData.append('is_featured', String(data.is_featured));
        if (data.is_published !== undefined) formData.append('is_published', String(data.is_published));
        if (data.audio) formData.append('audio', data.audio);
        if (data.document) formData.append('document', data.document);
        if (data.thumbnail) formData.append('thumbnail', data.thumbnail);
        if (data.remove_audio) formData.append('remove_audio', 'true');
        if (data.remove_document) formData.append('remove_document', 'true');

        const token = localStorage.getItem('access_token');
        const response = await fetch(`${API_BASE_URL}/sermons/${sermonId}`, {
            method: 'PUT',
            headers: token ? { 'Authorization': `Bearer ${token}` } : {},
            body: formData,
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ detail: 'Failed to update sermon' }));
            throw new Error(error.detail || 'Failed to update sermon');
        }
        return response.json();
    },

    deleteSermon: async (sermonId: string): Promise<void> => {
        await fetchApi(`/sermons/${sermonId}`, { method: 'DELETE' });
    },

    // Admin: collapse rows that share the same (title, video_url). Returns
    // {removed, kept} so the admin sees how many duplicates were cleaned.
    dedupe: async (): Promise<{ ok: boolean; removed: number; kept: number }> =>
        fetchApi('/sermons/admin/dedupe', { method: 'POST' }),

    // Media URLs
    getAudioUrl: (sermonId: string): string => `${API_BASE_URL}/sermons/${sermonId}/audio`,
    getDocumentUrl: (sermonId: string): string => `${API_BASE_URL}/sermons/${sermonId}/document`,
    getThumbnailUrl: (sermonId: string): string => `${API_BASE_URL}/sermons/${sermonId}/thumbnail`,
};

// ============= Event Types =============

export interface Event {
    id: string;
    title: string;
    description?: string;
    event_date: string;
    start_time?: string;
    end_time?: string;
    location?: string;
    event_type: string;
    has_image: boolean;
    is_featured: boolean;
    is_published: boolean;
    registration_required: boolean;
    registration_link?: string;
    max_attendees?: number;
    registered_count: number;
    created_at: string;
}

export interface EventListResponse {
    events: Event[];
    total: number;
}

export interface EventCreateData {
    title: string;
    event_date: string;
    description?: string;
    start_time?: string;
    end_time?: string;
    location?: string;
    event_type?: string;
    is_featured?: boolean;
    is_published?: boolean;
    registration_required?: boolean;
    registration_link?: string;
    max_attendees?: number;
    image?: File;
}

// ============= Event API =============

export const eventApi = {
    getPublicEvents: async (eventType?: string): Promise<EventListResponse> => {
        const params = eventType ? `?event_type=${eventType}` : '';
        const response = await fetch(`${API_BASE_URL}/events/public${params}`);
        if (!response.ok) throw new Error('Failed to fetch events');
        return response.json();
    },

    getEventTypes: async (): Promise<{ types: string[] }> => {
        const response = await fetch(`${API_BASE_URL}/events/types`);
        if (!response.ok) throw new Error('Failed to fetch event types');
        return response.json();
    },

    getAllEvents: async (includePast: boolean = false): Promise<EventListResponse> => {
        return fetchApi<EventListResponse>(`/events?include_past=${includePast}`);
    },

    getEvent: async (eventId: string): Promise<Event> => {
        return fetchApi<Event>(`/events/${eventId}`);
    },

    // Public RSVP for guests (no login) — name + email.
    guestRsvp: async (eventId: string, data: { guest_name: string; guest_email: string; plus_ones?: number; guest_phone?: string }): Promise<{ ok: boolean; status: string; waitlisted: boolean; message: string }> => {
        const response = await fetch(`${API_BASE_URL}/events/${eventId}/rsvp/guest`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error((await response.json().catch(() => ({}))).detail || 'Could not register');
        return response.json();
    },

    // "Add to calendar" — direct link to the event's .ics file.
    calendarUrl: (eventId: string): string => `${API_BASE_URL}/events/${eventId}/calendar.ics`,

    createEvent: async (data: EventCreateData): Promise<Event> => {
        const formData = new FormData();
        formData.append('title', data.title);
        formData.append('event_date', data.event_date);
        if (data.description) formData.append('description', data.description);
        if (data.start_time) formData.append('start_time', data.start_time);
        if (data.end_time) formData.append('end_time', data.end_time);
        if (data.location) formData.append('location', data.location);
        formData.append('event_type', data.event_type || 'General');
        formData.append('is_featured', String(data.is_featured || false));
        formData.append('is_published', String(data.is_published !== false));
        formData.append('registration_required', String(data.registration_required || false));
        if (data.registration_link) formData.append('registration_link', data.registration_link);
        if (data.max_attendees) formData.append('max_attendees', String(data.max_attendees));
        if (data.image) formData.append('image', data.image);

        const token = localStorage.getItem('access_token');
        const response = await fetch(`${API_BASE_URL}/events/`, {
            method: 'POST',
            headers: token ? { 'Authorization': `Bearer ${token}` } : {},
            body: formData,
        });
        if (!response.ok) {
            const error = await response.json().catch(() => ({ detail: 'Failed to create event' }));
            throw new Error(error.detail);
        }
        return response.json();
    },

    updateEvent: async (eventId: string, data: Partial<EventCreateData>): Promise<Event> => {
        const formData = new FormData();
        if (data.title) formData.append('title', data.title);
        if (data.event_date) formData.append('event_date', data.event_date);
        if (data.description !== undefined) formData.append('description', data.description || '');
        if (data.start_time !== undefined) formData.append('start_time', data.start_time || '');
        if (data.end_time !== undefined) formData.append('end_time', data.end_time || '');
        if (data.location !== undefined) formData.append('location', data.location || '');
        if (data.event_type !== undefined) formData.append('event_type', data.event_type);
        if (data.is_featured !== undefined) formData.append('is_featured', String(data.is_featured));
        if (data.is_published !== undefined) formData.append('is_published', String(data.is_published));
        if (data.registration_required !== undefined) formData.append('registration_required', String(data.registration_required));
        if (data.registration_link !== undefined) formData.append('registration_link', data.registration_link || '');
        if (data.max_attendees !== undefined) formData.append('max_attendees', String(data.max_attendees || ''));
        if (data.image) formData.append('image', data.image);

        const token = localStorage.getItem('access_token');
        const response = await fetch(`${API_BASE_URL}/events/${eventId}`, {
            method: 'PUT',
            headers: token ? { 'Authorization': `Bearer ${token}` } : {},
            body: formData,
        });
        if (!response.ok) {
            const error = await response.json().catch(() => ({ detail: 'Failed to update event' }));
            throw new Error(error.detail);
        }
        return response.json();
    },

    deleteEvent: async (eventId: string): Promise<void> => {
        await fetchApi(`/events/${eventId}`, { method: 'DELETE' });
    },

    getImageUrl: (eventId: string): string => `${API_BASE_URL}/events/${eventId}/image`,
};

// ============= Dashboard Types =============

export interface DashboardStats {
    total_sermons: number;
    sermons_this_month: number;
    total_events: number;
    upcoming_events: number;
    next_event_title?: string;
    next_event_date?: string;
    total_users: number;
    active_users: number;
    new_users_this_month: number;
    pending_requests: number;
    total_announcements: number;
}

export interface RecentActivity {
    type: string;
    title: string;
    description: string;
    timestamp: string;
}

export interface AdminUser {
    id: string;
    name: string;
    email: string;
    phone?: string | null;
    status: string;
    role: string;
    created_at: string;
    services: string[];
    country_code?: string | null;
    country_name?: string | null;
    continent?: string | null;
}

export interface DashboardUserUpdate {
    name?: string;
    email?: string;
    role?: string;
    status?: string;
    services?: string[];
}

// ============= Dashboard API =============

export const dashboardApi = {
    getStats: async (): Promise<DashboardStats> => {
        return fetchApi<DashboardStats>('/dashboard/stats');
    },

    getRecentActivity: async (limit: number = 10): Promise<{ activities: RecentActivity[] }> => {
        return fetchApi<{ activities: RecentActivity[] }>(`/dashboard/recent-activity?limit=${limit}`);
    },

    getUsers: async (statusFilter?: string, limit?: number, offset?: number): Promise<{ users: AdminUser[]; total: number }> => {
        const params = new URLSearchParams();
        if (statusFilter) params.append('status_filter', statusFilter);
        if (limit) params.append('limit', String(limit));
        if (offset) params.append('offset', String(offset));
        return fetchApi<{ users: AdminUser[]; total: number }>(`/dashboard/users?${params.toString()}`);
    },

    updateUser: async (userId: string, data: DashboardUserUpdate): Promise<AdminUser> => {
        return fetchApi<AdminUser>(`/dashboard/users/${userId}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    deleteUser: async (userId: string): Promise<MessageResponse> => {
        return fetchApi<MessageResponse>(`/dashboard/users/${userId}`, {
            method: 'DELETE',
        });
    },
};

// ============= Skills Types =============

export interface Course {
    id: string;
    title: string;
    description?: string;
    thumbnail?: string;
    instructor?: string;
    is_published: boolean;
    created_at: string;
    is_enrolled?: boolean;
    progress_percent?: number;
    modules?: CourseModule[];
}

export interface CourseModule {
    id: string;
    title: string;
    order_index: number;
    lessons: Lesson[];
    quizzes: Quiz[];
}

export interface Lesson {
    id: string;
    title: string;
    content_type: 'video' | 'text' | 'mixed';
    content_url?: string;
    video_urls?: string[];
    images?: string[];
    text_content?: string;
    duration?: number;
    order_index: number;
    is_completed?: boolean;
}

export interface Quiz {
    id: string;
    title: string;
    pass_score: number;
    questions?: QuizQuestion[];
}

export interface QuizQuestion {
    id?: string;
    question_text: string;
    options: string[];
    correct_option_index: number;
}

export interface CourseCreate {
    title: string;
    description?: string;
    instructor?: string;
    is_published?: boolean;
}

export interface ModuleCreate {
    title: string;
    order_index?: number;
}

export interface LessonCreate {
    title: string;
    content_type?: 'video' | 'text' | 'mixed';
    content_url?: string;
    video_urls?: string[];
    images?: string[];
    text_content?: string;
    duration?: number;
    order_index?: number;
}

export interface QuizCreate {
    title: string;
    pass_score?: number;
    questions: QuizQuestion[];
}

// ============= Skills API =============

export const skillsApi = {
    // Public/User endpoints
    getCourses: async (): Promise<Course[]> => {
        return fetchApi<Course[]>('/skills/courses');
    },

    getCourse: async (id: string): Promise<Course> => {
        return fetchApi<Course>(`/skills/courses/${id}`);
    },

    enroll: async (id: string): Promise<{ message: string }> => {
        return fetchApi<{ message: string }>(`/skills/courses/${id}/enroll`, {
            method: 'POST',
        });
    },

    completeLesson: async (lessonId: string): Promise<{ message: string }> => {
        return fetchApi<{ message: string }>(`/skills/lessons/${lessonId}/complete`, {
            method: 'POST',
        });
    },

    submitQuiz: async (quizId: string, answers: number[]): Promise<{ passed: boolean; score: number }> => {
        return fetchApi<{ passed: boolean; score: number }>(`/skills/quizzes/${quizId}/submit`, {
            method: 'POST',
            body: JSON.stringify({ answers }),
        });
    },

    // Admin endpoints
    createCourse: async (data: CourseCreate): Promise<Course> => {
        return fetchApi<Course>('/skills/courses', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    createModule: async (courseId: string, data: ModuleCreate): Promise<CourseModule> => {
        return fetchApi<CourseModule>(`/skills/courses/${courseId}/modules`, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    createLesson: async (moduleId: string, data: LessonCreate): Promise<Lesson> => {
        return fetchApi<Lesson>(`/skills/modules/${moduleId}/lessons`, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    updateLesson: async (id: string, data: LessonCreate): Promise<Lesson> => {
        return fetchApi<Lesson>(`/skills/lessons/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    deleteLesson: async (id: string): Promise<void> => {
        await fetchApi<void>(`/skills/lessons/${id}`, {
            method: 'DELETE',
        });
    },

    updateCourse: async (id: string, data: Partial<CourseCreate>): Promise<Course> => {
        return fetchApi<Course>(`/skills/courses/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    createQuiz: async (moduleId: string, data: QuizCreate): Promise<Quiz> => {
        return fetchApi<Quiz>(`/skills/modules/${moduleId}/quizzes`, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },
};

// ============= Career Guidance Types =============

export interface CareerModule {
    id: string;
    title: string;
    description?: string;
    icon?: string;
    order_index: number;
    is_published: boolean;
    created_at: string;
    updated_at: string;
    resources?: CareerResource[];
    tasks?: CareerTask[];
    progress_percent?: number;
}

export interface CareerResource {
    id: string;
    module_id: string;
    title: string;
    description?: string;
    resource_type: 'pdf' | 'video' | 'article' | 'link';
    file_url?: string;
    video_url?: string;
    article_content?: string;
    external_link?: string;
    order_index: number;
    created_at: string;
}

export interface CareerTask {
    id: string;
    module_id: string;
    title: string;
    description?: string;
    order_index: number;
    created_at: string;
    is_completed?: boolean;
}

export interface CareerSession {
    id: string;
    user_id: string;
    title: string;
    description?: string;
    session_date: string;
    duration_minutes: number;
    meeting_link?: string;
    status: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled';
    notes?: string;
    created_at: string;
    user_name?: string;
}

export interface UserCareerDashboard {
    current_focus?: string;
    next_session?: CareerSession;
    overall_progress: number;
    modules: CareerModule[];
    pending_tasks: CareerTask[];
}

export interface CareerModuleCreate {
    title: string;
    description?: string;
    icon?: string;
    order_index?: number;
    is_published?: boolean;
}

export interface CareerResourceCreate {
    title: string;
    description?: string;
    resource_type: 'pdf' | 'video' | 'article' | 'link';
    file_url?: string;
    video_url?: string;
    article_content?: string;
    external_link?: string;
    order_index?: number;
}

export interface CareerTaskCreate {
    title: string;
    description?: string;
    order_index?: number;
}

export interface CareerSessionCreate {
    user_id: string;
    title: string;
    description?: string;
    session_date: string;
    duration_minutes?: number;
    meeting_link?: string;
    status?: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled';
    notes?: string;
}

// ============= Career Guidance API =============

export const careerApi = {
    // User endpoints
    getDashboard: async (): Promise<UserCareerDashboard> => {
        return fetchApi<UserCareerDashboard>('/career/dashboard');
    },

    getModules: async (): Promise<CareerModule[]> => {
        return fetchApi<CareerModule[]>('/career/modules');
    },

    getModule: async (id: string): Promise<CareerModule> => {
        return fetchApi<CareerModule>(`/career/modules/${id}`);
    },

    completeTask: async (taskId: string): Promise<{ message: string }> => {
        return fetchApi<{ message: string }>(`/career/tasks/${taskId}/complete`, {
            method: 'POST',
        });
    },

    getSessions: async (): Promise<CareerSession[]> => {
        return fetchApi<CareerSession[]>('/career/sessions');
    },

    // Admin endpoints
    admin: {
        getModules: async (): Promise<CareerModule[]> => {
            return fetchApi<CareerModule[]>('/career/admin/modules');
        },

        getModule: async (id: string): Promise<CareerModule> => {
            return fetchApi<CareerModule>(`/career/admin/modules/${id}`);
        },

        createModule: async (data: CareerModuleCreate): Promise<CareerModule> => {
            return fetchApi<CareerModule>('/career/admin/modules', {
                method: 'POST',
                body: JSON.stringify(data),
            });
        },

        updateModule: async (id: string, data: Partial<CareerModuleCreate>): Promise<CareerModule> => {
            return fetchApi<CareerModule>(`/career/admin/modules/${id}`, {
                method: 'PATCH',
                body: JSON.stringify(data),
            });
        },

        deleteModule: async (id: string): Promise<{ message: string }> => {
            return fetchApi<{ message: string }>(`/career/admin/modules/${id}`, {
                method: 'DELETE',
            });
        },

        createResource: async (moduleId: string, data: CareerResourceCreate): Promise<CareerResource> => {
            return fetchApi<CareerResource>(`/career/admin/modules/${moduleId}/resources`, {
                method: 'POST',
                body: JSON.stringify(data),
            });
        },

        deleteResource: async (id: string): Promise<{ message: string }> => {
            return fetchApi<{ message: string }>(`/career/admin/resources/${id}`, {
                method: 'DELETE',
            });
        },

        createTask: async (moduleId: string, data: CareerTaskCreate): Promise<CareerTask> => {
            return fetchApi<CareerTask>(`/career/admin/modules/${moduleId}/tasks`, {
                method: 'POST',
                body: JSON.stringify(data),
            });
        },

        deleteTask: async (id: string): Promise<{ message: string }> => {
            return fetchApi<{ message: string }>(`/career/admin/tasks/${id}`, {
                method: 'DELETE',
            });
        },

        getSessions: async (): Promise<CareerSession[]> => {
            return fetchApi<CareerSession[]>('/career/admin/sessions');
        },

        createSession: async (data: CareerSessionCreate): Promise<CareerSession> => {
            return fetchApi<CareerSession>('/career/admin/sessions', {
                method: 'POST',
                body: JSON.stringify(data),
            });
        },

        updateSession: async (id: string, data: Partial<CareerSessionCreate>): Promise<CareerSession> => {
            return fetchApi<CareerSession>(`/career/admin/sessions/${id}`, {
                method: 'PATCH',
                body: JSON.stringify(data),
            });
        },

        deleteSession: async (id: string): Promise<{ message: string }> => {
            return fetchApi<{ message: string }>(`/career/admin/sessions/${id}`, {
                method: 'DELETE',
            });
        },
    },
};


// ============= Prayer Types =============

export interface PrayerCategory {
    id: string;
    title: string;
    description?: string;
    icon?: string;
    order_index: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface PrayerSchedule {
    id: string;
    program_name: string;
    time_description: string;
    description?: string;
    icon?: string;
    meeting_link?: string;
    order_index: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface PrayerStat {
    id: string;
    label: string;
    value: string;
    order_index: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface PrayerRequest {
    id: string;
    user_id: string;
    title: string;
    description: string;
    category?: string;
    is_anonymous: boolean;
    is_public: boolean;
    status: 'pending' | 'praying' | 'answered' | 'archived';
    prayer_count: number;
    testimony?: string;
    created_at: string;
    updated_at: string;
}

export interface PrayerPageSettings {
    id: string;
    // Hero
    hero_eyebrow?: string;
    hero_title: string;
    hero_subtitle: string;
    hero_description: string;
    hero_image_url?: string;
    primary_cta_text?: string;
    primary_cta_link?: string;
    secondary_cta_text?: string;
    secondary_cta_link?: string;
    // Stats
    stats_eyebrow?: string;
    stats_heading?: string;
    stats_subtitle?: string;
    // Categories
    categories_eyebrow?: string;
    categories_heading?: string;
    categories_subtitle?: string;
    // Schedules
    schedules_eyebrow?: string;
    schedules_heading?: string;
    schedules_subtitle?: string;
    // Manifesto (NEW)
    manifesto_eyebrow?: string;
    manifesto_heading?: string;
    manifesto_subtitle?: string;
    manifesto_pillars?: Array<{ icon?: string; title: string; description: string }>;
    // How To Pray (NEW)
    how_eyebrow?: string;
    how_heading?: string;
    how_subtitle?: string;
    how_steps?: Array<{ number?: string; title: string; description?: string; link?: string; link_text?: string }>;
    // Answered Prayers (NEW)
    answered_eyebrow?: string;
    answered_heading?: string;
    answered_subtitle?: string;
    answered_max_items?: number;
    // Prayer Wall preview (NEW)
    wall_eyebrow?: string;
    wall_heading?: string;
    wall_subtitle?: string;
    wall_link?: string;
    wall_link_text?: string;
    wall_max_items?: number;
    // Final CTA
    final_eyebrow?: string;
    final_heading?: string;
    scripture_text: string;
    scripture_reference: string;
    call_to_action_text: string;
    live_prayer_link?: string;
    updated_at: string;
}

export interface PublicAnsweredPrayer {
    id: string;
    title: string;
    description: string;
    testimony: string;
    category?: string;
    author_name: string;
    created_at: string;
}

export interface PublicWallRequest {
    id: string;
    title: string;
    description: string;
    category?: string;
    author_name: string;
    prayer_count: number;
    created_at: string;
}

export interface PrayerPageData {
    settings: PrayerPageSettings;
    categories: PrayerCategory[];
    schedules: PrayerSchedule[];
    stats: PrayerStat[];
    answered_prayers?: PublicAnsweredPrayer[];
    wall_preview?: PublicWallRequest[];
}

export interface PrayerCategoryCreate {
    title: string;
    description?: string;
    icon?: string;
    order_index?: number;
    is_active?: boolean;
}

export interface PrayerScheduleCreate {
    program_name: string;
    time_description: string;
    description?: string;
    icon?: string;
    meeting_link?: string;
    order_index?: number;
    is_active?: boolean;
}

export interface PrayerStatCreate {
    label: string;
    value: string;
    order_index?: number;
    is_active?: boolean;
}

export interface PrayerRequestCreate {
    title: string;
    description: string;
    category?: string;
    is_anonymous?: boolean;
    is_public?: boolean;
}

export interface PrayerPageSettingsUpdate {
    hero_title?: string;
    hero_subtitle?: string;
    hero_description?: string;
    hero_image_url?: string;
    scripture_text?: string;
    scripture_reference?: string;
    call_to_action_text?: string;
    live_prayer_link?: string;
}

// ============================================================================
// ALTER SOUND TYPES
// ============================================================================

export interface AudioCategory {
    id: string;
    name: string;
    description?: string;
    icon?: string;
    order_index: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface AudioCategoryCreate {
    name: string;
    description?: string;
    icon?: string;
    order_index?: number;
    is_active?: boolean;
}

export interface AudioTrack {
    id: string;
    category_id: string;
    title: string;
    description?: string;
    artist?: string;
    duration?: string;
    audio_url?: string;
    cover_url?: string;
    play_count: number;
    is_featured: boolean;
    is_active: boolean;
    order_index: number;
    created_at: string;
    updated_at: string;
    category: AudioCategory;
}

export interface AudioTrackCreate {
    category_id: string;
    title: string;
    description?: string;
    artist?: string;
    duration?: string;
    is_featured?: boolean;
    is_active?: boolean;
    order_index?: number;
}

export interface AlterSoundPageSettings {
    id: string;
    hero_title: string;
    hero_subtitle: string;
    hero_description: string;
    hero_background_url?: string;
    featured_section_title: string;
    categories_section_title: string;
    cta_text?: string;
    cta_button_text?: string;
    cta_button_link?: string;
    created_at: string;
    updated_at: string;
}

export interface AlterSoundPageSettingsUpdate {
    hero_title?: string;
    hero_subtitle?: string;
    hero_description?: string;
    hero_background_url?: string;
    featured_section_title?: string;
    categories_section_title?: string;
    cta_text?: string;
    cta_button_text?: string;
    cta_button_link?: string;
}

export interface AlterSoundPageData {
    settings: AlterSoundPageSettings;
    featured_tracks: AudioTrack[];
    categories: AudioCategory[];
    all_tracks: AudioTrack[];
}

// ============= Prayer API =============

export const prayerApi = {
    // User endpoints
    getPageData: async (): Promise<PrayerPageData> => {
        return fetchApi<PrayerPageData>('/prayer/page-data');
    },

    getMyRequests: async (statusFilter?: string): Promise<PrayerRequest[]> => {
        const params = statusFilter ? `?status_filter=${statusFilter}` : '';
        return fetchApi<PrayerRequest[]>(`/prayer/requests${params}`);
    },

    createRequest: async (data: PrayerRequestCreate): Promise<PrayerRequest> => {
        return fetchApi<PrayerRequest>('/prayer/requests', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    prayForRequest: async (requestId: string): Promise<{ message: string }> => {
        return fetchApi<{ message: string }>(`/prayer/requests/${requestId}/pray`, {
            method: 'POST',
        });
    },

    // Admin endpoints
    admin: {
        // Categories
        getCategories: async (): Promise<PrayerCategory[]> => {
            return fetchApi<PrayerCategory[]>('/prayer/admin/categories');
        },

        createCategory: async (data: PrayerCategoryCreate): Promise<PrayerCategory> => {
            return fetchApi<PrayerCategory>('/prayer/admin/categories', {
                method: 'POST',
                body: JSON.stringify(data),
            });
        },

        updateCategory: async (id: string, data: Partial<PrayerCategoryCreate>): Promise<PrayerCategory> => {
            return fetchApi<PrayerCategory>(`/prayer/admin/categories/${id}`, {
                method: 'PATCH',
                body: JSON.stringify(data),
            });
        },


        deleteCategory: async (id: string): Promise<void> => {
            return fetchApi<void>(`/prayer/admin/categories/${id}`, {
                method: 'DELETE',
            });
        },

        // Schedules
        getSchedules: async (): Promise<PrayerSchedule[]> => {
            return fetchApi<PrayerSchedule[]>('/prayer/admin/schedules');
        },

        createSchedule: async (data: PrayerScheduleCreate): Promise<PrayerSchedule> => {
            return fetchApi<PrayerSchedule>('/prayer/admin/schedules', {
                method: 'POST',
                body: JSON.stringify(data),
            });
        },

        updateSchedule: async (id: string, data: Partial<PrayerScheduleCreate>): Promise<PrayerSchedule> => {
            return fetchApi<PrayerSchedule>(`/prayer/admin/schedules/${id}`, {
                method: 'PATCH',
                body: JSON.stringify(data),
            });
        },

        deleteSchedule: async (id: string): Promise<void> => {
            return fetchApi<void>(`/prayer/admin/schedules/${id}`, {
                method: 'DELETE',
            });
        },

        // Stats
        getStats: async (): Promise<PrayerStat[]> => {
            return fetchApi<PrayerStat[]>('/prayer/admin/stats');
        },

        createStat: async (data: PrayerStatCreate): Promise<PrayerStat> => {
            return fetchApi<PrayerStat>('/prayer/admin/stats', {
                method: 'POST',
                body: JSON.stringify(data),
            });
        },

        updateStat: async (id: string, data: Partial<PrayerStatCreate>): Promise<PrayerStat> => {
            return fetchApi<PrayerStat>(`/prayer/admin/stats/${id}`, {
                method: 'PATCH',
                body: JSON.stringify(data),
            });
        },

        deleteStat: async (id: string): Promise<void> => {
            return fetchApi<void>(`/prayer/admin/stats/${id}`, {
                method: 'DELETE',
            });
        },

        // Settings
        getSettings: async (): Promise<PrayerPageSettings> => {
            return fetchApi<PrayerPageSettings>('/prayer/admin/settings');
        },

        updateSettings: async (data: PrayerPageSettingsUpdate): Promise<PrayerPageSettings> => {
            return fetchApi<PrayerPageSettings>('/prayer/admin/settings', {
                method: 'PATCH',
                body: JSON.stringify(data),
            });
        },

        // Prayer Requests
        getAllRequests: async (statusFilter?: string): Promise<PrayerRequest[]> => {
            const params = statusFilter ? `?status_filter=${statusFilter}` : '';
            return fetchApi<PrayerRequest[]>(`/prayer/admin/requests${params}`);
        },

        updateRequest: async (id: string, data: Partial<PrayerRequest>): Promise<PrayerRequest> => {
            return fetchApi<PrayerRequest>(`/prayer/admin/requests/${id}`, {
                method: 'PATCH',
                body: JSON.stringify(data),
            });
        },
    },
};

// ============================================================================
// ALTER SOUND API
// ============================================================================

export const alterSoundApi = {
    // User endpoints
    getPageData: async (): Promise<AlterSoundPageData> => {
        return fetchApi<AlterSoundPageData>('/alter-sound/page-data');
    },

    incrementPlayCount: async (trackId: string): Promise<{ message: string; play_count: number }> => {
        return fetchApi<{ message: string; play_count: number }>(`/alter-sound/tracks/${trackId}/play`, {
            method: 'POST',
        });
    },

    // Admin - Categories
    getAllCategories: async (): Promise<AudioCategory[]> => {
        return fetchApi<AudioCategory[]>('/alter-sound/admin/categories');
    },

    createCategory: async (data: AudioCategoryCreate): Promise<AudioCategory> => {
        return fetchApi<AudioCategory>('/alter-sound/admin/categories', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    updateCategory: async (id: string, data: Partial<AudioCategoryCreate>): Promise<AudioCategory> => {
        return fetchApi<AudioCategory>(`/alter-sound/admin/categories/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    deleteCategory: async (id: string): Promise<void> => {
        return fetchApi<void>(`/alter-sound/admin/categories/${id}`, {
            method: 'DELETE',
        });
    },

    // Admin - Tracks
    getAllTracks: async (categoryId?: string): Promise<AudioTrack[]> => {
        const params = categoryId ? `?category_id=${categoryId}` : '';
        return fetchApi<AudioTrack[]>(`/alter-sound/admin/tracks${params}`);
    },

    createTrack: async (data: AudioTrackCreate & { audioFile: File; coverFile?: File }): Promise<AudioTrack> => {
        const formData = new FormData();
        formData.append('category_id', data.category_id);
        formData.append('title', data.title);
        if (data.description) formData.append('description', data.description);
        if (data.artist) formData.append('artist', data.artist);
        if (data.duration) formData.append('duration', data.duration);
        formData.append('is_featured', String(data.is_featured));
        formData.append('is_active', String(data.is_active));
        formData.append('order_index', String(data.order_index));
        formData.append('audio', data.audioFile);
        if (data.coverFile) formData.append('cover', data.coverFile);

        const token = localStorage.getItem('access_token');
        const response = await fetch(`${API_BASE_URL}/alter-sound/admin/tracks`, {
            method: 'POST',
            headers: token ? { 'Authorization': `Bearer ${token}` } : {},
            body: formData,
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ detail: 'Failed to create track' }));
            throw new Error(error.detail || 'Failed to create track');
        }

        return response.json();
    },

    updateTrack: async (id: string, data: Partial<AudioTrackCreate> & { audioFile?: File; coverFile?: File }): Promise<AudioTrack> => {
        // Always send FormData — backend update_track only accepts Form parameters
        const fd = new FormData();
        if (data.category_id) fd.append('category_id', data.category_id);
        if (data.title) fd.append('title', data.title);
        if (data.description !== undefined) fd.append('description', data.description || '');
        if (data.artist !== undefined) fd.append('artist', data.artist || '');
        if (data.duration !== undefined) fd.append('duration', data.duration || '');
        if (data.is_featured !== undefined) fd.append('is_featured', String(data.is_featured));
        if (data.is_active !== undefined) fd.append('is_active', String(data.is_active));
        if (data.order_index !== undefined) fd.append('order_index', String(data.order_index));
        if (data.audioFile) fd.append('audio', data.audioFile);
        if (data.coverFile) fd.append('cover', data.coverFile);

        const token = localStorage.getItem('access_token');
        const response = await fetch(`${API_BASE_URL}/alter-sound/admin/tracks/${id}`, {
            method: 'PUT',
            headers: token ? { 'Authorization': `Bearer ${token}` } : {},
            body: fd,
        });
        if (!response.ok) {
            const error = await response.json().catch(() => ({ detail: 'Failed to update track' }));
            throw new Error(error.detail || 'Failed to update track');
        }
        return response.json();
    },

    deleteTrack: async (id: string): Promise<void> => {
        return fetchApi<void>(`/alter-sound/admin/tracks/${id}`, {
            method: 'DELETE',
        });
    },

    // Media URLs
    getAudioUrl: (trackId: string): string => `${API_BASE_URL}/alter-sound/tracks/${trackId}/audio`,
    getCoverUrl: (trackId: string): string => `${API_BASE_URL}/alter-sound/tracks/${trackId}/cover`,

    // Admin - Settings
    getSettings: async (): Promise<AlterSoundPageSettings> => {
        return fetchApi<AlterSoundPageSettings>('/alter-sound/admin/settings');
    },

    updateSettings: async (data: AlterSoundPageSettingsUpdate): Promise<AlterSoundPageSettings> => {
        return fetchApi<AlterSoundPageSettings>('/alter-sound/admin/settings', {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },
};

// ============================================================================
// BIBLE STUDY API
// ============================================================================

export enum ReadingPlanType {
    WEEKLY = "weekly",
    MONTHLY = "monthly",
    YEARLY = "yearly",
    CUSTOM = "custom"
}

export enum ReadingStatus {
    NOT_STARTED = "not_started",
    IN_PROGRESS = "in_progress",
    COMPLETED = "completed"
}

export interface BibleReadingPlan {
    id: string;
    title: string;
    description?: string;
    plan_type: ReadingPlanType;
    duration_days: number;
    target_audience?: string;
    is_featured: boolean;
    is_active: boolean;
    order_index: number;
    created_at: string;
    updated_at: string;
}

export interface DailyReading {
    id: string;
    plan_id: string;
    day_number: number;
    title: string;
    scripture_reference: string;
    reflection?: string;
    key_verse?: string;
    created_at: string;
    updated_at: string;
}

export interface UserReadingProgress {
    id: string;
    user_id: string;
    plan_id: string;
    start_date: string;
    current_day: number;
    completed_days: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface UserDailyReading {
    id: string;
    progress_id: string;
    daily_reading_id: string;
    status: ReadingStatus;
    completed_at?: string;
    notes?: string;
    created_at: string;
    updated_at: string;
}

export interface BibleStudyResource {
    id: string;
    title: string;
    description?: string;
    resource_type: string;
    resource_url?: string;
    category?: string;
    is_featured: boolean;
    is_active: boolean;
    order_index: number;
    created_at: string;
    updated_at: string;
}

export interface BibleStudyTopicResource {
    title: string;
    url: string;
    type: 'pdf' | 'video' | 'audio' | 'link' | 'doc';
}

export interface BibleStudyDownloadableResource {
    id: string;
    title: string;
    description?: string;
    type: 'pdf' | 'video' | 'audio' | 'doc';
    download_url: string;
    cover_image?: string;
    duration?: string;        // "24 pages" or "38 min"
    category?: string;        // "Study Guide", "Teaching", "Tools", etc.
    is_featured?: boolean;
    order_index?: number;
    created_at?: string;
}

export interface BibleStudyQuizQuestion {
    q: string;
    options: string[];     // typically 4 options
    answer: number;        // 0-indexed
    explanation?: string;  // optional teaching after answer reveal
}

export interface BibleStudyImpactStat {
    label: string;
    value: string;
    icon?: string;
}

export interface BibleStudyWeeklyTopic {
    id: number;
    week: string;
    title: string;
    verse: string;
    category: string;
    color: string;
    time?: string;
    study_focus?: string;          // admin-written focus paragraph
    video_url?: string;            // "Watch Recording" link
    notes_url?: string;            // "Study Notes" PDF/doc link
    discussion_questions?: string[];
    resources?: BibleStudyTopicResource[]; // extra downloads/links per week
    quiz?: BibleStudyQuizQuestion[]; // admin-controlled quiz (overrides built-in)
}

export interface BibleStudyGroupResource {
    title: string;
    url: string;
    type: 'pdf' | 'audio' | 'video' | 'link' | 'doc';
    meta?: string;
}

export interface BibleStudyGroup {
    id: string;
    name: string;
    leader: string;
    time: string;
    size: number;
    level: string;
    is_open: boolean;
    contact?: string;
    description?: string;
    resources?: BibleStudyGroupResource[];
}

export interface BibleStudySessionNote {
    id: string;
    title: string;
    body: string;
    date: string;
    urgent: boolean;
}

export interface BibleStudyLibraryResource {
    id: string;
    title: string;
    type: 'pdf' | 'video' | 'audio';
    url: string;          // direct download/watch/listen link (no sign-in)
    meta?: string;        // "24 pages" or "38 min"
}

export interface BibleStudyTool {
    id: string;
    name: string;
    desc: string;
    tag: string;          // "Free" | "Paid"
    href: string;
}

export interface BibleStudyPodcast {
    id: string;
    name: string;
    host: string;
    topic: string;
    url?: string;
}

export interface BibleStudyMentor {
    id: string;
    name: string;
    title: string;          // e.g. "Pastor", "Bible Study Leader"
    bio: string;
    focus: string;          // areas they mentor in
    availability: string;   // e.g. "Weekday evenings"
    photo?: string;         // optional avatar URL
    contact?: string;       // optional contact detail shown to coordinator
    is_available: boolean;  // accepting new mentees
    user_id?: string;       // linked registered user (when assigned from users)
}

export interface BibleStudyPageSettings {
    id: string;
    hero_title: string;
    hero_subtitle: string;
    hero_description: string;
    hero_background_url?: string;
    year_label: string;
    weekly_topics?: BibleStudyWeeklyTopic[];
    study_groups?: BibleStudyGroup[];
    session_notes?: BibleStudySessionNote[];
    library_resources?: BibleStudyLibraryResource[];
    study_tools?: BibleStudyTool[];
    podcasts?: BibleStudyPodcast[];
    resources_heading?: string;
    resources_subtitle?: string;
    mentors?: BibleStudyMentor[];
    impact_stats?: BibleStudyImpactStat[];
    created_at: string;
    updated_at: string;
}

export interface BibleStudyPageData {
    settings: BibleStudyPageSettings;
    featured_plans: BibleReadingPlan[];
    all_plans: BibleReadingPlan[];
    featured_resources: BibleStudyResource[];
}

export interface BibleReadingPlanWithReadings extends BibleReadingPlan {
    readings: DailyReading[];
}

export interface UserProgressWithDetails extends UserReadingProgress {
    plan: BibleReadingPlanWithReadings;
    daily_readings: UserDailyReading[];
}

export interface BibleReadingPlanCreate {
    title: string;
    description?: string;
    plan_type: ReadingPlanType;
    duration_days: number;
    target_audience?: string;
    is_featured?: boolean;
    is_active?: boolean;
    order_index?: number;
}

export interface DailyReadingCreate {
    plan_id: string;
    day_number: number;
    title: string;
    scripture_reference: string;
    reflection?: string;
    key_verse?: string;
}

export interface BibleStudyResourceCreate {
    title: string;
    description?: string;
    resource_type: string;
    resource_url?: string;
    category?: string;
    is_featured?: boolean;
    is_active?: boolean;
    order_index?: number;
}

export interface BibleStudyPageSettingsUpdate {
    hero_title?: string;
    hero_subtitle?: string;
    hero_description?: string;
    hero_background_url?: string;
    year_label?: string;
    weekly_topics?: BibleStudyWeeklyTopic[];
    study_groups?: BibleStudyGroup[];
    session_notes?: BibleStudySessionNote[];
    library_resources?: BibleStudyLibraryResource[];
    study_tools?: BibleStudyTool[];
    podcasts?: BibleStudyPodcast[];
    resources_heading?: string;
    resources_subtitle?: string;
    mentors?: BibleStudyMentor[];
    impact_stats?: BibleStudyImpactStat[];
}

export interface WeekReflection {
    id: string;
    week_number: number;
    key_verse: string;
    verse_ref: string;
    reflection: string;
    created_at: string;
    updated_at: string;
}

export interface QuarterlyTheme {
    id: string;
    quarter_number: number;
    title: string;
    theme: string;
    scripture: string;
    description?: string;
    accent_color: string;
    week_start: number;
    week_end: number;
    created_at: string;
    updated_at: string;
}

export const bibleStudyApi = {
    // User endpoints
    getPageData: async (): Promise<BibleStudyPageData> => {
        return fetchApi<BibleStudyPageData>('/bible-study/page-data');
    },

    getPlanWithReadings: async (planId: string): Promise<BibleReadingPlanWithReadings> => {
        return fetchApi<BibleReadingPlanWithReadings>(`/bible-study/plans/${planId}`);
    },

    startPlan: async (planId: string, startDate: string): Promise<UserReadingProgress> => {
        return fetchApi<UserReadingProgress>('/bible-study/progress/start', {
            method: 'POST',
            body: JSON.stringify({ plan_id: planId, start_date: startDate }),
        });
    },

    getMyProgress: async (): Promise<UserProgressWithDetails[]> => {
        return fetchApi<UserProgressWithDetails[]>('/bible-study/progress/my-progress');
    },

    updateDailyReading: async (
        progressId: string,
        readingId: string,
        status: ReadingStatus,
        notes?: string
    ): Promise<UserDailyReading> => {
        return fetchApi<UserDailyReading>(
            `/bible-study/progress/${progressId}/reading/${readingId}`,
            {
                method: 'PUT',
                body: JSON.stringify({ status, notes }),
            }
        );
    },

    getResources: async (category?: string): Promise<BibleStudyResource[]> => {
        const params = category ? `?category=${category}` : '';
        return fetchApi<BibleStudyResource[]>(`/bible-study/resources${params}`);
    },

    // Admin - Plans
    getAllPlans: async (): Promise<BibleReadingPlan[]> => {
        return fetchApi<BibleReadingPlan[]>('/bible-study/admin/plans');
    },

    createPlan: async (data: BibleReadingPlanCreate): Promise<BibleReadingPlan> => {
        return fetchApi<BibleReadingPlan>('/bible-study/admin/plans', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    updatePlan: async (id: string, data: Partial<BibleReadingPlanCreate>): Promise<BibleReadingPlan> => {
        return fetchApi<BibleReadingPlan>(`/bible-study/admin/plans/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    deletePlan: async (id: string): Promise<void> => {
        return fetchApi<void>(`/bible-study/admin/plans/${id}`, {
            method: 'DELETE',
        });
    },

    // Admin - Readings
    getPlanReadings: async (planId: string): Promise<DailyReading[]> => {
        return fetchApi<DailyReading[]>(`/bible-study/admin/plans/${planId}/readings`);
    },

    createReading: async (data: DailyReadingCreate): Promise<DailyReading> => {
        return fetchApi<DailyReading>('/bible-study/admin/readings', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    updateReading: async (id: string, data: Partial<DailyReadingCreate>): Promise<DailyReading> => {
        return fetchApi<DailyReading>(`/bible-study/admin/readings/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    deleteReading: async (id: string): Promise<void> => {
        return fetchApi<void>(`/bible-study/admin/readings/${id}`, {
            method: 'DELETE',
        });
    },

    // Admin - Resources
    getAllResources: async (): Promise<BibleStudyResource[]> => {
        return fetchApi<BibleStudyResource[]>('/bible-study/admin/resources');
    },

    createResource: async (data: BibleStudyResourceCreate): Promise<BibleStudyResource> => {
        return fetchApi<BibleStudyResource>('/bible-study/admin/resources', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    updateResource: async (id: string, data: Partial<BibleStudyResourceCreate>): Promise<BibleStudyResource> => {
        return fetchApi<BibleStudyResource>(`/bible-study/admin/resources/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    deleteResource: async (id: string): Promise<void> => {
        return fetchApi<void>(`/bible-study/admin/resources/${id}`, {
            method: 'DELETE',
        });
    },

    // Admin - Settings
    getSettings: async (): Promise<BibleStudyPageSettings> => {
        return fetchApi<BibleStudyPageSettings>('/bible-study/admin/settings');
    },

    updateSettings: async (data: BibleStudyPageSettingsUpdate): Promise<BibleStudyPageSettings> => {
        return fetchApi<BibleStudyPageSettings>('/bible-study/admin/settings', {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    // Admin - Upload a resource file (PDF / audio / video)
    uploadResource: async (file: File, title: string, meta = ''): Promise<BibleStudyLibraryResource & { filename: string }> => {
        const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
        const form = new FormData();
        form.append('file', file);
        form.append('title', title);
        form.append('meta', meta);
        const base = (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_API_URL)
            ? process.env.NEXT_PUBLIC_API_URL
            : 'http://localhost:8000/api';
        const res = await fetch(`${base}/bible-study/admin/upload-resource`, {
            method: 'POST',
            headers: token ? { Authorization: `Bearer ${token}` } : {},
            body: form,
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({ detail: res.statusText }));
            throw new Error(err.detail || 'Upload failed');
        }
        return res.json();
    },

    // Admin - Delete a resource file from disk
    deleteResourceFile: async (filename: string): Promise<{ message: string }> =>
        fetchApi<{ message: string }>(`/bible-study/admin/resource-file/${filename}`, { method: 'DELETE' }),

    // Public - Settings (read-only, no auth) — includes admin-managed topics/groups/notes
    getPublicSettings: async (): Promise<BibleStudyPageSettings> => {
        return fetchApi<BibleStudyPageSettings>('/bible-study/settings');
    },

    // Study group membership (any logged-in user, no approval)
    getMyGroups: async (): Promise<{ group_ids: string[] }> => {
        return fetchApi<{ group_ids: string[] }>('/bible-study/groups/my-groups');
    },
    joinGroup: async (groupId: string): Promise<{ status: string; group_id: string }> => {
        return fetchApi(`/bible-study/groups/${groupId}/join`, { method: 'POST' });
    },
    leaveGroup: async (groupId: string): Promise<{ status: string; group_id: string }> => {
        return fetchApi(`/bible-study/groups/${groupId}/leave`, { method: 'DELETE' });
    },
    getGroupMemberCounts: async (): Promise<{ counts: Record<string, number> }> => {
        return fetchApi<{ counts: Record<string, number> }>('/bible-study/groups/member-counts');
    },

    // Public - Week Reflections & Quarterly Themes
    getWeekReflections: async (): Promise<WeekReflection[]> => {
        return fetchApi<WeekReflection[]>('/bible-study/week-reflections');
    },

    getQuarterlyThemes: async (): Promise<QuarterlyTheme[]> => {
        return fetchApi<QuarterlyTheme[]>('/bible-study/quarterly-themes');
    },

    // Admin - Week Reflections
    adminGetWeekReflections: async (): Promise<WeekReflection[]> => {
        return fetchApi<WeekReflection[]>('/bible-study/admin/week-reflections');
    },

    adminUpsertWeekReflection: async (
        weekNumber: number,
        data: { key_verse: string; verse_ref: string; reflection: string }
    ): Promise<WeekReflection> => {
        return fetchApi<WeekReflection>(`/bible-study/admin/week-reflections/${weekNumber}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    adminDeleteWeekReflection: async (weekNumber: number): Promise<{ message: string }> => {
        return fetchApi<{ message: string }>(`/bible-study/admin/week-reflections/${weekNumber}`, {
            method: 'DELETE',
        });
    },

    // Admin - Quarterly Themes
    adminGetQuarterlyThemes: async (): Promise<QuarterlyTheme[]> => {
        return fetchApi<QuarterlyTheme[]>('/bible-study/admin/quarterly-themes');
    },

    adminUpsertQuarterlyTheme: async (
        quarterNumber: number,
        data: Partial<Omit<QuarterlyTheme, 'id' | 'created_at' | 'updated_at' | 'quarter_number'>>
    ): Promise<QuarterlyTheme> => {
        return fetchApi<QuarterlyTheme>(`/bible-study/admin/quarterly-themes/${quarterNumber}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    adminSeedDefaultThemes: async (): Promise<{ message: string; count?: number }> => {
        return fetchApi<{ message: string; count?: number }>('/bible-study/admin/quarterly-themes/seed-defaults', {
            method: 'POST',
        });
    },

    // Group Chat
    getGroupMessages: async (groupId: string): Promise<any[]> => {
        return fetchApi<any[]>(`/bible-study/groups/${groupId}/messages`);
    },

    sendGroupMessage: async (groupId: string, content: string): Promise<any> => {
        return fetchApi<any>(`/bible-study/groups/${groupId}/messages`, {
            method: 'POST',
            body: JSON.stringify({ content }),
        });
    },

    deleteGroupMessage: async (groupId: string, msgId: string): Promise<{ message: string }> => {
        return fetchApi<{ message: string }>(`/bible-study/groups/${groupId}/messages/${msgId}`, {
            method: 'DELETE',
        });
    },

    editGroupMessage: async (groupId: string, msgId: string, content: string): Promise<any> => {
        return fetchApi<any>(`/bible-study/groups/${groupId}/messages/${msgId}`, {
            method: 'PUT',
            body: JSON.stringify({ content }),
        });
    },

    getGroupInfo: async (groupId: string): Promise<any> => {
        return fetchApi<any>(`/bible-study/groups/${groupId}/info`);
    },

    searchGroupMessages: async (groupId: string, query: string): Promise<any[]> => {
        return fetchApi<any[]>(`/bible-study/groups/${groupId}/messages/search`, {
            method: 'POST',
            body: JSON.stringify({ content: query }),
        });
    },

    // Group Moderators (Admin control)
    getGroupModerators: async (groupId: string): Promise<any[]> => {
        return fetchApi<any[]>(`/bible-study/groups/${groupId}/moderators`);
    },

    assignGroupModerator: async (groupId: string, userId: string, permissions: any = {}): Promise<{ message: string }> => {
        return fetchApi<{ message: string }>(`/bible-study/groups/${groupId}/moderators`, {
            method: 'POST',
            body: JSON.stringify({ user_id: userId, permissions }),
        });
    },

    removeGroupModerator: async (groupId: string, userId: string): Promise<{ message: string }> => {
        return fetchApi<{ message: string }>(`/bible-study/groups/${groupId}/moderators/${userId}`, {
            method: 'DELETE',
        });
    },

    updateModeratorPermissions: async (groupId: string, userId: string, permissions: any): Promise<any> => {
        return fetchApi<any>(`/bible-study/groups/${groupId}/moderators/${userId}/permissions`, {
            method: 'PUT',
            body: JSON.stringify({ permissions }),
        });
    },

    // Member Management (for moderators)
    addGroupMember: async (groupId: string, userId: string): Promise<{ message: string }> => {
        return fetchApi<{ message: string }>(`/bible-study/groups/${groupId}/members/${userId}`, {
            method: 'POST',
        });
    },

    removeGroupMember: async (groupId: string, userId: string): Promise<{ message: string }> => {
        return fetchApi<{ message: string }>(`/bible-study/groups/${groupId}/members/${userId}`, {
            method: 'DELETE',
        });
    },

    getAvailableMembers: async (groupId: string, query: string = ''): Promise<any[]> => {
        const url = new URL(`/api/bible-study/groups/${groupId}/available-members`, window.location.origin);
        if (query) url.searchParams.set('q', query);
        const response = await fetch(url.toString(), {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${tokenManager.getAccessToken()}`,
            },
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        return response.json();
    },
};

// ============= Live Stream API =============

export interface LiveStream {
    id: string;
    title: string | null;
    url: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface LiveStreamCreate {
    title?: string;
    url: string;
    is_active?: boolean;
}

export interface LiveStreamUpdate {
    title?: string;
    url?: string;
    is_active?: boolean;
}

export const liveStreamApi = {
    getActiveStream: async (): Promise<LiveStream | null> => {
        return fetchApi<LiveStream | null>('/live-stream/active');
    },

    createStream: async (data: LiveStreamCreate): Promise<LiveStream> => {
        return fetchApi<LiveStream>('/live-stream', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    updateStream: async (id: string, data: LiveStreamUpdate): Promise<LiveStream> => {
        return fetchApi<LiveStream>(`/live-stream/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    getHistory: async (): Promise<LiveStream[]> => {
        return fetchApi<LiveStream[]>('/live-stream/history');
    }
};

// ============= CMS Types =============

export type BlockType = 'hero' | 'hero-slider' | 'content' | 'features' | 'cta' | 'image' | 'video' | 'upcoming-events' | 'sermon-list' | 'leadership-list' | 'button-group' | 'stats' | 'testimonies' | 'scripture' | 'service-times' | 'gallery' | 'newsletter' | 'scripture-marquee' | 'timeline' | 'founder-card';

export interface Block {
    id: string;
    type: BlockType;
    data: any; // Flexible data structure based on type
}

export interface CMSPageContent {
    blocks: Block[];
    meta?: {
        title?: string;
        description?: string;
    };
    // Legacy support (optional) while migrating
    hero?: any;
    about?: any;
    essence?: any;
}

export interface CMSPageResponse {
    id: string;
    slug: string;
    title: string;
    content: CMSPageContent;
    updated_at: string;
}

export interface CMSImageResponse {
    id: string;
    filename: string;
    mime_type: string;
    size: number;
    url: string;
    created_at: string;
}

// ============= Chat Types =============

export interface ChatMessage {
    id: string;
    conversation_id: string;
    sender_id: string;
    is_admin: boolean;
    content: string;
    is_read: boolean;
    created_at: string;
}

export interface ChatConversation {
    id: string;
    user_id: string;
    user_name?: string;
    user_email?: string;
    is_open: boolean;
    unread_count: number;
    last_message?: string;
    updated_at: string;
}

// ============= Chat API =============

export const chatApi = {
    getMessages: async (): Promise<ChatMessage[]> => {
        return fetchApi<ChatMessage[]>('/chat/messages');
    },

    sendMessage: async (content: string): Promise<ChatMessage> => {
        return fetchApi<ChatMessage>('/chat/messages', {
            method: 'POST',
            body: JSON.stringify({ content }),
        });
    },

    getUnreadCount: async (): Promise<{ unread_count: number }> => {
        return fetchApi<{ unread_count: number }>('/chat/unread-count');
    },

    admin: {
        getConversations: async (): Promise<ChatConversation[]> => {
            return fetchApi<ChatConversation[]>('/chat/admin/conversations');
        },

        getUserMessages: async (userId: string): Promise<ChatMessage[]> => {
            return fetchApi<ChatMessage[]>(`/chat/admin/conversations/${userId}/messages`);
        },

        reply: async (userId: string, content: string): Promise<ChatMessage> => {
            return fetchApi<ChatMessage>(`/chat/admin/conversations/${userId}/messages`, {
                method: 'POST',
                body: JSON.stringify({ content }),
            });
        },

        getTotalUnread: async (): Promise<{ unread_count: number }> => {
            return fetchApi<{ unread_count: number }>('/chat/admin/unread-total');
        },

        deleteMessage: async (messageId: string): Promise<{ message: string }> => {
            return fetchApi<{ message: string }>(`/chat/admin/messages/${messageId}`, {
                method: 'DELETE',
            });
        },
    },
};

// ─── Conversion Follow-up CRM ────────────────────────────────────────────────

export type ConversionStage = 'welcomed' | 'called' | 'studying' | 'baptism' | 'small_group' | 'member' | 'dormant'

export interface ConversionJourney {
    id: string
    name: string
    email: string | null
    phone: string | null
    location: string | null
    source: string
    source_ref: string | null
    stage: ConversionStage
    assigned_to_user_id: string | null
    notes: string | null
    welcomed_at: string | null
    called_at: string | null
    studying_at: string | null
    baptism_at: string | null
    small_group_at: string | null
    member_at: string | null
    last_activity_at: string
    is_active: boolean
    created_at: string
}

export const conversionApi = {
    stages: () => fetchApi<{ stages: ConversionStage[] }>('/conversion/stages'),
    adminAll: (stage?: string) => fetchApi<ConversionJourney[]>(`/conversion/admin/all${stage ? `?stage=${stage}` : ''}`),
    adminFunnel: () => fetchApi<{ counts: Record<ConversionStage, number>; total_active: number }>('/conversion/admin/funnel'),
    adminCreate: (body: { name: string; email?: string; phone?: string; location?: string; notes?: string }) =>
        fetchApi<ConversionJourney>('/conversion/admin', { method: 'POST', body: JSON.stringify(body) }),
    adminUpdate: (id: string, patch: Partial<{ stage: ConversionStage; notes: string; assigned_to_user_id: string; is_active: boolean }>) =>
        fetchApi<ConversionJourney>(`/conversion/admin/${id}`, { method: 'PUT', body: JSON.stringify(patch) }),
    adminDelete: (id: string) => fetchApi<{ deleted: number }>(`/conversion/admin/${id}`, { method: 'DELETE' }),
    adminSweepDormant: () => fetchApi<{ moved: number }>('/conversion/admin/sweep-dormant', { method: 'POST' }),
}

// ─── Church Locations (worldwide reach map) ──────────────────────────────────

export type ChurchKind = 'hq' | 'branch' | 'mission' | 'fellowship'

export interface ChurchLocation {
    id: string; name: string; kind: ChurchKind;
    continent: string; country_code: string; country_name: string;
    city: string | null; address: string | null; blurb: string | null;
    contact_name: string | null; contact_email: string | null;
    contact_phone: string | null; website: string | null;
    map_x: number | null; map_y: number | null;
    lat: number | null; lng: number | null;
    photo_url: string | null; sort_order: number; is_active: boolean;
    created_at: string;
}

export const churchLocationsApi = {
    listPublic: () => fetchApi<ChurchLocation[]>('/church-locations'),
    stats: () => fetchApi<{ counts: Record<ChurchKind, number>; total: number; countries: number; continents: number }>('/church-locations/stats'),
    adminAll: () => fetchApi<ChurchLocation[]>('/church-locations/admin/all'),
    adminCreate: (b: Omit<ChurchLocation, 'id' | 'created_at'>) =>
        fetchApi<ChurchLocation>('/church-locations/admin', { method: 'POST', body: JSON.stringify(b) }),
    adminUpdate: (id: string, b: Omit<ChurchLocation, 'id' | 'created_at'>) =>
        fetchApi<ChurchLocation>(`/church-locations/admin/${id}`, { method: 'PUT', body: JSON.stringify(b) }),
    adminDelete: (id: string) => fetchApi<{ deleted: number }>(`/church-locations/admin/${id}`, { method: 'DELETE' }),
}

// ─── Member Directory + Messaging ────────────────────────────────────────────

export interface DirectoryProfile {
    id: string; user_id: string; display_name: string;
    city: string | null; country: string | null; bio: string | null;
    gifts: string | null; languages: string | null; photo_url: string | null;
    is_public: boolean; allow_messages: boolean; is_prayer_partner: boolean;
    created_at: string; updated_at: string;
}
export interface DirectoryMessage {
    id: string; sender_user_id: string; body: string;
    is_read: boolean; is_reported: boolean; created_at: string;
}

export const directoryApi = {
    me: () => fetchApi<DirectoryProfile | null>('/directory/me'),
    upsertMe: (b: Partial<DirectoryProfile> & { display_name: string }) =>
        fetchApi<DirectoryProfile>('/directory/me', { method: 'PUT', body: JSON.stringify(b) }),
    deleteMe: () => fetchApi<{ ok: boolean }>('/directory/me', { method: 'DELETE' }),
    search: (params?: { q?: string; city?: string; prayer_partner?: boolean }) => {
        const qs = new URLSearchParams()
        Object.entries(params || {}).forEach(([k, v]) => { if (v !== undefined && v !== '' && v !== false) qs.set(k, String(v)) })
        return fetchApi<DirectoryProfile[]>(`/directory/search${qs.toString() ? '?' + qs : ''}`)
    },
    send: (recipient_user_id: string, body: string) =>
        fetchApi<{ ok: boolean; id: string }>('/directory/messages', { method: 'POST', body: JSON.stringify({ recipient_user_id, body }) }),
    inbox: () => fetchApi<DirectoryMessage[]>('/directory/inbox'),
    markRead: (mid: string) => fetchApi<{ ok: boolean }>(`/directory/messages/${mid}/read`, { method: 'PUT' }),
    report: (mid: string) => fetchApi<{ ok: boolean }>(`/directory/messages/${mid}/report`, { method: 'PUT' }),
    adminReports: () => fetchApi<Array<{ id: string; sender_user_id: string; recipient_user_id: string; body: string; created_at: string }>>('/directory/admin/reports'),
    adminHide: (mid: string) => fetchApi<{ ok: boolean }>(`/directory/admin/messages/${mid}`, { method: 'DELETE' }),
}

// ─── Live worship co-experience (chat + captions) ───────────────────────────

export interface LiveChatMessage {
    id: string; service_id: string | null; user_id: string | null;
    display_name: string; body: string; is_pinned: boolean; created_at: string;
}
export interface LiveCaption { id: string; text: string; spoken_at: string }

export const liveExpApi = {
    listChat: (params?: { service_id?: string; since?: string; limit?: number }) => {
        const qs = new URLSearchParams()
        Object.entries(params || {}).forEach(([k, v]) => { if (v !== undefined) qs.set(k, String(v)) })
        return fetchApi<LiveChatMessage[]>(`/live/chat${qs.toString() ? '?' + qs : ''}`)
    },
    post: (b: { service_id?: string; body: string; display_name?: string }) =>
        fetchApi<{ ok: boolean; id: string }>('/live/chat', { method: 'POST', body: JSON.stringify(b) }),
    pin: (mid: string) => fetchApi<{ ok: boolean; is_pinned: boolean }>(`/live/chat/${mid}/pin`, { method: 'PUT' }),
    hide: (mid: string) => fetchApi<{ ok: boolean }>(`/live/chat/${mid}`, { method: 'DELETE' }),
    ingestCaption: (b: { service_id: string; text: string; language?: string }) =>
        fetchApi<{ ok: boolean; stored: number }>('/live/captions', { method: 'POST', body: JSON.stringify(b) }),
    listCaptions: (params: { service_id: string; language?: string; since?: string }) => {
        const qs = new URLSearchParams()
        Object.entries(params).forEach(([k, v]) => { if (v !== undefined) qs.set(k, String(v)) })
        return fetchApi<LiveCaption[]>(`/live/captions?${qs}`)
    },
    captionLanguages: () => fetchApi<{ languages: string[] }>('/live/captions/languages'),
    captionState: (service_id: string) =>
        fetchApi<{ service_id: string; source_language: string | null; last_spoken_at: string | null; is_active: boolean }>(`/live/captions/state?service_id=${encodeURIComponent(service_id)}`),

    // Server-side YouTube → caption capture. Admin paste a URL, click Start,
    // backend does the rest (yt-dlp → ffmpeg → Whisper → translate).
    youtubeStart: (b: { service_id: string; youtube_url: string; source_language?: string }) =>
        fetchApi<{ status: 'started' | 'already_running'; service_id: string }>('/live/captions/youtube/start', { method: 'POST', body: JSON.stringify(b) }),
    youtubeStop: (service_id: string) =>
        fetchApi<{ status: 'stopped' | 'not_running'; service_id: string }>(`/live/captions/youtube/stop?service_id=${encodeURIComponent(service_id)}`, { method: 'POST' }),
    youtubeStatus: (service_id: string) =>
        fetchApi<{ status: 'idle' | 'running' | 'done'; service_id: string; error?: string | null }>(`/live/captions/youtube/status?service_id=${encodeURIComponent(service_id)}`),
}

// ─── Pastoral Care ───────────────────────────────────────────────────────────

export type PastoralKind = 'visitation' | 'call' | 'hospital' | 'bereavement' | 'counsel' | 'celebration' | 'prayer' | 'concern'

export interface PastoralNote {
    id: string; member_user_id: string | null; member_name: string; member_email: string | null;
    kind: PastoralKind; title: string; body: string; follow_up_on: string | null;
    written_by_user_id: string | null; is_confidential: boolean;
    created_at: string; updated_at: string;
}
export interface LifeEventEntry {
    id: string; member_user_id: string | null; member_name: string;
    kind: string; summary: string; event_on: string; created_at: string;
}

export const pastoralApi = {
    listNotes: (params?: { q?: string; kind?: string; member_user_id?: string }) => {
        const qs = new URLSearchParams()
        if (params?.q) qs.set('q', params.q)
        if (params?.kind) qs.set('kind', params.kind)
        if (params?.member_user_id) qs.set('member_user_id', params.member_user_id)
        return fetchApi<PastoralNote[]>(`/pastoral-care/notes${qs.toString() ? '?' + qs : ''}`)
    },
    createNote: (b: { member_name: string; member_email?: string; member_user_id?: string; kind?: PastoralKind; title: string; body: string; follow_up_on?: string }) =>
        fetchApi<PastoralNote>('/pastoral-care/notes', { method: 'POST', body: JSON.stringify(b) }),
    updateNote: (id: string, b: Partial<{ title: string; body: string; kind: PastoralKind; follow_up_on: string }>) =>
        fetchApi<PastoralNote>(`/pastoral-care/notes/${id}`, { method: 'PUT', body: JSON.stringify(b) }),
    deleteNote: (id: string) => fetchApi<{ deleted: number }>(`/pastoral-care/notes/${id}`, { method: 'DELETE' }),
    listLifeEvents: (member_user_id?: string) => fetchApi<LifeEventEntry[]>(`/pastoral-care/life-events${member_user_id ? `?member_user_id=${member_user_id}` : ''}`),
    createLifeEvent: (b: { member_name: string; member_user_id?: string; kind: string; summary: string; event_on: string }) =>
        fetchApi<LifeEventEntry>('/pastoral-care/life-events', { method: 'POST', body: JSON.stringify(b) }),
    deleteLifeEvent: (id: string) => fetchApi<{ deleted: number }>(`/pastoral-care/life-events/${id}`, { method: 'DELETE' }),
}

// ─── Small Groups / House Fellowships ────────────────────────────────────────

export type SmallGroupAudience = 'any' | 'newcomers' | 'young_adults' | 'couples' | 'families' | 'seniors' | 'men' | 'women' | 'students'

export interface SmallGroup {
    id: string; name: string; description: string | null; topics: string | null;
    audience: SmallGroupAudience; day_of_week: number; time_text: string; cadence: string;
    location_label: string; city: string | null; country: string | null;
    lat: number | null; lng: number | null;
    leader_name: string; leader_contact: string | null;
    capacity: number; current_size: number;
    is_active: boolean; is_online: boolean; cover_image_url: string | null;
    created_at: string;
}
export interface SmallGroupInterest {
    id: string; group_id: string; requester_name: string; requester_email: string;
    requester_phone: string | null; note: string | null; status: string; created_at: string;
}

export const smallGroupsApi = {
    listPublic: (params?: { audience?: string; day?: number; city?: string; q?: string; online?: boolean }) => {
        const qs = new URLSearchParams()
        Object.entries(params || {}).forEach(([k, v]) => { if (v !== undefined && v !== '') qs.set(k, String(v)) })
        return fetchApi<SmallGroup[]>(`/small-groups${qs.toString() ? '?' + qs : ''}`)
    },
    cities: () => fetchApi<{ cities: { name: string; count: number }[] }>('/small-groups/cities'),
    expressInterest: (gid: string, b: { name: string; email: string; phone?: string; note?: string }) =>
        fetchApi<{ ok: boolean; message: string }>(`/small-groups/${gid}/interest`, { method: 'POST', body: JSON.stringify(b) }),
    adminAll: () => fetchApi<SmallGroup[]>('/small-groups/admin/all'),
    adminCreate: (b: Partial<SmallGroup> & { name: string }) =>
        fetchApi<SmallGroup>('/small-groups/admin', { method: 'POST', body: JSON.stringify(b) }),
    adminUpdate: (gid: string, b: Partial<SmallGroup> & { name: string }) =>
        fetchApi<SmallGroup>(`/small-groups/admin/${gid}`, { method: 'PUT', body: JSON.stringify(b) }),
    adminDelete: (gid: string) => fetchApi<{ deleted: number }>(`/small-groups/admin/${gid}`, { method: 'DELETE' }),
    adminInterests: (status?: string) => fetchApi<SmallGroupInterest[]>(`/small-groups/admin/interests${status ? `?status=${status}` : ''}`),
    adminUpdateInterest: (iid: string, status: string) =>
        fetchApi<{ ok: boolean; status: string }>(`/small-groups/admin/interests/${iid}?status=${status}`, { method: 'PUT' }),
}

// ─── Children Check-in ───────────────────────────────────────────────────────

export interface ChildProfile {
    id: string; full_name: string; birthdate: string | null; age_group: string;
    guardian_name: string; guardian_phone: string;
    allergies: string | null; medical_notes: string | null;
    is_active: boolean; created_at: string;
}
export interface ActiveCheckin {
    checkin_id: string; child_id: string; child_name: string; age_group: string;
    guardian_name: string; guardian_phone: string; allergies: string | null;
    security_code: string; checked_in_at: string; location: string;
}

export const childrenCheckinApi = {
    listChildren: (q?: string) => fetchApi<ChildProfile[]>(`/children-checkin/children${q ? `?q=${encodeURIComponent(q)}` : ''}`),
    addChild: (b: { full_name: string; age_group?: string; guardian_name: string; guardian_phone: string; allergies?: string; medical_notes?: string; birthdate?: string }) =>
        fetchApi<ChildProfile>('/children-checkin/children', { method: 'POST', body: JSON.stringify(b) }),
    removeChild: (cid: string) => fetchApi<{ deleted: number }>(`/children-checkin/children/${cid}`, { method: 'DELETE' }),
    checkin: (cid: string, location = 'kids_wing') =>
        fetchApi<{ ok: boolean; id: string; security_code: string; child_name?: string; already_open?: boolean }>(`/children-checkin/checkin/${cid}?location=${location}`, { method: 'POST' }),
    checkout: (cid: string, security_code: string) =>
        fetchApi<{ ok: boolean; checked_out_at: string }>(`/children-checkin/checkout/${cid}`, { method: 'POST', body: JSON.stringify({ security_code }) }),
    active: () => fetchApi<ActiveCheckin[]>('/children-checkin/active'),
}

// ─── Downloads API ───────────────────────────────────────────────────────────

export type DownloadCategory = 'Sermon' | 'E-book' | 'Bulletin' | 'Music' | 'Video' | 'Article' | 'Other'

export interface DownloadResource {
    id: string
    title: string
    description: string | null
    category: DownloadCategory
    kind: 'file' | 'url'
    external_url: string | null
    file_name: string | null
    file_mime_type: string | null
    file_size: number | null
    is_published: boolean
    download_count: number
    created_at: string
}

export const downloadsApi = {
    list: (category?: string) => fetchApi<DownloadResource[]>(`/downloads${category ? `?category=${encodeURIComponent(category)}` : ''}`),
    fileUrl: (id: string) => `${API_BASE_URL}/downloads/${id}/file`,
    adminAll: () => fetchApi<DownloadResource[]>('/downloads/admin/all'),
    adminAddUrl: async (body: { title: string; category: string; external_url: string; description?: string; is_published?: boolean }) => {
        const fd = new FormData()
        Object.entries(body).forEach(([k, v]) => { if (v !== undefined) fd.append(k, String(v)) })
        const token = localStorage.getItem('access_token')
        const res = await fetch(`${API_BASE_URL}/downloads/admin/url`, {
            method: 'POST', body: fd,
            headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        })
        if (!res.ok) throw new Error((await res.json().catch(() => ({ detail: 'Failed' }))).detail || 'Failed')
        return res.json() as Promise<DownloadResource>
    },
    adminAddFile: async (body: { title: string; category: string; description?: string; is_published?: boolean; file: File }) => {
        const fd = new FormData()
        fd.append('title', body.title)
        fd.append('category', body.category)
        if (body.description) fd.append('description', body.description)
        if (body.is_published !== undefined) fd.append('is_published', String(body.is_published))
        fd.append('file', body.file)
        const token = localStorage.getItem('access_token')
        const res = await fetch(`${API_BASE_URL}/downloads/admin/file`, {
            method: 'POST', body: fd,
            headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        })
        if (!res.ok) throw new Error((await res.json().catch(() => ({ detail: 'Failed' }))).detail || 'Failed')
        return res.json() as Promise<DownloadResource>
    },
    adminUpdate: async (id: string, patch: Partial<{ title: string; category: string; description: string; external_url: string; is_published: boolean }>) => {
        const fd = new FormData()
        Object.entries(patch).forEach(([k, v]) => { if (v !== undefined) fd.append(k, String(v)) })
        const token = localStorage.getItem('access_token')
        const res = await fetch(`${API_BASE_URL}/downloads/admin/${id}`, {
            method: 'PUT', body: fd,
            headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        })
        if (!res.ok) throw new Error((await res.json().catch(() => ({ detail: 'Failed' }))).detail || 'Failed')
        return res.json() as Promise<DownloadResource>
    },
    adminDelete: (id: string) => fetchApi<{ deleted: number }>(`/downloads/admin/${id}`, { method: 'DELETE' }),
}

export const cmsApi = {
    getPage: async (slug: string): Promise<CMSPageResponse> => {
        return fetchApi<CMSPageResponse>(`/cms/pages/${slug}`, { cache: 'no-store' });
    },

    listPages: async (): Promise<{ pages: Array<{ slug: string; title: string; updated_at: string | null }> }> => {
        return fetchApi<{ pages: Array<{ slug: string; title: string; updated_at: string | null }> }>('/cms/pages', { cache: 'no-store' });
    },

    updatePage: async (slug: string, title: string, content: CMSPageContent): Promise<CMSPageResponse> => {
        return fetchApi<CMSPageResponse>(`/cms/pages/${slug}`, {
            method: 'POST',
            body: JSON.stringify({ title, content }),
        });
    },

    uploadImage: async (file: File): Promise<CMSImageResponse> => {
        const formData = new FormData();
        formData.append('file', file);

        const token = localStorage.getItem('access_token');
        const response = await fetch(`${API_BASE_URL}/cms/images`, {
            method: 'POST',
            headers: {
                ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
            },
            body: formData,
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ detail: 'Image upload failed' }));
            throw new Error(errorData.detail || 'Image upload failed');
        }

        return response.json();
    },

    getImageUrl: (id: string): string => {
        if (!id) return '';
        if (id.startsWith('http')) return id;
        return `${API_BASE_URL}/cms/images/${id}`;
    }
};

// ============= Bible Reading Progress API =============

export interface BibleReadingProgressResponse {
    registered: boolean;
    completed_weeks: Record<string, boolean>;
}

export const bibleReadingApi = {
    /**
     * Load the user's saved progress for the 54-week reading plan.
     * Returns { registered, completed_weeks: { "1": true, "3": false, ... } }
     */
    getProgress: async (): Promise<BibleReadingProgressResponse> => {
        return fetchApi<BibleReadingProgressResponse>('/bible-study/weekly-progress');
    },

    /**
     * Register the user for the reading plan.
     */
    register: async (): Promise<{ registered: boolean; message: string }> => {
        return fetchApi<{ registered: boolean; message: string }>('/bible-study/weekly-progress/register', {
            method: 'POST',
        });
    },

    /**
     * Toggle a specific week's completion. Returns the new state.
     */
    toggleWeek: async (weekNumber: number): Promise<{ week_number: number; completed: boolean }> => {
        return fetchApi<{ week_number: number; completed: boolean }>(
            `/bible-study/weekly-progress/week/${weekNumber}`,
            { method: 'PUT' }
        );
    },
};


// ============================================================
// Messages / Chat API
// ============================================================

export interface ChatParticipant {
    id: string;
    name: string;
    role: string;
    avatar_url?: string | null;
}

export interface ChatMessage {
    id: string;
    conversation_id: string;
    sender_id: string;
    sender?: ChatParticipant | null;
    body: string;
    attachment_url?: string | null;
    is_read: boolean;
    edited_at?: string | null;
    created_at: string;
}

export interface ChatConversation {
    id: string;
    subject?: string | null;
    status: string;
    user?: ChatParticipant | null;
    admin?: ChatParticipant | null;
    last_message_preview?: string | null;
    last_message_at?: string | null;
    unread_for_user: number;
    unread_for_admin: number;
    my_unread: number;
    created_at: string;
    updated_at: string;
}

export interface ChatConversationDetail extends ChatConversation {
    messages: ChatMessage[];
}

export interface ChatListResponse {
    conversations: ChatConversation[];
    total: number;
    total_unread: number;
}

export const messageApi = {
    listAdmins: async (): Promise<ChatParticipant[]> =>
        fetchApi<ChatParticipant[]>('/messages/admins'),

    listMentees: async (): Promise<Array<{ id: string; mentee_id: string; mentee_name: string; mentee_email: string; subject: string; last_message_preview: string | null; last_message_at: string | null; unread_count: number }>> =>
        fetchApi('/messages/mentor/mentees'),

    listConversations: async (): Promise<ChatListResponse> =>
        fetchApi<ChatListResponse>('/messages/conversations'),

    getConversation: async (id: string): Promise<ChatConversationDetail> =>
        fetchApi<ChatConversationDetail>(`/messages/conversations/${id}`),

    createConversation: async (
        body: { subject?: string; initial_message: string; admin_id?: string; recipient_id?: string }
    ): Promise<ChatConversationDetail> =>
        fetchApi<ChatConversationDetail>('/messages/conversations', {
            method: 'POST',
            body: JSON.stringify(body),
        }),

    sendMessage: async (
        conversationId: string,
        body: { body: string; attachment_url?: string }
    ): Promise<ChatMessage> =>
        fetchApi<ChatMessage>(`/messages/conversations/${conversationId}/messages`, {
            method: 'POST',
            body: JSON.stringify(body),
        }),

    markRead: async (conversationId: string): Promise<MessageResponse> =>
        fetchApi<MessageResponse>(`/messages/conversations/${conversationId}/read`, {
            method: 'POST',
        }),

    closeConversation: async (conversationId: string): Promise<MessageResponse> =>
        fetchApi<MessageResponse>(`/messages/conversations/${conversationId}/close`, {
            method: 'POST',
        }),

    unreadCount: async (): Promise<{ unread_count: number }> =>
        fetchApi<{ unread_count: number }>('/messages/unread-count'),

    /**
     * Build a WebSocket URL that includes the JWT token.
     * Returns null when running on the server.
     */
    wsUrl: (): string | null => {
        if (typeof window === 'undefined') return null;
        const token = localStorage.getItem('access_token');
        if (!token) return null;
        // Derive ws(s) from API base URL
        const base = API_BASE_URL.replace(/\/api\/?$/, '');
        const ws = base.replace(/^http/, 'ws');
        return `${ws}/api/messages/ws?token=${encodeURIComponent(token)}`;
    },

    /** Admin: get all user conversations (inbox) */
    admin: {
        getInbox: async (): Promise<ChatListResponse> =>
            fetchApi<ChatListResponse>('/messages/admin/inbox'),

        getConversation: async (id: string): Promise<ChatConversationDetail> =>
            fetchApi<ChatConversationDetail>(`/messages/conversations/${id}`),

        sendMessage: async (conversationId: string, body: string): Promise<ChatMessage> =>
            fetchApi<ChatMessage>(`/messages/conversations/${conversationId}/messages`, {
                method: 'POST',
                body: JSON.stringify({ body }),
            }),

        markRead: async (conversationId: string): Promise<MessageResponse> =>
            fetchApi<MessageResponse>(`/messages/conversations/${conversationId}/read`, {
                method: 'POST',
            }),

        closeConversation: async (conversationId: string): Promise<MessageResponse> =>
            fetchApi<MessageResponse>(`/messages/conversations/${conversationId}/close`, {
                method: 'POST',
            }),

        /** Admin: hard-delete a single message from any conversation. */
        deleteMessage: async (conversationId: string, messageId: string): Promise<MessageResponse> =>
            fetchApi<MessageResponse>(
                `/messages/conversations/${conversationId}/messages/${messageId}`,
                { method: 'DELETE' }
            ),

        /** Admin: assign a mentor to a mentee and open a chat thread between them */
        assignMentor: async (
            body: { mentee_id: string; mentor_id: string; subject?: string; intro_message?: string }
        ): Promise<ChatConversationDetail> =>
            fetchApi<ChatConversationDetail>('/messages/admin/assign-mentor', {
                method: 'POST',
                body: JSON.stringify(body),
            }),
    },
};

// ============================================================
// Profile API (extended profile + password change + avatar upload)
// ============================================================

export interface UserProfile {
    id: string;
    name: string;
    email: string;
    role: string;
    status: string;
    avatar_url?: string | null;
    bio?: string | null;
    phone?: string | null;
    location?: string | null;
    services: string[];
    created_at: string;
    updated_at: string;
}

export const profileApi = {
    me: async (): Promise<UserProfile> => fetchApi<UserProfile>('/profile/me'),

    update: async (data: Partial<Pick<UserProfile, 'name' | 'bio' | 'phone' | 'location' | 'avatar_url'>>): Promise<UserProfile> =>
        fetchApi<UserProfile>('/profile/me', {
            method: 'PUT',
            body: JSON.stringify(data),
        }),

    changePassword: async (current_password: string, new_password: string): Promise<MessageResponse> =>
        fetchApi<MessageResponse>('/profile/me/password', {
            method: 'POST',
            body: JSON.stringify({ current_password, new_password }),
        }),

    uploadAvatar: async (file: File): Promise<UserProfile> => {
        const form = new FormData();
        form.append('file', file);
        const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
        const res = await fetch(`${API_BASE_URL}/profile/me/avatar`, {
            method: 'POST',
            body: form,
            headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({ detail: 'Upload failed' }));
            throw new ApiError(res.status, err.detail || 'Upload failed');
        }
        return res.json();
    },
};

// ============================================================
// Activity / History API
// ============================================================

export interface ActivityItem {
    kind: string;
    title: string;
    description?: string | null;
    status?: string | null;
    happened_at: string;
    link?: string | null;
}

export interface ActivityResponse {
    items: ActivityItem[];
    counts: Record<string, number>;
}

export const activityApi = {
    me: async (limit = 50): Promise<ActivityResponse> =>
        fetchApi<ActivityResponse>(`/activity/me?limit=${limit}`),
};

// ============================================================
// Prayer Wall API
// ============================================================

export interface PrayerWallItem {
    id: string;
    title: string;
    description: string;
    category?: string | null;
    author_name: string;
    is_anonymous: boolean;
    prayer_count: number;
    has_prayed: boolean;
    status: string;
    created_at: string;
}

export interface PrayerWallResponse {
    requests: PrayerWallItem[];
    total: number;
}

export const prayerWallApi = {
    list: async (limit = 20, offset = 0, category?: string): Promise<PrayerWallResponse> => {
        const params = new URLSearchParams({
            limit: limit.toString(),
            offset: offset.toString(),
        });
        if (category) params.set('category', category);
        return fetchApi<PrayerWallResponse>(`/prayer-wall?${params}`);
    },
    create: async (body: { title: string; description: string; category?: string; is_anonymous?: boolean }): Promise<PrayerWallItem> =>
        fetchApi<PrayerWallItem>('/prayer-wall', {
            method: 'POST',
            body: JSON.stringify(body),
        }),
    pray: async (id: string): Promise<PrayerWallItem> =>
        fetchApi<PrayerWallItem>(`/prayer-wall/${id}/pray`, { method: 'POST' }),
    remove: async (id: string): Promise<MessageResponse> =>
        fetchApi<MessageResponse>(`/prayer-wall/${id}`, { method: 'DELETE' }),
};

// ============= Evangelism API =============
export const evangelismApi = {
    /** Public sign-up — no auth required */
    registerInterest: async (body: {
        name: string;
        email: string;
        phone?: string;
        availability?: string;
        message?: string;
    }): Promise<{ message: string }> => {
        const base = (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_API_URL)
            || 'http://localhost:8000/api';
        const res = await fetch(`${base}/evangelism/interest`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({ detail: 'Submission failed' }));
            throw new Error(err.detail || 'Submission failed');
        }
        return res.json();
    },

    admin: {
        listInterests: async (): Promise<any[]> =>
            fetchApi<any[]>('/evangelism/interests'),
        deleteInterest: async (id: string): Promise<{ message: string }> =>
            fetchApi<{ message: string }>(`/evangelism/interests/${id}`, { method: 'DELETE' }),
    },
};

// ============= Youth Programs =============

export interface YouthProgramItem {
    title: string;
    description?: string;
    icon?: string;
}

export interface YouthProgramScheduleItem {
    day: string;
    time?: string;
    title?: string;
    description?: string;
}

export interface YouthProgramResource {
    title: string;
    url: string;
    type?: 'pdf' | 'video' | 'link';
    meta?: string;
}

export interface YouthProgramAnnouncement {
    title: string;
    body?: string;
    date?: string;
    urgent?: boolean;
}

export interface YouthProgram {
    id: string;
    slug: string;
    title: string;
    badge?: string;
    icon?: string;
    color_class?: string;
    hero_image_url?: string;
    short_description?: string;
    long_description?: string;
    what_youll_do?: YouthProgramItem[];
    who_its_for?: string[];
    schedule?: YouthProgramScheduleItem[];
    outcomes?: string[];
    resources?: YouthProgramResource[];
    announcements?: YouthProgramAnnouncement[];
    leader_name?: string;
    leader_role?: string;
    leader_photo_url?: string;
    leader_bio?: string;
    coordinator_user_ids?: string[];
    registration_open: boolean;
    join_cta_text?: string;
    service_request_label?: string;
    order_index: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface YouthProgramChatMessage {
    id: string;
    body: string;
    user_id: string;
    user_name: string;
    user_avatar_url?: string;
    is_mine: boolean;
    can_delete: boolean;
    created_at: string;
}

export interface YouthProgramMember {
    user_id: string;
    name: string;
    email?: string;
    avatar_url?: string;
    role: 'coordinator' | 'member';
}

export interface YouthProgramMembershipStatus {
    is_member: boolean;
    is_coordinator: boolean;
    is_admin: boolean;
    can_access: boolean;
}

export interface YouthProgramActivity {
    id: string;
    title: string;
    description?: string;
    activity_type?: string;
    location?: string;
    start_at: string;
    end_at?: string;
    rsvp_yes: number;
    rsvp_maybe: number;
    my_rsvp?: 'yes' | 'maybe' | 'no';
    can_manage: boolean;
    created_at: string;
}

export interface YouthProgramActivityInput {
    title: string;
    description?: string;
    activity_type?: string;
    location?: string;
    start_at: string;  // ISO
    end_at?: string;
}

export interface YouthProgramAttendanceRow {
    user_id: string;
    name: string;
    avatar_url?: string;
    present: boolean;
}

export interface YouthProgramAttendanceItem {
    activity_id: string;
    activity_title: string;
    activity_start_at: string;
    present: boolean;
    recorded_at: string;
}

export interface YouthProgramAttendanceSummary {
    total_recorded: number;
    present_count: number;
    rate: number;
    streak: number;
    history: YouthProgramAttendanceItem[];
}

export interface YouthProgramPendingMember {
    request_id: string;
    user_id: string;
    name: string;
    email?: string;
    avatar_url?: string;
    note?: string;
    requested_at: string;
}

export const youthProgramApi = {
    list: (): Promise<YouthProgram[]> => fetchApi<YouthProgram[]>('/youth/programs'),
    get: (slug: string): Promise<YouthProgram> => fetchApi<YouthProgram>(`/youth/programs/${slug}`),

    // Per-program chat + members + membership check
    listMessages: (slug: string, limit = 100): Promise<YouthProgramChatMessage[]> =>
        fetchApi<YouthProgramChatMessage[]>(`/youth/programs/${slug}/messages?limit=${limit}`),
    sendMessage: (slug: string, body: string): Promise<YouthProgramChatMessage> =>
        fetchApi<YouthProgramChatMessage>(`/youth/programs/${slug}/messages`, { method: 'POST', body: JSON.stringify({ body }) }),
    deleteMessage: (slug: string, messageId: string): Promise<void> =>
        fetchApi<void>(`/youth/programs/${slug}/messages/${messageId}`, { method: 'DELETE' }),
    listMembers: (slug: string): Promise<YouthProgramMember[]> =>
        fetchApi<YouthProgramMember[]>(`/youth/programs/${slug}/members`),
    membership: (slug: string): Promise<YouthProgramMembershipStatus> =>
        fetchApi<YouthProgramMembershipStatus>(`/youth/programs/${slug}/membership`),

    // Activities
    listActivities: (slug: string, upcomingOnly = false): Promise<YouthProgramActivity[]> =>
        fetchApi<YouthProgramActivity[]>(`/youth/programs/${slug}/activities${upcomingOnly ? '?upcoming_only=true' : ''}`),
    createActivity: (slug: string, data: YouthProgramActivityInput): Promise<YouthProgramActivity> =>
        fetchApi<YouthProgramActivity>(`/youth/programs/${slug}/activities`, { method: 'POST', body: JSON.stringify(data) }),
    deleteActivity: (slug: string, activityId: string): Promise<void> =>
        fetchApi<void>(`/youth/programs/${slug}/activities/${activityId}`, { method: 'DELETE' }),
    setRsvp: (slug: string, activityId: string, status: 'yes' | 'maybe' | 'no', note?: string): Promise<{ status: string }> =>
        fetchApi<{ status: string }>(`/youth/programs/${slug}/activities/${activityId}/rsvp`, { method: 'POST', body: JSON.stringify({ status, note }) }),

    // Attendance
    recordAttendance: (slug: string, activityId: string, entries: Array<{ user_id: string; present: boolean }>): Promise<{ recorded: number }> =>
        fetchApi<{ recorded: number }>(`/youth/programs/${slug}/activities/${activityId}/attendance`, { method: 'POST', body: JSON.stringify({ entries }) }),
    listActivityAttendance: (slug: string, activityId: string): Promise<YouthProgramAttendanceRow[]> =>
        fetchApi<YouthProgramAttendanceRow[]>(`/youth/programs/${slug}/activities/${activityId}/attendance`),
    myAttendance: (slug: string): Promise<YouthProgramAttendanceSummary> =>
        fetchApi<YouthProgramAttendanceSummary>(`/youth/programs/${slug}/attendance/me`),

    // Coordinator: announcements + resources (writes to YouthProgram JSONB)
    coordPostAnnouncement: (slug: string, data: { title: string; body?: string; date?: string; urgent?: boolean }): Promise<{ count: number }> =>
        fetchApi<{ count: number }>(`/youth/programs/${slug}/coord/announcements`, { method: 'POST', body: JSON.stringify(data) }),
    coordDeleteAnnouncement: (slug: string, index: number): Promise<void> =>
        fetchApi<void>(`/youth/programs/${slug}/coord/announcements/${index}`, { method: 'DELETE' }),
    coordAddResource: (slug: string, data: { title: string; url: string; type?: string; meta?: string }): Promise<{ count: number }> =>
        fetchApi<{ count: number }>(`/youth/programs/${slug}/coord/resources`, { method: 'POST', body: JSON.stringify(data) }),
    coordDeleteResource: (slug: string, index: number): Promise<void> =>
        fetchApi<void>(`/youth/programs/${slug}/coord/resources/${index}`, { method: 'DELETE' }),

    // Coordinator: pending members
    coordListPending: (slug: string): Promise<YouthProgramPendingMember[]> =>
        fetchApi<YouthProgramPendingMember[]>(`/youth/programs/${slug}/coord/pending`),
    coordApprovePending: (slug: string, requestId: string): Promise<{ status: string }> =>
        fetchApi<{ status: string }>(`/youth/programs/${slug}/coord/pending/${requestId}/approve`, { method: 'POST' }),
    coordRejectPending: (slug: string, requestId: string): Promise<{ status: string }> =>
        fetchApi<{ status: string }>(`/youth/programs/${slug}/coord/pending/${requestId}/reject`, { method: 'POST' }),

    admin: {
        listAll: (): Promise<YouthProgram[]> => fetchApi<YouthProgram[]>('/youth/programs/admin/all'),
        create: (data: Partial<YouthProgram>): Promise<YouthProgram> =>
            fetchApi<YouthProgram>('/youth/programs/admin', { method: 'POST', body: JSON.stringify(data) }),
        update: (id: string, data: Partial<YouthProgram>): Promise<YouthProgram> =>
            fetchApi<YouthProgram>(`/youth/programs/admin/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
        remove: (id: string): Promise<void> =>
            fetchApi<void>(`/youth/programs/admin/${id}`, { method: 'DELETE' }),
        seedDefaults: (): Promise<{ inserted: number }> =>
            fetchApi<{ inserted: number }>('/youth/programs/admin/seed-defaults', { method: 'POST' }),
    },
};

// ============= Ministry Content (Women's + Men's ministry editable sections) =============

export interface MinistryContent {
    key: string;
    content: Record<string, any>;
    updated_at?: string | null;
}

export type MinistryContentKey = 'women' | 'men' | 'theology' | 'leadership' | 'giving' | 'statement-of-faith' | 'privacy-policy' | 'terms-of-service' | 'testimony-page' | 'hero-settings' | 'apps-list' | 'navbar' | 'footer' | 'tour-page' | 'voice-page' | 'grow-page' | 'email-templates' | 'onboarding-page' | 'volunteer-page' | 'apps-page' | 'sanctuary-page' | 'marriage-prep-page' | 'download-page' | 'life-events-page' | 'fasting-page' | 'blog-page';

export const ministryContentApi = {
    get: (key: MinistryContentKey): Promise<MinistryContent> =>
        fetchApi<MinistryContent>(`/ministry-content/${key}`),
    update: (key: MinistryContentKey, content: Record<string, any>): Promise<MinistryContent> =>
        fetchApi<MinistryContent>(`/ministry-content/${key}`, { method: 'PUT', body: JSON.stringify({ content }) }),
};

// ============= Site Branding (admin-uploaded logo + favicon) =============

export interface SiteBranding {
    logo_url: string | null;
    favicon_url: string | null;
    updated_at?: string | null;
}

// Backend serves uploads at <origin>/uploads/...  — strip the trailing /api off API_BASE_URL.
const ASSET_BASE = API_BASE_URL.replace(/\/api\/?$/, '');

export function resolveBrandingUrl(path: string | null | undefined): string | null {
    if (!path) return null;
    if (/^https?:\/\//i.test(path)) return path;
    return `${ASSET_BASE}${path.startsWith('/') ? path : `/${path}`}`;
}

async function uploadBrandingFile(endpoint: '/site-branding/logo' | '/site-branding/favicon', file: File): Promise<SiteBranding> {
    const fd = new FormData();
    fd.append('file', file);
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        body: fd,
        headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(text || `Upload failed (${res.status})`);
    }
    const partial = await res.json();
    return { logo_url: partial.logo_url ?? null, favicon_url: partial.favicon_url ?? null };
}

export const siteBrandingApi = {
    get: (): Promise<SiteBranding> => fetchApi<SiteBranding>('/site-branding'),
    uploadLogo: (file: File) => uploadBrandingFile('/site-branding/logo', file),
    uploadFavicon: (file: File) => uploadBrandingFile('/site-branding/favicon', file),
    clearLogo: (): Promise<SiteBranding> => fetchApi<SiteBranding>('/site-branding/logo', { method: 'DELETE' }),
    clearFavicon: (): Promise<SiteBranding> => fetchApi<SiteBranding>('/site-branding/favicon', { method: 'DELETE' }),
};

// ─── Welcome Flow ───────────────────────────────────────────────────────────
export interface WelcomeStep {
    id: string; day_offset: number; subject: string; body_html: string;
    is_active: boolean; sort_order: number;
    created_at?: string; updated_at?: string;
}
export const welcomeFlowApi = {
    listSteps: () => fetchApi<WelcomeStep[]>('/welcome-flow/steps'),
    createStep: (body: Omit<WelcomeStep, 'id' | 'created_at' | 'updated_at'>) =>
        fetchApi<WelcomeStep>('/welcome-flow/steps', { method: 'POST', body: JSON.stringify(body) }),
    updateStep: (id: string, body: Omit<WelcomeStep, 'id' | 'created_at' | 'updated_at'>) =>
        fetchApi<WelcomeStep>(`/welcome-flow/steps/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    deleteStep: (id: string) => fetchApi<{ deleted: number }>(`/welcome-flow/steps/${id}`, { method: 'DELETE' }),
    runTick: () => fetchApi<{ sent: number }>('/welcome-flow/run-tick', { method: 'POST' }),
    sentLog: (limit = 100) => fetchApi<Array<{ id: string; user_id: string; step_id: string; sent_at: string; success: boolean; error: string | null }>>(`/welcome-flow/sent-log?limit=${limit}`),
};

// ─── Discipleship ───────────────────────────────────────────────────────────
export interface DiscipleshipStage {
    id: string; key: string; title: string; description: string; icon: string;
    cta_label?: string | null; cta_href?: string | null; sort_order: number; is_active: boolean;
}
export const discipleshipApi = {
    publicStages: () => fetchApi<DiscipleshipStage[]>('/discipleship/stages'),
    adminStages: () => fetchApi<DiscipleshipStage[]>('/discipleship/admin/stages'),
    createStage: (body: Omit<DiscipleshipStage, 'id'>) =>
        fetchApi<DiscipleshipStage>('/discipleship/admin/stages', { method: 'POST', body: JSON.stringify(body) }),
    updateStage: (id: string, body: Omit<DiscipleshipStage, 'id'>) =>
        fetchApi<DiscipleshipStage>(`/discipleship/admin/stages/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    deleteStage: (id: string) => fetchApi<{ deleted: number }>(`/discipleship/admin/stages/${id}`, { method: 'DELETE' }),
    myProgress: () => fetchApi<Array<{ stage_id: string; completed_at: string; note: string | null }>>('/discipleship/progress'),
    markComplete: (stage_id: string, note?: string) =>
        fetchApi<{ status: string }>('/discipleship/progress', { method: 'POST', body: JSON.stringify({ stage_id, note }) }),
    unmark: (stage_id: string) => fetchApi<{ status: string }>(`/discipleship/progress/${stage_id}`, { method: 'DELETE' }),
};

// ─── Counselling ────────────────────────────────────────────────────────────
export interface CounsellingAvailability {
    id?: string; pastor_id: string; day_of_week: number;
    start_time: string; end_time: string; slot_minutes: number; is_active: boolean;
}
export interface CounsellingSlot { pastor_id: string; starts_at: string; duration_minutes: number; }
export interface CounsellingBooking {
    id: string; pastor_id: string | null; user_name: string; user_email: string;
    user_phone: string | null; scheduled_at: string; duration_minutes: number;
    topic: string; notes: string | null; status: string; pastor_notes: string | null; created_at: string;
}
export const counsellingApi = {
    listAvailability: () => fetchApi<CounsellingAvailability[]>('/counselling/availability'),
    addAvailability: (b: Omit<CounsellingAvailability, 'id'>) =>
        fetchApi<CounsellingAvailability>('/counselling/availability', { method: 'POST', body: JSON.stringify(b) }),
    updateAvailability: (id: string, b: Omit<CounsellingAvailability, 'id'>) =>
        fetchApi<CounsellingAvailability>(`/counselling/availability/${id}`, { method: 'PUT', body: JSON.stringify(b) }),
    deleteAvailability: (id: string) => fetchApi<{ deleted: number }>(`/counselling/availability/${id}`, { method: 'DELETE' }),
    slots: (days = 14) => fetchApi<CounsellingSlot[]>(`/counselling/slots?days=${days}`),
    book: (b: { pastor_id?: string | null; user_name: string; user_email: string; user_phone?: string; scheduled_at: string; duration_minutes?: number; topic?: string; notes?: string }) =>
        fetchApi<CounsellingBooking>('/counselling/bookings', { method: 'POST', body: JSON.stringify(b) }),
    listBookings: (status?: string) => fetchApi<CounsellingBooking[]>(`/counselling/bookings${status ? `?status=${status}` : ''}`),
    updateBooking: (id: string, b: { status?: string; pastor_notes?: string }) =>
        fetchApi<CounsellingBooking>(`/counselling/bookings/${id}`, { method: 'PUT', body: JSON.stringify(b) }),
    deleteBooking: (id: string) => fetchApi<{ deleted: number }>(`/counselling/bookings/${id}`, { method: 'DELETE' }),
};

// ─── Life Events ────────────────────────────────────────────────────────────
export interface LifeEventRequest {
    id: string; kind: string; requester_name: string; requester_email: string;
    requester_phone: string | null; preferred_date: string; alternate_date: string | null;
    details: any; status: string; admin_notes: string | null; approved_date: string | null;
    certificate_number?: string | null; photo_url?: string | null; created_at: string;
}
export const lifeEventApi = {
    submit: (b: { kind: string; requester_name: string; requester_email: string; requester_phone?: string; preferred_date: string; alternate_date?: string; details?: any }) =>
        fetchApi<LifeEventRequest>('/life-events/', { method: 'POST', body: JSON.stringify(b) }),
    list: (status?: string, kind?: string) => {
        const qs = new URLSearchParams();
        if (status) qs.set('status', status);
        if (kind) qs.set('kind', kind);
        const s = qs.toString();
        return fetchApi<LifeEventRequest[]>(`/life-events/${s ? `?${s}` : ''}`);
    },
    update: (id: string, b: { status?: string; admin_notes?: string; approved_date?: string; photo_url?: string | null }) =>
        fetchApi<LifeEventRequest>(`/life-events/${id}`, { method: 'PUT', body: JSON.stringify(b) }),
    delete: (id: string) => fetchApi<{ deleted: number }>(`/life-events/${id}`, { method: 'DELETE' }),
};

// ─── Payments ───────────────────────────────────────────────────────────────
export interface PaymentProvider {
    id: string; slug: string; name: string; mode: string;
    public_key: string | null; secret_key?: string | null; webhook_secret?: string | null;
    currency: string; config: any; description: string | null;
    is_active?: boolean; sort_order: number;
    created_at?: string; updated_at?: string;
}
export interface Donation {
    id: string; reference: string; provider_id: string | null;
    payer_name: string; payer_email: string | null;
    amount: number; currency: string; fund: string; status: string; message: string | null;
    created_at: string;
}
export const paymentsApi = {
    publicProviders: () => fetchApi<PaymentProvider[]>('/payments/providers/public'),
    listProviders: () => fetchApi<PaymentProvider[]>('/payments/providers'),
    createProvider: (b: Omit<PaymentProvider, 'id' | 'created_at' | 'updated_at'>) =>
        fetchApi<PaymentProvider>('/payments/providers', { method: 'POST', body: JSON.stringify(b) }),
    updateProvider: (id: string, b: Omit<PaymentProvider, 'id' | 'created_at' | 'updated_at'>) =>
        fetchApi<PaymentProvider>(`/payments/providers/${id}`, { method: 'PUT', body: JSON.stringify(b) }),
    deleteProvider: (id: string) => fetchApi<{ deleted: number }>(`/payments/providers/${id}`, { method: 'DELETE' }),
    checkout: (b: { provider_id: string; amount: number; currency?: string; fund?: string; payer_name?: string; payer_email?: string; message?: string; interval?: 'weekly' | 'monthly' | 'yearly' | null }) =>
        fetchApi<{ checkout_url: string | null; reference: string; instructions_md?: string }>('/payments/checkout', { method: 'POST', body: JSON.stringify(b) }),
    // Stripe Customer Portal — recurring donors self-manage (update card, pause, cancel).
    billingPortal: (customer_email: string, return_url?: string) =>
        fetchApi<{ url: string }>('/payments/billing-portal', { method: 'POST', body: JSON.stringify({ customer_email, return_url }) }),
    donations: (status?: string, fund?: string, limit = 200) => {
        const qs = new URLSearchParams({ limit: String(limit) });
        if (status) qs.set('status', status);
        if (fund) qs.set('fund', fund);
        return fetchApi<Donation[]>(`/payments/donations?${qs.toString()}`);
    },
    stats: () => fetchApi<{ by_status: Record<string, { count: number; amount: number }>; by_fund: Array<{ fund: string; count: number; amount: number }> }>('/payments/stats'),
    // Active recurring donors + expected monthly total (admin).
    recurringDonors: () =>
        fetchApi<{
            count: number
            expected_monthly: Array<{ currency: string; amount: number }>
            donors: Array<{ name: string; email: string | null; amount: number; currency: string; interval: string; fund: string; since: string }>
        }>('/payments/recurring'),
    // Year-end giving statements (admin).
    givingStatements: (year: number) =>
        fetchApi<{ year: number; donors: Array<{ email: string | null; name: string; count: number; totals: Array<{ currency: string; amount: number }> }> }>(`/payments/statements?year=${year}`),
    givingStatement: (year: number, opts: { email?: string; name?: string }) => {
        const qs = new URLSearchParams({ year: String(year) })
        if (opts.email) qs.set('email', opts.email)
        else if (opts.name) qs.set('name', opts.name)
        return fetchApi<{
            year: number; donor_name: string; donor_email: string | null; count: number
            items: Array<{ date: string; fund: string; amount: number; currency: string; reference: string; recurring: boolean }>
            by_fund: Array<{ fund: string; currency: string; amount: number }>
            totals: Array<{ currency: string; amount: number }>
        }>(`/payments/statement?${qs.toString()}`)
    },
    lookupByReference: (reference: string) =>
        fetchApi<{ reference: string; payer_name: string; amount: number; currency: string; fund: string; status: string; created_at: string }>(`/payments/donations/by-reference/${encodeURIComponent(reference)}`),
    // The signed-in member's own giving (matched by their account email).
    myGiving: () =>
        fetchApi<{
            year: number | null; count: number; has_recurring?: boolean
            totals: Array<{ currency: string; amount: number }>
            recent: Array<{ date: string; amount: number; currency: string; fund: string; status: string; recurring: boolean }>
        }>('/payments/me/giving'),
};

// ─── Event photo upload (file) ──────────────────────────────────────────────
export interface EventPhoto {
    id: string; event_id: string; image_url: string; thumbnail_url?: string | null;
    caption?: string | null; photographer?: string | null; phase?: string;
    is_cover?: boolean; sort_order?: number; created_at?: string;
}
export const eventPhotoApi = {
    list: (event_id: string) => fetchApi<EventPhoto[]>(`/api/events/${event_id}/photos`.replace('/api', '')),
    upload: async (event_id: string, file: File, caption?: string, phase: string = 'promotional', is_cover = false): Promise<EventPhoto> => {
        const fd = new FormData();
        fd.append('file', file);
        if (caption) fd.append('caption', caption);
        fd.append('phase', phase);
        fd.append('is_cover', String(is_cover));
        const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
        const res = await fetch(`${API_BASE_URL}/events/${event_id}/photos/upload`, {
            method: 'POST', body: fd,
            headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) {
            const t = await res.text().catch(() => '');
            throw new Error(t || `Upload failed (${res.status})`);
        }
        return res.json();
    },
    delete: (event_id: string, photo_id: string) =>
        fetchApi<{ deleted: number }>(`/events/${event_id}/photos/${photo_id}`, { method: 'DELETE' }),
};

// ─── Daily Verse ────────────────────────────────────────────────────────────
export interface DailyVerse {
    id: string; reference: string; text: string;
    translation?: string | null; is_active: boolean; sort_order: number;
}
export interface TodayVerse { id: string; reference: string; text: string; translation: string | null; date: string }
export const dailyVerseApi = {
    today: () => fetchApi<TodayVerse | null>('/daily-verse/today'),
    list: () => fetchApi<DailyVerse[]>('/daily-verse/'),
    create: (b: Omit<DailyVerse, 'id'>) => fetchApi<DailyVerse>('/daily-verse/', { method: 'POST', body: JSON.stringify(b) }),
    update: (id: string, b: Omit<DailyVerse, 'id'>) => fetchApi<DailyVerse>(`/daily-verse/${id}`, { method: 'PUT', body: JSON.stringify(b) }),
    delete: (id: string) => fetchApi<{ deleted: number }>(`/daily-verse/${id}`, { method: 'DELETE' }),
    seedKjv: (force = false) => fetchApi<{ added: number; skipped: number; total_now: number; reason?: string }>(`/daily-verse/seed-kjv${force ? '?force=true' : ''}`, { method: 'POST' }),
};

// ─── Moderators ─────────────────────────────────────────────────────────────
export interface ModeratorScope { key: string; label: string; group: string }
export interface Moderator { user_id: string; email: string; name: string; role: string; scopes: string[] }
export interface MyPermissions { role: string; is_admin: boolean; is_deputy?: boolean; scopes: string[] }
/** The three admin-appointed deputy slots. */
export const DEPUTY_ROLES = ['deputy_admin_1', 'deputy_admin_2', 'deputy_admin_3'] as const
export type DeputyRole = typeof DEPUTY_ROLES[number]
export const DEPUTY_LABEL: Record<string, string> = {
    deputy_admin_1: 'Deputy Admin 1', deputy_admin_2: 'Deputy Admin 2', deputy_admin_3: 'Deputy Admin 3',
}
export const moderatorsApi = {
    scopes: () => fetchApi<{ scopes: ModeratorScope[] }>('/admin/moderators/scopes'),
    me: () => fetchApi<MyPermissions>('/admin/moderators/me'),
    list: () => fetchApi<Moderator[]>('/admin/moderators/'),
    candidates: (q?: string) => fetchApi<Array<{ id: string; email: string; name: string }>>(`/admin/moderators/candidates${q ? `?q=${encodeURIComponent(q)}` : ''}`),
    promote: (user_id: string, scopes: string[], role: string = 'moderator') =>
        fetchApi<Moderator>('/admin/moderators/promote', { method: 'POST', body: JSON.stringify({ user_id, scopes, role }) }),
    setGrants: (user_id: string, scopes: string[]) =>
        fetchApi<Moderator>(`/admin/moderators/${user_id}/grants`, { method: 'PUT', body: JSON.stringify({ scopes }) }),
    demote: (user_id: string) => fetchApi<{ demoted: string }>(`/admin/moderators/${user_id}`, { method: 'DELETE' }),
};

// ─── Governance: Lead Coordinators + Audit Log ─────────────────────────────
export type GroupKind = 'custom_ministry' | 'youth_program' | 'department' | 'volunteer_team'
export interface LeadAssignment {
    id: string; user_id: string; user_name: string; user_email: string;
    group_kind: GroupKind; group_id: string;
    assigned_by_user_id: string | null; assigned_at: string;
}
export interface AuditEntry {
    id: string; actor_user_id: string | null; actor_name: string; actor_email: string | null;
    action: string; target_kind: string | null; target_id: string | null;
    group_kind: string | null; group_id: string | null;
    details: any; ip: string | null; created_at: string;
}
export const governanceApi = {
    listLeads: (group_kind?: GroupKind, group_id?: string) => {
        const qs = new URLSearchParams()
        if (group_kind) qs.set('group_kind', group_kind)
        if (group_id) qs.set('group_id', group_id)
        const s = qs.toString()
        return fetchApi<LeadAssignment[]>(`/governance/leads${s ? `?${s}` : ''}`)
    },
    assignLead: (b: { user_id: string; group_kind: GroupKind; group_id: string }) =>
        fetchApi<LeadAssignment>('/governance/leads', { method: 'POST', body: JSON.stringify(b) }),
    removeLead: (id: string) => fetchApi<{ deleted: number }>(`/governance/leads/${id}`, { method: 'DELETE' }),
    audit: (opts: { group_kind?: string; group_id?: string; actor_user_id?: string; action?: string; limit?: number } = {}) => {
        const qs = new URLSearchParams()
        Object.entries(opts).forEach(([k, v]) => { if (v !== undefined && v !== '') qs.set(k, String(v)) })
        const s = qs.toString()
        return fetchApi<AuditEntry[]>(`/governance/audit${s ? `?${s}` : ''}`)
    },
    logCustom: (b: { action: string; target_kind?: string; target_id?: string; group_kind?: string; group_id?: string; details?: any }) =>
        fetchApi<AuditEntry>('/governance/audit', { method: 'POST', body: JSON.stringify(b) }),
};

// ─── Social auto-poster ─────────────────────────────────────────────────────
export interface SocialTarget {
    id: string; platform: string; display_name: string;
    access_token_masked: string | null; page_id: string | null; account_id: string | null;
    is_active: boolean; auto_post_sermons: boolean; config: any; updated_at: string;
}
export interface SocialPost {
    id: string; platform: string; source_kind: string | null; source_id: string | null;
    message: string; status: string; external_url: string | null; error: string | null;
    posted_at: string | null; created_at: string;
}
export const socialApi = {
    listTargets: () => fetchApi<SocialTarget[]>('/social/targets'),
    upsertTarget: (platform: string, b: { display_name?: string; access_token?: string; page_id?: string; account_id?: string; is_active?: boolean; auto_post_sermons?: boolean; config?: any }) =>
        fetchApi<SocialTarget>(`/social/targets/${platform}`, { method: 'PUT', body: JSON.stringify({ platform, ...b }) }),
    deleteTarget: (platform: string) => fetchApi<{ deleted: number }>(`/social/targets/${platform}`, { method: 'DELETE' }),
    postManual: (b: { message: string; platforms: string[]; media_url?: string }) =>
        fetchApi<{ results: Array<{ platform: string; status: string; external_url?: string; error?: string }> }>('/social/post-manual', { method: 'POST', body: JSON.stringify(b) }),
    postSermon: (sermonId: string) =>
        fetchApi<{ sermon_id: string; results: Array<{ platform: string; status: string; external_url?: string; error?: string }> }>(`/social/post-sermon/${sermonId}`, { method: 'POST' }),
    listPosts: (platform?: string, status?: string) => {
        const qs = new URLSearchParams()
        if (platform) qs.set('platform', platform)
        if (status) qs.set('status', status)
        return fetchApi<SocialPost[]>(`/social/posts${qs.toString() ? `?${qs}` : ''}`)
    },
};

// ─── SEO Meta ───────────────────────────────────────────────────────────────
export interface SeoMeta {
    slug: string; title: string | null; description: string | null;
    og_title: string | null; og_description: string | null; og_image_url: string | null;
    canonical_url: string | null; robots: string | null; keywords: string | null;
    updated_at: string;
}
export const seoApi = {
    list: () => fetchApi<SeoMeta[]>('/seo-meta/'),
    get: (slug: string) => fetchApi<SeoMeta | null>(`/seo-meta/${encodeURIComponent(slug)}`),
    upsert: (slug: string, b: Omit<Partial<SeoMeta>, 'slug' | 'updated_at'>) =>
        fetchApi<SeoMeta>(`/seo-meta/${encodeURIComponent(slug)}`, { method: 'PUT', body: JSON.stringify(b) }),
    delete: (slug: string) => fetchApi<{ deleted: number }>(`/seo-meta/${encodeURIComponent(slug)}`, { method: 'DELETE' }),
};

// ─── Blog ───────────────────────────────────────────────────────────────────
export interface BlogPost {
    id: string; slug: string; title: string; excerpt: string | null;
    body_html: string; hero_image_url: string | null;
    author_user_id: string | null; author_name: string; tags: string | null;
    status: string; published_at: string | null; is_featured: boolean;
    created_at: string; updated_at: string;
}
export const blogApi = {
    publicList: (opts: { q?: string; tag?: string; limit?: number } = {}) => {
        const qs = new URLSearchParams()
        if (opts.q) qs.set('q', opts.q)
        if (opts.tag) qs.set('tag', opts.tag)
        if (opts.limit) qs.set('limit', String(opts.limit))
        return fetchApi<BlogPost[]>(`/blog/posts${qs.toString() ? `?${qs}` : ''}`)
    },
    publicGet: (slug: string) => fetchApi<BlogPost>(`/blog/posts/${encodeURIComponent(slug)}`),
    adminList: (status?: string) => fetchApi<BlogPost[]>(`/blog/admin/posts${status ? `?status=${status}` : ''}`),
    adminGet: (id: string) => fetchApi<BlogPost>(`/blog/admin/posts/${id}`),
    create: (b: Partial<BlogPost>) => fetchApi<BlogPost>('/blog/admin/posts', { method: 'POST', body: JSON.stringify(b) }),
    update: (id: string, b: Partial<BlogPost>) => fetchApi<BlogPost>(`/blog/admin/posts/${id}`, { method: 'PUT', body: JSON.stringify(b) }),
    delete: (id: string) => fetchApi<{ deleted: number }>(`/blog/admin/posts/${id}`, { method: 'DELETE' }),
};

// ─── Evangelism leaflets ─────────────────────────────────────────────────────
export interface Leaflet {
    id: string;
    title: string;
    headline: string;
    subheadline: string | null;
    body_html: string;
    scripture_ref: string | null;
    scripture_text: string | null;
    cta_text: string | null;
    cta_detail: string | null;
    accent_color: string;
    design: string;
    show_watermark: boolean;
    logo_url: string | null;
    image_url: string | null;
    qr_url: string | null;
    qr_caption: string | null;
    layout: string;
    church_name: string;
    contact_phone: string | null;
    contact_website: string | null;
    contact_address: string | null;
    service_times: string | null;
    footer_note: string | null;
    status: string;
    is_public: boolean;
    created_at: string;
    updated_at: string;
}
export const leafletsApi = {
    adminList: () => fetchApi<Leaflet[]>('/evangelism/admin/leaflets'),
    adminGet: (id: string) => fetchApi<Leaflet>(`/evangelism/admin/leaflets/${id}`),
    publicGet: (id: string) => fetchApi<Leaflet>(`/evangelism/leaflets/${id}`),
    create: (b: Partial<Leaflet>) => fetchApi<Leaflet>('/evangelism/admin/leaflets', { method: 'POST', body: JSON.stringify(b) }),
    update: (id: string, b: Partial<Leaflet>) => fetchApi<Leaflet>(`/evangelism/admin/leaflets/${id}`, { method: 'PUT', body: JSON.stringify(b) }),
    delete: (id: string) => fetchApi<{ deleted: number }>(`/evangelism/admin/leaflets/${id}`, { method: 'DELETE' }),
};

// ─── Newsletter ────────────────────────────────────────────────────────────
export const newsletterApi = {
    subscribe: (email: string, source = 'blog', name?: string) =>
        fetchApi<{ message: string }>('/newsletter/subscribe', { method: 'POST', body: JSON.stringify({ email, name, source }) }),
};

// ─── YouTube import (sermons) ──────────────────────────────────────────────
export interface YouTubeMetadata {
    video_id: string; title: string; author: string; author_url: string;
    thumbnail_url: string; canonical_url: string; embed_url: string;
}
export const youtubeApi = {
    import: (url: string) => fetchApi<YouTubeMetadata>('/youtube/import', { method: 'POST', body: JSON.stringify({ url }) }),
};

// ─── Stripe Customer Portal ────────────────────────────────────────────────
export const billingApi = {
    portal: (customer_email: string, return_url?: string) =>
        fetchApi<{ url: string }>('/payments/billing-portal', { method: 'POST', body: JSON.stringify({ customer_email, return_url }) }),
};

// ─── Global search ─────────────────────────────────────────────────────────
export interface SearchHit { id: string; title?: string; preacher?: string; date?: string; url: string; reference?: string; text?: string; translation?: string | null; excerpt?: string }
export interface SearchResults { query: string; total: number; results: { sermons: SearchHit[]; blog: SearchHit[]; events: SearchHit[]; verses: SearchHit[] } }
export const searchApi = {
    query: (q: string, limit = 8) => fetchApi<SearchResults>(`/search/?q=${encodeURIComponent(q)}&limit=${limit}`),
};

// ─── 2FA ───────────────────────────────────────────────────────────────────
export interface BackupEntry {
    name: string; size_bytes: number; created_at: string | null; public_url: string;
}
export const backupsApi = {
    run: () => fetchApi<{ ok: boolean; filename: string; size_bytes: number; size_mb: number; public_url: string; auto_cleaned_old: number; generated_at: string }>('/admin/backups/run', { method: 'POST' }),
    list: () => fetchApi<{ retention_days: number; backups: BackupEntry[] }>('/admin/backups/'),
    delete: (name: string) => fetchApi<{ deleted: boolean; filename: string }>(`/admin/backups/${encodeURIComponent(name)}`, { method: 'DELETE' }),
    cleanup: () => fetchApi<{ deleted: number }>('/admin/backups/cleanup', { method: 'POST' }),
};

// ─── Global Online Campus (#4) ─────────────────────────────────────────────
export interface CurrentService {
    status: 'live' | 'upcoming' | 'none' | 'scheduled';
    id?: string; title?: string; description?: string | null;
    scheduled_at?: string; is_live?: boolean; livestream_url?: string | null;
    chat_enabled?: boolean; altar_call_open?: boolean; raise_hand_enabled?: boolean;
    viewer_count?: number; started_at?: string | null;
}
export const onlineCampusApi = {
    current: () => fetchApi<CurrentService>('/online-campus/current'),
    listServices: () => fetchApi<CurrentService[]>('/online-campus/services'),
    createService: (b: { title: string; scheduled_at: string; description?: string; livestream_url?: string; chat_enabled?: boolean; altar_call_open?: boolean; raise_hand_enabled?: boolean; cover_image_url?: string; youtube_url?: string; facebook_url?: string; instagram_url?: string; twitter_url?: string; tiktok_url?: string }) =>
        fetchApi<CurrentService>('/online-campus/services', { method: 'POST', body: JSON.stringify(b) }),
    updateService: (id: string, b: any) => fetchApi<CurrentService>(`/online-campus/services/${id}`, { method: 'PUT', body: JSON.stringify(b) }),
    deleteService: (id: string) => fetchApi<{ deleted: number }>(`/online-campus/services/${id}`, { method: 'DELETE' }),
    setState: (id: string, b: { is_live?: boolean; altar_call_open?: boolean; raise_hand_enabled?: boolean; viewer_count?: number; livestream_url?: string }) =>
        fetchApi<CurrentService>(`/online-campus/services/${id}/state`, { method: 'POST', body: JSON.stringify(b) }),
    altarCall: (b: { name: string; email?: string; phone?: string; location?: string; kind?: string; note?: string; service_id?: string }) =>
        fetchApi<{ ok: boolean; id: string; message: string }>('/online-campus/altar-call', { method: 'POST', body: JSON.stringify(b) }),
    altarResponses: (pending_only = false) => fetchApi<Array<{ id: string; name: string; email: string | null; phone: string | null; location: string | null; kind: string; note: string | null; followed_up: boolean; followed_up_at: string | null; created_at: string; service_id: string | null }>>(`/online-campus/altar-call/responses${pending_only ? '?pending_only=true' : ''}`),
    markFollowedUp: (rid: string) => fetchApi<{ ok: boolean }>(`/online-campus/altar-call/${rid}/follow-up`, { method: 'PUT' }),
    raiseHand: (b: { display_name?: string; message?: string; service_id?: string }) =>
        fetchApi<{ ok: boolean; id: string; status: string }>('/online-campus/raise-hand', { method: 'POST', body: JSON.stringify(b) }),
    raiseHandQueue: () => fetchApi<Array<{ id: string; display_name: string; message: string | null; status: string; created_at: string }>>('/online-campus/raise-hand/queue'),
    updateRaiseHand: (rid: string, status: 'attending' | 'closed') =>
        fetchApi<{ ok: boolean; status: string }>(`/online-campus/raise-hand/${rid}`, { method: 'PUT', body: JSON.stringify({ status }) }),
    requestCommunion: (b: { name: string; email: string; requested_date: string; timezone?: string; note?: string }) =>
        fetchApi<{ ok: boolean; id: string; message: string }>('/online-campus/communion', { method: 'POST', body: JSON.stringify(b) }),
    listCommunion: (status?: string) => fetchApi<Array<{ id: string; name: string; email: string; requested_date: string; timezone: string | null; note: string | null; status: string; confirmed_datetime: string | null; created_at: string }>>(`/online-campus/communion${status ? `?status=${status}` : ''}`),
    updateCommunion: (cid: string, b: { status: string; confirmed_datetime?: string }) =>
        fetchApi<{ ok: boolean; status: string }>(`/online-campus/communion/${cid}`, { method: 'PUT', body: JSON.stringify(b) }),
};

// ─── AI Features (#2, #3, #8) ──────────────────────────────────────────────
export interface AiStatus { ai_configured: boolean; has_openai: boolean; has_anthropic: boolean }
export interface AiKeys {
    openai_api_key: string | null
    anthropic_api_key: string | null
    env_fallback_openai: boolean
    env_fallback_anthropic: boolean
}
export const aiApi = {
    status: () => fetchApi<AiStatus>('/ai/status'),
    getKeys: () => fetchApi<AiKeys>('/ai/keys'),
    setKeys: (b: { openai_api_key?: string | null; anthropic_api_key?: string | null }) =>
        fetchApi<{ ok: boolean; openai_api_key: string | null; anthropic_api_key: string | null }>('/ai/keys', { method: 'PUT', body: JSON.stringify(b) }),
    translate: (text: string, target_language: string, source_language = 'en') =>
        fetchApi<{ ok: boolean; translated_text: string; target_language: string }>('/ai/translate', { method: 'POST', body: JSON.stringify({ text, target_language, source_language }) }),
    sermonPipeline: (b: { sermon_id?: string; transcript?: string; title?: string; preacher?: string; outputs?: string[] }) =>
        fetchApi<{ ok: boolean; title: string; preacher: string; outputs: Record<string, string> }>('/ai/sermon-pipeline', { method: 'POST', body: JSON.stringify(b) }),
    transcribeAudio: async (file: File, language?: string) => {
        const fd = new FormData()
        fd.append('file', file)
        if (language) fd.append('language', language)
        const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null
        const res = await fetch(`${API_BASE_URL}/ai/transcribe`, { method: 'POST', body: fd, headers: token ? { Authorization: `Bearer ${token}` } : {} })
        if (!res.ok) throw new Error(`Transcribe failed (${res.status}): ${await res.text()}`)
        return res.json() as Promise<{ ok: boolean; transcript: string }>
    },
};

// ─── Kingdom Outcomes (#5) ─────────────────────────────────────────────────
export type DecisionKind = 'salvation' | 'baptism' | 'healing' | 'marriage_restored' | 'prodigal_returned' | 'deliverance' | 'rededication' | 'dedication' | 'calling' | 'other'
export interface DecisionEntry {
    id: string; kind: DecisionKind; person_name: string; location: string | null;
    testimony: string | null; decided_on: string; is_verified: boolean; is_public: boolean;
    show_in_testimony?: boolean;
    created_at: string;
}
export interface DecisionCounts {
    year: number | string; total: number; by_kind: Record<DecisionKind, number>;
}
export const decisionsApi = {
    counts: (year?: number) => fetchApi<DecisionCounts>(`/decisions/counts${year ? `?year=${year}` : ''}`),
    recent: (limit = 12, kind?: DecisionKind) => {
        const qs = new URLSearchParams({ limit: String(limit) })
        if (kind) qs.set('kind', kind)
        return fetchApi<DecisionEntry[]>(`/decisions/recent?${qs.toString()}`)
    },
    submit: (b: { kind: DecisionKind; person_name?: string; person_email?: string; location?: string; notes?: string; testimony?: string; decided_on?: string; is_public?: boolean }) =>
        fetchApi<DecisionEntry>('/decisions/', { method: 'POST', body: JSON.stringify(b) }),
    adminAll: (status?: string, kind?: string) => {
        const qs = new URLSearchParams()
        if (status) qs.set('status', status); if (kind) qs.set('kind', kind)
        return fetchApi<DecisionEntry[]>(`/decisions/admin/all${qs.toString() ? `?${qs}` : ''}`)
    },
    adminBulk: (items: Array<{ kind: DecisionKind; person_name?: string; location?: string; decided_on?: string }>) =>
        fetchApi<{ created: number }>('/decisions/admin/bulk', { method: 'POST', body: JSON.stringify(items) }),
    adminDelete: (id: string) => fetchApi<{ deleted: number }>(`/decisions/admin/${id}`, { method: 'DELETE' }),
    adminUpdate: (id: string, body: Partial<{ kind: DecisionKind; person_name: string; person_email: string; location: string; notes: string; testimony: string; decided_on: string; is_public: boolean; show_in_testimony: boolean }>, is_verified?: boolean) =>
        fetchApi<DecisionEntry>(`/decisions/admin/${id}${is_verified !== undefined ? `?is_verified=${is_verified}` : ''}`, { method: 'PUT', body: JSON.stringify(body) }),
    publicTestimonies: (limit = 50) => fetchApi<DecisionEntry[]>(`/decisions/testimonies?limit=${limit}`),
    publicSubmitTestimony: (b: { name?: string; email?: string; testimony: string }) =>
        fetchApi<{ ok: boolean; message: string }>('/decisions/testimonies/submit', { method: 'POST', body: JSON.stringify(b) }),
};

// ─── Missionary Sponsorship (#6) ───────────────────────────────────────────
export interface Missionary {
    id: string; slug: string; name: string; family_size: number;
    country: string; region: string | null; organisation: string | null;
    ministry_focus: string; bio: string | null; photo_url: string | null;
    monthly_support_goal: number; currency: string;
    is_featured: boolean; sent_date: string | null; prayer_points: string[] | null;
}
export interface MissionaryUpdate {
    id: string; missionary_id: string; title: string; body_html: string;
    hero_image_url: string | null; published_at: string;
}
export interface SupportStats {
    supporter_count: number; monthly_raised: number; monthly_goal: number;
    percent: number; currency: string;
}
export const missionariesApi = {
    list: (featured?: boolean) => fetchApi<Missionary[]>(`/missionaries/${featured ? '?featured=true' : ''}`),
    bySlug: (slug: string) => fetchApi<Missionary>(`/missionaries/by-slug/${encodeURIComponent(slug)}`),
    updates: (slug: string, limit = 10) => fetchApi<MissionaryUpdate[]>(`/missionaries/${encodeURIComponent(slug)}/updates?limit=${limit}`),
    supportStats: (slug: string) => fetchApi<SupportStats>(`/missionaries/${encodeURIComponent(slug)}/support-stats`),
    sponsor: (slug: string, b: { supporter_name: string; supporter_email: string; monthly_amount: number; note?: string }) =>
        fetchApi<{ ok: boolean; id: string; missionary: string; monthly_amount: number; currency: string }>(`/missionaries/${encodeURIComponent(slug)}/sponsor`, { method: 'POST', body: JSON.stringify(b) }),
    adminCreate: (b: Omit<Missionary, 'id' | 'slug'> & { slug?: string }) =>
        fetchApi<Missionary>('/missionaries/admin', { method: 'POST', body: JSON.stringify(b) }),
    adminUpdate: (id: string, b: Partial<Missionary>) =>
        fetchApi<Missionary>(`/missionaries/admin/${id}`, { method: 'PUT', body: JSON.stringify(b) }),
    adminDelete: (id: string) => fetchApi<{ deleted: number }>(`/missionaries/admin/${id}`, { method: 'DELETE' }),
    adminPostUpdate: (id: string, b: { title: string; body_html: string; hero_image_url?: string }) =>
        fetchApi<MissionaryUpdate>(`/missionaries/admin/${id}/updates`, { method: 'POST', body: JSON.stringify(b) }),
};

// ─── Live Prayer / Intercession (#9) ───────────────────────────────────────
export interface IntercessorMe {
    id: string; display_name: string; is_active: boolean;
    is_available_now: boolean; total_prayed_for: number;
}
export const intercessionApi = {
    submitRequest: (b: { text: string; display_name?: string; category?: string; is_anonymous?: boolean }) =>
        fetchApi<{ ok: boolean; request_id: string; assigned_intercessor: string | null; status: string; message: string }>('/intercession/requests', { method: 'POST', body: JSON.stringify(b) }),
    onlineCount: () => fetchApi<{ online: number }>('/intercession/online-count'),
    me: () => fetchApi<IntercessorMe | null>('/intercession/me'),
    toggleAvailable: () => fetchApi<{ is_available_now: boolean }>('/intercession/me/toggle-available', { method: 'POST' }),
    myQueue: () => fetchApi<Array<{ id: string; display_name: string; text: string; category: string | null; status: string; created_at: string; assigned_at: string }>>('/intercession/me/queue'),
    updateStatus: (rid: string, b: { status: 'praying' | 'answered' | 'closed'; answered_testimony?: string }) =>
        fetchApi<{ ok: boolean; status: string }>(`/intercession/requests/${rid}/status`, { method: 'PUT', body: JSON.stringify(b) }),
    adminListIntercessors: () => fetchApi<Array<{ id: string; user_id: string; display_name: string; bio: string | null; languages: string | null; is_active: boolean; is_available_now: boolean; total_prayed_for: number; user_email?: string }>>('/intercession/admin/intercessors'),
    adminSearchCandidates: (q: string) => fetchApi<Array<{ id: string; name: string; email: string }>>(`/intercession/admin/candidates${q ? `?q=${encodeURIComponent(q)}` : ''}`),
    adminResendInvite: (iid: string) => fetchApi<{ ok: boolean; email: string }>(`/intercession/admin/intercessors/${iid}/resend-invite`, { method: 'POST' }),
    adminAddIntercessor: (b: { user_id: string; display_name: string; bio?: string; languages?: string; is_active?: boolean }) =>
        fetchApi<{ id: string }>('/intercession/admin/intercessors', { method: 'POST', body: JSON.stringify(b) }),
    adminRemoveIntercessor: (id: string) => fetchApi<{ deleted: number }>(`/intercession/admin/intercessors/${id}`, { method: 'DELETE' }),
    adminAllRequests: (status?: string) => fetchApi<Array<{ id: string; display_name: string; text: string; is_anonymous: boolean; category: string | null; status: string; intercessor_id: string | null; created_at: string; assigned_at: string | null; closed_at: string | null; answered_testimony: string | null }>>(`/intercession/admin/requests${status ? `?status=${status}` : ''}`),
};

// ── Sunday Automation pipeline ──────────────────────────────────────────────
export interface SundayAutomationOutputs {
    sermon_id: string
    title: string
    preacher: string
    sermon_date: string | null
    transcript: string | null
    auto_notes: string | null
    auto_email_subject: string | null
    auto_email_body: string | null
    auto_blog_draft: string | null
    auto_social_posts: { platform: string; text: string }[]
    auto_chapters: { start_seconds: number; title: string }[]
    auto_generated_at: string | null
    auto_email_sent_at: string | null
}
export const sundayAutomationApi = {
    get: (sermonId: string) => fetchApi<SundayAutomationOutputs>(`/sunday-automation/${sermonId}`),
    chapters: (sermonId: string) => fetchApi<{ chapters: { start_seconds: number; title: string }[] }>(`/sunday-automation/${sermonId}/chapters`),
    run: (sermonId: string, force_transcribe = false) =>
        fetchApi<SundayAutomationOutputs>(`/sunday-automation/${sermonId}/run`, { method: 'POST', body: JSON.stringify({ force_transcribe }) }),
    update: (sermonId: string, body: Partial<Omit<SundayAutomationOutputs, 'sermon_id' | 'title' | 'preacher' | 'sermon_date' | 'auto_generated_at' | 'auto_email_sent_at'>>) =>
        fetchApi<SundayAutomationOutputs>(`/sunday-automation/${sermonId}`, { method: 'PUT', body: JSON.stringify(body) }),
    sendEmail: (sermonId: string) =>
        fetchApi<{ sent: number; failed: number; total: number }>(`/sunday-automation/${sermonId}/send-email`, { method: 'POST' }),
}

// ── Sanctuary / hall booking ────────────────────────────────────────────────
export interface SanctuaryRoom {
    id: string; name: string; description: string | null
    capacity: number; location: string | null; image_url: string | null
    equipment: string[]; rate_note: string | null
    price: number; currency: string
    is_active: boolean; sort_order: number
}
export interface SanctuaryBooking {
    id: string; room_id: string; purpose: string
    contact_name: string; contact_email: string; contact_phone: string | null
    starts_at: string; ends_at: string; attendees: number; note: string | null
    status: 'requested' | 'approved' | 'declined' | 'cancelled'
    admin_note: string | null
    amount: number; currency: string
    payment_status: 'unpaid' | 'paid' | 'waived'
    payment_reference: string | null; paid_at: string | null
    created_at: string
}
export const sanctuaryApi = {
    rooms: () => fetchApi<SanctuaryRoom[]>('/sanctuary/rooms'),
    availability: (room_id: string) =>
        fetchApi<{ id: string; starts_at: string; ends_at: string; purpose: string }[]>(`/sanctuary/availability?room_id=${encodeURIComponent(room_id)}`),
    requestBooking: (b: Omit<SanctuaryBooking, 'id' | 'status' | 'admin_note' | 'created_at' | 'amount' | 'currency' | 'payment_status' | 'payment_reference' | 'paid_at'>) =>
        fetchApi<SanctuaryBooking>('/sanctuary/bookings', { method: 'POST', body: JSON.stringify(b) }),
    // admin
    createRoom: (b: Omit<SanctuaryRoom, 'id'>) =>
        fetchApi<SanctuaryRoom>('/sanctuary/rooms', { method: 'POST', body: JSON.stringify(b) }),
    updateRoom: (id: string, b: Omit<SanctuaryRoom, 'id'>) =>
        fetchApi<SanctuaryRoom>(`/sanctuary/rooms/${id}`, { method: 'PUT', body: JSON.stringify(b) }),
    deleteRoom: (id: string) => fetchApi<{ deleted: number }>(`/sanctuary/rooms/${id}`, { method: 'DELETE' }),
    listBookings: (status?: string) =>
        fetchApi<SanctuaryBooking[]>(`/sanctuary/admin/bookings${status ? `?status=${encodeURIComponent(status)}` : ''}`),
    updateBooking: (id: string, b: { status?: SanctuaryBooking['status']; admin_note?: string; payment_status?: SanctuaryBooking['payment_status'] }) =>
        fetchApi<SanctuaryBooking>(`/sanctuary/admin/bookings/${id}`, { method: 'PUT', body: JSON.stringify(b) }),
    // Link a payment reference to a booking (after starting checkout).
    attachPayment: (id: string, reference: string) =>
        fetchApi<{ ok: boolean }>(`/sanctuary/bookings/${id}/attach-payment`, { method: 'POST', body: JSON.stringify({ reference }) }),
    bookingPaymentStatus: (id: string) =>
        fetchApi<{ payment_status: string; amount: number; currency: string }>(`/sanctuary/bookings/${id}/payment-status`),
    // Permission letter (approved bookings only) — capability link by booking id.
    permissionLetter: (id: string) =>
        fetchApi<SanctuaryPermissionLetter>(`/sanctuary/bookings/${id}/letter`),
    letterQrUrl: (id: string) => `${API_BASE_URL}/sanctuary/bookings/${id}/letter/qr.svg`,
    verifyLetter: (id: string, sig: string) =>
        fetchApi<SanctuaryLetterVerify>(`/sanctuary/verify/${id}?sig=${encodeURIComponent(sig)}`),
}

export interface SanctuaryPermissionLetter {
    id: string; reference: string; room_name: string; room_location: string | null
    purpose: string; contact_name: string; attendees: number
    starts_at: string; ends_at: string; admin_note: string | null; issued_at: string
    secretary_name: string; secretary_title: string; secretary_signature_image: string
    pastor_name: string; pastor_title: string; pastor_signature_image: string
    seal_image: string
    watermark_image: string; letter_intro: string
    fingerprint: string; verify_url: string
}
export interface SanctuaryLetterVerify {
    valid: boolean; reason?: string
    reference?: string; room_name?: string; purpose?: string; contact_name?: string
    starts_at?: string; ends_at?: string; fingerprint?: string; issuer?: string
}

// ── Marriage Prep ───────────────────────────────────────────────────────────
export interface MarriagePrepModuleResource {
    id: string; module_id: string; title: string; kind: 'url' | 'file' | 'video'
    external_url: string | null
    file_name: string | null; file_mime_type: string | null; file_size: number | null
}

// Converts a plain YouTube/Vimeo link into its embeddable iframe URL. Falls
// back to the original URL for anything else (or an unparseable string) so
// the caller can still link out instead of embedding.
export function toVideoEmbedUrl(url: string): string {
    try {
        const u = new URL(url)
        if (u.hostname.includes('youtu.be')) {
            return `https://www.youtube.com/embed/${u.pathname.slice(1)}`
        }
        if (u.hostname.includes('youtube.com')) {
            if (u.pathname.startsWith('/embed/')) return url
            const id = u.searchParams.get('v') || u.pathname.split('/').filter(Boolean).pop()
            return id ? `https://www.youtube.com/embed/${id}` : url
        }
        if (u.hostname.includes('vimeo.com')) {
            if (u.hostname.includes('player.vimeo.com')) return url
            const id = u.pathname.split('/').filter(Boolean).pop()
            return id ? `https://player.vimeo.com/video/${id}` : url
        }
        return url
    } catch {
        return url
    }
}
export interface MarriagePrepModule {
    id: string; week_number: number; title: string
    summary: string | null; body_html: string | null
    scripture: string | null; homework: string | null; is_published: boolean
    resources?: MarriagePrepModuleResource[]
}
export interface MarriagePrepCouple {
    id: string; partner_a_name: string; partner_a_email: string
    partner_b_name: string; partner_b_email: string | null
    intended_wedding_date: string | null
    assigned_pastor_user_id: string | null
    status: 'enrolled' | 'in_progress' | 'completed' | 'withdrew'
    pastor_signed_off: boolean; pastor_signed_at: string | null
    pastor_signature: string | null; pastor_note: string | null
    assigned_pastor_name?: string | null
    session_at?: string | null; session_note?: string | null
    certificate_number?: string | null
    photo_url?: string | null
    marriage_date?: string | null
    marriage_venue?: string | null
    officiant_name?: string | null
    witness_1?: string | null
    witness_2?: string | null
    created_at: string
}
export interface MarriagePrepPastor { id: string; name: string; email: string; role?: string }
export const marriagePrepApi = {
    modules: () => fetchApi<MarriagePrepModule[]>('/marriage-prep/modules'),
    enrol: (b: Omit<MarriagePrepCouple, 'id' | 'assigned_pastor_user_id' | 'status' | 'pastor_signed_off' | 'pastor_signed_at' | 'pastor_signature' | 'pastor_note' | 'created_at'>) =>
        fetchApi<MarriagePrepCouple>('/marriage-prep/enrol', { method: 'POST', body: JSON.stringify(b) }),
    logProgress: (couple_id: string, module_id: string, reflections: string, completed: boolean) =>
        fetchApi<unknown>('/marriage-prep/progress', { method: 'POST', body: JSON.stringify({ couple_id, module_id, reflections, completed }) }),
    coupleProgress: (couple_id: string) =>
        fetchApi<{ id: string; couple_id: string; module_id: string; completed_at: string | null; reflections: string | null }[]>(`/marriage-prep/couples/${couple_id}/progress`),
    getCouple: (couple_id: string) =>
        fetchApi<{ id: string; partner_a_name: string; partner_b_name: string; intended_wedding_date: string | null; status: string; pastor_signed_off: boolean; assigned_pastor_name?: string | null; session_at?: string | null; session_note?: string | null }>(`/marriage-prep/couples/${couple_id}`),
    // Public certificate — used by /marriage-prep/complete/{id}. Returns
    // 404 until the pastor has signed off; couple id (UUID) is the only auth.
    certificate: (couple_id: string) =>
        fetchApi<{ id: string; partner_a_name: string; partner_b_name: string; wedding_date: string | null; pastor_signature: string | null; pastor_signed_at: string | null; status: string; signature: string; fingerprint: string; verify_url: string }>(`/marriage-prep/certificate/${couple_id}`),
    // QR chip image for the printed certificate (SVG scales crisply in print).
    certificateQrUrl: (couple_id: string) => `${API_BASE_URL}/marriage-prep/certificate/${couple_id}/qr.svg`,
    // Public verification — what the QR code lands on. Constant-time HMAC
    // check server-side; forged/altered certs come back valid=false.
    verifyCert: (couple_id: string, sig: string) =>
        fetchApi<{ valid: boolean; reason?: string; partner_a_name?: string; partner_b_name?: string; pastor_signature?: string | null; pastor_signed_at?: string | null; wedding_date?: string | null; fingerprint?: string; issuer?: string }>(`/marriage-prep/verify/${couple_id}?sig=${encodeURIComponent(sig)}`),
    // admin
    createModule: (b: Omit<MarriagePrepModule, 'id' | 'resources'>) =>
        fetchApi<MarriagePrepModule>('/marriage-prep/admin/modules', { method: 'POST', body: JSON.stringify(b) }),
    updateModule: (id: string, b: Omit<MarriagePrepModule, 'id' | 'resources'>) =>
        fetchApi<MarriagePrepModule>(`/marriage-prep/admin/modules/${id}`, { method: 'PUT', body: JSON.stringify(b) }),
    deleteModule: (id: string) => fetchApi<{ deleted: number }>(`/marriage-prep/admin/modules/${id}`, { method: 'DELETE' }),
    // Per-module resources — a link, or an uploaded PDF/Word doc/any file.
    // Raw fetch (not fetchApi) for the multipart calls so the browser sets
    // its own Content-Type boundary — same pattern as sermons file uploads.
    addModuleResourceUrl: async (moduleId: string, title: string, externalUrl: string): Promise<MarriagePrepModuleResource> => {
        const fd = new FormData()
        fd.append('title', title)
        fd.append('external_url', externalUrl)
        const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null
        const res = await fetch(`${API_BASE_URL}/marriage-prep/admin/modules/${moduleId}/resources/url`, {
            method: 'POST', headers: token ? { Authorization: `Bearer ${token}` } : {}, body: fd,
        })
        if (!res.ok) throw new Error((await res.json().catch(() => ({}))).detail || 'Failed to add link')
        return res.json()
    },
    addModuleResourceVideo: async (moduleId: string, title: string, videoUrl: string): Promise<MarriagePrepModuleResource> => {
        const fd = new FormData()
        fd.append('title', title)
        fd.append('video_url', videoUrl)
        const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null
        const res = await fetch(`${API_BASE_URL}/marriage-prep/admin/modules/${moduleId}/resources/video`, {
            method: 'POST', headers: token ? { Authorization: `Bearer ${token}` } : {}, body: fd,
        })
        if (!res.ok) throw new Error((await res.json().catch(() => ({}))).detail || 'Failed to add video')
        return res.json()
    },
    addModuleResourceFile: async (moduleId: string, title: string, file: File): Promise<MarriagePrepModuleResource> => {
        const fd = new FormData()
        fd.append('title', title)
        fd.append('file', file)
        const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null
        const res = await fetch(`${API_BASE_URL}/marriage-prep/admin/modules/${moduleId}/resources/file`, {
            method: 'POST', headers: token ? { Authorization: `Bearer ${token}` } : {}, body: fd,
        })
        if (!res.ok) throw new Error((await res.json().catch(() => ({}))).detail || 'Failed to upload file')
        return res.json()
    },
    deleteModuleResource: (resourceId: string) =>
        fetchApi<{ deleted: number }>(`/marriage-prep/admin/modules/resources/${resourceId}`, { method: 'DELETE' }),
    moduleResourceFileUrl: (resourceId: string) => `${API_BASE_URL}/marriage-prep/modules/resources/${resourceId}/file`,
    listCouples: (status?: string) =>
        fetchApi<MarriagePrepCouple[]>(`/marriage-prep/admin/couples${status ? `?status=${encodeURIComponent(status)}` : ''}`),
    signOff: (couple_id: string, pastor_signature: string, pastor_note?: string) =>
        fetchApi<MarriagePrepCouple>(`/marriage-prep/admin/couples/${couple_id}/sign-off`, { method: 'POST', body: JSON.stringify({ pastor_signature, pastor_note }) }),
    updateCouple: (couple_id: string, body: Partial<Pick<MarriagePrepCouple,
        'partner_a_name' | 'partner_a_email' | 'partner_b_name' | 'partner_b_email' |
        'intended_wedding_date' | 'status' | 'pastor_signature' | 'pastor_note' | 'photo_url' |
        'marriage_date' | 'marriage_venue' | 'officiant_name' | 'witness_1' | 'witness_2'>>) =>
        fetchApi<MarriagePrepCouple>(`/marriage-prep/admin/couples/${couple_id}`, { method: 'PUT', body: JSON.stringify(body) }),
    deleteCouple: (couple_id: string) =>
        fetchApi<{ deleted: number }>(`/marriage-prep/admin/couples/${couple_id}`, { method: 'DELETE' }),
    // Pastor proposes a session time (or clears it with session_at=null); both
    // partners are emailed a calendar invite with their video-room link.
    scheduleSession: (couple_id: string, session_at: string | null, note?: string) =>
        fetchApi<MarriagePrepCouple>(`/marriage-prep/admin/couples/${couple_id}/schedule`, { method: 'POST', body: JSON.stringify({ session_at, note: note || null }) }),
    // Assignable pastors (admins/moderators) + assign one to a couple (null clears).
    listPastors: (q?: string) => fetchApi<MarriagePrepPastor[]>(`/marriage-prep/admin/pastors${q && q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ''}`),
    assignPastor: (couple_id: string, pastor_user_id: string | null) =>
        fetchApi<MarriagePrepCouple>(`/marriage-prep/admin/couples/${couple_id}/assign-pastor`, { method: 'POST', body: JSON.stringify({ pastor_user_id }) }),
    // Re-send the completion email (certificate link + next steps) to both partners.
    resendCertificate: (couple_id: string) =>
        fetchApi<{ ok: boolean; emails_sent: number; certificate_url: string }>(`/marriage-prep/admin/couples/${couple_id}/resend-certificate`, { method: 'POST' }),
    // Counsellor portal — the assigned (non-admin) counsellor's own couples.
    counsellorCouples: () => fetchApi<MarriagePrepCouple[]>('/marriage-prep/counsellor/couples'),
    counsellorSchedule: (couple_id: string, session_at: string | null, note?: string) =>
        fetchApi<MarriagePrepCouple>(`/marriage-prep/counsellor/couples/${couple_id}/schedule`, { method: 'POST', body: JSON.stringify({ session_at, note: note || null }) }),
}

// ─── SMS provider config (admin) ─────────────────────────────────────────────
export interface SmsProvider {
    id: string; provider: 'termii' | 'twilio' | 'africastalking' | 'custom'; name: string
    api_key: string | null; api_secret: string | null; sender_id: string | null
    base_url: string | null; config: Record<string, any>; is_active: boolean
    created_at?: string | null
}
export const smsApi = {
    status: () => fetchApi<{ configured: boolean; provider: string | null; sender_id: string | null }>('/sms/status'),
    list: () => fetchApi<SmsProvider[]>('/sms/providers'),
    create: (b: Omit<SmsProvider, 'id' | 'created_at'>) =>
        fetchApi<SmsProvider>('/sms/providers', { method: 'POST', body: JSON.stringify(b) }),
    update: (id: string, b: Omit<SmsProvider, 'id' | 'created_at'>) =>
        fetchApi<SmsProvider>(`/sms/providers/${id}`, { method: 'PUT', body: JSON.stringify(b) }),
    remove: (id: string) => fetchApi<{ deleted: number }>(`/sms/providers/${id}`, { method: 'DELETE' }),
    test: (to: string, message?: string) =>
        fetchApi<{ sent: boolean; detail: string }>('/sms/test', { method: 'POST', body: JSON.stringify({ to, ...(message ? { message } : {}) }) }),
    audience: (status?: 'all' | 'active') =>
        fetchApi<{ count: number }>(`/sms/audience${status === 'active' ? '?status=active' : ''}`),
    broadcast: (message: string, audience: 'all' | 'active') =>
        fetchApi<{ recipients: number; sent: number; failed: number }>('/sms/broadcast', { method: 'POST', body: JSON.stringify({ message, audience }) }),
}

// ─── Partner integrations (admin) ────────────────────────────────────────────
// ─── Analytics Command Center ────────────────────────────────────────────────
export interface SeriesPoint { month: string; value: number }
export interface LabelValue { label: string; value: number }
export interface AnalyticsOverview {
    generated_at: string
    kpis: Record<string, number | { currency: string; total: number; count: number }[]>
    series: Record<string, SeriesPoint[]>
    breakdowns: Record<string, LabelValue[] | { fund: string; currency: string; total: number; count: number }[]>
    highlights: string[]
    _errors: string[]
}
export interface MinistryRow {
    id: string; name: string; slug: string; category: string; is_active: boolean
    active_members: number; pending_members: number; total_requests: number
    coordinators: number; series: SeriesPoint[]
}
export const analyticsApi = {
    overview: () => fetchApi<AnalyticsOverview>('/analytics/overview'),
    insight: () => fetchApi<{ source: string; text: string; highlights: string[] }>('/analytics/insight'),
    ministries: () => fetchApi<{ generated_at: string; ministries: MinistryRow[] }>('/analytics/ministries'),
}

// ─── Theology School ─────────────────────────────────────────────────────────
export interface TheologyProgram {
    id: string; name: string; slug: string; summary: string | null; description: string | null
    level: string; duration_months: number; tuition_amount: number; currency: string
    is_open: boolean; capacity: number | null; sort_order: number; lms_course_code: string | null; program_code: string | null
}
export interface TheologyApplication {
    id: string; program_id: string; program_name: string | null
    full_name: string; email: string; phone: string | null
    education_level: string | null; photo_url: string | null
    status: string; amount_paid: number | null; currency: string | null; paid_at: string | null
    admission_number: string | null; admission_issued_at: string | null; accepted_at: string | null
    student_user_id: string | null; lms_status: string | null; lms_enrolled_at: string | null
    lms_error: string | null; student_id_number: string | null; student_id_card_url: string | null
    created_at: string | null
}
export interface TheologyOffer {
    full_name: string; email: string; admission_number: string; program_name: string | null
    duration_months: number | null; level: string | null; issued_at: string | null
    status: string; accepted_at: string | null; portal_url: string
}
export const theologyApi = {
    programs: () => fetchApi<TheologyProgram[]>('/theology/programs'),
    apply: (b: Record<string, unknown>) =>
        fetchApi<{ application_id: string; status: string; amount_due: number; currency: string; program_name: string }>(
            '/theology/apply', { method: 'POST', body: JSON.stringify(b) }),
    confirmPayment: (appId: string, reference: string) =>
        fetchApi<{ status: string; admission_number: string; offer_url: string }>(
            `/theology/applications/${appId}/confirm-payment`, { method: 'POST', body: JSON.stringify({ reference }) }),
    providers: () => fetchApi<Array<{ id: string; slug: string; name: string; currency: string }>>('/theology/payment-providers'),
    checkout: (appId: string, provider_id: string) =>
        fetchApi<{ checkout_url: string; reference: string; amount: number; currency: string; already_paid?: boolean }>(
            `/theology/applications/${appId}/checkout`, { method: 'POST', body: JSON.stringify({ provider_id }) }),
    offer: (token: string) => fetchApi<TheologyOffer>(`/theology/offer/${token}`),
    accept: (token: string) => fetchApi<{ status: string; login_email: string; portal_url: string; temporary_password_sent: boolean }>(
        `/theology/offer/${token}/accept`, { method: 'POST' }),
    decline: (token: string) => fetchApi<{ status: string }>(`/theology/offer/${token}/decline`, { method: 'POST' }),
    myRecords: () => fetchApi<{ records: TheologyApplication[]; classroom_url: string }>('/theology/student/me'),
    // admin
    adminPrograms: () => fetchApi<TheologyProgram[]>('/theology/admin/programs'),
    importPrograms: () => fetchApi<{ imported: number; names: string[]; note: string }>('/theology/admin/programs/import', { method: 'POST' }),
    createProgram: (b: Partial<TheologyProgram>) => fetchApi<TheologyProgram>('/theology/admin/programs', { method: 'POST', body: JSON.stringify(b) }),
    updateProgram: (id: string, b: Partial<TheologyProgram>) => fetchApi<TheologyProgram>(`/theology/admin/programs/${id}`, { method: 'PUT', body: JSON.stringify(b) }),
    deleteProgram: (id: string) => fetchApi<{ deleted: number }>(`/theology/admin/programs/${id}`, { method: 'DELETE' }),
    adminApplications: (status?: string) => fetchApi<TheologyApplication[]>(`/theology/admin/applications${status ? `?status=${status}` : ''}`),
    markPaid: (id: string) => fetchApi<TheologyApplication>(`/theology/admin/applications/${id}/mark-paid`, { method: 'POST' }),
    retryProvisioning: (id: string) => fetchApi<TheologyApplication>(`/theology/admin/applications/${id}/retry-provisioning`, { method: 'POST' }),
    resetAccess: (id: string) => fetchApi<{ ok: boolean; email: string }>(`/theology/admin/applications/${id}/reset-access`, { method: 'POST' }),
}

export interface IntegrationTargets {
    sharepoints_webhook_url: string; marriage_office_email: string
    baptism_webhook_url: string; baptism_office_email: string
}
export interface SharepointsTest {
    ok: boolean; reason?: string; service?: string; status?: string
    capabilities?: string[]; endpoints?: Record<string, string>
}
export const integrationsApi = {
    getSettings: () => fetchApi<{
        configured: boolean; key_preview: string; lookup_url: string; marriage_seal_url: string
        student_webhook_url: string; lms_base_url: string; lms_enrol_path: string
        lms_key_set: boolean; theology_intake_default: string; handshake_url: string
    } & IntegrationTargets>('/integrations/admin/settings'),
    testSharepoints: () => fetchApi<SharepointsTest>('/integrations/admin/test-sharepoints'),
    saveTheologyAndLms: (b: { student_webhook_url?: string; lms_base_url?: string; lms_api_key?: string; lms_enrol_path?: string }) =>
        fetchApi<{ ok: boolean }>('/integrations/admin/settings', { method: 'PUT', body: JSON.stringify(b) }),
    setKey: (sharepoints_api_key: string) =>
        fetchApi<{ ok: boolean }>('/integrations/admin/settings', { method: 'PUT', body: JSON.stringify({ sharepoints_api_key }) }),
    saveTargets: (t: IntegrationTargets) =>
        fetchApi<{ ok: boolean }>('/integrations/admin/settings', { method: 'PUT', body: JSON.stringify(t) }),
    saveSeal: (marriage_seal_url: string) =>
        fetchApi<{ ok: boolean }>('/integrations/admin/settings', { method: 'PUT', body: JSON.stringify({ marriage_seal_url }) }),
    generateKey: () => fetchApi<{ sharepoints_api_key: string }>('/integrations/admin/settings/generate', { method: 'POST' }),
}

// ─── Email delivery diagnostics (admin) ──────────────────────────────────────
export const emailAdminApi = {
    status: () => fetchApi<{ email_enabled: boolean; provider: string; from_name: string; from_address: string; smtp_host: string | null; resend_configured: boolean }>('/admin/email/status'),
    test: (to: string) => fetchApi<{ sent: boolean; provider: string; note?: string | null; error?: string }>('/admin/email/test', { method: 'POST', body: JSON.stringify({ to }) }),
}

// ── Fasting calendar ────────────────────────────────────────────────────────
export interface Fast {
    id: string; title: string; description: string | null
    kind: 'full' | 'daniel' | 'partial' | 'media'
    start_date: string; end_date: string
    scripture_focus: string | null
    prayer_prompts: string[]
    is_published: boolean
    total_days: number
    current_day: number | null
    status: 'upcoming' | 'active' | 'completed'
}
export const fastingApi = {
    list: () => fetchApi<Fast[]>('/fasting/'),
    checkin: (b: { fast_id: string; participant_key: string; display_name?: string; note?: string }) =>
        fetchApi<{ ok: boolean; day_number: number; already: boolean }>('/fasting/checkin', { method: 'POST', body: JSON.stringify(b) }),
    myCheckins: (fast_id: string, participant_key: string) =>
        fetchApi<{ days: number[] }>(`/fasting/${fast_id}/my-checkins?participant_key=${encodeURIComponent(participant_key)}`),
    stats: (fast_id: string) =>
        fetchApi<{ participants: number; checked_in_today: number }>(`/fasting/${fast_id}/stats`),
    // admin
    adminList: () => fetchApi<Fast[]>('/fasting/admin/all'),
    create: (b: Omit<Fast, 'id' | 'total_days' | 'current_day' | 'status'>) =>
        fetchApi<Fast>('/fasting/admin', { method: 'POST', body: JSON.stringify(b) }),
    update: (id: string, b: Omit<Fast, 'id' | 'total_days' | 'current_day' | 'status'>) =>
        fetchApi<Fast>(`/fasting/admin/${id}`, { method: 'PUT', body: JSON.stringify(b) }),
    remove: (id: string) => fetchApi<{ deleted: number }>(`/fasting/admin/${id}`, { method: 'DELETE' }),
}

// ── Volunteer rota ──────────────────────────────────────────────────────────
export interface RotaTeam {
    id: string; name: string; description: string | null
    is_active: boolean; sort_order: number
}
export interface RotaAssignment {
    id: string; team_id: string; service_date: string
    member_name: string; member_email: string | null
    role_note: string | null
    status: 'assigned' | 'confirmed' | 'declined'
    created_at: string
}
export const rotaApi = {
    teams: () => fetchApi<RotaTeam[]>('/rota/teams'),
    createTeam: (b: Omit<RotaTeam, 'id'>) =>
        fetchApi<RotaTeam>('/rota/teams', { method: 'POST', body: JSON.stringify(b) }),
    updateTeam: (id: string, b: Omit<RotaTeam, 'id'>) =>
        fetchApi<RotaTeam>(`/rota/teams/${id}`, { method: 'PUT', body: JSON.stringify(b) }),
    deleteTeam: (id: string) => fetchApi<{ deleted: number }>(`/rota/teams/${id}`, { method: 'DELETE' }),
    assignments: (params?: { from_date?: string; to_date?: string; team_id?: string }) => {
        const qs = new URLSearchParams()
        Object.entries(params || {}).forEach(([k, v]) => { if (v) qs.set(k, v) })
        const s = qs.toString()
        return fetchApi<RotaAssignment[]>(`/rota/assignments${s ? `?${s}` : ''}`)
    },
    assign: (b: { team_id: string; service_date: string; member_name: string; member_email?: string; role_note?: string }) =>
        fetchApi<RotaAssignment>('/rota/assignments', { method: 'POST', body: JSON.stringify(b) }),
    updateAssignment: (id: string, b: Partial<Pick<RotaAssignment, 'status' | 'role_note' | 'member_name' | 'member_email' | 'service_date'>>) =>
        fetchApi<RotaAssignment>(`/rota/assignments/${id}`, { method: 'PUT', body: JSON.stringify(b) }),
    deleteAssignment: (id: string) => fetchApi<{ deleted: number }>(`/rota/assignments/${id}`, { method: 'DELETE' }),
}

// ── Live Attendance (anonymous heartbeat) ───────────────────────────────────
export interface AttendanceSnapshot {
    total: number
    countries: { code: string; count: number }[]
    continents: Record<string, number>
}
export const liveAttendanceApi = {
    heartbeat: (session_id?: string) =>
        fetchApi<AttendanceSnapshot & { session_id: string }>('/live-attendance/heartbeat', { method: 'POST', body: JSON.stringify({ session_id }) }),
    snapshot: () => fetchApi<AttendanceSnapshot>('/live-attendance/snapshot'),
}

// ── Multi-language UI translations ──────────────────────────────────────────
export const translationsApi = {
    locales: () => fetchApi<{ locales: string[] }>('/translations/locales'),
    get: (locale: string) => fetchApi<{ locale: string; translations: Record<string, string> }>(`/translations/${locale}`),
    update: (locale: string, translations: Record<string, string>) =>
        fetchApi<{ locale: string; translations: Record<string, string> }>(`/translations/${locale}`, { method: 'PUT', body: JSON.stringify({ translations }) }),
}

export const twoFactorApi = {
    status: () => fetchApi<{ enabled: boolean; verified: boolean; last_used_at: string | null }>('/2fa/status'),
    setup: () => fetchApi<{ secret: string; otpauth_uri: string; qr_png_base64: string }>('/2fa/setup', { method: 'POST' }),
    verify: (code: string) => fetchApi<{ verified: boolean; recovery_codes: string[]; message: string }>('/2fa/verify', { method: 'POST', body: JSON.stringify({ code }) }),
    disable: (code: string) => fetchApi<{ disabled: boolean }>('/2fa/disable', { method: 'POST', body: JSON.stringify({ code }) }),
};
