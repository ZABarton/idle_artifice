<script setup lang="ts">
/**
 * NPCIndicator Component
 * Shows NPC conversation availability for feature minimized views.
 * Displays an icon with a badge indicator when conversation is available.
 * Purely presentational - parent components handle click events.
 */

interface Props {
  /** Name of the NPC */
  npcName: string
  /** Icon or emoji to represent the NPC (defaults to speech bubble) */
  icon?: string
  /** Whether a conversation is available */
  hasAvailableConversation?: boolean
  /** Whether to show a notification badge */
  showBadge?: boolean
  /** Optional badge text (e.g., "New" or "!") */
  badgeText?: string
}

withDefaults(defineProps<Props>(), {
  icon: '💬',
  hasAvailableConversation: false,
  showBadge: false,
  badgeText: '!',
})
</script>

<template>
  <div class="npc-indicator" :class="{ available: hasAvailableConversation }">
    <div class="npc-icon-container">
      <span class="npc-icon">{{ icon }}</span>
      <span v-if="showBadge" class="badge">{{ badgeText }}</span>
    </div>
    <span class="npc-name">{{ npcName }}</span>
  </div>
</template>

<style scoped>
.npc-indicator {
  display: inline-flex;
  align-items: center;
  gap: 1.5px;
  font-family:
    system-ui,
    -apple-system,
    sans-serif;
  font-size: 6px;
  padding: 1px 2px;
  border-radius: 1px;
  transition: all 0.2s ease;
}

.npc-indicator.available {
  background-color: #e8f4f8;
}

.npc-icon-container {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.npc-icon {
  font-size: 1.5em;
  line-height: 1;
}

.badge {
  position: absolute;
  top: -1px;
  right: -1px;
  background-color: #f44336;
  color: white;
  font-size: 0.6em;
  font-weight: bold;
  border-radius: 50%;
  min-width: 2px;
  min-height: 2px;
  padding: 0.5px 1px;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  box-shadow: 0 0.5px 1px rgba(0, 0, 0, 0.2);
}

.npc-name {
  font-size: 0.9em;
  color: #666;
  font-weight: 500;
}

.npc-indicator.available .npc-name {
  color: #357abd;
  font-weight: 600;
}

/* Responsive sizing */
@media (min-width: 769px) {
  .npc-indicator {
    font-size: 0.875rem;
    gap: 0.5rem;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
  }

  .badge {
    top: -4px;
    right: -4px;
    min-width: 12px;
    min-height: 12px;
    padding: 2px 4px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  }
}
</style>
