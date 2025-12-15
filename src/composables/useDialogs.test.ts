import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useDialogs } from './useDialogs'
import { useDialogsStore } from '@/stores/dialogs'
import type { DialogModal } from '@/types/dialogs'

// Mock the dialogs content loading
vi.mock('/src/content/dialogs/*.json', () => ({}))

describe('useDialogs', () => {
  const mockDialog: DialogModal = {
    id: 'test-dialog',
    characterName: 'Test Character',
    portrait: { path: null, alt: 'Test' },
    message: 'Test message',
  }

  const mockDialog1: DialogModal = {
    id: 'dialog-1',
    characterName: 'Character 1',
    portrait: { path: null, alt: 'Character 1' },
    message: 'Message 1',
  }

  const mockDialog2: DialogModal = {
    id: 'dialog-2',
    characterName: 'Character 2',
    portrait: { path: null, alt: 'Character 2' },
    message: 'Message 2',
  }

  const mockFoundryDialog: DialogModal = {
    id: 'foundry-intro',
    characterName: 'Forgemaster',
    portrait: { path: null, alt: 'Forgemaster' },
    message: 'Welcome to the foundry',
  }

  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  /**
   * Helper to set up a mock dialog in the store's loadedDialogs cache
   */
  function setupMockDialog(dialog: DialogModal) {
    const dialogsStore = useDialogsStore()
    dialogsStore.loadedDialogs.set(dialog.id, dialog)
  }

  describe('triggerDialog', () => {
    it('should trigger a dialog by ID', async () => {
      setupMockDialog(mockDialog)
      const { triggerDialog } = useDialogs()
      const dialogsStore = useDialogsStore()

      await triggerDialog('test-dialog')

      expect(dialogsStore.modalQueue.length).toBe(1)
      expect(dialogsStore.currentModal?.type).toBe('dialog')
      if (dialogsStore.currentModal?.type === 'dialog') {
        expect(dialogsStore.currentModal.modal.id).toBe('test-dialog')
      }
    })

    it('should start an active conversation when dialog is triggered', async () => {
      setupMockDialog(mockDialog)
      const { triggerDialog } = useDialogs()
      const dialogsStore = useDialogsStore()

      await triggerDialog('test-dialog')

      expect(dialogsStore.activeConversation).not.toBeNull()
      expect(dialogsStore.activeConversation?.characterName).toBe('Test Character')
      expect(dialogsStore.activeConversation?.transcript.length).toBe(1)
    })
  })

  describe('triggerDialogSequence', () => {
    it('should trigger multiple dialogs in sequence', async () => {
      setupMockDialog(mockDialog1)
      setupMockDialog(mockDialog2)
      const { triggerDialogSequence } = useDialogs()
      const dialogsStore = useDialogsStore()

      await triggerDialogSequence(['dialog-1', 'dialog-2'])

      // Both should be in queue, but only first should be current
      expect(dialogsStore.modalQueue.length).toBe(2)
      expect(dialogsStore.currentModal?.type).toBe('dialog')
      if (dialogsStore.currentModal?.type === 'dialog') {
        expect(dialogsStore.currentModal.modal.id).toBe('dialog-1')
      }
    })

    it('should handle empty array', async () => {
      const { triggerDialogSequence } = useDialogs()
      const dialogsStore = useDialogsStore()

      await triggerDialogSequence([])

      expect(dialogsStore.modalQueue.length).toBe(0)
    })
  })

  describe('triggerFeatureDialog', () => {
    it('should mark feature as interacted and trigger dialog', async () => {
      setupMockDialog(mockFoundryDialog)
      const { triggerFeatureDialog } = useDialogs()
      const dialogsStore = useDialogsStore()

      expect(dialogsStore.hasInteractedWithFeature('foundry')).toBe(false)

      await triggerFeatureDialog('foundry', 'foundry-intro')

      expect(dialogsStore.hasInteractedWithFeature('foundry')).toBe(true)
      expect(dialogsStore.modalQueue.length).toBe(1)
      if (dialogsStore.currentModal?.type === 'dialog') {
        expect(dialogsStore.currentModal.modal.id).toBe('foundry-intro')
      }
    })

    it('should not mark feature twice if already interacted', async () => {
      setupMockDialog(mockFoundryDialog)
      const { triggerFeatureDialog } = useDialogs()
      const dialogsStore = useDialogsStore()

      // First interaction
      await triggerFeatureDialog('foundry', 'foundry-intro')
      const sizeAfterFirst = dialogsStore.interactedFeatures.size

      // Clear modal queue
      dialogsStore.modalQueue = []

      // Second interaction
      await triggerFeatureDialog('foundry', 'foundry-intro')
      const sizeAfterSecond = dialogsStore.interactedFeatures.size

      expect(sizeAfterFirst).toBe(sizeAfterSecond)
    })
  })

  describe('triggerObjectiveDialog', () => {
    it('should trigger dialog for objective', async () => {
      setupMockDialog(mockDialog)
      const { triggerObjectiveDialog } = useDialogs()
      const dialogsStore = useDialogsStore()

      await triggerObjectiveDialog('first-exploration', 'test-dialog')

      expect(dialogsStore.modalQueue.length).toBe(1)
      if (dialogsStore.currentModal?.type === 'dialog') {
        expect(dialogsStore.currentModal.modal.id).toBe('test-dialog')
      }
    })
  })

  describe('triggerEventDialog', () => {
    it('should trigger dialog for event', async () => {
      setupMockDialog(mockDialog)
      const { triggerEventDialog } = useDialogs()
      const dialogsStore = useDialogsStore()

      await triggerEventDialog('resource-milestone', 'test-dialog')

      expect(dialogsStore.modalQueue.length).toBe(1)
      if (dialogsStore.currentModal?.type === 'dialog') {
        expect(dialogsStore.currentModal.modal.id).toBe('test-dialog')
      }
    })
  })

  describe('isDialogActive', () => {
    it('should return true when a dialog is active', async () => {
      setupMockDialog(mockDialog)
      const { isDialogActive, triggerDialog } = useDialogs()

      expect(isDialogActive()).toBe(false)

      await triggerDialog('test-dialog')

      expect(isDialogActive()).toBe(true)
    })

    it('should return false when a tutorial is active', () => {
      const { isDialogActive } = useDialogs()
      const dialogsStore = useDialogsStore()

      // Add a tutorial to the queue
      dialogsStore.modalQueue.push({
        type: 'tutorial',
        modal: {
          id: 'test-tutorial',
          title: 'Test',
          content: 'Test content',
          triggerConditions: [],
          showOnce: true,
        },
      })

      expect(isDialogActive()).toBe(false)
    })

    it('should return false when no modal is active', () => {
      const { isDialogActive } = useDialogs()

      expect(isDialogActive()).toBe(false)
    })
  })

  describe('getCurrentDialogId', () => {
    it('should return dialog ID when dialog is active', async () => {
      setupMockDialog(mockDialog)
      const { getCurrentDialogId, triggerDialog } = useDialogs()

      expect(getCurrentDialogId()).toBeNull()

      await triggerDialog('test-dialog')

      expect(getCurrentDialogId()).toBe('test-dialog')
    })

    it('should return null when tutorial is active', () => {
      const { getCurrentDialogId } = useDialogs()
      const dialogsStore = useDialogsStore()

      dialogsStore.modalQueue.push({
        type: 'tutorial',
        modal: {
          id: 'test-tutorial',
          title: 'Test',
          content: 'Test content',
          triggerConditions: [],
          showOnce: true,
        },
      })

      expect(getCurrentDialogId()).toBeNull()
    })

    it('should return null when no modal is active', () => {
      const { getCurrentDialogId } = useDialogs()

      expect(getCurrentDialogId()).toBeNull()
    })
  })
})
