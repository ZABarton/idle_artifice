import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
  TutorialModal,
  DialogModal,
  DialogTree,
  ModalQueueItem,
  DialogHistoryRecord,
  DialogHistoryEntry,
} from '@/types/dialogs'
import { useNotificationsStore } from './notifications'
import { useObjectivesStore } from './objectives'
import { useWorldMapStore } from './worldMap'

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
  const loadedDialogTrees = ref<Map<string, DialogTree>>(new Map())
  const activeConversation = ref<DialogHistoryRecord | null>(null)
  const interactedFeatures = ref<Set<string>>(new Set())

  // Dialog tree navigation state
  const activeDialogTree = ref<DialogTree | null>(null)
  const currentNodeId = ref<string | null>(null)

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
   * Check if a dialog tree has been completed
   */
  const hasCompletedDialogTree = computed(() => (treeId: string) => {
    return dialogHistory.value.some((record) => record.conversationId === treeId)
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

  /**
   * Get the current node in the active dialog tree
   */
  const currentNode = computed(() => {
    if (!activeDialogTree.value || !currentNodeId.value) {
      return null
    }
    return activeDialogTree.value.nodes[currentNodeId.value] || null
  })

  /**
   * Get the current portrait for the active dialog tree
   * Uses node-level portrait if available, otherwise falls back to tree-level
   */
  const currentPortrait = computed(() => {
    if (!activeDialogTree.value) {
      return null
    }
    // Check if current node has a portrait override
    if (currentNode.value?.portrait) {
      return currentNode.value.portrait
    }
    // Fall back to tree-level portrait
    return activeDialogTree.value.portrait
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
   *
   * Uses Vite's import.meta.glob for eager loading of all tutorial JSON files.
   * This happens once at app startup since tutorials are lightweight and commonly needed.
   * All tutorials are cached in memory for fast trigger evaluation.
   */
  async function loadTutorials(): Promise<void> {
    try {
      // Use Vite's import.meta.glob to import all tutorial JSON files
      // Pattern: /src/content/tutorials/*.json
      const tutorialModules = import.meta.glob<{ default: TutorialModal }>(
        '/src/content/tutorials/*.json'
      )

      // Load each tutorial file
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

        // Store in memory cache keyed by tutorial ID
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
   *
   * Dialogs are loaded on-demand rather than at startup because:
   * 1. There may be many dialogs that are never seen in a playthrough
   * 2. Dialog files may include large portrait images
   * 3. Reduces initial app load time
   *
   * Once loaded, dialogs are cached in memory for subsequent triggers.
   *
   * @param dialogId - The dialog ID (must match filename in src/content/dialogs/)
   * @returns The dialog modal data, or null if loading failed
   */
  async function loadDialog(dialogId: string): Promise<DialogModal | null> {
    // Check cache first to avoid redundant file loads
    if (loadedDialogs.value.has(dialogId)) {
      return loadedDialogs.value.get(dialogId)!
    }

    try {
      // Dynamically import the dialog file by ID
      // File must exist at: src/content/dialogs/{dialogId}.json
      const module = await import(`../content/dialogs/${dialogId}.json`)
      const dialog = module.default as DialogModal

      // Validate dialog has required fields
      if (!dialog.id || !dialog.characterName || !dialog.message) {
        console.error(`Invalid dialog ${dialogId}: missing required fields`)
        const notificationsStore = useNotificationsStore()
        notificationsStore.showError('Dialog Error', `Missing dialog: ${dialogId}`, 8000)
        return null
      }

      // Cache the loaded dialog for future use
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
   * Validate dialog tree structure
   *
   * Checks for common content authoring errors:
   * - Missing start node
   * - Referenced nodes that don't exist
   * - No terminal nodes (all paths loop infinitely)
   * - Empty response arrays with non-null nextNodeId
   *
   * @param tree - The dialog tree to validate
   * @param _treeId - The tree ID (reserved for future error messages)
   * @returns Array of error messages (empty if valid)
   */
  function validateDialogTree(tree: DialogTree, _treeId: string): string[] {
    const errors: string[] = []

    // Check start node exists
    if (!tree.nodes[tree.startNodeId]) {
      errors.push(`Start node "${tree.startNodeId}" not found in nodes`)
      return errors // Can't continue validation without start node
    }

    // Collect all node IDs for reference checking
    const nodeIds = new Set(Object.keys(tree.nodes))

    // Track nodes that can potentially end the conversation
    let hasTerminalPath = false

    // Validate each node
    for (const [nodeId, node] of Object.entries(tree.nodes)) {
      // Check node ID matches key
      if (node.id !== nodeId) {
        errors.push(
          `Node key "${nodeId}" doesn't match node.id "${node.id}". These should match.`
        )
      }

      // Check if node has terminal responses (ends conversation)
      if (node.responses.length === 0 || node.responses.some((r) => r.nextNodeId === null)) {
        hasTerminalPath = true
      }

      // Validate each response
      node.responses.forEach((response, idx) => {
        // Check for empty response text
        if (!response.text || response.text.trim() === '') {
          errors.push(`Node "${nodeId}" response ${idx} has empty text`)
        }

        // Check referenced node exists (if not terminal)
        if (response.nextNodeId !== null && !nodeIds.has(response.nextNodeId)) {
          errors.push(
            `Node "${nodeId}" references non-existent node "${response.nextNodeId}"`
          )
        }
      })
    }

    // Warn if no way to exit conversation (all paths loop)
    if (!hasTerminalPath) {
      errors.push(
        'No terminal paths found - all conversation paths loop infinitely. ' +
          'Add at least one response with nextNodeId: null or empty responses array.'
      )
    }

    return errors
  }

  /**
   * Load a dialog tree by ID (lazy loading)
   *
   * Dialog trees are loaded on-demand rather than at startup to reduce
   * initial app load time. Once loaded, trees are cached in memory.
   *
   * Validates tree structure and provides helpful error messages for
   * content creators.
   *
   * @param treeId - The dialog tree ID (must match filename in src/content/dialog-trees/)
   * @returns The dialog tree data, or null if loading/validation failed
   */
  async function loadDialogTree(treeId: string): Promise<DialogTree | null> {
    // Check cache first to avoid redundant file loads
    if (loadedDialogTrees.value.has(treeId)) {
      return loadedDialogTrees.value.get(treeId)!
    }

    try {
      // Dynamically import the dialog tree file by ID
      // File must exist at: src/content/dialog-trees/{treeId}.json
      const module = await import(`../content/dialog-trees/${treeId}.json`)
      const tree = module.default as DialogTree

      // Validate tree has required fields
      if (!tree.id || !tree.characterName || !tree.startNodeId || !tree.nodes) {
        console.error(`Invalid dialog tree ${treeId}: missing required fields`)
        const notificationsStore = useNotificationsStore()
        notificationsStore.showError('Dialog Tree Error', `Invalid tree: ${treeId}`, 8000)
        return null
      }

      // Validate tree structure
      const validationErrors = validateDialogTree(tree, treeId)
      if (validationErrors.length > 0) {
        console.error(`Dialog tree ${treeId} validation failed:`)
        validationErrors.forEach((error) => console.error(`  - ${error}`))
        const notificationsStore = useNotificationsStore()
        notificationsStore.showError(
          'Dialog Tree Error',
          `Tree ${treeId} has ${validationErrors.length} validation error(s). Check console.`,
          10000
        )
        return null
      }

      // Cache the loaded dialog tree for future use
      loadedDialogTrees.value.set(treeId, tree)
      return tree
    } catch (error) {
      console.error(`Failed to load dialog tree ${treeId}:`, error)
      const notificationsStore = useNotificationsStore()
      notificationsStore.showError('Dialog Tree Error', `Missing tree: ${treeId}`, 8000)
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
   *
   * Loads the dialog JSON file on-demand (if not already cached) and adds it
   * to the modal queue. Also starts tracking this conversation for history.
   *
   * Conversation tracking allows future features like:
   * - Dialog history viewer
   * - Branching dialog trees with player choices
   * - Replaying past conversations
   *
   * @param dialogId - The dialog ID (must match filename in src/content/dialogs/)
   */
  async function showDialog(dialogId: string): Promise<void> {
    const dialog = await loadDialog(dialogId)
    if (!dialog) {
      return
    }

    // Start new conversation for this dialog
    // conversationId groups related dialogs (e.g., multi-part conversations)
    const conversationId = dialog.conversationId || dialogId
    activeConversation.value = {
      conversationId,
      characterName: dialog.characterName,
      transcript: [],
      startedAt: new Date(),
    }

    // Add the NPC's message to the conversation transcript
    // Future: Player responses would also be added here
    addDialogEntry({
      speaker: 'npc',
      speakerName: dialog.characterName,
      message: dialog.message,
      timestamp: new Date(),
    })

    // Add to modal queue for display
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

    const conversationId = activeConversation.value.conversationId

    // Add to history
    dialogHistory.value.push(activeConversation.value)

    // Save to localStorage
    saveToLocalStorage(STORAGE_KEY_DIALOG_HISTORY, dialogHistory.value)

    // Update objectives based on completed dialog tree
    const objectivesStore = useObjectivesStore()
    if (conversationId === 'harbormaster-intro') {
      objectivesStore.completeObjective('talk-to-harbormaster')
      // Unlock Academy hex and reveal surrounding hexes
      const worldMapStore = useWorldMapStore()
      worldMapStore.exploreTile(0, 0) // Academy at (0, 0)
      // Trigger tutorial for navigating to World Map
      showTutorial('area-to-world')
    } else if (conversationId === 'headmaster-intro') {
      objectivesStore.completeObjective('talk-to-headmaster')
    } else if (conversationId === 'foundry-master-intro') {
      objectivesStore.updateSubtask('explore-features', 'visit-foundry', true)
    } else if (conversationId === 'quartermaster-intro') {
      objectivesStore.updateSubtask('explore-features', 'visit-quartermaster', true)
    } else if (conversationId === 'tavern-keeper-intro') {
      objectivesStore.updateSubtask('explore-features', 'visit-tavern', true)
    }

    // Clear active conversation
    activeConversation.value = null
  }

  /**
   * Show a dialog tree (branching conversation with player choices)
   *
   * Loads the dialog tree, starts tracking conversation history, and
   * begins navigation at the start node.
   *
   * @param treeId - The dialog tree ID (must match filename in src/content/dialog-trees/)
   */
  async function showDialogTree(treeId: string): Promise<void> {
    const tree = await loadDialogTree(treeId)
    if (!tree) {
      return
    }

    startDialogTree(tree)
  }

  /**
   * Preview a dialog tree (for use in dialog editor)
   *
   * Directly displays a dialog tree object without loading from file.
   * Used by the dialog editor dev tool to preview trees being edited.
   *
   * @param tree - The dialog tree object to preview
   */
  function previewDialogTree(tree: DialogTree): void {
    startDialogTree(tree)
  }

  /**
   * Internal helper to start a dialog tree conversation
   *
   * Sets up the active tree, conversation tracking, and displays the modal.
   * Used by both showDialogTree (from file) and previewDialogTree (direct object).
   *
   * @param tree - The dialog tree to start
   */
  function startDialogTree(tree: DialogTree): void {
    console.log('[Dialog Tree] startDialogTree called for:', tree.id)
    console.log('[Dialog Tree] activeDialogTree before:', activeDialogTree.value?.id)
    console.log('[Dialog Tree] Queue length before:', modalQueue.value.length)
    if (modalQueue.value.length > 0) {
      const existingModal = modalQueue.value[0]
      const modalId =
        existingModal.type === 'tutorial' ? existingModal.modal.title : existingModal.modal.id
      console.log('[Dialog Tree] Existing modal in queue:', existingModal.type, modalId)
    }

    // Set active dialog tree and start at the beginning
    activeDialogTree.value = tree
    currentNodeId.value = tree.startNodeId

    console.log('[Dialog Tree] activeDialogTree after:', activeDialogTree.value?.id)
    console.log('[Dialog Tree] currentNodeId:', currentNodeId.value)

    // Start new conversation for this dialog tree
    activeConversation.value = {
      conversationId: tree.id,
      characterName: tree.characterName,
      transcript: [],
      startedAt: new Date(),
    }

    // Add the first NPC message to conversation transcript
    const startNode = tree.nodes[tree.startNodeId]
    if (startNode) {
      addDialogEntry({
        speaker: 'npc',
        speakerName: tree.characterName,
        message: startNode.message,
        timestamp: new Date(),
      })
    }

    // Add a placeholder to the modal queue to trigger display
    // The UI will check for activeDialogTree and display the tree instead
    modalQueue.value.push({
      type: 'dialog',
      modal: {
        id: tree.id,
        characterName: tree.characterName,
        portrait: tree.portrait,
        message: startNode.message,
        conversationId: tree.id,
      },
    })

    console.log('[Dialog Tree] Queue length after push:', modalQueue.value.length)
    console.log('[Dialog Tree] Modal pushed to queue with message:', startNode.message.substring(0, 50))
  }

  /**
   * Handle player selecting a response in a dialog tree
   *
   * Records the player's choice, navigates to the next node,
   * and updates the conversation transcript.
   *
   * @param responseIndex - Index of the response the player selected
   */
  function selectPlayerResponse(responseIndex: number): void {
    if (!activeDialogTree.value || !currentNodeId.value) {
      console.warn('No active dialog tree to navigate')
      return
    }

    const node = activeDialogTree.value.nodes[currentNodeId.value]
    if (!node) {
      console.error(`Current node ${currentNodeId.value} not found in tree`)
      return
    }

    const response = node.responses[responseIndex]
    if (!response) {
      console.error(`Response ${responseIndex} not found in node ${currentNodeId.value}`)
      return
    }

    // Add player's choice to conversation transcript
    addDialogEntry({
      speaker: 'player',
      speakerName: 'You',
      message: response.text,
      timestamp: new Date(),
    })

    // Check if conversation ends (nextNodeId is null)
    if (response.nextNodeId === null) {
      console.log('[Dialog Tree] Response ends conversation, clearing state')
      // End the conversation
      completeConversation()
      // Close the modal FIRST before clearing tree state
      // This prevents a brief render where isDialogTree=false but modal still in queue
      modalQueue.value.shift()
      console.log('[Dialog Tree] Queue after shift:', modalQueue.value.length)
      // Now clear the dialog tree state
      activeDialogTree.value = null
      currentNodeId.value = null
      console.log('[Dialog Tree] Cleared activeDialogTree and currentNodeId')
      return
    }

    // Navigate to next node
    currentNodeId.value = response.nextNodeId
    const nextNode = activeDialogTree.value.nodes[response.nextNodeId]

    if (!nextNode) {
      console.error(`Next node ${response.nextNodeId} not found in tree`)
      return
    }

    // Add next NPC message to conversation transcript
    addDialogEntry({
      speaker: 'npc',
      speakerName: activeDialogTree.value.characterName,
      message: nextNode.message,
      timestamp: new Date(),
    })

    // Update the modal queue with new message (for UI reactivity)
    // Keep the modal in queue but update its content
    if (modalQueue.value.length > 0 && modalQueue.value[0].type === 'dialog') {
      modalQueue.value[0].modal.message = nextNode.message
    }
  }

  /**
   * Close the current modal and handle completion
   *
   * This is called when the user dismisses a modal (clicks "Got it!" or "Continue").
   * Handles different cleanup tasks based on modal type:
   * - Tutorial: Mark as completed and save to localStorage
   * - Dialog: Save conversation to history and clear dialog tree state if this modal is the active tree
   *
   * After cleanup, the modal is removed from the queue and the next modal
   * (if any) will automatically be displayed via the currentModal computed property.
   */
  function closeCurrentModal(): void {
    const current = currentModal.value
    if (!current) {
      return
    }

    const modalId = current.type === 'tutorial' ? current.modal.title : current.modal.id
    console.log('[Modal] Closing modal:', current.type, modalId)

    // Handle tutorial completion tracking
    if (current.type === 'tutorial') {
      markTutorialCompleted(current.modal.id)
    }

    // Handle dialog conversation history
    if (current.type === 'dialog') {
      completeConversation()
    }

    console.log('[Modal] Before shift - queue length:', modalQueue.value.length, 'activeDialogTree:', activeDialogTree.value?.id)

    // Remove from queue FIRST (shift removes first element)
    // This must happen before clearing dialog tree state to prevent
    // a brief render where isDialogTree=false but modal still in queue
    modalQueue.value.shift()

    console.log('[Modal] After shift - queue length:', modalQueue.value.length)

    // Only clear dialog tree state if THIS modal was the active dialog tree
    // Check that we have an active tree and the modal we just closed matches it
    if (
      activeDialogTree.value !== null &&
      current.type === 'dialog' &&
      current.modal.id === activeDialogTree.value.id
    ) {
      console.log('[Modal] Clearing dialog tree state for:', activeDialogTree.value.id)
      activeDialogTree.value = null
      currentNodeId.value = null
    } else if (activeDialogTree.value !== null) {
      console.log(
        '[Modal] NOT clearing dialog tree state - closed modal was not the active tree',
        'closed:',
        current.modal.id,
        'active:',
        activeDialogTree.value.id
      )
    }
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
    loadedDialogTrees,
    activeConversation,
    interactedFeatures,
    activeDialogTree,
    currentNodeId,
    // Getters
    currentModal,
    hasSeenTutorial,
    hasCompletedDialogTree,
    hasInteractedWithFeature,
    conversationHistory,
    currentNode,
    currentPortrait,
    // Actions
    showTutorial,
    replayTutorial,
    showDialog,
    showDialogTree,
    previewDialogTree,
    loadDialogTree,
    selectPlayerResponse,
    addDialogEntry,
    completeConversation,
    closeCurrentModal,
    markTutorialCompleted,
    markFeatureInteracted,
    loadTutorials,
    initialize,
  }
})
