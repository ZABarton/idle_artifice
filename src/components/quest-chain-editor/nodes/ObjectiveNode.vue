<script setup lang="ts">
import { Handle, Position } from '@vue-flow/core'
import type { ObjectiveNodeData } from '@/types/questChainEditor'

defineProps<{
  id: string
  data: {
    nodeId: string
    label: string
    nodeData: ObjectiveNodeData
    isSelected: boolean
    hasError: boolean
    hasWarning: boolean
  }
}>()
</script>

<template>
  <div
    class="objective-node"
    :class="{
      selected: data.isSelected,
      'has-error': data.hasError,
      'has-warning': data.hasWarning,
      'status-active': data.nodeData.status === 'active',
      'status-hidden': data.nodeData.status === 'hidden',
      'status-completed': data.nodeData.status === 'completed',
      'category-main': data.nodeData.category === 'main',
      'category-secondary': data.nodeData.category === 'secondary',
    }"
  >
    <Handle type="target" :position="Position.Top" />

    <div class="node-header">
      <span class="node-icon">{{ data.nodeData.category === 'main' ? '🎯' : '📋' }}</span>
      <span class="node-type">Objective</span>
      <span v-if="data.hasError" class="status-badge error">!</span>
      <span v-else-if="data.hasWarning" class="status-badge warning">!</span>
    </div>

    <div class="node-content">
      <div class="node-title">{{ data.nodeData.title }}</div>
      <div class="node-meta">
        <span class="meta-item status">{{ data.nodeData.status }}</span>
        <span v-if="data.nodeData.maxProgress" class="meta-item progress">
          {{ data.nodeData.currentProgress || 0 }}/{{ data.nodeData.maxProgress }}
        </span>
      </div>
    </div>

    <Handle type="source" :position="Position.Bottom" />
  </div>
</template>

<style scoped>
.objective-node {
  background-color: #e3f2fd;
  border: 2px solid #1976d2;
  border-radius: 8px;
  padding: 8px 12px;
  min-width: 180px;
  max-width: 250px;
  cursor: pointer;
  transition: all 0.2s;
}

.objective-node:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.objective-node.selected {
  border-color: #0d47a1;
  box-shadow: 0 0 0 3px rgba(25, 118, 210, 0.3);
}

.objective-node.has-error {
  border-color: #d32f2f;
  background-color: #ffebee;
}

.objective-node.has-warning {
  border-color: #f57c00;
  background-color: #fff3e0;
}

.objective-node.category-secondary {
  background-color: #f3e5f5;
  border-color: #7b1fa2;
}

.objective-node.category-secondary.selected {
  border-color: #4a148c;
  box-shadow: 0 0 0 3px rgba(123, 31, 162, 0.3);
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
  word-wrap: break-word;
}

.node-meta {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.meta-item {
  font-size: 0.7rem;
  padding: 2px 6px;
  border-radius: 4px;
  background-color: rgba(0, 0, 0, 0.1);
}

.meta-item.status {
  text-transform: capitalize;
}

.meta-item.progress {
  font-family: monospace;
}
</style>
