# Foundry Quest Chain Implementation Guide

## Overview

This document details the implementation steps for a quest chain that guides the player through the Foundry feature:

1. Lock the "Enter Foundry" button until quest completion
2. Show Headmaster dialog after completing "explore-features"
3. New objective: "Talk to Anton at the Foundry"
4. Anton dialog unlocks "Enter Foundry" button
5. First Foundry visit triggers tutorial sequence
6. First recipe completion triggers Anton dialog about efficiency, unlocking "Edit Layout"
7. Second recipe completion completes the objective

---

## Current Quest Chain (Before Implementation)

```
talk-to-harbormaster (active)
  ↓
visit-academy (hidden → active)
  ↓
talk-to-headmaster (hidden → active)
  ↓
explore-features (hidden → active, 3 subtasks: foundry, quartermaster, tavern)
  ↓
resource-creation (hidden → active)
```

## New Quest Chain (After Implementation)

```
talk-to-harbormaster (active)
  ↓
visit-academy
  ↓
talk-to-headmaster
  ↓
explore-features (3 subtasks)
  ↓
talk-to-anton-foundry (NEW) ← Headmaster dialog triggers this
  ↓
craft-first-items (NEW) ← Anton unlocks Foundry, tutorials play
  ↓
resource-creation
```

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/content/dialog-trees/headmaster-foundry-ready.json` | Headmaster explaining resources are ready |
| `src/content/dialog-trees/anton-foundry-unlock.json` | Anton conversation that unlocks Enter Foundry |
| `src/content/dialog-trees/anton-efficiency.json` | Anton's "too inefficient" dialog after first craft |
| `src/content/tutorials/foundry-intro.json` | First tutorial on entering Foundry |
| `src/content/tutorials/foundry-queue.json` | Tutorial on adding recipes to queue |
| `src/content/tutorials/foundry-edit-layout.json` | Tutorial on Edit Layout feature |

## Files to Modify

| File | Changes |
|------|---------|
| `src/config/objectives.json` | Add new objectives for the questline |
| `src/config/area-maps/academy.ts` | Change Foundry state to 'locked', update NPC dialog reference |
| `src/stores/dialogs.ts` | Add completion handlers for new dialog trees |
| `src/stores/objectives.ts` | Trigger Headmaster dialog when explore-features completes |
| `src/stores/foundry.ts` | Track first visit, craft count, Edit Layout unlock state |
| `src/components/screens/FoundryScreen.vue` | Add locked state for "Edit Layout" button, first visit tutorials |
| `src/components/displays/NavigationButton.vue` | Support disabled/locked prop |

---

## Detailed Implementation Steps

### Step 1: Lock the "Enter Foundry" Button

**File: `src/config/area-maps/academy.ts`**

Change the Foundry feature's initial state from `'unlocked'` to `'locked'` (line 47):

```typescript
// Before
state: 'unlocked',

// After
state: 'locked',
```

**File: `src/components/displays/NavigationButton.vue`**

Add support for a `disabled` prop:

```typescript
interface Props {
  label: string
  featureId: string
  icon?: string
  variant?: 'primary' | 'secondary'
  disabled?: boolean  // NEW
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  disabled: false,  // NEW
})
```

Update the template:

```html
<button
  class="navigation-button"
  :class="[
    `navigation-button--${variant}`,
    { 'navigation-button--disabled': disabled }
  ]"
  :disabled="disabled"
  @click="handleClick"
>
```

Add CSS for disabled state:

```css
.navigation-button--disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background-color: #94a3b8;
}

.navigation-button--disabled:hover {
  transform: none;
  box-shadow: none;
}
```

**File: `src/config/area-maps/academy.ts`**

The NavigationButton needs to check feature state. Update minimizedDisplays to pass disabled:

```typescript
minimizedDisplays: [
  {
    component: markRaw(StatusText),
    props: {
      text: 'Crafting available',
      variant: 'success',
      icon: '✓',
    },
  },
  {
    component: markRaw(NavigationButton),
    props: {
      label: 'Enter Foundry',
      featureId: 'academy-foundry',
      icon: '🔨',
      variant: 'primary',
      // disabled will be computed based on feature state in FeatureCard
    },
  },
],
```

**Note**: The `FeatureCard.vue` component that renders minimizedDisplays needs to pass the feature's locked state to NavigationButton. Check how minimizedDisplays are rendered and inject `disabled: feature.state === 'locked'` into the props.

---

### Step 2: Headmaster Dialog After "explore-features" Completion

**File: `src/content/dialog-trees/headmaster-foundry-ready.json`** (NEW)

```json
{
  "id": "headmaster-foundry-ready",
  "characterName": "Headmaster Steinerhausen",
  "portrait": {
    "path": "images/portraits/headmaster.png",
    "alt": "Headmaster Steinerhausen Portrait"
  },
  "startNodeId": "start",
  "nodes": {
    "start": {
      "id": "start",
      "message": "Excellent work getting acquainted with our facilities! Now that you've seen what we have, it's time to put it to use. Anton at the Foundry has been waiting for someone with authority to help coordinate our crafting operations. He should have everything ready for you.",
      "responses": [
        {
          "text": "I'll head over to speak with him.",
          "nextNodeId": null
        }
      ]
    }
  }
}
```

**File: `src/stores/objectives.ts`**

Dialog trees don't have automatic trigger conditions like tutorials. You must call `showDialogTree()` programmatically.

In the `completeObjective()` function, add a check for `explore-features` completion. Insert after the tutorial trigger (around line 277):

```typescript
// Line 275-277 (existing code)
const { triggerObjectiveTutorial } = useTutorials()
triggerObjectiveTutorial(id)

// NEW: Trigger Headmaster dialog when explore-features completes
if (id === 'explore-features') {
  // Use dynamic import to avoid circular dependency (dialogs.ts imports objectives.ts)
  import('./dialogs').then(({ useDialogsStore }) => {
    const dialogsStore = useDialogsStore()
    dialogsStore.showDialogTree('headmaster-foundry-ready')
  })
}

// Evaluate discovery conditions... (existing code continues)
```

**Why dynamic import?** The `dialogs.ts` store already imports `objectives.ts`, so a static import would create a circular dependency. Using dynamic `import()` defers the resolution.

**Alternative approach:** If you prefer static imports, you could:
1. Move the dialog trigger logic to `dialogs.ts` by watching for objective completion
2. Create a separate event bus/emitter for cross-store communication

---

### Step 3: New Objective - Talk to Anton

**File: `src/config/objectives.json`**

Add after the `explore-features` objective (insert before `resource-creation`):

```json
{
  "id": "talk-to-anton-foundry",
  "title": "Talk to Anton at the Foundry",
  "description": "Speak with Anton DeCassieur at the Foundry to learn about crafting operations.",
  "status": "hidden",
  "category": "main",
  "order": 5,
  "targetLocation": "0,0",
  "discoveryConditions": [
    {
      "type": "objective",
      "id": "explore-features",
      "description": "Complete 'Inspect Academy Features'"
    }
  ]
}
```

**Update order numbers:**
- `resource-creation`: change order from 5 to 7
- Add `craft-first-items` at order 6 (see Step 8)

---

### Step 4: Anton Dialog Unlocks "Enter Foundry"

**File: `src/content/dialog-trees/anton-foundry-unlock.json`** (NEW)

```json
{
  "id": "anton-foundry-unlock",
  "characterName": "Anton DeCassieur",
  "portrait": {
    "path": "images/portraits/smith.png",
    "alt": "Anton DeCassieur Portrait"
  },
  "startNodeId": "ready",
  "nodes": {
    "ready": {
      "id": "ready",
      "message": "The Headmaster sent word that you'd be coming. The Foundry is prepped and ready for your inspection. I've organized the workspace so you can observe our crafting operations firsthand.",
      "responses": [
        {
          "text": "Show me what we're working with.",
          "nextNodeId": "explain"
        }
      ]
    },
    "explain": {
      "id": "explain",
      "message": "Inside, you'll find our main crafting grid. I've set up a supply bin for raw materials and an anvil for the actual forging. Once you're ready, you can enter and start queuing up recipes.",
      "responses": [
        {
          "text": "Let's get started.",
          "nextNodeId": null
        }
      ]
    }
  }
}
```

**File: `src/config/area-maps/academy.ts`**

Update the Foundry NPC's dialog tree reference to use the new unlock dialog:

```typescript
npcs: [
  {
    id: 'foundry-master',
    name: 'Anton DeCassieur',
    portrait: {
      path: 'images/portraits/smith.png',
      alt: 'Anton DeCassieur, the Foundry Master',
    },
    dialogTreeId: 'anton-foundry-unlock',  // Changed from 'foundry-master-intro'
    fallbackDialogTreeId: 'foundry-master-tips',
    icon: '🔨',
  },
],
```

**File: `src/stores/dialogs.ts`**

Add handler in `completeConversation()` function (around line 522):

```typescript
} else if (conversationId === 'headmaster-foundry-ready') {
  // Dialog just informs player, objective unlocks via discovery conditions
} else if (conversationId === 'anton-foundry-unlock') {
  objectivesStore.completeObjective('talk-to-anton-foundry')
  // Unlock the Enter Foundry button
  const areaMapStore = useAreaMapStore()
  areaMapStore.updateFeatureState('academy-foundry', 'unlocked')
}
```

**Import needed at top of `dialogs.ts`:**
```typescript
import { useAreaMapStore } from './areaMap'
```

---

### Step 5: Foundry First Visit Tutorial Sequence

**File: `src/content/tutorials/foundry-intro.json`** (NEW)

```json
{
  "id": "foundry-intro",
  "title": "Welcome to the Foundry",
  "content": "This is the **Foundry**, where you'll craft equipment for your explorers.\n\nThe main area shows Anton's crafting grid. He'll move between the **Supply Bin** (📦) to gather materials and the **Anvil** (🔨) to craft items.",
  "triggerConditions": [
    {
      "type": "immediate",
      "description": "Triggered on first Foundry screen visit"
    }
  ],
  "showOnce": true
}
```

**File: `src/content/tutorials/foundry-queue.json`** (NEW)

```json
{
  "id": "foundry-queue",
  "title": "Crafting Queue",
  "content": "To craft an item:\n\n1. Select a **Recipe** from the left sidebar\n2. Set the **Quantity** you want to craft\n3. Click **Add to Queue**\n\nAnton will automatically work through the queue, gathering materials and crafting each item in order.",
  "triggerConditions": [
    {
      "type": "immediate",
      "description": "Triggered after foundry-intro"
    }
  ],
  "showOnce": true
}
```

**File: `src/stores/foundry.ts`**

Add state tracking for first Foundry visit:

```typescript
// Add to state section (near other refs)
const hasVisitedFoundryScreen = ref(false)

// Add storage key constant
const STORAGE_KEY_FOUNDRY_VISITED = 'idle-artifice-foundry-screen-visited'

// Add to loadFromLocalStorage function or create new load function
function loadFoundryVisitState(): void {
  try {
    const visited = localStorage.getItem(STORAGE_KEY_FOUNDRY_VISITED)
    hasVisitedFoundryScreen.value = visited === 'true'
  } catch (error) {
    console.error('Failed to load foundry visit state:', error)
  }
}

// Add action to mark as visited
function markFoundryScreenVisited(): void {
  if (hasVisitedFoundryScreen.value) return
  hasVisitedFoundryScreen.value = true
  try {
    localStorage.setItem(STORAGE_KEY_FOUNDRY_VISITED, 'true')
  } catch (error) {
    console.error('Failed to save foundry visit state:', error)
  }
}

// Call loadFoundryVisitState() in the store initialization

// Export in return statement
return {
  // ... existing exports
  hasVisitedFoundryScreen,
  markFoundryScreenVisited,
}
```

**File: `src/components/screens/FoundryScreen.vue`**

Add import and onMounted logic:

```typescript
import { useDialogsStore } from '@/stores/dialogs'

// Inside setup
const dialogsStore = useDialogsStore()

onMounted(() => {
  // Existing resize listener setup...
  window.addEventListener('resize', updateWindowWidth)

  // Check if first visit to show tutorials
  if (!foundryStore.hasVisitedFoundryScreen) {
    foundryStore.markFoundryScreenVisited()
    dialogsStore.showTutorial('foundry-intro')
    dialogsStore.showTutorial('foundry-queue')
  }
})
```

---

### Step 6: First Craft Triggers Efficiency Dialog & Edit Layout Unlock

**File: `src/content/dialog-trees/anton-efficiency.json`** (NEW)

```json
{
  "id": "anton-efficiency",
  "characterName": "Anton DeCassieur",
  "portrait": {
    "path": "images/portraits/smith.png",
    "alt": "Anton DeCassieur Portrait"
  },
  "startNodeId": "start",
  "nodes": {
    "start": {
      "id": "start",
      "message": "Hmm. The item is crafted, yes, but look at how much time I wasted walking back and forth! This layout is terribly inefficient. If only we could rearrange the workspace...",
      "responses": [
        {
          "text": "Can we move things around?",
          "nextNodeId": "explain"
        }
      ]
    },
    "explain": {
      "id": "explain",
      "message": "Indeed! The **Edit Layout** button will let you reposition the Supply Bin and Anvil. Place them closer together and I'll spend less time walking, meaning faster crafts overall.",
      "responses": [
        {
          "text": "I'll optimize the layout.",
          "nextNodeId": null
        }
      ]
    }
  }
}
```

**File: `src/content/tutorials/foundry-edit-layout.json`** (NEW)

```json
{
  "id": "foundry-edit-layout",
  "title": "Edit Layout",
  "content": "Click **Edit Layout** to rearrange the workspace.\n\n1. Click the **Supply Bin** (📦) or **Anvil** (🔨) to select it\n2. Click an empty cell to move it there\n3. Click **Save Layout** when done\n\nPlacing them closer together reduces Anton's walking time!",
  "triggerConditions": [
    {
      "type": "immediate",
      "description": "Triggered after efficiency dialog"
    }
  ],
  "showOnce": true
}
```

**File: `src/stores/foundry.ts`**

Add craft tracking and Edit Layout unlock state:

```typescript
// Add to state section
const completedCraftsCount = ref(0)
const isEditLayoutUnlocked = ref(false)

// Add storage keys
const STORAGE_KEY_CRAFTS_COUNT = 'idle-artifice-foundry-crafts-count'
const STORAGE_KEY_EDIT_LAYOUT_UNLOCKED = 'idle-artifice-foundry-edit-layout-unlocked'

// Add load functions
function loadCraftingProgress(): void {
  try {
    const count = localStorage.getItem(STORAGE_KEY_CRAFTS_COUNT)
    completedCraftsCount.value = count ? parseInt(count, 10) : 0

    const unlocked = localStorage.getItem(STORAGE_KEY_EDIT_LAYOUT_UNLOCKED)
    isEditLayoutUnlocked.value = unlocked === 'true'
  } catch (error) {
    console.error('Failed to load crafting progress:', error)
  }
}

// Add action to unlock edit layout
function unlockEditLayout(): void {
  isEditLayoutUnlocked.value = true
  try {
    localStorage.setItem(STORAGE_KEY_EDIT_LAYOUT_UNLOCKED, 'true')
  } catch (error) {
    console.error('Failed to save edit layout unlock:', error)
  }
}

// Call loadCraftingProgress() in store initialization
```

**Modify the craft completion logic in the state machine:**

Find where crafting completes (likely in `tick()` or similar function where `produceRecipeOutputs` is called) and add:

```typescript
// After successful craft completion (after produceRecipeOutputs)
completedCraftsCount.value++
try {
  localStorage.setItem(STORAGE_KEY_CRAFTS_COUNT, completedCraftsCount.value.toString())
} catch (error) {
  console.error('Failed to save crafts count:', error)
}

// Trigger efficiency dialog after first craft
if (completedCraftsCount.value === 1 && !isEditLayoutUnlocked.value) {
  // Use nextTick or setTimeout to avoid state machine conflicts
  setTimeout(() => {
    const dialogsStore = useDialogsStore()
    dialogsStore.showDialogTree('anton-efficiency')
  }, 500)
}
```

**Add import at top of `foundry.ts`:**
```typescript
import { useDialogsStore } from './dialogs'
```

**Export in return statement:**
```typescript
return {
  // ... existing exports
  completedCraftsCount,
  isEditLayoutUnlocked,
  unlockEditLayout,
}
```

**File: `src/stores/dialogs.ts`**

Add handler for `anton-efficiency` completion in `completeConversation()`:

```typescript
} else if (conversationId === 'anton-efficiency') {
  const foundryStore = useFoundryStore()
  foundryStore.unlockEditLayout()
  showTutorial('foundry-edit-layout')
}
```

**Add import:**
```typescript
import { useFoundryStore } from './foundry'
```

**File: `src/components/screens/FoundryScreen.vue`**

Update the Edit Layout button to respect locked state:

```typescript
// Add computed
const isEditLayoutAvailable = computed(() => {
  return foundryStore.isEditLayoutUnlocked && !isAntonCrafting.value
})

const editLayoutTitle = computed(() => {
  if (!foundryStore.isEditLayoutUnlocked) {
    return 'Complete your first craft to unlock'
  }
  if (isAntonCrafting.value) {
    return 'Cannot edit while Anton is crafting'
  }
  return ''
})
```

Update the button template (around line 414-422):

```html
<button
  class="edit-mode-button"
  :class="{
    active: isEditMode,
    locked: !foundryStore.isEditLayoutUnlocked
  }"
  :disabled="!isEditLayoutAvailable"
  @click="toggleEditMode"
  :title="editLayoutTitle"
>
  {{ !foundryStore.isEditLayoutUnlocked
    ? '🔒 Edit Layout'
    : isEditMode
      ? '💾 Save Layout'
      : '✏️ Edit Layout'
  }}
</button>
```

Add CSS for locked state:

```css
.edit-mode-button.locked {
  opacity: 0.6;
  background-color: rgba(100, 100, 100, 0.3);
  border-color: rgba(255, 255, 255, 0.2);
}
```

---

### Step 7: Second Craft Completion

**File: `src/stores/foundry.ts`**

In the craft completion logic (same location as Step 6), add:

```typescript
// After incrementing completedCraftsCount
if (completedCraftsCount.value === 2) {
  setTimeout(() => {
    const objectivesStore = useObjectivesStore()
    objectivesStore.completeObjective('craft-first-items')
  }, 500)
}
```

**Add import:**
```typescript
import { useObjectivesStore } from './objectives'
```

---

### Step 8: New Crafting Objective

**File: `src/config/objectives.json`**

Add after `talk-to-anton-foundry`:

```json
{
  "id": "craft-first-items",
  "title": "Learn the Foundry",
  "description": "Craft two items to learn the basics of the Foundry system.",
  "status": "hidden",
  "category": "main",
  "order": 6,
  "targetLocation": "0,0",
  "currentProgress": 0,
  "maxProgress": 2,
  "discoveryConditions": [
    {
      "type": "objective",
      "id": "talk-to-anton-foundry",
      "description": "Complete 'Talk to Anton at the Foundry'"
    }
  ]
}
```

**Update `resource-creation` order:**
```json
{
  "id": "resource-creation",
  "title": "Resource Generation",
  "description": "Learn about generating resources for your Academy.",
  "status": "hidden",
  "category": "main",
  "order": 7,  // Changed from 5
  // ... rest unchanged
}
```

**Alternative: Use progress updates instead of direct completion:**

If using `maxProgress`, update the foundry store to call `updateProgress` instead:

```typescript
// In craft completion logic
const objectivesStore = useObjectivesStore()
objectivesStore.updateProgress('craft-first-items', completedCraftsCount.value)
// Auto-completes when currentProgress reaches maxProgress
```

---

---

## Dialog Trigger System Architecture

This section describes a consolidated system for triggering dialog trees based on game conditions, similar to how tutorials work but designed for lazy-loaded dialog trees.

### Design Goals

1. **Centralized configuration** - All dialog triggers defined in one place
2. **Lazy loading** - Don't load dialog tree content until needed
3. **Consistent with tutorials** - Same condition types and evaluation patterns
4. **Testable** - Easy to unit test trigger evaluation
5. **Extensible** - Easy to add new condition types

### New Files to Create

| File | Purpose |
|------|---------|
| `src/config/dialog-triggers.json` | Maps trigger conditions to dialog tree IDs |
| `src/types/dialogTriggers.ts` | TypeScript types for trigger system |
| `src/composables/useDialogTriggers.ts` | Composable for evaluating and firing triggers |

### Type Definitions

**File: `src/types/dialogTriggers.ts`**

```typescript
/**
 * Trigger condition types for dialog trees
 * Mirrors TutorialTriggerType for consistency
 */
export type DialogTriggerType =
  | 'objective-complete'    // When a specific objective is completed
  | 'objective-active'      // When a specific objective becomes active
  | 'dialog-complete'       // When another dialog tree is completed
  | 'feature-interact'      // When a feature is interacted with
  | 'feature-unlock'        // When a feature is unlocked
  | 'location-visit'        // When a location is first visited
  | 'location-enter'        // When entering a location (every time)
  | 'resource-threshold'    // When resource amount crosses threshold
  | 'craft-complete'        // When crafting completes (with optional count)

/**
 * Single trigger condition
 */
export interface DialogTriggerCondition {
  /** Type of trigger */
  type: DialogTriggerType
  /** ID of the objective/dialog/feature/location to check */
  id?: string
  /** Numeric value for thresholds (resource amount, craft count) */
  value?: number
  /** Comparison operator for value conditions */
  operator?: 'eq' | 'gte' | 'lte' | 'gt' | 'lt'
}

/**
 * Complete trigger definition mapping conditions to a dialog tree
 */
export interface DialogTrigger {
  /** Unique ID for this trigger (for tracking) */
  id: string
  /** Dialog tree ID to show when conditions are met */
  dialogTreeId: string
  /** All conditions must be met (AND logic) */
  conditions: DialogTriggerCondition[]
  /** Only fire once (default: true) */
  showOnce?: boolean
  /** Priority when multiple triggers fire simultaneously (higher = first) */
  priority?: number
  /** Human-readable description for debugging */
  description?: string
}

/**
 * Root structure of dialog-triggers.json
 */
export interface DialogTriggersConfig {
  triggers: DialogTrigger[]
}
```

### Trigger Configuration

**File: `src/config/dialog-triggers.json`**

```json
{
  "triggers": [
    {
      "id": "headmaster-foundry-ready",
      "dialogTreeId": "headmaster-foundry-ready",
      "conditions": [
        { "type": "objective-complete", "id": "explore-features" }
      ],
      "priority": 10,
      "description": "Headmaster explains Foundry is ready after exploring features"
    },
    {
      "id": "anton-efficiency-prompt",
      "dialogTreeId": "anton-efficiency",
      "conditions": [
        { "type": "craft-complete", "value": 1, "operator": "eq" }
      ],
      "priority": 10,
      "description": "Anton comments on inefficiency after first craft"
    },
    {
      "id": "tutorial-resource-generation",
      "dialogTreeId": "resource-generation-intro",
      "conditions": [
        { "type": "objective-complete", "id": "craft-first-items" }
      ],
      "priority": 5,
      "description": "Introduce resource generation after crafting tutorial"
    }
  ]
}
```

### Trigger Evaluation Composable

**File: `src/composables/useDialogTriggers.ts`**

```typescript
import { ref, computed } from 'vue'
import { useDialogsStore } from '@/stores/dialogs'
import { useObjectivesStore } from '@/stores/objectives'
import { useFoundryStore } from '@/stores/foundry'
import { useResourcesStore } from '@/stores/resources'
import { useWorldMapStore } from '@/stores/worldMap'
import type { DialogTrigger, DialogTriggerCondition } from '@/types/dialogTriggers'
import triggersConfig from '@/config/dialog-triggers.json'

// Track which triggers have fired (persisted to localStorage)
const STORAGE_KEY = 'idle-artifice-fired-dialog-triggers'

export function useDialogTriggers() {
  const firedTriggers = ref<Set<string>>(new Set())

  // Load fired triggers from localStorage
  function loadFiredTriggers(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        firedTriggers.value = new Set(JSON.parse(stored))
      }
    } catch (error) {
      console.error('Failed to load fired triggers:', error)
    }
  }

  // Save fired triggers to localStorage
  function saveFiredTriggers(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...firedTriggers.value]))
    } catch (error) {
      console.error('Failed to save fired triggers:', error)
    }
  }

  // Mark a trigger as fired
  function markTriggerFired(triggerId: string): void {
    firedTriggers.value.add(triggerId)
    saveFiredTriggers()
  }

  // Check if a trigger has already fired
  function hasTriggerFired(triggerId: string): boolean {
    return firedTriggers.value.has(triggerId)
  }

  // Evaluate a single condition
  function evaluateCondition(condition: DialogTriggerCondition): boolean {
    const objectivesStore = useObjectivesStore()
    const dialogsStore = useDialogsStore()
    const foundryStore = useFoundryStore()
    const resourcesStore = useResourcesStore()
    const worldMapStore = useWorldMapStore()

    switch (condition.type) {
      case 'objective-complete': {
        const objective = objectivesStore.getObjectiveById(condition.id!)
        return objective?.status === 'completed'
      }

      case 'objective-active': {
        const objective = objectivesStore.getObjectiveById(condition.id!)
        return objective?.status === 'active'
      }

      case 'dialog-complete': {
        return dialogsStore.hasCompletedDialogTree(condition.id!)
      }

      case 'feature-interact': {
        return dialogsStore.hasInteractedWithFeature(condition.id!)
      }

      case 'craft-complete': {
        const count = foundryStore.completedCraftsCount
        return evaluateNumericCondition(count, condition.value!, condition.operator || 'gte')
      }

      case 'resource-threshold': {
        const amount = resourcesStore.getResourceAmount(condition.id!)
        return evaluateNumericCondition(amount, condition.value!, condition.operator || 'gte')
      }

      case 'location-visit': {
        const [q, r] = condition.id!.split(',').map(Number)
        return worldMapStore.hasVisitedTile(q, r)
      }

      default:
        console.warn(`Unknown trigger condition type: ${condition.type}`)
        return false
    }
  }

  // Helper for numeric comparisons
  function evaluateNumericCondition(
    actual: number,
    expected: number,
    operator: string
  ): boolean {
    switch (operator) {
      case 'eq': return actual === expected
      case 'gte': return actual >= expected
      case 'lte': return actual <= expected
      case 'gt': return actual > expected
      case 'lt': return actual < expected
      default: return actual >= expected
    }
  }

  // Evaluate all conditions for a trigger (AND logic)
  function evaluateTrigger(trigger: DialogTrigger): boolean {
    // Skip if already fired and showOnce is true (default)
    if ((trigger.showOnce !== false) && hasTriggerFired(trigger.id)) {
      return false
    }

    return trigger.conditions.every(condition => evaluateCondition(condition))
  }

  // Find and fire the first matching trigger
  // Returns true if a trigger was fired
  async function evaluateAndFireTriggers(): Promise<boolean> {
    const dialogsStore = useDialogsStore()

    // Sort by priority (higher first)
    const sortedTriggers = [...triggersConfig.triggers].sort(
      (a, b) => (b.priority || 0) - (a.priority || 0)
    )

    for (const trigger of sortedTriggers) {
      if (evaluateTrigger(trigger)) {
        console.log(`[DialogTrigger] Firing: ${trigger.id} -> ${trigger.dialogTreeId}`)
        markTriggerFired(trigger.id)
        await dialogsStore.showDialogTree(trigger.dialogTreeId)
        return true
      }
    }

    return false
  }

  // Check triggers for a specific event type
  // Useful for targeted evaluation after specific actions
  async function evaluateTriggersForEvent(
    eventType: DialogTriggerCondition['type'],
    eventId?: string
  ): Promise<boolean> {
    const dialogsStore = useDialogsStore()

    // Filter to triggers that have this event type as a condition
    const relevantTriggers = triggersConfig.triggers.filter(trigger =>
      trigger.conditions.some(c => c.type === eventType && (!eventId || c.id === eventId))
    )

    // Sort by priority
    const sorted = relevantTriggers.sort((a, b) => (b.priority || 0) - (a.priority || 0))

    for (const trigger of sorted) {
      if (evaluateTrigger(trigger)) {
        console.log(`[DialogTrigger] Firing: ${trigger.id} -> ${trigger.dialogTreeId}`)
        markTriggerFired(trigger.id)
        await dialogsStore.showDialogTree(trigger.dialogTreeId)
        return true
      }
    }

    return false
  }

  // Reset all fired triggers (for testing/debug)
  function resetFiredTriggers(): void {
    firedTriggers.value.clear()
    localStorage.removeItem(STORAGE_KEY)
  }

  // Initialize on first use
  loadFiredTriggers()

  return {
    firedTriggers: computed(() => firedTriggers.value),
    hasTriggerFired,
    evaluateAndFireTriggers,
    evaluateTriggersForEvent,
    resetFiredTriggers,
  }
}
```

### Integration Points

The trigger system needs to be called at key moments. Add these calls to existing code:

**1. After objective completion (`src/stores/objectives.ts`)**

```typescript
// In completeObjective(), after evaluateDiscoveryConditions()
import { useDialogTriggers } from '@/composables/useDialogTriggers'

// ... existing code ...

// Evaluate dialog triggers
const { evaluateTriggersForEvent } = useDialogTriggers()
evaluateTriggersForEvent('objective-complete', id)
```

**2. After craft completion (`src/stores/foundry.ts`)**

```typescript
// After incrementing completedCraftsCount
import { useDialogTriggers } from '@/composables/useDialogTriggers'

const { evaluateTriggersForEvent } = useDialogTriggers()
evaluateTriggersForEvent('craft-complete')
```

**3. After feature unlock (`src/stores/areaMap.ts`)**

```typescript
// In updateFeatureState() when unlocking
import { useDialogTriggers } from '@/composables/useDialogTriggers'

if (newState === 'unlocked') {
  const { evaluateTriggersForEvent } = useDialogTriggers()
  evaluateTriggersForEvent('feature-unlock', featureId)
}
```

### Benefits of This Architecture

1. **Single source of truth** - All dialog triggers in `dialog-triggers.json`
2. **No circular dependencies** - Composable pattern avoids store import cycles
3. **Lazy loading preserved** - Dialog tree content only loaded when triggered
4. **Easy to test** - `evaluateCondition()` is pure and testable
5. **Priority system** - Control which dialog shows when multiple triggers match
6. **Event-based evaluation** - Only check relevant triggers for each event type
7. **Persistence** - Fired triggers survive page refresh

### Migration Path

To migrate the Foundry questline to this system:

1. Create the new files (`dialog-triggers.json`, types, composable)
2. Add trigger entries for each dialog in your questline
3. Add integration points to stores
4. Remove hardcoded trigger logic from stores
5. Test each trigger fires correctly

---

## Architecture Reference

### Dialog-to-Objective Flow

```
Dialog completes
  → dialogs.ts completeConversation()
    → objectivesStore.completeObjective()
      → evaluateDiscoveryConditions()
        → Next objective unlocks
```

### Feature Unlock Flow

```
Dialog completes
  → dialogs.ts completeConversation()
    → areaMapStore.updateFeatureState(featureId, 'unlocked')
      → Feature button becomes clickable
```

### Tutorial Trigger Flow

```
showTutorial(id)
  → checks hasSeenTutorial
    → if not seen, adds to modalQueue
      → ModalManager displays it
```

### Craft Completion Flow

```
State machine tick()
  → crafting phase completes
    → produceRecipeOutputs()
      → increment completedCraftsCount
        → check for dialog/objective triggers
```

---

## Key Files Reference

| Purpose | File Path |
|---------|-----------|
| Objective definitions | `src/config/objectives.json` |
| Objective store | `src/stores/objectives.ts` |
| Dialog store | `src/stores/dialogs.ts` |
| Dialog trees | `src/content/dialog-trees/*.json` |
| Tutorials | `src/content/tutorials/*.json` |
| Academy area config | `src/config/area-maps/academy.ts` |
| Foundry store | `src/stores/foundry.ts` |
| Foundry screen | `src/components/screens/FoundryScreen.vue` |
| Navigation button | `src/components/displays/NavigationButton.vue` |
| Area map store | `src/stores/areaMap.ts` |

---

## Testing Checklist

- [ ] Foundry "Enter Foundry" button starts locked
- [ ] Completing all 3 feature interactions triggers Headmaster dialog
- [ ] "Talk to Anton at the Foundry" objective appears after Headmaster dialog
- [ ] Clicking Anton NPC shows unlock dialog
- [ ] Completing Anton dialog unlocks "Enter Foundry" button
- [ ] First Foundry screen visit shows intro + queue tutorials
- [ ] "Edit Layout" button starts locked with 🔒 icon
- [ ] First craft completion triggers Anton efficiency dialog
- [ ] Completing efficiency dialog unlocks "Edit Layout" button
- [ ] Edit Layout tutorial shows after efficiency dialog
- [ ] Second craft completion completes "Learn the Foundry" objective
- [ ] All states persist across page refresh
