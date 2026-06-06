/**
 * Activity logging utility
 * Logs user activities for tracking and analytics
 */

import { ErrorHandler } from './error-handler'

export type ActivityType =
  | 'gospel_share'
  | 'tract_distribute'
  | 'prayer_session'
  | 'contact_made'
  | 'follow_up_done'
  | 'commitment'
  | 'bible_study'
  | 'mentoring_session'
  | 'volunteer_hours'
  | 'event_participation'

export type ActivityStatus = 'planned' | 'in_progress' | 'completed' | 'cancelled'

export interface ActivityLog {
  activity_type: ActivityType
  title: string
  description?: string
  duration_minutes?: number
  impact_score?: number
  status: ActivityStatus
  department: string
  date: Date
}

/**
 * Activity logger class
 */
export class ActivityLogger {
  private static queue: ActivityLog[] = []
  private static syncing = false

  /**
   * Log an activity
   */
  static async log(activity: ActivityLog): Promise<boolean> {
    try {
      const response = await fetch('/api/activities/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activity_type: activity.activity_type,
          title: activity.title,
          description: activity.description,
          duration_minutes: activity.duration_minutes || 0,
          impact_score: activity.impact_score || 3,
          status: activity.status,
          department: activity.department,
          date: activity.date.toISOString(),
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to log activity')
      }

      return true
    } catch (error) {
      ErrorHandler.handle(error)
      // Queue for later sync
      this.queue.push(activity)
      return false
    }
  }

  /**
   * Get user metrics
   */
  static async getMetrics(userId: string, department: string, period: 'week' | 'month' | 'year' = 'month') {
    try {
      const response = await fetch(
        `/api/activities/metrics/${userId}?department=${department}&period=${period}`
      )

      if (!response.ok) throw new Error('Failed to fetch metrics')

      const data = await response.json()
      return data[0] || null
    } catch (error) {
      ErrorHandler.handle(error)
      return null
    }
  }

  /**
   * Get department top performers
   */
  static async getTopPerformers(department: string, limit: number = 10, days: number = 30) {
    try {
      const response = await fetch(
        `/api/activities/department/${department}/top-performers?limit=${limit}&days=${days}`
      )

      if (!response.ok) throw new Error('Failed to fetch top performers')

      return await response.json()
    } catch (error) {
      ErrorHandler.handle(error)
      return []
    }
  }

  /**
   * Create engagement report
   */
  static async createReport(
    memberId: string,
    periodDays: number = 30
  ): Promise<any> {
    try {
      const response = await fetch(`/api/activities/reports/${memberId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ period_days: periodDays }),
      })

      if (!response.ok) throw new Error('Failed to create report')

      return await response.json()
    } catch (error) {
      ErrorHandler.handle(error)
      return null
    }
  }

  /**
   * Get engagement reports
   */
  static async getReports(memberId: string, limit: number = 10) {
    try {
      const response = await fetch(`/api/activities/reports/${memberId}?limit=${limit}`)

      if (!response.ok) throw new Error('Failed to fetch reports')

      return await response.json()
    } catch (error) {
      ErrorHandler.handle(error)
      return []
    }
  }

  /**
   * Sync queued activities
   */
  static async syncQueue(): Promise<number> {
    if (this.syncing || this.queue.length === 0) {
      return 0
    }

    this.syncing = true
    let synced = 0

    try {
      const activities = [...this.queue]
      this.queue = []

      for (const activity of activities) {
        const success = await this.log(activity)
        if (success) {
          synced++
        } else {
          // Re-queue if failed
          this.queue.push(activity)
        }
      }

      return synced
    } finally {
      this.syncing = false
    }
  }

  /**
   * Get queue length
   */
  static getQueueLength(): number {
    return this.queue.length
  }
}

/**
 * React hook for activity logging
 */
import React from 'react'

export function useActivityLogger(department: string) {
  const [logging, setLogging] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const log = React.useCallback(
    async (activity: Omit<ActivityLog, 'department'>) => {
      try {
        setLogging(true)
        setError(null)

        const success = await ActivityLogger.log({
          ...activity,
          department,
        })

        if (!success) {
          setError('Activity queued - will sync when online')
        }

        return success
      } catch (err) {
        const message = ErrorHandler.handle(err)
        setError(message)
        return false
      } finally {
        setLogging(false)
      }
    },
    [department]
  )

  const getMetrics = React.useCallback(
    async (userId: string) => {
      return ActivityLogger.getMetrics(userId, department)
    },
    [department]
  )

  const syncQueue = React.useCallback(async () => {
    return ActivityLogger.syncQueue()
  }, [])

  return {
    log,
    getMetrics,
    syncQueue,
    logging,
    error,
    queueLength: ActivityLogger.getQueueLength(),
    setError,
  }
}

/**
 * Activity type labels and emojis
 */
export const ACTIVITY_TYPES: Record<ActivityType, { label: string; emoji: string }> = {
  gospel_share: { label: 'Gospel Share', emoji: '📖' },
  tract_distribute: { label: 'Tract Distribution', emoji: '📰' },
  prayer_session: { label: 'Prayer Session', emoji: '🙏' },
  contact_made: { label: 'Contact Made', emoji: '📞' },
  follow_up_done: { label: 'Follow-up Done', emoji: '✅' },
  commitment: { label: 'Commitment', emoji: '🤝' },
  bible_study: { label: 'Bible Study', emoji: '📚' },
  mentoring_session: { label: 'Mentoring Session', emoji: '👥' },
  volunteer_hours: { label: 'Volunteer Hours', emoji: '⏰' },
  event_participation: { label: 'Event Participation', emoji: '🎉' },
}

/**
 * Get activity type icon and label
 */
export function getActivityTypeInfo(type: ActivityType) {
  return ACTIVITY_TYPES[type] || { label: type.replace(/_/g, ' '), emoji: '📝' }
}
