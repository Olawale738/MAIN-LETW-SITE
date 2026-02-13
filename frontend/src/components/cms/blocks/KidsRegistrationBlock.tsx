'use client'

import React, { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import PremiumButton from '@/components/ui/PremiumButton'
import { kidsMinistryApi, KidsMinistryRegistrationCreate } from '@/lib/api'
import { useToast } from '@/components/ui/toast'
import { Loader2, CheckCircle2 } from 'lucide-react'

interface KidsRegistrationBlockProps {
    data: {
        title?: string;
        subtitle?: string;
    };
}

export default function KidsRegistrationBlock({ data }: KidsRegistrationBlockProps) {
    const { title = "Register Your Child", subtitle = "Join our ministry family! Fill out the form below and we'll be in touch." } = data;
    const { showToast, ToastComponent } = useToast()
    const [submitting, setSubmitting] = useState(false)
    const [submitted, setSubmitted] = useState(false)
    const [form, setForm] = useState<KidsMinistryRegistrationCreate>({
        child_name: '',
        child_age: 2,
        age_group: 'Nursery',
        parent_name: '',
        parent_email: '',
        parent_phone: '',
        special_needs: '',
    })

    const handleAgeChange = (age: number) => {
        let group = 'Nursery'
        if (age >= 6 && age <= 12) group = 'Elementary'
        else if (age >= 13) group = 'Youth'
        setForm({ ...form, child_age: age, age_group: group })
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!form.child_name || !form.parent_name || !form.parent_email) {
            showToast('Please fill all required fields', 'error')
            return
        }
        try {
            setSubmitting(true)
            await kidsMinistryApi.register(form)
            setSubmitted(true)
            showToast('Registration submitted successfully!', 'success')
        } catch (error: any) {
            showToast(error.message || 'Failed to submit registration', 'error')
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <section className="py-20 bg-white">
            <ToastComponent />
            <div className="container mx-auto px-4">
                <div className="max-w-2xl mx-auto" id="register">
                    <h2 className="text-4xl font-black text-[#140152] text-center mb-4">{title}</h2>
                    <div className="w-24 h-1.5 bg-[#f5bb00] mx-auto mb-8 rounded-full" />
                    {subtitle && (
                        <p className="text-center text-gray-600 mb-8">{subtitle}</p>
                    )}

                    {submitted ? (
                        <Card className="border-2 border-green-200 bg-green-50">
                            <CardContent className="p-12 text-center">
                                <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
                                <h3 className="text-2xl font-bold text-green-800 mb-2">Registration Submitted!</h3>
                                <p className="text-green-700">Thank you for registering. Our team will review your submission and get back to you soon.</p>
                                <PremiumButton onClick={() => setSubmitted(false)} className="mt-6">
                                    Register Another Child
                                </PremiumButton>
                            </CardContent>
                        </Card>
                    ) : (
                        <Card className="shadow-xl border-0">
                            <CardContent className="p-8">
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    {/* Child Info */}
                                    <div className="space-y-4">
                                        <h3 className="text-lg font-bold text-[#140152] border-b pb-2">Child Information</h3>
                                        <div className="grid md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 mb-1">
                                                    Child&apos;s Full Name <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    required
                                                    value={form.child_name}
                                                    onChange={(e) => setForm({ ...form, child_name: e.target.value })}
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#140152] focus:border-transparent transition-all"
                                                    placeholder="Enter child's name"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 mb-1">
                                                    Age <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    type="number"
                                                    required
                                                    min={2}
                                                    max={17}
                                                    value={form.child_age}
                                                    onChange={(e) => handleAgeChange(parseInt(e.target.value) || 2)}
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#140152] focus:border-transparent transition-all"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-1">Age Group</label>
                                            <div className="flex gap-3">
                                                {['Nursery', 'Elementary', 'Youth'].map((group) => (
                                                    <span
                                                        key={group}
                                                        className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${form.age_group === group
                                                            ? 'bg-[#140152] text-white'
                                                            : 'bg-gray-100 text-gray-500'
                                                            }`}
                                                    >
                                                        {group}
                                                    </span>
                                                ))}
                                            </div>
                                            <p className="text-xs text-gray-400 mt-1">Auto-selected based on age</p>
                                        </div>
                                    </div>

                                    {/* Parent Info */}
                                    <div className="space-y-4">
                                        <h3 className="text-lg font-bold text-[#140152] border-b pb-2">Parent / Guardian Information</h3>
                                        <div className="grid md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 mb-1">
                                                    Full Name <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    required
                                                    value={form.parent_name}
                                                    onChange={(e) => setForm({ ...form, parent_name: e.target.value })}
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#140152] focus:border-transparent transition-all"
                                                    placeholder="Parent's full name"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 mb-1">
                                                    Email <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    type="email"
                                                    required
                                                    value={form.parent_email}
                                                    onChange={(e) => setForm({ ...form, parent_email: e.target.value })}
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#140152] focus:border-transparent transition-all"
                                                    placeholder="email@example.com"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-1">Phone Number</label>
                                            <input
                                                type="tel"
                                                value={form.parent_phone}
                                                onChange={(e) => setForm({ ...form, parent_phone: e.target.value })}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#140152] focus:border-transparent transition-all"
                                                placeholder="Optional"
                                            />
                                        </div>
                                    </div>

                                    {/* Special Needs */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Special Needs / Allergies / Notes</label>
                                        <textarea
                                            value={form.special_needs}
                                            onChange={(e) => setForm({ ...form, special_needs: e.target.value })}
                                            rows={3}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#140152] focus:border-transparent transition-all resize-none"
                                            placeholder="Any information we should know about your child (optional)"
                                        />
                                    </div>

                                    <PremiumButton
                                        type="submit"
                                        disabled={submitting}
                                        className="w-full py-4 text-lg"
                                    >
                                        {submitting ? (
                                            <span className="flex items-center justify-center gap-2">
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                                Submitting...
                                            </span>
                                        ) : (
                                            'Register Now'
                                        )}
                                    </PremiumButton>
                                </form>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </section>
    )
}
