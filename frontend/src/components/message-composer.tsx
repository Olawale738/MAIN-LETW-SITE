'use client'

import React from 'react'
import { Send, AlertCircle, Wifi, WifiOff } from 'lucide-react'
import { useMessages, Message } from '@/lib/use-messages'
import { OfflineMessageQueue } from '@/lib/offline-queue'
import { LoadingButton } from './loading-states'

interface MessageComposerProps {
  conversationId: string
  onMessageSent?: (message: Message) => void
  placeholder?: string
  autoFocus?: boolean
}

/**
 * Message composer component
 * Handles sending messages with offline support and error handling
 */
export function MessageComposer({
  conversationId,
  onMessageSent,
  placeholder = 'Type a message...',
  autoFocus = true,
}: MessageComposerProps) {
  const [body, setBody] = React.useState('')
  const inputRef = React.useRef<HTMLTextAreaElement>(null)

  const { sendMessage, sending, isOnline, error, setError } = useMessages({
    conversationId,
    onMessageSent,
  })

  const queuedMessages = OfflineMessageQueue.getForConversation(conversationId)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!body.trim()) return

    const result = await sendMessage(body)

    if (result) {
      setBody('')
      // Reset textarea height
      if (inputRef.current) {
        inputRef.current.style.height = 'auto'
      }
    }
  }

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setBody(e.target.value)
    // Auto-expand textarea
    if (inputRef.current) {
      inputRef.current.style.height = 'auto'
      inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 200) + 'px'
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Send on Ctrl+Enter or Cmd+Enter
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      handleSubmit(e as any)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {/* Queued messages indicator */}
      {queuedMessages.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600" />
          <p className="text-sm text-amber-700">
            {queuedMessages.length} message{queuedMessages.length === 1 ? '' : 's'} pending -
            will send when online
          </p>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
          <button
            type="button"
            onClick={() => setError(null)}
            className="text-red-600 hover:text-red-700 text-sm font-bold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Online status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isOnline ? (
            <>
              <Wifi className="w-4 h-4 text-green-600" />
              <span className="text-xs text-green-600 font-bold">Online</span>
            </>
          ) : (
            <>
              <WifiOff className="w-4 h-4 text-amber-600" />
              <span className="text-xs text-amber-600 font-bold">Offline Mode</span>
            </>
          )}
        </div>
        <span className="text-xs text-gray-500">{body.length}/500</span>
      </div>

      {/* Input area */}
      <div className="relative">
        <textarea
          ref={inputRef}
          value={body}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoFocus={autoFocus}
          maxLength={500}
          rows={1}
          className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#140152]/20 focus:border-[#140152] resize-none max-h-[200px]"
          style={{ minHeight: '44px' }}
        />

        {/* Send button */}
        <LoadingButton
          type="submit"
          loading={sending}
          disabled={!body.trim() || sending}
          className="absolute right-2 bottom-2 p-2 bg-[#140152] hover:bg-[#1a0666] text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Send (Ctrl+Enter)"
        >
          <Send className="w-5 h-5" />
        </LoadingButton>
      </div>

      {/* Help text */}
      <p className="text-xs text-gray-500 text-center">
        Press <kbd className="px-2 py-1 bg-gray-100 rounded text-gray-700">Ctrl+Enter</kbd> to send
      </p>
    </form>
  )
}

/**
 * Message display component with read receipts
 */
export function MessageBubble({
  message,
  isOwn,
  onRetry,
}: {
  message: Message | any
  isOwn?: boolean
  onRetry?: () => void
}) {
  const [showReadBy, setShowReadBy] = React.useState(false)

  const isPending = message.id?.startsWith('pending_')
  const isFailed = message.status === 'failed'

  return (
    <div className={`flex gap-3 mb-4 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar placeholder */}
      <div
        className={`w-8 h-8 rounded-full flex-shrink-0 ${
          isOwn ? 'bg-[#140152]' : 'bg-gray-300'
        }`}
      />

      {/* Message bubble */}
      <div className={`flex-1 ${isOwn ? 'flex justify-end' : ''}`}>
        <div
          className={`max-w-xs px-4 py-2 rounded-lg ${
            isOwn
              ? 'bg-[#140152] text-white rounded-br-none'
              : 'bg-gray-100 text-gray-900 rounded-bl-none'
          } ${isFailed ? 'opacity-75' : ''}`}
        >
          <p className="break-words">{message.body}</p>
        </div>

        {/* Metadata */}
        <div className={`flex items-center gap-2 mt-1 text-xs ${isOwn ? 'justify-end' : 'justify-start'}`}>
          <span className="text-gray-500">
            {new Date(message.created_at).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>

          {isOwn && (
            <>
              {isPending && <span className="text-amber-600">Sending...</span>}
              {isFailed && (
                <button
                  onClick={onRetry}
                  className="text-red-600 hover:text-red-700 font-bold"
                >
                  Failed - Retry
                </button>
              )}
              {!isPending && !isFailed && message.read_count > 0 && (
                <button
                  onClick={() => setShowReadBy(!showReadBy)}
                  className="text-blue-600 hover:text-blue-700 font-bold cursor-pointer"
                >
                  ✓ Read ({message.read_count})
                </button>
              )}
            </>
          )}
        </div>

        {/* Read by list */}
        {showReadBy && message.read_by && message.read_by.length > 0 && (
          <div className="mt-2 text-xs text-gray-600 bg-gray-50 rounded p-2">
            <p className="font-bold mb-1">Read by:</p>
            {message.read_by.map((user: any) => (
              <div key={user.id} className="flex justify-between mb-1">
                <span>{user.name}</span>
                <span className="text-gray-500">
                  {new Date(user.read_at).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * Messages container
 */
export function MessagesList({
  messages,
  currentUserId,
  loading,
  onLoadMore,
  hasMore,
}: {
  messages: Message[]
  currentUserId: string
  loading?: boolean
  onLoadMore?: () => void
  hasMore?: boolean
}) {
  const containerRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    // Auto-scroll to bottom
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight
    }
  }, [messages])

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto p-4 space-y-4 bg-white rounded-t-2xl"
      style={{ maxHeight: 'calc(100vh - 300px)' }}
    >
      {loading && (
        <div className="text-center py-4 text-gray-500">
          <p>Loading messages...</p>
        </div>
      )}

      {hasMore && (
        <button
          onClick={onLoadMore}
          className="w-full py-2 text-sm text-blue-600 hover:text-blue-700 font-bold"
        >
          Load earlier messages
        </button>
      )}

      {messages.length === 0 && !loading && (
        <div className="text-center py-12 text-gray-500">
          <p>No messages yet</p>
          <p className="text-sm mt-2">Start the conversation by sending a message</p>
        </div>
      )}

      {messages.map((message) => (
        <MessageBubble
          key={message.id}
          message={message}
          isOwn={message.sender_id === currentUserId}
        />
      ))}
    </div>
  )
}
