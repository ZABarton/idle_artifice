# Milestone 3: Global Status Column and Questing - Implementation Plan

## Overview
This milestone introduces a persistent Status Column on the left side of the browser that displays critical game information across all views (World Map, Area Map, Feature screens). The column includes the current objective, resources, navigation shortcuts, and system controls.

## Key Features

### 1. Status Column Component
**Location**: Always visible on the left side of the screen
**Behavior**:
- Collapsible with toggle button for responsive/mobile layouts
- Persists across all navigation states (World Map, Area Map, Feature screens)
- Fixed width on desktop (~250-300px), responsive on smaller screens

**Sections** (top to bottom):
1. **Current Objective Display** (prominent)
   - Shows currently tracked objective with title and description
   - Displays progress for multi-step objectives (e.g., "Step 2 of 5", "3/10 items crafted")
   - Click to navigate to Objectives View

2. **Resources Section**
   - Lists all available resources with current amounts
   - Format: "Resource Name: Amount" (e.g., "Wood: 100", "Stone: 50")
   - Auto-updates when resources change

3. **Quick Navigation Section**
   - World Map link (always available)
   - Current Location indicator/link
   - Recent Locations list (last 3-5 visited hexes)

4. **System Links Section** (bottom)
   - Settings button (placeholder for now)
   - Save Game button (placeholder for now)
   - Debug Panel toggle (shows/hides existing PiniaDebugTable)

### 2. Resource System
**New Pinia Store**: `src/stores/resources.ts`

**Resource Data Structure**:
```typescript
interface Resource {
  id: string           // Unique identifier (e.g., 'wood', 'stone')
  name: string         // Display name
  amount: number       // Current amount
  icon?: string        // Optional icon/emoji
  category?: string    // Optional category for grouping
}
```

**Store Features**:
- Track all game resources in centralized store
- Methods to add/remove/set resource amounts
- Computed properties for resource queries
- Integration with Features for resource consumption/production

**Initial Resources** (for testing):
- Wood
- Stone
- Iron
- Gold
- Mystical Essence

### 3. Objectives System
**New Pinia Store**: `src/stores/objectives.ts`

**Design Philosophy**: All objectives are pre-defined by the game designer in config files. Objectives can be revealed and unlocked based on game events (completing other quests, collecting resources, visiting locations, etc.), but they are never generated dynamically.

**Objective Data Structure**:
```typescript
interface ObjectiveSubtask {
  id: string
  description: string
  completed: boolean
}

interface UnlockCondition {
  type: 'objective' | 'resource' | 'location' | 'feature' | 'custom'
  id: string           // ID of the objective/resource/location/feature
  value?: number       // Optional: for resource amounts, quest counts, etc.
  description: string  // Human-readable condition
}

interface Objective {
  id: string
  title: string
  description: string
  status: 'hidden' | 'active' | 'completed'
  category: 'main' | 'secondary'  // Main = narrative progression, Secondary = optional/helpful

  // Progress tracking (multi-step)
  subtasks?: ObjectiveSubtask[]
  currentProgress?: number
  maxProgress?: number

  // Discovery conditions (evaluated to reveal objective)
  // Once revealed, objective is immediately available to work on
  discoveryConditions?: UnlockCondition[]

  // Metadata
  order: number        // Display order within category
  completedAt?: Date
}
```

**Store Features**:
- Load all objectives from config file on initialization
- Track all objectives (hidden, active, completed)
- Get currently tracked objective
- Set tracked objective
- Update progress on objectives and subtasks
- Mark objectives complete (with timestamp)
- Evaluate discovery conditions to reveal hidden objectives
- Query objectives by status (only returns active/completed, not hidden)
- Query objectives by category ('main' or 'secondary')
- Get ordered list of objectives (Main first, then Secondary, ordered within each category)

**Objective Config**: `src/config/objectives.json`
- All objectives pre-defined here
- Includes discovery conditions for event-triggered objectives
- Loaded on game initialization

### 4. Objectives View (Separate Screen)
**New Component**: `src/views/ObjectivesView.vue`

**Layout**:
- Full-screen view (similar to Area Map)
- Back button to return to previous view
- Divided into sections based on status and category:
  - **Active Objectives**:
    - Main Objectives (narrative progression) listed first
    - Secondary Objectives (optional/helpful) listed after
  - **Completed Objectives**:
    - Main Objectives listed first
    - Secondary Objectives listed after
    - All show completion timestamps
- **Note**: Hidden objectives are not displayed at all until their discovery conditions are met

**Features**:
- Click objective to set as tracked (shown in Status Column)
- Visual indicator for currently tracked objective
- Show progress bars/subtasks for multi-step objectives
- Clear visual distinction between Main and Secondary objectives (e.g., headers, styling)
- Filter/search capabilities (optional for this milestone)

### 5. Objective Completion Celebration
**New Component**: `src/components/NotificationContainer.vue`

**Behavior**:
- Generic notification system for all notification types (success, info, warning, error)
- Brief animation/toast notification when objective completes
- Auto-dismisses after 3-5 seconds
- Auto-switches to next main objective when tracked objective completes (enhances UX)
- Simple, non-intrusive design

### 6. Navigation Store Updates
**Update**: `src/stores/navigation.ts`

**New Features**:
- Add 'objectives-view' to ViewType
- Track navigation history (recent locations)
- Methods to navigate to Objectives View
- Store last 5 visited hex coordinates for Recent Locations

### 7. Layout Updates
**Update**: `src/views/MainView.vue`

**Changes**:
- Refactor layout to include Status Column on left
- Grid layout: `[Status Column | Main Content Area]`
- Status Column always rendered, main area switches between World Map/Area Map/Objectives View
- Handle Status Column collapse state
- Responsive breakpoints for mobile

### 8. Type Definitions
**New File**: `src/types/objectives.ts`
- Objective interface
- ObjectiveSubtask interface
- ObjectiveStatus type ('hidden' | 'active' | 'completed')
- ObjectiveCategory type ('main' | 'secondary')
- UnlockCondition interface

**New File**: `src/types/resources.ts`
- Resource interface
- ResourceCategory type (if needed)

## Implementation Order

### Phase 1: Core Infrastructure
1. Create type definitions (objectives.ts, resources.ts)
2. Create resource store with basic CRUD operations
3. Create objectives store with basic CRUD operations
4. Create initial objectives config file

### Phase 2: Status Column
5. Create StatusColumn.vue component with all sections
6. Create collapsible behavior with toggle button
7. Integrate with navigation store for current/recent locations
8. Connect to resource store for resource display
9. Connect to objectives store for current objective display

### Phase 3: Objectives Management
10. Create ObjectivesView.vue component
11. Update navigation store with objectives view support
12. Implement objective selection/tracking logic
13. Create NotificationContainer.vue component
14. Wire up completion celebration logic

### Phase 4: Integration & Polish
15. Update MainView.vue layout to include Status Column
16. Test Status Column persistence across all views
17. Implement responsive behavior and mobile support
18. Update placeholder system links (Settings, Save)
19. Connect Debug Panel toggle to existing PiniaDebugTable

### Phase 5: Testing
20. Write tests for resource store
21. Write tests for objectives store
22. Write component tests for StatusColumn.vue
23. Write component tests for ObjectivesView.vue
24. Manual testing of full flow

## Technical Considerations

### State Persistence
- Resources and objectives should eventually persist to localStorage
- For this milestone, in-memory only is acceptable
- Design stores with persistence in mind for future implementation

### Responsive Design
- Status Column: 250px on desktop, 200px on tablet, collapsible on mobile
- Breakpoints: 1024px (tablet), 768px (mobile)
- Touch-friendly toggle button for mobile
- Consider slide-out drawer pattern for mobile

### Performance
- Resource updates should be reactive but not cause unnecessary re-renders
- Objective progress updates should batch if possible
- Navigation history limited to 5 recent locations

### Integration Points
- Features will need to trigger resource changes (connect in future milestones)
- Features will need to update objective progress (connect in future milestones)
- For this milestone, manual triggers via Debug Panel are acceptable

## Out of Scope (Future Milestones)
- Actual Settings functionality (just placeholder link)
- Actual Save/Load functionality (just placeholder link)
- Resource production/consumption from Features (manual for testing only)
- Automatic objective completion/discovery based on game events (manual for testing only)
- Tutorial objectives tied to actual gameplay (static list for now)
- Dynamic objective generation (all objectives are pre-defined in config)
- "Locked" objective state (objectives are either hidden or available)

## Success Criteria
- [ ] Status Column visible on all views (World Map, Area Map, Feature screens)
- [ ] Status Column collapsible with smooth toggle animation
- [ ] Current objective displayed prominently with progress
- [ ] All resources displayed and update reactively
- [ ] Quick navigation links work correctly
- [ ] Recent locations populate as user navigates
- [ ] Debug Panel toggle shows/hides PiniaDebugTable
- [ ] Clicking objective navigates to Objectives View
- [ ] Objectives View shows all objectives categorized by status
- [ ] Can select objective to track in Status Column
- [ ] Objective completion shows celebration notification
- [ ] Completed objective remains displayed until user selects new one
- [ ] Responsive behavior works on mobile/tablet
- [ ] All components have proper TypeScript types
- [ ] Core functionality has test coverage
