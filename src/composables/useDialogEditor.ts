import type { DialogTree } from '@/types/dialogs'

export interface NodePosition {
  x: number
  y: number
}

/**
 * Auto-layout algorithm for dialog tree nodes
 * Uses BFS from start node to assign hierarchical levels
 */
export function autoLayoutNodes(tree: DialogTree): Map<string, NodePosition> {
  const positions = new Map<string, NodePosition>()
  const visited = new Set<string>()

  // BFS from start node to assign levels
  const levels: string[][] = []
  const queue: Array<{ nodeId: string; level: number }> = [
    { nodeId: tree.startNodeId, level: 0 },
  ]

  while (queue.length > 0) {
    const { nodeId, level } = queue.shift()!
    if (visited.has(nodeId)) continue

    visited.add(nodeId)
    if (!levels[level]) levels[level] = []
    levels[level].push(nodeId)

    const node = tree.nodes[nodeId]
    if (!node) continue

    node.responses.forEach((response) => {
      if (response.nextNodeId && !visited.has(response.nextNodeId)) {
        queue.push({ nodeId: response.nextNodeId, level: level + 1 })
      }
    })
  }

  // Add orphaned nodes (not reachable from start) to a final level
  const orphanedNodes = Object.keys(tree.nodes).filter((id) => !visited.has(id))
  if (orphanedNodes.length > 0) {
    levels.push(orphanedNodes)
  }

  // Position nodes: horizontal spacing by level, vertical within level
  const LEVEL_SPACING = 300
  const NODE_SPACING = 150

  levels.forEach((levelNodes, level) => {
    const levelHeight = levelNodes.length * NODE_SPACING
    levelNodes.forEach((nodeId, index) => {
      positions.set(nodeId, {
        x: level * LEVEL_SPACING,
        y: index * NODE_SPACING - levelHeight / 2,
      })
    })
  })

  return positions
}

export function useDialogEditor() {
  return {
    autoLayoutNodes,
  }
}
