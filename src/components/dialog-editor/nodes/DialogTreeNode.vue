<script setup lang="ts">
import { computed } from 'vue'
import { Handle, Position } from '@vue-flow/core'
import { useDialogEditorStore } from '@/stores/dialogEditor'

const props = defineProps<{
  id: string
  data: {
    nodeId: string
    message: string
    isStartNode: boolean
    hasError: boolean
    hasWarning: boolean
    isOrphaned: boolean
  }
}>()

const store = useDialogEditorStore()

const isSelected = computed(() => store.selectedNodeId === props.id)

const nodeClass = computed(() => {
  const classes = ['dialog-node']
  if (isSelected.value) classes.push('selected')
  if (props.data.isStartNode) classes.push('start-node')
  if (props.data.hasError) classes.push('error-node')
  else if (props.data.hasWarning) classes.push('warning-node')
  if (props.data.isOrphaned) classes.push('orphaned-node')
  return classes.join(' ')
})

const truncatedMessage = computed(() => {
  const maxLength = 50
  if (props.data.message.length <= maxLength) return props.data.message
  return props.data.message.substring(0, maxLength) + '...'
})
</script>

<template>
  <div :class="nodeClass">
    <Handle type="target" :position="Position.Left" />

    <div class="node-header">
      <strong>{{ data.nodeId }}</strong>
      <span v-if="data.isStartNode" class="start-badge">START</span>
    </div>
    <div class="node-content">
      {{ truncatedMessage }}
    </div>

    <Handle type="source" :position="Position.Right" />
  </div>
</template>

<style scoped>
.dialog-node {
  padding: 12px;
  border: 2px solid #333;
  border-radius: 8px;
  background-color: white;
  min-width: 180px;
  max-width: 250px;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.dialog-node:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.dialog-node.selected {
  border-color: #2196f3;
  border-width: 3px;
  box-shadow: 0 0 0 3px rgba(33, 150, 243, 0.2);
}

.dialog-node.start-node {
  border-color: #4caf50;
}

.dialog-node.error-node {
  border-color: #f44336;
  background-color: #ffebee;
}

.dialog-node.warning-node {
  border-color: #ff9800;
  background-color: #fff3e0;
}

.dialog-node.orphaned-node {
  border-style: dashed;
  border-color: #f44336;
}

.node-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 0.85rem;
}

.node-header strong {
  color: #333;
}

.start-badge {
  font-size: 0.65rem;
  background-color: #4caf50;
  color: white;
  padding: 2px 6px;
  border-radius: 3px;
  font-weight: bold;
}

.node-content {
  font-size: 0.8rem;
  color: #666;
  line-height: 1.4;
  word-wrap: break-word;
}
</style>
