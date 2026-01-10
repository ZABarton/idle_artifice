<script setup lang="ts">
/**
 * StatusText Component
 * Generic text status display with color variants and optional icons.
 * Use for simple status messages, notifications, or informational text.
 * Purely presentational - parent components handle interactions.
 */

interface Props {
  /** Status text to display */
  text: string
  /** Visual variant determining color scheme */
  variant?: 'info' | 'success' | 'warning' | 'error' | 'neutral'
  /** Optional icon to display before text */
  icon?: string
  /** Text size variant */
  size?: 'small' | 'medium' | 'large'
  /** Whether to bold the text */
  bold?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'neutral',
  icon: undefined,
  size: 'medium',
  bold: false,
})

// Map variant to color
const variantColors: Record<string, { text: string; bg: string }> = {
  info: {
    text: '#1976d2',
    bg: '#e3f2fd',
  },
  success: {
    text: '#2e7d32',
    bg: '#e8f5e9',
  },
  warning: {
    text: '#f57c00',
    bg: '#fff3e0',
  },
  error: {
    text: '#c62828',
    bg: '#ffebee',
  },
  neutral: {
    text: '#666666',
    bg: 'transparent',
  },
}

const colors = variantColors[props.variant] || variantColors.neutral

// Map size to font size multiplier
const sizeMultipliers: Record<string, string> = {
  small: '0.85em',
  medium: '1em',
  large: '1.15em',
}

const fontSize = sizeMultipliers[props.size] || sizeMultipliers.medium
</script>

<template>
  <div
    class="status-text"
    :class="{ 'has-background': variant !== 'neutral' }"
    :style="{
      color: colors.text,
      backgroundColor: colors.bg,
      fontSize: fontSize,
      fontWeight: bold ? '600' : 'normal',
    }"
  >
    <span v-if="icon" class="status-icon">{{ icon }}</span>
    <span class="status-message">{{ text }}</span>
  </div>
</template>

<style scoped>
.status-text {
  display: inline-flex;
  align-items: center;
  gap: 1.5px;
  font-family:
    system-ui,
    -apple-system,
    sans-serif;
  font-size: 6px;
  line-height: 1.3;
  border-radius: 1px;
  padding: 0;
  width: fit-content;
}

.status-text.has-background {
  padding: 1px 2px;
}

.status-icon {
  font-size: 1.1em;
  line-height: 1;
  flex-shrink: 0;
}

.status-message {
  line-height: 1.3;
  word-wrap: break-word;
  overflow-wrap: break-word;
}

/* Responsive sizing */
@media (min-width: 769px) {
  .status-text {
    font-size: 0.875rem;
    gap: 0.375rem;
    border-radius: 4px;
  }

  .status-text.has-background {
    padding: 0.25rem 0.5rem;
  }
}
</style>
