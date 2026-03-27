'use client'

import Hero from '@/components/shared/Hero'
import SectionWrapper from '@/components/shared/SectionWrapper'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { BookOpen, Users, Heart, Star, ArrowRight, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { authApi } from '@/lib/api'

export default function JoinPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    membershipType: 'new'
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      await authApi.register({
        name: formData.name,
        email: formData.email
      })

      // Redirect to verify email page
      const params = new URLSearchParams()
      params.set('email', formData.email)
      params.set('name', formData.name)
      router.push(`/auth/verify-email?${params.toString()}`)
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Registration failed. Please try again.'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  return (
    <>
      {/* Hero */}
      <div className="w-full">
        <img
          src="/Join.png"
          alt="Join Our Family"
          className="w-full h-auto block"
        />
      </div>

      <SectionWrapper>
        <div className="text-center mb-16 space-y-4">
          <span className="text-[#f5bb00] font-bold uppercase tracking-[0.2em] text-sm">Belong</span>
          <h2 className="text-4xl md:text-5xl font-black text-[#140152]">Why Become a Member?</h2>
          <div className="w-24 h-1.5 bg-[#f5bb00] mx-auto rounded-full" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20 max-w-6xl mx-auto">
          <Card className="group border-none shadow-xl shadow-gray-100 hover:-translate-y-2 transition-transform duration-300">
            <CardContent className="p-8 text-center space-y-6">
              <div className="w-16 h-16 bg-[#140152]/5 rounded-2xl flex items-center justify-center mx-auto text-[#140152] group-hover:bg-[#f5bb00] transition-colors">
                <Users className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-black text-[#140152]">Community</h3>
              <p className="text-gray-600 leading-relaxed font-medium">
                Find a place where you belong, connect with like-minded believers, and build lasting relationships.
              </p>
            </CardContent>
          </Card>

          <Card className="group border-none shadow-xl shadow-gray-100 hover:-translate-y-2 transition-transform duration-300">
            <CardContent className="p-8 text-center space-y-6">
              <div className="w-16 h-16 bg-[#140152]/5 rounded-2xl flex items-center justify-center mx-auto text-[#140152] group-hover:bg-[#f5bb00] transition-colors">
                <BookOpen className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-black text-[#140152]">Spiritual Growth</h3>
              <p className="text-gray-600 leading-relaxed font-medium">
                Access exclusive resources, discipleship classes, and mentorship to help you grow in your walk with God.
              </p>
            </CardContent>
          </Card>

          <Card className="group border-none shadow-xl shadow-gray-100 hover:-translate-y-2 transition-transform duration-300">
            <CardContent className="p-8 text-center space-y-6">
              <div className="w-16 h-16 bg-[#140152]/5 rounded-2xl flex items-center justify-center mx-auto text-[#140152] group-hover:bg-[#f5bb00] transition-colors">
                <Heart className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-black text-[#140152]">Pastoral Care</h3>
              <p className="text-gray-600 leading-relaxed font-medium">
                Receive dedicated spiritual support, counseling, and prayer from our pastoral team during life's seasons.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center max-w-6xl mx-auto">
          <div className="space-y-8">
            <div className="space-y-4">
              <span className="text-[#f5bb00] font-bold uppercase tracking-[0.2em] text-sm">Next Steps</span>
              <h2 className="text-3xl md:text-4xl font-black text-[#140152]">One Family, Many Parts</h2>
            </div>
            <p className="text-lg text-gray-600 leading-relaxed">
              Joining a local church is a significant step in your spiritual journey. It's about committing to a community of believers where you can serve, grow, and be held accountable. We are excited to welcome you!
            </p>
            <div className="bg-[#140152] p-8 rounded-3xl text-white space-y-4">
              <div className="flex items-start gap-4">
                <Star className="w-6 h-6 text-[#f5bb00] flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-bold text-lg mb-1">New Believers Class</h4>
                  <p className="text-white/70 text-sm">A 4-week foundation course for new christians or new members.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <Users className="w-6 h-6 text-[#f5bb00] flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-bold text-lg mb-1">Worker's Training</h4>
                  <p className="text-white/70 text-sm">Equipping you to serve in various departments.</p>
                </div>
              </div>
            </div>
          </div>

          <Card className="border-none shadow-2xl p-8 md:p-10 rounded-[2.5rem]">
            <CardHeader className="text-center p-0 mb-8">
              <CardTitle className="text-2xl font-black text-[#140152]">Membership Application</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-xs font-bold text-[#140152] uppercase tracking-widest pl-2">Full Name</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="h-12 rounded-xl border-gray-200"
                    placeholder="Enter your full name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-xs font-bold text-[#140152] uppercase tracking-widest pl-2">Email Address</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="h-12 rounded-xl border-gray-200"
                    placeholder="Enter your email"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-xs font-bold text-[#140152] uppercase tracking-widest pl-2">Phone Number</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    className="h-12 rounded-xl border-gray-200"
                    placeholder="Enter your phone number"
                  />
                </div>

                <div className="space-y-3">
                  <Label className="text-xs font-bold text-[#140152] uppercase tracking-widest pl-2">Status</Label>
                  <RadioGroup defaultValue="new" className="flex flex-col space-y-1">
                    <div className="flex items-center space-x-2 bg-gray-50 p-3 rounded-xl">
                      <RadioGroupItem value="new" id="new" name="membershipType" className="text-[#140152]" />
                      <Label htmlFor="new" className="font-medium text-gray-700">New Believer</Label>
                    </div>
                    <div className="flex items-center space-x-2 bg-gray-50 p-3 rounded-xl">
                      <RadioGroupItem value="transfer" id="transfer" name="membershipType" className="text-[#140152]" />
                      <Label htmlFor="transfer" className="font-medium text-gray-700">Joining from another church</Label>
                    </div>
                  </RadioGroup>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={loading}
                  variant="primary"
                  className="w-full h-14 rounded-full py-0.5 px-1 pl-5 shadow-[0_0_20px_rgba(245,187,0,0.5)] hover:shadow-[0_0_30px_rgba(245,187,0,0.6)] transition-shadow duration-300"
                >
                  <div className="flex items-center justify-between w-full px-4">
                    <p>{loading ? 'Joining...' : 'Join Now'}</p>
                    <div className="p-2 bg-white fill-current rounded-full transition-transform group-hover:translate-x-1 text-black">
                      {loading ? (
                        <Loader2 className="w-4 h-4 text-[#140152] animate-spin" />
                      ) : (
                        <ArrowRight className="w-4 h-4 text-[#140152] -rotate-45" />
                      )}
                    </div>
                  </div>
                </Button>
                <div className="mt-4 text-center relative z-10">
                  <p className="text-gray-500 text-sm">
                    Already a member? <Link href="/auth/login" className="text-[#140152] hover:underline font-semibold">Click here to login</Link>
                  </p>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </SectionWrapper>
    </>
  )
}