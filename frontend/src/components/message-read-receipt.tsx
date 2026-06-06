'use client'

import React from 'react'
import { Check, CheckCheck, Clock } from 'lucide-react'
import { ErrorHandler } from '@/lib/error-handler'

interface ReadBy {
  id: string
  name: string
  read_at: string
}

interface MessageReadReceiptProps {
  messageId: string
  senderId: string
  currentUserId: string
  initialReadCount?: number
  initialReadBy?: ReadBy[]
  isPending?: boolean
  isFailed?: boolean
}

/**
 * Message read receipt indicator
 * Shows who has read the message with timestamps
 */
export function MessageReadReceipt({
  messageId,
  senderId,
  currentUserId,
  initialReadCount = 0,
  initialReadBy = [],
  isPending = false,
  isFailed = false,
}: MessageReadReceiptProps) {
  const [readStatus, setReadStatus] = React.useState({
    read_count: initialReadCount,
    read_by: initialReadBy,
  })
  const [showDetails, setShowDetails] = React.useState(false)

  // Only show for message sender
  if (senderId !== currentUserId) {
    return null
  }

  if (isPending) {
    return (
      <div className="flex items-center gap-1 text-xs text-gray-500">
        <Clock className="w-3 h-3" />
        <span>Sending...</span>
      </div>
    )
  }

  if (isFailed) {
    return (
      <div className="flex items-center gap-1 text-xs text-red-600">
        <Check className="w-3 h-3" />
        <span>Failed</span>
      </div>
    )
  }

  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)

    if (minutes < 1) return 'just now'
    if (minutes < 60) return `${minutes}m ago`

    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`

    const days = Math.floor(hours / 24)
    if (days === 1) return 'yesterday'
    if (days < 7) return `${days}d ago`

    return date.toLocaleDateString()
  }

  return (
    <div className="relative inline-block">
      <div className="flex items-center gap-1">
        {readStatus.read_count > 0 ? (
          <>
            <CheckCheck className="w-3 h-3 text-blue-500" />
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="text-xs text-gray-500 hover:text-gray-700 cursor-pointer"
              title={`Read by ${readStatus.read_count} ${readStatus.read_count === 1 ? 'person' : 'people'}`}
            >
              Read
            </button>
          </>
        ) : (
          <>
            <Check className="w-3 h-3 text-gray-400" />
            <span className="text-xs text-gray-400">Delivered</span>
          </>
        )}
      </div>

      {/* Read details tooltip */}
      {showDetails && readStatus.read_by.length > 0 && (
        <div className="absolute bottom-full right-0 mb-2 bg-white border border-gray-200 rounded-lg shadow-lg p-2 z-10 min-w-max">
          <div className="text-xs font-semibold text-gray-700 mb-2">
            Read by {readStatus.read_count}
          </div>
          <div className="space-y-1">
            {readStatus.read_by.map(user => (
              <div key={user.id} className="text-xs text-gray-600 flex items-center justify-between gap-3">
                <span>{user.name}</span>
                <span className="text-gray-400">{getRelativeTime(user.read_at)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Click outside to close */}
      {showDetails && (
        <div
          className="fixed inset-0"
          onClick={() => setShowDetails(false)}
        />
      )}
    </div>
  )
}

/**
 * Message delivery status indicator (simple version)
 */
export function MessageDeliveryStatus({
  isPending = false,
  isFailed = false,
  isRead = false,
  hasError = false,
}) {
  if (isPending) {
    return (
      <div className="flex items-center gap-1 text-xs text-gray-400">
        <Clock className="w-3 h-3" />
        <span>Sending</span>
      </div>
    )
  }

  if (isFailed || hasError) {
    return (
      <div className="flex items-center gap-1 text-xs text-red-600 cursor-help" title="Failed to send">
        <span>❌</span>
      </div>
    )
  }

  if (isRead) {
    return (
      <div className="flex items-center gap-1 text-xs text-blue-500" title="Read">
        <CheckCheck className="w-3 h-3" />
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1 text-xs text-gray-400" title="Delivered">
      <Check className="w-3 h-3" />
    </div>
  )
}

/**
 * Read receipt list for a conversation
 */
export function ConversationReadReceipts({
  conversationId,
  currentUserId,
}: {
  conversationId: string
  currentUserId: string
}) {
  const [receipts, setReceipts] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(false)

  React.useEffect(() => {
    fetchReceipts()
  }, [conversationId])

  const fetchReceipts = async () => {
    try {
      setLoading(true)
      const response = await fetch(
        `/api/messages/conversation/${conversationId}/read-receipts`
      )

      if (!response.ok) throw new Error('Failed to fetch receipts')

      const data = await response.json()
      setReceipts(data)
    } catch (error) {
      ErrorHandler.handle(error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="text-sm text-gray-500">Loading read receipts...</div>
  }

  if (receipts.length === 0) {
    return null
  }

  return (
    <div className="text-xs text-gray-600 space-y-1 mt-2 p-2 bg-gray-50 rounded">
      <div className="font-semibold text-gray-700">Read by:</div>
      {receipts.map(receipt => (
        <div key={receipt.user_id} className="flex justify-between">
          <span>{receipt.user_name}</span>
          <span className="text-gray-400">{new Date(receipt.read_at).toLocaleTimeString()}</span>
        </div>
      ))}
    </div>
  )
}
