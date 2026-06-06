'use client'

import React from 'react'
import { TrendingUp, Users, Target, Award, Calendar, BarChart3 } from 'lucide-react'
import { ActivityLogger, getActivityTypeInfo } from '@/lib/activity-logger'
import { ErrorHandler } from '@/lib/error-handler'
import { Spinner } from './loading-states'

interface MetricsData {
  total_activities: number
  total_hours: number
  gospel_shares: number
  conversions: number
  follow_ups: number
  avg_impact_score: number
  engagement_level: string
  period: string
}

interface TopPerformer {
  user_id: string
  activity_count: number
  total_hours: number
  avg_impact_score: number
}

/**
 * Metrics dashboard component
 */
export function MetricsDashboard({
  userId,
  department,
  period = 'month',
}: {
  userId?: string
  department: string
  period?: 'week' | 'month' | 'year'
}) {
  const [metrics, setMetrics] = React.useState<MetricsData | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!userId) return

    const fetchMetrics = async () => {
      try {
        setLoading(true)
        const data = await ActivityLogger.getMetrics(userId, department, period)
        setMetrics(data)
        setError(null)
      } catch (err) {
        setError(ErrorHandler.handle(err))
      } finally {
        setLoading(false)
      }
    }

    fetchMetrics()
  }, [userId, department, period])

  if (loading) {
    return <Spinner />
  }

  if (!metrics) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>No metrics available yet</p>
      </div>
    )
  }

  const getEngagementColor = (level: string) => {
    switch (level) {
      case 'excellent':
        return 'text-green-600 bg-green-50'
      case 'high':
        return 'text-blue-600 bg-blue-50'
      case 'medium':
        return 'text-amber-600 bg-amber-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  return (
    <div className="space-y-6">
      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Main metrics grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard
          label="Total Activities"
          value={metrics.total_activities}
          icon={BarChart3}
          color="purple"
        />
        <MetricCard
          label="Volunteer Hours"
          value={Math.round(metrics.total_hours * 10) / 10}
          icon={Calendar}
          color="blue"
        />
        <MetricCard
          label="Impact Score"
          value={Math.round(metrics.avg_impact_score * 10) / 10}
          icon={TrendingUp}
          color="green"
        />
        <div className={`rounded-xl border border-gray-200 p-4 ${getEngagementColor(metrics.engagement_level)}`}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold">Engagement Level</p>
            <Award className="w-5 h-5" />
          </div>
          <p className="text-2xl font-bold capitalize">{metrics.engagement_level}</p>
        </div>
      </div>

      {/* Activity breakdown */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Activity Breakdown</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <ActivityBreakdownItem label="Gospel Shares" value={metrics.gospel_shares} />
          <ActivityBreakdownItem label="Follow-ups" value={metrics.follow_ups} />
          <ActivityBreakdownItem label="Conversions" value={metrics.conversions} />
        </div>
      </div>

      {/* Period info */}
      <div className="text-center text-sm text-gray-500">
        <p>This {period.replace('_', ' ')}</p>
      </div>
    </div>
  )
}

/**
 * Metric card component
 */
function MetricCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string
  value: number | string
  icon: React.ComponentType<{ className?: string }>
  color: 'purple' | 'blue' | 'green' | 'orange'
}) {
  const colorClasses = {
    purple: 'text-purple-600 bg-purple-50',
    blue: 'text-blue-600 bg-blue-50',
    green: 'text-green-600 bg-green-50',
    orange: 'text-orange-600 bg-orange-50',
  }

  const iconColor = {
    purple: 'text-purple-600',
    blue: 'text-blue-600',
    green: 'text-green-600',
    orange: 'text-orange-600',
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-semibold text-gray-600">{label}</p>
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          <Icon className={`w-5 h-5 ${iconColor[color]}`} />
        </div>
      </div>
      <p className={`text-3xl font-bold ${iconColor[color]}`}>{value}</p>
    </div>
  )
}

/**
 * Activity breakdown item
 */
function ActivityBreakdownItem({ label, value }: { label: string; value: number }) {
  return (
    <div className="text-center p-3 bg-gray-50 rounded-lg">
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-600 mt-1">{label}</p>
    </div>
  )
}

/**
 * Top performers leaderboard
 */
export function TopPerformersLeaderboard({
  department,
  limit = 10,
}: {
  department: string
  limit?: number
}) {
  const [performers, setPerformers] = React.useState<TopPerformer[]>([])
  const [loading, setLoading] = React.useState(false)

  React.useEffect(() => {
    const fetchPerformers = async () => {
      try {
        setLoading(true)
        const data = await ActivityLogger.getTopPerformers(department, limit)
        setPerformers(data)
      } catch (err) {
        ErrorHandler.handle(err)
      } finally {
        setLoading(false)
      }
    }

    fetchPerformers()
  }, [department, limit])

  if (loading) {
    return <Spinner />
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4">🏆 Top Performers</h3>

      {performers.length > 0 ? (
        <div className="space-y-3">
          {performers.map((performer, index) => (
            <div
              key={performer.user_id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#140152] text-white font-bold text-sm">
                  {index + 1}
                </div>
                <div>
                  <p className="font-bold text-gray-900">User {performer.user_id.substring(0, 6)}...</p>
                  <p className="text-sm text-gray-600">
                    {performer.activity_count} activities • {Math.round(performer.total_hours * 10) / 10}h
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-yellow-600">
                  ⭐ {Math.round(performer.avg_impact_score * 10) / 10}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center text-gray-500 py-8">No activity data yet</p>
      )}
    </div>
  )
}

/**
 * Engagement report card
 */
export function EngagementReportCard({
  memberId,
  period = '30 days',
}: {
  memberId: string
  period?: string
}) {
  const [report, setReport] = React.useState<any | null>(null)
  const [loading, setLoading] = React.useState(false)

  React.useEffect(() => {
    const fetchReport = async () => {
      try {
        setLoading(true)
        const data = await ActivityLogger.getReports(memberId, 1)
        if (data && data.length > 0) {
          setReport(data[0])
        }
      } catch (err) {
        ErrorHandler.handle(err)
      } finally {
        setLoading(false)
      }
    }

    fetchReport()
  }, [memberId])

  if (loading) {
    return <Spinner />
  }

  if (!report) {
    return (
      <div className="bg-gray-50 rounded-xl border border-gray-200 p-6 text-center text-gray-500">
        <p>No engagement report available</p>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl border border-blue-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900">Engagement Report</h3>
        <span className="text-sm text-gray-600">{period}</span>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-gray-700">Activities</p>
          <p className="text-2xl font-bold text-blue-600">{report.activity_count}</p>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-gray-700">Hours</p>
          <p className="text-2xl font-bold text-purple-600">
            {Math.round(report.total_hours * 10) / 10}
          </p>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-gray-700">Engagement Score</p>
          <p className="text-2xl font-bold text-green-600">{report.engagement_score}/100</p>
        </div>

        <div className="pt-4 border-t border-blue-200">
          <p className="text-sm text-gray-600">
            <strong>Attendance Rate:</strong> {Math.round(report.attendance_rate * 100)}%
          </p>
        </div>

        {report.strengths && (
          <div className="pt-4 border-t border-blue-200">
            <p className="text-sm font-bold text-gray-700 mb-2">Strengths</p>
            <p className="text-sm text-gray-600">{report.strengths}</p>
          </div>
        )}

        {report.areas_for_growth && (
          <div className="pt-4 border-t border-blue-200">
            <p className="text-sm font-bold text-gray-700 mb-2">Areas for Growth</p>
            <p className="text-sm text-gray-600">{report.areas_for_growth}</p>
          </div>
        )}
      </div>
    </div>
  )
}
