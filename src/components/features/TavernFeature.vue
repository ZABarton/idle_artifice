<script setup lang="ts">
import { onMounted } from 'vue'
import { useTutorials } from '@/composables/useTutorials'

/**
 * TavernFeature Component
 * Complex feature with navigation to dedicated Tavern screen
 * For now, shows description and button that will navigate when implemented
 */

interface Emits {
  /** Emitted when user wants to open the Tavern screen */
  (e: 'navigate'): void
}

const emit = defineEmits<Emits>()

const handleOpenTavern = () => {
  emit('navigate')
}

// Trigger tutorials on first interaction with this feature
const { triggerFeatureTutorial } = useTutorials()
onMounted(() => {
  triggerFeatureTutorial('tavern')
})
</script>

<template>
  <div class="tavern-feature">
    <p class="description">Manage your camp's explorers.</p>

    <button class="open-button" @click="handleOpenTavern">Enter Tavern</button>
  </div>
</template>

<style scoped>
.tavern-feature {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 2px;
  font-family:
    system-ui,
    -apple-system,
    sans-serif;
  font-size: 6px;
  box-sizing: border-box;
  width: 100%;
  height: 100%;
}

.description {
  margin: 0;
  font-size: 1em;
  color: #666;
  line-height: 1.3;
  word-wrap: break-word;
  overflow-wrap: break-word;
}

.open-button {
  margin-top: auto;
  padding: 2px 3px;
  background-color: #4a90e2;
  color: white;
  border: none;
  border-radius: 1px;
  font-size: 1em;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
}

.open-button:hover {
  background-color: #357abd;
}

.open-button:active {
  background-color: #2b5a8a;
}
</style>
