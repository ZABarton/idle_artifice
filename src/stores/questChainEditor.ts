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
} from '@/types/questChainEditor'
import { useQuestChainGraph } from '@/composables/useQuestChainGraph'

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
    searchQuery: '',
    categoryFilter: 'all',
  })

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

  // Node type counts
  const nodeCounts = computed(() => {
    if (!graph.value) {
      return {
        objectives: 0,
        dialogTrees: 0,
        tutorials: 0,
        dialogTriggers: 0,
        areaTriggers: 0,
        total: 0,
      }
    }

    return {
      objectives: graph.value.nodes.filter((n) => n.type === 'objective').length,
      dialogTrees: graph.value.nodes.filter((n) => n.type === 'dialog-tree').length,
      tutorials: graph.value.nodes.filter((n) => n.type === 'tutorial').length,
      dialogTriggers: graph.value.nodes.filter((n) => n.type === 'dialog-trigger').length,
      areaTriggers: graph.value.nodes.filter((n) => n.type === 'area-trigger').length,
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
      searchQuery: '',
      categoryFilter: 'all',
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

    // Getters
    selectedNode,
    filteredNodes,
    filteredEdges,
    hasErrors,
    hasWarnings,
    errorCount,
    warningCount,
    nodeCounts,

    // Actions
    loadGraph,
    selectNode,
    updateFilters,
    toggleNodeTypeFilter,
    setSearchQuery,
    saveNodePosition,
    getNodeIssues,
    resetEditor,
  }
})
