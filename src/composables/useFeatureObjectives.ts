import { computed } from 'vue'
import { useObjectivesStore } from '@/stores/objectives'
import type { Objective, ObjectiveSubtask } from '@/types/objectives'

/**
 * Composable for checking if features are part of active objectives
 * Used to display quest badges on features that are referenced in objectives
 */
export function useFeatureObjectives() {
  const objectivesStore = useObjectivesStore()

  /**
   * Check if a feature is part of any active objectives
   * @param featureId - The feature ID to check (e.g., "academy-foundry")
   * @returns true if the feature is referenced in any active objective subtasks
   */
  const isFeatureInActiveObjective = computed(() => (featureId: string): boolean => {
    // Get all active (non-completed, non-hidden) objectives
    const activeObjectives = objectivesStore.visibleObjectives.filter(
      (obj) => obj.status === 'active'
    )

    // Check if any active objective has a subtask with this featureId
    return activeObjectives.some((objective) => {
      if (!objective.subtasks) return false

      return objective.subtasks.some(
        (subtask) => subtask.featureId === featureId && !subtask.completed
      )
    })
  })

  /**
   * Get all active objectives that reference a specific feature
   * @param featureId - The feature ID to check
   * @returns Array of objectives that have subtasks referencing this feature
   */
  const getObjectivesForFeature = computed(() => (featureId: string): Objective[] => {
    const activeObjectives = objectivesStore.visibleObjectives.filter(
      (obj) => obj.status === 'active'
    )

    return activeObjectives.filter((objective) => {
      if (!objective.subtasks) return false

      return objective.subtasks.some(
        (subtask) => subtask.featureId === featureId && !subtask.completed
      )
    })
  })

  /**
   * Get the specific subtask associated with a feature
   * @param featureId - The feature ID to check
   * @returns The subtask object if found, or null
   */
  const getSubtaskForFeature = computed(
    () =>
      (featureId: string): { objective: Objective; subtask: ObjectiveSubtask } | null => {
        const activeObjectives = objectivesStore.visibleObjectives.filter(
          (obj) => obj.status === 'active'
        )

        for (const objective of activeObjectives) {
          if (!objective.subtasks) continue

          const subtask = objective.subtasks.find(
            (st) => st.featureId === featureId && !st.completed
          )

          if (subtask) {
            return { objective, subtask }
          }
        }

        return null
      }
  )

  /**
   * Complete a subtask associated with a feature
   * @param featureId - The feature ID
   * @returns true if a subtask was found and completed
   */
  function completeFeatureSubtask(featureId: string): boolean {
    const result = getSubtaskForFeature.value(featureId)

    if (!result) return false

    return objectivesStore.updateSubtask(result.objective.id, result.subtask.id, true)
  }

  return {
    isFeatureInActiveObjective,
    getObjectivesForFeature,
    getSubtaskForFeature,
    completeFeatureSubtask,
  }
}
