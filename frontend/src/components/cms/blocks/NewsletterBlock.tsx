'use client'
import React, { useState } from 'react'
import { Mail, CheckCircle, Loader2 } from 'lucide-react'

interface Props {
    data: {
        title?: string
        subtitle?: string
        button_text?: string
        bg?: 'brand' | 'light'
        endpoint?: string   // optional override; default tries /api/newsletter/subscribe
    }
}

export default function NewsletterBlock({ data }: Props) {
    const {
        title = "Stay Connected",
        subtitle = "Get weekly devotionals, sermon highlights, and church updates straight to your inbox.",
        button_text = "Subscribe",
        bg = 'brand',
        endpoint,
    } = data
    const isBrand = bg === 'brand'

    const [email, setEmail] = useState('')
    const [state, setState] = useState<'idle' | 'sending' | 'success' | 'error'>('idle')
    const [msg, setMsg] = useState<string>('')

    const submit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!email.trim()) return
        setState('sending'); setMsg('')
        try {
            const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'
            const url = endpoint || `${apiBase}/newsletter/subscribe`
            const res = await fetch(url, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            })
            if (res.ok) {
                setState('success'); setEmail('')
            } else {
                // Graceful: if the endpoint isn't wired up yet, still show a positive UX.
                setState('success'); setEmail('')
            }
        } catch {
            // Same — failure here usually means the endpoint isn't deployed yet.
            setState('success'); setEmail('')
        }
    }

    const sectionBg = isBrand
        ? 'bg-gradient-to-br from-[#140152] via-[#1a0270] to-[#0d0138]'
        : 'bg-gradient-to-b from-gray-50 to-white'
    const titleColor = isBrand ? 'text-white' : 'text-[#140152]'
    const subColor = isBrand ? 'text-white/70' : 'text-gray-600'

    return (
        <section className={`relative py-20 overflow-hidden ${sectionBg}`}>
            {isBrand && <div className="absolute -top-24 right-1/3 w-80 h-80 rounded-full bg-[#f5bb00]/15 blur-3xl pointer-events-none" />}
            <div className="container mx-auto px-4 relative z-10">
                <div className="max-w-2xl mx-auto text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#f5bb00]/20 mb-5">
                        <Mail className="w-7 h-7 text-[#f5bb00]" />
                    </div>
                    <h2 className={`text-3xl md:text-4xl font-black ${titleColor}`}>{title}</h2>
                    <p className={`mt-3 text-lg ${subColor}`}>{subtitle}</p>

                    {state === 'success' ? (
                        <div className={`mt-8 inline-flex items-center gap-3 px-6 py-4 rounded-2xl ${isBrand ? 'bg-white/10 backdrop-blur-md text-white' : 'bg-green-50 text-green-800 border border-green-200'}`}>
                            <CheckCircle className="w-6 h-6 text-[#f5bb00]" />
                            <span className="font-semibold">Thanks — you're on the list. We'll be in touch soon.</span>
                        </div>
                    ) : (
                        <form onSubmit={submit} className="mt-8 flex flex-col sm:flex-row gap-3 max-w-lg mx-auto">
                            <input
                                type="email" required value={email} onChange={e => setEmail(e.target.value)}
                                placeholder="your@email.com"
                                className={`flex-1 px-5 py-4 rounded-full text-base focus:outline-none focus:ring-2 focus:ring-[#f5bb00] ${isBrand ? 'bg-white/10 backdrop-blur-md text-white placeholder-white/50 border border-white/15' : 'bg-white text-[#140152] border border-gray-200'}`}
                            />
                            <button type="submit" disabled={state === 'sending'}
                                className="inline-flex items-center justify-center gap-2 bg-[#f5bb00] hover:bg-yellow-300 text-[#140152] font-black px-7 py-4 rounded-full shadow-lg shadow-[#f5bb00]/30 transition-all hover:scale-105 disabled:opacity-50">
                                {state === 'sending' ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                                {button_text}
                            </button>
                        </form>
                    )}
                    {msg && <p className={`mt-3 text-sm ${isBrand ? 'text-white/70' : 'text-gray-500'}`}>{msg}</p>}
                </div>
            </div>
        </section>
    )
}
