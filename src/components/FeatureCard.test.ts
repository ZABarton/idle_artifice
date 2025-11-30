import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import FeatureCard from './FeatureCard.vue'
import type { Feature } from '@/types/feature'

describe('FeatureCard', () => {
  const mockUnlockedFeature: Feature = {
    id: 'test-feature',
    type: 'foundry',
    name: 'Test Feature',
    icon: '🔨',
    position: { x: 0, y: 0 },
    state: 'unlocked',
    isActive: false,
    interactionType: 'navigation',
  }

  const mockLockedFeature: Feature = {
    id: 'locked-feature',
    type: 'workshop',
    name: 'Locked Feature',
    icon: '🔧',
    position: { x: 0, y: 0 },
    state: 'locked',
    isActive: false,
    prerequisites: [
      {
        type: 'feature',
        id: 'test-feature',
        description: 'Complete test feature',
      },
    ],
    interactionType: 'navigation',
  }

  describe('Rendering', () => {
    it('renders unlocked feature with correct title and icon', () => {
      const wrapper = mount(FeatureCard, {
        props: { feature: mockUnlockedFeature },
      })

      expect(wrapper.find('.feature-card__title').text()).toBe('Test Feature')
      expect(wrapper.find('.feature-card__icon').text()).toBe('🔨')
    })

    it('renders locked feature with lock icon and requirements', () => {
      const wrapper = mount(FeatureCard, {
        props: { feature: mockLockedFeature },
      })

      expect(wrapper.find('.lock-icon').exists()).toBe(true)
      expect(wrapper.find('.requirements').exists()).toBe(true)
      expect(wrapper.text()).toContain('Requires:')
      expect(wrapper.text()).toContain('Complete test feature')
    })

    it('renders slot content for unlocked features', () => {
      const wrapper = mount(FeatureCard, {
        props: { feature: mockUnlockedFeature },
        slots: {
          default: '<div class="test-slot">Slot content</div>',
        },
      })

      expect(wrapper.find('.test-slot').exists()).toBe(true)
      expect(wrapper.text()).toContain('Slot content')
    })

    it('does not render slot content for locked features', () => {
      const wrapper = mount(FeatureCard, {
        props: { feature: mockLockedFeature },
        slots: {
          default: '<div class="test-slot">Slot content</div>',
        },
      })

      expect(wrapper.find('.test-slot').exists()).toBe(false)
    })
  })

  describe('Visual States', () => {
    it('applies correct styles for unlocked inactive state', () => {
      const wrapper = mount(FeatureCard, {
        props: { feature: mockUnlockedFeature },
      })

      const background = wrapper.find('.feature-card__background')
      expect(background.attributes('fill')).toBe('#ffffff')
      expect(background.attributes('stroke')).toBe('#333333')
      expect(background.attributes('stroke-width')).toBe('1')
    })

    it('applies correct styles for active state', () => {
      const activeFeature: Feature = { ...mockUnlockedFeature, isActive: true }
      const wrapper = mount(FeatureCard, {
        props: { feature: activeFeature },
      })

      const background = wrapper.find('.feature-card__background')
      expect(background.attributes('fill')).toBe('#f8fcff')
      expect(background.attributes('stroke')).toBe('#357abd')
      expect(background.attributes('stroke-width')).toBe('2')
    })

    it('applies correct styles for locked state', () => {
      const wrapper = mount(FeatureCard, {
        props: { feature: mockLockedFeature },
      })

      const background = wrapper.find('.feature-card__background')
      expect(background.attributes('fill')).toBe('#e0e0e0')
      expect(background.attributes('stroke')).toBe('#999999')
      expect(background.attributes('stroke-dasharray')).toBe('4,2')
    })

    it('has correct cursor style for unlocked feature', () => {
      const wrapper = mount(FeatureCard, {
        props: { feature: mockUnlockedFeature },
      })

      const card = wrapper.find('.feature-card')
      expect(card.attributes('style')).toContain('cursor: pointer')
    })

    it('has correct cursor style for locked feature', () => {
      const wrapper = mount(FeatureCard, {
        props: { feature: mockLockedFeature },
      })

      const card = wrapper.find('.feature-card')
      expect(card.attributes('style')).toContain('cursor: help')
    })
  })

  describe('Interactions', () => {
    it('emits click event when clicked', async () => {
      const wrapper = mount(FeatureCard, {
        props: { feature: mockUnlockedFeature },
      })

      await wrapper.find('.feature-card').trigger('click')

      expect(wrapper.emitted('click')).toBeTruthy()
      expect(wrapper.emitted('click')?.[0]).toEqual([mockUnlockedFeature])
    })

    it('emits click event for locked features too', async () => {
      const wrapper = mount(FeatureCard, {
        props: { feature: mockLockedFeature },
      })

      await wrapper.find('.feature-card').trigger('click')

      expect(wrapper.emitted('click')).toBeTruthy()
      expect(wrapper.emitted('click')?.[0]).toEqual([mockLockedFeature])
    })
  })

  describe('Positioning', () => {
    it('applies correct transform based on position', () => {
      const wrapper = mount(FeatureCard, {
        props: {
          feature: { ...mockUnlockedFeature, position: { x: 100, y: 50 } },
        },
      })

      const card = wrapper.find('.feature-card')
      expect(card.attributes('transform')).toBe('translate(100, 50)')
    })

    it('handles negative positions', () => {
      const wrapper = mount(FeatureCard, {
        props: {
          feature: { ...mockUnlockedFeature, position: { x: -100, y: -50 } },
        },
      })

      const card = wrapper.find('.feature-card')
      expect(card.attributes('transform')).toBe('translate(-100, -50)')
    })
  })

  describe('Accessibility', () => {
    it('has correct data attribute for feature id', () => {
      const wrapper = mount(FeatureCard, {
        props: { feature: mockUnlockedFeature },
      })

      const card = wrapper.find('.feature-card')
      expect(card.attributes('data-feature-id')).toBe('test-feature')
    })

    it('applies locked class when feature is locked', () => {
      const wrapper = mount(FeatureCard, {
        props: { feature: mockLockedFeature },
      })

      const card = wrapper.find('.feature-card')
      expect(card.classes()).toContain('feature-card--locked')
    })

    it('applies active class when feature is active', () => {
      const activeFeature: Feature = { ...mockUnlockedFeature, isActive: true }
      const wrapper = mount(FeatureCard, {
        props: { feature: activeFeature },
      })

      const card = wrapper.find('.feature-card')
      expect(card.classes()).toContain('feature-card--active')
    })
  })
})
