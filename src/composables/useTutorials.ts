import { useDialogsStore } from '@/stores/dialogs'
import { useResourcesStore } from '@/stores/resources'
import { useWorldMapStore } from '@/stores/worldMap'
import { useObjectivesStore } from '@/stores/objectives'
import type { TutorialTriggerCondition, TutorialTriggerType } from '@/types/dialogs'

/**
 * Composable for managing tutorial triggers and evaluation
 */
export function useTutorials() {
  const dialogsStore = useDialogsStore()
  const resourcesStore = useResourcesStore()
  const worldMapStore = useWorldMapStore()
  const objectivesStore = useObjectivesStore()

  /**
   * Check if a specific trigger condition is currently met
   */
  function isConditionMet(condition: TutorialTriggerCondition, context?: unknown): boolean {
    switch (condition.type) {
      case 'immediate':
        // Immediate triggers are always met (controlled by caller)
        return true

      case 'location': {
        if (!condition.id) return false
        // condition.id should be in format "q,r" (e.g., "0,0")
        const [q, r] = condition.id.split(',').map(Number)
        const tile = worldMapStore.getTileAt(q, r)
        return tile?.explorationStatus === 'explored'
      }

      case 'feature': {
        if (!condition.id) return false
        // Check if feature has been interacted with
        return dialogsStore.hasInteractedWithFeature(condition.id)
      }

      case 'objective': {
        if (!condition.id) return false
        // Check if objective is completed
        const objective = objectivesStore.getObjectiveById(condition.id)
        return objective?.status === 'completed'
      }

      case 'resource': {
        if (!condition.id) return false
        const threshold = condition.value || 0
        return resourcesStore.hasResource(condition.id, threshold)
      }

      case 'custom': {
        // Custom conditions handled by context
        // Context should provide a function to evaluate custom conditions
        if (
          context &&
          typeof context === 'object' &&
          'evaluateCustom' in context &&
          typeof context.evaluateCustom === 'function'
        ) {
          return context.evaluateCustom(condition)
        }
        return false
      }

      default:
        return false
    }
  }

  /**
   * Check all trigger conditions for a tutorial
   * All conditions must be met for tutorial to trigger
   */
  function areAllConditionsMet(conditions: TutorialTriggerCondition[], context?: unknown): boolean {
    if (!conditions || conditions.length === 0) {
      return false
    }

    return conditions.every((condition) => isConditionMet(condition, context))
  }

  /**
   * Trigger tutorials matching specific criteria
   * Evaluates all loaded tutorials and shows those whose conditions are met
   *
   * @param triggerType - Type of trigger to check (immediate, location, feature, etc.)
   * @param triggerId - Optional ID for the trigger (feature ID, location coords, etc.)
   * @param context - Optional context for custom condition evaluation
   */
  function triggerTutorials(
    triggerType: TutorialTriggerType,
    triggerId?: string,
    context?: unknown
  ): void {
    // Get all loaded tutorials
    const tutorials = Array.from(dialogsStore.loadedTutorials.values())

    // Find tutorials with matching trigger conditions
    for (const tutorial of tutorials) {
      // Skip if already seen and should only show once
      if (tutorial.showOnce && dialogsStore.hasSeenTutorial(tutorial.id)) {
        continue
      }

      // Check if tutorial has matching trigger conditions
      const hasMatchingTrigger = tutorial.triggerConditions.some((condition) => {
        if (condition.type !== triggerType) {
          return false
        }

        // For types with IDs, check if they match
        if (triggerId && condition.id && condition.id !== triggerId) {
          return false
        }

        return true
      })

      if (!hasMatchingTrigger) {
        continue
      }

      // Evaluate all trigger conditions
      if (areAllConditionsMet(tutorial.triggerConditions, context)) {
        dialogsStore.showTutorial(tutorial.id)
      }
    }
  }

  /**
   * Convenience method to trigger tutorials when a feature is first opened
   */
  function triggerFeatureTutorial(featureId: string): void {
    // Mark feature as interacted
    if (!dialogsStore.hasInteractedWithFeature(featureId)) {
      dialogsStore.markFeatureInteracted(featureId)
    }

    // Trigger any tutorials for this feature
    triggerTutorials('feature', featureId)
  }

  /**
   * Convenience method to trigger tutorials when an objective is completed
   */
  function triggerObjectiveTutorial(objectiveId: string): void {
    triggerTutorials('objective', objectiveId)
  }

  /**
   * Convenience method to trigger tutorials when a location is explored
   */
  function triggerLocationTutorial(q: number, r: number): void {
    const locationId = `${q},${r}`
    triggerTutorials('location', locationId)
  }

  /**
   * Convenience method to trigger immediate tutorials (e.g., on app load)
   */
  function triggerImmediateTutorials(): void {
    triggerTutorials('immediate')
  }

  return {
    triggerTutorials,
    triggerFeatureTutorial,
    triggerObjectiveTutorial,
    triggerLocationTutorial,
    triggerImmediateTutorials,
    isConditionMet,
    areAllConditionsMet,
  }
}
