/**
 * Dialog Triggers Composable
 *
 * Provides centralized evaluation and firing of dialog tree triggers
 * based on game conditions defined in dialog-triggers.json.
 */

import { ref, computed } from 'vue'
import type {
  DialogTrigger,
  DialogTriggerCondition,
  DialogTriggerType,
  ComparisonOperator,
} from '@/types/dialogTriggers'
import triggersConfig from '@/config/dialog-triggers.json'

// LocalStorage key for tracking fired triggers
const STORAGE_KEY = 'idle-artifice-fired-dialog-triggers'

// Module-level state (shared across all uses of the composable)
const firedTriggers = ref<Set<string>>(new Set())
let isInitialized = false

/**
 * Load fired triggers from localStorage
 */
function loadFiredTriggers(): void {
  if (isInitialized) return
  isInitialized = true

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      firedTriggers.value = new Set(JSON.parse(stored))
    }
  } catch (error) {
    console.error('[DialogTriggers] Failed to load fired triggers:', error)
  }
}

/**
 * Save fired triggers to localStorage
 */
function saveFiredTriggers(): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...firedTriggers.value]))
  } catch (error) {
    console.error('[DialogTriggers] Failed to save fired triggers:', error)
  }
}

/**
 * Helper for numeric comparisons
 */
function evaluateNumericCondition(
  actual: number,
  expected: number,
  operator: ComparisonOperator
): boolean {
  switch (operator) {
    case 'eq':
      return actual === expected
    case 'gte':
      return actual >= expected
    case 'lte':
      return actual <= expected
    case 'gt':
      return actual > expected
    case 'lt':
      return actual < expected
    default:
      return actual >= expected
  }
}

/**
 * Dialog triggers composable
 *
 * Provides methods to evaluate and fire dialog triggers based on game events.
 * Uses lazy imports to avoid circular dependencies with stores.
 */
export function useDialogTriggers() {
  // Initialize on first use
  loadFiredTriggers()

  /**
   * Mark a trigger as fired
   */
  function markTriggerFired(triggerId: string): void {
    firedTriggers.value.add(triggerId)
    saveFiredTriggers()
  }

  /**
   * Check if a trigger has already fired
   */
  function hasTriggerFired(triggerId: string): boolean {
    return firedTriggers.value.has(triggerId)
  }

  /**
   * Evaluate a single condition
   * Uses dynamic imports to avoid circular dependencies
   */
  async function evaluateCondition(condition: DialogTriggerCondition): Promise<boolean> {
    switch (condition.type) {
      case 'objective-complete': {
        const { useObjectivesStore } = await import('@/stores/objectives')
        const objectivesStore = useObjectivesStore()
        const objective = objectivesStore.getObjectiveById(condition.id!)
        return objective?.status === 'completed'
      }

      case 'objective-active': {
        const { useObjectivesStore } = await import('@/stores/objectives')
        const objectivesStore = useObjectivesStore()
        const objective = objectivesStore.getObjectiveById(condition.id!)
        return objective?.status === 'active'
      }

      case 'dialog-complete': {
        const { useDialogsStore } = await import('@/stores/dialogs')
        const dialogsStore = useDialogsStore()
        return dialogsStore.hasCompletedDialogTree(condition.id!)
      }

      case 'feature-interact': {
        const { useDialogsStore } = await import('@/stores/dialogs')
        const dialogsStore = useDialogsStore()
        return dialogsStore.hasInteractedWithFeature(condition.id!)
      }

      case 'feature-unlock': {
        const { useAreaMapStore } = await import('@/stores/areaMap')
        const areaMapStore = useAreaMapStore()
        const feature = areaMapStore.getFeatureById(condition.id!)
        return feature?.state === 'unlocked'
      }

      case 'craft-complete': {
        const { useFoundryStore } = await import('@/stores/foundry')
        const foundryStore = useFoundryStore()
        const count = foundryStore.completedCraftsCount
        return evaluateNumericCondition(count, condition.value!, condition.operator || 'gte')
      }

      case 'resource-threshold': {
        const { useResourcesStore } = await import('@/stores/resources')
        const resourcesStore = useResourcesStore()
        const amount = resourcesStore.getResourceAmount(condition.id!)
        return evaluateNumericCondition(amount, condition.value!, condition.operator || 'gte')
      }

      case 'location-visit': {
        const { useWorldMapStore } = await import('@/stores/worldMap')
        const worldMapStore = useWorldMapStore()
        const [q, r] = condition.id!.split(',').map(Number)
        const tile = worldMapStore.getTileAt(q, r)
        return tile?.explorationStatus === 'explored'
      }

      case 'location-enter': {
        // This would need to be tracked in navigation store
        // For now, return false until implemented
        console.warn('[DialogTriggers] location-enter not yet implemented')
        return false
      }

      default:
        console.warn(`[DialogTriggers] Unknown condition type: ${condition.type}`)
        return false
    }
  }

  /**
   * Evaluate all conditions for a trigger (AND logic)
   */
  async function evaluateTrigger(trigger: DialogTrigger): Promise<boolean> {
    // Skip if already fired and showOnce is true (default)
    if (trigger.showOnce !== false && hasTriggerFired(trigger.id)) {
      return false
    }

    // Check all conditions (AND logic)
    for (const condition of trigger.conditions) {
      const result = await evaluateCondition(condition)
      if (!result) {
        return false
      }
    }

    return true
  }

  /**
   * Evaluate triggers for a specific event type
   * This is more efficient than checking all triggers
   *
   * @param eventType - The type of event that occurred
   * @param eventId - Optional ID associated with the event
   * @returns true if a trigger was fired
   */
  async function evaluateTriggersForEvent(
    eventType: DialogTriggerType,
    eventId?: string
  ): Promise<boolean> {
    // Filter to triggers that have this event type as a condition
    const relevantTriggers = (triggersConfig.triggers as DialogTrigger[]).filter((trigger) =>
      trigger.conditions.some((c) => c.type === eventType && (!eventId || c.id === eventId))
    )

    if (relevantTriggers.length === 0) {
      return false
    }

    // Sort by priority (higher first)
    const sorted = [...relevantTriggers].sort((a, b) => (b.priority || 0) - (a.priority || 0))

    for (const trigger of sorted) {
      const shouldFire = await evaluateTrigger(trigger)
      if (shouldFire) {
        console.log(`[DialogTriggers] Firing: ${trigger.id} -> ${trigger.dialogTreeId}`)
        markTriggerFired(trigger.id)

        // Show the dialog tree
        const { useDialogsStore } = await import('@/stores/dialogs')
        const dialogsStore = useDialogsStore()
        await dialogsStore.showDialogTree(trigger.dialogTreeId)

        return true
      }
    }

    return false
  }

  /**
   * Evaluate all triggers and fire the first matching one
   * Use this for general trigger evaluation (e.g., on game load)
   *
   * @returns true if a trigger was fired
   */
  async function evaluateAllTriggers(): Promise<boolean> {
    const allTriggers = triggersConfig.triggers as DialogTrigger[]

    // Sort by priority (higher first)
    const sorted = [...allTriggers].sort((a, b) => (b.priority || 0) - (a.priority || 0))

    for (const trigger of sorted) {
      const shouldFire = await evaluateTrigger(trigger)
      if (shouldFire) {
        console.log(`[DialogTriggers] Firing: ${trigger.id} -> ${trigger.dialogTreeId}`)
        markTriggerFired(trigger.id)

        const { useDialogsStore } = await import('@/stores/dialogs')
        const dialogsStore = useDialogsStore()
        await dialogsStore.showDialogTree(trigger.dialogTreeId)

        return true
      }
    }

    return false
  }

  /**
   * Reset all fired triggers (for testing/debug)
   */
  function resetFiredTriggers(): void {
    firedTriggers.value.clear()
    isInitialized = false
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch (error) {
      console.error('[DialogTriggers] Failed to reset fired triggers:', error)
    }
  }

  return {
    firedTriggers: computed(() => firedTriggers.value),
    hasTriggerFired,
    evaluateTriggersForEvent,
    evaluateAllTriggers,
    resetFiredTriggers,
  }
}
