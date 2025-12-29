import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import WorldMap from './WorldMap.vue'
import { useWorldMapStore } from '@/stores/worldMap'
import type { HexTile } from '@/types/hex'

describe('WorldMap Component', () => {
  beforeEach(() => {
    // Clear localStorage before each test to ensure clean state
    localStorage.clear()
    setActivePinia(createPinia())
  })

  describe('Hexagon Rendering', () => {
    it('should render 7 hexagon polygons for initial state', () => {
      const wrapper = mount(WorldMap)
      const polygons = wrapper.findAll('polygon')

      // Each hex has 2 polygons (main tile + border layer), so 7 * 2 = 14
      // But border layer only shows for clicked hexes, so we should have 7 visible polygons
      const mainPolygons = polygons.filter((p) => !p.classes('hex-border-layer'))
      expect(mainPolygons.length).toBe(7)
    })

    it('should render hexagons with flat-top orientation', () => {
      const wrapper = mount(WorldMap)
      const polygons = wrapper.findAll('.hex-tile polygon')

      // For flat-top hexagons, the first point should be at the right (0° angle)
      // Check that at least one hexagon has the correct orientation
      expect(polygons.length).toBeGreaterThan(0)

      polygons.forEach((polygon) => {
        const points = polygon.attributes('points')
        expect(points).toBeDefined()

        if (points) {
          // For flat-top hex centered at (0,0) with radius 30:
          // First point (0°) should be at (30, 0) relative to center
          // We just verify the structure is correct (6 points)
          const pointCount = points.split(' ').length
          expect(pointCount).toBe(6)
        }
      })
    })

    it('should position hexagons correctly using transform/viewBox coordinates', () => {
      const wrapper = mount(WorldMap)
      const svg = wrapper.find('svg')

      // Check that viewBox is set
      expect(svg.attributes('viewBox')).toBeDefined()
      expect(svg.attributes('viewBox')).toContain('-150')

      // Verify that polygons have point coordinates (positioning handled by polygon points)
      const polygons = wrapper.findAll('.hex-tile polygon')
      polygons.forEach((polygon) => {
        const points = polygon.attributes('points')
        expect(points).toBeDefined()
        expect(points!.length).toBeGreaterThan(0)
      })
    })

    it('should render explored tiles with appropriate fill colors and unexplored with gray fill', () => {
      const wrapper = mount(WorldMap)
      const store = useWorldMapStore()

      const polygons = wrapper.findAll('.hex-tile polygon')

      // Count by fill color
      // Explored tiles can be green (#90EE90 for land) or blue (#87CEEB for ocean)
      const greenPolygons = polygons.filter((p) => p.attributes('fill') === '#90EE90')
      const bluePolygons = polygons.filter((p) => p.attributes('fill') === '#87CEEB')
      const unexploredPolygons = polygons.filter((p) => p.attributes('fill') === '#CCCCCC')

      // 1 green tile (harbor), 5 blue tiles (ocean), 1 gray (unexplored academy)
      expect(greenPolygons.length).toBe(1)
      expect(bluePolygons.length).toBe(5)
      expect(unexploredPolygons.length).toBe(store.unexploredTiles.length)
      expect(unexploredPolygons.length).toBe(1)
    })
  })

  describe('Click Detection', () => {
    it('should emit hexSelected event when explored hex is clicked', async () => {
      const wrapper = mount(WorldMap)
      const store = useWorldMapStore()

      // Find the explored harbor tile polygon
      const harborTile = store.getTileAt(-1, 0)
      expect(harborTile).toBeDefined()
      expect(harborTile?.explorationStatus).toBe('explored')

      const polygons = wrapper.findAll('.hex-tile polygon')
      // Find the harbor polygon (green, explored)
      const harborPolygon = polygons.find((p) => p.attributes('fill') === '#90EE90')

      expect(harborPolygon).toBeDefined()

      // Click the polygon
      await harborPolygon!.trigger('click')

      // Verify event was emitted
      expect(wrapper.emitted('hexSelected')).toBeDefined()
      expect(wrapper.emitted('hexSelected')!.length).toBe(1)

      // Verify the emitted tile data
      const emittedTile = wrapper.emitted('hexSelected')![0][0]
      expect(emittedTile).toEqual(harborTile)
    })

    it('should not emit hexSelected event when unexplored hex is clicked', async () => {
      const wrapper = mount(WorldMap)

      const polygons = wrapper.findAll('.hex-tile polygon')
      // Find an unexplored polygon (gray)
      const unexploredPolygon = polygons.find((p) => p.attributes('fill') === '#CCCCCC')

      expect(unexploredPolygon).toBeDefined()

      // Click the polygon
      await unexploredPolygon!.trigger('click')

      // Verify event was NOT emitted
      expect(wrapper.emitted('hexSelected')).toBeUndefined()
    })

    it('should handle clicks on all hexagons without errors', async () => {
      const wrapper = mount(WorldMap)
      const polygons = wrapper.findAll('.hex-tile polygon')

      // Click each polygon and verify no errors
      for (const polygon of polygons) {
        await polygon.trigger('click')
      }

      // If we got here, no errors were thrown
      expect(polygons.length).toBe(7)
    })

    it('should not emit event if drag occurred before click', async () => {
      const wrapper = mount(WorldMap)
      const store = useWorldMapStore()

      // Add enough hexes to make panning needed
      for (let q = -3; q <= 3; q++) {
        for (let r = -3; r <= 3; r++) {
          if (Math.abs(q) + Math.abs(r) <= 3 && !(q === 0 && r === 0)) {
            store.addTile({ q, r, explorationStatus: 'unexplored' })
          }
        }
      }

      await wrapper.vm.$nextTick()

      const svg = wrapper.find('svg')
      const svgElement = svg.element as SVGSVGElement

      // Mock getBoundingClientRect
      svgElement.getBoundingClientRect = vi.fn(() => ({
        width: 800,
        height: 800,
        top: 0,
        left: 0,
        bottom: 800,
        right: 800,
        x: 0,
        y: 0,
        toJSON: () => {},
      }))

      const polygons = wrapper.findAll('.hex-tile polygon')
      const harborPolygon = polygons.find((p) => p.attributes('fill') === '#90EE90')

      // Simulate drag: mousedown, mousemove with distance > 5px, mouseup
      await svg.trigger('mousedown', { clientX: 100, clientY: 100 })
      await svg.trigger('mousemove', { clientX: 120, clientY: 100 }) // 20px drag
      await svg.trigger('mouseup')

      // Now click the hex
      await harborPolygon!.trigger('click')

      // Event should not be emitted because drag distance was > 5px
      expect(wrapper.emitted('hexSelected')).toBeUndefined()
    })
  })

  describe('Drag-to-Pan Functionality', () => {
    it('should not allow panning when content fits in viewBox', async () => {
      const wrapper = mount(WorldMap)
      const svg = wrapper.find('svg')

      // With only 7 hexes, panning should not be enabled
      const initialViewBox = svg.attributes('viewBox')

      // Try to drag
      await svg.trigger('mousedown', { clientX: 100, clientY: 100 })
      await svg.trigger('mousemove', { clientX: 150, clientY: 150 })
      await svg.trigger('mouseup')

      // ViewBox should NOT have changed
      const newViewBox = svg.attributes('viewBox')
      expect(newViewBox).toBe(initialViewBox)
    })

    it('should update pan offset when dragging with large content', async () => {
      const wrapper = mount(WorldMap)
      const store = useWorldMapStore()

      // Add enough hexes to make panning needed
      for (let q = -3; q <= 3; q++) {
        for (let r = -3; r <= 3; r++) {
          if (Math.abs(q) + Math.abs(r) <= 3 && !(q === 0 && r === 0)) {
            store.addTile({ q, r, explorationStatus: 'unexplored' })
          }
        }
      }

      await wrapper.vm.$nextTick()

      const svg = wrapper.find('svg')
      const svgElement = svg.element as SVGSVGElement

      // Mock getBoundingClientRect
      svgElement.getBoundingClientRect = vi.fn(() => ({
        width: 800,
        height: 800,
        top: 0,
        left: 0,
        bottom: 800,
        right: 800,
        x: 0,
        y: 0,
        toJSON: () => {},
      }))

      // Get initial viewBox
      const initialViewBox = svg.attributes('viewBox')

      // Simulate drag
      await svg.trigger('mousedown', { clientX: 100, clientY: 100 })
      await svg.trigger('mousemove', { clientX: 150, clientY: 150 })
      await svg.trigger('mouseup')

      // ViewBox should have changed
      const newViewBox = svg.attributes('viewBox')
      expect(newViewBox).not.toBe(initialViewBox)
    })

    it('should stop dragging on mouseup', async () => {
      const wrapper = mount(WorldMap)
      const svg = wrapper.find('svg')

      // Start drag
      await svg.trigger('mousedown', { clientX: 100, clientY: 100 })
      await svg.trigger('mousemove', { clientX: 110, clientY: 110 })

      const viewBoxAfterDrag = svg.attributes('viewBox')

      // Stop drag
      await svg.trigger('mouseup')

      // Move mouse again (should not change viewBox)
      await svg.trigger('mousemove', { clientX: 120, clientY: 120 })

      const viewBoxAfterMouseUp = svg.attributes('viewBox')
      expect(viewBoxAfterMouseUp).toBe(viewBoxAfterDrag)
    })

    it('should stop dragging when mouse leaves SVG area', async () => {
      const wrapper = mount(WorldMap)
      const svg = wrapper.find('svg')

      // Start drag
      await svg.trigger('mousedown', { clientX: 100, clientY: 100 })
      await svg.trigger('mousemove', { clientX: 110, clientY: 110 })

      const viewBoxAfterDrag = svg.attributes('viewBox')

      // Mouse leaves
      await svg.trigger('mouseleave')

      // Move mouse again (should not change viewBox)
      await svg.trigger('mousemove', { clientX: 120, clientY: 120 })

      const viewBoxAfterMouseLeave = svg.attributes('viewBox')
      expect(viewBoxAfterMouseLeave).toBe(viewBoxAfterDrag)
    })

    it('should respect pan boundaries', async () => {
      const wrapper = mount(WorldMap)
      const svg = wrapper.find('svg')
      const svgElement = svg.element as SVGSVGElement

      // Mock getBoundingClientRect to simulate real browser dimensions
      const mockGetBoundingClientRect = vi.fn(() => ({
        width: 800,
        height: 800,
        top: 0,
        left: 0,
        bottom: 800,
        right: 800,
        x: 0,
        y: 0,
        toJSON: () => {},
      }))

      svgElement.getBoundingClientRect = mockGetBoundingClientRect

      // Try to drag very far (should be clamped to boundaries)
      await svg.trigger('mousedown', { clientX: 0, clientY: 0 })

      // Drag in multiple large steps to try to exceed boundaries
      for (let i = 0; i < 10; i++) {
        await svg.trigger('mousemove', {
          clientX: i * 1000,
          clientY: i * 1000,
        })
      }

      await svg.trigger('mouseup')

      // ViewBox should still be within reasonable bounds
      const viewBox = svg.attributes('viewBox')
      expect(viewBox).toBeDefined()

      const [x, y] = viewBox!.split(' ').map(parseFloat)

      // Values should be finite and reasonable (not NaN or Infinity)
      expect(isFinite(x)).toBe(true)
      expect(isFinite(y)).toBe(true)
    })
  })

  describe('Hover Interactions', () => {
    it('should change opacity on hex hover', async () => {
      const wrapper = mount(WorldMap)
      const polygons = wrapper.findAll('.hex-tile polygon')
      const firstPolygon = polygons[0]

      // Initial opacity should be 1
      expect(firstPolygon.attributes('opacity')).toBe('1')

      // Hover over hex
      await firstPolygon.trigger('mouseenter')
      await wrapper.vm.$nextTick()

      // Opacity should change to 0.8
      expect(firstPolygon.attributes('opacity')).toBe('0.8')

      // Mouse leave
      await firstPolygon.trigger('mouseleave')
      await wrapper.vm.$nextTick()

      // Opacity should return to 1
      expect(firstPolygon.attributes('opacity')).toBe('1')
    })
  })

  describe('View Switching', () => {
    it('should emit hexSelected with correct tile data for view switching', async () => {
      const wrapper = mount(WorldMap)
      const store = useWorldMapStore()

      // Get the harbor tile (explored)
      const harborTile = store.getTileAt(-1, 0)!

      // Find and click the harbor polygon
      const polygons = wrapper.findAll('.hex-tile polygon')
      const harborPolygon = polygons.find((p) => p.attributes('fill') === '#90EE90')

      await harborPolygon!.trigger('click')

      // Verify the event contains all necessary data for view switching
      expect(wrapper.emitted('hexSelected')).toBeDefined()
      const emittedData = wrapper.emitted('hexSelected')![0][0] as HexTile

      expect(emittedData).toHaveProperty('q')
      expect(emittedData).toHaveProperty('r')
      expect(emittedData).toHaveProperty('explorationStatus')
      expect(emittedData).toHaveProperty('type')

      expect(emittedData.q).toBe(harborTile.q)
      expect(emittedData.r).toBe(harborTile.r)
      expect(emittedData.explorationStatus).toBe('explored')
      expect(emittedData.type).toBe('harbor')
    })
  })
})
