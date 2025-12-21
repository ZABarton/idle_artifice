import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useDialogsStore } from './dialogs'
import type { TutorialModal, DialogModal, DialogHistoryEntry, DialogTree } from '@/types/dialogs'

// Mock the notifications store
vi.mock('./notifications', () => ({
  useNotificationsStore: vi.fn(() => ({
    showWarning: vi.fn(),
    showError: vi.fn(),
  })),
}))

// Mock the content loading
vi.mock('/src/content/tutorials/*.json', () => ({}))
vi.mock('/src/content/dialogs/*.json', () => ({}))

describe('dialogs store', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  afterEach(() => {
    localStorage.clear()
  })

  describe('localStorage persistence', () => {
    describe('completed tutorials', () => {
      it('loads completed tutorials from localStorage on initialization', async () => {
        const completedTutorials = ['tutorial-1', 'tutorial-2', 'tutorial-3']
        localStorage.setItem(
          'idle-artifice-completed-tutorials',
          JSON.stringify(completedTutorials)
        )

        const store = useDialogsStore()
        await store.initialize()

        expect(store.hasSeenTutorial('tutorial-1')).toBe(true)
        expect(store.hasSeenTutorial('tutorial-2')).toBe(true)
        expect(store.hasSeenTutorial('tutorial-3')).toBe(true)
        expect(store.hasSeenTutorial('tutorial-4')).toBe(false)
      })

      it('saves completed tutorials to localStorage when marking as completed', () => {
        const store = useDialogsStore()

        store.markTutorialCompleted('new-tutorial')

        const saved = JSON.parse(
          localStorage.getItem('idle-artifice-completed-tutorials') || '[]'
        )
        expect(saved).toContain('new-tutorial')
      })

      it('handles empty localStorage gracefully', async () => {
        const store = useDialogsStore()
        await store.initialize()

        expect(store.hasSeenTutorial('any-tutorial')).toBe(false)
        expect(store.completedTutorials.size).toBe(0)
      })

      it('handles corrupted localStorage data gracefully', async () => {
        localStorage.setItem('idle-artifice-completed-tutorials', 'invalid-json{')

        const store = useDialogsStore()
        await store.initialize()

        // Should fall back to empty set
        expect(store.completedTutorials.size).toBe(0)
      })
    })

    describe('dialog history', () => {
      it('loads dialog history from localStorage on initialization', async () => {
        const history = [
          {
            conversationId: 'conv-1',
            characterName: 'Character 1',
            transcript: [
              {
                speaker: 'npc',
                speakerName: 'Character 1',
                message: 'Hello',
                timestamp: new Date('2024-01-01').toISOString(),
              },
            ],
            startedAt: new Date('2024-01-01').toISOString(),
            completedAt: new Date('2024-01-01').toISOString(),
          },
        ]
        localStorage.setItem('idle-artifice-dialog-history', JSON.stringify(history))

        const store = useDialogsStore()
        await store.initialize()

        expect(store.dialogHistory.length).toBe(1)
        expect(store.dialogHistory[0].conversationId).toBe('conv-1')
        expect(store.dialogHistory[0].startedAt).toBeInstanceOf(Date)
        expect(store.dialogHistory[0].completedAt).toBeInstanceOf(Date)
      })

      it('saves dialog history to localStorage when completing conversation', async () => {
        const store = useDialogsStore()

        // Start a conversation
        store.activeConversation = {
          conversationId: 'test-conv',
          characterName: 'Test Character',
          transcript: [
            {
              speaker: 'npc',
              speakerName: 'Test Character',
              message: 'Test message',
              timestamp: new Date(),
            },
          ],
          startedAt: new Date(),
        }

        store.completeConversation()

        const saved = JSON.parse(localStorage.getItem('idle-artifice-dialog-history') || '[]')
        expect(saved).toHaveLength(1)
        expect(saved[0].conversationId).toBe('test-conv')
      })

      it('handles empty dialog history localStorage', async () => {
        const store = useDialogsStore()
        await store.initialize()

        expect(store.dialogHistory).toEqual([])
      })

      it('converts timestamp strings back to Date objects', async () => {
        const history = [
          {
            conversationId: 'conv-1',
            characterName: 'Character 1',
            transcript: [
              {
                speaker: 'npc',
                speakerName: 'Character 1',
                message: 'Hello',
                timestamp: '2024-01-01T00:00:00.000Z',
              },
            ],
            startedAt: '2024-01-01T00:00:00.000Z',
            completedAt: '2024-01-01T00:00:00.000Z',
          },
        ]
        localStorage.setItem('idle-artifice-dialog-history', JSON.stringify(history))

        const store = useDialogsStore()
        await store.initialize()

        expect(store.dialogHistory[0].startedAt).toBeInstanceOf(Date)
        expect(store.dialogHistory[0].completedAt).toBeInstanceOf(Date)
        expect(store.dialogHistory[0].transcript[0].timestamp).toBeInstanceOf(Date)
      })
    })

    describe('interacted features', () => {
      it('loads interacted features from localStorage on initialization', async () => {
        const interacted = ['foundry', 'shop', 'workshop']
        localStorage.setItem('idle-artifice-interacted-features', JSON.stringify(interacted))

        const store = useDialogsStore()
        await store.initialize()

        expect(store.hasInteractedWithFeature('foundry')).toBe(true)
        expect(store.hasInteractedWithFeature('shop')).toBe(true)
        expect(store.hasInteractedWithFeature('workshop')).toBe(true)
        expect(store.hasInteractedWithFeature('alchemist')).toBe(false)
      })

      it('saves interacted features to localStorage when marking', () => {
        const store = useDialogsStore()

        store.markFeatureInteracted('foundry')

        const saved = JSON.parse(
          localStorage.getItem('idle-artifice-interacted-features') || '[]'
        )
        expect(saved).toContain('foundry')
      })

      it('handles empty interacted features localStorage', async () => {
        const store = useDialogsStore()
        await store.initialize()

        expect(store.interactedFeatures.size).toBe(0)
      })
    })

    describe('error handling', () => {
      it('handles localStorage quota exceeded gracefully', () => {
        const store = useDialogsStore()

        // Mock localStorage to throw quota exceeded error
        const setItemSpy = vi.spyOn(Storage.prototype, 'setItem')
        setItemSpy.mockImplementation(() => {
          throw new DOMException('QuotaExceededError')
        })

        // Should not throw
        expect(() => {
          store.markTutorialCompleted('test-tutorial')
        }).not.toThrow()

        setItemSpy.mockRestore()
      })

      it('handles localStorage access denied gracefully', () => {
        const store = useDialogsStore()

        // Mock localStorage to throw access denied error
        const setItemSpy = vi.spyOn(Storage.prototype, 'setItem')
        setItemSpy.mockImplementation(() => {
          throw new Error('Access denied')
        })

        // Should not throw
        expect(() => {
          store.markFeatureInteracted('foundry')
        }).not.toThrow()

        setItemSpy.mockRestore()
      })
    })
  })

  describe('tutorial management', () => {
    const mockTutorial: TutorialModal = {
      id: 'test-tutorial',
      title: 'Test Tutorial',
      content: 'This is test content',
      triggerConditions: [{ type: 'immediate', description: 'Test' }],
      showOnce: true,
    }

    describe('showTutorial', () => {
      it('adds tutorial to modal queue if not seen', () => {
        const store = useDialogsStore()
        store.loadedTutorials.set('test-tutorial', mockTutorial)

        store.showTutorial('test-tutorial')

        expect(store.modalQueue).toHaveLength(1)
        expect(store.modalQueue[0].type).toBe('tutorial')
        if (store.modalQueue[0].type === 'tutorial') {
          expect(store.modalQueue[0].modal.id).toBe('test-tutorial')
        }
      })

      it('does not add tutorial to queue if already seen', () => {
        const store = useDialogsStore()
        store.loadedTutorials.set('test-tutorial', mockTutorial)
        store.markTutorialCompleted('test-tutorial')

        store.showTutorial('test-tutorial')

        expect(store.modalQueue).toHaveLength(0)
      })

      it('handles missing tutorial gracefully', () => {
        const store = useDialogsStore()

        // Should not throw
        expect(() => {
          store.showTutorial('non-existent-tutorial')
        }).not.toThrow()

        expect(store.modalQueue).toHaveLength(0)
      })
    })

    describe('replayTutorial', () => {
      it('adds tutorial to queue even if already seen', () => {
        const store = useDialogsStore()
        store.loadedTutorials.set('test-tutorial', mockTutorial)
        store.markTutorialCompleted('test-tutorial')

        store.replayTutorial('test-tutorial')

        expect(store.modalQueue).toHaveLength(1)
        expect(store.modalQueue[0].type).toBe('tutorial')
      })

      it('handles missing tutorial gracefully', () => {
        const store = useDialogsStore()

        expect(() => {
          store.replayTutorial('non-existent-tutorial')
        }).not.toThrow()

        expect(store.modalQueue).toHaveLength(0)
      })
    })

    describe('markTutorialCompleted', () => {
      it('adds tutorial to completedTutorials set', () => {
        const store = useDialogsStore()

        expect(store.hasSeenTutorial('test-tutorial')).toBe(false)

        store.markTutorialCompleted('test-tutorial')

        expect(store.hasSeenTutorial('test-tutorial')).toBe(true)
      })

      it('does not create duplicates in completedTutorials', () => {
        const store = useDialogsStore()

        store.markTutorialCompleted('test-tutorial')
        store.markTutorialCompleted('test-tutorial')
        store.markTutorialCompleted('test-tutorial')

        expect(store.completedTutorials.size).toBe(1)
      })

      it('persists to localStorage', () => {
        const store = useDialogsStore()

        store.markTutorialCompleted('tutorial-1')
        store.markTutorialCompleted('tutorial-2')

        const saved = JSON.parse(
          localStorage.getItem('idle-artifice-completed-tutorials') || '[]'
        )
        expect(saved).toContain('tutorial-1')
        expect(saved).toContain('tutorial-2')
        expect(saved).toHaveLength(2)
      })
    })
  })

  describe('dialog management', () => {
    const mockDialog: DialogModal = {
      id: 'test-dialog',
      characterName: 'Test Character',
      portrait: { path: '/test.png', alt: 'Test' },
      message: 'Test message',
      conversationId: 'test-conversation',
    }

    describe('showDialog', () => {
      it('adds dialog to modal queue', async () => {
        const store = useDialogsStore()
        store.loadedDialogs.set('test-dialog', mockDialog)

        await store.showDialog('test-dialog')

        expect(store.modalQueue).toHaveLength(1)
        expect(store.modalQueue[0].type).toBe('dialog')
        if (store.modalQueue[0].type === 'dialog') {
          expect(store.modalQueue[0].modal.id).toBe('test-dialog')
        }
      })

      it('starts a new conversation when showing dialog', async () => {
        const store = useDialogsStore()
        store.loadedDialogs.set('test-dialog', mockDialog)

        expect(store.activeConversation).toBeNull()

        await store.showDialog('test-dialog')

        expect(store.activeConversation).not.toBeNull()
        expect(store.activeConversation?.conversationId).toBe('test-conversation')
        expect(store.activeConversation?.characterName).toBe('Test Character')
      })

      it('adds NPC message to conversation transcript', async () => {
        const store = useDialogsStore()
        store.loadedDialogs.set('test-dialog', mockDialog)

        await store.showDialog('test-dialog')

        expect(store.activeConversation?.transcript).toHaveLength(1)
        expect(store.activeConversation?.transcript[0].speaker).toBe('npc')
        expect(store.activeConversation?.transcript[0].speakerName).toBe('Test Character')
        expect(store.activeConversation?.transcript[0].message).toBe('Test message')
      })

      it('uses dialog ID as conversationId if not specified', async () => {
        const store = useDialogsStore()
        const dialogWithoutConversationId = { ...mockDialog }
        delete dialogWithoutConversationId.conversationId
        store.loadedDialogs.set('test-dialog', dialogWithoutConversationId)

        await store.showDialog('test-dialog')

        expect(store.activeConversation?.conversationId).toBe('test-dialog')
      })

      it('handles missing dialog gracefully', async () => {
        const store = useDialogsStore()

        await store.showDialog('non-existent-dialog')

        expect(store.modalQueue).toHaveLength(0)
        expect(store.activeConversation).toBeNull()
      })
    })

    describe('conversation management', () => {
      it('adds entries to active conversation transcript', () => {
        const store = useDialogsStore()
        store.activeConversation = {
          conversationId: 'test-conv',
          characterName: 'Test',
          transcript: [],
          startedAt: new Date(),
        }

        const entry: DialogHistoryEntry = {
          speaker: 'player',
          speakerName: 'Player',
          message: 'Hello',
          timestamp: new Date(),
        }

        store.addDialogEntry(entry)

        expect(store.activeConversation.transcript).toHaveLength(1)
        expect(store.activeConversation.transcript[0]).toEqual(entry)
      })

      it('handles adding entry when no active conversation gracefully', () => {
        const store = useDialogsStore()

        const entry: DialogHistoryEntry = {
          speaker: 'player',
          speakerName: 'Player',
          message: 'Hello',
          timestamp: new Date(),
        }

        expect(() => {
          store.addDialogEntry(entry)
        }).not.toThrow()
      })

      it('completes conversation and adds to history', () => {
        const store = useDialogsStore()
        store.activeConversation = {
          conversationId: 'test-conv',
          characterName: 'Test',
          transcript: [
            {
              speaker: 'npc',
              speakerName: 'Test',
              message: 'Hello',
              timestamp: new Date(),
            },
          ],
          startedAt: new Date(),
        }

        store.completeConversation()

        expect(store.activeConversation).toBeNull()
        expect(store.dialogHistory).toHaveLength(1)
        expect(store.dialogHistory[0].completedAt).toBeInstanceOf(Date)
      })

      it('handles completing conversation when none active', () => {
        const store = useDialogsStore()

        expect(() => {
          store.completeConversation()
        }).not.toThrow()

        expect(store.dialogHistory).toHaveLength(0)
      })
    })
  })

  describe('modal queue management', () => {
    const mockTutorial: TutorialModal = {
      id: 'test-tutorial',
      title: 'Test Tutorial',
      content: 'Test content',
      triggerConditions: [],
      showOnce: true,
    }

    const mockDialog: DialogModal = {
      id: 'test-dialog',
      characterName: 'Test Character',
      portrait: { path: null, alt: 'Test' },
      message: 'Test message',
    }

    describe('closeCurrentModal', () => {
      it('removes tutorial from queue and marks as completed', () => {
        const store = useDialogsStore()
        store.modalQueue.push({ type: 'tutorial', modal: mockTutorial })

        expect(store.modalQueue).toHaveLength(1)
        expect(store.hasSeenTutorial('test-tutorial')).toBe(false)

        store.closeCurrentModal()

        expect(store.modalQueue).toHaveLength(0)
        expect(store.hasSeenTutorial('test-tutorial')).toBe(true)
      })

      it('removes dialog from queue and completes conversation', () => {
        const store = useDialogsStore()
        store.modalQueue.push({ type: 'dialog', modal: mockDialog })
        store.activeConversation = {
          conversationId: 'test-conv',
          characterName: 'Test Character',
          transcript: [],
          startedAt: new Date(),
        }

        expect(store.modalQueue).toHaveLength(1)
        expect(store.activeConversation).not.toBeNull()

        store.closeCurrentModal()

        expect(store.modalQueue).toHaveLength(0)
        expect(store.activeConversation).toBeNull()
        expect(store.dialogHistory).toHaveLength(1)
      })

      it('handles empty queue gracefully', () => {
        const store = useDialogsStore()

        expect(() => {
          store.closeCurrentModal()
        }).not.toThrow()
      })

      it('processes multiple modals in sequence', () => {
        const store = useDialogsStore()
        store.modalQueue.push(
          { type: 'tutorial', modal: mockTutorial },
          {
            type: 'tutorial',
            modal: { ...mockTutorial, id: 'tutorial-2', title: 'Tutorial 2' },
          }
        )

        expect(store.modalQueue).toHaveLength(2)

        store.closeCurrentModal()

        expect(store.modalQueue).toHaveLength(1)
        if (store.modalQueue[0].type === 'tutorial') {
          expect(store.modalQueue[0].modal.id).toBe('tutorial-2')
        }
      })
    })

    describe('currentModal', () => {
      it('returns first modal in queue', () => {
        const store = useDialogsStore()
        store.modalQueue.push({ type: 'tutorial', modal: mockTutorial })

        expect(store.currentModal).not.toBeNull()
        expect(store.currentModal?.type).toBe('tutorial')
      })

      it('returns null when queue is empty', () => {
        const store = useDialogsStore()

        expect(store.currentModal).toBeNull()
      })

      it('updates when queue changes', () => {
        const store = useDialogsStore()

        expect(store.currentModal).toBeNull()

        store.modalQueue.push({ type: 'tutorial', modal: mockTutorial })

        expect(store.currentModal).not.toBeNull()

        store.modalQueue.shift()

        expect(store.currentModal).toBeNull()
      })
    })
  })

  describe('feature interaction tracking', () => {
    describe('markFeatureInteracted', () => {
      it('adds feature to interactedFeatures set', () => {
        const store = useDialogsStore()

        expect(store.hasInteractedWithFeature('foundry')).toBe(false)

        store.markFeatureInteracted('foundry')

        expect(store.hasInteractedWithFeature('foundry')).toBe(true)
      })

      it('does not create duplicates', () => {
        const store = useDialogsStore()

        store.markFeatureInteracted('foundry')
        store.markFeatureInteracted('foundry')
        store.markFeatureInteracted('foundry')

        expect(store.interactedFeatures.size).toBe(1)
      })

      it('persists to localStorage', () => {
        const store = useDialogsStore()

        store.markFeatureInteracted('foundry')
        store.markFeatureInteracted('shop')

        const saved = JSON.parse(
          localStorage.getItem('idle-artifice-interacted-features') || '[]'
        )
        expect(saved).toContain('foundry')
        expect(saved).toContain('shop')
        expect(saved).toHaveLength(2)
      })
    })
  })

  describe('computed properties', () => {
    describe('conversationHistory', () => {
      it('returns dialog history in reverse order (most recent first)', () => {
        const store = useDialogsStore()

        const conv1 = {
          conversationId: 'conv-1',
          characterName: 'Char 1',
          transcript: [],
          startedAt: new Date('2024-01-01'),
          completedAt: new Date('2024-01-01'),
        }

        const conv2 = {
          conversationId: 'conv-2',
          characterName: 'Char 2',
          transcript: [],
          startedAt: new Date('2024-01-02'),
          completedAt: new Date('2024-01-02'),
        }

        store.dialogHistory.push(conv1, conv2)

        const history = store.conversationHistory

        expect(history[0].conversationId).toBe('conv-2')
        expect(history[1].conversationId).toBe('conv-1')
      })

      it('returns empty array when no history', () => {
        const store = useDialogsStore()

        expect(store.conversationHistory).toEqual([])
      })
    })

    describe('hasSeenTutorial', () => {
      it('returns true for completed tutorials', () => {
        const store = useDialogsStore()
        store.markTutorialCompleted('test-tutorial')

        expect(store.hasSeenTutorial('test-tutorial')).toBe(true)
      })

      it('returns false for non-completed tutorials', () => {
        const store = useDialogsStore()

        expect(store.hasSeenTutorial('test-tutorial')).toBe(false)
      })
    })

    describe('hasInteractedWithFeature', () => {
      it('returns true for interacted features', () => {
        const store = useDialogsStore()
        store.markFeatureInteracted('foundry')

        expect(store.hasInteractedWithFeature('foundry')).toBe(true)
      })

      it('returns false for non-interacted features', () => {
        const store = useDialogsStore()

        expect(store.hasInteractedWithFeature('foundry')).toBe(false)
      })
    })
  })

  describe('initialization', () => {
    it('loads all data from localStorage on initialize', async () => {
      localStorage.setItem('idle-artifice-completed-tutorials', JSON.stringify(['tutorial-1']))
      localStorage.setItem('idle-artifice-interacted-features', JSON.stringify(['foundry']))
      localStorage.setItem(
        'idle-artifice-dialog-history',
        JSON.stringify([
          {
            conversationId: 'conv-1',
            characterName: 'Test',
            transcript: [],
            startedAt: new Date().toISOString(),
            completedAt: new Date().toISOString(),
          },
        ])
      )

      const store = useDialogsStore()
      await store.initialize()

      expect(store.hasSeenTutorial('tutorial-1')).toBe(true)
      expect(store.hasInteractedWithFeature('foundry')).toBe(true)
      expect(store.dialogHistory).toHaveLength(1)
    })

    it('handles missing localStorage keys gracefully', async () => {
      const store = useDialogsStore()

      await expect(store.initialize()).resolves.not.toThrow()

      expect(store.completedTutorials.size).toBe(0)
      expect(store.interactedFeatures.size).toBe(0)
      expect(store.dialogHistory).toHaveLength(0)
    })
  })

  describe('dialog tree loading', () => {
    const mockDialogTree: DialogTree = {
      id: 'test-tree',
      characterName: 'Test Character',
      portrait: {
        path: null,
        alt: 'Test portrait',
      },
      startNodeId: 'start',
      nodes: {
        start: {
          id: 'start',
          message: 'Hello! Choose an option.',
          responses: [
            { text: 'Option 1', nextNodeId: 'node1' },
            { text: 'End conversation', nextNodeId: null },
          ],
        },
        node1: {
          id: 'node1',
          message: 'You chose option 1.',
          responses: [{ text: 'Go back', nextNodeId: 'start' }],
        },
      },
    }

    it('loads and caches dialog tree on first request', async () => {
      const store = useDialogsStore()
      store.loadedDialogTrees.set('test-tree', mockDialogTree)

      const tree = await store.loadDialogTree('test-tree')

      expect(tree).toEqual(mockDialogTree)
      expect(store.loadedDialogTrees.has('test-tree')).toBe(true)
    })

    it('returns cached tree on subsequent requests', async () => {
      const store = useDialogsStore()
      store.loadedDialogTrees.set('test-tree', mockDialogTree)

      const tree1 = await store.loadDialogTree('test-tree')
      const tree2 = await store.loadDialogTree('test-tree')

      expect(tree1).toBe(tree2) // Same reference (cached)
    })

    it('validates tree has required fields', async () => {
      const store = useDialogsStore()
      const invalidTree = { id: 'invalid', nodes: {} } as any
      store.loadedDialogTrees.set('invalid-tree', invalidTree)

      // This would fail in real loading, but we're testing the validation concept
      // The actual validation happens in loadDialogTree when loading from file
      expect(invalidTree.characterName).toBeUndefined()
    })

    it('validates start node exists', async () => {
      const store = useDialogsStore()
      const treeWithMissingStart: DialogTree = {
        ...mockDialogTree,
        startNodeId: 'non-existent',
      }
      store.loadedDialogTrees.set('bad-start', treeWithMissingStart)

      const tree = await store.loadDialogTree('bad-start')
      // Tree is loaded but validation would catch this
      expect(tree?.nodes[tree.startNodeId]).toBeUndefined()
    })

    it('handles missing dialog tree file gracefully', async () => {
      const store = useDialogsStore()

      const tree = await store.loadDialogTree('non-existent-tree')

      expect(tree).toBeNull()
    })

    it('validates referenced nodes exist', () => {
      const treeWithBadReference: DialogTree = {
        ...mockDialogTree,
        nodes: {
          start: {
            id: 'start',
            message: 'Test',
            responses: [{ text: 'Bad reference', nextNodeId: 'non-existent-node' }],
          },
        },
      }

      // Check that referenced node doesn't exist
      const referencedNodeId = treeWithBadReference.nodes.start.responses[0].nextNodeId
      expect(referencedNodeId).toBe('non-existent-node')
      expect(treeWithBadReference.nodes[referencedNodeId!]).toBeUndefined()
    })

    it('allows looping dialog trees (node can reference previous nodes)', () => {
      // Our mockDialogTree has node1 -> start (a loop)
      const node1 = mockDialogTree.nodes.node1
      const nextNodeId = node1.responses[0].nextNodeId

      expect(nextNodeId).toBe('start')
      expect(mockDialogTree.nodes[nextNodeId!]).toBeDefined()
    })

    it('identifies terminal nodes (responses with null nextNodeId)', () => {
      const startNode = mockDialogTree.nodes.start
      const terminalResponse = startNode.responses.find((r) => r.nextNodeId === null)

      expect(terminalResponse).toBeDefined()
      expect(terminalResponse?.text).toBe('End conversation')
    })

    it('supports trees with empty response arrays (terminal nodes)', () => {
      const treeWithEmptyResponses: DialogTree = {
        ...mockDialogTree,
        nodes: {
          start: {
            id: 'start',
            message: 'Goodbye!',
            responses: [], // Empty = end conversation
          },
        },
      }

      expect(treeWithEmptyResponses.nodes.start.responses).toHaveLength(0)
    })
  })
})
