/**
 * Objectives system types for managing player quests and goals
 */

/**
 * Represents the visibility and completion state of an objective
 * - 'hidden': Not yet discovered by the player
 * - 'active': Visible and available to work on
 * - 'completed': Successfully finished
 */
export type ObjectiveStatus = 'hidden' | 'active' | 'completed'

/**
 * Categorizes objectives by their importance and purpose
 * - 'main': Narrative progression objectives
 * - 'secondary': Optional/helpful side objectives
 */
export type ObjectiveCategory = 'main' | 'secondary'

/**
 * Represents a single step within a multi-step objective
 */
export interface ObjectiveSubtask {
  /** Unique identifier for this subtask */
  id: string
  /** Description of what needs to be done */
  description: string
  /** Whether this subtask has been completed */
  completed: boolean
}

/**
 * Defines conditions that must be met to unlock/reveal an objective
 */
export interface UnlockCondition {
  /**
   * Type of condition to check
   * - 'objective': Requires another objective to be completed
   * - 'resource': Requires a certain amount of a resource
   * - 'location': Requires visiting or exploring a location
   * - 'feature': Requires interacting with or unlocking a feature
   * - 'custom': Custom condition evaluated by game logic
   */
  type: 'objective' | 'resource' | 'location' | 'feature' | 'custom'
  /** ID of the objective/resource/location/feature to check */
  id: string
  /** Optional numeric value (e.g., resource amount, visit count) */
  value?: number
  /** Human-readable description of this condition */
  description: string
}

/**
 * Represents a player objective (quest, goal, task)
 *
 * All objectives are pre-defined by the game designer. They can be revealed
 * and unlocked based on game events, but are never generated dynamically.
 */
export interface Objective {
  /** Unique identifier */
  id: string
  /** Display title shown to the player */
  title: string
  /** Detailed description of the objective */
  description: string
  /** Current visibility and completion status */
  status: ObjectiveStatus
  /** Category determining display priority and purpose */
  category: ObjectiveCategory

  /** Optional list of subtasks for multi-step objectives */
  subtasks?: ObjectiveSubtask[]
  /** Current progress value (alternative to subtasks) */
  currentProgress?: number
  /** Maximum progress value (e.g., "3/10 items crafted") */
  maxProgress?: number

  /**
   * Conditions that must be met to reveal this objective
   * Once revealed, objective becomes immediately available to work on
   */
  discoveryConditions?: UnlockCondition[]

  /**
   * Hex coordinates where this objective can be completed
   * Format: "q,r" (e.g., "0,0" for academy, "-1,0" for harbor)
   * Used to display quest markers on the World Map
   */
  targetLocation?: string

  /** Display order within category (lower numbers first) */
  order: number
  /** Timestamp when objective was completed */
  completedAt?: Date
}
