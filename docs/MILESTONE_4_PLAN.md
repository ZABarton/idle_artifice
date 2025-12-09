# Milestone 4: Eventing and Dialog Screens - Implementation Plan

## Overview
This milestone introduces a comprehensive dialog and tutorial system to guide players through the game and provide narrative depth through NPC conversations. The system includes modals for tutorials (simple one-way messages) and character dialogs (conversations with NPCs), a modal queue manager, completion tracking, and a help menu for replaying past content.

## Key Features

### 1. Dialog System Types
**File**: `src/types/dialogs.ts` ✅ **COMPLETED**

**Type Definitions**:
- `TutorialModal`: Simple one-way tutorial messages with trigger conditions
- `DialogModal`: NPC character conversations (linear for now, extensible for future branching)
- `TutorialTriggerCondition`: Defines when tutorials should appear
- `TutorialTriggerType`: Types of triggers ('immediate', 'location', 'feature', 'objective', 'resource', 'custom')
- `CharacterPortrait`: Portrait information with placeholder support
- `ModalQueueItem`: Union type for queue items (tutorial or dialog)
- `TutorialCompletionRecord`: Tracks completed tutorials for localStorage
- `DialogHistoryEntry`: Single message in a conversation transcript
- `DialogHistoryRecord`: Complete conversation record for history/replay

**Design Philosophy**:
- Tutorials are simple one-way messages with a dismiss button
- Dialogs are currently linear (single message + Continue) but designed to support future branching dialog trees
- History stores conversation transcripts as speaker/message pairs for replay
- All content is pre-defined in JSON files (not dynamically generated)

### 2. Dialogs Store
**File**: `src/stores/dialogs.ts`

**Responsibilities**:
- Manage modal queue (FIFO for multiple modals)
- Track completed tutorial IDs (with localStorage persistence)
- Track dialog history for replay/transcript viewing
- Load tutorial content at initialization
- Lazy-load dialog content on-demand

**State**:
```typescript
{
  modalQueue: ModalQueueItem[]          // FIFO queue of modals to display
  completedTutorials: Set<string>       // IDs of completed tutorials
  dialogHistory: DialogHistoryRecord[]  // Complete conversation transcripts
  loadedTutorials: Map<string, TutorialModal>  // All tutorials loaded at init
  activeConversation: DialogHistoryRecord | null  // Current dialog in progress
}
```

**Actions**:
- `showTutorial(tutorialId: string)`: Add tutorial to queue (checks if already seen)
- `showDialog(dialogId: string)`: Lazy-load and add dialog to queue
- `closeCurrentModal()`: Remove current modal from queue, handle completion
- `markTutorialCompleted(tutorialId: string)`: Track completion, save to localStorage
- `addDialogEntry(entry: DialogHistoryEntry)`: Add message to current conversation transcript
- `completeConversation()`: Finalize current conversation and add to history
- `loadTutorials()`: Load all tutorials from content directory at initialization

**Getters**:
- `currentModal`: First item in queue (currently displayed modal)
- `hasSeenTutorial(tutorialId: string)`: Check if tutorial was completed
- `conversationHistory`: Array of past dialog transcripts

**Persistence**:
- Completed tutorial IDs saved to localStorage
- Dialog history saved to localStorage (for transcript replay)
- Modal queue is session-only (cleared on page reload)

### 3. TutorialModal Component
**File**: `src/components/TutorialModal.vue`

**Layout**:
- Single-panel modal
- Top-right positioning (similar to notifications, but modal with backdrop)
- Backdrop overlay to prevent accidental clicks outside modal

**Structure**:
```
┌─────────────────────────┐
│ Tutorial Title          │
├─────────────────────────┤
│                         │
│ Content text with       │
│ markdown support        │
│                         │
├─────────────────────────┤
│              [Got it]   │
└─────────────────────────┘
```

**Features**:
- Title displayed prominently at top
- Content supports markdown/HTML formatting
- Explicit "Got it" or "Close" button (no click-outside-to-dismiss)
- Semi-transparent dark backdrop
- Smooth fade-in/out transitions
- Auto-marks tutorial as completed when closed

**Props**:
```typescript
{
  tutorial: TutorialModal
}
```

**Emits**:
- `close`: When user clicks "Got it" button

### 4. DialogModal Component
**File**: `src/components/DialogModal.vue`

**Layout**:
- Two-column modal
- Top-center positioning with backdrop
- Wider than TutorialModal to accommodate portrait + text

**Structure**:
```
┌──────────┬────────────────────────┐
│          │  Character Name        │
│ Portrait │────────────────────────│
│  Image   │                        │
│          │  Dialog message text   │
│  (30%)   │  with markdown support │
│          │                        │
│          │  (70%)                 │
├──────────┴────────────────────────┤
│                     [Continue]    │
└───────────────────────────────────┘
```

**Features**:
- Left column: Character portrait (~30% width)
  - Placeholder image support (null portrait path uses default)
  - Alt text for accessibility
- Right column: Dialog content (~70% width)
  - Character name displayed at top
  - Message content supports markdown/HTML
- Explicit "Continue" or "Close" button
- Semi-transparent dark backdrop
- Smooth transitions
- Records message to conversation history when closed

**Props**:
```typescript
{
  dialog: DialogModal
}
```

**Emits**:
- `close`: When user clicks "Continue" button

### 5. DialogContainer Component
**File**: `src/components/DialogContainer.vue`

**Responsibilities**:
- Renders current modal from dialogs store queue
- Handles z-index stacking and positioning
- Manages modal transitions (fade in/out)
- Integrates backdrop/overlay

**Behavior**:
- Watches `dialogsStore.currentModal` getter
- Conditionally renders TutorialModal or DialogModal based on modal type
- Handles backdrop click prevention (modals require explicit button click)
- Smooth transitions when modals enter/exit queue
- High z-index to appear above all other UI elements

**Integration**:
- Added to `src/views/MainView.vue` at root level
- Always rendered (even when no modal active)
- Automatically shows/hides based on queue state

### 6. Tutorial Content Structure
**Directory**: `src/content/tutorials/`

**JSON Schema**:
```json
{
  "id": "unique-tutorial-id",
  "title": "Tutorial Title",
  "content": "Tutorial content with **markdown** support",
  "triggerConditions": [
    {
      "type": "feature",
      "id": "foundry",
      "description": "First time opening Foundry"
    }
  ],
  "showOnce": true
}
```

**Loader Utility**:
- Function: `loadTutorials()` in dialogs store
- Uses Vite's `import.meta.glob()` to import all tutorial JSON files
- Loads all tutorials at app initialization
- Validates tutorial schema
- Stores in dialogs store's `loadedTutorials` map

**Sample Tutorials** (for testing):
1. **Welcome Tutorial**: Triggered on first app load
2. **Foundry Tutorial**: Triggered on first Foundry interaction
3. **World Map Tutorial**: Triggered on first hex exploration

### 7. Dialog Content Structure
**Directory**: `src/content/dialogs/`

**JSON Schema**:
```json
{
  "id": "unique-dialog-id",
  "characterName": "Character Name",
  "portrait": {
    "path": "/assets/portraits/character-name.png",
    "alt": "Character Name portrait"
  },
  "message": "Dialog message with **markdown** support",
  "conversationId": "conversation-thread-id"
}
```

**Lazy-Load Utility**:
- Function: `loadDialog(dialogId: string)` in dialogs store
- Loads dialog JSON file on-demand when `showDialog()` is called
- Caches loaded dialogs to avoid re-fetching
- Supports placeholder portrait paths (null = use default placeholder)
- Validates dialog schema

**Sample Dialogs** (for testing):
1. **Academy Headmaster Welcome**: Introduction when first visiting Academy
2. **Foundry Master Tips**: Crafting advice when using Foundry
3. **Mysterious Stranger**: Event-triggered dialog for testing

### 8. Tutorial Trigger System
**Composable**: `src/composables/useTutorials.ts`

**Purpose**: Helper composable to trigger tutorials from anywhere in the app

**Functions**:
```typescript
{
  triggerTutorial(tutorialId: string): void
  checkAndTriggerTutorial(tutorialId: string): void  // Checks if already seen
}
```

**Integration Points**:
- **Objectives Store**: Add hooks on objective completion
  - Example: `onObjectiveComplete()` checks for tutorial triggers
- **Feature Components**: Add hooks on first interaction
  - Example: `onFeatureFirstInteract()` triggers feature-specific tutorial
- **Navigation Store**: Add hooks on first location visit
  - Example: `onHexFirstVisit()` triggers location tutorial

**Behavior**:
- Always checks `hasSeenTutorial()` before triggering
- Auto-marks tutorial as completed when modal is closed
- Supports immediate triggers and conditional triggers
- Queues tutorial if another modal is active

**Example Usage**:
```typescript
// In a Feature component
const { triggerTutorial } = useTutorials()

function onFirstOpen() {
  triggerTutorial('foundry-tutorial')
}
```

### 9. Dialog Trigger System
**Composable**: `src/composables/useDialogs.ts`

**Purpose**: Helper composable to trigger dialogs from anywhere in the app

**Functions**:
```typescript
{
  triggerDialog(dialogId: string): void
  addDialogMessage(speaker: 'npc' | 'player', message: string): void
  endConversation(): void
}
```

**Integration Points**:
- **Features**: Dialog triggers from feature interactions
- **Objectives**: Dialog triggers on objective milestones
- **Events**: Custom event-based dialog triggers

**Behavior**:
- Supports queueing multiple dialogs (FIFO)
- Handles dialog ID-based lazy loading automatically
- Adds each dialog to conversation history when shown
- Tracks current conversation with transcript
- Creates `DialogHistoryRecord` when conversation completes

**Example Usage**:
```typescript
// In a Feature component
const { triggerDialog, addDialogMessage } = useDialogs()

function onFeatureActivate() {
  triggerDialog('headmaster-welcome')
  // When dialog shows, it's automatically added to history
}
```

### 10. Help Menu UI
**Component**: `src/components/HelpMenu.vue`

**Location**: Accessed via button in StatusColumn (System Links section)

**Layout**:
- Modal/panel overlay (similar to Objectives View)
- Tabbed interface with two tabs:
  1. **Tutorials Tab**: List of completed tutorials
  2. **Conversations Tab**: Dialog history with conversation threads

**Tutorials Tab**:
- Lists all completed tutorials (from `completedTutorials` store state)
- Shows tutorial title and completion date
- Clickable to replay tutorial
- Replays show original tutorial content in TutorialModal
- Replayed tutorials don't re-trigger completion

**Conversations Tab**:
- Lists all completed conversations (from `dialogHistory` store state)
- Shows character name, date, and conversation preview
- Clickable to view full conversation transcript
- Transcript view shows full speaker/message history:
  ```
  Headmaster: "Welcome to the Academy!"
  You: "Thank you, I'm excited to be here."
  Headmaster: "Let me show you around..."
  ```
- Read-only view (no interaction, just replay)

**Features**:
- Close button to return to game
- Search/filter capability (optional for this milestone)
- Empty states for tabs with no content
- Responsive layout for mobile

### 11. Testing
**Store Tests**: `src/stores/dialogs.test.ts`
- Modal queue management (add, remove, FIFO behavior)
- Tutorial completion tracking
- Dialog history recording
- LocalStorage persistence
- Getters (`currentModal`, `hasSeenTutorial`, etc.)

**Component Tests**:
- `TutorialModal.test.ts`: Rendering, button clicks, markdown support, emit events
- `DialogModal.test.ts`: Two-column layout, portrait rendering, markdown support, emit events
- `DialogContainer.test.ts`: Modal switching, queue transitions, backdrop rendering
- `HelpMenu.test.ts`: Tab switching, tutorial/dialog lists, replay functionality

**Integration Tests**:
- Tutorial trigger flow (trigger → queue → display → complete)
- Dialog trigger flow with history recording
- Queue behavior with multiple modals
- Help menu replay functionality

### 12. Documentation
**File**: `docs/DIALOG_SYSTEM.md`

**Content**:
- System overview and architecture
- Tutorial JSON file schema and examples
- Dialog JSON file schema and examples
- How to trigger tutorials programmatically
- How to trigger dialogs programmatically
- How to add new trigger conditions
- Help menu usage
- Best practices for content creation

**Inline Documentation**:
- JSDoc comments on all store actions and getters
- Component prop/emit documentation
- Composable function documentation

**Sample Content**:
- Populate 3-5 sample tutorials for common game scenarios
- Populate 3-5 sample dialogs for testing NPC interactions

## Implementation Order

### Phase 1: Core Infrastructure ✅
1. ✅ Create dialog system types (`src/types/dialogs.ts`) - Issue 4.1
2. Create dialogs store with queue and tracking - Issue 4.2

### Phase 2: Modal Components
3. Create TutorialModal component - Issue 4.3
4. Create DialogModal component - Issue 4.4
5. Create DialogContainer component and integrate into MainView - Issue 4.5

### Phase 3: Content Structure
6. Set up tutorial content directory and loader - Issue 4.6
7. Set up dialog content directory and lazy-load utility - Issue 4.7
8. Create sample tutorial and dialog JSON files

### Phase 4: Trigger Systems
9. Create `useTutorials` composable - Issue 4.8
10. Create `useDialogs` composable - Issue 4.9
11. Add trigger hooks to objectives store
12. Add trigger hooks to feature components
13. Add trigger hooks to navigation store

### Phase 5: Help Menu
14. Create HelpMenu component with tabs - Issue 4.10
15. Add Help button to StatusColumn
16. Wire up replay functionality

### Phase 6: Testing & Documentation
17. Write store tests - Issue 4.11
18. Write component tests - Issue 4.11
19. Write integration tests - Issue 4.11
20. Create DIALOG_SYSTEM.md documentation - Issue 4.12
21. Add inline code comments - Issue 4.12
22. Create comprehensive sample content - Issue 4.12

### Phase 7: Integration & Polish
23. Manual testing of tutorial flow
24. Manual testing of dialog flow
25. Manual testing of help menu replay
26. Responsive behavior testing
27. LocalStorage persistence testing

## Technical Considerations

### LocalStorage Persistence
- Store completed tutorial IDs as JSON array
- Store dialog history as JSON array (with size limits)
- Load from localStorage on app initialization
- Consider migration strategy for schema changes

### Queue Management
- FIFO queue ensures predictable modal ordering
- Modal queue is session-only (not persisted)
- Support for immediate display vs. queued display
- Graceful handling of empty queue state

### Content Loading
- Tutorials: Load all at initialization (small payload, needed for trigger conditions)
- Dialogs: Lazy-load on demand (larger payload, infrequent access)
- Cache loaded dialogs to avoid re-fetching
- Validate JSON schema on load with helpful error messages

### Markdown Support
- Use markdown parser library (e.g., `marked` or `markdown-it`)
- Sanitize HTML output to prevent XSS
- Support common markdown features (bold, italic, lists, links)
- Test with sample content containing markdown

### Modal Accessibility
- Proper ARIA labels and roles
- Keyboard navigation support (Enter to confirm, Esc to close)
- Focus management (trap focus within modal)
- Screen reader announcements for modal open/close

### Performance
- Limit dialog history size (e.g., last 50 conversations)
- Efficient queue management (use array shift/push)
- Lazy-load dialogs only when needed
- Debounce rapid trigger calls

### Responsive Design
- Modals should be mobile-friendly (smaller screens)
- Adjust two-column DialogModal layout on mobile (stack vertically?)
- Touch-friendly button sizes
- Proper viewport sizing

### Integration with Existing Systems
- Hook into objectives store for objective-based triggers
- Hook into navigation store for location-based triggers
- Hook into feature components for feature-based triggers
- Ensure StatusColumn has space for Help button

## Out of Scope (Future Milestones)
- Branching dialog trees with player choices (foundation laid, implementation later)
- Dialog response options with conditional availability
- Voice acting or sound effects
- Animated character portraits
- Dialog skip/fast-forward functionality
- Multi-step tutorial sequences (wizard-style)
- Tutorial progression tracking (analytics)
- Dialog relationship/affinity systems
- Custom trigger condition implementations beyond the basic types
- Tutorial/dialog translation/localization support

## Success Criteria
- [ ] Dialog system types defined and documented
- [ ] Dialogs store manages queue, completion tracking, and history
- [ ] TutorialModal displays with title, content, and dismiss button
- [ ] DialogModal displays with portrait, character name, and message
- [ ] DialogContainer renders current modal from queue
- [ ] Tutorial content loads at app initialization
- [ ] Dialog content lazy-loads on demand
- [ ] Tutorial triggers work from objectives, features, and navigation
- [ ] Dialog triggers work from features and events
- [ ] Help menu shows completed tutorials and dialog history
- [ ] Help menu replay works for tutorials and conversations
- [ ] Completed tutorials persist to localStorage
- [ ] Dialog history persists to localStorage
- [ ] Modals stack properly with correct z-index
- [ ] Backdrop prevents accidental dismissal
- [ ] Markdown content renders correctly in modals
- [ ] All components have proper TypeScript types
- [ ] Store and components have test coverage
- [ ] Documentation explains how to use the system
- [ ] Sample tutorials and dialogs demonstrate functionality
- [ ] Responsive behavior works on mobile/tablet
- [ ] Keyboard navigation works for accessibility
