import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import TutorialModal from './TutorialModal.vue'
import { useDialogsStore } from '@/stores/dialogs'
import type { TutorialModal as TutorialModalType } from '@/types/dialogs'

// Mock the dialogs content loading
vi.mock('/src/content/tutorials/*.json', () => ({}))

describe('TutorialModal', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  const mockTutorial: TutorialModalType = {
    id: 'test-tutorial',
    title: 'Test Tutorial',
    content: 'This is test tutorial content.',
    triggerConditions: [{ type: 'immediate', description: 'Test trigger' }],
    showOnce: true,
  }

  describe('Rendering', () => {
    it('renders nothing when no modal in queue', () => {
      const wrapper = mount(TutorialModal)
      expect(wrapper.find('.tutorial-modal-backdrop').exists()).toBe(false)
    })

    it('renders modal when tutorial is in queue', () => {
      const dialogsStore = useDialogsStore()
      dialogsStore.modalQueue.push({
        type: 'tutorial',
        modal: mockTutorial,
      })

      const wrapper = mount(TutorialModal)

      expect(wrapper.find('.tutorial-modal-backdrop').exists()).toBe(true)
      expect(wrapper.find('.tutorial-modal').exists()).toBe(true)
    })

    it('renders tutorial title', () => {
      const dialogsStore = useDialogsStore()
      dialogsStore.modalQueue.push({
        type: 'tutorial',
        modal: mockTutorial,
      })

      const wrapper = mount(TutorialModal)

      expect(wrapper.find('.tutorial-title').text()).toBe('Test Tutorial')
    })

    it('renders tutorial content', () => {
      const dialogsStore = useDialogsStore()
      dialogsStore.modalQueue.push({
        type: 'tutorial',
        modal: mockTutorial,
      })

      const wrapper = mount(TutorialModal)

      expect(wrapper.find('.tutorial-content').text()).toBe('This is test tutorial content.')
    })

    it('renders close button with "Got it!" text', () => {
      const dialogsStore = useDialogsStore()
      dialogsStore.modalQueue.push({
        type: 'tutorial',
        modal: mockTutorial,
      })

      const wrapper = mount(TutorialModal)

      const button = wrapper.find('.tutorial-button')
      expect(button.exists()).toBe(true)
      expect(button.text()).toBe('Got it!')
    })

    it('does not render when dialog modal is in queue', () => {
      const dialogsStore = useDialogsStore()
      dialogsStore.modalQueue.push({
        type: 'dialog',
        modal: {
          id: 'test-dialog',
          characterName: 'Test Character',
          portrait: { path: null, alt: 'Test' },
          message: 'Test message',
        },
      })

      const wrapper = mount(TutorialModal)

      expect(wrapper.find('.tutorial-modal-backdrop').exists()).toBe(false)
    })
  })

  describe('Dismissal', () => {
    it('calls closeCurrentModal when button is clicked', async () => {
      const dialogsStore = useDialogsStore()
      dialogsStore.modalQueue.push({
        type: 'tutorial',
        modal: mockTutorial,
      })

      const wrapper = mount(TutorialModal)

      expect(wrapper.find('.tutorial-modal').exists()).toBe(true)

      await wrapper.find('.tutorial-button').trigger('click')

      expect(dialogsStore.modalQueue).toHaveLength(0)
    })

    it('calls closeCurrentModal when backdrop is clicked', async () => {
      const dialogsStore = useDialogsStore()
      dialogsStore.modalQueue.push({
        type: 'tutorial',
        modal: mockTutorial,
      })

      const wrapper = mount(TutorialModal)

      expect(wrapper.find('.tutorial-modal').exists()).toBe(true)

      await wrapper.find('.tutorial-modal-backdrop').trigger('click')

      expect(dialogsStore.modalQueue).toHaveLength(0)
    })

    it('does not close when modal content is clicked', async () => {
      const dialogsStore = useDialogsStore()
      dialogsStore.modalQueue.push({
        type: 'tutorial',
        modal: mockTutorial,
      })

      const wrapper = mount(TutorialModal)

      await wrapper.find('.tutorial-modal').trigger('click')

      // Modal should still be in queue
      expect(dialogsStore.modalQueue).toHaveLength(1)
    })

    it('marks tutorial as completed when closed', async () => {
      const dialogsStore = useDialogsStore()

      // Ensure tutorial is not marked as completed initially
      const wasSeen = dialogsStore.hasSeenTutorial('test-tutorial')

      dialogsStore.modalQueue.push({
        type: 'tutorial',
        modal: mockTutorial,
      })

      const wrapper = mount(TutorialModal)

      await wrapper.find('.tutorial-button').trigger('click')

      // After closing, it should be marked as seen
      expect(dialogsStore.hasSeenTutorial('test-tutorial')).toBe(true)

      // Should have changed from the initial state (or stayed true if already seen)
      if (!wasSeen) {
        expect(dialogsStore.hasSeenTutorial('test-tutorial')).toBe(true)
      }
    })
  })

  describe('Content Structure', () => {
    it('renders header, content, and footer sections', () => {
      const dialogsStore = useDialogsStore()
      dialogsStore.modalQueue.push({
        type: 'tutorial',
        modal: mockTutorial,
      })

      const wrapper = mount(TutorialModal)

      expect(wrapper.find('.tutorial-header').exists()).toBe(true)
      expect(wrapper.find('.tutorial-content').exists()).toBe(true)
      expect(wrapper.find('.tutorial-footer').exists()).toBe(true)
    })

    it('renders title within header', () => {
      const dialogsStore = useDialogsStore()
      dialogsStore.modalQueue.push({
        type: 'tutorial',
        modal: mockTutorial,
      })

      const wrapper = mount(TutorialModal)

      const header = wrapper.find('.tutorial-header')
      expect(header.find('.tutorial-title').exists()).toBe(true)
    })

    it('renders button within footer', () => {
      const dialogsStore = useDialogsStore()
      dialogsStore.modalQueue.push({
        type: 'tutorial',
        modal: mockTutorial,
      })

      const wrapper = mount(TutorialModal)

      const footer = wrapper.find('.tutorial-footer')
      expect(footer.find('.tutorial-button').exists()).toBe(true)
    })
  })

  describe('Reactivity', () => {
    it('appears when tutorial is added to queue', async () => {
      const dialogsStore = useDialogsStore()
      const wrapper = mount(TutorialModal)

      expect(wrapper.find('.tutorial-modal').exists()).toBe(false)

      dialogsStore.modalQueue.push({
        type: 'tutorial',
        modal: mockTutorial,
      })
      await wrapper.vm.$nextTick()

      expect(wrapper.find('.tutorial-modal').exists()).toBe(true)
    })

    it('disappears when modal is removed from queue', async () => {
      const dialogsStore = useDialogsStore()
      dialogsStore.modalQueue.push({
        type: 'tutorial',
        modal: mockTutorial,
      })

      const wrapper = mount(TutorialModal)

      expect(wrapper.find('.tutorial-modal').exists()).toBe(true)

      dialogsStore.modalQueue.shift()
      await wrapper.vm.$nextTick()

      expect(wrapper.find('.tutorial-modal').exists()).toBe(false)
    })

    it('updates content when different tutorial is shown', async () => {
      const dialogsStore = useDialogsStore()
      dialogsStore.modalQueue.push({
        type: 'tutorial',
        modal: mockTutorial,
      })

      const wrapper = mount(TutorialModal)

      expect(wrapper.find('.tutorial-title').text()).toBe('Test Tutorial')

      // Replace with different tutorial
      dialogsStore.modalQueue[0] = {
        type: 'tutorial',
        modal: {
          ...mockTutorial,
          id: 'another-tutorial',
          title: 'Another Tutorial',
          content: 'Different content',
        },
      }
      await wrapper.vm.$nextTick()

      expect(wrapper.find('.tutorial-title').text()).toBe('Another Tutorial')
      expect(wrapper.find('.tutorial-content').text()).toBe('Different content')
    })
  })

  describe('Edge Cases', () => {
    it('handles very long content', () => {
      const longContent = 'This is a very long tutorial content. '.repeat(100)
      const dialogsStore = useDialogsStore()
      dialogsStore.modalQueue.push({
        type: 'tutorial',
        modal: {
          ...mockTutorial,
          content: longContent,
        },
      })

      const wrapper = mount(TutorialModal)

      const renderedText = wrapper.find('.tutorial-content').text()
      expect(renderedText).toContain('This is a very long tutorial content.')
      expect(renderedText.length).toBeGreaterThan(1000)
    })

    it('handles multiline content with newlines', () => {
      const multilineContent = 'Line 1\nLine 2\nLine 3'
      const dialogsStore = useDialogsStore()
      dialogsStore.modalQueue.push({
        type: 'tutorial',
        modal: {
          ...mockTutorial,
          content: multilineContent,
        },
      })

      const wrapper = mount(TutorialModal)

      expect(wrapper.find('.tutorial-content').text()).toBe(multilineContent)
    })

    it('handles empty title', () => {
      const dialogsStore = useDialogsStore()
      dialogsStore.modalQueue.push({
        type: 'tutorial',
        modal: {
          ...mockTutorial,
          title: '',
        },
      })

      const wrapper = mount(TutorialModal)

      expect(wrapper.find('.tutorial-modal').exists()).toBe(true)
      expect(wrapper.find('.tutorial-title').text()).toBe('')
    })

    it('handles empty content', () => {
      const dialogsStore = useDialogsStore()
      dialogsStore.modalQueue.push({
        type: 'tutorial',
        modal: {
          ...mockTutorial,
          content: '',
        },
      })

      const wrapper = mount(TutorialModal)

      expect(wrapper.find('.tutorial-modal').exists()).toBe(true)
      expect(wrapper.find('.tutorial-content').text()).toBe('')
    })
  })

  describe('Queue Behavior', () => {
    it('shows first tutorial in queue when multiple are queued', () => {
      const dialogsStore = useDialogsStore()
      const tutorial2: TutorialModalType = {
        id: 'second-tutorial',
        title: 'Second Tutorial',
        content: 'Second content',
        triggerConditions: [],
        showOnce: true,
      }

      dialogsStore.modalQueue.push(
        { type: 'tutorial', modal: mockTutorial },
        { type: 'tutorial', modal: tutorial2 }
      )

      const wrapper = mount(TutorialModal)

      // Should show first tutorial
      expect(wrapper.find('.tutorial-title').text()).toBe('Test Tutorial')
    })

    it('shows next tutorial after first is dismissed', async () => {
      const dialogsStore = useDialogsStore()
      const tutorial2: TutorialModalType = {
        id: 'second-tutorial',
        title: 'Second Tutorial',
        content: 'Second content',
        triggerConditions: [],
        showOnce: true,
      }

      dialogsStore.modalQueue.push(
        { type: 'tutorial', modal: mockTutorial },
        { type: 'tutorial', modal: tutorial2 }
      )

      const wrapper = mount(TutorialModal)

      expect(wrapper.find('.tutorial-title').text()).toBe('Test Tutorial')

      // Dismiss first tutorial
      await wrapper.find('.tutorial-button').trigger('click')
      await wrapper.vm.$nextTick()

      // Should show second tutorial
      expect(wrapper.find('.tutorial-title').text()).toBe('Second Tutorial')
    })
  })
})
