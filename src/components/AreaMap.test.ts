import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import AreaMap from './AreaMap.vue'
import { useWorldMapStore } from '@/stores/worldMap'
import { useAreaMapStore } from '@/stores/areaMap'

describe('AreaMap', () => {
  beforeEach(() => {
    // Clear localStorage before each test to ensure clean state
    localStorage.clear()
    setActivePinia(createPinia())
    const areaMapStore = useAreaMapStore()

    // Initialize academy area
    areaMapStore.initializeAcademy(0, 0)
  })

  describe('Rendering', () => {
    it('renders header with area title', () => {
      const wrapper = mount(AreaMap, {
        props: { q: 0, r: 0 },
      })

      expect(wrapper.find('.area-map-header__title').text()).toBe('Academy')
    })

    it('renders close button in header', () => {
      const wrapper = mount(AreaMap, {
        props: { q: 0, r: 0 },
      })

      expect(wrapper.find('.area-map-header__close').exists()).toBe(true)
    })

    it('renders SVG canvas', () => {
      const wrapper = mount(AreaMap, {
        props: { q: 0, r: 0 },
      })

      expect(wrapper.find('.area-map-canvas').exists()).toBe(true)
    })

    it('renders visible features', () => {
      const wrapper = mount(AreaMap, {
        props: { q: 0, r: 0 },
      })

      // Should render FeatureCard components for visible features
      const featureCards = wrapper.findAllComponents({ name: 'FeatureCard' })
      expect(featureCards.length).toBeGreaterThan(0)
    })
  })

  describe('Area Title', () => {
    it('displays "Academy" for academy area type', () => {
      const wrapper = mount(AreaMap, {
        props: { q: 0, r: 0 },
      })

      expect(wrapper.find('.area-map-header__title').text()).toBe('Academy')
    })

    it('displays "Forest" for forest area type', () => {
      const areaMapStore = useAreaMapStore()
      areaMapStore.initializeArea({
        areaType: 'forest',
        coordinates: { q: 1, r: 1 },
        background: '#ffffff',
        features: [],
      })

      const wrapper = mount(AreaMap, {
        props: { q: 1, r: 1 },
      })

      expect(wrapper.find('.area-map-header__title').text()).toBe('Forest')
    })
  })

  describe('Background Color', () => {
    it('applies background color from area data', () => {
      const wrapper = mount(AreaMap, {
        props: { q: 0, r: 0 },
      })

      const backgroundRect = wrapper.find('.area-map-canvas rect')
      expect(backgroundRect.attributes('fill')).toBe('#e8dcc4')
    })
  })

  describe('Navigation', () => {
    it('emits back event when header close button is clicked', async () => {
      const wrapper = mount(AreaMap, {
        props: { q: 0, r: 0 },
      })

      await wrapper.find('.area-map-header__close').trigger('click')

      expect(wrapper.emitted('back')).toBeTruthy()
    })

    it('deactivates active feature when navigating back', async () => {
      const areaMapStore = useAreaMapStore()
      const wrapper = mount(AreaMap, {
        props: { q: 0, r: 0 },
      })

      // Activate a feature
      areaMapStore.setActiveFeature('academy-foundry')
      expect(areaMapStore.activeFeatureId).toBe('academy-foundry')

      // Click back button
      await wrapper.find('.area-map-header__close').trigger('click')

      // Feature should be deactivated
      expect(areaMapStore.activeFeatureId).toBeNull()
    })
  })

  describe('Feature Interaction', () => {
    it('activates feature when unlocked feature is clicked', async () => {
      const areaMapStore = useAreaMapStore()
      const wrapper = mount(AreaMap, {
        props: { q: 0, r: 0 },
      })

      // Find and click the Foundry feature card
      const featureCards = wrapper.findAllComponents({ name: 'FeatureCard' })
      const foundryCard = featureCards.find(
        (card) => card.props('feature').id === 'academy-foundry'
      )

      expect(foundryCard).toBeDefined()
      await foundryCard!.trigger('click')

      expect(areaMapStore.activeFeatureId).toBe('academy-foundry')
    })

    it('does not activate locked features', async () => {
      const areaMapStore = useAreaMapStore()
      const wrapper = mount(AreaMap, {
        props: { q: 0, r: 0 },
      })

      // Find and click a locked feature (Workshop)
      const featureCards = wrapper.findAllComponents({ name: 'FeatureCard' })
      const workshopCard = featureCards.find(
        (card) => card.props('feature').id === 'academy-workshop'
      )

      expect(workshopCard).toBeDefined()
      await workshopCard!.trigger('click')

      // Should not be activated (stays null)
      expect(areaMapStore.activeFeatureId).toBeNull()
    })

    it('toggles feature active state on repeated clicks', async () => {
      const areaMapStore = useAreaMapStore()
      const wrapper = mount(AreaMap, {
        props: { q: 0, r: 0 },
      })

      const featureCards = wrapper.findAllComponents({ name: 'FeatureCard' })
      const foundryCard = featureCards.find(
        (card) => card.props('feature').id === 'academy-foundry'
      )

      // First click: activate
      await foundryCard!.trigger('click')
      expect(areaMapStore.activeFeatureId).toBe('academy-foundry')

      // Second click: deactivate
      await foundryCard!.trigger('click')
      expect(areaMapStore.activeFeatureId).toBeNull()
    })
  })

  describe('Visit Count', () => {
    it('increments visit count on mount', () => {
      const worldMapStore = useWorldMapStore()
      const tile = worldMapStore.getTileAt(0, 0)
      const initialVisits = tile?.visitCount || 0

      mount(AreaMap, {
        props: { q: 0, r: 0 },
      })

      const updatedTile = worldMapStore.getTileAt(0, 0)
      expect(updatedTile?.visitCount).toBe(initialVisits + 1)
    })
  })

  describe('Responsive Layout', () => {
    it('uses 2x2 layout mode for wide windows', () => {
      // Mock window.innerWidth
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1600,
      })

      const wrapper = mount(AreaMap, {
        props: { q: 0, r: 0 },
      })

      // Check canvas dimensions (should be wider for 2x2)
      const svg = wrapper.find('.area-map-canvas')
      const style = svg.attributes('style')
      expect(style).toContain('width: 1600px')
      expect(style).toContain('height: 1200px')
    })

    it('uses 1x4 layout mode for narrow windows', () => {
      // Mock window.innerWidth
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1000,
      })

      const wrapper = mount(AreaMap, {
        props: { q: 0, r: 0 },
      })

      // Check canvas dimensions (should be narrower and taller for 1x4)
      const svg = wrapper.find('.area-map-canvas')
      const style = svg.attributes('style')
      expect(style).toContain('width: 1000px')
      expect(style).toContain('height: 2000px')
    })
  })

  describe('Accessibility', () => {
    it('has aria-label on close buttons', () => {
      const wrapper = mount(AreaMap, {
        props: { q: 0, r: 0 },
      })

      const headerClose = wrapper.find('.area-map-header__close')

      expect(headerClose.attributes('aria-label')).toBe('Close and return to World Map')
    })
  })
})
