import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Notification, NotificationType } from '@/types/notifications'

/**
 * Notifications Store
 * Manages toast notifications shown to the user
 */
export const useNotificationsStore = defineStore('notifications', () => {
  // State
  const notifications = ref<Notification[]>([])
  let nextId = 0

  // Getters

  /**
   * Get all active notifications
   */
  const activeNotifications = computed(() => notifications.value)

  // Actions

  /**
   * Add a new notification to the queue
   * @param type - Type of notification (success, info, warning, error)
   * @param title - Main title/heading
   * @param message - Optional detailed message
   * @param timeout - Auto-dismiss timeout in milliseconds (default: 4000ms)
   * @returns The notification ID
   */
  function addNotification(
    type: NotificationType,
    title: string,
    message?: string,
    timeout: number = 4000
  ): string {
    const id = `notification-${nextId++}`
    const notification: Notification = {
      id,
      type,
      title,
      message,
      createdAt: new Date(),
      timeout,
    }

    notifications.value.push(notification)

    // Auto-dismiss if timeout is set
    if (timeout > 0) {
      setTimeout(() => {
        removeNotification(id)
      }, timeout)
    }

    return id
  }

  /**
   * Remove a notification by ID
   */
  function removeNotification(id: string): boolean {
    const index = notifications.value.findIndex((n) => n.id === id)
    if (index === -1) {
      return false
    }

    notifications.value.splice(index, 1)
    return true
  }

  /**
   * Clear all notifications
   */
  function clearAllNotifications() {
    notifications.value = []
  }

  /**
   * Helper method to show a success notification
   */
  function showSuccess(title: string, message?: string, timeout?: number): string {
    return addNotification('success', title, message, timeout)
  }

  /**
   * Helper method to show an info notification
   */
  function showInfo(title: string, message?: string, timeout?: number): string {
    return addNotification('info', title, message, timeout)
  }

  /**
   * Helper method to show a warning notification
   */
  function showWarning(title: string, message?: string, timeout?: number): string {
    return addNotification('warning', title, message, timeout)
  }

  /**
   * Helper method to show an error notification
   */
  function showError(title: string, message?: string, timeout?: number): string {
    return addNotification('error', title, message, timeout)
  }

  return {
    // State
    notifications,
    // Getters
    activeNotifications,
    // Actions
    addNotification,
    removeNotification,
    clearAllNotifications,
    showSuccess,
    showInfo,
    showWarning,
    showError,
  }
})
