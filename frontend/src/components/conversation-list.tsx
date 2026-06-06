'use client'

import React from 'react'
import { Search, X, MessageCircle, AlertCircle } from 'lucide-react'
import { useConversations } from '@/lib/use-messages'
import { ErrorHandler } from '@/lib/error-handler'
import { Spinner } from './loading-states'

interface ConversationItemProps {
  id: string
  participantName: string
  lastMessage?: string
  unreadCount: number
  lastMessageTime?: string
  isActive?: boolean
  onClick: () => void
}

/**
 * Single conversation item
 */
function ConversationItem({
  id,
  participantName,
  lastMessage,
  unreadCount,
  lastMessageTime,
  isActive,
  onClick,
}: ConversationItemProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-4 border-b border-gray-200 hover:bg-gray-50 transition-colors ${
        isActive ? 'bg-blue-50 border-l-4 border-l-[#140152]' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className={`font-bold text-gray-900 ${unreadCount > 0 ? 'font-black' : ''}`}>
              {participantName}
            </p>
            {unreadCount > 0 && (
              <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-[#140152] rounded-full">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </div>
          {lastMessage && (
            <p
              className={`text-sm truncate ${
                unreadCount > 0 ? 'text-gray-700 font-medium' : 'text-gray-500'
              }`}
            >
              {lastMessage}
            </p>
          )}
        </div>

        {lastMessageTime && (
          <p className="text-xs text-gray-500 flex-shrink-0">
            {getRelativeTime(lastMessageTime)}
          </p>
        )}
      </div>
    </button>
  )
}

/**
 * Conversation list component
 */
export function ConversationList({
  activeConversationId,
  onSelectConversation,
}: {
  activeConversationId?: string
  onSelectConversation: (conversationId: string) => void
}) {
  const { conversations, loading, unreadCount, fetchConversations } = useConversations()
  const [searchQuery, setSearchQuery] = React.useState('')
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    fetchConversations()
  }, [fetchConversations])

  const filteredConversations = conversations.filter(conv =>
    conv.user_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.admin_id?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center text-gray-600">
        <Spinner />
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-white rounded-2xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-[#140152] to-purple-700 text-white">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">Messages</h2>
          {unreadCount > 0 && (
            <span className="inline-flex items-center justify-center px-3 py-1 text-xs font-bold bg-white text-[#140152] rounded-full">
              {unreadCount} new
            </span>
          )}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/60" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-white/20 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/40 focus:bg-white/30"
          />
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 border-b border-red-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-600 hover:text-red-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length > 0 ? (
          filteredConversations.map(conv => (
            <ConversationItem
              key={conv.id}
              id={conv.id}
              participantName={conv.user_id === 'you' ? 'User' : conv.user_id || 'Unknown'}
              lastMessage={conv.last_message?.body}
              unreadCount={conv.unread_count}
              lastMessageTime={conv.updated_at}
              isActive={conv.id === activeConversationId}
              onClick={() => onSelectConversation(conv.id)}
            />
          ))
        ) : (
          <div className="p-8 text-center text-gray-500">
            {searchQuery ? (
              <>
                <MessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No conversations match your search</p>
              </>
            ) : (
              <>
                <MessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No conversations yet</p>
                <p className="text-sm mt-2">Start a conversation to message users</p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * Floating message badge
 */
export function MessageBadge({ count }: { count: number }) {
  if (count === 0) return null

  return (
    <div className="inline-flex items-center justify-center min-w-[24px] h-6 px-2 text-xs font-bold text-white bg-red-600 rounded-full">
      {count > 99 ? '99+' : count}
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

  if (diffMins < 1) return 'Now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString()
}
