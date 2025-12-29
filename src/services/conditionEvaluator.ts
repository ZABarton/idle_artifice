/**
 * Condition Evaluation Service
 *
 * Evaluates trigger conditions to determine if triggers should fire.
 * Foundation for future complex conditions with AND/OR logic.
 *
 * Current implementation supports simple single conditions.
 * Future: Support complex conditions with boolean logic.
 */

import type { TriggerCondition, TriggerContext } from '@/types/areaMapConfig'

/**
 * Evaluate a trigger condition
 *
 * Checks if the condition is currently met based on game state.
 * Returns true if the condition is satisfied, false otherwise.
 *
 * @param condition - The condition to evaluate
 * @param context - Context object with stores and current state
 * @returns True if condition is met, false otherwise
 */
export function evaluateCondition(condition: TriggerCondition, context: TriggerContext): boolean {
  try {
    switch (condition.type) {
      case 'objectiveComplete':
        return evaluateObjectiveComplete(condition, context)

      case 'resourceAmount':
        return evaluateResourceAmount(condition, context)

      case 'featureState':
        return evaluateFeatureState(condition, context)

      case 'tileExplored':
        return evaluateTileExplored(condition, context)

      case 'dialogComplete':
        return evaluateDialogComplete(condition, context)

      default:
        console.warn(`[Condition] Unknown condition type: ${(condition as any).type}`)
        return false
    }
  } catch (error) {
    console.error('[Condition] Error evaluating condition:', error)
    console.error('[Condition] Failed condition:', condition)
    return false
  }
}

/**
 * Evaluate objective completion condition
 */
function evaluateObjectiveComplete(condition: TriggerCondition, context: TriggerContext): boolean {
  if (!condition.objectiveId) {
    console.warn('[Condition] objectiveComplete: missing objectiveId')
    return false
  }

  const { objectives } = context.stores
  const objective = objectives.getObjectiveById(condition.objectiveId)

  return objective?.status === 'completed'
}

/**
 * Evaluate resource amount condition
 */
function evaluateResourceAmount(condition: TriggerCondition, context: TriggerContext): boolean {
  if (!condition.resourceId || condition.value === undefined || !condition.operator) {
    console.warn('[Condition] resourceAmount: missing resourceId, value, or operator')
    return false
  }

  const { resources } = context.stores
  const currentAmount = resources.getResourceAmount(condition.resourceId)

  switch (condition.operator) {
    case '>=':
      return currentAmount >= condition.value
    case '<=':
      return currentAmount <= condition.value
    case '==':
      return currentAmount === condition.value
    case '>':
      return currentAmount > condition.value
    case '<':
      return currentAmount < condition.value
    default:
      console.warn(`[Condition] Unknown operator: ${condition.operator}`)
      return false
  }
}

/**
 * Evaluate feature state condition
 */
function evaluateFeatureState(condition: TriggerCondition, context: TriggerContext): boolean {
  if (!condition.featureId || !condition.state) {
    console.warn('[Condition] featureState: missing featureId or state')
    return false
  }

  const { areaMap } = context.stores
  const feature = areaMap.getFeatureById(condition.featureId)

  return feature?.state === condition.state
}

/**
 * Evaluate tile explored condition
 */
function evaluateTileExplored(condition: TriggerCondition, context: TriggerContext): boolean {
  if (!condition.tileCoords) {
    console.warn('[Condition] tileExplored: missing tileCoords')
    return false
  }

  const { worldMap } = context.stores
  const tile = worldMap.getTileAt(condition.tileCoords.q, condition.tileCoords.r)

  return tile?.explored === true
}

/**
 * Evaluate dialog completion condition
 */
function evaluateDialogComplete(condition: TriggerCondition, context: TriggerContext): boolean {
  if (!condition.dialogId) {
    console.warn('[Condition] dialogComplete: missing dialogId')
    return false
  }

  const { dialogs } = context.stores
  return dialogs.hasCompletedDialogTree(condition.dialogId)
}

/**
 * Future: Evaluate complex conditions with AND/OR logic
 *
 * Example structure:
 * {
 *   type: 'and',
 *   conditions: [
 *     { type: 'objectiveComplete', objectiveId: 'find-wood' },
 *     { type: 'resourceAmount', resourceId: 'wood', operator: '>=', value: 10 }
 *   ]
 * }
 *
 * This will be implemented in a future milestone when complex conditions are needed.
 */
export function evaluateComplexCondition(
  /* condition: ComplexCondition, context: TriggerContext */
): boolean {
  // TODO: Implement in future milestone
  console.warn('[Condition] Complex conditions not yet implemented')
  return false
}
