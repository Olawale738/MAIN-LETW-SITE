'use client'
import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useRouter, useSearchParams } from 'next/navigation'

export default function SetupPasswordPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const redirectPath = searchParams.get('redirect') || '/dashboard'

    const [password, setPassword] = useState('')
    const [confirm, setConfirm] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (password !== confirm) {
            alert("Passwords do not match")
            return
        }

        setLoading(true)
        // Simulate API call
        setTimeout(() => {
            // Set local storage to simulate logged in state
            localStorage.setItem('isLoggedIn', 'true')
            localStorage.setItem('userName', 'Demo User')
            router.push(redirectPath)
        }, 1000)
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-neutral-900 px-4">
            <div className="max-w-md w-full bg-white dark:bg-neutral-800 p-8 rounded-2xl shadow-xl">
                <h1 className="text-2xl font-bold text-center text-[#140152] mb-2">Create Password</h1>
                <p className="text-center text-gray-500 mb-8">Secure your account to continue.</p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1 dark:text-gray-300">New Password</label>
                        <input
                            required
                            type="password"
                            className="w-full p-3 border rounded-lg dark:bg-neutral-700 dark:border-neutral-600"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1 dark:text-gray-300">Confirm Password</label>
                        <input
                            required
                            type="password"
                            className="w-full p-3 border rounded-lg dark:bg-neutral-700 dark:border-neutral-600"
                            value={confirm}
                            onChange={(e) => setConfirm(e.target.value)}
                        />
                    </div>

                    <Button disabled={loading} type="submit" className="w-full py-6 text-lg bg-[#140152] hover:bg-blue-900 text-white mt-2">
                        {loading ? 'Creating Account...' : 'Set Password & Login'}
                    </Button>
                </form>
            </div>
        </div>
    )
}
