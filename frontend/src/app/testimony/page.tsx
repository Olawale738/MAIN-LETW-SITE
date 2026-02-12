'use client'

import { useState, useEffect } from 'react'
import Hero from '@/components/shared/Hero'
import SectionWrapper from '@/components/shared/SectionWrapper'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { ArrowRight, Loader2, Quote } from 'lucide-react'
import { testimonyApi, TestimonyItem } from '@/lib/api'

export default function TestimonyPage() {
  const [formData, setFormData] = useState({ name: '', email: '', testimony_text: '' })
  const [approvedTestimonies, setApprovedTestimonies] = useState<TestimonyItem[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    fetchApproved()
  }, [])

  const fetchApproved = async () => {
    try {
      setLoading(true)
      const data = await testimonyApi.getApproved()
      setApprovedTestimonies(data)
    } catch (error) {
      console.error('Failed to fetch testimonies:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      setSubmitting(true)
      await testimonyApi.submit({
        name: formData.name,
        email: formData.email,
        testimony_text: formData.testimony_text,
      })
      setSubmitted(true)
      setFormData({ name: '', email: '', testimony_text: '' })
      // Reset submitted message after 5 seconds
      setTimeout(() => setSubmitted(false), 5000)
    } catch (error) {
      console.error('Failed to submit testimony:', error)
      alert('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  return (
    <>
      <Hero
        title="Share Your Testimony"
        subtitle="We would love to hear what GOD has done in your life"
        backgroundImage="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1200"
      />

      {/* Share Testimony Form */}
      <SectionWrapper>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
          <div className="space-y-6">
            <div className="space-y-2">
              <span className="text-[#f5bb00] font-bold uppercase tracking-[0.2em] text-sm">Testify</span>
              <h2 className="text-4xl md:text-5xl font-black text-[#140152]">Share Your Story</h2>
            </div>
            <p className="text-lg text-[#140152]/70 leading-relaxed font-medium">
              We would love to hear what GOD has done in your life. Your testimony can encourage others and glorify God.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 bg-white p-8 md:p-10 rounded-[2.5rem] shadow-2xl shadow-gray-100 border border-gray-50">
            {submitted && (
              <div className="bg-green-50 border border-green-200 rounded-2xl p-4 text-green-800 text-sm font-medium text-center">
                ✅ Thank you! Your testimony has been submitted for review. It will appear on this page once approved.
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label htmlFor="name" className="text-xs font-bold text-[#140152] uppercase tracking-widest pl-2">Name</label>
                <Input id="name" name="name" required value={formData.name} onChange={handleChange} className="rounded-xl border-gray-100 h-14" />
              </div>
              <div className="space-y-2">
                <label htmlFor="email" className="text-xs font-bold text-[#140152] uppercase tracking-widest pl-2">Email</label>
                <Input id="email" name="email" type="email" required value={formData.email} onChange={handleChange} className="rounded-xl border-gray-100 h-14" />
              </div>
            </div>
            <div className="space-y-2">
              <label htmlFor="testimony_text" className="text-xs font-bold text-[#140152] uppercase tracking-widest pl-2">Testimony</label>
              <Textarea id="testimony_text" name="testimony_text" required value={formData.testimony_text} onChange={handleChange} rows={8} className="rounded-2xl border-gray-100" />
            </div>
            <Button type="submit" variant="primary" disabled={submitting} className="w-full h-14 rounded-full py-0.5 px-1 pl-5 shadow-[0_0_20px_rgba(245,187,0,0.5)]">
              <div className="flex items-center justify-between w-full px-4">
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <p>Submit Testimony</p>
                    <ArrowRight className="w-4 h-4 text-[#140152] -rotate-45" />
                  </>
                )}
              </div>
            </Button>
          </form>
        </div>
      </SectionWrapper>

      {/* Read Testimonies */}
      <SectionWrapper background="gray">
        <div className="text-center mb-16 space-y-4">
          <span className="text-[#f5bb00] font-bold uppercase tracking-[0.2em] text-sm">Faith Builders</span>
          <h2 className="text-4xl md:text-5xl font-black text-[#140152]">Read Testimonies</h2>
          <div className="w-24 h-1.5 bg-[#f5bb00] mx-auto rounded-full" />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-[#140152]" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {approvedTestimonies.length > 0 ? (
              approvedTestimonies.map((t) => (
                <Card key={t.id} className="hover:shadow-xl transition-all duration-300 border-none shadow-lg group">
                  <CardHeader>
                    <div className="w-12 h-12 bg-[#140152]/5 rounded-xl flex items-center justify-center text-[#140152] text-2xl font-black mb-4 group-hover:bg-[#f5bb00] group-hover:text-[#140152] transition-colors">
                      <Quote className="w-5 h-5" />
                    </div>
                    <CardTitle className="text-[#140152] text-xl font-bold">
                      {new Date(t.created_at).toLocaleDateString()}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 leading-relaxed font-medium italic">&ldquo;{t.testimony_text}&rdquo;</p>
                    <div className="mt-6 flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#140152] rounded-full flex items-center justify-center text-white font-bold text-sm">
                        {t.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-[#140152] font-bold text-sm">{t.name}</p>
                        <p className="text-xs text-[#f5bb00] font-bold uppercase tracking-wider">Member</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <p className="text-center col-span-3 text-gray-500">No testimonies yet. Be the first to share!</p>
            )}
          </div>
        )}
      </SectionWrapper>
    </>
  )
}