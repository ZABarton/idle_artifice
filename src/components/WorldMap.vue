<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useWorldMapStore } from '@/stores/worldMap'
import { useNavigationStore } from '@/stores/navigation'
import { useDialogsStore } from '@/stores/dialogs'
import { useObjectivesStore } from '@/stores/objectives'
import { useHexGrid } from '@/composables/useHexGrid'
import type { HexTile } from '@/types/hex'

const worldMapStore = useWorldMapStore()
const navigationStore = useNavigationStore()
const dialogsStore = useDialogsStore()
const objectivesStore = useObjectivesStore()
const { hexToPixel } = useHexGrid()

const emit = defineEmits<{
  hexSelected: [tile: HexTile]
}>()

// Debug mode for showing coordinates
const showCoordinates = ref(false)

// Hexagon size from HexClass
const hexRadius = 30

// Pan and drag state
const panOffset = ref({ x: 0, y: 0 })
const isDragging = ref(false)
const dragStart = ref({ x: 0, y: 0 })
const dragDistance = ref(0) // Track total drag distance to distinguish from clicks

// Hex interaction state
const hoveredHex = ref<{ q: number; r: number } | null>(null)
const clickedHex = ref<{ q: number; r: number } | null>(null)

/**
 * Calculates the corner points of a flat-top hexagon
 * Returns a string suitable for SVG polygon points attribute
 */
const getHexagonPoints = (centerX: number, centerY: number, radius: number = hexRadius): string => {
  const points: string[] = []
  // For flat-top hexagons, corners are at 0°, 60°, 120°, 180°, 240°, 300°
  for (let i = 0; i < 6; i++) {
    const angleDeg = 60 * i
    const angleRad = (Math.PI / 180) * angleDeg
    const x = centerX + radius * Math.cos(angleRad)
    const y = centerY + radius * Math.sin(angleRad)
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
    const isClicked = clickedHex.value?.q === tile.q && clickedHex.value?.r === tile.r
    const isHovered = hoveredHex.value?.q === tile.q && hoveredHex.value?.r === tile.r

    // Determine fill color based on tile type and exploration status
    let fill = '#CCCCCC' // unexplored default
    if (tile.explorationStatus === 'explored') {
      fill = tile.type === 'ocean' ? '#87CEEB' : '#90EE90' // ocean: sky blue, other: light green
    }

    return {
      tile,
      points: getHexagonPoints(x, y),
      center: { x, y },
      fill,
      stroke: '#333333',
      strokeWidth: 2,
      opacity: isHovered && !isClicked ? 0.8 : 1, // Slight transparency on hover
      isClicked,
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
 * Check if content needs panning (extends beyond viewBox)
 */
const isPannable = computed(() => {
  const bounds = panBounds.value
  const viewBoxWidth = 300
  const viewBoxHeight = 300

  const contentWidth = bounds.maxX - bounds.minX
  const contentHeight = bounds.maxY - bounds.minY

  return contentWidth > viewBoxWidth || contentHeight > viewBoxHeight
})

/**
 * Get set of hex coordinates that have quest markers
 * Shows marker on the hex where the tracked objective can be completed
 * Returns Set of "q,r" coordinate strings
 */
const hexesWithActiveObjectives = computed(() => {
  const hexCoords = new Set<string>()

  // Get the currently tracked objective
  const trackedObjective = objectivesStore.getTrackedObjective

  // If there's a tracked objective with a target location, show marker there
  if (trackedObjective && trackedObjective.targetLocation) {
    hexCoords.add(trackedObjective.targetLocation)
  }

  return hexCoords
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
  // Only enable dragging if content needs panning
  if (!isPannable.value) return

  isDragging.value = true
  dragStart.value = { x: event.clientX, y: event.clientY }
  dragDistance.value = 0 // Reset drag distance
}

const handleMouseMove = (event: MouseEvent) => {
  if (!isDragging.value || !isPannable.value) return

  // Calculate the drag delta in screen pixels
  const deltaX = event.clientX - dragStart.value.x
  const deltaY = event.clientY - dragStart.value.y

  // Track total drag distance for click detection
  dragDistance.value += Math.sqrt(deltaX * deltaX + deltaY * deltaY)

  // Get the SVG element to calculate the proper scale factor
  const svg = event.currentTarget as SVGSVGElement
  const rect = svg.getBoundingClientRect()

  // Calculate scale factor from screen pixels to viewBox units
  // viewBox is 300 units, rect.width is screen pixels
  const scaleX = 300 / rect.width
  const scaleY = 300 / rect.height

  // Calculate new pan offset (subtract because we're moving the viewBox, not the content)
  const newX = panOffset.value.x - deltaX * scaleX
  const newY = panOffset.value.y - deltaY * scaleY

  // Clamp pan offset to stay within bounds
  // viewBox dimensions are 300x300, so we need to account for that
  const bounds = panBounds.value

  const clampedX = Math.max(bounds.minX + 150, Math.min(newX, bounds.maxX - 150))
  const clampedY = Math.max(bounds.minY + 150, Math.min(newY, bounds.maxY - 150))

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

/**
 * Hex interaction handlers
 */
const handleHexClick = (tile: HexTile) => {
  // Only register as a click if drag distance is below threshold (5px)
  if (dragDistance.value < 5) {
    clickedHex.value = { q: tile.q, r: tile.r }

    // Emit hex-selected event for explored, clickable tiles
    // clickable defaults to true if not specified
    const isClickable = tile.clickable !== false
    if (tile.explorationStatus === 'explored' && isClickable) {
      emit('hexSelected', tile)
    }
  }
}

const handleHexMouseEnter = (tile: HexTile) => {
  hoveredHex.value = { q: tile.q, r: tile.r }
}

const handleHexMouseLeave = () => {
  hoveredHex.value = null
}

/**
 * Keyboard handler for debug toggle
 */
const handleKeyPress = (event: KeyboardEvent) => {
  if (event.key === 'd' || event.key === 'D') {
    showCoordinates.value = !showCoordinates.value
  }
}

// Set up keyboard listener on mount
onMounted(() => {
  window.addEventListener('keypress', handleKeyPress)

  // Trigger world-map-usage tutorial on first view
  if (!navigationStore.hasViewedWorldMap) {
    navigationStore.markWorldMapViewed()
    dialogsStore.showTutorial('world-map-usage')
  }
})

// Clean up on unmount
onUnmounted(() => {
  window.removeEventListener('keypress', handleKeyPress)
})
</script>

<template>
  <div class="world-map-container">
    <svg
      :class="['world-map-svg', { pannable: isPannable }]"
      :viewBox="viewBox"
      preserveAspectRatio="xMidYMid meet"
      @mousedown="handleMouseDown"
      @mousemove="handleMouseMove"
      @mouseup="handleMouseUp"
      @mouseleave="handleMouseLeave"
    >
      <!-- Symbol definitions for hex type icons -->
      <defs>
        <!-- Academy icon: Building with triangular roof -->
        <symbol id="academy-icon" viewBox="0 0 24 24">
          <!-- Building base (rectangle) -->
          <rect x="6" y="10" width="12" height="10" fill="#8B4513" stroke="#5D2E0F" stroke-width="0.5" />
          <!-- Roof (triangle) -->
          <path d="M 4 10 L 12 4 L 20 10 Z" fill="#A0522D" stroke="#5D2E0F" stroke-width="0.5" />
          <!-- Door -->
          <rect x="10" y="14" width="4" height="6" fill="#5D2E0F" />
          <!-- Windows -->
          <rect x="8" y="12" width="2" height="2" fill="#FFE4B5" />
          <rect x="14" y="12" width="2" height="2" fill="#FFE4B5" />
        </symbol>

        <!-- Harbor icon: Anchor -->
        <symbol id="harbor-icon" viewBox="0 0 24 24">
          <!-- Anchor ring (top) -->
          <circle cx="12" cy="6" r="2" fill="none" stroke="#4A4A4A" stroke-width="1.5" />
          <!-- Anchor shaft (vertical line) -->
          <line x1="12" y1="8" x2="12" y2="18" stroke="#4A4A4A" stroke-width="1.5" />
          <!-- Cross bar (horizontal) -->
          <line x1="8" y1="12" x2="16" y2="12" stroke="#4A4A4A" stroke-width="1.5" />
          <!-- Left fluke -->
          <path d="M 8 18 Q 8 16 12 18" fill="none" stroke="#4A4A4A" stroke-width="1.5" />
          <!-- Right fluke -->
          <path d="M 16 18 Q 16 16 12 18" fill="none" stroke="#4A4A4A" stroke-width="1.5" />
        </symbol>
      </defs>

      <!-- Main hexagons layer -->
      <g v-for="hex in hexagons" :key="`${hex.tile.q},${hex.tile.r}`" class="hex-tile">
        <polygon
          :points="hex.points"
          :fill="hex.fill"
          :stroke="hex.stroke"
          :stroke-width="hex.strokeWidth"
          :opacity="hex.opacity"
          @click="handleHexClick(hex.tile)"
          @mouseenter="handleHexMouseEnter(hex.tile)"
          @mouseleave="handleHexMouseLeave"
        />
        <!-- Coordinate labels (debug mode) -->
        <text
          v-if="showCoordinates"
          :x="hex.center.x"
          :y="hex.center.y"
          text-anchor="middle"
          dominant-baseline="middle"
          class="hex-coordinates"
        >
          ({{ hex.tile.q }}, {{ hex.tile.r }})
        </text>
      </g>
      <!-- Hex type icons layer -->
      <g v-for="hex in hexagons" :key="`icon-${hex.tile.q},${hex.tile.r}`" class="hex-icon-layer">
        <!-- Academy icon -->
        <use
          v-if="hex.tile.type === 'academy'"
          :href="'#academy-icon'"
          :x="hex.center.x - 10"
          :y="hex.center.y - 10"
          width="20"
          height="20"
          class="hex-type-icon"
        />
        <!-- Harbor icon -->
        <use
          v-if="hex.tile.type === 'harbor'"
          :href="'#harbor-icon'"
          :x="hex.center.x - 10"
          :y="hex.center.y - 10"
          width="20"
          height="20"
          class="hex-type-icon"
        />
      </g>
      <!-- Quest markers layer -->
      <g
        v-for="hex in hexagons"
        :key="`quest-${hex.tile.q},${hex.tile.r}`"
        class="quest-marker-layer"
      >
        <g v-if="hexesWithActiveObjectives.has(`${hex.tile.q},${hex.tile.r}`)">
          <!-- Yellow circle background -->
          <circle :cx="hex.center.x" :cy="hex.center.y - 15" r="8" fill="#FFD700" stroke="#DAA520" stroke-width="1" />
          <!-- Exclamation mark -->
          <text
            :x="hex.center.x"
            :y="hex.center.y - 15"
            text-anchor="middle"
            dominant-baseline="middle"
            class="quest-marker-text"
          >
            !
          </text>
        </g>
      </g>
      <!-- Borders layer - drawn on top -->
      <g
        v-for="hex in hexagons"
        :key="`border-${hex.tile.q},${hex.tile.r}`"
        class="hex-border-layer"
      >
        <polygon
          v-if="hex.isClicked"
          :points="hex.points"
          fill="none"
          stroke="#ff0000"
          stroke-width="1"
          pointer-events="none"
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
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
}

.world-map-svg.pannable {
  cursor: grab;
}

.world-map-svg.pannable:active {
  cursor: grabbing;
}

.hex-tile {
  cursor: pointer;
  pointer-events: all;
}

.hex-tile polygon {
  transition: opacity 0.2s ease;
}

.hex-coordinates {
  font-size: 8px;
  fill: #333;
  pointer-events: none;
  user-select: none;
}

.hex-type-icon {
  pointer-events: none;
  user-select: none;
}

.quest-marker-layer {
  pointer-events: none;
  user-select: none;
}

.quest-marker-text {
  font-size: 12px;
  font-weight: bold;
  fill: #333;
  pointer-events: none;
  user-select: none;
}
</style>
