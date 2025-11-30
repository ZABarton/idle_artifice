<script setup lang="ts">
/**
 * AlchemistFeature Component
 * Placeholder for locked Alchemist feature
 * Will be implemented in a future milestone
 */
</script>

<template>
  <div class="alchemist-feature">
    <p class="coming-soon">Alchemist coming soon!</p>
    <p class="description">Brew potions and elixirs.</p>
  </div>
</template>

<style scoped>
.alchemist-feature {
  display: flex;
  flex-direction: column;
  gap: 1px;
  padding: 2px;
  font-family: system-ui, -apple-system, sans-serif;
  font-size: 3px;
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
