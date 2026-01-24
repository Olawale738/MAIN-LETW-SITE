/**
 * API client for backend communication.
 * Handles authentication and API calls.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

// ============= Types =============

export interface RegisterRequest {
    name: string;
    email: string;
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

class ApiError extends Error {
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

    const response = await fetch(url, {
        ...options,
        headers,
    });

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

    return response.json();
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

export type ServiceRequestStatus = 'pending' | 'approved' | 'rejected';

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
    status: string;
    role: string;
    created_at: string;
    services: string[];
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
    hero_title: string;
    hero_subtitle: string;
    hero_description: string;
    hero_image_url?: string;
    scripture_text: string;
    scripture_reference: string;
    call_to_action_text: string;
    live_prayer_link?: string;
    updated_at: string;
}

export interface PrayerPageData {
    settings: PrayerPageSettings;
    categories: PrayerCategory[];
    schedules: PrayerSchedule[];
    stats: PrayerStat[];
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
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
                body: formData,
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || 'Failed to create track');
            }

            return response.json();
        },

        updateTrack: async (id: string, data: Partial<AudioTrackCreate>): Promise<AudioTrack> => {
            return fetchApi<AudioTrack>(`/alter-sound/admin/tracks/${id}`, {
                method: 'PUT',
                body: JSON.stringify(data),
            });
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

export interface BibleStudyPageSettings {
    id: string;
    hero_title: string;
    hero_subtitle: string;
    hero_description: string;
    hero_background_url?: string;
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
    plan: BibleReadingPlan;
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
};
