import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useResourcesStore } from './resources'

describe('useResourcesStore', () => {
  beforeEach(() => {
    // Create a fresh pinia instance for each test
    setActivePinia(createPinia())
  })

  describe('initial state', () => {
    it('should initialize with 5 test resources', () => {
      const store = useResourcesStore()
      expect(store.resources).toHaveLength(5)
      expect(store.totalResources).toBe(5)
    })

    it('should have correct initial resource data', () => {
      const store = useResourcesStore()

      const wood = store.getResourceById('wood')
      expect(wood).toBeDefined()
      expect(wood?.name).toBe('Wood')
      expect(wood?.amount).toBe(50)
      expect(wood?.category).toBe('basic_materials')
      expect(wood?.icon).toBe('🪵')

      const gold = store.getResourceById('gold')
      expect(gold).toBeDefined()
      expect(gold?.name).toBe('Gold')
      expect(gold?.amount).toBe(10)
      expect(gold?.category).toBe('metals')

      const essence = store.getResourceById('mystical_essence')
      expect(essence).toBeDefined()
      expect(essence?.name).toBe('Mystical Essence')
      expect(essence?.amount).toBe(5)
      expect(essence?.category).toBe('magical')
    })
  })

  describe('getResourceById', () => {
    it('should return resource by ID', () => {
      const store = useResourcesStore()
      const wood = store.getResourceById('wood')
      expect(wood).toBeDefined()
      expect(wood?.id).toBe('wood')
    })

    it('should return undefined for non-existent resource', () => {
      const store = useResourcesStore()
      const resource = store.getResourceById('nonexistent')
      expect(resource).toBeUndefined()
    })
  })

  describe('getResourcesByCategory', () => {
    it('should return all resources when no category specified', () => {
      const store = useResourcesStore()
      const resources = store.getResourcesByCategory()
      expect(resources).toHaveLength(5)
    })

    it('should return resources by category', () => {
      const store = useResourcesStore()
      const basicMaterials = store.getResourcesByCategory('basic_materials')
      expect(basicMaterials).toHaveLength(2)
      expect(basicMaterials.map((r) => r.id)).toEqual(['wood', 'stone'])

      const metals = store.getResourcesByCategory('metals')
      expect(metals).toHaveLength(2)
      expect(metals.map((r) => r.id)).toEqual(['iron', 'gold'])

      const magical = store.getResourcesByCategory('magical')
      expect(magical).toHaveLength(1)
      expect(magical[0].id).toBe('mystical_essence')
    })

    it('should return empty array for non-existent category', () => {
      const store = useResourcesStore()
      const resources = store.getResourcesByCategory('nonexistent')
      expect(resources).toHaveLength(0)
    })
  })

  describe('addResource', () => {
    it('should add amount to existing resource', () => {
      const store = useResourcesStore()
      const initialAmount = store.getResourceById('wood')?.amount ?? 0

      const result = store.addResource('wood', 25)

      expect(result).toBe(true)
      expect(store.getResourceById('wood')?.amount).toBe(initialAmount + 25)
    })

    it('should return false for non-existent resource', () => {
      const store = useResourcesStore()
      const result = store.addResource('nonexistent', 10)
      expect(result).toBe(false)
    })

    it('should return false for negative amount', () => {
      const store = useResourcesStore()
      const initialAmount = store.getResourceById('wood')?.amount ?? 0

      const result = store.addResource('wood', -10)

      expect(result).toBe(false)
      expect(store.getResourceById('wood')?.amount).toBe(initialAmount)
    })

    it('should allow adding zero amount', () => {
      const store = useResourcesStore()
      const initialAmount = store.getResourceById('wood')?.amount ?? 0

      const result = store.addResource('wood', 0)

      expect(result).toBe(true)
      expect(store.getResourceById('wood')?.amount).toBe(initialAmount)
    })
  })

  describe('removeResource', () => {
    it('should remove amount from existing resource', () => {
      const store = useResourcesStore()
      const initialAmount = store.getResourceById('wood')?.amount ?? 0

      const result = store.removeResource('wood', 10)

      expect(result).toBe(true)
      expect(store.getResourceById('wood')?.amount).toBe(initialAmount - 10)
    })

    it('should return false if insufficient resources', () => {
      const store = useResourcesStore()
      const initialAmount = store.getResourceById('wood')?.amount ?? 0

      const result = store.removeResource('wood', initialAmount + 100)

      expect(result).toBe(false)
      expect(store.getResourceById('wood')?.amount).toBe(initialAmount)
    })

    it('should return false for non-existent resource', () => {
      const store = useResourcesStore()
      const result = store.removeResource('nonexistent', 10)
      expect(result).toBe(false)
    })

    it('should return false for negative amount', () => {
      const store = useResourcesStore()
      const initialAmount = store.getResourceById('wood')?.amount ?? 0

      const result = store.removeResource('wood', -10)

      expect(result).toBe(false)
      expect(store.getResourceById('wood')?.amount).toBe(initialAmount)
    })

    it('should allow removing exact amount', () => {
      const store = useResourcesStore()
      const initialAmount = store.getResourceById('wood')?.amount ?? 0

      const result = store.removeResource('wood', initialAmount)

      expect(result).toBe(true)
      expect(store.getResourceById('wood')?.amount).toBe(0)
    })

    it('should return false when trying to remove from zero balance', () => {
      const store = useResourcesStore()
      store.setResource('wood', 0)

      const result = store.removeResource('wood', 1)

      expect(result).toBe(false)
      expect(store.getResourceById('wood')?.amount).toBe(0)
    })
  })

  describe('setResource', () => {
    it('should set resource to specific amount', () => {
      const store = useResourcesStore()

      const result = store.setResource('wood', 100)

      expect(result).toBe(true)
      expect(store.getResourceById('wood')?.amount).toBe(100)
    })

    it('should allow setting to zero', () => {
      const store = useResourcesStore()

      const result = store.setResource('wood', 0)

      expect(result).toBe(true)
      expect(store.getResourceById('wood')?.amount).toBe(0)
    })

    it('should return false for negative amount', () => {
      const store = useResourcesStore()
      const initialAmount = store.getResourceById('wood')?.amount ?? 0

      const result = store.setResource('wood', -10)

      expect(result).toBe(false)
      expect(store.getResourceById('wood')?.amount).toBe(initialAmount)
    })

    it('should return false for non-existent resource', () => {
      const store = useResourcesStore()
      const result = store.setResource('nonexistent', 100)
      expect(result).toBe(false)
    })
  })

  describe('hasResource', () => {
    it('should return true if player has enough resources', () => {
      const store = useResourcesStore()
      const wood = store.getResourceById('wood')
      expect(wood).toBeDefined()

      const result = store.hasResource('wood', wood!.amount)
      expect(result).toBe(true)
    })

    it('should return true if player has more than required', () => {
      const store = useResourcesStore()

      const result = store.hasResource('wood', 10)
      expect(result).toBe(true)
    })

    it('should return false if player has insufficient resources', () => {
      const store = useResourcesStore()

      const result = store.hasResource('wood', 1000)
      expect(result).toBe(false)
    })

    it('should return false for non-existent resource', () => {
      const store = useResourcesStore()
      const result = store.hasResource('nonexistent', 1)
      expect(result).toBe(false)
    })

    it('should return true when checking for zero amount', () => {
      const store = useResourcesStore()
      const result = store.hasResource('wood', 0)
      expect(result).toBe(true)
    })
  })

  describe('initializeResource', () => {
    it('should add new resource to the store', () => {
      const store = useResourcesStore()
      const initialLength = store.resources.length

      const result = store.initializeResource({
        id: 'mana',
        name: 'Mana',
        amount: 100,
        icon: '💙',
        category: 'magical',
      })

      expect(result).toBe(true)
      expect(store.resources).toHaveLength(initialLength + 1)
      expect(store.getResourceById('mana')).toBeDefined()
      expect(store.getResourceById('mana')?.amount).toBe(100)
    })

    it('should not add duplicate resource', () => {
      const store = useResourcesStore()
      const initialLength = store.resources.length
      const initialWoodAmount = store.getResourceById('wood')?.amount

      const result = store.initializeResource({
        id: 'wood',
        name: 'Different Wood',
        amount: 999,
        category: 'different',
      })

      expect(result).toBe(false)
      expect(store.resources).toHaveLength(initialLength)
      expect(store.getResourceById('wood')?.amount).toBe(initialWoodAmount)
      expect(store.getResourceById('wood')?.name).toBe('Wood')
    })
  })

  describe('allResources computed', () => {
    it('should return all resources', () => {
      const store = useResourcesStore()
      expect(store.allResources).toHaveLength(5)
      expect(store.allResources).toBe(store.resources)
    })

    it('should be reactive to changes', () => {
      const store = useResourcesStore()
      const initialLength = store.allResources.length

      store.initializeResource({
        id: 'test',
        name: 'Test',
        amount: 0,
      })

      expect(store.allResources).toHaveLength(initialLength + 1)
    })
  })
})
