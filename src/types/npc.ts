/**
 * NPC System Type Definitions
 *
 * Centralized NPC configuration that separates NPC identity and dialog
 * from their physical presence in area maps. Enables dynamic dialog
 * progressions, NPCs that can move between locations, and condition-based
 * dialog gating.
 */

import type { TriggerCondition } from './areaMapConfig'
import type { CharacterPortrait } from './dialogs'

/**
 * Entry in an NPC's dialog progression
 * Represents a dialog tree that should be shown in order
 */
export interface DialogProgressionEntry {
  /** Dialog tree ID to show */
  id: string
  /** Optional conditions that must be met for this dialog to be available */
  conditions?: TriggerCondition[]
}

/**
 * Entry in an NPC's fallback dialog list
 * Shown when all progression dialogs are completed
 */
export interface FallbackDialogEntry {
  /** Dialog tree ID to show */
  id: string
  /** Priority for selection (higher = shown first, default: 0) */
  priority?: number
  /** Optional conditions that must be met for this fallback to be available */
  conditions?: TriggerCondition[]
}

/**
 * Centralized NPC configuration
 * Defines NPC identity, appearance, and dialog structure
 */
export interface NPCConfig {
  /** Unique identifier for this NPC */
  id: string
  /** Display name of the NPC */
  name: string
  /** Character portrait information */
  portrait: CharacterPortrait
  /** Icon/emoji to display for this NPC */
  icon: string
  /**
   * Ordered list of dialog trees to show in sequence
   * Each entry can have conditions for availability
   * Shows indicator when uncompleted progression dialogs exist
   */
  dialogProgression?: DialogProgressionEntry[]
  /**
   * Fallback dialogs to show after all progression dialogs are complete
   * Sorted by priority (descending), first available is shown
   * No indicator shown for fallback dialogs
   */
  fallbackProgression?: FallbackDialogEntry[]
}

/**
 * NPC location status types
 */
export type NPCLocationStatus = 'present' | 'in-transit' | 'unavailable'

/**
 * NPC is present at a feature location
 */
export interface NPCLocationPresent {
  status: 'present'
  /** Feature ID where NPC is located */
  featureId: string
}

/**
 * NPC is in transit between locations
 */
export interface NPCLocationInTransit {
  status: 'in-transit'
  /** Feature ID of origin location (null if coming from off-map) */
  fromFeatureId: string | null
  /** Feature ID of destination location */
  toFeatureId: string
}

/**
 * NPC is currently unavailable (e.g., away on mission)
 */
export interface NPCLocationUnavailable {
  status: 'unavailable'
  /** Optional reason for unavailability */
  reason?: string
}

/**
 * Union type for NPC location states
 */
export type NPCLocation = NPCLocationPresent | NPCLocationInTransit | NPCLocationUnavailable

/**
 * Map of NPC IDs to their current locations
 */
export type NPCLocationMap = Record<string, NPCLocation>
