'use client'

import { useState } from 'react'
import Link from 'next/link'
import Hero from '@/components/shared/Hero'
import SectionWrapper from '@/components/shared/SectionWrapper'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import PremiumButton from '@/components/ui/PremiumButton'
import { MapPin, Phone, Mail, Clock, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Form submitted:', formData)
    toast.success('Thank you for contacting us! We will get back to you soon.')
    setFormData({ name: '', email: '', subject: '', message: '' })
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
        title="Contact Us"
        subtitle="We'd love to hear from you"
        height="medium"
      />

      <SectionWrapper>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20">
          {/* Contact Form */}
          <div className="space-y-8">
            <div className="space-y-4 text-center lg:text-left">
              <span className="text-[#f5bb00] font-bold uppercase tracking-[0.2em] text-sm">Send a Message</span>
              <h2 className="text-4xl md:text-5xl font-black text-[#140152]">Get in Touch</h2>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6 bg-white p-8 md:p-12 rounded-[2.5rem] shadow-2xl shadow-gray-100 border border-gray-50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label htmlFor="name" className="text-xs font-bold text-[#140152] uppercase tracking-widest pl-2">
                    Full Name
                  </label>
                  <Input
                    id="name"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="John Doe"
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
                    placeholder="john@example.com"
                    className="rounded-xl border-gray-100 h-14"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="subject" className="text-xs font-bold text-[#140152] uppercase tracking-widest pl-2">
                  Subject
                </label>
                <Input
                  id="subject"
                  name="subject"
                  required
                  value={formData.subject}
                  onChange={handleChange}
                  placeholder="How can we help you?"
                  className="rounded-xl border-gray-100 h-14"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="message" className="text-xs font-bold text-[#140152] uppercase tracking-widest pl-2">
                  Message
                </label>
                <Textarea
                  id="message"
                  name="message"
                  required
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Tell us what's on your mind..."
                  rows={4}
                  className="rounded-2xl border-gray-100"
                />
              </div>

              <Button type="submit" variant="primary" className="w-full h-14 rounded-full py-0.5 px-1 pl-5 shadow-[0_0_20px_rgba(245,187,0,0.5)] hover:shadow-[0_0_30px_rgba(245,187,0,0.6)] transition-shadow duration-300">
                <div className="flex items-center justify-between w-full px-4">
                  <p>Send Message</p>
                  <div className="p-2 bg-white fill-current rounded-full transition-transform group-hover:translate-x-1 text-black">
                    <ArrowRight className="w-4 h-4 text-[#140152] -rotate-45" />
                  </div>
                </div>
              </Button>
            </form>
          </div>

          {/* Contact Information */}
          <div className="space-y-12">
            <div className="space-y-4 text-center lg:text-left">
              <span className="text-[#f5bb00] font-bold uppercase tracking-[0.2em] text-sm">Global Reach</span>
              <h2 className="text-4xl md:text-5xl font-black text-[#140152]">Reach Us Directly</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {[
                { icon: MapPin, title: "Headquarters", info: "123 Church Street, Abuja, FCT, Nigeria" },
                { icon: Phone, title: "Phone Support", info: "+234 123 456 7890 \n +234 098 765 4321" },
                { icon: Mail, title: "Email Address", info: "info@thelight.org \n contact@thelight.org" },
                { icon: Clock, title: "Office Hours", info: "Mon-Fri: 9AM - 5PM \n Sun: Worship Services" }
              ].map((item, i) => (
                <Card key={i} className="group p-2 border-none shadow-xl shadow-gray-100 bg-white">
                  <CardHeader className="space-y-4">
                    <div className="w-14 h-14 bg-[#140152]/5 rounded-2xl flex items-center justify-center text-[#140152] group-hover:bg-[#f5bb00] transition-colors">
                      <item.icon className="w-7 h-7" />
                    </div>
                    <CardTitle className="text-[#140152] text-xl font-black group-hover:text-[#f5bb00] transition-colors">{item.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-[#140152]/60 font-medium whitespace-pre-line leading-relaxed">
                      {item.info}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="p-8 bg-[#140152] rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#f5bb00]/10 rounded-full -translate-y-16 translate-x-16 group-hover:scale-110 transition-transform duration-700" />
              <div className="relative z-10 space-y-4">
                <h3 className="text-2xl font-black text-[#f5bb00]">Prayer Request?</h3>
                <p className="text-white/80 font-medium leading-relaxed">
                  Do you have a specific prayer request? Our pastoral team is ready to pray with you.
                </p>
                <Button variant="light" size="sm" asChild className="rounded-full px-6">
                  <Link href="/prayer-request">Submit Request</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </SectionWrapper>

      {/* Map Section */}
      <SectionWrapper background="gray" padding="medium">
        <div className="aspect-[21/9] bg-white rounded-[3rem] shadow-2xl overflow-hidden border-8 border-white group">
          <div className="w-full h-full bg-gray-50 flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 grayscale opacity-20 bg-[url('https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?w=1200')] bg-cover" />
            <div className="relative z-10 text-center space-y-4">
              <div className="w-16 h-16 bg-[#140152] rounded-full flex items-center justify-center mx-auto shadow-2xl group-hover:scale-110 transition-transform duration-500">
                <MapPin className="text-white w-8 h-8" />
              </div>
              <p className="text-[#140152] font-black text-xl">Find Us in Abuja</p>
              <Button variant="outline" className="rounded-full border-[#140152]/10 hover:bg-[#140152] hover:text-white">Open in Google Maps</Button>
            </div>
          </div>
        </div>
      </SectionWrapper>
    </>
  )
}