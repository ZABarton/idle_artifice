/**
 * Save Manager Composable
 *
 * Handles export and import of complete game state as JSON files.
 * Provides validation and error handling for save file operations.
 */

import type { SaveFile, GameState, ValidationResult } from '@/types/saveFile'
import { useObjectivesStore } from '@/stores/objectives'
import { useDialogsStore } from '@/stores/dialogs'
import { useResourcesStore } from '@/stores/resources'
import { useWorldMapStore } from '@/stores/worldMap'
import { useAreaMapStore } from '@/stores/areaMap'

// Game version from package.json
// In production, this would be injected via build process
const GAME_VERSION = '0.0.0'

/**
 * Composable for managing game save export/import
 */
export function useSaveManager() {
  /**
   * Export complete game state as JSON
   *
   * Collects state from all stores and generates a save file object
   * with metadata (version, timestamp).
   *
   * @returns Save file object ready for download
   */
  function exportGameState(): SaveFile {
    const objectivesStore = useObjectivesStore()
    const dialogsStore = useDialogsStore()
    const resourcesStore = useResourcesStore()
    const worldMapStore = useWorldMapStore()
    const areaMapStore = useAreaMapStore()

    // Collect state from all stores
    const gameState: GameState = {
      objectives: {
        objectives: objectivesStore.objectives.map((obj) => ({
          id: obj.id,
          status: obj.status,
          currentProgress: obj.currentProgress,
          completedAt: obj.completedAt?.toISOString(),
          subtasks: obj.subtasks?.map((st) => ({
            id: st.id,
            completed: st.completed,
          })),
        })),
        trackedObjectiveId: objectivesStore.trackedObjectiveId,
      },

      dialogs: {
        completedTutorials: Array.from(dialogsStore.completedTutorials),
        dialogHistory: dialogsStore.dialogHistory.map((record) => ({
          conversationId: record.conversationId,
          characterName: record.characterName,
          transcript: record.transcript.map((entry) => ({
            speaker: entry.speaker,
            speakerName: entry.speakerName,
            message: entry.message,
            timestamp: entry.timestamp.toISOString(),
          })),
          startedAt: record.startedAt.toISOString(),
          completedAt: record.completedAt?.toISOString(),
        })),
        interactedFeatures: Array.from(dialogsStore.interactedFeatures),
      },

      resources: {
        resources: resourcesStore.resources,
      },

      worldMap: {
        hexTiles: worldMapStore.hexTiles,
      },

      areaMaps: {
        areas: Array.from(areaMapStore.areas.entries()).map(([key, area]) => ({
          coordinates: key,
          features: area.features.map((f) => ({
            id: f.id,
            state: f.state,
          })),
        })),
      },
    }

    // Create save file with metadata
    const saveFile: SaveFile = {
      version: GAME_VERSION,
      timestamp: new Date().toISOString(),
      gameState,
    }

    return saveFile
  }

  /**
   * Validate save file structure and content
   *
   * Checks for required fields, valid types, and version compatibility.
   * Returns validation result with errors and warnings.
   *
   * @param data - Parsed JSON data to validate
   * @returns Validation result with errors and warnings
   */
  function validateSaveFile(data: unknown): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    // Type guard for basic structure
    if (typeof data !== 'object' || data === null) {
      errors.push('Save file is not a valid object')
      return { valid: false, errors, warnings }
    }

    const saveFile = data as Partial<SaveFile>

    // Check required top-level fields
    if (!saveFile.version) {
      errors.push('Missing version field')
    }
    if (!saveFile.timestamp) {
      errors.push('Missing timestamp field')
    }
    if (!saveFile.gameState) {
      errors.push('Missing gameState field')
      return { valid: false, errors, warnings }
    }

    // Version compatibility check
    if (saveFile.version && saveFile.version !== GAME_VERSION) {
      warnings.push(
        `Version mismatch: save file is ${saveFile.version}, game is ${GAME_VERSION}. Import may fail.`
      )
    }

    const gameState = saveFile.gameState as Partial<GameState>

    // Validate gameState has required stores
    const requiredStores = ['objectives', 'dialogs', 'resources', 'worldMap', 'areaMaps']
    for (const store of requiredStores) {
      if (!gameState[store as keyof GameState]) {
        errors.push(`Missing required store: ${store}`)
      }
    }

    // Validate objectives structure
    if (gameState.objectives) {
      if (!Array.isArray(gameState.objectives.objectives)) {
        errors.push('objectives.objectives must be an array')
      }
    }

    // Validate dialogs structure
    if (gameState.dialogs) {
      if (!Array.isArray(gameState.dialogs.completedTutorials)) {
        errors.push('dialogs.completedTutorials must be an array')
      }
      if (!Array.isArray(gameState.dialogs.dialogHistory)) {
        errors.push('dialogs.dialogHistory must be an array')
      }
      if (!Array.isArray(gameState.dialogs.interactedFeatures)) {
        errors.push('dialogs.interactedFeatures must be an array')
      }
    }

    // Validate resources structure
    if (gameState.resources) {
      if (!Array.isArray(gameState.resources.resources)) {
        errors.push('resources.resources must be an array')
      }
    }

    // Validate worldMap structure
    if (gameState.worldMap) {
      if (!Array.isArray(gameState.worldMap.hexTiles)) {
        errors.push('worldMap.hexTiles must be an array')
      }
    }

    // Validate areaMaps structure
    if (gameState.areaMaps) {
      if (!Array.isArray(gameState.areaMaps.areas)) {
        errors.push('areaMaps.areas must be an array')
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    }
  }

  /**
   * Import game state from save file
   *
   * Validates the save file, then applies state to all stores.
   * This will overwrite all current game progress.
   *
   * @param saveFile - Validated save file object
   * @throws Error if save file validation fails
   */
  function importGameState(saveFile: SaveFile): void {
    const objectivesStore = useObjectivesStore()
    const dialogsStore = useDialogsStore()
    const resourcesStore = useResourcesStore()
    const worldMapStore = useWorldMapStore()

    const { gameState } = saveFile

    // Clear existing localStorage before importing
    // This ensures we start fresh and the store watchers will save the imported state
    localStorage.removeItem('idle-artifice-objectives')
    localStorage.removeItem('idle-artifice-completed-tutorials')
    localStorage.removeItem('idle-artifice-dialog-history')
    localStorage.removeItem('idle-artifice-interacted-features')
    localStorage.removeItem('idle-artifice-resources')
    localStorage.removeItem('idle-artifice-hex-tiles')
    localStorage.removeItem('idle-artifice-area-maps')

    // Apply objectives state
    objectivesStore.objectives = gameState.objectives.objectives.map((obj) => ({
      ...obj,
      completedAt: obj.completedAt ? new Date(obj.completedAt) : undefined,
    })) as any // Type assertion needed due to config merging in store

    objectivesStore.trackedObjectiveId = gameState.objectives.trackedObjectiveId

    // Apply dialogs state
    dialogsStore.completedTutorials = new Set(gameState.dialogs.completedTutorials)

    dialogsStore.dialogHistory = gameState.dialogs.dialogHistory.map((record) => ({
      ...record,
      startedAt: new Date(record.startedAt),
      completedAt: record.completedAt ? new Date(record.completedAt) : undefined,
      transcript: record.transcript.map((entry) => ({
        ...entry,
        timestamp: new Date(entry.timestamp),
      })),
    }))

    dialogsStore.interactedFeatures = new Set(gameState.dialogs.interactedFeatures)

    // Apply resources state
    resourcesStore.resources = gameState.resources.resources

    // Apply world map state
    worldMapStore.hexTiles = gameState.worldMap.hexTiles

    // Apply area maps state directly to localStorage
    // The store will load this data on next initialization
    const areaMapsData = {
      areas: gameState.areaMaps.areas,
    }
    localStorage.setItem('idle-artifice-area-maps', JSON.stringify(areaMapsData))

    // Note: We don't directly manipulate areaMapStore.areas here because:
    // 1. Areas need their configs to be fully initialized
    // 2. The store will properly merge saved state with configs on page reload
    // 3. Writing to localStorage is sufficient - the store loads from there on init
  }

  /**
   * Download save file as JSON
   *
   * Creates a Blob from the save file and triggers browser download.
   *
   * @param saveFile - Save file to download
   * @param filename - Optional custom filename (defaults to timestamped name)
   */
  function downloadSaveFile(saveFile: SaveFile, filename?: string): void {
    // Generate filename if not provided
    const defaultFilename = `idle-artifice-save-${new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)}.json`
    const finalFilename = filename || defaultFilename

    // Convert to pretty-printed JSON
    const jsonString = JSON.stringify(saveFile, null, 2)

    // Create blob and download
    const blob = new Blob([jsonString], { type: 'application/json' })
    const url = URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.href = url
    link.download = finalFilename
    link.click()

    // Clean up
    URL.revokeObjectURL(url)
  }

  /**
   * Parse uploaded save file
   *
   * Reads file content and parses JSON.
   *
   * @param file - File object from file input
   * @returns Promise resolving to parsed JSON data
   */
  async function parseSaveFile(file: File): Promise<unknown> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()

      reader.onload = (event) => {
        try {
          const text = event.target?.result as string
          const data = JSON.parse(text)
          resolve(data)
        } catch (error) {
          reject(new Error('Invalid JSON format'))
        }
      }

      reader.onerror = () => {
        reject(new Error('Failed to read file'))
      }

      reader.readAsText(file)
    })
  }

  return {
    exportGameState,
    validateSaveFile,
    importGameState,
    downloadSaveFile,
    parseSaveFile,
  }
}
