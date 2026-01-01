import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import type { HexTile } from '@/types/hex'
import { useHexGrid } from '@/composables/useHexGrid'
import { getHexConfig } from '@/config/WorldMapConfig'

// LocalStorage key
const STORAGE_KEY_HEX_TILES = 'idle-artifice-hex-tiles'

// Track if we've shown storage warning to avoid spam
let hasShownStorageWarning = false

/**
 * Load hex tiles from localStorage
 * Returns saved tiles if available, otherwise generates initial map
 */
function loadHexTiles(): HexTile[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_HEX_TILES)
    if (stored) {
      return JSON.parse(stored) as HexTile[]
    }
  } catch (error) {
    console.error('Failed to load hex tiles from localStorage:', error)
  }

  // Return initial map if no saved data or error
  const { generateInitialMap } = useHexGrid()
  return generateInitialMap()
}

/**
 * World Map Store
 * Manages the state of the hexagonal world map
 */
export const useWorldMapStore = defineStore('worldMap', () => {
  const { generateInitialMap } = useHexGrid()

  // State
  const hexTiles = ref<HexTile[]>(loadHexTiles())

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

  const academyTile = computed(() => hexTiles.value.find((tile) => tile.type === 'academy'))

  // LocalStorage helpers
  /**
   * Save hex tiles to localStorage
   */
  function saveHexTiles() {
    try {
      localStorage.setItem(STORAGE_KEY_HEX_TILES, JSON.stringify(hexTiles.value))
    } catch (error) {
      console.error('Failed to save hex tiles to localStorage:', error)

      // Show warning once per session
      if (!hasShownStorageWarning) {
        console.warn('Unable to save world map progress. Check browser storage settings.')
        hasShownStorageWarning = true
      }
    }
  }

  // Watch for changes and auto-save to localStorage
  watch(
    hexTiles,
    () => {
      saveHexTiles()
    },
    { deep: true }
  )

  // Actions
  function exploreTile(q: number, r: number) {
    const tile = hexTiles.value.find((t) => t.q === q && t.r === r)
    if (tile) {
      tile.explorationStatus = 'explored'
      if (!tile.clickable) {
        tile.clickable = true
      }
      // Reveal surrounding hexes when this hex is explored
      revealSurroundingHexes(q, r)
    }
  }

  /**
   * Reveal all 6 surrounding hexes for a newly explored tile
   * Adds unexplored hexes for neighbors that don't already exist
   * Only adds hexes that are defined in the world map configuration
   * Following rule: "An explored hex should always show the six surrounding hexes"
   */
  function revealSurroundingHexes(q: number, r: number) {
    const { getNeighbors } = useHexGrid()
    const neighbors = getNeighbors(q, r)

    neighbors.forEach((neighbor) => {
      // Check if this neighbor already exists in the map
      const existingTile = hexTiles.value.find((t) => t.q === neighbor.q && t.r === neighbor.r)

      // If it doesn't exist, check if it's defined in the world map config
      if (!existingTile) {
        const hexConfig = getHexConfig(neighbor.q, neighbor.r)

        // Only add hex if it exists in the predefined world map
        if (hexConfig) {
          hexTiles.value.push({
            q: neighbor.q,
            r: neighbor.r,
            explorationStatus: 'unexplored',
            clickable: false,
            ...hexConfig, // Apply config (type, etc.)
          })
        }
      }
    })
  }

  function addTile(tile: HexTile) {
    // Check if tile already exists
    const existing = hexTiles.value.find((t) => t.q === tile.q && t.r === tile.r)
    if (!existing) {
      hexTiles.value.push(tile)
    }
  }

  function incrementVisitCount(q: number, r: number) {
    const tile = hexTiles.value.find((t) => t.q === q && t.r === r)
    if (tile) {
      tile.visitCount = (tile.visitCount || 0) + 1
    }
  }

  function resetMap() {
    hexTiles.value = generateInitialMap()
    // Clear localStorage when resetting (watch will save the new initial map)
    try {
      localStorage.removeItem(STORAGE_KEY_HEX_TILES)
    } catch (error) {
      console.error('Failed to clear hex tiles from localStorage:', error)
    }
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
    revealSurroundingHexes,
    addTile,
    incrementVisitCount,
    resetMap,
  }
})
