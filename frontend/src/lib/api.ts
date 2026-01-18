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
    submitRequests: async (services: string[]): Promise<MessageResponse> => {
        return fetchApi<MessageResponse>('/service-requests', {
            method: 'POST',
            body: JSON.stringify({ services }),
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

