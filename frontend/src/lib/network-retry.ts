/**
 * Network retry utilities
 * Handles network errors with exponential backoff and retries
 */

import React from 'react'

export interface RetryConfig {
  maxRetries: number
  initialDelayMs: number
  maxDelayMs: number
  backoffMultiplier: number
  timeoutMs: number
}

export interface RetryResult<T> {
  success: boolean
  data?: T
  error?: Error
  attempts: number
  totalTimeMs: number
}

const DEFAULT_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 30000,
  backoffMultiplier: 2,
  timeoutMs: 10000,
}

/**
 * Retry a fetch request with exponential backoff
 */
export async function retryFetch<T = any>(
  url: string,
  options: RequestInit & { retryConfig?: Partial<RetryConfig> } = {}
): Promise<RetryResult<T>> {
  const { retryConfig: customConfig = {}, ...fetchOptions } = options
  const config = { ...DEFAULT_CONFIG, ...customConfig }

  let lastError: Error | null = null
  let delayMs = config.initialDelayMs
  const startTime = Date.now()

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      // Create abort controller for timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), config.timeoutMs)

      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      // Retry on 5xx or 429 (rate limit)
      if (response.status >= 500 || response.status === 429) {
        if (attempt === config.maxRetries) {
          throw new Error(`HTTP ${response.status}`)
        }

        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delayMs))
        delayMs = Math.min(delayMs * config.backoffMultiplier, config.maxDelayMs)
        continue
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()

      return {
        success: true,
        data: data as T,
        attempts: attempt + 1,
        totalTimeMs: Date.now() - startTime,
      }
    } catch (error) {
      lastError = error as Error

      // Don't retry on client errors (4xx except 429)
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        // Network error, might be retryable
        if (attempt < config.maxRetries) {
          await new Promise(resolve => setTimeout(resolve, delayMs))
          delayMs = Math.min(delayMs * config.backoffMultiplier, config.maxDelayMs)
          continue
        }
      } else if (error instanceof Error && error.name === 'AbortError') {
        // Timeout
        if (attempt < config.maxRetries) {
          await new Promise(resolve => setTimeout(resolve, delayMs))
          delayMs = Math.min(delayMs * config.backoffMultiplier, config.maxDelayMs)
          continue
        }
      }

      // Not retryable, fail immediately
      if (attempt === config.maxRetries) {
        break
      }
    }
  }

  return {
    success: false,
    error: lastError || new Error('Unknown error'),
    attempts: config.maxRetries + 1,
    totalTimeMs: Date.now() - startTime,
  }
}

/**
 * Retry a function with exponential backoff
 */
export async function retry<T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<RetryResult<T>> {
  const finalConfig = { ...DEFAULT_CONFIG, ...config }

  let lastError: Error | null = null
  let delayMs = finalConfig.initialDelayMs
  const startTime = Date.now()

  for (let attempt = 0; attempt <= finalConfig.maxRetries; attempt++) {
    try {
      const data = await Promise.race([
        fn(),
        new Promise<never>((_, reject) =>
          setTimeout(
            () => reject(new Error('Operation timeout')),
            finalConfig.timeoutMs
          )
        ),
      ])

      return {
        success: true,
        data,
        attempts: attempt + 1,
        totalTimeMs: Date.now() - startTime,
      }
    } catch (error) {
      lastError = error as Error

      if (attempt < finalConfig.maxRetries) {
        await new Promise(resolve => setTimeout(resolve, delayMs))
        delayMs = Math.min(
          delayMs * finalConfig.backoffMultiplier,
          finalConfig.maxDelayMs
        )
      }
    }
  }

  return {
    success: false,
    error: lastError || new Error('Unknown error'),
    attempts: finalConfig.maxRetries + 1,
    totalTimeMs: Date.now() - startTime,
  }
}

/**
 * Check if error is retryable
 */
export function isRetryableError(error: Error): boolean {
  if (error instanceof TypeError) {
    // Network errors
    return error.message.includes('Failed to fetch')
  }

  if (error instanceof Error) {
    // Timeout
    if (error.message.includes('timeout') || error.name === 'AbortError') {
      return true
    }
  }

  return false
}

/**
 * Calculate backoff delay
 */
export function calculateBackoffDelay(
  attempt: number,
  config: Partial<RetryConfig> = {}
): number {
  const finalConfig = { ...DEFAULT_CONFIG, ...config }

  let delay = finalConfig.initialDelayMs * Math.pow(finalConfig.backoffMultiplier, attempt)
  // Add jitter: ±10% randomness
  const jitter = delay * 0.1 * (Math.random() * 2 - 1)
  delay += jitter

  return Math.min(delay, finalConfig.maxDelayMs)
}

/**
 * React hook for retry logic
 */
export function useRetry<T>(
  config: Partial<RetryConfig> = {}
) {
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<Error | null>(null)
  const [attempts, setAttempts] = React.useState(0)

  const execute = React.useCallback(
    async (fn: () => Promise<T>): Promise<RetryResult<T>> => {
      setLoading(true)
      setError(null)

      const result = await retry(fn, config)

      setAttempts(result.attempts)

      if (!result.success) {
        setError(result.error || null)
      }

      setLoading(false)
      return result
    },
    [config]
  )

  return {
    execute,
    loading,
    error,
    attempts,
  }
}
