/**
 * Centralized error handling utility
 */

export type ErrorSeverity = 'info' | 'warning' | 'error' | 'critical'

export class AppError extends Error {
  code: string
  userMessage: string
  severity: ErrorSeverity
  timestamp: string
  context?: Record<string, any>

  constructor(code: string, message: string, userMessage: string, severity: ErrorSeverity = 'error', context?: Record<string, any>) {
    super(message)
    this.code = code
    this.userMessage = userMessage
    this.severity = severity
    this.timestamp = new Date().toISOString()
    this.context = context
    Object.setPrototypeOf(this, AppError.prototype)
  }
}

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
  static parse(error: unknown, context?: Record<string, any>): AppError {
    if (error instanceof AppError) {
      return new AppError(error.code, error.message, error.userMessage, error.severity, { ...error.context, ...context })
    }

    if (error instanceof Response) {
      return this.parseHttpError(error, context)
    }

    if (error instanceof TypeError && error.message.includes('fetch')) {
      return new AppError(ERROR_CODES.NETWORK_ERROR, error.message, 'Network connection failed. Please check your internet connection.', 'error', { ...context, originalError: error.message })
    }

    if (error instanceof Error && error.name === 'AbortError') {
      return new AppError(ERROR_CODES.TIMEOUT, error.message, 'Request timed out. Please try again.', 'warning', context)
    }

    if (error instanceof Error) {
      return new AppError(ERROR_CODES.UNKNOWN, error.message, 'An unexpected error occurred. Please try again.', 'error', { ...context, stack: error.stack })
    }

    return new AppError(ERROR_CODES.UNKNOWN, String(error), 'An unexpected error occurred. Please try again.', 'error', context)
  }

  private static parseHttpError(response: Response, context?: Record<string, any>): AppError {
    const status = response.status
    let code: string = ERROR_CODES.SERVER_ERROR
    let userMessage = 'A server error occurred. Please try again.'

    if (status === 400) {
      code = ERROR_CODES.VALIDATION_ERROR
      userMessage = 'Please check your input and try again.'
    } else if (status === 401) {
      code = ERROR_CODES.UNAUTHORIZED
      userMessage = 'Please log in to continue.'
    } else if (status === 403) {
      code = ERROR_CODES.FORBIDDEN
      userMessage = 'You do not have permission to perform this action.'
    } else if (status === 404) {
      code = ERROR_CODES.NOT_FOUND
      userMessage = 'The requested resource was not found.'
    } else if (status === 409) {
      code = ERROR_CODES.CONFLICT
      userMessage = 'This action conflicts with existing data.'
    } else if (status === 429) {
      userMessage = 'Too many requests. Please wait a moment and try again.'
    }

    return new AppError(code, `HTTP ${status}`, userMessage, status >= 500 ? 'error' : 'warning', { ...context, status })
  }

  static log(error: AppError): void {
    if (error.severity === 'critical' || error.severity === 'error') {
      console.error('[Error]', error)
      this.reportToService(error)
    } else if (error.severity === 'warning') {
      console.warn('[Warning]', error)
    } else {
      console.log('[Info]', error)
    }
  }

  static handle(error: unknown, context?: Record<string, any>): string {
    const appError = this.parse(error, context)
    this.log(appError)
    return appError.userMessage
  }

  static handleValidation(errors: Record<string, string>): string {
    const messages = Object.values(errors).join(', ')
    const appError = new AppError(ERROR_CODES.VALIDATION_ERROR, messages, messages, 'warning')
    this.log(appError)
    return appError.userMessage
  }

  private static reportToService(error: AppError): void {
    if (typeof window === 'undefined') return
    fetch('/api/errors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: error.code,
        message: error.message,
        severity: error.severity,
        context: error.context,
        timestamp: error.timestamp,
        url: window.location.href,
      }),
    }).catch(() => {})
  }

  static create(code: string, message: string, userMessage: string, severity: ErrorSeverity = 'error', context?: Record<string, any>): AppError {
    return new AppError(code, message, userMessage, severity, context)
  }

  static async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const error = this.parseHttpError(response)
      this.log(error)
      throw error
    }

    try {
      return await response.json()
    } catch (e) {
      const error = new AppError(ERROR_CODES.SERVER_ERROR, 'Failed to parse response', 'Server returned invalid data', 'error', { originalError: String(e) })
      this.log(error)
      throw error
    }
  }
}

export function handleError(error: unknown, context?: Record<string, any>): AppError {
  const appError = ErrorHandler.parse(error, context)
  ErrorHandler.log(appError)
  return appError
}
