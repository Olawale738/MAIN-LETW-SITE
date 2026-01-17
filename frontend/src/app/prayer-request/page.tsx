'use client'

import { useState } from 'react'
import Hero from '@/components/shared/Hero'
import SectionWrapper from '@/components/shared/SectionWrapper'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'

export default function PrayerRequestPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    prayerRequest: ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Prayer request submitted:', formData)
    alert('Thank you for sharing your prayer request. We will lift you up in prayer.')
    setFormData({ name: '', email: '', prayerRequest: '' })
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  return (
    <>
      <Hero
        title="Prayer Request"
        subtitle="Submit your prayer requests and let us join you in prayer"
        height="medium"
      />

      <SectionWrapper>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center max-w-6xl mx-auto">
          <div className="space-y-8 order-2 lg:order-1">
            <div className="space-y-4 text-center lg:text-left">
              <span className="text-[#f5bb00] font-bold uppercase tracking-[0.2em] text-sm">Intercession</span>
              <h2 className="text-4xl md:text-5xl font-black text-[#140152]">How Can We Pray?</h2>
            </div>
            <p className="text-lg text-[#140152]/70 leading-relaxed font-medium text-center lg:text-left">
              We believe in the power of prayer and would be honored to pray for you. Please share your prayer requests with us, and our prayer team will lift you up before the Lord.
            </p>

            <form onSubmit={handleSubmit} className="space-y-6 bg-white p-8 md:p-10 rounded-[2.5rem] shadow-2xl shadow-gray-100 border border-gray-50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label htmlFor="name" className="text-xs font-bold text-[#140152] uppercase tracking-widest pl-2">
                    Name
                  </label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Your name"
                    className="rounded-xl border-gray-100 h-14"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="email" className="text-xs font-bold text-[#140152] uppercase tracking-widest pl-2">
                    Email Address
                  </label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="your.email@example.com"
                    className="rounded-xl border-gray-100 h-14"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="prayerRequest" className="text-xs font-bold text-[#140152] uppercase tracking-widest pl-2">
                  Prayer Request
                </label>
                <Textarea
                  id="prayerRequest"
                  name="prayerRequest"
                  required
                  value={formData.prayerRequest}
                  onChange={handleChange}
                  placeholder="Share your prayer request here..."
                  rows={8}
                  className="rounded-2xl border-gray-100"
                />
              </div>

              <Button type="submit" variant="primary" className="w-full h-14 rounded-full py-0.5 px-1 pl-5 shadow-[0_0_20px_rgba(245,187,0,0.5)] hover:shadow-[0_0_30px_rgba(245,187,0,0.6)] transition-shadow duration-300">
                <div className="flex items-center justify-between w-full px-4">
                  <p>Submit Request</p>
                  <div className="p-2 bg-white fill-current rounded-full transition-transform group-hover:translate-x-1 text-black">
                    <ArrowRight className="w-4 h-4 text-[#140152] -rotate-45" />
                  </div>
                </div>
              </Button>
            </form>
          </div>

          <div className="order-1 lg:order-2 space-y-8">
            <div className="relative h-[500px] rounded-[2.5rem] overflow-hidden shadow-2xl group">
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 group-hover:scale-110"
                style={{ backgroundImage: "url('https://images.unsplash.com/photo-1544427920-c49cc113ffbf?w=800')" }}
              />
              <div className="absolute inset-0 bg-[#140152]/60 mix-blend-multiply" />
              <div className="absolute inset-x-8 bottom-12 text-white text-center space-y-6">
                <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-3xl">🙏</span>
                </div>
                <h3 className="text-2xl font-black">Prayer Changes Things</h3>
                <p className="text-lg italic font-medium leading-relaxed opacity-90">
                  "The prayer of a righteous person is powerful and effective."
                </p>
                <p className="text-[#f5bb00] font-bold uppercase tracking-widest text-sm">- James 5:16</p>
              </div>
            </div>

            <div className="bg-[#f5bb00]/10 p-8 rounded-3xl border border-[#f5bb00]/20 text-center">
              <h4 className="text-[#140152] font-black text-xl mb-2">Need Urgent Prayer?</h4>
              <p className="text-[#140152]/70 font-medium mb-4">You can also call our prayer line directly.</p>
              <div className="text-2xl font-black text-[#140152] tracking-wider">+234 123 456 7890</div>
            </div>
          </div>
        </div>
      </SectionWrapper>
    </>
  )
}