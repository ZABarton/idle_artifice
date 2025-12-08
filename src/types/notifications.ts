/**
 * Notifications system types for managing toast notifications
 */

/**
 * Type of notification to determine styling and icon
 */
export type NotificationType = 'success' | 'info' | 'warning' | 'error'

/**
 * Represents a notification to be displayed to the user
 */
export interface Notification {
  /** Unique identifier for this notification */
  id: string
  /** Type of notification (affects styling and icon) */
  type: NotificationType
  /** Main title/heading of the notification */
  title: string
  /** Optional detailed message */
  message?: string
  /** Timestamp when notification was created */
  createdAt: Date
  /** Auto-dismiss timeout in milliseconds (0 = no auto-dismiss) */
  timeout: number
}
