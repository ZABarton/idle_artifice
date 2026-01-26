/**
 * NPC Dialog Composable
 *
 * Provides dialog resolution logic for NPCs using the centralized NPC system.
 * Handles dialog progression (sequential dialogs with conditions) and fallback
 * dialogs (shown after all progressions are complete).
 */

import { useDialogsStore } from '@/stores/dialogs'
import { useObjectivesStore } from '@/stores/objectives'
import { useResourcesStore } from '@/stores/resources'
import { useWorldMapStore } from '@/stores/worldMap'
import { useAreaMapStore } from '@/stores/areaMap'
import { useNotificationsStore } from '@/stores/notifications'
import { getNPCById } from '@/config/npcs'
import { evaluateCondition } from '@/services/conditionEvaluator'
import type { TriggerCondition, TriggerContext } from '@/types/areaMapConfig'
import type { NPCConfig, DialogProgressionEntry, FallbackDialogEntry } from '@/types/npc'

/**
 * Composable for NPC dialog resolution
 * Determines which dialog to show based on progression and conditions
 */
export function useNPCDialog() {
  const dialogsStore = useDialogsStore()
  const objectivesStore = useObjectivesStore()
  const resourcesStore = useResourcesStore()
  const worldMapStore = useWorldMapStore()
  const areaMapStore = useAreaMapStore()
  const notificationsStore = useNotificationsStore()

  /**
   * Create a trigger context for condition evaluation
   * Uses default coordinates since NPC dialog doesn't require specific area context
   */
  function createConditionContext(): TriggerContext {
    return {
      stores: {
        dialogs: dialogsStore,
        objectives: objectivesStore,
        resources: resourcesStore,
        worldMap: worldMapStore,
        areaMap: areaMapStore,
        notifications: notificationsStore,
      },
      coordinates: { q: 0, r: 0 },
      areaType: 'academy',
    }
  }

  /**
   * Evaluate an array of conditions
   * Returns true if all conditions are met (or if no conditions exist)
   */
  function evaluateConditions(conditions?: TriggerCondition[]): boolean {
    if (!conditions || conditions.length === 0) {
      return true
    }
    const context = createConditionContext()
    return conditions.every((c) => evaluateCondition(c, context))
  }

  /**
   * Check if an NPC has any uncompleted progression dialogs available
   * Used to determine if the indicator badge should be shown
   *
   * @param npcId - The NPC's unique identifier
   * @returns True if there are available progression dialogs
   */
  function hasAvailableProgressionDialog(npcId: string): boolean {
    const npc = getNPCById(npcId)
    if (!npc) {
      console.warn(`[NPC Dialog] NPC not found: ${npcId}`)
      return false
    }

    return getNextProgressionDialog(npc) !== null
  }

  /**
   * Get the next available progression dialog for an NPC
   * Returns the first uncompleted dialog with met conditions
   *
   * @param npc - The NPC configuration
   * @returns Dialog entry or null if none available
   */
  function getNextProgressionDialog(npc: NPCConfig): DialogProgressionEntry | null {
    if (!npc.dialogProgression || npc.dialogProgression.length === 0) {
      return null
    }

    for (const entry of npc.dialogProgression) {
      // Skip if dialog is already completed
      if (dialogsStore.hasCompletedDialogTree(entry.id)) {
        continue
      }

      // Skip if conditions are not met
      if (!evaluateConditions(entry.conditions)) {
        continue
      }

      // Found an available progression dialog
      return entry
    }

    return null
  }

  /**
   * Get the best available fallback dialog for an NPC
   * Returns the highest priority fallback with met conditions
   *
   * @param npc - The NPC configuration
   * @returns Dialog entry or null if none available
   */
  function getBestFallbackDialog(npc: NPCConfig): FallbackDialogEntry | null {
    if (!npc.fallbackProgression || npc.fallbackProgression.length === 0) {
      return null
    }

    // Sort by priority (descending) - higher priority first
    const sortedFallbacks = [...npc.fallbackProgression].sort(
      (a, b) => (b.priority ?? 0) - (a.priority ?? 0)
    )

    for (const entry of sortedFallbacks) {
      // Check if conditions are met
      if (evaluateConditions(entry.conditions)) {
        return entry
      }
    }

    return null
  }

  /**
   * Get the next dialog to show for an NPC
   * First checks progression dialogs, then falls back to fallback dialogs
   *
   * @param npcId - The NPC's unique identifier
   * @returns Dialog ID to show, or null if no dialogs available
   */
  function getNextDialogForNPC(npcId: string): string | null {
    const npc = getNPCById(npcId)
    if (!npc) {
      console.warn(`[NPC Dialog] NPC not found: ${npcId}`)
      return null
    }

    // First try progression dialogs
    const progressionDialog = getNextProgressionDialog(npc)
    if (progressionDialog) {
      return progressionDialog.id
    }

    // Fall back to fallback dialogs
    const fallbackDialog = getBestFallbackDialog(npc)
    if (fallbackDialog) {
      return fallbackDialog.id
    }

    return null
  }

  /**
   * Initiate dialog with an NPC
   * Shows the appropriate dialog based on progression/fallback logic
   *
   * @param npcId - The NPC's unique identifier
   * @returns Promise that resolves when dialog is queued
   */
  async function initiateNPCDialog(npcId: string): Promise<void> {
    const dialogId = getNextDialogForNPC(npcId)

    if (!dialogId) {
      console.warn(`[NPC Dialog] No dialog available for NPC: ${npcId}`)
      return
    }

    await dialogsStore.showDialogTree(dialogId)
  }

  /**
   * Check if an NPC has any dialog available (progression or fallback)
   *
   * @param npcId - The NPC's unique identifier
   * @returns True if any dialog is available
   */
  function hasAnyDialogAvailable(npcId: string): boolean {
    return getNextDialogForNPC(npcId) !== null
  }

  return {
    hasAvailableProgressionDialog,
    getNextDialogForNPC,
    initiateNPCDialog,
    hasAnyDialogAvailable,
    evaluateConditions,
  }
}
