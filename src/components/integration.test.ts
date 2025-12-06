import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import MainView from '@/views/MainView.vue'
import { useWorldMapStore } from '@/stores/worldMap'
import { useAreaMapStore } from '@/stores/areaMap'

describe('Integration Tests', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('World Map to Area Map Navigation', () => {
    it('navigates from World Map to Area Map when clicking explored hex', async () => {
      const wrapper = mount(MainView)

      // Should start on World Map
      expect(wrapper.find('.world-map-view').exists()).toBe(true)
      expect(wrapper.find('.area-map-view').exists()).toBe(false)

      // Find and click the academy tile (explored, green)
      const polygons = wrapper.findAll('.hex-tile polygon')
      const academyPolygon = polygons.find((p) => p.attributes('fill') === '#90EE90')

      expect(academyPolygon).toBeDefined()
      await academyPolygon!.trigger('click')

      // Should navigate to Area Map
      await wrapper.vm.$nextTick()
      expect(wrapper.find('.world-map-view').exists()).toBe(false)
      expect(wrapper.find('.area-map-view').exists()).toBe(true)
    })

    it('does not navigate when clicking unexplored hex', async () => {
      const wrapper = mount(MainView)

      // Find an unexplored tile (gray)
      const polygons = wrapper.findAll('.hex-tile polygon')
      const unexploredPolygon = polygons.find((p) => p.attributes('fill') === '#CCCCCC')

      expect(unexploredPolygon).toBeDefined()
      await unexploredPolygon!.trigger('click')
      await wrapper.vm.$nextTick()

      // Should still be on World Map
      expect(wrapper.find('.main-layout').exists()).toBe(true)
      expect(wrapper.find('.area-map-view').exists()).toBe(false)
    })

    it('initializes academy area on first visit', async () => {
      const areaMapStore = useAreaMapStore()
      const wrapper = mount(MainView)

      // Academy area should not be initialized yet
      expect(areaMapStore.getArea(0, 0)).toBeUndefined()

      // Click academy tile
      const polygons = wrapper.findAll('.hex-tile polygon')
      const academyPolygon = polygons.find((p) => p.attributes('fill') === '#90EE90')

      await academyPolygon!.trigger('click')
      await wrapper.vm.$nextTick()

      // Academy area should now be initialized
      expect(areaMapStore.getArea(0, 0)).toBeDefined()
      expect(areaMapStore.getArea(0, 0)?.areaType).toBe('academy')
    })
  })

  describe('Area Map to World Map Navigation', () => {
    it('navigates back to World Map when clicking header close button', async () => {
      const wrapper = mount(MainView)

      // Navigate to Area Map
      const polygons = wrapper.findAll('.hex-tile polygon')
      const academyPolygon = polygons.find((p) => p.attributes('fill') === '#90EE90')
      await academyPolygon!.trigger('click')
      await wrapper.vm.$nextTick()

      expect(wrapper.find('.area-map-view').exists()).toBe(true)

      // Click close button
      await wrapper.find('.area-map-header__close').trigger('click')
      await wrapper.vm.$nextTick()

      // Should navigate back to World Map
      expect(wrapper.find('.main-layout').exists()).toBe(true)
      expect(wrapper.find('.area-map-view').exists()).toBe(false)
    })
  })

  describe('Feature Interactions', () => {
    it('activates inline feature when clicked', async () => {
      const areaMapStore = useAreaMapStore()
      const wrapper = mount(MainView)

      // Navigate to Area Map
      const polygons = wrapper.findAll('.hex-tile polygon')
      const academyPolygon = polygons.find((p) => p.attributes('fill') === '#90EE90')
      await academyPolygon!.trigger('click')
      await wrapper.vm.$nextTick()

      // Find and click Shop feature (inline)
      const featureCards = wrapper.findAllComponents({ name: 'FeatureCard' })
      const shopCard = featureCards.find(
        (card) => card.props('feature').id === 'academy-shop'
      )

      await shopCard!.trigger('click')
      await wrapper.vm.$nextTick()

      // Shop should be active
      const shopFeature = areaMapStore.getFeatureById('academy-shop')
      expect(shopFeature?.isActive).toBe(true)
      expect(areaMapStore.activeFeatureId).toBe('academy-shop')
    })

    it('shows navigation feature content when clicked', async () => {
      const areaMapStore = useAreaMapStore()
      const wrapper = mount(MainView)

      // Navigate to Area Map
      const polygons = wrapper.findAll('.hex-tile polygon')
      const academyPolygon = polygons.find((p) => p.attributes('fill') === '#90EE90')
      await academyPolygon!.trigger('click')
      await wrapper.vm.$nextTick()

      // Find and click Foundry feature (navigation)
      const featureCards = wrapper.findAllComponents({ name: 'FeatureCard' })
      const foundryCard = featureCards.find(
        (card) => card.props('feature').id === 'academy-foundry'
      )

      await foundryCard!.trigger('click')
      await wrapper.vm.$nextTick()

      // Foundry should be active
      const foundryFeature = areaMapStore.getFeatureById('academy-foundry')
      expect(foundryFeature?.isActive).toBe(true)
    })

    it('deactivates active feature when navigating back', async () => {
      const areaMapStore = useAreaMapStore()
      const wrapper = mount(MainView)

      // Navigate to Area Map
      const polygons = wrapper.findAll('.hex-tile polygon')
      const academyPolygon = polygons.find((p) => p.attributes('fill') === '#90EE90')
      await academyPolygon!.trigger('click')
      await wrapper.vm.$nextTick()

      // Activate a feature
      const featureCards = wrapper.findAllComponents({ name: 'FeatureCard' })
      const shopCard = featureCards.find(
        (card) => card.props('feature').id === 'academy-shop'
      )
      await shopCard!.trigger('click')
      await wrapper.vm.$nextTick()

      expect(areaMapStore.activeFeatureId).toBe('academy-shop')

      // Navigate back
      await wrapper.find('.area-map-header__close').trigger('click')
      await wrapper.vm.$nextTick()

      // Feature should be deactivated
      expect(areaMapStore.activeFeatureId).toBeNull()
    })
  })

  describe('Visit Count Tracking', () => {
    it('increments visit count each time Area Map is opened', async () => {
      const worldMapStore = useWorldMapStore()
      const wrapper = mount(MainView)

      const initialVisits = worldMapStore.getTileAt(0, 0)?.visitCount || 0

      // Visit Area Map first time
      const polygons = wrapper.findAll('.hex-tile polygon')
      const academyPolygon = polygons.find((p) => p.attributes('fill') === '#90EE90')
      await academyPolygon!.trigger('click')
      await wrapper.vm.$nextTick()

      expect(worldMapStore.getTileAt(0, 0)?.visitCount).toBe(initialVisits + 1)

      // Go back
      await wrapper.find('.area-map-header__close').trigger('click')
      await wrapper.vm.$nextTick()

      // Visit again
      const polygons2 = wrapper.findAll('.hex-tile polygon')
      const academyPolygon2 = polygons2.find((p) => p.attributes('fill') === '#90EE90')
      await academyPolygon2!.trigger('click')
      await wrapper.vm.$nextTick()

      expect(worldMapStore.getTileAt(0, 0)?.visitCount).toBe(initialVisits + 2)
    })
  })
})
