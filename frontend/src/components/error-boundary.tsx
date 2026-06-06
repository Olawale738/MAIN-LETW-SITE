'use client'

import React from 'react'
import { AlertCircle, RefreshCw, Home } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Props {
  children: React.ReactNode
  fallback?: React.ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

/**
 * Error boundary component to catch React errors
 */
export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log to error reporting service
    console.error('Error caught by boundary:', error, errorInfo)

    if (typeof window !== 'undefined') {
      // Send to error tracking service
      fetch('/api/errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack,
          timestamp: new Date().toISOString(),
        }),
      }).catch(() => {}) // Silently fail to avoid cascading errors
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center p-4">
          <div className="max-w-md w-full">
            <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                  <AlertCircle className="w-8 h-8 text-red-600" />
                </div>
              </div>

              <h1 className="text-2xl font-black text-gray-900 mb-2">Oops! Something went wrong</h1>
              <p className="text-gray-600 mb-6">
                We're sorry for the inconvenience. Our team has been notified and we're working on a fix.
              </p>

              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-left">
                <p className="text-sm font-mono text-red-700 overflow-auto max-h-32">
                  {this.state.error?.message || 'Unknown error'}
                </p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => {
                    this.setState({ hasError: false, error: undefined })
                  }}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Try Again
                </button>

                <a
                  href="/"
                  className="w-full bg-gray-200 hover:bg-gray-300 text-gray-900 font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  <Home className="w-4 h-4" />
                  Go Home
                </a>
              </div>

              {process.env.NODE_ENV === 'development' && (
                <details className="mt-6 pt-6 border-t border-gray-200">
                  <summary className="text-sm font-bold text-gray-700 cursor-pointer hover:text-gray-900">
                    Debug Info
                  </summary>
                  <pre className="mt-3 text-xs text-gray-600 overflow-auto bg-gray-100 p-3 rounded whitespace-pre-wrap break-words">
                    {this.state.error?.stack}
                  </pre>
                </details>
              )}
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

/**
 * Hook to use error boundary functionality
 */
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null)

  const handleError = (err: Error | unknown) => {
    const error = err instanceof Error ? err : new Error(String(err))
    setError(error)
  }

  const clearError = () => setError(null)

  if (error) {
    throw error
  }

  return { handleError, clearError }
}
