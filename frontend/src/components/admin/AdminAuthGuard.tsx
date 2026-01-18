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
                // Verify user is admin via API
                const user = await authApi.getCurrentUser()
                if (user.role !== 'admin') {
                    // Not an admin, clear tokens and redirect
                    tokenManager.clearTokens()
                    window.location.href = '/auth/login'
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
