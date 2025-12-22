import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import WharfFeature from './WharfFeature.vue'

describe('WharfFeature', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })
  describe('Rendering', () => {
    it('renders description text', () => {
      const wrapper = mount(WharfFeature)

      expect(wrapper.text()).toContain('Manage ship departures and arrivals')
    })

    it('renders open wharf button', () => {
      const wrapper = mount(WharfFeature)

      const button = wrapper.find('.open-button')
      expect(button.exists()).toBe(true)
      expect(button.text()).toBe('Open Wharf')
    })
  })

  describe('Interactions', () => {
    it('emits navigate event when button is clicked', async () => {
      const wrapper = mount(WharfFeature)

      await wrapper.find('.open-button').trigger('click')

      expect(wrapper.emitted('navigate')).toBeTruthy()
      expect(wrapper.emitted('navigate')?.length).toBe(1)
    })
  })

  describe('Styling', () => {
    it('has correct CSS classes for layout', () => {
      const wrapper = mount(WharfFeature)

      expect(wrapper.find('.wharf-feature').exists()).toBe(true)
      expect(wrapper.find('.description').exists()).toBe(true)
    })
  })
})
