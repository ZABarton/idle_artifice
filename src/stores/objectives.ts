import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import type {
  Objective,
  ObjectiveStatus,
  ObjectiveCategory,
  UnlockCondition,
} from '@/types/objectives'
import objectivesConfig from '@/config/objectives.json'
import { useResourcesStore } from './resources'
import { useWorldMapStore } from './worldMap'
import { useNotificationsStore } from './notifications'
import { useTutorials } from '@/composables/useTutorials'

// LocalStorage key
const STORAGE_KEY_OBJECTIVES = 'idle-artifice-objectives'

// Track if we've shown storage warning to avoid spam
let hasShownStorageWarning = false

/**
 * Saved objectives progress (what gets persisted to localStorage)
 */
interface SavedObjectiveProgress {
  id: string
  status: ObjectiveStatus
  currentProgress?: number
  completedAt?: string // ISO date string
  subtasks?: Array<{
    id: string
    completed: boolean
  }>
}

interface SavedObjectivesState {
  objectives: SavedObjectiveProgress[]
  trackedObjectiveId: string | null
}

/**
 * Load saved objectives progress from localStorage
 */
function loadSavedProgress(): SavedObjectivesState | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_OBJECTIVES)
    if (stored) {
      return JSON.parse(stored) as SavedObjectivesState
    }
  } catch (error) {
    console.error('Failed to load objectives from localStorage:', error)
  }
  return null
}

/**
 * Merge saved progress with config objectives
 * Config is the source of truth for objective definitions,
 * but saved progress overlays completion status, subtask progress, etc.
 */
function mergeObjectivesWithProgress(
  configObjectives: Objective[],
  savedProgress: SavedObjectivesState | null
): Objective[] {
  if (!savedProgress) {
    return configObjectives
  }

  const progressMap = new Map(savedProgress.objectives.map((p) => [p.id, p]))

  return configObjectives.map((configObj) => {
    const saved = progressMap.get(configObj.id)
    if (!saved) {
      return configObj
    }

    // Merge saved progress with config definition
    const merged: Objective = {
      ...configObj,
      status: saved.status,
      currentProgress: saved.currentProgress ?? configObj.currentProgress,
      completedAt: saved.completedAt ? new Date(saved.completedAt) : undefined,
    }

    // Merge subtask completion states
    if (merged.subtasks && saved.subtasks) {
      const subtaskMap = new Map(saved.subtasks.map((st) => [st.id, st.completed]))
      merged.subtasks = merged.subtasks.map((st) => ({
        ...st,
        completed: subtaskMap.get(st.id) ?? st.completed,
      }))
    }

    return merged
  })
}

/**
 * Objectives Store
 * Manages player objectives (quests, goals, tasks)
 */
export const useObjectivesStore = defineStore('objectives', () => {
  // State
  const objectives = ref<Objective[]>([])
  const trackedObjectiveId = ref<string | null>(null)

  // Getters

  /**
   * Get a specific objective by ID
   */
  const getObjectiveById = computed(() => (id: string) => {
    return objectives.value.find((obj) => obj.id === id)
  })

  /**
   * Get the currently tracked objective
   */
  const getTrackedObjective = computed(() => {
    if (!trackedObjectiveId.value) {
      return null
    }
    return objectives.value.find((obj) => obj.id === trackedObjectiveId.value)
  })

  /**
   * Get all objectives that are not hidden
   */
  const visibleObjectives = computed(() => {
    return objectives.value.filter((obj) => obj.status !== 'hidden')
  })

  /**
   * Get objectives filtered by status
   * By default, excludes hidden objectives
   */
  const getObjectivesByStatus = computed(() => (status: ObjectiveStatus, includeHidden = false) => {
    if (includeHidden) {
      return objectives.value.filter((obj) => obj.status === status)
    }
    return objectives.value.filter((obj) => obj.status === status && obj.status !== 'hidden')
  })

  /**
   * Get objectives filtered by category
   */
  const getObjectivesByCategory = computed(() => (category: ObjectiveCategory) => {
    return objectives.value.filter((obj) => obj.category === category && obj.status !== 'hidden')
  })

  /**
   * Get all visible objectives ordered by category and order
   * Main objectives first (sorted by order), then Secondary objectives (sorted by order)
   */
  const getOrderedObjectives = computed(() => {
    const visible = visibleObjectives.value
    const main = visible.filter((obj) => obj.category === 'main').sort((a, b) => a.order - b.order)
    const secondary = visible
      .filter((obj) => obj.category === 'secondary')
      .sort((a, b) => a.order - b.order)
    return [...main, ...secondary]
  })

  // Actions

  /**
   * Load objectives from config file and initialize store
   * Merges config definitions with saved progress from localStorage
   */
  function loadObjectivesFromConfig() {
    // Parse objectives from config
    const parsedObjectives: Objective[] = objectivesConfig.objectives.map((obj: any) => ({
      ...obj,
      // Convert completedAt string to Date if present
      completedAt: obj.completedAt ? new Date(obj.completedAt) : undefined,
    }))

    // Load saved progress and merge with config
    const savedProgress = loadSavedProgress()
    objectives.value = mergeObjectivesWithProgress(parsedObjectives, savedProgress)

    // Restore tracked objective ID if available, otherwise auto-select first unfinished main objective
    if (savedProgress?.trackedObjectiveId) {
      const trackedObj = objectives.value.find((obj) => obj.id === savedProgress.trackedObjectiveId)
      // Only restore if the objective still exists and is not completed
      if (trackedObj && trackedObj.status !== 'completed') {
        trackedObjectiveId.value = savedProgress.trackedObjectiveId
      } else {
        // Fall back to auto-select
        const firstUnfinishedMain = objectives.value.find(
          (obj) => obj.category === 'main' && obj.status !== 'completed'
        )
        trackedObjectiveId.value = firstUnfinishedMain?.id ?? null
      }
    } else {
      // Auto-select first unfinished main objective as tracked
      const firstUnfinishedMain = objectives.value.find(
        (obj) => obj.category === 'main' && obj.status !== 'completed'
      )
      trackedObjectiveId.value = firstUnfinishedMain?.id ?? null
    }
  }

  /**
   * Set which objective is currently tracked (displayed in status column)
   */
  function setTrackedObjective(id: string): boolean {
    const objective = objectives.value.find((obj) => obj.id === id)
    if (!objective || objective.status === 'hidden') {
      return false
    }
    trackedObjectiveId.value = id
    return true
  }

  /**
   * Update progress on an objective with currentProgress/maxProgress tracking
   */
  function updateProgress(id: string, progress: number): boolean {
    const objective = objectives.value.find((obj) => obj.id === id)
    if (!objective || objective.currentProgress === undefined) {
      return false
    }

    objective.currentProgress = Math.max(0, Math.min(progress, objective.maxProgress || Infinity))

    // Auto-complete if progress reaches max
    if (objective.maxProgress && objective.currentProgress >= objective.maxProgress) {
      completeObjective(id)
    }

    return true
  }

  /**
   * Update a specific subtask's completion status
   */
  function updateSubtask(objectiveId: string, subtaskId: string, completed: boolean): boolean {
    const objective = objectives.value.find((obj) => obj.id === objectiveId)
    if (!objective || !objective.subtasks) {
      return false
    }

    const subtask = objective.subtasks.find((st) => st.id === subtaskId)
    if (!subtask) {
      return false
    }

    subtask.completed = completed

    // Auto-complete objective if all subtasks are complete
    if (objective.subtasks.every((st) => st.completed)) {
      completeObjective(objectiveId)
    }

    return true
  }

  /**
   * Mark an objective as completed with timestamp
   */
  function completeObjective(id: string): boolean {
    const objective = objectives.value.find((obj) => obj.id === id)
    if (!objective || objective.status === 'completed') {
      return false
    }

    objective.status = 'completed'
    objective.completedAt = new Date()

    // Show completion notification
    const notificationsStore = useNotificationsStore()
    notificationsStore.showSuccess(`Objective Complete: ${objective.title}`, objective.description)

    // Trigger any tutorials associated with this objective completion
    const { triggerObjectiveTutorial } = useTutorials()
    triggerObjectiveTutorial(id)

    // Evaluate discovery conditions to potentially reveal new objectives
    evaluateDiscoveryConditions()

    // Auto-switch to next main objective if the completed one was tracked
    if (trackedObjectiveId.value === id) {
      // Find next uncompleted main objective in order
      const nextMainObjective = objectives.value
        .filter((obj) => obj.category === 'main' && obj.status === 'active')
        .sort((a, b) => a.order - b.order)[0]

      if (nextMainObjective) {
        trackedObjectiveId.value = nextMainObjective.id
      } else {
        // No more main objectives, clear tracked objective
        trackedObjectiveId.value = null
      }
    }

    return true
  }

  /**
   * Check all hidden objectives and reveal those whose discovery conditions are met
   */
  function evaluateDiscoveryConditions() {
    const hiddenObjectives = objectives.value.filter((obj) => obj.status === 'hidden')

    hiddenObjectives.forEach((objective) => {
      if (!objective.discoveryConditions || objective.discoveryConditions.length === 0) {
        return
      }

      // All discovery conditions must be met
      const allConditionsMet = objective.discoveryConditions.every((condition) =>
        checkDiscoveryCondition(condition)
      )

      if (allConditionsMet) {
        objective.status = 'active'
      }
    })
  }

  /**
   * Check if a single discovery condition is met
   */
  function checkDiscoveryCondition(condition: UnlockCondition): boolean {
    switch (condition.type) {
      case 'objective': {
        // Check if the specified objective is completed
        const targetObjective = objectives.value.find((obj) => obj.id === condition.id)
        return targetObjective?.status === 'completed'
      }

      case 'resource': {
        // Check if player has enough of the specified resource
        const resourcesStore = useResourcesStore()
        return resourcesStore.hasResource(condition.id, condition.value || 0)
      }

      case 'location': {
        // Check if the specified location has been explored
        // condition.id should be in format "q,r" (e.g., "0,0")
        const worldMapStore = useWorldMapStore()
        const [q, r] = condition.id.split(',').map(Number)
        const tile = worldMapStore.getTileAt(q, r)
        return tile?.explorationStatus === 'explored'
      }

      case 'feature': {
        // Stubbed for now - feature interaction tracking not yet implemented
        return false
      }

      case 'custom': {
        // Stubbed for now - custom conditions evaluated case-by-case
        return false
      }

      default:
        return false
    }
  }

  /**
   * Unlock an objective (make it visible/active)
   * Used when discovery conditions are met
   */
  function unlockObjective(id: string): boolean {
    const objective = objectives.value.find((obj) => obj.id === id)
    if (!objective || objective.status !== 'hidden') {
      return false
    }

    objective.status = 'active'
    return true
  }

  /**
   * Save objectives progress to localStorage
   */
  function saveObjectives(): void {
    try {
      const progress: SavedObjectivesState = {
        objectives: objectives.value.map((obj) => ({
          id: obj.id,
          status: obj.status,
          currentProgress: obj.currentProgress,
          completedAt: obj.completedAt?.toISOString(),
          subtasks: obj.subtasks?.map((st) => ({
            id: st.id,
            completed: st.completed,
          })),
        })),
        trackedObjectiveId: trackedObjectiveId.value,
      }

      localStorage.setItem(STORAGE_KEY_OBJECTIVES, JSON.stringify(progress))
    } catch (error) {
      console.error('Failed to save objectives to localStorage:', error)

      // Show warning once per session
      if (!hasShownStorageWarning) {
        console.warn('Unable to save objective progress. Check browser storage settings.')
        hasShownStorageWarning = true
      }
    }
  }

  /**
   * Reset objectives to default state from config (for debug/testing)
   */
  function resetObjectives(): void {
    try {
      localStorage.removeItem(STORAGE_KEY_OBJECTIVES)
    } catch (error) {
      console.error('Failed to remove objectives from localStorage:', error)
    }
    // Reload from config
    loadObjectivesFromConfig()
  }

  // Watch for changes and auto-save to localStorage
  watch(
    [objectives, trackedObjectiveId],
    () => {
      saveObjectives()
    },
    { deep: true }
  )

  // Initialize on store creation
  loadObjectivesFromConfig()

  return {
    // State
    objectives,
    trackedObjectiveId,
    // Getters
    getObjectiveById,
    getTrackedObjective,
    visibleObjectives,
    getObjectivesByStatus,
    getObjectivesByCategory,
    getOrderedObjectives,
    // Actions
    loadObjectivesFromConfig,
    setTrackedObjective,
    updateProgress,
    updateSubtask,
    completeObjective,
    unlockObjective,
    evaluateDiscoveryConditions,
    checkDiscoveryCondition,
    resetObjectives,
  }
})
