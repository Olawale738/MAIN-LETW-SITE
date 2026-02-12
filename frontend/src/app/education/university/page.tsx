'use client'
import React from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import PremiumButton from '@/components/ui/PremiumButton'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function UniversityPage() {
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
      <div className="relative h-[60vh] bg-emerald-900 overflow-hidden flex items-center justify-center pt-24">
        <img
          src="/UniversityHero.jpg"
          alt="University Background"
          className="absolute inset-0 w-full h-full object-cover opacity-50"
        />
        <div className="absolute inset-0 bg-black/40 z-10" />
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="relative z-20 text-center text-white px-4"
        >
          <h1 className="text-6xl md:text-8xl font-black mb-4 tracking-tight">THE LIGHT<br /><span className="text-emerald-400">UNIVERSITY</span></h1>
          <p className="text-xl md:text-2xl text-gray-200 mt-4 max-w-3xl mx-auto">
            Where Faith Meets Intellectual Pursuit
          </p>
        </motion.div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-20">


        <div className="grid md:grid-cols-3 gap-8">
          {[
            { title: "Faculties", desc: "Science, Humanities, Business, and Technology.", color: "bg-emerald-100 text-emerald-800" },
            { title: "Campus Life", desc: "A vibrant community of believers and scholars.", color: "bg-blue-100 text-blue-800" },
            { title: "Research", desc: "Solving global problems with kingdom solutions.", color: "bg-purple-100 text-purple-800" }
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              viewport={{ once: true }}
              className={`p-8 rounded-3xl ${item.color.split(' ')[0]}`}
            >
              <h3 className={`text-2xl font-bold mb-4 ${item.color.split(' ')[1]}`}>{item.title}</h3>
              <p className="text-gray-700 font-medium">{item.desc}</p>
            </motion.div>
          ))}
        </div>

        <div className="mt-20 text-center">
          <h2 className="text-3xl font-bold text-[#140152] mb-8">Ready to higher heights?</h2>
          <PremiumButton href="/education/coming-soon" className="bg-[#140152] text-white hover:bg-[#140152]/90 ">
            Visit University Website
          </PremiumButton>
        </div>
      </div>
    </div>
  )
}
