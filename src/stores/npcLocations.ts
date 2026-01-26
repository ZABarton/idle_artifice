/**
 * NPC Locations Store
 *
 * Tracks where NPCs are currently located in the game world.
 * Supports NPCs being present at features, in transit, or unavailable.
 * Persists to localStorage for save/load functionality.
 */

import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import type { NPCLocation, NPCLocationMap } from '@/types/npc'

// LocalStorage key
const STORAGE_KEY = 'idle-artifice-npc-locations'

// Track if we've shown storage warning to avoid spam
let hasShownStorageWarning = false

/**
 * Default NPC locations (for new game)
 * Maps NPC ID to their starting feature location
 */
function getDefaultLocations(): NPCLocationMap {
  return {
    anton: {
      status: 'present',
      featureId: 'academy-foundry',
    },
    quartermaster: {
      status: 'present',
      featureId: 'academy-quartermaster',
    },
    'tavern-keeper': {
      status: 'present',
      featureId: 'academy-tavern',
    },
  }
}

/**
 * Load NPC locations from localStorage
 * Returns saved locations if available, otherwise returns defaults
 */
function loadLocations(): NPCLocationMap {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored) as NPCLocationMap
    }
  } catch (error) {
    console.error('Failed to load NPC locations from localStorage:', error)
  }

  return getDefaultLocations()
}

/**
 * NPC Locations Store
 * Manages NPC position tracking across the game world
 */
export const useNPCLocationsStore = defineStore('npcLocations', () => {
  // State - load from localStorage or use defaults
  const locations = ref<NPCLocationMap>(loadLocations())

  // Getters

  /**
   * Check if an NPC is currently at a specific feature
   * @param npcId - The NPC's unique identifier
   * @param featureId - The feature ID to check
   * @returns True if NPC is present at the feature
   */
  const isNPCAtFeature = computed(() => (npcId: string, featureId: string): boolean => {
    const location = locations.value[npcId]
    if (!location) return false
    return location.status === 'present' && location.featureId === featureId
  })

  /**
   * Get all NPC IDs currently at a specific feature
   * @param featureId - The feature ID to check
   * @returns Array of NPC IDs present at the feature
   */
  const getNPCsAtFeature = computed(() => (featureId: string): string[] => {
    return Object.entries(locations.value)
      .filter(
        ([, location]) => location.status === 'present' && location.featureId === featureId
      )
      .map(([npcId]) => npcId)
  })

  /**
   * Get the current location of an NPC
   * @param npcId - The NPC's unique identifier
   * @returns The NPC's location, or undefined if not tracked
   */
  const getNPCLocation = computed(() => (npcId: string): NPCLocation | undefined => {
    return locations.value[npcId]
  })

  /**
   * Check if an NPC is available for interaction
   * (present at a location, not in transit or unavailable)
   * @param npcId - The NPC's unique identifier
   * @returns True if NPC is available
   */
  const isNPCAvailable = computed(() => (npcId: string): boolean => {
    const location = locations.value[npcId]
    return location?.status === 'present'
  })

  // Actions

  /**
   * Move an NPC to a new feature location
   * @param npcId - The NPC's unique identifier
   * @param featureId - The destination feature ID
   */
  function moveNPC(npcId: string, featureId: string): void {
    locations.value[npcId] = {
      status: 'present',
      featureId,
    }
  }

  /**
   * Set an NPC to in-transit status
   * @param npcId - The NPC's unique identifier
   * @param fromFeatureId - Origin feature ID (null if coming from off-map)
   * @param toFeatureId - Destination feature ID
   */
  function setNPCInTransit(npcId: string, fromFeatureId: string | null, toFeatureId: string): void {
    locations.value[npcId] = {
      status: 'in-transit',
      fromFeatureId,
      toFeatureId,
    }
  }

  /**
   * Set an NPC to unavailable status
   * @param npcId - The NPC's unique identifier
   * @param reason - Optional reason for unavailability
   */
  function setNPCUnavailable(npcId: string, reason?: string): void {
    locations.value[npcId] = {
      status: 'unavailable',
      reason,
    }
  }

  /**
   * Initialize default locations for any NPCs not already tracked
   * Called on game start to ensure all NPCs have locations
   */
  function initializeDefaultLocations(): void {
    const defaults = getDefaultLocations()
    for (const [npcId, location] of Object.entries(defaults)) {
      if (!locations.value[npcId]) {
        locations.value[npcId] = location
      }
    }
  }

  /**
   * Reset all NPC locations to defaults (for debug/testing)
   */
  function resetLocations(): void {
    locations.value = getDefaultLocations()
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch (error) {
      console.error('Failed to remove NPC locations from localStorage:', error)
    }
  }

  // Watch for changes and auto-save to localStorage
  watch(
    locations,
    () => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(locations.value))
      } catch (error) {
        console.error('Failed to save NPC locations to localStorage:', error)

        // Show warning once per session
        if (!hasShownStorageWarning) {
          console.warn('Unable to save NPC location progress. Check browser storage settings.')
          hasShownStorageWarning = true
        }
      }
    },
    { deep: true }
  )

  return {
    // State
    locations,
    // Getters
    isNPCAtFeature,
    getNPCsAtFeature,
    getNPCLocation,
    isNPCAvailable,
    // Actions
    moveNPC,
    setNPCInTransit,
    setNPCUnavailable,
    initializeDefaultLocations,
    resetLocations,
  }
})
