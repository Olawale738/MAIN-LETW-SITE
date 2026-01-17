'use client'

import Hero from '@/components/shared/Hero'
import SectionWrapper from '@/components/shared/SectionWrapper'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Heart, Users, BookOpen, Globe, Sparkles, Target, Compass } from 'lucide-react'
import { BentoGrid, BentoGridItem } from '@/components/ui/bento-grid'
import { TextGenerateEffect } from '@/components/ui/text-generate-effect'

export default function AboutPage() {
  return (
    <div className="bg-white dark:bg-black">
      <Hero
        title="About The LIGHT"
        subtitle="Spreading God's Love, Transforming Lives"
        height="medium"
        backgroundImage="/9.png"
      />

      <SectionWrapper>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20 space-y-4">
            <span className="text-[#f5bb00] font-bold uppercase tracking-[0.2em] text-sm">Our Identity</span>
            <h2 className="text-4xl md:text-6xl font-black text-[#140152]">Who We Are</h2>
            <div className="w-24 h-1.5 bg-[#f5bb00] mx-auto rounded-full" />
            <div className="max-w-3xl mx-auto pt-4">
              <TextGenerateEffect
                words="The LIGHT is dedicated to spreading the Word of GOD, empowering individuals, and engaging in charitable activities to uplift our community and beyond."
                className="text-xl text-[#140152]/70 leading-relaxed font-medium text-center"
              />
            </div>
          </div>

          <BentoGrid className="max-w-6xl mx-auto mb-20">
            <BentoGridItem
              title="Our Mission"
              description="To spread the love of Christ through worship, discipleship, and community service, transforming lives and building a stronger faith community."
              header={<div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-[#140152] to-[#140152]/80 flex items-center justify-center group-hover/bento:scale-105 transition-transform duration-300"><Target className="w-16 h-16 text-[#f5bb00]" /></div>}
              className="md:col-span-1"
              icon={<Target className="h-4 w-4 text-neutral-500" />}
            />
            <BentoGridItem
              title="Our Vision"
              description="To be a beacon of hope and light in our community, empowering individuals to live purposeful lives rooted in faith and service."
              header={<div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-[#f5bb00] to-[#f5bb00]/80 flex items-center justify-center group-hover/bento:scale-105 transition-transform duration-300"><Compass className="w-16 h-16 text-[#140152]" /></div>}
              className="md:col-span-1"
              icon={<Compass className="h-4 w-4 text-neutral-500" />}
            />
            <BentoGridItem
              title="Our Values"
              description="Faith, Love, Service, Integrity, and Community. We believe in living out these values daily through our actions and ministry. Walking in the light of God's word."
              header={<div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-neutral-200 dark:from-neutral-900 bg-[url('https://images.unsplash.com/photo-1529070538774-1843cb3265df?w=800')] bg-cover bg-center" />}
              className="md:col-span-1"
              icon={<Sparkles className="h-4 w-4 text-neutral-500" />}
            />
            <BentoGridItem
              title="Our Reach"
              description="From local community outreach to global missions, we're committed to making a difference wherever God calls us to serve."
              header={<div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-neutral-200 dark:from-neutral-900 bg-[url('https://images.unsplash.com/photo-1526976668912-1a811878dd37?w=800')] bg-cover bg-center" />}
              className="md:col-span-3"
              icon={<Globe className="h-4 w-4 text-neutral-500" />}
            />
          </BentoGrid>
        </div>
      </SectionWrapper>

      <SectionWrapper background="gray">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="relative group">
            <div className="aspect-[4/3] rounded-[3rem] overflow-hidden shadow-2xl">
              <img src="/Founder.png" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="Founder" />
            </div>
            <div className="absolute -bottom-8 -right-8 h-28 bg-[#f5bb00] rounded-[2rem] p-8 flex flex-col justify-end shadow-xl group-hover:-translate-y-2 transition-transform duration-300">
              <span className="text-lg font-black text-[#140152]">Apostle. Olawale N Sanni</span>
              <span className="text-[#140152]/60 font-bold uppercase tracking-widest text-xs">Founder/President</span>
              <span className="text-[#140152]/60 font-bold tracking-widest text-xs">president@letw.org</span>
            </div>
          </div>
          <div className="space-y-8">
            <div className="space-y-4">
              <span className="text-[#f5bb00] font-bold uppercase tracking-[0.2em] text-sm">Founding Journey</span>
              <h2 className="text-4xl md:text-5xl font-black text-[#140152] leading-tight">Our Story of Faith</h2>
            </div>
            <div className="space-y-6 text-lg text-[#140152]/70 leading-relaxed font-medium">
              <p>
                Founded with a vision to bring light to those in darkness, The LIGHT has grown into a vibrant community of believers committed to making a difference. Through worship, teaching, and service, we continue to fulfill our calling to be salt and light in the world.
              </p>
              <p>
                Our journey has been marked by God's faithfulness, and we look forward to continued growth and impact as we serve our community and beyond.
              </p>
            </div>
          </div>
        </div>
      </SectionWrapper>
    </div>
  )
}