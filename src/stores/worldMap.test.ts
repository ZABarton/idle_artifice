import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useWorldMapStore } from './worldMap'

describe('useWorldMapStore', () => {
  beforeEach(() => {
    // Create a fresh pinia instance for each test
    setActivePinia(createPinia())
  })

  describe('initial state', () => {
    it('should initialize with 7 hexagons', () => {
      const store = useWorldMapStore()
      expect(store.hexTiles).toHaveLength(7)
    })

    it('should have 1 explored tile (academy)', () => {
      const store = useWorldMapStore()
      expect(store.exploredTiles).toHaveLength(1)
      expect(store.exploredTiles[0].type).toBe('academy')
    })

    it('should have 6 unexplored tiles', () => {
      const store = useWorldMapStore()
      expect(store.unexploredTiles).toHaveLength(6)
    })

    it('should have academy tile at origin (0, 0)', () => {
      const store = useWorldMapStore()
      expect(store.academyTile).toBeDefined()
      expect(store.academyTile?.q).toBe(0)
      expect(store.academyTile?.r).toBe(0)
      expect(store.academyTile?.explorationStatus).toBe('explored')
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
      expect(store.exploredTiles).toHaveLength(2)
      expect(store.unexploredTiles).toHaveLength(5)
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
      expect(store.hexTiles).toHaveLength(7)
      expect(store.exploredTiles).toHaveLength(1)
      expect(store.unexploredTiles).toHaveLength(6)
    })
  })
})
