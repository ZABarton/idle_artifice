import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import FoundryFeature from './FoundryFeature.vue'
import { useNavigationStore } from '@/stores/navigation'

describe('FoundryFeature', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })
  describe('Rendering', () => {
    it('renders description text', () => {
      const wrapper = mount(FoundryFeature)

      expect(wrapper.text()).toContain('Craft magical items by solving grid-based puzzles')
    })

    it('renders available materials section', () => {
      const wrapper = mount(FoundryFeature)

      expect(wrapper.find('.section-title').text()).toBe('Available Materials')
      expect(wrapper.find('.materials-grid').exists()).toBe(true)
    })

    it('displays mock resource data', () => {
      const wrapper = mount(FoundryFeature)

      const materialsText = wrapper.find('.materials-grid').text()
      expect(materialsText).toContain('Wood')
      expect(materialsText).toContain('25')
      expect(materialsText).toContain('Stone')
      expect(materialsText).toContain('12')
    })

    it('renders open foundry button', () => {
      const wrapper = mount(FoundryFeature)

      const button = wrapper.find('.open-button')
      expect(button.exists()).toBe(true)
      expect(button.text()).toContain('Enter Foundry')
    })
  })

  describe('Interactions', () => {
    it('navigates to foundry screen when button is clicked', async () => {
      const wrapper = mount(FoundryFeature)
      const navigationStore = useNavigationStore()
      const navigateSpy = vi.spyOn(navigationStore, 'navigateToFeatureScreen')

      await wrapper.find('.open-button').trigger('click')

      expect(navigateSpy).toHaveBeenCalledWith('academy-foundry')
    })
  })

  describe('Styling', () => {
    it('has correct CSS classes for layout', () => {
      const wrapper = mount(FoundryFeature)

      expect(wrapper.find('.foundry-feature').exists()).toBe(true)
      expect(wrapper.find('.description').exists()).toBe(true)
      expect(wrapper.find('.section').exists()).toBe(true)
    })
  })
})
