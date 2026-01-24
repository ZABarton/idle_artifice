/**
 * Dialog Trigger System Types
 *
 * Defines types for the centralized dialog trigger system that maps
 * game conditions to dialog tree displays.
 */

/**
 * Trigger condition types for dialog trees
 * Mirrors TutorialTriggerType for consistency
 */
export type DialogTriggerType =
  | 'objective-complete' // When a specific objective is completed
  | 'objective-active' // When a specific objective becomes active
  | 'dialog-complete' // When another dialog tree is completed
  | 'feature-interact' // When a feature is interacted with
  | 'feature-unlock' // When a feature is unlocked
  | 'location-visit' // When a location is first visited
  | 'location-enter' // When entering a location (every time)
  | 'resource-threshold' // When resource amount crosses threshold
  | 'craft-complete' // When crafting completes (with optional count)

/**
 * Comparison operators for numeric conditions
 */
export type ComparisonOperator = 'eq' | 'gte' | 'lte' | 'gt' | 'lt'

/**
 * Single trigger condition
 */
export interface DialogTriggerCondition {
  /** Type of trigger */
  type: DialogTriggerType
  /** ID of the objective/dialog/feature/location to check */
  id?: string
  /** Numeric value for thresholds (resource amount, craft count) */
  value?: number
  /** Comparison operator for value conditions (default: 'gte') */
  operator?: ComparisonOperator
}

/**
 * Complete trigger definition mapping conditions to a dialog tree
 */
export interface DialogTrigger {
  /** Unique ID for this trigger (for tracking fired state) */
  id: string
  /** Dialog tree ID to show when conditions are met */
  dialogTreeId: string
  /** All conditions must be met (AND logic) */
  conditions: DialogTriggerCondition[]
  /** Only fire once (default: true) */
  showOnce?: boolean
  /** Priority when multiple triggers fire simultaneously (higher = first) */
  priority?: number
  /** Human-readable description for debugging */
  description?: string
}

/**
 * Root structure of dialog-triggers.json
 */
export interface DialogTriggersConfig {
  triggers: DialogTrigger[]
}
