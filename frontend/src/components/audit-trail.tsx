'use client'

import React from 'react'
import { Eye, Users, Settings, MessageSquare, AlertCircle, CheckCircle, Trash2 } from 'lucide-react'
import { ErrorHandler } from '@/lib/error-handler'
import { Spinner } from './loading-states'

interface AuditEntry {
  id: string
  action: string
  resource_type: string
  resource_id: string
  user_id: string
  user_name?: string
  details?: string
  ip_address?: string
  timestamp: string
}

// Icon mapping for action types
const actionIcons: Record<string, React.ReactNode> = {
  create: <CheckCircle className="w-4 h-4 text-green-600" />,
  added: <CheckCircle className="w-4 h-4 text-green-600" />,
  update: <Settings className="w-4 h-4 text-blue-600" />,
  modified: <Settings className="w-4 h-4 text-blue-600" />,
  delete: <Trash2 className="w-4 h-4 text-red-600" />,
  removed: <Trash2 className="w-4 h-4 text-red-600" />,
  view: <Eye className="w-4 h-4 text-gray-600" />,
  message: <MessageSquare className="w-4 h-4 text-purple-600" />,
}

// Label mapping for action types
const actionLabels: Record<string, string> = {
  create: 'Created',
  update: 'Updated',
  delete: 'Deleted',
  view: 'Viewed',
  added: 'Added',
  removed: 'Removed',
  message: 'Messaged',
  modified: 'Modified',
  assigned: 'Assigned',
  logged_in: 'Logged in',
  exported: 'Exported',
}

export function AuditTrail({
  resourceType,
  resourceId,
  userId,
  limit = 50,
}: {
  resourceType?: string
  resourceId?: string
  userId?: string
  limit?: number
}) {
  const [entries, setEntries] = React.useState<AuditEntry[]>([])
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [page, setPage] = React.useState(1)
  const [totalCount, setTotalCount] = React.useState(0)

  React.useEffect(() => {
    fetchAuditTrail()
  }, [resourceType, resourceId, userId, page])

  const fetchAuditTrail = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        limit: String(limit),
        offset: String((page - 1) * limit),
      })
      if (resourceType) params.append('resource_type', resourceType)
      if (resourceId) params.append('resource_id', resourceId)
      if (userId) params.append('user_id', userId)

      const response = await fetch(`/api/audit?${params}`)
      if (!response.ok) throw new Error('Failed to fetch audit trail')

      const data = await response.json()
      setEntries(data.entries)
      setTotalCount(data.total)
      setError(null)
    } catch (err) {
      setError(ErrorHandler.handle(err))
    } finally {
      setLoading(false)
    }
  }

  const totalPages = Math.ceil(totalCount / limit)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-900">Audit Trail</h3>
        <p className="text-sm text-gray-600">Showing {entries.length} of {totalCount}</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12 text-gray-600">
          <Spinner />
        </div>
      ) : entries.length > 0 ? (
        <>
          <div className="space-y-0 border border-gray-200 rounded-lg overflow-hidden">
            {entries.map((entry, index) => (
              <div
                key={entry.id}
                className={`p-4 hover:bg-gray-50 transition-colors ${
                  index !== entries.length - 1 ? 'border-b border-gray-200' : ''
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="mt-1">{actionIcons[entry.action] || <AlertCircle className="w-4 h-4 text-gray-400" />}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-bold text-gray-900">{entry.user_name || entry.user_id}</p>
                      <span className="inline-block px-2 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded capitalize">
                        {actionLabels[entry.action] || entry.action.replace(/_/g, ' ')}
                      </span>
                      <span className="inline-block px-2 py-1 bg-gray-100 text-gray-700 text-xs font-bold rounded">
                        {entry.resource_type}
                      </span>
                    </div>
                    {entry.details && <p className="text-sm text-gray-600 mb-2">{entry.details}</p>}
                    <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                      <span>ID: {entry.resource_id.substring(0, 8)}...</span>
                      {entry.ip_address && <span>IP: {entry.ip_address}</span>}
                      <span>{getRelativeTime(entry.timestamp)}</span>
                    </div>
                  </div>
                  <div className="text-right text-xs text-gray-500 flex-shrink-0">
                    <p>{new Date(entry.timestamp).toLocaleDateString()}</p>
                    <p>{new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <div className="text-sm text-gray-600">Page {page} of {totalPages}</div>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12 text-gray-500">
          <p>No audit entries found</p>
        </div>
      )}
    </div>
  )
}

export function AuditDashboard() {
  const [stats, setStats] = React.useState<any | null>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/audit/stats')
        if (!response.ok) throw new Error('Failed to fetch stats')
        const data = await response.json()
        setStats(data)
      } catch (error) {
        console.error('Failed to fetch audit stats:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-gray-600">
        <Spinner />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard label="Total Actions" value={stats.total_actions} icon={AlertCircle} />
          <StatCard label="This Week" value={stats.actions_this_week} icon={Users} />
          <StatCard label="Users" value={stats.unique_users} icon={Users} />
          <StatCard label="Resources" value={stats.unique_resources} icon={Settings} />
        </div>
      )}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Recent Activity</h3>
        <AuditTrail limit={20} />
      </div>
    </div>
  )
}

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string
  value: number
  icon: React.ComponentType<{ className?: string }>
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-semibold text-gray-600">{label}</p>
        <Icon className="w-5 h-5 text-gray-400" />
      </div>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
    </div>
  )
}

function getRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString()
}
