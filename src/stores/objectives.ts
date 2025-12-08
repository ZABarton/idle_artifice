import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Objective, ObjectiveStatus, ObjectiveCategory, UnlockCondition } from '@/types/objectives'
import objectivesConfig from '@/config/objectives.json'
import { useResourcesStore } from './resources'
import { useWorldMapStore } from './worldMap'
import { useNotificationsStore } from './notifications'

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
    const secondary = visible.filter((obj) => obj.category === 'secondary').sort((a, b) => a.order - b.order)
    return [...main, ...secondary]
  })

  // Actions

  /**
   * Load objectives from config file and initialize store
   */
  function loadObjectivesFromConfig() {
    // Parse objectives from config
    const parsedObjectives: Objective[] = objectivesConfig.objectives.map((obj: any) => ({
      ...obj,
      // Convert completedAt string to Date if present
      completedAt: obj.completedAt ? new Date(obj.completedAt) : undefined,
    }))

    objectives.value = parsedObjectives

    // Auto-select first unfinished main objective as tracked
    const firstUnfinishedMain = objectives.value.find(
      (obj) => obj.category === 'main' && obj.status !== 'completed'
    )
    if (firstUnfinishedMain) {
      trackedObjectiveId.value = firstUnfinishedMain.id
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
    notificationsStore.showSuccess(
      `Objective Complete: ${objective.title}`,
      objective.description
    )

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
    evaluateDiscoveryConditions,
    checkDiscoveryCondition,
  }
})
