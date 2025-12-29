import { describe, it, expect } from 'vitest'
import { useHexGrid } from './useHexGrid'

describe('useHexGrid', () => {
  const hexGrid = useHexGrid()

  describe('generateInitialMap', () => {
    it('should generate 7 hexagons for initial state', () => {
      const tiles = hexGrid.generateInitialMap()
      expect(tiles).toHaveLength(7)
    })

    it('should have academy at origin (0, 0) as unexplored', () => {
      const tiles = hexGrid.generateInitialMap()
      const academy = tiles.find((tile) => tile.q === 0 && tile.r === 0)

      expect(academy).toBeDefined()
      expect(academy?.explorationStatus).toBe('unexplored')
      expect(academy?.type).toBe('academy')
      expect(academy?.clickable).toBe(false)
    })

    it('should have harbor at (-1, 0) as explored', () => {
      const tiles = hexGrid.generateInitialMap()
      const harbor = tiles.find((tile) => tile.q === -1 && tile.r === 0)

      expect(harbor).toBeDefined()
      expect(harbor?.explorationStatus).toBe('explored')
      expect(harbor?.type).toBe('harbor')
      expect(harbor?.clickable).toBe(true)
    })

    it('should have 5 ocean hexes that are explored but not clickable', () => {
      const tiles = hexGrid.generateInitialMap()
      const oceanHexes = tiles.filter((tile) => tile.type === 'ocean')

      expect(oceanHexes).toHaveLength(5)
      oceanHexes.forEach((hex) => {
        expect(hex.explorationStatus).toBe('explored')
        expect(hex.clickable).toBe(false)
      })
    })

    it('should have 1 unexplored hex (the Academy)', () => {
      const tiles = hexGrid.generateInitialMap()
      const unexploredHexes = tiles.filter((tile) => tile.explorationStatus === 'unexplored')

      expect(unexploredHexes).toHaveLength(1)
      expect(unexploredHexes[0].q).toBe(0)
      expect(unexploredHexes[0].r).toBe(0)
      expect(unexploredHexes[0].type).toBe('academy')
    })

    it('should not include land hexes around Academy initially', () => {
      const tiles = hexGrid.generateInitialMap()

      // These hexes should NOT exist in the initial map
      const landHex1 = tiles.find((tile) => tile.q === 1 && tile.r === -1)
      const landHex2 = tiles.find((tile) => tile.q === 1 && tile.r === 0)
      const landHex3 = tiles.find((tile) => tile.q === 0 && tile.r === 1)

      expect(landHex1).toBeUndefined()
      expect(landHex2).toBeUndefined()
      expect(landHex3).toBeUndefined()
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
