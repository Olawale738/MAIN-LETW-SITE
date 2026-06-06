'use client'

import React from 'react'
import { Search, X, Loader2, AlertCircle } from 'lucide-react'
import { ErrorHandler } from '@/lib/error-handler'
import { Spinner } from './loading-states'

interface SearchResult {
  id: string
  conversation_id: string
  sender_id: string
  body: string
  created_at: string
  read_count: number
}

interface MessageSearchProps {
  conversationId?: string
  onSelectMessage?: (message: SearchResult) => void
  className?: string
}

/**
 * Message search component
 * Allows searching messages within conversation or across all conversations
 */
export function MessageSearch({
  conversationId,
  onSelectMessage,
  className = '',
}: MessageSearchProps) {
  const [query, setQuery] = React.useState('')
  const [results, setResults] = React.useState<SearchResult[]>([])
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [isOpen, setIsOpen] = React.useState(false)
  const [hasSearched, setHasSearched] = React.useState(false)
  const searchTimeoutRef = React.useRef<NodeJS.Timeout | null>(null)

  // Debounced search
  const handleSearch = React.useCallback((searchQuery: string) => {
    setQuery(searchQuery)
    setError(null)

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    if (searchQuery.trim().length === 0) {
      setResults([])
      setHasSearched(false)
      return
    }

    setLoading(true)
    setIsOpen(true)

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const params = new URLSearchParams({
          q: searchQuery,
        })

        if (conversationId) {
          params.append('conversation_id', conversationId)
        }

        const response = await fetch(`/api/messages/search?${params}`)

        if (!response.ok) {
          throw new Error('Search failed')
        }

        const data = await response.json()
        setResults(data.results || [])
        setHasSearched(true)
      } catch (err) {
        const message = ErrorHandler.handle(err)
        setError(message)
        setResults([])
        setHasSearched(true)
      } finally {
        setLoading(false)
      }
    }, 300) // Debounce 300ms
  }, [conversationId])

  const handleSelectResult = (message: SearchResult) => {
    if (onSelectMessage) {
      onSelectMessage(message)
    }
    setIsOpen(false)
    setQuery('')
  }

  const getPreview = (text: string, maxLength = 80) => {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + '...'
  }

  const getHighlightedText = (text: string, highlight: string) => {
    if (!highlight) return text

    const parts = text.split(new RegExp(`(${highlight})`, 'gi'))
    return parts.map((part, i) =>
      part.toLowerCase() === highlight.toLowerCase() ? (
        <mark key={i} className="bg-yellow-200 font-semibold">
          {part}
        </mark>
      ) : (
        <span key={i}>{part}</span>
      )
    )
  }

  return (
    <div className={`relative ${className}`}>
      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search messages..."
          value={query}
          onChange={e => handleSearch(e.target.value)}
          onFocus={() => query && setIsOpen(true)}
          className="w-full pl-10 pr-10 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#140152]/20 focus:border-[#140152]"
        />
        {query && (
          <button
            onClick={() => {
              setQuery('')
              setResults([])
              setHasSearched(false)
            }}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Results dropdown */}
      {isOpen && (query.trim().length > 0) && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-30"
            onClick={() => setIsOpen(false)}
          />

          {/* Results container */}
          <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-40 max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-4 flex items-center justify-center gap-2 text-gray-600">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Searching...</span>
              </div>
            ) : error ? (
              <div className="p-4 flex items-start gap-2 text-red-600">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span className="text-sm">{error}</span>
              </div>
            ) : results.length > 0 ? (
              <div className="divide-y">
                {results.map(result => (
                  <button
                    key={result.id}
                    onClick={() => handleSelectResult(result)}
                    className="w-full text-left p-3 hover:bg-gray-50 transition-colors focus:outline-none focus:bg-gray-50"
                  >
                    <p className="text-sm text-gray-900 mb-1">
                      {getHighlightedText(getPreview(result.body), query)}
                    </p>
                    <div className="flex justify-between items-center text-xs text-gray-500">
                      <span>{new Date(result.created_at).toLocaleDateString()}</span>
                      {result.read_count > 0 && (
                        <span className="text-blue-600">✓ Read by {result.read_count}</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            ) : hasSearched ? (
              <div className="p-4 text-center text-gray-500 text-sm">
                No messages found matching "{query}"
              </div>
            ) : null}
          </div>
        </>
      )}
    </div>
  )
}

/**
 * Message search modal
 * Full-screen search interface for searching across all messages
 */
export function MessageSearchModal({
  isOpen,
  onClose,
  conversationId,
}: {
  isOpen: boolean
  onClose: () => void
  conversationId?: string
}) {
  const [query, setQuery] = React.useState('')
  const [results, setResults] = React.useState<SearchResult[]>([])
  const [loading, setLoading] = React.useState(false)
  const [total, setTotal] = React.useState(0)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!query.trim()) return

    try {
      setLoading(true)

      const params = new URLSearchParams({
        q: query,
        limit: '50',
      })

      if (conversationId) {
        params.append('conversation_id', conversationId)
      }

      const response = await fetch(`/api/messages/search?${params}`)

      if (!response.ok) throw new Error('Search failed')

      const data = await response.json()
      setResults(data.results)
      setTotal(data.total)
    } catch (error) {
      ErrorHandler.handle(error)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-24 p-4">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl max-h-[80vh] overflow-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Search Messages</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Search form */}
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search messages..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#140152]/20"
              autoFocus
            />
          </form>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-12 text-gray-600">
              <Spinner />
              <span>Searching...</span>
            </div>
          ) : query && results.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p>No messages found matching "{query}"</p>
            </div>
          ) : query && results.length > 0 ? (
            <>
              <p className="text-sm text-gray-600 mb-4">
                Found {total} message{total !== 1 ? 's' : ''}
              </p>
              <div className="space-y-3">
                {results.map(result => (
                  <div
                    key={result.id}
                    className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <p className="text-gray-900 mb-2 line-clamp-3">
                      {getHighlightedText(result.body, query)}
                    </p>
                    <div className="flex justify-between items-center text-xs text-gray-500">
                      <span>{new Date(result.created_at).toLocaleString()}</span>
                      {result.read_count > 0 && (
                        <span className="text-blue-600">✓ Read by {result.read_count}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p>Enter a search term to find messages</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Helper function used in component
function getHighlightedText(text: string, highlight: string) {
  if (!highlight) return text
  const parts = text.split(new RegExp(`(${highlight})`, 'gi'))
  return parts.map((part, i) =>
    part.toLowerCase() === highlight.toLowerCase() ? (
      <mark key={i} className="bg-yellow-200 font-semibold">
        {part}
      </mark>
    ) : (
      <span key={i}>{part}</span>
    )
  )
}

function getPreview(text: string, maxLength = 80) {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}
