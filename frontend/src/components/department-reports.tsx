'use client'

import React from 'react'
import { Download, BarChart3, TrendingUp, Calendar, Users, Clock } from 'lucide-react'
import { ErrorHandler } from '@/lib/error-handler'
import { Spinner, LoadingButton } from './loading-states'

interface DepartmentReportsProps {
  department: string
  coordinatorId?: string
  isCoordinator?: boolean
}

/**
 * Department reports and analytics component
 */
export function DepartmentReports({
  department,
  coordinatorId,
  isCoordinator = false,
}: DepartmentReportsProps) {
  const [analytics, setAnalytics] = React.useState<any | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [exporting, setExporting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [activeTab, setActiveTab] = React.useState<'overview' | 'members' | 'export'>('overview')

  React.useEffect(() => {
    fetchAnalytics()
  }, [department])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/export/analytics/${department}/summary`)

      if (!response.ok) throw new Error('Failed to fetch analytics')

      const data = await response.json()
      setAnalytics(data)
      setError(null)
    } catch (err) {
      const message = ErrorHandler.handle(err)
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async (format: 'csv' | 'json') => {
    if (!isCoordinator) {
      ErrorHandler.handleValidation({ permission: 'Only coordinators can export reports' })
      return
    }

    try {
      setExporting(true)

      const response = await fetch(
        `/api/export/department/${department}/report?format=${format}`,
        { method: 'POST' }
      )

      if (!response.ok) throw new Error('Export failed')

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `department_report_${department}_${new Date().toISOString().split('T')[0]}.${format}`
      a.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      ErrorHandler.handle(error)
    } finally {
      setExporting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-gray-600">
        <Spinner />
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        {error}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex gap-4 border-b border-gray-200">
        {['overview', 'members', 'export'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`px-4 py-3 font-bold capitalize transition-colors ${
              activeTab === tab
                ? 'text-[#140152] border-b-2 border-[#140152]'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && analytics && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <MetricCard
              label="Total Members"
              value={analytics.summary.total_members}
              icon={Users}
              color="blue"
            />
            <MetricCard
              label="Active Members"
              value={analytics.summary.active_members}
              icon={TrendingUp}
              color="green"
            />
            <MetricCard
              label="Total Activities"
              value={analytics.summary.total_activities}
              icon={BarChart3}
              color="purple"
            />
            <MetricCard
              label="Total Hours"
              value={Math.round(analytics.summary.total_hours * 10) / 10}
              icon={Clock}
              color="orange"
            />
          </div>

          {/* Period Info */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-2 text-gray-600">
              <Calendar className="w-4 h-4" />
              <span className="text-sm">
                Period: {new Date(analytics.period.start).toLocaleDateString()} to{' '}
                {new Date(analytics.period.end).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Members Tab */}
      {activeTab === 'members' && analytics && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-gray-900">Member Activity</h3>

          {Object.keys(analytics.member_metrics).length > 0 ? (
            <div className="space-y-3">
              {Object.entries(analytics.member_metrics).map(([userId, metrics]: [string, any]) => (
                <div
                  key={userId}
                  className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between"
                >
                  <div>
                    <p className="font-bold text-gray-900">User {userId.substring(0, 8)}...</p>
                    <p className="text-sm text-gray-600">
                      {metrics.activities} activities • {metrics.hours.toFixed(1)} hours
                    </p>
                  </div>

                  <div className="text-right">
                    <div className="inline-block bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg px-3 py-2">
                      <p className="text-sm font-bold text-[#140152]">
                        Impact: {metrics.impact.toFixed(1)}/5
                      </p>
                      {metrics.is_coordinator && (
                        <p className="text-xs text-purple-600 font-semibold">Coordinator</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No member activity data available
            </div>
          )}
        </div>
      )}

      {/* Export Tab */}
      {activeTab === 'export' && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-gray-900">Export Data</h3>

          {!isCoordinator ? (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-amber-700">
              <p className="text-sm">Only coordinators can export reports</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ExportCard
                title="CSV Report"
                description="Download activity data as CSV"
                format="csv"
                onExport={handleExport}
                loading={exporting}
              />

              <ExportCard
                title="JSON Report"
                description="Download activity data as JSON"
                format="json"
                onExport={handleExport}
                loading={exporting}
              />
            </div>
          )}

          {/* Recent Exports */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h4 className="font-bold text-gray-900 mb-3">About Export</h4>
            <ul className="text-sm text-gray-600 space-y-2">
              <li>• Reports include all activities from the current month</li>
              <li>• CSV format is ideal for spreadsheets and further analysis</li>
              <li>• JSON format includes detailed metadata</li>
              <li>• Full audit exports require coordinator access</li>
            </ul>
          </div>
        </div>
      )}
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
  value: any
  icon: React.ComponentType<{ className?: string }>
  color: 'blue' | 'green' | 'purple' | 'orange'
}) {
  const colorClasses = {
    blue: 'text-blue-600 bg-blue-50',
    green: 'text-green-600 bg-green-50',
    purple: 'text-purple-600 bg-purple-50',
    orange: 'text-orange-600 bg-orange-50',
  }

  const iconColor = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    purple: 'text-purple-600',
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
 * Export card component
 */
function ExportCard({
  title,
  description,
  format,
  onExport,
  loading,
}: {
  title: string
  description: string
  format: 'csv' | 'json'
  onExport: (format: 'csv' | 'json') => void
  loading: boolean
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <Download className="w-8 h-8 text-[#140152] mb-3" />
      <h4 className="font-bold text-gray-900 mb-2">{title}</h4>
      <p className="text-sm text-gray-600 mb-4">{description}</p>

      <LoadingButton
        loading={loading}
        onClick={() => onExport(format)}
        className="w-full bg-[#140152] hover:bg-[#1a0666] text-white font-bold py-2 rounded-lg transition-colors"
      >
        Download {format.toUpperCase()}
      </LoadingButton>
    </div>
  )
}
