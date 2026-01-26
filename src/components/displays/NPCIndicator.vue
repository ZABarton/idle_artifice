<script setup lang="ts">
import { computed } from 'vue'

/**
 * NPCIndicator Component
 * Shows NPC portrait and name for feature cards.
 * Displays a portrait image with the NPC name underneath.
 * Clickable to initiate NPC conversations.
 */

interface Props {
  /** Name of the NPC */
  npcName: string
  /** Portrait image path (or null for placeholder) */
  portraitPath?: string | null
  /** Portrait alt text */
  portraitAlt?: string
  /** Whether a conversation is available (shows badge) */
  hasAvailableConversation?: boolean
  /** Whether to show a notification badge */
  showBadge?: boolean
  /** Optional badge text (e.g., "New" or "!") */
  badgeText?: string
  /** NPC ID for identifying which NPC was clicked */
  npcId?: string
}

const props = withDefaults(defineProps<Props>(), {
  portraitPath: null,
  portraitAlt: 'NPC Portrait',
  hasAvailableConversation: false,
  showBadge: false,
  badgeText: '!',
  npcId: '',
})

const emit = defineEmits<{
  'npc-click': [npcId: string]
}>()

const handleClick = (event: MouseEvent) => {
  // Stop event propagation to prevent triggering feature card click
  event.stopPropagation()

  if (props.npcId) {
    emit('npc-click', props.npcId)
  }
}

// Generate the full image path, handling both absolute and relative paths
const imageSrc = computed(() => {
  if (!props.portraitPath) return null
  // If path starts with / or http, use as-is; otherwise prepend /
  if (props.portraitPath.startsWith('/') || props.portraitPath.startsWith('http')) {
    return props.portraitPath
  }
  return `/${props.portraitPath}`
})
</script>

<template>
  <div
    class="npc-indicator"
    :class="{
      available: hasAvailableConversation,
      clickable: !!npcId,
    }"
    @click="handleClick"
  >
    <div class="portrait-container">
      <img
        v-if="imageSrc"
        :src="imageSrc"
        :alt="portraitAlt"
        class="portrait-image"
      />
      <div v-else class="portrait-placeholder">
        <span class="placeholder-icon">👤</span>
      </div>
      <span v-if="showBadge" class="badge">{{ badgeText }}</span>
    </div>
    <span class="npc-name">{{ npcName }}</span>
  </div>
</template>

<style scoped>
.npc-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem;
  border-radius: 8px;
  transition: all 0.2s ease;
  min-width: 80px;
  max-width: 100px;
}

.npc-indicator.available {
  background-color: #e8f4f8;
}

.portrait-container {
  position: relative;
  width: 64px;
  height: 64px;
  flex-shrink: 0;
}

.portrait-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 8px;
  border: 2px solid #ccc;
  transition: border-color 0.2s ease;
}

.npc-indicator.available .portrait-image {
  border-color: #357abd;
}

.portrait-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #e0e0e0;
  border-radius: 8px;
  border: 2px solid #ccc;
}

.npc-indicator.available .portrait-placeholder {
  border-color: #357abd;
  background-color: #d4e9f2;
}

.placeholder-icon {
  font-size: 2rem;
  opacity: 0.6;
}

.badge {
  position: absolute;
  top: -4px;
  right: -4px;
  background-color: #f44336;
  color: white;
  font-size: 0.75rem;
  font-weight: bold;
  border-radius: 50%;
  min-width: 20px;
  min-height: 20px;
  padding: 2px 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.npc-name {
  font-family: system-ui, -apple-system, sans-serif;
  font-size: 0.75rem;
  color: #666;
  font-weight: 500;
  text-align: center;
  line-height: 1.2;
  word-wrap: break-word;
  max-width: 100%;
}

.npc-indicator.available .npc-name {
  color: #357abd;
  font-weight: 600;
}

.npc-indicator.clickable {
  cursor: pointer;
  user-select: none;
}

.npc-indicator.clickable:hover {
  background-color: #d4e9f2;
  transform: translateY(-2px);
}

.npc-indicator.clickable:hover .portrait-image,
.npc-indicator.clickable:hover .portrait-placeholder {
  border-color: #357abd;
}

.npc-indicator.clickable:active {
  transform: translateY(0);
}

/* Responsive sizing */
@media (max-width: 768px) {
  .npc-indicator {
    min-width: 60px;
    max-width: 80px;
    padding: 0.375rem;
  }

  .portrait-container {
    width: 48px;
    height: 48px;
  }

  .placeholder-icon {
    font-size: 1.5rem;
  }

  .badge {
    min-width: 16px;
    min-height: 16px;
    font-size: 0.625rem;
    padding: 2px 4px;
  }

  .npc-name {
    font-size: 0.625rem;
  }
}
</style>
