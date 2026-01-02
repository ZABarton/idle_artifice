import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import type { AreaMap } from '@/types/areaMap'
import type { Feature } from '@/types/feature'
import type { AreaMapConfig } from '@/types/areaMapConfig'

// LocalStorage key
const STORAGE_KEY_AREA_MAPS = 'idle-artifice-area-maps'

// Track if we've shown storage warning to avoid spam
let hasShownStorageWarning = false

/**
 * Saved feature state (what gets persisted to localStorage)
 */
interface SavedFeatureState {
  id: string
  state: Feature['state']
}

interface SavedAreaState {
  coordinates: string // "q,r"
  features: SavedFeatureState[]
}

interface SavedAreaMapsState {
  areas: SavedAreaState[]
}

/**
 * Load saved area maps state from localStorage
 */
function loadSavedAreaMaps(): SavedAreaMapsState | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_AREA_MAPS)
    if (stored) {
      return JSON.parse(stored) as SavedAreaMapsState
    }
  } catch (error) {
    console.error('Failed to load area maps from localStorage:', error)
  }
  return null
}

/**
 * Area Map Store
 * Manages area map data and feature states
 * Each area is keyed by its hex coordinates (q,r)
 */
export const useAreaMapStore = defineStore('areaMap', () => {
  // State
  /**
   * Map of area data, keyed by "q,r" coordinate string
   */
  const areas = ref<Map<string, AreaMap>>(new Map())

  /**
   * Currently active feature ID (for highlighting/interaction)
   * This is UI state and NOT persisted to localStorage
   */
  const activeFeatureId = ref<string | null>(null)

  /**
   * Saved feature states loaded from localStorage
   * Used to restore feature states when areas are initialized
   */
  const savedFeatureStates = ref<Map<string, Map<string, Feature['state']>>>(new Map())

  // Load saved feature states on store creation
  const savedData = loadSavedAreaMaps()
  if (savedData) {
    savedData.areas.forEach((area) => {
      const featureStatesMap = new Map(area.features.map((f) => [f.id, f.state]))
      savedFeatureStates.value.set(area.coordinates, featureStatesMap)
    })
  }

  // Getters
  /**
   * Get area data by hex coordinates
   */
  const getArea = computed(() => (q: number, r: number): AreaMap | undefined => {
    const key = `${q},${r}`
    return areas.value.get(key)
  })

  /**
   * Get all features for a specific area
   */
  const getFeatures = computed(() => (q: number, r: number): Feature[] => {
    const area = getArea.value(q, r)
    return area?.features.filter((f) => f.state !== 'hidden') ?? []
  })

  /**
   * Get a specific feature by ID across all areas
   */
  const getFeatureById = computed(() => (featureId: string): Feature | undefined => {
    for (const area of areas.value.values()) {
      const feature = area.features.find((f) => f.id === featureId)
      if (feature) return feature
    }
    return undefined
  })

  // Actions
  /**
   * Initialize an area with its data
   * Called when an area is first created or loaded
   */
  function initializeArea(areaData: AreaMap) {
    const key = `${areaData.coordinates.q},${areaData.coordinates.r}`
    areas.value.set(key, areaData)
  }

  /**
   * Update a feature's state (hidden/locked/unlocked)
   */
  function updateFeatureState(featureId: string, newState: Feature['state']) {
    const feature = getFeatureById.value(featureId)
    if (feature) {
      feature.state = newState
    }
  }

  /**
   * Set a feature as active (for interaction/highlighting)
   * Only one feature can be active at a time
   */
  function setActiveFeature(featureId: string | null) {
    // Deactivate previous feature
    if (activeFeatureId.value) {
      const prevFeature = getFeatureById.value(activeFeatureId.value)
      if (prevFeature) {
        prevFeature.isActive = false
      }
    }

    // Activate new feature
    activeFeatureId.value = featureId
    if (featureId) {
      const feature = getFeatureById.value(featureId)
      if (feature) {
        feature.isActive = true
      }
    }
  }

  /**
   * Check if a feature's prerequisites are met
   */
  function checkPrerequisites(featureId: string): boolean {
    const feature = getFeatureById.value(featureId)
    if (!feature || !feature.prerequisites) {
      return true // No prerequisites means it's unlocked by default
    }

    // For now, just check if prerequisite features are unlocked
    // This can be expanded to check resources, milestones, etc.
    return feature.prerequisites.every((prereq) => {
      if (prereq.type === 'feature') {
        const prereqFeature = getFeatureById.value(prereq.id)
        return prereqFeature?.state === 'unlocked'
      }
      // Add other prerequisite type checks here as needed
      return false
    })
  }

  /**
   * Attempt to unlock a feature if prerequisites are met
   */
  function tryUnlockFeature(featureId: string): boolean {
    const feature = getFeatureById.value(featureId)
    if (!feature || feature.state !== 'locked') {
      return false
    }

    if (checkPrerequisites(featureId)) {
      updateFeatureState(featureId, 'unlocked')
      return true
    }

    return false
  }

  /**
   * Reset store state
   */
  function reset() {
    areas.value.clear()
    activeFeatureId.value = null
  }

  /**
   * Initialize area from configuration
   * Converts FeatureConfig to Feature and creates AreaMap
   * Restores saved feature states from localStorage if available
   */
  function initializeAreaFromConfig(config: AreaMapConfig, q: number, r: number) {
    const key = `${q},${r}`
    const savedStates = savedFeatureStates.value.get(key)

    // Convert FeatureConfig to Feature by removing config-specific fields
    const features: Feature[] = config.features.map((featureConfig) => {
      // Use the first available position as the default position
      // (actual position will be determined dynamically based on layout)
      const defaultPosition = Object.values(featureConfig.positions)[0] || { x: 0, y: 0 }

      // Restore saved state if available, otherwise use config default
      const savedState = savedStates?.get(featureConfig.id)

      return {
        id: featureConfig.id,
        type: featureConfig.type,
        name: featureConfig.name,
        description: featureConfig.description,
        icon: featureConfig.icon,
        position: defaultPosition,
        state: savedState ?? featureConfig.state,
        isActive: featureConfig.isActive,
        prerequisites: featureConfig.prerequisites,
        interactionType: featureConfig.interactionType,
      }
    })

    const areaMap: AreaMap = {
      areaType: config.areaType,
      coordinates: { q, r },
      background: config.background,
      backgroundImage: config.backgroundImage,
      features,
    }

    initializeArea(areaMap)
  }

  /**
   * Save area maps state to localStorage
   * Only persists feature states, not full area data
   */
  function saveAreaMaps(): void {
    try {
      const state: SavedAreaMapsState = {
        areas: Array.from(areas.value.entries()).map(([key, area]) => ({
          coordinates: key,
          features: area.features.map((f) => ({
            id: f.id,
            state: f.state,
          })),
        })),
      }

      localStorage.setItem(STORAGE_KEY_AREA_MAPS, JSON.stringify(state))

      // Also update savedFeatureStates for future area initializations
      savedFeatureStates.value.clear()
      state.areas.forEach((area) => {
        const featureStatesMap = new Map(area.features.map((f) => [f.id, f.state]))
        savedFeatureStates.value.set(area.coordinates, featureStatesMap)
      })
    } catch (error) {
      console.error('Failed to save area maps to localStorage:', error)

      // Show warning once per session
      if (!hasShownStorageWarning) {
        console.warn('Unable to save area map progress. Check browser storage settings.')
        hasShownStorageWarning = true
      }
    }
  }

  /**
   * Reset area maps to default state (for debug/testing)
   */
  function resetAreaMaps(): void {
    try {
      localStorage.removeItem(STORAGE_KEY_AREA_MAPS)
    } catch (error) {
      console.error('Failed to remove area maps from localStorage:', error)
    }
    savedFeatureStates.value.clear()
    reset()
  }

  // Watch for changes and auto-save to localStorage
  watch(
    areas,
    () => {
      saveAreaMaps()
    },
    { deep: true }
  )

  return {
    // State
    areas,
    activeFeatureId,
    // Getters
    getArea,
    getFeatures,
    getFeatureById,
    // Actions
    initializeArea,
    initializeAreaFromConfig,
    updateFeatureState,
    setActiveFeature,
    checkPrerequisites,
    tryUnlockFeature,
    reset,
    resetAreaMaps,
  }
})
