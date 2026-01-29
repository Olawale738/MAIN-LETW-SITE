'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import PremiumButton from '@/components/ui/PremiumButton'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import SectionWrapper from '@/components/shared/SectionWrapper'
import { Calendar, Youtube, ChevronRight, ArrowRight, Heart, Users, Shield, Sparkles, PlayCircle } from 'lucide-react'
import { BentoGrid, BentoGridItem } from '@/components/ui/bento-grid'
import { Spotlight } from '@/components/ui/spotlight'
import { TextGenerateEffect } from '@/components/ui/text-generate-effect'
import { motion } from 'framer-motion'
import { sermonApi, eventApi, cmsApi, Sermon, Event, CMSPageContent } from '@/lib/api'

const DEFAULT_CONTENT: CMSPageContent = {
  hero: {
    title: "Light Encounter <br /> Tabernacle",
    subtitle: "Engage. Empower. Uplift. Experience the divine presence in a sanctuary of faith and love.",
    bg_image: "/9.png"
  },
  about: {
    label: "About Us",
    founder_image: "/Founder.png",
    founder_name: "Apostle. Olawale N. Sanni",
    founder_role: "Founder/President",
    founder_email: "president@letw.org",
    title: "A Vision for <br />Community Transformation",
    content_1: "Founded on the principles of faith, love, and service, Light Encounter Tabernacle is dedicated to being a beacon of hope. Our mission is to empower individuals to live purposeful lives through the transformative power of God's Word.",
    content_2: `"You are the light of the world. A town built on a hill cannot be hidden... In the same way, let your light shine before others, that they may see your good deeds and glorify your Father in heaven." - Matthew 5:14-16`
  },
  essence: {
    label: "Our Essence",
    title: "More Than A Church",
    cards: [
      {
        title: "Divine Worship",
        description: "Experience powerful, spirit-filled worship that connects you directly to the heart of God.",
        image: "https://images.unsplash.com/photo-1438232992991-995b7058bbb3?w=800",
        className: "md:col-span-2",
        icon: "Sparkles"
      },
      {
        title: "Community",
        description: "A place where everyone belongs. We foster strong relationships and genuine care.",
        image: "https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=800",
        className: "md:col-span-1",
        icon: "Users"
      },
      {
        title: "Pastoral Care",
        description: "Guidance and support for every season of your life.",
        image: "https://images.unsplash.com/photo-1544427928-c49cdfebf494?w=800",
        className: "md:col-span-1",
        icon: "Shield"
      },
      {
        title: "Outreach",
        description: "Extending God's love beyond our walls to those in need.",
        image: "https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?w=800",
        className: "md:col-span-2",
        icon: "Heart"
      }
    ]
  }
}

export default function HomePage() {
  const [recentSermons, setRecentSermons] = useState<Sermon[]>([])
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [content, setContent] = useState<CMSPageContent>(DEFAULT_CONTENT)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sermonsData, eventsData] = await Promise.all([
          sermonApi.getPublicSermons(),
          eventApi.getPublicEvents()
        ])

        // Filter for videos only
        const videoSermons = sermonsData.sermons.filter(s => s.video_url)
        setRecentSermons(videoSermons.slice(0, 3))
        setUpcomingEvents(eventsData.events.slice(0, 3))

        // Fetch CMS Content
        try {
          const cmsData = await cmsApi.getPage('home')
          if (cmsData && cmsData.content) {
            setContent(prev => {
              // Handle essence structure migration if needed (array vs object)
              let newEssence = cmsData.content.essence;
              if (Array.isArray(newEssence)) {
                newEssence = {
                  label: DEFAULT_CONTENT.essence?.label,
                  title: DEFAULT_CONTENT.essence?.title,
                  cards: newEssence
                }
              }

              return {
                ...prev,
                ...cmsData.content,
                about: { ...prev.about, ...cmsData.content.about },
                essence: { ...((prev.essence as any) || {}), ...newEssence }
              }
            })
          }
        } catch (e) {
          console.log("Using default home content")
        }

      } catch (error) {
        console.error("Failed to fetch home data", error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const extractYoutubeId = (url: string): string | null => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/)
    return match ? match[1] : null
  }

  const getImageUrl = (img?: string) => {
    if (!img) return ''
    if (img.startsWith('/') || img.startsWith('http')) return img
    return cmsApi.getImageUrl(img)
  }

  const getIcon = (name: string) => {
    switch (name) {
      case 'Sparkles': return <Sparkles className="h-4 w-4 p-2 text-neutral-500" />
      case 'Users': return <Users className="h-4 w-4 p-2 text-neutral-500" />
      case 'Shield': return <Shield className="h-4 w-4 p-2 text-neutral-500" />
      case 'Heart': return <Heart className="h-4 w-4 p-2 text-neutral-500" />
      default: return <Sparkles className="h-4 w-4 p-2 text-neutral-500" />
    }
  }

  return (
    <div className="bg-white dark:bg-black overflow-x-hidden">
      {/* Hero Section with Spotlight */}
      <div
        className="h-[100vh] md:h-[40rem] w-full rounded-md flex md:items-center md:justify-center bg-[#140152] antialiased bg-cover bg-center relative overflow-hidden"
        style={{ backgroundImage: `url('${getImageUrl(content.hero?.bg_image)}')` }}
      >

        <Spotlight
          className="-top-40 left-0 md:left-60 md:-top-20"
          fill="white"
        />
        <div className="p-4 max-w-7xl  mx-auto relative z-10  w-full pt-48 md:pt-0">
          <h1
            className="text-4xl md:text-7xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-b from-neutral-50 to-neutral-400 bg-opacity-50"
            dangerouslySetInnerHTML={{ __html: content.hero?.title || DEFAULT_CONTENT.hero.title }}
          />
          <div className="mt-4 font-normal text-white/90 max-w-lg text-center mx-auto">
            <TextGenerateEffect words={content.hero?.subtitle || ""} className="text-center text-White/90" />
          </div>
          <div className="mt-8 flex flex-col items-center gap-4">
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
                <img
                  src={getImageUrl(content.about?.founder_image)}
                  alt="Founder"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <div className="absolute -bottom-6 -right-6 bg-[#f5bb00] text-[#140152] p-6 rounded-xl shadow-xl max-w-xs hidden md:block">
                <p className="font-bold text-lg leading-tight">{content.about?.founder_name}</p>
                <p className="text-sm font-semibold text-right">{content.about?.founder_role}</p>
                <p className="text-sm font-semibold text-right">{content.about?.founder_email}</p>
              </div>
            </div>

            <div className="space-y-8">
              <div>
                <span className="text-[#f5bb00] font-bold uppercase tracking-[0.2em] text-sm">{content.about?.label}</span>
                <h2
                  className="text-4xl md:text-5xl font-black text-[#140152] mt-2 leading-tight"
                  dangerouslySetInnerHTML={{ __html: content.about?.title || "" }}
                />
              </div>

              <div className="space-y-4 text-lg text-gray-600 leading-relaxed font-medium">
                <p>{content.about?.content_1}</p>
                <p>{content.about?.content_2}</p>
              </div>

              <PremiumButton href="/about">Read Our Full Story</PremiumButton>
            </div>
          </div>
        </SectionWrapper>
      </section>
      <section className="py-20 bg-white">
        <SectionWrapper>
          <div className="text-center mb-16">
            <span className="text-[#f5bb00] font-bold uppercase tracking-[0.2em] text-sm">{(content.essence as any)?.label}</span>
            <h2 className="text-4xl md:text-5xl font-black text-[#140152] mt-2">{(content.essence as any)?.title}</h2>
          </div>
          <BentoGrid className="max-w-6xl mx-auto">
            {((content.essence as any)?.cards || (Array.isArray(content.essence) ? content.essence : [])).map((item: any, i: number) => (
              <BentoGridItem
                key={i}
                title={item.title}
                description={item.description}
                header={
                  <div
                    className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-neutral-200 dark:from-neutral-900 dark:to-neutral-800 to-neutral-100 bg-cover bg-center"
                    style={{ backgroundImage: `url('${getImageUrl(item.image)}')` }}
                  />
                }
                className={item.className}
                icon={getIcon(item.icon)}
              />
            ))}
          </BentoGrid>
        </SectionWrapper>
      </section>

      {/* Latest Sermons - Dynamic */}
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
            {loading ? (
              [1, 2, 3].map((i) => (
                <div key={i} className="bg-white/5 rounded-2xl h-80 animate-pulse" />
              ))
            ) : recentSermons.length > 0 ? (
              recentSermons.map((sermon) => (
                <motion.div
                  key={sermon.id}
                  whileHover={{ y: -10 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <Card className="overflow-hidden border-none shadow-xl hover:shadow-2xl transition-shadow bg-white h-full flex flex-col">
                    <div className="relative aspect-video bg-black">
                      {sermon.video_url ? (
                        <iframe
                          width="100%"
                          height="100%"
                          src={`https://www.youtube.com/embed/${extractYoutubeId(sermon.video_url)}`}
                          title={sermon.title}
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-200">
                          <PlayCircle className="w-12 h-12 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <CardContent className="p-6 flex-grow flex flex-col justify-between">
                      <div>
                        <span className="text-xs font-bold text-[#f5bb00] uppercase tracking-wider mb-2 block">
                          {sermon.series || "Sunday Service"}
                        </span>
                        <h3 className="text-xl font-bold text-[#140152] mb-2 leading-tight line-clamp-2">{sermon.title}</h3>
                        <p className="text-sm text-gray-500 mb-4 line-clamp-2">{sermon.description}</p>
                      </div>
                      <div className="flex items-center text-[#140152] font-semibold text-sm group cursor-pointer">
                        Watch Now <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            ) : (
              <div className="col-span-3 text-center text-white/60">No recent sermons found.</div>
            )}
          </div>
        </div>
      </section>

      {/* Events - Dynamic */}
      <section className="py-24 bg-white">
        <SectionWrapper>
          <div className="text-center mb-16">
            <span className="text-[#f5bb00] font-bold uppercase tracking-[0.2em] text-sm">Join Us</span>
            <h2 className="text-4xl md:text-5xl font-black text-[#140152] mt-2">Upcoming Events</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {loading ? (
              [1, 2, 3].map((i) => (
                <div key={i} className="bg-gray-100 rounded-2xl h-80 animate-pulse" />
              ))
            ) : upcomingEvents.length > 0 ? (
              upcomingEvents.map((event) => {
                const eventDate = new Date(event.event_date);
                const day = eventDate.getDate();
                const month = eventDate.toLocaleString('default', { month: 'short' });

                return (
                  <motion.div
                    key={event.id}
                    whileHover={{ scale: 1.02 }}
                    className="relative group h-full"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-[#140152] to-[#f5bb00] rounded-2xl blur opacity-25 group-hover:opacity-50 transition-opacity duration-500" />
                    <div className="relative bg-white rounded-2xl p-8 h-full border border-gray-100 shadow-lg flex flex-col">
                      <div className="flex justify-between items-start mb-6">
                        <div className="w-16 h-16 bg-gray-50 rounded-2xl flex flex-col items-center justify-center text-[#140152] border border-gray-100">
                          <span className="text-2xl font-black leading-none">{day}</span>
                          <span className="text-[10px] font-bold uppercase">{month}</span>
                        </div>
                        <span className="px-3 py-1 bg-[#f5bb00]/10 text-[#f5bb00] text-xs font-bold rounded-full uppercase tracking-wider">
                          Upcoming
                        </span>
                      </div>
                      <h3 className="text-2xl font-black text-[#140152] mb-2 line-clamp-1">{event.title}</h3>
                      <p className="text-gray-500 text-sm mb-6 flex-grow line-clamp-3">{event.description}</p>

                      <div className="flex items-center justify-between pt-6 border-t border-gray-100">
                        <div className="flex items-center text-gray-400 text-xs font-medium">
                          <Calendar className="w-4 h-4 mr-2" />
                          <span>{eventDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <Link href="/events" className="w-8 h-8 rounded-full bg-[#140152] flex items-center justify-center hover:bg-[#f5bb00] transition-colors">
                          <ArrowRight className="w-4 h-4 text-white" />
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                )
              })
            ) : (
              <div className="col-span-3 text-center text-gray-400">No upcoming events scheduled.</div>
            )}
          </div>

          <div className="text-center mt-16">
            <PremiumButton href="/events">View Full Calendar</PremiumButton>
          </div>
        </SectionWrapper>
      </section>

    </div>
  )
}
