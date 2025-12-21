<script setup lang="ts">
import { computed } from 'vue'
import { EdgeLabelRenderer, getBezierPath } from '@vue-flow/core'
import type { EdgeProps } from '@vue-flow/core'

const props = defineProps<EdgeProps<{
  responseText: string
  responseIndex: number
}>>()

const path = computed(() => {
  const [edgePath] = getBezierPath({
    sourceX: props.sourceX,
    sourceY: props.sourceY,
    sourcePosition: props.sourcePosition,
    targetX: props.targetX,
    targetY: props.targetY,
    targetPosition: props.targetPosition,
  })
  return edgePath
})

const labelPosition = computed(() => {
  return {
    x: (props.sourceX + props.targetX) / 2,
    y: (props.sourceY + props.targetY) / 2,
  }
})

const truncatedText = computed(() => {
  const maxLength = 30
  if (props.data.responseText.length <= maxLength) return props.data.responseText
  return props.data.responseText.substring(0, maxLength) + '...'
})
</script>

<template>
  <g>
    <path
      :id="`edge-${id}`"
      :d="path"
      class="edge-path"
      :class="{ selected: selected }"
      marker-end="url(#arrowhead)"
    />

    <EdgeLabelRenderer>
      <div
        :style="{
          position: 'absolute',
          transform: `translate(-50%, -50%) translate(${labelPosition.x}px,${labelPosition.y}px)`,
          pointerEvents: 'all',
        }"
        class="edge-label"
        :class="{ selected: selected }"
      >
        {{ truncatedText }}
      </div>
    </EdgeLabelRenderer>
  </g>
</template>

<style scoped>
.edge-path {
  stroke: #888;
  stroke-width: 2;
  fill: none;
  transition: stroke 0.2s;
}

.edge-path:hover,
.edge-path.selected {
  stroke: #2196f3;
  stroke-width: 3;
}

.edge-label {
  background-color: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 0.75rem;
  color: #666;
  cursor: pointer;
  user-select: none;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  max-width: 150px;
  text-align: center;
}

.edge-label:hover,
.edge-label.selected {
  border-color: #2196f3;
  color: #2196f3;
  background-color: #e3f2fd;
}
</style>
