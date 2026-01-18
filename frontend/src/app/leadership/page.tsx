'use client'
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Crown, Book, Users } from 'lucide-react'

export default function LeadershipPage() {
  const router = useRouter()
  const [user, setUser] = useState<string | null>(null)

  useEffect(() => {
    // Simulate Auth Check
    const isLoggedIn = localStorage.getItem('isLoggedIn')
    const userName = localStorage.getItem('userName')

    if (!isLoggedIn) {
      router.push('/auth/register?redirect=/leadership')
    } else {
      setUser(userName || 'User')
    }
  }, [router])

  if (!user) return null

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar Placeholder */}
      <div className="w-64 bg-[#2b1049] text-white hidden md:block p-6">
        <h1 className="text-xl font-bold mb-8">Leadership<span className="text-purple-400">Track</span></h1>
        <nav className="space-y-4">
          <a className="block py-2 px-4 bg-white/10 rounded-lg">Overview</a>
          <a className="block py-2 px-4 hover:bg-white/5 rounded-lg opacity-70">Modules</a>
          <a className="block py-2 px-4 hover:bg-white/5 rounded-lg opacity-70">Mentors</a>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8 overflow-y-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-800">Servant Leadership, {user}</h2>
            <p className="text-gray-500">Equipping you to serve with integrity and purpose.</p>
          </div>
        </div>

        {/* Status */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white p-6 rounded-2xl shadow-sm border-t-4 border-purple-500">
            <Crown className="w-8 h-8 text-purple-500 mb-3" />
            <div className="text-gray-500 text-sm">Current Level</div>
            <div className="text-xl font-bold">Emerging Leader</div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border-t-4 border-blue-500">
            <Book className="w-8 h-8 text-blue-500 mb-3" />
            <div className="text-gray-500 text-sm">Modules Completed</div>
            <div className="text-xl font-bold">2 / 8</div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border-t-4 border-orange-500">
            <Users className="w-8 h-8 text-orange-500 mb-3" />
            <div className="text-gray-500 text-sm">Next Mentorship</div>
            <div className="text-xl font-bold">Pending Schedule</div>
          </div>
        </div>

        {/* Modules List */}
        <h3 className="text-xl font-bold text-gray-800 mb-6">Core Modules</h3>
        <div className="space-y-4">
          {[
            { title: "The Heart of a Servant", status: "Completed", color: "text-green-600" },
            { title: "Biblical Stewardship", status: "In Progress", color: "text-blue-600" },
            { title: "Conflict Resolution", status: "Locked", color: "text-gray-400" },
            { title: "Vision Casting", status: "Locked", color: "text-gray-400" },
          ].map((mod, i) => (
            <div key={i} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
              <span className="font-bold text-lg text-gray-800">{mod.title}</span>
              <span className={`text-sm font-medium ${mod.color}`}>{mod.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}