/**
 * Edge case handling utilities
 * Handles common edge cases and boundary conditions
 */

/**
 * Safe string truncation with ellipsis
 */
export function truncateString(
  text: string,
  maxLength: number,
  ellipsis = '...'
): string {
  if (!text || text.length <= maxLength) return text
  return text.substring(0, maxLength - ellipsis.length) + ellipsis
}

/**
 * Safe JSON parse with fallback
 */
export function safeJsonParse<T = any>(
  json: string,
  fallback: T | null = null
): T | null {
  try {
    return JSON.parse(json) as T
  } catch {
    return fallback
  }
}

/**
 * Safe JSON stringify
 */
export function safeJsonStringify(value: any, fallback = '{}'): string {
  try {
    return JSON.stringify(value)
  } catch {
    return fallback
  }
}

/**
 * Handle null/undefined gracefully
 */
export function coalesce<T>(...values: (T | null | undefined)[]): T | null {
  return values.find(v => v != null) ?? null
}

/**
 * Safe array access
 */
export function safeArrayAccess<T>(arr: T[] | null | undefined, index: number, fallback: T | null = null): T | null {
  if (!Array.isArray(arr) || index < 0 || index >= arr.length) {
    return fallback
  }
  return arr[index]
}

/**
 * Handle large number formatting
 */
export function formatLargeNumber(num: number): string {
  if (num >= 1_000_000) {
    return (num / 1_000_000).toFixed(1) + 'M'
  }
  if (num >= 1_000) {
    return (num / 1_000).toFixed(1) + 'K'
  }
  return num.toString()
}

/**
 * Handle division by zero
 */
export function safeDivide(numerator: number, denominator: number, fallback = 0): number {
  if (denominator === 0) return fallback
  return numerator / denominator
}

/**
 * Validate email with fallback
 */
export function isValidEmail(email: string | null | undefined): boolean {
  if (!email || typeof email !== 'string') return false
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Validate URL
 */
export function isValidUrl(url: string | null | undefined): boolean {
  if (!url || typeof url !== 'string') return false
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

/**
 * Handle array mutations safely (prevent accidental mutations)
 */
export function immutableUpdate<T extends Record<string, any>>(
  obj: T,
  updates: Partial<T>
): T {
  return { ...obj, ...updates }
}

/**
 * Handle deeply nested object access
 */
export function getNestedValue(obj: any, path: string, fallback = null): any {
  const keys = path.split('.')
  let value = obj

  for (const key of keys) {
    if (value == null) return fallback
    value = value[key]
  }

  return value ?? fallback
}

/**
 * Ensure array length doesn't exceed limit
 */
export function limitArrayLength<T>(arr: T[], maxLength: number): T[] {
  return arr.slice(0, maxLength)
}

/**
 * Handle dates safely
 */
export function safeParseDate(dateString: string | null | undefined, fallback = new Date()): Date {
  if (!dateString || typeof dateString !== 'string') return fallback
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return fallback
    return date
  } catch {
    return fallback
  }
}

/**
 * Clamp number between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

/**
 * Handle recursive data structures (prevent infinite loops)
 */
export function isCircularReference(obj: any, seen = new WeakSet()): boolean {
  if (typeof obj !== 'object' || obj === null) return false

  if (seen.has(obj)) return true

  seen.add(obj)

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      if (isCircularReference(obj[key], seen)) return true
    }
  }

  seen.delete(obj)
  return false
}

/**
 * Safe increment with upper limit
 */
export function safeIncrement(value: number, increment = 1, maxValue = Infinity): number {
  return Math.min(value + increment, maxValue)
}

/**
 * Safe decrement with lower limit
 */
export function safeDecrement(value: number, decrement = 1, minValue = 0): number {
  return Math.max(value - decrement, minValue)
}

/**
 * Handle concurrent modifications (optimistic updates)
 */
export function applyOptimisticUpdate<T extends { id: string }>(
  items: T[],
  id: string,
  updates: Partial<T>
): T[] {
  return items.map(item =>
    item.id === id ? { ...item, ...updates } : item
  )
}

/**
 * Rollback optimistic update on failure
 */
export function rollbackOptimisticUpdate<T extends { id: string }>(
  items: T[],
  id: string,
  previousValue: T | null
): T[] {
  if (!previousValue) {
    return items.filter(item => item.id !== id)
  }

  return items.map(item =>
    item.id === id ? previousValue : item
  )
}

/**
 * Handle pagination edge cases
 */
export function validatePaginationParams(
  page: number,
  limit: number,
  total: number
): { page: number; limit: number } {
  const validPage = Math.max(1, Math.floor(page))
  const validLimit = clamp(Math.floor(limit), 1, 100)
  const maxPage = Math.ceil(total / validLimit) || 1
  const finalPage = Math.min(validPage, maxPage)

  return { page: finalPage, limit: validLimit }
}

/**
 * Handle permission checks safely
 */
export function hasPermission(
  userPermissions: string[] | null | undefined,
  requiredPermission: string
): boolean {
  if (!Array.isArray(userPermissions)) return false
  return userPermissions.includes(requiredPermission)
}

/**
 * Handle type coercion safely
 */
export function toBoolean(value: any): boolean {
  if (typeof value === 'boolean') return value
  if (typeof value === 'string') {
    return value.toLowerCase() === 'true'
  }
  return Boolean(value)
}

/**
 * Deduplicate array safely
 */
export function deduplicateArray<T>(arr: T[], key?: (item: T) => any): T[] {
  if (!Array.isArray(arr)) return []

  if (key) {
    const seen = new Set()
    return arr.filter(item => {
      const k = key(item)
      if (seen.has(k)) return false
      seen.add(k)
      return true
    })
  }

  return Array.from(new Set(arr))
}

/**
 * Flatten nested arrays with depth limit
 */
export function flattenArray<T>(arr: any[], depth = Infinity, currentDepth = 0): T[] {
  if (currentDepth >= depth) return arr as T[]

  return arr.reduce((acc, val) => {
    if (Array.isArray(val)) {
      acc.push(...flattenArray(val, depth, currentDepth + 1))
    } else {
      acc.push(val)
    }
    return acc
  }, [])
}
