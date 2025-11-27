import { describe, it, expect } from 'vitest'
import { useHexGrid } from './useHexGrid'

describe('useHexGrid', () => {
  const hexGrid = useHexGrid()

  describe('generateInitialMap', () => {
    it('should generate 7 hexagons (1 center + 6 surrounding)', () => {
      const tiles = hexGrid.generateInitialMap()
      expect(tiles).toHaveLength(7)
    })

    it('should have center hex at origin (0, 0) as academy', () => {
      const tiles = hexGrid.generateInitialMap()
      const centerHex = tiles.find((tile) => tile.q === 0 && tile.r === 0)

      expect(centerHex).toBeDefined()
      expect(centerHex?.explorationStatus).toBe('explored')
      expect(centerHex?.type).toBe('academy')
    })

    it('should have 6 surrounding hexes that are unexplored', () => {
      const tiles = hexGrid.generateInitialMap()
      const surroundingHexes = tiles.filter(
        (tile) => !(tile.q === 0 && tile.r === 0)
      )

      expect(surroundingHexes).toHaveLength(6)
      surroundingHexes.forEach((hex) => {
        expect(hex.explorationStatus).toBe('unexplored')
        expect(hex.type).toBeUndefined()
      })
    })

    it('should generate hexes adjacent to center (distance = 1)', () => {
      const tiles = hexGrid.generateInitialMap()
      const surroundingHexes = tiles.filter(
        (tile) => !(tile.q === 0 && tile.r === 0)
      )

      surroundingHexes.forEach((hex) => {
        const distance = hexGrid.getDistance(0, 0, hex.q, hex.r)
        expect(distance).toBe(1)
      })
    })
  })

  describe('hexToPixel', () => {
    it('should convert hex coordinates to pixel coordinates', () => {
      const pixel = hexGrid.hexToPixel(0, 0)
      expect(pixel).toHaveProperty('x')
      expect(pixel).toHaveProperty('y')
      expect(typeof pixel.x).toBe('number')
      expect(typeof pixel.y).toBe('number')
    })

    it('should return (0, 0) for center hex', () => {
      const pixel = hexGrid.hexToPixel(0, 0)
      expect(pixel.x).toBe(0)
      expect(pixel.y).toBe(0)
    })
  })

  describe('getDistance', () => {
    it('should return 0 for same hex', () => {
      const distance = hexGrid.getDistance(0, 0, 0, 0)
      expect(distance).toBe(0)
    })

    it('should calculate correct distance between hexes', () => {
      const distance = hexGrid.getDistance(0, 0, 1, 0)
      expect(distance).toBe(1)
    })
  })

  describe('getNeighbors', () => {
    it('should return 6 neighbors for any hex', () => {
      const neighbors = hexGrid.getNeighbors(0, 0)
      expect(neighbors).toHaveLength(6)
    })
  })

  describe('createGrid', () => {
    it('should create a grid from hex coordinates', () => {
      const grid = hexGrid.createGrid([
        { q: 0, r: 0 },
        { q: 1, r: 0 },
      ])
      expect(grid.size).toBe(2)
    })
  })
})
