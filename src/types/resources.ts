/**
 * Resource system types for managing game resources
 */

/**
 * Represents a game resource (currency, materials, etc.)
 *
 * The icon field accepts either emoji strings or SVG paths, allowing for
 * flexibility in visual representation
 */
export interface Resource {
  /** Unique identifier (e.g., 'wood', 'stone', 'gold') */
  id: string
  /** Display name shown to the player */
  name: string
  /** Current amount of this resource */
  amount: number
  /** Optional icon/emoji or SVG path for visual representation */
  icon?: string
  /** Optional category for grouping resources (e.g., 'basic_materials', 'metals') */
  category?: string
}
