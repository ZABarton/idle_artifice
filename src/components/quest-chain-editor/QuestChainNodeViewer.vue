<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useQuestChainEditorStore } from '@/stores/questChainEditor'
import type {
  ObjectiveNodeData,
  DialogTreeNodeData,
  TutorialNodeData,
  DialogTriggerNodeData,
  AreaTriggerNodeData,
} from '@/types/questChainEditor'

const store = useQuestChainEditorStore()
const router = useRouter()

const node = computed(() => store.selectedNode)
const nodeIssues = computed(() => {
  if (!node.value) return []
  return store.getNodeIssues(node.value.id)
})

// Type guards for node data
const isObjective = computed(() => node.value?.type === 'objective')
const isDialogTree = computed(() => node.value?.type === 'dialog-tree')
const isTutorial = computed(() => node.value?.type === 'tutorial')
const isDialogTrigger = computed(() => node.value?.type === 'dialog-trigger')
const isAreaTrigger = computed(() => node.value?.type === 'area-trigger')

const objectiveData = computed(() => node.value?.data as ObjectiveNodeData | undefined)
const dialogTreeData = computed(() => node.value?.data as DialogTreeNodeData | undefined)
const tutorialData = computed(() => node.value?.data as TutorialNodeData | undefined)
const dialogTriggerData = computed(() => node.value?.data as DialogTriggerNodeData | undefined)
const areaTriggerData = computed(() => node.value?.data as AreaTriggerNodeData | undefined)

// Get connected nodes
const incomingEdges = computed(() => {
  if (!node.value || !store.graph) return []
  return store.graph.edges.filter((e) => e.target === node.value!.id)
})

const outgoingEdges = computed(() => {
  if (!node.value || !store.graph) return []
  return store.graph.edges.filter((e) => e.source === node.value!.id)
})

function openInDialogEditor() {
  if (dialogTreeData.value) {
    // Navigate to dialog editor with the tree ID
    router.push(`/dev/dialog-editor?tree=${dialogTreeData.value.treeId}`)
  }
}

function navigateToNode(nodeId: string) {
  store.selectNode(nodeId)
}

function getNodeLabel(nodeId: string): string {
  const targetNode = store.graph?.nodes.find((n) => n.id === nodeId)
  return targetNode?.label || nodeId
}
</script>

<template>
  <div class="node-viewer">
    <template v-if="node">
      <!-- Header -->
      <div class="viewer-header">
        <div class="node-type-badge" :class="node.type">
          {{ node.type.replace('-', ' ') }}
        </div>
        <h3 class="node-title">{{ node.label }}</h3>
      </div>

      <!-- Validation Issues -->
      <div v-if="nodeIssues.length > 0" class="issues-section">
        <div
          v-for="(issue, index) in nodeIssues"
          :key="index"
          class="issue-item"
          :class="issue.type"
        >
          <span class="issue-icon">{{ issue.type === 'error' ? '❌' : '⚠️' }}</span>
          <div class="issue-content">
            <span class="issue-message">{{ issue.message }}</span>
            <span v-if="issue.suggestion" class="issue-suggestion">{{ issue.suggestion }}</span>
          </div>
        </div>
      </div>

      <!-- Objective Details -->
      <template v-if="isObjective && objectiveData">
        <div class="detail-section">
          <h4>Objective Details</h4>
          <div class="detail-row">
            <span class="detail-label">ID:</span>
            <span class="detail-value mono">{{ objectiveData.objectiveId }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Status:</span>
            <span class="detail-value status-badge" :class="objectiveData.status">
              {{ objectiveData.status }}
            </span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Category:</span>
            <span class="detail-value">{{ objectiveData.category }}</span>
          </div>
          <div v-if="objectiveData.targetLocation" class="detail-row">
            <span class="detail-label">Target:</span>
            <span class="detail-value mono">{{ objectiveData.targetLocation }}</span>
          </div>
          <div v-if="objectiveData.maxProgress" class="detail-row">
            <span class="detail-label">Progress:</span>
            <span class="detail-value">
              {{ objectiveData.currentProgress || 0 }} / {{ objectiveData.maxProgress }}
            </span>
          </div>
        </div>

        <div class="detail-section">
          <h4>Description</h4>
          <p class="description-text">{{ objectiveData.description }}</p>
        </div>

        <div v-if="objectiveData.subtasks?.length" class="detail-section">
          <h4>Subtasks</h4>
          <ul class="subtask-list">
            <li v-for="subtask in objectiveData.subtasks" :key="subtask.id">
              <span class="subtask-status">{{ subtask.completed ? '✓' : '○' }}</span>
              {{ subtask.description }}
            </li>
          </ul>
        </div>

        <div v-if="objectiveData.discoveryConditions?.length" class="detail-section">
          <h4>Discovery Conditions</h4>
          <ul class="condition-list">
            <li v-for="(cond, index) in objectiveData.discoveryConditions" :key="index">
              <span class="condition-type">{{ cond.type }}:</span>
              {{ cond.description || cond.id }}
            </li>
          </ul>
        </div>
      </template>

      <!-- Dialog Tree Details -->
      <template v-if="isDialogTree && dialogTreeData">
        <div class="detail-section">
          <h4>Dialog Tree Details</h4>
          <div class="detail-row">
            <span class="detail-label">ID:</span>
            <span class="detail-value mono">{{ dialogTreeData.treeId }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Character:</span>
            <span class="detail-value">{{ dialogTreeData.characterName }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Nodes:</span>
            <span class="detail-value">{{ dialogTreeData.nodeCount }}</span>
          </div>
        </div>

        <div v-if="dialogTreeData.onComplete?.length" class="detail-section">
          <h4>On Complete Actions</h4>
          <ul class="action-list">
            <li v-for="(action, index) in dialogTreeData.onComplete" :key="index">
              <span class="action-type">{{ action.type }}</span>
              <span v-if="action.objectiveId" class="action-target">
                → {{ action.objectiveId }}
              </span>
              <span v-if="action.tutorialId" class="action-target">
                → {{ action.tutorialId }}
              </span>
              <span v-if="action.dialogTreeId" class="action-target">
                → {{ action.dialogTreeId }}
              </span>
            </li>
          </ul>
        </div>

        <div class="action-buttons">
          <button class="btn-primary" @click="openInDialogEditor">Open in Dialog Editor</button>
        </div>
      </template>

      <!-- Tutorial Details -->
      <template v-if="isTutorial && tutorialData">
        <div class="detail-section">
          <h4>Tutorial Details</h4>
          <div class="detail-row">
            <span class="detail-label">ID:</span>
            <span class="detail-value mono">{{ tutorialData.tutorialId }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Title:</span>
            <span class="detail-value">{{ tutorialData.title }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Show Once:</span>
            <span class="detail-value">{{ tutorialData.showOnce ? 'Yes' : 'No' }}</span>
          </div>
        </div>

        <div v-if="tutorialData.triggerConditions?.length" class="detail-section">
          <h4>Trigger Conditions</h4>
          <ul class="condition-list">
            <li v-for="(cond, index) in tutorialData.triggerConditions" :key="index">
              <span class="condition-type">{{ cond.type }}</span>
              <span v-if="cond.id">: {{ cond.id }}</span>
              <span v-if="cond.description" class="condition-desc">
                ({{ cond.description }})
              </span>
            </li>
          </ul>
        </div>
      </template>

      <!-- Dialog Trigger Details -->
      <template v-if="isDialogTrigger && dialogTriggerData">
        <div class="detail-section">
          <h4>Dialog Trigger Details</h4>
          <div class="detail-row">
            <span class="detail-label">ID:</span>
            <span class="detail-value mono">{{ dialogTriggerData.triggerId }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Target Tree:</span>
            <span class="detail-value mono">{{ dialogTriggerData.dialogTreeId }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Priority:</span>
            <span class="detail-value">{{ dialogTriggerData.priority }}</span>
          </div>
        </div>

        <div v-if="dialogTriggerData.description" class="detail-section">
          <h4>Description</h4>
          <p class="description-text">{{ dialogTriggerData.description }}</p>
        </div>

        <div v-if="dialogTriggerData.conditions?.length" class="detail-section">
          <h4>Conditions</h4>
          <ul class="condition-list">
            <li v-for="(cond, index) in dialogTriggerData.conditions" :key="index">
              <span class="condition-type">{{ cond.type }}</span>
              <span v-if="cond.id">: {{ cond.id }}</span>
              <span v-if="cond.value !== undefined">= {{ cond.value }}</span>
            </li>
          </ul>
        </div>
      </template>

      <!-- Area Trigger Details -->
      <template v-if="isAreaTrigger && areaTriggerData">
        <div class="detail-section">
          <h4>Area Trigger Details</h4>
          <div class="detail-row">
            <span class="detail-label">ID:</span>
            <span class="detail-value mono">{{ areaTriggerData.triggerId }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Area:</span>
            <span class="detail-value">{{ areaTriggerData.areaType }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Event:</span>
            <span class="detail-value mono">{{ areaTriggerData.event }}</span>
          </div>
          <div v-if="areaTriggerData.featureId" class="detail-row">
            <span class="detail-label">Feature:</span>
            <span class="detail-value mono">{{ areaTriggerData.featureId }}</span>
          </div>
        </div>

        <div v-if="areaTriggerData.description" class="detail-section">
          <h4>Description</h4>
          <p class="description-text">{{ areaTriggerData.description }}</p>
        </div>

        <div v-if="areaTriggerData.actions?.length" class="detail-section">
          <h4>Actions</h4>
          <ul class="action-list">
            <li v-for="(action, index) in areaTriggerData.actions" :key="index">
              <span class="action-type">{{ action.type }}</span>
              <span v-if="action.dialogId" class="action-target">→ {{ action.dialogId }}</span>
              <span v-if="action.objectiveId" class="action-target">
                → {{ action.objectiveId }}
              </span>
              <span v-if="action.tutorialId" class="action-target">
                → {{ action.tutorialId }}
              </span>
            </li>
          </ul>
        </div>
      </template>

      <!-- Connections -->
      <div v-if="incomingEdges.length > 0 || outgoingEdges.length > 0" class="detail-section">
        <h4>Connections</h4>

        <div v-if="incomingEdges.length > 0" class="connections-group">
          <span class="connections-label">Incoming:</span>
          <ul class="connections-list">
            <li
              v-for="edge in incomingEdges"
              :key="edge.id"
              class="connection-item"
              @click="navigateToNode(edge.source)"
            >
              <span class="edge-type" :class="edge.type">{{ edge.type }}</span>
              <span class="connection-node">{{ getNodeLabel(edge.source) }}</span>
            </li>
          </ul>
        </div>

        <div v-if="outgoingEdges.length > 0" class="connections-group">
          <span class="connections-label">Outgoing:</span>
          <ul class="connections-list">
            <li
              v-for="edge in outgoingEdges"
              :key="edge.id"
              class="connection-item"
              @click="navigateToNode(edge.target)"
            >
              <span class="edge-type" :class="edge.type">{{ edge.type }}</span>
              <span class="connection-node">{{ getNodeLabel(edge.target) }}</span>
            </li>
          </ul>
        </div>
      </div>

      <!-- Source File -->
      <div v-if="node.sourceFile" class="detail-section source-file">
        <span class="source-label">Source:</span>
        <span class="source-path">{{ node.sourceFile }}</span>
      </div>
    </template>

    <!-- Empty State -->
    <div v-else class="empty-state">
      <p>No node selected</p>
      <p class="hint">Click a node on the canvas to view details</p>
    </div>
  </div>
</template>

<style scoped>
.node-viewer {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  height: 100%;
  overflow-y: auto;
}

.viewer-header {
  border-bottom: 1px solid #e0e0e0;
  padding-bottom: 1rem;
}

.node-type-badge {
  display: inline-block;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 2px 8px;
  border-radius: 4px;
  margin-bottom: 0.5rem;
}

.node-type-badge.objective {
  background-color: #e3f2fd;
  color: #1976d2;
}

.node-type-badge.dialog-tree {
  background-color: #e8f5e9;
  color: #388e3c;
}

.node-type-badge.tutorial {
  background-color: #fff3e0;
  color: #f57c00;
}

.node-type-badge.dialog-trigger {
  background-color: #fce4ec;
  color: #c2185b;
}

.node-type-badge.area-trigger {
  background-color: #e1f5fe;
  color: #0288d1;
}

.node-title {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #333;
}

.issues-section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.issue-item {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  padding: 0.5rem;
  border-radius: 4px;
}

.issue-item.error {
  background-color: #ffebee;
  border: 1px solid #ffcdd2;
}

.issue-item.warning {
  background-color: #fff3e0;
  border: 1px solid #ffe0b2;
}

.issue-icon {
  flex-shrink: 0;
}

.issue-content {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.issue-message {
  font-size: 0.85rem;
  color: #333;
}

.issue-suggestion {
  font-size: 0.75rem;
  color: #666;
  font-style: italic;
}

.detail-section {
  border-bottom: 1px solid #f0f0f0;
  padding-bottom: 1rem;
}

.detail-section:last-child {
  border-bottom: none;
}

.detail-section h4 {
  margin: 0 0 0.5rem 0;
  font-size: 0.85rem;
  font-weight: 600;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.detail-row {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.25rem;
  font-size: 0.9rem;
}

.detail-label {
  color: #666;
  flex-shrink: 0;
}

.detail-value {
  color: #333;
}

.detail-value.mono {
  font-family: monospace;
  font-size: 0.85rem;
}

.status-badge {
  display: inline-block;
  padding: 1px 6px;
  border-radius: 4px;
  font-size: 0.8rem;
  text-transform: capitalize;
}

.status-badge.active {
  background-color: #e8f5e9;
  color: #2e7d32;
}

.status-badge.hidden {
  background-color: #f5f5f5;
  color: #757575;
}

.status-badge.completed {
  background-color: #e3f2fd;
  color: #1565c0;
}

.description-text {
  margin: 0;
  font-size: 0.9rem;
  color: #333;
  line-height: 1.5;
}

.subtask-list,
.condition-list,
.action-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.subtask-list li,
.condition-list li,
.action-list li {
  font-size: 0.85rem;
  padding: 0.25rem 0;
  color: #333;
}

.subtask-status {
  margin-right: 0.5rem;
  color: #4caf50;
}

.condition-type,
.action-type {
  font-weight: 500;
  color: #1976d2;
}

.action-target {
  color: #666;
  margin-left: 0.25rem;
}

.condition-desc {
  color: #999;
  font-size: 0.8rem;
}

.action-buttons {
  display: flex;
  gap: 0.5rem;
}

.btn-primary {
  padding: 0.5rem 1rem;
  background-color: #2196f3;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 0.85rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-primary:hover {
  background-color: #1976d2;
}

.connections-group {
  margin-bottom: 0.75rem;
}

.connections-label {
  font-size: 0.8rem;
  color: #666;
  display: block;
  margin-bottom: 0.25rem;
}

.connections-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.connection-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.15s;
}

.connection-item:hover {
  background-color: #f5f5f5;
}

.edge-type {
  font-size: 0.7rem;
  font-weight: 600;
  padding: 1px 4px;
  border-radius: 3px;
  text-transform: uppercase;
}

.edge-type.unlocks {
  background-color: #e3f2fd;
  color: #1976d2;
}

.edge-type.triggers {
  background-color: #f3e5f5;
  color: #7b1fa2;
}

.edge-type.completes {
  background-color: #e8f5e9;
  color: #388e3c;
}

.edge-type.completes-via-subtasks {
  background-color: #f1f8e9;
  color: #689f38;
}

.edge-type.requires {
  background-color: #fff3e0;
  color: #f57c00;
}

.edge-type.shows {
  background-color: #e1f5fe;
  color: #0288d1;
}

.connection-node {
  font-size: 0.85rem;
  color: #333;
}

.source-file {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding-top: 0.5rem;
}

.source-label {
  font-size: 0.75rem;
  color: #999;
}

.source-path {
  font-size: 0.75rem;
  color: #666;
  font-family: monospace;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #999;
  text-align: center;
}

.empty-state p {
  margin: 0.25rem 0;
}

.empty-state .hint {
  font-size: 0.85rem;
}
</style>
