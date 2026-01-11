import { describe, it, expect, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import AreaMap from './AreaMap.vue'
import { useWorldMapStore } from '@/stores/worldMap'
import { useAreaMapStore } from '@/stores/areaMap'
import { academyConfig } from '@/config/area-maps/academy'

describe('AreaMap', () => {
  beforeEach(() => {
    // Clear localStorage before each test to ensure clean state
    localStorage.clear()
    setActivePinia(createPinia())
    const areaMapStore = useAreaMapStore()

    // Initialize academy area using config
    areaMapStore.initializeAreaFromConfig(academyConfig, 0, 0)
  })

  describe('Rendering', () => {
    it('renders header with area title', async () => {
      const wrapper = mount(AreaMap, {
        props: { q: 0, r: 0 },
      })
      await flushPromises() // Wait for async config loading in onMounted

      expect(wrapper.find('.area-map-header__title').text()).toBe('Academy')
    })

    it('renders close button in header', () => {
      const wrapper = mount(AreaMap, {
        props: { q: 0, r: 0 },
      })

      expect(wrapper.find('.area-map-header__close').exists()).toBe(true)
    })

    it('renders feature stack container', () => {
      const wrapper = mount(AreaMap, {
        props: { q: 0, r: 0 },
      })

      expect(wrapper.find('.feature-stack').exists()).toBe(true)
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
    it('displays "Academy" for academy area type', async () => {
      const wrapper = mount(AreaMap, {
        props: { q: 0, r: 0 },
      })
      await flushPromises() // Wait for async config loading in onMounted

      expect(wrapper.find('.area-map-header__title').text()).toBe('Academy')
    })

    it.skip('displays "Forest" for forest area type', async () => {
      // Skip this test until forest area config is implemented
      const worldMapStore = useWorldMapStore()
      const areaMapStore = useAreaMapStore()

      // Add forest tile to world map so config can be loaded
      worldMapStore.exploreTile(1, 1)
      const tile = worldMapStore.getTileAt(1, 1)
      if (tile) {
        tile.type = 'forest'
      }

      areaMapStore.initializeArea({
        areaType: 'forest',
        coordinates: { q: 1, r: 1 },
        background: '#ffffff',
        features: [],
      })

      const wrapper = mount(AreaMap, {
        props: { q: 1, r: 1 },
      })
      await flushPromises() // Wait for async config loading in onMounted

      expect(wrapper.find('.area-map-header__title').text()).toBe('Forest')
    })
  })

  describe('Background Color', () => {
    it('applies background color from area data', async () => {
      const wrapper = mount(AreaMap, {
        props: { q: 0, r: 0 },
      })
      await flushPromises() // Wait for async config loading in onMounted

      const container = wrapper.find('.area-map-container')
      expect(container.attributes('style')).toContain('background-color: #e8dcc4')
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

    it('renders all unlocked Academy features', async () => {
      const wrapper = mount(AreaMap, {
        props: { q: 0, r: 0 },
      })

      // Academy should have 3 unlocked features
      const featureCards = wrapper.findAllComponents({ name: 'FeatureCard' })
      expect(featureCards.length).toBe(3)

      // Verify all expected features are present
      const featureIds = featureCards.map((card) => card.props('feature').id)
      expect(featureIds).toContain('academy-foundry')
      expect(featureIds).toContain('academy-quartermaster')
      expect(featureIds).toContain('academy-tavern')
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

      // Check feature stack max width (should be wider for desktop)
      const featureStack = wrapper.find('.feature-stack')
      const style = featureStack.attributes('style')
      expect(style).toContain('max-width: 1200px')
    })

    it('uses 1x4 layout mode for narrow windows', async () => {
      // Mock window.innerWidth
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1000,
      })

      const wrapper = mount(AreaMap, {
        props: { q: 0, r: 0 },
      })
      await flushPromises() // Wait for async config loading in onMounted

      // Check feature stack max width (should be narrower for mobile)
      const featureStack = wrapper.find('.feature-stack')
      const style = featureStack.attributes('style')
      expect(style).toContain('max-width: 800px')
    })
  })

  describe('Accessibility', () => {
    it('has aria-label on close buttons', () => {
      const wrapper = mount(AreaMap, {
        props: { q: 0, r: 0 },
      })

      const headerClose = wrapper.find('.area-map-header__close')

      expect(headerClose.attributes('aria-label')).toBe('Back')
    })
  })
})
