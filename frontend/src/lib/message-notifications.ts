/**
 * Message notification utilities
 * Handles push notifications, toast notifications, and notification sounds
 */

import React from 'react'
import { ErrorHandler } from './error-handler'

interface NotificationOptions {
  title: string
  body?: string
  icon?: string
  tag?: string
  badge?: string
  sound?: boolean
  vibrate?: boolean
  onClick?: () => void
}

class MessageNotificationManager {
  private notificationPermission: NotificationPermission = 'default'
  private soundEnabled = true
  private toastContainer: HTMLElement | null = null
  private activeToasts = new Map<string, HTMLElement>()

  constructor() {
    this.initNotifications()
    this.loadPreferences()
  }

  /**
   * Initialize notification system
   */
  private initNotifications(): void {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      console.warn('Notifications not supported')
      return
    }

    this.notificationPermission = Notification.permission

    // Create toast container
    this.toastContainer = document.createElement('div')
    this.toastContainer.id = 'message-toast-container'
    this.toastContainer.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 1000;
      pointer-events: none;
    `
    document.body.appendChild(this.toastContainer)
  }

  /**
   * Request notification permission
   */
  async requestPermission(): Promise<boolean> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return false
    }

    if (Notification.permission === 'granted') {
      return true
    }

    if (Notification.permission === 'denied') {
      return false
    }

    try {
      const permission = await Notification.requestPermission()
      this.notificationPermission = permission
      return permission === 'granted'
    } catch (error) {
      console.error('Failed to request notification permission:', error)
      return false
    }
  }

  /**
   * Show a native notification
   */
  async showNotification(options: NotificationOptions): Promise<Notification | null> {
    if (!('Notification' in window)) {
      return null
    }

    // Request permission if needed
    if (this.notificationPermission !== 'granted') {
      const granted = await this.requestPermission()
      if (!granted) {
        return null
      }
    }

    try {
      const notification = new Notification(options.title, {
        body: options.body,
        icon: options.icon || '/logo.png',
        badge: options.badge || '/logo.png',
        tag: options.tag,
      })

      if (options.onClick) {
        notification.onclick = () => {
          options.onClick?.()
          notification.close()
          window.focus()
        }
      }

      // Play sound if enabled
      if (options.sound && this.soundEnabled) {
        this.playNotificationSound()
      }

      // Vibrate if enabled
      if (options.vibrate && 'vibrate' in navigator) {
        navigator.vibrate?.([200, 100, 200])
      }

      return notification
    } catch (error) {
      console.error('Failed to show notification:', error)
      return null
    }
  }

  /**
   * Show a toast notification
   */
  showToast(
    message: string,
    type: 'success' | 'error' | 'info' | 'warning' = 'info',
    duration = 4000
  ): void {
    if (!this.toastContainer) return

    const toastId = `toast_${Date.now()}_${Math.random()}`
    const toast = document.createElement('div')

    const bgColor = {
      success: 'bg-green-500',
      error: 'bg-red-500',
      info: 'bg-blue-500',
      warning: 'bg-yellow-500',
    }[type]

    toast.className = `
      ${bgColor} text-white px-6 py-3 rounded-lg shadow-lg
      mb-3 pointer-events-auto transform transition-all duration-300
      translate-x-0 opacity-100
    `
    toast.textContent = message
    toast.style.cssText = `
      max-width: 400px;
      word-wrap: break-word;
      animation: slideIn 0.3s ease-out;
    `

    this.toastContainer.appendChild(toast)
    this.activeToasts.set(toastId, toast)

    // Auto remove after duration
    setTimeout(() => {
      if (this.activeToasts.has(toastId)) {
        toast.style.opacity = '0'
        toast.style.transform = 'translateX(100%)'
        setTimeout(() => {
          toast.remove()
          this.activeToasts.delete(toastId)
        }, 300)
      }
    }, duration)
  }

  /**
   * Notify new message
   */
  async notifyNewMessage(senderName: string, messagePreview: string, conversationId: string): Promise<void> {
    const onClick = () => {
      // Navigate to conversation
      window.location.href = `/dashboard/messages?c=${conversationId}`
    }

    await this.showNotification({
      title: `New message from ${senderName}`,
      body: messagePreview.substring(0, 100),
      tag: `message_${conversationId}`,
      sound: true,
      vibrate: true,
      onClick,
    })

    this.showToast(`New message from ${senderName}`, 'info')
  }

  /**
   * Notify message failed
   */
  notifyMessageFailed(reason?: string): void {
    this.showToast(
      `Failed to send message${reason ? ': ' + reason : ''}`,
      'error'
    )
  }

  /**
   * Notify message sent
   */
  notifyMessageSent(): void {
    this.showToast('Message sent', 'success', 2000)
  }

  /**
   * Notify typing indicator
   */
  notifyTyping(userName: string): void {
    this.showToast(`${userName} is typing...`, 'info', 2000)
  }

  /**
   * Play notification sound
   */
  private playNotificationSound(): void {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()

      // Create a simple beep sound
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      oscillator.frequency.value = 800 // Hz
      oscillator.type = 'sine'

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5)

      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.5)
    } catch (error) {
      // Fallback: use built-in notification sound
      console.debug('Audio context not available, using default notification')
    }
  }

  /**
   * Load user preferences
   */
  private loadPreferences(): void {
    if (typeof localStorage === 'undefined') return

    try {
      const prefs = localStorage.getItem('notification_prefs')
      if (prefs) {
        const parsed = JSON.parse(prefs)
        this.soundEnabled = parsed.soundEnabled ?? true
      }
    } catch (error) {
      console.debug('Failed to load notification preferences')
    }
  }

  /**
   * Save user preferences
   */
  savePreferences(options: { soundEnabled?: boolean }): void {
    if (typeof localStorage === 'undefined') return

    try {
      if (options.soundEnabled !== undefined) {
        this.soundEnabled = options.soundEnabled
      }

      localStorage.setItem('notification_prefs', JSON.stringify({
        soundEnabled: this.soundEnabled,
      }))
    } catch (error) {
      console.debug('Failed to save notification preferences')
    }
  }

  /**
   * Clear all active toasts
   */
  clearToasts(): void {
    this.activeToasts.forEach(toast => toast.remove())
    this.activeToasts.clear()
  }
}

// Create singleton instance
export const messageNotifications = new MessageNotificationManager()

/**
 * React hook for message notifications
 */
export function useMessageNotifications() {
  const [permission, setPermission] = React.useState<NotificationPermission>(
    typeof window !== 'undefined' && 'Notification' in window
      ? Notification.permission
      : 'denied'
  )

  const requestPermission = async () => {
    const granted = await messageNotifications.requestPermission()
    setPermission(granted ? 'granted' : 'denied')
    return granted
  }

  return {
    permission,
    requestPermission,
    notify: messageNotifications.showNotification.bind(messageNotifications),
    toast: messageNotifications.showToast.bind(messageNotifications),
    notifyNewMessage: messageNotifications.notifyNewMessage.bind(messageNotifications),
    notifyMessageFailed: messageNotifications.notifyMessageFailed.bind(messageNotifications),
    notifyMessageSent: messageNotifications.notifyMessageSent.bind(messageNotifications),
  }
}
