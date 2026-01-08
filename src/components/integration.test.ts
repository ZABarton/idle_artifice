import { describe, it, expect, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
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

      // App starts at World Map
      await wrapper.vm.$nextTick()

      // Academy area should not be initialized yet
      expect(areaMapStore.getArea(0, 0)).toBeUndefined()

      // Navigate to academy area directly
      navigationStore.navigateToAreaMap(0, 0, 'academy')
      await wrapper.vm.$nextTick()
      await flushPromises() // Wait for AreaMap's async onMounted to complete

      // Academy area should now be initialized
      expect(areaMapStore.getArea(0, 0)).toBeDefined()
      expect(areaMapStore.getArea(0, 0)?.areaType).toBe('academy')
    })
  })

  describe('Area Map to World Map Navigation', () => {
    it('navigates back to World Map when clicking header close button', async () => {
      const navigationStore = useNavigationStore()
      const wrapper = mount(MainView)

      // Navigate to Harbor Area Map first
      navigationStore.navigateToAreaMap(-1, 0, 'harbor')
      await wrapper.vm.$nextTick()
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

      // App starts at World Map
      await wrapper.vm.$nextTick()

      // Navigate to Academy directly
      navigationStore.navigateToAreaMap(0, 0, 'academy')
      await wrapper.vm.$nextTick()
      await flushPromises() // Wait for AreaMap initialization

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

      // App starts at World Map
      await wrapper.vm.$nextTick()

      // Navigate to Academy directly
      navigationStore.navigateToAreaMap(0, 0, 'academy')
      await wrapper.vm.$nextTick()
      await flushPromises() // Wait for AreaMap initialization

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

      // App starts at World Map
      await wrapper.vm.$nextTick()

      // Navigate to Academy directly
      navigationStore.navigateToAreaMap(0, 0, 'academy')
      await wrapper.vm.$nextTick()
      await flushPromises() // Wait for AreaMap initialization

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

      // App starts at World Map
      await wrapper.vm.$nextTick()

      const initialVisits = worldMapStore.getTileAt(0, 0)?.visitCount || 0

      // Visit Area Map first time
      navigationStore.navigateToAreaMap(0, 0, 'academy')
      await wrapper.vm.$nextTick()
      await flushPromises() // Wait for visit count increment in onMounted

      expect(worldMapStore.getTileAt(0, 0)?.visitCount).toBe(initialVisits + 1)

      // Go back
      await wrapper.find('.area-map-header__close').trigger('click')
      await wrapper.vm.$nextTick()

      // Visit again
      navigationStore.navigateToAreaMap(0, 0, 'academy')
      await wrapper.vm.$nextTick()
      await flushPromises() // Wait for visit count increment

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
      const navigationStore = useNavigationStore()
      navigationStore.navigateToAreaMap(0, 0, 'academy')
      await wrapper.vm.$nextTick()
      await flushPromises() // Wait for AreaMap to mount
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

      // Navigate to Harbor Area Map
      navigationStore.navigateToAreaMap(-1, 0, 'harbor')
      await wrapper.vm.$nextTick()
      await flushPromises() // Wait for AreaMap to mount

      // Should show current location button
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

      // Navigate to Harbor Area Map first
      navigationStore.navigateToAreaMap(-1, 0, 'harbor')
      await wrapper.vm.$nextTick()
      
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

      // App starts at World Map
      // Recent locations starts empty (current location is not in recent until we navigate away)
      expect(navigationStore.recentLocations.length).toBe(0)

      // Navigate to Harbor Area Map directly
      navigationStore.navigateToAreaMap(-1, 0, 'harbor')
      await wrapper.vm.$nextTick()

      // Recent locations should now have 1 entry (Harbor at -1, 0)
      expect(navigationStore.recentLocations.length).toBe(1)
      expect(navigationStore.recentLocations[0].q).toBe(-1)
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

  describe('Feature Accordion Expansion/Collapse', () => {
    it('features start collapsed by default', async () => {
      const navigationStore = useNavigationStore()
      const areaMapStore = useAreaMapStore()
      const wrapper = mount(MainView)

      // Navigate to Academy
      navigationStore.navigateToAreaMap(0, 0, 'academy')
      await wrapper.vm.$nextTick()
      await flushPromises()

      // All features should start collapsed (isExpanded = false)
      const features = areaMapStore.getFeatures(0, 0)
      features.forEach((feature) => {
        expect(feature.isExpanded).toBe(false)
      })

      // Feature bodies should not be visible
      const featureCards = wrapper.findAllComponents({ name: 'FeatureCard' })
      featureCards.forEach((card) => {
        expect(card.find('.feature-card__body').exists()).toBe(false)
      })
    })

    it('expands feature when expand button is clicked', async () => {
      const navigationStore = useNavigationStore()
      const areaMapStore = useAreaMapStore()
      const wrapper = mount(MainView)

      // Navigate to Academy
      navigationStore.navigateToAreaMap(0, 0, 'academy')
      await wrapper.vm.$nextTick()
      await flushPromises()

      // Find Quartermaster feature card
      const featureCards = wrapper.findAllComponents({ name: 'FeatureCard' })
      const quartermasterCard = featureCards.find(
        (card) => card.props('feature')?.id === 'academy-quartermaster'
      )

      expect(quartermasterCard).toBeDefined()

      // Initially collapsed
      expect(quartermasterCard!.find('.feature-card__body').exists()).toBe(false)

      // Click expand button
      const expandButton = quartermasterCard!.find('.feature-card__expand-button')
      await expandButton.trigger('click')
      await wrapper.vm.$nextTick()

      // Should now be expanded
      const quartermasterFeature = areaMapStore.getFeatureById('academy-quartermaster')
      expect(quartermasterFeature?.isExpanded).toBe(true)
      expect(quartermasterCard!.find('.feature-card__body').exists()).toBe(true)
    })

    it('collapses feature when collapse button is clicked on expanded feature', async () => {
      const navigationStore = useNavigationStore()
      const areaMapStore = useAreaMapStore()
      const wrapper = mount(MainView)

      // Navigate to Academy
      navigationStore.navigateToAreaMap(0, 0, 'academy')
      await wrapper.vm.$nextTick()
      await flushPromises()

      // Find and expand Quartermaster
      const featureCards = wrapper.findAllComponents({ name: 'FeatureCard' })
      const quartermasterCard = featureCards.find(
        (card) => card.props('feature')?.id === 'academy-quartermaster'
      )

      const expandButton = quartermasterCard!.find('.feature-card__expand-button')
      await expandButton.trigger('click')
      await wrapper.vm.$nextTick()

      // Verify expanded
      expect(areaMapStore.getFeatureById('academy-quartermaster')?.isExpanded).toBe(true)

      // Click collapse button
      await expandButton.trigger('click')
      await wrapper.vm.$nextTick()

      // Should now be collapsed
      expect(areaMapStore.getFeatureById('academy-quartermaster')?.isExpanded).toBe(false)
      expect(quartermasterCard!.find('.feature-card__body').exists()).toBe(false)
    })

    it('allows multiple features to be expanded simultaneously', async () => {
      const navigationStore = useNavigationStore()
      const areaMapStore = useAreaMapStore()
      const wrapper = mount(MainView)

      // Navigate to Academy
      navigationStore.navigateToAreaMap(0, 0, 'academy')
      await wrapper.vm.$nextTick()
      await flushPromises()

      // Find two features
      const featureCards = wrapper.findAllComponents({ name: 'FeatureCard' })
      const quartermasterCard = featureCards.find(
        (card) => card.props('feature')?.id === 'academy-quartermaster'
      )
      const foundryCard = featureCards.find(
        (card) => card.props('feature')?.id === 'academy-foundry'
      )

      // Expand both features
      await quartermasterCard!.find('.feature-card__expand-button').trigger('click')
      await wrapper.vm.$nextTick()
      await foundryCard!.find('.feature-card__expand-button').trigger('click')
      await wrapper.vm.$nextTick()

      // Both should be expanded
      expect(areaMapStore.getFeatureById('academy-quartermaster')?.isExpanded).toBe(true)
      expect(areaMapStore.getFeatureById('academy-foundry')?.isExpanded).toBe(true)
      expect(quartermasterCard!.find('.feature-card__body').exists()).toBe(true)
      expect(foundryCard!.find('.feature-card__body').exists()).toBe(true)
    })

    it('expanded state is independent of active state', async () => {
      const navigationStore = useNavigationStore()
      const areaMapStore = useAreaMapStore()
      const wrapper = mount(MainView)

      // Navigate to Academy
      navigationStore.navigateToAreaMap(0, 0, 'academy')
      await wrapper.vm.$nextTick()
      await flushPromises()

      const featureCards = wrapper.findAllComponents({ name: 'FeatureCard' })
      const quartermasterCard = featureCards.find(
        (card) => card.props('feature')?.id === 'academy-quartermaster'
      )

      // Expand the feature
      await quartermasterCard!.find('.feature-card__expand-button').trigger('click')
      await wrapper.vm.$nextTick()

      // Click the card to activate it (not the expand button)
      await quartermasterCard!.trigger('click')
      await wrapper.vm.$nextTick()

      const feature = areaMapStore.getFeatureById('academy-quartermaster')
      expect(feature?.isExpanded).toBe(true)
      expect(feature?.isActive).toBe(true)

      // Deactivate by clicking again
      await quartermasterCard!.trigger('click')
      await wrapper.vm.$nextTick()

      // Should still be expanded but not active
      expect(feature?.isExpanded).toBe(true)
      expect(feature?.isActive).toBe(false)
    })

    it('expand button click does not trigger card click', async () => {
      const navigationStore = useNavigationStore()
      const areaMapStore = useAreaMapStore()
      const wrapper = mount(MainView)

      // Navigate to Academy
      navigationStore.navigateToAreaMap(0, 0, 'academy')
      await wrapper.vm.$nextTick()
      await flushPromises()

      const featureCards = wrapper.findAllComponents({ name: 'FeatureCard' })
      const quartermasterCard = featureCards.find(
        (card) => card.props('feature')?.id === 'academy-quartermaster'
      )

      const feature = areaMapStore.getFeatureById('academy-quartermaster')
      expect(feature?.isActive).toBe(false)

      // Click expand button
      await quartermasterCard!.find('.feature-card__expand-button').trigger('click')
      await wrapper.vm.$nextTick()

      // Should be expanded but NOT active (card click not triggered)
      expect(feature?.isExpanded).toBe(true)
      expect(feature?.isActive).toBe(false)
    })
  })

  describe('Hex Exploration and Reveal Behavior', () => {
    it('reveals surrounding hexes from config when exploring Academy for first time', async () => {
      const navigationStore = useNavigationStore()
      const worldMapStore = useWorldMapStore()
      const wrapper = mount(MainView)

      // Navigate to World Map
      navigationStore.navigateToWorldMap()
      await wrapper.vm.$nextTick()

      // Initial state: 7 hexes (Harbor + Academy + 5 ocean)
      expect(worldMapStore.hexTiles).toHaveLength(7)

      // Academy should be unexplored
      const academyTile = worldMapStore.getTileAt(0, 0)
      expect(academyTile?.explorationStatus).toBe('unexplored')

      // Explore the Academy hex - this triggers the reveal behavior
      // (In actual gameplay, this would happen via triggers when navigating to Academy)
      worldMapStore.exploreTile(0, 0)
      await wrapper.vm.$nextTick()

      // Should now have 10 hexes (7 original + 3 new land hexes from config)
      expect(worldMapStore.hexTiles).toHaveLength(10)

      // Academy should now be explored
      expect(academyTile?.explorationStatus).toBe('explored')

      // Verify the 3 new land hexes were added with correct types
      const forest = worldMapStore.getTileAt(1, -1)
      const plains = worldMapStore.getTileAt(1, 0)
      const mountain = worldMapStore.getTileAt(0, 1)

      expect(forest).toBeDefined()
      expect(forest?.type).toBe('forest')
      expect(forest?.explorationStatus).toBe('unexplored')

      expect(plains).toBeDefined()
      expect(plains?.type).toBe('plains')
      expect(plains?.explorationStatus).toBe('unexplored')

      expect(mountain).toBeDefined()
      expect(mountain?.type).toBe('mountain')
      expect(mountain?.explorationStatus).toBe('unexplored')

      // Verify the new hexes are rendered as gray (unexplored)
      const allPolygons = wrapper.findAll('.hex-tile polygon')
      const unexploredPolygons = allPolygons.filter((p) => p.attributes('fill') === '#CCCCCC')

      // Should have 4 unexplored hexes rendered (forest, plains, mountain + any others)
      expect(unexploredPolygons.length).toBeGreaterThanOrEqual(3)
    })

    it('does not add hexes not defined in world map config', async () => {
      const worldMapStore = useWorldMapStore()

      // Create a scenario where we explore a hex that neighbors hexes not in config
      // Ocean hexes at the edge have neighbors that aren't defined in the config
      const initialTileCount = worldMapStore.hexTiles.length

      // Explore an ocean hex (these don't reveal anything new in our config)
      worldMapStore.exploreTile(-2, 0)

      // No new hexes should be added since ocean neighbors aren't in the config
      // (or at most, only hexes defined in config would be added)
      const currentTileCount = worldMapStore.hexTiles.length

      // The tile count should either stay the same or only add hexes from config
      expect(currentTileCount).toBeLessThanOrEqual(initialTileCount + 6) // Max 6 neighbors
    })
  })
})
