'use client'
import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import AuthLayout from '@/components/auth/AuthLayout'
import { authApi } from '@/lib/api'
import { Loader2, CheckCircle, ArrowLeft } from 'lucide-react'

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const [error, setError] = useState('')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            await authApi.forgotPassword(email)
            setSuccess(true)
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Something went wrong. Please try again.'
            setError(errorMessage)
        } finally {
            setLoading(false)
        }
    }

    if (success) {
        return (
            <AuthLayout
                title="Check Your Email"
                subtitle="We've sent you a password reset link."
            >
                <div className="text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="w-8 h-8 text-green-600" />
                    </div>
                    <p className="text-gray-600 mb-6">
                        If an account exists with <strong>{email}</strong>, you will receive a password reset link shortly.
                    </p>
                    <p className="text-sm text-gray-500 mb-8">
                        Didn&apos;t receive the email? Check your spam folder or try again.
                    </p>
                    <div className="space-y-3">
                        <Button
                            onClick={() => setSuccess(false)}
                            variant="outline"
                            className="w-full py-6"
                        >
                            Try Another Email
                        </Button>
                        <Link href="/auth/login" className="block">
                            <Button
                                variant="ghost"
                                className="w-full py-6"
                            >
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Back to Login
                            </Button>
                        </Link>
                    </div>
                </div>
            </AuthLayout>
        )
    }

    return (
        <AuthLayout
            title="Forgot Password?"
            subtitle="Enter your email to receive a reset link."
        >
            <div className="w-full">
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4 text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1 text-gray-700">Email Address</label>
                        <input
                            required
                            type="email"
                            className="w-full p-3 border border-gray-200 rounded-lg bg-gray-50 focus:bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-[#140152] focus:border-transparent transition-all"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
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
                                Sending...
                            </>
                        ) : (
                            'Send Reset Link'
                        )}
                    </Button>
                </form>

                <p className="text-center text-sm text-gray-500 mt-8">
                    Remember your password?{' '}
                    <Link href="/auth/login" className="text-[#140152] font-semibold hover:text-[#f5bb00] transition-colors">
                        Sign In
                    </Link>
                </p>
            </div>
        </AuthLayout>
    )
}
