import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import RequirementList from './RequirementList.vue'
import type { Requirement } from './RequirementList.vue'

describe('RequirementList', () => {
  const mockRequirements: Requirement[] = [
    {
      id: 'req-1',
      description: 'Unlock the Foundry',
      completed: true,
    },
    {
      id: 'req-2',
      description: 'Collect 100 wood',
      completed: false,
      progress: '45/100',
    },
    {
      id: 'req-3',
      description: 'Talk to Quartermaster',
      completed: false,
    },
  ]

  describe('Rendering', () => {
    it('renders title and requirements list', () => {
      const wrapper = mount(RequirementList, {
        props: {
          requirements: mockRequirements,
        },
      })

      expect(wrapper.find('.requirements-title').text()).toBe('Requirements:')
      expect(wrapper.findAll('.requirement-item')).toHaveLength(3)
    })

    it('renders custom title when provided', () => {
      const wrapper = mount(RequirementList, {
        props: {
          requirements: mockRequirements,
          title: 'Quest Requirements:',
        },
      })

      expect(wrapper.find('.requirements-title').text()).toBe('Quest Requirements:')
    })

    it('renders default title when title prop not provided', () => {
      const wrapper = mount(RequirementList, {
        props: {
          requirements: mockRequirements,
        },
      })

      expect(wrapper.find('.requirements-title').text()).toBe('Requirements:')
    })

    it('renders empty list when no requirements', () => {
      const wrapper = mount(RequirementList, {
        props: {
          requirements: [],
        },
      })

      expect(wrapper.findAll('.requirement-item')).toHaveLength(0)
    })
  })

  describe('Requirement Items', () => {
    it('renders checkmark for completed requirements', () => {
      const wrapper = mount(RequirementList, {
        props: {
          requirements: [mockRequirements[0]], // Completed requirement
        },
      })

      expect(wrapper.find('.requirement-icon').text()).toBe('✓')
    })

    it('renders cross for incomplete requirements', () => {
      const wrapper = mount(RequirementList, {
        props: {
          requirements: [mockRequirements[1]], // Incomplete requirement
        },
      })

      expect(wrapper.find('.requirement-icon').text()).toBe('✗')
    })

    it('renders requirement descriptions', () => {
      const wrapper = mount(RequirementList, {
        props: {
          requirements: mockRequirements,
        },
      })

      const descriptions = wrapper.findAll('.requirement-description')
      expect(descriptions[0].text()).toBe('Unlock the Foundry')
      expect(descriptions[1].text()).toBe('Collect 100 wood')
      expect(descriptions[2].text()).toBe('Talk to Quartermaster')
    })

    it('applies completed class to completed requirements', () => {
      const wrapper = mount(RequirementList, {
        props: {
          requirements: mockRequirements,
        },
      })

      const items = wrapper.findAll('.requirement-item')
      expect(items[0].classes()).toContain('completed')
      expect(items[1].classes()).not.toContain('completed')
      expect(items[2].classes()).not.toContain('completed')
    })
  })

  describe('Progress Indicators', () => {
    it('shows progress when provided and showProgress is true', () => {
      const wrapper = mount(RequirementList, {
        props: {
          requirements: mockRequirements,
          showProgress: true,
        },
      })

      const items = wrapper.findAll('.requirement-item')
      // First item has no progress
      expect(items[0].find('.requirement-progress').exists()).toBe(false)
      // Second item has progress
      expect(items[1].find('.requirement-progress').exists()).toBe(true)
      expect(items[1].find('.requirement-progress').text()).toBe('45/100')
      // Third item has no progress
      expect(items[2].find('.requirement-progress').exists()).toBe(false)
    })

    it('hides progress when showProgress is false', () => {
      const wrapper = mount(RequirementList, {
        props: {
          requirements: mockRequirements,
          showProgress: false,
        },
      })

      expect(wrapper.find('.requirement-progress').exists()).toBe(false)
    })

    it('shows progress by default', () => {
      const wrapper = mount(RequirementList, {
        props: {
          requirements: mockRequirements,
        },
      })

      const items = wrapper.findAll('.requirement-item')
      expect(items[1].find('.requirement-progress').exists()).toBe(true)
    })
  })

  describe('Structure', () => {
    it('renders all structural elements', () => {
      const wrapper = mount(RequirementList, {
        props: {
          requirements: mockRequirements,
        },
      })

      expect(wrapper.find('.requirement-list').exists()).toBe(true)
      expect(wrapper.find('.requirements-title').exists()).toBe(true)
      expect(wrapper.find('.requirements-items').exists()).toBe(true)
    })

    it('uses unordered list for requirements', () => {
      const wrapper = mount(RequirementList, {
        props: {
          requirements: mockRequirements,
        },
      })

      const list = wrapper.find('.requirements-items')
      expect(list.element.tagName).toBe('UL')
    })

    it('each requirement is a list item', () => {
      const wrapper = mount(RequirementList, {
        props: {
          requirements: mockRequirements,
        },
      })

      const items = wrapper.findAll('.requirement-item')
      items.forEach((item) => {
        expect(item.element.tagName).toBe('LI')
      })
    })
  })

  describe('Visual Indicators', () => {
    it('renders icon, description, and optional progress for each requirement', () => {
      const wrapper = mount(RequirementList, {
        props: {
          requirements: mockRequirements,
        },
      })

      const items = wrapper.findAll('.requirement-item')
      items.forEach((item) => {
        expect(item.find('.requirement-icon').exists()).toBe(true)
        expect(item.find('.requirement-description').exists()).toBe(true)
      })
    })
  })
})
