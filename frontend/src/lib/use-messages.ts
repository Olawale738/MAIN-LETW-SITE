/**
 * React hook for message operations
 * Handles sending, fetching, searching, and managing messages
 */

import React from 'react'
import { ErrorHandler } from './error-handler'
import { OfflineMessageQueue, QueuedMessage } from './offline-queue'
import { messageNotifications } from './message-notifications'

export interface Message {
  id: string
  conversation_id: string
  sender_id: string
  body: string
  created_at: string
  read_count: number
  read_by?: Array<{ id: string; name: string; read_at: string }>
}

export interface Conversation {
  id: string
  user_id: string
  admin_id: string
  last_message?: Message
  unread_count: number
  updated_at: string
}

export interface UseMessagesOptions {
  conversationId?: string
  onNewMessage?: (message: Message) => void
  onMessageSent?: (message: Message) => void
  autoMarkAsRead?: boolean
}

export function useMessages(options: UseMessagesOptions = {}) {
  const {
    conversationId,
    onNewMessage,
    onMessageSent,
    autoMarkAsRead = true,
  } = options

  const [messages, setMessages] = React.useState<Message[]>([])
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [sending, setSending] = React.useState(false)
  const [isOnline, setIsOnline] = React.useState(typeof navigator !== 'undefined' ? navigator.onLine : true)

  // Listen for online/offline events
  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Fetch messages
  const fetchMessages = React.useCallback(async () => {
    if (!conversationId) return

    try {
      setLoading(true)
      const response = await fetch(`/api/messages/conversation/${conversationId}?limit=50`)

      if (!response.ok) throw new Error('Failed to fetch messages')

      const data = await response.json()
      setMessages(data)
      setError(null)

      // Mark as read if enabled
      if (autoMarkAsRead && data.length > 0) {
        const lastMessage = data[0]
        await markAsRead(lastMessage.id)
      }
    } catch (err) {
      setError(ErrorHandler.handle(err))
    } finally {
      setLoading(false)
    }
  }, [conversationId, autoMarkAsRead])

  // Send message
  const sendMessage = React.useCallback(
    async (body: string) => {
      if (!conversationId) {
        setError('No conversation selected')
        return null
      }

      if (!body.trim()) {
        setError('Message cannot be empty')
        return null
      }

      try {
        setSending(true)
        setError(null)

        if (!isOnline) {
          // Queue offline message
          const queued = OfflineMessageQueue.addMessage(conversationId, body)
          messageNotifications.showToast('Message queued - will send when online', 'info')
          return {
            id: queued.id,
            conversation_id: conversationId,
            sender_id: '',
            body,
            created_at: new Date().toISOString(),
            read_count: 0,
          }
        }

        // Send online
        const response = await fetch('/api/messages/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            conversation_id: conversationId,
            body,
          }),
        })

        if (!response.ok) throw new Error('Failed to send message')

        const message = await response.json()

        // Add to messages
        setMessages([message, ...messages])

        // Notify
        onMessageSent?.(message)
        messageNotifications.notifyMessageSent()

        return message
      } catch (err) {
        const message = ErrorHandler.handle(err)
        setError(message)
        messageNotifications.notifyMessageFailed(message)
        return null
      } finally {
        setSending(false)
      }
    },
    [conversationId, messages, isOnline, onMessageSent]
  )

  // Mark message as read
  const markAsRead = React.useCallback(
    async (messageId: string) => {
      try {
        await fetch(`/api/messages/${messageId}/read`, {
          method: 'POST',
        })

        // Update local state
        setMessages(prev =>
          prev.map(m =>
            m.id === messageId ? { ...m, read_count: m.read_count + 1 } : m
          )
        )
      } catch (err) {
        console.error('Failed to mark message as read:', err)
      }
    },
    []
  )

  // Get read status for message
  const getReadStatus = React.useCallback(
    async (messageId: string) => {
      try {
        const response = await fetch(`/api/messages/${messageId}/read-status`)
        if (!response.ok) throw new Error('Failed to get read status')
        return await response.json()
      } catch (err) {
        console.error('Failed to get read status:', err)
        return null
      }
    },
    []
  )

  // Search messages
  const searchMessages = React.useCallback(
    async (query: string) => {
      try {
        const params = new URLSearchParams({ q: query })
        if (conversationId) params.append('conversation_id', conversationId)

        const response = await fetch(`/api/messages/search?${params}`)
        if (!response.ok) throw new Error('Search failed')

        const data = await response.json()
        return data.results
      } catch (err) {
        ErrorHandler.handle(err)
        return []
      }
    },
    [conversationId]
  )

  return {
    messages,
    loading,
    error,
    sending,
    isOnline,
    fetchMessages,
    sendMessage,
    markAsRead,
    getReadStatus,
    searchMessages,
    setError,
  }
}

/**
 * Hook for managing conversations
 */
export function useConversations() {
  const [conversations, setConversations] = React.useState<Conversation[]>([])
  const [loading, setLoading] = React.useState(false)
  const [unreadCount, setUnreadCount] = React.useState(0)

  const fetchConversations = React.useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/messages/conversations')

      if (!response.ok) throw new Error('Failed to fetch conversations')

      const data = await response.json()
      setConversations(data.conversations)
      setUnreadCount(data.unread_count)
    } catch (err) {
      ErrorHandler.handle(err)
    } finally {
      setLoading(false)
    }
  }, [])

  const getUnreadCount = React.useCallback(async () => {
    try {
      const response = await fetch('/api/messages/unread-count')
      if (!response.ok) throw new Error('Failed to get unread count')
      const data = await response.json()
      setUnreadCount(data.unread_count)
      return data.unread_count
    } catch (err) {
      console.error('Failed to get unread count:', err)
      return 0
    }
  }, [])

  return {
    conversations,
    loading,
    unreadCount,
    fetchConversations,
    getUnreadCount,
  }
}
