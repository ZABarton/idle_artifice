import { defineStore } from 'pinia'
import { ref } from 'vue'

/**
 * View types for navigation
 */
export type ViewType = 'world-map' | 'area-map'

/**
 * Navigation Store
 * Manages view state and navigation between World Map and Area Map
 * Architecture designed to be router-compatible for future migration
 */
export const useNavigationStore = defineStore('navigation', () => {
  // State
  const currentView = ref<ViewType>('world-map')
  const selectedHex = ref<{ q: number; r: number } | null>(null)

  // Actions
  /**
   * Navigate to the Area Map for a specific hex tile
   * In future: replace with router.push({ name: 'area-map', params: { q, r } })
   */
  function navigateToAreaMap(q: number, r: number) {
    selectedHex.value = { q, r }
    currentView.value = 'area-map'
  }

  /**
   * Navigate back to the World Map
   * In future: replace with router.push({ name: 'world-map' })
   */
  function navigateToWorldMap() {
    currentView.value = 'world-map'
    // Keep selectedHex for potential breadcrumb or history features
  }

  /**
   * Reset navigation state
   */
  function reset() {
    currentView.value = 'world-map'
    selectedHex.value = null
  }

  return {
    // State
    currentView,
    selectedHex,
    // Actions
    navigateToAreaMap,
    navigateToWorldMap,
    reset,
  }
})
