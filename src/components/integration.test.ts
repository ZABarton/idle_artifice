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
    // Clear localStorage before each test to ensure clean state
    localStorage.clear()
    setActivePinia(createPinia())
  })

  describe('World Map to Area Map Navigation', () => {
    it('navigates from World Map to Area Map when clicking explored hex', async () => {
      const navigationStore = useNavigationStore()
      const wrapper = mount(MainView)

      // App starts at Harbor Area Map, navigate to World Map first
      navigationStore.navigateToWorldMap()
      await wrapper.vm.$nextTick()

      // Should now be on World Map
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
      const navigationStore = useNavigationStore()
      const wrapper = mount(MainView)

      // Navigate to World Map first
      navigationStore.navigateToWorldMap()
      await wrapper.vm.$nextTick()

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
      const navigationStore = useNavigationStore()
      const areaMapStore = useAreaMapStore()
      const wrapper = mount(MainView)

      // Navigate to World Map first
      navigationStore.navigateToWorldMap()
      await wrapper.vm.$nextTick()

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

      // App starts at Harbor Area Map
      expect(wrapper.find('.area-map-view').exists()).toBe(true)

      // Click close button
      await wrapper.find('.area-map-header__close').trigger('click')
      await wrapper.vm.$nextTick()

      // Should navigate to World Map
      expect(wrapper.find('.world-map-view').exists()).toBe(true)
      expect(wrapper.find('.area-map-view').exists()).toBe(false)
    })
  })

  describe('Feature Interactions', () => {
    it('activates inline feature when clicked', async () => {
      const navigationStore = useNavigationStore()
      const areaMapStore = useAreaMapStore()
      const wrapper = mount(MainView)

      // App starts at Harbor, navigate to World Map
      navigationStore.navigateToWorldMap()
      await wrapper.vm.$nextTick()

      // Navigate to Academy by clicking hex on World Map
      const polygons = wrapper.findAll('.hex-tile polygon')
      const academyPolygon = polygons.find((p) => p.attributes('fill') === '#90EE90')
      await academyPolygon!.trigger('click')
      await wrapper.vm.$nextTick()

      // Find and click Quartermaster feature (inline)
      const featureCards = wrapper.findAllComponents({ name: 'FeatureCard' })
      const quartermasterCard = featureCards.find(
        (card) => card.props('feature')?.id === 'academy-quartermaster'
      )

      expect(quartermasterCard).toBeDefined()
      await quartermasterCard!.trigger('click')
      await wrapper.vm.$nextTick()

      // Quartermaster should be active
      const quartermasterFeature = areaMapStore.getFeatureById('academy-quartermaster')
      expect(quartermasterFeature?.isActive).toBe(true)
      expect(areaMapStore.activeFeatureId).toBe('academy-quartermaster')
    })

    it('shows navigation feature content when clicked', async () => {
      const navigationStore = useNavigationStore()
      const areaMapStore = useAreaMapStore()
      const wrapper = mount(MainView)

      // App starts at Harbor, navigate to World Map
      navigationStore.navigateToWorldMap()
      await wrapper.vm.$nextTick()

      // Navigate to Academy by clicking hex on World Map
      const polygons = wrapper.findAll('.hex-tile polygon')
      const academyPolygon = polygons.find((p) => p.attributes('fill') === '#90EE90')
      await academyPolygon!.trigger('click')
      await wrapper.vm.$nextTick()

      // Find and click Foundry feature (navigation)
      const featureCards = wrapper.findAllComponents({ name: 'FeatureCard' })
      const foundryCard = featureCards.find(
        (card) => card.props('feature')?.id === 'academy-foundry'
      )

      expect(foundryCard).toBeDefined()
      await foundryCard!.trigger('click')
      await wrapper.vm.$nextTick()

      // Foundry should be active
      const foundryFeature = areaMapStore.getFeatureById('academy-foundry')
      expect(foundryFeature?.isActive).toBe(true)
    })

    it('deactivates active feature when navigating back', async () => {
      const navigationStore = useNavigationStore()
      const areaMapStore = useAreaMapStore()
      const wrapper = mount(MainView)

      // App starts at Harbor, navigate to World Map
      navigationStore.navigateToWorldMap()
      await wrapper.vm.$nextTick()

      // Navigate to Academy by clicking hex on World Map
      const polygons = wrapper.findAll('.hex-tile polygon')
      const academyPolygon = polygons.find((p) => p.attributes('fill') === '#90EE90')
      await academyPolygon!.trigger('click')
      await wrapper.vm.$nextTick()

      // Activate a feature
      const featureCards = wrapper.findAllComponents({ name: 'FeatureCard' })
      const quartermasterCard = featureCards.find(
        (card) => card.props('feature')?.id === 'academy-quartermaster'
      )

      expect(quartermasterCard).toBeDefined()
      await quartermasterCard!.trigger('click')
      await wrapper.vm.$nextTick()

      expect(areaMapStore.activeFeatureId).toBe('academy-quartermaster')

      // Navigate back
      await wrapper.find('.area-map-header__close').trigger('click')
      await wrapper.vm.$nextTick()

      // Feature should be deactivated
      expect(areaMapStore.activeFeatureId).toBeNull()
    })
  })

  describe('Visit Count Tracking', () => {
    it('increments visit count each time Area Map is opened', async () => {
      const navigationStore = useNavigationStore()
      const worldMapStore = useWorldMapStore()
      const wrapper = mount(MainView)

      // Navigate to World Map first
      navigationStore.navigateToWorldMap()
      await wrapper.vm.$nextTick()

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
      const navigationStore = useNavigationStore()
      const wrapper = mount(MainView)

      // Navigate to World Map
      navigationStore.navigateToWorldMap()
      await wrapper.vm.$nextTick()

      expect(wrapper.findComponent(StatusColumn).exists()).toBe(true)
      expect(wrapper.find('.world-map-view').exists()).toBe(true)
    })

    it('renders Status Column on Area Map view', async () => {
      const wrapper = mount(MainView)

      // App starts at Area Map
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

      // App starts at Harbor Area Map, collapse it
      await statusColumn.find('.collapse-button').trigger('click')
      await wrapper.vm.$nextTick()
      expect(statusColumn.find('.collapsed-view').exists()).toBe(true)

      // Navigate to World Map
      navigationStore.navigateToWorldMap()
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

      // Navigate away from Area Map first
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
      const navigationStore = useNavigationStore()
      const statusColumn = wrapper.findComponent(StatusColumn)

      // App starts at Harbor Area Map - should show current location button
      let currentLocationButton = statusColumn
        .findAll('button')
        .find((btn) => btn.text().includes('📍'))
      expect(currentLocationButton).toBeDefined()

      // Navigate to World Map
      navigationStore.navigateToWorldMap()
      await wrapper.vm.$nextTick()

      // Should not show current location button on World Map
      currentLocationButton = statusColumn
        .findAll('button')
        .find((btn) => btn.text().includes('📍'))
      expect(currentLocationButton).toBeUndefined()
    })

    it('displays recent locations after visiting multiple areas', async () => {
      const wrapper = mount(MainView)
      const navigationStore = useNavigationStore()
      const worldMapStore = useWorldMapStore()

      // Navigate to World Map first
      navigationStore.navigateToWorldMap()
      await wrapper.vm.$nextTick()

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

      // Should have 2 locations in recent locations (Academy + Forest)
      expect(navigationStore.recentLocations.length).toBe(2)

      // StatusColumn should show recent locations
      const statusColumn = wrapper.findComponent(StatusColumn)

      // Since we have multiple locations and we're not on area map, should show recent locations
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
      const navigationStore = useNavigationStore()
      const statusColumn = wrapper.findComponent(StatusColumn)

      // App starts at Harbor Area Map - should show current location
      let initialButtons = statusColumn.findAll('button')
      let hasCurrentLocation = initialButtons.some((btn) => btn.text().includes('📍'))
      expect(hasCurrentLocation).toBe(true)

      // Navigate to World Map
      navigationStore.navigateToWorldMap()
      await wrapper.vm.$nextTick()

      // Should not show current location on World Map
      initialButtons = statusColumn.findAll('button')
      hasCurrentLocation = initialButtons.some((btn) => btn.text().includes('📍'))
      expect(hasCurrentLocation).toBe(false)

      // Navigate back to Academy Area Map
      navigationStore.navigateToAreaMap(0, 0, 'academy')
      await wrapper.vm.$nextTick()

      // Should now show current location again
      const updatedButtons = statusColumn.findAll('button')
      const hasCurrentLocationNow = updatedButtons.some((btn) => btn.text().includes('📍'))
      expect(hasCurrentLocationNow).toBe(true)
    })

    it('updates recent locations list when visiting areas', async () => {
      const wrapper = mount(MainView)
      const navigationStore = useNavigationStore()

      // Recent locations starts empty (current location is not in recent until we navigate away)
      expect(navigationStore.recentLocations.length).toBe(0)

      // Navigate to World Map, then visit Academy
      navigationStore.navigateToWorldMap()
      await wrapper.vm.$nextTick()

      const polygons = wrapper.findAll('.hex-tile polygon')
      const academyPolygon = polygons.find((p) => p.attributes('fill') === '#90EE90')
      await academyPolygon!.trigger('click')
      await wrapper.vm.$nextTick()

      // Recent locations should now have 1 entry (Academy)
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
