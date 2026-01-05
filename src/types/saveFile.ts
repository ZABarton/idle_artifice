/**
 * Save File Type Definitions
 *
 * Defines the structure of exported game save files.
 * Save files are JSON objects containing all persisted game state.
 */

import type { ObjectiveStatus } from './objectives'
import type { Resource } from './resources'
import type { HexTile } from './hex'

/**
 * Complete save file structure
 */
export interface SaveFile {
  /** Game version (from package.json) */
  version: string
  /** ISO timestamp of when save was created */
  timestamp: string
  /** All game state data */
  gameState: GameState
}

/**
 * Complete game state (all stores)
 */
export interface GameState {
  objectives: ObjectivesState
  dialogs: DialogsState
  resources: ResourcesState
  worldMap: WorldMapState
  areaMaps: AreaMapsState
}

/**
 * Objectives store state
 */
export interface ObjectivesState {
  objectives: Array<{
    id: string
    status: ObjectiveStatus
    currentProgress?: number
    completedAt?: string // ISO date string
    subtasks?: Array<{
      id: string
      completed: boolean
    }>
  }>
  trackedObjectiveId: string | null
}

/**
 * Dialogs store state
 */
export interface DialogsState {
  completedTutorials: string[]
  dialogHistory: Array<{
    conversationId: string
    characterName: string
    transcript: Array<{
      speaker: 'player' | 'npc'
      speakerName: string
      message: string
      timestamp: string // ISO date string
    }>
    startedAt: string // ISO date string
    completedAt?: string // ISO date string
  }>
  interactedFeatures: string[]
}

/**
 * Resources store state
 */
export interface ResourcesState {
  resources: Resource[]
}

/**
 * World Map store state
 */
export interface WorldMapState {
  hexTiles: HexTile[]
}

/**
 * Area Maps store state
 */
export interface AreaMapsState {
  areas: Array<{
    coordinates: string // "q,r"
    features: Array<{
      id: string
      state: 'hidden' | 'locked' | 'unlocked'
    }>
  }>
}

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}
