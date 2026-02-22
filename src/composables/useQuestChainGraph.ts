/**
 * Quest Chain Graph Composable
 *
 * Parses all config files (objectives, dialog trees, tutorials, triggers)
 * and builds a unified graph showing their interconnections.
 */

import { ref, computed } from 'vue'
import type {
  QuestChainNode,
  QuestChainEdge,
  QuestChainGraph,
  QuestChainValidationIssue,
  ObjectiveNodeData,
  DialogTreeNodeData,
  TutorialNodeData,
  DialogTriggerNodeData,
  AreaTriggerNodeData,
  GameEventNodeData,
  FeatureNodeData,
} from '@/types/questChainEditor'
import type { DialogTree } from '@/types/dialogs'

// Import config files
import objectivesConfig from '@/config/objectives.json'
import dialogTriggersConfig from '@/config/dialog-triggers.json'
import areaTriggersConfig from '@/config/area-triggers.json'

// Import area map configs for features
import { academyConfig } from '@/config/area-maps/academy'
import { harborConfig } from '@/config/area-maps/harbor'
import type { AreaMapConfig } from '@/types/areaMapConfig'

// All area configs to parse for features
const areaConfigs: AreaMapConfig[] = [academyConfig, harborConfig]

// Mapping of feature types to game events they can trigger
const featureToGameEvent: Record<string, string> = {
  foundry: 'craft-complete',
}

export function useQuestChainGraph() {
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Cache for loaded dialog trees and tutorials
  const dialogTrees = ref<Map<string, DialogTree>>(new Map())
  const tutorials = ref<Map<string, TutorialData>>(new Map())

  interface TutorialData {
    id: string
    title: string
    content: string
    showOnce: boolean
    triggerConditions: Array<{
      type: string
      id?: string
      value?: number
      description?: string
    }>
  }

  /**
   * Load all dialog trees from the content directory
   */
  async function loadDialogTrees(): Promise<void> {
    const treeFiles = import.meta.glob('/src/content/dialog-trees/*.json', { eager: true })

    for (const [path, module] of Object.entries(treeFiles)) {
      const tree = (module as { default: DialogTree }).default || (module as DialogTree)
      if (tree && tree.id) {
        dialogTrees.value.set(tree.id, tree)
      }
    }
  }

  /**
   * Load all tutorials from the content directory
   */
  async function loadTutorials(): Promise<void> {
    const tutorialFiles = import.meta.glob('/src/content/tutorials/*.json', { eager: true })

    for (const [path, module] of Object.entries(tutorialFiles)) {
      const tutorial = (module as { default: TutorialData }).default || (module as TutorialData)
      if (tutorial && tutorial.id) {
        tutorials.value.set(tutorial.id, tutorial)
      }
    }
  }

  /**
   * Build the complete quest chain graph
   */
  async function buildGraph(): Promise<QuestChainGraph> {
    isLoading.value = true
    error.value = null

    try {
      // Load all content
      await Promise.all([loadDialogTrees(), loadTutorials()])

      const nodes: QuestChainNode[] = []
      const edges: QuestChainEdge[] = []

      // Build nodes from objectives
      for (const objective of objectivesConfig.objectives) {
        const nodeData: ObjectiveNodeData = {
          nodeType: 'objective',
          objectiveId: objective.id,
          title: objective.title,
          description: objective.description,
          status: objective.status as 'active' | 'hidden' | 'completed',
          category: objective.category as 'main' | 'secondary',
          order: objective.order,
          targetLocation: objective.targetLocation,
          currentProgress: objective.currentProgress,
          maxProgress: objective.maxProgress,
          subtasks: objective.subtasks,
          discoveryConditions: objective.discoveryConditions,
        }

        nodes.push({
          id: `objective:${objective.id}`,
          type: 'objective',
          label: objective.title,
          description: objective.description,
          sourceFile: 'src/config/objectives.json',
          data: nodeData,
        })

        // Build edges from discovery conditions (objective requires another objective)
        if (objective.discoveryConditions) {
          for (const condition of objective.discoveryConditions) {
            if (condition.type === 'objective' && condition.id) {
              edges.push({
                id: `edge:objective:${condition.id}:unlocks:objective:${objective.id}`,
                source: `objective:${condition.id}`,
                target: `objective:${objective.id}`,
                type: 'unlocks',
                label: 'unlocks',
                data: {
                  description: condition.description,
                  conditionType: 'objective',
                },
              })
            }
          }
        }

        // Build self-referential edge for objectives with subtasks
        // This indicates the objective completes when all subtasks are done
        if (objective.subtasks && objective.subtasks.length > 0) {
          edges.push({
            id: `edge:objective:${objective.id}:completes-via-subtasks`,
            source: `objective:${objective.id}`,
            target: `objective:${objective.id}`,
            type: 'completes-via-subtasks',
            label: `${objective.subtasks.length} subtasks`,
            data: {
              description: `Completes when ${objective.subtasks.length} subtasks are finished`,
            },
          })
        }
      }

      // Build nodes from dialog trees
      for (const [treeId, tree] of dialogTrees.value) {
        const nodeData: DialogTreeNodeData = {
          nodeType: 'dialog-tree',
          treeId: tree.id,
          characterName: tree.characterName,
          nodeCount: Object.keys(tree.nodes).length,
          onComplete: tree.onComplete,
        }

        nodes.push({
          id: `dialog-tree:${tree.id}`,
          type: 'dialog-tree',
          label: tree.characterName,
          description: `Dialog tree: ${tree.id}`,
          sourceFile: `src/content/dialog-trees/${tree.id}.json`,
          data: nodeData,
        })

        // Build edges from onComplete actions
        if (tree.onComplete) {
          for (const action of tree.onComplete) {
            if (action.type === 'completeObjective' && action.objectiveId) {
              edges.push({
                id: `edge:dialog-tree:${tree.id}:completes:objective:${action.objectiveId}`,
                source: `dialog-tree:${tree.id}`,
                target: `objective:${action.objectiveId}`,
                type: 'completes',
                label: 'completes',
              })
            }
            // updateSubtask also contributes to objective completion
            if (action.type === 'updateSubtask' && action.objectiveId) {
              edges.push({
                id: `edge:dialog-tree:${tree.id}:completes-via-subtasks:objective:${action.objectiveId}`,
                source: `dialog-tree:${tree.id}`,
                target: `objective:${action.objectiveId}`,
                type: 'completes-via-subtasks',
                label: action.subtaskId ? `subtask: ${action.subtaskId}` : 'updates subtask',
              })
            }
            if (action.type === 'showTutorial' && action.tutorialId) {
              edges.push({
                id: `edge:dialog-tree:${tree.id}:shows:tutorial:${action.tutorialId}`,
                source: `dialog-tree:${tree.id}`,
                target: `tutorial:${action.tutorialId}`,
                type: 'shows',
                label: 'shows',
              })
            }
            if (action.type === 'showDialogTree' && action.dialogTreeId) {
              edges.push({
                id: `edge:dialog-tree:${tree.id}:triggers:dialog-tree:${action.dialogTreeId}`,
                source: `dialog-tree:${tree.id}`,
                target: `dialog-tree:${action.dialogTreeId}`,
                type: 'triggers',
                label: 'triggers',
              })
            }
          }
        }
      }

      // Build nodes from tutorials
      for (const [tutorialId, tutorial] of tutorials.value) {
        const nodeData: TutorialNodeData = {
          nodeType: 'tutorial',
          tutorialId: tutorial.id,
          title: tutorial.title,
          showOnce: tutorial.showOnce,
          triggerConditions: tutorial.triggerConditions,
        }

        nodes.push({
          id: `tutorial:${tutorial.id}`,
          type: 'tutorial',
          label: tutorial.title,
          description: `Tutorial: ${tutorial.id}`,
          sourceFile: `src/content/tutorials/${tutorial.id}.json`,
          data: nodeData,
        })

        // Build edges from trigger conditions
        for (const condition of tutorial.triggerConditions) {
          if (condition.type === 'objective' && condition.id) {
            edges.push({
              id: `edge:objective:${condition.id}:triggers:tutorial:${tutorial.id}`,
              source: `objective:${condition.id}`,
              target: `tutorial:${tutorial.id}`,
              type: 'triggers',
              label: 'triggers',
              data: {
                conditionType: 'objective',
              },
            })
          }
        }
      }

      // Build nodes from dialog triggers
      for (const trigger of dialogTriggersConfig.triggers) {
        const nodeData: DialogTriggerNodeData = {
          nodeType: 'dialog-trigger',
          triggerId: trigger.id,
          dialogTreeId: trigger.dialogTreeId,
          priority: trigger.priority,
          description: trigger.description,
          conditions: trigger.conditions,
        }

        nodes.push({
          id: `dialog-trigger:${trigger.id}`,
          type: 'dialog-trigger',
          label: trigger.id,
          description: trigger.description,
          sourceFile: 'src/config/dialog-triggers.json',
          data: nodeData,
        })

        // Edge: dialog trigger triggers dialog tree
        edges.push({
          id: `edge:dialog-trigger:${trigger.id}:triggers:dialog-tree:${trigger.dialogTreeId}`,
          source: `dialog-trigger:${trigger.id}`,
          target: `dialog-tree:${trigger.dialogTreeId}`,
          type: 'triggers',
          label: 'triggers',
        })

        // Edges: dialog trigger requires conditions
        for (const condition of trigger.conditions) {
          if (condition.type === 'objective-complete' && condition.id) {
            edges.push({
              id: `edge:objective:${condition.id}:requires:dialog-trigger:${trigger.id}`,
              source: `objective:${condition.id}`,
              target: `dialog-trigger:${trigger.id}`,
              type: 'requires',
              label: 'requires',
              data: {
                conditionType: 'objective-complete',
              },
            })
          }
          if (condition.type === 'dialog-complete' && condition.id) {
            edges.push({
              id: `edge:dialog-tree:${condition.id}:requires:dialog-trigger:${trigger.id}`,
              source: `dialog-tree:${condition.id}`,
              target: `dialog-trigger:${trigger.id}`,
              type: 'requires',
              label: 'requires',
              data: {
                conditionType: 'dialog-complete',
              },
            })
          }
        }
      }

      // Build game event nodes from dialog trigger conditions
      // Track created game events to avoid duplicates
      const createdGameEvents = new Set<string>()

      for (const trigger of dialogTriggersConfig.triggers) {
        for (const condition of trigger.conditions) {
          // Skip conditions that reference existing node types
          if (
            condition.type === 'objective-complete' ||
            condition.type === 'dialog-complete'
          ) {
            continue
          }

          // Create a unique ID for this game event
          const eventId = condition.value !== undefined
            ? `${condition.type}:${condition.value}`
            : condition.type
          const gameEventNodeId = `game-event:${eventId}`

          // Create game event node if it doesn't exist yet
          if (!createdGameEvents.has(gameEventNodeId)) {
            createdGameEvents.add(gameEventNodeId)

            const operatorLabel = condition.operator === 'eq' ? '=' :
                                  condition.operator === 'gte' ? '>=' :
                                  condition.operator === 'lte' ? '<=' :
                                  condition.operator === 'gt' ? '>' :
                                  condition.operator === 'lt' ? '<' : ''

            const valueLabel = condition.value !== undefined
              ? ` ${operatorLabel} ${condition.value}`
              : ''

            const nodeData: GameEventNodeData = {
              nodeType: 'game-event',
              eventType: condition.type,
              eventId: eventId,
              description: `Game event: ${condition.type}${valueLabel}`,
              value: condition.value,
              operator: condition.operator,
            }

            nodes.push({
              id: gameEventNodeId,
              type: 'game-event',
              label: `${condition.type}${valueLabel}`,
              description: nodeData.description,
              data: nodeData,
            })
          }

          // Create edge from game event to dialog trigger
          edges.push({
            id: `edge:${gameEventNodeId}:triggers:dialog-trigger:${trigger.id}`,
            source: gameEventNodeId,
            target: `dialog-trigger:${trigger.id}`,
            type: 'triggers',
            label: 'triggers',
            data: {
              conditionType: condition.type,
            },
          })
        }
      }

      // Build nodes from area triggers
      for (const trigger of areaTriggersConfig.triggers) {
        const nodeData: AreaTriggerNodeData = {
          nodeType: 'area-trigger',
          triggerId: trigger.id,
          areaType: trigger.areaType,
          event: trigger.event as 'onFirstVisit' | 'onEnter' | 'onExit' | 'onFeatureInteract',
          description: trigger.description,
          actions: trigger.actions,
        }

        nodes.push({
          id: `area-trigger:${trigger.id}`,
          type: 'area-trigger',
          label: `${trigger.areaType} - ${trigger.event}`,
          description: trigger.description,
          sourceFile: 'src/config/area-triggers.json',
          data: nodeData,
        })

        // Build edges from actions
        for (const action of trigger.actions) {
          if (action.type === 'showDialogTree' && action.dialogId) {
            edges.push({
              id: `edge:area-trigger:${trigger.id}:triggers:dialog-tree:${action.dialogId}`,
              source: `area-trigger:${trigger.id}`,
              target: `dialog-tree:${action.dialogId}`,
              type: 'triggers',
              label: 'triggers',
            })
          }
          if (action.type === 'completeObjective' && action.objectiveId) {
            edges.push({
              id: `edge:area-trigger:${trigger.id}:completes:objective:${action.objectiveId}`,
              source: `area-trigger:${trigger.id}`,
              target: `objective:${action.objectiveId}`,
              type: 'completes',
              label: 'completes',
            })
          }
          if (action.type === 'showTutorial' && action.tutorialId) {
            edges.push({
              id: `edge:area-trigger:${trigger.id}:shows:tutorial:${action.tutorialId}`,
              source: `area-trigger:${trigger.id}`,
              target: `tutorial:${action.tutorialId}`,
              type: 'shows',
              label: 'shows',
            })
          }
        }
      }

      // Build nodes from area map features
      for (const areaConfig of areaConfigs) {
        for (const feature of areaConfig.features) {
          const nodeData: FeatureNodeData = {
            nodeType: 'feature',
            featureId: feature.id,
            featureType: feature.type,
            name: feature.name,
            areaType: areaConfig.areaType,
            icon: feature.icon,
            interactionType: feature.interactionType,
          }

          nodes.push({
            id: `feature:${feature.id}`,
            type: 'feature',
            label: feature.name,
            description: feature.description || `${feature.name} in ${areaConfig.areaType}`,
            sourceFile: `src/config/area-maps/${areaConfig.areaType}.ts`,
            data: nodeData,
          })

          // Create edge from feature to game event if applicable
          const gameEventType = featureToGameEvent[feature.type]
          if (gameEventType) {
            // Find matching game event nodes and create edges
            for (const gameEventNodeId of createdGameEvents) {
              const eventType = gameEventNodeId.replace('game-event:', '').split(':')[0]
              if (eventType === gameEventType) {
                edges.push({
                  id: `edge:feature:${feature.id}:triggers:${gameEventNodeId}`,
                  source: `feature:${feature.id}`,
                  target: gameEventNodeId,
                  type: 'triggers',
                  label: 'generates',
                })
              }
            }
          }
        }
      }

      isLoading.value = false
      return { nodes, edges }
    } catch (e) {
      isLoading.value = false
      error.value = e instanceof Error ? e.message : 'Failed to build graph'
      throw e
    }
  }

  /**
   * Validate the quest chain graph for issues
   */
  function validateGraph(graph: QuestChainGraph): QuestChainValidationIssue[] {
    const issues: QuestChainValidationIssue[] = []
    const nodeIds = new Set(graph.nodes.map((n) => n.id))

    // Check for broken edge references
    for (const edge of graph.edges) {
      if (!nodeIds.has(edge.source)) {
        issues.push({
          type: 'error',
          edgeId: edge.id,
          message: `Edge references non-existent source node: ${edge.source}`,
          suggestion: 'Remove this edge or create the missing source node',
        })
      }
      if (!nodeIds.has(edge.target)) {
        issues.push({
          type: 'error',
          edgeId: edge.id,
          message: `Edge references non-existent target node: ${edge.target}`,
          suggestion: 'Remove this edge or create the missing target node',
        })
      }
    }

    // Check for orphaned nodes (no incoming or outgoing edges)
    const connectedNodes = new Set<string>()
    for (const edge of graph.edges) {
      connectedNodes.add(edge.source)
      connectedNodes.add(edge.target)
    }

    for (const node of graph.nodes) {
      if (!connectedNodes.has(node.id)) {
        // Objectives can be standalone if they're initial objectives
        if (node.type === 'objective') {
          const data = node.data as ObjectiveNodeData
          if (data.status !== 'active' || data.discoveryConditions?.length) {
            issues.push({
              type: 'warning',
              nodeId: node.id,
              message: `Orphaned node with no connections: ${node.label}`,
              suggestion: 'Consider adding discovery conditions or connections',
            })
          }
        } else {
          issues.push({
            type: 'warning',
            nodeId: node.id,
            message: `Orphaned node with no connections: ${node.label}`,
            suggestion: 'Consider connecting this to the quest chain',
          })
        }
      }
    }

    // Check for circular dependencies in objectives
    const objectiveNodes = graph.nodes.filter((n) => n.type === 'objective')
    // Exclude self-loops (completes-via-subtasks) from cycle detection
    const objectiveEdges = graph.edges.filter(
      (e) =>
        e.source.startsWith('objective:') &&
        e.target.startsWith('objective:') &&
        e.source !== e.target
    )

    function hasCycle(nodeId: string, visited: Set<string>, path: Set<string>): boolean {
      if (path.has(nodeId)) return true
      if (visited.has(nodeId)) return false

      visited.add(nodeId)
      path.add(nodeId)

      const outgoingEdges = objectiveEdges.filter((e) => e.source === nodeId)
      for (const edge of outgoingEdges) {
        if (hasCycle(edge.target, visited, path)) {
          return true
        }
      }

      path.delete(nodeId)
      return false
    }

    for (const node of objectiveNodes) {
      if (hasCycle(node.id, new Set(), new Set())) {
        issues.push({
          type: 'error',
          nodeId: node.id,
          message: `Circular dependency detected involving: ${node.label}`,
          suggestion: 'Remove circular objective dependencies',
        })
        break // Only report once
      }
    }

    // Check for objectives with no path to completion
    for (const node of objectiveNodes) {
      const data = node.data as ObjectiveNodeData
      if (data.status === 'hidden') {
        // Check if any edge targets this objective with 'completes' or 'completes-via-subtasks' type
        const completionEdges = graph.edges.filter(
          (e) =>
            e.target === node.id &&
            (e.type === 'completes' || e.type === 'completes-via-subtasks')
        )
        if (completionEdges.length === 0) {
          issues.push({
            type: 'warning',
            nodeId: node.id,
            message: `Objective "${node.label}" has no known completion path`,
            suggestion: 'Add a dialog or trigger that completes this objective',
          })
        }
      }
    }

    return issues
  }

  return {
    isLoading,
    error,
    buildGraph,
    validateGraph,
    dialogTrees,
    tutorials,
  }
}
