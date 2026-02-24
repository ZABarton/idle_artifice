/**
 * Quest Chain Editor Store
 *
 * Manages state for the quest chain editor including graph data,
 * selection, filtering, and validation.
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
  QuestChainNode,
  QuestChainEdge,
  QuestChainGraph,
  QuestChainValidationIssue,
  QuestChainFilters,
  NodePosition,
  ObjectiveNodeData,
} from '@/types/questChainEditor'
import { useQuestChainGraph } from '@/composables/useQuestChainGraph'

/**
 * Objective data structure for editing (matches objectives.json schema)
 */
export interface ObjectiveEditData {
  id: string
  title: string
  description: string
  status: 'active' | 'hidden' | 'completed'
  category: 'main' | 'secondary'
  order: number
  targetLocation?: string
  currentProgress?: number
  maxProgress?: number
  discoveryConditions?: Array<{
    type: string
    id?: string
    description?: string
  }>
  subtasks?: Array<{
    id: string
    description: string
    completed: boolean
    featureId?: string
  }>
}

export const useQuestChainEditorStore = defineStore('questChainEditor', () => {
  // Graph composable
  const graphComposable = useQuestChainGraph()

  // State
  const graph = ref<QuestChainGraph | null>(null)
  const selectedNodeId = ref<string | null>(null)
  const validationIssues = ref<QuestChainValidationIssue[]>([])
  const nodePositions = ref<Map<string, NodePosition>>(new Map())
  const isLoading = ref(false)

  // Filters
  const filters = ref<QuestChainFilters>({
    showObjectives: true,
    showDialogTrees: true,
    showTutorials: true,
    showDialogTriggers: true,
    showAreaTriggers: true,
    showGameEvents: true,
    showFeatures: true,
    searchQuery: '',
    categoryFilter: 'all',
  })

  // Editing state
  const isEditMode = ref(false)
  const isSaving = ref(false)
  const pendingObjectiveChanges = ref<Map<string, Partial<ObjectiveEditData>>>(new Map())

  // Getters
  const selectedNode = computed(() => {
    if (!graph.value || !selectedNodeId.value) return null
    return graph.value.nodes.find((n) => n.id === selectedNodeId.value) || null
  })

  const filteredNodes = computed(() => {
    if (!graph.value) return []

    return graph.value.nodes.filter((node) => {
      // Type filters
      if (node.type === 'objective' && !filters.value.showObjectives) return false
      if (node.type === 'dialog-tree' && !filters.value.showDialogTrees) return false
      if (node.type === 'tutorial' && !filters.value.showTutorials) return false
      if (node.type === 'dialog-trigger' && !filters.value.showDialogTriggers) return false
      if (node.type === 'area-trigger' && !filters.value.showAreaTriggers) return false
      if (node.type === 'game-event' && !filters.value.showGameEvents) return false
      if (node.type === 'feature' && !filters.value.showFeatures) return false

      // Category filter (only applies to objectives)
      if (filters.value.categoryFilter !== 'all' && node.type === 'objective') {
        const data = node.data as { category: string }
        if (data.category !== filters.value.categoryFilter) return false
      }

      // Search filter
      if (filters.value.searchQuery) {
        const query = filters.value.searchQuery.toLowerCase()
        const matchesLabel = node.label.toLowerCase().includes(query)
        const matchesDescription = node.description?.toLowerCase().includes(query)
        const matchesId = node.id.toLowerCase().includes(query)
        if (!matchesLabel && !matchesDescription && !matchesId) return false
      }

      return true
    })
  })

  const filteredEdges = computed(() => {
    if (!graph.value) return []

    const visibleNodeIds = new Set(filteredNodes.value.map((n) => n.id))

    return graph.value.edges.filter((edge) => {
      return visibleNodeIds.has(edge.source) && visibleNodeIds.has(edge.target)
    })
  })

  const hasErrors = computed(() => {
    return validationIssues.value.some((issue) => issue.type === 'error')
  })

  const hasWarnings = computed(() => {
    return validationIssues.value.some((issue) => issue.type === 'warning')
  })

  const errorCount = computed(() => {
    return validationIssues.value.filter((issue) => issue.type === 'error').length
  })

  const warningCount = computed(() => {
    return validationIssues.value.filter((issue) => issue.type === 'warning').length
  })

  // Editing getters
  const isDirty = computed(() => pendingObjectiveChanges.value.size > 0)
  const pendingChangeCount = computed(() => pendingObjectiveChanges.value.size)

  // Node type counts
  const nodeCounts = computed(() => {
    if (!graph.value) {
      return {
        objectives: 0,
        dialogTrees: 0,
        tutorials: 0,
        dialogTriggers: 0,
        areaTriggers: 0,
        gameEvents: 0,
        features: 0,
        total: 0,
      }
    }

    return {
      objectives: graph.value.nodes.filter((n) => n.type === 'objective').length,
      dialogTrees: graph.value.nodes.filter((n) => n.type === 'dialog-tree').length,
      tutorials: graph.value.nodes.filter((n) => n.type === 'tutorial').length,
      dialogTriggers: graph.value.nodes.filter((n) => n.type === 'dialog-trigger').length,
      areaTriggers: graph.value.nodes.filter((n) => n.type === 'area-trigger').length,
      gameEvents: graph.value.nodes.filter((n) => n.type === 'game-event').length,
      features: graph.value.nodes.filter((n) => n.type === 'feature').length,
      total: graph.value.nodes.length,
    }
  })

  // Actions

  /**
   * Load and build the quest chain graph
   */
  async function loadGraph(): Promise<void> {
    isLoading.value = true

    try {
      graph.value = await graphComposable.buildGraph()
      validationIssues.value = graphComposable.validateGraph(graph.value)
      selectedNodeId.value = null
      nodePositions.value.clear()
    } catch (e) {
      console.error('Failed to load quest chain graph:', e)
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Select a node by ID
   */
  function selectNode(nodeId: string | null): void {
    selectedNodeId.value = nodeId
  }

  /**
   * Update filters
   */
  function updateFilters(newFilters: Partial<QuestChainFilters>): void {
    filters.value = { ...filters.value, ...newFilters }
  }

  /**
   * Toggle a node type filter
   */
  function toggleNodeTypeFilter(
    nodeType: 'objectives' | 'dialogTrees' | 'tutorials' | 'dialogTriggers' | 'areaTriggers'
  ): void {
    const filterKey = `show${nodeType.charAt(0).toUpperCase() + nodeType.slice(1)}` as keyof QuestChainFilters
    if (typeof filters.value[filterKey] === 'boolean') {
      ;(filters.value as Record<string, boolean | string>)[filterKey] = !filters.value[filterKey]
    }
  }

  /**
   * Set search query
   */
  function setSearchQuery(query: string): void {
    filters.value.searchQuery = query
  }

  /**
   * Save node position (for graph layout)
   */
  function saveNodePosition(nodeId: string, x: number, y: number): void {
    nodePositions.value.set(nodeId, { x, y })
  }

  /**
   * Get issues for a specific node
   */
  function getNodeIssues(nodeId: string): QuestChainValidationIssue[] {
    return validationIssues.value.filter((issue) => issue.nodeId === nodeId)
  }

  /**
   * Reset the editor state
   */
  function resetEditor(): void {
    graph.value = null
    selectedNodeId.value = null
    validationIssues.value = []
    nodePositions.value.clear()
    filters.value = {
      showObjectives: true,
      showDialogTrees: true,
      showTutorials: true,
      showDialogTriggers: true,
      showAreaTriggers: true,
      showGameEvents: true,
      showFeatures: true,
      searchQuery: '',
      categoryFilter: 'all',
    }
    isEditMode.value = false
    pendingObjectiveChanges.value.clear()
  }

  // ==================== Editing Actions ====================

  /**
   * Toggle edit mode
   */
  function setEditMode(enabled: boolean): void {
    isEditMode.value = enabled
  }

  /**
   * Update an objective with pending changes
   */
  function updateObjective(objectiveId: string, changes: Partial<ObjectiveEditData>): void {
    const existing = pendingObjectiveChanges.value.get(objectiveId) || {}
    pendingObjectiveChanges.value.set(objectiveId, { ...existing, ...changes })

    // Also update the graph node data for immediate visual feedback
    if (graph.value) {
      const node = graph.value.nodes.find((n) => n.id === `objective:${objectiveId}`)
      if (node && node.data) {
        const nodeData = node.data as ObjectiveNodeData
        if (changes.title !== undefined) {
          nodeData.title = changes.title
          node.label = changes.title
        }
        if (changes.description !== undefined) {
          nodeData.description = changes.description
        }
        if (changes.status !== undefined) {
          nodeData.status = changes.status
        }
        if (changes.category !== undefined) {
          nodeData.category = changes.category
        }
        if (changes.targetLocation !== undefined) {
          nodeData.targetLocation = changes.targetLocation
        }
      }
    }
  }

  /**
   * Get pending changes for an objective
   */
  function getPendingChanges(objectiveId: string): Partial<ObjectiveEditData> | undefined {
    return pendingObjectiveChanges.value.get(objectiveId)
  }

  /**
   * Discard all pending changes
   */
  function discardChanges(): void {
    pendingObjectiveChanges.value.clear()
    // Reload graph to restore original data
    loadGraph()
  }

  /**
   * Save all pending objective changes to the server
   */
  async function saveObjectiveChanges(): Promise<boolean> {
    if (pendingObjectiveChanges.value.size === 0) return true

    isSaving.value = true

    try {
      const response = await fetch('/api/dev/save-objectives', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          changes: Object.fromEntries(pendingObjectiveChanges.value),
        }),
      })

      if (!response.ok) {
        const error = await response.text()
        console.error('Failed to save objectives:', error)
        return false
      }

      // Clear pending changes after successful save
      // Note: We don't reload the graph because:
      // 1. The in-memory graph is already up-to-date (updateObjective updates it)
      // 2. Vite caches static imports, so loadGraph would get stale data anyway
      pendingObjectiveChanges.value.clear()

      return true
    } catch (e) {
      console.error('Failed to save objectives:', e)
      return false
    } finally {
      isSaving.value = false
    }
  }

  return {
    // State
    graph,
    selectedNodeId,
    validationIssues,
    nodePositions,
    isLoading,
    filters,
    isEditMode,
    isSaving,
    pendingObjectiveChanges,

    // Getters
    selectedNode,
    filteredNodes,
    filteredEdges,
    hasErrors,
    hasWarnings,
    errorCount,
    warningCount,
    nodeCounts,
    isDirty,
    pendingChangeCount,

    // Actions
    loadGraph,
    selectNode,
    updateFilters,
    toggleNodeTypeFilter,
    setSearchQuery,
    saveNodePosition,
    getNodeIssues,
    resetEditor,
    setEditMode,
    updateObjective,
    getPendingChanges,
    discardChanges,
    saveObjectiveChanges,
  }
})
