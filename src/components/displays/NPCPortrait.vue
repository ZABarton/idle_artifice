<script setup lang="ts">
/**
 * NPCPortrait Component
 * Displays an NPC portrait with name in feature expanded views.
 * Clickable to initiate conversations.
 */

import type { NPCConfig } from '@/types/areaMapConfig'

interface Props {
  /** NPC configuration */
  npc: NPCConfig
  /** Whether the conversation is available (not completed) */
  hasAvailableConversation?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  hasAvailableConversation: false,
})

const emit = defineEmits<{
  'npc-click': [npcId: string]
}>()

const handleClick = (event: MouseEvent) => {
  // Stop event propagation to prevent triggering parent clicks
  event.stopPropagation()

  emit('npc-click', props.npc.id)
}
</script>

<template>
  <div
    class="npc-portrait clickable"
    @click="handleClick"
  >
    <div class="portrait-frame">
      <img
        v-if="npc.portrait.path"
        :src="`/${npc.portrait.path}`"
        :alt="npc.portrait.alt"
        class="portrait-image"
      />
      <div v-else class="portrait-placeholder">
        <span class="placeholder-icon">{{ npc.icon || '💬' }}</span>
      </div>
      <div v-if="hasAvailableConversation" class="conversation-badge" title="Conversation available">
        💬
      </div>
    </div>
    <div class="npc-name">{{ npc.name }}</div>
  </div>
</template>

<style scoped>
.npc-portrait {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background-color: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  transition: all 0.2s;
  width: 100%;
  max-width: 140px;
}

.npc-portrait.clickable {
  cursor: pointer;
  user-select: none;
}

.npc-portrait.clickable:hover {
  background-color: #e8f4f8;
  border-color: #357abd;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(74, 144, 226, 0.2);
}

.npc-portrait.clickable:active {
  transform: translateY(0);
  box-shadow: 0 2px 4px rgba(74, 144, 226, 0.2);
}

.portrait-frame {
  position: relative;
  width: 80px;
  height: 80px;
  border-radius: 50%;
  overflow: hidden;
  background-color: #e2e8f0;
  border: 3px solid #cbd5e1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.portrait-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.portrait-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.placeholder-icon {
  font-size: 2rem;
  line-height: 1;
}

.conversation-badge {
  position: absolute;
  bottom: -2px;
  right: -2px;
  width: 24px;
  height: 24px;
  background-color: #4a90e2;
  border: 2px solid white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
}

.npc-name {
  font-size: 0.875rem;
  font-weight: 600;
  color: #334155;
  text-align: center;
  line-height: 1.2;
}

.npc-portrait.clickable .npc-name {
  color: #357abd;
}

/* Responsive */
@media (max-width: 768px) {
  .npc-portrait {
    max-width: 120px;
    padding: 0.5rem;
  }

  .portrait-frame {
    width: 64px;
    height: 64px;
  }

  .placeholder-icon {
    font-size: 1.5rem;
  }

  .conversation-badge {
    width: 20px;
    height: 20px;
    font-size: 0.625rem;
  }

  .npc-name {
    font-size: 0.75rem;
  }
}
</style>
