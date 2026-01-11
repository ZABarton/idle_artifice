import { defineStore } from 'pinia'
import { ref } from 'vue'

/**
 * View types for navigation
 */
export type ViewType = 'world-map' | 'area-map' | 'feature-screen' | 'objectives-view'

/**
 * Recent location entry
 */
export interface RecentLocation {
  q: number
  r: number
  type: string | null
  timestamp: number
}

/**
 * Navigation Store
 * Manages view state and navigation between World Map and Area Map
 * Architecture designed to be router-compatible for future migration
 */
export const useNavigationStore = defineStore('navigation', () => {
  // State
  const currentView = ref<ViewType>('world-map')
  const previousView = ref<ViewType>('world-map')
  const selectedHex = ref<{ q: number; r: number } | null>(null)
  const selectedFeatureId = ref<string | null>(null)
  const recentLocations = ref<RecentLocation[]>([])
  const hasViewedWorldMap = ref<boolean>(false)

  // Actions
  /**
   * Navigate to the Area Map for a specific hex tile
   * In future: replace with router.push({ name: 'area-map', params: { q, r } })
   */
  function navigateToAreaMap(q: number, r: number, hexType: string | null = null) {
    previousView.value = currentView.value
    selectedHex.value = { q, r }
    currentView.value = 'area-map'
    addRecentLocation(q, r, hexType)
  }

  /**
   * Navigate back to the World Map
   * In future: replace with router.push({ name: 'world-map' })
   */
  function navigateToWorldMap() {
    previousView.value = currentView.value
    currentView.value = 'world-map'
    selectedFeatureId.value = null
    // Keep selectedHex for potential breadcrumb or history features
  }

  /**
   * Navigate to Feature Screen for a specific feature
   * Can only navigate from area-map view
   * In future: replace with router.push({ name: 'feature-screen', params: { featureId } })
   */
  function navigateToFeatureScreen(featureId: string) {
    // Guard: only allow navigation from area-map view
    if (currentView.value !== 'area-map') {
      console.warn('Cannot navigate to feature screen from', currentView.value)
      return
    }

    previousView.value = currentView.value
    selectedFeatureId.value = featureId
    currentView.value = 'feature-screen'
  }

  /**
   * Navigate back to Area Map from Feature Screen
   * In future: replace with router.back() or router.push({ name: 'area-map' })
   */
  function navigateBackToAreaMap() {
    // Guard: should only be called from feature-screen
    if (currentView.value !== 'feature-screen') {
      console.warn('navigateBackToAreaMap called from non-feature-screen view:', currentView.value)
      return
    }

    previousView.value = currentView.value
    selectedFeatureId.value = null
    currentView.value = 'area-map'
  }

  /**
   * Mark the World Map as viewed (for first-time tutorial triggers)
   */
  function markWorldMapViewed() {
    hasViewedWorldMap.value = true
  }

  /**
   * Navigate to the Objectives View
   * In future: replace with router.push({ name: 'objectives-view' })
   */
  function navigateToObjectivesView() {
    previousView.value = currentView.value
    currentView.value = 'objectives-view'
  }

  /**
   * Navigate back to the previous view
   * Used for back buttons in sub-views
   */
  function navigateToPreviousView() {
    const targetView = previousView.value
    previousView.value = currentView.value
    currentView.value = targetView
  }

  /**
   * Add a location to the recent locations list
   * Prevents duplicates by moving existing entries to the front
   * Limits to 5 most recent locations
   */
  function addRecentLocation(q: number, r: number, hexType: string | null = null) {
    // Remove existing entry for this location if present
    const existingIndex = recentLocations.value.findIndex((loc) => loc.q === q && loc.r === r)
    if (existingIndex !== -1) {
      recentLocations.value.splice(existingIndex, 1)
    }

    // Add to front of list
    recentLocations.value.unshift({
      q,
      r,
      type: hexType,
      timestamp: Date.now(),
    })

    // Limit to 5 most recent
    if (recentLocations.value.length > 5) {
      recentLocations.value = recentLocations.value.slice(0, 5)
    }
  }

  /**
   * Reset navigation state
   */
  function reset() {
    currentView.value = 'world-map'
    selectedHex.value = null
    selectedFeatureId.value = null
    recentLocations.value = []
    hasViewedWorldMap.value = false
  }

  return {
    // State
    currentView,
    previousView,
    selectedHex,
    selectedFeatureId,
    recentLocations,
    hasViewedWorldMap,
    // Actions
    navigateToAreaMap,
    navigateToWorldMap,
    navigateToFeatureScreen,
    navigateBackToAreaMap,
    navigateToObjectivesView,
    navigateToPreviousView,
    addRecentLocation,
    markWorldMapViewed,
    reset,
  }
})
