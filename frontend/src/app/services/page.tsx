'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import PremiumButton from '@/components/ui/PremiumButton'
import { ArrowRight, Music, Users, BookOpen, Heart, Sparkles, Mic2, Globe, TrendingUp, Church, Briefcase, PlayCircle } from 'lucide-react'
import ServiceCard from '@/components/shared/ServiceCard'
import SectionWrapper from '@/components/shared/SectionWrapper'
import Hero from '@/components/shared/Hero'
import { sermonApi, Sermon } from '@/lib/api'

export default function ServicesPage() {
  const [recentSermons, setRecentSermons] = useState<Sermon[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSermons = async () => {
      try {
        const data = await sermonApi.getPublicSermons()
        setRecentSermons(data.sermons.slice(0, 3))
      } catch (error) {
        console.error("Failed to fetch sermons", error)
      } finally {
        setLoading(false)
      }
    }
    fetchSermons()
  }, [])

  const extractYoutubeId = (url: string): string | null => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/)
    return match ? match[1] : null
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
      <Hero
        title="Our Services"
        subtitle="Serving God, Serving Community"
        height="medium"
      />

      {/* OUR SERVICES */}
      <SectionWrapper>
        <div className="text-center mb-16 space-y-4">
          <span className="text-[#f5bb00] font-bold uppercase tracking-[0.2em] text-sm">Worship & Word</span>
          <h2 className="text-4xl md:text-5xl font-black text-[#140152]">Our Main Services</h2>
          <div className="w-24 h-1.5 bg-[#f5bb00] mx-auto rounded-full" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <ServiceCard
            icon={<Church className="w-8 h-8" />}
            title="Sunday Worship Service"
            description="Join us every Sunday at 9:00 AM at our Main Campus for a powerful time of worship and word."
            buttonText="Watch Latest Sermons"
            buttonLink="/sermons"
          />
          <ServiceCard
            icon={<Church className="w-8 h-8" />}
            title="Midweek Service"
            description="Recharge your spiritual batteries every Wednesday at 7:00 PM at our Downtown Campus."
            buttonText="Watch Midweek Sermons"
            buttonLink="/midweek-sermons"
          />
          <ServiceCard
            icon={<Church className="w-8 h-8" />}
            title="Special Services"
            description="Experience divine encounters during our special services and theme conventions."
            buttonText="Upcoming Events"
            buttonLink="/events"
          />
        </div>
      </SectionWrapper>

      {/* DISCIPLESHIP SERVICES */}
      <SectionWrapper background="gray">
        <div className="text-center mb-16 space-y-4">
          <span className="text-[#f5bb00] font-bold uppercase tracking-[0.2em] text-sm">Growth & Faith</span>
          <h2 className="text-4xl md:text-5xl font-black text-[#140152]">Discipleship Services</h2>
          <div className="w-24 h-1.5 bg-[#f5bb00] mx-auto rounded-full" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <ServiceCard
            icon={<BookOpen className="w-8 h-8" />}
            title="Bible Study"
            description="Deepen your understanding of the Bible every Tuesday at 6:00 PM with our interactive sessions."
            buttonText="Join Bible Study"
            buttonLink="/bible-study"
          />
          <ServiceCard
            icon={<Users className="w-8 h-8" />}
            title="Prayer Meeting"
            description="Participate in our power-packed prayer meetings every Friday at 8:00 PM."
            buttonText="Join Prayer Meeting"
            buttonLink="/prayer"
          />
          <ServiceCard
            icon={<TrendingUp className="w-8 h-8" />}
            title="Discipleship Training"
            description="Enhance your spiritual growth with our structured discipleship training programs."
            buttonText="Learn More"
            buttonLink="/discipleship"
          />
        </div>
      </SectionWrapper>

      {/* OUTREACH & CHARITY */}
      <SectionWrapper>
        <div className="text-center mb-16 space-y-4">
          <span className="text-[#f5bb00] font-bold uppercase tracking-[0.2em] text-sm">Love in Action</span>
          <h2 className="text-4xl md:text-5xl font-black text-[#140152]">Outreach & Charity</h2>
          <div className="w-24 h-1.5 bg-[#f5bb00] mx-auto rounded-full" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <ServiceCard
            icon={<Heart className="w-8 h-8" />}
            title="Evangelism"
            description="Spreading the Gospel through street evangelism, community engagement, and one-on-one ministry."
            buttonText="Join Evangelism"
            buttonLink="/evangelism"
          />
          <ServiceCard
            icon={<Heart className="w-8 h-8" />}
            title="Charity"
            description="Providing clothing, food, and essential support to the vulnerable in our community."
            buttonText="Support Charity"
            buttonLink="/charity"
          />
          <ServiceCard
            icon={<Users className="w-8 h-8" />}
            title="Community Clean-Up"
            description="Help us clean up our local parks and streets every third Saturday of the month."
            buttonText="Participate"
            buttonLink="/events"
          />
        </div>
      </SectionWrapper>

      {/* TESTIMONIES */}
      <SectionWrapper background="gray">
        <div className="text-center mb-16 space-y-4">
          <span className="text-[#f5bb00] font-bold uppercase tracking-[0.2em] text-sm">God's Goodness</span>
          <h2 className="text-4xl md:text-5xl font-black text-[#140152]">Testimonies</h2>
          <div className="w-24 h-1.5 bg-[#f5bb00] mx-auto rounded-full" />
        </div>
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-lg text-gray-700 leading-relaxed mb-8">
            Read powerful stories of how God is moving in the lives of our members. Share your own story to encourage others.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <Card className="hover:shadow-lg transition-all border-none">
              <CardHeader>
                <CardTitle className="text-[#140152]">Read Stories</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">Be inspired by faith-building testimonies.</p>
                <PremiumButton href="/testimony">View Testimonies</PremiumButton>
              </CardContent>
            </Card>
            <Card className="hover:shadow-lg transition-all border-none">
              <CardHeader>
                <CardTitle className="text-[#140152]">Share Yours</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">Testify of God's goodness in your life.</p>
                <PremiumButton href="/testimony">Submit Testimony</PremiumButton>
              </CardContent>
            </Card>
          </div>
        </div>
      </SectionWrapper>

      {/* YOUTH EMPOWERMENT */}
      <SectionWrapper background="gray">
        <div className="text-center mb-16 space-y-4">
          <span className="text-[#f5bb00] font-bold uppercase tracking-[0.2em] text-sm">Future Leaders</span>
          <h2 className="text-4xl md:text-5xl font-black text-[#140152]">Youth Empowerment</h2>
          <div className="w-24 h-1.5 bg-[#f5bb00] mx-auto rounded-full" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <ServiceCard
            icon={<Briefcase className="w-8 h-8" />}
            title="Leadership Training"
            description="Empowering the next generation of leaders through our monthly leadership training sessions."
            buttonText="Join Now"
            buttonLink="/leadership"
          />
          <ServiceCard
            icon={<Briefcase className="w-8 h-8" />}
            title="Career Guidance"
            description="Providing career guidance and mentorship to help youth achieve their professional goals."
            buttonText="Learn More"
            buttonLink="/career-guidance"
          />
          <ServiceCard
            icon={<Briefcase className="w-8 h-8" />}
            title="Skill Development"
            description="Offering workshops and training programs to develop valuable skills in various fields."
            buttonText="Get Started"
            buttonLink="/skill-development"
          />
        </div>
      </SectionWrapper>

      {/* MINISTRY & SUPPORT */}
      <SectionWrapper>
        <div className="text-center mb-16 space-y-4">
          <span className="text-[#f5bb00] font-bold uppercase tracking-[0.2em] text-sm">Ministry & Support</span>
          <h2 className="text-4xl md:text-5xl font-black text-[#140152]">Specialized Ministry</h2>
          <div className="w-24 h-1.5 bg-[#f5bb00] mx-auto rounded-full" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <ServiceCard
            icon={<Heart className="w-8 h-8" />}
            title="Counselling Services"
            description="Professional individualized, family, and group counseling to support your mental and spiritual well-being."
            buttonText="Book Session"
            buttonLink="/services/counselling"
          />
          <ServiceCard
            icon={<Users className="w-8 h-8" />}
            title="Alter Sound"
            description="A consecrated space where worship and prophetic sound converge. Join the ministry."
            buttonText="Enter Alter Sound"
            buttonLink="/services/alter-sound"
          />
        </div>
      </SectionWrapper>

      {/* Recent Sermons Section - Dynamic */}
      <section className="py-24 bg-white">
        <SectionWrapper>
          <div className="flex flex-col md:flex-row justify-between items-end mb-12">
            <div>
              <span className="text-[#f5bb00] font-bold uppercase tracking-[0.2em] text-sm">Media</span>
              <h2 className="text-4xl md:text-5xl font-black text-[#140152] mt-2">Recent Sermons</h2>
            </div>
            <PremiumButton href="/sermons" className="mt-4 md:mt-0">View All Sermons</PremiumButton>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {loading ? (
              [1, 2, 3].map((i) => (
                <div key={i} className="bg-gray-100 rounded-2xl h-80 animate-pulse" />
              ))
            ) : recentSermons.length > 0 ? (
              recentSermons.map((sermon) => (
                <Card key={sermon.id} className="overflow-hidden border-none shadow-xl hover:shadow-2xl transition-all group">
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
                  <CardContent className="p-6">
                    <span className="text-xs font-bold text-[#f5bb00] uppercase tracking-wider mb-2 block">
                      {sermon.series || "Message"}
                    </span>
                    <h3 className="text-xl font-bold text-[#140152] mb-2 line-clamp-2">{sermon.title}</h3>
                    <p className="text-sm text-gray-500 mb-4 line-clamp-2">{sermon.description}</p>
                    <div className="flex items-center text-[#140152] font-semibold text-sm group-hover:underline">
                      Watch Now <ArrowRight className="w-4 h-4 ml-2" />
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-3 text-center text-gray-400">No sermons available.</div>
            )}
          </div>
        </SectionWrapper>
      </section>
    </div>
  )
}