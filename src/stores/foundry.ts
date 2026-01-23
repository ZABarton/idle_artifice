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
import { recipes as recipeDefinitions } from '@/config/recipes'
import { useResourcesStore } from './resources'
import { useNotificationsStore } from './notifications'

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
      actionStartTime: null,
    },
    craftingQueue: [],
    currentQueueIndex: 0,
    lastTickTime: null,
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
 * Movement tracking state (module level)
 * Used to cancel ongoing movements when a new movement starts
 */
let currentMovementController: AbortController | null = null

/**
 * State machine interval (module level)
 * Runs the crafting workflow tick every 100ms
 */
let stateMachineInterval: ReturnType<typeof setInterval> | null = null

/**
 * Flag to track if we're currently processing a movement
 * Prevents multiple simultaneous movement calls
 */
let isProcessingMovement = false

/**
 * Check if a cell is traversable (can be walked through)
 */
function isTraversable(cell: GridCell | null): boolean {
  if (!cell) return false
  return cell.type === GridCellType.Empty
}

/**
 * Check if two positions are orthogonally adjacent
 */
function areAdjacent(pos1: GridPosition, pos2: GridPosition): boolean {
  const dx = Math.abs(pos1.x - pos2.x)
  const dy = Math.abs(pos1.y - pos2.y)
  return (dx === 1 && dy === 0) || (dx === 0 && dy === 1)
}

/**
 * Find a walkable cell adjacent to target position
 * Returns the first traversable cell found, or null if none exists
 */
function findAdjacentWalkableCell(
  grid: GridCell[][],
  target: GridPosition
): GridPosition | null {
  const directions = [
    { x: 0, y: -1 }, // up
    { x: 1, y: 0 }, // right
    { x: 0, y: 1 }, // down
    { x: -1, y: 0 }, // left
  ]

  for (const dir of directions) {
    const adjacentPos: GridPosition = {
      x: target.x + dir.x,
      y: target.y + dir.y,
    }

    // Check bounds
    if (
      adjacentPos.y >= 0 &&
      adjacentPos.y < grid.length &&
      adjacentPos.x >= 0 &&
      adjacentPos.x < grid[0]?.length
    ) {
      const cell = grid[adjacentPos.y][adjacentPos.x]
      if (isTraversable(cell)) {
        return adjacentPos
      }
    }
  }

  return null
}

/**
 * Find the closest walkable cell adjacent to target position from a starting point
 * Uses BFS path length to determine "closest"
 * Returns the adjacent cell with the shortest path, or null if none reachable
 */
function findClosestAdjacentWalkableCell(
  grid: GridCell[][],
  target: GridPosition,
  from: GridPosition
): GridPosition | null {
  const directions = [
    { x: 0, y: -1 }, // up
    { x: 1, y: 0 }, // right
    { x: 0, y: 1 }, // down
    { x: -1, y: 0 }, // left
  ]

  let closestCell: GridPosition | null = null
  let shortestPathLength = Infinity

  for (const dir of directions) {
    const adjacentPos: GridPosition = {
      x: target.x + dir.x,
      y: target.y + dir.y,
    }

    // Check bounds
    if (
      adjacentPos.y < 0 ||
      adjacentPos.y >= grid.length ||
      adjacentPos.x < 0 ||
      adjacentPos.x >= grid[0]?.length
    ) {
      continue
    }

    const cell = grid[adjacentPos.y][adjacentPos.x]
    if (!isTraversable(cell)) {
      continue
    }

    // If we're already at this position, it's the best choice
    if (from.x === adjacentPos.x && from.y === adjacentPos.y) {
      return adjacentPos
    }

    // Calculate path length to this adjacent cell
    const path = findPathBFS(grid, from, adjacentPos)
    if (path.length > 0 && path.length < shortestPathLength) {
      shortestPathLength = path.length
      closestCell = adjacentPos
    }
  }

  return closestCell
}

/**
 * BFS pathfinding algorithm
 * Finds shortest path from start to target on the grid
 * @param grid - The foundry grid
 * @param start - Starting position
 * @param target - Target position
 * @returns Array of positions from start to target (excluding start), or empty array if no path exists
 */
function findPathBFS(
  grid: GridCell[][],
  start: GridPosition,
  target: GridPosition
): GridPosition[] {
  // Validate start and target are within bounds
  if (
    start.y < 0 ||
    start.y >= grid.length ||
    start.x < 0 ||
    start.x >= grid[0]?.length ||
    target.y < 0 ||
    target.y >= grid.length ||
    target.x < 0 ||
    target.x >= grid[0]?.length
  ) {
    return []
  }

  // Target must be traversable
  if (!isTraversable(grid[target.y][target.x])) {
    return []
  }

  // Early exit if start and target are the same
  if (start.x === target.x && start.y === target.y) {
    return []
  }

  // BFS setup
  const queue: Array<{ pos: GridPosition; path: GridPosition[] }> = []
  const visited = new Set<string>()

  // Helper to create unique key for position
  const posKey = (pos: GridPosition) => `${pos.x},${pos.y}`

  // Start BFS
  queue.push({ pos: start, path: [] })
  visited.add(posKey(start))

  // 4-directional movement: up, right, down, left
  const directions = [
    { x: 0, y: -1 }, // up
    { x: 1, y: 0 }, // right
    { x: 0, y: 1 }, // down
    { x: -1, y: 0 }, // left
  ]

  while (queue.length > 0) {
    const current = queue.shift()!
    const { pos, path } = current

    // Try each direction
    for (const dir of directions) {
      const nextPos: GridPosition = {
        x: pos.x + dir.x,
        y: pos.y + dir.y,
      }

      // Check if we've reached the target
      if (nextPos.x === target.x && nextPos.y === target.y) {
        return [...path, nextPos]
      }

      // Skip if already visited
      const key = posKey(nextPos)
      if (visited.has(key)) {
        continue
      }

      // Check if position is valid and traversable
      const cell =
        nextPos.y >= 0 && nextPos.y < grid.length && nextPos.x >= 0 && nextPos.x < grid[0]?.length
          ? grid[nextPos.y][nextPos.x]
          : null

      if (isTraversable(cell)) {
        visited.add(key)
        queue.push({
          pos: nextPos,
          path: [...path, nextPos],
        })
      }
    }
  }

  // No path found
  return []
}

/**
 * Foundry Store
 * Manages the foundry grid, Anton's state, and crafting queue
 */
export const useFoundryStore = defineStore('foundry', () => {
  // State - load from localStorage or use defaults
  const gridState = ref<Omit<FoundryState, 'recipes'>>(loadFoundryState())

  // Recipes are not persisted (defined in config)
  const recipes = ref<Recipe[]>(recipeDefinitions)

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

  /**
   * Check if Anton is currently moving
   */
  const isMoving = computed(() => {
    return anton.value.currentAction === 'moving' || anton.value.path.length > 0
  })

  /**
   * Check if Anton is adjacent to the supply bin
   */
  const isAdjacentToSupplyBin = computed((): boolean => {
    const binPos = supplyBinPosition.value
    if (!binPos) return false
    return areAdjacent(anton.value.position, binPos)
  })

  /**
   * Check if Anton is adjacent to the anvil
   */
  const isAdjacentToAnvil = computed((): boolean => {
    const anvilPos = anvilPosition.value
    if (!anvilPos) return false
    return areAdjacent(anton.value.position, anvilPos)
  })

  // Getters - Recipe queries

  /**
   * Get recipe by ID
   */
  const getRecipeById = computed(() => (id: string): Recipe | undefined => {
    return recipes.value.find((recipe) => recipe.id === id)
  })

  /**
   * Get all available recipes
   */
  const allRecipes = computed(() => recipes.value)

  /**
   * Check if player has required resources for a recipe
   * @param recipeId - ID of recipe to check
   * @returns true if player has all required resources, false otherwise
   */
  function hasRequiredResources(recipeId: string): boolean {
    const recipe = getRecipeById.value(recipeId)
    if (!recipe) {
      return false
    }

    const resourcesStore = useResourcesStore()

    // Check all inputs
    for (const input of recipe.inputs) {
      if (!resourcesStore.hasResource(input.resourceId, input.amount)) {
        return false
      }
    }

    return true
  }

  /**
   * Get list of missing resources for a recipe
   * @param recipeId - ID of recipe to check
   * @returns Array of objects describing missing resources
   */
  function getMissingResources(
    recipeId: string
  ): Array<{ resourceId: string; required: number; available: number }> {
    const recipe = getRecipeById.value(recipeId)
    if (!recipe) {
      return []
    }

    const resourcesStore = useResourcesStore()
    const missing: Array<{ resourceId: string; required: number; available: number }> = []

    for (const input of recipe.inputs) {
      const available = resourcesStore.getResourceAmount(input.resourceId)
      if (available < input.amount) {
        missing.push({
          resourceId: input.resourceId,
          required: input.amount,
          available,
        })
      }
    }

    return missing
  }

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

  /**
   * Find path from start to target using BFS
   * @param start - Starting position
   * @param target - Target position
   * @returns Array of positions from start to target (excluding start), or empty array if no path exists
   */
  function findPath(start: GridPosition, target: GridPosition): GridPosition[] {
    return findPathBFS(grid.value, start, target)
  }

  /**
   * Move Anton to target cell
   * Calculates path and executes movement at 1 cell per second
   * @param targetX - Target X coordinate
   * @param targetY - Target Y coordinate
   * @returns Promise that resolves to true on success, false if no path exists or movement is interrupted
   */
  async function moveAntonToCell(targetX: number, targetY: number): Promise<boolean> {
    // Validate target position
    if (!isValidPosition.value(targetX, targetY)) {
      return false
    }

    // Cancel any ongoing movement
    if (currentMovementController) {
      currentMovementController.abort()
    }

    // Create new abort controller for this movement
    currentMovementController = new AbortController()
    const signal = currentMovementController.signal

    // Calculate path
    const path = findPath(anton.value.position, { x: targetX, y: targetY })

    if (path.length === 0) {
      return false
    }

    // Set path and progress (don't change action state - let callers manage that)
    setAntonPath(path)
    updateAntonProgress(0)

    try {
      const totalCells = path.length

      // Move through each cell in the path
      for (let i = 0; i < path.length; i++) {
        const targetPos = path[i]

        // Check if movement was aborted
        if (signal.aborted) {
          setAntonPath([])
          updateAntonProgress(0)
          return false
        }

        // Check if target cell is still traversable (edge case handling)
        const cell = getCellAt.value(targetPos.x, targetPos.y)
        if (!isTraversable(cell)) {
          // Target became invalid during movement
          setAntonPath([])
          updateAntonProgress(0)
          return false
        }

        // Animate movement to this cell
        const moveTimeMs = FOUNDRY_CONSTANTS.MOVE_TIME_PER_CELL * 1000
        const tickInterval = 100 // Update progress every 100ms for smooth animation
        const totalTicks = moveTimeMs / tickInterval
        let currentTick = 0

        await new Promise<void>((resolve) => {
          const intervalId = setInterval(() => {
            if (signal.aborted) {
              clearInterval(intervalId)
              resolve()
              return
            }

            currentTick++
            const cellProgress = Math.min(currentTick / totalTicks, 1)
            // Calculate overall movement progress: (completed cells + current cell progress) / total cells
            const overallProgress = (i + cellProgress) / totalCells
            updateAntonProgress(overallProgress)

            if (cellProgress >= 1) {
              clearInterval(intervalId)
              resolve()
            }
          }, tickInterval)
        })

        // Check again if movement was aborted during animation
        if (signal.aborted) {
          setAntonPath([])
          updateAntonProgress(0)
          return false
        }

        // Move Anton to the cell
        updateAntonPosition(targetPos)

        // Remove this step from the path
        setAntonPath(path.slice(i + 1))
      }

      // Movement complete (don't change action state - let callers manage transitions)
      setAntonPath([])
      updateAntonProgress(0)
      currentMovementController = null
      return true
    } catch (error) {
      // Error during movement - reset to idle
      updateAntonAction('idle')
      setAntonPath([])
      updateAntonProgress(0)
      currentMovementController = null
      return false
    }
  }

  // Actions - Queue management

  /**
   * Add recipe to crafting queue
   * Creates a unique ID for each queue item for tracking
   * Automatically starts the state machine if not running
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

    // Start the state machine if not already running
    startStateMachine()
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
    stopStateMachine()
    gridState.value = getDefaultFoundryState()
    try {
      localStorage.removeItem(STORAGE_KEY_FOUNDRY)
    } catch (error) {
      console.error('Failed to remove foundry state from localStorage:', error)
    }
  }

  // State Machine - Helper functions

  /**
   * Set Anton's action start time (for timed actions)
   */
  function setAntonActionStartTime(time: number | null): void {
    gridState.value.anton.actionStartTime = time
  }

  /**
   * Update last tick time (for offline progress)
   */
  function updateLastTickTime(): void {
    gridState.value.lastTickTime = Date.now()
  }

  /**
   * Consume recipe inputs (called during gathering phase)
   * @param recipeId - ID of recipe to consume inputs for
   * @returns true if resources were consumed, false if not available
   */
  function consumeRecipeInputs(recipeId: string): boolean {
    const recipe = getRecipeById.value(recipeId)
    if (!recipe) return false

    const resourcesStore = useResourcesStore()

    // Check if all resources are available
    for (const input of recipe.inputs) {
      if (!resourcesStore.hasResource(input.resourceId, input.amount)) {
        return false
      }
    }

    // Consume all resources
    for (const input of recipe.inputs) {
      resourcesStore.removeResource(input.resourceId, input.amount)
    }

    return true
  }

  /**
   * Produce recipe outputs (called when crafting completes)
   * @param recipeId - ID of recipe to produce outputs for
   */
  function produceRecipeOutputs(recipeId: string): void {
    const recipe = getRecipeById.value(recipeId)
    if (!recipe) return

    const resourcesStore = useResourcesStore()

    for (const output of recipe.outputs) {
      resourcesStore.addResource(output.resourceId, output.amount)
    }
  }

  // State Machine - Core functions

  /**
   * Main state machine tick function
   * Runs every 100ms to update action progress and handle state transitions
   */
  function stateMachineTick(): void {
    const currentAction = gridState.value.anton.currentAction
    const now = Date.now()

    // Update last tick time for offline progress
    updateLastTickTime()

    switch (currentAction) {
      case 'idle':
        handleIdleState()
        break

      case 'movingToSupplyBin':
        handleMovingToSupplyBinState()
        break

      case 'gathering':
        handleGatheringState(now)
        break

      case 'movingToAnvil':
        handleMovingToAnvilState()
        break

      case 'crafting':
        handleCraftingState(now)
        break

      case 'moving':
        // Generic moving state - movement is handled by moveAntonToCell
        // Just wait for it to complete
        break
    }
  }

  /**
   * Handle idle state - check queue and start next item
   */
  function handleIdleState(): void {
    // Find next pending item in queue
    const queue = gridState.value.craftingQueue
    let foundPending = false

    for (let i = 0; i < queue.length; i++) {
      if (queue[i].status === 'pending') {
        // Found a pending item - start processing it
        gridState.value.currentQueueIndex = i
        updateQueueItemStatus(i, 'in-progress')
        setAntonRecipe(queue[i].recipeId)
        updateAntonAction('movingToSupplyBin')
        foundPending = true
        break
      }
    }

    // If no pending items, stop the state machine
    if (!foundPending) {
      stopStateMachine()
    }
  }

  /**
   * Handle movingToSupplyBin state - move to supply bin and transition to gathering
   */
  function handleMovingToSupplyBinState(): void {
    // If already adjacent to supply bin, transition to gathering
    if (isAdjacentToSupplyBin.value) {
      updateAntonAction('gathering')
      setAntonActionStartTime(Date.now())
      updateAntonProgress(0)
      return
    }

    // If not already moving, start movement to supply bin
    if (!isProcessingMovement && gridState.value.anton.path.length === 0) {
      const binPos = supplyBinPosition.value
      if (!binPos) return

      // Find the closest adjacent walkable cell to Anton
      const targetCell = findClosestAdjacentWalkableCell(
        grid.value,
        binPos,
        anton.value.position
      )

      console.log('[Pathfinding] Anton at:', anton.value.position)
      console.log('[Pathfinding] Supply Bin at:', binPos)
      console.log('[Pathfinding] Target cell:', targetCell)

      if (!targetCell) {
        // No path available - pause (stay in this state)
        console.log('[Pathfinding] No adjacent walkable cell found')
        return
      }

      // Check if already at target
      if (anton.value.position.x === targetCell.x && anton.value.position.y === targetCell.y) {
        // Already at adjacent cell - transition to gathering
        updateAntonAction('gathering')
        setAntonActionStartTime(Date.now())
        updateAntonProgress(0)
        return
      }

      // Calculate and log the path
      const path = findPath(anton.value.position, targetCell)
      console.log('[Pathfinding] Path:', path)

      // Start movement
      isProcessingMovement = true
      moveAntonToCell(targetCell.x, targetCell.y).then((success) => {
        isProcessingMovement = false
        console.log('[Movement] Supply bin movement complete:', {
          success,
          currentAction: gridState.value.anton.currentAction,
          isAdjacent: isAdjacentToSupplyBin.value,
          antonPos: anton.value.position,
        })
        if (success && gridState.value.anton.currentAction === 'movingToSupplyBin') {
          // Movement complete - check if adjacent now
          if (isAdjacentToSupplyBin.value) {
            updateAntonAction('gathering')
            setAntonActionStartTime(Date.now())
            updateAntonProgress(0)
          }
        }
      })
    }
  }

  /**
   * Handle gathering state - wait for timer and consume resources
   */
  function handleGatheringState(now: number): void {
    const startTime = gridState.value.anton.actionStartTime
    if (!startTime) {
      // Start time not set - set it now
      setAntonActionStartTime(now)
      return
    }

    const recipeId = gridState.value.anton.currentRecipeId
    if (!recipeId) {
      // No recipe - go back to idle
      updateAntonAction('idle')
      return
    }

    // Check if resources are available
    if (!hasRequiredResources(recipeId)) {
      // Resources not available - skip this queue item and move to next
      const queueIndex = gridState.value.currentQueueIndex
      const missing = getMissingResources(recipeId)
      const recipe = getRecipeById.value(recipeId)

      // Build skip reason from missing resources
      const missingList = missing
        .map((m) => `${m.required - m.available} more ${m.resourceId}`)
        .join(', ')
      const skipReason = `Insufficient resources: need ${missingList}`

      // Mark queue item as skipped
      updateQueueItemStatus(queueIndex, 'skipped', skipReason)

      // Show warning notification
      const notificationsStore = useNotificationsStore()
      notificationsStore.showWarning(
        'Craft Skipped',
        `${recipe?.name || 'Item'}: ${missingList}`
      )

      // Reset Anton and go back to idle to find next pending item
      setAntonRecipe(null)
      setAntonActionStartTime(null)
      updateAntonProgress(0)
      updateAntonAction('idle')
      return
    }

    // Calculate progress
    const elapsed = now - startTime
    const gatherTimeMs = FOUNDRY_CONSTANTS.GATHER_TIME * 1000
    const progress = Math.min(elapsed / gatherTimeMs, 1)
    updateAntonProgress(progress)

    // Check if gathering is complete
    if (progress >= 1) {
      // Consume resources
      const consumed = consumeRecipeInputs(recipeId)
      if (consumed) {
        // Transition to moving to anvil
        updateAntonAction('movingToAnvil')
        setAntonActionStartTime(null)
        updateAntonProgress(0)
      } else {
        // Resources disappeared during gathering - skip this queue item
        const queueIndex = gridState.value.currentQueueIndex
        const missing = getMissingResources(recipeId)
        const recipe = getRecipeById.value(recipeId)

        const missingList = missing
          .map((m) => `${m.required - m.available} more ${m.resourceId}`)
          .join(', ')
        const skipReason = `Insufficient resources: need ${missingList}`

        updateQueueItemStatus(queueIndex, 'skipped', skipReason)

        const notificationsStore = useNotificationsStore()
        notificationsStore.showWarning(
          'Craft Skipped',
          `${recipe?.name || 'Item'}: ${missingList}`
        )

        setAntonRecipe(null)
        setAntonActionStartTime(null)
        updateAntonProgress(0)
        updateAntonAction('idle')
      }
    }
  }

  /**
   * Handle movingToAnvil state - move to anvil and transition to crafting
   */
  function handleMovingToAnvilState(): void {
    // If already adjacent to anvil, transition to crafting
    if (isAdjacentToAnvil.value) {
      updateAntonAction('crafting')
      setAntonActionStartTime(Date.now())
      updateAntonProgress(0)
      return
    }

    // If not already moving, start movement to anvil
    if (!isProcessingMovement && gridState.value.anton.path.length === 0) {
      const anvilPos = anvilPosition.value
      if (!anvilPos) return

      // Find the closest adjacent walkable cell to Anton
      const targetCell = findClosestAdjacentWalkableCell(
        grid.value,
        anvilPos,
        anton.value.position
      )

      console.log('[Pathfinding] Anton at:', anton.value.position)
      console.log('[Pathfinding] Anvil at:', anvilPos)
      console.log('[Pathfinding] Target cell:', targetCell)

      if (!targetCell) {
        // No path available - pause (stay in this state)
        console.log('[Pathfinding] No adjacent walkable cell found')
        return
      }

      // Check if already at target
      if (anton.value.position.x === targetCell.x && anton.value.position.y === targetCell.y) {
        // Already at adjacent cell - transition to crafting
        updateAntonAction('crafting')
        setAntonActionStartTime(Date.now())
        updateAntonProgress(0)
        return
      }

      // Calculate and log the path
      const path = findPath(anton.value.position, targetCell)
      console.log('[Pathfinding] Path:', path)

      // Start movement
      isProcessingMovement = true
      moveAntonToCell(targetCell.x, targetCell.y).then((success) => {
        isProcessingMovement = false
        console.log('[Movement] Anvil movement complete:', {
          success,
          currentAction: gridState.value.anton.currentAction,
          isAdjacent: isAdjacentToAnvil.value,
          antonPos: anton.value.position,
        })
        if (success && gridState.value.anton.currentAction === 'movingToAnvil') {
          // Movement complete - check if adjacent now
          if (isAdjacentToAnvil.value) {
            updateAntonAction('crafting')
            setAntonActionStartTime(Date.now())
            updateAntonProgress(0)
          }
        }
      })
    }
  }

  /**
   * Handle crafting state - wait for timer and produce outputs
   */
  function handleCraftingState(now: number): void {
    const startTime = gridState.value.anton.actionStartTime
    if (!startTime) {
      // Start time not set - set it now
      setAntonActionStartTime(now)
      return
    }

    const recipeId = gridState.value.anton.currentRecipeId
    if (!recipeId) {
      // No recipe - go back to idle
      updateAntonAction('idle')
      return
    }

    const recipe = getRecipeById.value(recipeId)
    if (!recipe) {
      // Recipe not found - go back to idle
      updateAntonAction('idle')
      return
    }

    // Calculate progress
    const elapsed = now - startTime
    const craftTimeMs = recipe.craftTime * 1000
    const progress = Math.min(elapsed / craftTimeMs, 1)
    updateAntonProgress(progress)

    // Check if crafting is complete
    if (progress >= 1) {
      // Produce outputs
      produceRecipeOutputs(recipeId)

      // Show success notification
      const outputSummary = recipe.outputs
        .map((o) => `+${o.amount} ${o.resourceId}`)
        .join(', ')
      const notificationsStore = useNotificationsStore()
      notificationsStore.showSuccess(`Crafted ${recipe.name}`, `${recipe.icon || ''} ${outputSummary}`)

      // Mark queue item as completed
      const queueIndex = gridState.value.currentQueueIndex
      updateQueueItemStatus(queueIndex, 'completed')

      // Reset Anton state
      setAntonRecipe(null)
      setAntonActionStartTime(null)
      updateAntonProgress(0)
      updateAntonAction('idle')
    }
  }

  /**
   * Start the state machine
   * Called when items are added to the queue
   */
  function startStateMachine(): void {
    if (stateMachineInterval) {
      // Already running
      return
    }

    // Run tick immediately, then every 100ms
    stateMachineTick()
    stateMachineInterval = setInterval(stateMachineTick, 100)
  }

  /**
   * Stop the state machine
   * Called when queue becomes empty or on reset
   */
  function stopStateMachine(): void {
    if (stateMachineInterval) {
      clearInterval(stateMachineInterval)
      stateMachineInterval = null
    }
  }

  /**
   * Restart Anton's state machine
   * Resets Anton to idle and restarts queue processing
   * Useful when layout changes invalidate current movement
   */
  function restartAnton(): void {
    // Cancel any ongoing movement
    if (currentMovementController) {
      currentMovementController.abort()
      currentMovementController = null
    }
    isProcessingMovement = false

    // Reset Anton to idle state
    gridState.value.anton.currentAction = 'idle'
    gridState.value.anton.actionProgress = 0
    gridState.value.anton.actionStartTime = null
    gridState.value.anton.path = []

    // Reset current in-progress queue item back to pending
    const currentIndex = gridState.value.currentQueueIndex
    if (
      currentIndex >= 0 &&
      currentIndex < gridState.value.craftingQueue.length &&
      gridState.value.craftingQueue[currentIndex].status === 'in-progress'
    ) {
      gridState.value.craftingQueue[currentIndex].status = 'pending'
    }
    gridState.value.anton.currentRecipeId = null

    // Restart state machine
    stopStateMachine()
    const hasPendingItems = gridState.value.craftingQueue.some(
      (item) => item.status === 'pending' || item.status === 'in-progress'
    )
    if (hasPendingItems) {
      startStateMachine()
    }
  }

  /**
   * Process offline progress
   * Calculates how much time has passed since last tick and fast-forwards the state machine
   */
  function processOfflineProgress(): void {
    const lastTick = gridState.value.lastTickTime
    if (!lastTick) return

    const now = Date.now()
    let elapsedMs = now - lastTick

    // Safety cap - don't process more than 24 hours of offline time
    const maxOfflineMs = 24 * 60 * 60 * 1000
    elapsedMs = Math.min(elapsedMs, maxOfflineMs)

    // Fast-forward through timed actions
    while (elapsedMs > 0) {
      const currentAction = gridState.value.anton.currentAction
      const startTime = gridState.value.anton.actionStartTime
      const recipeId = gridState.value.anton.currentRecipeId

      if (currentAction === 'gathering' && startTime && recipeId) {
        // Check if we have resources
        if (!hasRequiredResources(recipeId)) {
          // Can't proceed without resources - stop processing
          break
        }

        const gatherTimeMs = FOUNDRY_CONSTANTS.GATHER_TIME * 1000
        const timeAlreadySpent = lastTick - startTime
        const timeRemaining = gatherTimeMs - timeAlreadySpent

        if (elapsedMs >= timeRemaining) {
          // Gathering complete
          consumeRecipeInputs(recipeId)
          elapsedMs -= timeRemaining
          gridState.value.anton.currentAction = 'movingToAnvil'
          gridState.value.anton.actionStartTime = null
          gridState.value.anton.actionProgress = 0
          // For offline, we skip movement time - assume instant movement
          // Update position to be adjacent to anvil
          const anvilPos = anvilPosition.value
          if (anvilPos) {
            const adjacentCell = findAdjacentWalkableCell(grid.value, anvilPos)
            if (adjacentCell) {
              gridState.value.anton.position = { ...adjacentCell }
            }
          }
          // Clear the path since movement is complete
          gridState.value.anton.path = []
          gridState.value.anton.currentAction = 'crafting'
          gridState.value.anton.actionStartTime = now - elapsedMs
        } else {
          // Still gathering - update progress
          gridState.value.anton.actionStartTime = now - elapsedMs - timeAlreadySpent
          break
        }
      } else if (currentAction === 'crafting' && startTime && recipeId) {
        const recipe = getRecipeById.value(recipeId)
        if (!recipe) break

        const craftTimeMs = recipe.craftTime * 1000
        const timeAlreadySpent = lastTick - startTime
        const timeRemaining = craftTimeMs - timeAlreadySpent

        if (elapsedMs >= timeRemaining) {
          // Crafting complete
          produceRecipeOutputs(recipeId)
          updateQueueItemStatus(gridState.value.currentQueueIndex, 'completed')
          elapsedMs -= timeRemaining

          // Reset and look for next queue item
          gridState.value.anton.currentRecipeId = null
          gridState.value.anton.actionStartTime = null
          gridState.value.anton.actionProgress = 0
          gridState.value.anton.currentAction = 'idle'

          // Find next pending item
          const queue = gridState.value.craftingQueue
          let foundNext = false
          for (let i = 0; i < queue.length; i++) {
            if (queue[i].status === 'pending') {
              // Check if we have resources for this item
              if (hasRequiredResources(queue[i].recipeId)) {
                gridState.value.currentQueueIndex = i
                gridState.value.craftingQueue[i].status = 'in-progress'
                gridState.value.anton.currentRecipeId = queue[i].recipeId
                // Update position to be adjacent to supply bin (skipping movement)
                const binPos = supplyBinPosition.value
                if (binPos) {
                  const adjacentCell = findAdjacentWalkableCell(grid.value, binPos)
                  if (adjacentCell) {
                    gridState.value.anton.position = { ...adjacentCell }
                  }
                }
                gridState.value.anton.currentAction = 'gathering'
                gridState.value.anton.actionStartTime = now - elapsedMs
                foundNext = true
                break
              }
            }
          }
          if (!foundNext) {
            // No more items to process
            break
          }
        } else {
          // Still crafting - update start time
          gridState.value.anton.actionStartTime = now - elapsedMs - timeAlreadySpent
          break
        }
      } else if (currentAction === 'movingToSupplyBin' || currentAction === 'movingToAnvil') {
        // For offline progress, calculate movement time based on path length
        // Movement takes 1 second per cell
        const pathLength = gridState.value.anton.path.length
        let movementTimeMs = pathLength * FOUNDRY_CONSTANTS.MOVE_TIME_PER_CELL * 1000

        // If no path is stored, calculate it now to determine movement time
        if (pathLength === 0) {
          const targetPos = currentAction === 'movingToSupplyBin'
            ? supplyBinPosition.value
            : anvilPosition.value

          if (targetPos) {
            const adjacentCell = findClosestAdjacentWalkableCell(
              grid.value,
              targetPos,
              anton.value.position
            )
            if (adjacentCell) {
              const calculatedPath = findPath(anton.value.position, adjacentCell)
              movementTimeMs = calculatedPath.length * FOUNDRY_CONSTANTS.MOVE_TIME_PER_CELL * 1000
            }
          }
        }

        if (elapsedMs >= movementTimeMs) {
          // Movement complete - consume the time and transition to next state
          elapsedMs -= movementTimeMs

          if (currentAction === 'movingToSupplyBin') {
            const binPos = supplyBinPosition.value
            if (binPos) {
              // If Anton has a path, use the last position in the path (the destination)
              // Otherwise, find any adjacent walkable cell
              let adjacentCell: GridPosition | null = null
              if (gridState.value.anton.path.length > 0) {
                const destination = gridState.value.anton.path[gridState.value.anton.path.length - 1]
                // Verify it's still walkable and adjacent
                if (areAdjacent(binPos, destination) && isTraversable(grid.value[destination.y]?.[destination.x])) {
                  adjacentCell = destination
                }
              }
              // Fallback to finding any adjacent cell
              if (!adjacentCell) {
                adjacentCell = findAdjacentWalkableCell(grid.value, binPos)
              }
              if (adjacentCell) {
                gridState.value.anton.position = { ...adjacentCell }
              }
            }
            // Clear the path since movement is complete
            gridState.value.anton.path = []
            gridState.value.anton.currentAction = 'gathering'
            gridState.value.anton.actionStartTime = now - elapsedMs
          } else {
            const anvilPos = anvilPosition.value
            if (anvilPos) {
              // If Anton has a path, use the last position in the path (the destination)
              // Otherwise, find any adjacent walkable cell
              let adjacentCell: GridPosition | null = null
              if (gridState.value.anton.path.length > 0) {
                const destination = gridState.value.anton.path[gridState.value.anton.path.length - 1]
                // Verify it's still walkable and adjacent
                if (areAdjacent(anvilPos, destination) && isTraversable(grid.value[destination.y]?.[destination.x])) {
                  adjacentCell = destination
                }
              }
              // Fallback to finding any adjacent cell
              if (!adjacentCell) {
                adjacentCell = findAdjacentWalkableCell(grid.value, anvilPos)
              }
              if (adjacentCell) {
                gridState.value.anton.position = { ...adjacentCell }
              }
            }
            // Clear the path since movement is complete
            gridState.value.anton.path = []
            gridState.value.anton.currentAction = 'crafting'
            gridState.value.anton.actionStartTime = now - elapsedMs
          }
        } else {
          // Still moving - stay in this state
          // Can't partially complete movement in offline progress, so just wait
          break
        }
      } else if (currentAction === 'idle') {
        // Find next pending item
        const queue = gridState.value.craftingQueue
        let foundNext = false
        for (let i = 0; i < queue.length; i++) {
          if (queue[i].status === 'pending') {
            if (hasRequiredResources(queue[i].recipeId)) {
              gridState.value.currentQueueIndex = i
              gridState.value.craftingQueue[i].status = 'in-progress'
              gridState.value.anton.currentRecipeId = queue[i].recipeId
              // Update position to be adjacent to supply bin (skipping movement)
              const binPos = supplyBinPosition.value
              if (binPos) {
                const adjacentCell = findAdjacentWalkableCell(grid.value, binPos)
                if (adjacentCell) {
                  gridState.value.anton.position = { ...adjacentCell }
                }
              }
              gridState.value.anton.currentAction = 'gathering'
              gridState.value.anton.actionStartTime = now - elapsedMs
              foundNext = true
              break
            }
          }
        }
        if (!foundNext) {
          break
        }
      } else if (currentAction === 'moving') {
        // Generic moving state - movement was interrupted during page close
        // Clear the path and transition to idle to let state machine figure out what to do next
        gridState.value.anton.path = []
        gridState.value.anton.currentAction = 'idle'
        gridState.value.anton.actionProgress = 0
        // Don't break - continue processing in idle state
      } else {
        // Unknown state
        break
      }
    }

    // Update last tick time
    gridState.value.lastTickTime = now
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

  // Initialize: Process offline progress and start state machine if needed
  processOfflineProgress()

  // Check if there are pending or in-progress items in the queue
  const hasPendingItems = gridState.value.craftingQueue.some(
    (item) => item.status === 'pending' || item.status === 'in-progress'
  )
  if (hasPendingItems) {
    startStateMachine()
  }

  return {
    // State
    grid,
    gridSize,
    anton,
    craftingQueue,
    currentQueueIndex,
    recipes,
    // Getters - Grid
    getCellAt,
    supplyBinPosition,
    anvilPosition,
    currentQueueItem,
    isValidPosition,
    isMoving,
    isAdjacentToSupplyBin,
    isAdjacentToAnvil,
    // Getters - Recipe
    getRecipeById,
    allRecipes,
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
    findPath,
    moveAntonToCell,
    // Actions - Queue
    addToQueue,
    removeFromQueue,
    clearQueue,
    updateQueueItemStatus,
    moveToNextQueueItem,
    setCurrentQueueIndex,
    // Actions - Recipe
    hasRequiredResources,
    getMissingResources,
    // Actions - State Machine
    startStateMachine,
    stopStateMachine,
    restartAnton,
    // Actions - Utility
    resetFoundry,
  }
})
