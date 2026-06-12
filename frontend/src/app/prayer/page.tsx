'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import PremiumButton from '@/components/ui/PremiumButton'
import SectionWrapper from '@/components/shared/SectionWrapper'
import {
  Globe,
  Loader2,
  Heart,
  ArrowRight,
  Sparkles,
  ExternalLink
} from 'lucide-react'
import { prayerApi, PrayerPageData, cmsApi } from '@/lib/api'
import * as LucideIcons from 'lucide-react'
import ServiceAnnouncements from '@/components/shared/ServiceAnnouncements'

const getIconComponent = (iconName?: string) => {
  if (!iconName) return Globe
  const IconComponent = (LucideIcons as any)[iconName]
  return IconComponent || Globe
}

const resolveImage = (src?: string) => {
  if (!src) return '/PrayerMeeting.png'
  return src.startsWith('http') || src.startsWith('/') ? src : cmsApi.getImageUrl(src)
}

export default function PrayerPage() {
  const [pageData, setPageData] = useState<PrayerPageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
  }, [])

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
          <PremiumButton onClick={() => window.location.reload()}>Retry</PremiumButton>
        </div>
      </div>
    )
  }

  const { settings, categories, schedules, stats } = pageData
  const answeredPrayers = pageData.answered_prayers || []
  const wallPreview = pageData.wall_preview || []

  const activeCategories = categories.filter(c => c.is_active).sort((a, b) => a.order_index - b.order_index)
  const activeSchedules = schedules.filter(s => s.is_active).sort((a, b) => a.order_index - b.order_index)
  const activeStats = stats.filter(s => s.is_active).sort((a, b) => a.order_index - b.order_index)

  // Default pillars + steps that render even if admin hasn't saved any yet
  const DEFAULT_PILLARS = [
    { icon: 'Flame', title: 'Persistent', description: "We don't pray and quit. We pray until heaven moves and earth shifts beneath our feet." },
    { icon: 'Sword', title: 'Believing', description: 'Faith is the currency of the prayer altar. We lift voices that expect, not voices that hope.' },
    { icon: 'HeartHandshake', title: 'United', description: 'No one prays alone here. When one of us kneels, all of us stand. We carry each other.' },
  ]
  const DEFAULT_STEPS = [
    { number: '01', title: 'Submit Your Request', description: 'Tell us what you need God to do. Anonymous or named, public or private - your choice.', link: '/prayer-request', link_text: 'Submit a Request' },
    { number: '02', title: 'Pray With Us Live', description: 'Join a scheduled gathering or step into the prayer room any moment of the day.', link: '#schedules', link_text: 'See Schedule' },
    { number: '03', title: 'Share Your Testimony', description: 'When God answers, come back and tell us. Your story becomes someone else\'s fuel.', link: '/testimony', link_text: 'Share Testimony' },
  ]
  const pillars: Array<{ icon?: string; title: string; description: string }> =
    (Array.isArray(settings.manifesto_pillars) && settings.manifesto_pillars.length > 0)
      ? settings.manifesto_pillars
      : DEFAULT_PILLARS
  const steps: Array<{ number?: string; title: string; description?: string; link?: string; link_text?: string }> =
    (Array.isArray(settings.how_steps) && settings.how_steps.length > 0)
      ? settings.how_steps
      : DEFAULT_STEPS

  const heroImg = resolveImage(settings.hero_image_url)

  const primaryHref = settings.primary_cta_link || settings.live_prayer_link || ''
  const primaryText = settings.primary_cta_text || 'Enter the Prayer Room'
  const secondaryHref = settings.secondary_cta_link || '/prayer-request'
  const secondaryText = settings.secondary_cta_text || 'Submit a Prayer Request'

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* ─── CINEMATIC HERO ───────────────────────────────────────────── */}
      <section className="relative w-full overflow-hidden bg-[#0a0028]">
        {/* background */}
        <div className="absolute inset-0">
          <img
            src={heroImg}
            alt={settings.hero_title}
            className="w-full h-full object-cover opacity-70"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a0028]/30 via-[#0a0028]/50 to-[#0a0028]/90" />
          <div className="absolute top-1/3 right-0 w-[40rem] h-[40rem] bg-[#f5bb00]/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 left-0 w-[30rem] h-[30rem] bg-[#7c3aed]/15 rounded-full blur-[100px]" />
        </div>

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-32 md:py-44 text-center text-white">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-[11px] md:text-xs font-bold uppercase tracking-[0.4em] text-[#f5bb00] mb-5"
          >
            {settings.hero_eyebrow || 'United in Prayer'}
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.05 }}
            className="text-4xl md:text-6xl lg:text-7xl font-black leading-[1.05] mb-4"
          >
            {settings.hero_title}
          </motion.h1>
          {settings.hero_subtitle && (
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.15 }}
              className="text-xl md:text-2xl text-[#f5bb00] font-bold italic"
              style={{ fontFamily: '"Cormorant Garamond","Playfair Display",Georgia,serif' }}
            >
              {settings.hero_subtitle}
            </motion.p>
          )}
          {settings.hero_description && (
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.25 }}
              className="mt-6 text-base md:text-lg text-white/85 max-w-2xl mx-auto leading-relaxed"
            >
              {settings.hero_description}
            </motion.p>
          )}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.35 }}
            className="mt-10 flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            {primaryHref && (
              <Link
                href={primaryHref}
                target={primaryHref.startsWith('http') ? '_blank' : undefined}
                rel={primaryHref.startsWith('http') ? 'noopener noreferrer' : undefined}
                className="inline-flex items-center gap-2 bg-[#f5bb00] hover:bg-white text-[#140152] font-bold px-8 py-4 rounded-full transition-all hover:scale-105 shadow-2xl"
              >
                {primaryText}
                {primaryHref.startsWith('http') ? <ExternalLink className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
              </Link>
            )}
            {secondaryHref && (
              <Link
                href={secondaryHref}
                className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/30 text-white font-bold px-8 py-4 rounded-full transition-all hover:scale-105"
              >
                <Heart className="w-4 h-4" />
                {secondaryText}
              </Link>
            )}
          </motion.div>
        </div>
      </section>

      {/* Service Announcements (kept) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <ServiceAnnouncements serviceName="Prayer meeting" />
      </div>

      {/* ─── MANIFESTO / "Why We Pray" — NEW ─────────────────────────── */}
      {pillars.length > 0 && (
        <section className="relative py-20 md:py-28 bg-gradient-to-b from-neutral-50 to-white overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[60rem] h-[60rem] bg-[#f5bb00]/5 rounded-full blur-[140px] pointer-events-none" />
          <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-14 md:mb-16 space-y-4">
              <span className="block text-[#f5bb00] font-bold uppercase tracking-[0.35em] text-xs">
                {settings.manifesto_eyebrow || 'The Heart Behind the Altar'}
              </span>
              <h2 className="text-3xl md:text-5xl font-black text-[#140152] leading-tight max-w-3xl mx-auto">
                {settings.manifesto_heading || "We Don't Just Pray. We War."}
              </h2>
              <div className="w-24 h-1.5 bg-gradient-to-r from-[#140152] via-[#7c3aed] to-[#f5bb00] mx-auto rounded-full" />
              {settings.manifesto_subtitle && (
                <p className="text-gray-600 max-w-2xl mx-auto leading-relaxed">
                  {settings.manifesto_subtitle}
                </p>
              )}
            </div>

            <div className={`grid gap-6 md:gap-8 ${
              pillars.length === 1 ? 'grid-cols-1 max-w-md mx-auto' :
              pillars.length === 2 ? 'grid-cols-1 md:grid-cols-2' :
              'grid-cols-1 md:grid-cols-3'
            }`}>
              {pillars.map((p, idx) => {
                const Icon = getIconComponent(p.icon || 'Sparkles')
                return (
                  <motion.div
                    key={`pillar-${idx}`}
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.08 }}
                    className="relative group rounded-3xl bg-white border border-gray-100 shadow-lg p-7 md:p-9 hover:shadow-2xl hover:-translate-y-1 transition-all overflow-hidden"
                  >
                    <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#140152] via-[#7c3aed] to-[#f5bb00]" />
                    <div className="w-14 h-14 bg-gradient-to-br from-[#140152] to-[#1d0175] rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 group-hover:rotate-3 transition-all shadow-lg">
                      <Icon className="w-7 h-7 text-[#f5bb00]" />
                    </div>
                    <h3 className="text-xl md:text-2xl font-black text-[#140152] mb-2 leading-tight">{p.title}</h3>
                    {p.description && (
                      <p className="text-gray-600 leading-relaxed">{p.description}</p>
                    )}
                  </motion.div>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* ─── STATS BAND (was loaded but never rendered) ───────────────── */}
      {activeStats.length > 0 && (
        <section className="relative py-16 md:py-20 bg-gradient-to-br from-[#140152] via-[#1d0175] to-[#140152] text-white overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#f5bb00] rounded-full blur-[180px] opacity-15 pointer-events-none" />
          <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10 md:mb-14">
              <p className="text-[11px] md:text-xs font-bold uppercase tracking-[0.4em] text-[#f5bb00] mb-3">
                {settings.stats_eyebrow || 'The Movement'}
              </p>
              <h2 className="text-3xl md:text-5xl font-black leading-tight">
                {settings.stats_heading || 'Lives Touched. Nations Shifted.'}
              </h2>
              {settings.stats_subtitle && (
                <p className="mt-4 text-white/75 max-w-2xl mx-auto">
                  {settings.stats_subtitle}
                </p>
              )}
            </div>

            <div className={`grid gap-6 md:gap-8 ${
              activeStats.length === 1 ? 'grid-cols-1 max-w-sm mx-auto' :
              activeStats.length === 2 ? 'grid-cols-1 sm:grid-cols-2 max-w-2xl mx-auto' :
              activeStats.length === 3 ? 'grid-cols-1 sm:grid-cols-3' :
              'grid-cols-2 lg:grid-cols-4'
            }`}>
              {activeStats.map((stat, idx) => (
                <motion.div
                  key={stat.id}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: idx * 0.08 }}
                  className="text-center bg-white/5 border border-white/10 backdrop-blur-sm rounded-2xl px-5 py-6 md:py-8 hover:border-[#f5bb00]/40 transition-colors"
                >
                  <div className="text-4xl md:text-6xl font-black bg-gradient-to-br from-[#f5bb00] to-[#ffd633] bg-clip-text text-transparent">
                    {stat.value}
                  </div>
                  <p className="mt-2 text-[10px] md:text-xs font-bold uppercase tracking-[0.25em] text-white/70">
                    {stat.label}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── CATEGORIES GRID ─────────────────────────────────────────── */}
      {activeCategories.length > 0 && (
        <SectionWrapper>
          <div className="text-center mb-14 md:mb-16 space-y-4">
            <span className="block text-[#f5bb00] font-bold uppercase tracking-[0.3em] text-xs">
              {settings.categories_eyebrow || 'United in Prayer'}
            </span>
            <h2 className="text-3xl md:text-5xl font-black text-[#140152] leading-tight">
              {settings.categories_heading || 'What Happens When We Pray Together'}
            </h2>
            <div className="w-24 h-1.5 bg-[#f5bb00] mx-auto rounded-full" />
            {settings.categories_subtitle && (
              <p className="text-gray-600 max-w-2xl mx-auto">
                {settings.categories_subtitle}
              </p>
            )}
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {activeCategories.map((category, index) => {
              const IconComponent = getIconComponent(category.icon)
              return (
                <motion.div
                  key={category.id}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.07 }}
                >
                  <Card className="h-full border-none shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all group bg-white">
                    <CardContent className="p-7 md:p-8">
                      <div className="w-14 h-14 bg-gradient-to-br from-[#140152] to-[#1d0175] rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 group-hover:rotate-3 transition-all shadow-lg">
                        <IconComponent className="w-7 h-7 text-[#f5bb00]" />
                      </div>
                      <h3 className="text-xl font-black text-[#140152] mb-2">
                        {category.title}
                      </h3>
                      {category.description && (
                        <p className="text-gray-600 leading-relaxed text-[15px]">
                          {category.description}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        </SectionWrapper>
      )}

      {/* ─── HOW TO PRAY WITH US — NEW ────────────────────────────────── */}
      {steps.length > 0 && (
        <section className="relative py-20 md:py-28 bg-gradient-to-br from-[#0a0028] via-[#140152] to-[#0a0028] text-white overflow-hidden">
          <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-[#7c3aed]/20 rounded-full blur-[150px]" />
          <div className="absolute bottom-0 left-0 w-[35rem] h-[35rem] bg-[#f5bb00]/15 rounded-full blur-[120px]" />
          <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-14 md:mb-16 space-y-4">
              <span className="block text-[#f5bb00] font-bold uppercase tracking-[0.35em] text-xs">
                {settings.how_eyebrow || 'Three Steps'}
              </span>
              <h2 className="text-3xl md:text-5xl font-black leading-tight">
                {settings.how_heading || 'How To Pray With Us'}
              </h2>
              <div className="w-24 h-1.5 bg-[#f5bb00] mx-auto rounded-full" />
              {settings.how_subtitle && (
                <p className="text-white/75 max-w-2xl mx-auto leading-relaxed">
                  {settings.how_subtitle}
                </p>
              )}
            </div>

            <div className={`grid gap-6 md:gap-8 ${
              steps.length === 1 ? 'grid-cols-1 max-w-md mx-auto' :
              steps.length === 2 ? 'grid-cols-1 md:grid-cols-2' :
              'grid-cols-1 md:grid-cols-3'
            }`}>
              {steps.map((s, idx) => (
                <motion.div
                  key={`step-${idx}`}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className="relative rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm p-7 md:p-9 hover:border-[#f5bb00]/40 transition-colors overflow-hidden group"
                >
                  <div className="absolute -top-6 -right-6 text-[7rem] md:text-[9rem] font-black text-white/[0.06] leading-none select-none pointer-events-none">
                    {s.number || `0${idx + 1}`}
                  </div>
                  <div className="relative">
                    <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-[#f5bb00] mb-3">
                      Step {s.number || `0${idx + 1}`}
                    </p>
                    <h3 className="text-xl md:text-2xl font-black mb-3 leading-tight">{s.title}</h3>
                    {s.description && (
                      <p className="text-white/75 leading-relaxed mb-5">{s.description}</p>
                    )}
                    {s.link && s.link_text && (
                      <Link
                        href={s.link}
                        className="inline-flex items-center gap-2 text-[#f5bb00] font-bold text-sm hover:gap-3 transition-all"
                      >
                        {s.link_text} <ArrowRight className="w-4 h-4" />
                      </Link>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── SCHEDULES (was completely missing from the live page!) ──── */}
      {activeSchedules.length > 0 && (
        <section className="py-16 md:py-24 bg-gradient-to-b from-white to-neutral-50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-14 md:mb-16 space-y-4">
              <span className="block text-[#f5bb00] font-bold uppercase tracking-[0.3em] text-xs">
                {settings.schedules_eyebrow || 'When We Gather'}
              </span>
              <h2 className="text-3xl md:text-5xl font-black text-[#140152] leading-tight">
                {settings.schedules_heading || 'Join a Prayer Gathering'}
              </h2>
              <div className="w-24 h-1.5 bg-[#f5bb00] mx-auto rounded-full" />
              {settings.schedules_subtitle && (
                <p className="text-gray-600 max-w-2xl mx-auto">
                  {settings.schedules_subtitle}
                </p>
              )}
            </div>

            <div className={`grid gap-6 md:gap-8 ${
              activeSchedules.length === 1 ? 'grid-cols-1 max-w-md mx-auto' :
              activeSchedules.length === 2 ? 'grid-cols-1 md:grid-cols-2' :
              'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
            }`}>
              {activeSchedules.map((schedule, index) => {
                const IconComponent = getIconComponent(schedule.icon)
                return (
                  <motion.div
                    key={schedule.id}
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.07 }}
                    className="relative group rounded-3xl bg-white border border-gray-100 shadow-lg p-7 md:p-8 hover:shadow-2xl hover:-translate-y-1 transition-all overflow-hidden"
                  >
                    <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#140152] via-[#7c3aed] to-[#f5bb00]" />
                    <div className="flex items-start gap-4">
                      <div className="shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-[#f5bb00] to-[#d4a000] flex items-center justify-center shadow-md">
                        <IconComponent className="w-6 h-6 text-[#140152]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg md:text-xl font-black text-[#140152] mb-1 leading-tight">
                          {schedule.program_name}
                        </h3>
                        <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#7c3aed] mb-3">
                          {schedule.time_description}
                        </p>
                        {schedule.description && (
                          <p className="text-sm text-gray-600 leading-relaxed">
                            {schedule.description}
                          </p>
                        )}
                        {schedule.meeting_link && (
                          <a
                            href={schedule.meeting_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 mt-4 text-sm font-bold text-[#140152] hover:text-[#f5bb00] transition-colors"
                          >
                            Join the link <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* ─── ANSWERED PRAYERS / TESTIMONIES — NEW ─────────────────────── */}
      {answeredPrayers.length > 0 && (
        <section className="py-20 md:py-28 bg-gradient-to-b from-neutral-50 to-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-14 md:mb-16 space-y-4">
              <span className="block text-[#f5bb00] font-bold uppercase tracking-[0.35em] text-xs">
                {settings.answered_eyebrow || 'He Is Faithful'}
              </span>
              <h2 className="text-3xl md:text-5xl font-black text-[#140152] leading-tight">
                {settings.answered_heading || 'Recent Answered Prayers'}
              </h2>
              <div className="w-24 h-1.5 bg-[#f5bb00] mx-auto rounded-full" />
              {settings.answered_subtitle && (
                <p className="text-gray-600 max-w-2xl mx-auto leading-relaxed">
                  {settings.answered_subtitle}
                </p>
              )}
            </div>

            <div className={`grid gap-6 md:gap-8 ${
              answeredPrayers.length === 1 ? 'grid-cols-1 max-w-2xl mx-auto' :
              answeredPrayers.length === 2 ? 'grid-cols-1 md:grid-cols-2' :
              'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
            }`}>
              {answeredPrayers.map((a, idx) => (
                <motion.div
                  key={a.id}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.07 }}
                  className="relative rounded-3xl bg-white border border-gray-100 shadow-lg p-7 md:p-8 hover:shadow-2xl hover:-translate-y-1 transition-all overflow-hidden"
                >
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-400 to-[#f5bb00]" />
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-emerald-600">Answered</p>
                  </div>
                  <h3 className="text-lg md:text-xl font-black text-[#140152] mb-3 leading-tight line-clamp-2">
                    {a.title}
                  </h3>
                  <p className="text-gray-700 leading-relaxed line-clamp-4 mb-4 italic text-[15px]" style={{ fontFamily: '"Cormorant Garamond","Playfair Display",Georgia,serif' }}>
                    &ldquo;{a.testimony}&rdquo;
                  </p>
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <p className="text-xs font-bold text-[#140152]">— {a.author_name}</p>
                    {a.category && (
                      <span className="text-[10px] uppercase tracking-widest font-bold text-[#7c3aed] bg-[#7c3aed]/10 px-2 py-1 rounded">
                        {a.category}
                      </span>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── PRAYER WALL PREVIEW — NEW ────────────────────────────────── */}
      {wallPreview.length > 0 && (
        <section className="py-20 md:py-28 bg-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-14 md:mb-16 space-y-4">
              <span className="block text-[#f5bb00] font-bold uppercase tracking-[0.35em] text-xs">
                {settings.wall_eyebrow || 'The Wall Is Alive'}
              </span>
              <h2 className="text-3xl md:text-5xl font-black text-[#140152] leading-tight">
                {settings.wall_heading || 'Stand With Your Brothers and Sisters'}
              </h2>
              <div className="w-24 h-1.5 bg-[#f5bb00] mx-auto rounded-full" />
              {settings.wall_subtitle && (
                <p className="text-gray-600 max-w-2xl mx-auto leading-relaxed">
                  {settings.wall_subtitle}
                </p>
              )}
            </div>

            <div className={`grid gap-5 md:gap-6 mb-10 ${
              wallPreview.length === 1 ? 'grid-cols-1 max-w-xl mx-auto' :
              wallPreview.length === 2 ? 'grid-cols-1 md:grid-cols-2' :
              'grid-cols-1 md:grid-cols-2'
            }`}>
              {wallPreview.map((w, idx) => (
                <motion.div
                  key={w.id}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.06 }}
                  className="relative rounded-3xl bg-gradient-to-br from-white via-white to-[#fbf5e6] border border-gray-100 shadow-md p-6 md:p-7 hover:shadow-xl transition-all overflow-hidden"
                >
                  <div className="absolute top-0 bottom-0 left-0 w-1.5 bg-gradient-to-b from-[#140152] via-[#7c3aed] to-[#f5bb00]" />
                  <div className="flex items-start justify-between gap-4 mb-3 ml-2">
                    <h3 className="text-base md:text-lg font-black text-[#140152] leading-tight line-clamp-1 flex-1">
                      {w.title}
                    </h3>
                    {w.category && (
                      <span className="shrink-0 text-[10px] uppercase tracking-widest font-bold text-[#7c3aed] bg-[#7c3aed]/10 px-2 py-1 rounded">
                        {w.category}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed line-clamp-3 mb-4 ml-2">
                    {w.description}
                  </p>
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100 ml-2">
                    <p className="text-xs font-bold text-gray-500">— {w.author_name}</p>
                    <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#140152]">
                      <Heart className="w-3.5 h-3.5 text-[#f5bb00] fill-[#f5bb00]" />
                      {w.prayer_count} {w.prayer_count === 1 ? 'prayer' : 'prayers'}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {(settings.wall_link || '/dashboard/prayer-wall') && (
              <div className="text-center">
                <Link
                  href={settings.wall_link || '/dashboard/prayer-wall'}
                  className="inline-flex items-center gap-2 bg-[#140152] hover:bg-[#1d0175] text-white font-bold px-7 py-3.5 rounded-full transition-all hover:scale-105 shadow-lg"
                >
                  {settings.wall_link_text || 'See The Whole Wall'} <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ─── THE ALTAR IS OPEN — FINAL CALL ──────────────────────────── */}
      <SectionWrapper>
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="bg-gradient-to-br from-[#140152] via-[#1d0175] to-[#140152] rounded-[3rem] p-10 md:p-16 lg:p-20 text-center text-white relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#f5bb00] rounded-full blur-[150px] opacity-20" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500 rounded-full blur-[150px] opacity-20" />

          <div className="relative z-10 max-w-4xl mx-auto">
            {settings.final_eyebrow && (
              <p className="text-[11px] md:text-xs font-bold uppercase tracking-[0.4em] text-[#f5bb00] mb-5">
                {settings.final_eyebrow}
              </p>
            )}
            <h2 className="text-4xl md:text-6xl font-black mb-8 text-white leading-[1.05]">
              {settings.final_heading || 'The Altar Is Open'}
            </h2>

            {settings.scripture_text && (
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-7 md:p-9 mb-10">
                <Sparkles className="w-6 h-6 text-[#f5bb00] mx-auto mb-3" />
                <p
                  className="text-xl md:text-2xl text-[#f5bb00] font-bold italic leading-snug"
                  style={{ fontFamily: '"Cormorant Garamond","Playfair Display",Georgia,serif' }}
                >
                  &ldquo;{settings.scripture_text}&rdquo;
                </p>
                {settings.scripture_reference && (
                  <p className="text-white/80 mt-3 text-sm tracking-wide">— {settings.scripture_reference}</p>
                )}
              </div>
            )}

            {settings.call_to_action_text && (
              <p className="text-xl md:text-2xl text-gray-200 mb-10 font-light leading-relaxed max-w-3xl mx-auto">
                {settings.call_to_action_text}
              </p>
            )}

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              {primaryHref && (
                <Link
                  href={primaryHref}
                  target={primaryHref.startsWith('http') ? '_blank' : undefined}
                  rel={primaryHref.startsWith('http') ? 'noopener noreferrer' : undefined}
                >
                  <PremiumButton className="px-10 md:px-12 py-6 md:py-7 text-base md:text-lg bg-[#f5bb00] text-[#140152] hover:bg-white">
                    {primaryText}
                  </PremiumButton>
                </Link>
              )}
              {secondaryHref && (
                <Link
                  href={secondaryHref}
                  className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/30 text-white font-bold px-8 md:px-10 py-5 md:py-6 rounded-full transition-all hover:scale-105"
                >
                  <Heart className="w-4 h-4" />
                  {secondaryText}
                </Link>
              )}
            </div>
          </div>
        </motion.div>
      </SectionWrapper>
    </div>
  )
}
