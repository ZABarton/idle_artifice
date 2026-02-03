<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, markRaw } from 'vue'
import { useNavigationStore } from '@/stores/navigation'
import { useWorldMapStore } from '@/stores/worldMap'
import { useAreaMapStore } from '@/stores/areaMap'
import { useDialogsStore } from '@/stores/dialogs'
import { useObjectivesStore } from '@/stores/objectives'
import { useResourcesStore } from '@/stores/resources'
import { useNotificationsStore } from '@/stores/notifications'
import { useNPCLocationsStore } from '@/stores/npcLocations'
import { useFoundryStore } from '@/stores/foundry'
import FeatureCard from './FeatureCard.vue'
import NPCIndicator from '@/components/displays/NPCIndicator.vue'
import type { Feature } from '@/types/feature'
import type { AreaMapConfig, NPCConfig } from '@/types/areaMapConfig'
import type { NPCConfig as CentralizedNPCConfig } from '@/types/npc'
import { getAreaConfigByCoords, getActiveLayout } from '@/config/area-maps'
import { getNPCById } from '@/config/npcs'
import { useNPCDialog } from '@/composables/useNPCDialog'
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

const navigationStore = useNavigationStore()
const worldMapStore = useWorldMapStore()
const areaMapStore = useAreaMapStore()
const dialogsStore = useDialogsStore()
const objectivesStore = useObjectivesStore()
const resourcesStore = useResourcesStore()
const notificationsStore = useNotificationsStore()
const npcLocationsStore = useNPCLocationsStore()
const { hasAvailableProgressionDialog, initiateNPCDialog } = useNPCDialog()

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

// Get feature config from area config
const getFeatureConfig = (feature: Feature) => {
  if (!areaConfig.value) return null

  return areaConfig.value.features.find((f) => f.id === feature.id) ?? null
}

// Get minimized displays from config
const getMinimizedDisplays = (feature: Feature) => {
  if (!areaConfig.value) return []

  const featureConfig = areaConfig.value.features.find((f) => f.id === feature.id)
  return featureConfig?.minimizedDisplays ?? []
}

// Foundry store for checking entry unlock state
const foundryStore = useFoundryStore()

// Compute props for a minimized display, adding feature-state-based props
const getDisplayProps = (display: { props?: Record<string, unknown> }, feature: Feature) => {
  const baseProps = display.props ?? {}
  // If the display has a featureId prop (like NavigationButton), add disabled based on unlock state
  if ('featureId' in baseProps) {
    const featureId = baseProps.featureId as string
    // Check foundry-specific unlock state for the academy-foundry feature
    if (featureId === 'academy-foundry') {
      return {
        ...baseProps,
        disabled: !foundryStore.isFoundryEntryUnlocked,
      }
    }
    // Default: disable if feature is locked
    return {
      ...baseProps,
      disabled: feature.state === 'locked',
    }
  }
  return baseProps
}

/**
 * Unified NPC type for internal use
 * Combines fields from both legacy NPCConfig and centralized NPCConfig
 */
interface UnifiedNPC {
  id: string
  name: string
  icon: string
  portrait: { path: string | null; alt: string }
  // Legacy fields for backward compatibility
  dialogTreeId?: string
  fallbackDialogTreeId?: string
  // Flag to indicate which system this NPC uses
  useCentralizedSystem: boolean
}

/**
 * Convert a centralized NPC config to unified format
 */
function convertCentralizedNPC(npc: CentralizedNPCConfig): UnifiedNPC {
  return {
    id: npc.id,
    name: npc.name,
    icon: npc.icon,
    portrait: npc.portrait,
    useCentralizedSystem: true,
  }
}

/**
 * Convert a legacy NPC config to unified format
 */
function convertLegacyNPC(npc: NPCConfig): UnifiedNPC {
  return {
    id: npc.id,
    name: npc.name,
    icon: npc.icon || '💬',
    portrait: npc.portrait,
    dialogTreeId: npc.dialogTreeId,
    fallbackDialogTreeId: npc.fallbackDialogTreeId,
    useCentralizedSystem: false,
  }
}

// Get NPCs from feature config (supports both new npcIds and legacy npcs patterns)
const getNPCs = (feature: Feature): UnifiedNPC[] => {
  if (!areaConfig.value) return []

  const featureConfig = areaConfig.value.features.find((f) => f.id === feature.id)
  if (!featureConfig) return []

  // New pattern: use npcIds with centralized registry and location filtering
  if (featureConfig.npcIds && featureConfig.npcIds.length > 0) {
    return featureConfig.npcIds
      .filter((npcId) => npcLocationsStore.isNPCAtFeature(npcId, feature.id))
      .map((npcId) => getNPCById(npcId))
      .filter((npc): npc is CentralizedNPCConfig => npc !== undefined)
      .map(convertCentralizedNPC)
  }

  // Legacy pattern: use inline npcs array
  if (featureConfig.npcs && featureConfig.npcs.length > 0) {
    return featureConfig.npcs.map(convertLegacyNPC)
  }

  return []
}

// Check if NPC has available progression dialog (shows indicator)
const isNPCConversationAvailable = (npc: UnifiedNPC): boolean => {
  if (npc.useCentralizedSystem) {
    // New system: use dialog progression logic
    return hasAvailableProgressionDialog(npc.id)
  }
  // Legacy system: check if primary dialog is completed
  return npc.dialogTreeId ? !dialogsStore.hasCompletedDialogTree(npc.dialogTreeId) : false
}

// Handle NPC click - trigger dialog
const handleNPCClick = async (npcId: string, featureId: string) => {
  if (!areaConfig.value) return

  // Find the NPC in the unified list
  const feature = features.value.find((f) => f.id === featureId)
  if (!feature) {
    console.error(`Feature ${featureId} not found`)
    return
  }

  const npcs = getNPCs(feature)
  const npc = npcs.find((n) => n.id === npcId)

  if (!npc) {
    console.error(`NPC ${npcId} not found in feature ${featureId}`)
    return
  }

  // Check if this is a new conversation (for objective tracking)
  const isNewConversation = isNPCConversationAvailable(npc)

  if (npc.useCentralizedSystem) {
    // New system: use dialog progression logic
    await initiateNPCDialog(npcId)
  } else {
    // Legacy system: use dialogTreeId / fallbackDialogTreeId
    const hasPrimaryDialog = npc.dialogTreeId
      ? !dialogsStore.hasCompletedDialogTree(npc.dialogTreeId)
      : false
    const dialogTreeId =
      hasPrimaryDialog || !npc.fallbackDialogTreeId ? npc.dialogTreeId : npc.fallbackDialogTreeId

    if (dialogTreeId) {
      await dialogsStore.showDialogTree(dialogTreeId)
    }
  }

  // If this was a new conversation, check for and complete any related objectives
  if (isNewConversation) {
    // Complete any objective subtasks associated with this feature
    const objectives = objectivesStore.objectives
    for (const objective of objectives) {
      if (objective.subtasks) {
        for (const subtask of objective.subtasks) {
          if (subtask.featureId === featureId && !subtask.completed) {
            objectivesStore.updateSubtask(objective.id, subtask.id, true)
          }
        }
      }
    }
  }
}

// Generate NPC indicator display configs for a feature
const getNPCIndicatorDisplays = (feature: Feature) => {
  const npcs = getNPCs(feature)
  if (npcs.length === 0) return []

  return npcs.map((npc) => ({
    component: markRaw(NPCIndicator),
    props: {
      npcName: npc.name,
      portraitPath: npc.portrait.path,
      portraitAlt: npc.portrait.alt,
      hasAvailableConversation: isNPCConversationAvailable(npc),
      showBadge: isNPCConversationAvailable(npc),
      badgeText: '!',
      npcId: npc.id,
    },
    npcId: npc.id,
    featureId: feature.id,
  }))
}

// Check if feature has any NPCs with new conversations
const hasNewConversations = (feature: Feature): boolean => {
  const npcs = getNPCs(feature)
  return npcs.some((npc) => isNPCConversationAvailable(npc))
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

  // For navigation-type features, navigate to feature screen
  if (feature.interactionType === 'navigation') {
    navigationStore.navigateToFeatureScreen(feature.id)
  }
}

// Handle navigate event from feature components
const handleFeatureNavigate = (featureId: string) => {
  navigationStore.navigateToFeatureScreen(featureId)
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
      <button class="area-map-header__close" aria-label="Back" @click="handleBackClick">
        ← Back
      </button>
      <h1 class="area-map-header__title">{{ areaTitle }}</h1>
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
          <!-- Minimized view: NPC indicators + display components from config -->
          <template #minimized>
            <div
              v-if="
                getNPCIndicatorDisplays(feature).length > 0 ||
                getMinimizedDisplays(feature).length > 0
              "
              class="minimized-displays-container"
            >
              <!-- NPC Indicators (portraits with names) -->
              <div v-if="getNPCIndicatorDisplays(feature).length > 0" class="npc-row">
                <component
                  :is="npcDisplay.component"
                  v-for="npcDisplay in getNPCIndicatorDisplays(feature)"
                  :key="`npc-${npcDisplay.npcId}`"
                  v-bind="npcDisplay.props"
                  @npc-click="handleNPCClick(npcDisplay.npcId, npcDisplay.featureId)"
                />
              </div>

              <!-- Other display components from config -->
              <component
                :is="display.component"
                v-for="(display, index) in getMinimizedDisplays(feature)"
                :key="`display-${index}`"
                v-bind="getDisplayProps(display, feature)"
              />
            </div>
          </template>

          <!-- Expanded view: NPC indicators + dynamic feature component from config -->
          <div class="expanded-content">
            <!-- NPC Indicators (portraits with names) - shown in expanded view too -->
            <div v-if="getNPCIndicatorDisplays(feature).length > 0" class="npc-row">
              <component
                :is="npcDisplay.component"
                v-for="npcDisplay in getNPCIndicatorDisplays(feature)"
                :key="`npc-expanded-${npcDisplay.npcId}`"
                v-bind="npcDisplay.props"
                @npc-click="handleNPCClick(npcDisplay.npcId, npcDisplay.featureId)"
              />
            </div>

            <!-- Feature component content -->
            <component
              :is="getFeatureComponent(feature)"
              :feature="feature"
              :feature-config="getFeatureConfig(feature)"
              @navigate="handleFeatureNavigate(feature.id)"
              @npc-click="(npcId: string) => handleNPCClick(npcId, feature.id)"
            />
          </div>
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
  justify-content: center;
  padding: 1rem 2rem;
  background-color: #2c3e50;
  color: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  z-index: 10;
}

.area-map-header__title {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  text-align: center;
}

.area-map-header__close {
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

.area-map-header__close:hover {
  background-color: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.5);
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
  gap: 0.75rem;
  width: 100%;
}

/* NPC Row - horizontal layout for NPC portraits */
.npc-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  justify-content: flex-start;
  align-items: flex-start;
}

/* Expanded Content Container */
.expanded-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
}

.area-map-header__close {
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
