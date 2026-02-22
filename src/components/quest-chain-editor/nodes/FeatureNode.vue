<script setup lang="ts">
import { Handle, Position } from '@vue-flow/core'
import type { FeatureNodeData } from '@/types/questChainEditor'

defineProps<{
  id: string
  data: {
    nodeId: string
    label: string
    nodeData: FeatureNodeData
    isSelected: boolean
    hasError: boolean
    hasWarning: boolean
  }
}>()
</script>

<template>
  <div
    class="feature-node"
    :class="{
      selected: data.isSelected,
      'has-error': data.hasError,
      'has-warning': data.hasWarning,
    }"
  >
    <Handle type="target" :position="Position.Top" />

    <div class="node-header">
      <span class="node-icon">{{ data.nodeData.icon || '🏛️' }}</span>
      <span class="node-type">Feature</span>
      <span v-if="data.hasError" class="status-badge error">!</span>
      <span v-else-if="data.hasWarning" class="status-badge warning">!</span>
    </div>

    <div class="node-content">
      <div class="node-title">{{ data.nodeData.name }}</div>
      <div class="node-meta">
        <span class="feature-type">{{ data.nodeData.featureType }}</span>
        <span class="area-type">{{ data.nodeData.areaType }}</span>
      </div>
      <div v-if="data.nodeData.interactionType" class="node-info">
        {{ data.nodeData.interactionType }}
      </div>
    </div>

    <Handle type="source" :position="Position.Bottom" />
  </div>
</template>

<style scoped>
.feature-node {
  background-color: #f3e5f5;
  border: 2px solid #9c27b0;
  border-radius: 8px;
  padding: 8px 12px;
  min-width: 160px;
  max-width: 220px;
  cursor: pointer;
  transition: all 0.2s;
}

.feature-node:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.feature-node.selected {
  border-color: #7b1fa2;
  box-shadow: 0 0 0 3px rgba(156, 39, 176, 0.3);
}

.feature-node.has-error {
  border-color: #d32f2f;
  background-color: #ffebee;
}

.feature-node.has-warning {
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

.node-meta {
  display: flex;
  gap: 6px;
}

.feature-type,
.area-type {
  font-size: 0.7rem;
  padding: 2px 6px;
  background-color: rgba(156, 39, 176, 0.15);
  border-radius: 4px;
  color: #7b1fa2;
  text-transform: capitalize;
}

.node-info {
  font-size: 0.75rem;
  color: #666;
}
</style>
