import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import DialogModal from './DialogModal.vue'
import { useDialogsStore } from '@/stores/dialogs'
import type { DialogModal as DialogModalType } from '@/types/dialogs'

// Mock the dialogs content loading
vi.mock('/src/content/dialogs/*.json', () => ({}))

describe('DialogModal', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  const mockDialog: DialogModalType = {
    id: 'test-dialog',
    characterName: 'Test Character',
    portrait: {
      path: '/path/to/portrait.png',
      alt: 'Test character portrait',
    },
    message: 'This is a test dialog message.',
    conversationId: 'test-conversation',
  }

  const mockDialogNoPortrait: DialogModalType = {
    id: 'test-dialog-no-portrait',
    characterName: 'Mystery Person',
    portrait: {
      path: null,
      alt: 'Mystery person portrait',
    },
    message: 'I have no portrait image.',
  }

  describe('Rendering', () => {
    it('renders nothing when no modal in queue', () => {
      const wrapper = mount(DialogModal)
      expect(wrapper.find('.dialog-modal-backdrop').exists()).toBe(false)
    })

    it('renders modal when dialog is in queue', () => {
      const dialogsStore = useDialogsStore()
      dialogsStore.modalQueue.push({
        type: 'dialog',
        modal: mockDialog,
      })

      const wrapper = mount(DialogModal)

      expect(wrapper.find('.dialog-modal-backdrop').exists()).toBe(true)
      expect(wrapper.find('.dialog-modal').exists()).toBe(true)
    })

    it('renders character name', () => {
      const dialogsStore = useDialogsStore()
      dialogsStore.modalQueue.push({
        type: 'dialog',
        modal: mockDialog,
      })

      const wrapper = mount(DialogModal)

      expect(wrapper.find('.character-name').text()).toBe('Test Character')
    })

    it('renders dialog message', () => {
      const dialogsStore = useDialogsStore()
      dialogsStore.modalQueue.push({
        type: 'dialog',
        modal: mockDialog,
      })

      const wrapper = mount(DialogModal)

      expect(wrapper.find('.dialog-message').text()).toBe('This is a test dialog message.')
    })

    it('renders continue button', () => {
      const dialogsStore = useDialogsStore()
      dialogsStore.modalQueue.push({
        type: 'dialog',
        modal: mockDialog,
      })

      const wrapper = mount(DialogModal)

      const button = wrapper.find('.dialog-button')
      expect(button.exists()).toBe(true)
      expect(button.text()).toBe('Continue')
    })

    it('does not render when tutorial modal is in queue', () => {
      const dialogsStore = useDialogsStore()
      dialogsStore.modalQueue.push({
        type: 'tutorial',
        modal: {
          id: 'test-tutorial',
          title: 'Test Tutorial',
          content: 'Test content',
          triggerConditions: [],
          showOnce: true,
        },
      })

      const wrapper = mount(DialogModal)

      expect(wrapper.find('.dialog-modal-backdrop').exists()).toBe(false)
    })
  })

  describe('Portrait Rendering', () => {
    it('renders portrait image when path is provided', () => {
      const dialogsStore = useDialogsStore()
      dialogsStore.modalQueue.push({
        type: 'dialog',
        modal: mockDialog,
      })

      const wrapper = mount(DialogModal)

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

      const wrapper = mount(DialogModal)

      expect(wrapper.find('.portrait-placeholder').exists()).toBe(true)
      expect(wrapper.find('.portrait-icon').exists()).toBe(true)
      expect(wrapper.find('.portrait-image').exists()).toBe(false)
    })
  })

  describe('Layout Structure', () => {
    it('renders two-column layout', () => {
      const dialogsStore = useDialogsStore()
      dialogsStore.modalQueue.push({
        type: 'dialog',
        modal: mockDialog,
      })

      const wrapper = mount(DialogModal)

      expect(wrapper.find('.dialog-portrait').exists()).toBe(true)
      expect(wrapper.find('.dialog-content-area').exists()).toBe(true)
    })

    it('renders header, message, and footer sections', () => {
      const dialogsStore = useDialogsStore()
      dialogsStore.modalQueue.push({
        type: 'dialog',
        modal: mockDialog,
      })

      const wrapper = mount(DialogModal)

      expect(wrapper.find('.dialog-header').exists()).toBe(true)
      expect(wrapper.find('.dialog-message').exists()).toBe(true)
      expect(wrapper.find('.dialog-footer').exists()).toBe(true)
    })

    it('renders character name within header', () => {
      const dialogsStore = useDialogsStore()
      dialogsStore.modalQueue.push({
        type: 'dialog',
        modal: mockDialog,
      })

      const wrapper = mount(DialogModal)

      const header = wrapper.find('.dialog-header')
      expect(header.find('.character-name').exists()).toBe(true)
    })

    it('renders button within footer', () => {
      const dialogsStore = useDialogsStore()
      dialogsStore.modalQueue.push({
        type: 'dialog',
        modal: mockDialog,
      })

      const wrapper = mount(DialogModal)

      const footer = wrapper.find('.dialog-footer')
      expect(footer.find('.dialog-button').exists()).toBe(true)
    })
  })

  describe('Dismissal', () => {
    it('calls closeCurrentModal when button is clicked', async () => {
      const dialogsStore = useDialogsStore()
      dialogsStore.modalQueue.push({
        type: 'dialog',
        modal: mockDialog,
      })

      const wrapper = mount(DialogModal)

      expect(wrapper.find('.dialog-modal').exists()).toBe(true)

      await wrapper.find('.dialog-button').trigger('click')

      expect(dialogsStore.modalQueue).toHaveLength(0)
    })

    it('does NOT close when backdrop is clicked', async () => {
      const dialogsStore = useDialogsStore()
      dialogsStore.modalQueue.push({
        type: 'dialog',
        modal: mockDialog,
      })

      const wrapper = mount(DialogModal)

      expect(wrapper.find('.dialog-modal').exists()).toBe(true)

      await wrapper.find('.dialog-modal-backdrop').trigger('click')

      // Modal should still be in queue
      expect(dialogsStore.modalQueue).toHaveLength(1)
    })

    it('does not close when modal content is clicked', async () => {
      const dialogsStore = useDialogsStore()
      dialogsStore.modalQueue.push({
        type: 'dialog',
        modal: mockDialog,
      })

      const wrapper = mount(DialogModal)

      await wrapper.find('.dialog-modal').trigger('click')

      // Modal should still be in queue
      expect(dialogsStore.modalQueue).toHaveLength(1)
    })

    it('completes conversation when closed', async () => {
      const dialogsStore = useDialogsStore()
      dialogsStore.modalQueue.push({
        type: 'dialog',
        modal: mockDialog,
      })

      const wrapper = mount(DialogModal)

      // Set up active conversation (normally done by showDialog)
      dialogsStore.activeConversation = {
        conversationId: 'test-conversation',
        characterName: 'Test Character',
        transcript: [],
        startedAt: new Date(),
      }

      await wrapper.find('.dialog-button').trigger('click')

      // After closing, conversation should be completed and added to history
      expect(dialogsStore.activeConversation).toBe(null)
      expect(dialogsStore.dialogHistory.length).toBeGreaterThan(0)
    })
  })

  describe('Reactivity', () => {
    it('appears when dialog is added to queue', async () => {
      const dialogsStore = useDialogsStore()
      const wrapper = mount(DialogModal)

      expect(wrapper.find('.dialog-modal').exists()).toBe(false)

      dialogsStore.modalQueue.push({
        type: 'dialog',
        modal: mockDialog,
      })
      await wrapper.vm.$nextTick()

      expect(wrapper.find('.dialog-modal').exists()).toBe(true)
    })

    it('disappears when modal is removed from queue', async () => {
      const dialogsStore = useDialogsStore()
      dialogsStore.modalQueue.push({
        type: 'dialog',
        modal: mockDialog,
      })

      const wrapper = mount(DialogModal)

      expect(wrapper.find('.dialog-modal').exists()).toBe(true)

      dialogsStore.modalQueue.shift()
      await wrapper.vm.$nextTick()

      expect(wrapper.find('.dialog-modal').exists()).toBe(false)
    })

    it('updates content when different dialog is shown', async () => {
      const dialogsStore = useDialogsStore()
      dialogsStore.modalQueue.push({
        type: 'dialog',
        modal: mockDialog,
      })

      const wrapper = mount(DialogModal)

      expect(wrapper.find('.character-name').text()).toBe('Test Character')

      // Replace with different dialog
      dialogsStore.modalQueue[0] = {
        type: 'dialog',
        modal: {
          ...mockDialog,
          id: 'another-dialog',
          characterName: 'Another Character',
          message: 'Different message',
        },
      }
      await wrapper.vm.$nextTick()

      expect(wrapper.find('.character-name').text()).toBe('Another Character')
      expect(wrapper.find('.dialog-message').text()).toBe('Different message')
    })

    it('updates portrait when dialog changes', async () => {
      const dialogsStore = useDialogsStore()
      dialogsStore.modalQueue.push({
        type: 'dialog',
        modal: mockDialog,
      })

      const wrapper = mount(DialogModal)

      expect(wrapper.find('.portrait-image').exists()).toBe(true)

      // Replace with dialog without portrait
      dialogsStore.modalQueue[0] = {
        type: 'dialog',
        modal: mockDialogNoPortrait,
      }
      await wrapper.vm.$nextTick()

      expect(wrapper.find('.portrait-image').exists()).toBe(false)
      expect(wrapper.find('.portrait-placeholder').exists()).toBe(true)
    })
  })

  describe('Edge Cases', () => {
    it('handles very long messages', () => {
      const longMessage = 'This is a very long dialog message. '.repeat(100)
      const dialogsStore = useDialogsStore()
      dialogsStore.modalQueue.push({
        type: 'dialog',
        modal: {
          ...mockDialog,
          message: longMessage,
        },
      })

      const wrapper = mount(DialogModal)

      const renderedText = wrapper.find('.dialog-message').text()
      expect(renderedText).toContain('This is a very long dialog message.')
      expect(renderedText.length).toBeGreaterThan(1000)
    })

    it('handles multiline messages with newlines', () => {
      const multilineMessage = 'Line 1\nLine 2\nLine 3'
      const dialogsStore = useDialogsStore()
      dialogsStore.modalQueue.push({
        type: 'dialog',
        modal: {
          ...mockDialog,
          message: multilineMessage,
        },
      })

      const wrapper = mount(DialogModal)

      expect(wrapper.find('.dialog-message').text()).toBe(multilineMessage)
    })

    it('handles empty character name', () => {
      const dialogsStore = useDialogsStore()
      dialogsStore.modalQueue.push({
        type: 'dialog',
        modal: {
          ...mockDialog,
          characterName: '',
        },
      })

      const wrapper = mount(DialogModal)

      expect(wrapper.find('.dialog-modal').exists()).toBe(true)
      expect(wrapper.find('.character-name').text()).toBe('')
    })

    it('handles empty message', () => {
      const dialogsStore = useDialogsStore()
      dialogsStore.modalQueue.push({
        type: 'dialog',
        modal: {
          ...mockDialog,
          message: '',
        },
      })

      const wrapper = mount(DialogModal)

      expect(wrapper.find('.dialog-modal').exists()).toBe(true)
      expect(wrapper.find('.dialog-message').text()).toBe('')
    })

    it('handles dialog without conversationId', () => {
      const dialogsStore = useDialogsStore()
      const dialogWithoutConversation = { ...mockDialog }
      delete dialogWithoutConversation.conversationId

      dialogsStore.modalQueue.push({
        type: 'dialog',
        modal: dialogWithoutConversation,
      })

      const wrapper = mount(DialogModal)

      expect(wrapper.find('.dialog-modal').exists()).toBe(true)
    })
  })

  describe('Queue Behavior', () => {
    it('shows first dialog in queue when multiple are queued', () => {
      const dialogsStore = useDialogsStore()
      const dialog2: DialogModalType = {
        id: 'second-dialog',
        characterName: 'Second Character',
        portrait: { path: null, alt: 'Second' },
        message: 'Second message',
      }

      dialogsStore.modalQueue.push(
        { type: 'dialog', modal: mockDialog },
        { type: 'dialog', modal: dialog2 }
      )

      const wrapper = mount(DialogModal)

      // Should show first dialog
      expect(wrapper.find('.character-name').text()).toBe('Test Character')
    })

    it('shows next dialog after first is dismissed', async () => {
      const dialogsStore = useDialogsStore()
      const dialog2: DialogModalType = {
        id: 'second-dialog',
        characterName: 'Second Character',
        portrait: { path: null, alt: 'Second' },
        message: 'Second message',
      }

      dialogsStore.modalQueue.push(
        { type: 'dialog', modal: mockDialog },
        { type: 'dialog', modal: dialog2 }
      )

      const wrapper = mount(DialogModal)

      expect(wrapper.find('.character-name').text()).toBe('Test Character')

      // Dismiss first dialog
      await wrapper.find('.dialog-button').trigger('click')
      await wrapper.vm.$nextTick()

      // Should show second dialog
      expect(wrapper.find('.character-name').text()).toBe('Second Character')
    })

    it('shows dialog after tutorial is dismissed', async () => {
      const dialogsStore = useDialogsStore()

      dialogsStore.modalQueue.push(
        {
          type: 'tutorial',
          modal: {
            id: 'test-tutorial',
            title: 'Test',
            content: 'Content',
            triggerConditions: [],
            showOnce: true,
          },
        },
        { type: 'dialog', modal: mockDialog }
      )

      const wrapper = mount(DialogModal)

      // Should not show dialog yet (tutorial is first)
      expect(wrapper.find('.dialog-modal').exists()).toBe(false)

      // Dismiss tutorial
      dialogsStore.modalQueue.shift()
      await wrapper.vm.$nextTick()

      // Should now show dialog
      expect(wrapper.find('.dialog-modal').exists()).toBe(true)
      expect(wrapper.find('.character-name').text()).toBe('Test Character')
    })
  })

  describe('Accessibility', () => {
    it('includes alt text for portrait images', () => {
      const dialogsStore = useDialogsStore()
      dialogsStore.modalQueue.push({
        type: 'dialog',
        modal: mockDialog,
      })

      const wrapper = mount(DialogModal)

      const image = wrapper.find('.portrait-image')
      expect(image.attributes('alt')).toBe('Test character portrait')
    })

    it('maintains semantic structure with headings', () => {
      const dialogsStore = useDialogsStore()
      dialogsStore.modalQueue.push({
        type: 'dialog',
        modal: mockDialog,
      })

      const wrapper = mount(DialogModal)

      const heading = wrapper.find('.character-name')
      expect(heading.element.tagName).toBe('H2')
    })
  })
})
