import Hero from '@/components/shared/Hero'
import SectionWrapper from '@/components/shared/SectionWrapper'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import PremiumButton from '@/components/ui/PremiumButton'
import { FileAudio, BookOpen, FileText, Music, Video, Newspaper, Download } from 'lucide-react'

export default function DownloadsPage() {
  return (
    <>
      <Hero
        title="Downloads"
        subtitle="Access Our Resources"
        height="medium"
      />

      <SectionWrapper>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Sermons */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-[#140152] rounded-lg flex items-center justify-center mb-4">
                <FileAudio className="w-6 h-6 text-white" />
              </div>
              <CardTitle className="text-[#140152]">Sermons</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 mb-6">
                Download audio recordings of our past sermons and messages.
              </p>
              <Button variant="primary" className="w-full h-12 rounded-full shadow-[0_0_20px_rgba(245,187,0,0.5)] hover:shadow-[0_0_30px_rgba(245,187,0,0.6)] transition-shadow duration-300 flex items-center justify-center">
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            </CardContent>
          </Card>

          {/* E-books */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-[#140152] rounded-lg flex items-center justify-center mb-4">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <CardTitle className="text-[#140152]">E-books</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 mb-6">
                Free Christian e-books and study materials for spiritual growth.
              </p>
              <Button variant="primary" className="w-full h-12 rounded-full shadow-[0_0_20px_rgba(245,187,0,0.5)] hover:shadow-[0_0_30px_rgba(245,187,0,0.6)] transition-shadow duration-300 flex items-center justify-center">
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            </CardContent>
          </Card>

          {/* Bulletins */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-[#140152] rounded-lg flex items-center justify-center mb-4">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <CardTitle className="text-[#140152]">Bulletins</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 mb-6">
                Weekly church bulletins with announcements and schedules.
              </p>
              <Button variant="primary" className="w-full h-12 rounded-full shadow-[0_0_20px_rgba(245,187,0,0.5)] hover:shadow-[0_0_30px_rgba(245,187,0,0.6)] transition-shadow duration-300 flex items-center justify-center">
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            </CardContent>
          </Card>

          {/* Music */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-[#140152] rounded-lg flex items-center justify-center mb-4">
                <Music className="w-6 h-6 text-white" />
              </div>
              <CardTitle className="text-[#140152]">Music</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 mb-6">
                Worship songs and music from our praise team.
              </p>
              <Button variant="primary" className="w-full h-12 rounded-full shadow-[0_0_20px_rgba(245,187,0,0.5)] hover:shadow-[0_0_30px_rgba(245,187,0,0.6)] transition-shadow duration-300 flex items-center justify-center">
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            </CardContent>
          </Card>

          {/* Videos */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-[#140152] rounded-lg flex items-center justify-center mb-4">
                <Video className="w-6 h-6 text-white" />
              </div>
              <CardTitle className="text-[#140152]">Videos</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 mb-6">
                Video recordings of services, events, and teachings.
              </p>
              <Button variant="primary" className="w-full h-12 rounded-full shadow-[0_0_20px_rgba(245,187,0,0.5)] hover:shadow-[0_0_30px_rgba(245,187,0,0.6)] transition-shadow duration-300 flex items-center justify-center">
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            </CardContent>
          </Card>

          {/* Articles */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-[#140152] rounded-lg flex items-center justify-center mb-4">
                <Newspaper className="w-6 h-6 text-white" />
              </div>
              <CardTitle className="text-[#140152]">Articles</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 mb-6">
                Inspirational articles and devotional readings.
              </p>
              <Button variant="primary" className="w-full h-12 rounded-full shadow-[0_0_20px_rgba(245,187,0,0.5)] hover:shadow-[0_0_30px_rgba(245,187,0,0.6)] transition-shadow duration-300 flex items-center justify-center">
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            </CardContent>
          </Card>
        </div>
      </SectionWrapper>

      <SectionWrapper background="gray">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-[#140152] mb-6">Need Help?</h2>
          <p className="text-lg text-gray-700 mb-8">
            If you're having trouble downloading any resources or need specific materials, please don't hesitate to contact us.
          </p>
          <div className="flex justify-center">
            <PremiumButton href="/contact">Contact Us</PremiumButton>
          </div>
        </div>
      </SectionWrapper>
    </>
  )
}