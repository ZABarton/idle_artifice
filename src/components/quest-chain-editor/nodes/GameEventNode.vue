<script setup lang="ts">
import { Handle, Position } from '@vue-flow/core'
import type { GameEventNodeData } from '@/types/questChainEditor'

defineProps<{
  id: string
  data: {
    nodeId: string
    label: string
    nodeData: GameEventNodeData
    isSelected: boolean
    hasError: boolean
    hasWarning: boolean
  }
}>()

function getEventIcon(eventType: string): string {
  switch (eventType) {
    case 'craft-complete':
      return '🔨'
    case 'resource-threshold':
      return '📦'
    case 'time-elapsed':
      return '⏱️'
    default:
      return '⚡'
  }
}
</script>

<template>
  <div
    class="game-event-node"
    :class="{
      selected: data.isSelected,
      'has-error': data.hasError,
      'has-warning': data.hasWarning,
    }"
  >
    <Handle type="target" :position="Position.Top" />

    <div class="node-header">
      <span class="node-icon">{{ getEventIcon(data.nodeData.eventType) }}</span>
      <span class="node-type">Game Event</span>
      <span v-if="data.hasError" class="status-badge error">!</span>
      <span v-else-if="data.hasWarning" class="status-badge warning">!</span>
    </div>

    <div class="node-content">
      <div class="node-title">{{ data.nodeData.eventType }}</div>
      <div v-if="data.nodeData.value !== undefined" class="node-value">
        <span class="operator">{{ data.nodeData.operator || '=' }}</span>
        <span class="value">{{ data.nodeData.value }}</span>
      </div>
    </div>

    <Handle type="source" :position="Position.Bottom" />
  </div>
</template>

<style scoped>
.game-event-node {
  background-color: #fff8e1;
  border: 2px solid #ffc107;
  border-radius: 8px;
  padding: 8px 12px;
  min-width: 160px;
  max-width: 220px;
  cursor: pointer;
  transition: all 0.2s;
}

.game-event-node:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.game-event-node.selected {
  border-color: #ff8f00;
  box-shadow: 0 0 0 3px rgba(255, 193, 7, 0.3);
}

.game-event-node.has-error {
  border-color: #d32f2f;
  background-color: #ffebee;
}

.game-event-node.has-warning {
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
}

.node-value {
  display: flex;
  align-items: center;
  gap: 4px;
  font-family: monospace;
  font-size: 0.85rem;
}

.operator {
  color: #666;
}

.value {
  color: #ff8f00;
  font-weight: 600;
}
</style>
