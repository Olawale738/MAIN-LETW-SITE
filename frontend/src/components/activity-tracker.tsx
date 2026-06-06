'use client'

import React from 'react'
import { Plus, Calendar, Clock, TrendingUp, Users } from 'lucide-react'
import { ErrorHandler } from '@/lib/error-handler'
import { Spinner, LoadingButton } from './loading-states'

interface Activity {
  id: string
  activity_type: string
  title: string
  description?: string
  duration_minutes: number
  date: string
  status: string
  impact_score: number
}

interface ActivityTrackerProps {
  userId?: string
  department: string
  onActivityAdded?: (activity: Activity) => void
  showForm?: boolean
}

/**
 * Activity tracking component
 * Allows logging activities and viewing history
 */
export function ActivityTracker({
  userId,
  department,
  onActivityAdded,
  showForm = false,
}: ActivityTrackerProps) {
  const [activities, setActivities] = React.useState<Activity[]>([])
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [showAddForm, setShowAddForm] = React.useState(showForm)
  const [formData, setFormData] = React.useState({
    activity_type: 'gospel_share',
    title: '',
    description: '',
    duration_minutes: 30,
    impact_score: 3,
  })
  const [submitting, setSubmitting] = React.useState(false)

  React.useEffect(() => {
    fetchActivities()
  }, [userId, department])

  const fetchActivities = async () => {
    if (!userId) return

    try {
      setLoading(true)
      const response = await fetch(
        `/api/activities/user/${userId}?department=${department}&limit=20`
      )

      if (!response.ok) throw new Error('Failed to fetch activities')

      const data = await response.json()
      setActivities(data)
      setError(null)
    } catch (err) {
      const message = ErrorHandler.handle(err)
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.title.trim()) {
      ErrorHandler.handleValidation({ title: 'Activity title is required' })
      return
    }

    try {
      setSubmitting(true)

      const response = await fetch('/api/activities/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          department,
          date: new Date().toISOString(),
        }),
      })

      if (!response.ok) throw new Error('Failed to log activity')

      const newActivity = await response.json()

      setActivities([newActivity, ...activities])
      setShowAddForm(false)
      setFormData({
        activity_type: 'gospel_share',
        title: '',
        description: '',
        duration_minutes: 30,
        impact_score: 3,
      })

      onActivityAdded?.(newActivity)
    } catch (err) {
      ErrorHandler.handle(err)
    } finally {
      setSubmitting(false)
    }
  }

  const activityTypeLabels: Record<string, string> = {
    gospel_share: '📖 Gospel Share',
    tract_distribute: '📰 Tract Distribution',
    prayer_session: '🙏 Prayer Session',
    contact_made: '📞 Contact Made',
    follow_up_done: '✅ Follow-up Done',
    commitment: '🤝 Commitment',
    bible_study: '📚 Bible Study',
    mentoring_session: '👥 Mentoring Session',
    volunteer_hours: '⏰ Volunteer Hours',
    event_participation: '🎉 Event Participation',
  }

  return (
    <div className="space-y-6">
      {/* Add Activity Form */}
      {showAddForm && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Log Activity</h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Activity Type
              </label>
              <select
                value={formData.activity_type}
                onChange={e =>
                  setFormData({ ...formData, activity_type: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#140152]/20"
              >
                {Object.entries(activityTypeLabels).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Title
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={e =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="Brief description of the activity"
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#140152]/20"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={e =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Additional details..."
                rows={3}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#140152]/20"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Duration (minutes)
                </label>
                <input
                  type="number"
                  value={formData.duration_minutes}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      duration_minutes: parseInt(e.target.value),
                    })
                  }
                  min="0"
                  step="15"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#140152]/20"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Impact (1-5)
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(score => (
                    <button
                      key={score}
                      type="button"
                      onClick={() =>
                        setFormData({ ...formData, impact_score: score })
                      }
                      className={`flex-1 py-2 rounded-lg text-center font-bold transition-colors ${
                        formData.impact_score === score
                          ? 'bg-[#140152] text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {score}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <LoadingButton
                type="submit"
                loading={submitting}
                className="flex-1 bg-[#140152] hover:bg-[#1a0666] text-white font-bold py-2 rounded-xl transition-colors"
              >
                Log Activity
              </LoadingButton>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-6 py-2 border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Add Activity Button */}
      {!showAddForm && (
        <button
          onClick={() => setShowAddForm(true)}
          className="w-full bg-gradient-to-r from-[#140152] to-purple-700 hover:from-[#1a0666] hover:to-purple-800 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all"
        >
          <Plus className="w-5 h-5" />
          Log New Activity
        </button>
      )}

      {/* Activities List */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12 text-gray-600">
          <Spinner />
        </div>
      ) : activities.length > 0 ? (
        <div className="space-y-3">
          {activities.map(activity => (
            <ActivityCard key={activity.id} activity={activity} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500">
          <p>No activities logged yet</p>
          <p className="text-sm mt-1">Start logging your activities to track progress</p>
        </div>
      )}
    </div>
  )
}

/**
 * Activity card component
 */
function ActivityCard({ activity }: { activity: Activity }) {
  const activityTypeLabels: Record<string, string> = {
    gospel_share: '📖 Gospel Share',
    tract_distribute: '📰 Tract Distribution',
    prayer_session: '🙏 Prayer Session',
    contact_made: '📞 Contact Made',
    follow_up_done: '✅ Follow-up Done',
    commitment: '🤝 Commitment',
    bible_study: '📚 Bible Study',
    mentoring_session: '👥 Mentoring Session',
    volunteer_hours: '⏰ Volunteer Hours',
    event_participation: '🎉 Event Participation',
  }

  const getImpactColor = (score: number) => {
    if (score >= 4) return 'text-green-600'
    if (score >= 3) return 'text-blue-600'
    return 'text-gray-600'
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="text-lg font-bold text-gray-900">
            {activityTypeLabels[activity.activity_type] || activity.activity_type}
          </p>
          <p className="text-gray-600">{activity.title}</p>
        </div>

        <div className={`text-right ${getImpactColor(activity.impact_score)}`}>
          <div className="text-2xl font-bold">★</div>
          <p className="text-xs font-bold">Impact: {activity.impact_score}/5</p>
        </div>
      </div>

      {activity.description && (
        <p className="text-sm text-gray-600 mb-3">{activity.description}</p>
      )}

      <div className="flex items-center gap-4 text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <Calendar className="w-4 h-4" />
          <span>{new Date(activity.date).toLocaleDateString()}</span>
        </div>

        {activity.duration_minutes > 0 && (
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>
              {Math.round(activity.duration_minutes / 60 * 10) / 10} hours
            </span>
          </div>
        )}

        <div className="flex items-center gap-1">
          <TrendingUp className="w-4 h-4" />
          <span>{activity.status}</span>
        </div>
      </div>
    </div>
  )
}

/**
 * Activity metrics summary
 */
export function ActivityMetricsSummary({
  userId,
  department,
}: {
  userId?: string
  department: string
}) {
  const [metrics, setMetrics] = React.useState<any | null>(null)
  const [loading, setLoading] = React.useState(false)

  React.useEffect(() => {
    fetchMetrics()
  }, [userId, department])

  const fetchMetrics = async () => {
    if (!userId) return

    try {
      setLoading(true)
      const response = await fetch(
        `/api/activities/metrics/${userId}?department=${department}&period=month`
      )

      if (!response.ok) throw new Error('Failed to fetch metrics')

      const data = await response.json()
      setMetrics(data[0] || null)
    } catch (error) {
      console.error('Failed to fetch metrics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="text-gray-500">Loading metrics...</div>
  }

  if (!metrics) {
    return null
  }

  const cards = [
    {
      label: 'Total Activities',
      value: metrics.total_activities,
      icon: TrendingUp,
      color: 'text-blue-600',
    },
    {
      label: 'Hours',
      value: Math.round(metrics.total_hours * 10) / 10,
      icon: Clock,
      color: 'text-purple-600',
    },
    {
      label: 'Engagement',
      value: metrics.engagement_level,
      icon: Users,
      color: 'text-green-600',
    },
    {
      label: 'Impact Score',
      value: Math.round(metrics.avg_impact_score * 10) / 10,
      icon: TrendingUp,
      color: 'text-orange-600',
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {cards.map((card, index) => {
        const Icon = card.icon
        return (
          <div key={index} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-gray-600">{card.label}</p>
              <Icon className={`w-5 h-5 ${card.color}`} />
            </div>
            <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
          </div>
        )
      })}
    </div>
  )
}
