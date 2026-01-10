import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import StatusText from './StatusText.vue'

describe('StatusText', () => {
  describe('Rendering', () => {
    it('renders text content', () => {
      const wrapper = mount(StatusText, {
        props: {
          text: 'Ready to craft',
        },
      })

      expect(wrapper.find('.status-message').text()).toBe('Ready to craft')
    })

    it('renders icon when provided', () => {
      const wrapper = mount(StatusText, {
        props: {
          text: 'Success',
          icon: '✓',
        },
      })

      expect(wrapper.find('.status-icon').exists()).toBe(true)
      expect(wrapper.find('.status-icon').text()).toBe('✓')
    })

    it('does not render icon when not provided', () => {
      const wrapper = mount(StatusText, {
        props: {
          text: 'Status message',
        },
      })

      expect(wrapper.find('.status-icon').exists()).toBe(false)
    })
  })

  describe('Variants', () => {
    it('applies neutral variant by default', () => {
      const wrapper = mount(StatusText, {
        props: {
          text: 'Neutral message',
        },
      })

      const status = wrapper.find('.status-text')
      expect(status.attributes('style')).toContain('color: #666666')
      expect(status.attributes('style')).toContain('background-color: transparent')
    })

    it('applies info variant colors', () => {
      const wrapper = mount(StatusText, {
        props: {
          text: 'Info message',
          variant: 'info',
        },
      })

      const status = wrapper.find('.status-text')
      expect(status.attributes('style')).toContain('color: #1976d2')
      expect(status.attributes('style')).toContain('background-color: #e3f2fd')
    })

    it('applies success variant colors', () => {
      const wrapper = mount(StatusText, {
        props: {
          text: 'Success message',
          variant: 'success',
        },
      })

      const status = wrapper.find('.status-text')
      expect(status.attributes('style')).toContain('color: #2e7d32')
      expect(status.attributes('style')).toContain('background-color: #e8f5e9')
    })

    it('applies warning variant colors', () => {
      const wrapper = mount(StatusText, {
        props: {
          text: 'Warning message',
          variant: 'warning',
        },
      })

      const status = wrapper.find('.status-text')
      expect(status.attributes('style')).toContain('color: #f57c00')
      expect(status.attributes('style')).toContain('background-color: #fff3e0')
    })

    it('applies error variant colors', () => {
      const wrapper = mount(StatusText, {
        props: {
          text: 'Error message',
          variant: 'error',
        },
      })

      const status = wrapper.find('.status-text')
      expect(status.attributes('style')).toContain('color: #c62828')
      expect(status.attributes('style')).toContain('background-color: #ffebee')
    })

    it('applies has-background class for non-neutral variants', () => {
      const wrapper = mount(StatusText, {
        props: {
          text: 'Info message',
          variant: 'info',
        },
      })

      expect(wrapper.find('.status-text').classes()).toContain('has-background')
    })

    it('does not apply has-background class for neutral variant', () => {
      const wrapper = mount(StatusText, {
        props: {
          text: 'Neutral message',
          variant: 'neutral',
        },
      })

      expect(wrapper.find('.status-text').classes()).not.toContain('has-background')
    })
  })

  describe('Size Variants', () => {
    it('applies medium size by default', () => {
      const wrapper = mount(StatusText, {
        props: {
          text: 'Medium text',
        },
      })

      const status = wrapper.find('.status-text')
      expect(status.attributes('style')).toContain('font-size: 1em')
    })

    it('applies small size', () => {
      const wrapper = mount(StatusText, {
        props: {
          text: 'Small text',
          size: 'small',
        },
      })

      const status = wrapper.find('.status-text')
      expect(status.attributes('style')).toContain('font-size: 0.85em')
    })

    it('applies large size', () => {
      const wrapper = mount(StatusText, {
        props: {
          text: 'Large text',
          size: 'large',
        },
      })

      const status = wrapper.find('.status-text')
      expect(status.attributes('style')).toContain('font-size: 1.15em')
    })
  })

  describe('Text Styling', () => {
    it('applies normal font weight by default', () => {
      const wrapper = mount(StatusText, {
        props: {
          text: 'Normal text',
        },
      })

      const status = wrapper.find('.status-text')
      expect(status.attributes('style')).toContain('font-weight: normal')
    })

    it('applies bold font weight when bold is true', () => {
      const wrapper = mount(StatusText, {
        props: {
          text: 'Bold text',
          bold: true,
        },
      })

      const status = wrapper.find('.status-text')
      expect(status.attributes('style')).toContain('font-weight: 600')
    })
  })

  describe('Structure', () => {
    it('renders all structural elements', () => {
      const wrapper = mount(StatusText, {
        props: {
          text: 'Test message',
          icon: '🎯',
        },
      })

      expect(wrapper.find('.status-text').exists()).toBe(true)
      expect(wrapper.find('.status-icon').exists()).toBe(true)
      expect(wrapper.find('.status-message').exists()).toBe(true)
    })

    it('icon appears before message', () => {
      const wrapper = mount(StatusText, {
        props: {
          text: 'Test message',
          icon: '🎯',
        },
      })

      const statusText = wrapper.find('.status-text')
      const children = statusText.element.children
      expect(children[0].className).toContain('status-icon')
      expect(children[1].className).toContain('status-message')
    })
  })

  describe('Combined Props', () => {
    it('handles all props together', () => {
      const wrapper = mount(StatusText, {
        props: {
          text: 'Combined test',
          variant: 'success',
          icon: '✓',
          size: 'large',
          bold: true,
        },
      })

      const status = wrapper.find('.status-text')
      expect(wrapper.find('.status-icon').text()).toBe('✓')
      expect(wrapper.find('.status-message').text()).toBe('Combined test')
      expect(status.attributes('style')).toContain('color: #2e7d32')
      expect(status.attributes('style')).toContain('font-size: 1.15em')
      expect(status.attributes('style')).toContain('font-weight: 600')
      expect(status.classes()).toContain('has-background')
    })
  })
})
