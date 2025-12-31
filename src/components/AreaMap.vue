<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useWorldMapStore } from '@/stores/worldMap'
import { useAreaMapStore } from '@/stores/areaMap'
import { useDialogsStore } from '@/stores/dialogs'
import { useObjectivesStore } from '@/stores/objectives'
import { useResourcesStore } from '@/stores/resources'
import { useNotificationsStore } from '@/stores/notifications'
import FeatureCard from './FeatureCard.vue'
import type { Feature } from '@/types/feature'
import type { AreaMapConfig } from '@/types/areaMapConfig'
import { getAreaConfigByCoords, getActiveLayout } from '@/config/area-maps'
import { executeTriggers, createTriggerContext } from '@/services/areaTriggers'

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
const resourcesStore = useResourcesStore()
const notificationsStore = useNotificationsStore()

// Get the tile data for this area
const tile = computed(() => worldMapStore.getTileAt(props.q, props.r))

// Area configuration loaded from config files
const areaConfig = ref<AreaMapConfig | null>(null)

// Get area data from areaMapStore
const area = computed(() => areaMapStore.getArea(props.q, props.r))

// Get visible features (filters out hidden features)
const features = computed(() => areaMapStore.getFeatures(props.q, props.r))

// Area title for header
const areaTitle = computed(() => {
  if (!areaConfig.value) return 'Area Map'
  const areaType = areaConfig.value.areaType
  // Capitalize first letter
  return areaType.charAt(0).toUpperCase() + areaType.slice(1)
})

// Background color from area config
const backgroundColor = computed(() => areaConfig.value?.background ?? '#f5f5f5')

// Responsive layout tracking
const windowWidth = ref(window.innerWidth)

// Active layout based on window width and area config
const activeLayout = computed(() => {
  if (!areaConfig.value) {
    // Fallback layout if config not loaded
    return {
      name: 'default',
      config: {
        mode: '2x2' as const,
        viewBoxWidth: 300,
        viewBoxHeight: 300,
        canvasWidth: 1600,
        canvasHeight: 1200,
      },
    }
  }
  return getActiveLayout(areaConfig.value, windowWidth.value)
})

// Layout dimensions from active layout config
const viewBoxWidth = computed(() => activeLayout.value.config.viewBoxWidth)
const viewBoxHeight = computed(() => activeLayout.value.config.viewBoxHeight)
const canvasWidth = computed(() => activeLayout.value.config.canvasWidth)
const canvasHeight = computed(() => activeLayout.value.config.canvasHeight)

// Get dynamic position based on layout mode and config
const getFeaturePosition = (feature: Feature) => {
  if (!areaConfig.value) {
    return feature.position // Fallback to feature's default position
  }

  // Find the feature config that matches this feature
  const featureConfig = areaConfig.value.features.find((f) => f.id === feature.id)
  if (!featureConfig) {
    return feature.position // Fallback
  }

  // Get position for current layout
  const layoutName = activeLayout.value.name
  const position = featureConfig.positions[layoutName]

  return position ?? feature.position // Fallback if position not defined for this layout
}

// Window resize handler
const handleResize = () => {
  windowWidth.value = window.innerWidth
}

// Initialize area on mount
onMounted(async () => {
  // Load area configuration
  const config = getAreaConfigByCoords(props.q, props.r, worldMapStore)
  if (!config) {
    console.error(`Failed to load area config for (${props.q}, ${props.r})`)
    notificationsStore.showError(
      'Area Load Error',
      'Failed to load area configuration. This area may not be implemented yet.',
      5000
    )
    return
  }
  areaConfig.value = config

  // Increment visit count
  worldMapStore.incrementVisitCount(props.q, props.r)
  const visitCount = tile.value?.visitCount || 0

  // Initialize area data if not already loaded
  if (!area.value) {
    areaMapStore.initializeAreaFromConfig(config, props.q, props.r)
  }

  // Create trigger context
  const triggerContext = createTriggerContext(
    {
      dialogs: dialogsStore,
      objectives: objectivesStore,
      resources: resourcesStore,
      worldMap: worldMapStore,
      areaMap: areaMapStore,
      notifications: notificationsStore,
    },
    { q: props.q, r: props.r },
    config.areaType
  )

  // Execute onFirstVisit triggers
  if (visitCount === 1) {
    await executeTriggers(config.triggers, 'onFirstVisit', triggerContext)
  }

  // Execute onEnter triggers (every visit)
  await executeTriggers(config.triggers, 'onEnter', triggerContext)

  // Add resize listener
  window.addEventListener('resize', handleResize)
})

// Cleanup on unmount
onUnmounted(async () => {
  // Execute onExit triggers
  if (areaConfig.value) {
    const triggerContext = createTriggerContext(
      {
        dialogs: dialogsStore,
        objectives: objectivesStore,
        resources: resourcesStore,
        worldMap: worldMapStore,
        areaMap: areaMapStore,
        notifications: notificationsStore,
      },
      { q: props.q, r: props.r },
      areaConfig.value.areaType
    )
    await executeTriggers(areaConfig.value.triggers, 'onExit', triggerContext)
  }

  window.removeEventListener('resize', handleResize)
})

// Handle back button click
const handleBackClick = () => {
  // Deactivate any active features before leaving
  areaMapStore.setActiveFeature(null)
  emit('back')
}

// Get feature component from config
const getFeatureComponent = (feature: Feature) => {
  if (!areaConfig.value) return null

  const featureConfig = areaConfig.value.features.find((f) => f.id === feature.id)
  return featureConfig?.component ?? null
}

// Handle feature card click
const handleFeatureClick = async (feature: Feature) => {
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

  // Execute onFeatureInteract triggers
  if (areaConfig.value) {
    const triggerContext = createTriggerContext(
      {
        dialogs: dialogsStore,
        objectives: objectivesStore,
        resources: resourcesStore,
        worldMap: worldMapStore,
        areaMap: areaMapStore,
        notifications: notificationsStore,
      },
      { q: props.q, r: props.r },
      areaConfig.value.areaType,
      feature.id // Pass feature ID for onFeatureInteract triggers
    )
    await executeTriggers(areaConfig.value.triggers, 'onFeatureInteract', triggerContext)
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
        :viewBox="`${-viewBoxWidth / 2} ${-viewBoxHeight / 2} ${viewBoxWidth} ${viewBoxHeight}`"
        xmlns="http://www.w3.org/2000/svg"
      >
        <!-- Background -->
        <rect
          :x="-viewBoxWidth / 2"
          :y="-viewBoxHeight / 2"
          :width="viewBoxWidth"
          :height="viewBoxHeight"
          :fill="backgroundColor"
        />

        <!-- Features with dynamic positions -->
        <FeatureCard
          v-for="feature in features"
          :key="feature.id"
          :feature="{ ...feature, position: getFeaturePosition(feature) }"
          @click="handleFeatureClick"
        >
          <!-- Dynamic feature component from config -->
          <component
            :is="getFeatureComponent(feature)"
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
