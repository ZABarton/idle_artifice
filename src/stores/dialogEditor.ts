import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { DialogTree, DialogNode, PlayerResponse } from '@/types/dialogs'

export interface ValidationIssue {
  type: 'error' | 'warning'
  nodeId?: string
  message: string
  action?: string
}

export const useDialogEditorStore = defineStore('dialogEditor', () => {
  // State
  const activeTree = ref<DialogTree | null>(null)
  const selectedNodeId = ref<string | null>(null)
  const selectedResponseIndex = ref<number | null>(null)
  const validationErrors = ref<ValidationIssue[]>([])
  const validationWarnings = ref<ValidationIssue[]>([])
  const nodePositions = ref<Map<string, { x: number; y: number }>>(new Map())
  const isDirty = ref(false)
  const originalTreeJson = ref<string | null>(null)

  // Getters
  const selectedNode = computed(() => {
    if (!activeTree.value || !selectedNodeId.value) return null
    return activeTree.value.nodes[selectedNodeId.value] || null
  })

  const hasValidationErrors = computed(() => validationErrors.value.length > 0)
  const hasValidationWarnings = computed(() => validationWarnings.value.length > 0)

  // Actions

  /**
   * Load a dialog tree from a DialogTree object
   */
  function loadDialogTree(tree: DialogTree) {
    activeTree.value = tree
    selectedNodeId.value = null
    selectedResponseIndex.value = null
    nodePositions.value.clear()
    isDirty.value = false
    originalTreeJson.value = JSON.stringify(tree, null, 2)
    validateTree()
  }

  /**
   * Create a new empty dialog tree
   */
  function createNewTree() {
    const newTree: DialogTree = {
      id: 'new-tree',
      characterName: 'Character Name',
      portrait: {
        path: null,
        alt: 'Character portrait',
      },
      startNodeId: 'start',
      nodes: {
        start: {
          id: 'start',
          message: 'Enter your message here...',
          responses: [
            {
              text: 'Continue',
              nextNodeId: null,
            },
          ],
        },
      },
    }
    loadDialogTree(newTree)
  }

  /**
   * Update tree-level metadata
   */
  function updateTreeMetadata(updates: Partial<Pick<DialogTree, 'id' | 'characterName' | 'portrait'>>) {
    if (!activeTree.value) return
    if (updates.id !== undefined) activeTree.value.id = updates.id
    if (updates.characterName !== undefined) activeTree.value.characterName = updates.characterName
    if (updates.portrait !== undefined) activeTree.value.portrait = updates.portrait
    isDirty.value = true
    validateTree()
  }

  /**
   * Select a node for editing
   */
  function selectNode(nodeId: string | null) {
    selectedNodeId.value = nodeId
    selectedResponseIndex.value = null
  }

  /**
   * Select a response for editing
   */
  function selectResponse(nodeId: string, responseIndex: number) {
    selectedNodeId.value = nodeId
    selectedResponseIndex.value = responseIndex
  }

  /**
   * Save node position (for graph layout)
   */
  function saveNodePosition(nodeId: string, x: number, y: number) {
    nodePositions.value.set(nodeId, { x, y })
  }

  /**
   * Add a new node to the tree
   */
  function addNode(nodeId: string, message: string = 'New node message...'): void {
    if (!activeTree.value) return

    // Ensure unique node ID
    let uniqueId = nodeId
    let counter = 1
    while (activeTree.value.nodes[uniqueId]) {
      uniqueId = `${nodeId}-${counter}`
      counter++
    }

    const newNode: DialogNode = {
      id: uniqueId,
      message,
      responses: [],
    }

    activeTree.value.nodes[uniqueId] = newNode
    isDirty.value = true
    validateTree()
    selectNode(uniqueId)
  }

  /**
   * Delete a node from the tree
   */
  function deleteNode(nodeId: string) {
    if (!activeTree.value) return

    // Remove the node
    delete activeTree.value.nodes[nodeId]

    // Update all responses that pointed to this node
    Object.values(activeTree.value.nodes).forEach((node) => {
      node.responses.forEach((response) => {
        if (response.nextNodeId === nodeId) {
          response.nextNodeId = null
        }
      })
    })

    // If this was the start node, set start to first available node
    if (activeTree.value.startNodeId === nodeId) {
      const nodeIds = Object.keys(activeTree.value.nodes)
      activeTree.value.startNodeId = nodeIds.length > 0 ? nodeIds[0] : 'start'
    }

    // Deselect if this was selected
    if (selectedNodeId.value === nodeId) {
      selectedNodeId.value = null
    }

    nodePositions.value.delete(nodeId)
    isDirty.value = true
    validateTree()
  }

  /**
   * Update node message
   */
  function updateNodeMessage(nodeId: string, message: string) {
    if (!activeTree.value || !activeTree.value.nodes[nodeId]) return
    activeTree.value.nodes[nodeId].message = message
    isDirty.value = true
    validateTree()
  }

  /**
   * Update node portrait
   */
  function updateNodePortrait(
    nodeId: string,
    portrait: { path: string | null; alt: string } | undefined
  ) {
    if (!activeTree.value || !activeTree.value.nodes[nodeId]) return
    activeTree.value.nodes[nodeId].portrait = portrait
    isDirty.value = true
    validateTree()
  }

  /**
   * Set a node as the start node
   */
  function setStartNode(nodeId: string) {
    if (!activeTree.value || !activeTree.value.nodes[nodeId]) return
    activeTree.value.startNodeId = nodeId
    isDirty.value = true
    validateTree()
  }

  /**
   * Add a response to a node
   */
  function addResponse(nodeId: string) {
    if (!activeTree.value || !activeTree.value.nodes[nodeId]) return

    const newResponse: PlayerResponse = {
      text: 'New response...',
      nextNodeId: null,
    }

    activeTree.value.nodes[nodeId].responses.push(newResponse)
    isDirty.value = true
    validateTree()
  }

  /**
   * Update a response
   */
  function updateResponse(nodeId: string, responseIndex: number, text: string, nextNodeId: string | null) {
    if (!activeTree.value || !activeTree.value.nodes[nodeId]) return
    const node = activeTree.value.nodes[nodeId]
    if (responseIndex < 0 || responseIndex >= node.responses.length) return

    node.responses[responseIndex].text = text
    node.responses[responseIndex].nextNodeId = nextNodeId
    isDirty.value = true
    validateTree()
  }

  /**
   * Delete a response from a node
   */
  function deleteResponse(nodeId: string, responseIndex: number) {
    if (!activeTree.value || !activeTree.value.nodes[nodeId]) return
    const node = activeTree.value.nodes[nodeId]
    if (responseIndex < 0 || responseIndex >= node.responses.length) return

    node.responses.splice(responseIndex, 1)
    isDirty.value = true
    validateTree()
  }

  /**
   * Validate the current dialog tree
   */
  function validateTree() {
    validationErrors.value = []
    validationWarnings.value = []

    if (!activeTree.value) return

    const tree = activeTree.value
    const errors: ValidationIssue[] = []
    const warnings: ValidationIssue[] = []

    // Check for missing or invalid start node
    if (!tree.startNodeId) {
      errors.push({
        type: 'error',
        message: 'Missing start node ID',
      })
    } else if (!tree.nodes[tree.startNodeId]) {
      errors.push({
        type: 'error',
        nodeId: tree.startNodeId,
        message: `Start node "${tree.startNodeId}" does not exist`,
      })
    }

    // Check each node
    Object.entries(tree.nodes).forEach(([key, node]) => {
      // Check node ID matches key
      if (node.id !== key) {
        errors.push({
          type: 'error',
          nodeId: key,
          message: `Node ID mismatch: key is "${key}" but node.id is "${node.id}"`,
        })
      }

      // Check for empty message
      if (!node.message || node.message.trim() === '') {
        errors.push({
          type: 'error',
          nodeId: key,
          message: 'Node has empty message',
        })
      }

      // Warn for long messages
      if (node.message && node.message.length > 1000) {
        warnings.push({
          type: 'warning',
          nodeId: key,
          message: `Message exceeds 1000 characters (${node.message.length} chars)`,
        })
      }

      // Check responses
      node.responses.forEach((response, index) => {
        // Check for empty response text
        if (!response.text || response.text.trim() === '') {
          errors.push({
            type: 'error',
            nodeId: key,
            message: `Response ${index + 1} has empty text`,
          })
        }

        // Warn for long response text
        if (response.text && response.text.length > 200) {
          warnings.push({
            type: 'warning',
            nodeId: key,
            message: `Response "${response.text.substring(0, 30)}..." exceeds 200 characters (${response.text.length} chars)`,
          })
        }

        // Check for dangling references
        if (response.nextNodeId !== null && !tree.nodes[response.nextNodeId]) {
          errors.push({
            type: 'error',
            nodeId: key,
            message: `Response references non-existent node "${response.nextNodeId}"`,
          })
        }
      })

      // Warn if node has more than 4 responses
      if (node.responses.length > 4) {
        warnings.push({
          type: 'warning',
          nodeId: key,
          message: `Node has ${node.responses.length} responses (recommended max: 4)`,
        })
      }

      // Warn if node has no responses (dead end)
      if (node.responses.length === 0) {
        warnings.push({
          type: 'warning',
          nodeId: key,
          message: 'Node has no responses (dead end)',
        })
      }
    })

    // Check for orphaned nodes (unreachable from start)
    if (tree.startNodeId && tree.nodes[tree.startNodeId]) {
      const reachable = new Set<string>()
      const visited = new Set<string>()

      function traverse(nodeId: string) {
        if (visited.has(nodeId)) return
        visited.add(nodeId)
        reachable.add(nodeId)

        const node = tree.nodes[nodeId]
        if (!node) return

        node.responses.forEach((response) => {
          if (response.nextNodeId && tree.nodes[response.nextNodeId]) {
            traverse(response.nextNodeId)
          }
        })
      }

      traverse(tree.startNodeId)

      Object.keys(tree.nodes).forEach((nodeId) => {
        if (!reachable.has(nodeId)) {
          warnings.push({
            type: 'warning',
            nodeId,
            message: `Node "${nodeId}" is orphaned (unreachable from start node)`,
          })
        }
      })
    }

    // Check for infinite loops (no terminal paths)
    if (tree.startNodeId && tree.nodes[tree.startNodeId]) {
      const hasTerminal = hasTerminalPath(tree, tree.startNodeId, new Set())
      if (!hasTerminal) {
        warnings.push({
          type: 'warning',
          message: 'No terminal path found (conversation may loop indefinitely)',
        })
      }
    }

    validationErrors.value = errors
    validationWarnings.value = warnings
  }

  /**
   * Helper function to check if there's at least one terminal path from a node
   */
  function hasTerminalPath(tree: DialogTree, nodeId: string, path: Set<string>): boolean {
    // Cycle detection
    if (path.has(nodeId)) return false

    const node = tree.nodes[nodeId]
    if (!node) return false

    // Check if this node has a terminal response (nextNodeId === null)
    const hasTerminalResponse = node.responses.some((r) => r.nextNodeId === null)
    if (hasTerminalResponse) return true

    // If no responses, it's a dead end (not terminal, just broken)
    if (node.responses.length === 0) return false

    // Check if any response path leads to a terminal
    const newPath = new Set(path).add(nodeId)
    return node.responses.some((response) => {
      if (response.nextNodeId === null) return true
      if (!tree.nodes[response.nextNodeId]) return false
      return hasTerminalPath(tree, response.nextNodeId, newPath)
    })
  }

  /**
   * Export the tree as clean JSON
   */
  function exportTree(): string | null {
    if (!activeTree.value) return null

    const cleanTree: DialogTree = {
      id: activeTree.value.id,
      characterName: activeTree.value.characterName,
      portrait: activeTree.value.portrait,
      startNodeId: activeTree.value.startNodeId,
      nodes: activeTree.value.nodes,
    }

    return JSON.stringify(cleanTree, null, 2)
  }

  /**
   * Mark the tree as clean (after export or load)
   */
  function markClean() {
    isDirty.value = false
    if (activeTree.value) {
      originalTreeJson.value = JSON.stringify(activeTree.value, null, 2)
    }
  }

  /**
   * Save the tree back to the file system via API
   */
  async function saveTree(): Promise<{ success: boolean; message: string }> {
    if (!activeTree.value) {
      return { success: false, message: 'No tree to save' }
    }

    const json = exportTree()
    if (!json) {
      return { success: false, message: 'Failed to export tree' }
    }

    try {
      const response = await fetch('/api/save-dialog-tree', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          treeId: activeTree.value.id,
          content: json,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        return { success: false, message: error.error || 'Failed to save' }
      }

      const result = await response.json()
      markClean()
      return { success: true, message: result.message || 'Saved successfully' }
    } catch (error) {
      console.error('Error saving tree:', error)
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Network error',
      }
    }
  }

  /**
   * Reset the editor state
   */
  function resetEditor() {
    activeTree.value = null
    selectedNodeId.value = null
    selectedResponseIndex.value = null
    validationErrors.value = []
    validationWarnings.value = []
    nodePositions.value.clear()
    isDirty.value = false
    originalTreeJson.value = null
  }

  return {
    // State
    activeTree,
    selectedNodeId,
    selectedResponseIndex,
    validationErrors,
    validationWarnings,
    nodePositions,
    isDirty,

    // Getters
    selectedNode,
    hasValidationErrors,
    hasValidationWarnings,

    // Actions
    loadDialogTree,
    createNewTree,
    updateTreeMetadata,
    selectNode,
    selectResponse,
    saveNodePosition,
    addNode,
    deleteNode,
    updateNodeMessage,
    updateNodePortrait,
    setStartNode,
    addResponse,
    updateResponse,
    deleteResponse,
    validateTree,
    exportTree,
    saveTree,
    markClean,
    resetEditor,
  }
})
