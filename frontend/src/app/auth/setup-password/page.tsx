'use client'
import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { useRouter, useSearchParams } from 'next/navigation'
import { authApi, tokenManager } from '@/lib/api'
import { Loader2, CheckCircle, XCircle } from 'lucide-react'

type PageState = 'loading' | 'valid' | 'invalid' | 'setting'

export default function SetupPasswordPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const token = searchParams.get('token') || ''
    const redirectPath = searchParams.get('redirect') || '/onboarding/services'

    const [pageState, setPageState] = useState<PageState>('loading')
    const [userName, setUserName] = useState('')
    const [password, setPassword] = useState('')
    const [confirm, setConfirm] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    // Verify token on mount
    useEffect(() => {
        const verifyToken = async () => {
            if (!token) {
                setPageState('invalid')
                setError('No verification token provided.')
                return
            }

            try {
                const response = await authApi.verifyToken(token)
                if (response.valid && response.user) {
                    setUserName(response.user.name)
                    setPageState('valid')
                } else {
                    setPageState('invalid')
                    setError(response.message || 'Invalid or expired token.')
                }
            } catch (err: unknown) {
                setPageState('invalid')
                const errorMessage = err instanceof Error ? err.message : 'Failed to verify token.'
                setError(errorMessage)
            }
        }

        verifyToken()
    }, [token])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (password !== confirm) {
            setError("Passwords do not match")
            return
        }

        if (password.length < 8) {
            setError("Password must be at least 8 characters")
            return
        }

        setLoading(true)
        setError('')
        setPageState('setting')

        try {
            const response = await authApi.setPassword({ token, password })

            // Save tokens
            tokenManager.saveTokens(response)

            // Redirect to dashboard
            router.push(redirectPath)
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to set password.'
            setError(errorMessage)
            setPageState('valid')
        } finally {
            setLoading(false)
        }
    }

    // Loading state
    if (pageState === 'loading') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
                <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-[#140152] mx-auto mb-4" />
                    <p className="text-gray-600">Verifying your link...</p>
                </div>
            </div>
        )
    }

    // Invalid token state
    if (pageState === 'invalid') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
                <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl text-center">
                    <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                        <XCircle className="w-8 h-8" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">Invalid Link</h1>
                    <p className="text-gray-600 mb-6">{error}</p>
                    <Button
                        onClick={() => router.push('/auth/register')}
                        className="w-full py-6 text-lg bg-[#140152] hover:bg-[#1d0175] text-white"
                    >
                        Register Again
                    </Button>
                </div>
            </div>
        )
    }

    // Valid token - show password form
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
            <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl">
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="w-8 h-8" />
                </div>
                <h1 className="text-2xl font-bold text-center text-[#140152] mb-2">
                    Welcome, {userName}!
                </h1>
                <p className="text-center text-gray-500 mb-8">
                    Create a password to secure your account.
                </p>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4 text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1 text-gray-700">New Password</label>
                        <input
                            required
                            type="password"
                            minLength={8}
                            className="w-full p-3 border border-gray-200 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-[#140152] focus:border-transparent"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                        <p className="text-xs text-gray-400 mt-1">Minimum 8 characters</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1 text-gray-700">Confirm Password</label>
                        <input
                            required
                            type="password"
                            className="w-full p-3 border border-gray-200 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-[#140152] focus:border-transparent"
                            placeholder="••••••••"
                            value={confirm}
                            onChange={(e) => setConfirm(e.target.value)}
                        />
                    </div>

                    <Button
                        disabled={loading}
                        type="submit"
                        className="w-full py-6 text-lg bg-[#140152] hover:bg-[#1d0175] text-white mt-2"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                Creating Account...
                            </>
                        ) : (
                            'Set Password & Login'
                        )}
                    </Button>
                </form>
            </div>
        </div>
    )
}
