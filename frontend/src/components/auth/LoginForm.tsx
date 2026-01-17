'use client'
import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

export default function LoginForm() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const redirectPath = searchParams.get('redirect') || '/dashboard'

    const [formData, setFormData] = useState({ email: '', password: '' })

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        // Simulate login
        console.log("--- LOGIN ATTEMPT ---")
        console.log("EMAIL:", formData.email)
        console.log("---------------------")
        router.push(redirectPath)
    }

    return (
        <div className="w-full bg-white dark:bg-neutral-800 p-8 rounded-2xl shadow-xl">
            <h1 className="text-3xl font-bold text-center text-[#140152] mb-2">Welcome Back</h1>
            <p className="text-center text-gray-500 mb-8">Please enter your details to sign in.</p>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-1 dark:text-gray-300">Email Address</label>
                    <input
                        required
                        type="email"
                        className="w-full p-3 border rounded-lg dark:bg-neutral-700 dark:border-neutral-600"
                        placeholder="you@example.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1 dark:text-gray-300">Password</label>
                    <input
                        required
                        type="password"
                        className="w-full p-3 border rounded-lg dark:bg-neutral-700 dark:border-neutral-600"
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    />
                </div>

                <Button type="submit" className="w-full py-6 text-lg bg-[#140152] hover:bg-blue-900 text-white mt-2">
                    Sign In
                </Button>
            </form>

            <p className="text-center text-sm text-gray-400 mt-6">
                Don&apos;t have an account? <Link href="/auth/register" className="text-[#140152] font-semibold hover:text-[#f5bb00] transition-colors">Register</Link>
            </p>
        </div>
    )
}
