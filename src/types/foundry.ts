/**
 * Foundry system types for grid-based crafting mechanics
 */

/**
 * Grid cell type - defines what occupies a cell on the foundry grid
 */
export enum GridCellType {
  /** Empty cell that can be traversed */
  Empty = 'empty',
  /** Supply bin where Anton gathers resources */
  SupplyBin = 'supplyBin',
  /** Anvil where Anton crafts items */
  Anvil = 'anvil',
  /** Blocked cell that cannot be traversed (for future expansion) */
  Blocked = 'blocked',
}

/**
 * Represents a single cell in the foundry grid
 */
export interface GridCell {
  /** X coordinate in the grid (0-indexed) */
  x: number
  /** Y coordinate in the grid (0-indexed) */
  y: number
  /** Type of cell defining its purpose */
  type: GridCellType
}

/**
 * Position coordinates on the grid
 */
export interface GridPosition {
  /** X coordinate (0-indexed) */
  x: number
  /** Y coordinate (0-indexed) */
  y: number
}

/**
 * Anton's current action state in the crafting workflow
 */
export type AntonAction =
  | 'idle'
  | 'moving'
  | 'movingToSupplyBin'
  | 'gathering'
  | 'movingToAnvil'
  | 'crafting'

/**
 * Anton's state - tracks position, current action, and progress
 */
export interface AntonState {
  /** Current position on the grid */
  position: GridPosition
  /** Current action being performed */
  currentAction: AntonAction
  /** Progress of current timed action (0-1, where 1 is complete) */
  actionProgress: number
  /** Planned movement path (array of positions to traverse) */
  path: GridPosition[]
  /** ID of recipe currently being crafted (if any) */
  currentRecipeId: string | null
  /** Timestamp when current timed action started (for offline progress) */
  actionStartTime: number | null
}

/**
 * Recipe input requirement - specifies resources needed for crafting
 */
export interface RecipeInput {
  /** Resource ID from the global resource store */
  resourceId: string
  /** Amount of this resource required */
  amount: number
}

/**
 * Recipe output - specifies what is produced by crafting
 */
export interface RecipeOutput {
  /** Resource ID to add to global resource store */
  resourceId: string
  /** Amount of this resource produced */
  amount: number
}

/**
 * Recipe definition for crafting items at the foundry
 */
export interface Recipe {
  /** Unique identifier for this recipe */
  id: string
  /** Display name of the recipe */
  name: string
  /** Description of what this recipe creates */
  description?: string
  /** Resources required to craft this recipe */
  inputs: RecipeInput[]
  /** Resources produced by this recipe */
  outputs: RecipeOutput[]
  /** Time in seconds to craft this recipe at the anvil */
  craftTime: number
  /** Optional icon/emoji for visual representation */
  icon?: string
}

/**
 * Status of a crafting queue item
 */
export type CraftingQueueItemStatus = 'pending' | 'in-progress' | 'skipped' | 'completed'

/**
 * Item in the crafting queue
 */
export interface CraftingQueueItem {
  /** ID of the recipe to craft */
  recipeId: string
  /** Current status of this queue item */
  status: CraftingQueueItemStatus
  /** Reason for skip (if status is 'skipped') */
  skipReason?: string
  /** Unique identifier for this queue item */
  id: string
}

/**
 * Complete state for the foundry Pinia store
 */
export interface FoundryState {
  /** 2D grid of cells (grid[y][x] format) */
  grid: GridCell[][]
  /** Grid dimensions */
  gridSize: {
    width: number
    height: number
  }
  /** Anton's current state */
  anton: AntonState
  /** Queue of recipes to craft */
  craftingQueue: CraftingQueueItem[]
  /** Index of the current item being processed in the queue */
  currentQueueIndex: number
  /** Available recipes (registry) */
  recipes: Recipe[]
  /** Timestamp of last state machine update (for offline progress) */
  lastTickTime: number | null
}

/**
 * Constants for foundry mechanics
 */
export const FOUNDRY_CONSTANTS = {
  /** Time in seconds for Anton to move one grid cell */
  MOVE_TIME_PER_CELL: 1,
  /** Time in seconds for Anton to gather resources at the supply bin */
  GATHER_TIME: 3,
  /** Default grid size */
  DEFAULT_GRID_SIZE: 5,
  /** Anton's default starting position */
  DEFAULT_ANTON_POSITION: { x: 2, y: 2 },
  /** Default supply bin position */
  DEFAULT_SUPPLY_BIN_POSITION: { x: 0, y: 0 },
  /** Default anvil position */
  DEFAULT_ANVIL_POSITION: { x: 4, y: 4 },
} as const
