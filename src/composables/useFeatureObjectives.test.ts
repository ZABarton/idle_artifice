import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useFeatureObjectives } from './useFeatureObjectives'
import { useObjectivesStore } from '@/stores/objectives'

describe('useFeatureObjectives', () => {
  beforeEach(() => {
    // Clear localStorage to avoid state persistence between tests
    localStorage.clear()
    setActivePinia(createPinia())
  })

  describe('isFeatureInActiveObjective', () => {
    it('returns true when feature is in an active objective subtask', () => {
      const objectivesStore = useObjectivesStore()
      const { isFeatureInActiveObjective } = useFeatureObjectives()

      // Load default objectives from config
      objectivesStore.loadObjectivesFromConfig()

      // Complete prerequisites to unlock "explore-features"
      objectivesStore.completeObjective('talk-to-harbormaster')
      objectivesStore.completeObjective('visit-academy')
      objectivesStore.completeObjective('talk-to-headmaster')

      // Check if foundry feature is in active objectives
      expect(isFeatureInActiveObjective.value('academy-foundry')).toBe(true)
      expect(isFeatureInActiveObjective.value('academy-quartermaster')).toBe(true)
      expect(isFeatureInActiveObjective.value('academy-tavern')).toBe(true)
    })

    it('returns false when feature is not in any active objective', () => {
      const objectivesStore = useObjectivesStore()
      const { isFeatureInActiveObjective } = useFeatureObjectives()

      objectivesStore.loadObjectivesFromConfig()

      // Check a feature that doesn't exist in objectives
      expect(isFeatureInActiveObjective.value('nonexistent-feature')).toBe(false)
    })

    it('returns false when subtask is already completed', () => {
      const objectivesStore = useObjectivesStore()
      const { isFeatureInActiveObjective } = useFeatureObjectives()

      objectivesStore.loadObjectivesFromConfig()

      // Complete prerequisites to unlock "explore-features"
      objectivesStore.completeObjective('talk-to-harbormaster')
      objectivesStore.completeObjective('visit-academy')
      objectivesStore.completeObjective('talk-to-headmaster')

      // Complete the foundry subtask
      objectivesStore.updateSubtask('explore-features', 'visit-foundry', true)

      // Should return false now since subtask is completed
      expect(isFeatureInActiveObjective.value('academy-foundry')).toBe(false)

      // Other subtasks should still be active
      expect(isFeatureInActiveObjective.value('academy-quartermaster')).toBe(true)
    })

    it('returns false when objective is not active', () => {
      const objectivesStore = useObjectivesStore()
      const { isFeatureInActiveObjective } = useFeatureObjectives()

      objectivesStore.loadObjectivesFromConfig()

      // explore-features should be hidden by default
      expect(isFeatureInActiveObjective.value('academy-foundry')).toBe(false)
    })
  })

  describe('completeFeatureSubtask', () => {
    it('returns false when no subtask is associated with feature', () => {
      const objectivesStore = useObjectivesStore()
      const { completeFeatureSubtask } = useFeatureObjectives()

      objectivesStore.loadObjectivesFromConfig()

      const result = completeFeatureSubtask('nonexistent-feature')

      expect(result).toBe(false)
    })

    it('returns false when subtask is already completed', () => {
      const objectivesStore = useObjectivesStore()
      const { completeFeatureSubtask } = useFeatureObjectives()

      objectivesStore.loadObjectivesFromConfig()

      // Complete prerequisites to unlock "explore-features"
      objectivesStore.completeObjective('talk-to-harbormaster')
      objectivesStore.completeObjective('visit-academy')
      objectivesStore.completeObjective('talk-to-headmaster')

      // Complete once
      completeFeatureSubtask('academy-foundry')

      // Try to complete again
      const result = completeFeatureSubtask('academy-foundry')

      expect(result).toBe(false)
    })
  })
})
