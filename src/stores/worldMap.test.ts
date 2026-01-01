import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useWorldMapStore } from './worldMap'

describe('useWorldMapStore', () => {
  beforeEach(() => {
    // Clear localStorage before each test to ensure clean state
    localStorage.clear()
    // Create a fresh pinia instance for each test
    setActivePinia(createPinia())
  })

  describe('initial state', () => {
    it('should initialize with 7 hexagons', () => {
      const store = useWorldMapStore()
      expect(store.hexTiles).toHaveLength(7)
    })

    it('should have 6 explored tiles (harbor and 5 ocean)', () => {
      const store = useWorldMapStore()
      expect(store.exploredTiles).toHaveLength(6)

      const harbor = store.exploredTiles.find(tile => tile.type === 'harbor')
      const oceanTiles = store.exploredTiles.filter(tile => tile.type === 'ocean')

      expect(harbor).toBeDefined()
      expect(oceanTiles).toHaveLength(5)
    })

    it('should have 1 unexplored tile (Academy)', () => {
      const store = useWorldMapStore()
      expect(store.unexploredTiles).toHaveLength(1)
      expect(store.unexploredTiles[0].type).toBe('academy')
    })

    it('should have academy tile at origin (0, 0) as unexplored', () => {
      const store = useWorldMapStore()
      expect(store.academyTile).toBeDefined()
      expect(store.academyTile?.q).toBe(0)
      expect(store.academyTile?.r).toBe(0)
      expect(store.academyTile?.explorationStatus).toBe('unexplored')
      expect(store.academyTile?.clickable).toBe(false)
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
    it('should mark a tile as explored and reveal surrounding hexes from config', () => {
      const store = useWorldMapStore()
      const academyTile = store.unexploredTiles[0]

      expect(academyTile.explorationStatus).toBe('unexplored')
      expect(store.hexTiles).toHaveLength(7) // Initial state

      store.exploreTile(academyTile.q, academyTile.r)

      expect(academyTile.explorationStatus).toBe('explored')
      expect(academyTile.clickable).toBe(true)

      // After exploring Academy (0, 0), surrounding hexes should be revealed
      // Academy has 6 neighbors, but 3 already exist (Harbor at -1,0 and 2 ocean hexes)
      // The 3 new hexes from config should be added: forest (1,-1), plains (1,0), mountain (0,1)
      expect(store.hexTiles).toHaveLength(10) // 7 original + 3 new
      expect(store.exploredTiles).toHaveLength(7) // 6 original + Academy

      // Verify the new hexes have correct types from config
      const forest = store.getTileAt(1, -1)
      const plains = store.getTileAt(1, 0)
      const mountain = store.getTileAt(0, 1)

      expect(forest).toBeDefined()
      expect(forest?.type).toBe('forest')
      expect(forest?.explorationStatus).toBe('unexplored')

      expect(plains).toBeDefined()
      expect(plains?.type).toBe('plains')
      expect(plains?.explorationStatus).toBe('unexplored')

      expect(mountain).toBeDefined()
      expect(mountain?.type).toBe('mountain')
      expect(mountain?.explorationStatus).toBe('unexplored')
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
      expect(store.exploredTiles).toHaveLength(6) // Harbor + 5 ocean
      expect(store.unexploredTiles).toHaveLength(1) // Academy
    })
  })
})
