import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import ShopFeature from './ShopFeature.vue'

describe('ShopFeature', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })
  describe('Rendering', () => {
    it('renders description text', () => {
      const wrapper = mount(ShopFeature)

      expect(wrapper.text()).toContain('Trade resources and set profit margins')
    })

    it('renders profit margin control', () => {
      const wrapper = mount(ShopFeature)

      expect(wrapper.find('.control-label').text()).toBe('Profit Margin:')
      expect(wrapper.find('.profit-slider').exists()).toBe(true)
    })

    it('displays current profit margin value', () => {
      const wrapper = mount(ShopFeature)

      const marginValue = wrapper.find('.margin-value')
      expect(marginValue.exists()).toBe(true)
      expect(marginValue.text()).toContain('Current: 65%')
    })

    it('displays revenue calculation', () => {
      const wrapper = mount(ShopFeature)

      const revenue = wrapper.find('.revenue-display')
      expect(revenue.exists()).toBe(true)
      expect(revenue.text()).toContain('Revenue today:')
      expect(revenue.text()).toContain('gold')
    })
  })

  describe('Interactions', () => {
    it('updates profit margin when slider is changed', async () => {
      const wrapper = mount(ShopFeature)

      const slider = wrapper.find('.profit-slider')
      await slider.setValue(80)

      expect(wrapper.find('.margin-value').text()).toBe('Current: 80%')
    })

    it('updates revenue when profit margin changes', async () => {
      const wrapper = mount(ShopFeature)

      const initialRevenue = wrapper.find('.revenue-display').text()

      const slider = wrapper.find('.profit-slider')
      await slider.setValue(50)

      const newRevenue = wrapper.find('.revenue-display').text()
      expect(newRevenue).not.toBe(initialRevenue)
    })

    it('calculates revenue correctly based on margin', async () => {
      const wrapper = mount(ShopFeature)

      const slider = wrapper.find('.profit-slider')

      // Test with margin = 50
      await slider.setValue(50)
      expect(wrapper.find('.revenue-display').text()).toBe('Revenue today: 200 gold')

      // Test with margin = 75
      await slider.setValue(75)
      expect(wrapper.find('.revenue-display').text()).toBe('Revenue today: 250 gold')
    })
  })

  describe('Default State', () => {
    it('has default profit margin of 65%', () => {
      const wrapper = mount(ShopFeature)

      const slider = wrapper.find<HTMLInputElement>('.profit-slider')
      expect(slider.element.value).toBe('65')
    })

    it('has correct slider range', () => {
      const wrapper = mount(ShopFeature)

      const slider = wrapper.find<HTMLInputElement>('.profit-slider')
      expect(slider.element.min).toBe('0')
      expect(slider.element.max).toBe('100')
      expect(slider.element.step).toBe('5')
    })
  })

  describe('Styling', () => {
    it('has correct CSS classes for layout', () => {
      const wrapper = mount(ShopFeature)

      expect(wrapper.find('.shop-feature').exists()).toBe(true)
      expect(wrapper.find('.description').exists()).toBe(true)
      expect(wrapper.find('.control-section').exists()).toBe(true)
      expect(wrapper.find('.revenue-display').exists()).toBe(true)
    })
  })
})
