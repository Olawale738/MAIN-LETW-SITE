'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import {
  Users, Video, Phone, BookOpen, HandHeart, MessageCircle, UserCheck,
  ArrowRight, Loader2, CheckCircle2, Bell, Star, Plus, TrendingUp, X,
} from 'lucide-react'
import { serviceRequestApi, bibleStudyApi, BibleStudyMentor } from '@/lib/api'

const MENTORING_KEY = 'bibleMentoringRequest'
const FOCUS_AREAS = [
  'Growing in spiritual maturity',
  'Understanding difficult Scriptures',
  'Building a consistent prayer life',
  'Overcoming a personal struggle',
  'Preparing for ministry / leadership',
  'New believer — foundations of faith',
  "Other (I'll explain)",
]
const MEETING_STYLES = [
  { id: 'in-person', label: 'In person', icon: Users },
  { id: 'virtual', label: 'Video call', icon: Video },
  { id: 'phone', label: 'Phone', icon: Phone },
]
const MENTOR_BENEFITS = [
  { icon: BookOpen, title: 'Personalised study plan', desc: 'A mentor tailors Scripture study to where you are in your walk.' },
  { icon: HandHeart, title: 'Prayer & accountability', desc: 'Someone to pray with you and gently keep you on track.' },
  { icon: MessageCircle, title: 'Ask anything', desc: 'A safe space to bring your questions, doubts, and discoveries.' },
]

interface MentoringRequest { focus: string; style: string; availability: string; message: string; status: 'pending' | 'connected'; createdAt: string }

const EVAL_KEY = 'bibleMentoringEvaluations'
const EVAL_AREAS = ['Understanding Scripture', 'Prayer & devotion', 'Applying the Word', 'Consistency'] as const
interface Evaluation { id: string; date: string; ratings: Record<string, number>; note: string }

export default function MentoringSection() {
  const [request, setRequest] = useState<MentoringRequest | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [loggedIn, setLoggedIn] = useState(false)
  const [mentors, setMentors] = useState<BibleStudyMentor[]>([])
  const [form, setForm] = useState({ focus: FOCUS_AREAS[0], style: 'virtual', availability: '', message: '' })
  const [evaluations, setEvaluations] = useState<Evaluation[]>([])
  const [showEval, setShowEval] = useState(false)
  const [evalForm, setEvalForm] = useState<{ ratings: Record<string, number>; note: string }>({ ratings: {}, note: '' })

  useEffect(() => {
    try { const r = localStorage.getItem(MENTORING_KEY); if (r) setRequest(JSON.parse(r)) } catch { /* ignore */ }
    try { const e = localStorage.getItem(EVAL_KEY); if (e) setEvaluations(JSON.parse(e)) } catch { /* ignore */ }
    setLoggedIn(!!localStorage.getItem('isLoggedIn'))
    bibleStudyApi.getPublicSettings()
      .then(s => { if (s?.mentors?.length) setMentors(s.mentors) })
      .catch(() => { /* fall back to no mentor list */ })
  }, [])

  const saveEvaluation = () => {
    const e: Evaluation = { id: Date.now().toString(36), date: new Date().toISOString(), ratings: evalForm.ratings, note: evalForm.note }
    const next = [e, ...evaluations]
    setEvaluations(next)
    localStorage.setItem(EVAL_KEY, JSON.stringify(next))
    setEvalForm({ ratings: {}, note: '' })
    setShowEval(false)
  }
  const removeEvaluation = (id: string) => {
    const next = evaluations.filter(e => e.id !== id)
    setEvaluations(next)
    localStorage.setItem(EVAL_KEY, JSON.stringify(next))
  }

  const submit = async () => {
    setSubmitting(true)
    const composed = `Bible Mentoring Request — Focus: ${form.focus} | Preferred: ${MEETING_STYLES.find(s => s.id === form.style)?.label} | Availability: ${form.availability || 'Flexible'} | Note: ${form.message || '—'}`
    try {
      await serviceRequestApi.submitRequests(['Bible Mentoring'], composed)
    } catch {
      /* still record locally so the user sees confirmation */
    }
    const newReq: MentoringRequest = { ...form, status: 'pending', createdAt: new Date().toISOString() }
    localStorage.setItem(MENTORING_KEY, JSON.stringify(newReq))
    setRequest(newReq)
    setShowForm(false)
    setSubmitting(false)
  }

  return (
    <div className="relative rounded-3xl overflow-hidden border border-[#ddd6fe]"
      style={{ background: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)' }}>
      <div className="absolute top-0 right-0 w-56 h-56 bg-[#7c3aed] rounded-full blur-3xl opacity-10 pointer-events-none" />
      <div className="relative z-10 p-6 md:p-8">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-9 h-9 rounded-xl bg-[#7c3aed] flex items-center justify-center">
            <UserCheck className="w-5 h-5 text-white" />
          </div>
          <span className="text-xs font-bold uppercase tracking-widest text-[#6d28d9]">Personal Bible Mentoring</span>
        </div>

        {request ? (
          <div className="bg-white rounded-2xl p-6 border border-[#ddd6fe]">
            <div className="flex items-center gap-3 mb-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-500" />
              <div>
                <h3 className="font-black text-[#140152]">Request received! 🙏</h3>
                <p className="text-xs text-gray-500">A mentor coordinator will reach out to you soon.</p>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-3 text-sm mt-4">
              <div className="bg-[#f5f3ff] rounded-xl p-3">
                <p className="text-[10px] font-bold uppercase text-[#6d28d9]">Focus</p>
                <p className="text-[#140152] font-semibold">{request.focus}</p>
              </div>
              <div className="bg-[#f5f3ff] rounded-xl p-3">
                <p className="text-[10px] font-bold uppercase text-[#6d28d9]">Preferred</p>
                <p className="text-[#140152] font-semibold">{MEETING_STYLES.find(s => s.id === request.style)?.label}</p>
              </div>
            </div>
            <button onClick={() => { localStorage.removeItem(MENTORING_KEY); setRequest(null) }}
              className="text-xs text-gray-400 hover:text-gray-600 mt-4 font-semibold">Cancel / edit request</button>

            {/* ── Growth Evaluations ── */}
            <div className="mt-6 pt-6 border-t border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-[#7c3aed]" />
                  <h4 className="font-black text-[#140152] text-sm">My Growth Evaluations</h4>
                </div>
                {!showEval && (
                  <button onClick={() => setShowEval(true)}
                    className="flex items-center gap-1 text-xs font-bold text-[#7c3aed] hover:text-[#6d28d9]">
                    <Plus className="w-3.5 h-3.5" /> New check-in
                  </button>
                )}
              </div>

              {showEval && (
                <div className="bg-[#f5f3ff] rounded-2xl p-4 space-y-3 mb-4">
                  {EVAL_AREAS.map(area => (
                    <div key={area} className="flex items-center justify-between gap-3">
                      <span className="text-xs font-semibold text-[#140152]">{area}</span>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map(n => (
                          <button key={n} onClick={() => setEvalForm(p => ({ ...p, ratings: { ...p.ratings, [area]: n } }))}>
                            <Star className={`w-4 h-4 ${(evalForm.ratings[area] ?? 0) >= n ? 'fill-[#f5bb00] text-[#f5bb00]' : 'text-gray-300'}`} />
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                  <textarea value={evalForm.note} onChange={e => setEvalForm(p => ({ ...p, note: e.target.value }))}
                    rows={2} placeholder="What has God been teaching you? Where do you want to grow?"
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-900 resize-none focus:outline-none focus:border-[#7c3aed]" />
                  <div className="flex gap-2">
                    <button onClick={saveEvaluation}
                      className="bg-[#7c3aed] text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-[#6d28d9]">Save check-in</button>
                    <button onClick={() => { setShowEval(false); setEvalForm({ ratings: {}, note: '' }) }}
                      className="text-xs font-semibold text-gray-500 px-3 py-2">Cancel</button>
                  </div>
                </div>
              )}

              {evaluations.length === 0 && !showEval ? (
                <p className="text-xs text-gray-400">No check-ins yet. Log your first growth evaluation to track your journey with your mentor.</p>
              ) : (
                <div className="space-y-2">
                  {evaluations.map(ev => {
                    const vals = Object.values(ev.ratings)
                    const avg = vals.length ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1) : '—'
                    return (
                      <div key={ev.id} className="bg-white border border-gray-100 rounded-xl p-3 relative group">
                        <button onClick={() => removeEvaluation(ev.id)}
                          className="absolute top-2 right-2 text-gray-300 hover:text-red-400 opacity-0 group-hover:opacity-100"><X className="w-3.5 h-3.5" /></button>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[11px] font-bold text-[#7c3aed]">Avg {avg}/5</span>
                          <span className="text-[10px] text-gray-400">{new Date(ev.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        </div>
                        <div className="flex flex-wrap gap-x-3 gap-y-0.5 mb-1">
                          {Object.entries(ev.ratings).map(([k, v]) => (
                            <span key={k} className="text-[10px] text-gray-500">{k}: <span className="font-bold text-[#140152]">{v}/5</span></span>
                          ))}
                        </div>
                        {ev.note && <p className="text-xs text-gray-600 mt-1 italic">&ldquo;{ev.note}&rdquo;</p>}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        ) : (
          <>
            <h3 className="text-2xl font-black text-[#140152] mb-2">Walk with a Bible mentor</h3>
            <p className="text-gray-600 text-sm leading-relaxed mb-6 max-w-lg">
              You weren&apos;t meant to grow alone. Get paired with a mature believer who will guide you
              through Scripture, pray with you, and walk alongside your journey.
            </p>

            <div className="grid sm:grid-cols-3 gap-3 mb-6">
              {MENTOR_BENEFITS.map((b, i) => (
                <div key={i} className="bg-white/70 rounded-2xl p-4 border border-white">
                  <b.icon className="w-5 h-5 text-[#7c3aed] mb-2" />
                  <p className="font-bold text-[#140152] text-sm mb-1">{b.title}</p>
                  <p className="text-xs text-gray-500 leading-relaxed">{b.desc}</p>
                </div>
              ))}
            </div>

            {/* Meet our mentors (admin-managed) */}
            {mentors.length > 0 && (
              <div className="mb-6">
                <p className="text-xs font-bold uppercase tracking-widest text-[#6d28d9] mb-3">Meet our mentors</p>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {mentors.map(m => (
                    <div key={m.id} className="bg-white rounded-2xl p-4 border border-[#ddd6fe] flex items-start gap-3">
                      <div className="w-11 h-11 rounded-xl bg-purple-100 flex items-center justify-center text-purple-700 font-black flex-shrink-0 overflow-hidden">
                        {m.photo ? <img src={m.photo} alt={m.name} className="w-full h-full object-cover" /> : (m.name.charAt(0) || '?')}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="font-bold text-[#140152] text-sm truncate">{m.name}</p>
                          {!m.is_available && <span className="text-[9px] font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">Full</span>}
                        </div>
                        <p className="text-[11px] text-[#7c3aed] font-semibold">{m.title}</p>
                        {m.focus && <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-2">{m.focus}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!showForm ? (
              <button onClick={() => setShowForm(true)}
                className="bg-[#7c3aed] text-white font-black px-7 py-3.5 rounded-2xl hover:bg-[#6d28d9] transition-all shadow-lg hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2">
                Request a Mentor <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                className="bg-white rounded-2xl p-5 border border-[#ddd6fe] space-y-4">
                {!loggedIn && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 flex items-center gap-2">
                    <Bell className="w-4 h-4 flex-shrink-0" />
                    <span>Tip: <Link href="/auth/login" className="font-bold underline">sign in</Link> so your mentor can be matched to your account. You can still submit below.</span>
                  </div>
                )}
                <div>
                  <label className="text-xs font-bold text-gray-600 mb-1.5 block">What would you like to grow in?</label>
                  <select value={form.focus} onChange={e => setForm({ ...form, focus: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white text-gray-900 focus:outline-none focus:border-[#7c3aed]">
                    {FOCUS_AREAS.map(f => <option key={f}>{f}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-600 mb-1.5 block">How would you like to meet?</label>
                  <div className="flex gap-2">
                    {MEETING_STYLES.map(s => (
                      <button key={s.id} onClick={() => setForm({ ...form, style: s.id })}
                        className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${form.style === s.id ? 'bg-[#7c3aed] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                        <s.icon className="w-3.5 h-3.5" /> {s.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-600 mb-1.5 block">Your availability</label>
                  <input value={form.availability} onChange={e => setForm({ ...form, availability: e.target.value })}
                    placeholder="e.g. Weekday evenings, Saturday mornings"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:border-[#7c3aed]" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-600 mb-1.5 block">Anything you&apos;d like your mentor to know? (optional)</label>
                  <textarea value={form.message} onChange={e => setForm({ ...form, message: e.target.value })}
                    rows={3} placeholder="Share where you are in your walk, or any specific questions…"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 resize-none focus:outline-none focus:border-[#7c3aed]" />
                </div>
                <div className="flex gap-2">
                  <button onClick={submit} disabled={submitting}
                    className="bg-[#7c3aed] text-white font-bold px-6 py-3 rounded-xl hover:bg-[#6d28d9] transition-all flex items-center gap-2 disabled:opacity-60">
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserCheck className="w-4 h-4" />} Submit Request
                  </button>
                  <button onClick={() => setShowForm(false)} className="px-5 py-3 text-sm font-semibold text-gray-500 hover:text-gray-700">Cancel</button>
                </div>
              </motion.div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
