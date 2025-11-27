import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { HexTile } from '@/types/hex'
import { useHexGrid } from '@/composables/useHexGrid'

/**
 * World Map Store
 * Manages the state of the hexagonal world map
 */
export const useWorldMapStore = defineStore('worldMap', () => {
  const { generateInitialMap } = useHexGrid()

  // State
  const hexTiles = ref<HexTile[]>(generateInitialMap())

  // Getters
  const exploredTiles = computed(() =>
    hexTiles.value.filter((tile) => tile.explorationStatus === 'explored')
  )

  const unexploredTiles = computed(() =>
    hexTiles.value.filter((tile) => tile.explorationStatus === 'unexplored')
  )

  const getTileAt = computed(() => (q: number, r: number) => {
    return hexTiles.value.find((tile) => tile.q === q && tile.r === r)
  })

  const academyTile = computed(() =>
    hexTiles.value.find((tile) => tile.type === 'academy')
  )

  // Actions
  function exploreTile(q: number, r: number) {
    const tile = hexTiles.value.find((t) => t.q === q && t.r === r)
    if (tile) {
      tile.explorationStatus = 'explored'
    }
  }

  function addTile(tile: HexTile) {
    // Check if tile already exists
    const existing = hexTiles.value.find((t) => t.q === tile.q && t.r === tile.r)
    if (!existing) {
      hexTiles.value.push(tile)
    }
  }

  function resetMap() {
    hexTiles.value = generateInitialMap()
  }

  return {
    // State
    hexTiles,
    // Getters
    exploredTiles,
    unexploredTiles,
    getTileAt,
    academyTile,
    // Actions
    exploreTile,
    addTile,
    resetMap,
  }
})
