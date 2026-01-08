/**
 * Feature type definitions for Area Map interactive elements
 */

/**
 * Feature state - represents the unlock/visibility status of a feature
 */
export type FeatureState = 'hidden' | 'locked' | 'unlocked'

/**
 * Feature interaction type - determines how users interact with the feature
 * - 'inline': Simple controls displayed directly within the Area Map (e.g., Shop slider)
 * - 'navigation': Complex features that navigate to a dedicated screen (e.g., Foundry puzzle)
 */
export type FeatureInteractionType = 'inline' | 'navigation'

/**
 * Feature type identifier - represents different feature types
 */
export type FeatureType =
  | 'foundry'
  | 'workshop'
  | 'alchemist'
  | 'shop'
  | 'wharf'
  | 'tavern'
  | 'quartermaster'

/**
 * Position within the Area Map SVG canvas
 * @deprecated No longer used - features now use vertical stacking layout
 */
export interface FeaturePosition {
  /** X coordinate in viewBox units */
  x: number
  /** Y coordinate in viewBox units */
  y: number
}

/**
 * Prerequisite condition for unlocking a feature
 */
export interface FeaturePrerequisite {
  /** Type of prerequisite (e.g., 'feature', 'resource', 'milestone') */
  type: 'feature' | 'resource' | 'milestone'
  /** ID or identifier of the prerequisite */
  id: string
  /** Human-readable description of the prerequisite */
  description: string
}

/**
 * Feature data model - represents an interactive element in an Area Map
 */
export interface Feature {
  /** Unique identifier for this feature */
  id: string
  /** Feature type identifier */
  type: FeatureType
  /** Display name of the feature */
  name: string
  /** Description of the feature's purpose */
  description?: string
  /** Icon identifier (SVG path or emoji placeholder) */
  icon: string
  /** Current state of the feature (hidden/locked/unlocked) */
  state: FeatureState
  /** Whether this feature is currently active/selected */
  isActive: boolean
  /** Prerequisites required to unlock this feature */
  prerequisites?: FeaturePrerequisite[]
  /** How users interact with this feature */
  interactionType: FeatureInteractionType
}
