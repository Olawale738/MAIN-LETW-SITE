'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import PremiumButton from '@/components/ui/PremiumButton'
import {
  HandHeart,
  Calendar,
  BarChart3,
  Settings,
  MessageSquare,
  Plus,
  Loader2
} from 'lucide-react'
import { prayerApi, PrayerCategory, PrayerSchedule, PrayerStat, PrayerRequest } from '@/lib/api'

export default function AdminPrayerPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [categories, setCategories] = useState<PrayerCategory[]>([])
  const [schedules, setSchedules] = useState<PrayerSchedule[]>([])
  const [stats, setStats] = useState<PrayerStat[]>([])
  const [requests, setRequests] = useState<PrayerRequest[]>([])

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [categoriesData, schedulesData, statsData, requestsData] = await Promise.all([
        prayerApi.admin.getCategories(),
        prayerApi.admin.getSchedules(),
        prayerApi.admin.getStats(),
        prayerApi.admin.getAllRequests()
      ])
      setCategories(categoriesData)
      setSchedules(schedulesData)
      setStats(statsData)
      setRequests(requestsData)
    } catch (error) {
      console.error('Failed to fetch prayer data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-[#140152]" />
      </div>
    )
  }

  const pendingRequests = requests.filter(r => r.status === 'pending').length
  const activeCategories = categories.filter(c => c.is_active).length
  const activeSchedules = schedules.filter(s => s.is_active).length

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-[#140152]">Prayer Management</h1>
          <p className="text-gray-600 mt-1">Manage prayer page content and user requests</p>
        </div>
        <PremiumButton
          onClick={() => router.push('/admin/prayer/settings')}
          className="bg-[#140152] text-white hover:bg-[#1d0175]"
        >
          <Settings className="w-4 h-4 mr-2" />
          Page Settings
        </PremiumButton>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-[#140152]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Prayer Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-[#140152]">{activeCategories}</div>
            <p className="text-xs text-gray-500 mt-1">Active categories</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-[#f5bb00]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Prayer Schedules</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-[#f5bb00]">{activeSchedules}</div>
            <p className="text-xs text-gray-500 mt-1">Active schedules</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Impact Stats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-blue-500">{stats.length}</div>
            <p className="text-xs text-gray-500 mt-1">Total stats</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Prayer Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-red-500">{pendingRequests}</div>
            <p className="text-xs text-gray-500 mt-1">Pending requests</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card
          className="cursor-pointer hover:shadow-lg transition-shadow border-2 border-transparent hover:border-[#140152]"
          onClick={() => router.push('/admin/prayer/categories')}
        >
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-[#140152] to-[#1d0175] rounded-2xl flex items-center justify-center mx-auto mb-4">
              <HandHeart className="w-8 h-8 text-[#f5bb00]" />
            </div>
            <h3 className="font-bold text-[#140152] mb-2">Prayer Categories</h3>
            <p className="text-sm text-gray-600">Manage prayer experiences</p>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-lg transition-shadow border-2 border-transparent hover:border-[#f5bb00]"
          onClick={() => router.push('/admin/prayer/schedules')}
        >
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-[#f5bb00] to-[#d4a000] rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-[#140152]" />
            </div>
            <h3 className="font-bold text-[#140152] mb-2">Prayer Schedules</h3>
            <p className="text-sm text-gray-600">Manage prayer programs</p>
          </CardContent>
        </Card>




        <Card
          className="cursor-pointer hover:shadow-lg transition-shadow border-2 border-transparent hover:border-blue-500"
          onClick={() => router.push('/admin/prayer/stats')}
        >
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <BarChart3 className="w-8 h-8 text-white" />
            </div>
            <h3 className="font-bold text-[#140152] mb-2">Impact Stats</h3>
            <p className="text-sm text-gray-600">Manage impact statistics</p>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-lg transition-shadow border-2 border-transparent hover:border-red-500"
          onClick={() => router.push('/admin/prayer/requests')}
        >
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="w-8 h-8 text-white" />
            </div>
            <h3 className="font-bold text-[#140152] mb-2">Prayer Requests</h3>
            <p className="text-sm text-gray-600">Manage user requests</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Prayer Requests */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Prayer Requests</CardTitle>
            <PremiumButton
              onClick={() => router.push('/admin/prayer/requests')}
              className="bg-[#140152] text-white hover:bg-[#1d0175]"
            >
              View All
            </PremiumButton>
          </div>
        </CardHeader>
        <CardContent>
          {requests.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No prayer requests yet</p>
          ) : (
            <div className="space-y-4">
              {requests.slice(0, 5).map((request) => (
                <div
                  key={request.id}
                  className="flex items-start justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-1">
                    <h4 className="font-semibold text-[#140152]">{request.title}</h4>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">{request.description}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <span className={`px-2 py-1 rounded-full ${
                        request.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        request.status === 'praying' ? 'bg-blue-100 text-blue-700' :
                        request.status === 'answered' ? 'bg-green-100 text-green-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {request.status}
                      </span>
                      <span>{request.prayer_count} prayers</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
