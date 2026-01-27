'use client'
import Hero from '@/components/shared/Hero'
import SectionWrapper from '@/components/shared/SectionWrapper'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import PremiumButton from '@/components/ui/PremiumButton'
import Link from 'next/link'
import { GraduationCap, Book, Users, Award } from 'lucide-react'
import ServiceAnnouncements from '@/components/shared/ServiceAnnouncements'

export default function EducationPage() {
  return (
    <>
      {/* Custom Hero for Mobile 100vh + Img Tag */}
      <div className="relative h-[100vh] md:h-[60vh] w-full overflow-hidden flex items-center justify-center bg-black">
        <img
          src="https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1200"
          alt="Education Background"
          className="absolute inset-0 w-full h-full object-cover opacity-50"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#140152]/80 via-transparent to-transparent" />

        <div className="relative z-20 text-center text-white px-4 max-w-4xl pt-20 md:pt-0">
          <span className="text-[#f5bb00] font-bold tracking-[0.2em] uppercase text-sm mb-4 block animate-fade-in-up">Academic Excellence</span>
          <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight animate-fade-in-up delay-100">
            School of<br /><span className="text-[#f5bb00]">Destiny</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-200 max-w-2xl mx-auto font-light animate-fade-in-up delay-200">
            Nurturing Minds, Building Character, Transforming Lives.
          </p>
        </div>
      </div>

      <SectionWrapper>
        {/* Announcements for Theology School */}
        <div className="max-w-4xl mx-auto mb-12">
          <ServiceAnnouncements serviceName="Theology school" />
        </div>

        <div className="max-w-4xl mx-auto text-center mb-20 space-y-4">
          <span className="text-[#f5bb00] font-bold uppercase tracking-[0.2em] text-sm">Academic Excellence</span>
          <h2 className="text-4xl md:text-5xl font-black text-[#140152]">Our Educational Mission</h2>
          <div className="w-24 h-1.5 bg-[#f5bb00] mx-auto rounded-full" />
          <p className="text-lg text-[#140152]/70 leading-relaxed max-w-2xl mx-auto pt-4 font-medium">
            The LIGHT is committed to providing quality Christian education that develops the whole person - spiritually, academically, and socially. Our educational institutions are designed to equip students with both knowledge and godly character.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <Card className="group hover:-translate-y-2 transition-transform duration-300 border-none shadow-xl hover:shadow-2xl h-full">
            <CardHeader className="text-center pt-8">
              <div className="w-16 h-16 bg-[#140152]/5 rounded-2xl flex items-center justify-center mb-6 mx-auto text-[#140152] group-hover:bg-[#f5bb00] transition-colors">
                <Book className="w-8 h-8" />
              </div>
              <CardTitle className="text-center text-[#140152] font-black text-xl">Primary School</CardTitle>
            </CardHeader>
            <CardContent className="text-center flex flex-col items-center justify-between flex-grow h-full pb-4">
              <p className="text-gray-600 font-medium mb-1 leading-relaxed">Building Strong Foundations for Lifelong Learning</p>
              <PremiumButton href="/education/primary-school" className="">Learn More</PremiumButton>
            </CardContent>
          </Card>

          <Card className="group hover:-translate-y-2 transition-transform duration-300 border-none shadow-xl hover:shadow-2xl h-full">
            <CardHeader className="text-center pt-8">
              <div className="w-16 h-16 bg-[#140152]/5 rounded-2xl flex items-center justify-center mb-6 mx-auto text-[#140152] group-hover:bg-[#f5bb00] transition-colors">
                <Users className="w-8 h-8" />
              </div>
              <CardTitle className="text-center text-[#140152] font-black text-xl">Secondary School</CardTitle>
            </CardHeader>
            <CardContent className="text-center flex flex-col items-center justify-between flex-grow h-full pb-4">
              <p className="text-gray-600 font-medium mb-1 leading-relaxed">Shaping Minds, Building Character, Preparing Futures</p>
              <PremiumButton href="/education/secondary-school" className="">Learn More</PremiumButton>
            </CardContent>
          </Card>

          <Card className="group hover:-translate-y-2 transition-transform duration-300 border-none shadow-xl hover:shadow-2xl h-full">
            <CardHeader className="text-center pt-8">
              <div className="w-16 h-16 bg-[#140152]/5 rounded-2xl flex items-center justify-center mb-6 mx-auto text-[#140152] group-hover:bg-[#f5bb00] transition-colors">
                <GraduationCap className="w-8 h-8" />
              </div>
              <CardTitle className="text-center text-[#140152] font-black text-xl">University</CardTitle>
            </CardHeader>
            <CardContent className="text-center flex flex-col items-center justify-between flex-grow h-full pb-4">
              <p className="text-gray-600 font-medium mb-1 leading-relaxed">Advancing Knowledge. Shaping Leaders. Impacting the World.</p>
              <PremiumButton href="/education/university" className="">Learn More</PremiumButton>
            </CardContent>
          </Card>

          <Card className="group hover:-translate-y-2 transition-transform duration-300 border-none shadow-xl hover:shadow-2xl h-full">
            <CardHeader className="text-center pt-8">
              <div className="w-16 h-16 bg-[#140152]/5 rounded-2xl flex items-center justify-center mb-6 mx-auto text-[#140152] group-hover:bg-[#f5bb00] transition-colors">
                <Award className="w-8 h-8" />
              </div>
              <CardTitle className="text-center text-[#140152] font-black text-xl">Theology School</CardTitle>
            </CardHeader>
            <CardContent className="text-center flex flex-col items-center justify-between flex-grow h-full pb-4">
              <p className="text-gray-600 font-medium mb-1 leading-relaxed">Training Sound Minds. Forming Faithful Ministers.</p>
              <PremiumButton href="/education/theology-school" className="">Learn More</PremiumButton>
            </CardContent>
          </Card>
        </div>
      </SectionWrapper>

      <SectionWrapper background="gray">
        <div className="max-w-6xl mx-auto mt-40">
          <div className="text-center mb-16 space-y-4">
            <span className="text-[#f5bb00] font-bold uppercase tracking-[0.2em] text-sm">Distinctives</span>
            <h2 className="text-3xl md:text-4xl font-black text-[#140152]">Why Choose Our Schools?</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
            <div className="flex items-start space-x-6 p-6 bg-white rounded-3xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-[#f5bb00]/10 rounded-2xl flex items-center justify-center flex-shrink-0 text-[#f5bb00]">
                <Book className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-xl font-black text-[#140152] mb-2">Biblical Foundation</h3>
                <p className="text-gray-600 font-medium leading-relaxed">
                  All our programs are rooted in Biblical principles and Christian values, integrating faith with learning seamlessly.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-6 p-6 bg-white rounded-3xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-[#f5bb00]/10 rounded-2xl flex items-center justify-center flex-shrink-0 text-[#f5bb00]">
                <Users className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-xl font-black text-[#140152] mb-2">Qualified Staff</h3>
                <p className="text-gray-600 font-medium leading-relaxed">
                  Experienced and dedicated educators committed to student success, mentoring them both academically and spiritually.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-6 p-6 bg-white rounded-3xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-[#f5bb00]/10 rounded-2xl flex items-center justify-center flex-shrink-0 text-[#f5bb00]">
                <GraduationCap className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-xl font-black text-[#140152] mb-2">Academic Excellence</h3>
                <p className="text-gray-600 font-medium leading-relaxed">
                  A rigorous curriculum that challenges students to think critically and prepares them for higher education and their future careers.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-6 p-6 bg-white rounded-3xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-[#f5bb00]/10 rounded-2xl flex items-center justify-center flex-shrink-0 text-[#f5bb00]">
                <Award className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-xl font-black text-[#140152] mb-2">Character Development</h3>
                <p className="text-gray-600 font-medium leading-relaxed">
                  We focus on building integrity, leadership skills, and servant-heartedness, nurturing future leaders of character.
                </p>
              </div>
            </div>
          </div>
        </div>
      </SectionWrapper>
    </>
  )
}