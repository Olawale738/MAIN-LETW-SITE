'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import PremiumButton from '@/components/ui/PremiumButton'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import SectionWrapper from '@/components/shared/SectionWrapper'
import { Calendar, Youtube, ChevronRight, ArrowRight, Heart, Users, Shield, Sparkles } from 'lucide-react'
import { BentoGrid, BentoGridItem } from '@/components/ui/bento-grid'
import { Spotlight } from '@/components/ui/spotlight'
import { TextGenerateEffect } from '@/components/ui/text-generate-effect'
import { InfiniteMovingCards } from '@/components/ui/infinite-moving-cards'
import { motion } from 'framer-motion'

export default function HomePage() {
  return (
    <div className="bg-white dark:bg-black overflow-x-hidden">
      {/* Hero Section with Spotlight */}
      {/* Hero Section with Spotlight */}
      <div className="h-[100vh] md:h-[40rem] w-full rounded-md flex md:items-center md:justify-center bg-[#140152] antialiased bg-[url('/9.png')] bg-cover bg-center relative overflow-hidden">

        <Spotlight
          className="-top-40 left-0 md:left-60 md:-top-20"
          fill="white"
        />
        <div className="p-4 max-w-7xl  mx-auto relative z-10  w-full pt-30 md:pt-0">
          <h1 className="text-4xl md:text-7xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-b from-neutral-50 to-neutral-400 bg-opacity-50">
            Light Encounter <br /> Tabernacle
          </h1>
          <div className="mt-4 font-normal text-white/90 max-w-lg text-center mx-auto">
            <TextGenerateEffect words="Engage. Empower. Uplift. Experience the divine presence in a sanctuary of faith and love." className="text-center text-White/90" />
          </div>
          <div className="mt-8 flex justify-center gap-4">
            <PremiumButton href="/join">Join Our Family</PremiumButton>

          </div>
        </div>
      </div>

      {/* About Section - Founder & Vision */}
      <section className="py-20 bg-white">
        <SectionWrapper>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="relative group">
              <div className="aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl">
                <img src="/Founder.png" alt="Founder" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
              </div>
              <div className="absolute -bottom-6 -right-6 bg-[#f5bb00] text-[#140152] p-6 rounded-xl shadow-xl max-w-xs hidden md:block">
                <p className="font-bold text-lg leading-tight">Apostle. Olawale N. Sanni</p>
                <p className="text-sm font-semibold mt-2 text-right">Founder/President</p>
              </div>
            </div>

            <div className="space-y-8">
              <div>
                <span className="text-[#f5bb00] font-bold uppercase tracking-[0.2em] text-sm">About Us</span>
                <h2 className="text-4xl md:text-5xl font-black text-[#140152] mt-2 leading-tight">A Vision for <br />Community Transformation</h2>
              </div>

              <div className="space-y-4 text-lg text-gray-600 leading-relaxed font-medium">
                <p>
                  Founded on the principles of faith, love, and service, Light Encounter Tabernacle is dedicated to being a beacon of hope. Our mission is to empower individuals to live purposeful lives through the transformative power of God's Word.
                </p>
                <p>
                  "You are the light of the world. A town built on a hill cannot be hidden... In the same way, let your light shine before others, that they may see your good deeds and glorify your Father in heaven." <span className="text-[#140152] font-bold">- Matthew 5:14-16</span>
                </p>
              </div>

              <PremiumButton href="/about">Read Our Full Story</PremiumButton>
            </div>
          </div>
        </SectionWrapper>
      </section>
      <section className="py-20 bg-white">
        <SectionWrapper>
          <div className="text-center mb-16">
            <span className="text-[#f5bb00] font-bold uppercase tracking-[0.2em] text-sm">Our Essence</span>
            <h2 className="text-4xl md:text-5xl font-black text-[#140152] mt-2">More Than A Church</h2>
          </div>
          <BentoGrid className="max-w-6xl mx-auto">
            <BentoGridItem
              title="Divine Worship"
              description="Experience powerful, spirit-filled worship that connects you directly to the heart of God."
              header={<div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-neutral-200 dark:from-neutral-900 dark:to-neutral-800 to-neutral-100 bg-[url('https://images.unsplash.com/photo-1438232992991-995b7058bbb3?w=800')] bg-cover bg-center" />}
              className="md:col-span-2"
              icon={<Sparkles className="h-4 w-4 p-2 text-neutral-500" />}
            />
            <BentoGridItem
              title="Community"
              description="A place where everyone belongs. We foster strong relationships and genuine care."
              header={<div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-neutral-200 dark:from-neutral-900 dark:to-neutral-800 to-neutral-100 bg-[url('https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=800')] bg-cover bg-center" />}
              className="md:col-span-1"
              icon={<Users className="h-4 w-4 p-2 text-neutral-500" />}
            />
            <BentoGridItem
              title="Pastoral Care"
              description="Guidance and support for every season of your life."
              header={<div className="flex flex-1 w-full h-full min-h-[6rem] rounded-top-xl bg-transparent dark:from-neutral-900 dark:to-neutral-800 to-neutral-100 " />}
              className="md:col-span-1 bg-[url('https://images.unsplash.com/photo-1544427928-c49cdfebf494?w=800')] bg-cover bg-center"
              icon={<Shield className="h-4 w-4 p-2 text-neutral-500" />}
            />
            <BentoGridItem
              title="Outreach"
              description="Extending God's love beyond our walls to those in need."
              header={<div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-neutral-200 dark:from-neutral-900 dark:to-neutral-800 to-neutral-100 bg-[url('https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?w=800')] bg-cover bg-center" />}
              className="md:col-span-2"
              icon={<Heart className="h-4 w-4 p-2 text-neutral-500" />}
            />
          </BentoGrid>
        </SectionWrapper>
      </section>

      {/* Latest Sermons - Parallax / Scroll */}
      <section className="py-24 bg-[#140152] overflow-hidden">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12">
            <div className="max-w-2xl">
              <h2 className="text-3xl md:text-5xl font-black text-[#f5bb00] mb-4">Latest Sermons</h2>
              <p className="text-[#fff]/60 text-lg">Dive into the Word. Watch our latest messages and series.</p>
            </div>
            <PremiumButton href="/sermons">View All Archives</PremiumButton>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <motion.div
                key={i}
                whileHover={{ y: -10 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Card className="overflow-hidden border-none shadow-xl hover:shadow-2xl transition-shadow bg-white h-full flex flex-col">
                  <div className="relative aspect-video">
                    <img
                      src={`https://images.unsplash.com/photo-1478147427282-58a87a120781?w=800&q=80&v=${i}`}
                      className="w-full h-full object-cover"
                      alt="Sermon Thumbnail"
                    />
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-300">
                      <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center">
                        <Youtube className="w-8 h-8 text-white" />
                      </div>
                    </div>
                  </div>
                  <CardContent className="p-6 flex-grow flex flex-col justify-between">
                    <div>
                      <span className="text-xs font-bold text-[#f5bb00] uppercase tracking-wider mb-2 block">Sunday Service</span>
                      <h3 className="text-xl font-bold text-[#140152] mb-2 leading-tight">Walking in Divine Authority</h3>
                      <p className="text-sm text-gray-500 mb-4 line-clamp-2">Understanding your position in Christ and living a victorious life.</p>
                    </div>
                    <div className="flex items-center text-[#140152] font-semibold text-sm group cursor-pointer">
                      Watch Now <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Events */}
      <section className="py-24 bg-white">
        <SectionWrapper>
          <div className="text-center mb-16">
            <span className="text-[#f5bb00] font-bold uppercase tracking-[0.2em] text-sm">Join Us</span>
            <h2 className="text-4xl md:text-5xl font-black text-[#140152] mt-2">Upcoming Events</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <motion.div
                key={i}
                whileHover={{ scale: 1.02 }}
                className="relative group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-[#140152] to-[#f5bb00] rounded-2xl blur opacity-25 group-hover:opacity-50 transition-opacity duration-500" />
                <div className="relative bg-white rounded-2xl p-8 h-full border border-gray-100 shadow-lg flex flex-col">
                  <div className="flex justify-between items-start mb-6">
                    <div className="w-16 h-16 bg-gray-50 rounded-2xl flex flex-col items-center justify-center text-[#140152] border border-gray-100">
                      <span className="text-2xl font-black leading-none">1{i}</span>
                      <span className="text-[10px] font-bold uppercase">Oct</span>
                    </div>
                    <span className="px-3 py-1 bg-[#f5bb00]/10 text-[#f5bb00] text-xs font-bold rounded-full uppercase tracking-wider">
                      Upcoming
                    </span>
                  </div>
                  <h3 className="text-2xl font-black text-[#140152] mb-2">Worship Night</h3>
                  <p className="text-gray-500 text-sm mb-6 flex-grow">Join us for an evening of powerful worship and prayer.</p>

                  <div className="flex items-center justify-between pt-6 border-t border-gray-100">
                    <div className="flex items-center text-gray-400 text-xs font-medium">
                      <Calendar className="w-4 h-4 mr-2" />
                      <span>18:00 PM</span>
                    </div>
                    <Link href="/events" className="w-8 h-8 rounded-full bg-[#140152] flex items-center justify-center hover:bg-[#f5bb00] transition-colors">
                      <ArrowRight className="w-4 h-4 text-white" />
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-16">
            <PremiumButton href="/events">View Full Calendar</PremiumButton>
          </div>
        </SectionWrapper>
      </section>

    </div>
  )
}
