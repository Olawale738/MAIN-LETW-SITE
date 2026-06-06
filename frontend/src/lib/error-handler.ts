/**
 * Centralized error handling utility
 * Provides consistent error handling, logging, and user-friendly messages
 */

export type ErrorSeverity = 'info' | 'warning' | 'error' | 'critical'

export interface AppError {
  code: string
  message: string
  userMessage: string
  severity: ErrorSeverity
  timestamp: string
  context?: Record<string, any>
}

// Error codes for different scenarios
export const ERROR_CODES = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  SERVER_ERROR: 'SERVER_ERROR',
  TIMEOUT: 'TIMEOUT',
  CONFLICT: 'CONFLICT',
  OFFLINE: 'OFFLINE',
  UNKNOWN: 'UNKNOWN',
} as const

export class ErrorHandler {
  /**
   * Parse various error types into AppError
   */
  static parse(error: unknown, context?: Record<string, any>): AppError {
    const timestamp = new Date().toISOString()

    // Handle AppError
    if (error instanceof AppError) {
      return { ...error, context: { ...error.context, ...context }, timestamp }
    }

    // Handle HTTP errors
    if (error instanceof Response) {
      return this.parseHttpError(error, context)
    }

    // Handle fetch errors (network)
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return {
        code: ERROR_CODES.NETWORK_ERROR,
        message: error.message,
        userMessage: 'Network connection failed. Please check your internet connection.',
        severity: 'error',
        timestamp,
        context: { ...context, originalError: error.message },
      }
    }

    // Handle timeout errors
    if (error instanceof Error && error.name === 'AbortError') {
      return {
        code: ERROR_CODES.TIMEOUT,
        message: error.message,
        userMessage: 'Request timed out. Please try again.',
        severity: 'warning',
        timestamp,
        context,
      }
    }

    // Handle standard errors
    if (error instanceof Error) {
      return {
        code: ERROR_CODES.UNKNOWN,
        message: error.message,
        userMessage: 'An unexpected error occurred. Please try again.',
        severity: 'error',
        timestamp,
        context: { ...context, stack: error.stack },
      }
    }

    // Handle unknown types
    return {
      code: ERROR_CODES.UNKNOWN,
      message: String(error),
      userMessage: 'An unexpected error occurred. Please try again.',
      severity: 'error',
      timestamp,
      context,
    }
  }

  /**
   * Parse HTTP response errors
   */
  private static parseHttpError(response: Response, context?: Record<string, any>): AppError {
    const timestamp = new Date().toISOString()
    const status = response.status

    // Determine error code from HTTP status
    let code = ERROR_CODES.SERVER_ERROR
    let severity: ErrorSeverity = 'error'
    let userMessage = 'An error occurred. Please try again.'

    switch (status) {
      case 400:
        code = ERROR_CODES.VALIDATION_ERROR
        userMessage = 'Invalid input. Please check your submission.'
        break
      case 401:
        code = ERROR_CODES.UNAUTHORIZED
        userMessage = 'Your session has expired. Please log in again.'
        severity = 'critical'
        break
      case 403:
        code = ERROR_CODES.FORBIDDEN
        userMessage = 'You do not have permission to perform this action.'
        break
      case 404:
        code = ERROR_CODES.NOT_FOUND
        userMessage = 'The requested resource was not found.'
        break
      case 409:
        code = ERROR_CODES.CONFLICT
        userMessage = 'This action conflicts with existing data. Please refresh and try again.'
        break
      case 500:
      case 502:
      case 503:
      case 504:
        code = ERROR_CODES.SERVER_ERROR
        userMessage = 'Server error. Please try again later.'
        severity = 'critical'
        break
    }

    return {
      code,
      message: `HTTP ${status}: ${response.statusText}`,
      userMessage,
      severity,
      timestamp,
      context: { ...context, status, statusText: response.statusText },
    }
  }

  /**
   * Log error for debugging
   */
  static log(error: AppError): void {
    const logLevel = {
      info: console.info,
      warning: console.warn,
      error: console.error,
      critical: console.error,
    }[error.severity]

    logLevel(`[${error.code}] ${error.message}`, {
      code: error.code,
      message: error.message,
      severity: error.severity,
      timestamp: error.timestamp,
      context: error.context,
    })

    // In production, send to error tracking service
    if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
      this.reportToService(error)
    }
  }

  /**
   * Report error to external service (e.g., Sentry)
   */
  private static reportToService(error: AppError): void {
    // TODO: Implement error reporting to service like Sentry
    // fetch('/api/errors', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(error),
    // }).catch(() => {}) // Silently fail to avoid cascading errors
  }

  /**
   * Create a custom error
   */
  static create(
    code: string,
    message: string,
    userMessage: string,
    severity: ErrorSeverity = 'error',
    context?: Record<string, any>
  ): AppError {
    return {
      code,
      message,
      userMessage,
      severity,
      timestamp: new Date().toISOString(),
      context,
    }
  }

  /**
   * Handle API response with error checking
   */
  static async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const error = this.parseHttpError(response)
      this.log(error)
      throw error
    }

    try {
      return await response.json()
    } catch (e) {
      const error = this.create(
        ERROR_CODES.SERVER_ERROR,
        'Failed to parse response',
        'Server returned invalid data',
        'error',
        { originalError: String(e) }
      )
      this.log(error)
      throw error
    }
  }
}

// Export as function for convenience
export function handleError(error: unknown, context?: Record<string, any>): AppError {
  const appError = ErrorHandler.parse(error, context)
  ErrorHandler.log(appError)
  return appError
}
