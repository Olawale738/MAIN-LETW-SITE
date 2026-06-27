'use client'
/**
 * /volunteer — every visible string is admin-editable via ministry-content
 * key 'volunteer-page'. Bundled DEFAULTS render before the admin overrides
 * arrive, so the page never flashes empty.
 *
 * Icons stay fixed in code (so admins can't accidentally break the layout
 * by typing an unknown lucide name). Admin picks an icon by name from a
 * fixed allow-list; the page maps it to the actual component.
 */

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Heart, Users, Music, BookOpen, Camera, Coffee,
  Shield, Mic2, Baby, ArrowRight, CheckCircle, Star, Sparkles,
} from 'lucide-react'
import { ministryContentApi, serviceRequestApi } from '@/lib/api'

// ─── Fixed icon allow-list — admin picks by name; we resolve at render. ──
const ICONS: Record<string, any> = {
  Heart, Users, Music, BookOpen, Camera, Coffee, Shield, Mic2, Baby, Star, Sparkles, CheckCircle,
}
export const VOLUNTEER_ICON_NAMES = Object.keys(ICONS)

// ─── Config shape mirrored in /admin/volunteer-page ─────────────────────
interface VolunteerDept   { icon: string; title: string; desc: string; spots: string }
interface VolunteerReason { icon: string; title: string; desc: string }

export interface VolunteerConfig {
  hero: {
    eyebrow: string; title_line_1: string; title_line_2: string
    subtitle: string; cta_label: string
  }
  why: { eyebrow: string; heading: string; points: VolunteerReason[] }
  departments: { eyebrow: string; heading: string; items: VolunteerDept[] }
  form: {
    eyebrow: string; heading: string; sub: string
    submit_label: string
    success_heading: string; success_body: string
    availability_options: string[]
  }
  banner: { quote: string; ref: string; cta_label: string; ask_label: string }
}

const DEFAULTS: VolunteerConfig = {
  hero: {
    eyebrow: 'Serve with Purpose',
    title_line_1: 'Your Time.',
    title_line_2: "God's Work.",
    subtitle: "Volunteering at LETW is not about filling a role — it's about fulfilling your calling. Join hundreds of members who are changing lives through faithful service.",
    cta_label: 'Apply to Volunteer',
  },
  why: {
    eyebrow: 'Why It Matters',
    heading: 'Why Serve at LETW?',
    points: [
      { icon: 'Sparkles', title: 'Eternal Impact',  desc: 'Every hour you serve plants seeds that last beyond this lifetime.' },
      { icon: 'Users',    title: 'Community',       desc: 'Forge deep friendships with like-minded believers who share your values.' },
      { icon: 'Star',     title: 'Grow Your Gifts', desc: 'Discover and develop the unique gifts God has placed inside you.' },
      { icon: 'Heart',    title: 'Give Back',       desc: "Respond to God's goodness by investing your time in His house." },
    ],
  },
  departments: {
    eyebrow: 'Find Your Place',
    heading: 'Volunteer Departments',
    items: [
      { icon: 'Music',    title: 'Worship Team',              desc: 'Singers, musicians, and sound engineers glorifying God through music.', spots: 'Open spots' },
      { icon: 'Baby',     title: "Children's Ministry",       desc: 'Teach, nurture, and protect the next generation in faith.',             spots: 'Open spots' },
      { icon: 'Users',    title: 'Ushering & Welcome',        desc: 'Be the first smile people see. Create a warm atmosphere for all.',      spots: 'Open spots' },
      { icon: 'BookOpen', title: 'Bible Study Facilitator',   desc: 'Lead small-group discussions and help members dig into the Word.',      spots: 'Open spots' },
      { icon: 'Camera',   title: 'Media & Creative',          desc: 'Photography, videography, graphics, and social media for the church.',  spots: 'Open spots' },
      { icon: 'Coffee',   title: 'Hospitality Team',          desc: 'Food, fellowship events, and making everyone feel at home.',            spots: 'Open spots' },
      { icon: 'Mic2',     title: 'Youth Ministry',            desc: 'Mentor and empower teens and young adults to lead lives of purpose.',   spots: 'Open spots' },
      { icon: 'Shield',   title: 'Security & Safety',         desc: 'Keep the church environment safe and orderly for all members.',         spots: 'Open spots' },
      { icon: 'Heart',    title: 'Counselling Support',       desc: 'Assist our counselling team with admin, scheduling, and prayer support.', spots: 'Open spots' },
    ],
  },
  form: {
    eyebrow: 'Take the First Step',
    heading: 'Volunteer Application',
    sub: 'Our team will review your application and reach out shortly.',
    submit_label: 'Submit Application',
    success_heading: 'Application Received!',
    success_body: 'Thank you for your heart to serve! Our volunteer coordinator will contact you shortly. Welcome to the family of servants.',
    availability_options: ['Sundays only', 'Weekdays', 'Weekends', 'Any day', 'Flexible / as needed'],
  },
  banner: {
    quote: '"Each of you should use whatever gift you have received to serve others."',
    ref: '— 1 Peter 4:10',
    cta_label: 'Apply Now',
    ask_label: 'Ask a Question',
  },
}

function iconOf(name: string) {
  return ICONS[name] || Heart
}

export default function VolunteerPage() {
  const [cfg, setCfg] = useState<VolunteerConfig>(DEFAULTS)
  const [form, setForm] = useState({ name: '', email: '', phone: '', department: '', availability: '', experience: '' })
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Field-level merge so partial admin saves never blank a section.
  useEffect(() => {
    ministryContentApi.get('volunteer-page')
      .then(r => {
        const c = (r.content || {}) as Partial<VolunteerConfig>
        setCfg({
          hero:        { ...DEFAULTS.hero, ...(c.hero || {}) },
          why:         {
            ...DEFAULTS.why, ...(c.why || {}),
            points: (c.why?.points && c.why.points.length > 0) ? c.why.points : DEFAULTS.why.points,
          },
          departments: {
            ...DEFAULTS.departments, ...(c.departments || {}),
            items: (c.departments?.items && c.departments.items.length > 0) ? c.departments.items : DEFAULTS.departments.items,
          },
          form: {
            ...DEFAULTS.form, ...(c.form || {}),
            availability_options:
              (c.form?.availability_options && c.form.availability_options.length > 0)
                ? c.form.availability_options
                : DEFAULTS.form.availability_options,
          },
          banner:      { ...DEFAULTS.banner, ...(c.banner || {}) },
        })
      })
      .catch(() => { /* keep DEFAULTS */ })
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const note = `Department: ${form.department} | Availability: ${form.availability} | Phone: ${form.phone} | Experience: ${form.experience}`
      await serviceRequestApi.submitRequests(['Volunteer'], note)
      setSubmitted(true)
    } catch {
      setError('Submission failed. Please try again or contact us directly.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="overflow-x-hidden">
      {/* ── HERO ── */}
      <section className="relative min-h-[80vh] flex items-center bg-[#140152] overflow-hidden">
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 8, repeat: Infinity }}
          className="absolute top-[-15%] right-[-10%] w-[600px] h-[600px] bg-[#f5bb00]/15 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ duration: 10, repeat: Infinity, delay: 3 }}
          className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-3xl"
        />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <div className="inline-flex items-center gap-2 bg-[#f5bb00]/20 border border-[#f5bb00]/40 rounded-full px-5 py-2 mb-8">
              <Heart className="w-4 h-4 text-[#f5bb00] fill-current" />
              <span className="text-[#f5bb00] text-sm font-bold tracking-widest uppercase">{cfg.hero.eyebrow}</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-black text-white leading-tight mb-6">
              {cfg.hero.title_line_1}
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-[#f5bb00] to-yellow-300">
                {cfg.hero.title_line_2}
              </span>
            </h1>
            <p className="text-lg text-white/70 leading-relaxed max-w-2xl mx-auto mb-10">
              {cfg.hero.subtitle}
            </p>
            <a
              href="#apply"
              className="inline-flex items-center gap-2 bg-[#f5bb00] text-[#140152] font-black px-10 py-4 rounded-full text-lg hover:bg-yellow-300 transition-all hover:scale-105 shadow-xl shadow-[#f5bb00]/30"
            >
              {cfg.hero.cta_label} <ArrowRight className="w-5 h-5" />
            </a>
          </motion.div>
        </div>
      </section>

      {/* ── WHY VOLUNTEER ── */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-[#f5bb00] font-bold uppercase tracking-[0.2em] text-sm">{cfg.why.eyebrow}</span>
            <h2 className="text-4xl md:text-5xl font-black text-[#140152] mt-3 mb-4">{cfg.why.heading}</h2>
            <div className="w-24 h-1.5 bg-[#f5bb00] mx-auto rounded-full" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {cfg.why.points.map((pt, i) => {
              const Icon = iconOf(pt.icon)
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.15 }}
                  viewport={{ once: true }}
                  className="text-center p-8 rounded-3xl border-2 border-gray-100 hover:border-[#f5bb00]/40 hover:shadow-xl transition-all group"
                >
                  <div className="w-14 h-14 mx-auto mb-5 rounded-2xl bg-[#140152]/5 group-hover:bg-[#140152] flex items-center justify-center transition-colors">
                    <Icon className="w-7 h-7 text-[#140152] group-hover:text-[#f5bb00] transition-colors" />
                  </div>
                  <h3 className="text-xl font-black text-[#140152] mb-3">{pt.title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{pt.desc}</p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── DEPARTMENTS ── */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-[#f5bb00] font-bold uppercase tracking-[0.2em] text-sm">{cfg.departments.eyebrow}</span>
            <h2 className="text-4xl md:text-5xl font-black text-[#140152] mt-3 mb-4">{cfg.departments.heading}</h2>
            <div className="w-24 h-1.5 bg-[#f5bb00] mx-auto rounded-full" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cfg.departments.items.map((dept, i) => {
              const Icon = iconOf(dept.icon)
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 25 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  viewport={{ once: true }}
                  className="bg-white rounded-3xl p-7 shadow-sm hover:shadow-xl transition-all group border border-gray-100 hover:border-[#140152]/20"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-11 h-11 rounded-xl bg-[#140152]/5 group-hover:bg-[#140152] flex items-center justify-center transition-colors">
                      <Icon className="w-5 h-5 text-[#140152] group-hover:text-[#f5bb00] transition-colors" />
                    </div>
                    {dept.spots && <span className="text-xs font-bold text-green-600 bg-green-50 px-3 py-1 rounded-full">{dept.spots}</span>}
                  </div>
                  <h3 className="text-lg font-black text-[#140152] mb-2">{dept.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{dept.desc}</p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── APPLY FORM ── */}
      <section id="apply" className="py-24 bg-white">
        <div className="max-w-2xl mx-auto px-4">
          <div className="text-center mb-12">
            <span className="text-[#f5bb00] font-bold uppercase tracking-[0.2em] text-sm">{cfg.form.eyebrow}</span>
            <h2 className="text-4xl md:text-5xl font-black text-[#140152] mt-3 mb-4">{cfg.form.heading}</h2>
            <div className="w-24 h-1.5 bg-[#f5bb00] mx-auto rounded-full mb-4" />
            <p className="text-gray-600 text-sm">{cfg.form.sub}</p>
          </div>

          {submitted ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center bg-green-50 border-2 border-green-200 rounded-3xl p-12"
            >
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <h3 className="text-2xl font-black text-green-800 mb-3">{cfg.form.success_heading}</h3>
              <p className="text-green-700 leading-relaxed">{cfg.form.success_body}</p>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="bg-gray-50 rounded-3xl p-8 space-y-5 border border-gray-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-bold text-[#140152] mb-2">Full Name *</label>
                  <input name="name" required value={form.name} onChange={handleChange} placeholder="Your full name"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#140152]/30 focus:border-[#140152] bg-white" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-[#140152] mb-2">Email Address *</label>
                  <input name="email" required type="email" value={form.email} onChange={handleChange} placeholder="you@email.com"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#140152]/30 focus:border-[#140152] bg-white" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-bold text-[#140152] mb-2">Phone Number</label>
                  <input name="phone" value={form.phone} onChange={handleChange} placeholder="+1 (234) 567-8901"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#140152]/30 focus:border-[#140152] bg-white" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-[#140152] mb-2">Preferred Department *</label>
                  <select name="department" required value={form.department} onChange={handleChange}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#140152]/30 focus:border-[#140152] bg-white">
                    <option value="">Choose a department</option>
                    {cfg.departments.items.map((d, i) => <option key={i}>{d.title}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-[#140152] mb-2">Availability *</label>
                <select name="availability" required value={form.availability} onChange={handleChange}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#140152]/30 focus:border-[#140152] bg-white">
                  <option value="">Select availability</option>
                  {cfg.form.availability_options.map((opt, i) => <option key={i}>{opt}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-[#140152] mb-2">Relevant Experience or Skills</label>
                <textarea name="experience" value={form.experience} onChange={handleChange}
                  placeholder="Tell us a little about your background, skills, or why you want to serve..."
                  rows={4}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#140152]/30 focus:border-[#140152] bg-white resize-none" />
              </div>
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <button type="submit" disabled={loading}
                className="w-full bg-[#140152] text-white font-black py-4 rounded-xl text-lg hover:bg-[#140152]/90 transition-all disabled:opacity-60 disabled:cursor-not-allowed hover:shadow-xl">
                {loading ? 'Submitting…' : cfg.form.submit_label}
              </button>
            </form>
          )}
        </div>
      </section>

      {/* ── BOTTOM BANNER ── */}
      <section className="py-16 bg-[#f5bb00]">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-black text-[#140152] mb-3">{cfg.banner.quote}</h2>
          <p className="text-[#140152]/70 font-semibold mb-6">{cfg.banner.ref}</p>
          <div className="flex gap-4 justify-center flex-wrap">
            <a href="#apply" className="inline-flex items-center gap-2 bg-[#140152] text-white font-black px-8 py-4 rounded-full hover:bg-[#140152]/90 transition-all">
              {cfg.banner.cta_label} <ArrowRight className="w-5 h-5" />
            </a>
            <Link href="/contact" className="inline-flex items-center gap-2 border-2 border-[#140152]/30 text-[#140152] font-bold px-8 py-4 rounded-full hover:bg-[#140152]/10 transition-all">
              {cfg.banner.ask_label}
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
