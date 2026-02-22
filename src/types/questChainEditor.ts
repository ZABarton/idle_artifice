/**
 * Quest Chain Editor Type Definitions
 *
 * Types for the visual graph editor that shows the interconnected
 * web of objectives, dialogs, tutorials, and triggers.
 */

// Node types in the quest chain graph
export type QuestChainNodeType =
  | 'objective' // From objectives.json
  | 'dialog-tree' // From dialog-trees/*.json
  | 'tutorial' // From tutorials/*.json
  | 'dialog-trigger' // From dialog-triggers.json
  | 'area-trigger' // From area-triggers.json
  | 'game-event' // Game events like craft-complete, resource thresholds, etc.
  | 'feature' // Features from area maps (Foundry, Quartermaster, etc.)

// Edge types describing relationships between nodes
export type QuestChainEdgeType =
  | 'unlocks' // Completing A unlocks B (e.g., objective discovery conditions)
  | 'triggers' // A triggers B (e.g., dialog trigger fires dialog tree)
  | 'completes' // A completes B (e.g., dialog tree completes objective)
  | 'completes-via-subtasks' // A completes B via subtask completion (e.g., subtask feature completes parent objective)
  | 'requires' // A requires B (e.g., dialog trigger requires objective-complete)
  | 'shows' // A shows B (e.g., dialog tree shows tutorial)

// Base node interface for the graph
export interface QuestChainNode {
  id: string
  type: QuestChainNodeType
  label: string
  description?: string
  sourceFile?: string // File path this node came from
  data: ObjectiveNodeData | DialogTreeNodeData | TutorialNodeData | DialogTriggerNodeData | AreaTriggerNodeData | GameEventNodeData | FeatureNodeData
}

// Objective node data (from objectives.json)
export interface ObjectiveNodeData {
  nodeType: 'objective'
  objectiveId: string
  title: string
  description: string
  status: 'active' | 'hidden' | 'completed'
  category: 'main' | 'secondary'
  order: number
  targetLocation?: string
  currentProgress?: number
  maxProgress?: number
  subtasks?: Array<{
    id: string
    description: string
    completed: boolean
    featureId?: string
  }>
  discoveryConditions?: Array<{
    type: string
    id?: string
    description?: string
  }>
}

// Dialog tree node data (from dialog-trees/*.json)
export interface DialogTreeNodeData {
  nodeType: 'dialog-tree'
  treeId: string
  characterName: string
  nodeCount: number
  onComplete?: Array<{
    type: string
    objectiveId?: string
    subtaskId?: string
    tutorialId?: string
    dialogTreeId?: string
    coordinates?: string
    featureId?: string
  }>
}

// Tutorial node data (from tutorials/*.json)
export interface TutorialNodeData {
  nodeType: 'tutorial'
  tutorialId: string
  title: string
  showOnce: boolean
  triggerConditions: Array<{
    type: string
    id?: string
    value?: number
    description?: string
  }>
}

// Dialog trigger node data (from dialog-triggers.json)
export interface DialogTriggerNodeData {
  nodeType: 'dialog-trigger'
  triggerId: string
  dialogTreeId: string
  priority: number
  description?: string
  conditions: Array<{
    type: string
    id?: string
    value?: number
    operator?: string
  }>
}

// Area trigger node data (from area-triggers.json)
export interface AreaTriggerNodeData {
  nodeType: 'area-trigger'
  triggerId: string
  areaType: string
  event: 'onFirstVisit' | 'onEnter' | 'onExit' | 'onFeatureInteract'
  featureId?: string
  description?: string
  actions: Array<{
    type: string
    dialogId?: string
    objectiveId?: string
    tutorialId?: string
    featureId?: string
    coordinates?: string
    resourceId?: string
    amount?: number
  }>
}

// Game event node data (for events like craft-complete, resource thresholds)
export interface GameEventNodeData {
  nodeType: 'game-event'
  eventType: string // e.g., 'craft-complete', 'resource-threshold'
  eventId: string
  description?: string
  value?: number
  operator?: string
}

// Feature node data (for features like Foundry, Quartermaster, etc.)
export interface FeatureNodeData {
  nodeType: 'feature'
  featureId: string
  featureType: string
  name: string
  areaType: string
  icon?: string
  interactionType?: string
}

// Edge in the quest chain graph
export interface QuestChainEdge {
  id: string
  source: string
  target: string
  type: QuestChainEdgeType
  label?: string
  data?: {
    description?: string
    conditionType?: string
  }
}

// Validation issue for the quest chain
export interface QuestChainValidationIssue {
  type: 'error' | 'warning'
  nodeId?: string
  edgeId?: string
  message: string
  suggestion?: string
}

// Filter options for the graph view
export interface QuestChainFilters {
  showObjectives: boolean
  showDialogTrees: boolean
  showTutorials: boolean
  showDialogTriggers: boolean
  showAreaTriggers: boolean
  showGameEvents: boolean
  showFeatures: boolean
  searchQuery: string
  categoryFilter: 'all' | 'main' | 'secondary'
}

// The complete quest chain graph
export interface QuestChainGraph {
  nodes: QuestChainNode[]
  edges: QuestChainEdge[]
}

// Position for auto-layout
export interface NodePosition {
  x: number
  y: number
}

// Node with position for Vue Flow
export interface PositionedNode extends QuestChainNode {
  position: NodePosition
}
