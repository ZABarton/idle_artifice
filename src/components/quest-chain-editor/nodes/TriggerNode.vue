<script setup lang="ts">
import { Handle, Position } from '@vue-flow/core'
import type {
  DialogTriggerNodeData,
  AreaTriggerNodeData,
  QuestChainNodeType,
} from '@/types/questChainEditor'

const props = defineProps<{
  id: string
  data: {
    nodeId: string
    label: string
    nodeType: QuestChainNodeType
    nodeData: DialogTriggerNodeData | AreaTriggerNodeData
    isSelected: boolean
    hasError: boolean
    hasWarning: boolean
  }
}>()

const isAreaTrigger = props.data.nodeType === 'area-trigger'
const isDialogTrigger = props.data.nodeType === 'dialog-trigger'
</script>

<template>
  <div
    class="trigger-node"
    :class="{
      selected: data.isSelected,
      'has-error': data.hasError,
      'has-warning': data.hasWarning,
      'area-trigger': isAreaTrigger,
      'dialog-trigger': isDialogTrigger,
    }"
  >
    <Handle type="target" :position="Position.Top" />

    <div class="node-header">
      <span class="node-icon">{{ isAreaTrigger ? '📍' : '⚡' }}</span>
      <span class="node-type">{{ isAreaTrigger ? 'Area Trigger' : 'Dialog Trigger' }}</span>
      <span v-if="data.hasError" class="status-badge error">!</span>
      <span v-else-if="data.hasWarning" class="status-badge warning">!</span>
    </div>

    <div class="node-content">
      <!-- Area Trigger Content -->
      <template v-if="isAreaTrigger">
        <div class="node-title">
          {{ (data.nodeData as AreaTriggerNodeData).areaType }}
        </div>
        <div class="node-event">
          {{ (data.nodeData as AreaTriggerNodeData).event }}
        </div>
        <div class="node-meta">
          <span class="meta-item">
            {{ (data.nodeData as AreaTriggerNodeData).actions.length }} action{{
              (data.nodeData as AreaTriggerNodeData).actions.length !== 1 ? 's' : ''
            }}
          </span>
        </div>
      </template>

      <!-- Dialog Trigger Content -->
      <template v-else>
        <div class="node-title">
          {{ (data.nodeData as DialogTriggerNodeData).triggerId }}
        </div>
        <div class="node-target">
          → {{ (data.nodeData as DialogTriggerNodeData).dialogTreeId }}
        </div>
        <div class="node-meta">
          <span class="meta-item priority">
            Priority: {{ (data.nodeData as DialogTriggerNodeData).priority }}
          </span>
          <span class="meta-item">
            {{ (data.nodeData as DialogTriggerNodeData).conditions.length }} condition{{
              (data.nodeData as DialogTriggerNodeData).conditions.length !== 1 ? 's' : ''
            }}
          </span>
        </div>
      </template>
    </div>

    <Handle type="source" :position="Position.Bottom" />
  </div>
</template>

<style scoped>
.trigger-node {
  background-color: #fce4ec;
  border: 2px solid #c2185b;
  border-radius: 8px;
  padding: 8px 12px;
  min-width: 180px;
  max-width: 250px;
  cursor: pointer;
  transition: all 0.2s;
}

.trigger-node.area-trigger {
  background-color: #e1f5fe;
  border-color: #0288d1;
}

.trigger-node:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.trigger-node.selected {
  border-color: #880e4f;
  box-shadow: 0 0 0 3px rgba(194, 24, 91, 0.3);
}

.trigger-node.area-trigger.selected {
  border-color: #01579b;
  box-shadow: 0 0 0 3px rgba(2, 136, 209, 0.3);
}

.trigger-node.has-error {
  border-color: #d32f2f;
  background-color: #ffebee;
}

.trigger-node.has-warning {
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
  text-transform: capitalize;
}

.node-event {
  font-size: 0.8rem;
  color: #0288d1;
  font-family: monospace;
}

.node-target {
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

.meta-item.priority {
  background-color: rgba(194, 24, 91, 0.15);
}

.area-trigger .meta-item.priority {
  background-color: rgba(2, 136, 209, 0.15);
}
</style>
