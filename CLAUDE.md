# Idle Artifice

## CLAUDE.md

This file provides guidance and context to Claude Code (claude.ai/code) and others agents (and humans!) when working with code in this repository.

See also:
@docs/GAMEDESIGN.md - Game Design Document that describes the game overview, core gameplay loop, and overall project information

## Game concepts:

Idle Artifice is a web-based incremental game inspired by such projects as Gooboo (https://github.com/Tendsty/gooboo) and Evolve (https://github.com/pmotschmann/Evolve). The player manages their base and uses it to generate resources allowing them to explore a vast and unknown frontier.

## Coding Norms and Standards

This is a standard Vue.js project.

### Vue.js rules

- Use the Composition API with `<script setup>` for better type inference and organization
- Define props with type definitions and defaults
- Use emits for component events
- Use v-model for two-way binding
- Use computed properties for derived state
- Use watchers for side effects
- Use provide/inject for deep component communication
- Use async components for code-splitting

### Testing

- **Component Tests**: Use Vitest with @vue/test-utils for component testing
  - Test component rendering, props, events, and user interactions
  - Run with `npm test` or `npm run test:ui`
- **E2E Tests**: Use Cypress for end-to-end browser testing (to be added in future milestones)
  - Test full user flows in real browser environment
  - Use for complex multi-component interactions

### Issue Tracking

- The roadmap exists as Github Milestones and Issues.
- Milestone naming: Prefix milestone name with its number, e.g."""Milestone 1: "Set up standalone node.js server"""
- Issue naming: Prefix issue descriptive titles with "X.Y", where X is the milestone number and Y is its ordering within the milestone, e.g. "2.1 Introduce Crafting". Newer issues in a milestone get added to the end unless we choose to manually re-order them.
- Issues should have 2 labels: their milestone (in the form milestone-x) and one type descriptor from the list of existing labels, typically "feature" or "bug".

## Agent Guidance

- Ask clarifying questions when needed
- Keep prose in roadmaps, readme, and commit messages simple and to the point. Avoid puffery or self-congratulatory language.

### Issue Implementation Workflow

When starting work on a GitHub issue:
1. **Fetch the issue details** using `gh issue view <number>`
2. **Explore relevant code** to understand existing patterns and architecture
3. **Create an implementation plan** that includes:
   - Overview of the work
   - Breakdown of tasks/files to create or modify
   - Technical approach aligned with existing patterns
   - Testing considerations
4. **Ask clarifying questions** about:
   - Ambiguous requirements or multiple valid approaches
   - Integration points with existing systems
   - Scope boundaries (what's in vs out for this issue)
   - Initial data/config content preferences
   - Technical decisions that affect architecture
5. **Wait for approval** before executing the implementation
6. **Only proceed** after questions are answered and plan is confirmed

## Code Architecture

This is a Vue.js project designed to run in a web browser. See Vue.js style guides

### Key Architecture Decisions

**State Management**
- Use Pinia for application state management
- Store game state (world map, resources, explorers, etc.) in Pinia stores
- Use composables for shared logic that accesses stores

**World Map Rendering**
- SVG-based rendering for hexagonal tiles (scalable, clean click detection)
- Use existing hexagonal grid library (e.g., honeycomb-grid) for hex math and positioning
- Coordinate system determined by library choice (likely axial coordinates)
- Hexagons oriented with flat edge on top

**View Switching**
- Currently using conditional rendering for World Map ↔ Area Map transitions
- Architecture designed to support future migration to Vue Router
- Component structure should remain router-compatible (use props/emits appropriately)
- View state managed through Pinia store

## Core Components

### World Map
A hexagonal map representing the known world. Explored hexes have an icon designating what they are. Unexplored hexes adjacent to explored hexes are grayed out and only have vague descriptions of what to expect. New hexes are added to the map as more unexplored hexes are explored.

**Implementation Details:**
- SVG-based rendering for scalable graphics and precise click detection
- Flat-top hexagons with 30 viewBox unit radius
- Uses honeycomb-grid library via `useHexGrid` composable for hex math and coordinate conversion
- Data managed through Pinia `worldMapStore`
- ViewBox dimensions: 300x300 units base size
- Responsive sizing: min 750px, max 1200px width; min 750px, max 900px height

**Camera Controls:**
- Drag-to-pan functionality with mouse events
- Pan offset tracked in viewBox coordinate space
- Boundaries automatically calculated from hex tile bounding box plus 50-unit margin
- Smooth panning with proper screen-to-viewBox coordinate scaling
- Prevents panning beyond visible hex tiles

**Visual States:**
- Explored tiles: green fill (#90EE90)
- Unexplored tiles: gray fill (#CCCCCC)
- All tiles: dark gray stroke (#333333, 2px width)

### Area Map
A map representing the individual hex that can be accessed by clicking on the hex. This has features and actions specific to that area.

**Configuration-Driven Architecture:**
- Area maps are completely data-driven via TypeScript configuration files
- `AreaMap.vue` is a generic, area-agnostic component that loads configurations dynamically
- Each area type has its own config file in `/src/config/area-maps/`
- Configurations define features, layouts, triggers, and area-specific behavior

**Creating a New Area Map Configuration:**

1. **Create config file** at `/src/config/area-maps/{areaType}.ts`
2. **Import feature components** and wrap them in `markRaw()` to avoid reactivity overhead
3. **Define layout modes** (desktop, mobile, etc.) with viewBox and canvas dimensions
4. **Define features** with positions for each layout mode
5. **Define triggers** for events (onFirstVisit, onEnter, onExit, onFeatureInteract)
6. **Register config** in `/src/config/area-maps/index.ts`

**Example Configuration Structure:**
```typescript
import { markRaw } from 'vue'
import type { AreaMapConfig } from '@/types/areaMapConfig'
import FeatureComponent from '@/components/features/FeatureComponent.vue'

export const myAreaConfig: AreaMapConfig = {
  areaType: 'myarea',
  background: '#hexcolor',

  layouts: {
    desktop: {
      mode: '2x2',
      viewBoxWidth: 300,
      viewBoxHeight: 300,
      canvasWidth: 1600,
      canvasHeight: 1200,
      minWidth: 1400,
    },
    mobile: {
      mode: '1x4',
      viewBoxWidth: 300,
      viewBoxHeight: 500,
      canvasWidth: 1000,
      canvasHeight: 2000,
      maxWidth: 1399,
    },
  },

  features: [
    {
      id: 'myarea-feature',
      type: 'featuretype',
      component: markRaw(FeatureComponent),
      name: 'Feature Name',
      description: 'Feature description',
      icon: '🎯',
      positions: {
        desktop: { x: -130, y: -110 },
        mobile: { x: -60, y: -230 },
      },
      state: 'unlocked',
      isActive: false,
      interactionType: 'navigation',
    },
  ],

  triggers: [
    {
      event: 'onFirstVisit',
      description: 'Show intro dialog on first visit',
      actions: [
        { type: 'showDialogTree', dialogId: 'myarea-intro' },
        { type: 'completeObjective', objectiveId: 'visit-myarea' },
      ],
    },
    {
      event: 'onFeatureInteract',
      featureId: 'myarea-feature',
      description: 'Show feature dialog on interaction',
      callback: async (context) => {
        const { dialogs } = context.stores
        if (!dialogs.hasCompletedDialogTree('feature-intro')) {
          await dialogs.showDialogTree('feature-intro')
        }
      },
    },
  ],
}
```

**Trigger System:**

Available trigger events:
- `onFirstVisit`: Fires once on the first visit to this area
- `onEnter`: Fires every time the player enters this area
- `onExit`: Fires when the player leaves this area
- `onFeatureInteract`: Fires when a specific feature is clicked

Predefined trigger actions:
- `showDialog`: Display a simple dialog modal
- `showDialogTree`: Display a branching dialog tree
- `showTutorial`: Display a tutorial modal
- `completeObjective`: Mark an objective as complete
- `unlockObjective`: Make an objective visible
- `unlockFeature`: Unlock a feature
- `hideFeature`: Hide a feature
- `addResource`: Add resources to player inventory
- `removeResource`: Remove resources from player inventory
- `exploreTile`: Mark a world map tile as explored

For complex logic, use the `callback` field with full access to stores:
```typescript
{
  event: 'onEnter',
  callback: async (context) => {
    const { dialogs, objectives, resources, worldMap, areaMap } = context.stores
    // Custom logic here
  }
}
```

**Future Expansion:**
- Condition evaluation with AND/OR logic for complex trigger conditions
- Cross-area dependencies for unlock conditions
- More sophisticated layout modes and positioning strategies

### Features
A UI element that lives in the Area Map.

### Resources
A type of currency that can be accrued by the player.

### Magical Items
An item that can be created by combining different resources.

### Explorer
A non-playable character that can equip magical items.

### Skills
Actions that Explorers can perform based on the Magical Item they have equipped.
