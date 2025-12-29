/**
 * Area Map Configuration Type Definitions
 *
 * Defines the schema for area map configuration files.
 * Each area type (academy, harbor, etc.) exports a configuration object
 * that defines its features, layout modes, and triggers.
 */

import type { Component } from 'vue'
import type { Feature, FeaturePosition } from './feature'
import type { AreaType } from './areaMap'

/**
 * Layout mode identifier
 * Determines how features are arranged on the canvas
 */
export type LayoutMode = '2x2' | '1x4' | '3x3' | '1x2' | 'custom'

/**
 * Configuration for a specific layout mode
 * Defines viewport dimensions and breakpoints
 */
export interface LayoutConfig {
  /** Layout mode identifier */
  mode: LayoutMode
  /** ViewBox width in SVG units */
  viewBoxWidth: number
  /** ViewBox height in SVG units */
  viewBoxHeight: number
  /** Canvas width in pixels */
  canvasWidth: number
  /** Canvas height in pixels */
  canvasHeight: number
  /** Minimum window width for this layout (optional, for breakpoints) */
  minWidth?: number
  /** Maximum window width for this layout (optional, for breakpoints) */
  maxWidth?: number
}

/**
 * Trigger event types
 * Defines when triggers should fire
 */
export type TriggerEvent =
  | 'onFirstVisit'    // First time player enters this area
  | 'onEnter'         // Every time player enters this area
  | 'onExit'          // When player leaves this area
  | 'onFeatureInteract' // When player interacts with a specific feature

/**
 * Predefined trigger action types
 * Common actions that can be executed declaratively
 */
export type TriggerActionType =
  | 'showDialog'          // Show a dialog modal
  | 'showDialogTree'      // Show a branching dialog tree
  | 'showTutorial'        // Show a tutorial modal
  | 'completeObjective'   // Mark an objective as complete
  | 'unlockObjective'     // Make an objective visible/active
  | 'unlockFeature'       // Unlock a feature
  | 'hideFeature'         // Hide a feature
  | 'addResource'         // Add resources to player inventory
  | 'removeResource'      // Remove resources from player inventory
  | 'exploreTile'         // Mark a world map tile as explored

/**
 * Trigger action definition
 * Declarative action that can be executed by the trigger system
 */
export interface TriggerAction {
  /** Type of action to execute */
  type: TriggerActionType
  /** Dialog ID (for showDialog, showDialogTree) */
  dialogId?: string
  /** Tutorial ID (for showTutorial) */
  tutorialId?: string
  /** Objective ID (for completeObjective, unlockObjective) */
  objectiveId?: string
  /** Feature ID (for unlockFeature, hideFeature) */
  featureId?: string
  /** Resource ID (for addResource, removeResource) */
  resourceId?: string
  /** Amount (for addResource, removeResource) */
  amount?: number
  /** Tile coordinates (for exploreTile) */
  tileCoords?: { q: number; r: number }
  /** Subtask ID (for objective subtask operations) */
  subtaskId?: string
}

/**
 * Context provided to trigger callbacks
 * Gives access to stores and current state
 */
export interface TriggerContext {
  /** Store references for custom logic */
  stores: {
    dialogs: any // useDialogsStore
    objectives: any // useObjectivesStore
    resources: any // useResourcesStore
    worldMap: any // useWorldMapStore
    areaMap: any // useAreaMapStore
    notifications: any // useNotificationsStore
  }
  /** Current area coordinates */
  coordinates: { q: number; r: number }
  /** Feature ID (only for onFeatureInteract events) */
  featureId?: string
  /** Area type */
  areaType: AreaType
}

/**
 * Simple condition for trigger evaluation
 * Foundation for future complex conditions with AND/OR logic
 */
export interface TriggerCondition {
  /** Condition type */
  type: 'objectiveComplete' | 'resourceAmount' | 'featureState' | 'tileExplored' | 'dialogComplete'
  /** Objective ID (for objectiveComplete) */
  objectiveId?: string
  /** Resource ID (for resourceAmount) */
  resourceId?: string
  /** Comparison operator (for resourceAmount) */
  operator?: '>=' | '<=' | '==' | '>' | '<'
  /** Value to compare against */
  value?: number
  /** Feature ID (for featureState) */
  featureId?: string
  /** Feature state to check (for featureState) */
  state?: 'locked' | 'unlocked' | 'hidden'
  /** Tile coordinates (for tileExplored) */
  tileCoords?: { q: number; r: number }
  /** Dialog tree ID (for dialogComplete) */
  dialogId?: string
}

/**
 * Area trigger definition
 * Defines when and what happens in response to events
 */
export interface AreaTrigger {
  /** Event that triggers this action */
  event: TriggerEvent
  /** Feature ID (required for onFeatureInteract events) */
  featureId?: string
  /** Optional condition that must be met for trigger to fire */
  condition?: TriggerCondition
  /** Predefined actions to execute (declarative approach) */
  actions?: TriggerAction[]
  /** Optional callback for complex custom logic (imperative approach) */
  callback?: (context: TriggerContext) => void | Promise<void>
  /** Human-readable description of this trigger (for debugging) */
  description?: string
}

/**
 * Feature configuration
 * Extends base Feature type with component reference and layout-specific positions
 */
export interface FeatureConfig extends Omit<Feature, 'position'> {
  /** Vue component to render for this feature */
  component: Component
  /** Positions for each layout mode (keyed by layout name: 'desktop', 'mobile', etc.) */
  positions: Record<string, FeaturePosition>
  /** Props to pass to the feature component (optional) */
  props?: Record<string, any>
}

/**
 * Area Map Configuration
 * Complete configuration for a single area type
 */
export interface AreaMapConfig {
  /** Area type identifier */
  areaType: AreaType
  /** Background color (hex code) */
  background: string
  /** Optional background image URL */
  backgroundImage?: string
  /** Layout configurations (keyed by layout name: 'desktop', 'mobile', etc.) */
  layouts: Record<string, LayoutConfig>
  /** Features in this area */
  features: FeatureConfig[]
  /** Triggers for this area */
  triggers: AreaTrigger[]
  /** Optional custom data specific to this area type */
  customData?: Record<string, any>
}

/**
 * Area config loader function type
 * Function that returns a config for given coordinates
 */
export type AreaConfigLoader = (q: number, r: number) => AreaMapConfig | null
