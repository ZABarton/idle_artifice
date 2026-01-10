<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import WorldMap from '@/components/WorldMap.vue'
import AreaMap from '@/components/AreaMap.vue'
import FeatureScreen from '@/components/FeatureScreen.vue'
import ObjectivesView from '@/views/ObjectivesView.vue'
import HelpView from '@/views/HelpView.vue'
import PiniaDebugTable from '@/components/PiniaDebugTable.vue'
import StatusColumn from '@/components/StatusColumn.vue'
import NotificationContainer from '@/components/NotificationContainer.vue'
import DialogContainer from '@/components/DialogContainer.vue'
import { useNavigationStore } from '@/stores/navigation'
import { useDialogsStore } from '@/stores/dialogs'
import type { HexTile } from '@/types/hex'

const navigationStore = useNavigationStore()
const dialogsStore = useDialogsStore()

const currentView = computed(() => navigationStore.currentView)
const selectedHex = computed(() => navigationStore.selectedHex)
const showDebugPanel = ref(false)
const showHelpView = ref(false)

// Trigger World Map tutorial sequence on first visit
watch(
  currentView,
  (newView) => {
    if (newView === 'world-map') {
      // Check if we've already seen the first World Map tutorial
      if (!dialogsStore.hasSeenTutorial('world-map-camera-controls')) {
        // Trigger all three tutorials in sequence
        // They will be added to the modal queue and displayed one at a time
        dialogsStore.showTutorial('world-map-camera-controls')
        dialogsStore.showTutorial('world-map-hex-statuses')
        dialogsStore.showTutorial('world-map-hex-selection')
      }
    }
  },
  { immediate: true } // Check on mount as well
)

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

const handleToggleHelpView = () => {
  showHelpView.value = !showHelpView.value
}
</script>

<template>
  <div class="main-layout">
    <!-- Status Column - always visible on left -->
    <StatusColumn
      @toggle-debug-panel="handleToggleDebugPanel"
      @toggle-help-view="handleToggleHelpView"
    />

    <!-- Main content area - switches between views -->
    <div class="content-area">
      <!-- Help View - shown when toggled -->
      <div v-if="showHelpView" class="help-view">
        <HelpView />
      </div>

      <!-- Debug Panel View - shown when toggled -->
      <div v-else-if="showDebugPanel" class="debug-view">
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

      <!-- Feature Screen View -->
      <div v-else-if="currentView === 'feature-screen'" class="feature-screen-view">
        <FeatureScreen />
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

.help-view,
.debug-view,
.world-map-view,
.area-map-view,
.feature-screen-view,
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
