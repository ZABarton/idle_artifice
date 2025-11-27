<script setup lang="ts">
import { computed } from 'vue'
import { useWorldMapStore } from '@/stores/worldMap'
import { useHexGrid } from '@/composables/useHexGrid'
import type { HexTile } from '@/types/hex'

const worldMapStore = useWorldMapStore()
const { hexToPixel } = useHexGrid()

// Hexagon size from HexClass
const hexRadius = 30

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
      fill: tile.explorationStatus === 'explored' ? '#90EE90' : '#CCCCCC',
      stroke: '#333333',
    }
  })
})
</script>

<template>
  <div class="world-map-container">
    <svg
      class="world-map-svg"
      viewBox="-150 -150 300 300"
      preserveAspectRatio="xMidYMid meet"
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
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f5f5f5;
}

.world-map-svg {
  width: 100%;
  height: 100%;
  max-width: 1200px;
  max-height: 900px;
}

.hex-tile {
  cursor: default;
}
</style>
