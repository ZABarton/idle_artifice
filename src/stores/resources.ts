import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Resource } from '@/types/resources'

/**
 * Resources Store
 * Manages the global resource pool accessible across all game areas
 */
export const useResourcesStore = defineStore('resources', () => {
  // State
  const resources = ref<Resource[]>([
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
  ])

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
    initializeResource,
  }
})
