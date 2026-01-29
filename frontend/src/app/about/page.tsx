'use client'

import React, { useState, useEffect } from 'react'
import Hero from '@/components/shared/Hero'
import SectionWrapper from '@/components/shared/SectionWrapper'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Heart, Users, BookOpen, Globe, Sparkles, Target, Compass } from 'lucide-react'
import { BentoGrid, BentoGridItem } from '@/components/ui/bento-grid'
import { TextGenerateEffect } from '@/components/ui/text-generate-effect'
import { cmsApi, CMSPageContent } from '@/lib/api'

const DEFAULT_CONTENT: CMSPageContent = {
  hero: { title: "About LETW", subtitle: "Spreading God's Love, Transforming Lives", bg_image: "/9.png" },
  identity: {
    title: "Who We Are",
    description: "Light Encounter Tabernacle Worldwide is dedicated to spreading the Word of GOD, empowering individuals, and engaging in charitable activities to uplift our community and beyond."
  },
  grid: {
    mission: { title: "Our Mission", description: "To spread the love of Christ through worship, discipleship, and community service, transforming lives and building a stronger faith community." },
    vision: { title: "Our Vision", description: "To be a beacon of hope and light in our community, empowering individuals to live purposeful lives rooted in faith and service." },
    values: { title: "Our Values", description: "Faith, Love, Service, Integrity, and Community. We believe in living out these values daily through our actions and ministry. Walking in the light of God's word.", image: "https://images.unsplash.com/photo-1529070538774-1843cb3265df?w=800" },
    reach: { title: "Our Reach", description: "From local community outreach to global missions, we're committed to making a difference wherever God calls us to serve.", image: "https://images.unsplash.com/photo-1526976668912-1a811878dd37?w=800" }
  },
  founder: {
    image: "/Founder.png",
    name: "Apostle. Olawale N. Sanni",
    role: "Founder/President",
    email: "president@letw.org",
    title: "Our Story of Faith",
    content_1: "Founded with a vision to bring light to those in darkness, LETW has grown into a vibrant community of believers committed to making a difference. Through worship, teaching, and service, we continue to fulfill our calling to be salt and light in the world.",
    content_2: "Our journey has been marked by God's faithfulness, and we look forward to continued growth and impact as we serve our community and beyond."
  }
}

export default function AboutPage() {
  const [content, setContent] = useState<CMSPageContent>(DEFAULT_CONTENT)

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const data = await cmsApi.getPage('about')
        if (data && data.content) {
          setContent(prev => ({
            ...prev,
            ...data.content,
            // Deep merge specialized sections if needed, but simplistic spread usually works for replacing objects
            // For grids/nested objects, explicit merging is safer if new structure misses keys
            hero: { ...prev.hero, ...data.content.hero },
            identity: { ...prev.identity, ...data.content.identity },
            grid: { ...prev.grid, ...data.content.grid },
            founder: { ...prev.founder, ...data.content.founder },
          }))
        }
      } catch (err) {
        console.log("Using default about content")
      }
    }
    fetchContent()
  }, [])

  const getImageUrl = (img?: string) => {
    if (!img) return ''
    if (img.startsWith('/') || img.startsWith('http')) return img
    return cmsApi.getImageUrl(img)
  }

  return (
    <div className="bg-white dark:bg-black">
      <Hero
        title={content.hero?.title}
        subtitle={content.hero?.subtitle}
        height="medium"
        backgroundImage={getImageUrl(content.hero?.bg_image)}
      />

      <SectionWrapper>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20 space-y-4">
            <span className="text-[#f5bb00] font-bold uppercase tracking-[0.2em] text-sm">Our Identity</span>
            <h2 className="text-4xl md:text-6xl font-black text-[#140152]">{content.identity?.title}</h2>
            <div className="w-24 h-1.5 bg-[#f5bb00] mx-auto rounded-full" />
            <div className="max-w-3xl mx-auto pt-4">
              <TextGenerateEffect
                words={content.identity?.description || ""}
                className="text-xl text-[#140152]/70 leading-relaxed font-medium text-center"
              />
            </div>
          </div>

          <BentoGrid className="max-w-6xl mx-auto mb-20">
            <BentoGridItem
              title={content.grid?.mission?.title}
              description={content.grid?.mission?.description}
              header={<div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-[#140152] to-[#140152]/80 flex items-center justify-center group-hover/bento:scale-105 transition-transform duration-300"><Target className="w-16 h-16 text-[#f5bb00]" /></div>}
              className="md:col-span-1"
              icon={<Target className="h-4 w-4 text-neutral-500" />}
            />
            <BentoGridItem
              title={content.grid?.vision?.title}
              description={content.grid?.vision?.description}
              header={<div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-[#f5bb00] to-[#f5bb00]/80 flex items-center justify-center group-hover/bento:scale-105 transition-transform duration-300"><Compass className="w-16 h-16 text-[#140152]" /></div>}
              className="md:col-span-1"
              icon={<Compass className="h-4 w-4 text-neutral-500" />}
            />
            <BentoGridItem
              title={content.grid?.values?.title}
              description={content.grid?.values?.description}
              header={
                <div
                  className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-neutral-200 dark:from-neutral-900 bg-cover bg-center"
                  style={{ backgroundImage: `url('${getImageUrl(content.grid?.values?.image)}')` }}
                />
              }
              className="md:col-span-1"
              icon={<Sparkles className="h-4 w-4 text-neutral-500" />}
            />
            <BentoGridItem
              title={content.grid?.reach?.title}
              description={content.grid?.reach?.description}
              header={
                <div
                  className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-neutral-200 dark:from-neutral-900 bg-cover bg-center"
                  style={{ backgroundImage: `url('${getImageUrl(content.grid?.reach?.image)}')` }}
                />
              }
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
              <img src={getImageUrl(content.founder?.image)} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="Founder" />
            </div>
            <div className="absolute -bottom-8 -right-8 h-28 bg-[#f5bb00] rounded-[2rem] p-8 flex flex-col justify-end shadow-xl group-hover:-translate-y-2 transition-transform duration-300">
              <span className="text-lg font-black text-[#140152]">{content.founder?.name}</span>
              <span className="text-[#140152]/60 font-bold uppercase tracking-widest text-xs">{content.founder?.role}</span>
              <span className="text-[#140152]/60 font-bold tracking-widest text-xs">{content.founder?.email}</span>
            </div>
          </div>
          <div className="space-y-8">
            <div className="space-y-4">
              <span className="text-[#f5bb00] font-bold uppercase tracking-[0.2em] text-sm">Founding Journey</span>
              <h2 className="text-4xl md:text-5xl font-black text-[#140152] leading-tight">{content.founder?.title}</h2>
            </div>
            <div className="space-y-6 text-lg text-[#140152]/70 leading-relaxed font-medium">
              <p>{content.founder?.content_1}</p>
              <p>{content.founder?.content_2}</p>
            </div>
          </div>
        </div>
      </SectionWrapper>
    </div>
  )
}
