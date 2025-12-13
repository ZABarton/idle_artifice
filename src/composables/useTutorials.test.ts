import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useTutorials } from './useTutorials'
import { useDialogsStore } from '@/stores/dialogs'
import { useWorldMapStore } from '@/stores/worldMap'
import type { TutorialModal, TutorialTriggerCondition } from '@/types/dialogs'

describe('useTutorials', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear()
    setActivePinia(createPinia())
  })

  describe('isConditionMet', () => {
    it('should return true for immediate triggers', () => {
      const { isConditionMet } = useTutorials()
      const condition: TutorialTriggerCondition = {
        type: 'immediate',
        description: 'Test immediate',
      }
      expect(isConditionMet(condition)).toBe(true)
    })

    it('should check location exploration status', () => {
      const { isConditionMet } = useTutorials()
      const worldMapStore = useWorldMapStore()

      // Add a test tile
      worldMapStore.addTile({
        q: 1,
        r: 1,
        explorationStatus: 'explored',
      })

      const condition: TutorialTriggerCondition = {
        type: 'location',
        id: '1,1',
        description: 'Test location',
      }

      expect(isConditionMet(condition)).toBe(true)
    })

    it('should return false for unexplored locations', () => {
      const { isConditionMet } = useTutorials()
      const worldMapStore = useWorldMapStore()

      worldMapStore.addTile({
        q: 2,
        r: 2,
        explorationStatus: 'unexplored',
      })

      const condition: TutorialTriggerCondition = {
        type: 'location',
        id: '2,2',
        description: 'Test unexplored location',
      }

      expect(isConditionMet(condition)).toBe(false)
    })

    it('should check feature interaction status', () => {
      const { isConditionMet } = useTutorials()
      const dialogsStore = useDialogsStore()

      dialogsStore.markFeatureInteracted('foundry')

      const condition: TutorialTriggerCondition = {
        type: 'feature',
        id: 'foundry',
        description: 'Test feature',
      }

      expect(isConditionMet(condition)).toBe(true)
    })

    it('should return false for non-interacted features', () => {
      const { isConditionMet } = useTutorials()

      const condition: TutorialTriggerCondition = {
        type: 'feature',
        id: 'workshop',
        description: 'Test non-interacted feature',
      }

      expect(isConditionMet(condition)).toBe(false)
    })
  })

  describe('areAllConditionsMet', () => {
    it('should return true when all conditions are met', () => {
      const { areAllConditionsMet } = useTutorials()
      const dialogsStore = useDialogsStore()

      dialogsStore.markFeatureInteracted('foundry')

      const conditions: TutorialTriggerCondition[] = [
        { type: 'immediate', description: 'Always true' },
        { type: 'feature', id: 'foundry', description: 'Foundry interacted' },
      ]

      expect(areAllConditionsMet(conditions)).toBe(true)
    })

    it('should return false when any condition is not met', () => {
      const { areAllConditionsMet } = useTutorials()
      const dialogsStore = useDialogsStore()

      dialogsStore.markFeatureInteracted('foundry')

      const conditions: TutorialTriggerCondition[] = [
        { type: 'immediate', description: 'Always true' },
        { type: 'feature', id: 'workshop', description: 'Workshop not interacted' },
      ]

      expect(areAllConditionsMet(conditions)).toBe(false)
    })

    it('should return false when no conditions provided', () => {
      const { areAllConditionsMet } = useTutorials()
      expect(areAllConditionsMet([])).toBe(false)
    })
  })

  describe('triggerTutorials', () => {
    it('should trigger tutorials with matching trigger type', () => {
      const { triggerTutorials } = useTutorials()
      const dialogsStore = useDialogsStore()

      // Mock a tutorial
      const mockTutorial: TutorialModal = {
        id: 'test-tutorial',
        title: 'Test Tutorial',
        content: 'Test content',
        triggerConditions: [{ type: 'immediate', description: 'Test' }],
        showOnce: true,
      }

      dialogsStore.loadedTutorials.set('test-tutorial', mockTutorial)

      // Spy on showTutorial
      const showTutorialSpy = vi.spyOn(dialogsStore, 'showTutorial')

      triggerTutorials('immediate')

      expect(showTutorialSpy).toHaveBeenCalledWith('test-tutorial')
    })

    it('should not trigger tutorials already seen when showOnce is true', () => {
      const { triggerTutorials } = useTutorials()
      const dialogsStore = useDialogsStore()

      const mockTutorial: TutorialModal = {
        id: 'seen-tutorial',
        title: 'Seen Tutorial',
        content: 'Already seen',
        triggerConditions: [{ type: 'immediate', description: 'Test' }],
        showOnce: true,
      }

      dialogsStore.loadedTutorials.set('seen-tutorial', mockTutorial)
      dialogsStore.markTutorialCompleted('seen-tutorial')

      const showTutorialSpy = vi.spyOn(dialogsStore, 'showTutorial')

      triggerTutorials('immediate')

      expect(showTutorialSpy).not.toHaveBeenCalled()
    })

    it('should trigger tutorials with matching feature ID', () => {
      const { triggerTutorials } = useTutorials()
      const dialogsStore = useDialogsStore()

      dialogsStore.markFeatureInteracted('foundry')

      const mockTutorial: TutorialModal = {
        id: 'foundry-tutorial',
        title: 'Foundry Tutorial',
        content: 'Foundry content',
        triggerConditions: [{ type: 'feature', id: 'foundry', description: 'Foundry' }],
        showOnce: true,
      }

      dialogsStore.loadedTutorials.set('foundry-tutorial', mockTutorial)

      const showTutorialSpy = vi.spyOn(dialogsStore, 'showTutorial')

      triggerTutorials('feature', 'foundry')

      expect(showTutorialSpy).toHaveBeenCalledWith('foundry-tutorial')
    })

    it('should not trigger tutorials with non-matching feature ID', () => {
      const { triggerTutorials } = useTutorials()
      const dialogsStore = useDialogsStore()

      dialogsStore.markFeatureInteracted('workshop')

      const mockTutorial: TutorialModal = {
        id: 'foundry-tutorial',
        title: 'Foundry Tutorial',
        content: 'Foundry content',
        triggerConditions: [{ type: 'feature', id: 'foundry', description: 'Foundry' }],
        showOnce: true,
      }

      dialogsStore.loadedTutorials.set('foundry-tutorial', mockTutorial)

      const showTutorialSpy = vi.spyOn(dialogsStore, 'showTutorial')

      triggerTutorials('feature', 'workshop')

      expect(showTutorialSpy).not.toHaveBeenCalled()
    })
  })

  describe('triggerFeatureTutorial', () => {
    it('should mark feature as interacted and trigger tutorials', () => {
      const dialogsStore = useDialogsStore()
      const { triggerFeatureTutorial } = useTutorials()

      const mockTutorial: TutorialModal = {
        id: 'foundry-tutorial',
        title: 'Foundry Tutorial',
        content: 'Foundry content',
        triggerConditions: [{ type: 'feature', id: 'foundry', description: 'Foundry' }],
        showOnce: true,
      }

      dialogsStore.loadedTutorials.set('foundry-tutorial', mockTutorial)

      expect(dialogsStore.hasInteractedWithFeature('foundry')).toBe(false)

      triggerFeatureTutorial('foundry')

      expect(dialogsStore.hasInteractedWithFeature('foundry')).toBe(true)
      expect(dialogsStore.modalQueue.length).toBe(1)
    })

    it('should not mark feature twice if already interacted', () => {
      const dialogsStore = useDialogsStore()
      const { triggerFeatureTutorial } = useTutorials()

      dialogsStore.markFeatureInteracted('foundry')

      const countBefore = dialogsStore.interactedFeatures.size

      triggerFeatureTutorial('foundry')

      expect(dialogsStore.interactedFeatures.size).toBe(countBefore)
    })
  })

  describe('triggerImmediateTutorials', () => {
    it('should trigger all immediate tutorials', () => {
      const { triggerImmediateTutorials } = useTutorials()
      const dialogsStore = useDialogsStore()

      const mockTutorial: TutorialModal = {
        id: 'welcome',
        title: 'Welcome',
        content: 'Welcome to the game',
        triggerConditions: [{ type: 'immediate', description: 'First load' }],
        showOnce: true,
      }

      dialogsStore.loadedTutorials.set('welcome', mockTutorial)

      const showTutorialSpy = vi.spyOn(dialogsStore, 'showTutorial')

      triggerImmediateTutorials()

      expect(showTutorialSpy).toHaveBeenCalledWith('welcome')
    })
  })
})
