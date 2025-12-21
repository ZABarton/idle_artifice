import { describe, it, expect } from 'vitest'
import { useHexGrid } from './useHexGrid'

describe('useHexGrid', () => {
  const hexGrid = useHexGrid()

  describe('generateInitialMap', () => {
    it('should generate 10 hexagons for first gameplay loop', () => {
      const tiles = hexGrid.generateInitialMap()
      expect(tiles).toHaveLength(10)
    })

    it('should have academy at origin (0, 0)', () => {
      const tiles = hexGrid.generateInitialMap()
      const academy = tiles.find((tile) => tile.q === 0 && tile.r === 0)

      expect(academy).toBeDefined()
      expect(academy?.explorationStatus).toBe('explored')
      expect(academy?.type).toBe('academy')
      expect(academy?.clickable).toBe(true)
    })

    it('should have harbor at (-1, 0)', () => {
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

    it('should have 3 unexplored land hexes', () => {
      const tiles = hexGrid.generateInitialMap()
      const unexploredHexes = tiles.filter((tile) => tile.explorationStatus === 'unexplored')

      expect(unexploredHexes).toHaveLength(3)
      unexploredHexes.forEach((hex) => {
        expect(hex.type).toBeUndefined()
      })
    })

    it('should have unexplored hexes at (1, -1), (1, 0), and (0, 1)', () => {
      const tiles = hexGrid.generateInitialMap()

      const unexplored1 = tiles.find((tile) => tile.q === 1 && tile.r === -1)
      const unexplored2 = tiles.find((tile) => tile.q === 1 && tile.r === 0)
      const unexplored3 = tiles.find((tile) => tile.q === 0 && tile.r === 1)

      expect(unexplored1?.explorationStatus).toBe('unexplored')
      expect(unexplored2?.explorationStatus).toBe('unexplored')
      expect(unexplored3?.explorationStatus).toBe('unexplored')
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
