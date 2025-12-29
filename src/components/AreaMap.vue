<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useWorldMapStore } from '@/stores/worldMap'
import { useAreaMapStore } from '@/stores/areaMap'
import { useDialogsStore } from '@/stores/dialogs'
import { useObjectivesStore } from '@/stores/objectives'
import FeatureCard from './FeatureCard.vue'
import FoundryFeature from './features/FoundryFeature.vue'
import ShopFeature from './features/ShopFeature.vue'
import WorkshopFeature from './features/WorkshopFeature.vue'
import AlchemistFeature from './features/AlchemistFeature.vue'
import WharfFeature from './features/WharfFeature.vue'
import TavernFeature from './features/TavernFeature.vue'
import QuartermasterFeature from './features/QuartermasterFeature.vue'
import type { Feature, FeatureType } from '@/types/feature'

/**
 * AreaMap Component
 * Displays a spatial canvas with interactive Features for a specific hex area
 * Architecture: Header bar + SVG canvas with positioned Features
 * Responsive: 2x2 grid at ≥1400px, 1x4 vertical stack below
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
const dialogsStore = useDialogsStore()
const objectivesStore = useObjectivesStore()

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
  if (area.value?.areaType === 'harbor') return 'Harbor'
  return 'Area Map'
})

// Background color from area data
const backgroundColor = computed(() => area.value?.background ?? '#f5f5f5')

// Responsive layout tracking
const windowWidth = ref(window.innerWidth)
const LAYOUT_BREAKPOINT = 1400

// Layout mode: 2x2 grid or 1x4 vertical stack
const layoutMode = computed(() => (windowWidth.value >= LAYOUT_BREAKPOINT ? '2x2' : '1x4'))

// ViewBox dimensions
const VIEWBOX_WIDTH = 300
const viewBoxHeight = computed(() => (layoutMode.value === '2x2' ? 300 : 500))

// Canvas dimensions (scales with viewBox and layout mode)
const canvasWidth = computed(() => (layoutMode.value === '2x2' ? 1600 : 1000))
const canvasHeight = computed(() => (layoutMode.value === '2x2' ? 1200 : 2000))

// Feature position order for vertical stacking (upper-left, upper-right, lower-left)
const featureStackOrder = ['academy-foundry', 'academy-quartermaster', 'academy-tavern']

// Get dynamic position based on layout mode
const getFeaturePosition = (feature: Feature) => {
  if (layoutMode.value === '2x2') {
    return feature.position // Use original 2x2 grid positions
  } else {
    // Calculate 1x4 vertical stack positions
    const index = featureStackOrder.indexOf(feature.id)
    if (index === -1) return feature.position // Fallback

    return {
      x: -60, // Center horizontally (card width is 120, so -60 centers it)
      y: -230 + index * 120, // Stack vertically with 20-unit gaps (100 card + 20 gap)
    }
  }
}

// Window resize handler
const handleResize = () => {
  windowWidth.value = window.innerWidth
}

// Initialize area on mount
onMounted(() => {
  worldMapStore.incrementVisitCount(props.q, props.r)

  // Initialize area data if not already loaded
  if (!area.value) {
    if (tile.value?.type === 'academy' || (props.q === 0 && props.r === 0)) {
      areaMapStore.initializeAcademy(props.q, props.r)
    } else if (tile.value?.type === 'harbor') {
      areaMapStore.initializeHarbor(props.q, props.r)
    }
  }

  // Trigger dialog on first Academy visit
  if (tile.value?.type === 'academy' && tile.value.visitCount === 1) {
    dialogsStore.showDialogTree('headmaster-intro')
    // Complete visit-academy objective
    objectivesStore.completeObjective('visit-academy')
  }

  // Trigger dialog on first Harbor visit
  if (tile.value?.type === 'harbor' && tile.value.visitCount === 1) {
    dialogsStore.showDialogTree('harbormaster-intro')
  }

  // Add resize listener
  window.addEventListener('resize', handleResize)
})

// Cleanup on unmount
onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})

// Handle back button click
const handleBackClick = () => {
  // Deactivate any active features before leaving
  areaMapStore.setActiveFeature(null)
  emit('back')
}

// Map feature types to components
const featureComponents: Record<
  FeatureType,
  | typeof FoundryFeature
  | typeof ShopFeature
  | typeof WorkshopFeature
  | typeof AlchemistFeature
  | typeof WharfFeature
  | typeof TavernFeature
  | typeof QuartermasterFeature
> = {
  foundry: FoundryFeature,
  shop: ShopFeature,
  workshop: WorkshopFeature,
  alchemist: AlchemistFeature,
  wharf: WharfFeature,
  tavern: TavernFeature,
  quartermaster: QuartermasterFeature,
}

// Get component for a specific feature
const getFeatureComponent = (featureType: FeatureType) => {
  return featureComponents[featureType]
}

// Handle feature card click
const handleFeatureClick = (feature: Feature) => {
  if (feature.state === 'locked') {
    // For locked features, could show a tooltip or modal with requirements
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
    // TODO: Navigate to feature screen
  }
}

// Handle navigate event from feature components
const handleFeatureNavigate = (featureType: string) => {
  // TODO: Navigate to feature screen - will be implemented in a future milestone
  void featureType // Suppress unused variable warning
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
        :style="{
          width: `${canvasWidth}px`,
          height: `${canvasHeight}px`,
          minWidth: `${canvasWidth}px`,
          minHeight: `${canvasHeight}px`,
        }"
        :viewBox="`${-VIEWBOX_WIDTH / 2} ${-viewBoxHeight / 2} ${VIEWBOX_WIDTH} ${viewBoxHeight}`"
        xmlns="http://www.w3.org/2000/svg"
      >
        <!-- Background -->
        <rect
          :x="-VIEWBOX_WIDTH / 2"
          :y="layoutMode === '2x2' ? -viewBoxHeight / 2 : -viewBoxHeight / 2 - 50"
          :width="VIEWBOX_WIDTH"
          :height="layoutMode === '2x2' ? viewBoxHeight : viewBoxHeight + 100"
          :fill="backgroundColor"
        />

        <!-- Features with dynamic positions -->
        <FeatureCard
          v-for="feature in features"
          :key="feature.id"
          :feature="{ ...feature, position: getFeaturePosition(feature) }"
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
  </div>
</template>

<style scoped>
/* Container */
.area-map-container {
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100%;
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
  display: flex;
  justify-content: center;
}

/* SVG Canvas */
.area-map-canvas {
  display: block;
  align-self: flex-start;
  /* Width and height are set dynamically via inline styles based on layout mode */
}

/* Responsive */
@media (max-width: 768px) {
  .area-map-header {
    padding: 0 1rem;
  }

  .floating-close-button {
    bottom: 1rem;
    right: 1rem;
  }
}
</style>
