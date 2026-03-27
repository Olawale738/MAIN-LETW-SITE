'use client'
import React from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import PremiumButton from '@/components/ui/PremiumButton'
import { ArrowLeft, BookOpen, Users, Star, Trophy, Globe } from 'lucide-react'
import Link from 'next/link'

export default function SecondarySchoolPage() {
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
      {/* Hero Section – Secondary School */}
      <div className="w-full">
        <img
          src="/secondary.png"
          alt="Secondary School"
          className="w-full h-auto block"
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 py-20">


        <div className="grid lg:grid-cols-3 gap-16">
          {/* Left Content */}
          <div className="lg:col-span-2 space-y-16">
            {/* Vision */}
            <section>
              <h2 className="text-4xl font-black text-[#140152] mb-6">Our Vision for Secondary Education</h2>
              <p className="text-lg text-gray-700 leading-relaxed">
                We envision a secondary education that transforms young people into confident, principled leaders who excel academically and contribute positively to society. Our approach combines intellectual challenge with moral formation to produce graduates ready for university and life.
              </p>
            </section>

            {/* Core Values */}
            <section className="bg-white p-8 md:p-12 rounded-[2.5rem] shadow-xl border border-gray-100">
              <h3 className="text-3xl font-bold text-[#140152] mb-8">Core Values</h3>
              <div className="grid md:grid-cols-2 gap-8">
                {[
                  { title: "Academic Excellence", desc: "Challenging curriculum and dedicated teaching for outstanding results.", icon: Star },
                  { title: "Moral & Ethical Values", desc: "Emphasis on integrity, honesty, respect, and compassion.", icon: Heart }, // Note: Need to import Heart if not imported
                  { title: "Responsibility & Discipline", desc: "Structured routines building self-discipline and accountability.", icon: Shield }, // Need Shield
                  { title: "Leadership & Critical Thinking", desc: "Developing analytical thinking, problem-solving, and leadership.", icon: Users },
                ].map((item, i) => (
                  <div key={i} className="flex gap-4 items-start">
                    <div className="p-3 rounded-xl bg-blue-50 text-blue-600">
                      <item.icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-[#140152] mb-1">{item.title}</h4>
                      <p className="text-sm text-gray-600 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Academic Programme */}
            <section>
              <h3 className="text-3xl font-bold text-[#140152] mb-6">Academic Programme</h3>
              <p className="text-gray-700 mb-8">Our curriculum prepares students for higher education while developing essential skills.</p>
              <div className="space-y-4">
                {[
                  { title: "Broad & Balanced Curriculum", desc: "Mathematics, English, Sciences, Humanities, Technology, Languages, Arts." },
                  { title: "Core & Elective Subjects", desc: "Strong foundation with opportunities for specialisation in senior years." },
                  { title: "Examination Preparation", desc: "Expert guidance for national and international qualifications." },
                  { title: "Analytical Skills", desc: "Project-based learning, research, and debates." }
                ].map((item, i) => (
                  <div key={i} className="p-6 bg-slate-50 rounded-2xl">
                    <h4 className="font-bold text-[#140152] text-lg mb-2">{item.title}</h4>
                    <p className="text-gray-600">{item.desc}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Student Life */}
            <section>
              <h3 className="text-3xl font-bold text-[#140152] mb-6">Student Life & Development</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                  <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 mb-4">
                    <Users className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-[#140152] mb-2">Supportive Environment</h4>
                  <p className="text-sm text-gray-600">Mentoring system where teachers provide academic guidance and personal support.</p>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                  <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mb-4">
                    <Trophy className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-[#140152] mb-2">Leadership</h4>
                  <p className="text-sm text-gray-600">Student council, prefect roles, and project leadership positions.</p>
                </div>
              </div>
            </section>

            {/* Classes Levels */}
            <section>
              <h3 className="text-3xl font-bold text-[#140152] mb-6">Classes & Levels</h3>
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-1 bg-[#140152] text-white p-6 rounded-2xl">
                  <h4 className="text-xl font-bold mb-2 text-[#f5bb00]">Junior Secondary</h4>
                  <div className="text-sm font-bold opacity-80 mb-4">Years 7–9 (Ages 11–14)</div>
                  <p className="text-sm opacity-90">Broad curriculum building foundational knowledge and study habits.</p>
                </div>
                <div className="flex-1 bg-[#140152] text-white p-6 rounded-2xl">
                  <h4 className="text-xl font-bold mb-2 text-[#f5bb00]">Senior Secondary</h4>
                  <div className="text-sm font-bold opacity-80 mb-4">Years 10–12 (Ages 15–17)</div>
                  <p className="text-sm opacity-90">Specialised subject choices, career guidance, and university prep.</p>
                </div>
              </div>
            </section>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-8">
            <div className="bg-[#f5bb00] text-[#140152] p-8 rounded-[2rem] shadow-xl sticky top-24">
              <h3 className="text-2xl font-black mb-4">Admission Overview</h3>
              <p className="text-[#140152]/80 mb-6 text-sm font-medium">
                Admission is selective based on academic performance and character.
              </p>
              <ul className="text-sm space-y-3 mb-8 font-bold">
                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-[#140152] rounded-full" />Entrance Assessments</li>
                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-[#140152] rounded-full" />Parent & Student Interview</li>
                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-[#140152] rounded-full" />Review of Past Reports</li>
              </ul>
              <PremiumButton href="/education/coming-soon" className="bg-[#140152] text-white hover:bg-white hover:text-[#140152] font-bold">
                Visit Secondary School Website
              </PremiumButton>
            </div>

            <div className="bg-white p-8 rounded-[2rem] shadow-lg border border-gray-100">
              <h3 className="text-xl font-bold text-[#140152] mb-6">Beyond The Classroom</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Globe className="w-5 h-5 text-blue-500 mt-1" />
                  <div>
                    <h4 className="font-bold text-sm">Clubs & Enrichment</h4>
                    <p className="text-xs text-gray-500">Debate, Science, Math Olympiad.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Trophy className="w-5 h-5 text-orange-500 mt-1" />
                  <div>
                    <h4 className="font-bold text-sm">Sports & Arts</h4>
                    <p className="text-xs text-gray-500">Teams, music, drama, and visual arts.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Heart className="w-5 h-5 text-red-500 mt-1" />
                  <div>
                    <h4 className="font-bold text-sm">Community Service</h4>
                    <p className="text-xs text-gray-500">Outreach projects and civic duty.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
import { Heart, Shield } from 'lucide-react'