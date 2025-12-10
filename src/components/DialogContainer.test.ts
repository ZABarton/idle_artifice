import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import DialogContainer from './DialogContainer.vue'
import { useDialogsStore } from '@/stores/dialogs'
import type { TutorialModal, DialogModal } from '@/types/dialogs'

// Mock the dialogs content loading
vi.mock('/src/content/tutorials/*.json', () => ({}))
vi.mock('/src/content/dialogs/*.json', () => ({}))

describe('DialogContainer', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  const mockTutorial: TutorialModal = {
    id: 'test-tutorial',
    title: 'Test Tutorial',
    content: 'This is test tutorial content.',
    triggerConditions: [{ type: 'immediate', description: 'Test trigger' }],
    showOnce: true,
  }

  const mockDialog: DialogModal = {
    id: 'test-dialog',
    characterName: 'Test Character',
    portrait: {
      path: '/path/to/portrait.png',
      alt: 'Test character portrait',
    },
    message: 'This is a test dialog message.',
    conversationId: 'test-conversation',
  }

  const mockDialogNoPortrait: DialogModal = {
    id: 'test-dialog-no-portrait',
    characterName: 'Mystery Person',
    portrait: {
      path: null,
      alt: 'Mystery person portrait',
    },
    message: 'I have no portrait image.',
  }

  describe('Initial Rendering', () => {
    it('renders nothing when no modal in queue', () => {
      const wrapper = mount(DialogContainer)
      expect(wrapper.find('.modal-backdrop').exists()).toBe(false)
    })

    it('renders backdrop when modal is in queue', () => {
      const dialogsStore = useDialogsStore()
      dialogsStore.modalQueue.push({
        type: 'tutorial',
        modal: mockTutorial,
      })

      const wrapper = mount(DialogContainer)

      expect(wrapper.find('.modal-backdrop').exists()).toBe(true)
    })
  })

  describe('Tutorial Modal Rendering', () => {
    it('renders tutorial modal when tutorial is in queue', () => {
      const dialogsStore = useDialogsStore()
      dialogsStore.modalQueue.push({
        type: 'tutorial',
        modal: mockTutorial,
      })

      const wrapper = mount(DialogContainer)

      expect(wrapper.find('.tutorial-modal').exists()).toBe(true)
      expect(wrapper.find('.dialog-modal').exists()).toBe(false)
    })

    it('renders tutorial title and content', () => {
      const dialogsStore = useDialogsStore()
      dialogsStore.modalQueue.push({
        type: 'tutorial',
        modal: mockTutorial,
      })

      const wrapper = mount(DialogContainer)

      expect(wrapper.find('.tutorial-title').text()).toBe('Test Tutorial')
      expect(wrapper.find('.tutorial-content').text()).toBe('This is test tutorial content.')
    })

    it('renders tutorial close button with "Got it!" text', () => {
      const dialogsStore = useDialogsStore()
      dialogsStore.modalQueue.push({
        type: 'tutorial',
        modal: mockTutorial,
      })

      const wrapper = mount(DialogContainer)

      const button = wrapper.find('.tutorial-button')
      expect(button.exists()).toBe(true)
      expect(button.text()).toBe('Got it!')
    })

    it('renders tutorial structure with header, content, footer', () => {
      const dialogsStore = useDialogsStore()
      dialogsStore.modalQueue.push({
        type: 'tutorial',
        modal: mockTutorial,
      })

      const wrapper = mount(DialogContainer)

      expect(wrapper.find('.tutorial-header').exists()).toBe(true)
      expect(wrapper.find('.tutorial-content').exists()).toBe(true)
      expect(wrapper.find('.tutorial-footer').exists()).toBe(true)
    })
  })

  describe('Dialog Modal Rendering', () => {
    it('renders dialog modal when dialog is in queue', () => {
      const dialogsStore = useDialogsStore()
      dialogsStore.modalQueue.push({
        type: 'dialog',
        modal: mockDialog,
      })

      const wrapper = mount(DialogContainer)

      expect(wrapper.find('.dialog-modal').exists()).toBe(true)
      expect(wrapper.find('.tutorial-modal').exists()).toBe(false)
    })

    it('renders character name and message', () => {
      const dialogsStore = useDialogsStore()
      dialogsStore.modalQueue.push({
        type: 'dialog',
        modal: mockDialog,
      })

      const wrapper = mount(DialogContainer)

      expect(wrapper.find('.character-name').text()).toBe('Test Character')
      expect(wrapper.find('.dialog-message').text()).toBe('This is a test dialog message.')
    })

    it('renders continue button', () => {
      const dialogsStore = useDialogsStore()
      dialogsStore.modalQueue.push({
        type: 'dialog',
        modal: mockDialog,
      })

      const wrapper = mount(DialogContainer)

      const button = wrapper.find('.dialog-button')
      expect(button.exists()).toBe(true)
      expect(button.text()).toBe('Continue')
    })

    it('renders two-column layout with portrait and content', () => {
      const dialogsStore = useDialogsStore()
      dialogsStore.modalQueue.push({
        type: 'dialog',
        modal: mockDialog,
      })

      const wrapper = mount(DialogContainer)

      expect(wrapper.find('.dialog-portrait').exists()).toBe(true)
      expect(wrapper.find('.dialog-content-area').exists()).toBe(true)
    })

    it('renders portrait image when path is provided', () => {
      const dialogsStore = useDialogsStore()
      dialogsStore.modalQueue.push({
        type: 'dialog',
        modal: mockDialog,
      })

      const wrapper = mount(DialogContainer)

      const image = wrapper.find('.portrait-image')
      expect(image.exists()).toBe(true)
      expect(image.attributes('src')).toBe('/path/to/portrait.png')
      expect(image.attributes('alt')).toBe('Test character portrait')
      expect(wrapper.find('.portrait-placeholder').exists()).toBe(false)
    })

    it('renders placeholder when portrait path is null', () => {
      const dialogsStore = useDialogsStore()
      dialogsStore.modalQueue.push({
        type: 'dialog',
        modal: mockDialogNoPortrait,
      })

      const wrapper = mount(DialogContainer)

      expect(wrapper.find('.portrait-placeholder').exists()).toBe(true)
      expect(wrapper.find('.portrait-icon').exists()).toBe(true)
      expect(wrapper.find('.portrait-image').exists()).toBe(false)
    })
  })

  describe('Backdrop Click Behavior', () => {
    it('closes tutorial when backdrop is clicked', async () => {
      const dialogsStore = useDialogsStore()
      dialogsStore.modalQueue.push({
        type: 'tutorial',
        modal: mockTutorial,
      })

      const wrapper = mount(DialogContainer)

      expect(wrapper.find('.tutorial-modal').exists()).toBe(true)

      await wrapper.find('.modal-backdrop').trigger('click')

      expect(dialogsStore.modalQueue).toHaveLength(0)
    })

    it('does NOT close dialog when backdrop is clicked', async () => {
      const dialogsStore = useDialogsStore()
      dialogsStore.modalQueue.push({
        type: 'dialog',
        modal: mockDialog,
      })

      const wrapper = mount(DialogContainer)

      expect(wrapper.find('.dialog-modal').exists()).toBe(true)

      await wrapper.find('.modal-backdrop').trigger('click')

      // Modal should still be in queue
      expect(dialogsStore.modalQueue).toHaveLength(1)
    })

    it('does not close tutorial when modal content is clicked', async () => {
      const dialogsStore = useDialogsStore()
      dialogsStore.modalQueue.push({
        type: 'tutorial',
        modal: mockTutorial,
      })

      const wrapper = mount(DialogContainer)

      await wrapper.find('.tutorial-modal').trigger('click')

      // Modal should still be in queue (click stopped propagation)
      expect(dialogsStore.modalQueue).toHaveLength(1)
    })

    it('does not close dialog when modal content is clicked', async () => {
      const dialogsStore = useDialogsStore()
      dialogsStore.modalQueue.push({
        type: 'dialog',
        modal: mockDialog,
      })

      const wrapper = mount(DialogContainer)

      await wrapper.find('.dialog-modal').trigger('click')

      // Modal should still be in queue
      expect(dialogsStore.modalQueue).toHaveLength(1)
    })
  })

  describe('Button Click Behavior', () => {
    it('closes tutorial when "Got it!" button is clicked', async () => {
      const dialogsStore = useDialogsStore()
      dialogsStore.modalQueue.push({
        type: 'tutorial',
        modal: mockTutorial,
      })

      const wrapper = mount(DialogContainer)

      await wrapper.find('.tutorial-button').trigger('click')

      expect(dialogsStore.modalQueue).toHaveLength(0)
    })

    it('closes dialog when "Continue" button is clicked', async () => {
      const dialogsStore = useDialogsStore()
      dialogsStore.modalQueue.push({
        type: 'dialog',
        modal: mockDialog,
      })

      const wrapper = mount(DialogContainer)

      await wrapper.find('.dialog-button').trigger('click')

      expect(dialogsStore.modalQueue).toHaveLength(0)
    })

    it('marks tutorial as completed when closed', async () => {
      const dialogsStore = useDialogsStore()
      dialogsStore.modalQueue.push({
        type: 'tutorial',
        modal: mockTutorial,
      })

      const wrapper = mount(DialogContainer)

      await wrapper.find('.tutorial-button').trigger('click')

      expect(dialogsStore.hasSeenTutorial('test-tutorial')).toBe(true)
    })

    it('completes conversation when dialog is closed', async () => {
      const dialogsStore = useDialogsStore()
      dialogsStore.modalQueue.push({
        type: 'dialog',
        modal: mockDialog,
      })

      const wrapper = mount(DialogContainer)

      // Set up active conversation (normally done by showDialog)
      dialogsStore.activeConversation = {
        conversationId: 'test-conversation',
        characterName: 'Test Character',
        transcript: [],
        startedAt: new Date(),
      }

      await wrapper.find('.dialog-button').trigger('click')

      expect(dialogsStore.activeConversation).toBe(null)
      expect(dialogsStore.dialogHistory.length).toBeGreaterThan(0)
    })
  })

  describe('Queue Behavior', () => {
    it('shows first modal in queue', () => {
      const dialogsStore = useDialogsStore()
      dialogsStore.modalQueue.push(
        { type: 'tutorial', modal: mockTutorial },
        {
          type: 'tutorial',
          modal: { ...mockTutorial, id: 'second', title: 'Second Tutorial' },
        }
      )

      const wrapper = mount(DialogContainer)

      expect(wrapper.find('.tutorial-title').text()).toBe('Test Tutorial')
    })

    it('shows next modal after first is dismissed', async () => {
      const dialogsStore = useDialogsStore()
      dialogsStore.modalQueue.push(
        { type: 'tutorial', modal: mockTutorial },
        {
          type: 'tutorial',
          modal: { ...mockTutorial, id: 'second', title: 'Second Tutorial' },
        }
      )

      const wrapper = mount(DialogContainer)

      await wrapper.find('.tutorial-button').trigger('click')
      await wrapper.vm.$nextTick()

      expect(wrapper.find('.tutorial-title').text()).toBe('Second Tutorial')
    })

    it('switches from tutorial to dialog in queue', async () => {
      const dialogsStore = useDialogsStore()
      dialogsStore.modalQueue.push(
        { type: 'tutorial', modal: mockTutorial },
        { type: 'dialog', modal: mockDialog }
      )

      const wrapper = mount(DialogContainer)

      // Should show tutorial first
      expect(wrapper.find('.tutorial-modal').exists()).toBe(true)
      expect(wrapper.find('.dialog-modal').exists()).toBe(false)

      // Dismiss tutorial
      await wrapper.find('.tutorial-button').trigger('click')
      await wrapper.vm.$nextTick()

      // Should now show dialog
      expect(wrapper.find('.tutorial-modal').exists()).toBe(false)
      expect(wrapper.find('.dialog-modal').exists()).toBe(true)
    })

    it('switches from dialog to tutorial in queue', async () => {
      const dialogsStore = useDialogsStore()
      dialogsStore.modalQueue.push(
        { type: 'dialog', modal: mockDialog },
        { type: 'tutorial', modal: mockTutorial }
      )

      const wrapper = mount(DialogContainer)

      // Should show dialog first
      expect(wrapper.find('.dialog-modal').exists()).toBe(true)
      expect(wrapper.find('.tutorial-modal').exists()).toBe(false)

      // Dismiss dialog
      await wrapper.find('.dialog-button').trigger('click')
      await wrapper.vm.$nextTick()

      // Should now show tutorial
      expect(wrapper.find('.dialog-modal').exists()).toBe(false)
      expect(wrapper.find('.tutorial-modal').exists()).toBe(true)
    })
  })

  describe('Reactivity', () => {
    it('appears when modal is added to empty queue', async () => {
      const dialogsStore = useDialogsStore()
      const wrapper = mount(DialogContainer)

      expect(wrapper.find('.modal-backdrop').exists()).toBe(false)

      dialogsStore.modalQueue.push({
        type: 'tutorial',
        modal: mockTutorial,
      })
      await wrapper.vm.$nextTick()

      expect(wrapper.find('.modal-backdrop').exists()).toBe(true)
    })

    it('disappears when last modal is removed from queue', async () => {
      const dialogsStore = useDialogsStore()
      dialogsStore.modalQueue.push({
        type: 'tutorial',
        modal: mockTutorial,
      })

      const wrapper = mount(DialogContainer)

      expect(wrapper.find('.modal-backdrop').exists()).toBe(true)

      dialogsStore.modalQueue.shift()
      await wrapper.vm.$nextTick()

      expect(wrapper.find('.modal-backdrop').exists()).toBe(false)
    })

    it('updates content when modal in queue changes', async () => {
      const dialogsStore = useDialogsStore()
      dialogsStore.modalQueue.push({
        type: 'tutorial',
        modal: mockTutorial,
      })

      const wrapper = mount(DialogContainer)

      expect(wrapper.find('.tutorial-title').text()).toBe('Test Tutorial')

      // Replace with different modal
      dialogsStore.modalQueue[0] = {
        type: 'tutorial',
        modal: { ...mockTutorial, title: 'Updated Tutorial', content: 'Updated content' },
      }
      await wrapper.vm.$nextTick()

      expect(wrapper.find('.tutorial-title').text()).toBe('Updated Tutorial')
      expect(wrapper.find('.tutorial-content').text()).toBe('Updated content')
    })

    it('switches modal type when queue item changes type', async () => {
      const dialogsStore = useDialogsStore()
      dialogsStore.modalQueue.push({
        type: 'tutorial',
        modal: mockTutorial,
      })

      const wrapper = mount(DialogContainer)

      expect(wrapper.find('.tutorial-modal').exists()).toBe(true)

      // Replace with dialog
      dialogsStore.modalQueue[0] = {
        type: 'dialog',
        modal: mockDialog,
      }
      await wrapper.vm.$nextTick()

      expect(wrapper.find('.tutorial-modal').exists()).toBe(false)
      expect(wrapper.find('.dialog-modal').exists()).toBe(true)
    })
  })

  describe('Z-Index Stacking', () => {
    it('renders backdrop and modal with proper CSS classes for z-index', () => {
      const dialogsStore = useDialogsStore()
      dialogsStore.modalQueue.push({
        type: 'tutorial',
        modal: mockTutorial,
      })

      const wrapper = mount(DialogContainer)

      const backdrop = wrapper.find('.modal-backdrop')
      const modal = wrapper.find('.modal-panel')

      // Verify elements exist with correct classes (z-index defined in CSS)
      expect(backdrop.exists()).toBe(true)
      expect(modal.exists()).toBe(true)
      expect(backdrop.classes()).toContain('modal-backdrop')
      expect(modal.classes()).toContain('modal-panel')
    })
  })

  describe('Edge Cases', () => {
    it('handles very long tutorial content', () => {
      const longContent = 'This is very long content. '.repeat(100)
      const dialogsStore = useDialogsStore()
      dialogsStore.modalQueue.push({
        type: 'tutorial',
        modal: { ...mockTutorial, content: longContent },
      })

      const wrapper = mount(DialogContainer)

      const content = wrapper.find('.tutorial-content').text()
      expect(content).toContain('This is very long content.')
      expect(content.length).toBeGreaterThan(1000)
    })

    it('handles very long dialog message', () => {
      const longMessage = 'This is a very long message. '.repeat(100)
      const dialogsStore = useDialogsStore()
      dialogsStore.modalQueue.push({
        type: 'dialog',
        modal: { ...mockDialog, message: longMessage },
      })

      const wrapper = mount(DialogContainer)

      const message = wrapper.find('.dialog-message').text()
      expect(message).toContain('This is a very long message.')
      expect(message.length).toBeGreaterThan(1000)
    })

    it('handles multiline content with newlines', () => {
      const multilineContent = 'Line 1\nLine 2\nLine 3'
      const dialogsStore = useDialogsStore()
      dialogsStore.modalQueue.push({
        type: 'tutorial',
        modal: { ...mockTutorial, content: multilineContent },
      })

      const wrapper = mount(DialogContainer)

      expect(wrapper.find('.tutorial-content').text()).toBe(multilineContent)
    })

    it('handles empty tutorial title and content', () => {
      const dialogsStore = useDialogsStore()
      dialogsStore.modalQueue.push({
        type: 'tutorial',
        modal: { ...mockTutorial, title: '', content: '' },
      })

      const wrapper = mount(DialogContainer)

      expect(wrapper.find('.tutorial-modal').exists()).toBe(true)
      expect(wrapper.find('.tutorial-title').text()).toBe('')
      expect(wrapper.find('.tutorial-content').text()).toBe('')
    })

    it('handles empty character name and message', () => {
      const dialogsStore = useDialogsStore()
      dialogsStore.modalQueue.push({
        type: 'dialog',
        modal: { ...mockDialog, characterName: '', message: '' },
      })

      const wrapper = mount(DialogContainer)

      expect(wrapper.find('.dialog-modal').exists()).toBe(true)
      expect(wrapper.find('.character-name').text()).toBe('')
      expect(wrapper.find('.dialog-message').text()).toBe('')
    })
  })

  describe('Accessibility', () => {
    it('includes alt text for dialog portrait images', () => {
      const dialogsStore = useDialogsStore()
      dialogsStore.modalQueue.push({
        type: 'dialog',
        modal: mockDialog,
      })

      const wrapper = mount(DialogContainer)

      const image = wrapper.find('.portrait-image')
      expect(image.attributes('alt')).toBe('Test character portrait')
    })

    it('maintains semantic structure with headings for tutorials', () => {
      const dialogsStore = useDialogsStore()
      dialogsStore.modalQueue.push({
        type: 'tutorial',
        modal: mockTutorial,
      })

      const wrapper = mount(DialogContainer)

      const heading = wrapper.find('.tutorial-title')
      expect(heading.element.tagName).toBe('H2')
    })

    it('maintains semantic structure with headings for dialogs', () => {
      const dialogsStore = useDialogsStore()
      dialogsStore.modalQueue.push({
        type: 'dialog',
        modal: mockDialog,
      })

      const wrapper = mount(DialogContainer)

      const heading = wrapper.find('.character-name')
      expect(heading.element.tagName).toBe('H2')
    })
  })
})
