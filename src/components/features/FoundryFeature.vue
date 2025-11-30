<script setup lang="ts">
/**
 * FoundryFeature Component
 * Complex feature with navigation to dedicated Foundry screen
 * For now, shows description and button that will navigate when implemented
 */

interface Emits {
  /** Emitted when user wants to open the Foundry screen */
  (e: 'navigate'): void
}

const emit = defineEmits<Emits>()

// Mock resource data - will come from resource store in future
const mockResources = {
  wood: 25,
  stone: 12,
}

const handleOpenFoundry = () => {
  emit('navigate')
}
</script>

<template>
  <div class="foundry-feature">
    <p class="description">Craft magical items by solving grid-based puzzles.</p>

    <div class="resources">
      <div class="resources__title">Available resources:</div>
      <div class="resources__list">
        <span v-for="(amount, resource) in mockResources" :key="resource" class="resource-item">
          {{ resource }}: {{ amount }}
        </span>
      </div>
    </div>

    <button class="open-button" @click="handleOpenFoundry">Open Foundry Puzzle</button>
  </div>
</template>

<style scoped>
.foundry-feature {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 2px;
  font-family: system-ui, -apple-system, sans-serif;
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

.resources {
  margin: 1px 0;
}

.resources__title {
  font-size: 0.9em;
  font-weight: 600;
  color: #333;
  margin-bottom: 1px;
}

.resources__list {
  display: flex;
  gap: 2px;
  font-size: 0.9em;
  color: #666;
  flex-wrap: wrap;
}

.resource-item {
  white-space: nowrap;
}

.open-button {
  margin-top: 1px;
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
