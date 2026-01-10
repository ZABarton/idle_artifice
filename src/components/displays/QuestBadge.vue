<script setup lang="ts">
/**
 * QuestBadge Component
 * Visual badge for quest objectives to draw attention to features tied to active quests.
 * Designed to be overlaid on feature minimized views.
 * Purely presentational - parent components handle click events.
 */

interface Props {
  /** Badge text (e.g., "Quest", "!" or a count like "2") */
  text?: string
  /** Icon to display (defaults to quest marker) */
  icon?: string
  /** Color variant for different badge types */
  variant?: 'primary' | 'success' | 'warning' | 'info'
  /** Show pulse animation to draw attention */
  pulse?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  text: undefined,
  icon: '🎯',
  variant: 'primary',
  pulse: true,
})

// Map variant to color
const variantColors: Record<string, { bg: string; border: string; text: string }> = {
  primary: {
    bg: '#4a90e2',
    border: '#357abd',
    text: '#ffffff',
  },
  success: {
    bg: '#4caf50',
    border: '#45a049',
    text: '#ffffff',
  },
  warning: {
    bg: '#ffa726',
    border: '#fb8c00',
    text: '#ffffff',
  },
  info: {
    bg: '#29b6f6',
    border: '#039be5',
    text: '#ffffff',
  },
}

const colors = variantColors[props.variant] || variantColors.primary
</script>

<template>
  <div
    class="quest-badge"
    :class="{ pulse: pulse }"
    :style="{
      backgroundColor: colors.bg,
      borderColor: colors.border,
      color: colors.text,
    }"
  >
    <span class="badge-icon">{{ icon }}</span>
    <span v-if="text" class="badge-text">{{ text }}</span>
  </div>
</template>

<style scoped>
.quest-badge {
  display: inline-flex;
  align-items: center;
  gap: 1px;
  padding: 1px 2px;
  border-radius: 1.5px;
  border: 0.5px solid;
  font-family:
    system-ui,
    -apple-system,
    sans-serif;
  font-size: 5px;
  font-weight: bold;
  line-height: 1;
  box-shadow: 0 0.5px 1.5px rgba(0, 0, 0, 0.2);
  white-space: nowrap;
}

.badge-icon {
  font-size: 1.2em;
  line-height: 1;
}

.badge-text {
  font-size: 1em;
  line-height: 1;
}

/* Pulse animation */
.quest-badge.pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.85;
    transform: scale(1.05);
  }
}

/* Responsive sizing */
@media (min-width: 769px) {
  .quest-badge {
    font-size: 0.75rem;
    gap: 0.25rem;
    padding: 0.25rem 0.5rem;
    border-radius: 6px;
    border: 1px solid;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  }
}
</style>
