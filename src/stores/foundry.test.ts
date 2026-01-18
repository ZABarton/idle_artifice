import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useFoundryStore } from './foundry'
import { useResourcesStore } from './resources'
import { GridCellType, FOUNDRY_CONSTANTS } from '@/types/foundry'

describe('useFoundryStore', () => {
  beforeEach(() => {
    // Use fake timers to prevent state machine interval from running
    vi.useFakeTimers()
    // Clear localStorage before each test to ensure clean state
    localStorage.clear()
    // Create a fresh pinia instance for each test
    setActivePinia(createPinia())
  })

  afterEach(() => {
    // Restore real timers
    vi.useRealTimers()
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
      await vi.advanceTimersByTimeAsync(10)

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
      await vi.advanceTimersByTimeAsync(10)

      // Create new store instance to simulate page reload
      setActivePinia(createPinia())
      const newStore = useFoundryStore()

      expect(newStore.anton.position).toEqual({ x: 3, y: 3 })
      expect(newStore.anton.currentAction).toBe('gathering')
    })
  })

  describe('queue management', () => {
    it('should add item to queue', () => {
      const store = useFoundryStore()
      store.addToQueue('survival-kit')

      expect(store.craftingQueue).toHaveLength(1)
      expect(store.craftingQueue[0].recipeId).toBe('survival-kit')
      // State machine starts automatically, so item may be 'in-progress' if resources available
      expect(['pending', 'in-progress']).toContain(store.craftingQueue[0].status)
      expect(store.craftingQueue[0].id).toBeDefined()

      // Stop state machine to prevent side effects in other tests
      store.stopStateMachine()
    })

    it('should add multiple items to queue with quantity', () => {
      const store = useFoundryStore()
      store.addToQueue('survival-kit', 3)

      expect(store.craftingQueue).toHaveLength(3)
      expect(store.craftingQueue[0].recipeId).toBe('survival-kit')
      expect(store.craftingQueue[1].recipeId).toBe('survival-kit')
      expect(store.craftingQueue[2].recipeId).toBe('survival-kit')

      // Each should have unique ID
      expect(store.craftingQueue[0].id).not.toBe(store.craftingQueue[1].id)
      expect(store.craftingQueue[1].id).not.toBe(store.craftingQueue[2].id)
    })

    it('should remove item from queue by index', () => {
      const store = useFoundryStore()
      store.addToQueue('survival-kit')
      store.addToQueue('hammer')
      store.addToQueue('rope')

      expect(store.craftingQueue).toHaveLength(3)

      const result = store.removeFromQueue(1)
      expect(result).toBe(true)
      expect(store.craftingQueue).toHaveLength(2)
      expect(store.craftingQueue[0].recipeId).toBe('survival-kit')
      expect(store.craftingQueue[1].recipeId).toBe('rope')
    })

    it('should fail to remove item with invalid index', () => {
      const store = useFoundryStore()
      store.addToQueue('survival-kit')

      expect(store.removeFromQueue(-1)).toBe(false)
      expect(store.removeFromQueue(10)).toBe(false)
      expect(store.craftingQueue).toHaveLength(1)
    })

    it('should adjust currentQueueIndex when removing item before it', () => {
      const store = useFoundryStore()
      store.addToQueue('survival-kit')
      store.addToQueue('hammer')
      store.addToQueue('rope')
      store.setCurrentQueueIndex(2)

      expect(store.currentQueueIndex).toBe(2)

      store.removeFromQueue(1)
      expect(store.currentQueueIndex).toBe(1)
    })

    it('should clear entire queue', () => {
      const store = useFoundryStore()
      store.addToQueue('survival-kit', 3)
      store.setCurrentQueueIndex(1)

      expect(store.craftingQueue).toHaveLength(3)
      expect(store.currentQueueIndex).toBe(1)

      store.clearQueue()

      expect(store.craftingQueue).toHaveLength(0)
      expect(store.currentQueueIndex).toBe(0)
    })

    it('should update queue item status', () => {
      const store = useFoundryStore()
      store.addToQueue('survival-kit')

      const result = store.updateQueueItemStatus(0, 'in-progress')
      expect(result).toBe(true)
      expect(store.craftingQueue[0].status).toBe('in-progress')
    })

    it('should update queue item status with skip reason', () => {
      const store = useFoundryStore()
      store.addToQueue('survival-kit')

      const result = store.updateQueueItemStatus(0, 'skipped', 'Insufficient wood')
      expect(result).toBe(true)
      expect(store.craftingQueue[0].status).toBe('skipped')
      expect(store.craftingQueue[0].skipReason).toBe('Insufficient wood')
    })

    it('should clear skip reason when updating status without reason', () => {
      const store = useFoundryStore()
      store.addToQueue('survival-kit')
      store.updateQueueItemStatus(0, 'skipped', 'Insufficient wood')

      expect(store.craftingQueue[0].skipReason).toBe('Insufficient wood')

      store.updateQueueItemStatus(0, 'pending')
      expect(store.craftingQueue[0].skipReason).toBeUndefined()
    })

    it('should fail to update status with invalid index', () => {
      const store = useFoundryStore()
      store.addToQueue('survival-kit')

      expect(store.updateQueueItemStatus(-1, 'in-progress')).toBe(false)
      expect(store.updateQueueItemStatus(10, 'in-progress')).toBe(false)
    })

    it('should move to next queue item', () => {
      const store = useFoundryStore()
      store.addToQueue('survival-kit')
      store.addToQueue('hammer')
      store.addToQueue('rope')

      expect(store.currentQueueIndex).toBe(0)

      const result1 = store.moveToNextQueueItem()
      expect(result1).toBe(true)
      expect(store.currentQueueIndex).toBe(1)

      const result2 = store.moveToNextQueueItem()
      expect(result2).toBe(true)
      expect(store.currentQueueIndex).toBe(2)
    })

    it('should fail to move beyond end of queue', () => {
      const store = useFoundryStore()
      store.addToQueue('survival-kit')

      expect(store.currentQueueIndex).toBe(0)

      const result = store.moveToNextQueueItem()
      expect(result).toBe(false)
      expect(store.currentQueueIndex).toBe(0)
    })

    it('should set current queue index', () => {
      const store = useFoundryStore()
      store.addToQueue('survival-kit', 3)

      store.setCurrentQueueIndex(2)
      expect(store.currentQueueIndex).toBe(2)

      store.setCurrentQueueIndex(0)
      expect(store.currentQueueIndex).toBe(0)
    })

    it('should clamp queue index to valid range', () => {
      const store = useFoundryStore()
      store.addToQueue('survival-kit', 3)

      store.setCurrentQueueIndex(10)
      expect(store.currentQueueIndex).toBe(2) // max index is 2

      store.setCurrentQueueIndex(-5)
      expect(store.currentQueueIndex).toBe(0) // min index is 0
    })

    it('should get current queue item', () => {
      const store = useFoundryStore()
      store.addToQueue('survival-kit')
      store.addToQueue('hammer')

      expect(store.currentQueueItem?.recipeId).toBe('survival-kit')

      store.moveToNextQueueItem()
      expect(store.currentQueueItem?.recipeId).toBe('hammer')
    })

    it('should return null for current queue item when queue is empty', () => {
      const store = useFoundryStore()
      expect(store.currentQueueItem).toBeNull()
    })
  })

  describe('queue persistence', () => {
    it('should persist queue to localStorage', async () => {
      const store = useFoundryStore()
      store.addToQueue('survival-kit')
      store.addToQueue('hammer')
      store.setCurrentQueueIndex(1)

      // Wait for watch to trigger (advance fake timers)
      await vi.advanceTimersByTimeAsync(10)

      // Create new store instance
      setActivePinia(createPinia())
      const newStore = useFoundryStore()

      expect(newStore.craftingQueue).toHaveLength(2)
      expect(newStore.craftingQueue[0].recipeId).toBe('survival-kit')
      expect(newStore.craftingQueue[1].recipeId).toBe('hammer')
      expect(newStore.currentQueueIndex).toBe(1)

      // Cleanup
      store.stopStateMachine()
      newStore.stopStateMachine()
    })
  })

  describe('recipes', () => {
    it('should load recipes from config', () => {
      const store = useFoundryStore()
      expect(store.recipes.length).toBeGreaterThan(0)
      expect(store.allRecipes.length).toBeGreaterThan(0)
    })

    it('should have survival kit recipe', () => {
      const store = useFoundryStore()
      const recipe = store.getRecipeById('survival-kit')

      expect(recipe).toBeDefined()
      expect(recipe?.name).toBe('Survival Kit')
      expect(recipe?.craftTime).toBe(10)
      expect(recipe?.inputs).toHaveLength(1)
      expect(recipe?.inputs[0].resourceId).toBe('wood')
      expect(recipe?.inputs[0].amount).toBe(10)
      expect(recipe?.outputs).toHaveLength(1)
      expect(recipe?.outputs[0].resourceId).toBe('survival-kit')
      expect(recipe?.outputs[0].amount).toBe(1)
    })

    it('should return undefined for non-existent recipe', () => {
      const store = useFoundryStore()
      const recipe = store.getRecipeById('non-existent')
      expect(recipe).toBeUndefined()
    })

    it('should check if player has required resources', () => {
      const store = useFoundryStore()
      const resourcesStore = useResourcesStore()

      // Default wood amount is 50, survival kit needs 10
      expect(store.hasRequiredResources('survival-kit')).toBe(true)

      // Remove wood to below requirement
      resourcesStore.setResource('wood', 5)
      expect(store.hasRequiredResources('survival-kit')).toBe(false)
    })

    it('should return false for non-existent recipe when checking resources', () => {
      const store = useFoundryStore()
      expect(store.hasRequiredResources('non-existent')).toBe(false)
    })

    it('should get list of missing resources', () => {
      const store = useFoundryStore()
      const resourcesStore = useResourcesStore()

      // Default wood is 50, so no missing resources
      let missing = store.getMissingResources('survival-kit')
      expect(missing).toHaveLength(0)

      // Set wood to 5 (need 10)
      resourcesStore.setResource('wood', 5)
      missing = store.getMissingResources('survival-kit')

      expect(missing).toHaveLength(1)
      expect(missing[0].resourceId).toBe('wood')
      expect(missing[0].required).toBe(10)
      expect(missing[0].available).toBe(5)
    })

    it('should return empty array for missing resources on non-existent recipe', () => {
      const store = useFoundryStore()
      const missing = store.getMissingResources('non-existent')
      expect(missing).toHaveLength(0)
    })
  })

  describe('reset', () => {
    it('should reset foundry to default state', () => {
      const store = useFoundryStore()
      // Make some changes
      store.moveSupplyBin(2, 2)
      store.updateAntonPosition({ x: 4, y: 4 })
      store.addToQueue('survival-kit', 3)

      // Reset
      store.resetFoundry()

      // Verify defaults
      expect(store.supplyBinPosition).toEqual(FOUNDRY_CONSTANTS.DEFAULT_SUPPLY_BIN_POSITION)
      expect(store.anvilPosition).toEqual(FOUNDRY_CONSTANTS.DEFAULT_ANVIL_POSITION)
      expect(store.anton.position).toEqual(FOUNDRY_CONSTANTS.DEFAULT_ANTON_POSITION)
      expect(store.anton.currentAction).toBe('idle')
      expect(store.craftingQueue).toHaveLength(0)
      expect(store.currentQueueIndex).toBe(0)
    })
  })

  describe('pathfinding', () => {
    it('should find straight line path (horizontal)', () => {
      const store = useFoundryStore()
      // Anton is at (2,2) by default
      const path = store.findPath({ x: 2, y: 2 }, { x: 4, y: 2 })

      expect(path).toHaveLength(2)
      expect(path[0]).toEqual({ x: 3, y: 2 })
      expect(path[1]).toEqual({ x: 4, y: 2 })
    })

    it('should find straight line path (vertical)', () => {
      const store = useFoundryStore()
      const path = store.findPath({ x: 2, y: 2 }, { x: 2, y: 0 })

      expect(path).toHaveLength(2)
      expect(path[0]).toEqual({ x: 2, y: 1 })
      expect(path[1]).toEqual({ x: 2, y: 0 })
    })

    it('should find diagonal path (L-shaped)', () => {
      const store = useFoundryStore()
      const path = store.findPath({ x: 0, y: 0 }, { x: 1, y: 1 })

      // BFS will find shortest path, which is 2 steps for diagonal
      expect(path).toHaveLength(2)
      // Should go either right then down, or down then right
      expect(path[1]).toEqual({ x: 1, y: 1 })
    })

    it('should find path around obstacles', () => {
      const store = useFoundryStore()
      // Supply bin at (0,0) and anvil at (4,4) are obstacles
      // Path from (0,1) to (0,0) should fail because (0,0) is supply bin
      const path = store.findPath({ x: 1, y: 0 }, { x: 0, y: 0 })
      expect(path).toHaveLength(0) // No path - target is not traversable
    })

    it('should return empty array when no path exists', () => {
      const store = useFoundryStore()
      // Create a wall of blocked cells to make path impossible
      store.updateCellType(1, 2, GridCellType.Blocked)
      store.updateCellType(2, 1, GridCellType.Blocked)
      store.updateCellType(3, 2, GridCellType.Blocked)
      store.updateCellType(2, 3, GridCellType.Blocked)

      // Try to path from (2,2) to (3,3) - should be blocked
      const path = store.findPath({ x: 2, y: 2 }, { x: 3, y: 3 })
      expect(path).toHaveLength(0)
    })

    it('should return empty array for invalid start position', () => {
      const store = useFoundryStore()
      const path = store.findPath({ x: -1, y: 0 }, { x: 2, y: 2 })
      expect(path).toHaveLength(0)
    })

    it('should return empty array for invalid target position', () => {
      const store = useFoundryStore()
      const path = store.findPath({ x: 2, y: 2 }, { x: 10, y: 10 })
      expect(path).toHaveLength(0)
    })

    it('should return empty array when start equals target', () => {
      const store = useFoundryStore()
      const path = store.findPath({ x: 2, y: 2 }, { x: 2, y: 2 })
      expect(path).toHaveLength(0)
    })

    it('should return empty array when target is not traversable (supply bin)', () => {
      const store = useFoundryStore()
      const supplyBinPos = store.supplyBinPosition!
      const path = store.findPath({ x: 1, y: 1 }, supplyBinPos)
      expect(path).toHaveLength(0)
    })

    it('should return empty array when target is not traversable (anvil)', () => {
      const store = useFoundryStore()
      const anvilPos = store.anvilPosition!
      const path = store.findPath({ x: 3, y: 3 }, anvilPos)
      expect(path).toHaveLength(0)
    })
  })

  describe('movement', () => {
    it('should move Anton to target cell', async () => {
      const store = useFoundryStore()
      // Anton starts at (2,2)
      expect(store.anton.position).toEqual({ x: 2, y: 2 })

      const movementPromise = store.moveAntonToCell(3, 2)
      // Advance timers to complete movement (1 cell = 1 second)
      await vi.advanceTimersByTimeAsync(1500)
      const result = await movementPromise

      expect(result).toBe(true)
      expect(store.anton.position).toEqual({ x: 3, y: 2 })
      expect(store.anton.currentAction).toBe('idle')
      expect(store.anton.path).toHaveLength(0)
    })

    it('should return false when no path exists', async () => {
      const store = useFoundryStore()
      // Try to move to supply bin (not traversable)
      const supplyBinPos = store.supplyBinPosition!
      const result = await store.moveAntonToCell(supplyBinPos.x, supplyBinPos.y)

      expect(result).toBe(false)
      // Anton should still be at starting position
      expect(store.anton.position).toEqual(FOUNDRY_CONSTANTS.DEFAULT_ANTON_POSITION)
    })

    it('should return false for invalid target position', async () => {
      const store = useFoundryStore()
      const result = await store.moveAntonToCell(-1, -1)

      expect(result).toBe(false)
      expect(store.anton.position).toEqual(FOUNDRY_CONSTANTS.DEFAULT_ANTON_POSITION)
    })

    it('should not change action state during movement (callers manage state)', async () => {
      const store = useFoundryStore()
      // Action starts as 'idle'
      expect(store.anton.currentAction).toBe('idle')

      const movementPromise = store.moveAntonToCell(3, 3)

      // Advance timers slightly to let movement start
      await vi.advanceTimersByTimeAsync(50)
      // Action state should remain unchanged - callers (state machine handlers) manage it
      expect(store.anton.currentAction).toBe('idle')

      // Complete movement
      await vi.advanceTimersByTimeAsync(2000)
      await movementPromise
    })

    it('should update path during movement', async () => {
      const store = useFoundryStore()
      const movementPromise = store.moveAntonToCell(4, 3)

      // Check path is set during movement
      await vi.advanceTimersByTimeAsync(50)
      expect(store.anton.path.length).toBeGreaterThan(0)

      // Complete movement
      await vi.advanceTimersByTimeAsync(5000)
      await movementPromise
      expect(store.anton.path).toHaveLength(0)
    })

    it('should update isMoving computed property', async () => {
      const store = useFoundryStore()
      expect(store.isMoving).toBe(false)

      const movementPromise = store.moveAntonToCell(3, 3)

      // Should be moving
      await vi.advanceTimersByTimeAsync(50)
      expect(store.isMoving).toBe(true)

      // Complete movement
      await vi.advanceTimersByTimeAsync(2000)
      await movementPromise
      expect(store.isMoving).toBe(false)
    })

    it('should handle target becoming invalid during movement', async () => {
      const store = useFoundryStore()

      // Start a movement from (2,2) to (2,0)
      const movementPromise = store.moveAntonToCell(2, 0)

      // Advance timer a bit for movement to start
      await vi.advanceTimersByTimeAsync(100)

      // Block the target cell during movement
      store.updateCellType(2, 0, GridCellType.Blocked)

      // Complete movement
      await vi.advanceTimersByTimeAsync(5000)
      const result = await movementPromise

      expect(result).toBe(false)
      expect(store.anton.currentAction).toBe('idle')
      expect(store.anton.path).toHaveLength(0)
    })

    it('should cancel previous movement when new movement starts', async () => {
      const store = useFoundryStore()

      // Start first movement
      const firstMovement = store.moveAntonToCell(4, 3)

      // Advance timer a bit
      await vi.advanceTimersByTimeAsync(100)

      // Start second movement before first completes
      const secondMovement = store.moveAntonToCell(0, 3)

      // Complete movements
      await vi.advanceTimersByTimeAsync(10000)

      const firstResult = await firstMovement
      const secondResult = await secondMovement

      expect(firstResult).toBe(false) // First movement should be cancelled
      expect(secondResult).toBe(true) // Second movement should succeed
      expect(store.anton.position).toEqual({ x: 0, y: 3 })
    })

    it('should take approximately 1 second per cell', async () => {
      const store = useFoundryStore()

      // Move 2 cells (from 2,2 to 4,2)
      const movementPromise = store.moveAntonToCell(4, 2)

      // Advance 2 seconds (1 second per cell)
      await vi.advanceTimersByTimeAsync(2000)
      await movementPromise

      // Verify movement completed
      expect(store.anton.position).toEqual({ x: 4, y: 2 })
    })

    it('should move Anton through multiple cells in path', async () => {
      const store = useFoundryStore()
      // Start at (2,2), move to (0,3) - requires multiple steps
      const movementPromise = store.moveAntonToCell(0, 3)

      // Advance enough time for movement to complete
      await vi.advanceTimersByTimeAsync(10000)
      const result = await movementPromise

      expect(result).toBe(true)
      expect(store.anton.position).toEqual({ x: 0, y: 3 })
      expect(store.anton.currentAction).toBe('idle')
      expect(store.anton.path).toHaveLength(0)
    })
  })
})
