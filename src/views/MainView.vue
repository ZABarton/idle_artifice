<script setup lang="ts">
import WorldMap from '@/components/WorldMap.vue'
import PiniaDebugTable from '@/components/PiniaDebugTable.vue'
</script>

<template>
  <div class="main-layout">
    <div class="world-map-panel">
      <WorldMap />
    </div>
    <div class="debug-panel">
      <PiniaDebugTable />
    </div>
  </div>
</template>

<style scoped>
.main-layout {
  display: grid;
  grid-template-columns: 1fr 400px;
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
