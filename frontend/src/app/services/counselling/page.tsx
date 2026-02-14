'use client'
import React, { useState } from 'react'
import SectionWrapper from '@/components/shared/SectionWrapper'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { User, Users, Heart, ArrowRight } from 'lucide-react'
import ServiceAnnouncements from '@/components/shared/ServiceAnnouncements'

export default function CounsellingPage() {
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [message, setMessage] = useState('')
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const [error, setError] = useState('')

    // We need to import serviceRequestApi lazily or just use it if it's available.
    // However, since this is a client component, we can import it at the top if we fix imports.
    // But wait, the original file didn't import it. I'll add the import.

    // For now, let's assume I'll add the import in a separate tool call or include it here if I replace the whole file or top part.
    // The current tool call replaces the component body. I need to make sure imports are present.
    // I will use a separate tool call to add imports first.

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Hero */}
            <div className="bg-[#140152] text-white py-20">
                <div className="max-w-7xl mx-auto px-4 text-center">
                    <h1 className="text-4xl md:text-6xl font-black mb-4">Counselling Services</h1>
                    <p className="text-xl text-blue-200 max-w-2xl mx-auto">Contact our counselors for guidance and support.</p>
                </div>
            </div>

            <SectionWrapper>
                {/* Announcements */}
                <div className="max-w-4xl mx-auto mb-8">
                    <ServiceAnnouncements serviceName="Counselling" />
                </div>
                <div className="grid md:grid-cols-2 gap-12">
                    {/* Services List */}
                    <div className="space-y-8">
                        <h2 className="text-3xl font-bold text-[#140152]">Our Services</h2>

                        <div className="bg-white p-6 rounded-2xl shadow-sm flex gap-4">
                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 flex-shrink-0">
                                <User className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-[#140152]">Individual Counseling</h3>
                                <p className="text-gray-600 mt-2">Personalized one-on-one sessions to address your unique needs, providing a safe space for healing and growth.</p>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-2xl shadow-sm flex gap-4">
                            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600 flex-shrink-0">
                                <Users className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-[#140152]">Family Counseling</h3>
                                <p className="text-gray-600 mt-2">Support and guidance for families to improve relationships, communication, and resolve conflicts together.</p>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-2xl shadow-sm flex gap-4">
                            <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center text-pink-600 flex-shrink-0">
                                <Heart className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-[#140152]">Group Counseling</h3>
                                <p className="text-gray-600 mt-2">Group sessions to share experiences, learn from others, and build a supportive community.</p>
                            </div>
                        </div>
                    </div>

                    {/* Booking Form */}
                    <div>
                        <Card className="border-none shadow-xl sticky top-24">
                            <CardHeader className="bg-[#f5bb00] text-[#140152] rounded-t-xl">
                                <CardTitle className="text-2xl font-black">Book an appointment</CardTitle>
                                <p className="text-sm font-medium opacity-90">Reach out to schedule a session.</p>
                            </CardHeader>
                            <CardContent className="p-6">
                                {success ? (
                                    <div className="text-center py-8 space-y-4">
                                        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
                                            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                        <h3 className="text-xl font-bold text-[#140152]">Request Sent!</h3>
                                        <p className="text-gray-600">We have received your request and will contact you shortly.</p>
                                        <Button
                                            onClick={() => {
                                                setSuccess(false);
                                                setMessage('');
                                                // Don't reset name/email as they might want to send another
                                            }}
                                            className="bg-[#140152] text-white"
                                        >
                                            Send Another Request
                                        </Button>
                                    </div>
                                ) : (
                                    <form className="space-y-4" onSubmit={async (e) => {
                                        e.preventDefault();
                                        setLoading(true);
                                        setError('');
                                        try {
                                            const { counsellingApi } = await import('@/lib/api');
                                            await counsellingApi.submit({
                                                name,
                                                email,
                                                message
                                            });
                                            setSuccess(true);
                                        } catch (err: any) {
                                            console.error(err);
                                            setError(err.message || "Failed to send request. Please try again.");
                                        } finally {
                                            setLoading(false);
                                        }
                                    }}>
                                        {error && (
                                            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
                                                {error}
                                            </div>
                                        )}
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-1">Name</label>
                                            <input
                                                type="text"
                                                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#f5bb00] outline-none transition-all"
                                                placeholder="Your Full Name"
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                required
                                                minLength={2}
                                            />
                                            <p className="text-xs text-gray-400 mt-1">
                                                * Your information is kept strictly confidential.
                                            </p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-1">Email</label>
                                            <input
                                                type="email"
                                                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#f5bb00] outline-none transition-all"
                                                placeholder="you@example.com"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-1">Message</label>
                                            <textarea
                                                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#f5bb00] outline-none transition-all h-32"
                                                placeholder="How can we help you? (Min 10 characters)"
                                                value={message}
                                                onChange={(e) => setMessage(e.target.value)}
                                                required
                                                minLength={10}
                                            />
                                            <p className="text-xs text-gray-400 mt-1 text-right">
                                                {message.length}/10 characters minimum
                                            </p>
                                        </div>
                                        <Button
                                            type="submit"
                                            disabled={loading}
                                            className="w-full bg-[#140152] hover:bg-blue-900 text-white font-bold py-6 text-lg rounded-xl disabled:opacity-50"
                                        >
                                            {loading ? "Sending..." : "Send Request"}
                                        </Button>
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
