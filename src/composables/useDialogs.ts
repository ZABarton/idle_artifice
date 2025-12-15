import { useDialogsStore } from '@/stores/dialogs'

/**
 * Composable for triggering dialogs from features, objectives, and events
 * Provides convenient methods to show dialogs in different contexts
 */
export function useDialogs() {
  const dialogsStore = useDialogsStore()

  /**
   * Trigger a dialog by ID
   * Lazy-loads the dialog and adds it to the queue
   *
   * @param dialogId - Unique identifier for the dialog
   */
  async function triggerDialog(dialogId: string): Promise<void> {
    await dialogsStore.showDialog(dialogId)
  }

  /**
   * Trigger multiple dialogs in sequence
   * All dialogs are added to the queue and will display one after another
   *
   * @param dialogIds - Array of dialog IDs to show in order
   */
  async function triggerDialogSequence(dialogIds: string[]): Promise<void> {
    for (const dialogId of dialogIds) {
      await dialogsStore.showDialog(dialogId)
    }
  }

  /**
   * Trigger a dialog when interacting with a feature
   * Marks the feature as interacted and shows the dialog
   *
   * @param featureId - ID of the feature being interacted with
   * @param dialogId - ID of the dialog to show
   */
  async function triggerFeatureDialog(featureId: string, dialogId: string): Promise<void> {
    // Mark feature as interacted if not already
    if (!dialogsStore.hasInteractedWithFeature(featureId)) {
      dialogsStore.markFeatureInteracted(featureId)
    }

    await dialogsStore.showDialog(dialogId)
  }

  /**
   * Trigger a dialog when an objective status changes
   * Useful for showing character reactions when objectives are completed
   *
   * @param objectiveId - ID of the objective that changed
   * @param dialogId - ID of the dialog to show
   */
  async function triggerObjectiveDialog(objectiveId: string, dialogId: string): Promise<void> {
    await dialogsStore.showDialog(dialogId)
  }

  /**
   * Trigger a dialog from a game event
   * Generic method for event-based dialog triggers
   *
   * @param eventId - ID of the event that occurred
   * @param dialogId - ID of the dialog to show
   */
  async function triggerEventDialog(eventId: string, dialogId: string): Promise<void> {
    await dialogsStore.showDialog(dialogId)
  }

  /**
   * Check if a dialog is currently active (being displayed)
   */
  function isDialogActive(): boolean {
    const modal = dialogsStore.currentModal
    return modal?.type === 'dialog'
  }

  /**
   * Get the current active dialog ID, or null if no dialog is showing
   */
  function getCurrentDialogId(): string | null {
    const modal = dialogsStore.currentModal
    if (modal?.type === 'dialog') {
      return modal.modal.id
    }
    return null
  }

  return {
    triggerDialog,
    triggerDialogSequence,
    triggerFeatureDialog,
    triggerObjectiveDialog,
    triggerEventDialog,
    isDialogActive,
    getCurrentDialogId,
  }
}
