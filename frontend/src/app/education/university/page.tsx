'use client'
import React from 'react'
import { motion } from 'framer-motion'
import PremiumButton from '@/components/ui/PremiumButton'
import { BookOpen, Users, Trophy, Globe, Star, Lightbulb, GraduationCap, Heart } from 'lucide-react'

export default function UniversityPage() {
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
      {/* Hero */}
      <div className="w-full">
        <img
          src="/university.png"
          alt="University"
          className="w-full h-auto block"
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 py-20">

        <div className="grid lg:grid-cols-3 gap-16">

          {/* Left Content */}
          <div className="lg:col-span-2 space-y-16">

            {/* Vision */}
            <section>
              <h2 className="text-4xl font-black text-[#140152] mb-6">Advancing Knowledge with Kingdom Purpose</h2>
              <p className="text-lg text-gray-700 leading-relaxed">
                Our University is a place where academic rigour meets faith-driven purpose. We are committed to raising thinkers, leaders, and innovators who are equipped to tackle real-world challenges through a Kingdom lens, transforming society one graduate at a time.
              </p>
            </section>

            {/* Core Pillars */}
            <section className="bg-white p-8 md:p-12 rounded-[2.5rem] shadow-xl border border-gray-100">
              <h3 className="text-3xl font-bold text-[#140152] mb-8">Our Academic Pillars</h3>
              <div className="grid md:grid-cols-2 gap-8">
                {[
                  { title: "Research & Innovation", desc: "Solving global problems through groundbreaking, kingdom-driven research.", icon: Lightbulb },
                  { title: "Academic Excellence", desc: "Rigorous programmes that prepare graduates for global impact.", icon: Star },
                  { title: "Faith Integration", desc: "Biblical values woven into every discipline and field of study.", icon: Heart },
                  { title: "Leadership Formation", desc: "Developing servant leaders who transform communities and sectors.", icon: Trophy },
                ].map((item, i) => (
                  <div key={i} className="flex gap-4 items-start">
                    <div className="p-3 rounded-xl bg-purple-50 text-purple-600">
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

            {/* Faculties */}
            <section>
              <h3 className="text-3xl font-bold text-[#140152] mb-8">Our Faculties</h3>
              <div className="grid md:grid-cols-3 gap-6">
                {[
                  { name: "Science & Technology", focus: "Engineering, Computing, Natural Sciences", color: "bg-emerald-50 border-emerald-100", badge: "text-emerald-700 bg-emerald-100" },
                  { name: "Humanities & Social Sciences", focus: "Philosophy, History, Social Work", color: "bg-blue-50 border-blue-100", badge: "text-blue-700 bg-blue-100" },
                  { name: "Business & Management", focus: "Entrepreneurship, Finance, Leadership", color: "bg-purple-50 border-purple-100", badge: "text-purple-700 bg-purple-100" },
                  { name: "Theology & Ministry", focus: "Biblical Studies, Missiology, Pastoral Ministry", color: "bg-orange-50 border-orange-100", badge: "text-orange-700 bg-orange-100" },
                  { name: "Health Sciences", focus: "Public Health, Nursing, Medical Education", color: "bg-rose-50 border-rose-100", badge: "text-rose-700 bg-rose-100" },
                  { name: "Education & Law", focus: "Teacher Training, Legal Studies, Policy", color: "bg-indigo-50 border-indigo-100", badge: "text-indigo-700 bg-indigo-100" },
                ].map((faculty, i) => (
                  <div key={i} className={`p-6 rounded-2xl border ${faculty.color}`}>
                    <h4 className="font-black text-[#140152] text-base mb-2">{faculty.name}</h4>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${faculty.badge}`}>{faculty.focus}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Campus Life */}
            <section>
              <h3 className="text-3xl font-bold text-[#140152] mb-6">Campus Life & Student Experience</h3>
              <div className="space-y-4">
                {[
                  { title: "Vibrant Campus Community", desc: "A diverse, faith-filled community of scholars and believers from across the world." },
                  { title: "Student Clubs & Societies", desc: "Debate teams, student government, entrepreneurship clubs, and ministry groups." },
                  { title: "Research Centres", desc: "State-of-the-art labs and innovation hubs for cutting-edge research projects." },
                  { title: "Spiritual Formation", desc: "Chapel services, prayer groups, discipleship programmes, and spiritual retreats." },
                  { title: "Career & Alumni Network", desc: "Industry linkages, internship placements, and a strong global alumni community." },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-4 p-4 hover:bg-white hover:shadow-sm rounded-xl transition-all">
                    <div className="w-8 h-8 rounded-full bg-[#140152] text-white flex items-center justify-center flex-shrink-0 font-bold text-sm">
                      {i + 1}
                    </div>
                    <div>
                      <h4 className="font-bold text-[#140152] text-lg">{item.title}</h4>
                      <p className="text-gray-600">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

          </div>

          {/* Right Sidebar */}
          <div className="space-y-8">
            <div className="bg-[#140152] text-white p-8 rounded-[2rem] shadow-xl sticky top-24">
              <h3 className="text-2xl font-bold mb-4">Admissions</h3>
              <p className="text-blue-200 mb-6 leading-relaxed text-sm">
                We welcome applicants who are driven by excellence, purpose, and a desire to make a difference.
              </p>
              <ul className="text-sm space-y-3 mb-8">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-[#f5bb00] rounded-full" />Undergraduate Programmes
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-[#f5bb00] rounded-full" />Postgraduate Studies
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-[#f5bb00] rounded-full" />Research Degrees
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-[#f5bb00] rounded-full" />Professional Certificates
                </li>
              </ul>
              <PremiumButton href="/education/university/coming-soon" className="bg-[#f5bb00] text-[#140152] hover:bg-white hover:text-[#140152] font-bold rounded-xl py-6">
                Visit University Website
              </PremiumButton>
              <p className="text-center text-xs text-blue-300 mt-4">Applications open annually.</p>
            </div>

            <div className="bg-white p-8 rounded-[2rem] shadow-lg border border-gray-100">
              <h3 className="text-xl font-bold text-[#140152] mb-6">Why Our University?</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Globe className="w-5 h-5 text-blue-500 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-bold text-sm text-[#140152]">Global Perspective</h4>
                    <p className="text-xs text-gray-500">International partnerships and exchange programmes.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <GraduationCap className="w-5 h-5 text-purple-500 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-bold text-sm text-[#140152]">Qualified Faculty</h4>
                    <p className="text-xs text-gray-500">World-class academics with industry experience.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <BookOpen className="w-5 h-5 text-orange-500 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-bold text-sm text-[#140152]">Biblical Integration</h4>
                    <p className="text-xs text-gray-500">Faith woven into every course and programme.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Users className="w-5 h-5 text-emerald-500 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-bold text-sm text-[#140152]">Diverse Community</h4>
                    <p className="text-xs text-gray-500">Students and scholars from across the nation and beyond.</p>
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
