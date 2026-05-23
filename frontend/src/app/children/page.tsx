'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Star, Heart, BookOpen, Music, Shield, Users, Smile,
  Sun, Sparkles, ArrowRight, CheckCircle, Baby, User
} from 'lucide-react'
import { serviceRequestApi } from '@/lib/api'

const ageGroups = [
  {
    icon: Baby,
    label: 'Nursery',
    age: 'Ages 0–2',
    color: 'from-pink-400 to-rose-500',
    bg: 'bg-pink-50',
    border: 'border-pink-200',
    desc: 'A safe, nurturing space for your littlest ones while you worship.',
  },
  {
    icon: Smile,
    label: 'Toddlers',
    age: 'Ages 3–5',
    color: 'from-orange-400 to-amber-500',
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    desc: 'Bible stories, songs, and play to introduce Jesus to young hearts.',
  },
  {
    icon: Star,
    label: 'Primary',
    age: 'Ages 6–9',
    color: 'from-yellow-400 to-lime-500',
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    desc: 'Interactive lessons, memory verses, and foundational faith building.',
  },
  {
    icon: User,
    label: 'Juniors',
    age: 'Ages 10–12',
    color: 'from-blue-400 to-indigo-500',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    desc: 'Deeper Bible study, leadership skills, and peer discipleship.',
  },
]

const programs = [
  {
    icon: BookOpen,
    title: 'Sunday School',
    desc: 'Age-appropriate Bible lessons every Sunday at 9:00 AM to lay a strong spiritual foundation.',
    tag: 'Weekly',
  },
  {
    icon: Music,
    title: 'Kids Worship',
    desc: 'Lively praise and worship sessions that teach children to honour God through song and dance.',
    tag: 'Sunday',
  },
  {
    icon: Star,
    title: 'Bible Quiz League',
    desc: 'Fun and competitive scripture memorization that builds knowledge of the Word.',
    tag: 'Monthly',
  },
  {
    icon: Sun,
    title: 'Vacation Bible School',
    desc: 'An exciting annual summer program packed with games, crafts, and deep faith lessons.',
    tag: 'Annual',
  },
  {
    icon: Heart,
    title: 'Kids Prayer Hour',
    desc: 'Teaching children the power of prayer through guided sessions and intercession practice.',
    tag: 'Friday',
  },
  {
    icon: Sparkles,
    title: 'Arts & Drama Ministry',
    desc: 'Expressing God\'s love through creative arts, drama, storytelling, and performances.',
    tag: 'Bi-weekly',
  },
]

const safetyPoints = [
  'All volunteers are background-checked and trained',
  'Secure check-in & check-out system for every child',
  'Minimum two adults present in every room at all times',
  'Medical info and allergy records kept on file',
  'CCTV-monitored classrooms for parent peace of mind',
  'Emergency procedures practiced regularly',
]

const stats = [
  { value: '200+', label: 'Children Enrolled' },
  { value: '6', label: 'Programs Running' },
  { value: '30+', label: 'Trained Volunteers' },
  { value: '100%', label: 'Safe Environment' },
]

export default function ChildrenMinistryPage() {
  const [form, setForm] = useState({
    parentName: '', childName: '', childAge: '', email: '', phone: '', ageGroup: '', program: '',
  })
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const note = `Parent: ${form.parentName} | Child: ${form.childName} (Age ${form.childAge}) | Age Group: ${form.ageGroup} | Preferred Program: ${form.program} | Phone: ${form.phone}`
      await serviceRequestApi.submitRequests(['Children Ministry'], note)
      setSubmitted(true)
    } catch {
      setError('Registration failed. Please try again or contact us directly.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="overflow-x-hidden">
      {/* ── HERO ── */}
      <section className="relative min-h-[92vh] flex items-center bg-[#140152] overflow-hidden">
        {/* Animated blobs */}
        <motion.div
          animate={{ scale: [1, 1.15, 1], rotate: [0, 15, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-[-10%] right-[-8%] w-[500px] h-[500px] bg-[#f5bb00]/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ scale: [1, 1.2, 1], rotate: [0, -10, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
          className="absolute bottom-[-15%] left-[-10%] w-[600px] h-[600px] bg-pink-500/10 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ y: [0, -20, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
          className="absolute top-1/4 right-1/4 w-[200px] h-[200px] bg-yellow-300/10 rounded-full blur-2xl"
        />

        {/* Star confetti */}
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute text-[#f5bb00]/30"
            style={{ left: `${8 + i * 8}%`, top: `${10 + (i % 5) * 18}%` }}
            animate={{ y: [0, -10, 0], opacity: [0.3, 0.7, 0.3] }}
            transition={{ duration: 3 + (i % 3), repeat: Infinity, delay: i * 0.4 }}
          >
            <Star className="w-5 h-5 fill-current" />
          </motion.div>
        ))}

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 grid lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="inline-flex items-center gap-2 bg-[#f5bb00]/20 border border-[#f5bb00]/40 rounded-full px-5 py-2 mb-8"
            >
              <Heart className="w-4 h-4 text-[#f5bb00] fill-current" />
              <span className="text-[#f5bb00] text-sm font-bold tracking-widest uppercase">Children Ministry</span>
            </motion.div>

            <h1 className="text-5xl md:text-7xl font-black text-white leading-[0.95] mb-6">
              Little
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-[#f5bb00] to-yellow-300">
                Lights.
              </span>
              Big Faith.
            </h1>
            <p className="text-lg text-white/70 leading-relaxed mb-10 max-w-lg">
              Where every child discovers their identity in Christ. A vibrant, safe, and fun environment designed to nurture young hearts and build lifelong faith.
            </p>
            <div className="flex flex-wrap gap-4">
              <a
                href="#register"
                className="inline-flex items-center gap-2 bg-[#f5bb00] text-[#140152] font-black px-8 py-4 rounded-full text-lg hover:bg-yellow-300 transition-all hover:scale-105 shadow-lg shadow-[#f5bb00]/30"
              >
                Enrol Your Child <ArrowRight className="w-5 h-5" />
              </a>
              <a
                href="#programs"
                className="inline-flex items-center gap-2 border-2 border-white/30 text-white font-bold px-8 py-4 rounded-full text-lg hover:bg-white/10 transition-all"
              >
                Explore Programs
              </a>
              <Link
                href="/children/dashboard"
                className="inline-flex items-center gap-2 border-2 border-[#f5bb00]/60 text-[#f5bb00] font-bold px-8 py-4 rounded-full text-lg hover:bg-[#f5bb00]/10 transition-all"
              >
                <Shield className="w-5 h-5" /> Enter Dashboard
              </Link>
            </div>
          </motion.div>

          {/* Hero visual */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="hidden lg:grid grid-cols-2 gap-4"
          >
            {ageGroups.map((group, i) => (
              <motion.div
                key={group.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + i * 0.15 }}
                className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-3xl p-6 text-center"
              >
                <div className={`w-14 h-14 mx-auto mb-3 rounded-2xl bg-gradient-to-br ${group.color} flex items-center justify-center`}>
                  <group.icon className="w-7 h-7 text-white" />
                </div>
                <div className="text-white font-bold text-lg">{group.label}</div>
                <div className="text-[#f5bb00] text-sm font-semibold">{group.age}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── STATS BAR ── */}
      <section className="bg-[#f5bb00] py-8">
        <div className="max-w-6xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
            >
              <div className="text-3xl md:text-4xl font-black text-[#140152]">{s.value}</div>
              <div className="text-[#140152]/70 text-sm font-semibold mt-1">{s.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── AGE GROUPS ── */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-[#f5bb00] font-bold uppercase tracking-[0.2em] text-sm">Every Stage Matters</span>
            <h2 className="text-4xl md:text-5xl font-black text-[#140152] mt-3 mb-4">Age-Group Classes</h2>
            <div className="w-24 h-1.5 bg-[#f5bb00] mx-auto rounded-full" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {ageGroups.map((group, i) => (
              <motion.div
                key={group.label}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.15 }}
                viewport={{ once: true }}
                className={`${group.bg} ${group.border} border-2 rounded-3xl p-8 text-center group hover:shadow-xl transition-all hover:-translate-y-1`}
              >
                <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br ${group.color} flex items-center justify-center shadow-lg`}>
                  <group.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-black text-[#140152] mb-1">{group.label}</h3>
                <div className="inline-block bg-white/80 rounded-full px-3 py-0.5 text-xs font-bold text-[#140152] mb-3">{group.age}</div>
                <p className="text-gray-600 text-sm leading-relaxed">{group.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PROGRAMS ── */}
      <section id="programs" className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-[#f5bb00] font-bold uppercase tracking-[0.2em] text-sm">Grow. Play. Worship.</span>
            <h2 className="text-4xl md:text-5xl font-black text-[#140152] mt-3 mb-4">Our Programs</h2>
            <div className="w-24 h-1.5 bg-[#f5bb00] mx-auto rounded-full" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {programs.map((prog, i) => (
              <motion.div
                key={prog.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="bg-white rounded-3xl p-8 shadow-sm hover:shadow-xl transition-all group border border-gray-100 hover:border-[#f5bb00]/40"
              >
                <div className="flex items-start justify-between mb-5">
                  <div className="w-12 h-12 rounded-2xl bg-[#140152]/5 flex items-center justify-center group-hover:bg-[#140152] transition-colors">
                    <prog.icon className="w-6 h-6 text-[#140152] group-hover:text-white transition-colors" />
                  </div>
                  <span className="text-xs font-bold bg-[#f5bb00]/20 text-[#140152] px-3 py-1 rounded-full">{prog.tag}</span>
                </div>
                <h3 className="text-xl font-black text-[#140152] mb-3">{prog.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{prog.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SAFETY ── */}
      <section className="py-24 bg-[#140152] relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle, #f5bb00 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <span className="text-[#f5bb00] font-bold uppercase tracking-[0.2em] text-sm">Your Child Is Precious</span>
            <h2 className="text-4xl md:text-5xl font-black text-white mt-3 mb-6">
              Safety Is Our<br />
              <span className="text-[#f5bb00]">Top Priority</span>
            </h2>
            <p className="text-white/70 leading-relaxed mb-8">
              We take the protection of every child seriously. Our comprehensive safety policies ensure your child is loved, secure, and thriving every single visit.
            </p>
            <div className="flex items-center gap-3 bg-[#f5bb00]/10 border border-[#f5bb00]/30 rounded-2xl px-6 py-4">
              <Shield className="w-8 h-8 text-[#f5bb00] shrink-0" />
              <p className="text-white/80 text-sm">All LETW Children's Ministry volunteers are trained, vetted, and background-checked before working with children.</p>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-4"
          >
            {safetyPoints.map((point, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-2xl px-5 py-4"
              >
                <CheckCircle className="w-5 h-5 text-[#f5bb00] shrink-0" />
                <span className="text-white/80 text-sm">{point}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── VOLUNTEER CTA ── */}
      <section className="py-20 bg-gradient-to-r from-yellow-50 to-orange-50">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-[#140152] flex items-center justify-center">
              <Users className="w-10 h-10 text-[#f5bb00]" />
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-[#140152] mb-4">
              Love Kids? Serve with Us.
            </h2>
            <p className="text-gray-600 leading-relaxed mb-8 max-w-xl mx-auto">
              Our children's ministry thrives because of dedicated volunteers. Whether you teach, sing, or set up — there's a place for you to make an eternal impact.
            </p>
            <Link
              href="/volunteer"
              className="inline-flex items-center gap-2 bg-[#140152] text-white font-black px-8 py-4 rounded-full text-lg hover:bg-[#140152]/90 transition-all hover:scale-105 shadow-xl"
            >
              Become a Volunteer <ArrowRight className="w-5 h-5" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ── REGISTRATION FORM ── */}
      <section id="register" className="py-24 bg-white">
        <div className="max-w-2xl mx-auto px-4">
          <div className="text-center mb-12">
            <span className="text-[#f5bb00] font-bold uppercase tracking-[0.2em] text-sm">Join the Family</span>
            <h2 className="text-4xl md:text-5xl font-black text-[#140152] mt-3 mb-4">Enrol Your Child</h2>
            <div className="w-24 h-1.5 bg-[#f5bb00] mx-auto rounded-full mb-4" />
            <p className="text-gray-600">Fill in the form below and our team will reach out to complete your child's enrolment.</p>
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
              <h3 className="text-2xl font-black text-green-800 mb-3">Enrolment Received!</h3>
              <p className="text-green-700 leading-relaxed">
                Thank you for registering your child. Our Children's Ministry team will contact you within 24–48 hours to complete the process. God bless your family!
              </p>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="bg-gray-50 rounded-3xl p-8 space-y-5 border border-gray-200 shadow-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-bold text-[#140152] mb-2">Parent / Guardian Name *</label>
                  <input
                    name="parentName"
                    required
                    value={form.parentName}
                    onChange={handleChange}
                    placeholder="Your full name"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#140152]/30 focus:border-[#140152] bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-[#140152] mb-2">Child's Name *</label>
                  <input
                    name="childName"
                    required
                    value={form.childName}
                    onChange={handleChange}
                    placeholder="Child's full name"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#140152]/30 focus:border-[#140152] bg-white"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-bold text-[#140152] mb-2">Child's Age *</label>
                  <input
                    name="childAge"
                    required
                    type="number"
                    min="0"
                    max="12"
                    value={form.childAge}
                    onChange={handleChange}
                    placeholder="e.g. 7"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#140152]/30 focus:border-[#140152] bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-[#140152] mb-2">Age Group *</label>
                  <select
                    name="ageGroup"
                    required
                    value={form.ageGroup}
                    onChange={handleChange}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#140152]/30 focus:border-[#140152] bg-white"
                  >
                    <option value="">Select age group</option>
                    <option>Nursery (Ages 0–2)</option>
                    <option>Toddlers (Ages 3–5)</option>
                    <option>Primary (Ages 6–9)</option>
                    <option>Juniors (Ages 10–12)</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-bold text-[#140152] mb-2">Your Email *</label>
                  <input
                    name="email"
                    required
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="parent@email.com"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#140152]/30 focus:border-[#140152] bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-[#140152] mb-2">Phone Number *</label>
                  <input
                    name="phone"
                    required
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="+1 (234) 567-8901"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#140152]/30 focus:border-[#140152] bg-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-[#140152] mb-2">Preferred Program</label>
                <select
                  name="program"
                  value={form.program}
                  onChange={handleChange}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#140152]/30 focus:border-[#140152] bg-white"
                >
                  <option value="">Select a program (optional)</option>
                  <option>Sunday School</option>
                  <option>Kids Worship</option>
                  <option>Bible Quiz League</option>
                  <option>Vacation Bible School</option>
                  <option>Kids Prayer Hour</option>
                  <option>Arts & Drama Ministry</option>
                </select>
              </div>
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#140152] text-white font-black py-4 rounded-xl text-lg hover:bg-[#140152]/90 transition-all disabled:opacity-60 disabled:cursor-not-allowed hover:shadow-xl"
              >
                {loading ? 'Submitting…' : 'Enrol My Child'}
              </button>
              <p className="text-center text-xs text-gray-400">
                Our team will contact you within 24–48 hours to confirm enrolment.
              </p>
            </form>
          )}
        </div>
      </section>

      {/* ── BOTTOM CTA ── */}
      <section className="py-16 bg-[#f5bb00]">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-black text-[#140152] mb-4">
            Train up a child in the way he should go.
          </h2>
          <p className="text-[#140152]/70 font-semibold mb-6">— Proverbs 22:6</p>
          <div className="flex flex-wrap gap-4 justify-center">
            <a href="#register" className="inline-flex items-center gap-2 bg-[#140152] text-white font-black px-8 py-4 rounded-full hover:bg-[#140152]/90 transition-all">
              Enrol Today <ArrowRight className="w-5 h-5" />
            </a>
            <Link href="/contact" className="inline-flex items-center gap-2 border-2 border-[#140152]/30 text-[#140152] font-bold px-8 py-4 rounded-full hover:bg-[#140152]/10 transition-all">
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
