'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
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
  Calendar
} from 'lucide-react'

export default function PrayerPage() {
  const impactStats = [
    { label: 'Nations Interceding', value: '178' },
    { label: 'Prayers Lifted', value: '3.4M+' },
    { label: 'Continuous Prayer Chain', value: '24/7' },
    { label: 'Answered Prayers', value: '+92,000' }
  ]

  const prayerExperiences = [
    {
      icon: Globe,
      title: 'Global Intercession',
      description: 'Prayer for every nation, every leader, every unreached people group — real-time requests from around the world.'
    },
    {
      icon: Heart,
      title: 'Healing & Deliverance',
      description: 'Targeted prayer for physical healing, emotional restoration, spiritual deliverance, and family breakthroughs.'
    },
    {
      icon: Shield,
      title: 'Spiritual Warfare',
      description: 'Binding strongholds, tearing down demonic structures, releasing angelic assistance over cities and nations.'
    },
    {
      icon: BookOpen,
      title: 'Scripture-Soaked Declarations',
      description: 'Word-based decrees, prophetic declarations, and corporate worship that shift atmospheres.'
    },
    {
      icon: Users,
      title: 'Unity & Fellowship',
      description: 'Believers from every tribe, tongue, and nation coming together in one Spirit, one heart, one voice.'
    },
    {
      icon: Zap,
      title: 'Live & Accessible',
      description: 'Live streams in multiple languages, recordings available 24/7, mobile-friendly — no one is left out.'
    }
  ]

  const schedule = [
    {
      icon: Clock,
      program: 'Daily Prayer Hour',
      time: 'Every Day • 7:00 PM GMT',
      description: 'One hour of focused intercession, worship, and declaration.'
    },
    {
      icon: Moon,
      program: 'All-Night Vigil',
      time: 'Last Friday of Every Month • 10:00 PM – 5:00 AM GMT',
      description: 'Intense spiritual warfare, prophetic worship, and extended waiting on God.'
    },
    {
      icon: Globe,
      program: 'Global Nations Prayer',
      time: 'Every Tuesday • 8:00 PM GMT',
      description: 'Targeted prayer for specific nations, unreached people groups, and global harvest.'
    }
  ]

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Hero Section */}
      <div className="relative h-[90vh] w-full overflow-hidden flex items-center justify-center bg-black">
        <img
          src="https://images.unsplash.com/photo-1507692049790-de58290a4334?q=80&w=2670&auto=format&fit=crop"
          alt="Global Prayer Altar"
          className="absolute inset-0 w-full h-full object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-20 text-center text-white px-4 max-w-5xl mx-auto"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="mb-6"
          >
            <h1 className="text-6xl md:text-8xl font-black mb-4 leading-none bg-gradient-to-r from-white via-[#f5bb00] to-white bg-clip-text text-transparent">
              Global Prayer Altar
            </h1>
          </motion.div>
          <p className="text-2xl md:text-3xl text-[#f5bb00] font-bold mb-6 tracking-wide">
            Where heaven touches earth.
          </p>
          <p className="text-xl md:text-2xl text-gray-300 mb-12 font-light">
            Millions united. Nations transformed. Breakthrough released.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <PremiumButton className="px-10 py-6 text-lg bg-[#f5bb00] text-[#140152] hover:bg-white">
              Join Live Prayer
            </PremiumButton>
            <PremiumButton className="px-10 py-6 text-lg bg-white/10 text-white hover:bg-white hover:text-[#140152] backdrop-blur-sm">
              Full Schedule
            </PremiumButton>
          </div>
        </motion.div>
      </div>

      {/* Impact Stats */}
      <SectionWrapper background="gray">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {impactStats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="bg-white p-6 rounded-2xl shadow-lg text-center border border-gray-100"
            >
              <div className="text-4xl md:text-5xl font-black text-[#f5bb00] mb-2">
                {stat.value}
              </div>
              <div className="text-sm md:text-base font-semibold text-[#140152]">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>
      </SectionWrapper>

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
          {prayerExperiences.map((experience, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="h-full border-none shadow-lg hover:shadow-xl transition-all group">
                <CardContent className="p-8">
                  <div className="w-14 h-14 bg-gradient-to-br from-[#140152] to-[#1d0175] rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <experience.icon className="w-7 h-7 text-[#f5bb00]" />
                  </div>
                  <h3 className="text-xl font-bold text-[#140152] mb-3">
                    {experience.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {experience.description}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </SectionWrapper>

      {/* Prayer Schedule */}
      <SectionWrapper background="gray">
        <div className="text-center mb-16 space-y-4">
          <span className="text-[#f5bb00] font-bold uppercase tracking-[0.2em] text-sm">
            Join Us
          </span>
          <h2 className="text-4xl md:text-5xl font-black text-[#140152]">
            Prayer Schedule
          </h2>
          <div className="w-24 h-1.5 bg-[#f5bb00] mx-auto rounded-full" />
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            24/7 continuous prayer chain + powerful scheduled gatherings. All times in GMT — join from anywhere in the world.
          </p>
        </div>

        <div className="max-w-4xl mx-auto space-y-6">
          {schedule.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="bg-white p-8 rounded-3xl shadow-lg border border-gray-100 flex items-start gap-6"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-[#140152] to-[#1d0175] rounded-2xl flex items-center justify-center flex-shrink-0">
                <item.icon className="w-8 h-8 text-[#f5bb00]" />
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-black text-[#140152] mb-2">
                  {item.program}
                </h3>
                <p className="text-[#f5bb00] font-bold mb-3">{item.time}</p>
                <p className="text-gray-600 leading-relaxed">{item.description}</p>
              </div>
            </motion.div>
          ))}
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
                "My house shall be called a house of prayer for all nations."
              </p>
              <p className="text-white/80 mt-2">— Isaiah 56:7</p>
            </div>
            <p className="text-2xl md:text-3xl text-gray-200 mb-12 font-light leading-relaxed">
              Join the global prayer movement. Your voice matters. Your prayer changes history.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <PremiumButton className="px-12 py-7 text-lg bg-[#f5bb00] text-[#140152] hover:bg-white">
                Enter the Prayer Room Now
              </PremiumButton>
              <PremiumButton className="px-12 py-7 text-lg bg-white/10 text-white hover:bg-white hover:text-[#140152] backdrop-blur-sm border border-white/20">
                See Full Schedule
              </PremiumButton>
            </div>
          </div>
        </motion.div>
      </SectionWrapper>
    </div>
  )
}