<script setup lang="ts">
import { computed } from 'vue'
import { useNavigationStore } from '@/stores/navigation'
import { useWorldMapStore } from '@/stores/worldMap'
import { useAreaMapStore } from '@/stores/areaMap'
import { getAreaConfigByCoords } from '@/config/area-maps'
import type { Feature } from '@/types/feature'

/**
 * FeatureScreen Component
 * Full-screen view for complex features with navigation-type interaction
 * Architecture: Header bar with back button + full-screen feature component
 */

const navigationStore = useNavigationStore()
const worldMapStore = useWorldMapStore()
const areaMapStore = useAreaMapStore()

// Get current hex coordinates from navigation store
const selectedHex = computed(() => navigationStore.selectedHex)
const selectedFeatureId = computed(() => navigationStore.selectedFeatureId)

// Load area configuration
const areaConfig = computed(() => {
  if (!selectedHex.value) return null
  return getAreaConfigByCoords(selectedHex.value.q, selectedHex.value.r, worldMapStore)
})

// Get feature from store
const feature = computed<Feature | null>(() => {
  if (!selectedHex.value || !selectedFeatureId.value) return null
  const features = areaMapStore.getFeatures(selectedHex.value.q, selectedHex.value.r)
  return features.find((f) => f.id === selectedFeatureId.value) ?? null
})

// Get feature component from config
// Use screenComponent if available, otherwise fall back to component
const featureComponent = computed(() => {
  if (!areaConfig.value || !feature.value) return null
  const featureConfig = areaConfig.value.features.find((f) => f.id === feature.value!.id)
  return featureConfig?.screenComponent ?? featureConfig?.component ?? null
})

// Feature title for header
const featureTitle = computed(() => feature.value?.name ?? 'Feature')

// Handle back button click
const handleBackClick = () => {
  navigationStore.navigateBackToAreaMap()
}
</script>

<template>
  <div class="feature-screen-container">
    <!-- Header Bar -->
    <header class="feature-screen-header">
      <button
        class="feature-screen-header__back"
        aria-label="Back"
        @click="handleBackClick"
      >
        ← Back
      </button>
      <h1 class="feature-screen-header__title">{{ featureTitle }}</h1>
    </header>

    <!-- Feature Content -->
    <div class="feature-screen-content">
      <component :is="featureComponent" v-if="featureComponent" :full-screen="true" />
      <div v-else class="feature-screen-error">
        <p>Feature not found or not available.</p>
        <button @click="handleBackClick">Return to Area Map</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Container */
.feature-screen-container {
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100%;
  overflow: hidden;
  background-color: #ffffff;
}

/* Header Bar */
.feature-screen-header {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem 2rem;
  background-color: #2c3e50;
  color: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  z-index: 10;
}

.feature-screen-header__back {
  position: absolute;
  left: 1rem;
  padding: 0.5rem 1rem;
  background-color: rgba(255, 255, 255, 0.1);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 4px;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.feature-screen-header__back:hover {
  background-color: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.5);
}

.feature-screen-header__title {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  text-align: center;
}

/* Content Area */
.feature-screen-content {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 2rem;
  background-color: #f5f5f5;
}

/* Error State */
.feature-screen-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 1rem;
  padding: 2rem;
  text-align: center;
}

.feature-screen-error p {
  font-size: 1.1rem;
  color: #666;
  margin: 0;
}

.feature-screen-error button {
  padding: 0.75rem 1.5rem;
  background-color: #3498db;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.feature-screen-error button:hover {
  background-color: #2980b9;
}
</style>
