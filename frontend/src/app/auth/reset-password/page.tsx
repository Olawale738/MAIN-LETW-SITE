'use client'
import React, { useState, useEffect, Suspense } from 'react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import AuthLayout from '@/components/auth/AuthLayout'
import { authApi } from '@/lib/api'
import { Loader2, CheckCircle, XCircle, ArrowLeft, Eye, EyeOff } from 'lucide-react'

function ResetPasswordContent() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const token = searchParams.get('token')

    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const [error, setError] = useState('')

    useEffect(() => {
        if (!token) {
            setError('Invalid reset link. Please request a new password reset.')
        }
    }, [token])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (password !== confirmPassword) {
            setError('Passwords do not match.')
            return
        }

        if (password.length < 8) {
            setError('Password must be at least 8 characters.')
            return
        }

        setLoading(true)
        setError('')

        try {
            await authApi.resetPassword(token!, password)
            setSuccess(true)
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to reset password. The link may have expired.'
            setError(errorMessage)
        } finally {
            setLoading(false)
        }
    }

    if (success) {
        return (
            <AuthLayout
                title="Password Reset!"
                subtitle="Your password has been updated successfully."
            >
                <div className="text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="w-8 h-8 text-green-600" />
                    </div>
                    <p className="text-gray-600 mb-8">
                        You can now sign in with your new password.
                    </p>
                    <Button
                        onClick={() => router.push('/auth/login')}
                        className="w-full py-6 text-lg bg-[#140152] hover:bg-[#1d0175] text-white shadow-lg shadow-indigo-900/20"
                    >
                        Sign In
                    </Button>
                </div>
            </AuthLayout>
        )
    }

    if (!token) {
        return (
            <AuthLayout
                title="Invalid Link"
                subtitle="This password reset link is not valid."
            >
                <div className="text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <XCircle className="w-8 h-8 text-red-600" />
                    </div>
                    <p className="text-gray-600 mb-8">
                        Please request a new password reset link.
                    </p>
                    <Link href="/auth/forgot-password">
                        <Button className="w-full py-6 text-lg bg-[#140152] hover:bg-[#1d0175] text-white shadow-lg shadow-indigo-900/20">
                            Request New Link
                        </Button>
                    </Link>
                </div>
            </AuthLayout>
        )
    }

    return (
        <AuthLayout
            title="Reset Password"
            subtitle="Enter your new password below."
        >
            <div className="w-full">
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4 text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1 text-gray-700">New Password</label>
                        <div className="relative">
                            <input
                                required
                                type={showPassword ? 'text' : 'password'}
                                className="w-full p-3 pr-12 border border-gray-200 rounded-lg bg-gray-50 focus:bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-[#140152] focus:border-transparent transition-all"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                minLength={8}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Must be at least 8 characters</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1 text-gray-700">Confirm Password</label>
                        <input
                            required
                            type={showPassword ? 'text' : 'password'}
                            className="w-full p-3 border border-gray-200 rounded-lg bg-gray-50 focus:bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-[#140152] focus:border-transparent transition-all"
                            placeholder="••••••••"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                    </div>

                    <Button
                        type="submit"
                        disabled={loading}
                        className="w-full py-6 text-lg bg-[#140152] hover:bg-[#1d0175] text-white mt-2 shadow-lg shadow-indigo-900/20"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                Resetting...
                            </>
                        ) : (
                            'Reset Password'
                        )}
                    </Button>
                </form>

                <p className="text-center text-sm text-gray-500 mt-8">
                    <Link href="/auth/login" className="text-[#140152] font-semibold hover:text-[#f5bb00] transition-colors inline-flex items-center gap-1">
                        <ArrowLeft className="w-4 h-4" />
                        Back to Login
                    </Link>
                </p>
            </div>
        </AuthLayout>
    )
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={
            <AuthLayout title="Loading..." subtitle="">
                <div className="flex justify-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin text-[#140152]" />
                </div>
            </AuthLayout>
        }>
            <ResetPasswordContent />
        </Suspense>
    )
}
