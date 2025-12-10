<script setup lang="ts">
import { computed, ref } from 'vue'
import WorldMap from '@/components/WorldMap.vue'
import AreaMap from '@/components/AreaMap.vue'
import ObjectivesView from '@/views/ObjectivesView.vue'
import PiniaDebugTable from '@/components/PiniaDebugTable.vue'
import StatusColumn from '@/components/StatusColumn.vue'
import NotificationContainer from '@/components/NotificationContainer.vue'
import DialogContainer from '@/components/DialogContainer.vue'
import { useNavigationStore } from '@/stores/navigation'
import type { HexTile } from '@/types/hex'

const navigationStore = useNavigationStore()

const currentView = computed(() => navigationStore.currentView)
const selectedHex = computed(() => navigationStore.selectedHex)
const showDebugPanel = ref(false)

const handleHexSelected = (tile: HexTile) => {
  navigationStore.navigateToAreaMap(tile.q, tile.r, tile.type)
}

const handleBackToWorldMap = () => {
  navigationStore.navigateToWorldMap()
}

const handleBackFromObjectivesView = () => {
  // The ObjectivesView component handles navigation internally
  // This handler is here for consistency with other views
}

const handleToggleDebugPanel = () => {
  showDebugPanel.value = !showDebugPanel.value
}
</script>

<template>
  <div class="main-layout">
    <!-- Status Column - always visible on left -->
    <StatusColumn @toggle-debug-panel="handleToggleDebugPanel" />

    <!-- Main content area - switches between views -->
    <div class="content-area">
      <!-- Debug Panel View - shown when toggled -->
      <div v-if="showDebugPanel" class="debug-view">
        <PiniaDebugTable />
      </div>

      <!-- World Map View -->
      <div v-else-if="currentView === 'world-map'" class="world-map-view">
        <WorldMap @hex-selected="handleHexSelected" />
      </div>

      <!-- Area Map View -->
      <div v-else-if="currentView === 'area-map' && selectedHex" class="area-map-view">
        <AreaMap :q="selectedHex.q" :r="selectedHex.r" @back="handleBackToWorldMap" />
      </div>

      <!-- Objectives View -->
      <div v-else-if="currentView === 'objectives-view'" class="objectives-view">
        <ObjectivesView @back="handleBackFromObjectivesView" />
      </div>
    </div>

    <!-- Notification system - rendered on top of all content -->
    <NotificationContainer />

    <!-- Dialog container - handles both tutorial and dialog modals -->
    <DialogContainer />
  </div>
</template>

<style scoped>
.main-layout {
  display: grid;
  grid-template-columns: auto 1fr;
  height: 100vh;
  overflow: hidden;
}

.content-area {
  min-width: 0;
  overflow: hidden;
  position: relative;
}

.debug-view,
.world-map-view,
.area-map-view,
.objectives-view {
  height: 100%;
  overflow: hidden;
}

.placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  font-size: 1.5rem;
  color: #999;
}

/* Tablet breakpoint - StatusColumn at 200px */
@media (max-width: 1024px) {
  .main-layout {
    /* StatusColumn handles its own width, grid adjusts automatically */
    grid-template-columns: auto 1fr;
  }
}

/* Mobile breakpoint - StatusColumn becomes fixed drawer overlay */
@media (max-width: 768px) {
  .main-layout {
    /* On mobile, StatusColumn is fixed positioned, so grid is just content */
    grid-template-columns: 1fr;
  }

  .content-area {
    /* Add left padding to prevent content from being hidden under collapsed bar */
    padding-left: 50px;
  }
}
</style>
