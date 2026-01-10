import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import TimerDisplay from './TimerDisplay.vue'

describe('TimerDisplay', () => {
  describe('Rendering', () => {
    it('renders progress bar with label', () => {
      const wrapper = mount(TimerDisplay, {
        props: {
          label: 'Mining Progress',
          current: 50,
          max: 100,
        },
      })

      expect(wrapper.find('.timer-label').text()).toBe('Mining Progress')
      expect(wrapper.find('.progress-bar').exists()).toBe(true)
    })

    it('renders without label when not provided', () => {
      const wrapper = mount(TimerDisplay, {
        props: {
          current: 50,
          max: 100,
        },
      })

      expect(wrapper.find('.timer-label').exists()).toBe(false)
      expect(wrapper.find('.progress-bar').exists()).toBe(true)
    })

    it('displays correct percentage in progress mode', () => {
      const wrapper = mount(TimerDisplay, {
        props: {
          current: 75,
          max: 100,
          mode: 'progress',
          showValues: true,
        },
      })

      expect(wrapper.find('.progress-value').text()).toBe('75/100')
    })

    it('displays countdown time in countdown mode', () => {
      const wrapper = mount(TimerDisplay, {
        props: {
          current: 30,
          max: 90,
          mode: 'countdown',
        },
      })

      // Remaining: 90 - 30 = 60 seconds = 1m 0s
      expect(wrapper.find('.progress-value').text()).toBe('1m 0s')
    })

    it('displays seconds only when less than 1 minute in countdown mode', () => {
      const wrapper = mount(TimerDisplay, {
        props: {
          current: 50,
          max: 75,
          mode: 'countdown',
        },
      })

      // Remaining: 75 - 50 = 25 seconds
      expect(wrapper.find('.progress-value').text()).toBe('25s')
    })
  })

  describe('Progress Calculation', () => {
    it('calculates correct percentage for progress bar', () => {
      const wrapper = mount(TimerDisplay, {
        props: {
          current: 25,
          max: 100,
        },
      })

      const progressFill = wrapper.find('.progress-fill')
      expect(progressFill.attributes('style')).toContain('width: 25%')
    })

    it('handles 0 progress', () => {
      const wrapper = mount(TimerDisplay, {
        props: {
          current: 0,
          max: 100,
        },
      })

      const progressFill = wrapper.find('.progress-fill')
      expect(progressFill.attributes('style')).toContain('width: 0%')
    })

    it('caps progress at 100%', () => {
      const wrapper = mount(TimerDisplay, {
        props: {
          current: 150,
          max: 100,
        },
      })

      const progressFill = wrapper.find('.progress-fill')
      expect(progressFill.attributes('style')).toContain('width: 100%')
    })

    it('handles max of 0', () => {
      const wrapper = mount(TimerDisplay, {
        props: {
          current: 50,
          max: 0,
        },
      })

      const progressFill = wrapper.find('.progress-fill')
      expect(progressFill.attributes('style')).toContain('width: 0%')
    })
  })

  describe('Color Scheme', () => {
    it('uses orange color for low progress (<50%)', () => {
      const wrapper = mount(TimerDisplay, {
        props: {
          current: 25,
          max: 100,
        },
      })

      const progressFill = wrapper.find('.progress-fill')
      expect(progressFill.attributes('style')).toContain('background-color: #ffa726')
    })

    it('uses blue color for medium progress (50-99%)', () => {
      const wrapper = mount(TimerDisplay, {
        props: {
          current: 75,
          max: 100,
        },
      })

      const progressFill = wrapper.find('.progress-fill')
      expect(progressFill.attributes('style')).toContain('background-color: #4a90e2')
    })

    it('uses green color for complete progress (100%)', () => {
      const wrapper = mount(TimerDisplay, {
        props: {
          current: 100,
          max: 100,
        },
      })

      const progressFill = wrapper.find('.progress-fill')
      expect(progressFill.attributes('style')).toContain('background-color: #4caf50')
    })
  })

  describe('Display Values', () => {
    it('shows percentage when showValues is false in progress mode', () => {
      const wrapper = mount(TimerDisplay, {
        props: {
          current: 75,
          max: 100,
          mode: 'progress',
          showValues: false,
        },
      })

      expect(wrapper.find('.progress-value').text()).toBe('75%')
    })

    it('shows ratio when showValues is true in progress mode', () => {
      const wrapper = mount(TimerDisplay, {
        props: {
          current: 75,
          max: 100,
          mode: 'progress',
          showValues: true,
        },
      })

      expect(wrapper.find('.progress-value').text()).toBe('75/100')
    })

    it('floors decimal values', () => {
      const wrapper = mount(TimerDisplay, {
        props: {
          current: 75.8,
          max: 100.9,
          mode: 'progress',
          showValues: true,
        },
      })

      expect(wrapper.find('.progress-value').text()).toBe('75/100')
    })
  })
})
