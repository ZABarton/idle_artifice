import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { AreaMap } from '@/types/areaMap'
import type { Feature } from '@/types/feature'
import type { AreaMapConfig } from '@/types/areaMapConfig'

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
   */
  const activeFeatureId = ref<string | null>(null)

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
   */
  function initializeAreaFromConfig(config: AreaMapConfig, q: number, r: number) {
    // Convert FeatureConfig to Feature by removing config-specific fields
    const features: Feature[] = config.features.map((featureConfig) => {
      // Use the first available position as the default position
      // (actual position will be determined dynamically based on layout)
      const defaultPosition = Object.values(featureConfig.positions)[0] || { x: 0, y: 0 }

      return {
        id: featureConfig.id,
        type: featureConfig.type,
        name: featureConfig.name,
        description: featureConfig.description,
        icon: featureConfig.icon,
        position: defaultPosition,
        state: featureConfig.state,
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
  }
})
