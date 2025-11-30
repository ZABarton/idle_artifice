<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useWorldMapStore } from '@/stores/worldMap'
import { useAreaMapStore } from '@/stores/areaMap'
import FeatureCard from './FeatureCard.vue'
import FoundryFeature from './features/FoundryFeature.vue'
import ShopFeature from './features/ShopFeature.vue'
import WorkshopFeature from './features/WorkshopFeature.vue'
import AlchemistFeature from './features/AlchemistFeature.vue'
import type { Feature, FeatureType } from '@/types/feature'

/**
 * AreaMap Component
 * Displays a spatial canvas with interactive Features for a specific hex area
 * Architecture: Header bar + SVG canvas with positioned Features
 */

interface Props {
  q: number
  r: number
}

const props = defineProps<Props>()

const emit = defineEmits<{
  back: []
}>()

const worldMapStore = useWorldMapStore()
const areaMapStore = useAreaMapStore()

// Get the tile data for this area
const tile = computed(() => worldMapStore.getTileAt(props.q, props.r))

// Get area data from areaMapStore
const area = computed(() => areaMapStore.getArea(props.q, props.r))

// Get visible features (filters out hidden features)
const features = computed(() => areaMapStore.getFeatures(props.q, props.r))

// Area title for header
const areaTitle = computed(() => {
  if (area.value?.areaType === 'academy') return 'Academy'
  if (area.value?.areaType === 'forest') return 'Forest'
  if (area.value?.areaType === 'mountain') return 'Mountain'
  return 'Area Map'
})

// Background color from area data
const backgroundColor = computed(() => area.value?.background ?? '#f5f5f5')

// ViewBox dimensions (consistent with World Map)
const VIEWBOX_WIDTH = 300
const VIEWBOX_HEIGHT = 300

// Initialize area on mount
onMounted(() => {
  worldMapStore.incrementVisitCount(props.q, props.r)

  // Initialize area data if not already loaded
  if (!area.value) {
    // For now, only Academy is implemented
    if (tile.value?.type === 'academy' || props.q === 0 && props.r === 0) {
      areaMapStore.initializeAcademy(props.q, props.r)
    }
  }
})

// Handle back button click
const handleBackClick = () => {
  // Deactivate any active features before leaving
  areaMapStore.setActiveFeature(null)
  emit('back')
}

// Map feature types to components
const featureComponents: Record<FeatureType, any> = {
  foundry: FoundryFeature,
  shop: ShopFeature,
  workshop: WorkshopFeature,
  alchemist: AlchemistFeature,
}

// Get component for a specific feature
const getFeatureComponent = (featureType: FeatureType) => {
  return featureComponents[featureType]
}

// Handle feature card click
const handleFeatureClick = (feature: Feature) => {
  if (feature.state === 'locked') {
    // For locked features, could show a tooltip or modal with requirements
    console.log('Feature is locked:', feature.name, feature.prerequisites)
    return
  }

  // Toggle active state
  if (feature.isActive) {
    areaMapStore.setActiveFeature(null)
  } else {
    areaMapStore.setActiveFeature(feature.id)
  }

  // For navigation-type features, this is where we would navigate to feature screen
  // This will be implemented in a future milestone
  if (feature.interactionType === 'navigation') {
    console.log('Would navigate to feature screen:', feature.type)
  }
}

// Handle navigate event from feature components
const handleFeatureNavigate = (featureType: string) => {
  console.log('Navigate to feature screen:', featureType)
  // This will be implemented in a future milestone
}
</script>

<template>
  <div class="area-map-container">
    <!-- Header Bar -->
    <header class="area-map-header">
      <h1 class="area-map-header__title">{{ areaTitle }}</h1>
      <button
        class="area-map-header__close"
        aria-label="Close and return to World Map"
        @click="handleBackClick"
      >
        ✕
      </button>
    </header>

    <!-- SVG Canvas -->
    <div class="area-map-canvas-wrapper">
      <svg
        class="area-map-canvas"
        :viewBox="`${-VIEWBOX_WIDTH / 2} ${-VIEWBOX_HEIGHT / 2} ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`"
        xmlns="http://www.w3.org/2000/svg"
      >
        <!-- Background -->
        <rect
          :x="-VIEWBOX_WIDTH / 2"
          :y="-VIEWBOX_HEIGHT / 2"
          :width="VIEWBOX_WIDTH"
          :height="VIEWBOX_HEIGHT"
          :fill="backgroundColor"
        />

        <!-- Features -->
        <FeatureCard
          v-for="feature in features"
          :key="feature.id"
          :feature="feature"
          @click="handleFeatureClick"
        >
          <!-- Dynamic feature component based on feature type -->
          <component
            :is="getFeatureComponent(feature.type)"
            @navigate="handleFeatureNavigate(feature.type)"
          />
        </FeatureCard>
      </svg>
    </div>

    <!-- Optional floating close button (for redundancy) -->
    <button
      class="floating-close-button"
      aria-label="Close and return to World Map"
      @click="handleBackClick"
    >
      ✕
    </button>
  </div>
</template>

<style scoped>
/* Container */
.area-map-container {
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
  background-color: #f5f5f5;
}

/* Header Bar */
.area-map-header {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 60px;
  background-color: #2c3e50;
  padding: 0 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  z-index: 1000;
  flex-shrink: 0;
}

.area-map-header__title {
  margin: 0;
  color: white;
  font-size: 1.5rem;
  font-weight: 600;
}

.area-map-header__close {
  width: 40px !important;
  height: 40px !important;
  min-width: 40px !important;
  min-height: 40px !important;
  background-color: rgba(255, 255, 255, 0.15) !important;
  color: white !important;
  border: 2px solid rgba(255, 255, 255, 0.3) !important;
  border-radius: 4px;
  font-size: 1.75rem;
  font-weight: 300;
  line-height: 1;
  cursor: pointer;
  display: flex !important;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  flex-shrink: 0 !important;
  position: relative;
  opacity: 1 !important;
  visibility: visible !important;
}

.area-map-header__close:hover {
  background-color: rgba(255, 255, 255, 0.25);
  border-color: rgba(255, 255, 255, 0.5);
  transform: scale(1.05);
}

.area-map-header__close:active {
  background-color: rgba(255, 255, 255, 0.3);
  transform: scale(0.95);
}

/* Canvas Wrapper - Scrollable Container */
.area-map-canvas-wrapper {
  flex: 1;
  overflow: auto;
  position: relative;
  background-color: #f5f5f5;
}

/* SVG Canvas */
.area-map-canvas {
  display: block;
  width: 1600px;
  height: 1200px;
  min-width: 1600px;
  min-height: 1200px;
  margin: 0 auto;
}

/* Floating Close Button (Optional Redundancy) */
.floating-close-button {
  position: absolute !important;
  bottom: 1.5rem !important;
  right: 1.5rem !important;
  width: 56px !important;
  height: 56px !important;
  min-width: 56px !important;
  min-height: 56px !important;
  background-color: #2c3e50 !important;
  color: white !important;
  border: 3px solid rgba(255, 255, 255, 0.2) !important;
  border-radius: 50%;
  font-size: 2rem;
  font-weight: 300;
  line-height: 1;
  cursor: pointer;
  display: flex !important;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  z-index: 9999 !important;
  opacity: 1 !important;
  visibility: visible !important;
  pointer-events: auto !important;
}

.floating-close-button:hover {
  background-color: #34495e;
  border-color: rgba(255, 255, 255, 0.4);
  transform: scale(1.1);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.4);
}

.floating-close-button:active {
  transform: scale(0.95);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

/* Responsive */
@media (max-width: 768px) {
  .area-map-header {
    padding: 0 1rem;
  }

  .area-map-header__title {
    font-size: 1.25rem;
  }

  .floating-close-button {
    bottom: 1rem;
    right: 1rem;
  }
}
</style>
