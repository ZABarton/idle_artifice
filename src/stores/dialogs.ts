import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
  TutorialModal,
  DialogModal,
  ModalQueueItem,
  DialogHistoryRecord,
  DialogHistoryEntry,
} from '@/types/dialogs'
import { useNotificationsStore } from './notifications'

// LocalStorage keys
const STORAGE_KEY_COMPLETED_TUTORIALS = 'idle-artifice-completed-tutorials'
const STORAGE_KEY_DIALOG_HISTORY = 'idle-artifice-dialog-history'
const STORAGE_KEY_INTERACTED_FEATURES = 'idle-artifice-interacted-features'

// Track if we've shown storage warning to avoid spam
let hasShownStorageWarning = false

/**
 * Dialogs Store
 * Manages tutorial and dialog modals, modal queue, and conversation history
 */
export const useDialogsStore = defineStore('dialogs', () => {
  // State
  const modalQueue = ref<ModalQueueItem[]>([])
  const completedTutorials = ref<Set<string>>(new Set())
  const dialogHistory = ref<DialogHistoryRecord[]>([])
  const loadedTutorials = ref<Map<string, TutorialModal>>(new Map())
  const loadedDialogs = ref<Map<string, DialogModal>>(new Map())
  const activeConversation = ref<DialogHistoryRecord | null>(null)
  const interactedFeatures = ref<Set<string>>(new Set())

  // Getters

  /**
   * Get the current modal to display (first in queue)
   */
  const currentModal = computed(() => {
    return modalQueue.value.length > 0 ? modalQueue.value[0] : null
  })

  /**
   * Check if a tutorial has been completed
   */
  const hasSeenTutorial = computed(() => (tutorialId: string) => {
    return completedTutorials.value.has(tutorialId)
  })

  /**
   * Check if a feature has been interacted with
   */
  const hasInteractedWithFeature = computed(() => (featureId: string) => {
    return interactedFeatures.value.has(featureId)
  })

  /**
   * Get all dialog conversation history
   */
  const conversationHistory = computed(() => {
    return [...dialogHistory.value].reverse() // Most recent first
  })

  // Actions

  /**
   * Save data to localStorage with error handling
   */
  function saveToLocalStorage(key: string, data: any): void {
    try {
      localStorage.setItem(key, JSON.stringify(data))
    } catch (error) {
      console.error(`Failed to save to localStorage (${key}):`, error)

      // Show warning once per session
      if (!hasShownStorageWarning) {
        const notificationsStore = useNotificationsStore()
        notificationsStore.showWarning(
          'Save Failed',
          'Unable to save progress. Check browser storage settings.',
          8000
        )
        hasShownStorageWarning = true
      }
    }
  }

  /**
   * Load data from localStorage with error handling
   */
  function loadFromLocalStorage<T>(key: string, defaultValue: T): T {
    try {
      const item = localStorage.getItem(key)
      if (!item) {
        return defaultValue
      }
      return JSON.parse(item) as T
    } catch (error) {
      console.error(`Failed to load from localStorage (${key}):`, error)
      return defaultValue
    }
  }

  /**
   * Load completed tutorials from localStorage
   */
  function loadCompletedTutorials(): void {
    const completed = loadFromLocalStorage<string[]>(STORAGE_KEY_COMPLETED_TUTORIALS, [])
    completedTutorials.value = new Set(completed)
  }

  /**
   * Load dialog history from localStorage
   */
  function loadDialogHistory(): void {
    const history = loadFromLocalStorage<DialogHistoryRecord[]>(STORAGE_KEY_DIALOG_HISTORY, [])
    // Convert timestamp strings back to Date objects
    dialogHistory.value = history.map((record) => ({
      ...record,
      startedAt: new Date(record.startedAt),
      completedAt: record.completedAt ? new Date(record.completedAt) : undefined,
      transcript: record.transcript.map((entry) => ({
        ...entry,
        timestamp: new Date(entry.timestamp),
      })),
    }))
  }

  /**
   * Load interacted features from localStorage
   */
  function loadInteractedFeatures(): void {
    const interacted = loadFromLocalStorage<string[]>(STORAGE_KEY_INTERACTED_FEATURES, [])
    interactedFeatures.value = new Set(interacted)
  }

  /**
   * Mark a feature as interacted with
   */
  function markFeatureInteracted(featureId: string): void {
    interactedFeatures.value.add(featureId)

    // Save to localStorage
    const interactedArray = Array.from(interactedFeatures.value)
    saveToLocalStorage(STORAGE_KEY_INTERACTED_FEATURES, interactedArray)
  }

  /**
   * Load all tutorials from content directory
   */
  async function loadTutorials(): Promise<void> {
    try {
      // Use Vite's import.meta.glob to import all tutorial JSON files
      const tutorialModules = import.meta.glob<{ default: TutorialModal }>(
        '/src/content/tutorials/*.json'
      )

      // Load each tutorial
      for (const path in tutorialModules) {
        const module = await tutorialModules[path]()
        const tutorial = module.default

        // Validate tutorial has required fields
        if (!tutorial.id || !tutorial.title || !tutorial.content) {
          console.error(`Invalid tutorial at ${path}: missing required fields`)
          const notificationsStore = useNotificationsStore()
          notificationsStore.showError(
            'Tutorial Load Error',
            `Failed to load tutorial from ${path}`,
            8000
          )
          continue
        }

        loadedTutorials.value.set(tutorial.id, tutorial)
      }

      console.log(`Loaded ${loadedTutorials.value.size} tutorials`)
    } catch (error) {
      console.error('Failed to load tutorials:', error)
      const notificationsStore = useNotificationsStore()
      notificationsStore.showError(
        'Tutorial Load Error',
        'Failed to load tutorial content. Some tutorials may not be available.',
        8000
      )
    }
  }

  /**
   * Load a specific dialog by ID (lazy loading)
   */
  async function loadDialog(dialogId: string): Promise<DialogModal | null> {
    // Check cache first
    if (loadedDialogs.value.has(dialogId)) {
      return loadedDialogs.value.get(dialogId)!
    }

    try {
      // Dynamically import the dialog file
      const module = await import(`../content/dialogs/${dialogId}.json`)
      const dialog = module.default as DialogModal

      // Validate dialog has required fields
      if (!dialog.id || !dialog.characterName || !dialog.message) {
        console.error(`Invalid dialog ${dialogId}: missing required fields`)
        const notificationsStore = useNotificationsStore()
        notificationsStore.showError('Dialog Error', `Missing dialog: ${dialogId}`, 8000)
        return null
      }

      // Cache the loaded dialog
      loadedDialogs.value.set(dialogId, dialog)
      return dialog
    } catch (error) {
      console.error(`Failed to load dialog ${dialogId}:`, error)
      const notificationsStore = useNotificationsStore()
      notificationsStore.showError('Dialog Error', `Missing dialog: ${dialogId}`, 8000)
      return null
    }
  }

  /**
   * Show a tutorial modal (adds to queue if not already seen)
   */
  function showTutorial(tutorialId: string): void {
    // Check if already seen (unless replaying from help menu)
    if (hasSeenTutorial.value(tutorialId)) {
      return
    }

    // Get tutorial from loaded tutorials
    const tutorial = loadedTutorials.value.get(tutorialId)
    if (!tutorial) {
      console.warn(`Tutorial not found: ${tutorialId}`)
      return
    }

    // Add to queue
    modalQueue.value.push({
      type: 'tutorial',
      modal: tutorial,
    })
  }

  /**
   * Show a tutorial modal even if already seen (for replay from help menu)
   */
  function replayTutorial(tutorialId: string): void {
    const tutorial = loadedTutorials.value.get(tutorialId)
    if (!tutorial) {
      console.warn(`Tutorial not found: ${tutorialId}`)
      return
    }

    modalQueue.value.push({
      type: 'tutorial',
      modal: tutorial,
    })
  }

  /**
   * Show a dialog modal (lazy loads and adds to queue)
   */
  async function showDialog(dialogId: string): Promise<void> {
    const dialog = await loadDialog(dialogId)
    if (!dialog) {
      return
    }

    // Start new conversation for this dialog
    const conversationId = dialog.conversationId || dialogId
    activeConversation.value = {
      conversationId,
      characterName: dialog.characterName,
      transcript: [],
      startedAt: new Date(),
    }

    // Add NPC message to transcript
    addDialogEntry({
      speaker: 'npc',
      speakerName: dialog.characterName,
      message: dialog.message,
      timestamp: new Date(),
    })

    // Add to queue
    modalQueue.value.push({
      type: 'dialog',
      modal: dialog,
    })
  }

  /**
   * Add an entry to the current conversation transcript
   */
  function addDialogEntry(entry: DialogHistoryEntry): void {
    if (!activeConversation.value) {
      console.warn('No active conversation to add entry to')
      return
    }

    activeConversation.value.transcript.push(entry)
  }

  /**
   * Complete the current conversation and add to history
   */
  function completeConversation(): void {
    if (!activeConversation.value) {
      return
    }

    // Finalize conversation
    activeConversation.value.completedAt = new Date()

    // Add to history
    dialogHistory.value.push(activeConversation.value)

    // Save to localStorage
    saveToLocalStorage(STORAGE_KEY_DIALOG_HISTORY, dialogHistory.value)

    // Clear active conversation
    activeConversation.value = null
  }

  /**
   * Close the current modal and handle completion
   */
  function closeCurrentModal(): void {
    const current = currentModal.value
    if (!current) {
      return
    }

    // Handle tutorial completion
    if (current.type === 'tutorial') {
      markTutorialCompleted(current.modal.id)
    }

    // Handle dialog completion
    if (current.type === 'dialog') {
      completeConversation()
    }

    // Remove from queue
    modalQueue.value.shift()
  }

  /**
   * Mark a tutorial as completed
   */
  function markTutorialCompleted(tutorialId: string): void {
    completedTutorials.value.add(tutorialId)

    // Save to localStorage
    const completedArray = Array.from(completedTutorials.value)
    saveToLocalStorage(STORAGE_KEY_COMPLETED_TUTORIALS, completedArray)
  }

  /**
   * Initialize the store (load from localStorage and load tutorials)
   */
  async function initialize(): Promise<void> {
    loadCompletedTutorials()
    loadDialogHistory()
    loadInteractedFeatures()
    await loadTutorials()
  }

  // Auto-initialize when store is first accessed
  initialize()

  return {
    // State
    modalQueue,
    completedTutorials,
    dialogHistory,
    loadedTutorials,
    loadedDialogs,
    activeConversation,
    interactedFeatures,
    // Getters
    currentModal,
    hasSeenTutorial,
    hasInteractedWithFeature,
    conversationHistory,
    // Actions
    showTutorial,
    replayTutorial,
    showDialog,
    addDialogEntry,
    completeConversation,
    closeCurrentModal,
    markTutorialCompleted,
    markFeatureInteracted,
    loadTutorials,
    initialize,
  }
})
