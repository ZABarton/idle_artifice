<script setup lang="ts">
import { Handle, Position } from '@vue-flow/core'
import type { TutorialNodeData } from '@/types/questChainEditor'

defineProps<{
  id: string
  data: {
    nodeId: string
    label: string
    nodeData: TutorialNodeData
    isSelected: boolean
    hasError: boolean
    hasWarning: boolean
  }
}>()
</script>

<template>
  <div
    class="tutorial-node"
    :class="{
      selected: data.isSelected,
      'has-error': data.hasError,
      'has-warning': data.hasWarning,
    }"
  >
    <Handle type="target" :position="Position.Top" />

    <div class="node-header">
      <span class="node-icon">📚</span>
      <span class="node-type">Tutorial</span>
      <span v-if="data.hasError" class="status-badge error">!</span>
      <span v-else-if="data.hasWarning" class="status-badge warning">!</span>
    </div>

    <div class="node-content">
      <div class="node-title">{{ data.nodeData.title }}</div>
      <div class="node-id">{{ data.nodeData.tutorialId }}</div>
      <div class="node-meta">
        <span v-if="data.nodeData.showOnce" class="meta-item show-once">Show Once</span>
        <span class="meta-item">
          {{ data.nodeData.triggerConditions.length }} condition{{
            data.nodeData.triggerConditions.length !== 1 ? 's' : ''
          }}
        </span>
      </div>
    </div>

    <Handle type="source" :position="Position.Bottom" />
  </div>
</template>

<style scoped>
.tutorial-node {
  background-color: #fff3e0;
  border: 2px solid #f57c00;
  border-radius: 8px;
  padding: 8px 12px;
  min-width: 180px;
  max-width: 250px;
  cursor: pointer;
  transition: all 0.2s;
}

.tutorial-node:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.tutorial-node.selected {
  border-color: #e65100;
  box-shadow: 0 0 0 3px rgba(245, 124, 0, 0.3);
}

.tutorial-node.has-error {
  border-color: #d32f2f;
  background-color: #ffebee;
}

.tutorial-node.has-warning {
  border-color: #ffa000;
  background-color: #fff8e1;
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

.meta-item.show-once {
  background-color: rgba(245, 124, 0, 0.2);
}
</style>
