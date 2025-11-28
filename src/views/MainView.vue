<script setup lang="ts">
import { computed } from 'vue'
import WorldMap from '@/components/WorldMap.vue'
import AreaMap from '@/components/AreaMap.vue'
import PiniaDebugTable from '@/components/PiniaDebugTable.vue'
import { useNavigationStore } from '@/stores/navigation'
import type { HexTile } from '@/types/hex'

const navigationStore = useNavigationStore()

const currentView = computed(() => navigationStore.currentView)
const selectedHex = computed(() => navigationStore.selectedHex)

const handleHexSelected = (tile: HexTile) => {
  navigationStore.navigateToAreaMap(tile.q, tile.r)
}

const handleBackToWorldMap = () => {
  navigationStore.navigateToWorldMap()
}
</script>

<template>
  <div v-if="currentView === 'world-map'" class="main-layout">
    <div class="world-map-panel">
      <WorldMap @hex-selected="handleHexSelected" />
    </div>
    <div class="debug-panel">
      <PiniaDebugTable />
    </div>
  </div>
  <div v-else-if="currentView === 'area-map' && selectedHex" class="area-map-view">
    <AreaMap :q="selectedHex.q" :r="selectedHex.r" @back="handleBackToWorldMap" />
  </div>
</template>

<style scoped>
.main-layout {
  display: grid;
  grid-template-columns: 1fr 400px;
  height: 100vh;
  overflow: hidden;
}

.area-map-view {
  height: 100vh;
  overflow: hidden;
}

.world-map-panel {
  min-width: 0; /* Allows grid item to shrink below content size */
  overflow: hidden;
}

.debug-panel {
  min-width: 300px;
  overflow: hidden;
}

/* Tablet breakpoint - stack vertically */
@media (max-width: 1024px) {
  .main-layout {
    grid-template-columns: 1fr;
    grid-template-rows: 60vh 40vh;
  }
}

/* Mobile breakpoint - adjust proportions */
@media (max-width: 768px) {
  .main-layout {
    grid-template-rows: 50vh 50vh;
  }

  .debug-panel {
    min-width: 0;
  }
}

/* Small mobile - prioritize debug panel */
@media (max-width: 480px) {
  .main-layout {
    grid-template-rows: 40vh 60vh;
  }
}
</style>
