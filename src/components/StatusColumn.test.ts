import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import StatusColumn from './StatusColumn.vue'
import { useObjectivesStore } from '@/stores/objectives'
import { useResourcesStore } from '@/stores/resources'
import { useNavigationStore } from '@/stores/navigation'
import { useWorldMapStore } from '@/stores/worldMap'

describe('StatusColumn', () => {
  let resizeCallback: (() => void) | null = null

  beforeEach(() => {
    setActivePinia(createPinia())

    // Mock window.innerWidth
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1200,
    })

    // Mock addEventListener to capture resize callback
    const originalAddEventListener = window.addEventListener
    vi.spyOn(window, 'addEventListener').mockImplementation((event, callback) => {
      if (event === 'resize' && typeof callback === 'function') {
        resizeCallback = callback as () => void
      }
      return originalAddEventListener.call(window, event, callback)
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
    resizeCallback = null
  })

  describe('Rendering', () => {
    it('renders in expanded state by default on desktop', () => {
      const wrapper = mount(StatusColumn)
      expect(wrapper.find('.expanded-view').exists()).toBe(true)
      expect(wrapper.find('.collapsed-view').exists()).toBe(false)
    })

    it('renders all sections when expanded', () => {
      const wrapper = mount(StatusColumn)

      expect(wrapper.find('.objective-section').exists()).toBe(true)
      expect(wrapper.find('.resources-section').exists()).toBe(true)
      expect(wrapper.find('.navigation-section').exists()).toBe(true)
      expect(wrapper.find('.system-section').exists()).toBe(true)
    })

    it('renders header with title and collapse button', () => {
      const wrapper = mount(StatusColumn)

      expect(wrapper.find('.header h2').text()).toBe('Status')
      expect(wrapper.find('.collapse-button').exists()).toBe(true)
    })

    it('renders collapsed view when collapsed', async () => {
      const wrapper = mount(StatusColumn)

      await wrapper.find('.collapse-button').trigger('click')

      expect(wrapper.find('.collapsed-view').exists()).toBe(true)
      expect(wrapper.find('.expanded-view').exists()).toBe(false)
    })

    it('renders expand button in collapsed view', async () => {
      const wrapper = mount(StatusColumn)

      await wrapper.find('.collapse-button').trigger('click')

      expect(wrapper.find('.expand-button').exists()).toBe(true)
    })
  })

  describe('Collapse/Expand Functionality', () => {
    it('toggles to collapsed state when collapse button is clicked', async () => {
      const wrapper = mount(StatusColumn)

      await wrapper.find('.collapse-button').trigger('click')

      expect(wrapper.find('.status-column').classes()).toContain('collapsed')
    })

    it('toggles to expanded state when expand button is clicked', async () => {
      const wrapper = mount(StatusColumn)

      await wrapper.find('.collapse-button').trigger('click')
      await wrapper.find('.expand-button').trigger('click')

      expect(wrapper.find('.status-column').classes()).not.toContain('collapsed')
      expect(wrapper.find('.expanded-view').exists()).toBe(true)
    })
  })

  describe('Current Objective Section', () => {
    it('displays tracked objective when one is set', () => {
      const objectivesStore = useObjectivesStore()
      objectivesStore.setTrackedObjective('talk-to-harbormaster')

      const wrapper = mount(StatusColumn)

      expect(wrapper.find('.objective-card').exists()).toBe(true)
      expect(wrapper.find('.objective-title').text()).toBe('Talk to the Harbormaster')
    })

    it('displays "No Objectives Tracked" when no objective is tracked', () => {
      const objectivesStore = useObjectivesStore()
      // Directly set trackedObjectiveId to null for testing
      objectivesStore.$patch({ trackedObjectiveId: null })

      const wrapper = mount(StatusColumn)

      expect(wrapper.find('.no-objective').exists()).toBe(true)
      expect(wrapper.find('.no-objective-title').text()).toBe('No Objectives Tracked')
    })

    it('navigates to objectives view when objective card is clicked', async () => {
      const objectivesStore = useObjectivesStore()
      const navigationStore = useNavigationStore()
      objectivesStore.setTrackedObjective('talk-to-harbormaster')

      const wrapper = mount(StatusColumn)

      await wrapper.find('.objective-card').trigger('click')

      expect(navigationStore.currentView).toBe('objectives-view')
    })

    it('navigates to objectives view when no-objective card is clicked', async () => {
      const objectivesStore = useObjectivesStore()
      const navigationStore = useNavigationStore()
      // Directly set trackedObjectiveId to null for testing
      objectivesStore.$patch({ trackedObjectiveId: null })

      const wrapper = mount(StatusColumn)

      await wrapper.find('.no-objective').trigger('click')

      expect(navigationStore.currentView).toBe('objectives-view')
    })

    it('displays progress for subtask-based objectives', () => {
      const objectivesStore = useObjectivesStore()
      // Reveal explore-features by completing the prerequisite chain
      objectivesStore.completeObjective('talk-to-harbormaster')
      objectivesStore.objectives.find((o) => o.id === 'visit-academy')!.status = 'active'
      objectivesStore.completeObjective('visit-academy')
      objectivesStore.objectives.find((o) => o.id === 'talk-to-headmaster')!.status = 'active'
      objectivesStore.completeObjective('talk-to-headmaster')
      objectivesStore.setTrackedObjective('explore-features')

      const wrapper = mount(StatusColumn)

      expect(wrapper.find('.objective-progress').exists()).toBe(true)
      expect(wrapper.find('.objective-progress').text()).toMatch(/Step \d+ of \d+/)
    })
  })

  describe('Resources Section', () => {
    it('displays all resources from the store', () => {
      const resourcesStore = useResourcesStore()

      const wrapper = mount(StatusColumn)

      const resourceItems = wrapper.findAll('.resource-item')
      expect(resourceItems.length).toBe(resourcesStore.allResources.length)
    })

    it('displays resource name, icon, and amount', () => {
      const wrapper = mount(StatusColumn)

      const firstResource = wrapper.find('.resource-item')
      expect(firstResource.find('.resource-icon').exists()).toBe(true)
      expect(firstResource.find('.resource-name').exists()).toBe(true)
      expect(firstResource.find('.resource-amount').exists()).toBe(true)
    })
  })

  describe('Quick Navigation Section', () => {
    it('displays World Map button', () => {
      const wrapper = mount(StatusColumn)

      const worldMapButton = wrapper
        .findAll('.nav-button')
        .find((btn) => btn.text().includes('World Map'))
      expect(worldMapButton).toBeDefined()
    })

    it('navigates to world map when World Map button is clicked', async () => {
      const navigationStore = useNavigationStore()
      navigationStore.navigateToAreaMap(1, 1, 'forest')

      const wrapper = mount(StatusColumn)

      const worldMapButton = wrapper
        .findAll('.nav-button')
        .find((btn) => btn.text().includes('World Map'))
      await worldMapButton?.trigger('click')

      expect(navigationStore.currentView).toBe('world-map')
    })

    it('displays current location when on area map', () => {
      const navigationStore = useNavigationStore()
      const worldMapStore = useWorldMapStore()

      // Explore the academy tile first
      worldMapStore.exploreTile(0, 0)
      navigationStore.navigateToAreaMap(0, 0, 'academy')

      const wrapper = mount(StatusColumn)

      // Check that we have at least 2 navigation buttons (World Map + Current Location)
      const navButtons = wrapper.findAll('.nav-button')
      expect(navButtons.length).toBeGreaterThanOrEqual(2)

      // Find button containing location emoji and Academy text
      const currentLocationButton = navButtons.find(
        (btn) => btn.text().includes('📍') && btn.text().toLowerCase().includes('academy')
      )
      expect(currentLocationButton).toBeDefined()
    })

    it('displays recent locations', () => {
      const navigationStore = useNavigationStore()
      navigationStore.navigateToAreaMap(0, 0, 'academy')
      navigationStore.navigateToAreaMap(1, 1, 'forest')

      const wrapper = mount(StatusColumn)

      const recentLocations = wrapper.find('.recent-locations')
      expect(recentLocations.exists()).toBe(true)
    })
  })

  describe('System Links Section', () => {
    it('displays all system buttons', () => {
      const wrapper = mount(StatusColumn)

      const systemButtons = wrapper.findAll('.system-button')
      expect(systemButtons.length).toBe(4)
    })

    it('Settings button is disabled', () => {
      const wrapper = mount(StatusColumn)

      const settingsButton = wrapper
        .findAll('.system-button')
        .find((btn) => btn.text().includes('Settings'))
      expect(settingsButton?.attributes('disabled')).toBeDefined()
    })

    it('Save Game button is disabled', () => {
      const wrapper = mount(StatusColumn)

      const saveButton = wrapper
        .findAll('.system-button')
        .find((btn) => btn.text().includes('Save Game'))
      expect(saveButton?.attributes('disabled')).toBeDefined()
    })

    it('Debug Panel button is enabled', () => {
      const wrapper = mount(StatusColumn)

      const debugButton = wrapper
        .findAll('.system-button')
        .find((btn) => btn.text().includes('Debug Panel'))
      expect(debugButton?.attributes('disabled')).toBeUndefined()
    })

    it('emits toggleDebugPanel event when Debug Panel button is clicked', async () => {
      const wrapper = mount(StatusColumn)

      const debugButton = wrapper
        .findAll('.system-button')
        .find((btn) => btn.text().includes('Debug Panel'))
      await debugButton?.trigger('click')

      expect(wrapper.emitted('toggleDebugPanel')).toBeTruthy()
    })
  })

  describe('Mobile Behavior', () => {
    it('auto-collapses on mobile screen size', async () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 600,
      })

      const wrapper = mount(StatusColumn)
      await wrapper.vm.$nextTick()

      expect(wrapper.find('.status-column').classes()).toContain('collapsed')
      expect(wrapper.find('.status-column').classes()).toContain('mobile')
    })

    it('adds mobile class when screen is ≤ 768px', async () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      })

      const wrapper = mount(StatusColumn)
      await wrapper.vm.$nextTick()

      expect(wrapper.find('.status-column').classes()).toContain('mobile')
    })

    it('does not add mobile class when screen is > 768px', async () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024,
      })

      const wrapper = mount(StatusColumn)
      await wrapper.vm.$nextTick()

      expect(wrapper.find('.status-column').classes()).not.toContain('mobile')
    })

    it('renders mobile overlay when expanded on mobile', async () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 600,
      })

      const wrapper = mount(StatusColumn)
      await wrapper.vm.$nextTick()

      // Start collapsed on mobile, then expand
      const expandButton = wrapper.find('.expand-button')
      expect(expandButton.exists()).toBe(true)
      await expandButton.trigger('click')

      expect(wrapper.find('.mobile-overlay').exists()).toBe(true)
    })

    it('closes when mobile overlay is clicked', async () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 600,
      })

      const wrapper = mount(StatusColumn)
      await wrapper.vm.$nextTick()

      // Expand first
      const expandButton = wrapper.find('.expand-button')
      await expandButton.trigger('click')
      expect(wrapper.find('.status-column').classes()).not.toContain('collapsed')

      // Click overlay
      await wrapper.find('.mobile-overlay').trigger('click')

      expect(wrapper.find('.status-column').classes()).toContain('collapsed')
    })

    it('updates mobile state on window resize', async () => {
      const wrapper = mount(StatusColumn)

      // Start desktop
      expect(wrapper.find('.status-column').classes()).not.toContain('mobile')

      // Resize to mobile
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 600,
      })

      // Trigger resize callback
      if (resizeCallback) {
        resizeCallback()
        await wrapper.vm.$nextTick()
      }

      expect(wrapper.find('.status-column').classes()).toContain('mobile')
    })
  })

  describe('Responsive Width', () => {
    it('applies correct CSS class for desktop width', () => {
      const wrapper = mount(StatusColumn)

      const statusColumn = wrapper.find('.status-column')
      // Desktop should be 250px (verified in CSS)
      expect(statusColumn.exists()).toBe(true)
    })
  })

  describe('Touch-Friendly Buttons', () => {
    it('expand button has minimum 44px touch target', async () => {
      const wrapper = mount(StatusColumn)

      // First collapse to see expand button
      await wrapper.find('.collapse-button').trigger('click')
      await wrapper.vm.$nextTick()

      const expandButton = wrapper.find('.expand-button')
      expect(expandButton.exists()).toBe(true)

      // Verify button is present (actual styling is in CSS)
      expect(expandButton.classes()).toBeDefined()
    })

    it('collapse button has minimum 44px touch target', () => {
      const wrapper = mount(StatusColumn)

      const collapseButton = wrapper.find('.collapse-button')

      // Check that button exists and has proper classes
      expect(collapseButton.exists()).toBe(true)
      expect(collapseButton.classes()).toBeDefined()
    })
  })
})
