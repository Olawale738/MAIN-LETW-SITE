'use client'

import { useState, useEffect } from 'react'
import Hero from '@/components/shared/Hero'
import SectionWrapper from '@/components/shared/SectionWrapper'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import PremiumButton from '@/components/ui/PremiumButton'
import { Check, Clock, MapPin } from 'lucide-react'

interface ReadingPlan {
  week: number
  oldTestament: string
  newTestament: string
}

const readingPlan: ReadingPlan[] = [
  { week: 1, oldTestament: 'Genesis 1-3', newTestament: 'Matthew 1-2' },
  { week: 2, oldTestament: 'Genesis 4-7', newTestament: 'Matthew 3-4' },
  { week: 3, oldTestament: 'Genesis 8-11', newTestament: 'Matthew 5-7' },
  { week: 4, oldTestament: 'Genesis 12-15', newTestament: 'Matthew 8-10' },
  { week: 5, oldTestament: 'Genesis 16-19', newTestament: 'Matthew 11-13' },
  { week: 6, oldTestament: 'Genesis 20-23', newTestament: 'Matthew 14-16' },
  { week: 7, oldTestament: 'Genesis 24-27', newTestament: 'Matthew 17-19' },
  { week: 8, oldTestament: 'Genesis 28-31', newTestament: 'Matthew 20-22' },
  { week: 9, oldTestament: 'Genesis 32-35', newTestament: 'Matthew 23-25' },
  { week: 10, oldTestament: 'Genesis 36-39', newTestament: 'Matthew 26-28' },
  { week: 11, oldTestament: 'Genesis 40-43', newTestament: 'Mark 1-3' },
  { week: 12, oldTestament: 'Genesis 44-47', newTestament: 'Mark 4-6' },
  { week: 13, oldTestament: 'Genesis 48-50', newTestament: 'Mark 7-9' },
  { week: 14, oldTestament: 'Exodus 1-4', newTestament: 'Mark 10-12' },
  { week: 15, oldTestament: 'Exodus 5-8', newTestament: 'Mark 13-16' },
  { week: 16, oldTestament: 'Exodus 9-12', newTestament: 'Luke 1-3' },
  { week: 17, oldTestament: 'Exodus 13-16', newTestament: 'Luke 4-6' },
  { week: 18, oldTestament: 'Exodus 17-20', newTestament: 'Luke 7-9' },
  { week: 19, oldTestament: 'Exodus 21-24', newTestament: 'Luke 10-12' },
  { week: 20, oldTestament: 'Exodus 25-28', newTestament: 'Luke 13-15' },
  { week: 21, oldTestament: 'Exodus 29-32', newTestament: 'Luke 16-18' },
  { week: 22, oldTestament: 'Exodus 33-36', newTestament: 'Luke 19-21' },
  { week: 23, oldTestament: 'Exodus 37-40', newTestament: 'Luke 22-24' },
  { week: 24, oldTestament: 'Leviticus 1-4', newTestament: 'John 1-3' },
  { week: 25, oldTestament: 'Leviticus 5-8', newTestament: 'John 4-6' },
  { week: 26, oldTestament: 'Leviticus 9-12', newTestament: 'John 7-9' },
  { week: 27, oldTestament: 'Leviticus 13-16', newTestament: 'John 10-12' },
  { week: 28, oldTestament: 'Leviticus 17-20', newTestament: 'John 13-15' },
  { week: 29, oldTestament: 'Leviticus 21-24', newTestament: 'John 16-18' },
  { week: 30, oldTestament: 'Leviticus 25-27', newTestament: 'John 19-21' },
  { week: 31, oldTestament: 'Numbers 1-4', newTestament: 'Acts 1-3' },
  { week: 32, oldTestament: 'Numbers 5-8', newTestament: 'Acts 4-6' },
  { week: 33, oldTestament: 'Numbers 9-12', newTestament: 'Acts 7-9' },
  { week: 34, oldTestament: 'Numbers 13-16', newTestament: 'Acts 10-12' },
  { week: 35, oldTestament: 'Numbers 17-20', newTestament: 'Acts 13-15' },
  { week: 36, oldTestament: 'Numbers 21-24', newTestament: 'Acts 16-18' },
  { week: 37, oldTestament: 'Numbers 25-28', newTestament: 'Acts 19-21' },
  { week: 38, oldTestament: 'Numbers 29-32', newTestament: 'Acts 22-24' },
  { week: 39, oldTestament: 'Numbers 33-36', newTestament: 'Acts 25-28' },
  { week: 40, oldTestament: 'Deuteronomy 1-4', newTestament: 'Romans 1-3' },
  { week: 41, oldTestament: 'Deuteronomy 5-8', newTestament: 'Romans 4-6' },
  { week: 42, oldTestament: 'Deuteronomy 9-12', newTestament: 'Romans 7-9' },
  { week: 43, oldTestament: 'Deuteronomy 13-16', newTestament: 'Romans 10-12' },
  { week: 44, oldTestament: 'Deuteronomy 17-20', newTestament: 'Romans 13-16' },
  { week: 45, oldTestament: 'Deuteronomy 21-24', newTestament: '1 Corinthians 1-4' },
  { week: 46, oldTestament: 'Deuteronomy 25-28', newTestament: '1 Corinthians 5-8' },
  { week: 47, oldTestament: 'Deuteronomy 29-32', newTestament: '1 Corinthians 9-12' },
  { week: 48, oldTestament: 'Deuteronomy 33-34, Joshua 1-2', newTestament: '1 Corinthians 13-16' },
  { week: 49, oldTestament: 'Joshua 3-6', newTestament: '2 Corinthians 1-4' },
  { week: 50, oldTestament: 'Joshua 7-10', newTestament: '2 Corinthians 5-8' },
  { week: 51, oldTestament: 'Joshua 11-14', newTestament: '2 Corinthians 9-13' },
  { week: 52, oldTestament: 'Joshua 15-18', newTestament: 'Galatians 1-3' },
  { week: 53, oldTestament: 'Joshua 19-22', newTestament: 'Galatians 4-6' },
  { week: 54, oldTestament: 'Joshua 23-24, Judges 1-2', newTestament: 'Ephesians 1-6' },
]

export default function BibleReadingPage() {
  const [completed, setCompleted] = useState<{ [key: number]: boolean }>({})
  const [registered, setRegistered] = useState(false)

  useEffect(() => {
    const storedCompleted = localStorage.getItem('bibleReadingCompleted')
    const storedRegistered = localStorage.getItem('bibleReadingRegistered')
    if (storedCompleted) {
      setCompleted(JSON.parse(storedCompleted))
    }
    if (storedRegistered) {
      setRegistered(true)
    }
  }, [])

  const toggleComplete = (week: number) => {
    const newCompleted = {
      ...completed,
      [week]: !completed[week]
    }
    setCompleted(newCompleted)
    localStorage.setItem('bibleReadingCompleted', JSON.stringify(newCompleted))
  }

  const handleRegister = () => {
    setRegistered(true)
    localStorage.setItem('bibleReadingRegistered', 'true')
  }

  const completedCount = Object.values(completed).filter(Boolean).length
  const progressPercentage = Math.round((completedCount / readingPlan.length) * 100)

  return (
    <>
      <Hero
        title="Weekly Bible Reading Plan"
        subtitle="Building a Strong Foundation in God's Word"
        height="medium"
      />

      <SectionWrapper>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-lg text-gray-700 leading-relaxed mb-4">
              The LIGHT is a Bible Reading Plan for children aged 6-12 years. It is designed to help children develop a strong foundation in the Bible and to encourage them to read the Bible in a regular and systematic manner.
            </p>

            {registered ? (
              <div className="bg-[#140152] text-white p-6 rounded-lg mb-8">
                <h3 className="text-2xl font-bold mb-2">Your Progress</h3>
                <div className="w-full bg-white/20 rounded-full h-4 mb-3">
                  <div
                    className="bg-white h-4 rounded-full transition-all duration-500"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
                <p className="text-lg">
                  {completedCount} of {readingPlan.length} weeks completed ({progressPercentage}%)
                </p>
              </div>
            ) : (
              <Card className="max-w-md mx-auto mb-8">
                <CardHeader>
                  <CardTitle className="text-[#140152]">Get Started</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 mb-4">
                    Register to track your progress through the reading plan.
                  </p>
                  <PremiumButton onClick={handleRegister} className="w-full">
                    Register Now
                  </PremiumButton>
                </CardContent>
              </Card>
            )}
          </div>

          <h2 className="text-3xl font-bold text-[#140152] mb-8">Weekly Reading Plan</h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse bg-white shadow-md rounded-lg overflow-hidden">
              <thead className="bg-[#140152] text-white">
                <tr>
                  <th className="p-4 text-left">Week</th>
                  <th className="p-4 text-left">Old Testament</th>
                  <th className="p-4 text-left">New Testament</th>
                  {registered && <th className="p-4 text-center">Completed</th>}
                </tr>
              </thead>
              <tbody>
                {readingPlan.map((item, index) => (
                  <tr
                    key={item.week}
                    className={`border-b hover:bg-gray-50 transition-colors ${completed[item.week] ? 'bg-green-50' : ''
                      }`}
                  >
                    <td className="p-4 font-semibold text-[#140152]">Week {item.week}</td>
                    <td className="p-4 text-gray-700">{item.oldTestament}</td>
                    <td className="p-4 text-gray-700">{item.newTestament}</td>
                    {registered && (
                      <td className="p-4 text-center">
                        <button
                          onClick={() => toggleComplete(item.week)}
                          className={`w-8 h-8 rounded-md flex items-center justify-center transition-colors ${completed[item.week]
                            ? 'bg-green-500 text-white'
                            : 'border-2 border-gray-300 hover:border-[#140152]'
                            }`}
                        >
                          {completed[item.week] && <Check className="w-5 h-5" />}
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </SectionWrapper>

      <SectionWrapper>
        <div className="max-w-5xl mx-auto space-y-16">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="bg-orange-50 p-8 rounded-[2rem]">
              <h2 className="text-3xl font-black text-[#140152] mb-4">👶 Sunday School Curriculum</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Our dynamic Sunday School curriculum is designed to engage children with the truth of God's Word in a fun and age-appropriate way.
              </p>
              <ul className="space-y-2 mb-6 text-gray-700">
                <li className="flex items-center gap-2"><div className="w-2 h-2 bg-orange-400 rounded-full" /> Interactive Bible Stories</li>
                <li className="flex items-center gap-2"><div className="w-2 h-2 bg-orange-400 rounded-full" /> Memory Verses & Songs</li>
                <li className="flex items-center gap-2"><div className="w-2 h-2 bg-orange-400 rounded-full" /> Character Building Activities</li>
              </ul>
              <Button className="bg-orange-500 hover:bg-orange-600 text-white rounded-full">Explore Kids Ministry</Button>
            </div>
            <div className="bg-blue-50 p-8 rounded-[2rem]">
              <h2 className="text-3xl font-black text-[#140152] mb-4">📚 After-School Tutoring</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                We provide free academic support for students in our community, ensuring they excel in their studies while growing in faith.
              </p>
              <ul className="space-y-2 mb-6 text-gray-700">
                <li className="flex items-center gap-2"><div className="w-2 h-2 bg-blue-400 rounded-full" /> Homework Assistance</li>
                <li className="flex items-center gap-2"><div className="w-2 h-2 bg-blue-400 rounded-full" /> Subject-Specific Tutoring</li>
                <li className="flex items-center gap-2"><div className="w-2 h-2 bg-blue-400 rounded-full" /> Mentorship & Study Skills</li>
              </ul>
              <Button className="bg-[#140152] hover:bg-blue-900 text-white rounded-full">Sign Up for Tutoring</Button>
            </div>
          </div>
        </div>
      </SectionWrapper>

      <SectionWrapper background="gray">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-[#140152] mb-6">Tips for Success</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6">
                <h3 className="font-bold text-[#140152] mb-2">Set a Time</h3>
                <p className="text-gray-700 text-sm">Choose a consistent time each day for reading</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <h3 className="font-bold text-[#140152] mb-2">Find a Place</h3>
                <p className="text-gray-700 text-sm">Create a quiet space for focused reading</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <h3 className="font-bold text-[#140152] mb-2">Stay Consistent</h3>
                <p className="text-gray-700 text-sm">Make Bible reading a daily habit</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </SectionWrapper>
    </>
  )
}