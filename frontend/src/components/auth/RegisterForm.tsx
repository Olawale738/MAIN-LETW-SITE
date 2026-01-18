'use client'
import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { authApi } from '@/lib/api'
import { Loader2 } from 'lucide-react'

export default function RegisterForm() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const redirectPath = searchParams.get('redirect') || '/dashboard'

    const [formData, setFormData] = useState({ name: '', email: '' })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            await authApi.register({
                name: formData.name,
                email: formData.email
            })

            // Redirect to verify email page
            const params = new URLSearchParams()
            params.set('email', formData.email)
            params.set('name', formData.name)
            params.set('redirect', redirectPath)
            router.push(`/auth/verify-email?${params.toString()}`)
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Registration failed. Please try again.'
            setError(errorMessage)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="w-full">
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4 text-sm">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700">Full Name</label>
                    <input
                        required
                        type="text"
                        className="w-full p-3 border border-gray-200 rounded-lg bg-gray-50 focus:bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-[#140152] focus:border-transparent transition-all"
                        placeholder="John Doe"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700">Email Address</label>
                    <input
                        required
                        type="email"
                        className="w-full p-3 border border-gray-200 rounded-lg bg-gray-50 focus:bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-[#140152] focus:border-transparent transition-all"
                        placeholder="you@example.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
                            Creating Account...
                        </>
                    ) : (
                        'Register'
                    )}
                </Button>
            </form>

            <p className="text-center text-sm text-gray-500 mt-8">
                Already have an account? <Link href="/auth/login" className="text-[#140152] font-semibold hover:text-[#f5bb00] transition-colors">Sign In</Link>
            </p>
        </div>
    )
}
