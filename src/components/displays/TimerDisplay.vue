<script setup lang="ts">
import { computed } from 'vue'

/**
 * TimerDisplay Component
 * Displays progress bars and countdown timers for resource generation or timed events.
 * Props-based only - parent components handle timer logic and offline progression.
 */

interface Props {
  /** Label text to display above the progress bar */
  label?: string
  /** Current progress value */
  current: number
  /** Maximum progress value */
  max: number
  /** Display mode: 'progress' shows percentage, 'countdown' shows time remaining */
  mode?: 'progress' | 'countdown'
  /** Show numeric values alongside the bar */
  showValues?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  label: undefined,
  mode: 'progress',
  showValues: true,
})

// Calculate percentage for progress bar
const percentage = computed(() => {
  if (props.max === 0) return 0
  return Math.min(100, Math.max(0, (props.current / props.max) * 100))
})

// Format display value based on mode
const displayValue = computed(() => {
  if (props.mode === 'countdown') {
    // Format as time (seconds)
    const remaining = Math.max(0, props.max - props.current)
    const minutes = Math.floor(remaining / 60)
    const seconds = remaining % 60
    if (minutes > 0) {
      return `${minutes}m ${seconds}s`
    }
    return `${seconds}s`
  } else {
    // Format as progress ratio or percentage
    if (props.showValues) {
      return `${Math.floor(props.current)}/${Math.floor(props.max)}`
    }
    return `${Math.floor(percentage.value)}%`
  }
})

// Color based on progress
const barColor = computed(() => {
  if (percentage.value >= 100) return '#4caf50' // Green when complete
  if (percentage.value >= 50) return '#4a90e2' // Blue when half-way
  return '#ffa726' // Orange when starting
})
</script>

<template>
  <div class="timer-display">
    <div v-if="label" class="timer-label">{{ label }}</div>
    <div class="progress-container">
      <div class="progress-bar">
        <div class="progress-fill" :style="{ width: `${percentage}%`, backgroundColor: barColor }"></div>
      </div>
      <div class="progress-value">{{ displayValue }}</div>
    </div>
  </div>
</template>

<style scoped>
.timer-display {
  display: flex;
  flex-direction: column;
  gap: 1px;
  font-family:
    system-ui,
    -apple-system,
    sans-serif;
  font-size: 6px;
  width: 100%;
}

.timer-label {
  font-size: 0.9em;
  font-weight: 600;
  color: #333;
  margin-bottom: 0.5px;
}

.progress-container {
  display: flex;
  align-items: center;
  gap: 2px;
}

.progress-bar {
  flex: 1;
  height: 2px;
  background-color: #e0e0e0;
  border-radius: 1px;
  overflow: hidden;
  position: relative;
}

.progress-fill {
  height: 100%;
  transition: width 0.3s ease;
  border-radius: 1px;
}

.progress-value {
  font-size: 0.85em;
  font-weight: 600;
  color: #666;
  min-width: fit-content;
  white-space: nowrap;
}

/* Responsive sizing */
@media (min-width: 769px) {
  .timer-display {
    font-size: 0.875rem;
  }

  .progress-bar {
    height: 8px;
    border-radius: 4px;
  }

  .progress-fill {
    border-radius: 4px;
  }
}
</style>
