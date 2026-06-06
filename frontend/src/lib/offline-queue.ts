/**
 * Offline message queue
 * Queues messages when offline and syncs when connection returns
 */

import React from 'react'

export interface QueuedMessage {
  id: string
  conversationId: string
  body: string
  timestamp: number
  status: 'pending' | 'sent' | 'failed'
  error?: string
  attempt: number
}

const QUEUE_KEY = 'message_queue'
const MAX_RETRIES = 3
const RETRY_DELAY = 1000 // 1 second

export class OfflineMessageQueue {
  private static queue: QueuedMessage[] = []
  private static listeners: Set<(queue: QueuedMessage[]) => void> = new Set()
  private static isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true
  private static retryTimer: NodeJS.Timeout | null = null

  static {
    // Load from storage
    if (typeof window !== 'undefined') {
      this.loadFromStorage()

      // Listen for online/offline events
      window.addEventListener('online', () => this.handleOnline())
      window.addEventListener('offline', () => this.handleOffline())
    }
  }

  /**
   * Add message to queue
   */
  static addMessage(conversationId: string, body: string): QueuedMessage {
    const message: QueuedMessage = {
      id: `pending_${Date.now()}_${Math.random()}`,
      conversationId,
      body,
      timestamp: Date.now(),
      status: 'pending',
      attempt: 0,
    }

    this.queue.push(message)
    this.saveToStorage()
    this.notifyListeners()

    return message
  }

  /**
   * Mark message as sent
   */
  static markAsSent(messageId: string): void {
    const message = this.queue.find(m => m.id === messageId)
    if (message) {
      message.status = 'sent'
      this.saveToStorage()
      this.notifyListeners()
    }
  }

  /**
   * Mark message as failed
   */
  static markAsFailed(messageId: string, error: string): void {
    const message = this.queue.find(m => m.id === messageId)
    if (message) {
      message.status = 'failed'
      message.error = error
      message.attempt += 1
      this.saveToStorage()
      this.notifyListeners()
    }
  }

  /**
   * Remove message from queue
   */
  static removeMessage(messageId: string): void {
    this.queue = this.queue.filter(m => m.id !== messageId)
    this.saveToStorage()
    this.notifyListeners()
  }

  /**
   * Get pending messages
   */
  static getPending(): QueuedMessage[] {
    return this.queue.filter(m => m.status === 'pending')
  }

  /**
   * Get failed messages
   */
  static getFailed(): QueuedMessage[] {
    return this.queue.filter(m => m.status === 'failed' && m.attempt < MAX_RETRIES)
  }

  /**
   * Get all queued messages
   */
  static getAll(): QueuedMessage[] {
    return [...this.queue]
  }

  /**
   * Get queue for conversation
   */
  static getForConversation(conversationId: string): QueuedMessage[] {
    return this.queue.filter(m => m.conversationId === conversationId)
  }

  /**
   * Clear queue
   */
  static clear(): void {
    this.queue = []
    this.saveToStorage()
    this.notifyListeners()
  }

  /**
   * Subscribe to queue changes
   */
  static subscribe(listener: (queue: QueuedMessage[]) => void): () => void {
    this.listeners.add(listener)

    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener)
    }
  }

  /**
   * Handle connection coming back online
   */
  private static handleOnline(): void {
    this.isOnline = true
    this.notifyListeners()

    // Retry failed messages
    const failed = this.getFailed()
    if (failed.length > 0) {
      this.retryMessages(failed)
    }
  }

  /**
   * Handle connection going offline
   */
  private static handleOffline(): void {
    this.isOnline = false
    this.notifyListeners()

    // Clear any pending retry timers
    if (this.retryTimer) {
      clearTimeout(this.retryTimer)
      this.retryTimer = null
    }
  }

  /**
   * Retry failed messages
   */
  private static retryMessages(messages: QueuedMessage[]): void {
    // Notify via callback - actual retry is handled by the UI
    this.notifyListeners()
  }

  /**
   * Notify all listeners of queue changes
   */
  private static notifyListeners(): void {
    const snapshot = [...this.queue]
    this.listeners.forEach(listener => listener(snapshot))
  }

  /**
   * Save queue to local storage
   */
  private static saveToStorage(): void {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(QUEUE_KEY, JSON.stringify(this.queue))
      } catch (e) {
        console.error('Failed to save queue to storage:', e)
      }
    }
  }

  /**
   * Load queue from local storage
   */
  private static loadFromStorage(): void {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(QUEUE_KEY)
        if (stored) {
          this.queue = JSON.parse(stored)
        }
      } catch (e) {
        console.error('Failed to load queue from storage:', e)
        this.queue = []
      }
    }
  }

  /**
   * Get online status
   */
  static isConnected(): boolean {
    return this.isOnline && (typeof navigator === 'undefined' || navigator.onLine)
  }
}

/**
 * React hook for offline queue
 */
export function useOfflineQueue() {
  const [queue, setQueue] = React.useState<QueuedMessage[]>(OfflineMessageQueue.getAll())
  const [isOnline, setIsOnline] = React.useState(OfflineMessageQueue.isConnected())

  React.useEffect(() => {
    // Subscribe to queue changes
    const unsubscribe = OfflineMessageQueue.subscribe(setQueue)

    // Update online status
    const updateOnline = () => setIsOnline(OfflineMessageQueue.isConnected())
    window.addEventListener('online', updateOnline)
    window.addEventListener('offline', updateOnline)

    return () => {
      unsubscribe()
      window.removeEventListener('online', updateOnline)
      window.removeEventListener('offline', updateOnline)
    }
  }, [])

  return {
    queue,
    isOnline,
    pending: queue.filter(m => m.status === 'pending'),
    failed: queue.filter(m => m.status === 'failed'),
  }
}
