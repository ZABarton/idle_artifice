<script setup lang="ts">
/**
 * WorkshopFeature Component
 * Placeholder for locked Workshop feature
 * Will be implemented in a future milestone
 */
</script>

<template>
  <div class="workshop-feature">
    <p class="coming-soon">Workshop coming soon!</p>
    <p class="description">Create equipment for explorers.</p>
  </div>
</template>

<style scoped>
.workshop-feature {
  display: flex;
  flex-direction: column;
  gap: 1px;
  padding: 2px;
  font-family: system-ui, -apple-system, sans-serif;
  font-size: 6px;
  text-align: center;
  box-sizing: border-box;
  width: 100%;
  height: 100%;
}

.coming-soon {
  margin: 0;
  font-size: 1em;
  font-weight: 600;
  color: #999;
}

.description {
  margin: 0;
  font-size: 0.9em;
  color: #aaa;
  font-style: italic;
}
</style>
