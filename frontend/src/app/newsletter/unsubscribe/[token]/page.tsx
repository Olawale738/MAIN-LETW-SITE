'use client'
import React, { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle, AlertCircle, Loader2, Mail } from 'lucide-react'

export default function UnsubscribePage() {
    const params = useParams()
    const token = params?.token as string
    const [state, setState] = useState<'pending' | 'ok' | 'error'>('pending')
    const [message, setMessage] = useState<string>('')

    useEffect(() => {
        if (!token) return
        const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'
        fetch(`${base}/newsletter/unsubscribe/${token}`)
            .then(async r => {
                const d = await r.json().catch(() => ({}))
                if (r.ok) {
                    setState('ok')
                    setMessage(d.message || 'You have been unsubscribed.')
                } else {
                    setState('error')
                    setMessage(d.detail || 'We could not process that link.')
                }
            })
            .catch(() => {
                setState('error')
                setMessage("We couldn't reach the server. Please try again later.")
            })
    }, [token])

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#140152] via-[#1a0270] to-[#0d0138] px-4 py-20">
            <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-10 text-center">
                <div className={`mx-auto w-16 h-16 rounded-2xl flex items-center justify-center mb-6 ${
                    state === 'ok' ? 'bg-green-50' : state === 'error' ? 'bg-red-50' : 'bg-gray-100'
                }`}>
                    {state === 'pending' && <Loader2 className="w-8 h-8 text-[#140152] animate-spin" />}
                    {state === 'ok' && <CheckCircle className="w-8 h-8 text-green-600" />}
                    {state === 'error' && <AlertCircle className="w-8 h-8 text-red-600" />}
                </div>

                <h1 className="text-2xl font-black text-[#140152] mb-3">
                    {state === 'pending' && 'Working on it…'}
                    {state === 'ok' && 'Unsubscribed'}
                    {state === 'error' && 'Something went wrong'}
                </h1>
                <p className="text-gray-600 leading-relaxed">
                    {state === 'pending' ? 'Processing your request.' : message}
                </p>

                {state === 'ok' && (
                    <p className="text-xs text-gray-500 mt-6 leading-relaxed">
                        Changed your mind? You can always re-subscribe from the homepage.
                    </p>
                )}

                <Link href="/" className="inline-flex items-center gap-2 mt-8 bg-[#140152] hover:bg-[#1d0175] text-white font-bold px-6 py-3 rounded-full transition-all hover:scale-105">
                    <Mail className="w-4 h-4" /> Back to Homepage
                </Link>
            </div>
        </div>
    )
}
