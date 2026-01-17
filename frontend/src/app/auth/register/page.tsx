'use client'
import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

export default function RegisterPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const redirectPath = searchParams.get('redirect') || '/dashboard'

    const [formData, setFormData] = useState({ name: '', email: '' })

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()

        // WELCOME EMAIL SIMULATION
        const welcomeSubject = "Welcome HOME, " + formData.name + "! 🌟"
        const welcomeBody = `
          Dear ${formData.name},

          Grace and Peace be multiplied unto you!

          We are absolutely thrilled to welcome you to the Light Encounter Tabernacle family! You haven't just joined a platform; you've connected with a destiny-moulding community where God's presence changes everything.

          Here is what awaits you:
          1. 🚀 Career & Skills: Unlock your potential with our mentorship tracks.
          2. 🔥 Spiritual Growth: Dive deep into our discipleship and theology resources.
          3. 🤝 Community: You are never alone. We are here to walk with you.

          CLICK BELOW TO CONFIRM YOUR ACCOUNT AND SET YOUR PASSWORD:
          [ Verification Link ]

          We can't wait to see you shine.

          With Love,
          The LETW Team
        `
        console.log("--- SIMULATED EMAIL SENT ---")
        console.log("TO:", formData.email)
        console.log("SUBJECT:", welcomeSubject)
        console.log("BODY:", welcomeBody)
        console.log("----------------------------")

        // Simulate sending email
        const params = new URLSearchParams()
        params.set('email', formData.email)
        params.set('redirect', redirectPath)
        router.push(`/auth/verify-email?${params.toString()}`)
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-neutral-900 px-4">
            <div className="max-w-md w-full bg-white dark:bg-neutral-800 p-8 rounded-2xl shadow-xl">
                <h1 className="text-3xl font-bold text-center text-[#140152] mb-2">Join The Community</h1>
                <p className="text-center text-gray-500 mb-8">Enter your details to get started.</p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1 dark:text-gray-300">Full Name</label>
                        <input
                            required
                            type="text"
                            className="w-full p-3 border rounded-lg dark:bg-neutral-700 dark:border-neutral-600"
                            placeholder="Min. Wale"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>
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

                    <Button type="submit" className="w-full py-6 text-lg bg-[#140152] hover:bg-blue-900 text-white mt-2">
                        Register
                    </Button>
                </form>

                <p className="text-center text-sm text-gray-400 mt-6">
                    Already have an account? <Link href="/auth/login" className="text-blue-500 hover:underline">Sign In</Link>
                </p>
            </div>
        </div>
    )
}
