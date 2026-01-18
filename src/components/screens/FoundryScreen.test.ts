import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import FoundryScreen from './FoundryScreen.vue'

describe('FoundryScreen', () => {
  beforeEach(() => {
    // Clear localStorage before each test to ensure clean state
    localStorage.clear()
    // Create a fresh pinia instance for each test
    setActivePinia(createPinia())
  })

  describe('Rendering', () => {
    it('renders the component', () => {
      const wrapper = mount(FoundryScreen)
      expect(wrapper.find('.foundry-screen').exists()).toBe(true)
    })

    it('displays foundry header with title', () => {
      const wrapper = mount(FoundryScreen)
      expect(wrapper.text()).toContain('Foundry Crafting System')
    })

    it('renders foundry content layout with sidebar and main area', () => {
      const wrapper = mount(FoundryScreen)
      expect(wrapper.find('.foundry-content').exists()).toBe(true)
      expect(wrapper.find('.foundry-sidebar').exists()).toBe(true)
      expect(wrapper.find('.foundry-main').exists()).toBe(true)
    })

    it('renders queue sidebar', () => {
      const wrapper = mount(FoundryScreen)
      expect(wrapper.find('.queue-sidebar').exists()).toBe(true)
    })
  })

  describe('Materials Section', () => {
    it('displays available materials section', () => {
      const wrapper = mount(FoundryScreen)
      expect(wrapper.text()).toContain('Available Materials')
      expect(wrapper.find('.materials-list').exists()).toBe(true)
    })

    it('renders material items from resources store', () => {
      const wrapper = mount(FoundryScreen)
      const materialItems = wrapper.findAll('.material-item')

      // Should have materials from the resources store
      expect(materialItems.length).toBeGreaterThan(0)
    })

    it('displays material icons and names', () => {
      const wrapper = mount(FoundryScreen)

      // Check for specific materials from the resources store
      expect(wrapper.text()).toContain('Wood')
      expect(wrapper.text()).toContain('Stone')
      expect(wrapper.text()).toContain('Iron')
    })

    it('displays material amounts', () => {
      const wrapper = mount(FoundryScreen)
      const materialItems = wrapper.findAll('.material-item')

      // Each material should have an amount displayed
      materialItems.forEach((item) => {
        expect(item.find('.material-amount').exists()).toBe(true)
      })
    })
  })

  describe('Recipes Section', () => {
    it('displays recipes section', () => {
      const wrapper = mount(FoundryScreen)
      expect(wrapper.text()).toContain('Recipes')
      expect(wrapper.find('.recipes-list').exists()).toBe(true)
    })

    it('renders recipe items from foundry store', () => {
      const wrapper = mount(FoundryScreen)
      const recipeItems = wrapper.findAll('.recipe-item')

      // Should have at least the survival-kit recipe
      expect(recipeItems.length).toBeGreaterThan(0)
    })

    it('displays survival kit recipe', () => {
      const wrapper = mount(FoundryScreen)
      expect(wrapper.text()).toContain('Survival Kit')
    })

    it('recipe items are clickable for selection', () => {
      const wrapper = mount(FoundryScreen)
      const recipeItem = wrapper.find('.recipe-item')
      expect(recipeItem.exists()).toBe(true)
    })
  })

  describe('Crafting Grid', () => {
    it('displays crafting grid section', () => {
      const wrapper = mount(FoundryScreen)
      expect(wrapper.text()).toContain('Crafting Grid')
      expect(wrapper.find('.crafting-grid-container').exists()).toBe(true)
    })

    it('renders 5x5 grid cells', () => {
      const wrapper = mount(FoundryScreen)
      const gridRows = wrapper.findAll('.grid-row')
      const gridCells = wrapper.findAll('.grid-cell')

      // Should have 5x5 grid = 5 rows, 25 cells
      expect(gridRows.length).toBe(5)
      expect(gridCells.length).toBe(25)
    })

    it('displays Anton status', () => {
      const wrapper = mount(FoundryScreen)
      expect(wrapper.find('.anton-status').exists()).toBe(true)
      expect(wrapper.text()).toContain('Anton:')
    })
  })

  describe('Queue Panel', () => {
    it('displays crafting queue header', () => {
      const wrapper = mount(FoundryScreen)
      expect(wrapper.text()).toContain('Crafting Queue')
    })

    it('shows empty state when queue is empty', () => {
      const wrapper = mount(FoundryScreen)
      expect(wrapper.find('.queue-empty').exists()).toBe(true)
      expect(wrapper.text()).toContain('Queue is empty')
    })

    it('displays hint for adding to queue', () => {
      const wrapper = mount(FoundryScreen)
      expect(wrapper.text()).toContain('Add to Queue')
    })
  })

  describe('Props', () => {
    it('accepts fullScreen prop', () => {
      const wrapper = mount(FoundryScreen, {
        props: {
          fullScreen: true,
        },
      })

      // Component should render even with fullScreen prop
      expect(wrapper.find('.foundry-screen').exists()).toBe(true)
    })
  })
})
