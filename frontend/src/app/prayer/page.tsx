'use client'

import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import PremiumButton from '@/components/ui/PremiumButton'
import SectionWrapper from '@/components/shared/SectionWrapper'
import {
  Globe,
  Heart,
  Shield,
  BookOpen,
  Users,
  Zap,
  Clock,
  Moon,
  Calendar,
  Loader2,
  ExternalLink,
  ArrowRight,
  Send,
  Lock
} from 'lucide-react'
import { prayerApi, PrayerPageData, PrayerRequestCreate, tokenManager } from '@/lib/api'
import * as LucideIcons from 'lucide-react'
import Link from 'next/link'

// Helper function to get icon component from string name
const getIconComponent = (iconName?: string) => {
  if (!iconName) return Globe
  const IconComponent = (LucideIcons as any)[iconName]
  return IconComponent || Globe
}

export default function PrayerPage() {
  const [pageData, setPageData] = useState<PrayerPageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Prayer Request Form State
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [formData, setFormData] = useState<PrayerRequestCreate>({
    title: '',
    description: '',
    category: '',
    is_anonymous: false,
    is_public: true,
  })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    const fetchPageData = async () => {
      try {
        setLoading(true)
        const data = await prayerApi.getPageData()
        setPageData(data)
      } catch (err) {
        console.error('Failed to fetch prayer page data:', err)
        setError('Failed to load prayer page data')
      } finally {
        setLoading(false)
      }
    }

    fetchPageData()

    // Check if user is logged in
    const token = tokenManager.getAccessToken()
    setIsLoggedIn(!!token)
  }, [])

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const target = e.target
    const value = target.type === 'checkbox' ? (target as HTMLInputElement).checked : target.value
    setFormData(prev => ({ ...prev, [target.name]: value }))
  }

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setSubmitting(true)
      await prayerApi.createRequest(formData)
      setSubmitted(true)
      setFormData({ title: '', description: '', category: '', is_anonymous: false, is_public: true })
      setTimeout(() => setSubmitted(false), 5000)
    } catch (err) {
      console.error('Failed to submit prayer request:', err)
      alert('Failed to submit prayer request. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-[#140152] mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (error || !pageData) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Failed to load prayer page'}</p>
          <PremiumButton onClick={() => window.location.reload()}>
            Retry
          </PremiumButton>
        </div>
      </div>
    )
  }

  const { settings, categories, schedules, stats } = pageData

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Hero Section */}
      <div className="w-full">
        <img
          src="/PrayerMeeting.png"
          alt="Prayer Meeting"
          className="w-full h-auto block"
        />
      </div>

      {/* Impact Stats */}
      {stats.length > 0 && (
        <SectionWrapper className="bg-gradient-to-br from-[#140152] via-[#1d0175] to-[#140152]">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="text-5xl md:text-6xl font-black text-[#f5bb00] mb-2">
                  {stat.value}
                </div>
                <div className="text-white/80 font-medium text-lg">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
        </SectionWrapper>
      )}


      {/* Prayer Experience Section */}
      <SectionWrapper>
        <div className="text-center mb-16 space-y-4">
          <span className="text-[#f5bb00] font-bold uppercase tracking-[0.2em] text-sm">
            United in Prayer
          </span>
          <h2 className="text-4xl md:text-5xl font-black text-[#140152]">
            What Happens When We Pray Together
          </h2>
          <div className="w-24 h-1.5 bg-[#f5bb00] mx-auto rounded-full" />
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {categories.map((category, index) => {
            const IconComponent = getIconComponent(category.icon)
            return (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full border-none shadow-lg hover:shadow-xl transition-all group">
                  <CardContent className="p-8">
                    <div className="w-14 h-14 bg-gradient-to-br from-[#140152] to-[#1d0175] rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                      <IconComponent className="w-7 h-7 text-[#f5bb00]" />
                    </div>
                    <h3 className="text-xl font-bold text-[#140152] mb-3">
                      {category.title}
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      {category.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>
      </SectionWrapper>

      {/* Prayer Schedule */}
      {schedules.length > 0 && (
        <SectionWrapper>
          <div className="text-center mb-16 space-y-4">
            <span className="text-[#f5bb00] font-bold uppercase tracking-[0.2em] text-sm">
              Join Us in Prayer
            </span>
            <h2 className="text-4xl md:text-5xl font-black text-[#140152]">
              Prayer Schedule
            </h2>
            <div className="w-24 h-1.5 bg-[#f5bb00] mx-auto rounded-full" />
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {schedules.map((schedule, index) => {
              const ScheduleIcon = getIconComponent(schedule.icon)
              return (
                <motion.div
                  key={schedule.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="h-full border-none shadow-lg hover:shadow-xl transition-all group">
                    <CardContent className="p-8">
                      <div className="w-14 h-14 bg-gradient-to-br from-[#f5bb00] to-[#d4a000] rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                        <ScheduleIcon className="w-7 h-7 text-[#140152]" />
                      </div>
                      <h3 className="text-xl font-bold text-[#140152] mb-2">
                        {schedule.program_name}
                      </h3>
                      <p className="text-[#f5bb00] font-semibold mb-3">
                        {schedule.time_description}
                      </p>
                      {schedule.description && (
                        <p className="text-gray-600 leading-relaxed mb-4">
                          {schedule.description}
                        </p>
                      )}
                      {schedule.meeting_link && (
                        <a
                          href={schedule.meeting_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-[#140152] font-semibold hover:text-[#f5bb00] transition-colors"
                        >
                          Join Meeting
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        </SectionWrapper>
      )}

      {/* Submit Prayer Request Section */}
      <SectionWrapper background="gray">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
          <div className="space-y-6">
            <div className="space-y-2">
              <span className="text-[#f5bb00] font-bold uppercase tracking-[0.2em] text-sm">Prayer Request</span>
              <h2 className="text-4xl md:text-5xl font-black text-[#140152]">Share Your Prayer Need</h2>
            </div>
            <p className="text-lg text-[#140152]/70 leading-relaxed font-medium">
              We believe in the power of united prayer. Share your prayer request and let our community
              stand with you in faith. Your request will be reviewed and shared with our prayer team.
            </p>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#f5bb00]" />
                <span>Your privacy is protected</span>
              </div>
              <div className="flex items-center gap-2">
                <Heart className="w-4 h-4 text-[#f5bb00]" />
                <span>Our team prays daily</span>
              </div>
            </div>
          </div>

          {isLoggedIn ? (
            <form onSubmit={handleSubmitRequest} className="space-y-5 bg-white p-8 md:p-10 rounded-[2.5rem] shadow-2xl shadow-gray-200 border border-gray-50">
              {submitted && (
                <div className="bg-green-50 border border-green-200 rounded-2xl p-4 text-green-800 text-sm font-medium text-center">
                  ✅ Your prayer request has been submitted! Our prayer team will review it soon.
                </div>
              )}

              <div className="space-y-2">
                <label htmlFor="title" className="text-xs font-bold text-[#140152] uppercase tracking-widest pl-2">Prayer Title</label>
                <Input
                  id="title"
                  name="title"
                  required
                  value={formData.title}
                  onChange={handleFormChange}
                  placeholder="e.g. Healing, Guidance, Protection"
                  className="rounded-xl border-gray-100 h-14"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="description" className="text-xs font-bold text-[#140152] uppercase tracking-widest pl-2">Your Prayer Request</label>
                <Textarea
                  id="description"
                  name="description"
                  required
                  value={formData.description}
                  onChange={handleFormChange}
                  placeholder="Share your prayer need with us..."
                  rows={5}
                  className="rounded-2xl border-gray-100"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="category" className="text-xs font-bold text-[#140152] uppercase tracking-widest pl-2">Category (Optional)</label>
                <select
                  id="category"
                  name="category"
                  value={formData.category || ''}
                  onChange={handleFormChange}
                  className="flex h-14 w-full rounded-xl border border-gray-100 bg-white px-3 py-2 text-sm text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#140152] focus-visible:ring-offset-2"
                >
                  <option value="">Select a category</option>
                  <option value="healing">Healing</option>
                  <option value="guidance">Guidance</option>
                  <option value="protection">Protection</option>
                  <option value="provision">Provision</option>
                  <option value="family">Family</option>
                  <option value="spiritual_growth">Spiritual Growth</option>
                  <option value="thanksgiving">Thanksgiving</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="is_anonymous"
                    checked={formData.is_anonymous}
                    onChange={handleFormChange}
                    className="w-4 h-4 rounded border-gray-300 text-[#140152] focus:ring-[#140152]"
                  />
                  <span className="text-sm text-gray-700 font-medium">Submit anonymously</span>
                </label>
              </div>

              <PremiumButton
                type="submit"
                disabled={submitting}
                className="w-full h-14 rounded-full py-0.5 px-1 pl-5 shadow-[0_0_20px_rgba(245,187,0,0.5)]"
              >
                <div className="flex items-center justify-between w-full px-4">
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <p>Submit Prayer Request</p>
                      <Send className="w-4 h-4" />
                    </>
                  )}
                </div>
              </PremiumButton>
            </form>
          ) : (
            <div className="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-2xl shadow-gray-200 border border-gray-50 text-center space-y-6">
              <div className="w-20 h-20 bg-[#140152]/5 rounded-full flex items-center justify-center mx-auto">
                <Lock className="w-10 h-10 text-[#140152]/40" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-[#140152] mb-2">Sign in to Submit</h3>
                <p className="text-gray-600">
                  Please log in or create an account to submit a prayer request. This helps us keep track of your requests and pray with you.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/auth/login">
                  <PremiumButton className="px-8">
                    Log In
                  </PremiumButton>
                </Link>
                <Link href="/join">
                  <PremiumButton className="px-8 bg-gray-100 text-[#140152] hover:bg-gray-200">
                    Create Account
                  </PremiumButton>
                </Link>
              </div>
            </div>
          )}
        </div>
      </SectionWrapper>

      {/* Final Call Section */}
      <SectionWrapper>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="bg-gradient-to-br from-[#140152] via-[#1d0175] to-[#140152] rounded-[3rem] p-12 md:p-20 text-center text-white relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#f5bb00] rounded-full blur-[150px] opacity-20" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500 rounded-full blur-[150px] opacity-20" />

          <div className="relative z-10 max-w-4xl mx-auto">
            <h2 className="text-4xl md:text-6xl font-black mb-8 text-white">
              The Altar is Open
            </h2>
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8 mb-10">
              <p className="text-xl md:text-2xl text-[#f5bb00] font-bold italic">
                &quot;{settings.scripture_text}&quot;
              </p>
              <p className="text-white/80 mt-2">— {settings.scripture_reference}</p>
            </div>
            <p className="text-2xl md:text-3xl text-gray-200 mb-12 font-light leading-relaxed">
              {settings.call_to_action_text}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {settings.live_prayer_link && (
                <a href={settings.live_prayer_link} target="_blank" rel="noopener noreferrer">
                  <PremiumButton className="px-12 py-7 text-lg bg-[#f5bb00] text-[#140152] hover:bg-white">
                    Enter the Prayer Room Now
                  </PremiumButton>
                </a>
              )}

            </div>
          </div>
        </motion.div>
      </SectionWrapper>
    </div>
  )
}
