import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { AreaMap } from '@/types/areaMap'
import type { Feature } from '@/types/feature'

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

  // Initialize Academy area with starter data
  // This will be moved to JSON config in a future milestone
  function initializeAcademy(q: number, r: number) {
    const academyArea: AreaMap = {
      areaType: 'academy',
      coordinates: { q, r },
      background: '#e8dcc4', // Light beige/stone color
      features: [
        {
          id: 'academy-foundry',
          type: 'foundry',
          name: 'Foundry',
          icon: '🔨', // Placeholder emoji icon
          position: { x: -130, y: -110 }, // Top-left, centered 2x2 grid with 20-unit gaps
          state: 'unlocked',
          isActive: false,
          interactionType: 'navigation',
        },
        {
          id: 'academy-workshop',
          type: 'workshop',
          name: 'Workshop',
          icon: '🔧', // Placeholder emoji icon
          position: { x: 10, y: -110 }, // Top-right, centered 2x2 grid with 20-unit gaps
          state: 'locked',
          isActive: false,
          prerequisites: [
            {
              type: 'feature',
              id: 'academy-foundry',
              description: 'Complete Foundry tutorial',
            },
          ],
          interactionType: 'navigation',
        },
        {
          id: 'academy-alchemist',
          type: 'alchemist',
          name: 'Alchemist',
          icon: '⚗️', // Placeholder emoji icon
          position: { x: -130, y: 10 }, // Bottom-left, centered 2x2 grid with 20-unit gaps
          state: 'locked',
          isActive: false,
          prerequisites: [
            {
              type: 'resource',
              id: 'mystical-essence',
              description: 'Gather mystical essence',
            },
          ],
          interactionType: 'navigation',
        },
        {
          id: 'academy-shop',
          type: 'shop',
          name: 'Shop',
          icon: '🏪', // Placeholder emoji icon
          position: { x: 10, y: 10 }, // Bottom-right, centered 2x2 grid with 20-unit gaps
          state: 'unlocked',
          isActive: false,
          interactionType: 'inline',
        },
      ],
    }

    initializeArea(academyArea)
  }

  // Initialize Harbor area with starter data
  // This will be moved to JSON config in a future milestone
  function initializeHarbor(q: number, r: number) {
    const harborArea: AreaMap = {
      areaType: 'harbor',
      coordinates: { q, r },
      background: '#d3d3d3', // Light gray
      features: [
        {
          id: 'harbor-wharf',
          type: 'wharf',
          name: 'The Wharf',
          icon: '⚓', // Anchor emoji icon
          position: { x: 0, y: 0 }, // Centered
          state: 'locked',
          isActive: false,
          interactionType: 'navigation',
        },
      ],
    }

    initializeArea(harborArea)
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
    updateFeatureState,
    setActiveFeature,
    checkPrerequisites,
    tryUnlockFeature,
    initializeAcademy,
    initializeHarbor,
    reset,
  }
})
