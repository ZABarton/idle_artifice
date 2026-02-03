# Quest System Guide

This document explains how to create quest chains using Idle Artifice's data-driven quest systems.

---

## Overview

The quest system consists of several interconnected components:

| Component | Purpose | Location |
|-----------|---------|----------|
| **Objectives** | Track player progress through quests | `src/config/objectives.json` |
| **Dialog Trees** | Branching NPC conversations | `src/content/dialog-trees/*.json` |
| **Dialog Triggers** | Auto-trigger dialogs based on conditions | `src/config/dialog-triggers.json` |
| **Tutorials** | Instructional modals | `src/content/tutorials/*.json` |
| **NPC Configs** | NPC dialog progressions | `src/config/npcs/*.ts` |
| **Area Map Configs** | Feature states and triggers | `src/config/area-maps/*.ts` |

---

## Core Concepts

### Data-Driven Design

Quest behavior is defined in configuration files, not code. Handlers (stores, composables) are abstract executors that process these configurations. This separation allows:

- Non-code changes for quest tuning
- Clear ownership (content in JSON, logic in TypeScript)
- Easier testing and debugging

### The Quest Chain Pattern

```
Objective A (active)
  ↓ completes via dialog onComplete
Objective B (hidden → active via discoveryConditions)
  ↓ unlocks feature via dialog onComplete
Feature Screen with tutorials
  ↓ player action triggers dialog via dialog-triggers.json
Objective C (hidden → active → completed)
```

---

## Creating Objectives

**File: `src/config/objectives.json`**

### Basic Objective

```json
{
  "id": "gather-wood",
  "title": "Gather Wood",
  "description": "Collect 10 wood from the forest.",
  "status": "hidden",
  "category": "main",
  "order": 5,
  "targetLocation": "1,0",
  "discoveryConditions": [
    {
      "type": "objective",
      "id": "previous-objective-id",
      "description": "Complete the previous objective"
    }
  ]
}
```

### Objective with Progress Tracking

```json
{
  "id": "craft-first-items",
  "title": "Learn the Foundry",
  "description": "Craft two items to learn the basics.",
  "status": "hidden",
  "category": "main",
  "order": 6,
  "currentProgress": 0,
  "maxProgress": 2,
  "discoveryConditions": [
    {
      "type": "objective",
      "id": "talk-to-anton-foundry"
    }
  ]
}
```

### Objective with Subtasks

```json
{
  "id": "explore-features",
  "title": "Inspect Academy Features",
  "description": "Meet the key personnel at Camp Sagora.",
  "status": "hidden",
  "category": "main",
  "order": 4,
  "subtasks": [
    { "id": "visit-foundry", "label": "Visit the Foundry", "completed": false },
    { "id": "visit-quartermaster", "label": "Visit the Quartermaster", "completed": false },
    { "id": "visit-tavern", "label": "Visit the Tavern", "completed": false }
  ],
  "discoveryConditions": [
    { "type": "objective", "id": "talk-to-headmaster" }
  ]
}
```

### Discovery Condition Types

| Type | Description |
|------|-------------|
| `objective` | Requires another objective to be completed |
| `resource` | Requires a resource threshold |
| `feature` | Requires a feature to be unlocked |
| `tile` | Requires a map tile to be explored |

---

## Creating Dialog Trees

**File: `src/content/dialog-trees/{dialog-id}.json`**

### Basic Structure

```json
{
  "id": "npc-intro",
  "characterName": "NPC Name",
  "portrait": {
    "path": "images/portraits/npc.png",
    "alt": "NPC portrait"
  },
  "onComplete": [
    { "type": "completeObjective", "objectiveId": "talk-to-npc" }
  ],
  "startNodeId": "start",
  "nodes": {
    "start": {
      "id": "start",
      "message": "Hello, traveler!",
      "responses": [
        { "text": "Hello!", "nextNodeId": "greeting" },
        { "text": "Goodbye.", "nextNodeId": null }
      ]
    },
    "greeting": {
      "id": "greeting",
      "message": "Nice to meet you!",
      "responses": [
        { "text": "Likewise.", "nextNodeId": null }
      ]
    }
  }
}
```

### onComplete Action Types

Actions execute when the dialog completes (player reaches a `nextNodeId: null` response).

| Action Type | Parameters | Description |
|-------------|------------|-------------|
| `completeObjective` | `objectiveId` | Mark an objective as complete |
| `updateSubtask` | `objectiveId`, `subtaskId` | Mark a subtask as complete |
| `exploreTile` | `coordinates` (e.g., "0,0") | Explore a world map tile |
| `showTutorial` | `tutorialId` | Queue a tutorial modal |
| `showDialogTree` | `dialogTreeId` | Queue another dialog |
| `unlockFeature` | `featureId` | Unlock a feature (entire feature card) |
| `unlockFoundryEntry` | (none) | Unlock Foundry "Enter Foundry" button |
| `unlockEditLayout` | (none) | Unlock Foundry edit layout |
| `addResource` | `resourceId`, `amount` | Add resources (TODO) |
| `setFlag` | `flagId`, `value` | Set a game state flag (TODO) |

### Example: Dialog That Unlocks a Feature

```json
{
  "id": "anton-unlock-foundry",
  "characterName": "Anton DeCassieur",
  "portrait": {
    "path": "images/portraits/smith.png",
    "alt": "Anton DeCassieur"
  },
  "onComplete": [
    { "type": "completeObjective", "objectiveId": "talk-to-anton-foundry" },
    { "type": "unlockFeature", "featureId": "academy-foundry" }
  ],
  "startNodeId": "start",
  "nodes": {
    "start": {
      "id": "start",
      "message": "The Foundry is ready for you!",
      "responses": [
        { "text": "Let's get started.", "nextNodeId": null }
      ]
    }
  }
}
```

---

## Dialog Triggers

**File: `src/config/dialog-triggers.json`**

Dialog triggers automatically show dialogs when conditions are met.

### Structure

```json
{
  "triggers": [
    {
      "id": "trigger-unique-id",
      "dialogTreeId": "dialog-to-show",
      "conditions": [
        { "type": "objective-complete", "id": "required-objective" }
      ],
      "priority": 10,
      "description": "Human-readable description"
    }
  ]
}
```

### Condition Types

| Type | Parameters | Description |
|------|------------|-------------|
| `objective-complete` | `id` | Objective is completed |
| `dialog-complete` | `id` | Dialog tree was completed |
| `craft-complete` | `value`, `operator` | Craft count matches condition |
| `resource-threshold` | `id`, `value`, `operator` | Resource amount matches |
| `location-visit` | `id` (coordinates) | Tile was visited |

### Operators for Numeric Conditions

| Operator | Meaning |
|----------|---------|
| `eq` | Equal to |
| `gte` | Greater than or equal |
| `lte` | Less than or equal |
| `gt` | Greater than |
| `lt` | Less than |

### Example: Dialog After First Craft

```json
{
  "id": "anton-efficiency-prompt",
  "dialogTreeId": "foundry-master-unlock-2-edit",
  "conditions": [
    { "type": "craft-complete", "value": 1, "operator": "eq" }
  ],
  "priority": 10,
  "description": "Anton comments on efficiency after first craft"
}
```

### Example: Dialog After Multiple Conditions

```json
{
  "id": "headmaster-foundry-ready",
  "dialogTreeId": "headmaster-foundry-ready",
  "conditions": [
    { "type": "objective-complete", "id": "explore-features" },
    { "type": "dialog-complete", "id": "foundry-master-intro" },
    { "type": "dialog-complete", "id": "quartermaster-intro" },
    { "type": "dialog-complete", "id": "tavern-keeper-intro" }
  ],
  "priority": 10,
  "description": "All conditions must be true (AND logic)"
}
```

---

## NPC Dialog Progressions

**File: `src/config/npcs/{npc-id}.ts`**

NPCs have ordered dialog progressions that show in sequence.

### Structure

```typescript
export const npcConfig: NPCConfig = {
  id: 'npc-id',
  name: 'NPC Name',
  portrait: {
    path: 'images/portraits/npc.png',
    alt: 'NPC portrait',
  },
  icon: '🔨',
  dialogProgression: [
    { id: 'npc-intro' },
    {
      id: 'npc-second-dialog',
      conditions: [
        { type: 'objectiveComplete', objectiveId: 'first-objective' },
      ],
    },
  ],
  fallbackProgression: [
    { id: 'npc-general-tips', priority: 0 },
  ],
}
```

### How It Works

1. When player clicks NPC, system finds first uncompleted dialog in `dialogProgression`
2. If dialog has `conditions`, they must be met for it to be available
3. After all progression dialogs are done, `fallbackProgression` dialogs are used
4. NPC indicator (!) shows when progression dialogs are available

### Condition Types for Progression

| Type | Parameters | Description |
|------|------------|-------------|
| `objectiveComplete` | `objectiveId` | Objective is completed |
| `dialogComplete` | `dialogId` | Dialog was completed |
| `featureState` | `featureId`, `state` | Feature is in specific state |

---

## Tutorials

**File: `src/content/tutorials/{tutorial-id}.json`**

### Structure

```json
{
  "id": "tutorial-id",
  "title": "Tutorial Title",
  "content": "Tutorial content with **markdown** support.",
  "triggerConditions": [
    {
      "type": "immediate",
      "description": "Triggered programmatically"
    }
  ],
  "showOnce": true
}
```

### Triggering Tutorials

**From dialog onComplete:**
```json
{ "type": "showTutorial", "tutorialId": "tutorial-id" }
```

**From component code:**
```typescript
const dialogsStore = useDialogsStore()
dialogsStore.showTutorial('tutorial-id')
```

---

## Feature States

Features can be locked/unlocked to gate progression.

### Setting Initial State

**File: `src/config/area-maps/{area}.ts`**

```typescript
{
  id: 'academy-foundry',
  type: 'foundry',
  state: 'locked',  // 'hidden' | 'locked' | 'unlocked'
  // ...
}
```

### Unlocking via Dialog

```json
{
  "onComplete": [
    { "type": "unlockFeature", "featureId": "academy-foundry" }
  ]
}
```

### Dynamic Button States

The `AreaMap.vue` component automatically passes feature state to `NavigationButton` components, disabling them when the feature is locked.

---

## Common Quest Patterns

### Pattern 1: Talk to NPC → Unlock Feature

1. Create objective with `discoveryConditions` based on previous objective
2. Create dialog tree with `onComplete` actions:
   - `completeObjective` for the talk objective
   - `unlockFeature` for the feature
3. Add dialog to NPC's `dialogProgression` with conditions

### Pattern 2: Complete Action N Times

1. Create objective with `maxProgress` set to target count
2. In the action handler (e.g., `produceRecipeOutputs`), call:
   ```typescript
   objectivesStore.updateProgress('objective-id', currentCount)
   ```
3. Objective auto-completes when `currentProgress >= maxProgress`

### Pattern 3: Trigger Dialog After Action

1. Add trigger to `dialog-triggers.json` with condition
2. In action handler, evaluate triggers:
   ```typescript
   import('@/composables/useDialogTriggers').then(({ useDialogTriggers }) => {
     const { evaluateTriggersForEvent } = useDialogTriggers()
     evaluateTriggersForEvent('craft-complete')
   })
   ```

### Pattern 4: Sequential NPC Dialogs

1. Add multiple entries to NPC's `dialogProgression`
2. Gate later entries with `conditions`
3. Each dialog's `onComplete` sets up conditions for the next

### Pattern 5: First-Visit Tutorials

1. Track visit state in relevant store (e.g., `hasVisitedFoundryScreen`)
2. In component's `onMounted`:
   ```typescript
   if (!store.hasVisitedScreen) {
     store.markScreenVisited()
     dialogsStore.showTutorial('intro-tutorial')
   }
   ```

---

## Architecture Reference

### Flow: Dialog → Objective → Next Quest

```
Player completes dialog
  → dialogs.ts: executeCompletionActions()
    → completeObjective action
      → objectives.ts: evaluateDiscoveryConditions()
        → Next objective becomes active
```

### Flow: Dialog → Feature Unlock

```
Player completes dialog
  → dialogs.ts: executeCompletionActions()
    → unlockFeature action
      → areaMap.ts: updateFeatureState()
        → Feature button becomes clickable
```

### Flow: Action → Dialog Trigger

```
Player action (e.g., craft)
  → Store increments counter
  → useDialogTriggers: evaluateTriggersForEvent()
    → Condition matches
      → dialogs.ts: showDialogTree()
```

---

## Key Files Reference

| Purpose | File Path |
|---------|-----------|
| Objectives | `src/config/objectives.json` |
| Dialog trees | `src/content/dialog-trees/*.json` |
| Dialog triggers | `src/config/dialog-triggers.json` |
| Tutorials | `src/content/tutorials/*.json` |
| NPC configs | `src/config/npcs/*.ts` |
| Area configs | `src/config/area-maps/*.ts` |
| Dialogs store | `src/stores/dialogs.ts` |
| Objectives store | `src/stores/objectives.ts` |
| Dialog trigger composable | `src/composables/useDialogTriggers.ts` |

---

## Adding a New Quest: Checklist

- [ ] Define objective in `objectives.json` with `discoveryConditions`
- [ ] Create dialog tree(s) in `content/dialog-trees/`
- [ ] Add `onComplete` actions to dialog tree(s)
- [ ] Add NPC dialog progression entries if needed
- [ ] Add dialog triggers to `dialog-triggers.json` if auto-triggered
- [ ] Create tutorials in `content/tutorials/` if needed
- [ ] Update feature state in area config if gating access
- [ ] Add action tracking in stores if progress-based
- [ ] Test the full quest flow
