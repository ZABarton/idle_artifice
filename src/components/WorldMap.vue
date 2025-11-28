<script setup lang="ts">
import { computed, ref } from 'vue'
import { useWorldMapStore } from '@/stores/worldMap'
import { useHexGrid } from '@/composables/useHexGrid'
import type { HexTile } from '@/types/hex'

const worldMapStore = useWorldMapStore()
const { hexToPixel } = useHexGrid()

// Hexagon size from HexClass
const hexRadius = 30

// Pan and drag state
const panOffset = ref({ x: 0, y: 0 })
const isDragging = ref(false)
const dragStart = ref({ x: 0, y: 0 })

/**
 * Calculates the corner points of a flat-top hexagon
 * Returns a string suitable for SVG polygon points attribute
 */
const getHexagonPoints = (centerX: number, centerY: number): string => {
  const points: string[] = []
  // For flat-top hexagons, corners are at 0°, 60°, 120°, 180°, 240°, 300°
  for (let i = 0; i < 6; i++) {
    const angleDeg = 60 * i
    const angleRad = (Math.PI / 180) * angleDeg
    const x = centerX + hexRadius * Math.cos(angleRad)
    const y = centerY + hexRadius * Math.sin(angleRad)
    points.push(`${x},${y}`)
  }
  return points.join(' ')
}

/**
 * Computed property that generates polygon data for each hex tile
 */
const hexagons = computed(() => {
  return worldMapStore.hexTiles.map((tile: HexTile) => {
    const { x, y } = hexToPixel(tile.q, tile.r)
    return {
      tile,
      points: getHexagonPoints(x, y),
      center: { x, y },
      fill: tile.explorationStatus === 'explored' ? '#90EE90' : '#CCCCCC',
      stroke: '#333333',
    }
  })
})

/**
 * Computed bounding box for pan limits
 * Includes a margin beyond the outermost hexagons
 */
const panBounds = computed(() => {
  if (hexagons.value.length === 0) {
    return { minX: -150, maxX: 150, minY: -150, maxY: 150 }
  }

  // Find the min/max coordinates of all hex centers
  let minX = Infinity
  let maxX = -Infinity
  let minY = Infinity
  let maxY = -Infinity

  hexagons.value.forEach((hex) => {
    minX = Math.min(minX, hex.center.x - hexRadius)
    maxX = Math.max(maxX, hex.center.x + hexRadius)
    minY = Math.min(minY, hex.center.y - hexRadius)
    maxY = Math.max(maxY, hex.center.y + hexRadius)
  })

  // Add margin beyond outermost hexes
  const margin = 50
  return {
    minX: minX - margin,
    maxX: maxX + margin,
    minY: minY - margin,
    maxY: maxY + margin,
  }
})

/**
 * Computed viewBox that incorporates pan offset
 */
const viewBox = computed(() => {
  const baseX = -150 + panOffset.value.x
  const baseY = -150 + panOffset.value.y
  const width = 300
  const height = 300
  return `${baseX} ${baseY} ${width} ${height}`
})

/**
 * Mouse event handlers for drag-to-pan
 */
const handleMouseDown = (event: MouseEvent) => {
  isDragging.value = true
  dragStart.value = { x: event.clientX, y: event.clientY }
}

const handleMouseMove = (event: MouseEvent) => {
  if (!isDragging.value) return

  // Calculate the drag delta in screen pixels
  const deltaX = event.clientX - dragStart.value.x
  const deltaY = event.clientY - dragStart.value.y

  // Get the SVG element to calculate the proper scale factor
  const svg = event.currentTarget as SVGSVGElement
  const rect = svg.getBoundingClientRect()

  // Calculate scale factor from screen pixels to viewBox units
  // viewBox is 300 units, rect.width is screen pixels
  const scaleX = 300 / rect.width
  const scaleY = 300 / rect.height

  // Calculate new pan offset (subtract because we're moving the viewBox, not the content)
  const newX = panOffset.value.x - (deltaX * scaleX)
  const newY = panOffset.value.y - (deltaY * scaleY)

  // Clamp pan offset to stay within bounds
  // viewBox dimensions are 300x300, so we need to account for that
  const bounds = panBounds.value

  const clampedX = Math.max(
    bounds.minX + 150,
    Math.min(newX, bounds.maxX - 150)
  )
  const clampedY = Math.max(
    bounds.minY + 150,
    Math.min(newY, bounds.maxY - 150)
  )

  panOffset.value = { x: clampedX, y: clampedY }

  // Update drag start for next move event
  dragStart.value = { x: event.clientX, y: event.clientY }
}

const handleMouseUp = () => {
  isDragging.value = false
}

const handleMouseLeave = () => {
  // Stop dragging if mouse leaves the SVG area
  isDragging.value = false
}
</script>

<template>
  <div class="world-map-container">
    <svg
      class="world-map-svg"
      :viewBox="viewBox"
      preserveAspectRatio="xMidYMid meet"
      @mousedown="handleMouseDown"
      @mousemove="handleMouseMove"
      @mouseup="handleMouseUp"
      @mouseleave="handleMouseLeave"
    >
      <g
        v-for="hex in hexagons"
        :key="`${hex.tile.q},${hex.tile.r}`"
        class="hex-tile"
      >
        <polygon
          :points="hex.points"
          :fill="hex.fill"
          :stroke="hex.stroke"
          stroke-width="2"
        />
      </g>
    </svg>
  </div>
</template>

<style scoped>
.world-map-container {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f5f5f5;
  overflow: auto;
}

.world-map-svg {
  width: 100%;
  height: 100%;
  max-width: 1200px;
  max-height: 900px;
  /* Hexagon width is 60 viewBox units (2 * radius of 30)
     To keep hexagons at minimum 150px wide:
     300 viewBox units / 60 units per hex * 150px = 750px minimum */
  min-width: 750px;
  min-height: 750px;
  cursor: grab;
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
}

.world-map-svg:active {
  cursor: grabbing;
}

.hex-tile {
  cursor: default;
  pointer-events: none;
}
</style>
