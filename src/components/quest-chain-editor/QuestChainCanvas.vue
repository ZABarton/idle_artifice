<script setup lang="ts">
import { computed, watch, onMounted } from 'vue'
import { VueFlow, useVueFlow, Panel } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { Controls } from '@vue-flow/controls'
import { MiniMap } from '@vue-flow/minimap'
import { useQuestChainEditorStore } from '@/stores/questChainEditor'
import ObjectiveNode from './nodes/ObjectiveNode.vue'
import DialogTreeNode from './nodes/DialogTreeNode.vue'
import TutorialNode from './nodes/TutorialNode.vue'
import TriggerNode from './nodes/TriggerNode.vue'
import type { Node, Edge } from '@vue-flow/core'
import type {
  ObjectiveNodeData,
  DialogTreeNodeData,
  TutorialNodeData,
  DialogTriggerNodeData,
  AreaTriggerNodeData,
} from '@/types/questChainEditor'

const store = useQuestChainEditorStore()
const { onNodeClick, fitView } = useVueFlow()

// Edge colors by type
const edgeColors: Record<string, string> = {
  unlocks: '#1976d2',
  triggers: '#7b1fa2',
  completes: '#388e3c',
  requires: '#f57c00',
  shows: '#0288d1',
}

// Convert store nodes to Vue Flow nodes
const nodes = computed<Node[]>(() => {
  const result: Node[] = []
  const nodeIssues = new Map<string, { hasError: boolean; hasWarning: boolean }>()

  // Map validation issues to nodes
  for (const issue of store.validationIssues) {
    if (issue.nodeId) {
      const existing = nodeIssues.get(issue.nodeId) || { hasError: false, hasWarning: false }
      if (issue.type === 'error') existing.hasError = true
      if (issue.type === 'warning') existing.hasWarning = true
      nodeIssues.set(issue.nodeId, existing)
    }
  }

  for (const node of store.filteredNodes) {
    const position = store.nodePositions.get(node.id) || { x: 0, y: 0 }
    const issues = nodeIssues.get(node.id) || { hasError: false, hasWarning: false }

    let nodeType = 'objectiveNode'
    let nodeData: Record<string, unknown> = {}

    switch (node.type) {
      case 'objective':
        nodeType = 'objectiveNode'
        nodeData = {
          nodeId: node.id,
          label: node.label,
          nodeData: node.data as ObjectiveNodeData,
          isSelected: store.selectedNodeId === node.id,
          hasError: issues.hasError,
          hasWarning: issues.hasWarning,
        }
        break
      case 'dialog-tree':
        nodeType = 'dialogTreeNode'
        nodeData = {
          nodeId: node.id,
          label: node.label,
          nodeData: node.data as DialogTreeNodeData,
          isSelected: store.selectedNodeId === node.id,
          hasError: issues.hasError,
          hasWarning: issues.hasWarning,
        }
        break
      case 'tutorial':
        nodeType = 'tutorialNode'
        nodeData = {
          nodeId: node.id,
          label: node.label,
          nodeData: node.data as TutorialNodeData,
          isSelected: store.selectedNodeId === node.id,
          hasError: issues.hasError,
          hasWarning: issues.hasWarning,
        }
        break
      case 'dialog-trigger':
      case 'area-trigger':
        nodeType = 'triggerNode'
        nodeData = {
          nodeId: node.id,
          label: node.label,
          nodeType: node.type,
          nodeData: node.data as DialogTriggerNodeData | AreaTriggerNodeData,
          isSelected: store.selectedNodeId === node.id,
          hasError: issues.hasError,
          hasWarning: issues.hasWarning,
        }
        break
    }

    result.push({
      id: node.id,
      type: nodeType,
      position,
      data: nodeData,
    })
  }

  return result
})

// Convert store edges to Vue Flow edges
const edges = computed<Edge[]>(() => {
  return store.filteredEdges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    type: 'smoothstep',
    animated: edge.type === 'triggers',
    label: edge.label,
    labelStyle: { fontSize: '10px', fill: '#666' },
    labelBgStyle: { fill: '#fff', fillOpacity: 0.8 },
    style: {
      stroke: edgeColors[edge.type] || '#888',
      strokeWidth: 2,
    },
    markerEnd: {
      type: 'arrowclosed',
      color: edgeColors[edge.type] || '#888',
    },
  }))
})

// Handle node click
onNodeClick((event) => {
  store.selectNode(event.node.id)
})

// Handle node drag
function handleNodeDragStop(event: { node: Node }) {
  store.saveNodePosition(event.node.id, event.node.position.x, event.node.position.y)
}

// Auto-layout nodes in a hierarchical structure
function performAutoLayout() {
  if (!store.graph) return

  const incomingEdges = new Map<string, string[]>()
  const outgoingEdges = new Map<string, string[]>()

  // Build edge maps
  for (const edge of store.filteredEdges) {
    if (!incomingEdges.has(edge.target)) incomingEdges.set(edge.target, [])
    if (!outgoingEdges.has(edge.source)) outgoingEdges.set(edge.source, [])
    incomingEdges.get(edge.target)!.push(edge.source)
    outgoingEdges.get(edge.source)!.push(edge.target)
  }

  // Find root nodes (no incoming edges)
  const roots = store.filteredNodes.filter(
    (n) => !incomingEdges.has(n.id) || incomingEdges.get(n.id)!.length === 0
  )

  // Assign levels using BFS
  const levels = new Map<string, number>()
  const queue = roots.map((r) => ({ id: r.id, level: 0 }))
  const visited = new Set<string>()

  while (queue.length > 0) {
    const { id, level } = queue.shift()!
    if (visited.has(id)) continue
    visited.add(id)
    levels.set(id, level)

    const children = outgoingEdges.get(id) || []
    for (const child of children) {
      if (!visited.has(child)) {
        queue.push({ id: child, level: level + 1 })
      }
    }
  }

  // Handle orphaned nodes
  for (const node of store.filteredNodes) {
    if (!levels.has(node.id)) {
      levels.set(node.id, 0)
    }
  }

  // Group nodes by level
  const levelGroups = new Map<number, string[]>()
  for (const [nodeId, level] of levels) {
    if (!levelGroups.has(level)) levelGroups.set(level, [])
    levelGroups.get(level)!.push(nodeId)
  }

  // Position nodes
  const nodeWidth = 220
  const nodeHeight = 120
  const levelGap = 150
  const nodeGap = 30

  for (const [level, nodeIds] of levelGroups) {
    const y = level * (nodeHeight + levelGap)
    const totalWidth = nodeIds.length * nodeWidth + (nodeIds.length - 1) * nodeGap
    const startX = -totalWidth / 2

    nodeIds.forEach((nodeId, index) => {
      const x = startX + index * (nodeWidth + nodeGap)
      store.saveNodePosition(nodeId, x, y)
    })
  }

  setTimeout(() => fitView({ padding: 0.2, duration: 300 }), 100)
}

// Initial layout when graph loads
watch(
  () => store.graph,
  (newGraph) => {
    if (newGraph && store.nodePositions.size === 0) {
      performAutoLayout()
    }
  },
  { immediate: true }
)

onMounted(() => {
  if (store.graph && store.nodePositions.size === 0) {
    performAutoLayout()
  }
})
</script>

<template>
  <div class="canvas-container">
    <VueFlow
      :nodes="nodes"
      :edges="edges"
      :node-types="{
        objectiveNode: ObjectiveNode as any,
        dialogTreeNode: DialogTreeNode as any,
        tutorialNode: TutorialNode as any,
        triggerNode: TriggerNode as any,
      }"
      fit-view-on-init
      :default-viewport="{ zoom: 0.7 }"
      @node-drag-stop="handleNodeDragStop"
    >
      <Background pattern-color="#ddd" :gap="20" />
      <Controls />
      <MiniMap />

      <Panel position="top-right" class="controls-panel">
        <button class="panel-btn" @click="performAutoLayout">Auto Layout</button>
        <button class="panel-btn" @click="fitView({ padding: 0.2, duration: 300 })">
          Fit View
        </button>
      </Panel>

      <Panel v-if="!store.graph" position="top-left" class="loading-panel">
        <div v-if="store.isLoading" class="loading-message">Loading quest chain...</div>
        <div v-else class="empty-message">No quest chain loaded</div>
      </Panel>
    </VueFlow>
  </div>
</template>

<style>
@import '@vue-flow/core/dist/style.css';
@import '@vue-flow/core/dist/theme-default.css';
@import '@vue-flow/controls/dist/style.css';
@import '@vue-flow/minimap/dist/style.css';
</style>

<style scoped>
.canvas-container {
  width: 100%;
  height: 100%;
  position: relative;
}

.controls-panel {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  background-color: white;
  padding: 0.75rem;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.panel-btn {
  padding: 0.5rem 0.75rem;
  background-color: #2196f3;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
  white-space: nowrap;
}

.panel-btn:hover {
  background-color: #0b7dda;
}

.loading-panel {
  background-color: white;
  padding: 1rem 1.5rem;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.loading-message {
  color: #666;
  font-style: italic;
}

.empty-message {
  color: #999;
}
</style>
