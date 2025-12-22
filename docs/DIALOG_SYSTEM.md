# Dialog System Documentation

## Overview

The Dialog System in Idle Artifice manages two types of modals that appear to the player:

1. **Tutorial Modals**: Simple one-way informational messages that explain game mechanics (e.g., "Welcome to the Foundry!")
2. **Dialog Modals**: Character conversations with portrait and dialogue text (e.g., NPC greetings and story moments)

Both modal types are managed through a unified **modal queue** system. When multiple modals are triggered, they display one at a time in the order they were added to the queue.

### Key Components

- **Dialogs Store** (`src/stores/dialogs.ts`): Central state management for modal queue, tutorial completion tracking, and dialog history
- **Tutorial Modal** (`src/components/TutorialModal.vue`): UI component for displaying tutorial modals
- **Dialog Modal** (`src/components/DialogModal.vue`): UI component for displaying character dialog modals
- **Dialog Container** (`src/components/DialogContainer.vue`): Wrapper component that renders the appropriate modal type
- **useTutorials** (`src/composables/useTutorials.ts`): Composable for triggering tutorials based on game conditions
- **useDialogs** (`src/composables/useDialogs.ts`): Composable for triggering character dialogs from features and events

### Modal Queue System

Modals are added to a queue and displayed one at a time. When a modal is closed:
- Tutorial modals are marked as "completed" and saved to localStorage
- Dialog modals are added to the conversation history
- The next modal in the queue is automatically displayed

## Tutorial JSON Files

Tutorial files are stored in `src/content/tutorials/` and automatically loaded when the game starts.

### File Format

```json
{
  "id": "unique-tutorial-id",
  "title": "Tutorial Title",
  "content": "Tutorial content. Supports **markdown** formatting and\nmultiline text.",
  "triggerConditions": [
    {
      "type": "immediate|location|feature|objective|resource|custom",
      "id": "optional-id-for-specific-trigger",
      "value": 123,
      "description": "Human-readable description of when this triggers"
    }
  ],
  "showOnce": true
}
```

### Field Descriptions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Unique identifier for this tutorial. Used for tracking completion. |
| `title` | string | Yes | Display title shown at the top of the modal. |
| `content` | string | Yes | Tutorial message content. Supports markdown and `\n` for line breaks. |
| `triggerConditions` | array | Yes | Array of conditions that must ALL be met for tutorial to trigger. |
| `showOnce` | boolean | Yes | If `true`, tutorial only shows once per player (tracked in localStorage). |

### Trigger Condition Types

#### 1. Immediate Trigger

Shows immediately when explicitly triggered by code (e.g., on game load).

```json
{
  "type": "immediate",
  "description": "First time opening the game"
}
```

**Example Usage:**
```typescript
// In App.vue or main component
import { useTutorials } from '@/composables/useTutorials'

const { triggerImmediateTutorials } = useTutorials()

onMounted(() => {
  triggerImmediateTutorials()
})
```

#### 2. Location Trigger

Shows when a specific hex on the world map is explored.

```json
{
  "type": "location",
  "id": "0,0",
  "description": "When player explores the starting hex"
}
```

**Location ID Format:** `"q,r"` (axial coordinates, e.g., `"0,0"`, `"1,-1"`)

**Example Usage:**
```typescript
import { useTutorials } from '@/composables/useTutorials'

const { triggerLocationTutorial } = useTutorials()

function exploreHex(q: number, r: number) {
  // Mark hex as explored...
  triggerLocationTutorial(q, r)
}
```

#### 3. Feature Trigger

Shows when a specific feature is first opened or interacted with.

```json
{
  "type": "feature",
  "id": "foundry",
  "description": "First time opening the Foundry"
}
```

**Example Usage:**
```typescript
import { useTutorials } from '@/composables/useTutorials'

const { triggerFeatureTutorial } = useTutorials()

function openFoundry() {
  // Navigate to foundry...
  triggerFeatureTutorial('foundry')
}
```

#### 4. Objective Trigger

Shows when a specific objective is completed.

```json
{
  "type": "objective",
  "id": "craft-first-item",
  "description": "When player crafts their first magical item"
}
```

**Example Usage:**
```typescript
import { useTutorials } from '@/composables/useTutorials'
import { useObjectivesStore } from '@/stores/objectives'

const { triggerObjectiveTutorial } = useTutorials()
const objectivesStore = useObjectivesStore()

function completeObjective(objectiveId: string) {
  objectivesStore.completeObjective(objectiveId)
  triggerObjectiveTutorial(objectiveId)
}
```

#### 5. Resource Trigger

Shows when a resource reaches a specific threshold.

```json
{
  "type": "resource",
  "id": "wood",
  "value": 10,
  "description": "When player collects 10 wood"
}
```

**Example Usage:**
```typescript
import { useTutorials } from '@/composables/useTutorials'
import { watch } from 'vue'

const { triggerTutorials } = useTutorials()
const resourcesStore = useResourcesStore()

// Watch for resource changes
watch(() => resourcesStore.resources.wood, () => {
  triggerTutorials('resource', 'wood')
})
```

#### 6. Custom Trigger

Shows based on custom game logic (requires custom evaluation context).

```json
{
  "type": "custom",
  "description": "When player has 3 explorers equipped with items"
}
```

**Example Usage:**
```typescript
import { useTutorials } from '@/composables/useTutorials'

const { triggerTutorials, isConditionMet } = useTutorials()

// Provide custom evaluation context
const context = {
  evaluateCustom: (condition) => {
    // Your custom logic here
    return explorersStore.equippedExplorers.length >= 3
  }
}

triggerTutorials('custom', undefined, context)
```

### Multiple Trigger Conditions

All conditions in the `triggerConditions` array must be met for the tutorial to trigger.

**Example:** Tutorial that triggers when player has explored a location AND collected wood:

```json
{
  "id": "forest-gathering",
  "title": "Forest Resources",
  "content": "You've found wood! This resource can be used in the Workshop to craft items.",
  "triggerConditions": [
    {
      "type": "location",
      "id": "1,-1",
      "description": "Player has explored the forest hex"
    },
    {
      "type": "resource",
      "id": "wood",
      "value": 1,
      "description": "Player has collected at least 1 wood"
    }
  ],
  "showOnce": true
}
```

### Complete Tutorial Examples

See `src/content/tutorials/` for working examples:
- `welcome.json` - Immediate trigger on game load
- `foundry-intro.json` - Feature trigger when opening Foundry
- `first-wood-collected.json` - Resource threshold trigger
- `forest-discovered.json` - Location exploration trigger

## Dialog JSON Files

Dialog files are stored in `src/content/dialogs/` and loaded on-demand when triggered.

### File Format

```json
{
  "id": "unique-dialog-id",
  "characterName": "Character Name",
  "portrait": {
    "path": "/path/to/portrait.png",
    "alt": "Character portrait description"
  },
  "message": "Dialog message from the character.\n\nSupports multiple paragraphs.",
  "conversationId": "optional-conversation-group-id"
}
```

### Field Descriptions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Unique identifier for this dialog. Used as filename and for triggering. |
| `characterName` | string | Yes | Name of the character speaking (displayed in dialog header). |
| `portrait` | object | Yes | Character portrait configuration. |
| `portrait.path` | string\|null | Yes | Path to portrait image. Use `null` for placeholder icon. |
| `portrait.alt` | string | Yes | Alt text for accessibility. |
| `message` | string | Yes | Dialog message content. Supports `\n` for line breaks. |
| `conversationId` | string | No | Optional ID linking related dialogs together for conversation history. |

### Complete Dialog Examples

**Simple NPC Introduction:**

```json
{
  "id": "headmaster-welcome",
  "characterName": "Headmaster",
  "portrait": {
    "path": null,
    "alt": "Headmaster portrait"
  },
  "message": "Greetings! I'm the Headmaster of this Academy. I'm glad you've arrived - we have much work to do.\n\nThe wilderness beyond our borders holds many secrets and dangers. Your expertise in creating magical items will be crucial to our success.",
  "conversationId": "headmaster-intro"
}
```

**NPC with Custom Portrait:**

```json
{
  "id": "shop-keeper-greeting",
  "characterName": "Merchant Lyra",
  "portrait": {
    "path": "/assets/portraits/shop-keeper.png",
    "alt": "Merchant Lyra smiling behind her counter"
  },
  "message": "Welcome to my shop! I buy items you've crafted and sell them to travelers.\n\nSet your profit margin wisely - higher margins mean more gold per sale, but sales happen less frequently!",
  "conversationId": "shop-keeper-intro"
}
```

See `src/content/dialogs/` for more working examples.

## Triggering Tutorials Programmatically

### Using the `useTutorials` Composable

```typescript
import { useTutorials } from '@/composables/useTutorials'

const {
  triggerImmediateTutorials,    // Trigger all 'immediate' tutorials
  triggerFeatureTutorial,        // Trigger for specific feature ID
  triggerLocationTutorial,       // Trigger for specific hex coordinates
  triggerObjectiveTutorial,      // Trigger for specific objective ID
  triggerTutorials,              // Generic trigger with type and optional ID
  isConditionMet,                // Check if single condition is met
  areAllConditionsMet            // Check if all conditions are met
} = useTutorials()
```

### Common Patterns

**On Game Load:**
```typescript
// In App.vue
import { onMounted } from 'vue'
import { useTutorials } from '@/composables/useTutorials'

const { triggerImmediateTutorials } = useTutorials()

onMounted(() => {
  triggerImmediateTutorials()
})
```

**When Opening a Feature:**
```typescript
// In AreaMap.vue or feature component
import { useTutorials } from '@/composables/useTutorials'

const { triggerFeatureTutorial } = useTutorials()

function navigateToFeature(featureId: string) {
  currentView.value = 'feature'
  currentFeature.value = featureId

  // Trigger any tutorials for this feature
  triggerFeatureTutorial(featureId)
}
```

**When Exploring a Hex:**
```typescript
// In WorldMap.vue
import { useTutorials } from '@/composables/useTutorials'

const { triggerLocationTutorial } = useTutorials()

function exploreHex(q: number, r: number) {
  worldMapStore.exploreHex(q, r)
  triggerLocationTutorial(q, r)
}
```

**When Resources Change:**
```typescript
// Using a watcher
import { watch } from 'vue'
import { useTutorials } from '@/composables/useTutorials'
import { useResourcesStore } from '@/stores/resources'

const { triggerTutorials } = useTutorials()
const resourcesStore = useResourcesStore()

watch(() => resourcesStore.resources.wood, (newAmount) => {
  // Will trigger any tutorials with resource condition type 'wood'
  triggerTutorials('resource', 'wood')
})
```

**Manual Trigger with Multiple Conditions:**
```typescript
import { useTutorials } from '@/composables/useTutorials'

const { triggerTutorials } = useTutorials()

// This will check ALL loaded tutorials and trigger any that:
// 1. Have trigger type 'feature' with id 'workshop'
// 2. Have all their trigger conditions met
// 3. Haven't been seen yet (if showOnce is true)
triggerTutorials('feature', 'workshop')
```

## Triggering Dialogs Programmatically

### Using the `useDialogs` Composable

```typescript
import { useDialogs } from '@/composables/useDialogs'

const {
  triggerDialog,              // Trigger single dialog by ID
  triggerDialogSequence,      // Trigger multiple dialogs in order
  triggerFeatureDialog,       // Trigger dialog when opening feature
  triggerObjectiveDialog,     // Trigger dialog on objective completion
  triggerEventDialog,         // Trigger dialog from game event
  isDialogActive,             // Check if any dialog is currently showing
  getCurrentDialogId          // Get ID of current dialog (or null)
} = useDialogs()
```

### Common Patterns

**Simple Dialog Trigger:**
```typescript
// Trigger a single dialog
import { useDialogs } from '@/composables/useDialogs'

const { triggerDialog } = useDialogs()

async function showWelcome() {
  await triggerDialog('headmaster-welcome')
}
```

**Dialog Sequence:**
```typescript
// Show multiple dialogs in order
import { useDialogs } from '@/composables/useDialogs'

const { triggerDialogSequence } = useDialogs()

async function startIntroSequence() {
  await triggerDialogSequence([
    'headmaster-welcome',
    'headmaster-tour',
    'headmaster-first-task'
  ])
}
```

**Feature-Based Dialog:**
```typescript
// Trigger dialog when opening a feature (marks feature as interacted)
import { useDialogs } from '@/composables/useDialogs'

const { triggerFeatureDialog } = useDialogs()

function openShop() {
  currentFeature.value = 'shop'

  // Show dialog and mark shop as interacted
  triggerFeatureDialog('shop', 'shop-keeper-greeting')
}
```

**Objective Completion Dialog:**
```typescript
// Show character reaction when objective is completed
import { useDialogs } from '@/composables/useDialogs'

const { triggerObjectiveDialog } = useDialogs()

function completeFirstCraft() {
  objectivesStore.completeObjective('craft-first-item')

  // Show congratulatory dialog
  triggerObjectiveDialog('craft-first-item', 'headmaster-congratulations')
}
```

**Event-Based Dialog:**
```typescript
// Trigger dialog from random event or game event
import { useDialogs } from '@/composables/useDialogs'

const { triggerEventDialog } = useDialogs()

function triggerRandomEncounter(encounterType: string) {
  if (encounterType === 'forest-mystery') {
    triggerEventDialog('forest-mystery', 'forest-stranger-appears')
  }
}
```

**Check if Dialog is Active:**
```typescript
import { useDialogs } from '@/composables/useDialogs'

const { isDialogActive, getCurrentDialogId } = useDialogs()

// Prevent other actions while dialog is showing
function performAction() {
  if (isDialogActive()) {
    console.log('Cannot perform action while dialog is active')
    return
  }

  // Proceed with action...
}
```

## Tutorial Completion Tracking

Tutorials marked with `"showOnce": true` are tracked in localStorage under the key `idle-artifice-completed-tutorials`.

### Checking Tutorial Completion

```typescript
import { useDialogsStore } from '@/stores/dialogs'

const dialogsStore = useDialogsStore()

// Check if player has seen a tutorial
if (dialogsStore.hasSeenTutorial('welcome')) {
  console.log('Player has seen the welcome tutorial')
}
```

### Replaying Tutorials

```typescript
import { useDialogsStore } from '@/stores/dialogs'

const dialogsStore = useDialogsStore()

// Force show a tutorial even if already completed (e.g., from help menu)
dialogsStore.replayTutorial('welcome')
```

## Dialog History

All dialog conversations are saved to localStorage under the key `idle-artifice-dialog-history`.

### Accessing Dialog History

```typescript
import { useDialogsStore } from '@/stores/dialogs'

const dialogsStore = useDialogsStore()

// Get all conversation history (most recent first)
const history = dialogsStore.conversationHistory

// Each history record contains:
// - conversationId: ID linking related dialogs
// - characterName: Name of the NPC
// - transcript: Array of messages (NPC and player)
// - startedAt: When conversation started
// - completedAt: When conversation ended
```

### Conversation Transcripts

Each conversation history record includes a complete transcript:

```typescript
interface DialogHistoryEntry {
  speaker: 'npc' | 'player'     // Who is speaking
  speakerName: string            // Display name
  message: string                // Message content
  timestamp: Date                // When message was sent
}
```

## Best Practices

### Tutorial Design

1. **Keep tutorials concise** - Players prefer learning by doing rather than reading walls of text
2. **Use markdown sparingly** - Bold key terms but avoid over-formatting
3. **Trigger at the right moment** - Show tutorials when they're immediately relevant
4. **Group related tutorials** - Use multiple conditions to ensure proper context
5. **Test showOnce behavior** - Clear localStorage during development to test first-time experience

### Dialog Design

1. **Give characters personality** - Make dialog memorable and match the game's tone
2. **Use conversationId** - Group related dialogs for better history tracking
3. **Keep messages focused** - Break long exposition into multiple dialog entries
4. **Consider dialog sequences** - Use `triggerDialogSequence` for multi-part conversations
5. **Provide context** - Make sure dialogs make sense based on current game state

### Performance

1. **Tutorials load eagerly** - All tutorial JSON files are loaded at game start (lightweight)
2. **Dialogs load lazily** - Dialog files are only loaded when first triggered
3. **Use descriptive IDs** - File names must match the `id` field in the JSON
4. **Avoid heavy images** - Keep portrait images optimized for web

### File Organization

```
src/content/
├── tutorials/
│   ├── welcome.json              # Immediate tutorial on game load
│   ├── foundry-intro.json        # Feature tutorial
│   ├── first-wood-collected.json # Resource threshold tutorial
│   └── forest-discovered.json    # Location tutorial
└── dialogs/
    ├── headmaster-welcome.json   # NPC introduction
    ├── shop-keeper-greeting.json # Feature NPC dialog
    └── forest-stranger.json      # Event-based dialog
```

### Error Handling

The system includes built-in error handling:

- Missing tutorial/dialog files show error notifications
- Invalid JSON shows console errors with file path
- Missing required fields are logged with details
- LocalStorage failures show warning notification (once per session)

## Dialog Trees (Branching Conversations)

Dialog trees enable branching conversations with player choices, allowing for interactive narrative experiences where player decisions shape the conversation flow.

### Overview

Unlike simple linear dialogs, dialog trees support:
- **Player choices**: Multiple response options at each conversation point
- **Branching paths**: Different choices lead to different conversation branches
- **Looping**: Choices can return to previous nodes (e.g., "Tell me again about...")
- **Multiple endings**: Different paths can lead to different conversation conclusions
- **Dynamic portraits**: Character portraits can change per node to show different expressions

### File Format

Dialog tree files are stored in `src/content/dialog-trees/` and loaded lazily when first requested.

```json
{
  "id": "headmaster-intro",
  "characterName": "Headmaster Steinerhausen",
  "portrait": {
    "path": "images/portraits/headmaster.png",
    "alt": "Headmaster portrait"
  },
  "startNodeId": "welcome",
  "nodes": {
    "welcome": {
      "id": "welcome",
      "message": "Hello! What would you like to know?",
      "responses": [
        {
          "text": "Tell me about the Academy",
          "nextNodeId": "about-academy"
        },
        {
          "text": "What's outside camp?",
          "nextNodeId": "about-wilderness"
        },
        {
          "text": "I'm ready to begin",
          "nextNodeId": null
        }
      ]
    },
    "about-academy": {
      "id": "about-academy",
      "message": "This Academy creates magical items to help explorers.",
      "responses": [
        {
          "text": "Tell me more",
          "nextNodeId": "welcome"
        },
        {
          "text": "That's all I need",
          "nextNodeId": null
        }
      ]
    },
    "about-wilderness": {
      "id": "about-wilderness",
      "message": "The wilderness is vast and dangerous.",
      "portrait": {
        "path": "images/portraits/headmaster-serious.png",
        "alt": "Headmaster serious expression"
      },
      "responses": [
        {
          "text": "Understood",
          "nextNodeId": null
        }
      ]
    }
  }
}
```

### Field Descriptions

#### Tree-Level Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Unique identifier for this dialog tree. Must match filename. |
| `characterName` | string | Yes | Name of the character speaking (displayed in header). |
| `portrait` | object | Yes | Default portrait for all nodes (can be overridden per-node). |
| `portrait.path` | string \| null | Yes | Path to portrait image (null = use placeholder). |
| `portrait.alt` | string | Yes | Alt text for accessibility. |
| `startNodeId` | string | Yes | ID of the first node in the conversation. |
| `nodes` | object | Yes | Map of all conversation nodes (key = node ID). |

#### Node-Level Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Unique identifier for this node (must match key in `nodes` object). |
| `message` | string | Yes | NPC message displayed to player. Supports markdown and `\n` line breaks. |
| `responses` | array | Yes | Player response options. Empty array = terminal node (conversation ends). |
| `portrait` | object | No | Optional portrait override for this specific node (e.g., different expression). |

#### Response Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `text` | string | Yes | Text displayed to player for this choice button. |
| `nextNodeId` | string \| null | Yes | ID of next node to navigate to. `null` = end conversation. |

### Common Patterns

#### Simple Branching

```json
{
  "startNodeId": "greeting",
  "nodes": {
    "greeting": {
      "id": "greeting",
      "message": "How can I help you?",
      "responses": [
        { "text": "Browse your wares", "nextNodeId": "shop" },
        { "text": "Just saying hi", "nextNodeId": "goodbye" }
      ]
    },
    "shop": {
      "id": "shop",
      "message": "Here's what I have available...",
      "responses": []
    },
    "goodbye": {
      "id": "goodbye",
      "message": "Come back anytime!",
      "responses": []
    }
  }
}
```

#### Looping ("Tell Me Again")

Allow player to revisit information:

```json
{
  "startNodeId": "menu",
  "nodes": {
    "menu": {
      "id": "menu",
      "message": "What do you want to know?",
      "responses": [
        { "text": "About crafting", "nextNodeId": "crafting-info" },
        { "text": "About exploring", "nextNodeId": "explore-info" },
        { "text": "That's all", "nextNodeId": null }
      ]
    },
    "crafting-info": {
      "id": "crafting-info",
      "message": "Crafting combines resources into items...",
      "responses": [
        { "text": "Tell me more", "nextNodeId": "menu" }
      ]
    },
    "explore-info": {
      "id": "explore-info",
      "message": "Exploring reveals new areas...",
      "responses": [
        { "text": "Ask something else", "nextNodeId": "menu" }
      ]
    }
  }
}
```

#### Portrait Changes

Show different expressions based on conversation:

```json
{
  "portrait": {
    "path": "images/portraits/character-neutral.png",
    "alt": "Character portrait"
  },
  "nodes": {
    "happy-news": {
      "id": "happy-news",
      "message": "Great job! I'm so proud!",
      "portrait": {
        "path": "images/portraits/character-happy.png",
        "alt": "Character smiling"
      },
      "responses": [...]
    },
    "bad-news": {
      "id": "bad-news",
      "message": "This is... concerning.",
      "portrait": {
        "path": "images/portraits/character-worried.png",
        "alt": "Character worried"
      },
      "responses": [...]
    }
  }
}
```

### Best Practices

**Node IDs**
- Use kebab-case: `welcome`, `about-academy`, `ship-question`
- Keep descriptive but concise
- IDs are permanent (difficult to rename after creation)

**Messages**
- Keep under 1000 characters for readability
- Use `\n` for paragraph breaks
- Consider markdown support for emphasis

**Responses**
- Limit to 2-4 options per node (UX recommendation)
- Keep response text under 200 characters
- Use clear, distinct phrasing for each choice
- First response often continues main conversation
- Last response often exits or loops back

**Conversation Flow**
- Always include at least one path to end the conversation (`nextNodeId: null`)
- Avoid infinite loops unless intentional (validation warns about this)
- Test all branches to ensure logical flow
- Use portrait overrides sparingly for key emotional moments

**File Organization**
```
src/content/dialog-trees/
├── headmaster-intro.json     # Main character introduction
├── merchant-greeting.json    # Shop NPC conversation
├── tutorial-basics.json      # Repeatable info menu
└── quest-giver.json          # Quest dialog
```

### Validation

Dialog trees are validated when loaded:

**Errors (block loading):**
- Missing or invalid start node
- Response references non-existent node
- Empty response text or node message
- Node ID mismatch (key doesn't match `node.id`)

**Warnings (logged but allowed):**
- Orphaned nodes (unreachable from start)
- No terminal paths (infinite loops)
- Response text > 200 characters
- Message text > 1000 characters
- More than 4 responses per node

All validation errors are logged to console with specific details to help fix issues.

### Using Dialog Trees in Code

#### Trigger a Dialog Tree

```typescript
import { useDialogsStore } from '@/stores/dialogs'

const dialogsStore = useDialogsStore()

// Show a dialog tree
await dialogsStore.showDialogTree('headmaster-intro')
```

#### Check if Tree is Active

```typescript
// Check if player is currently in a dialog tree
if (dialogsStore.activeDialogTree) {
  console.log('Current node:', dialogsStore.currentNode?.id)
  console.log('Available choices:', dialogsStore.currentNode?.responses)
}
```

#### Access Conversation History

Dialog trees save full conversation transcripts including player choices:

```typescript
// View all completed conversations
const history = dialogsStore.conversationHistory

history.forEach(conversation => {
  console.log(`${conversation.characterName} (${conversation.conversationId})`)
  conversation.transcript.forEach(entry => {
    console.log(`${entry.speaker}: ${entry.message}`)
  })
})
```

### Wiring Up Automatic Dialog Triggers

Dialog trees can be automatically triggered based on game events and conditions. Common triggers include first-time location visits, feature unlocks, objective completion, or custom game state changes.

#### First Visit Triggers

The most common pattern is triggering a dialog tree when a player first visits a location (e.g., meeting an NPC at the Harbor for the first time).

**Example: Harbor First Visit**

1. **Create the dialog tree file** in `src/content/dialog-trees/`:

```json
// src/content/dialog-trees/harbormaster-intro.json
{
  "id": "harbormaster-intro",
  "characterName": "Harbormaster",
  "portrait": {
    "path": "images/portraits/harbormaster.png",
    "alt": "Harbormaster portrait"
  },
  "startNodeId": "welcome",
  "nodes": {
    "welcome": {
      "id": "welcome",
      "message": "Welcome to the Harbor!",
      "responses": [
        { "text": "Thanks!", "nextNodeId": null }
      ]
    }
  }
}
```

2. **Wire up the trigger** in the location component (e.g., `AreaMap.vue`):

```typescript
import { useWorldMapStore } from '@/stores/worldMap'
import { useDialogsStore } from '@/stores/dialogs'

const worldMapStore = useWorldMapStore()
const dialogsStore = useDialogsStore()
const tile = computed(() => worldMapStore.getTileAt(props.q, props.r))

onMounted(() => {
  // Increment visit count first (this is critical!)
  worldMapStore.incrementVisitCount(props.q, props.r)

  // Check if this is the first visit to this specific location
  if (tile.value?.type === 'harbor' && tile.value.visitCount === 1) {
    dialogsStore.showDialogTree('harbormaster-intro')
  }
})
```

**Important Notes:**
- Always increment `visitCount` BEFORE checking it (visit count starts at 0, becomes 1 on first visit)
- Use `tile.value.visitCount === 1` to check for first visit
- Subsequent visits will have `visitCount > 1` and won't trigger the dialog
- The `visitCount` is persisted in the worldMapStore and tracked across game sessions

#### Feature Unlock Triggers

Trigger a dialog when a feature becomes unlocked:

```typescript
import { watch } from 'vue'
import { useAreaMapStore } from '@/stores/areaMap'
import { useDialogsStore } from '@/stores/dialogs'

const areaMapStore = useAreaMapStore()
const dialogsStore = useDialogsStore()

// Watch for workshop unlock
const workshopFeature = computed(() => areaMapStore.getFeatureById('academy-workshop'))

watch(() => workshopFeature.value?.state, (newState, oldState) => {
  if (oldState === 'locked' && newState === 'unlocked') {
    dialogsStore.showDialogTree('workshop-master-intro')
  }
})
```

#### Objective Completion Triggers

Trigger a dialog when specific objectives are completed:

```typescript
import { useObjectivesStore } from '@/stores/objectives'
import { useDialogsStore } from '@/stores/dialogs'

const objectivesStore = useObjectivesStore()
const dialogsStore = useDialogsStore()

// In your objective completion handler
function handleObjectiveComplete(objectiveId: string) {
  objectivesStore.completeObjective(objectiveId)

  // Trigger specific dialogs based on objective
  if (objectiveId === 'craft-first-item') {
    dialogsStore.showDialogTree('headmaster-congratulations')
  } else if (objectiveId === 'explore-forest') {
    dialogsStore.showDialogTree('forest-ranger-greeting')
  }
}
```

#### Custom Condition Triggers

For more complex trigger conditions:

```typescript
import { computed, watch } from 'vue'
import { useDialogsStore } from '@/stores/dialogs'
import { useResourcesStore } from '@/stores/resources'

const dialogsStore = useDialogsStore()
const resourcesStore = useResourcesStore()

// Trigger when player has collected enough resources
const hasEnoughResources = computed(() =>
  resourcesStore.getResourceAmount('wood') >= 50 &&
  resourcesStore.getResourceAmount('stone') >= 30
)

let hasTriggered = false

watch(hasEnoughResources, (isReady) => {
  if (isReady && !hasTriggered) {
    dialogsStore.showDialogTree('quartermaster-new-options')
    hasTriggered = true
  }
})
```

#### Dialog Sequences

Chain multiple dialogs together for longer story sequences:

```typescript
import { useDialogsStore } from '@/stores/dialogs'

const dialogsStore = useDialogsStore()

async function startIntroSequence() {
  // First dialog tree
  await dialogsStore.showDialogTree('arrival-part-1')

  // Wait for player to complete first tree, then show second
  // Note: showDialogTree returns when the dialog is closed
  await dialogsStore.showDialogTree('arrival-part-2')

  // Finally show a simple conclusion dialog
  await dialogsStore.showDialog('headmaster-welcome')
}
```

#### One-Time vs Repeatable Dialogs

**One-Time Dialogs** (recommended for story/intro dialogs):
- Check visit count: `tile.value.visitCount === 1`
- Check feature interaction: `!dialogsStore.hasInteractedWithFeature(featureId)`
- Use a custom flag in your store

**Repeatable Dialogs** (for help/info NPCs):
```typescript
// Always show when clicking NPC, regardless of previous interactions
function talkToNPC() {
  dialogsStore.showDialogTree('merchant-trade-menu')
}
```

#### Testing Dialog Triggers

During development, you may need to test first-visit dialogs multiple times:

```typescript
// Temporarily override visit count check for testing
if (import.meta.env.DEV) {
  console.log('DEV MODE: Triggering dialog tree for testing')
  dialogsStore.showDialogTree('harbormaster-intro')
} else if (tile.value?.type === 'harbor' && tile.value.visitCount === 1) {
  dialogsStore.showDialogTree('harbormaster-intro')
}
```

Or reset the world map to clear visit counts:
```typescript
import { useWorldMapStore } from '@/stores/worldMap'

const worldMapStore = useWorldMapStore()
worldMapStore.resetMap() // Resets all visit counts and exploration state
```

### Visual Editor

A visual dialog tree editor is available for creating and editing dialog trees:

1. Navigate to `/debug` in your browser
2. Click "Dialog Tree Editor" under Development Tools
3. Or go directly to `/dev/dialog-editor`

**Features:**
- Interactive node graph with drag-and-drop
- Visual validation feedback (errors/warnings highlighted on nodes)
- Auto-layout algorithm for organizing nodes
- Live editing of messages, responses, and portraits
- Direct file saving to `src/content/dialog-trees/`
- Import/export JSON

See `src/components/dialog-editor/README.md` for detailed editor documentation.

## Future Enhancements

The dialog system is designed to support future features:

1. **Conditional Dialogs** - Similar trigger system could be added to dialogs (show based on game state)
2. **Portrait Animations** - Portrait structure supports future animation paths
3. **Voice Acting** - Dialog structure could include audio file paths
4. **Choice Conditions** - Responses could be shown/hidden based on player state (inventory, completed quests, etc.)
5. **Timed Choices** - Optional timer for urgent decision points

## Examples Directory

See these files for complete working examples:

**Tutorials:**
- `src/content/tutorials/welcome.json` - Immediate trigger
- `src/content/tutorials/foundry-intro.json` - Feature trigger
- `src/content/tutorials/first-wood-collected.json` - Resource trigger
- `src/content/tutorials/forest-discovered.json` - Location trigger

**Dialogs:**
- `src/content/dialogs/headmaster-welcome.json` - Simple NPC dialog
- `src/content/dialogs/foundry-master-tips.json` - Feature-based dialog
- `src/content/dialogs/shop-keeper-greeting.json` - Shop NPC dialog
- `src/content/dialogs/workshop-master-intro.json` - Workshop NPC dialog

**Dialog Trees:**
- `src/content/dialog-trees/headmaster-intro.json` - Complex branching conversation with looping, portrait overrides, and multiple endings

**Code Examples:**
- `src/composables/useTutorials.ts` - Tutorial composable implementation
- `src/composables/useDialogs.ts` - Dialog composable implementation
- `src/stores/dialogs.ts` - Central store implementation
- `src/components/TutorialModal.vue` - Tutorial UI component
- `src/components/DialogModal.vue` - Dialog UI component
