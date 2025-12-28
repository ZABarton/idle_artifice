import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useObjectivesStore } from './objectives'
import { useResourcesStore } from './resources'
import { useWorldMapStore } from './worldMap'

describe('useObjectivesStore', () => {
  beforeEach(() => {
    // Create a fresh pinia instance for each test
    setActivePinia(createPinia())
  })

  describe('initial state', () => {
    it('should load objectives from config file', () => {
      const store = useObjectivesStore()
      expect(store.objectives.length).toBeGreaterThan(0)
    })

    it('should auto-track first unfinished main objective', () => {
      const store = useObjectivesStore()
      expect(store.trackedObjectiveId).toBe('talk-to-harbormaster')
      expect(store.getTrackedObjective?.category).toBe('main')
      expect(store.getTrackedObjective?.status).not.toBe('completed')
    })

    it('should have correct objective data structure', () => {
      const store = useObjectivesStore()
      const talkToHarbormaster = store.getObjectiveById('talk-to-harbormaster')

      expect(talkToHarbormaster).toBeDefined()
      expect(talkToHarbormaster?.title).toBe('Talk to the Harbormaster')
      expect(talkToHarbormaster?.status).toBe('active')
      expect(talkToHarbormaster?.category).toBe('main')
      expect(talkToHarbormaster?.order).toBe(1)
    })
  })

  describe('getObjectiveById', () => {
    it('should return objective by ID', () => {
      const store = useObjectivesStore()
      const objective = store.getObjectiveById('talk-to-harbormaster')
      expect(objective).toBeDefined()
      expect(objective?.id).toBe('talk-to-harbormaster')
    })

    it('should return undefined for non-existent objective', () => {
      const store = useObjectivesStore()
      const objective = store.getObjectiveById('nonexistent')
      expect(objective).toBeUndefined()
    })
  })

  describe('getTrackedObjective', () => {
    it('should return currently tracked objective', () => {
      const store = useObjectivesStore()
      const tracked = store.getTrackedObjective
      expect(tracked).toBeDefined()
      expect(tracked?.id).toBe(store.trackedObjectiveId)
    })

    it('should return null if no objective is tracked', () => {
      const store = useObjectivesStore()
      store.trackedObjectiveId = null
      expect(store.getTrackedObjective).toBeNull()
    })
  })

  describe('visibleObjectives', () => {
    it('should exclude hidden objectives', () => {
      const store = useObjectivesStore()
      const visible = store.visibleObjectives
      const hidden = visible.filter((obj) => obj.status === 'hidden')
      expect(hidden).toHaveLength(0)
    })

    it('should include active and completed objectives', () => {
      const store = useObjectivesStore()
      const visible = store.visibleObjectives
      expect(visible.length).toBeGreaterThan(0)
      visible.forEach((obj) => {
        expect(['active', 'completed']).toContain(obj.status)
      })
    })
  })

  describe('getObjectivesByStatus', () => {
    it('should filter objectives by status', () => {
      const store = useObjectivesStore()
      const active = store.getObjectivesByStatus('active')
      active.forEach((obj) => {
        expect(obj.status).toBe('active')
      })
    })

    it('should exclude hidden by default', () => {
      const store = useObjectivesStore()
      const hidden = store.getObjectivesByStatus('hidden')
      expect(hidden).toHaveLength(0)
    })

    it('should include hidden when explicitly requested', () => {
      const store = useObjectivesStore()
      const hidden = store.getObjectivesByStatus('hidden', true)
      expect(hidden.length).toBeGreaterThan(0)
    })
  })

  describe('getObjectivesByCategory', () => {
    it('should filter objectives by category', () => {
      const store = useObjectivesStore()
      const main = store.getObjectivesByCategory('main')
      main.forEach((obj) => {
        expect(obj.category).toBe('main')
      })
    })

    it('should exclude hidden objectives', () => {
      const store = useObjectivesStore()
      const main = store.getObjectivesByCategory('main')
      const hidden = main.filter((obj) => obj.status === 'hidden')
      expect(hidden).toHaveLength(0)
    })
  })

  describe('getOrderedObjectives', () => {
    it('should return main objectives before secondary', () => {
      const store = useObjectivesStore()
      const ordered = store.getOrderedObjectives

      // Find index of first secondary objective
      const firstSecondaryIndex = ordered.findIndex((obj) => obj.category === 'secondary')

      if (firstSecondaryIndex > -1) {
        // All objectives before this should be main
        for (let i = 0; i < firstSecondaryIndex; i++) {
          expect(ordered[i].category).toBe('main')
        }
      }
    })

    it('should sort by order within each category', () => {
      const store = useObjectivesStore()
      const ordered = store.getOrderedObjectives

      const main = ordered.filter((obj) => obj.category === 'main')
      const secondary = ordered.filter((obj) => obj.category === 'secondary')

      // Check main objectives are sorted
      for (let i = 1; i < main.length; i++) {
        expect(main[i].order).toBeGreaterThanOrEqual(main[i - 1].order)
      }

      // Check secondary objectives are sorted
      for (let i = 1; i < secondary.length; i++) {
        expect(secondary[i].order).toBeGreaterThanOrEqual(secondary[i - 1].order)
      }
    })
  })

  describe('setTrackedObjective', () => {
    it('should set tracked objective by ID', () => {
      const store = useObjectivesStore()
      // Use an active objective instead of hidden one
      const result = store.setTrackedObjective('talk-to-harbormaster')

      expect(result).toBe(true)
      expect(store.trackedObjectiveId).toBe('talk-to-harbormaster')
    })

    it('should return false for hidden objective', () => {
      const store = useObjectivesStore()
      const result = store.setTrackedObjective('explore-features')

      expect(result).toBe(false)
      expect(store.trackedObjectiveId).not.toBe('explore-features')
    })

    it('should return false for non-existent objective', () => {
      const store = useObjectivesStore()
      const initialTracked = store.trackedObjectiveId
      const result = store.setTrackedObjective('nonexistent')

      expect(result).toBe(false)
      expect(store.trackedObjectiveId).toBe(initialTracked)
    })
  })

  describe('updateProgress', () => {
    it('should update progress on objective', () => {
      const store = useObjectivesStore()
      const result = store.updateProgress('gather-wood', 25)

      expect(result).toBe(true)
      const objective = store.getObjectiveById('gather-wood')
      expect(objective?.currentProgress).toBe(25)
    })

    it('should not exceed max progress', () => {
      const store = useObjectivesStore()
      store.updateProgress('gather-wood', 100)

      const objective = store.getObjectiveById('gather-wood')
      expect(objective?.currentProgress).toBe(objective?.maxProgress)
    })

    it('should auto-complete when reaching max progress', () => {
      const store = useObjectivesStore()
      store.updateProgress('gather-wood', 50)

      const objective = store.getObjectiveById('gather-wood')
      expect(objective?.status).toBe('completed')
      expect(objective?.completedAt).toBeDefined()
    })

    it('should return false for objective without progress tracking', () => {
      const store = useObjectivesStore()
      const result = store.updateProgress('visit-academy', 10)
      expect(result).toBe(false)
    })

    it('should not allow negative progress', () => {
      const store = useObjectivesStore()
      store.updateProgress('gather-wood', -10)

      const objective = store.getObjectiveById('gather-wood')
      expect(objective?.currentProgress).toBe(0)
    })
  })

  describe('updateSubtask', () => {
    it('should update subtask completion status', () => {
      const store = useObjectivesStore()
      // First complete visit-academy to reveal explore-features
      store.completeObjective('visit-academy')

      const result = store.updateSubtask('explore-features', 'visit-foundry', true)

      expect(result).toBe(true)
      const objective = store.getObjectiveById('explore-features')
      const subtask = objective?.subtasks?.find((st) => st.id === 'visit-foundry')
      expect(subtask?.completed).toBe(true)
    })

    it('should auto-complete objective when all subtasks complete', () => {
      const store = useObjectivesStore()
      store.completeObjective('visit-academy')

      store.updateSubtask('explore-features', 'visit-foundry', true)
      store.updateSubtask('explore-features', 'visit-quartermaster', true)
      store.updateSubtask('explore-features', 'visit-tavern', true)

      const objective = store.getObjectiveById('explore-features')
      expect(objective?.status).toBe('completed')
    })

    it('should return false for objective without subtasks', () => {
      const store = useObjectivesStore()
      const result = store.updateSubtask('visit-academy', 'nonexistent', true)
      expect(result).toBe(false)
    })

    it('should return false for non-existent subtask', () => {
      const store = useObjectivesStore()
      store.completeObjective('visit-academy')
      const result = store.updateSubtask('explore-features', 'nonexistent', true)
      expect(result).toBe(false)
    })
  })

  describe('completeObjective', () => {
    it('should mark objective as completed', () => {
      const store = useObjectivesStore()
      const result = store.completeObjective('visit-academy')

      expect(result).toBe(true)
      const objective = store.getObjectiveById('visit-academy')
      expect(objective?.status).toBe('completed')
      expect(objective?.completedAt).toBeInstanceOf(Date)
    })

    it('should trigger discovery condition evaluation', () => {
      const store = useObjectivesStore()
      store.completeObjective('talk-to-harbormaster')

      // visit-academy should be revealed
      const objective = store.getObjectiveById('visit-academy')
      expect(objective?.status).toBe('active')
    })

    it('should return false for already completed objective', () => {
      const store = useObjectivesStore()
      store.completeObjective('talk-to-harbormaster')
      const result = store.completeObjective('talk-to-harbormaster')
      expect(result).toBe(false)
    })

    it('should return false for non-existent objective', () => {
      const store = useObjectivesStore()
      const result = store.completeObjective('nonexistent')
      expect(result).toBe(false)
    })
  })

  describe('checkDiscoveryCondition', () => {
    it('should check objective completion condition', () => {
      const store = useObjectivesStore()

      const condition = {
        type: 'objective' as const,
        id: 'visit-academy',
        description: 'Complete visit-academy',
      }

      expect(store.checkDiscoveryCondition(condition)).toBe(false)

      store.completeObjective('visit-academy')

      expect(store.checkDiscoveryCondition(condition)).toBe(true)
    })

    it('should check resource condition', () => {
      const store = useObjectivesStore()
      const resourcesStore = useResourcesStore()

      const condition = {
        type: 'resource' as const,
        id: 'wood',
        value: 100,
        description: 'Have 100 wood',
      }

      expect(store.checkDiscoveryCondition(condition)).toBe(false)

      resourcesStore.setResource('wood', 100)

      expect(store.checkDiscoveryCondition(condition)).toBe(true)
    })

    it('should check location condition', () => {
      const store = useObjectivesStore()
      const worldMapStore = useWorldMapStore()

      const condition = {
        type: 'location' as const,
        id: '1,0',
        description: 'Visit hex 1,0',
      }

      // Initially unexplored
      expect(store.checkDiscoveryCondition(condition)).toBe(false)

      // Explore the tile
      worldMapStore.exploreTile(1, 0)

      expect(store.checkDiscoveryCondition(condition)).toBe(true)
    })

    it('should return false for feature condition (stubbed)', () => {
      const store = useObjectivesStore()

      const condition = {
        type: 'feature' as const,
        id: 'foundry',
        description: 'Visit foundry',
      }

      expect(store.checkDiscoveryCondition(condition)).toBe(false)
    })

    it('should return false for custom condition (stubbed)', () => {
      const store = useObjectivesStore()

      const condition = {
        type: 'custom' as const,
        id: 'special',
        description: 'Custom condition',
      }

      expect(store.checkDiscoveryCondition(condition)).toBe(false)
    })
  })

  describe('evaluateDiscoveryConditions', () => {
    it('should reveal objectives when all conditions are met', () => {
      const store = useObjectivesStore()

      const visitAcademyObjective = store.getObjectiveById('visit-academy')
      expect(visitAcademyObjective?.status).toBe('hidden')

      store.completeObjective('talk-to-harbormaster')

      expect(visitAcademyObjective?.status).toBe('active')
    })

    it('should not reveal objectives if conditions are not met', () => {
      const store = useObjectivesStore()

      const gatherWoodObjective = store.getObjectiveById('gather-wood')
      expect(gatherWoodObjective?.status).toBe('hidden')

      // Only complete talk-to-harbormaster, not resource-creation
      store.completeObjective('talk-to-harbormaster')

      // Should still be hidden
      expect(gatherWoodObjective?.status).toBe('hidden')
    })

    it('should handle multiple discovery conditions (AND logic)', () => {
      const store = useObjectivesStore()

      // Complete objectives in sequence to reveal explore-features
      store.completeObjective('talk-to-harbormaster')
      store.objectives.find((o) => o.id === 'visit-academy')!.status = 'active'
      store.completeObjective('visit-academy')
      store.objectives.find((o) => o.id === 'talk-to-headmaster')!.status = 'active'
      store.completeObjective('talk-to-headmaster')

      // Complete explore-features to reveal resource-creation
      const exploreFeaturesObjective = store.getObjectiveById('explore-features')
      exploreFeaturesObjective!.status = 'active'
      store.completeObjective('explore-features')

      const resourceCreationObjective = store.getObjectiveById('resource-creation')
      expect(resourceCreationObjective?.status).toBe('active')

      // Complete resource-creation to reveal gather-wood
      store.completeObjective('resource-creation')

      const gatherWoodObjective = store.getObjectiveById('gather-wood')
      expect(gatherWoodObjective?.status).toBe('active')
    })
  })
})
