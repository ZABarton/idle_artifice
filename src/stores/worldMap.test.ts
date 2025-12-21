import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useWorldMapStore } from './worldMap'

describe('useWorldMapStore', () => {
  beforeEach(() => {
    // Create a fresh pinia instance for each test
    setActivePinia(createPinia())
  })

  describe('initial state', () => {
    it('should initialize with 10 hexagons', () => {
      const store = useWorldMapStore()
      expect(store.hexTiles).toHaveLength(10)
    })

    it('should have 7 explored tiles (academy, harbor, and 5 ocean)', () => {
      const store = useWorldMapStore()
      expect(store.exploredTiles).toHaveLength(7)

      const academy = store.exploredTiles.find(tile => tile.type === 'academy')
      const harbor = store.exploredTiles.find(tile => tile.type === 'harbor')
      const oceanTiles = store.exploredTiles.filter(tile => tile.type === 'ocean')

      expect(academy).toBeDefined()
      expect(harbor).toBeDefined()
      expect(oceanTiles).toHaveLength(5)
    })

    it('should have 3 unexplored tiles', () => {
      const store = useWorldMapStore()
      expect(store.unexploredTiles).toHaveLength(3)
    })

    it('should have academy tile at origin (0, 0)', () => {
      const store = useWorldMapStore()
      expect(store.academyTile).toBeDefined()
      expect(store.academyTile?.q).toBe(0)
      expect(store.academyTile?.r).toBe(0)
      expect(store.academyTile?.explorationStatus).toBe('explored')
      expect(store.academyTile?.clickable).toBe(true)
    })

    it('should have harbor at (-1, 0)', () => {
      const store = useWorldMapStore()
      const harbor = store.getTileAt(-1, 0)
      expect(harbor).toBeDefined()
      expect(harbor?.type).toBe('harbor')
      expect(harbor?.explorationStatus).toBe('explored')
      expect(harbor?.clickable).toBe(true)
    })

    it('should have 5 ocean hexes that are not clickable', () => {
      const store = useWorldMapStore()
      const oceanTiles = store.hexTiles.filter(tile => tile.type === 'ocean')
      expect(oceanTiles).toHaveLength(5)
      oceanTiles.forEach(tile => {
        expect(tile.explorationStatus).toBe('explored')
        expect(tile.clickable).toBe(false)
      })
    })
  })

  describe('getTileAt', () => {
    it('should return tile at given coordinates', () => {
      const store = useWorldMapStore()
      const tile = store.getTileAt(0, 0)
      expect(tile).toBeDefined()
      expect(tile?.q).toBe(0)
      expect(tile?.r).toBe(0)
    })

    it('should return undefined for non-existent coordinates', () => {
      const store = useWorldMapStore()
      const tile = store.getTileAt(99, 99)
      expect(tile).toBeUndefined()
    })
  })

  describe('exploreTile', () => {
    it('should mark a tile as explored', () => {
      const store = useWorldMapStore()
      const unexploredTile = store.unexploredTiles[0]

      expect(unexploredTile.explorationStatus).toBe('unexplored')

      store.exploreTile(unexploredTile.q, unexploredTile.r)

      expect(unexploredTile.explorationStatus).toBe('explored')
      expect(store.exploredTiles).toHaveLength(8)
      expect(store.unexploredTiles).toHaveLength(2)
    })

    it('should do nothing for non-existent tile', () => {
      const store = useWorldMapStore()
      const initialExploredCount = store.exploredTiles.length

      store.exploreTile(99, 99)

      expect(store.exploredTiles).toHaveLength(initialExploredCount)
    })
  })

  describe('addTile', () => {
    it('should add a new tile to the map', () => {
      const store = useWorldMapStore()
      const initialLength = store.hexTiles.length

      store.addTile({
        q: 2,
        r: 0,
        explorationStatus: 'unexplored',
      })

      expect(store.hexTiles).toHaveLength(initialLength + 1)
      expect(store.getTileAt(2, 0)).toBeDefined()
    })

    it('should not add duplicate tile at same coordinates', () => {
      const store = useWorldMapStore()
      const initialLength = store.hexTiles.length

      store.addTile({
        q: 0,
        r: 0,
        explorationStatus: 'explored',
        type: 'duplicate',
      })

      expect(store.hexTiles).toHaveLength(initialLength)
    })
  })

  describe('resetMap', () => {
    it('should reset map to initial state', () => {
      const store = useWorldMapStore()

      // Modify the map
      store.exploreTile(store.unexploredTiles[0].q, store.unexploredTiles[0].r)
      store.addTile({ q: 5, r: 5, explorationStatus: 'unexplored' })

      // Reset
      store.resetMap()

      // Verify reset
      expect(store.hexTiles).toHaveLength(10)
      expect(store.exploredTiles).toHaveLength(7)
      expect(store.unexploredTiles).toHaveLength(3)
    })
  })
})
