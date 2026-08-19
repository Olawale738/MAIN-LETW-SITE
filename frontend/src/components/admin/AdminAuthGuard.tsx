'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { authApi, tokenManager } from '@/lib/api'
import { Loader2 } from 'lucide-react'

interface AdminAuthGuardProps {
    children: React.ReactNode
}

export default function AdminAuthGuard({ children }: AdminAuthGuardProps) {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(true)
    const [isAuthorized, setIsAuthorized] = useState(false)

    useEffect(() => {
        const checkAuth = async () => {
            // Check if logged in (client-side only)
            const token = tokenManager.getAccessToken()
            if (!token) {
                window.location.href = '/auth/login'
                return
            }

            try {
                // Admins, moderators and deputy admins may open the dashboard.
                // What they can SEE inside is filtered per-scope by the sidebar,
                // and enforced server-side by require_scope on each endpoint.
                const user = await authApi.getCurrentUser()
                const allowed = ['admin', 'moderator', 'deputy_admin_1', 'deputy_admin_2', 'deputy_admin_3']
                if (!user.role || !allowed.includes(user.role)) {
                    // Signed in but not staff — send them to their own dashboard.
                    // (Do NOT clear tokens: they have a valid member session.)
                    window.location.href = '/dashboard'
                    return
                }

                setIsAuthorized(true)
            } catch (error) {
                console.error('Auth check failed:', error)
                tokenManager.clearTokens()
                window.location.href = '/auth/login'
            } finally {
                setIsLoading(false)
            }
        }

        checkAuth()
    }, [])

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-10 h-10 animate-spin text-[#140152]" />
                    <p className="text-gray-500">Verifying access...</p>
                </div>
            </div>
        )
    }

    if (!isAuthorized) {
        return null
    }

    return <>{children}</>
}
