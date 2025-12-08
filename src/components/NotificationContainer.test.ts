import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import NotificationContainer from './NotificationContainer.vue'
import { useNotificationsStore } from '@/stores/notifications'

describe('NotificationContainer', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  describe('Rendering', () => {
    it('renders without errors when no notifications', () => {
      const wrapper = mount(NotificationContainer)
      expect(wrapper.find('.notification-container').exists()).toBe(true)
    })

    it('renders notification from store', () => {
      const notificationsStore = useNotificationsStore()
      notificationsStore.addNotification('success', 'Test Notification', 'Test message', 0)

      const wrapper = mount(NotificationContainer)

      expect(wrapper.find('.notification').exists()).toBe(true)
      expect(wrapper.find('.notification-title').text()).toBe('Test Notification')
      expect(wrapper.find('.notification-message').text()).toBe('Test message')
    })

    it('renders multiple notifications', () => {
      const notificationsStore = useNotificationsStore()
      notificationsStore.addNotification('success', 'First', 'First message', 0)
      notificationsStore.addNotification('info', 'Second', 'Second message', 0)
      notificationsStore.addNotification('warning', 'Third', 'Third message', 0)

      const wrapper = mount(NotificationContainer)

      const notifications = wrapper.findAll('.notification')
      expect(notifications).toHaveLength(3)
    })

    it('renders notification without message', () => {
      const notificationsStore = useNotificationsStore()
      notificationsStore.addNotification('success', 'Title Only', undefined, 0)

      const wrapper = mount(NotificationContainer)

      expect(wrapper.find('.notification-title').text()).toBe('Title Only')
      expect(wrapper.find('.notification-message').exists()).toBe(false)
    })

    it('renders close button', () => {
      const notificationsStore = useNotificationsStore()
      notificationsStore.addNotification('success', 'Test', 'Message', 0)

      const wrapper = mount(NotificationContainer)

      expect(wrapper.find('.notification-close').exists()).toBe(true)
    })
  })

  describe('Notification Types', () => {
    it('renders success notification with correct styling', () => {
      const notificationsStore = useNotificationsStore()
      notificationsStore.showSuccess('Success!', 'Operation completed', 0)

      const wrapper = mount(NotificationContainer)

      const notification = wrapper.find('.notification')
      expect(notification.classes()).toContain('notification-success')
      expect(wrapper.find('.notification-icon').text()).toBe('✓')
    })

    it('renders info notification with correct styling', () => {
      const notificationsStore = useNotificationsStore()
      notificationsStore.showInfo('Info', 'Information message', 0)

      const wrapper = mount(NotificationContainer)

      const notification = wrapper.find('.notification')
      expect(notification.classes()).toContain('notification-info')
      expect(wrapper.find('.notification-icon').text()).toBe('ℹ')
    })

    it('renders warning notification with correct styling', () => {
      const notificationsStore = useNotificationsStore()
      notificationsStore.showWarning('Warning', 'Be careful', 0)

      const wrapper = mount(NotificationContainer)

      const notification = wrapper.find('.notification')
      expect(notification.classes()).toContain('notification-warning')
      expect(wrapper.find('.notification-icon').text()).toBe('⚠')
    })

    it('renders error notification with correct styling', () => {
      const notificationsStore = useNotificationsStore()
      notificationsStore.showError('Error', 'Something went wrong', 0)

      const wrapper = mount(NotificationContainer)

      const notification = wrapper.find('.notification')
      expect(notification.classes()).toContain('notification-error')
      expect(wrapper.find('.notification-icon').text()).toBe('✕')
    })
  })

  describe('Dismissal', () => {
    it('dismisses notification when close button is clicked', async () => {
      const notificationsStore = useNotificationsStore()
      const id = notificationsStore.addNotification('success', 'Test', 'Message', 0)

      const wrapper = mount(NotificationContainer)

      expect(wrapper.find('.notification').exists()).toBe(true)

      await wrapper.find('.notification-close').trigger('click')

      expect(notificationsStore.activeNotifications.find((n) => n.id === id)).toBeUndefined()
      await wrapper.vm.$nextTick()
      expect(wrapper.find('.notification').exists()).toBe(false)
    })

    it('dismisses notification when notification body is clicked', async () => {
      const notificationsStore = useNotificationsStore()
      const id = notificationsStore.addNotification('success', 'Test', 'Message', 0)

      const wrapper = mount(NotificationContainer)

      await wrapper.find('.notification').trigger('click')

      expect(notificationsStore.activeNotifications.find((n) => n.id === id)).toBeUndefined()
      await wrapper.vm.$nextTick()
      expect(wrapper.find('.notification').exists()).toBe(false)
    })

    it('stops propagation when close button is clicked', async () => {
      const notificationsStore = useNotificationsStore()
      notificationsStore.addNotification('success', 'Test', 'Message', 0)

      const wrapper = mount(NotificationContainer)

      const notification = wrapper.find('.notification')
      const closeButton = wrapper.find('.notification-close')

      let notificationClicked = false
      notification.element.addEventListener('click', () => {
        notificationClicked = true
      })

      await closeButton.trigger('click')

      // The event should have been stopped, so the parent notification click handler shouldn't fire twice
      expect(notificationsStore.activeNotifications).toHaveLength(0)
    })
  })

  describe('Auto-dismiss', () => {
    it('auto-dismisses notification after timeout', async () => {
      const notificationsStore = useNotificationsStore()
      notificationsStore.addNotification('success', 'Test', 'Message', 2000)

      const wrapper = mount(NotificationContainer)

      expect(wrapper.find('.notification').exists()).toBe(true)

      // Fast-forward time
      vi.advanceTimersByTime(2000)
      await wrapper.vm.$nextTick()

      expect(wrapper.find('.notification').exists()).toBe(false)
      expect(notificationsStore.activeNotifications).toHaveLength(0)
    })

    it('does not auto-dismiss when timeout is 0', async () => {
      const notificationsStore = useNotificationsStore()
      notificationsStore.addNotification('success', 'Test', 'Message', 0)

      const wrapper = mount(NotificationContainer)

      expect(wrapper.find('.notification').exists()).toBe(true)

      // Fast-forward time
      vi.advanceTimersByTime(10000)
      await wrapper.vm.$nextTick()

      // Should still be there
      expect(wrapper.find('.notification').exists()).toBe(true)
      expect(notificationsStore.activeNotifications).toHaveLength(1)
    })

    it('respects custom timeout values', async () => {
      const notificationsStore = useNotificationsStore()
      notificationsStore.addNotification('success', 'Test', 'Message', 1000)

      const wrapper = mount(NotificationContainer)

      // Not dismissed yet
      vi.advanceTimersByTime(500)
      await wrapper.vm.$nextTick()
      expect(wrapper.find('.notification').exists()).toBe(true)

      // Now dismissed
      vi.advanceTimersByTime(500)
      await wrapper.vm.$nextTick()
      expect(wrapper.find('.notification').exists()).toBe(false)
    })
  })

  describe('Multiple Notifications', () => {
    it('stacks multiple notifications vertically', () => {
      const notificationsStore = useNotificationsStore()
      notificationsStore.addNotification('success', 'First', 'First message', 0)
      notificationsStore.addNotification('info', 'Second', 'Second message', 0)
      notificationsStore.addNotification('warning', 'Third', 'Third message', 0)

      const wrapper = mount(NotificationContainer)

      const notifications = wrapper.findAll('.notification')
      expect(notifications).toHaveLength(3)

      // Verify they all have unique content
      expect(notifications[0].find('.notification-title').text()).toBe('First')
      expect(notifications[1].find('.notification-title').text()).toBe('Second')
      expect(notifications[2].find('.notification-title').text()).toBe('Third')
    })

    it('removes specific notification without affecting others', async () => {
      const notificationsStore = useNotificationsStore()
      const id1 = notificationsStore.addNotification('success', 'First', 'First message', 0)
      const id2 = notificationsStore.addNotification('info', 'Second', 'Second message', 0)
      const id3 = notificationsStore.addNotification('warning', 'Third', 'Third message', 0)

      const wrapper = mount(NotificationContainer)

      // Remove the middle notification
      notificationsStore.removeNotification(id2)
      await wrapper.vm.$nextTick()

      const notifications = wrapper.findAll('.notification')
      expect(notifications).toHaveLength(2)
      expect(notifications[0].find('.notification-title').text()).toBe('First')
      expect(notifications[1].find('.notification-title').text()).toBe('Third')

      // Verify the IDs are correct
      const remaining = notificationsStore.activeNotifications.map((n) => n.id)
      expect(remaining).toContain(id1)
      expect(remaining).toContain(id3)
      expect(remaining).not.toContain(id2)
    })

    it('auto-dismisses notifications independently', async () => {
      const notificationsStore = useNotificationsStore()
      notificationsStore.addNotification('success', 'First', 'First message', 1000)
      notificationsStore.addNotification('info', 'Second', 'Second message', 2000)
      notificationsStore.addNotification('warning', 'Third', 'Third message', 3000)

      const wrapper = mount(NotificationContainer)

      expect(wrapper.findAll('.notification')).toHaveLength(3)

      // After 1000ms, first should be dismissed
      vi.advanceTimersByTime(1000)
      await wrapper.vm.$nextTick()
      expect(wrapper.findAll('.notification')).toHaveLength(2)

      // After another 1000ms (2000ms total), second should be dismissed
      vi.advanceTimersByTime(1000)
      await wrapper.vm.$nextTick()
      expect(wrapper.findAll('.notification')).toHaveLength(1)

      // After another 1000ms (3000ms total), third should be dismissed
      vi.advanceTimersByTime(1000)
      await wrapper.vm.$nextTick()
      expect(wrapper.findAll('.notification')).toHaveLength(0)
    })
  })

  describe('Reactivity', () => {
    it('updates when notifications are added to store', async () => {
      const notificationsStore = useNotificationsStore()
      const wrapper = mount(NotificationContainer)

      expect(wrapper.findAll('.notification')).toHaveLength(0)

      notificationsStore.addNotification('success', 'New', 'Message', 0)
      await wrapper.vm.$nextTick()

      expect(wrapper.findAll('.notification')).toHaveLength(1)
    })

    it('updates when notifications are removed from store', async () => {
      const notificationsStore = useNotificationsStore()
      const id1 = notificationsStore.addNotification('success', 'First', 'Message', 0)
      const id2 = notificationsStore.addNotification('info', 'Second', 'Message', 0)

      const wrapper = mount(NotificationContainer)

      expect(wrapper.findAll('.notification')).toHaveLength(2)

      notificationsStore.removeNotification(id1)
      await wrapper.vm.$nextTick()

      expect(wrapper.findAll('.notification')).toHaveLength(1)

      notificationsStore.removeNotification(id2)
      await wrapper.vm.$nextTick()

      expect(wrapper.findAll('.notification')).toHaveLength(0)
    })

    it('updates when all notifications are cleared', async () => {
      const notificationsStore = useNotificationsStore()
      notificationsStore.addNotification('success', 'First', 'Message', 0)
      notificationsStore.addNotification('info', 'Second', 'Message', 0)
      notificationsStore.addNotification('warning', 'Third', 'Message', 0)

      const wrapper = mount(NotificationContainer)

      expect(wrapper.findAll('.notification')).toHaveLength(3)

      notificationsStore.clearAllNotifications()
      await wrapper.vm.$nextTick()

      expect(wrapper.findAll('.notification')).toHaveLength(0)
    })
  })

  describe('Helper Methods', () => {
    it('showSuccess helper creates success notification', async () => {
      const notificationsStore = useNotificationsStore()
      const wrapper = mount(NotificationContainer)

      notificationsStore.showSuccess('Success!', 'It worked!', 0)
      await wrapper.vm.$nextTick()

      expect(wrapper.find('.notification-success').exists()).toBe(true)
      expect(wrapper.find('.notification-title').text()).toBe('Success!')
      expect(wrapper.find('.notification-message').text()).toBe('It worked!')
    })

    it('showInfo helper creates info notification', async () => {
      const notificationsStore = useNotificationsStore()
      const wrapper = mount(NotificationContainer)

      notificationsStore.showInfo('Info', 'FYI', 0)
      await wrapper.vm.$nextTick()

      expect(wrapper.find('.notification-info').exists()).toBe(true)
      expect(wrapper.find('.notification-title').text()).toBe('Info')
    })

    it('showWarning helper creates warning notification', async () => {
      const notificationsStore = useNotificationsStore()
      const wrapper = mount(NotificationContainer)

      notificationsStore.showWarning('Warning', 'Be careful', 0)
      await wrapper.vm.$nextTick()

      expect(wrapper.find('.notification-warning').exists()).toBe(true)
      expect(wrapper.find('.notification-title').text()).toBe('Warning')
    })

    it('showError helper creates error notification', async () => {
      const notificationsStore = useNotificationsStore()
      const wrapper = mount(NotificationContainer)

      notificationsStore.showError('Error', 'Something broke', 0)
      await wrapper.vm.$nextTick()

      expect(wrapper.find('.notification-error').exists()).toBe(true)
      expect(wrapper.find('.notification-title').text()).toBe('Error')
    })
  })

  describe('Icon Display', () => {
    it('displays correct icon for each notification type', () => {
      const notificationsStore = useNotificationsStore()
      notificationsStore.showSuccess('Success', undefined, 0)
      notificationsStore.showInfo('Info', undefined, 0)
      notificationsStore.showWarning('Warning', undefined, 0)
      notificationsStore.showError('Error', undefined, 0)

      const wrapper = mount(NotificationContainer)

      const notifications = wrapper.findAll('.notification')
      expect(notifications[0].find('.notification-icon').text()).toBe('✓')
      expect(notifications[1].find('.notification-icon').text()).toBe('ℹ')
      expect(notifications[2].find('.notification-icon').text()).toBe('⚠')
      expect(notifications[3].find('.notification-icon').text()).toBe('✕')
    })
  })

  describe('Content Structure', () => {
    it('renders notification with icon, content, and close button', () => {
      const notificationsStore = useNotificationsStore()
      notificationsStore.addNotification('success', 'Title', 'Message', 0)

      const wrapper = mount(NotificationContainer)

      const notification = wrapper.find('.notification')
      expect(notification.find('.notification-icon').exists()).toBe(true)
      expect(notification.find('.notification-content').exists()).toBe(true)
      expect(notification.find('.notification-title').exists()).toBe(true)
      expect(notification.find('.notification-message').exists()).toBe(true)
      expect(notification.find('.notification-close').exists()).toBe(true)
    })

    it('notification content is within notification-content div', () => {
      const notificationsStore = useNotificationsStore()
      notificationsStore.addNotification('success', 'Title', 'Message', 0)

      const wrapper = mount(NotificationContainer)

      const content = wrapper.find('.notification-content')
      expect(content.find('.notification-title').exists()).toBe(true)
      expect(content.find('.notification-message').exists()).toBe(true)
    })
  })

  describe('Edge Cases', () => {
    it('handles empty title gracefully', () => {
      const notificationsStore = useNotificationsStore()
      notificationsStore.addNotification('success', '', 'Message', 0)

      const wrapper = mount(NotificationContainer)

      expect(wrapper.find('.notification').exists()).toBe(true)
      expect(wrapper.find('.notification-title').text()).toBe('')
    })

    it('handles very long titles', () => {
      const notificationsStore = useNotificationsStore()
      const longTitle = 'This is a very long title that should still render correctly'.repeat(5)
      notificationsStore.addNotification('success', longTitle, 'Message', 0)

      const wrapper = mount(NotificationContainer)

      expect(wrapper.find('.notification-title').text()).toBe(longTitle)
    })

    it('handles very long messages', () => {
      const notificationsStore = useNotificationsStore()
      const longMessage = 'This is a very long message that should still render correctly'.repeat(
        10
      )
      notificationsStore.addNotification('success', 'Title', longMessage, 0)

      const wrapper = mount(NotificationContainer)

      expect(wrapper.find('.notification-message').text()).toBe(longMessage)
    })

    it('handles rapid notification additions', async () => {
      const notificationsStore = useNotificationsStore()
      const wrapper = mount(NotificationContainer)

      // Add 10 notifications rapidly
      for (let i = 0; i < 10; i++) {
        notificationsStore.addNotification('success', `Notification ${i}`, `Message ${i}`, 0)
      }

      await wrapper.vm.$nextTick()

      expect(wrapper.findAll('.notification')).toHaveLength(10)
    })

    it('handles rapid notification removals', async () => {
      const notificationsStore = useNotificationsStore()
      const ids: string[] = []

      // Add notifications
      for (let i = 0; i < 5; i++) {
        ids.push(notificationsStore.addNotification('success', `Notification ${i}`, 'Message', 0))
      }

      const wrapper = mount(NotificationContainer)
      expect(wrapper.findAll('.notification')).toHaveLength(5)

      // Remove them all rapidly
      ids.forEach((id) => notificationsStore.removeNotification(id))
      await wrapper.vm.$nextTick()

      expect(wrapper.findAll('.notification')).toHaveLength(0)
    })
  })
})
