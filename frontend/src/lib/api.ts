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
    created_at: string;
}

export interface MessageResponse {
    message: string;
    success: boolean;
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

    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...options.headers,
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
