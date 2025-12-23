import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import FoundryFeature from './FoundryFeature.vue'

describe('FoundryFeature', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })
  describe('Rendering', () => {
    it('renders description text', () => {
      const wrapper = mount(FoundryFeature)

      expect(wrapper.text()).toContain('Craft magical items by solving grid-based puzzles')
    })

    it('renders available resources section', () => {
      const wrapper = mount(FoundryFeature)

      expect(wrapper.find('.resources__title').text()).toBe('Available resources:')
      expect(wrapper.find('.resources__list').exists()).toBe(true)
    })

    it('displays mock resource data', () => {
      const wrapper = mount(FoundryFeature)

      const resourceText = wrapper.find('.resources__list').text()
      expect(resourceText).toContain('wood: 25')
      expect(resourceText).toContain('stone: 12')
    })

    it('renders open foundry button', () => {
      const wrapper = mount(FoundryFeature)

      const button = wrapper.find('.open-button')
      expect(button.exists()).toBe(true)
      expect(button.text()).toBe('Enter Foundry')
    })
  })

  describe('Interactions', () => {
    it('emits navigate event when button is clicked', async () => {
      const wrapper = mount(FoundryFeature)

      await wrapper.find('.open-button').trigger('click')

      expect(wrapper.emitted('navigate')).toBeTruthy()
      expect(wrapper.emitted('navigate')?.length).toBe(1)
    })
  })

  describe('Styling', () => {
    it('has correct CSS classes for layout', () => {
      const wrapper = mount(FoundryFeature)

      expect(wrapper.find('.foundry-feature').exists()).toBe(true)
      expect(wrapper.find('.description').exists()).toBe(true)
      expect(wrapper.find('.resources').exists()).toBe(true)
    })
  })
})
