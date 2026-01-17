'use client'
import React from 'react'
import { Button } from '@/components/ui/button'
import { useRouter, useSearchParams } from 'next/navigation'
import { Mail } from 'lucide-react'

export default function VerifyEmailPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const email = searchParams.get('email') || 'your email'
    const redirectPath = searchParams.get('redirect') || '/dashboard'

    const handleSimulateClick = () => {
        // This simulates clicking the link in the email
        const params = new URLSearchParams()
        params.set('redirect', redirectPath)
        router.push(`/auth/setup-password?${params.toString()}`)
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-neutral-900 px-4">
            <div className="max-w-md w-full bg-white dark:bg-neutral-800 p-8 rounded-2xl shadow-xl text-center">
                <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Mail className="w-8 h-8" />
                </div>
                <h1 className="text-2xl font-bold text-[#140152] mb-4">Check your Email</h1>
                <p className="text-gray-600 mb-6">
                    We've sent a verification link to <strong>{email}</strong>. Please click the link to set your password.
                </p>

                <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-xl text-sm text-yellow-800 mb-6">
                    ℹ️ <strong>Demo Mode:</strong> Since we can't actually send emails, click the button below to simulate opening the link.
                </div>

                <Button onClick={handleSimulateClick} variant="outline" className="w-full">
                    (Simulate) Click Email Link
                </Button>
            </div>
        </div>
    )
}
