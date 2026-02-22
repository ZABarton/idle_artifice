<script setup lang="ts">
import { Handle, Position } from '@vue-flow/core'
import type { DialogTreeNodeData } from '@/types/questChainEditor'

defineProps<{
  id: string
  data: {
    nodeId: string
    label: string
    nodeData: DialogTreeNodeData
    isSelected: boolean
    hasError: boolean
    hasWarning: boolean
  }
}>()
</script>

<template>
  <div
    class="dialog-tree-node"
    :class="{
      selected: data.isSelected,
      'has-error': data.hasError,
      'has-warning': data.hasWarning,
    }"
  >
    <Handle type="target" :position="Position.Top" />

    <div class="node-header">
      <span class="node-icon">💬</span>
      <span class="node-type">Dialog Tree</span>
      <span v-if="data.hasError" class="status-badge error">!</span>
      <span v-else-if="data.hasWarning" class="status-badge warning">!</span>
    </div>

    <div class="node-content">
      <div class="node-title">{{ data.nodeData.characterName }}</div>
      <div class="node-id">{{ data.nodeData.treeId }}</div>
      <div class="node-meta">
        <span class="meta-item">{{ data.nodeData.nodeCount }} nodes</span>
        <span v-if="data.nodeData.onComplete?.length" class="meta-item actions">
          {{ data.nodeData.onComplete.length }} actions
        </span>
      </div>
    </div>

    <Handle type="source" :position="Position.Bottom" />
  </div>
</template>

<style scoped>
.dialog-tree-node {
  background-color: #e8f5e9;
  border: 2px solid #388e3c;
  border-radius: 8px;
  padding: 8px 12px;
  min-width: 180px;
  max-width: 250px;
  cursor: pointer;
  transition: all 0.2s;
}

.dialog-tree-node:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.dialog-tree-node.selected {
  border-color: #1b5e20;
  box-shadow: 0 0 0 3px rgba(56, 142, 60, 0.3);
}

.dialog-tree-node.has-error {
  border-color: #d32f2f;
  background-color: #ffebee;
}

.dialog-tree-node.has-warning {
  border-color: #f57c00;
  background-color: #fff3e0;
}

.node-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 6px;
  font-size: 0.75rem;
  color: #666;
}

.node-icon {
  font-size: 1rem;
}

.node-type {
  text-transform: uppercase;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.status-badge {
  margin-left: auto;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
  font-weight: bold;
  color: white;
}

.status-badge.error {
  background-color: #d32f2f;
}

.status-badge.warning {
  background-color: #f57c00;
}

.node-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.node-title {
  font-size: 0.9rem;
  font-weight: 600;
  color: #333;
  line-height: 1.3;
}

.node-id {
  font-size: 0.75rem;
  color: #666;
  font-family: monospace;
}

.node-meta {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 2px;
}

.meta-item {
  font-size: 0.7rem;
  padding: 2px 6px;
  border-radius: 4px;
  background-color: rgba(0, 0, 0, 0.1);
}

.meta-item.actions {
  background-color: rgba(56, 142, 60, 0.2);
}
</style>
