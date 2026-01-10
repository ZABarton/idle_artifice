# Display Components Library

Shared, reusable display components for feature minimized/expanded views. These components are purely presentational and designed to be configured via feature configs.

## Design Principles

- **Presentational Only**: Components do not handle business logic or emit events
- **Props-Based**: All configuration is done through props
- **Responsive**: Components scale from compact (6px base) to standard (0.875rem) sizes
- **Consistent Styling**: Follows existing color scheme (blues, greens, grays)
- **Small & Focused**: Each component has a single, clear purpose

## Components

### TimerDisplay

Shows progress bars and countdown timers for resource generation or timed events.

**Props:**
- `label?: string` - Label text to display above the progress bar
- `current: number` - Current progress value (required)
- `max: number` - Maximum progress value (required)
- `mode?: 'progress' | 'countdown'` - Display mode (default: 'progress')
  - `'progress'`: Shows percentage completion
  - `'countdown'`: Shows time remaining in minutes/seconds
- `showValues?: boolean` - Show numeric values alongside the bar (default: true)

**Usage:**
```vue
<script setup lang="ts">
import TimerDisplay from '@/components/displays/TimerDisplay.vue'
</script>

<template>
  <!-- Progress bar showing resource generation -->
  <TimerDisplay
    label="Iron Mining"
    :current="45"
    :max="100"
    mode="progress"
  />

  <!-- Countdown timer showing time remaining -->
  <TimerDisplay
    label="Crafting Complete In"
    :current="30"
    :max="120"
    mode="countdown"
  />
</template>
```

**Notes:**
- Timer logic should be handled by parent components or stores
- For offline progression, calculate elapsed time in stores and pass updated values as props
- Progress bar color changes based on completion: orange (0-49%), blue (50-99%), green (100%)

---

### NPCIndicator

Shows NPC conversation availability for feature minimized views.

**Props:**
- `npcName: string` - Name of the NPC (required)
- `icon?: string` - Icon or emoji to represent the NPC (default: '💬')
- `hasAvailableConversation?: boolean` - Whether a conversation is available (default: false)
- `showBadge?: boolean` - Whether to show a notification badge (default: false)
- `badgeText?: string` - Badge text (default: '!')

**Usage:**
```vue
<script setup lang="ts">
import NPCIndicator from '@/components/displays/NPCIndicator.vue'
</script>

<template>
  <!-- NPC with available conversation -->
  <NPCIndicator
    npc-name="Quartermaster Jones"
    icon="🧙"
    :has-available-conversation="true"
    :show-badge="true"
  />

  <!-- NPC without available conversation -->
  <NPCIndicator
    npc-name="Blacksmith"
    icon="⚒️"
    :has-available-conversation="false"
  />
</template>
```

**Notes:**
- Parent components should wrap this in a clickable container to handle dialog initiation
- Background highlights when conversation is available (light blue tint)
- Badge appears in top-right corner of icon when shown

---

### QuestBadge

Visual badge for quest objectives to draw attention to features tied to active quests.

**Props:**
- `text?: string` - Badge text (e.g., "Quest", "!" or a count like "2")
- `icon?: string` - Icon to display (default: '🎯')
- `variant?: 'primary' | 'success' | 'warning' | 'info'` - Color variant (default: 'primary')
  - `'primary'`: Blue (#4a90e2)
  - `'success'`: Green (#4caf50)
  - `'warning'`: Orange (#ffa726)
  - `'info'`: Light blue (#29b6f6)
- `pulse?: boolean` - Show pulse animation to draw attention (default: true)

**Usage:**
```vue
<script setup lang="ts">
import QuestBadge from '@/components/displays/QuestBadge.vue'
</script>

<template>
  <!-- Simple quest indicator -->
  <QuestBadge />

  <!-- Quest with custom text -->
  <QuestBadge text="New Quest" variant="success" />

  <!-- Multiple objectives indicator -->
  <QuestBadge text="3" icon="📋" variant="warning" />

  <!-- No pulse animation -->
  <QuestBadge :pulse="false" />
</template>
```

**Notes:**
- Designed to be overlaid on feature cards in minimized view
- Pulse animation draws attention without being distracting
- Small and compact to avoid obscuring feature content

---

### RequirementList

Displays unlock/completion requirements with status indicators.

**Props:**
- `requirements: Requirement[]` - Array of requirements (required)
  - `Requirement` interface:
    ```typescript
    interface Requirement {
      id: string
      description: string
      completed: boolean
      progress?: string // e.g., "2/5 items collected"
    }
    ```
- `title?: string` - Title for the requirements section (default: 'Requirements:')
- `showProgress?: boolean` - Show progress indicators when available (default: true)

**Usage:**
```vue
<script setup lang="ts">
import RequirementList from '@/components/displays/RequirementList.vue'
import type { Requirement } from '@/components/displays/RequirementList.vue'

const requirements: Requirement[] = [
  {
    id: 'foundry-unlocked',
    description: 'Unlock the Foundry',
    completed: true,
  },
  {
    id: 'wood-collected',
    description: 'Collect 100 wood',
    completed: false,
    progress: '45/100',
  },
  {
    id: 'talk-to-quartermaster',
    description: 'Talk to Quartermaster',
    completed: false,
  },
]
</script>

<template>
  <RequirementList
    :requirements="requirements"
    title="Quest Requirements:"
  />
</template>
```

**Notes:**
- Completed requirements show green checkmark and strikethrough text
- Incomplete requirements show red cross
- Progress indicators (when provided) appear in blue on the right
- Can be used in locked feature cards or quest objective displays

---

### StatusText

Generic text status display with color variants and optional icons.

**Props:**
- `text: string` - Status text to display (required)
- `variant?: 'info' | 'success' | 'warning' | 'error' | 'neutral'` - Visual variant (default: 'neutral')
  - `'info'`: Blue text on light blue background
  - `'success'`: Green text on light green background
  - `'warning'`: Orange text on light orange background
  - `'error'`: Red text on light red background
  - `'neutral'`: Gray text, no background
- `icon?: string` - Optional icon to display before text
- `size?: 'small' | 'medium' | 'large'` - Text size variant (default: 'medium')
- `bold?: boolean` - Whether to bold the text (default: false)

**Usage:**
```vue
<script setup lang="ts">
import StatusText from '@/components/displays/StatusText.vue'
</script>

<template>
  <!-- Simple neutral status -->
  <StatusText text="Ready to craft" />

  <!-- Success message with icon -->
  <StatusText
    text="Quest completed!"
    variant="success"
    icon="✓"
    :bold="true"
  />

  <!-- Warning message -->
  <StatusText
    text="Low on resources"
    variant="warning"
    icon="⚠️"
  />

  <!-- Error message -->
  <StatusText
    text="Cannot craft: missing ingredients"
    variant="error"
    size="small"
  />
</template>
```

**Notes:**
- Most versatile component - use for any simple text status
- Neutral variant has no background (transparent)
- All other variants have colored background for emphasis
- Automatically wraps long text

---

## Integration with Feature Configs

These components are designed to be used declaratively in feature configurations. For example:

```typescript
import { markRaw } from 'vue'
import TimerDisplay from '@/components/displays/TimerDisplay.vue'
import NPCIndicator from '@/components/displays/NPCIndicator.vue'
import type { FeatureConfig } from '@/types/areaMapConfig'

export const myFeature: FeatureConfig = {
  id: 'workshop',
  type: 'workshop',
  // ... other feature properties ...

  // In future implementations (issue 7.5), minimized displays will be configured like:
  minimizedDisplays: [
    {
      component: markRaw(TimerDisplay),
      props: {
        label: 'Crafting Progress',
        current: 45,
        max: 100,
        mode: 'progress',
      },
    },
    {
      component: markRaw(NPCIndicator),
      props: {
        npcName: 'Master Craftsman',
        hasAvailableConversation: true,
      },
    },
  ],
}
```

## Styling Notes

- **Base Font Size**: Components use 6px base size for compact views, scaling to 0.875rem (14px) on larger screens
- **Color Scheme**:
  - Primary blue: `#4a90e2`
  - Success green: `#4caf50`
  - Warning orange: `#ffa726`
  - Error red: `#f44336` / `#c62828`
  - Neutral gray: `#666666`
- **Responsive Breakpoint**: 769px (components scale up on desktop)
- **Font**: `system-ui, -apple-system, sans-serif`

## Testing

Test files should be created for each component following the pattern:
- `TimerDisplay.test.ts`
- `NPCIndicator.test.ts`
- `QuestBadge.test.ts`
- `RequirementList.test.ts`
- `StatusText.test.ts`

Use Vitest with `@vue/test-utils` for component testing.
