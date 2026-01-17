'use client'
import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { useRouter, useSearchParams } from 'next/navigation'
import { Mail, CheckCircle, Loader2 } from 'lucide-react'
import { authApi } from '@/lib/api'

export default function VerifyEmailPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const email = searchParams.get('email') || ''
    const name = searchParams.get('name') || 'User'

    const [countdown, setCountdown] = useState(60)
    const [canResend, setCanResend] = useState(false)
    const [isResending, setIsResending] = useState(false)
    const [resendMessage, setResendMessage] = useState('')

    // Countdown timer
    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
            return () => clearTimeout(timer)
        } else {
            setCanResend(true)
        }
    }, [countdown])

    const handleResend = async () => {
        if (!email || isResending) return

        setIsResending(true)
        setResendMessage('')

        try {
            await authApi.register({ name, email })
            setResendMessage('Verification email sent! Check your inbox.')
            setCountdown(60)
            setCanResend(false)
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to resend email.'
            setResendMessage(errorMessage)
        } finally {
            setIsResending(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
            <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-[#140152] to-[#1d0175] text-[#f5bb00] rounded-full flex items-center justify-center mx-auto mb-6">
                    <Mail className="w-10 h-10" />
                </div>

                <h1 className="text-2xl font-bold text-[#140152] mb-4">Check Your Email! 📧</h1>

                <p className="text-gray-600 mb-2">
                    We've sent a verification link to
                </p>
                <p className="font-semibold text-[#140152] mb-6 break-all">
                    {email || 'your email'}
                </p>

                <div className="bg-[#f5bb00]/10 border border-[#f5bb00]/30 p-4 rounded-xl mb-6">
                    <div className="flex items-start gap-3 text-left">
                        <CheckCircle className="w-5 h-5 text-[#140152] flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-gray-700">
                            <p className="font-semibold mb-1">What's next?</p>
                            <ol className="list-decimal list-inside space-y-1 text-gray-600">
                                <li>Open your email inbox</li>
                                <li>Click the link in our email</li>
                                <li>Create your password</li>
                            </ol>
                        </div>
                    </div>
                </div>

                {/* Resend message */}
                {resendMessage && (
                    <div className={`mb-4 p-3 rounded-lg text-sm ${resendMessage.includes('sent')
                            ? 'bg-green-50 text-green-700 border border-green-200'
                            : 'bg-red-50 text-red-700 border border-red-200'
                        }`}>
                        {resendMessage}
                    </div>
                )}

                {/* Countdown / Resend section */}
                <div className="mb-6">
                    <p className="text-sm text-gray-500 mb-3">
                        Didn't receive an email? Check your spam folder.
                    </p>

                    {canResend ? (
                        <button
                            onClick={handleResend}
                            disabled={isResending}
                            className="text-[#140152] font-semibold hover:text-[#f5bb00] transition-colors disabled:opacity-50 flex items-center justify-center gap-2 mx-auto"
                        >
                            {isResending ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Sending...
                                </>
                            ) : (
                                'Resend verification email'
                            )}
                        </button>
                    ) : (
                        <p className="text-sm text-gray-400">
                            Resend available in <span className="font-semibold text-[#140152]">{countdown}s</span>
                        </p>
                    )}
                </div>

                <Button
                    onClick={() => router.push('/auth/login')}
                    variant="outline"
                    className="w-full border-[#140152] text-[#140152] hover:bg-[#140152] hover:text-white"
                >
                    Back to Login
                </Button>
            </div>
        </div>
    )
}
