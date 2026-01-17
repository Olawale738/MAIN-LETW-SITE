import Hero from '@/components/shared/Hero'
import SectionWrapper from '@/components/shared/SectionWrapper'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import PremiumButton from '@/components/ui/PremiumButton'
import Link from 'next/link'

export default function LeadershipPage() {
  return (
    <>
      <Hero
        title="Leadership Training"
        subtitle="Empowering Future Leaders"
        height="medium"
      />

      <SectionWrapper>
        <div className="max-w-4xl mx-auto">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-3xl text-[#140152]">Empowering Future Leaders</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-lg text-gray-700 leading-relaxed">
                Our Leadership Training program is dedicated to nurturing the next generation of leaders. Through Biblical teachings and practical workshops, we aim to instill the qualities of servant leadership, vision, and integrity.
              </p>

              <div className="bg-[#140152] text-white p-6 rounded-lg">
                <h3 className="text-xl font-bold mb-3">Scripture Foundation</h3>
                <p className="italic leading-relaxed">
                  "Where there is no vision, the people perish: but he that keepeth the law, happy is he." - Proverbs 29:18
                </p>
              </div>

              <div className="space-y-4">
                <h3 className="text-2xl font-bold text-[#140152]">What We Offer</h3>
                <ul className="space-y-3 text-gray-700">
                  <li className="flex items-start">
                    <span className="text-[#140152] font-bold mr-3">•</span>
                    <span>Biblical foundations of leadership and servant-heartedness</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-[#140152] font-bold mr-3">•</span>
                    <span>Practical workshops on vision casting and strategic planning</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-[#140152] font-bold mr-3">•</span>
                    <span>Character development and integrity in leadership</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-[#140152] font-bold mr-3">•</span>
                    <span>Mentorship opportunities with experienced leaders</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-[#140152] font-bold mr-3">•</span>
                    <span>Team building and communication skills training</span>
                  </li>
                </ul>
              </div>

              <div className="text-center pt-6">
                <PremiumButton href="/join">Join Now</PremiumButton>
              </div>
            </CardContent>
          </Card>
        </div>
      </SectionWrapper>

      <SectionWrapper background="gray">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-[#140152] mb-6">Program Schedule</h2>
          <p className="text-lg text-gray-700 mb-8">
            Leadership Training sessions are held monthly. Contact us for the next session date and registration details.
          </p>
          <PremiumButton href="/contact">Contact Us</PremiumButton>
        </div>
      </SectionWrapper>
    </>
  )
}