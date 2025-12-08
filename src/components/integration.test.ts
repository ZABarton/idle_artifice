import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import MainView from '@/views/MainView.vue'
import StatusColumn from '@/components/StatusColumn.vue'
import { useWorldMapStore } from '@/stores/worldMap'
import { useAreaMapStore } from '@/stores/areaMap'
import { useNavigationStore } from '@/stores/navigation'
import { useObjectivesStore } from '@/stores/objectives'
import { useResourcesStore } from '@/stores/resources'

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

  describe('Status Column Visibility', () => {
    it('renders Status Column on World Map view', async () => {
      const wrapper = mount(MainView)
      expect(wrapper.findComponent(StatusColumn).exists()).toBe(true)
      expect(wrapper.find('.world-map-view').exists()).toBe(true)
    })

    it('renders Status Column on Area Map view', async () => {
      const wrapper = mount(MainView)

      // Navigate to area map
      const polygons = wrapper.findAll('.hex-tile polygon')
      const academyPolygon = polygons.find((p) => p.attributes('fill') === '#90EE90')
      await academyPolygon!.trigger('click')
      await wrapper.vm.$nextTick()

      expect(wrapper.findComponent(StatusColumn).exists()).toBe(true)
      expect(wrapper.find('.area-map-view').exists()).toBe(true)
    })

    it('renders Status Column on Objectives View', async () => {
      const wrapper = mount(MainView)
      const navigationStore = useNavigationStore()

      navigationStore.navigateToObjectivesView()
      await wrapper.vm.$nextTick()

      expect(wrapper.findComponent(StatusColumn).exists()).toBe(true)
      expect(wrapper.find('.objectives-view').exists()).toBe(true)
    })
  })

  describe('Status Column Collapse State', () => {
    it('collapses when collapse button is clicked', async () => {
      const wrapper = mount(MainView)
      const statusColumn = wrapper.findComponent(StatusColumn)

      expect(statusColumn.find('.expanded-view').exists()).toBe(true)

      await statusColumn.find('.collapse-button').trigger('click')
      await wrapper.vm.$nextTick()

      expect(statusColumn.find('.collapsed-view').exists()).toBe(true)
      expect(statusColumn.find('.expanded-view').exists()).toBe(false)
    })

    it('expands when expand button is clicked', async () => {
      const wrapper = mount(MainView)
      const statusColumn = wrapper.findComponent(StatusColumn)

      // Collapse first
      await statusColumn.find('.collapse-button').trigger('click')
      await wrapper.vm.$nextTick()

      // Now expand
      await statusColumn.find('.expand-button').trigger('click')
      await wrapper.vm.$nextTick()

      expect(statusColumn.find('.expanded-view').exists()).toBe(true)
      expect(statusColumn.find('.collapsed-view').exists()).toBe(false)
    })

    it('maintains collapsed state when navigating between views', async () => {
      const wrapper = mount(MainView)
      const navigationStore = useNavigationStore()
      const statusColumn = wrapper.findComponent(StatusColumn)

      // Collapse on World Map
      await statusColumn.find('.collapse-button').trigger('click')
      await wrapper.vm.$nextTick()
      expect(statusColumn.find('.collapsed-view').exists()).toBe(true)

      // Navigate to Area Map
      const polygons = wrapper.findAll('.hex-tile polygon')
      const academyPolygon = polygons.find((p) => p.attributes('fill') === '#90EE90')
      await academyPolygon!.trigger('click')
      await wrapper.vm.$nextTick()

      // Should still be collapsed
      expect(statusColumn.find('.collapsed-view').exists()).toBe(true)

      // Navigate to Objectives View
      navigationStore.navigateToObjectivesView()
      await wrapper.vm.$nextTick()

      // Should still be collapsed
      expect(statusColumn.find('.collapsed-view').exists()).toBe(true)
    })
  })

  describe('Status Column Navigation', () => {
    it('navigates to World Map when clicking World Map button', async () => {
      const wrapper = mount(MainView)
      const navigationStore = useNavigationStore()

      // Navigate away from World Map first
      navigationStore.navigateToObjectivesView()
      await wrapper.vm.$nextTick()
      expect(wrapper.find('.objectives-view').exists()).toBe(true)

      // Click World Map button in StatusColumn
      const statusColumn = wrapper.findComponent(StatusColumn)
      const worldMapButton = statusColumn
        .findAll('button')
        .find((btn) => btn.text().includes('World Map'))
      await worldMapButton!.trigger('click')
      await wrapper.vm.$nextTick()

      expect(wrapper.find('.world-map-view').exists()).toBe(true)
    })

    it('navigates to Objectives View when clicking objective card', async () => {
      const wrapper = mount(MainView)
      const statusColumn = wrapper.findComponent(StatusColumn)

      // Click the objective card (or no-objective area)
      const objectiveCard = statusColumn.find('.objective-card, .no-objective')
      await objectiveCard.trigger('click')
      await wrapper.vm.$nextTick()

      expect(wrapper.find('.objectives-view').exists()).toBe(true)
    })

    it('shows current location button when on area map', async () => {
      const wrapper = mount(MainView)
      const statusColumn = wrapper.findComponent(StatusColumn)

      // Should not show current location button on World Map
      let currentLocationButton = statusColumn
        .findAll('button')
        .find((btn) => btn.text().includes('📍'))
      expect(currentLocationButton).toBeUndefined()

      // Navigate to Area Map to establish current location
      const polygons = wrapper.findAll('.hex-tile polygon')
      const academyPolygon = polygons.find((p) => p.attributes('fill') === '#90EE90')
      await academyPolygon!.trigger('click')
      await wrapper.vm.$nextTick()

      // Should now show current location button
      currentLocationButton = statusColumn
        .findAll('button')
        .find((btn) => btn.text().includes('📍'))
      expect(currentLocationButton).toBeDefined()
    })

    it('displays recent locations after visiting multiple areas', async () => {
      const wrapper = mount(MainView)
      const navigationStore = useNavigationStore()
      const worldMapStore = useWorldMapStore()

      // Explore a second hex to have multiple locations
      worldMapStore.exploreTile(1, 0)

      // Visit first area (academy at 0,0)
      const polygons = wrapper.findAll('.hex-tile polygon')
      const academyPolygon = polygons.find((p) => p.attributes('fill') === '#90EE90')
      await academyPolygon!.trigger('click')
      await wrapper.vm.$nextTick()

      // Navigate back
      navigationStore.navigateToWorldMap()
      await wrapper.vm.$nextTick()

      // Visit second area (at 1,0)
      navigationStore.navigateToAreaMap(1, 0, 'forest')
      await wrapper.vm.$nextTick()

      // Navigate back
      navigationStore.navigateToWorldMap()
      await wrapper.vm.$nextTick()

      // Should have 2 locations in recent locations
      expect(navigationStore.recentLocations.length).toBe(2)

      // StatusColumn should show the first location in recent list (not current, since we're on world map)
      const statusColumn = wrapper.findComponent(StatusColumn)

      // Since we have 2 locations and we're not on area map, should show recent locations
      const recentSection = statusColumn.find('.recent-locations')
      expect(recentSection.exists()).toBe(true)
    })
  })

  describe('Status Column Content Updates', () => {
    it('displays current objective when one is tracked', async () => {
      const wrapper = mount(MainView)
      const objectivesStore = useObjectivesStore()
      const statusColumn = wrapper.findComponent(StatusColumn)

      // Tracked objective should be displayed
      expect(statusColumn.find('.objective-card').exists()).toBe(true)
      expect(statusColumn.find('.objective-title').text()).toBe(
        objectivesStore.getTrackedObjective?.title
      )
    })

    it('displays all resources from resources store', async () => {
      const wrapper = mount(MainView)
      const resourcesStore = useResourcesStore()
      const statusColumn = wrapper.findComponent(StatusColumn)

      const resourceItems = statusColumn.findAll('.resource-item')
      expect(resourceItems.length).toBe(resourcesStore.allResources.length)
    })

    it('updates current location indicator when navigating to area', async () => {
      const wrapper = mount(MainView)
      const statusColumn = wrapper.findComponent(StatusColumn)

      // Should not show current location on World Map
      const initialButtons = statusColumn.findAll('button')
      const hasCurrentLocation = initialButtons.some((btn) => btn.text().includes('📍'))
      expect(hasCurrentLocation).toBe(false)

      // Navigate to Area Map
      const polygons = wrapper.findAll('.hex-tile polygon')
      const academyPolygon = polygons.find((p) => p.attributes('fill') === '#90EE90')
      await academyPolygon!.trigger('click')
      await wrapper.vm.$nextTick()

      // Should now show current location
      const updatedButtons = statusColumn.findAll('button')
      const hasCurrentLocationNow = updatedButtons.some((btn) => btn.text().includes('📍'))
      expect(hasCurrentLocationNow).toBe(true)
    })

    it('updates recent locations list when visiting areas', async () => {
      const wrapper = mount(MainView)
      const navigationStore = useNavigationStore()

      expect(navigationStore.recentLocations.length).toBe(0)

      // Visit an area
      const polygons = wrapper.findAll('.hex-tile polygon')
      const academyPolygon = polygons.find((p) => p.attributes('fill') === '#90EE90')
      await academyPolygon!.trigger('click')
      await wrapper.vm.$nextTick()

      // Recent locations should update
      expect(navigationStore.recentLocations.length).toBe(1)
      expect(navigationStore.recentLocations[0].q).toBe(0)
      expect(navigationStore.recentLocations[0].r).toBe(0)
    })
  })

  describe('Debug Panel Toggle', () => {
    it('shows debug panel when debug button is clicked', async () => {
      const wrapper = mount(MainView)

      expect(wrapper.find('.debug-view').exists()).toBe(false)

      const statusColumn = wrapper.findComponent(StatusColumn)
      const debugButton = statusColumn.findAll('button').find((btn) => btn.text().includes('Debug'))

      await debugButton!.trigger('click')
      await wrapper.vm.$nextTick()

      expect(wrapper.find('.debug-view').exists()).toBe(true)
    })

    it('hides debug panel when debug button is clicked again', async () => {
      const wrapper = mount(MainView)
      const statusColumn = wrapper.findComponent(StatusColumn)
      const debugButton = statusColumn.findAll('button').find((btn) => btn.text().includes('Debug'))

      // Show
      await debugButton!.trigger('click')
      await wrapper.vm.$nextTick()
      expect(wrapper.find('.debug-view').exists()).toBe(true)

      // Hide
      await debugButton!.trigger('click')
      await wrapper.vm.$nextTick()
      expect(wrapper.find('.debug-view').exists()).toBe(false)
    })
  })
})
