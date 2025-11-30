import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import AlchemistFeature from './AlchemistFeature.vue'

describe('AlchemistFeature', () => {
  describe('Rendering', () => {
    it('renders coming soon message', () => {
      const wrapper = mount(AlchemistFeature)

      expect(wrapper.find('.coming-soon').text()).toBe('Alchemist coming soon!')
    })

    it('renders description text', () => {
      const wrapper = mount(AlchemistFeature)

      expect(wrapper.find('.description').text()).toBe('Brew potions and elixirs.')
    })
  })

  describe('Styling', () => {
    it('has correct CSS classes for layout', () => {
      const wrapper = mount(AlchemistFeature)

      expect(wrapper.find('.alchemist-feature').exists()).toBe(true)
      expect(wrapper.find('.coming-soon').exists()).toBe(true)
      expect(wrapper.find('.description').exists()).toBe(true)
    })
  })
})
