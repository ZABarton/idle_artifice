import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import WorkshopFeature from './WorkshopFeature.vue'

describe('WorkshopFeature', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })
  describe('Rendering', () => {
    it('renders coming soon message', () => {
      const wrapper = mount(WorkshopFeature)

      expect(wrapper.find('.coming-soon').text()).toBe('Workshop coming soon!')
    })

    it('renders description text', () => {
      const wrapper = mount(WorkshopFeature)

      expect(wrapper.find('.description').text()).toBe('Create equipment for explorers.')
    })
  })

  describe('Styling', () => {
    it('has correct CSS classes for layout', () => {
      const wrapper = mount(WorkshopFeature)

      expect(wrapper.find('.workshop-feature').exists()).toBe(true)
      expect(wrapper.find('.coming-soon').exists()).toBe(true)
      expect(wrapper.find('.description').exists()).toBe(true)
    })
  })
})
