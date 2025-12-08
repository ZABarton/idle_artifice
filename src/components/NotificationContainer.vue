<script setup lang="ts">
import { computed } from 'vue'
import { useNotificationsStore } from '@/stores/notifications'
import type { Notification } from '@/types/notifications'

const notificationsStore = useNotificationsStore()

const notifications = computed(() => notificationsStore.activeNotifications)

function handleDismiss(id: string) {
  notificationsStore.removeNotification(id)
}

function getNotificationIcon(notification: Notification): string {
  switch (notification.type) {
    case 'success':
      return '✓'
    case 'info':
      return 'ℹ'
    case 'warning':
      return '⚠'
    case 'error':
      return '✕'
    default:
      return '•'
  }
}
</script>

<template>
  <div class="notification-container">
    <TransitionGroup name="notification" tag="div">
      <div
        v-for="notification in notifications"
        :key="notification.id"
        class="notification"
        :class="`notification-${notification.type}`"
        @click="handleDismiss(notification.id)"
      >
        <div class="notification-icon">
          {{ getNotificationIcon(notification) }}
        </div>
        <div class="notification-content">
          <div class="notification-title">{{ notification.title }}</div>
          <div v-if="notification.message" class="notification-message">
            {{ notification.message }}
          </div>
        </div>
        <button class="notification-close" @click.stop="handleDismiss(notification.id)">
          ×
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.notification-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 12px;
  pointer-events: none;
  max-width: 400px;
}

.notification {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  cursor: pointer;
  pointer-events: all;
  transition: all 0.2s ease;
  border-left: 4px solid;
  min-width: 300px;
}

.notification:hover {
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
  transform: translateY(-2px);
}

.notification-icon {
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: bold;
  color: white;
}

.notification-content {
  flex: 1;
  min-width: 0;
}

.notification-title {
  font-weight: bold;
  font-size: 1rem;
  color: #333;
  margin-bottom: 4px;
}

.notification-message {
  font-size: 0.9rem;
  color: #666;
  line-height: 1.4;
}

.notification-close {
  flex-shrink: 0;
  background: none;
  border: none;
  font-size: 24px;
  line-height: 1;
  cursor: pointer;
  color: #999;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.notification-close:hover {
  background: rgba(0, 0, 0, 0.05);
  color: #333;
}

/* Notification type-specific styles */
.notification-success {
  border-left-color: #4caf50;
}

.notification-success .notification-icon {
  background: #4caf50;
}

.notification-info {
  border-left-color: #2196f3;
}

.notification-info .notification-icon {
  background: #2196f3;
}

.notification-warning {
  border-left-color: #ff9800;
}

.notification-warning .notification-icon {
  background: #ff9800;
}

.notification-error {
  border-left-color: #f44336;
}

.notification-error .notification-icon {
  background: #f44336;
}

/* Transition animations */
.notification-enter-active {
  animation: slide-in 0.3s ease-out;
}

.notification-leave-active {
  animation: fade-out 0.2s ease-in;
}

@keyframes slide-in {
  from {
    opacity: 0;
    transform: translateX(100%);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes fade-out {
  from {
    opacity: 1;
    transform: scale(1);
  }
  to {
    opacity: 0;
    transform: scale(0.9);
  }
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .notification-container {
    top: 10px;
    right: 10px;
    left: 10px;
    max-width: none;
  }

  .notification {
    min-width: 0;
  }
}
</style>
