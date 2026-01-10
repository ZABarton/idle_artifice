/**
 * Tests for useSaveManager composable
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useSaveManager } from './useSaveManager'
import { useObjectivesStore } from '@/stores/objectives'
import { useDialogsStore } from '@/stores/dialogs'
import { useResourcesStore } from '@/stores/resources'
import { useWorldMapStore } from '@/stores/worldMap'

describe('useSaveManager', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  afterEach(() => {
    localStorage.clear()
  })

  describe('exportGameState', () => {
    it('exports complete game state with metadata', () => {
      const saveManager = useSaveManager()
      const saveFile = saveManager.exportGameState()

      expect(saveFile.version).toBeDefined()
      expect(saveFile.timestamp).toBeDefined()
      expect(saveFile.gameState).toBeDefined()
      expect(saveFile.gameState.objectives).toBeDefined()
      expect(saveFile.gameState.dialogs).toBeDefined()
      expect(saveFile.gameState.resources).toBeDefined()
      expect(saveFile.gameState.worldMap).toBeDefined()
      expect(saveFile.gameState.areaMaps).toBeDefined()
    })

    it('includes objectives state', () => {
      const objectivesStore = useObjectivesStore()
      const saveManager = useSaveManager()

      // Complete an objective
      objectivesStore.completeObjective('talk-to-harbormaster')

      const saveFile = saveManager.exportGameState()

      expect(saveFile.gameState.objectives.objectives).toBeInstanceOf(Array)
      expect(saveFile.gameState.objectives.objectives.length).toBeGreaterThan(0)

      // Check completed objective
      const completedObjective = saveFile.gameState.objectives.objectives.find(
        (obj) => obj.id === 'talk-to-harbormaster'
      )
      expect(completedObjective?.status).toBe('completed')
      expect(completedObjective?.completedAt).toBeDefined()
    })

    it('includes dialogs state', () => {
      const dialogsStore = useDialogsStore()
      const saveManager = useSaveManager()

      // Mark tutorial as completed
      dialogsStore.markTutorialCompleted('test-tutorial')

      // Mark feature as interacted
      dialogsStore.markFeatureInteracted('test-feature')

      const saveFile = saveManager.exportGameState()

      expect(saveFile.gameState.dialogs.completedTutorials).toContain('test-tutorial')
      expect(saveFile.gameState.dialogs.interactedFeatures).toContain('test-feature')
      expect(saveFile.gameState.dialogs.dialogHistory).toBeInstanceOf(Array)
    })

    it('includes resources state', () => {
      const resourcesStore = useResourcesStore()
      const saveManager = useSaveManager()

      // Modify resources
      resourcesStore.addResource('wood', 100)

      const saveFile = saveManager.exportGameState()

      expect(saveFile.gameState.resources.resources).toBeInstanceOf(Array)
      const wood = saveFile.gameState.resources.resources.find((r) => r.id === 'wood')
      expect(wood?.amount).toBe(150) // 50 initial + 100 added
    })

    it('includes world map state', () => {
      const worldMapStore = useWorldMapStore()
      const saveManager = useSaveManager()

      // Explore a tile
      worldMapStore.exploreTile(0, 0)

      const saveFile = saveManager.exportGameState()

      expect(saveFile.gameState.worldMap.hexTiles).toBeInstanceOf(Array)
      const academyTile = saveFile.gameState.worldMap.hexTiles.find(
        (t) => t.q === 0 && t.r === 0
      )
      expect(academyTile?.explorationStatus).toBe('explored')
    })

    it('timestamps are valid ISO strings', () => {
      const saveManager = useSaveManager()
      const saveFile = saveManager.exportGameState()

      // Check timestamp is valid ISO string
      const timestamp = new Date(saveFile.timestamp)
      expect(timestamp.toISOString()).toBe(saveFile.timestamp)
      expect(timestamp.getTime()).toBeLessThanOrEqual(Date.now())
    })
  })

  describe('validateSaveFile', () => {
    it('accepts valid save file', () => {
      const saveManager = useSaveManager()
      const validSaveFile = saveManager.exportGameState()

      const validation = saveManager.validateSaveFile(validSaveFile)

      expect(validation.valid).toBe(true)
      expect(validation.errors).toHaveLength(0)
    })

    it('rejects non-object input', () => {
      const saveManager = useSaveManager()

      const validation = saveManager.validateSaveFile('not an object')

      expect(validation.valid).toBe(false)
      expect(validation.errors).toContain('Save file is not a valid object')
    })

    it('rejects save file missing version', () => {
      const saveManager = useSaveManager()
      const invalidSave = {
        timestamp: new Date().toISOString(),
        gameState: {} as any,
      }

      const validation = saveManager.validateSaveFile(invalidSave)

      expect(validation.valid).toBe(false)
      expect(validation.errors).toContain('Missing version field')
    })

    it('rejects save file missing timestamp', () => {
      const saveManager = useSaveManager()
      const invalidSave = {
        version: '0.0.0',
        gameState: {} as any,
      }

      const validation = saveManager.validateSaveFile(invalidSave)

      expect(validation.valid).toBe(false)
      expect(validation.errors).toContain('Missing timestamp field')
    })

    it('rejects save file missing gameState', () => {
      const saveManager = useSaveManager()
      const invalidSave = {
        version: '0.0.0',
        timestamp: new Date().toISOString(),
      }

      const validation = saveManager.validateSaveFile(invalidSave)

      expect(validation.valid).toBe(false)
      expect(validation.errors).toContain('Missing gameState field')
    })

    it('rejects save file missing required stores', () => {
      const saveManager = useSaveManager()
      const invalidSave = {
        version: '0.0.0',
        timestamp: new Date().toISOString(),
        gameState: {
          objectives: {},
          // Missing other stores
        },
      }

      const validation = saveManager.validateSaveFile(invalidSave)

      expect(validation.valid).toBe(false)
      expect(validation.errors.length).toBeGreaterThan(0)
      expect(validation.errors.some((e) => e.includes('Missing required store'))).toBe(true)
    })

    it('warns on version mismatch', () => {
      const saveManager = useSaveManager()
      const validSaveFile = saveManager.exportGameState()
      validSaveFile.version = '999.999.999'

      const validation = saveManager.validateSaveFile(validSaveFile)

      expect(validation.warnings.length).toBeGreaterThan(0)
      expect(validation.warnings[0]).toContain('Version mismatch')
    })

    it('validates objectives structure', () => {
      const saveManager = useSaveManager()
      const invalidSave = saveManager.exportGameState()
      invalidSave.gameState.objectives.objectives = 'not an array' as any

      const validation = saveManager.validateSaveFile(invalidSave)

      expect(validation.valid).toBe(false)
      expect(validation.errors).toContain('objectives.objectives must be an array')
    })

    it('validates dialogs structure', () => {
      const saveManager = useSaveManager()
      const invalidSave = saveManager.exportGameState()
      invalidSave.gameState.dialogs.completedTutorials = 'not an array' as any

      const validation = saveManager.validateSaveFile(invalidSave)

      expect(validation.valid).toBe(false)
      expect(validation.errors).toContain('dialogs.completedTutorials must be an array')
    })
  })

  describe('importGameState', () => {
    it('restores objectives state', () => {
      const objectivesStore = useObjectivesStore()
      const saveManager = useSaveManager()

      // Complete an objective and export
      objectivesStore.completeObjective('talk-to-harbormaster')
      const saveFile = saveManager.exportGameState()

      // Reset store
      objectivesStore.resetObjectives()
      expect(objectivesStore.getObjectiveById('talk-to-harbormaster')?.status).not.toBe('completed')

      // Import
      saveManager.importGameState(saveFile)

      // Verify restored
      expect(objectivesStore.getObjectiveById('talk-to-harbormaster')?.status).toBe('completed')
    })

    it('restores dialogs state', () => {
      const dialogsStore = useDialogsStore()
      const saveManager = useSaveManager()

      // Mark tutorial and feature
      dialogsStore.markTutorialCompleted('test-tutorial')
      dialogsStore.markFeatureInteracted('test-feature')
      const saveFile = saveManager.exportGameState()

      // Reset
      dialogsStore.completedTutorials.clear()
      dialogsStore.interactedFeatures.clear()

      // Import
      saveManager.importGameState(saveFile)

      // Verify restored
      expect(dialogsStore.hasSeenTutorial('test-tutorial')).toBe(true)
      expect(dialogsStore.hasInteractedWithFeature('test-feature')).toBe(true)
    })

    it('restores resources state', () => {
      const resourcesStore = useResourcesStore()
      const saveManager = useSaveManager()

      // Modify resources
      resourcesStore.addResource('wood', 200)
      const saveFile = saveManager.exportGameState()

      // Reset
      resourcesStore.resetResources()
      expect(resourcesStore.getResourceAmount('wood')).toBe(50) // Default amount

      // Import
      saveManager.importGameState(saveFile)

      // Verify restored
      expect(resourcesStore.getResourceAmount('wood')).toBe(250) // 50 + 200
    })

    it('restores world map state', () => {
      const worldMapStore = useWorldMapStore()
      const saveManager = useSaveManager()

      // Explore a tile
      worldMapStore.exploreTile(0, 0)
      const saveFile = saveManager.exportGameState()

      // Reset
      worldMapStore.resetMap()
      expect(worldMapStore.getTileAt(0, 0)?.explorationStatus).toBe('unexplored')

      // Import
      saveManager.importGameState(saveFile)

      // Verify restored
      expect(worldMapStore.getTileAt(0, 0)?.explorationStatus).toBe('explored')
    })

    it('clears localStorage before importing', () => {
      const saveManager = useSaveManager()

      // Set some localStorage data
      localStorage.setItem('idle-artifice-objectives', 'old data')
      localStorage.setItem('idle-artifice-resources', 'old data')

      const saveFile = saveManager.exportGameState()
      saveManager.importGameState(saveFile)

      // Verify localStorage was updated (not the old data)
      const stored = localStorage.getItem('idle-artifice-objectives')
      expect(stored).not.toBe('old data')
    })
  })

  describe('downloadSaveFile', () => {
    it('creates a valid JSON file', () => {
      const saveManager = useSaveManager()
      const saveFile = saveManager.exportGameState()

      // Mock URL.createObjectURL and document.createElement
      const mockUrl = 'blob:mock-url'
      const mockLink = {
        href: '',
        download: '',
        click: vi.fn(),
      }

      vi.spyOn(URL, 'createObjectURL').mockReturnValue(mockUrl)
      vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
      vi.spyOn(document, 'createElement').mockReturnValue(mockLink as any)

      saveManager.downloadSaveFile(saveFile)

      expect(URL.createObjectURL).toHaveBeenCalled()
      expect(mockLink.href).toBe(mockUrl)
      expect(mockLink.download).toContain('idle-artifice-save')
      expect(mockLink.download).toContain('.json')
      expect(mockLink.click).toHaveBeenCalled()
      expect(URL.revokeObjectURL).toHaveBeenCalledWith(mockUrl)
    })

    it('uses custom filename if provided', () => {
      const saveManager = useSaveManager()
      const saveFile = saveManager.exportGameState()

      const mockLink = {
        href: '',
        download: '',
        click: vi.fn(),
      }

      vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock')
      vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
      vi.spyOn(document, 'createElement').mockReturnValue(mockLink as any)

      saveManager.downloadSaveFile(saveFile, 'custom-save.json')

      expect(mockLink.download).toBe('custom-save.json')
    })
  })

  describe('parseSaveFile', () => {
    it('parses valid JSON file', async () => {
      const saveManager = useSaveManager()
      const mockData = { test: 'data' }
      const blob = new Blob([JSON.stringify(mockData)], { type: 'application/json' })
      const file = new File([blob], 'test.json', { type: 'application/json' })

      const result = await saveManager.parseSaveFile(file)

      expect(result).toEqual(mockData)
    })

    it('rejects invalid JSON', async () => {
      const saveManager = useSaveManager()
      const blob = new Blob(['invalid json{'], { type: 'application/json' })
      const file = new File([blob], 'test.json', { type: 'application/json' })

      await expect(saveManager.parseSaveFile(file)).rejects.toThrow('Invalid JSON format')
    })
  })

  describe('full export/import cycle', () => {
    it('preserves all game state through export and import', () => {
      const objectivesStore = useObjectivesStore()
      const dialogsStore = useDialogsStore()
      const resourcesStore = useResourcesStore()
      const worldMapStore = useWorldMapStore()
      const saveManager = useSaveManager()

      // Modify various stores
      objectivesStore.completeObjective('talk-to-harbormaster')
      dialogsStore.markTutorialCompleted('test-tutorial')
      resourcesStore.addResource('wood', 100)
      worldMapStore.exploreTile(0, 0)

      // Export
      const saveFile = saveManager.exportGameState()

      // Verify it's a valid save file
      const validation = saveManager.validateSaveFile(saveFile)
      expect(validation.valid).toBe(true)

      // Reset everything
      objectivesStore.resetObjectives()
      dialogsStore.completedTutorials.clear()
      resourcesStore.resetResources()
      worldMapStore.resetMap()

      // Import
      saveManager.importGameState(saveFile)

      // Verify everything was restored
      expect(objectivesStore.getObjectiveById('talk-to-harbormaster')?.status).toBe('completed')
      expect(dialogsStore.hasSeenTutorial('test-tutorial')).toBe(true)
      expect(resourcesStore.getResourceAmount('wood')).toBe(150) // 50 default + 100
      expect(worldMapStore.getTileAt(0, 0)?.explorationStatus).toBe('explored')
    })
  })
})
