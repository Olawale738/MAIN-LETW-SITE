'use client'
import React, { useState } from 'react'
import SectionWrapper from '@/components/shared/SectionWrapper'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { User, Users, Heart, ArrowRight } from 'lucide-react'
import ServiceAnnouncements from '@/components/shared/ServiceAnnouncements'

export default function CounsellingPage() {
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
                                <form className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Name</label>
                                        <input type="text" className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#f5bb00] outline-none transition-all" placeholder="Your Full Name" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Email</label>
                                        <input type="email" className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#f5bb00] outline-none transition-all" placeholder="you@example.com" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Message</label>
                                        <textarea className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#f5bb00] outline-none transition-all h-32" placeholder="How can we help you?" />
                                    </div>
                                    <Button className="w-full bg-[#140152] hover:bg-blue-900 text-white font-bold py-6 text-lg rounded-xl">
                                        Send Request
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </SectionWrapper>
        </div>
    )
}
