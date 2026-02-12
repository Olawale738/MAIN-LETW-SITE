'use client'

import { useState } from 'react'
import Hero from '@/components/shared/Hero'
import SectionWrapper from '@/components/shared/SectionWrapper'
import { Card, CardContent } from '@/components/ui/card'
import PremiumButton from '@/components/ui/PremiumButton'
import { kidsMinistryApi, KidsMinistryRegistrationCreate } from '@/lib/api'
import { useToast } from '@/components/ui/toast'
import { Loader2, CheckCircle2 } from 'lucide-react'

export default function KidsMinistryPage() {
    const { showToast } = useToast()
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
        <>
            <Hero
                title="🌈 Shine Your Light"
                subtitle="Evangelizing, discipling, and empowering young hearts to encounter God's love in profound, joyful ways."
                height="large"
            />

            {/* Mission / About */}
            <SectionWrapper>
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-4xl font-black text-[#140152] text-center mb-4">Our Mission</h2>
                    <div className="w-24 h-1.5 bg-[#f5bb00] mx-auto mb-12 rounded-full" />

                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        <div>
                            <h3 className="text-2xl font-bold text-[#140152] mb-4">Empowering Young Hearts</h3>
                            <p className="text-gray-600 leading-relaxed mb-4">
                                Drawing from our commitment to evangelizing and discipling children, Light Encounter Tabernacle Kids Ministry serves children ages 2–17. We create transformative spaces where kids value God's Word through worship, lessons, games, and one-on-one guidance.
                            </p>
                            <div className="bg-[#f5bb00]/10 border-l-4 border-[#f5bb00] p-5 rounded-r-xl mb-4">
                                <p className="text-gray-700">
                                    <strong className="text-[#140152]">Our Promise:</strong> A safe, nurturing environment where children encounter God's love, build meaningful friendships, develop strong faith foundations, and discover their unique gifts.
                                </p>
                            </div>
                            <p className="text-gray-600 leading-relaxed">
                                We blend engaging worship, biblical teaching, and community service to help children understand their purpose in God's plan.
                            </p>
                        </div>

                        <div className="flex items-center justify-center">
                            <div className="bg-gradient-to-br from-[#140152] to-[#2a0a6e] p-8 rounded-2xl text-white text-center shadow-2xl transform -rotate-3 hover:rotate-0 transition-transform duration-500">
                                <h4 className="text-xl font-bold mb-3">🎯 Core Values</h4>
                                <p className="mb-3 text-white/90">✨ Faith • 💪 Growth • 🤝 Community • 🎨 Creativity • 📖 Discipleship</p>
                                <p className="text-sm text-white/70">Evangelizing, Teaching, and Equipping Tomorrow's Leaders</p>
                            </div>
                        </div>
                    </div>
                </div>
            </SectionWrapper>

            {/* Age Groups */}
            <SectionWrapper background="gray">
                <div className="max-w-5xl mx-auto">
                    <h2 className="text-4xl font-black text-[#140152] text-center mb-4">Age Groups</h2>
                    <div className="w-24 h-1.5 bg-[#f5bb00] mx-auto mb-12 rounded-full" />

                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            { icon: '👶', title: 'Nursery (2-5)', desc: 'Play-based learning and basic Bible stories in a loving nursery setting.' },
                            { icon: '📚', title: 'Elementary (6-12)', desc: 'Interactive lessons, games, and worship to build faith foundations.' },
                            { icon: '🧑‍🎓', title: 'Youth (13-17)', desc: 'Discipleship, leadership training, and outreach for teens.' },
                        ].map((group) => (
                            <Card key={group.title} className="text-center hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                                <CardContent className="p-8">
                                    <div className="text-5xl mb-4">{group.icon}</div>
                                    <h4 className="text-xl font-bold text-[#140152] mb-2">{group.title}</h4>
                                    <p className="text-gray-600">{group.desc}</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </SectionWrapper>

            {/* Programs */}
            <SectionWrapper>
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-4xl font-black text-[#140152] text-center mb-4">Our Programs</h2>
                    <div className="w-24 h-1.5 bg-[#f5bb00] mx-auto mb-12 rounded-full" />

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            { icon: '🎵', title: 'Kids Choir & Worship', desc: 'Experience joyful worship through music, dance, and celebrations that bring God\'s presence alive.' },
                            { icon: '📖', title: 'Bible Adventures', desc: 'Interactive storytelling bringing God\'s Word to life with engaging narratives, crafts, and discussions.' },
                            { icon: '🌱', title: 'Discipleship & Growth', desc: 'Guided development programs helping kids establish faith and discover their callings through mentorship.' },
                            { icon: '🤝', title: 'Community Outreach', desc: 'Hands-on service projects teaching the heart of compassion, making a difference in our community.' },
                        ].map((program) => (
                            <Card key={program.title} className="group hover:shadow-xl hover:-translate-y-2 transition-all duration-300 overflow-hidden relative">
                                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#f5bb00] to-[#140152] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
                                <CardContent className="p-6 text-center">
                                    <div className="text-4xl mb-4 animate-bounce" style={{ animationDuration: '3s' }}>{program.icon}</div>
                                    <h4 className="text-lg font-bold text-[#140152] mb-2">{program.title}</h4>
                                    <p className="text-gray-600 text-sm leading-relaxed">{program.desc}</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </SectionWrapper>

            {/* Summer Camp */}
            <SectionWrapper background="dark">
                <div className="max-w-3xl mx-auto text-center">
                    <h2 className="text-4xl font-black text-white mb-4">☀️ Summer Shine Camp</h2>
                    <p className="text-xl text-white/80 mb-8">
                        Our week-long adventure features games, laughter, Bible exploration, and worship. A blast of faith-building fun!
                    </p>
                    <PremiumButton className="">Stay Tuned</PremiumButton>
                </div>
            </SectionWrapper>

            {/* Parent Resources */}
            <SectionWrapper background="gray">
                <div className="max-w-5xl mx-auto">
                    <h2 className="text-4xl font-black text-[#140152] text-center mb-4">Parent & Volunteer Resources</h2>
                    <div className="w-24 h-1.5 bg-[#f5bb00] mx-auto mb-12 rounded-full" />
                    <p className="text-center text-gray-600 mb-8 max-w-2xl mx-auto">
                        We offer tools to equip parents and volunteers for nurturing young faith at home and church.
                    </p>

                    <div className="grid md:grid-cols-3 gap-6">
                        {[
                            { title: 'Parent Guides', desc: 'Weekly devotionals and tips for family faith discussions.' },
                            { title: 'Volunteer Training', desc: 'Annual workshops on child safety, teaching, and discipleship.' },
                            { title: 'Bible Study Kits', desc: 'Downloadable materials for home Bible adventures.' },
                        ].map((resource) => (
                            <Card key={resource.title} className="text-center hover:shadow-lg transition-shadow">
                                <CardContent className="p-6">
                                    <h4 className="text-lg font-bold text-[#140152] mb-2">{resource.title}</h4>
                                    <p className="text-gray-600 text-sm">{resource.desc}</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </SectionWrapper>

            {/* Testimonials */}
            <SectionWrapper>
                <div className="max-w-5xl mx-auto">
                    <h2 className="text-4xl font-black text-[#140152] text-center mb-4">Hear From Our Families</h2>
                    <div className="w-24 h-1.5 bg-[#f5bb00] mx-auto mb-12 rounded-full" />

                    <div className="grid md:grid-cols-2 gap-8">
                        {[
                            { text: '"My daughter looks forward to every Sunday! She\'s made wonderful friends and her faith has deepened so much. This ministry truly cares."', author: 'Sarah M.', role: 'Parent' },
                            { text: '"The teachers are amazing! They make learning about God fun and relatable. My kids ask about it all week long!"', author: 'David T.', role: 'Parent' },
                        ].map((testimonial) => (
                            <Card key={testimonial.author} className="hover:shadow-lg transition-shadow">
                                <CardContent className="p-8">
                                    <div className="text-[#f5bb00] text-lg mb-3">⭐⭐⭐⭐⭐</div>
                                    <p className="text-gray-600 italic leading-relaxed mb-4">{testimonial.text}</p>
                                    <div>
                                        <p className="font-bold text-[#140152]">{testimonial.author}</p>
                                        <p className="text-sm text-gray-500">{testimonial.role}</p>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </SectionWrapper>

            {/* Upcoming Events */}
            <SectionWrapper background="gray">
                <div className="max-w-5xl mx-auto">
                    <h2 className="text-4xl font-black text-[#140152] text-center mb-4">Upcoming Events</h2>
                    <div className="w-24 h-1.5 bg-[#f5bb00] mx-auto mb-12 rounded-full" />

                    <div className="grid md:grid-cols-3 gap-6">
                        {[
                            { date: 'March 15, 2025', title: '🎉 Kids Praise Party', desc: 'An afternoon of worship, games, and celebration!' },
                            { date: 'March 22, 2025', title: '📚 Bible Quest Adventure', desc: 'An exciting journey through biblical stories with interactive games.' },
                            { date: 'April 5, 2025', title: '🌍 Community Service Day', desc: 'Kids serve together in hands-on projects.' },
                        ].map((event) => (
                            <Card key={event.title} className="border-l-4 border-[#f5bb00] hover:shadow-lg hover:translate-x-1 transition-all duration-300">
                                <CardContent className="p-6">
                                    <span className="inline-block bg-[#140152] text-white px-3 py-1 rounded-md text-sm font-bold mb-3">
                                        {event.date}
                                    </span>
                                    <h4 className="text-lg font-bold text-[#140152] mb-2">{event.title}</h4>
                                    <p className="text-gray-600 text-sm mb-4">{event.desc}</p>
                                    <PremiumButton className="text-sm">Register</PremiumButton>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </SectionWrapper>

            {/* Registration Form */}
            <SectionWrapper>
                <div className="max-w-2xl mx-auto" id="register">
                    <h2 className="text-4xl font-black text-[#140152] text-center mb-4">Register Your Child</h2>
                    <div className="w-24 h-1.5 bg-[#f5bb00] mx-auto mb-8 rounded-full" />
                    <p className="text-center text-gray-600 mb-8">
                        Join our ministry family! Fill out the form below and we'll be in touch.
                    </p>

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
                                                    Child's Full Name <span className="text-red-500">*</span>
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
            </SectionWrapper>

            {/* CTA Footer */}
            <SectionWrapper background="dark">
                <div className="max-w-3xl mx-auto text-center">
                    <h2 className="text-4xl font-black text-white mb-4">Join Our Ministry Family</h2>
                    <p className="text-xl text-white/80 mb-8">
                        Your child deserves a place where faith, friendship, and fun come together. We're ready to welcome your family with open hearts and open arms.
                    </p>
                    <PremiumButton onClick={() => document.getElementById('register')?.scrollIntoView({ behavior: 'smooth' })}>
                        Start Your Journey Today
                    </PremiumButton>
                </div>
            </SectionWrapper>
        </>
    )
}
