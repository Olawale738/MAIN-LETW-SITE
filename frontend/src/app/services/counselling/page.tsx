'use client'
import React, { useState } from 'react'
import SectionWrapper from '@/components/shared/SectionWrapper'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { User, Users, Heart, MessageCircle, Shield, Leaf, Clock } from 'lucide-react'
import ServiceAnnouncements from '@/components/shared/ServiceAnnouncements'

export default function CounsellingPage() {
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [sessionType, setSessionType] = useState('Individual')
    const [message, setMessage] = useState('')
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const [error, setError] = useState('')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')
        try {
            const { serviceRequestApi } = await import('@/lib/api')
            await serviceRequestApi.submitRequests(
                ['Counselling'],
                `Session type: ${sessionType}\nMessage: ${message}`
            )
            setSuccess(true)
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Failed to send request. Please try again.'
            setError(msg)
        } finally {
            setLoading(false)
        }
    }

    const features = [
        { icon: Shield, color: 'bg-blue-100 text-blue-600', title: 'Confidential', desc: 'Everything shared stays within a safe, private space.' },
        { icon: Leaf, color: 'bg-green-100 text-green-600', title: 'Non-Judgmental', desc: 'You are accepted exactly as you are.' },
        { icon: Heart, color: 'bg-pink-100 text-pink-600', title: 'Faith-Based', desc: 'Grounded in Scripture and pastoral wisdom.' },
        { icon: Clock, color: 'bg-orange-100 text-orange-600', title: 'Flexible Hours', desc: 'Sessions available weekdays and weekends.' },
    ]

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Hero */}
            <div className="relative bg-[#140152] py-32 px-4 text-center overflow-hidden">
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_30%_50%,#f5bb00,transparent_60%)]" />
                <div className="relative z-10 max-w-3xl mx-auto">
                    <span className="text-[#f5bb00] font-bold uppercase tracking-widest text-sm mb-4 block">Healing & Wholeness</span>
                    <h1 className="text-5xl md:text-6xl font-black text-white mb-6">Counselling Services</h1>
                    <p className="text-xl text-blue-200 font-light leading-relaxed">
                        Professional, compassionate counselling to support your mental, emotional, and spiritual well-being.
                    </p>
                </div>
            </div>

            <SectionWrapper>
                {/* Announcements */}
                <div className="max-w-4xl mx-auto mb-12">
                    <ServiceAnnouncements serviceName="Counselling" />
                </div>

                {/* Features */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
                    {features.map(({ icon: Icon, color, title, desc }) => (
                        <div key={title} className="bg-white rounded-2xl p-6 text-center shadow-sm">
                            <div className={`w-12 h-12 ${color} rounded-full flex items-center justify-center mx-auto mb-4`}>
                                <Icon className="w-6 h-6" />
                            </div>
                            <h3 className="font-bold text-[#140152] mb-1">{title}</h3>
                            <p className="text-xs text-gray-500">{desc}</p>
                        </div>
                    ))}
                </div>

                <div className="grid md:grid-cols-2 gap-12">
                    {/* Services List */}
                    <div className="space-y-6">
                        <h2 className="text-3xl font-bold text-[#140152]">Our Counselling Types</h2>
                        <div className="w-16 h-1.5 bg-[#f5bb00] rounded-full" />

                        {[
                            { icon: User, color: 'bg-blue-100 text-blue-600', title: 'Individual Counselling', desc: 'One-on-one sessions tailored to your personal journey — grief, anxiety, addiction, identity, and more.' },
                            { icon: Users, color: 'bg-green-100 text-green-600', title: 'Family Counselling', desc: 'Strengthen family bonds, improve communication, and navigate conflicts with professional guidance.' },
                            { icon: Heart, color: 'bg-pink-100 text-pink-600', title: 'Group Counselling', desc: 'Find community with others on similar paths. Share experiences and heal together.' },
                            { icon: MessageCircle, color: 'bg-purple-100 text-purple-600', title: 'Pre-Marital Counselling', desc: 'Build a strong foundation for your marriage with guided pre-marital sessions.' },
                        ].map(({ icon: Icon, color, title, desc }) => (
                            <div key={title} className="bg-white p-6 rounded-2xl shadow-sm flex gap-4 hover:shadow-md transition-shadow">
                                <div className={`w-12 h-12 ${color} rounded-full flex items-center justify-center shrink-0`}>
                                    <Icon className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-[#140152] mb-1">{title}</h3>
                                    <p className="text-gray-600 text-sm leading-relaxed">{desc}</p>
                                </div>
                            </div>
                        ))}

                        {/* Chat option */}
                        <div className="bg-[#140152] text-white p-6 rounded-2xl">
                            <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
                                <MessageCircle className="w-5 h-5 text-[#f5bb00]" />
                                Need to talk right now?
                            </h3>
                            <p className="text-blue-200 text-sm mb-4">Use the chat button at the bottom right to message our support team directly.</p>
                            <p className="text-xs text-blue-300">Available Mon–Fri, 9am–6pm</p>
                        </div>
                    </div>

                    {/* Booking Form */}
                    <div>
                        <Card className="border-none shadow-xl sticky top-24">
                            <CardHeader className="bg-[#f5bb00] text-[#140152] rounded-t-xl p-6">
                                <CardTitle className="text-2xl font-black">Book a Session</CardTitle>
                                <p className="text-sm font-medium opacity-90 mt-1">Fill out the form and we'll get in touch.</p>
                            </CardHeader>
                            <CardContent className="p-6">
                                {success ? (
                                    <div className="text-center py-8 space-y-4">
                                        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
                                            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                        <h3 className="text-xl font-bold text-[#140152]">Request Received!</h3>
                                        <p className="text-gray-600">We will contact you within 24–48 hours to confirm your appointment.</p>
                                        <Button
                                            onClick={() => { setSuccess(false); setMessage('') }}
                                            className="bg-[#140152] text-white"
                                        >
                                            Submit Another Request
                                        </Button>
                                    </div>
                                ) : (
                                    <form className="space-y-4" onSubmit={handleSubmit}>
                                        {error && (
                                            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-100">
                                                {error}
                                            </div>
                                        )}
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-1">Full Name</label>
                                            <input
                                                type="text"
                                                required
                                                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#f5bb00] outline-none transition-all"
                                                placeholder="John Doe"
                                                value={name}
                                                onChange={e => setName(e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-1">Email</label>
                                            <input
                                                type="email"
                                                required
                                                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#f5bb00] outline-none transition-all"
                                                placeholder="you@example.com"
                                                value={email}
                                                onChange={e => setEmail(e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-1">Session Type</label>
                                            <select
                                                value={sessionType}
                                                onChange={e => setSessionType(e.target.value)}
                                                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#f5bb00] outline-none transition-all bg-white"
                                            >
                                                <option>Individual</option>
                                                <option>Family</option>
                                                <option>Group</option>
                                                <option>Pre-Marital</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-1">How can we help?</label>
                                            <textarea
                                                required
                                                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#f5bb00] outline-none transition-all h-28 resize-none"
                                                placeholder="Briefly describe what you'd like to discuss…"
                                                value={message}
                                                onChange={e => setMessage(e.target.value)}
                                            />
                                        </div>
                                        <Button
                                            type="submit"
                                            disabled={loading}
                                            className="w-full bg-[#140152] hover:bg-[#1d0175] text-white font-bold py-6 text-base rounded-xl disabled:opacity-50"
                                        >
                                            {loading ? 'Sending…' : 'Book Session'}
                                        </Button>
                                        <p className="text-xs text-gray-400 text-center">
                                            You must be logged in to submit a booking request.
                                        </p>
                                    </form>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </SectionWrapper>
        </div>
    )
}
