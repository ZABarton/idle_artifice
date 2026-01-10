import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import QuestBadge from './QuestBadge.vue'

describe('QuestBadge', () => {
  describe('Rendering', () => {
    it('renders with default icon and no text', () => {
      const wrapper = mount(QuestBadge)

      expect(wrapper.find('.badge-icon').text()).toBe('🎯')
      expect(wrapper.find('.badge-text').exists()).toBe(false)
    })

    it('renders with custom icon', () => {
      const wrapper = mount(QuestBadge, {
        props: {
          icon: '📋',
        },
      })

      expect(wrapper.find('.badge-icon').text()).toBe('📋')
    })

    it('renders text when provided', () => {
      const wrapper = mount(QuestBadge, {
        props: {
          text: 'Quest',
        },
      })

      expect(wrapper.find('.badge-text').exists()).toBe(true)
      expect(wrapper.find('.badge-text').text()).toBe('Quest')
    })

    it('renders count as text', () => {
      const wrapper = mount(QuestBadge, {
        props: {
          text: '3',
        },
      })

      expect(wrapper.find('.badge-text').text()).toBe('3')
    })
  })

  describe('Variants', () => {
    it('applies primary variant colors by default', () => {
      const wrapper = mount(QuestBadge)

      const badge = wrapper.find('.quest-badge')
      expect(badge.attributes('style')).toContain('background-color: #4a90e2')
      expect(badge.attributes('style')).toContain('border-color: #357abd')
      expect(badge.attributes('style')).toContain('color: #ffffff')
    })

    it('applies success variant colors', () => {
      const wrapper = mount(QuestBadge, {
        props: {
          variant: 'success',
        },
      })

      const badge = wrapper.find('.quest-badge')
      expect(badge.attributes('style')).toContain('background-color: #4caf50')
      expect(badge.attributes('style')).toContain('border-color: #45a049')
    })

    it('applies warning variant colors', () => {
      const wrapper = mount(QuestBadge, {
        props: {
          variant: 'warning',
        },
      })

      const badge = wrapper.find('.quest-badge')
      expect(badge.attributes('style')).toContain('background-color: #ffa726')
      expect(badge.attributes('style')).toContain('border-color: #fb8c00')
    })

    it('applies info variant colors', () => {
      const wrapper = mount(QuestBadge, {
        props: {
          variant: 'info',
        },
      })

      const badge = wrapper.find('.quest-badge')
      expect(badge.attributes('style')).toContain('background-color: #29b6f6')
      expect(badge.attributes('style')).toContain('border-color: #039be5')
    })
  })

  describe('Pulse Animation', () => {
    it('applies pulse class by default', () => {
      const wrapper = mount(QuestBadge)

      const badge = wrapper.find('.quest-badge')
      expect(badge.classes()).toContain('pulse')
    })

    it('applies pulse class when pulse is true', () => {
      const wrapper = mount(QuestBadge, {
        props: {
          pulse: true,
        },
      })

      const badge = wrapper.find('.quest-badge')
      expect(badge.classes()).toContain('pulse')
    })

    it('does not apply pulse class when pulse is false', () => {
      const wrapper = mount(QuestBadge, {
        props: {
          pulse: false,
        },
      })

      const badge = wrapper.find('.quest-badge')
      expect(badge.classes()).not.toContain('pulse')
    })
  })

  describe('Structure', () => {
    it('renders all structural elements', () => {
      const wrapper = mount(QuestBadge, {
        props: {
          text: 'New',
        },
      })

      expect(wrapper.find('.quest-badge').exists()).toBe(true)
      expect(wrapper.find('.badge-icon').exists()).toBe(true)
      expect(wrapper.find('.badge-text').exists()).toBe(true)
    })

    it('has correct default props', () => {
      const wrapper = mount(QuestBadge)

      // Icon present
      expect(wrapper.find('.badge-icon').exists()).toBe(true)
      // Pulse enabled
      expect(wrapper.find('.quest-badge').classes()).toContain('pulse')
      // Primary variant (check one of the colors)
      expect(wrapper.find('.quest-badge').attributes('style')).toContain('#4a90e2')
    })
  })

  describe('Accessibility', () => {
    it('renders as an inline element suitable for overlay', () => {
      const wrapper = mount(QuestBadge)

      const badge = wrapper.find('.quest-badge')
      // Component exists and has quest-badge class
      expect(badge.exists()).toBe(true)
    })
  })
})
