import Hero from '@/components/shared/Hero'
import SectionWrapper from '@/components/shared/SectionWrapper'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import PremiumButton from '@/components/ui/PremiumButton'
import Link from 'next/link'
import { Calendar } from 'lucide-react'

export default function PrayerPage() {
  return (
    <>
      <Hero
        title="Prayer Meeting"
        subtitle="Come together in prayer and worship"
        height="medium"
      />

      <SectionWrapper>
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-lg text-gray-700 leading-relaxed">
              Every Friday at 8:00 PM, we come together to lift up our prayers and seek God's guidance. Our prayer meetings are a time of fellowship and spiritual renewal.
            </p>
          </div>

          <h2 className="text-3xl font-bold text-[#140152] text-center mb-8">Upcoming</h2>
          <div className="space-y-6">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center space-x-3 text-[#140152] mb-2">
                  <Calendar className="w-6 h-6" />
                  <span className="font-semibold">July 21, 2024</span>
                </div>
                <CardTitle className="text-[#140152]">
                  Praying for Healing and Deliverance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed">
                  Join us as we intercede for those in need of healing and deliverance. We believe in the power of united prayer.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center space-x-3 text-[#140152] mb-2">
                  <Calendar className="w-6 h-6" />
                  <span className="font-semibold">July 28, 2024</span>
                </div>
                <CardTitle className="text-[#140152]">
                  Interceding for Our Community
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed">
                  Praying for peace, prosperity, and God's blessing upon our local community and nation.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center space-x-3 text-[#140152] mb-2">
                  <Calendar className="w-6 h-6" />
                  <span className="font-semibold">August 4, 2024</span>
                </div>
                <CardTitle className="text-[#140152]">
                  Seeking God's Will for Our Lives
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed">
                  A time of personal prayer and seeking divine direction for our individual and collective journeys.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="text-center mt-12">
            <PremiumButton href="/contact">Join Prayer Meeting</PremiumButton>
          </div>
        </div>
      </SectionWrapper>

      <SectionWrapper background="gray">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-[#140152] mb-6">Have a Prayer Request?</h2>
          <p className="text-lg text-gray-700 mb-8">
            Our prayer team is ready to stand with you in prayer. Submit your request and we will lift you up.
          </p>
          <PremiumButton href="/prayer-request">Submit Prayer Request</PremiumButton>
        </div>
      </SectionWrapper>
    </>
  )
}