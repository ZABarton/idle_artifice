<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { VueFlow, useVueFlow, Panel } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { Controls } from '@vue-flow/controls'
import { MiniMap } from '@vue-flow/minimap'
import { useDialogEditorStore } from '@/stores/dialogEditor'
import { useDialogEditor } from '@/composables/useDialogEditor'
import DialogTreeNode from './nodes/DialogTreeNode.vue'
import ResponseEdge from './edges/ResponseEdge.vue'
import type { Node, Edge } from '@vue-flow/core'

const store = useDialogEditorStore()
const { autoLayoutNodes } = useDialogEditor()
const { onNodeClick, onEdgeClick, fitView } = useVueFlow()

const nodes = computed<Node[]>(() => {
  if (!store.activeTree) return []

  const tree = store.activeTree
  const result: Node[] = []

  // Check for errors/warnings per node
  const nodeErrors = new Map<string, boolean>()
  const nodeWarnings = new Map<string, boolean>()
  const orphanedNodes = new Set<string>()

  store.validationErrors.forEach((error) => {
    if (error.nodeId) nodeErrors.set(error.nodeId, true)
  })

  store.validationWarnings.forEach((warning) => {
    if (warning.nodeId) nodeWarnings.set(warning.nodeId, true)
    if (warning.message.includes('orphaned')) {
      orphanedNodes.add(warning.nodeId!)
    }
  })

  Object.entries(tree.nodes).forEach(([nodeId, dialogNode]) => {
    const position = store.nodePositions.get(nodeId) || { x: 0, y: 0 }

    result.push({
      id: nodeId,
      type: 'dialogNode',
      position,
      data: {
        nodeId: dialogNode.id,
        message: dialogNode.message,
        isStartNode: nodeId === tree.startNodeId,
        hasError: nodeErrors.has(nodeId) || false,
        hasWarning: nodeWarnings.has(nodeId) || false,
        isOrphaned: orphanedNodes.has(nodeId) || false,
      },
    })
  })

  return result
})

const edges = computed<Edge[]>(() => {
  if (!store.activeTree) return []

  const tree = store.activeTree
  const result: Edge[] = []

  Object.entries(tree.nodes).forEach(([nodeId, dialogNode]) => {
    dialogNode.responses.forEach((response, index) => {
      if (response.nextNodeId !== null) {
        result.push({
          id: `${nodeId}-${index}`,
          source: nodeId,
          target: response.nextNodeId,
          type: 'responseEdge',
          data: {
            responseText: response.text,
            responseIndex: index,
          },
        })
      }
    })
  })

  return result
})

// Track if we've done initial layout
const hasInitialLayout = ref(false)

// Watch for tree changes to do initial auto-layout
watch(
  () => store.activeTree?.id,
  (newId) => {
    if (newId && store.activeTree) {
      // Only auto-layout if positions are empty
      if (store.nodePositions.size === 0) {
        performAutoLayout()
      }
      hasInitialLayout.value = true
      setTimeout(() => fitView({ padding: 0.2, duration: 300 }), 100)
    }
  },
  { immediate: true }
)

// Handle node position changes (drag)
function handleNodeDragStop(event: { node: Node }) {
  store.saveNodePosition(event.node.id, event.node.position.x, event.node.position.y)
}

// Handle node click
onNodeClick((event) => {
  store.selectNode(event.node.id)
})

// Handle edge click
onEdgeClick((event) => {
  const edgeData = event.edge.data as { responseIndex: number }
  store.selectResponse(event.edge.source, edgeData.responseIndex)
})

function performAutoLayout() {
  if (!store.activeTree) return

  const positions = autoLayoutNodes(store.activeTree)
  positions.forEach((pos, nodeId) => {
    store.saveNodePosition(nodeId, pos.x, pos.y)
  })

  setTimeout(() => fitView({ padding: 0.2, duration: 300 }), 100)
}

function handleAddNode() {
  const nodeId = prompt('Enter new node ID:')
  if (nodeId) {
    store.addNode(nodeId)
  }
}

onMounted(() => {
  // Define arrowhead marker for edges
  const svg = document.querySelector('.vue-flow__edges svg')
  if (svg) {
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs')
    const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker')
    marker.setAttribute('id', 'arrowhead')
    marker.setAttribute('markerWidth', '10')
    marker.setAttribute('markerHeight', '10')
    marker.setAttribute('refX', '9')
    marker.setAttribute('refY', '3')
    marker.setAttribute('orient', 'auto')
    marker.setAttribute('markerUnits', 'strokeWidth')

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
    path.setAttribute('d', 'M0,0 L0,6 L9,3 z')
    path.setAttribute('fill', '#888')

    marker.appendChild(path)
    defs.appendChild(marker)
    svg.appendChild(defs)
  }
})
</script>

<template>
  <div class="canvas-container">
    <VueFlow
      :nodes="nodes"
      :edges="edges"
      :node-types="{ dialogNode: DialogTreeNode as any }"
      :edge-types="{ responseEdge: ResponseEdge as any }"
      @node-drag-stop="handleNodeDragStop"
      fit-view-on-init
      :default-viewport="{ zoom: 0.8 }"
    >
      <Background pattern-color="#ddd" :gap="16" />
      <Controls />
      <MiniMap />

      <Panel position="top-right" class="controls-panel">
        <button @click="performAutoLayout" class="panel-btn">Auto Layout</button>
        <button @click="handleAddNode" class="panel-btn">Add Node</button>
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
</style>
