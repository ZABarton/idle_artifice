# NPC System Architecture

## Overview

This document describes the NPC (Non-Player Character) system architecture for Idle Artifice. The system separates NPC identity and dialog configuration from their physical presence in the game world, enabling:

- NPCs with dynamic dialog progressions based on game state
- NPCs that can move between locations or be absent entirely
- Centralized NPC definitions referenced by multiple systems
- Dialog initiation regardless of NPC location

---

## Design Goals

1. **Separation of concerns** - NPC identity/dialogs separate from location/presence
2. **Data-driven** - Dialog progressions defined in configuration, not code
3. **Condition-based gating** - Dialogs unlock based on game state (objectives, flags, etc.)
4. **Dynamic locations** - NPCs can move, be in transit, or be unavailable
5. **Backward compatible** - Simple NPCs can use minimal configuration

---

## Architecture Components

| Component | Purpose |
|-----------|---------|
| `src/types/npc.ts` | Type definitions for NPCs, dialog progression, locations |
| `src/config/npcs/*.ts` | Individual NPC configurations |
| `src/config/npcs/index.ts` | NPC registry - lookup by ID |
| `src/stores/npcLocations.ts` | Tracks current NPC locations, handles movement |
| `src/composables/useNPCDialog.ts` | Resolves which dialog to show for an NPC |

---

## Type Definitions

### `src/types/npc.ts`

```typescript
import type { TriggerCondition } from './dialogTriggers'

/**
 * Character portrait information
 */
export interface CharacterPortrait {
  path: string
  alt: string
}

/**
 * A single dialog in a progression chain
 */
export interface DialogProgressionEntry {
  /** Dialog tree ID to show */
  id: string
  /** Conditions that must be met for this dialog to be available */
  conditions?: TriggerCondition[]
}

/**
 * A fallback dialog with priority for state-based selection
 */
export interface FallbackDialogEntry {
  /** Dialog tree ID to show */
  id: string
  /** Higher priority = shown first when conditions met (default: 0) */
  priority?: number
  /** Conditions that must be met for this fallback to be active */
  conditions?: TriggerCondition[]
}

/**
 * Complete NPC configuration
 */
export interface NPCConfig {
  /** Unique identifier for this NPC */
  id: string
  /** Display name */
  name: string
  /** Character portrait */
  portrait: CharacterPortrait
  /** Icon/emoji for compact display */
  icon: string

  /**
   * Ordered list of one-off dialogs.
   * Shows the first entry that is:
   * 1. Not yet completed
   * 2. Has all conditions met (or no conditions)
   */
  dialogProgression?: DialogProgressionEntry[]

  /**
   * Repeatable dialogs shown when no progression dialogs are available.
   * Shows the highest-priority entry whose conditions are met.
   */
  fallbackProgression?: FallbackDialogEntry[]
}

/**
 * NPC location states
 */
export type NPCLocationStatus = 'present' | 'in-transit' | 'unavailable'

export interface NPCLocationPresent {
  status: 'present'
  areaId: string
  featureId: string
}

export interface NPCLocationInTransit {
  status: 'in-transit'
  destination?: string
  arrivalTime?: number
}

export interface NPCLocationUnavailable {
  status: 'unavailable'
  reason?: string
}

export type NPCLocation = NPCLocationPresent | NPCLocationInTransit | NPCLocationUnavailable
```

---

## NPC Configuration

### Individual NPC Files

Each NPC has its own configuration file in `src/config/npcs/`.

**Example: `src/config/npcs/anton.ts`**

```typescript
import type { NPCConfig } from '@/types/npc'

export const antonConfig: NPCConfig = {
  id: 'anton',
  name: 'Anton DeCassieur',
  portrait: {
    path: 'images/portraits/smith.png',
    alt: 'Anton DeCassieur, the Foundry Master',
  },
  icon: '🔨',

  dialogProgression: [
    // No conditions - available immediately
    { id: 'foundry-master-intro' },

    // Available after player explores all features
    {
      id: 'anton-foundry-unlock',
      conditions: [
        { type: 'objective-complete', id: 'explore-features' }
      ]
    },

    // Available after world event
    {
      id: 'anton-crisis-reaction',
      conditions: [
        { type: 'flag', id: 'crisis-event-occurred' }
      ]
    },
  ],

  fallbackProgression: [
    // Shown during crisis (highest priority)
    {
      id: 'anton-crisis-tips',
      priority: 20,
      conditions: [
        { type: 'flag', id: 'crisis-event-occurred' },
        { type: 'flag', id: 'crisis-resolved', negate: true }
      ]
    },

    // Shown after crisis resolved
    {
      id: 'anton-post-crisis-tips',
      priority: 10,
      conditions: [
        { type: 'flag', id: 'crisis-resolved' }
      ]
    },

    // Default fallback (no conditions, lowest priority)
    { id: 'foundry-master-tips', priority: 0 },
  ],
}
```

### NPC Registry

**`src/config/npcs/index.ts`**

```typescript
import type { NPCConfig } from '@/types/npc'
import { antonConfig } from './anton'
import { quartermasterConfig } from './quartermaster'
import { tavernKeeperConfig } from './tavernKeeper'

const npcRegistry: Record<string, NPCConfig> = {
  'anton': antonConfig,
  'quartermaster': quartermasterConfig,
  'tavern-keeper': tavernKeeperConfig,
}

export function getNPCById(id: string): NPCConfig | undefined {
  return npcRegistry[id]
}

export function getAllNPCs(): NPCConfig[] {
  return Object.values(npcRegistry)
}

export { antonConfig, quartermasterConfig, tavernKeeperConfig }
```

---

## NPC Location Store

**`src/stores/npcLocations.ts`**

```typescript
import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { NPCLocation, NPCLocationPresent } from '@/types/npc'
import { getNPCById } from '@/config/npcs'

const STORAGE_KEY = 'idle-artifice-npc-locations'

export const useNPCLocationsStore = defineStore('npcLocations', () => {
  // NPC ID -> Location mapping
  const locations = ref<Record<string, NPCLocation>>({})

  // Initialize with default locations
  function initializeDefaultLocations(): void {
    locations.value = {
      'anton': { status: 'present', areaId: 'academy', featureId: 'academy-foundry' },
      'quartermaster': { status: 'present', areaId: 'academy', featureId: 'academy-quartermaster' },
      'tavern-keeper': { status: 'present', areaId: 'academy', featureId: 'academy-tavern' },
    }
  }

  // Get location for a specific NPC
  function getNPCLocation(npcId: string): NPCLocation | undefined {
    return locations.value[npcId]
  }

  // Check if NPC is present at a specific feature
  function isNPCAtFeature(npcId: string, featureId: string): boolean {
    const location = locations.value[npcId]
    return location?.status === 'present' && location.featureId === featureId
  }

  // Get all NPCs present at a feature
  function getNPCsAtFeature(featureId: string): string[] {
    return Object.entries(locations.value)
      .filter(([_, loc]) => loc.status === 'present' && loc.featureId === featureId)
      .map(([npcId, _]) => npcId)
  }

  // Move NPC to a new location
  function moveNPC(npcId: string, newLocation: NPCLocation): void {
    locations.value[npcId] = newLocation
    saveToLocalStorage()
  }

  // Set NPC as in-transit
  function setNPCInTransit(npcId: string, destination?: string, arrivalTime?: number): void {
    locations.value[npcId] = {
      status: 'in-transit',
      destination,
      arrivalTime,
    }
    saveToLocalStorage()
  }

  // Set NPC as unavailable
  function setNPCUnavailable(npcId: string, reason?: string): void {
    locations.value[npcId] = {
      status: 'unavailable',
      reason,
    }
    saveToLocalStorage()
  }

  // Persistence
  function saveToLocalStorage(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(locations.value))
    } catch (error) {
      console.error('Failed to save NPC locations:', error)
    }
  }

  function loadFromLocalStorage(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        locations.value = JSON.parse(stored)
      } else {
        initializeDefaultLocations()
      }
    } catch (error) {
      console.error('Failed to load NPC locations:', error)
      initializeDefaultLocations()
    }
  }

  // Initialize on store creation
  loadFromLocalStorage()

  return {
    locations: computed(() => locations.value),
    getNPCLocation,
    isNPCAtFeature,
    getNPCsAtFeature,
    moveNPC,
    setNPCInTransit,
    setNPCUnavailable,
    initializeDefaultLocations,
  }
})
```

---

## Dialog Resolution

**`src/composables/useNPCDialog.ts`**

```typescript
import { useDialogsStore } from '@/stores/dialogs'
import { getNPCById } from '@/config/npcs'
import type { NPCConfig, DialogProgressionEntry, FallbackDialogEntry } from '@/types/npc'
import type { TriggerCondition } from '@/types/dialogTriggers'

export function useNPCDialog() {
  const dialogsStore = useDialogsStore()

  /**
   * Evaluate if all conditions are met for a dialog entry
   */
  function evaluateConditions(conditions?: TriggerCondition[]): boolean {
    if (!conditions || conditions.length === 0) return true

    // Reuse existing condition evaluation from dialog triggers system
    // This should import from useDialogTriggers or a shared utility
    return conditions.every(condition => {
      // Implementation depends on existing condition evaluation system
      // See useDialogTriggers.ts for reference
      return evaluateSingleCondition(condition)
    })
  }

  /**
   * Check if an NPC has an available progression dialog (not fallback)
   * Used for UI indicators
   */
  function hasAvailableProgressionDialog(npcId: string): boolean {
    const npc = getNPCById(npcId)
    if (!npc?.dialogProgression) return false

    return npc.dialogProgression.some(
      entry => !dialogsStore.hasCompletedDialogTree(entry.id) && evaluateConditions(entry.conditions)
    )
  }

  /**
   * Get the next available dialog for an NPC
   * Returns progression dialog if available, otherwise best fallback
   */
  function getNextDialogForNPC(npcId: string): string | null {
    const npc = getNPCById(npcId)
    if (!npc) {
      console.warn(`NPC not found: ${npcId}`)
      return null
    }

    // First, check for uncompleted progression dialogs with met conditions
    if (npc.dialogProgression) {
      const nextProgression = npc.dialogProgression.find(
        entry => !dialogsStore.hasCompletedDialogTree(entry.id) && evaluateConditions(entry.conditions)
      )
      if (nextProgression) {
        return nextProgression.id
      }
    }

    // Otherwise, find highest-priority fallback with met conditions
    if (npc.fallbackProgression) {
      const availableFallbacks = npc.fallbackProgression
        .filter(entry => evaluateConditions(entry.conditions))
        .sort((a, b) => (b.priority || 0) - (a.priority || 0))

      if (availableFallbacks.length > 0) {
        return availableFallbacks[0].id
      }
    }

    return null
  }

  /**
   * Initiate dialog with an NPC
   * Automatically selects the appropriate dialog based on game state
   */
  async function initiateNPCDialog(npcId: string): Promise<boolean> {
    const dialogId = getNextDialogForNPC(npcId)

    if (!dialogId) {
      console.warn(`No dialog available for NPC: ${npcId}`)
      return false
    }

    await dialogsStore.showDialogTree(dialogId)
    return true
  }

  return {
    hasAvailableProgressionDialog,
    getNextDialogForNPC,
    initiateNPCDialog,
    evaluateConditions,
  }
}
```

---

## Area Map Integration

### Updated Feature Configuration

Area map configs now reference NPC IDs instead of embedding full NPC configurations.

**`src/config/area-maps/academy.ts`** (updated pattern)

```typescript
features: [
  {
    id: 'academy-foundry',
    type: 'foundry',
    component: markRaw(FoundryFeature),
    name: 'Foundry',
    description: 'Craft magical items for your explorers',
    icon: '🔨',
    positions: { /* ... */ },
    state: 'locked',
    isActive: false,
    interactionType: 'navigation',

    // Reference NPC IDs instead of full configs
    npcIds: ['anton'],
  },
  {
    id: 'academy-quartermaster',
    // ...
    npcIds: ['quartermaster'],
  },
  {
    id: 'academy-tavern',
    // ...
    npcIds: ['tavern-keeper'],
  },
]
```

### AreaMap.vue Updates

The AreaMap component needs to:

1. Look up NPC configs from the registry
2. Filter to NPCs actually present at the feature (via npcLocations store)
3. Display indicators for available progression dialogs

```typescript
import { getNPCById } from '@/config/npcs'
import { useNPCLocationsStore } from '@/stores/npcLocations'
import { useNPCDialog } from '@/composables/useNPCDialog'

const npcLocationsStore = useNPCLocationsStore()
const { hasAvailableProgressionDialog, initiateNPCDialog } = useNPCDialog()

// Get NPCs that are configured for AND present at a feature
const getNPCsForFeature = (feature: Feature): NPCConfig[] => {
  const configuredIds = feature.npcIds || []
  return configuredIds
    .filter(id => npcLocationsStore.isNPCAtFeature(id, feature.id))
    .map(id => getNPCById(id))
    .filter((npc): npc is NPCConfig => npc !== undefined)
}

// Handle NPC click
const handleNPCClick = async (npcId: string) => {
  await initiateNPCDialog(npcId)
}
```

---

## UI Display

### NPC Presence in Feature Cards

Feature cards (minimized and expanded) should display:

1. Icons/avatars for NPCs currently present
2. A special indicator (badge/glow) if the NPC has an available progression dialog

**Visual Example:**

```
┌─────────────────────────────┐
│ 🔨 Foundry                  │
│ Crafting available ✓        │
│                             │
│ [🔨 Anton (!)]   ← ! = has new dialog
│                             │
│ [Enter Foundry]             │
└─────────────────────────────┘
```

**No indicator when only fallback available:**

```
┌─────────────────────────────┐
│ 🔨 Foundry                  │
│ Crafting available ✓        │
│                             │
│ [🔨 Anton]       ← no indicator
│                             │
│ [Enter Foundry]             │
└─────────────────────────────┘
```

### NPCIndicator Component Updates

```typescript
interface NPCIndicatorProps {
  npcId: string
  showNewDialogBadge?: boolean  // Computed from hasAvailableProgressionDialog
}
```

---

## Migration from Current System

### Current Pattern (to be deprecated)

NPCs are currently defined inline in area map configs:

```typescript
// OLD PATTERN - academy.ts
npcs: [
  {
    id: 'foundry-master',
    name: 'Anton DeCassieur',
    portrait: { /* ... */ },
    dialogTreeId: 'foundry-master-intro',
    fallbackDialogTreeId: 'foundry-master-tips',
    icon: '🔨',
  },
],
```

### Migration Steps

1. Create NPC config files in `src/config/npcs/`
2. Update types in `src/types/npc.ts`
3. Create NPC registry in `src/config/npcs/index.ts`
4. Create `useNPCLocationsStore`
5. Create `useNPCDialog` composable
6. Update area map configs to use `npcIds` array
7. Update `AreaMap.vue` to use new NPC lookup system
8. Update feature components that handle NPC clicks
9. Update `NPCIndicator` component for new badge logic

### Backward Compatibility

During migration, support both patterns:

```typescript
const getNPCsForFeature = (feature: Feature): NPCConfig[] => {
  // New pattern: lookup by ID
  if (feature.npcIds) {
    return feature.npcIds
      .filter(id => npcLocationsStore.isNPCAtFeature(id, feature.id))
      .map(id => getNPCById(id))
      .filter((npc): npc is NPCConfig => npc !== undefined)
  }

  // Old pattern: inline npcs array (deprecated)
  if (feature.npcs) {
    return feature.npcs.map(oldNpc => convertLegacyNPC(oldNpc))
  }

  return []
}
```

---

## Testing Checklist

- [ ] NPC configs load correctly from registry
- [ ] Dialog progression shows first uncompleted dialog with met conditions
- [ ] Dialog progression skips dialogs with unmet conditions
- [ ] Fallback progression shows highest-priority dialog with met conditions
- [ ] `hasAvailableProgressionDialog` returns true only for progression dialogs
- [ ] NPC location tracking persists across page refresh
- [ ] NPCs only appear at features where they are present
- [ ] NPC movement updates location store correctly
- [ ] In-transit NPCs don't appear at any feature
- [ ] UI indicator shows for available progression dialogs
- [ ] UI indicator does not show for fallback-only state
- [ ] Clicking NPC initiates correct dialog
- [ ] Dialog completion updates progression state

---

## Future Considerations

- **NPC schedules**: NPCs that move on a schedule (e.g., Anton visits tavern in evenings)
- **NPC quests**: NPCs that give quests or have quest-related dialogs
- **NPC relationships**: Tracking player relationships with NPCs
- **NPC groups**: Multiple NPCs at same location interacting together
