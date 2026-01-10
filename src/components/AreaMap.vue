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
 * Displays interactive Features for a specific hex area in a vertical stack
 * Architecture: Header bar + vertically stacked feature cards
 * Responsive: Different max widths for desktop vs mobile
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
        maxFeatureWidth: 1200,
      },
    }
  }
  return getActiveLayout(areaConfig.value, windowWidth.value)
})

// Maximum feature width from active layout config
const maxFeatureWidth = computed(() => activeLayout.value.config.maxFeatureWidth ?? 1200)

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

// Get minimized displays from config
const getMinimizedDisplays = (feature: Feature) => {
  if (!areaConfig.value) return []

  const featureConfig = areaConfig.value.features.find((f) => f.id === feature.id)
  return featureConfig?.minimizedDisplays ?? []
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

// Handle expand/collapse toggle from feature cards
const handleFeatureExpandToggle = (feature: Feature) => {
  areaMapStore.toggleFeatureExpanded(feature.id)
}
</script>

<template>
  <div class="area-map-container" :style="{ backgroundColor }">
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

    <!-- Feature Stack -->
    <div class="area-map-content">
      <div class="feature-stack" :style="{ maxWidth: `${maxFeatureWidth}px` }">
        <FeatureCard
          v-for="feature in features"
          :key="feature.id"
          :feature="feature"
          @click="handleFeatureClick"
          @toggle-expand="handleFeatureExpandToggle"
        >
          <!-- Minimized view: display components from config -->
          <template #minimized>
            <div
              v-if="getMinimizedDisplays(feature).length > 0"
              class="minimized-displays-container"
            >
              <component
                :is="display.component"
                v-for="(display, index) in getMinimizedDisplays(feature)"
                :key="index"
                v-bind="display.props"
              />
            </div>
          </template>

          <!-- Expanded view: dynamic feature component from config -->
          <component
            :is="getFeatureComponent(feature)"
            @navigate="handleFeatureNavigate(feature.type)"
          />
        </FeatureCard>
      </div>
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

/* Content Area - Scrollable Container */
.area-map-content {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  position: relative;
  padding: 1.5rem;
  min-height: 0;
}

/* Custom scrollbar styling for area map content */
.area-map-content::-webkit-scrollbar {
  width: 12px;
}

.area-map-content::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.05);
}

.area-map-content::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 6px;
  border: 2px solid transparent;
  background-clip: padding-box;
}

.area-map-content::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.3);
  border: 2px solid transparent;
  background-clip: padding-box;
}

/* Feature Stack */
.feature-stack {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin: 0 auto;
}

/* Minimized Displays Container */
.minimized-displays-container {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  width: 100%;
}

/* Responsive */
@media (max-width: 768px) {
  .area-map-header {
    padding: 0 1rem;
  }

  .area-map-content {
    padding: 1rem;
  }

  .feature-stack {
    gap: 0.75rem;
  }
}
</style>
