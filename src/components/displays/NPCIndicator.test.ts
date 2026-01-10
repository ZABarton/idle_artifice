import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import NPCIndicator from './NPCIndicator.vue'

describe('NPCIndicator', () => {
  describe('Rendering', () => {
    it('renders NPC name and default icon', () => {
      const wrapper = mount(NPCIndicator, {
        props: {
          npcName: 'Quartermaster Jones',
        },
      })

      expect(wrapper.find('.npc-name').text()).toBe('Quartermaster Jones')
      expect(wrapper.find('.npc-icon').text()).toBe('💬')
    })

    it('renders custom icon when provided', () => {
      const wrapper = mount(NPCIndicator, {
        props: {
          npcName: 'Blacksmith',
          icon: '⚒️',
        },
      })

      expect(wrapper.find('.npc-icon').text()).toBe('⚒️')
    })

    it('shows badge when showBadge is true', () => {
      const wrapper = mount(NPCIndicator, {
        props: {
          npcName: 'Merchant',
          showBadge: true,
        },
      })

      expect(wrapper.find('.badge').exists()).toBe(true)
      expect(wrapper.find('.badge').text()).toBe('!')
    })

    it('hides badge when showBadge is false', () => {
      const wrapper = mount(NPCIndicator, {
        props: {
          npcName: 'Merchant',
          showBadge: false,
        },
      })

      expect(wrapper.find('.badge').exists()).toBe(false)
    })

    it('displays custom badge text', () => {
      const wrapper = mount(NPCIndicator, {
        props: {
          npcName: 'Merchant',
          showBadge: true,
          badgeText: 'New',
        },
      })

      expect(wrapper.find('.badge').text()).toBe('New')
    })
  })

  describe('Visual States', () => {
    it('applies available class when hasAvailableConversation is true', () => {
      const wrapper = mount(NPCIndicator, {
        props: {
          npcName: 'Merchant',
          hasAvailableConversation: true,
        },
      })

      const indicator = wrapper.find('.npc-indicator')
      expect(indicator.classes()).toContain('available')
    })

    it('does not apply available class when hasAvailableConversation is false', () => {
      const wrapper = mount(NPCIndicator, {
        props: {
          npcName: 'Merchant',
          hasAvailableConversation: false,
        },
      })

      const indicator = wrapper.find('.npc-indicator')
      expect(indicator.classes()).not.toContain('available')
    })

    it('has different styling for available conversations', () => {
      const wrapper = mount(NPCIndicator, {
        props: {
          npcName: 'Merchant',
          hasAvailableConversation: true,
        },
      })

      const indicator = wrapper.find('.npc-indicator')
      expect(indicator.classes()).toContain('available')
      // Check that available class is present which applies background styling
    })
  })

  describe('Structure', () => {
    it('renders all main structural elements', () => {
      const wrapper = mount(NPCIndicator, {
        props: {
          npcName: 'Test NPC',
          showBadge: true,
        },
      })

      expect(wrapper.find('.npc-indicator').exists()).toBe(true)
      expect(wrapper.find('.npc-icon-container').exists()).toBe(true)
      expect(wrapper.find('.npc-icon').exists()).toBe(true)
      expect(wrapper.find('.npc-name').exists()).toBe(true)
      expect(wrapper.find('.badge').exists()).toBe(true)
    })

    it('badge is positioned inside icon container', () => {
      const wrapper = mount(NPCIndicator, {
        props: {
          npcName: 'Test NPC',
          showBadge: true,
        },
      })

      const iconContainer = wrapper.find('.npc-icon-container')
      const badge = iconContainer.find('.badge')
      expect(badge.exists()).toBe(true)
    })
  })
})
