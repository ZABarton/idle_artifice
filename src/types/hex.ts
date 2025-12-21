import type { Hex } from 'honeycomb-grid'

/**
 * Hexagon coordinate system: Using honeycomb-grid's axial coordinates
 * - q: column coordinate (increases to the right)
 * - r: row coordinate (increases downward)
 * - Hexagons are oriented with flat edge on top
 */

/**
 * Represents the exploration status of a hex tile
 */
export type ExplorationStatus = 'explored' | 'unexplored'

/**
 * Data model for a hexagon tile on the world map
 */
export interface HexTile {
  /** Axial coordinate q (column) */
  q: number
  /** Axial coordinate r (row) */
  r: number
  /** Whether this hex has been explored */
  explorationStatus: ExplorationStatus
  /** Optional type/category of this hex (e.g., 'academy', 'harbor', 'ocean', 'forest', 'mountain') */
  type?: string
  /** Whether this hex can be clicked to navigate (defaults to true for explored tiles) */
  clickable?: boolean
  /** Number of times this area has been visited (persistent across navigation) */
  visitCount?: number
}

/**
 * Type alias for honeycomb-grid's Hex type
 * Used for hex math operations and positioning
 */
export type HexCell = Hex
