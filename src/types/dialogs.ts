/**
 * Dialog system types for managing tutorials and character conversations
 */

/**
 * Type of trigger condition for tutorial modals
 * - 'immediate': Show when explicitly triggered by code
 * - 'location': Triggered when visiting a specific location/hex
 * - 'feature': Triggered when interacting with a feature
 * - 'objective': Triggered when an objective changes status
 * - 'resource': Triggered when a resource threshold is met
 * - 'custom': Custom condition evaluated by game logic
 */
export type TutorialTriggerType =
  | 'immediate'
  | 'location'
  | 'feature'
  | 'objective'
  | 'resource'
  | 'custom'

/**
 * Defines a condition that triggers a tutorial modal
 */
export interface TutorialTriggerCondition {
  /** Type of trigger condition */
  type: TutorialTriggerType
  /** ID of the location/feature/objective/resource to check (not used for 'immediate') */
  id?: string
  /** Optional numeric value (e.g., resource amount threshold) */
  value?: number
  /** Human-readable description of this trigger condition */
  description: string
}

/**
 * Represents a tutorial modal to guide the player
 * Simple one-way message with a dismiss button
 */
export interface TutorialModal {
  /** Unique identifier for this tutorial */
  id: string
  /** Display title shown at the top of the modal */
  title: string
  /** Tutorial content (supports markdown formatting) */
  content: string
  /** Conditions that trigger this tutorial to display */
  triggerConditions: TutorialTriggerCondition[]
  /** Whether this tutorial should only be shown once */
  showOnce: boolean
}

/**
 * Character portrait information for dialog modals
 */
export interface CharacterPortrait {
  /** Path to portrait image (null = use placeholder/default) */
  path: string | null
  /** Alt text for accessibility */
  alt: string
}

/**
 * Represents a dialog modal with an NPC character
 * Currently supports simple linear dialogs (future: branching dialog trees)
 */
export interface DialogModal {
  /** Unique identifier for this dialog */
  id: string
  /** Name of the character speaking */
  characterName: string
  /** Character portrait information */
  portrait: CharacterPortrait
  /** Dialog message content (supports markdown formatting) */
  message: string
  /** Optional ID linking to a conversation/dialog tree (for future branching support) */
  conversationId?: string
}

/**
 * Type discriminator for different modal types
 */
export type ModalType = 'tutorial' | 'dialog'

/**
 * Union type for items in the modal queue
 * Allows queue to handle both tutorial and dialog modals
 */
export type ModalQueueItem =
  | { type: 'tutorial'; modal: TutorialModal }
  | { type: 'dialog'; modal: DialogModal }

/**
 * Record of a completed tutorial for localStorage persistence
 */
export interface TutorialCompletionRecord {
  /** ID of the completed tutorial */
  tutorialId: string
  /** Timestamp when tutorial was completed */
  completedAt: Date
}

/**
 * Single entry in a dialog conversation transcript
 * Represents one message from either NPC or player
 */
export interface DialogHistoryEntry {
  /** Speaker identifier ('npc' or 'player') */
  speaker: 'npc' | 'player'
  /** Name to display (e.g., character name or 'You') */
  speakerName: string
  /** The message content */
  message: string
  /** Timestamp of this message */
  timestamp: Date
}

/**
 * Complete record of a dialog conversation for history/transcript
 * Stores the path the player took through the conversation
 */
export interface DialogHistoryRecord {
  /** ID of the conversation (links to conversationId in DialogModal) */
  conversationId: string
  /** ID of the character involved */
  characterName: string
  /** Ordered array of conversation entries (transcript) */
  transcript: DialogHistoryEntry[]
  /** Timestamp when conversation started */
  startedAt: Date
  /** Timestamp when conversation ended */
  completedAt?: Date
}
