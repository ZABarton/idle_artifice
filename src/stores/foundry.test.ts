import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useFoundryStore } from './foundry'
import { GridCellType, FOUNDRY_CONSTANTS } from '@/types/foundry'

describe('useFoundryStore', () => {
  beforeEach(() => {
    // Clear localStorage before each test to ensure clean state
    localStorage.clear()
    // Create a fresh pinia instance for each test
    setActivePinia(createPinia())
  })

  describe('initial state', () => {
    it('should initialize with 5x5 grid', () => {
      const store = useFoundryStore()
      expect(store.gridSize.width).toBe(5)
      expect(store.gridSize.height).toBe(5)
      expect(store.grid).toHaveLength(5)
      expect(store.grid[0]).toHaveLength(5)
    })

    it('should have supply bin at default position', () => {
      const store = useFoundryStore()
      const { x, y } = FOUNDRY_CONSTANTS.DEFAULT_SUPPLY_BIN_POSITION
      const cell = store.getCellAt(x, y)
      expect(cell).toBeDefined()
      expect(cell?.type).toBe(GridCellType.SupplyBin)
    })

    it('should have anvil at default position', () => {
      const store = useFoundryStore()
      const { x, y } = FOUNDRY_CONSTANTS.DEFAULT_ANVIL_POSITION
      const cell = store.getCellAt(x, y)
      expect(cell).toBeDefined()
      expect(cell?.type).toBe(GridCellType.Anvil)
    })

    it('should have Anton at center position', () => {
      const store = useFoundryStore()
      expect(store.anton.position).toEqual(FOUNDRY_CONSTANTS.DEFAULT_ANTON_POSITION)
    })

    it('should have Anton in idle state', () => {
      const store = useFoundryStore()
      expect(store.anton.currentAction).toBe('idle')
      expect(store.anton.actionProgress).toBe(0)
      expect(store.anton.currentRecipeId).toBeNull()
    })

    it('should have empty crafting queue', () => {
      const store = useFoundryStore()
      expect(store.craftingQueue).toHaveLength(0)
      expect(store.currentQueueIndex).toBe(0)
    })
  })

  describe('grid queries', () => {
    it('should get cell at valid position', () => {
      const store = useFoundryStore()
      const cell = store.getCellAt(0, 0)
      expect(cell).toBeDefined()
      expect(cell?.x).toBe(0)
      expect(cell?.y).toBe(0)
    })

    it('should return null for out-of-bounds position', () => {
      const store = useFoundryStore()
      expect(store.getCellAt(-1, 0)).toBeNull()
      expect(store.getCellAt(0, -1)).toBeNull()
      expect(store.getCellAt(5, 0)).toBeNull()
      expect(store.getCellAt(0, 5)).toBeNull()
    })

    it('should find supply bin position', () => {
      const store = useFoundryStore()
      expect(store.supplyBinPosition).toEqual(FOUNDRY_CONSTANTS.DEFAULT_SUPPLY_BIN_POSITION)
    })

    it('should find anvil position', () => {
      const store = useFoundryStore()
      expect(store.anvilPosition).toEqual(FOUNDRY_CONSTANTS.DEFAULT_ANVIL_POSITION)
    })

    it('should validate positions correctly', () => {
      const store = useFoundryStore()
      expect(store.isValidPosition(0, 0)).toBe(true)
      expect(store.isValidPosition(4, 4)).toBe(true)
      expect(store.isValidPosition(2, 2)).toBe(true)
      expect(store.isValidPosition(-1, 0)).toBe(false)
      expect(store.isValidPosition(0, -1)).toBe(false)
      expect(store.isValidPosition(5, 0)).toBe(false)
      expect(store.isValidPosition(0, 5)).toBe(false)
    })
  })

  describe('cell type updates', () => {
    it('should update cell type to empty', () => {
      const store = useFoundryStore()
      const result = store.updateCellType(1, 1, GridCellType.Empty)
      expect(result).toBe(true)
      expect(store.getCellAt(1, 1)?.type).toBe(GridCellType.Empty)
    })

    it('should fail to update out-of-bounds cell', () => {
      const store = useFoundryStore()
      const result = store.updateCellType(10, 10, GridCellType.Empty)
      expect(result).toBe(false)
    })

    it('should fail to place second supply bin', () => {
      const store = useFoundryStore()
      // Try to place supply bin at different location
      const result = store.updateCellType(2, 2, GridCellType.SupplyBin)
      expect(result).toBe(false)
      // Original supply bin should still be there
      expect(store.supplyBinPosition).toEqual(FOUNDRY_CONSTANTS.DEFAULT_SUPPLY_BIN_POSITION)
    })

    it('should fail to place second anvil', () => {
      const store = useFoundryStore()
      // Try to place anvil at different location
      const result = store.updateCellType(1, 1, GridCellType.Anvil)
      expect(result).toBe(false)
      // Original anvil should still be there
      expect(store.anvilPosition).toEqual(FOUNDRY_CONSTANTS.DEFAULT_ANVIL_POSITION)
    })
  })

  describe('move supply bin', () => {
    it('should move supply bin to new position', () => {
      const store = useFoundryStore()
      const result = store.moveSupplyBin(2, 2)
      expect(result).toBe(true)
      expect(store.supplyBinPosition).toEqual({ x: 2, y: 2 })
      // Old position should be empty
      const oldPos = FOUNDRY_CONSTANTS.DEFAULT_SUPPLY_BIN_POSITION
      expect(store.getCellAt(oldPos.x, oldPos.y)?.type).toBe(GridCellType.Empty)
    })

    it('should fail to move supply bin out of bounds', () => {
      const store = useFoundryStore()
      const result = store.moveSupplyBin(10, 10)
      expect(result).toBe(false)
      expect(store.supplyBinPosition).toEqual(FOUNDRY_CONSTANTS.DEFAULT_SUPPLY_BIN_POSITION)
    })

    it('should fail to move supply bin onto anvil', () => {
      const store = useFoundryStore()
      const anvilPos = FOUNDRY_CONSTANTS.DEFAULT_ANVIL_POSITION
      const result = store.moveSupplyBin(anvilPos.x, anvilPos.y)
      expect(result).toBe(false)
      expect(store.supplyBinPosition).toEqual(FOUNDRY_CONSTANTS.DEFAULT_SUPPLY_BIN_POSITION)
    })
  })

  describe('move anvil', () => {
    it('should move anvil to new position', () => {
      const store = useFoundryStore()
      const result = store.moveAnvil(1, 1)
      expect(result).toBe(true)
      expect(store.anvilPosition).toEqual({ x: 1, y: 1 })
      // Old position should be empty
      const oldPos = FOUNDRY_CONSTANTS.DEFAULT_ANVIL_POSITION
      expect(store.getCellAt(oldPos.x, oldPos.y)?.type).toBe(GridCellType.Empty)
    })

    it('should fail to move anvil out of bounds', () => {
      const store = useFoundryStore()
      const result = store.moveAnvil(-1, -1)
      expect(result).toBe(false)
      expect(store.anvilPosition).toEqual(FOUNDRY_CONSTANTS.DEFAULT_ANVIL_POSITION)
    })

    it('should fail to move anvil onto supply bin', () => {
      const store = useFoundryStore()
      const supplyBinPos = FOUNDRY_CONSTANTS.DEFAULT_SUPPLY_BIN_POSITION
      const result = store.moveAnvil(supplyBinPos.x, supplyBinPos.y)
      expect(result).toBe(false)
      expect(store.anvilPosition).toEqual(FOUNDRY_CONSTANTS.DEFAULT_ANVIL_POSITION)
    })
  })

  describe('Anton state updates', () => {
    it('should update Anton position', () => {
      const store = useFoundryStore()
      store.updateAntonPosition({ x: 3, y: 3 })
      expect(store.anton.position).toEqual({ x: 3, y: 3 })
    })

    it('should update Anton action', () => {
      const store = useFoundryStore()
      store.updateAntonAction('gathering')
      expect(store.anton.currentAction).toBe('gathering')
    })

    it('should update Anton progress', () => {
      const store = useFoundryStore()
      store.updateAntonProgress(0.5)
      expect(store.anton.actionProgress).toBe(0.5)
    })

    it('should clamp progress to 0-1 range', () => {
      const store = useFoundryStore()
      store.updateAntonProgress(-0.5)
      expect(store.anton.actionProgress).toBe(0)
      store.updateAntonProgress(1.5)
      expect(store.anton.actionProgress).toBe(1)
    })

    it('should set Anton path', () => {
      const store = useFoundryStore()
      const path = [
        { x: 2, y: 2 },
        { x: 2, y: 1 },
        { x: 2, y: 0 },
      ]
      store.setAntonPath(path)
      expect(store.anton.path).toEqual(path)
    })

    it('should set Anton recipe', () => {
      const store = useFoundryStore()
      store.setAntonRecipe('survival-kit')
      expect(store.anton.currentRecipeId).toBe('survival-kit')
      store.setAntonRecipe(null)
      expect(store.anton.currentRecipeId).toBeNull()
    })
  })

  describe('persistence', () => {
    it('should persist grid layout to localStorage', async () => {
      const store = useFoundryStore()
      store.moveSupplyBin(1, 1)

      // Wait for watch to trigger and save to localStorage
      await new Promise((resolve) => setTimeout(resolve, 10))

      // Create new store instance to simulate page reload
      setActivePinia(createPinia())
      const newStore = useFoundryStore()

      expect(newStore.supplyBinPosition).toEqual({ x: 1, y: 1 })
    })

    it('should persist Anton state to localStorage', async () => {
      const store = useFoundryStore()
      store.updateAntonPosition({ x: 3, y: 3 })
      store.updateAntonAction('gathering')

      // Wait for watch to trigger and save to localStorage
      await new Promise((resolve) => setTimeout(resolve, 10))

      // Create new store instance to simulate page reload
      setActivePinia(createPinia())
      const newStore = useFoundryStore()

      expect(newStore.anton.position).toEqual({ x: 3, y: 3 })
      expect(newStore.anton.currentAction).toBe('gathering')
    })
  })

  describe('reset', () => {
    it('should reset foundry to default state', () => {
      const store = useFoundryStore()
      // Make some changes
      store.moveSupplyBin(2, 2)
      store.updateAntonPosition({ x: 4, y: 4 })

      // Reset
      store.resetFoundry()

      // Verify defaults
      expect(store.supplyBinPosition).toEqual(FOUNDRY_CONSTANTS.DEFAULT_SUPPLY_BIN_POSITION)
      expect(store.anvilPosition).toEqual(FOUNDRY_CONSTANTS.DEFAULT_ANVIL_POSITION)
      expect(store.anton.position).toEqual(FOUNDRY_CONSTANTS.DEFAULT_ANTON_POSITION)
      expect(store.anton.currentAction).toBe('idle')
    })
  })
})
