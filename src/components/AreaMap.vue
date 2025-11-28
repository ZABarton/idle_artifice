<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useWorldMapStore } from '@/stores/worldMap'

interface Props {
  q: number
  r: number
}

const props = defineProps<Props>()

const emit = defineEmits<{
  back: []
}>()

const worldMapStore = useWorldMapStore()

// Get the tile data for this area
const tile = computed(() => worldMapStore.getTileAt(props.q, props.r))

// Increment visit count when area is entered
onMounted(() => {
  worldMapStore.incrementVisitCount(props.q, props.r)
})

// Mock resources that vary by hex coordinates
// This demonstrates that different hexes show different data
const mockResources = computed(() => {
  // Use coordinates to generate pseudo-random but consistent values
  const seed = Math.abs(props.q * 7 + props.r * 13)

  return {
    plants: 5 + (seed % 10),
    stone: 12 + (seed % 15),
    wood: 8 + (seed % 12),
  }
})

const handleBackClick = () => {
  emit('back')
}
</script>

<template>
  <div class="area-map-container">
    <button
      class="close-button"
      aria-label="Close and return to World Map"
      @click="handleBackClick"
    >
      ✕
    </button>
    <div class="area-info-panel">
      <div class="panel-header">
        <h2>Area Information</h2>
      </div>
      <div class="panel-content">
        <div class="info-section">
          <h3>Location</h3>
          <p><strong>Coordinates:</strong> ({{ q }}, {{ r }})</p>
          <p><strong>Status:</strong> {{ tile?.explorationStatus || 'unknown' }}</p>
          <p v-if="tile?.type"><strong>Type:</strong> {{ tile.type }}</p>
        </div>
        <div class="info-section">
          <h3>Persistent Data</h3>
          <div class="visit-counter">
            <span class="counter-label">Times visited:</span>
            <span class="counter-value">{{ tile?.visitCount || 0 }}</span>
          </div>
          <p class="counter-hint">
            This counter increments each time you enter this area and persists when you leave.
          </p>
        </div>
      </div>
    </div>
    <div class="resources-panel">
      <div class="panel-header">
        <h2>Resources</h2>
      </div>
      <div class="panel-content">
        <div class="resource-list">
          <div v-for="(amount, resource) in mockResources" :key="resource" class="resource-item">
            <span class="resource-name">{{ resource }}:</span>
            <span class="resource-amount">{{ amount }}</span>
          </div>
        </div>
        <p class="hint-text">
          Resource amounts are specific to this hex ({{ q }}, {{ r }}) and will persist when you
          return.
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.area-map-container {
  position: relative;
  display: grid;
  grid-template-columns: 1fr 1fr;
  height: 100vh;
  overflow: hidden;
  gap: 1rem;
  padding: 1rem;
  padding-top: 4.5rem; /* Make room for close button */
  background-color: #f5f5f5;
}

.close-button {
  position: absolute;
  top: 1rem;
  right: 1rem;
  width: 48px;
  height: 48px;
  background-color: #333;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 2rem;
  font-weight: 300;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition:
    background-color 0.2s,
    transform 0.1s;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.close-button:hover {
  background-color: #555;
  transform: scale(1.05);
}

.close-button:active {
  transform: scale(0.95);
}

.area-info-panel,
.resources-panel {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.panel-header {
  padding: 1rem;
  border-bottom: 2px solid #e0e0e0;
}

.panel-header h2 {
  margin: 0;
  font-size: 1.5rem;
  color: #333;
}

.panel-content {
  padding: 1.5rem;
  overflow-y: auto;
  flex: 1;
}

.info-section h3 {
  margin-top: 0;
  margin-bottom: 1rem;
  color: #555;
  font-size: 1.2rem;
}

.info-section p {
  margin: 0.5rem 0;
  color: #666;
  font-size: 1rem;
}

.visit-counter {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background-color: #e8f4f8;
  border-radius: 4px;
  border-left: 4px solid #4a90e2;
  margin-bottom: 0.5rem;
}

.counter-label {
  font-weight: 600;
  color: #333;
  font-size: 1rem;
}

.counter-value {
  font-weight: bold;
  color: #4a90e2;
  font-size: 1.5rem;
}

.counter-hint {
  font-size: 0.85rem;
  color: #666;
  font-style: italic;
  margin-top: 0.5rem;
}

.resource-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.resource-item {
  display: flex;
  justify-content: space-between;
  padding: 0.75rem;
  background-color: #f9f9f9;
  border-radius: 4px;
  border-left: 4px solid #4a90e2;
}

.resource-name {
  font-weight: 600;
  color: #333;
  text-transform: capitalize;
}

.resource-amount {
  font-weight: bold;
  color: #4a90e2;
  font-size: 1.1rem;
}

.hint-text {
  margin-top: 1.5rem;
  padding: 0.75rem;
  background-color: #fff9e6;
  border-left: 4px solid #ffc107;
  color: #666;
  font-size: 0.9rem;
  font-style: italic;
  border-radius: 4px;
}

/* Tablet breakpoint - stack vertically */
@media (max-width: 1024px) {
  .area-map-container {
    grid-template-columns: 1fr;
    grid-template-rows: auto auto;
  }
}

/* Mobile breakpoint */
@media (max-width: 768px) {
  .area-map-container {
    padding: 0.5rem;
    gap: 0.5rem;
  }

  .close-button {
    top: 0.5rem;
    right: 0.5rem;
  }
}
</style>
