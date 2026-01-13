import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import type {
  GridCell,
  GridPosition,
  AntonState,
  CraftingQueueItem,
  FoundryState,
  Recipe,
} from '@/types/foundry'
import { GridCellType, FOUNDRY_CONSTANTS } from '@/types/foundry'

// LocalStorage key
const STORAGE_KEY_FOUNDRY = 'idle-artifice-foundry'

// Track if we've shown storage warning to avoid spam
let hasShownStorageWarning = false

/**
 * Create a default grid with empty cells and default supply bin/anvil positions
 */
function createDefaultGrid(size: number): GridCell[][] {
  const grid: GridCell[][] = []

  for (let y = 0; y < size; y++) {
    const row: GridCell[] = []
    for (let x = 0; x < size; x++) {
      let type = GridCellType.Empty

      // Set supply bin at default position
      if (
        x === FOUNDRY_CONSTANTS.DEFAULT_SUPPLY_BIN_POSITION.x &&
        y === FOUNDRY_CONSTANTS.DEFAULT_SUPPLY_BIN_POSITION.y
      ) {
        type = GridCellType.SupplyBin
      }
      // Set anvil at default position
      else if (
        x === FOUNDRY_CONSTANTS.DEFAULT_ANVIL_POSITION.x &&
        y === FOUNDRY_CONSTANTS.DEFAULT_ANVIL_POSITION.y
      ) {
        type = GridCellType.Anvil
      }

      row.push({ x, y, type })
    }
    grid.push(row)
  }

  return grid
}

/**
 * Get default initial state for foundry
 */
function getDefaultFoundryState(): Omit<FoundryState, 'recipes'> {
  const gridSize = FOUNDRY_CONSTANTS.DEFAULT_GRID_SIZE

  return {
    grid: createDefaultGrid(gridSize),
    gridSize: {
      width: gridSize,
      height: gridSize,
    },
    anton: {
      position: { ...FOUNDRY_CONSTANTS.DEFAULT_ANTON_POSITION },
      currentAction: 'idle',
      actionProgress: 0,
      path: [],
      currentRecipeId: null,
    },
    craftingQueue: [],
    currentQueueIndex: 0,
  }
}

/**
 * Load foundry state from localStorage
 * Returns saved state if available, otherwise returns default state
 */
function loadFoundryState(): Omit<FoundryState, 'recipes'> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_FOUNDRY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (error) {
    console.error('Failed to load foundry state from localStorage:', error)
  }

  return getDefaultFoundryState()
}

/**
 * Foundry Store
 * Manages the foundry grid, Anton's state, and crafting queue
 */
export const useFoundryStore = defineStore('foundry', () => {
  // State - load from localStorage or use defaults
  const gridState = ref<Omit<FoundryState, 'recipes'>>(loadFoundryState())

  // Recipes are not persisted (defined in config)
  const recipes = ref<Recipe[]>([])

  // Getters - Grid queries
  const grid = computed(() => gridState.value.grid)
  const gridSize = computed(() => gridState.value.gridSize)
  const anton = computed(() => gridState.value.anton)
  const craftingQueue = computed(() => gridState.value.craftingQueue)
  const currentQueueIndex = computed(() => gridState.value.currentQueueIndex)

  /**
   * Get cell at specific position
   */
  const getCellAt = computed(() => (x: number, y: number): GridCell | null => {
    if (x < 0 || y < 0 || y >= grid.value.length || x >= grid.value[0]?.length) {
      return null
    }
    return grid.value[y][x]
  })

  /**
   * Find position of supply bin on the grid
   */
  const supplyBinPosition = computed((): GridPosition | null => {
    for (let y = 0; y < grid.value.length; y++) {
      for (let x = 0; x < grid.value[y].length; x++) {
        if (grid.value[y][x].type === GridCellType.SupplyBin) {
          return { x, y }
        }
      }
    }
    return null
  })

  /**
   * Find position of anvil on the grid
   */
  const anvilPosition = computed((): GridPosition | null => {
    for (let y = 0; y < grid.value.length; y++) {
      for (let x = 0; x < grid.value[y].length; x++) {
        if (grid.value[y][x].type === GridCellType.Anvil) {
          return { x, y }
        }
      }
    }
    return null
  })

  /**
   * Get current queue item being processed
   */
  const currentQueueItem = computed((): CraftingQueueItem | null => {
    const index = currentQueueIndex.value
    if (index >= 0 && index < craftingQueue.value.length) {
      return craftingQueue.value[index]
    }
    return null
  })

  /**
   * Check if position is within grid bounds
   */
  const isValidPosition = computed(() => (x: number, y: number): boolean => {
    return x >= 0 && y >= 0 && y < gridSize.value.height && x < gridSize.value.width
  })

  // Actions - Grid manipulation

  /**
   * Update cell type at specific position
   * Validates that only one supply bin and one anvil exist on grid
   * @returns true if successful, false if validation fails
   */
  function updateCellType(x: number, y: number, type: GridCellType): boolean {
    // Validate position
    if (!isValidPosition.value(x, y)) {
      return false
    }

    // If setting supply bin or anvil, ensure only one exists
    if (type === GridCellType.SupplyBin || type === GridCellType.Anvil) {
      // Count existing instances
      let count = 0
      for (let row = 0; row < grid.value.length; row++) {
        for (let col = 0; col < grid.value[row].length; col++) {
          if (grid.value[row][col].type === type) {
            // Skip the cell we're updating
            if (row === y && col === x) continue
            count++
          }
        }
      }

      // Only allow if no other instance exists
      if (count > 0) {
        return false
      }
    }

    // Update cell type
    gridState.value.grid[y][x].type = type
    return true
  }

  /**
   * Move supply bin to new position
   * Clears old position and validates new position
   */
  function moveSupplyBin(newX: number, newY: number): boolean {
    // Validate new position
    if (!isValidPosition.value(newX, newY)) {
      return false
    }

    // Cannot place on anvil
    const targetCell = getCellAt.value(newX, newY)
    if (targetCell?.type === GridCellType.Anvil) {
      return false
    }

    // Find and clear current supply bin position
    const currentPos = supplyBinPosition.value
    if (currentPos) {
      gridState.value.grid[currentPos.y][currentPos.x].type = GridCellType.Empty
    }

    // Set new position
    gridState.value.grid[newY][newX].type = GridCellType.SupplyBin
    return true
  }

  /**
   * Move anvil to new position
   * Clears old position and validates new position
   */
  function moveAnvil(newX: number, newY: number): boolean {
    // Validate new position
    if (!isValidPosition.value(newX, newY)) {
      return false
    }

    // Cannot place on supply bin
    const targetCell = getCellAt.value(newX, newY)
    if (targetCell?.type === GridCellType.SupplyBin) {
      return false
    }

    // Find and clear current anvil position
    const currentPos = anvilPosition.value
    if (currentPos) {
      gridState.value.grid[currentPos.y][currentPos.x].type = GridCellType.Empty
    }

    // Set new position
    gridState.value.grid[newY][newX].type = GridCellType.Anvil
    return true
  }

  // Actions - Anton state

  /**
   * Update Anton's position
   */
  function updateAntonPosition(position: GridPosition): void {
    gridState.value.anton.position = { ...position }
  }

  /**
   * Update Anton's current action
   */
  function updateAntonAction(action: AntonState['currentAction']): void {
    gridState.value.anton.currentAction = action
  }

  /**
   * Update Anton's action progress (0-1)
   */
  function updateAntonProgress(progress: number): void {
    gridState.value.anton.actionProgress = Math.max(0, Math.min(1, progress))
  }

  /**
   * Set Anton's planned path
   */
  function setAntonPath(path: GridPosition[]): void {
    gridState.value.anton.path = [...path]
  }

  /**
   * Set Anton's current recipe
   */
  function setAntonRecipe(recipeId: string | null): void {
    gridState.value.anton.currentRecipeId = recipeId
  }

  // Actions - Queue management

  /**
   * Add recipe to crafting queue
   * Creates a unique ID for each queue item for tracking
   * @param recipeId - ID of recipe to craft
   * @param quantity - Number of times to craft this recipe (defaults to 1)
   */
  function addToQueue(recipeId: string, quantity: number = 1): void {
    for (let i = 0; i < quantity; i++) {
      const queueItem: CraftingQueueItem = {
        id: `${recipeId}-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        recipeId,
        status: 'pending',
      }
      gridState.value.craftingQueue.push(queueItem)
    }
  }

  /**
   * Remove item from queue at specific index
   * Adjusts currentQueueIndex if needed
   * @param index - Index of item to remove
   * @returns true if successful, false if index invalid
   */
  function removeFromQueue(index: number): boolean {
    if (index < 0 || index >= gridState.value.craftingQueue.length) {
      return false
    }

    gridState.value.craftingQueue.splice(index, 1)

    // Adjust current queue index if needed
    if (gridState.value.currentQueueIndex >= gridState.value.craftingQueue.length) {
      gridState.value.currentQueueIndex = Math.max(0, gridState.value.craftingQueue.length - 1)
    }

    return true
  }

  /**
   * Clear all items from the crafting queue
   * Resets currentQueueIndex to 0
   */
  function clearQueue(): void {
    gridState.value.craftingQueue = []
    gridState.value.currentQueueIndex = 0
  }

  /**
   * Update the status of a queue item
   * @param index - Index of queue item to update
   * @param status - New status
   * @param skipReason - Optional reason if status is 'skipped'
   * @returns true if successful, false if index invalid
   */
  function updateQueueItemStatus(
    index: number,
    status: CraftingQueueItem['status'],
    skipReason?: string
  ): boolean {
    if (index < 0 || index >= gridState.value.craftingQueue.length) {
      return false
    }

    gridState.value.craftingQueue[index].status = status
    if (skipReason) {
      gridState.value.craftingQueue[index].skipReason = skipReason
    } else {
      delete gridState.value.craftingQueue[index].skipReason
    }

    return true
  }

  /**
   * Move to next item in queue
   * Increments currentQueueIndex
   * @returns true if moved to next item, false if at end of queue
   */
  function moveToNextQueueItem(): boolean {
    if (gridState.value.currentQueueIndex >= gridState.value.craftingQueue.length - 1) {
      return false
    }

    gridState.value.currentQueueIndex++
    return true
  }

  /**
   * Set current queue index
   * @param index - New queue index
   */
  function setCurrentQueueIndex(index: number): void {
    gridState.value.currentQueueIndex = Math.max(
      0,
      Math.min(index, gridState.value.craftingQueue.length - 1)
    )
  }

  /**
   * Reset foundry to default state (for debug/testing)
   */
  function resetFoundry(): void {
    gridState.value = getDefaultFoundryState()
    try {
      localStorage.removeItem(STORAGE_KEY_FOUNDRY)
    } catch (error) {
      console.error('Failed to remove foundry state from localStorage:', error)
    }
  }

  // Watch for changes and auto-save to localStorage
  watch(
    gridState,
    () => {
      try {
        localStorage.setItem(STORAGE_KEY_FOUNDRY, JSON.stringify(gridState.value))
      } catch (error) {
        console.error('Failed to save foundry state to localStorage:', error)

        // Show warning once per session
        if (!hasShownStorageWarning) {
          console.warn('Unable to save foundry progress. Check browser storage settings.')
          hasShownStorageWarning = true
        }
      }
    },
    { deep: true }
  )

  return {
    // State
    grid,
    gridSize,
    anton,
    craftingQueue,
    currentQueueIndex,
    recipes,
    // Getters
    getCellAt,
    supplyBinPosition,
    anvilPosition,
    currentQueueItem,
    isValidPosition,
    // Actions - Grid
    updateCellType,
    moveSupplyBin,
    moveAnvil,
    // Actions - Anton
    updateAntonPosition,
    updateAntonAction,
    updateAntonProgress,
    setAntonPath,
    setAntonRecipe,
    // Actions - Queue
    addToQueue,
    removeFromQueue,
    clearQueue,
    updateQueueItemStatus,
    moveToNextQueueItem,
    setCurrentQueueIndex,
    // Actions - Utility
    resetFoundry,
  }
})
