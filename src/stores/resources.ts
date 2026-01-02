import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import type { Resource } from '@/types/resources'

// LocalStorage key
const STORAGE_KEY_RESOURCES = 'idle-artifice-resources'

// Track if we've shown storage warning to avoid spam
let hasShownStorageWarning = false

/**
 * Get default initial resources (for new game)
 */
function getDefaultResources(): Resource[] {
  return [
    {
      id: 'wood',
      name: 'Wood',
      amount: 50,
      icon: '🪵',
      category: 'basic_materials',
    },
    {
      id: 'stone',
      name: 'Stone',
      amount: 30,
      icon: '🪨',
      category: 'basic_materials',
    },
    {
      id: 'iron',
      name: 'Iron',
      amount: 20,
      icon: '⚙️',
      category: 'metals',
    },
    {
      id: 'gold',
      name: 'Gold',
      amount: 10,
      icon: '🪙',
      category: 'metals',
    },
    {
      id: 'mystical_essence',
      name: 'Mystical Essence',
      amount: 5,
      icon: '✨',
      category: 'magical',
    },
  ]
}

/**
 * Load resources from localStorage
 * Returns saved resources if available, otherwise returns default initial resources
 */
function loadResources(): Resource[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_RESOURCES)
    if (stored) {
      return JSON.parse(stored) as Resource[]
    }
  } catch (error) {
    console.error('Failed to load resources from localStorage:', error)
  }

  // Return default resources for new game
  return getDefaultResources()
}

/**
 * Resources Store
 * Manages the global resource pool accessible across all game areas
 */
export const useResourcesStore = defineStore('resources', () => {
  // State - load from localStorage or use defaults
  const resources = ref<Resource[]>(loadResources())

  // Getters
  const getResourceById = computed(() => (id: string) => {
    return resources.value.find((resource) => resource.id === id)
  })

  const getResourcesByCategory = computed(() => (category?: string) => {
    if (!category) {
      return resources.value
    }
    return resources.value.filter((resource) => resource.category === category)
  })

  const totalResources = computed(() => resources.value.length)

  const allResources = computed(() => resources.value)

  // Actions

  /**
   * Add a specific amount to a resource
   * @param id - Resource identifier
   * @param amount - Amount to add (must be positive)
   * @returns true if successful, false if resource not found or invalid amount
   */
  function addResource(id: string, amount: number): boolean {
    if (amount < 0) {
      return false
    }

    const resource = resources.value.find((r) => r.id === id)
    if (!resource) {
      return false
    }

    resource.amount += amount
    return true
  }

  /**
   * Remove a specific amount from a resource
   * Will not allow resource to go below 0
   * @param id - Resource identifier
   * @param amount - Amount to remove (must be positive)
   * @returns true if successful, false if insufficient resources or invalid amount
   */
  function removeResource(id: string, amount: number): boolean {
    if (amount < 0) {
      return false
    }

    const resource = resources.value.find((r) => r.id === id)
    if (!resource) {
      return false
    }

    if (resource.amount < amount) {
      return false
    }

    resource.amount -= amount
    return true
  }

  /**
   * Set a resource to a specific amount
   * @param id - Resource identifier
   * @param amount - Amount to set (must be non-negative)
   * @returns true if successful, false if resource not found or invalid amount
   */
  function setResource(id: string, amount: number): boolean {
    if (amount < 0) {
      return false
    }

    const resource = resources.value.find((r) => r.id === id)
    if (!resource) {
      return false
    }

    resource.amount = amount
    return true
  }

  /**
   * Check if the player has at least the specified amount of a resource
   * @param id - Resource identifier
   * @param amount - Amount to check
   * @returns true if player has enough, false otherwise
   */
  function hasResource(id: string, amount: number): boolean {
    const resource = resources.value.find((r) => r.id === id)
    if (!resource) {
      return false
    }

    return resource.amount >= amount
  }

  /**
   * Initialize a new resource type in the global pool
   * Will not add if a resource with the same ID already exists
   * @param resource - Resource to add
   * @returns true if successful, false if resource already exists
   */
  function initializeResource(resource: Resource): boolean {
    const existing = resources.value.find((r) => r.id === resource.id)
    if (existing) {
      return false
    }

    resources.value.push(resource)
    return true
  }

  /**
   * Get the current resource amount for a specific resource
   * @param id - Resource identifier
   * @returns the current amount, or 0 if resource not found
   */
  function getResourceAmount(id: string): number {
    const resource = resources.value.find((r) => r.id === id)
    return resource?.amount ?? 0
  }

  /**
   * Reset resources to default initial values (for debug/testing)
   */
  function resetResources(): void {
    resources.value = getDefaultResources()
    try {
      localStorage.removeItem(STORAGE_KEY_RESOURCES)
    } catch (error) {
      console.error('Failed to remove resources from localStorage:', error)
    }
  }

  // Watch for changes and auto-save to localStorage
  watch(
    resources,
    () => {
      try {
        localStorage.setItem(STORAGE_KEY_RESOURCES, JSON.stringify(resources.value))
      } catch (error) {
        console.error('Failed to save resources to localStorage:', error)

        // Show warning once per session
        if (!hasShownStorageWarning) {
          console.warn('Unable to save resource progress. Check browser storage settings.')
          hasShownStorageWarning = true
        }
      }
    },
    { deep: true }
  )

  return {
    // State
    resources,
    // Getters
    getResourceById,
    getResourcesByCategory,
    totalResources,
    allResources,
    // Actions
    addResource,
    removeResource,
    setResource,
    hasResource,
    getResourceAmount,
    initializeResource,
    resetResources,
  }
})
