import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import FoundryScreen from './FoundryScreen.vue'

describe('FoundryScreen', () => {
  describe('Rendering', () => {
    it('renders the component', () => {
      const wrapper = mount(FoundryScreen)
      expect(wrapper.find('.foundry-screen').exists()).toBe(true)
    })

    it('displays placeholder notice', () => {
      const wrapper = mount(FoundryScreen)
      expect(wrapper.find('.placeholder-notice').exists()).toBe(true)
      expect(wrapper.text()).toContain('Foundry Crafting System')
      expect(wrapper.text()).toContain('grid-based crafting puzzle interface')
    })

    it('renders foundry content layout with sidebar and main area', () => {
      const wrapper = mount(FoundryScreen)
      expect(wrapper.find('.foundry-content').exists()).toBe(true)
      expect(wrapper.find('.foundry-sidebar').exists()).toBe(true)
      expect(wrapper.find('.foundry-main').exists()).toBe(true)
    })
  })

  describe('Materials Section', () => {
    it('displays available materials section', () => {
      const wrapper = mount(FoundryScreen)
      expect(wrapper.text()).toContain('Available Materials')
      expect(wrapper.find('.materials-list').exists()).toBe(true)
    })

    it('renders mock material items', () => {
      const wrapper = mount(FoundryScreen)
      const materialItems = wrapper.findAll('.material-item')

      // Should have 4 mock materials (Wood, Stone, Iron Ore, Crystal Shards)
      expect(materialItems.length).toBe(4)
    })

    it('displays material icons and names', () => {
      const wrapper = mount(FoundryScreen)

      // Check for specific materials
      expect(wrapper.text()).toContain('Wood')
      expect(wrapper.text()).toContain('Stone')
      expect(wrapper.text()).toContain('Iron Ore')
      expect(wrapper.text()).toContain('Crystal Shards')
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
    it('displays available recipes section', () => {
      const wrapper = mount(FoundryScreen)
      expect(wrapper.text()).toContain('Available Recipes')
      expect(wrapper.find('.recipes-list').exists()).toBe(true)
    })

    it('renders mock recipe items', () => {
      const wrapper = mount(FoundryScreen)
      const recipeItems = wrapper.findAll('.recipe-item')

      // Should have 3 mock recipes (Iron Sword, Wooden Shield, Crystal Staff)
      expect(recipeItems.length).toBe(3)
    })

    it('displays locked state for unavailable recipes', () => {
      const wrapper = mount(FoundryScreen)
      const lockedRecipes = wrapper.findAll('.recipe-item.locked')

      // Crystal Staff should be locked
      expect(lockedRecipes.length).toBeGreaterThan(0)
      expect(wrapper.text()).toContain('Crystal Staff')
    })
  })

  describe('Crafting Grid', () => {
    it('displays crafting grid section', () => {
      const wrapper = mount(FoundryScreen)
      expect(wrapper.text()).toContain('Crafting Grid')
      expect(wrapper.find('.crafting-grid-container').exists()).toBe(true)
    })

    it('shows placeholder grid with message', () => {
      const wrapper = mount(FoundryScreen)
      expect(wrapper.find('.crafting-grid-placeholder').exists()).toBe(true)
      expect(wrapper.text()).toContain('Grid-based crafting puzzle will be implemented here')
    })

    it('renders grid preview cells', () => {
      const wrapper = mount(FoundryScreen)
      const gridRows = wrapper.findAll('.grid-row')
      const gridCells = wrapper.findAll('.grid-cell')

      // Should have 4x4 grid = 4 rows, 16 cells
      expect(gridRows.length).toBe(4)
      expect(gridCells.length).toBe(16)
    })

    it('displays grid hint text', () => {
      const wrapper = mount(FoundryScreen)
      expect(wrapper.text()).toContain('Drag materials onto grid')
      expect(wrapper.text()).toContain('Arrange to match patterns')
      expect(wrapper.text()).toContain('Craft items')
    })
  })

  describe('Action Buttons', () => {
    it('displays action buttons', () => {
      const wrapper = mount(FoundryScreen)
      expect(wrapper.find('.crafting-actions').exists()).toBe(true)

      const buttons = wrapper.findAll('.action-button')
      expect(buttons.length).toBe(2)
    })

    it('renders Clear Grid button', () => {
      const wrapper = mount(FoundryScreen)
      const clearButton = wrapper.find('.action-button--secondary')

      expect(clearButton.exists()).toBe(true)
      expect(clearButton.text()).toBe('Clear Grid')
    })

    it('renders Craft Item button', () => {
      const wrapper = mount(FoundryScreen)
      const craftButton = wrapper.find('.action-button--primary')

      expect(craftButton.exists()).toBe(true)
      expect(craftButton.text()).toBe('Craft Item')
    })

    it('buttons are disabled in placeholder mode', () => {
      const wrapper = mount(FoundryScreen)
      const buttons = wrapper.findAll('.action-button')

      buttons.forEach((button) => {
        expect(button.attributes('disabled')).toBeDefined()
      })
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
