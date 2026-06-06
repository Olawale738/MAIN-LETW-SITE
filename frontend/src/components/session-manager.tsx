'use client'

import React from 'react'
import { Smartphone, Laptop, Shield, LogOut, AlertTriangle, CheckCircle } from 'lucide-react'
import { ErrorHandler } from '@/lib/error-handler'
import { Spinner, LoadingButton } from './loading-states'

interface Session {
  id: string
  device_type: string
  device_name?: string
  browser?: string
  os?: string
  ip_address?: string
  location?: string
  status: string
  last_activity: string
  created_at: string
  is_trusted: boolean
}

interface SecurityEvent {
  id: string
  event_type: string
  severity: string
  message: string
  is_suspicious: boolean
  created_at: string
}

/**
 * Session management component
 * Displays active sessions and allows revoking them
 */
export function SessionManager() {
  const [sessions, setSessions] = React.useState<Session[]>([])
  const [securityEvents, setSecurityEvents] = React.useState<SecurityEvent[]>([])
  const [loading, setLoading] = React.useState(true)
  const [revoking, setRevoking] = React.useState<string | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [activeTab, setActiveTab] = React.useState<'sessions' | 'security'>('sessions')

  React.useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)

      const [sessionsRes, eventsRes] = await Promise.all([
        fetch('/api/sessions/'),
        fetch('/api/sessions/security/events?limit=20'),
      ])

      if (!sessionsRes.ok || !eventsRes.ok) {
        throw new Error('Failed to fetch data')
      }

      const sessionData = await sessionsRes.json()
      const eventData = await eventsRes.json()

      setSessions(sessionData)
      setSecurityEvents(eventData)
      setError(null)
    } catch (err) {
      const message = ErrorHandler.handle(err)
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const handleRevokeSession = async (sessionId: string) => {
    try {
      setRevoking(sessionId)

      const response = await fetch(`/api/sessions/${sessionId}/revoke`, {
        method: 'POST',
      })

      if (!response.ok) throw new Error('Failed to revoke session')

      setSessions(sessions.filter(s => s.id !== sessionId))
    } catch (err) {
      ErrorHandler.handle(err)
    } finally {
      setRevoking(null)
    }
  }

  const handleRevokeAll = async () => {
    if (!confirm('Are you sure you want to revoke all other sessions?')) {
      return
    }

    try {
      const response = await fetch('/api/sessions/revoke-all?keep_current=true', {
        method: 'POST',
      })

      if (!response.ok) throw new Error('Failed to revoke sessions')

      // Refresh sessions
      fetchData()
    } catch (err) {
      ErrorHandler.handle(err)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-gray-600">
        <Spinner />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex gap-4 border-b border-gray-200">
        {['sessions', 'security'].map(tab => (
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

      {/* Sessions Tab */}
      {activeTab === 'sessions' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-900">Active Sessions ({sessions.length})</h3>
            {sessions.length > 1 && (
              <button
                onClick={handleRevokeAll}
                className="text-sm text-red-600 hover:text-red-700 font-bold"
              >
                Revoke All Others
              </button>
            )}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
              {error}
            </div>
          )}

          {sessions.length > 0 ? (
            <div className="space-y-3">
              {sessions.map(session => (
                <SessionCard
                  key={session.id}
                  session={session}
                  onRevoke={handleRevokeSession}
                  revoking={revoking === session.id}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No active sessions</p>
            </div>
          )}

          {/* Session Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-700">
            <p className="font-bold mb-2">About Sessions</p>
            <ul className="space-y-1">
              <li>• Shows all devices currently logged in to your account</li>
              <li>• You can revoke any session to log out that device</li>
              <li>• Unknown devices should be investigated immediately</li>
              <li>• Sessions expire after 30 days of inactivity</li>
            </ul>
          </div>
        </div>
      )}

      {/* Security Tab */}
      {activeTab === 'security' && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-gray-900">Security Events</h3>

          {securityEvents.length > 0 ? (
            <div className="space-y-3">
              {securityEvents.map(event => (
                <SecurityEventCard key={event.id} event={event} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No security events</p>
            </div>
          )}

          {/* Security Tips */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-700">
            <p className="font-bold mb-2">Security Tips</p>
            <ul className="space-y-1">
              <li>✓ Review your sessions regularly</li>
              <li>✓ Log out from devices you no longer use</li>
              <li>✓ Be aware of suspicious login attempts</li>
              <li>✓ Use strong, unique passwords</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Session card component
 */
function SessionCard({
  session,
  onRevoke,
  revoking,
}: {
  session: Session
  onRevoke: (id: string) => void
  revoking: boolean
}) {
  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'mobile':
        return <Smartphone className="w-5 h-5" />
      case 'tablet':
        return <Smartphone className="w-5 h-5 rotate-90" />
      default:
        return <Laptop className="w-5 h-5" />
    }
  }

  const getRelativeTime = (dateString: string) => {
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

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between hover:shadow-md transition-shadow">
      <div className="flex items-start gap-4 flex-1">
        <div className="text-gray-400 mt-1">{getDeviceIcon(session.device_type)}</div>

        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <p className="font-bold text-gray-900">
              {session.device_name || 'Unknown Device'}
            </p>
            {session.is_trusted && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 text-xs rounded font-bold">
                <CheckCircle className="w-3 h-3" />
                Trusted
              </span>
            )}
          </div>

          <div className="text-sm text-gray-600 space-y-1">
            {session.browser && <p>{session.browser}</p>}
            {session.os && <p>{session.os}</p>}
            {session.ip_address && <p>IP: {session.ip_address}</p>}
            {session.location && <p>📍 {session.location}</p>}
          </div>

          <p className="text-xs text-gray-500 mt-2">
            Last active: {getRelativeTime(session.last_activity)}
          </p>
        </div>
      </div>

      <LoadingButton
        loading={revoking}
        onClick={() => onRevoke(session.id)}
        className="ml-4 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-lg transition-colors flex items-center gap-2"
      >
        <LogOut className="w-4 h-4" />
        Log Out
      </LoadingButton>
    </div>
  )
}

/**
 * Security event card component
 */
function SecurityEventCard({ event }: { event: SecurityEvent }) {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'text-red-600 bg-red-50'
      case 'warning':
        return 'text-amber-600 bg-amber-50'
      case 'info':
        return 'text-blue-600 bg-blue-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
      case 'warning':
        return <AlertTriangle className="w-4 h-4" />
      default:
        return <Shield className="w-4 h-4" />
    }
  }

  return (
    <div className={`border rounded-lg p-4 flex items-start gap-3 ${getSeverityColor(event.severity)}`}>
      {getSeverityIcon(event.severity)}

      <div className="flex-1">
        <p className="font-bold capitalize">{event.event_type.replace('_', ' ')}</p>
        <p className="text-sm mt-1">{event.message}</p>
        <p className="text-xs opacity-70 mt-2">{new Date(event.created_at).toLocaleString()}</p>
      </div>

      {event.is_suspicious && (
        <span className="px-3 py-1 bg-red-200 text-red-700 text-xs font-bold rounded">
          Suspicious
        </span>
      )}
    </div>
  )
}
