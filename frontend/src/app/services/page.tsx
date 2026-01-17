import Hero from '@/components/shared/Hero'
import SectionWrapper from '@/components/shared/SectionWrapper'
import ServiceCard from '@/components/shared/ServiceCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import PremiumButton from '@/components/ui/PremiumButton'
import Link from 'next/link'
import { Church, BookOpen, Users, Heart, TrendingUp, Briefcase } from 'lucide-react'

export default function ServicesPage() {
  return (
    <>
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
            buttonLink="/join"
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
            title="The Sound Altar"
            description="A consecrated space where worship and prophetic sound converge. Join the ministry."
            buttonText="Enter Sound Altar"
            buttonLink="/services/sound-altar"
          />
        </div>
      </SectionWrapper>

      {/* RECENT SERMONS */}
      <SectionWrapper>
        <div className="text-center mb-16 space-y-4">
          <span className="text-[#f5bb00] font-bold uppercase tracking-[0.2em] text-sm">Media Vault</span>
          <h2 className="text-4xl md:text-5xl font-black text-[#140152]">Recent Sermons</h2>
          <div className="w-24 h-1.5 bg-[#f5bb00] mx-auto rounded-full" />
        </div>
        <div className="max-w-4xl mx-auto space-y-6">
          {[
            { title: "The Destiny of Dreamers with Heaven Sent Dreams", date: "Jul 13, 2024" },
            { title: "Understanding the Universal Law of Sowing and Reaping", date: "Jul 9, 2024" },
            { title: "The Evidential Proof of Saving Faith in Christ", date: "Jul 8, 2024" }
          ].map((sermon, i) => (
            <Card key={i} className="group hover:bg-[#140152] transition-all duration-500 overflow-hidden">
              <div className="flex flex-col md:flex-row items-center p-8 gap-8">
                <div className="w-16 h-16 bg-[#140152]/5 rounded-2xl flex items-center justify-center text-[#140152] group-hover:bg-[#f5bb00] transition-colors">
                  <TrendingUp className="w-8 h-8" />
                </div>
                <div className="flex-grow text-center md:text-left space-y-2">
                  <p className="text-xs font-bold text-[#f5bb00] uppercase tracking-widest">{sermon.date}</p>
                  <CardTitle className="text-[#140152] text-2xl font-black group-hover:text-white transition-colors">
                    {sermon.title}
                  </CardTitle>
                </div>
                <PremiumButton href="/sermons">Watch Now</PremiumButton>
              </div>
            </Card>
          ))}
        </div>
      </SectionWrapper>
    </>
  )
}