/**
 * Area Map Trigger Execution Service
 *
 * Handles execution of area triggers in response to events.
 * Executes both predefined actions and optional custom callbacks.
 */

import type {
  AreaTrigger,
  TriggerEvent,
  TriggerContext,
  TriggerAction,
} from '@/types/areaMapConfig'

/**
 * Execute triggers for a specific event
 *
 * Filters triggers by event type and optional feature ID,
 * then executes all matching triggers in sequence.
 *
 * @param triggers - Array of all triggers for the area
 * @param event - The event type that occurred
 * @param context - Context object with stores and event data
 * @returns Promise that resolves when all triggers complete
 */
export async function executeTriggers(
  triggers: AreaTrigger[],
  event: TriggerEvent,
  context: TriggerContext
): Promise<void> {
  // Filter triggers that match this event
  const matchingTriggers = triggers.filter((trigger) => {
    // Check event type matches
    if (trigger.event !== event) {
      return false
    }

    // For feature interaction events, check feature ID matches
    if (event === 'onFeatureInteract' && trigger.featureId !== context.featureId) {
      return false
    }

    return true
  })

  // Execute all matching triggers
  for (const trigger of matchingTriggers) {
    await executeTrigger(trigger, context)
  }
}

/**
 * Execute a single trigger
 *
 * Executes predefined actions (if any) and then the optional callback.
 * Handles errors gracefully and logs execution for debugging.
 *
 * @param trigger - The trigger to execute
 * @param context - Context object with stores and event data
 */
async function executeTrigger(trigger: AreaTrigger, context: TriggerContext): Promise<void> {
  try {
    // Log trigger execution for debugging
    if (trigger.description) {
      console.log(`[Trigger] ${trigger.description}`)
    } else {
      console.log(`[Trigger] ${trigger.event}${trigger.featureId ? ` (${trigger.featureId})` : ''}`)
    }

    // Execute predefined actions
    if (trigger.actions && trigger.actions.length > 0) {
      for (const action of trigger.actions) {
        await executeAction(action, context)
      }
    }

    // Execute optional callback
    if (trigger.callback) {
      await trigger.callback(context)
    }
  } catch (error) {
    console.error('[Trigger] Error executing trigger:', error)
    console.error('[Trigger] Failed trigger:', trigger)

    // Show error notification to user
    const { notifications } = context.stores
    if (notifications) {
      notifications.showError(
        'Trigger Error',
        'An error occurred while processing a game event. Check console for details.',
        5000
      )
    }
  }
}

/**
 * Execute a single predefined action
 *
 * Handles all predefined action types (showDialog, completeObjective, etc.)
 *
 * @param action - The action to execute
 * @param context - Context object with stores
 */
async function executeAction(action: TriggerAction, context: TriggerContext): Promise<void> {
  const { dialogs, objectives, resources, worldMap, areaMap } = context.stores

  switch (action.type) {
    case 'showDialog':
      if (action.dialogId) {
        await dialogs.showDialog(action.dialogId)
      } else {
        console.warn('[Action] showDialog: missing dialogId')
      }
      break

    case 'showDialogTree':
      if (action.dialogId) {
        await dialogs.showDialogTree(action.dialogId)
      } else {
        console.warn('[Action] showDialogTree: missing dialogId')
      }
      break

    case 'showTutorial':
      if (action.tutorialId) {
        dialogs.showTutorial(action.tutorialId)
      } else {
        console.warn('[Action] showTutorial: missing tutorialId')
      }
      break

    case 'completeObjective':
      if (action.objectiveId) {
        objectives.completeObjective(action.objectiveId)
      } else {
        console.warn('[Action] completeObjective: missing objectiveId')
      }
      break

    case 'unlockObjective':
      if (action.objectiveId) {
        objectives.unlockObjective(action.objectiveId)
      } else {
        console.warn('[Action] unlockObjective: missing objectiveId')
      }
      break

    case 'unlockFeature':
      if (action.featureId) {
        areaMap.updateFeatureState(action.featureId, 'unlocked')
      } else {
        console.warn('[Action] unlockFeature: missing featureId')
      }
      break

    case 'hideFeature':
      if (action.featureId) {
        areaMap.updateFeatureState(action.featureId, 'hidden')
      } else {
        console.warn('[Action] hideFeature: missing featureId')
      }
      break

    case 'addResource':
      if (action.resourceId && action.amount !== undefined) {
        resources.addResource(action.resourceId, action.amount)
      } else {
        console.warn('[Action] addResource: missing resourceId or amount')
      }
      break

    case 'removeResource':
      if (action.resourceId && action.amount !== undefined) {
        resources.removeResource(action.resourceId, action.amount)
      } else {
        console.warn('[Action] removeResource: missing resourceId or amount')
      }
      break

    case 'exploreTile':
      if (action.tileCoords) {
        worldMap.exploreTile(action.tileCoords.q, action.tileCoords.r)
      } else {
        console.warn('[Action] exploreTile: missing tileCoords')
      }
      break

    default:
      console.warn(`[Action] Unknown action type: ${(action as any).type}`)
  }
}

/**
 * Create a trigger context object
 *
 * Helper function to build the context object passed to triggers.
 * Should be called from within a Vue component with access to stores.
 *
 * @param stores - Object containing all necessary store instances
 * @param coordinates - Current area coordinates
 * @param areaType - Current area type
 * @param featureId - Optional feature ID (for onFeatureInteract events)
 * @returns Context object for trigger execution
 */
export function createTriggerContext(
  stores: TriggerContext['stores'],
  coordinates: { q: number; r: number },
  areaType: string,
  featureId?: string
): TriggerContext {
  return {
    stores,
    coordinates,
    areaType: areaType as any,
    featureId,
  }
}
