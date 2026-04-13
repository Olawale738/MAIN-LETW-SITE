'use client'

// ... imports
import { useState, useEffect } from 'react'

import SectionWrapper from '@/components/shared/SectionWrapper'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'

// Define Testimony Interface
interface Testimony {
  id: string
  name: string
  testimony: string
  date: string
  status: 'pending' | 'approved'
}

export default function TestimonyPage() {
  const [formData, setFormData] = useState({ name: '', email: '', testimony: '' })
  const [approvedTestimonies, setApprovedTestimonies] = useState<Testimony[]>([])

  useEffect(() => {
    // Load approved testimonies
    const stored = localStorage.getItem('testimonies')
    if (stored) {
      const all: Testimony[] = JSON.parse(stored)
      setApprovedTestimonies(all.filter(t => t.status === 'approved'))
    }
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const newTestimony: Testimony = {
      id: Date.now().toString(),
      name: formData.name,
      testimony: formData.testimony,
      date: new Date().toLocaleDateString(),
      status: 'pending' // Default status
    }

    // Save to local storage
    const stored = localStorage.getItem('testimonies')
    const all = stored ? JSON.parse(stored) : []
    localStorage.setItem('testimonies', JSON.stringify([...all, newTestimony]))

    alert('Thank you! Your testimony has been submitted for review.')
    setFormData({ name: '', email: '', testimony: '' })
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  return (
    <>
      {/* Hero */}
      <div className="w-full">
        <img
          src="/Testimonies.png"
          alt="Testimonies"
          className="w-full h-auto block"
        />
      </div>

      {/* Share Testimony Form */}
      <SectionWrapper>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
          {/* ... (Left side content details remain same, omitting for brevity in diff but logic preserves UI) ... */}
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
              <label htmlFor="testimony" className="text-xs font-bold text-[#140152] uppercase tracking-widest pl-2">Testimony</label>
              <Textarea id="testimony" name="testimony" required value={formData.testimony} onChange={handleChange} rows={8} className="rounded-2xl border-gray-100" />
            </div>
            <Button type="submit" variant="primary" className="w-full h-14 rounded-full py-0.5 px-1 pl-5 shadow-[0_0_20px_rgba(245,187,0,0.5)]">
              <div className="flex items-center justify-between w-full px-4">
                <p>Submit Testimony</p>
                <ArrowRight className="w-4 h-4 text-[#140152] -rotate-45" />
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {approvedTestimonies.length > 0 ? (
            approvedTestimonies.map((t) => (
              <Card key={t.id} className="hover:shadow-xl transition-all duration-300 border-none shadow-lg group">
                <CardHeader>
                  <div className="w-12 h-12 bg-[#140152]/5 rounded-xl flex items-center justify-center text-[#140152] text-2xl font-black mb-4 group-hover:bg-[#f5bb00] group-hover:text-[#140152] transition-colors">"</div>
                  <CardTitle className="text-[#140152] text-xl font-bold">{t.date}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 leading-relaxed font-medium italic">"{t.testimony}"</p>
                  <div className="mt-6 flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-full" />
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
      </SectionWrapper>
    </>
  )
}