/**
 * Concurrent operation utilities
 * Handles concurrent API requests with proper concurrency control
 */

import React from 'react'

export interface ConcurrencyConfig {
  maxConcurrent: number
  timeoutMs: number
}

export interface OperationResult<T> {
  success: boolean
  data?: T
  error?: Error
  timeMs: number
}

const DEFAULT_CONFIG: ConcurrencyConfig = {
  maxConcurrent: 5,
  timeoutMs: 10000,
}

/**
 * Queue for managing concurrent operations
 */
export class ConcurrencyQueue<T> {
  private queue: Array<() => Promise<T>> = []
  private active = 0
  private config: ConcurrencyConfig

  constructor(config: Partial<ConcurrencyConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  /**
   * Add operation to queue
   */
  add(operation: () => Promise<T>): Promise<OperationResult<T>> {
    return new Promise((resolve) => {
      this.queue.push(async () => {
        const startTime = Date.now()

        try {
          const data = await Promise.race([
            operation(),
            new Promise<never>((_, reject) =>
              setTimeout(
                () => reject(new Error('Operation timeout')),
                this.config.timeoutMs
              )
            ),
          ])

          resolve({
            success: true,
            data,
            timeMs: Date.now() - startTime,
          })
        } catch (error) {
          resolve({
            success: false,
            error: error as Error,
            timeMs: Date.now() - startTime,
          })
        }
      })

      this.process()
    })
  }

  /**
   * Process queue
   */
  private process(): void {
    while (this.active < this.config.maxConcurrent && this.queue.length > 0) {
      const operation = this.queue.shift()
      if (operation) {
        this.active++
        operation().then(() => {
          this.active--
          this.process()
        })
      }
    }
  }

  /**
   * Get queue stats
   */
  getStats() {
    return {
      queued: this.queue.length,
      active: this.active,
      maxConcurrent: this.config.maxConcurrent,
    }
  }

  /**
   * Clear queue
   */
  clear(): void {
    this.queue = []
  }
}

/**
 * Execute multiple operations with concurrency control
 */
export async function executeWithConcurrency<T>(
  operations: Array<() => Promise<T>>,
  config: Partial<ConcurrencyConfig> = {}
): Promise<OperationResult<T>[]> {
  const queue = new ConcurrencyQueue<T>(config)
  const results: OperationResult<T>[] = []

  const promises = operations.map(op =>
    queue.add(op).then(result => {
      results.push(result)
      return result
    })
  )

  await Promise.all(promises)
  return results
}

/**
 * Batch operations with limited concurrency
 */
export async function batchOperations<T, R>(
  items: T[],
  operation: (item: T) => Promise<R>,
  config: Partial<ConcurrencyConfig> = {}
): Promise<OperationResult<R>[]> {
  const operations = items.map(item => () => operation(item))
  return executeWithConcurrency(operations, config)
}

/**
 * React hook for concurrent operations
 */
export function useConcurrentOps<T>(
  config: Partial<ConcurrencyConfig> = {}
) {
  const queueRef = React.useRef(new ConcurrencyQueue<T>(config))
  const [stats, setStats] = React.useState(queueRef.current.getStats())
  const [results, setResults] = React.useState<OperationResult<T>[]>([])

  const execute = React.useCallback(
    async (operation: () => Promise<T>): Promise<OperationResult<T>> => {
      const result = await queueRef.current.add(operation)
      setStats(queueRef.current.getStats())
      setResults(prev => [...prev, result])
      return result
    },
    []
  )

  const executeBatch = React.useCallback(
    async (operations: Array<() => Promise<T>>): Promise<OperationResult<T>[]> => {
      const batchResults = await Promise.all(
        operations.map(op => queueRef.current.add(op))
      )
      setStats(queueRef.current.getStats())
      setResults(prev => [...prev, ...batchResults])
      return batchResults
    },
    []
  )

  const clear = React.useCallback(() => {
    queueRef.current.clear()
    setResults([])
    setStats(queueRef.current.getStats())
  }, [])

  return {
    execute,
    executeBatch,
    clear,
    stats,
    results,
  }
}

/**
 * Race multiple operations, return first success
 */
export async function raceOperations<T>(
  operations: Array<() => Promise<T>>,
  config: Partial<ConcurrencyConfig> = {}
): Promise<OperationResult<T>> {
  const finalConfig = { ...DEFAULT_CONFIG, ...config }

  const promises = operations.map(op =>
    Promise.race([
      op(),
      new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error('Operation timeout')),
          finalConfig.timeoutMs
        )
      ),
    ])
  )

  const startTime = Date.now()

  try {
    const data = await Promise.race(promises)
    return {
      success: true,
      data,
      timeMs: Date.now() - startTime,
    }
  } catch (error) {
    return {
      success: false,
      error: error as Error,
      timeMs: Date.now() - startTime,
    }
  }
}

/**
 * Debounce operation
 */
export function debounceOperation<T>(
  operation: () => Promise<T>,
  delayMs: number
): () => Promise<T> {
  let timeoutId: NodeJS.Timeout | null = null
  let lastPromise: Promise<T> | null = null

  return () => {
    return new Promise<T>((resolve, reject) => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }

      timeoutId = setTimeout(async () => {
        try {
          const result = await operation()
          lastPromise = Promise.resolve(result)
          resolve(result)
        } catch (error) {
          lastPromise = Promise.reject(error)
          reject(error)
        }
      }, delayMs)
    })
  }
}

/**
 * Throttle operation
 */
export function throttleOperation<T>(
  operation: () => Promise<T>,
  intervalMs: number
): () => Promise<T> {
  let lastExecuteTime = 0
  let lastPromise: Promise<T> | null = null

  return async () => {
    const now = Date.now()
    const timeSinceLastExecute = now - lastExecuteTime

    if (timeSinceLastExecute >= intervalMs) {
      lastExecuteTime = now
      lastPromise = operation()
      return lastPromise
    } else {
      if (lastPromise) {
        return lastPromise
      }

      // Wait and execute
      await new Promise(resolve =>
        setTimeout(resolve, intervalMs - timeSinceLastExecute)
      )
      lastExecuteTime = Date.now()
      lastPromise = operation()
      return lastPromise
    }
  }
}
